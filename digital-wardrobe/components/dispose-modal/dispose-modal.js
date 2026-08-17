/**
 * ============================================================================
 * 处理方式弹窗组件（dispose-modal）
 * ============================================================================
 *
 * 组件用途：
 *   提供物品处理方式的选择弹窗，支持捐赠、转卖、丢弃、借出四种方式
 *   用户需选择处理方式、日期，转卖时还需填写价格
 *
 * 对外暴露的 properties：
 *   - {Boolean} visible - 控制弹窗显示/隐藏
 *
 * 对外暴露的 events：
 *   - confirm - 确认处理时触发，detail: { disposeInfo: Object }
 *     disposeInfo 结构: { method, date(ISO), note, price?(转卖时) }
 *   - cancel - 取消操作时触发
 *
 * ⚠️ 审查意见：
 *   - price 字段已增加数值合法性校验（负数、非数字字符）
 *   - date 字段若被用户清空，不再产生 Invalid Date，改为返回 null
 * ============================================================================
 */

// 处理方式常量定义
const METHODS = [
  { value: 'donated', label: '捐赠', icon: '💝' },
  { value: 'sold', label: '转卖', icon: '💰' },
  { value: 'discarded', label: '丢弃', icon: '🗑️' },
  { value: 'lent', label: '借出', icon: '🤝' },
];

Component({
  /**
   * 组件属性（properties）
   * @property {Boolean} visible - 弹窗显示状态，true 时自动重置表单
   */
  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件内部数据（data）
   * @property {Array} methods - 处理方式选项列表
   * @property {string} selectedMethod - 当前选中的处理方式 value
   * @property {string} date - 处理日期（YYYY-MM-DD 格式）
   * @property {string} price - 转卖价格（字符串，确认时转数字）
   * @property {string} note - 备注信息
   */
  data: {
    methods: METHODS,
    selectedMethod: '',
    date: '',
    price: '',
    note: '',
  },

  /**
   * 数据监听器（observers）
   * 弹窗打开时（visible 变为 true）自动重置表单并设置默认日期为今天
   */
  observers: {
    'visible': function (visible) {
      if (visible) {
        // 计算当天日期字符串 YYYY-MM-DD
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        // 重置所有表单字段
        this.setData({
          selectedMethod: '',
          date: dateStr,
          price: '',
          note: '',
        });
      }
    },
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 选择处理方式
     * @param {Object} e - 事件对象，e.currentTarget.dataset.method 为方式 value
     */
    onSelectMethod(e) {
      const { method } = e.currentTarget.dataset;
      this.setData({ selectedMethod: method });
    },

    /**
     * 日期选择变化处理
     * @param {Object} e - 事件对象，e.detail.value 为日期字符串
     */
    onDateChange(e) {
      this.setData({ date: e.detail.value });
    },

    /**
     * 价格输入处理
     * @param {Object} e - 事件对象，e.detail.value 为输入内容
     */
    onPriceInput(e) {
      this.setData({ price: e.detail.value });
    },

    /**
     * 备注输入处理
     * @param {Object} e - 事件对象，e.detail.value 为输入内容
     */
    onNoteInput(e) {
      this.setData({ note: e.detail.value });
    },

    /**
     * 取消操作
     * 触发 cancel 事件，由父组件关闭弹窗
     */
    onCancel() {
      this.triggerEvent('cancel');
    },

    /**
     * 确认处理
     * 校验必填字段 -> 构建处理信息对象 -> 触发 confirm 事件
     */
    onConfirm() {
      // 校验：必须选择处理方式
      if (!this.data.selectedMethod) {
        wx.showToast({ title: '请选择处理方式', icon: 'none' });
        return;
      }

      // 🔧 修复：转卖方式必须填写价格，并校验数值合法性（非负数、非NaN）
      if (this.data.selectedMethod === 'sold') {
        const priceVal = this.data.price;
        const priceNum = Number(priceVal);
        if (!priceVal || isNaN(priceNum) || priceNum < 0) {
          wx.showToast({ title: '请输入有效的转卖价格', icon: 'none' });
          return;
        }
      }

      // 🔧 修复：date 字段若被用户清空，避免 new Date('') 产生 Invalid Date
      let dateISO = null;
      if (this.data.date) {
        const parsed = new Date(this.data.date);
        if (!isNaN(parsed.getTime())) {
          dateISO = parsed.toISOString();
        }
      }

      // 构建处理信息对象
      const disposeInfo = {
        method: this.data.selectedMethod,
        date: dateISO, // 转为 ISO 标准格式，无效时为 null
        note: this.data.note.trim(), // 去除首尾空白
      };

      // 转卖方式额外记录价格
      if (this.data.selectedMethod === 'sold') {
        disposeInfo.price = Number(this.data.price);
      }

      // 通知父组件确认处理
      this.triggerEvent('confirm', { disposeInfo });
    },
  },
});
