const storage = require('./utils/storage.js');

App({
  globalData: {
    knowledges: [],
    schedules: [],
    categories: [],
    settings: {},
    userInfo: null,
  },

  onLaunch() {
    console.log('[App] Launch');
    this.showLoading('加载中...');

    // 初始化本地数据
    this.initData();

    // 数据完整性校验
    this.validateIntegrity();

    this.hideLoading();
  },

  onShow() {
    console.log('[App] Show');
    // 从其他页面返回时刷新数据
    this.loadKnowledges();
    this.loadSchedules();
    this.loadCategories();
  },

  onError(err) {
    console.error('[App] Error:', err);
  },

  /**
   * 显示加载提示
   */
  showLoading(title = '加载中...') {
    wx.showLoading({ title, mask: true });
  },

  /**
   * 隐藏加载提示
   */
  hideLoading() {
    wx.hideLoading();
  },

  /**
   * 初始化数据
   */
  initData() {
    this.loadKnowledges();
    this.loadSchedules();
    this.loadCategories();
    this.loadSettings();
    console.log(`[App] Data loaded: ${this.globalData.knowledges.length} knowledges, ${this.globalData.schedules.length} schedules, ${this.globalData.categories.length} categories`);
  },

  /**
   * 数据完整性校验
   */
  validateIntegrity() {
    const knowledges = this.globalData.knowledges;
    const schedules = this.globalData.schedules;
    let issues = 0;

    // 1. 检查是否有孤立的复习计划（关联的知识点不存在）
    const knowledgeIds = new Set(knowledges.map(k => k.id));
    const orphanSchedules = schedules.filter(s => !knowledgeIds.has(s.knowledgePointId));
    if (orphanSchedules.length > 0) {
      console.warn(`[Integrity] Found ${orphanSchedules.length} orphan schedules`);
      orphanSchedules.forEach(s => storage.deleteSchedule(s.id));
      issues += orphanSchedules.length;
    }

    // 2. 检查知识点是否有对应的复习计划
    const scheduledKnowledgeIds = new Set(schedules.map(s => s.knowledgePointId));
    const knowledgesWithoutSchedules = knowledges.filter(
      k => k.status === 'active' && !scheduledKnowledgeIds.has(k.id)
    );
    if (knowledgesWithoutSchedules.length > 0) {
      console.warn(`[Integrity] Found ${knowledgesWithoutSchedules.length} knowledges without schedules`);
      const scheduleUtil = require('./utils/schedule.js');
      knowledgesWithoutSchedules.forEach(k => {
        const newSchedules = scheduleUtil.generateSchedule(k.id, k.title, k.createdAt);
        storage.saveSchedules(newSchedules);
      });
      issues += knowledgesWithoutSchedules.length;
    }

    // 3. 检查图片文件是否存在
    this.validateImages(knowledges);

    if (issues > 0) {
      console.log(`[Integrity] Fixed ${issues} issues`);
      this.loadKnowledges();
      this.loadSchedules();
    } else {
      console.log('[Integrity] All good');
    }
  },

  /**
   * 校验图片文件
   */
  validateImages(knowledges) {
    const fs = wx.getFileSystemManager();
    knowledges.forEach(knowledge => {
      if (!knowledge.images || knowledge.images.length === 0) return;

      const validImages = knowledge.images.filter(imgPath => {
        try {
          fs.accessSync(imgPath);
          return true;
        } catch (e) {
          console.warn(`[Integrity] Image missing: ${imgPath}`);
          return false;
        }
      });

      if (validImages.length !== knowledge.images.length) {
        knowledge.images = validImages;
        storage.saveKnowledge(knowledge);
      }
    });
  },

  loadKnowledges() {
    this.globalData.knowledges = storage.getKnowledges();
  },

  loadSchedules() {
    this.globalData.schedules = storage.getSchedules();
  },

  loadCategories() {
    this.globalData.categories = storage.getCategories();
  },

  loadSettings() {
    const settings = storage.getSettings();
    if (settings) {
      this.globalData.settings = { ...this.globalData.settings, ...settings };
    }
  },

  /**
   * 获取今日待复习列表（含逾期）
   */
  getTodaySchedules() {
    const today = this.formatDate(new Date());
    return this.globalData.schedules.filter(
      s => s.scheduledDate <= today && s.status === 'pending'
    ).sort((a, b) => {
      if (a.scheduledDate !== b.scheduledDate) {
        return a.scheduledDate.localeCompare(b.scheduledDate);
      }
      return a.reviewIndex - b.reviewIndex;
    });
  },

  /**
   * 获取指定日期的待复习列表
   */
  getDateSchedules(date) {
    return this.globalData.schedules.filter(
      s => s.scheduledDate === date && s.status === 'pending'
    ).sort((a, b) => a.reviewIndex - b.reviewIndex);
  },

  /**
   * 按日期分组统计待复习数量
   */
  getScheduleCountByDate() {
    const counts = {};
    this.globalData.schedules.forEach(s => {
      if (s.status === 'pending') {
        counts[s.scheduledDate] = (counts[s.scheduledDate] || 0) + 1;
      }
    });
    return counts;
  },

  /**
   * 获取分类名称
   */
  getCategoryName(categoryId) {
    if (!categoryId) return '未分类';
    const cat = this.globalData.categories.find(c => c.id === categoryId);
    return cat ? cat.name : '未分类';
  },

  /**
   * 获取分类图标
   */
  getCategoryIcon(categoryId) {
    if (!categoryId) return '📦';
    const cat = this.globalData.categories.find(c => c.id === categoryId);
    return cat ? cat.icon : '📦';
  },

  /**
   * 格式化日期为 YYYY-MM-DD
   */
  formatDate(date) {
    const Y = date.getFullYear();
    const M = String(date.getMonth() + 1).padStart(2, '0');
    const D = String(date.getDate()).padStart(2, '0');
    return `${Y}-${M}-${D}`;
  },

  /**
   * 显示成功提示
   */
  showSuccess(title, duration = 1500) {
    wx.showToast({
      title,
      icon: 'success',
      duration,
    });
  },

  /**
   * 显示错误提示
   */
  showError(title = '操作失败') {
    wx.showToast({
      title,
      icon: 'none',
      duration: 2000,
    });
  },

  /**
   * 显示确认对话框
   */
  showConfirm(title, content, confirmText = '确定', cancelText = '取消') {
    return new Promise((resolve) => {
      wx.showModal({
        title,
        content,
        confirmText,
        cancelText,
        success: (res) => resolve(res.confirm),
        fail: () => resolve(false),
      });
    });
  },
});
