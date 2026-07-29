/**
 * ============================================================================
 * 条目详情页 - detail.js
 * ============================================================================
 *
 * 页面功能：
 *   展示日记条目完整内容 + 所有回顾记录的时间线。
 *   核心特色：对比展示"当时写的内容"和"每次回顾时的思考"，
 *   让用户直观看到自己思维的演变。
 *
 * 路由参数：
 *   - entryId: 条目 ID
 *   - tab: 默认展示区域 'content' | 'reflections'
 *
 * 数据字段：
 *   - entry: 条目对象
 *   - reflections: 该条目的所有回顾记录
 *   - progress: 回顾进度 0-6
 *   - isInternalized: 是否已内化
 *   - activeTab: 当前展示区域
 * ============================================================================
 */

const app = getApp();
const storage = require('../../utils/storage.js');
const scheduleUtil = require('../../utils/schedule.js');
const entryTypeUtil = require('../../utils/entry-type.js');
const { getRelativeDate, formatDateTime } = require('../../utils/uuid.js');

Page({
  data: {
    entry: null,
    reflections: [],
    progress: 0,
    isInternalized: false,
    activeTab: 'content',
    typeConfig: {},
    moodConfig: {},
    relativeDate: '',
  },

  onLoad(options) {
    const entryId = options.entryId;
    if (!entryId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this._entryId = entryId;
    this._loadDetail(entryId);
  },

  onShow() {
    if (this._entryId) {
      this._loadDetail(this._entryId);
    }
  },

  /**
   * 加载详情
   */
  _loadDetail(entryId) {
    const entry = storage.getEntry(entryId);
    if (!entry) {
      wx.showToast({ title: '条目不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    const reflections = storage.getReflectionsByEntry(entryId)
      .sort((a, b) => a.reviewIndex - b.reviewIndex);

    const progress = scheduleUtil.getReviewProgress(reflections);
    const isInternalized = scheduleUtil.isFullyReflected(reflections);

    this.setData({
      entry,
      reflections,
      progress,
      isInternalized,
      typeConfig: entryTypeUtil.getTypeConfig(entry.type),
      moodConfig: entryTypeUtil.getMoodConfig(entry.mood),
      relativeDate: getRelativeDate(entry.createdAt),
    });
  },

  /**
   * 切换 Tab
   */
  onSwitchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  /**
   * 删除条目
   */
  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，对应的回顾记录也会一并删除。',
      success: (res) => {
        if (res.confirm) {
          storage.deleteEntry(this._entryId);
          wx.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1000);
        }
      },
    });
  },

  /**
   * 跳转到今日回顾
   */
  onGoToday() {
    wx.switchTab({ url: '/pages/today/today' });
  },
});
