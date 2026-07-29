/**
 * ============================================================================
 * 心情徽章组件 - mood-badge
 * ============================================================================
 *
 * 用途：展示心情等级
 *
 * Properties：
 *   - mood: 心情值 1-5
 *   - showLabel: 是否显示文字
 */

const { getMoodConfig } = require('../../utils/entry-type.js');

Component({
  properties: {
    mood: {
      type: Number,
      value: 3,
    },
    showLabel: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    emoji: '😐',
    label: '一般',
  },

  observers: {
    'mood': function (mood) {
      const config = getMoodConfig(mood);
      this.setData({
        emoji: config.emoji,
        label: config.label,
      });
    },
  },

  lifetimes: {
    attached() {
      const config = getMoodConfig(this.data.mood);
      this.setData({
        emoji: config.emoji,
        label: config.label,
      });
    },
  },
});
