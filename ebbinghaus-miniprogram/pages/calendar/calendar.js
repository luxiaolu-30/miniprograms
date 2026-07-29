/**
 * 日历月视图页面
 *
 * 页面功能：
 * - 展示月历网格，标记每天待复习知识点数量
 * - 支持月份切换、回到今天
 * - 点击日期展示当天待复习列表
 * - 显示今日/本周/已掌握/学习中统计
 *
 * 生命周期：
 * - onLoad: 初始化当前年月和今天日期
 * - onShow: 每次展示时刷新统计数据和日历
 *
 * 数据字段（data）：
 * - currentYear/currentMonth: 当前展示的年份/月份
 * - today: 今天日期字符串 'YYYY-MM-DD'
 * - weeks: 日历网格数据，二维数组（每周7天）
 * - scheduleCounts: 日期 -> 待复习数量的映射
 * - selectedDate/selectedSchedules/showDateDetail: 日期详情面板状态
 * - todayCount/weekCount/totalMastered/totalLearning: 统计数据
 *
 * 路由参数（options）：无
 */

const app = getApp();
const scheduleUtil = require('../../utils/schedule.js');

Page({
  data: {
    currentYear: 0,
    currentMonth: 0,
    today: '',
    weeks: [], // 日历网格数据
    scheduleCounts: {}, // { '2026-08-01': 3, ... }
    selectedDate: '',
    selectedSchedules: [], // 选中日期的复习列表
    showDateDetail: false,
    // 统计
    todayCount: 0,
    weekCount: 0,
    totalMastered: 0,
    totalLearning: 0,
  },

  /**
   * 页面加载时初始化当前年月和今天日期
   */
  onLoad() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      today: app.formatDate(now),
    });
  },

  /**
   * 页面展示时刷新数据（从其他页面返回时触发）
   */
  onShow() {
    this.refreshData();
  },

  /**
   * 刷新统计数据和日历网格
   * 计算今日/本周待复习数量、已掌握/学习中知识点数量
   */
  refreshData() {
    const knowledges = app.globalData.knowledges;
    const schedules = app.globalData.schedules;

    // 计算统计数据：今日待复习、本周待复习、已掌握数量、学习中数量
    const todaySchedules = app.getTodaySchedules();
    const weekSchedules = this.getWeekSchedules();
    const masteredCount = knowledges.filter(k => k.status === 'mastered').length;
    const learningCount = knowledges.filter(k => k.status === 'active').length;

    // 按日期统计每天的待复习数量，用于日历格子上显示数字角标
    const counts = scheduleUtil.getScheduleCountByDate(schedules);

    this.setData({
      scheduleCounts: counts,
      todayCount: todaySchedules.length,
      weekCount: weekSchedules.length,
      totalMastered: masteredCount,
      totalLearning: learningCount,
    });

    this.renderCalendar();
  },

  /**
   * 渲染日历网格
   * 生成二维数组 weeks，每个元素是一周7天的日期对象
   * 包含上月末尾、当月、下月开头的日期填充
   */
  renderCalendar() {
    const { currentYear, currentMonth } = this.data;
    const weeks = [];

    // 当月第一天
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    // 当月最后一天（通过下个月第0天获取）
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();

    // 当月第一天是星期几 (0=周日, 1=周一, ...6=周六)
    const startDayOfWeek = firstDay.getDay();

    let week = [];
    // 填充上月的日期（灰色显示，isCurrentMonth=false）
    const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = this.formatMonthDate(currentYear, currentMonth - 1, day);
      week.push({
        date,
        day,
        isCurrentMonth: false, // 非当月，样式置灰
        isToday: date === this.data.today,
        count: this.data.scheduleCounts[date] || 0,
      });
    }

    // 当月日期（isCurrentMonth=true，正常显示）
    for (let day = 1; day <= daysInMonth; day++) {
      const date = this.formatMonthDate(currentYear, currentMonth, day);
      week.push({
        date,
        day,
        isCurrentMonth: true,
        isToday: date === this.data.today,
        count: this.data.scheduleCounts[date] || 0,
      });

      // 每满7天push一周，开始新的一周
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    // 填充下月的日期，补全最后一周
    if (week.length > 0) {
      const remaining = 7 - week.length;
      for (let day = 1; day <= remaining; day++) {
        const date = this.formatMonthDate(currentYear, currentMonth + 1, day);
        week.push({
          date,
          day,
          isCurrentMonth: false,
          isToday: date === this.data.today,
          count: this.data.scheduleCounts[date] || 0,
        });
      }
      weeks.push(week);
    }

    this.setData({ weeks });
  },

  /**
   * 格式化年月日为日期字符串
   * @param {number} year - 年份
   * @param {number} month - 月份（1-12），自动处理溢出（如0=去年12月，13=明年1月）
   * @param {number} day - 日
   * @returns {string} 'YYYY-MM-DD' 格式日期字符串
   */
  formatMonthDate(year, month, day) {
    // 利用 Date 构造函数自动处理月份溢出（month-1 传入，0=去年12月，12=明年1月）
    const d = new Date(year, month - 1, day);
    return app.formatDate(d);
  },

  /**
   * 获取本周（周一到周日）待复习的复习计划列表
   * @returns {Array} 本周待复习的 schedule 数组
   */
  getWeekSchedules() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=周日

    // 计算本周一：周日时回退6天，其他回退(dayOfWeek-1)天
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    // 本周日
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const mondayStr = app.formatDate(monday);
    const sundayStr = app.formatDate(sunday);

    // 筛选 scheduledDate 在本周范围内且状态为 pending 的复习计划
    return app.globalData.schedules.filter(
      s => s.scheduledDate >= mondayStr &&
           s.scheduledDate <= sundayStr &&
           s.status === 'pending'
    );
  },

  /**
   * 切换到上个月
   */
  onPrevMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth--;
    if (currentMonth < 1) {
      currentMonth = 12;
      currentYear--;
    }
    this.setData({ currentYear, currentMonth, showDateDetail: false, selectedDate: '' });
    this.renderCalendar();
  },

  /**
   * 切换到下个月
   */
  onNextMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
    this.setData({ currentYear, currentMonth, showDateDetail: false, selectedDate: '' });
    this.renderCalendar();
  },

  /**
   * 回到今天
   */
  onGoToday() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      showDateDetail: false,
      selectedDate: '',
    });
    this.renderCalendar();
  },

  /**
   * 点击日历日期，展示当天待复习列表
   * @param {Object} e - 事件对象，e.currentTarget.dataset.date 为日期字符串
   */
  onDateTap(e) {
    const { date } = e.currentTarget.dataset;
    const schedules = app.getDateSchedules(date);

    // 关联知识点信息和分类信息，用于展示
    const knowledges = app.globalData.knowledges;
    const list = schedules.map(s => {
      const knowledge = knowledges.find(k => k.id === s.knowledgePointId);
      return {
        ...s,
        knowledge,
        categoryName: app.getCategoryName(knowledge ? knowledge.categoryId : null),
        categoryIcon: app.getCategoryIcon(knowledge ? knowledge.categoryId : null),
      };
    });

    this.setData({
      selectedDate: date,
      selectedSchedules: list,
      showDateDetail: true, // 打开日期详情面板
    });
  },

  /**
   * 点击复习项进入知识点详情页
   * @param {Object} e - 事件对象，e.currentTarget.dataset.knowledgeid 为知识点ID
   */
  onScheduleTap(e) {
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
