/**
 * ============================================================================
 * 今日回顾页 - today.js
 * ============================================================================
 *
 * 页面功能：
 *   展示今天所有需要回顾的日记条目（含逾期），引导用户完成反思。
 *   这是小程序的核心页面，用户每次打开看到的就是"今天该回顾什么"。
 *
 * 数据字段：
 *   - todayReflections: 今日待回顾列表
 *   - currentIndex: 当前正在回顾的索引
 *   - currentReflection: 当前回顾记录
 *   - currentEntry: 当前关联的日记条目
 *   - isReflecting: 是否正在回顾中
 *   - streak: 连续打卡天数
 *   - stats: 今日统计 { total, done, remaining }
 *
 * 业务流程：
 *   1. 加载今日待回顾列表
 *   2. 用户点击"开始回顾"→ 展示回顾引导卡片
 *   3. 用户写下反思 + 评分 → 提交
 *   4. 自动切换到下一个待回顾项
 *   5. 全部完成 → 展示打卡成功动画
 * ============================================================================
 */

const app = getApp();
const storage = require('../../utils/storage.js');
const scheduleUtil = require('../../utils/schedule.js');
const entryTypeUtil = require('../../utils/entry-type.js');

Page({
  data: {
    todayReflections: [],    // 今日待回顾列表
    currentIndex: 0,         // 当前回顾索引
    currentReflection: null, // 当前回顾记录
    currentEntry: null,      // 当前关联条目
    isRefecting: false,      // 是否正在回顾
    streak: 0,               // 连续打卡天数
    stats: { total: 0, done: 0, remaining: 0 },
    allDone: false,          // 今日是否全部完成
  },

  /**
   * 页面显示时刷新数据
   */
  onShow() {
    this._loadData();
  },

  /**
   * 加载数据
   */
  _loadData() {
    const entries = app.globalData.entries;
    const reflections = app.globalData.reflections;
    const settings = app.globalData.settings;

    // 获取今日待回顾列表
    const todayReflections = scheduleUtil.getTodayReflections(reflections, entries);

    // 计算今日统计
    const today = scheduleUtil.formatDate(new Date());
    const todayDone = reflections.filter(
      r => r.status === 'done' && r.completedAt && r.completedAt.startsWith(today)
    ).length;

    const stats = {
      total: todayReflections.length,
      done: todayDone,
      remaining: todayReflections.length,
    };

    // 判断是否全部完成
    const allDone = todayReflections.length === 0;

    this.setData({
      todayReflections,
      stats,
      streak: settings.streak || 0,
      allDone,
      isRefecting: false,
      currentReflection: null,
      currentEntry: null,
    });
  },

  /**
   * 开始回顾（点击某个待回顾项）
   */
  onStartReflection(e) {
    const index = e.currentTarget.dataset.index;
    const reflection = this.data.todayReflections[index];
    const entry = reflection.entry;

    if (!entry) {
      wx.showToast({ title: '条目已删除', icon: 'none' });
      this._loadData();
      return;
    }

    this.setData({
      currentIndex: index,
      currentReflection: reflection,
      currentEntry: entry,
      isRefecting: true,
    });
  },

  /**
   * 提交回顾
   */
  onSubmitReflection(e) {
    const { reflection, rating } = e.detail;
    const { currentReflection } = this.data;

    if (!currentReflection) return;

    // 更新回顾记录
    const reflections = app.globalData.reflections;
    const index = reflections.findIndex(r => r.id === currentReflection.id);
    if (index >= 0) {
      reflections[index].status = 'done';
      reflections[index].reflection = reflection;
      reflections[index].rating = rating;
      reflections[index].completedAt = app.now();
      storage.saveReflection(reflections[index]);
    }

    // 检查该条目是否已完成全部回顾
    this._checkEntryCompleted(currentReflection.entryId);

    wx.showToast({ title: '回顾完成 ✨', icon: 'success' });

    // 切换到下一个或完成
    this._nextOrFinish();
  },

  /**
   * 跳过本次回顾
   */
  onSkipReflection() {
    const { currentReflection } = this.data;
    if (!currentReflection) return;

    // 更新状态为 skipped
    storage.updateReflectionStatus(currentReflection.id, 'skipped');

    this._nextOrFinish();
  },

  /**
   * 切换到下一个回顾项，或标记完成
   */
  _nextOrFinish() {
    // 重新加载数据（回顾列表会减少）
    this._loadData();

    // 回到列表页，让用户选择下一个
    this.setData({ isRefecting: false });
  },

  /**
   * 检查条目是否已完成全部回顾
   */
  _checkEntryCompleted(entryId) {
    const reflections = app.globalData.reflections.filter(r => r.entryId === entryId);
    if (scheduleUtil.isFullyReflected(reflections)) {
      // 标记条目为已内化
      const entries = app.globalData.entries;
      const entry = entries.find(e => e.id === entryId);
      if (entry) {
        entry.status = 'internalized';
        storage.saveEntry(entry);
      }
    }
  },

  /**
   * 跳转到写日记
   */
  onGoAdd() {
    wx.navigateTo({ url: '/pages/add/add' });
  },

  /**
   * 跳转到时间轴
   */
  onGoTimeline() {
    wx.switchTab({ url: '/pages/timeline/timeline' });
  },
});
