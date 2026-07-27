const app = getApp();
const storage = require('../../utils/storage.js');
const imageUtil = require('../../utils/image.js');
const validate = require('../../utils/validate.js');
const scheduleUtil = require('../../utils/schedule.js');
const { generateId, now, formatDate } = require('../../utils/uuid.js');

Page({
  data: {
    isEdit: false,
    knowledgeId: '',
    title: '',
    content: '',
    images: [],
    categoryId: null,
    categories: [],
    showCategoryPicker: false,
    selectedCategoryName: '未分类',
    selectedCategoryIcon: '📦',
    studyDate: '',
    saving: false,
    titleError: false,
  },

  onLoad(options) {
    const categories = app.globalData.categories;
    this.setData({
      categories,
      studyDate: formatDate(now()),
    });

    if (options.id) {
      this.loadKnowledge(options.id);
    }
  },

  onShow() {
    // 刷新分类列表
    this.setData({ categories: app.globalData.categories });
  },

  loadKnowledge(id) {
    const knowledge = storage.getKnowledge(id);
    if (!knowledge) {
      wx.showToast({ title: '知识点不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    const category = knowledge.categoryId ?
      app.globalData.categories.find(c => c.id === knowledge.categoryId) : null;

    this.setData({
      isEdit: true,
      knowledgeId: id,
      title: knowledge.title,
      content: knowledge.content || '',
      images: knowledge.images || [],
      categoryId: knowledge.categoryId,
      selectedCategoryName: category ? category.name : '未分类',
      selectedCategoryIcon: category ? category.icon : '📦',
      studyDate: formatDate(knowledge.createdAt),
    });
  },

  onTitleInput(e) {
    this.setData({
      title: e.detail.value,
      titleError: false,
    });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onImagesChange(e) {
    this.setData({ images: e.detail.images });
  },

  onShowCategoryPicker() {
    this.setData({ showCategoryPicker: true });
  },

  onHideCategoryPicker() {
    this.setData({ showCategoryPicker: false });
  },

  onSelectCategory(e) {
    const { id } = e.currentTarget.dataset;
    if (id === '') {
      this.setData({
        categoryId: null,
        selectedCategoryName: '未分类',
        selectedCategoryIcon: '📦',
        showCategoryPicker: false,
      });
    } else {
      const category = app.globalData.categories.find(c => c.id === id);
      this.setData({
        categoryId: id,
        selectedCategoryName: category ? category.name : '未分类',
        selectedCategoryIcon: category ? category.icon : '📦',
        showCategoryPicker: false,
      });
    }
  },

  onDateChange(e) {
    this.setData({ studyDate: e.detail.value });
  },

  /**
   * 选择图片
   */
  async onChooseImage() {
    const remaining = 9 - this.data.images.length;
    if (remaining <= 0) {
      wx.showToast({ title: '最多添加 9 张图片', icon: 'none' });
      return;
    }

    try {
      wx.showLoading({ title: '处理中...' });
      const tempPaths = await imageUtil.chooseImages(remaining);

      // 压缩图片
      const compressedPaths = [];
      for (const path of tempPaths) {
        const compressed = await imageUtil.compressImage(path);
        compressedPaths.push(compressed);
      }

      this.setData({
        images: [...this.data.images, ...compressedPaths],
      });

      wx.hideLoading();
      wx.showToast({ title: `已添加 ${compressedPaths.length} 张`, icon: 'success' });
    } catch (e) {
      wx.hideLoading();
      console.error('Choose image failed:', e);
    }
  },

  /**
   * 移除图片
   */
  onRemoveImage(e) {
    const { index } = e.currentTarget.dataset;
    const images = this.data.images.filter((_, i) => i !== index);
    this.setData({ images });
  },

  /**
   * 保存
   */
  async onSave() {
    if (this.data.saving) return;

    // 构建知识点对象
    const knowledge = {
      title: this.data.title.trim(),
      content: this.data.content.trim(),
      images: this.data.images,
      categoryId: this.data.categoryId,
      createdAt: new Date(this.data.studyDate + 'T00:00:00').toISOString(),
    };

    // 验证
    const result = validate.validateKnowledge(knowledge);
    if (!result.valid) {
      wx.showToast({ title: result.message, icon: 'none' });
      if (!knowledge.title) {
        this.setData({ titleError: true });
      }
      return;
    }

    this.setData({ saving: true });

    try {
      wx.showLoading({ title: '保存中...' });

      if (this.data.isEdit) {
        // 编辑模式
        const existing = storage.getKnowledge(this.data.knowledgeId);
        knowledge.id = this.data.knowledgeId;
        knowledge.status = existing.status;
        knowledge.updatedAt = now();

        // 处理图片：删除已移除的图片
        const oldImages = existing.images || [];
        const newImages = this.data.images;
        const toDelete = oldImages.filter(img => !newImages.includes(img));
        toDelete.forEach(img => imageUtil.deleteImage(img));

        // 如果学习日期变更，重新计算复习计划
        if (existing.createdAt !== knowledge.createdAt) {
          storage.deleteSchedulesByKnowledge(knowledge.id);
          const newSchedules = scheduleUtil.generateSchedule(
            knowledge.id,
            knowledge.title,
            knowledge.createdAt
          );
          storage.saveSchedules(newSchedules);
        }

        storage.saveKnowledge(knowledge);
      } else {
        // 新建模式
        knowledge.id = generateId('kp');
        knowledge.status = 'active';
        knowledge.createdAt = new Date(this.data.studyDate + 'T00:00:00').toISOString();
        knowledge.updatedAt = now();

        // 保存图片到正式目录
        const savedImages = imageUtil.saveImages(knowledge.id, this.data.images);
        knowledge.images = savedImages;

        storage.saveKnowledge(knowledge);

        // 生成复习计划
        const schedules = scheduleUtil.generateSchedule(
          knowledge.id,
          knowledge.title,
          knowledge.createdAt
        );
        storage.saveSchedules(schedules);
      }

      wx.hideLoading();
      wx.showToast({
        title: this.data.isEdit ? '修改成功' : '录入成功',
        icon: 'success',
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1200);
    } catch (e) {
      wx.hideLoading();
      console.error('Save failed:', e);
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
      this.setData({ saving: false });
    }
  },
});
