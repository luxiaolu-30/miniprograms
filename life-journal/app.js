/**
 * ============================================================================
 * 应用入口 - app.js
 * ============================================================================
 *
 * 文件用途：
 *   人生间隔重复日记的全局逻辑：数据加载、全局状态管理、应用生命周期。
 *
 * 核心功能：
 *   - 启动时加载所有数据到 globalData
 *   - 提供全局数据访问方法
 *   - 管理连续打卡天数（streak）
 *
 * 数据模型：
 *   - Entry（日记条目）: { id, title, content, type, mood, tags[], createdAt, updatedAt, status }
 *   - Reflection（回顾记录）: { id, entryId, entryTitle, reviewIndex, scheduledDate, interval, status, reflection, rating, completedAt }
 *   - 存储键名前缀：'lj_'（Life Journal）
 *
 * 全局数据（globalData）：
 *   - entries: 所有日记条目
 *   - reflections: 所有回顾记录
 *   - settings: 用户设置
 *   - streak: 连续打卡天数
 * ============================================================================
 */

const storage = require('./utils/storage.js');

App({
  /**
   * 全局数据
   * 存储所有日记条目、回顾记录和用户设置
   */
  globalData: {
    entries: [],        // 日记条目列表
    reflections: [],    // 回顾记录列表
    settings: {},       // 用户设置
  },

  /**
   * 应用启动
   * 加载所有数据到全局状态
   */
  onLaunch() {
    this.loadAllData();
    this.checkStreak();
  },

  /**
   * 应用显示（从后台切回前台）
   * 刷新数据，检查是否需要更新今日状态
   */
  onShow() {
    this.loadAllData();
    this.checkStreak();
  },

  /**
   * 加载所有数据到 globalData
   */
  loadAllData() {
    this.globalData.entries = storage.getEntries();
    this.globalData.reflections = storage.getReflections();
    this.globalData.settings = storage.getSettings();
  },

  /**
   * 加载日记条目
   */
  loadEntries() {
    this.globalData.entries = storage.getEntries();
  },

  /**
   * 加载回顾记录
   */
  loadReflections() {
    this.globalData.reflections = storage.getReflections();
  },

  /**
   * 检查并更新连续打卡天数
   * 规则：今日完成至少 1 次回顾即算打卡
   */
  checkStreak() {
    const today = this.formatDate(new Date());
    const reflections = this.globalData.reflections;

    // 检查今天是否有完成的回顾
    const hasTodayReflection = reflections.some(
      r => r.status === 'done' && r.completedAt && r.completedAt.startsWith(today)
    );

    let settings = this.globalData.settings;
    const lastCheckIn = settings.lastCheckIn || '';

    if (hasTodayReflection && lastCheckIn !== today) {
      // 今天打卡了，且之前没记录过
      const yesterday = this.formatDate(new Date(Date.now() - 86400000));
      if (lastCheckIn === yesterday) {
        // 连续打卡
        settings.streak = (settings.streak || 0) + 1;
      } else if (lastCheckIn === '') {
        // 首次打卡
        settings.streak = 1;
      } else {
        // 断签，重新计算
        settings.streak = 1;
      }
      settings.lastCheckIn = today;
      storage.saveSettings(settings);
      this.globalData.settings = settings;
    }
  },

  /**
   * 格式化日期为 YYYY-MM-DD
   * @param {Date} date - Date 对象
   * @returns {string} 如 "2026-07-29"
   */
  formatDate(date) {
    const Y = date.getFullYear();
    const M = String(date.getMonth() + 1).padStart(2, '0');
    const D = String(date.getDate()).padStart(2, '0');
    return `${Y}-${M}-${D}`;
  },

  /**
   * 获取当前 ISO 格式时间戳
   * @returns {string} 如 "2026-07-29T10:30:00.000Z"
   */
  now() {
    return new Date().toISOString();
  },
});
