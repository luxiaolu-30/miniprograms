/**
 * 今日复习页面
 *
 * 页面功能：
 * - 展示今天所有待复习的知识点列表
 * - 支持点击完成复习，触发完成动画
 * - 完成全部6次复习后标记知识点为"已掌握"
 * - 下拉刷新、显示激励文案
 *
 * 生命周期：
 * - onShow: 每次展示时重新加载今日复习列表
 * - onPullDownRefresh: 下拉刷新
 *
 * 数据字段（data）：
 * - schedules: 今日待复习列表（含知识点信息和分类信息）
 * - loading: 加载状态
 * - completedCount: 今日已完成复习数量
 * - animatingId: 当前正在执行完成动画的 schedule ID（防重复点击）
 *
 * 路由参数（options）：无
 *
 * 复习间隔：+1/+3/+7/+14/+29/+59 天（6次复习后标记已掌握）
 */

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

  /**
   * 页面展示时加载今日复习列表
   */
  onShow() {
    this.loadTodaySchedules();
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadTodaySchedules();
    wx.stopPullDownRefresh();
  },

  /**
   * 加载今日待复习列表
   * 过滤出今天及之前到期的 pending 复习计划，关联知识点信息
   */
  loadTodaySchedules() {
    const allSchedules = app.globalData.schedules;
    const knowledges = app.globalData.knowledges;

    // 获取今日待复习列表（包含逾期未复习的）
    const todayList = scheduleUtil.getTodaySchedules(allSchedules, knowledges);

    // 统计今日已完成的复习数量（根据 completedAt 日期判断）
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
   * 点击完成复习按钮
   * @param {Object} e - 事件对象，e.currentTarget.dataset.id 为复习计划ID
   * @description 触发完成动画，延迟300ms后执行实际完成逻辑（防重复点击）
   */
  onComplete(e) {
    const { id } = e.currentTarget.dataset;

    // 防止重复点击：如果该ID正在动画中则忽略
    if (this.data.animatingId === id) return;

    // 锁定动画状态，防止重复触发
    this.setData({ animatingId: id });

    // 延迟执行，让完成动画先播放
    setTimeout(() => {
      this.doComplete(id);
    }, 300);
  },

  /**
   * 执行完成复习操作
   * @param {string} id - 复习计划ID
   * @description 1. 更新复习状态为 done
   *              2. 检查该知识点是否6次复习全部完成，是则标记为 mastered
   *              3. 显示激励文案
   *              4. 刷新列表
   */
  doComplete(id) {
    const schedule = app.globalData.schedules.find(s => s.id === id);
    if (!schedule) return;

    // 更新本地存储中的复习状态为 done
    storage.updateScheduleStatus(id, 'done');

    // 检查该知识点的所有复习是否已全部完成（6次复习后标记已掌握）
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

    // 显示激励文案（根据是否已掌握和复习次数）
    this.showEncouragement(isMastered, schedule.reviewIndex);

    // 刷新今日复习列表
    this.loadTodaySchedules();

    // 延迟清除动画状态，确保动画完成
    setTimeout(() => {
      this.setData({ animatingId: null });
    }, 500);
  },

  /**
   * 显示激励文案
   * @param {boolean} isMastered - 该知识点是否已掌握
   * @param {number} reviewIndex - 当前复习次数（1-6）
   * @description 根据复习次数显示不同文案，已掌握时显示恭喜文案
   */
  showEncouragement(isMastered, reviewIndex) {
    let msg = '';

    if (isMastered) {
      msg = '🎉 恭喜！该知识点已掌握！';
    } else {
      // 根据复习次数显示对应文案，超出范围则随机
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
   * 点击复习卡片进入知识点详情页
   * @param {Object} e - 事件对象，e.currentTarget.dataset.knowledgeid 为知识点ID
   */
  onCardTap(e) {
    const { knowledgeid } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${knowledgeid}`,
    });
  },

  /**
   * 跳转到新增知识点页面
   */
  onAddKnowledge() {
    wx.navigateTo({
      url: '/pages/add/add',
    });
  },
});
