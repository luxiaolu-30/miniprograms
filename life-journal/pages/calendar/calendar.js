/**
 * ============================================================================
 * 日历视图页 - calendar.js
 * ============================================================================
 *
 * 页面功能：
 *   月视图展示每天的待回顾数量，点击日期查看当天回顾列表。
 *   用颜色深浅表示当天回顾密度。
 *
 * 数据字段：
 *   - currentYear / currentMonth: 当前展示的年月
 *   - daysInMonth: 当月天数
 *   - firstDayWeek: 当月1日是星期几
 *   - calendarDays: 日历格子数组
 *   - countByDate: 按日期分组的待回顾数量
 *   - selectedDate: 选中的日期
 *   - selectedReflections: 选中日期的回顾列表
 * ============================================================================
 */

const app = getApp();
const scheduleUtil = require('../../utils/schedule.js');

Page({
  data: {
    currentYear: 2026,
    currentMonth: 7,
    calendarDays: [],
    countByDate: {},
    selectedDate: '',
    selectedReflections: [],
    monthLabel: '',
    todayStr: '',
  },

  onShow() {
    this._initCalendar();
  },

  /**
   * 初始化日历
   */
  _initCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const todayStr = scheduleUtil.formatDate(now);

    const reflections = app.globalData.reflections;
    const countByDate = scheduleUtil.getReflectionCountByDate(reflections);

    this.setData({
      currentYear: year,
      currentMonth: month,
      todayStr,
      countByDate,
      monthLabel: `${year}年${month}月`,
      selectedDate: '',
      selectedReflections: [],
    });

    this._buildCalendarDays(year, month);
  },

  /**
   * 构建日历格子
   */
  _buildCalendarDays(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayWeek = new Date(year, month - 1, 1).getDay();

    const days = [];

    // 前置空白
    for (let i = 0; i < firstDayWeek; i++) {
      days.push({ day: '', date: '', isToday: false, count: 0, hasData: false });
    }

    // 日期格子
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const count = this.data.countByDate[dateStr] || 0;
      days.push({
        day: d,
        date: dateStr,
        isToday: dateStr === this.data.todayStr,
        count,
        hasData: count > 0,
      });
    }

    this.setData({ calendarDays: days });
  },

  /**
   * 上一个月
   */
  onPrevMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth--;
    if (currentMonth < 1) {
      currentMonth = 12;
      currentYear--;
    }
    this.setData({
      currentYear,
      currentMonth,
      monthLabel: `${currentYear}年${currentMonth}月`,
    });
    this._buildCalendarDays(currentYear, currentMonth);
    this.setData({ selectedDate: '', selectedReflections: [] });
  },

  /**
   * 下一个月
   */
  onNextMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
    this.setData({
      currentYear,
      currentMonth,
      monthLabel: `${currentYear}年${currentMonth}月`,
    });
    this._buildCalendarDays(currentYear, currentMonth);
    this.setData({ selectedDate: '', selectedReflections: [] });
  },

  /**
   * 点击日期
   */
  onSelectDate(e) {
    const date = e.currentTarget.dataset.date;
    if (!date) return;

    const entries = app.globalData.entries;
    const reflections = app.globalData.reflections;
    const selectedReflections = scheduleUtil.getDateReflections(reflections, entries, date);

    this.setData({
      selectedDate: date,
      selectedReflections,
    });
  },

  /**
   * 点击回顾项跳转详情
   */
  onReflectionTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?entryId=${id}&tab=reflections`,
    });
  },
});
