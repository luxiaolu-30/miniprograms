/**
 * ============================================================================
 * 动态属性表单组件（dynamic-form）
 * ============================================================================
 *
 * 组件用途：
 *   根据配置的字段定义动态渲染不同类型的表单控件
 *   支持文本、数字、下拉选择、日期、布尔值等多种字段类型
 *   用于物品详情页的动态属性录入
 *
 * 对外暴露的 properties：
 *   - {Array} fields - 字段配置数组，每项定义一个表单字段的类型和属性
 *   - {Object} values - 表单初始值对象，键为字段 key
 *
 * 对外暴露的 events：
 *   - change - 任一字段值变化时触发，detail: { key, value, formData }
 *
 * 对外暴露的方法：
 *   - getFormData() - 获取当前表单数据副本
 *
 * ⚠️ 审查意见：
 *   - fields 配置项的结构应在文档中明确（如 { key, label, type, options } 等）
 *   - 各类型 change 事件都调用 updateField，但 value 类型可能不一致（如 select 可能是索引）
 *   - 🔧 修复：values 默认值改为 null，避免多实例共享同一对象引用
 * ============================================================================
 */

Component({
  /**
   * 组件属性（properties）
   * @property {Array} fields - 字段配置数组，定义表单结构和类型
   * @property {Object} values - 表单初始/重置值对象
   */
  properties: {
    fields: {
      type: Array,
      value: [],
    },
    // 🔧 修复：values 默认值改为 null，避免多实例共享同一对象引用
    values: {
      type: Object,
      value: null,
    },
  },

  /**
   * 组件内部数据（data）
   * @property {Object} formData - 当前表单数据，键值对形式存储各字段值
   */
  data: {
    formData: {},
  },

  /**
   * 数据监听器（observers）
   * 监听外部传入的 values 变化，同步到内部 formData
   */
  observers: {
    'values': function (values) {
      // 创建新对象避免引用污染
      this.setData({ formData: { ...(values || {}) } });
    },
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 文本字段变化处理
     * @param {Object} e - 事件对象，e.detail.value 为输入值
     */
    onTextChange(e) {
      const { key } = e.currentTarget.dataset;
      this.updateField(key, e.detail.value);
    },

    /**
     * 数字字段变化处理
     * @param {Object} e - 事件对象，e.detail.value 为数值
     */
    onNumberChange(e) {
      const { key } = e.currentTarget.dataset;
      this.updateField(key, e.detail.value);
    },

    /**
     * 下拉选择字段变化处理
     * @param {Object} e - 事件对象，e.detail.value 为选中值
     */
    onSelectChange(e) {
      const { key } = e.currentTarget.dataset;
      this.updateField(key, e.detail.value);
    },

    /**
     * 日期字段变化处理
     * @param {Object} e - 事件对象，e.detail.value 为日期字符串
     */
    onDateChange(e) {
      const { key } = e.currentTarget.dataset;
      this.updateField(key, e.detail.value);
    },

    /**
     * 布尔值字段变化处理（如开关）
     * @param {Object} e - 事件对象，e.detail.value 为布尔值
     */
    onBooleanChange(e) {
      const { key } = e.currentTarget.dataset;
      this.updateField(key, e.detail.value);
    },

    /**
     * 更新指定字段的值
     * 更新内部状态并触发 change 事件通知父组件
     * @param {string} key - 字段标识
     * @param {*} value - 字段新值
     */
    updateField(key, value) {
      const formData = { ...this.data.formData, [key]: value };
      this.setData({ formData });
      // 通知父组件字段变化，传递变化的字段键、值和完整表单数据
      this.triggerEvent('change', { key, value, formData });
    },

    /**
     * 获取当前表单数据（外部调用）
     * @returns {Object} 表单数据副本，避免外部直接修改内部状态
     */
    getFormData() {
      return { ...this.data.formData };
    },
  },
});
