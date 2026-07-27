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

  onLoad() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      today: app.formatDate(now),
    });
  },

  onShow() {
    this.refreshData();
  },

  refreshData() {
    const knowledges = app.globalData.knowledges;
    const schedules = app.globalData.schedules;

    // 计算统计数据
    const todaySchedules = app.getTodaySchedules();
    const weekSchedules = this.getWeekSchedules();
    const masteredCount = knowledges.filter(k => k.status === 'mastered').length;
    const learningCount = knowledges.filter(k => k.status === 'active').length;

    // 按日期统计
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
   */
  renderCalendar() {
    const { currentYear, currentMonth } = this.data;
    const weeks = [];

    // 当月第一天
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    // 当月最后一天
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();

    // 第一天是星期几 (0=周日)
    const startDayOfWeek = firstDay.getDay();

    let week = [];
    // 填充上月的日期
    const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = this.formatMonthDate(currentYear, currentMonth - 1, day);
      week.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: date === this.data.today,
        count: this.data.scheduleCounts[date] || 0,
      });
    }

    // 当月日期
    for (let day = 1; day <= daysInMonth; day++) {
      const date = this.formatMonthDate(currentYear, currentMonth, day);
      week.push({
        date,
        day,
        isCurrentMonth: true,
        isToday: date === this.data.today,
        count: this.data.scheduleCounts[date] || 0,
      });

      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    // 填充下月的日期
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

  formatMonthDate(year, month, day) {
    // 处理月份溢出
    const d = new Date(year, month - 1, day);
    return app.formatDate(d);
  },

  /**
   * 获取本周待复习数量
   */
  getWeekSchedules() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const mondayStr = app.formatDate(monday);
    const sundayStr = app.formatDate(sunday);

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
   * 点击日期
   */
  onDateTap(e) {
    const { date } = e.currentTarget.dataset;
    const schedules = app.getDateSchedules(date);

    // 关联知识点信息
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
      showDateDetail: true,
    });
  },

  /**
   * 点击复习项进入详情
   */
  onScheduleTap(e) {
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
