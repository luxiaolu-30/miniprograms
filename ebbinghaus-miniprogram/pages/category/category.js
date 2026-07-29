/**
 * 分类管理页面
 *
 * 页面功能：
 * - 展示所有分类列表（含每个分类的知识点数量）
 * - 新建、编辑、删除分类
 * - 分类名称唯一性校验
 * - 有知识点的分类禁止删除
 *
 * 生命周期：
 * - onShow: 每次展示时重新加载分类列表（含知识点数量统计）
 *
 * 数据字段（data）：
 * - categories: 分类列表（含 count 字段表示知识点数量）
 * - showForm: 是否显示新建/编辑表单
 * - isEdit: 当前表单是否为编辑模式
 * - editingId: 编辑模式下的分类ID
 * - formName/formIcon: 表单中的名称和图标
 * - iconOptions: 可选图标列表
 *
 * 路由参数（options）：无
 */

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

  /**
   * 页面展示时加载分类列表
   */
  onShow() {
    this.loadCategories();
  },

  /**
   * 加载分类列表，统计每个分类下的知识点数量
   */
  loadCategories() {
    const categories = app.globalData.categories;
    // 统计每个分类下的知识点数量（排除已归档的）
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
   * 保存分类（新建或编辑）
   * @description 校验名称、检查唯一性，保存后刷新全局分类数据
   */
  onSave() {
    const category = {
      name: this.data.formName.trim(),
      icon: this.data.formIcon,
    };

    // 表单校验
    const result = validate.validateCategory(category);
    if (!result.valid) {
      wx.showToast({ title: result.message, icon: 'none' });
      return;
    }

    // 检查名称是否重复（编辑时排除自身）
    const existing = app.globalData.categories.find(
      c => c.name === category.name && c.id !== this.data.editingId
    );
    if (existing) {
      wx.showToast({ title: '分类名称已存在', icon: 'none' });
      return;
    }

    if (this.data.isEdit) {
      // 编辑模式：保留原排序和创建时间
      const old = app.globalData.categories.find(c => c.id === this.data.editingId);
      category.id = this.data.editingId;
      category.sortOrder = old ? old.sortOrder : 0;
      category.createdAt = old ? old.createdAt : now();
    } else {
      // 新建模式：生成ID，排序值设为末尾
      category.id = generateId('cat');
      category.sortOrder = app.globalData.categories.length;
      category.createdAt = now();
    }

    storage.saveCategory(category);
    app.loadCategories(); // 刷新全局分类数据
    this.loadCategories(); // 刷新页面列表
    this.setData({ showForm: false });
    wx.showToast({ title: '保存成功', icon: 'success' });
  },

  /**
   * 删除分类
   * @param {Object} e - 事件对象，e.currentTarget.dataset.id 为分类ID
   * @description 有知识点的分类禁止删除，无知识点时确认后删除
   */
  onDelete(e) {
    const { id } = e.currentTarget.dataset;
    const category = this.data.categories.find(c => c.id === id);

    // 🔧 修复：添加空指针保护，防止 category 为 undefined 时访问 count 报错
    if (!category) {
      wx.showToast({ title: '分类不存在', icon: 'none' });
      return;
    }

    // 有知识点的分类不允许删除，提示用户先处理知识点
    if (category.count > 0) {
      wx.showModal({
        title: '无法删除',
        content: `该分类下还有 ${category.count} 个知识点，请先处理这些知识点后再删除分类。`,
        showCancel: false,
      });
      return;
    }

    // 确认删除
    wx.showModal({
      title: '确认删除',
      content: `确定要删除分类"${category.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          storage.deleteCategory(id);
          app.loadCategories(); // 刷新全局分类数据
          this.loadCategories(); // 刷新页面列表
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      },
    });
  },
});
