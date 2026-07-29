/**
 * ============================================================================
 * 日记条目卡片组件 - entry-card
 * ============================================================================
 *
 * 用途：展示一条日记条目的摘要信息
 *
 * Properties：
 *   - entry: 条目对象 { id, title, content, type, mood, createdAt }
 *   - showReflection: 是否显示回顾进度
 *
 * Events：
 *   - tap: 点击卡片触发，传递 { id }
 */

const entryTypeUtil = require('../../utils/entry-type.js');
const scheduleUtil = require('../../utils/schedule.js');
const { getRelativeDate } = require('../../utils/uuid.js');

Component({
  /**
   * 组件属性
   */
  properties: {
    entry: {
      type: Object,
      value: {},
    },
    showReflection: {
      type: Boolean,
      value: true,
    },
  },

  /**
   * 组件内部数据
   */
  data: {
    typeConfig: {},
    moodEmoji: '',
    relativeDate: '',
    progress: 0,
    totalReflections: 0,
  },

  /**
   * 数据监听
   */
  observers: {
    'entry': function (entry) {
      if (!entry || !entry.id) return;
      this._updateDisplay(entry);
    },
  },

  /**
   * 生命周期
   */
  lifetimes: {
    attached() {
      const entry = this.data.entry;
      if (entry && entry.id) {
        this._updateDisplay(entry);
      }
    },
  },

  methods: {
    /**
     * 更新显示数据
     */
    _updateDisplay(entry) {
      const typeConfig = entryTypeUtil.getTypeConfig(entry.type);
      const moodConfig = entryTypeUtil.getMoodConfig(entry.mood);
      const relativeDate = getRelativeDate(entry.createdAt);

      // 计算回顾进度
      const app = getApp();
      const reflections = (app?.globalData?.reflections || [])
        .filter(r => r.entryId === entry.id);
      const progress = scheduleUtil.getReviewProgress(reflections);

      this.setData({
        typeConfig,
        moodEmoji: moodConfig.emoji,
        relativeDate,
        progress,
        totalReflections: reflections.length,
      });
    },

    /**
     * 点击卡片
     */
    onTap() {
      const id = this.data.entry?.id;
      if (!id) return;
      this.triggerEvent('tap', { id });
    },
  },
});
