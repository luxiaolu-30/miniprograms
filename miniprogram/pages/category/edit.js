const app = getApp();
const storage = require('../../utils/storage.js');
const validate = require('../../utils/validate.js');
const { generateId, now } = require('../../utils/uuid.js');

const FIELD_TYPES = [
  { value: 'text', label: '文本' },
  { value: 'number', label: '数字' },
  { value: 'select', label: '单选' },
  { value: 'date', label: '日期' },
  { value: 'boolean', label: '是/否' },
];

Page({
  data: {
    isEdit: false,
    categoryId: '',
    name: '',
    icon: '📦',
    fields: [],
    showIconPicker: false,
    showFieldTypePicker: false,
    fieldTypes: FIELD_TYPES,
    editingFieldIndex: -1,
    saving: false,
  },

  onLoad(options) {
    if (options.id) {
      this.loadCategory(options.id);
    }
  },

  loadCategory(id) {
    const category = storage.getCategory(id);
    if (!category) {
      wx.showToast({ title: '分类不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this.setData({
      isEdit: true,
      categoryId: id,
      name: category.name,
      icon: category.icon,
      fields: category.fields.map(f => ({ ...f, optionsStr: f.options ? f.options.join(',') : '' })),
    });
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onShowIconPicker() {
    this.setData({ showIconPicker: true });
  },

  onHideIconPicker() {
    this.setData({ showIconPicker: false });
  },

  onSelectIcon(e) {
    const { icon } = e.currentTarget.dataset;
    this.setData({ icon, showIconPicker: false });
  },

  /**
   * 添加字段
   */
  onAddField() {
    const newField = {
      key: `field_${Date.now().toString(36)}`,
      label: '',
      type: 'text',
      options: [],
      optionsStr: '',
      required: false,
      sortOrder: this.data.fields.length,
    };
    this.setData({
      fields: [...this.data.fields, newField],
      editingFieldIndex: this.data.fields.length,
    });
  },

  /**
   * 编辑字段
   */
  onEditField(e) {
    const { index } = e.currentTarget.dataset;
    this.setData({ editingFieldIndex: index });
  },

  /**
   * 字段标签变化
   */
  onFieldLabelChange(e) {
    const { index } = e.currentTarget.dataset;
    const fields = [...this.data.fields];
    fields[index] = { ...fields[index], label: e.detail.value };
    // 自动填充 key（如果为空）
    if (!fields[index].key) {
      fields[index].key = 'field_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    }
    this.setData({ fields });
  },

  /**
   * 字段类型变化
   */
  onFieldTypeChange(e) {
    const index = this.data.editingFieldIndex;
    if (index < 0) return;

    const type = FIELD_TYPES[e.detail.value].value;
    const fields = [...this.data.fields];
    fields[index] = {
      ...fields[index],
      type,
      options: type === 'select' ? [''] : [],
      optionsStr: type === 'select' ? '' : '',
    };
    this.setData({ fields });
  },

  /**
   * 字段选项变化
   */
  onFieldOptionsChange(e) {
    const index = this.data.editingFieldIndex;
    if (index < 0) return;

    const optionsStr = e.detail.value;
    const options = optionsStr.split(',').map(s => s.trim()).filter(s => s);
    const fields = [...this.data.fields];
    fields[index] = { ...fields[index], optionsStr, options };
    this.setData({ fields });
  },

  /**
   * 字段必填切换
   */
  onFieldRequiredToggle(e) {
    const index = this.data.editingFieldIndex;
    if (index < 0) return;

    const fields = [...this.data.fields];
    fields[index] = { ...fields[index], required: e.detail.value };
    this.setData({ fields });
  },

  /**
   * 删除字段
   */
  onDeleteField(e) {
    const { index } = e.currentTarget.dataset;
    const fields = this.data.fields.filter((_, i) => i !== index);
    this.setData({ fields, editingFieldIndex: -1 });
  },

  /**
   * 保存
   */
  onSave() {
    if (this.data.saving) return;

    const fields = this.data.fields.map((f, i) => ({
      key: f.key || `field_${i}`,
      label: f.label,
      type: f.type,
      options: f.type === 'select' ? (f.options || []) : undefined,
      required: f.required || false,
      sortOrder: i,
    }));

    const category = {
      name: this.data.name.trim(),
      icon: this.data.icon,
      fields,
      isBuiltIn: this.data.isEdit ? undefined : false,
      sortOrder: this.data.isEdit ? undefined : app.globalData.categories.length,
    };

    const result = validate.validateCategory(category);
    if (!result.valid) {
      wx.showToast({ title: result.message, icon: 'none' });
      return;
    }

    if (this.data.isEdit) {
      const existing = storage.getCategory(this.data.categoryId);
      category.id = this.data.categoryId;
      category.isBuiltIn = existing.isBuiltIn;
      category.sortOrder = existing.sortOrder;
      category.createdAt = existing.createdAt;
    } else {
      category.id = generateId('cat');
      category.createdAt = now();
    }

    storage.saveCategory(category);
    app.loadCategories();
    wx.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 1000);
  },
});
