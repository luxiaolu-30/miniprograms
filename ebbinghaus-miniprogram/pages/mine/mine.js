/**
 * 我的/统计页面
 *
 * 页面功能：
 * - 展示学习统计数据（总数、学习中、已掌握、今日完成、累计复习）
 * - 展示最近录入的5个知识点（含进度）
 * - 展示本地存储使用情况
 * - 提供分类管理入口和关于信息
 *
 * 生命周期：
 * - onShow: 每次展示时重新加载统计数据
 *
 * 数据字段（data）：
 * - totalCount: 知识点总数
 * - learningCount: 学习中知识点数量
 * - masteredCount: 已掌握知识点数量
 * - todayCompleted: 今日完成复习数量
 * - totalReviews: 累计完成复习数量
 * - recentKnowledges: 最近录入的5个知识点
 * - storageUsed/storageLimit: 存储使用量/上限（KB）
 *
 * 路由参数（options）：无
 */

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
    storageLimit: 10240, // 微信小程序本地存储限制 10MB = 10240KB
  },

  /**
   * 页面展示时加载统计数据
   */
  onShow() {
    this.loadStats();
  },

  /**
   * 加载所有统计数据
   */
  loadStats() {
    const knowledges = app.globalData.knowledges;
    const schedules = app.globalData.schedules;

    // 统计学习中/已掌握知识点数量
    const learningCount = knowledges.filter(k => k.status === 'active').length;
    const masteredCount = knowledges.filter(k => k.status === 'mastered').length;

    // 今日完成复习数量（根据 completedAt 日期判断）
    const today = app.formatDate(new Date());
    const todayCompleted = schedules.filter(
      s => s.status === 'done' && s.completedAt && s.completedAt.startsWith(today)
    ).length;

    // 累计完成复习数量
    const totalReviews = schedules.filter(s => s.status === 'done').length;

    // 最近录入的5个知识点（按创建时间倒序），附带分类信息和复习进度
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

    // 获取本地存储使用情况
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
   * 跳转到分类管理页面
   */
  onGotoCategories() {
    wx.navigateTo({
      url: '/pages/category/category',
    });
  },

  /**
   * 显示关于弹窗
   */
  onAbout() {
    wx.showModal({
      title: '关于艾宾浩斯助记',
      content: '艾宾浩斯助记 v1.0\n\n基于艾宾浩斯遗忘曲线的间隔重复记忆工具。\n\n数据完全存储在您的手机中，不上传服务器。',
      showCancel: false,
    });
  },

  /**
   * 点击知识点进入详情页
   * @param {Object} e - 事件对象，e.currentTarget.dataset.id 为知识点ID
   */
  onViewKnowledge(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`,
    });
  },
});
