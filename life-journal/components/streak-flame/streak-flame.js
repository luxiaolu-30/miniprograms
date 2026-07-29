/**
 * ============================================================================
 * 连续打卡火焰组件 - streak-flame
 * ============================================================================
 *
 * 用途：展示连续打卡天数，带有火焰动画效果
 *
 * Properties：
 *   - streak: 连续天数
 *   - showLabel: 是否显示文字标签
 */

Component({
  properties: {
    streak: {
      type: Number,
      value: 0,
    },
    showLabel: {
      type: Boolean,
      value: true,
    },
  },

  data: {
    flameSize: 'small',  // small / medium / large
  },

  observers: {
    'streak': function (streak) {
      let size = 'small';
      if (streak >= 30) size = 'large';
      else if (streak >= 7) size = 'medium';
      this.setData({ flameSize: size });
    },
  },

  methods: {
    // 空方法，保持组件纯净
  },
});
