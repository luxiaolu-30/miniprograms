const app = getApp();
const scheduleUtil = require('../../utils/schedule.js');
const storage = require('../../utils/storage.js');

Page({
  data: {
    schedules: [],
    loading: true,
    completedCount: 0,
    animatingId: null,
  },

  onShow() {
    this.loadTodaySchedules();
  },

  onPullDownRefresh() {
    this.loadTodaySchedules();
    wx.stopPullDownRefresh();
  },

  loadTodaySchedules() {
    const allSchedules = app.globalData.schedules;
    const knowledges = app.globalData.knowledges;

    const todayList = scheduleUtil.getTodaySchedules(allSchedules, knowledges);

    const today = app.formatDate(new Date());
    const completedToday = allSchedules.filter(
      s => s.status === 'done' &&
        s.completedAt && s.completedAt.startsWith(today)
    ).length;

    this.setData({
      schedules: todayList,
      loading: false,
      completedCount: completedToday,
    });
  },

  /**
   * 完成复习
   */
  onComplete(e) {
    const { id } = e.currentTarget.dataset;

    // 防止重复点击
    if (this.data.animatingId === id) return;

    // 开始动画
    this.setData({ animatingId: id });

    // 延迟执行，让动画先播放
    setTimeout(() => {
      this.doComplete(id);
    }, 300);
  },

  /**
   * 执行完成操作
   */
  doComplete(id) {
    const schedule = app.globalData.schedules.find(s => s.id === id);
    if (!schedule) return;

    // 更新本地状态
    storage.updateScheduleStatus(id, 'done');

    // 检查该知识点是否已掌握
    let isMastered = false;
    const knowledgeSchedules = app.globalData.schedules.filter(
      s => s.knowledgePointId === schedule.knowledgePointId
    );
    if (scheduleUtil.isMastered(knowledgeSchedules)) {
      const knowledge = app.globalData.knowledges.find(k => k.id === schedule.knowledgePointId);
      if (knowledge) {
        knowledge.status = 'mastered';
        storage.saveKnowledge(knowledge);
        isMastered = true;
      }
    }

    // 显示激励
    this.showEncouragement(isMastered, schedule.reviewIndex);

    // 刷新列表
    this.loadTodaySchedules();

    // 清除动画状态
    setTimeout(() => {
      this.setData({ animatingId: null });
    }, 500);
  },

  /**
   * 显示激励文案
   */
  showEncouragement(isMastered, reviewIndex) {
    let msg = '';

    if (isMastered) {
      msg = '🎉 恭喜！该知识点已掌握！';
    } else {
      const messages = [
        '👍 做得好！',
        '💪 继续加油！',
        '✨ 记忆更牢固了！',
        '🌟 坚持就是胜利！',
        '📚 每天都在进步！',
        '🎯 离掌握又近一步！',
      ];
      msg = messages[reviewIndex - 1] || messages[Math.floor(Math.random() * messages.length)];
    }

    wx.showToast({
      title: msg,
      icon: 'none',
      duration: 2000,
    });
  },

  /**
   * 点击卡片进入详情
   */
  onCardTap(e) {
    const { knowledgeid } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${knowledgeid}`,
    });
  },

  /**
   * 新增知识点
   */
  onAddKnowledge() {
    wx.navigateTo({
      url: '/pages/add/add',
    });
  },
});
