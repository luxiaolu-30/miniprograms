const app = getApp();
const storage = require('../../utils/storage.js');
const validate = require('../../utils/validate.js');
const { generateId, now } = require('../../utils/uuid.js');

Page({
  data: {
    categories: [],
    showForm: false,
    isEdit: false,
    editingId: '',
    formName: '',
    formIcon: '📦',
    iconOptions: ['📦', '📚', '💻', '🌐', '🔬', '📝', '🎯', '💡', '🧠', '📐', '🎨', '🏥', '💰', '🎵', '🌍', '⚽'],
  },

  onShow() {
    this.loadCategories();
  },

  loadCategories() {
    const categories = app.globalData.categories;
    // 统计每个分类的知识点数量
    const knowledges = app.globalData.knowledges;
    const list = categories.map(cat => ({
      ...cat,
      count: knowledges.filter(k => k.categoryId === cat.id && k.status !== 'archived').length,
    }));
    this.setData({ categories: list });
  },

  /**
   * 显示新建表单
   */
  onAdd() {
    this.setData({
      showForm: true,
      isEdit: false,
      editingId: '',
      formName: '',
      formIcon: '📦',
    });
  },

  /**
   * 显示编辑表单
   */
  onEdit(e) {
    const { id } = e.currentTarget.dataset;
    const category = app.globalData.categories.find(c => c.id === id);
    if (!category) return;

    this.setData({
      showForm: true,
      isEdit: true,
      editingId: id,
      formName: category.name,
      formIcon: category.icon,
    });
  },

  /**
   * 关闭表单
   */
  onCloseForm() {
    this.setData({ showForm: false });
  },

  /**
   * 名称输入
   */
  onNameInput(e) {
    this.setData({ formName: e.detail.value });
  },

  /**
   * 选择图标
   */
  onSelectIcon(e) {
    const { icon } = e.currentTarget.dataset;
    this.setData({ formIcon: icon });
  },

  /**
   * 保存分类
   */
  onSave() {
    const category = {
      name: this.data.formName.trim(),
      icon: this.data.formIcon,
    };

    const result = validate.validateCategory(category);
    if (!result.valid) {
      wx.showToast({ title: result.message, icon: 'none' });
      return;
    }

    // 检查名称重复
    const existing = app.globalData.categories.find(
      c => c.name === category.name && c.id !== this.data.editingId
    );
    if (existing) {
      wx.showToast({ title: '分类名称已存在', icon: 'none' });
      return;
    }

    if (this.data.isEdit) {
      // 编辑
      const old = app.globalData.categories.find(c => c.id === this.data.editingId);
      category.id = this.data.editingId;
      category.sortOrder = old ? old.sortOrder : 0;
      category.createdAt = old ? old.createdAt : now();
    } else {
      // 新建
      category.id = generateId('cat');
      category.sortOrder = app.globalData.categories.length;
      category.createdAt = now();
    }

    storage.saveCategory(category);
    app.loadCategories();
    this.loadCategories();
    this.setData({ showForm: false });
    wx.showToast({ title: '保存成功', icon: 'success' });
  },

  /**
   * 删除分类
   */
  onDelete(e) {
    const { id } = e.currentTarget.dataset;
    const category = this.data.categories.find(c => c.id === id);

    if (category.count > 0) {
      wx.showModal({
        title: '无法删除',
        content: `该分类下还有 ${category.count} 个知识点，请先处理这些知识点后再删除分类。`,
        showCancel: false,
      });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: `确定要删除分类"${category.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          storage.deleteCategory(id);
          app.loadCategories();
          this.loadCategories();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      },
    });
  },
});
