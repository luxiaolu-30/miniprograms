/**
 * 空状态组件（empty-state）
 *
 * 用途：当列表或页面无数据时，展示占位提示信息，可附带一个操作按钮引导用户。
 *
 * 对外暴露的 properties：
 *   - icon {String}    - 顶部图标（emoji），默认 '📭'
 *   - title {String}   - 主标题文案，默认 '暂无内容'
 *   - hint {String}    - 副标题/提示文案，默认 ''
 *   - showAction {Boolean} - 是否显示操作按钮，默认 false
 *   - actionText {String}  - 操作按钮文案，默认 '去添加'
 *
 * 对外暴露的 events：
 *   - action - 用户点击操作按钮时触发，由父组件监听并执行跳转或添加等操作
 */
Component({
  /**
   * 组件属性（properties）
   * 由父组件传入，用于自定义空状态的展示内容
   */
  properties: {
    icon: {
      type: String,
      value: '📭', // 默认空状态图标（邮箱 emoji）
    },
    title: {
      type: String,
      value: '暂无内容', // 默认主标题
    },
    hint: {
      type: String,
      value: '', // 副标题，为空时不显示
    },
    showAction: {
      type: Boolean,
      value: false, // 默认不显示操作按钮
    },
    actionText: {
      type: String,
      value: '去添加', // 操作按钮文案
    },
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 操作按钮点击事件
     * 触发自定义事件 'action'，通知父组件执行对应操作（如跳转添加页面）
     */
    onAction() {
      this.triggerEvent('action');
    },
  },
});
