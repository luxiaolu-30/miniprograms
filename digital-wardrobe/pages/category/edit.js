/**
 * ============================================================================
 * 品类编辑页 - 分类编辑/字段配置
 * ============================================================================
 *
 * 【页面功能】
 *   - 新建品类：设置名称、图标、自定义字段模板
 *   - 编辑品类：修改已有品类的名称、图标、字段配置
 *   - 字段模板支持 5 种类型：文本、数字、单选、日期、是/否
 *   - 字段可配置标签名、是否必填、选项（单选类型）
 *
 * 【生命周期行为】
 *   - onLoad : 若携带 id 参数则进入编辑模式，加载品类数据；否则为新建模式
 *
 * 【数据字段 (data)】
 *   - isEdit           : 是否为编辑模式
 *   - categoryId       : 品类 ID（编辑模式）
 *   - name             : 品类名称
 *   - icon             : 品类图标（emoji）
 *   - fields           : 字段模板列表，每项含 optionsStr（逗号分隔的选项字符串，便于输入）
 *   - showIconPicker   : 图标选择器显示状态
 *   - showFieldTypePicker : 字段类型选择器显示状态
 *   - fieldTypes       : 字段类型枚举列表
 *   - editingFieldIndex: 当前正在编辑的字段索引（-1 表示无）
 *   - saving           : 保存中状态标识（防止重复提交）
 *
 * 【页面路由参数 (options)】
 *   - id? : 品类 ID，存在则为编辑模式，不存在则为新建模式
 *
 * 【依赖】
 *   - storage.getCategory(id)   : 获取品类数据
 *   - storage.saveCategory(cat): 保存品类
 *   - validate.validateCategory : 品类表单验证
 *   - generateId / now          : ID 生成和时间戳工具
 */

const app = getApp();
const storage = require('../../utils/storage.js');
const validate = require('../../utils/validate.js');
const { generateId, now } = require('../../utils/uuid.js');

/**
 * 字段类型枚举
 * 定义品类可配置的自定义字段类型
 */
const FIELD_TYPES = [
  { value: 'text', label: '文本' },
  { value: 'number', label: '数字' },
  { value: 'select', label: '单选' },
  { value: 'date', label: '日期' },
  { value: 'boolean', label: '是/否' },
];

