/**
 * ============================================================================
 * 空状态组件（empty-state）
 * ============================================================================
 *
 * 组件用途：
 *   列表无数据时的占位提示，包含图标、标题、描述和操作按钮
 *   用于物品列表页、搜索结果为空等场景
 *
 * 对外暴露的 properties：
 *   - {String} icon - 顶部图标（emoji），默认 👕
 *   - {String} title - 主标题文字
 *   - {String} desc - 副标题/描述文字
 *   - {Boolean} showAction - 是否显示操作按钮，默认 true
 *   - {String} actionText - 操作按钮文字
 *
 * 对外暴露的 events：
 *   - action - 点击操作按钮时触发
 * ============================================================================
 */

Component({
  /**
   * 组件属性（properties）
   * @property {String} icon - 空状态图标（emoji）
   * @property {String} title - 主标题
   * @property {String} desc - 描述说明文字
   * @property {Boolean} showAction - 是否显示底部操作按钮
   * @property {String} actionText - 操作按钮文案
   */
  properties: {
    icon: {
      type: String,
      value: '👕',
    },
    title: {
      type: String,
      value: '还没有物品',
    },
    desc: {
      type: String,
      value: '点击下方按钮开始录入你的第一件物品吧',
    },
    showAction: {
      type: Boolean,
      value: true,
    },
    actionText: {
      type: String,
      value: '立即录入',
    },
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 操作按钮点击事件
     * 触发 action 事件，由父组件处理跳转等逻辑
     */
    onAction() {
      this.triggerEvent('action');
    },
  },
});
