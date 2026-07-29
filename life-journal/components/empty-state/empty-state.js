/**
 * ============================================================================
 * 空状态组件 - empty-state
 * ============================================================================
 *
 * 用途：无数据时的占位提示
 *
 * Properties：
 *   - icon: 图标（emoji）
 *   - title: 主标题
 *   - hint: 副标题/说明
 *   - showAction: 是否显示操作按钮
 *   - actionText: 按钮文字
 *
 * Events：
 *   - action: 点击操作按钮
 */

Component({
  properties: {
    icon: { type: String, value: '📝' },
    title: { type: String, value: '还没有内容' },
    hint: { type: String, value: '写下你的第一篇日记吧' },
    showAction: { type: Boolean, value: true },
    actionText: { type: String, value: '开始记录' },
  },

  methods: {
    onAction() {
      this.triggerEvent('action');
    },
  },
});
