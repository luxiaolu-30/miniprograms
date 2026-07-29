/**
 * 录入/编辑知识点页面
 *
 * 页面功能：
 * - 录入新知识点（标题、内容、图片、分类、学习日期）
 * - 编辑已有知识点
 * - 自动生成复习计划（+1/+3/+7/+14/+29/+59 天）
 * - 图片选择和压缩
 *
 * 生命周期：
 * - onLoad: 初始化分类列表和学习日期；如果传入 id 则加载知识点进入编辑模式
 * - onShow: 刷新分类列表（从分类管理页返回时同步最新数据）
 *
 * 数据字段（data）：
 * - isEdit: 是否为编辑模式
 * - knowledgeId: 编辑模式下的知识点ID
 * - title/content: 标题和内容
 * - images: 图片路径数组（最多9张）
 * - categoryId: 分类ID
 * - categories: 全部分类列表
 * - showCategoryPicker/selectedCategoryName/selectedCategoryIcon: 分类选择器状态
 * - studyDate: 学习日期 'YYYY-MM-DD'
 * - saving: 保存中状态（防重复提交）
 * - titleError: 标题校验错误状态
 *
 * 路由参数（options）：
 * - options.id: 知识点ID，传入则进入编辑模式
 */

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

  /**
   * 页面加载
   * @param {Object} options - 路由参数，options.id 为知识点ID（编辑模式）
   */
  onLoad(options) {
    const categories = app.globalData.categories;
    this.setData({
      categories,
      studyDate: formatDate(now()),
    });

    // 如果传入 id，进入编辑模式加载知识点详情
    if (options.id) {
      this.loadKnowledge(options.id);
    }
  },

  /**
   * 页面展示时刷新分类列表（确保与分类管理页同步）
   */
  onShow() {
    this.setData({ categories: app.globalData.categories });
  },

  /**
   * 加载知识点详情（编辑模式）
   * @param {string} id - 知识点ID
   */
  loadKnowledge(id) {
    const knowledge = storage.getKnowledge(id);
    if (!knowledge) {
      wx.showToast({ title: '知识点不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    // 查找所属分类信息
    const category = knowledge.categoryId ?
      app.globalData.categories.find(c => c.id === knowledge.categoryId) : null;

    // 填充表单数据
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

  /**
   * 标题输入事件
   * @param {Object} e - 事件对象，e.detail.value 为输入值
   */
  onTitleInput(e) {
    this.setData({
      title: e.detail.value,
      titleError: false, // 输入时清除错误状态
    });
  },

  /**
   * 内容输入事件
   * @param {Object} e - 事件对象，e.detail.value 为输入值
   */
  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  /**
   * 图片变更事件（由图片组件触发）
   * @param {Object} e - 事件对象，e.detail.images 为图片路径数组
   */
  onImagesChange(e) {
    this.setData({ images: e.detail.images });
  },

  /**
   * 显示分类选择器
   */
  onShowCategoryPicker() {
    this.setData({ showCategoryPicker: true });
  },

  /**
   * 隐藏分类选择器
   */
  onHideCategoryPicker() {
    this.setData({ showCategoryPicker: false });
  },

  /**
   * 选择分类
   * @param {Object} e - 事件对象，e.currentTarget.dataset.id 为分类ID（空字符串表示未分类）
   */
  onSelectCategory(e) {
    const { id } = e.currentTarget.dataset;
    if (id === '') {
      // 选择"未分类"
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

  /**
   * 学习日期变更事件
   * @param {Object} e - 事件对象，e.detail.value 为日期字符串 'YYYY-MM-DD'
   */
  onDateChange(e) {
    this.setData({ studyDate: e.detail.value });
  },

  /**
   * 选择图片（最多9张）
   * @description 从相册或相机选择图片，自动压缩后添加到列表
   */
  async onChooseImage() {
    const remaining = 9 - this.data.images.length;
    if (remaining <= 0) {
      wx.showToast({ title: '最多添加 9 张图片', icon: 'none' });
      return;
    }

    try {
      wx.showLoading({ title: '处理中...' });
      // 调用微信 API 选择图片
      const tempPaths = await imageUtil.chooseImages(remaining);

      // 逐张压缩图片，减少存储占用
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
      // 🔧 修复：区分用户取消和真实错误，取消时不显示错误提示
      const errMsg = (e && e.errMsg) ? e.errMsg : '';
      if (errMsg.includes('cancel')) {
        // 用户主动取消选图，静默处理
        return;
      }
      wx.showToast({ title: '选择图片失败，请重试', icon: 'none' });
    }
  },

  /**
   * 移除指定位置的图片
   * @param {Object} e - 事件对象，e.currentTarget.dataset.index 为图片索引
   */
  onRemoveImage(e) {
    const { index } = e.currentTarget.dataset;
    const images = this.data.images.filter((_, i) => i !== index);
    this.setData({ images });
  },

  /**
   * 保存知识点
   * @description 验证表单数据，新建或更新知识点，生成复习计划
   *              新建时：生成ID、保存图片到正式目录、生成复习计划
   *              编辑时：保留状态、处理图片变更、学习日期变更时重新计算复习计划
   */
  async onSave() {
    // 防重复提交
    if (this.data.saving) return;

    // 构建知识点对象
    const knowledge = {
      title: this.data.title.trim(),
      content: this.data.content.trim(),
      images: this.data.images,
      categoryId: this.data.categoryId,
      createdAt: new Date(this.data.studyDate + 'T00:00:00').toISOString(),
    };

    // 验证表单数据
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
        // ===== 编辑模式 =====
        const existing = storage.getKnowledge(this.data.knowledgeId);
        knowledge.id = this.data.knowledgeId;
        knowledge.status = existing.status; // 保留原状态
        knowledge.updatedAt = now();

        // 处理图片变更：删除已被移除的图片文件
        const oldImages = existing.images || [];
        const newImages = this.data.images;
        const toDelete = oldImages.filter(img => !newImages.includes(img));
        toDelete.forEach(img => imageUtil.deleteImage(img));

        // 如果学习日期变更，需要重新计算复习计划（删除旧计划，生成新计划）
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
        // ===== 新建模式 =====
        knowledge.id = generateId('kp');
        knowledge.status = 'active'; // 新知识点默认状态为学习中
        // 🔧 修复：删除重复的 createdAt 赋值（已在顶部 knowledge 对象中统一设置）
        knowledge.updatedAt = now();

        // 保存图片到正式目录（从临时路径转移到持久存储）
        const savedImages = imageUtil.saveImages(knowledge.id, this.data.images);
        knowledge.images = savedImages;

        storage.saveKnowledge(knowledge);

        // 生成复习计划（+1/+3/+7/+14/+29/+59 天）
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

      // 延迟返回，让用户看到成功提示
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
