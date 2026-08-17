/**
 * ============================================================================
 * 状态标签组件（status-badge）
 * ============================================================================
 *
 * 组件用途：
 *   根据物品状态值显示对应的彩色标签，包含文字和背景色
 *   用于物品卡片上显示物品当前状态
 *
 * 对外暴露的 properties：
 *   - {String} status - 物品状态值，可选：active/idle/donated/sold/discarded/lent
 *
 * 状态说明：
 *   - active: 在用（绿色）
 *   - idle: 闲置（灰色）
 *   - donated: 已捐赠（蓝色）
 *   - sold: 已转卖（橙色）
 *   - discarded: 已丢弃（深灰）
 *   - lent: 已借出（紫色）
 *
 * ⚠️ 审查意见：
 *   - 未知状态回退到 active 样式，并在控制台输出 warn 提示数据异常
 * ============================================================================
 */

// 状态样式映射表：定义每种状态对应的文字、文字颜色和背景色
const STATUS_MAP = {
  active: { label: '在用', color: '#27AE60', bg: '#E8F5E9' },
  idle: { label: '闲置', color: '#999999', bg: '#F0F0F0' },
  donated: { label: '已捐赠', color: '#3498DB', bg: '#E3F2FD' },
  sold: { label: '已转卖', color: '#E67E22', bg: '#FFF3E0' },
  discarded: { label: '已丢弃', color: '#95A5A6', bg: '#F5F5F5' },
  lent: { label: '已借出', color: '#9B59B6', bg: '#F3E5F5' },
};

Component({
  /**
   * 组件属性（properties）
   * @property {String} status - 物品状态标识，默认 'active'
   */
  properties: {
    status: {
      type: String,
      value: 'active',
    },
  },

  /**
   * 组件内部数据（data）
   * @property {string} text - 状态显示文字
   * @property {string} color - 文字颜色（十六进制）
   * @property {string} bg - 背景颜色（十六进制）
   */
  data: {
    text: '',
    color: '',
    bg: '',
  },

  /**
   * 数据监听器（observers）
   * 监听 status 变化，自动更新对应的文字和颜色
   * 🔧 修复：未知状态回退到 active 样式，并输出 warn 提示数据异常
   */
  observers: {
    'status': function (status) {
      const info = STATUS_MAP[status] || STATUS_MAP.active;
      // 🔧 修复：未知状态回退时输出 warn，便于开发期发现数据异常
      if (!STATUS_MAP[status]) {
        console.warn(`[status-badge] 未知状态 "${status}"，已回退为 active 样式，请检查数据源`);
      }
      this.setData({
        text: info.label,
        color: info.color,
        bg: info.bg,
      });
    },
  },
});
