const app = getApp();
const storage = require('../../utils/storage.js');
const scheduleUtil = require('../../utils/schedule.js');
const { formatDateTime } = require('../../utils/uuid.js');

Page({
  data: {
    totalCount: 0,
    learningCount: 0,
    masteredCount: 0,
    todayCompleted: 0,
    totalReviews: 0,
    recentKnowledges: [],
    storageUsed: 0,
    storageLimit: 10240,
  },

  onShow() {
    this.loadStats();
  },

  loadStats() {
    const knowledges = app.globalData.knowledges;
    const schedules = app.globalData.schedules;

    const learningCount = knowledges.filter(k => k.status === 'active').length;
    const masteredCount = knowledges.filter(k => k.status === 'mastered').length;

    // 今日完成
    const today = app.formatDate(new Date());
    const todayCompleted = schedules.filter(
      s => s.status === 'done' && s.completedAt && s.completedAt.startsWith(today)
    ).length;

    // 累计完成复习
    const totalReviews = schedules.filter(s => s.status === 'done').length;

    // 最近录入
    const recentKnowledges = [...knowledges]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(k => ({
        ...k,
        categoryName: app.getCategoryName(k.categoryId),
        categoryIcon: app.getCategoryIcon(k.categoryId),
        progress: scheduleUtil.getReviewProgress(
          schedules.filter(s => s.knowledgePointId === k.id)
        ),
        formattedDate: formatDateTime(k.createdAt),
      }));

    // 存储信息
    const storageInfo = storage.getStorageInfo();

    this.setData({
      totalCount: knowledges.length,
      learningCount,
      masteredCount,
      todayCompleted,
      totalReviews,
      recentKnowledges,
      storageUsed: storageInfo.used,
      storageLimit: storageInfo.limit,
    });
  },

  /**
   * 进入分类管理
   */
  onGotoCategories() {
    wx.navigateTo({
      url: '/pages/category/category',
    });
  },

  /**
   * 关于
   */
  onAbout() {
    wx.showModal({
      title: '关于艾宾浩斯助记',
      content: '艾宾浩斯助记 v1.0\n\n基于艾宾浩斯遗忘曲线的间隔重复记忆工具。\n\n数据完全存储在您的手机中，不上传服务器。',
      showCancel: false,
    });
  },

  /**
   * 查看知识点详情
   */
  onViewKnowledge(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`,
    });
  },
});
