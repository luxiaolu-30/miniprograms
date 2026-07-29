/**
 * 知识点详情页面
 *
 * 页面功能：
 * - 展示知识点标题、内容、图片
 * - 显示6次复习计划的进度（已完成/待复习）
 * - 支持预览图片、编辑、删除知识点
 * - 可单独完成某次复习
 *
 * 生命周期：
 * - onLoad: 加载知识点详情（需要 options.id）
 * - onShow: 每次展示时重新加载（从编辑页返回时刷新）
 *
 * 数据字段（data）：
 * - knowledge: 知识点对象
 * - category: 所属分类对象
 * - schedules: 6次复习计划数组（按 reviewIndex 排序）
 * - progress: 已完成复习次数（0-6）
 * - loading: 加载状态
 *
 * 路由参数（options）：
 * - options.id: 知识点ID（必传）
 */

const app = getApp();
const storage = require('../../utils/storage.js');
const scheduleUtil = require('../../utils/schedule.js');
const imageUtil = require('../../utils/image.js');
const { formatDateTime } = require('../../utils/uuid.js');

Page({
  data: {
    knowledge: null,
    category: null,
    schedules: [], // 6 次复习记录
    progress: 0, // 已完成次数
    loading: true,
  },

  /**
   * 页面加载
   * @param {Object} options - 路由参数，options.id 为知识点ID
   */
  onLoad(options) {
    if (options.id) {
      this.loadKnowledge(options.id);
    } else {
      // 🔧 修复：未传 id 时给出友好提示并返回
      wx.showToast({ title: '缺少知识点ID', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  /**
   * 页面展示时刷新数据（从编辑页返回时同步最新内容）
   */
  onShow() {
    if (this.data.knowledge) {
      this.loadKnowledge(this.data.knowledge.id);
    }
  },

  /**
   * 加载知识点详情
   * @param {string} id - 知识点ID
   */
  loadKnowledge(id) {
    const knowledge = storage.getKnowledge(id);
    if (!knowledge) {
      wx.showToast({ title: '知识点不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    // 查找所属分类信息
    const category = knowledge.categoryId ?
      app.globalData.categories.find(c => c.id === knowledge.categoryId) : null;

    // 获取该知识点的全部复习计划，按复习次数排序
    const schedules = storage.getSchedulesByKnowledge(id)
      .sort((a, b) => a.reviewIndex - b.reviewIndex);

    // 计算已完成复习次数（进度）
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
   * 预览图片（全屏大图浏览）
   * @param {Object} e - 事件对象，e.currentTarget.dataset.index 为图片索引
   */
  onPreviewImage(e) {
    const { index } = e.currentTarget.dataset;
    wx.previewImage({
      urls: this.data.knowledge.images,
      current: this.data.knowledge.images[index],
    });
  },

  /**
   * 跳转到编辑页面
   */
  onEdit() {
    wx.navigateTo({
      url: `/pages/add/add?id=${this.data.knowledge.id}`,
    });
  },

  /**
   * 删除知识点
   * @description 删除前确认，删除后同时清理关联的图片和复习计划
   */
  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除吗？',
      confirmColor: '#E74C3C',
      success: (res) => {
        if (res.confirm) {
          // 🔧 修复：imageUtil 已移至文件顶部统一导入
          // 清理关联数据：图片文件、复习计划、知识点记录
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
   * @param {Object} e - 事件对象，e.currentTarget.dataset.id 为复习计划ID
   * @description 更新复习状态为 done，6次全部完成后标记知识点为 mastered
   */
  onCompleteReview(e) {
    const { id } = e.currentTarget.dataset;
    // storage.updateScheduleStatus 内部会调用 app.loadSchedules() 同步全局数据
    const updated = storage.updateScheduleStatus(id, 'done');
    if (!updated) {
      // 🔧 修复：处理更新失败的情况（如 schedule 不存在）
      wx.showToast({ title: '操作失败，请重试', icon: 'none' });
      return;
    }

    // 更新本地 schedules 状态（添加完成时间）
    const schedules = this.data.schedules.map(s => {
      if (s.id === id) {
        return { ...s, status: 'done', completedAt: new Date().toISOString() };
      }
      return s;
    });

    // 检查是否6次复习全部完成
    const allDone = schedules.every(s => s.status === 'done');
    if (allDone) {
      const knowledge = { ...this.data.knowledge, status: 'mastered' };
      storage.saveKnowledge(knowledge); // 内部会调用 app.loadKnowledges() 同步全局数据
      this.setData({ knowledge });
      wx.showToast({ title: '恭喜！该知识点已掌握 🎉', icon: 'success' });
    }

    this.setData({
      schedules,
      progress: scheduleUtil.getReviewProgress(schedules),
    });
  },
});