Page({
  data: {
    isEdit: false,              // 是否为编辑模式
    categoryId: '',             // 品类 ID（编辑模式）
    name: '',                   // 品类名称
    icon: '📦',                 // 品类图标（emoji）
    fields: [],                 // 字段模板列表
    showIconPicker: false,      // 图标选择器显示状态
    showFieldTypePicker: false, // 字段类型选择器显示状态
    fieldTypes: FIELD_TYPES,    // 字段类型枚举（供模板渲染）
    editingFieldIndex: -1,      // 当前正在编辑的字段索引（-1 表示无）
    saving: false,              // 保存中状态标识（防重复提交）
  },

  /**
   * 页面加载
   * 若携带 id 参数则进入编辑模式，从存储加载品类数据
   * @param {Object} options - 路由参数
   * @param {string} [options.id] - 品类 ID
   */
  onLoad(options) {
    if (options.id) {
      this.loadCategory(options.id);
    }
  },

  /**
   * 加载品类数据（编辑模式）
   * 将字段 options 数组转为逗号分隔字符串便于输入
   * @param {string} id - 品类 ID
   */
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
      // 将 options 数组转为逗号分隔字符串，便于在输入框中编辑
      fields: category.fields.map(f => ({ ...f, optionsStr: f.options ? f.options.join(',') : '' })),
    });
  },

  /**
   * 品类名称输入
   * @param {Object} e - 事件对象，e.detail.value 为输入值
   */
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  /**
   * 显示图标选择器
   */
  onShowIconPicker() {
    this.setData({ showIconPicker: true });
  },

  /**
   * 隐藏图标选择器
   */
  onHideIconPicker() {
    this.setData({ showIconPicker: false });
  },

  /**
   * 选择图标
   * @param {Object} e - 事件对象，e.currentTarget.dataset.icon 为选中的图标
   */
  onSelectIcon(e) {
    const { icon } = e.currentTarget.dataset;
    this.setData({ icon, showIconPicker: false });
  },

  /**
   * 添加字段
   * 在字段列表末尾新增一个默认文本类型字段，并自动进入编辑状态
   */
  onAddField() {
    const newField = {
      key: `field_${Date.now().toString(36)}`, // 自动生成唯一 key
      label: '',                                // 字段标签（用户填写）
      type: 'text',                             // 默认类型：文本
      options: [],                              // 单选选项列表
      optionsStr: '',                           // 单选选项（逗号分隔字符串，便于输入）
      required: false,                          // 是否必填
      sortOrder: this.data.fields.length,       // 排序权重
    };
    this.setData({
      fields: [...this.data.fields, newField],
      editingFieldIndex: this.data.fields.length, // 自动编辑新添加的字段
    });
  },

  /**
   * 编辑字段 - 设置当前正在编辑的字段索引
   * @param {Object} e - 事件对象，e.currentTarget.dataset.index 为字段索引
   */
  onEditField(e) {
    const { index } = e.currentTarget.dataset;
    this.setData({ editingFieldIndex: index });
  },

  /**
   * 字段标签变化
   * 若 key 为空，自动生成一个唯一 key
   * @param {Object} e - 事件对象，e.detail.value 为输入的标签名
   */
  onFieldLabelChange(e) {
    const { index } = e.currentTarget.dataset;
    const fields = [...this.data.fields];
    fields[index] = { ...fields[index], label: e.detail.value };
    // 自动填充 key（如果为空），使用时间戳+随机字符串保证唯一性
    if (!fields[index].key) {
      fields[index].key = 'field_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    }
    this.setData({ fields });
  },

  /**
   * 字段类型变化
   * 切换类型时重置选项：仅 select 类型保留选项，其他类型清空
   * @param {Object} e - 事件对象，e.detail.value 为类型选择器索引
   */
  onFieldTypeChange(e) {
    const index = this.data.editingFieldIndex;
    if (index < 0) return; // 无正在编辑的字段时忽略

    const type = FIELD_TYPES[e.detail.value].value;
    const fields = [...this.data.fields];
    fields[index] = {
      ...fields[index],
      type,
      options: type === 'select' ? [''] : [],     // 切换类型时重置选项
      optionsStr: type === 'select' ? '' : '',
    };
    this.setData({ fields });
  },

  /**
   * 字段选项变化（单选类型的选项）
   * 将逗号分隔的字符串解析为数组，过滤空值
   * @param {Object} e - 事件对象，e.detail.value 为逗号分隔的选项字符串
   */
  onFieldOptionsChange(e) {
    const index = this.data.editingFieldIndex;
    if (index < 0) return;

    const optionsStr = e.detail.value;
    // 按逗号分割，去除首尾空格，过滤空字符串
    const options = optionsStr.split(',').map(s => s.trim()).filter(s => s);
    const fields = [...this.data.fields];
    fields[index] = { ...fields[index], optionsStr, options };
    this.setData({ fields });
  },

  /**
   * 字段必填切换
   * @param {Object} e - 事件对象，e.detail.value 为开关状态（boolean）
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
   * @param {Object} e - 事件对象，e.currentTarget.dataset.index 为字段索引
   */
  onDeleteField(e) {
    const { index } = e.currentTarget.dataset;
    const fields = this.data.fields.filter((_, i) => i !== index);
    this.setData({ fields, editingFieldIndex: -1 }); // 删除后退出编辑状态
  },

  /**
   * 保存品类
   * 流程：构建数据 -> 验证 -> 保存到存储 -> 刷新全局数据 -> 返回上一页
   */
  onSave() {
    if (this.data.saving) return; // 防重复提交

    // 构建字段列表：移除 optionsStr（仅用于输入），非 select 类型不保留 options
    const fields = this.data.fields.map((f, i) => ({
      key: f.key || `field_${i}`,
      label: f.label,
      type: f.type,
      options: f.type === 'select' ? (f.options || []) : undefined,
      required: f.required || false,
      sortOrder: i,
    }));

    // 构建品类对象
    const category = {
      name: this.data.name.trim(),
      icon: this.data.icon,
      fields,
      isBuiltIn: this.data.isEdit ? undefined : false, // 新建时设为 false，编辑时不修改
      sortOrder: this.data.isEdit ? undefined : app.globalData.categories.length, // 新建时排在末尾
    };

    // 表单验证
    const result = validate.validateCategory(category);
    if (!result.valid) {
      wx.showToast({ title: result.message, icon: 'none' });
      return;
    }

    // 编辑模式保留原有元数据，新建模式生成 ID 和时间戳
    if (this.data.isEdit) {
      const existing = storage.getCategory(this.data.categoryId);
      category.id = this.data.categoryId;
      category.isBuiltIn = existing.isBuiltIn;     // 保留原 isBuiltIn 状态
      category.sortOrder = existing.sortOrder;     // 保留原排序
      category.createdAt = existing.createdAt;     // 保留原创建时间
    } else {
      category.id = generateId('cat');              // 生成品类 ID（前缀 cat）
      category.createdAt = now();                   // 创建时间 ISO 字符串
    }

    storage.saveCategory(category);
    app.loadCategories();                           // 刷新全局品类数据
    wx.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 1000);
  },
});
