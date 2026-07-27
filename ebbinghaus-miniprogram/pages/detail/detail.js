const app = getApp();
const storage = require('../../utils/storage.js');
const scheduleUtil = require('../../utils/schedule.js');
const { formatDateTime } = require('../../utils/uuid.js');

Page({
  data: {
    knowledge: null,
    category: null,
    schedules: [], // 6 次复习记录
    progress: 0, // 已完成次数
    loading: true,
  },

  onLoad(options) {
    if (options.id) {
      this.loadKnowledge(options.id);
    }
  },

  onShow() {
    if (this.data.knowledge) {
      this.loadKnowledge(this.data.knowledge.id);
    }
  },

  loadKnowledge(id) {
    const knowledge = storage.getKnowledge(id);
    if (!knowledge) {
      wx.showToast({ title: '知识点不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    const category = knowledge.categoryId ?
      app.globalData.categories.find(c => c.id === knowledge.categoryId) : null;

    // 获取该知识点的复习计划
    const schedules = storage.getSchedulesByKnowledge(id)
      .sort((a, b) => a.reviewIndex - b.reviewIndex);

    const progress = scheduleUtil.getReviewProgress(schedules);

    this.setData({
      knowledge,
      category,
      schedules,
      progress,
      today: app.formatDate(new Date()),
      loading: false,
    });
  },

  /**
   * 预览图片
   */
  onPreviewImage(e) {
    const { index } = e.currentTarget.dataset;
    wx.previewImage({
      urls: this.data.knowledge.images,
      current: this.data.knowledge.images[index],
    });
  },

  /**
   * 编辑
   */
  onEdit() {
    wx.navigateTo({
      url: `/pages/add/add?id=${this.data.knowledge.id}`,
    });
  },

  /**
   * 删除
   */
  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除吗？',
      confirmColor: '#E74C3C',
      success: (res) => {
        if (res.confirm) {
          const imageUtil = require('../../utils/image.js');
          imageUtil.deleteImages(this.data.knowledge.id);
          storage.deleteSchedulesByKnowledge(this.data.knowledge.id);
          storage.deleteKnowledge(this.data.knowledge.id);
          wx.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1000);
        }
      },
    });
  },

  /**
   * 完成某次复习
   */
  onCompleteReview(e) {
    const { id } = e.currentTarget.dataset;
    storage.updateScheduleStatus(id, 'done');

    // 检查是否全部完成
    const schedules = this.data.schedules.map(s => {
      if (s.id === id) {
        return { ...s, status: 'done', completedAt: new Date().toISOString() };
      }
      return s;
    });

    const allDone = schedules.every(s => s.status === 'done');
    if (allDone) {
      const knowledge = { ...this.data.knowledge, status: 'mastered' };
      storage.saveKnowledge(knowledge);
      this.setData({ knowledge });
      wx.showToast({ title: '恭喜！该知识点已掌握 🎉', icon: 'success' });
    }

    this.setData({
      schedules,
      progress: scheduleUtil.getReviewProgress(schedules),
    });
  },
});
