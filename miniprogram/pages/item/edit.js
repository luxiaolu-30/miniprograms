const app = getApp();
const storage = require('../../utils/storage.js');
const imageUtil = require('../../utils/image.js');
const validate = require('../../utils/validate.js');
const { generateId, now } = require('../../utils/uuid.js');

Page({
  data: {
    isEdit: false,
    itemId: '',
    categories: [],
    selectedCategory: null,
    categoryFields: [],
    name: '',
    images: [],
    fields: {},
    tags: [],
    tagInput: '',
    note: '',
    acquiredDate: '',
    acquiredMethod: 'purchased',
    price: '',
    location: '',
    showCategoryPicker: false,
    saving: false,
    methodOptions: [
      { value: 'purchased', label: '购买' },
      { value: 'gift', label: '赠送' },
      { value: 'self-made', label: '自制' },
      { value: 'other', label: '其他' },
    ],
  },

  onLoad(options) {
    const categories = app.globalData.categories;
    this.setData({ categories });

    if (options.id) {
      // 编辑模式
      this.loadItem(options.id);
    }
  },

  /**
   * 加载物品数据（编辑模式）
   */
  loadItem(id) {
    const item = storage.getItem(id);
    if (!item) {
      wx.showToast({ title: '物品不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    const category = app.getCategoryById(item.categoryId);
    this.setData({
      isEdit: true,
      itemId: id,
      name: item.name,
      images: [...(item.images || [])],
      selectedCategory: category,
      categoryFields: category ? category.fields : [],
      fields: { ...(item.fields || {}) },
      tags: [...(item.tags || [])],
      note: item.note || '',
      acquiredDate: item.acquiredDate ? item.acquiredDate.split('T')[0] : '',
      acquiredMethod: item.acquiredMethod || 'purchased',
      price: item.price !== undefined ? String(item.price) : '',
      location: item.location || '',
    });
  },

  /**
   * 选择品类
   */
  onShowCategoryPicker() {
    this.setData({ showCategoryPicker: true });
  },

  onHideCategoryPicker() {
    this.setData({ showCategoryPicker: false });
  },

  onSelectCategory(e) {
    const { id } = e.currentTarget.dataset;
    const category = app.getCategoryById(id);

    // 如果更换品类，清空动态字段
    let fields = this.data.fields;
    if (!this.data.selectedCategory || this.data.selectedCategory.id !== id) {
      fields = {};
    }

    this.setData({
      selectedCategory: category,
      categoryFields: category.fields,
      fields,
      showCategoryPicker: false,
    });
  },

  /**
   * 名称输入
   */
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  /**
   * 图片变化
   */
  onImagesChange(e) {
    this.setData({ images: e.detail.images });
  },

  /**
   * 动态字段变化
   */
  onFieldsChange(e) {
    this.setData({ fields: e.detail.formData });
  },

  /**
   * 标签输入
   */
  onTagInput(e) {
    this.setData({ tagInput: e.detail.value });
  },

  onAddTag() {
    const tag = this.data.tagInput.trim();
    if (!tag) return;
    if (this.data.tags.includes(tag)) {
      wx.showToast({ title: '标签已存在', icon: 'none' });
      return;
    }
    if (this.data.tags.length >= 10) {
      wx.showToast({ title: '最多 10 个标签', icon: 'none' });
      return;
    }
    this.setData({
      tags: [...this.data.tags, tag],
      tagInput: '',
    });
  },

  onRemoveTag(e) {
    const { index } = e.currentTarget.dataset;
    const tags = this.data.tags.filter((_, i) => i !== index);
    this.setData({ tags });
  },

  /**
   * 备注
   */
  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  /**
   * 获取方式
   */
  onMethodChange(e) {
    const index = e.detail.value;
    const method = this.data.methodOptions[index].value;
    this.setData({ acquiredMethod: method });
  },

  /**
   * 获取日期
   */
  onDateChange(e) {
    this.setData({ acquiredDate: e.detail.value });
  },

  /**
   * 价格
   */
  onPriceInput(e) {
    this.setData({ price: e.detail.value });
  },

  /**
   * 存放位置
   */
  onLocationInput(e) {
    this.setData({ location: e.detail.value });
  },

  /**
   * 保存
   */
  async onSave() {
    if (this.data.saving) return;

    // 构建物品对象
    const item = {
      name: this.data.name.trim(),
      categoryId: this.data.selectedCategory ? this.data.selectedCategory.id : '',
      images: this.data.images,
      fields: this.data.fields,
      tags: this.data.tags,
      note: this.data.note.trim(),
      acquiredDate: this.data.acquiredDate ? new Date(this.data.acquiredDate).toISOString() : '',
      acquiredMethod: this.data.acquiredMethod,
      price: this.data.price !== '' ? Number(this.data.price) : undefined,
      location: this.data.location.trim(),
    };

    // 验证
    const category = this.data.selectedCategory;
    const result = validate.validateItem(item, category);
    if (!result.valid) {
      wx.showToast({ title: result.message, icon: 'none' });
      return;
    }

    this.setData({ saving: true });

    try {
      wx.showLoading({ title: '保存中...' });

      if (this.data.isEdit) {
        // 编辑模式
        const existing = storage.getItem(this.data.itemId);
        item.id = this.data.itemId;
        item.createdAt = existing.createdAt;
        item.status = existing.status;
        item.disposeInfo = existing.disposeInfo;
        item.previousDispose = existing.previousDispose;

        // 处理图片：删除已移除的图片
        const oldImages = existing.images || [];
        const newImages = this.data.images;
        const toDelete = oldImages.filter(img => !newImages.includes(img));
        toDelete.forEach(img => imageUtil.deleteImage(img));

        // 保存
        storage.saveItem(item);
      } else {
        // 新建模式
        item.id = generateId('item');
        item.status = 'active';
        item.createdAt = now();
        item.updatedAt = now();

        // 保存图片到正式目录
        const savedImages = imageUtil.saveImages(item.id, this.data.images);
        item.images = savedImages;

        storage.saveItem(item);
      }

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });

      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } catch (e) {
      wx.hideLoading();
      console.error('Save failed:', e);
      wx.showToast({ title: '保存失败', icon: 'none' });
      this.setData({ saving: false });
    }
  },
});
