/**
 * ============================================================================
 * 我的/统计页 - stats.js
 * ============================================================================
 *
 * 页面功能：
 *   展示用户的使用统计数据：
 *   - 连续打卡天数
 *   - 日记总数、各类型分布
 *   - 回顾完成率
 *   - 心情趋势
 *   - 累计反思字数
 *   - 存储使用情况
 *
 * 数据字段：
 *   - streak: 连续打卡天数
 *   - totalEntries: 日记总数
 *   - totalReflections: 回顾总数
 *   - completedReflections: 已完成回顾数
 *   - completionRate: 完成率
 *   - typeDistribution: 各类型分布
 *   - moodDistribution: 心情分布
 *   - totalWords: 累计反思字数
 *   - storageInfo: 存储使用情况
 * ============================================================================
 */

const app = getApp();
const storage = require('../../utils/storage.js');
const scheduleUtil = require('../../utils/schedule.js');
const entryTypeUtil = require('../../utils/entry-type.js');

Page({
  data: {
    streak: 0,
    totalEntries: 0,
    totalReflections: 0,
    completedReflections: 0,
    completionRate: 0,
    typeDistribution: [],
    moodDistribution: [],
    totalWords: 0,
    storageUsed: '0 KB',
    firstEntryDate: '',
    daysSinceFirst: 0,
  },

  onShow() {
    this._loadStats();
  },

  /**
   * 加载统计数据
   */
  _loadStats() {
    const entries = app.globalData.entries;
    const reflections = app.globalData.reflections;
    const settings = app.globalData.settings;

    // 基础统计
    const totalEntries = entries.length;
    const totalReflections = reflections.length;
    const completedReflections = reflections.filter(r => r.status === 'done').length;
    const completionRate = totalReflections > 0
      ? Math.round((completedReflections / totalReflections) * 100)
      : 0;

    // 类型分布
    const typeMap = {};
    entries.forEach(e => {
      typeMap[e.type] = (typeMap[e.type] || 0) + 1;
    });
    const typeDistribution = entryTypeUtil.getTypeList().map(t => ({
      ...t,
      count: typeMap[t.key] || 0,
    })).filter(t => t.count > 0);

    // 心情分布
    const moodMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    entries.forEach(e => {
      if (e.mood >= 1 && e.mood <= 5) {
        moodMap[e.mood]++;
      }
    });
    const moodDistribution = entryTypeUtil.MOOD_LEVELS.map(m => ({
      ...m,
      count: moodMap[m.value],
    }));

    // 累计字数
    let totalWords = 0;
    entries.forEach(e => { totalWords += (e.content || '').length; });
    reflections.forEach(r => { totalWords += (r.reflection || '').length; });

    // 存储信息
    const storageInfo = storage.getStorageInfo();
    const storageUsed = `${(storageInfo.used).toFixed(1)} KB`;

    // 首次记录日期
    let firstEntryDate = '';
    let daysSinceFirst = 0;
    if (entries.length > 0) {
      const sorted = [...entries].sort((a, b) =>
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      const first = new Date(sorted[0].createdAt);
      firstEntryDate = scheduleUtil.formatDate(first);
      daysSinceFirst = scheduleUtil.daysBetween(firstEntryDate, scheduleUtil.formatDate(new Date())) + 1;
    }

    this.setData({
      streak: settings.streak || 0,
      totalEntries,
      totalReflections,
      completedReflections,
      completionRate,
      typeDistribution,
      moodDistribution,
      totalWords,
      storageUsed,
      firstEntryDate,
      daysSinceFirst,
    });
  },

  /**
   * 跳转写日记
   */
  onGoAdd() {
    wx.navigateTo({ url: '/pages/add/add' });
  },

  /**
   * 跳转时间轴
   */
  onGoTimeline() {
    wx.switchTab({ url: '/pages/timeline/timeline' });
  },
});
