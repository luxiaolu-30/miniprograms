/**
 * ============================================================================
 * 应用入口文件 - app.js
 * ============================================================================
 *
 * 文件用途：
 *   微信小程序全局应用实例，负责应用生命周期管理、数据初始化、
 *   数据完整性校验，以及提供全局工具方法供各页面调用。
 *
 * 主要导出/挂载：
 *   - globalData: 全局状态（知识点/复习计划/分类/设置/用户信息）
 *   - onLaunch / onShow / onError: 应用生命周期钩子
 *   - initData(): 初始化本地存储数据到 globalData
 *   - validateIntegrity(): 数据完整性校验（孤立计划/缺失计划/图片文件）
 *   - getTodaySchedules(): 获取今日待复习列表（含逾期）
 *   - getDateSchedules(date): 获取指定日期的待复习列表
 *   - getScheduleCountByDate(): 按日期分组统计待复习数量
 *   - getCategoryName/getCategoryIcon: 分类信息查询
 *   - formatDate/showSuccess/showError/showConfirm: 通用工具方法
 *
 * 核心约定：
 *   - 数据存储在 wx.storage 中，通过 utils/storage.js 访问
 *   - 知识点状态：active(学习中) / mastered(已掌握) / archived(已归档)
 *   - 复习状态：pending(待复习) / done(已完成) / skipped(跳过)
 *   - 应用启动时自动执行数据完整性校验，修复异常数据
 *   - 从其他页面返回时（onShow）自动刷新数据保持同步
 *
 * 数据模型：
 *   - KnowledgePoint(知识点): { id, title, content, images, categoryId, tags, status, createdAt, updatedAt }
 *   - ReviewSchedule(复习计划): { id, knowledgePointId, knowledgeTitle, reviewIndex, scheduledDate, interval, status, completedAt }
 *   - Category(分类): { id, name, icon, createdAt }
 * ============================================================================
 */

const storage = require('./utils/storage.js');

App({
  /**
   * 全局数据状态
   * 存储从本地缓存中加载的所有业务数据
   */
  globalData: {
    knowledges: [],   // 知识点列表
    schedules: [],    // 复习计划列表
    categories: [],   // 分类列表
    settings: {},     // 用户设置
    userInfo: null,   // 用户信息（暂未使用，预留）
  },

  /**
   * 应用生命周期函数 -- 监听小程序初始化
   * 初始化顺序：显示加载动画 → 加载数据 → 完整性校验 → 隐藏加载动画
   */
  onLaunch() {
    console.log('[App] Launch');
    this.showLoading('加载中...');

    // 初始化本地数据：从 wx.storage 加载到 globalData
    this.initData();

    // 数据完整性校验：检查并修复孤立计划、缺失计划、丢失图片
    this.validateIntegrity();

    this.hideLoading();
  },

  /**
   * 应用生命周期函数 -- 监听小程序显示（从后台切回前台或从其他页面返回）
   * 每次显示时刷新数据，确保各页面数据一致性
   */
  onShow() {
    console.log('[App] Show');
    // 从其他页面返回时刷新数据，保持全局状态最新
    this.loadKnowledges();
    this.loadSchedules();
    this.loadCategories();
    // 🔧 修复：同步刷新设置，避免其他页面修改设置后全局状态不同步
    this.loadSettings();
  },

  /**
   * 应用生命周期函数 -- 监听脚本错误或 API 报错
   * @param {string} err - 错误信息
   */
  onError(err) {
    console.error('[App] Error:', err);
  },

  /**
   * 显示加载提示（带遮罩，防止用户重复操作）
   * @param {string} title - 提示文字，默认为"加载中..."
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
   * 从本地存储加载所有业务数据到 globalData
   * 注意：settings 使用合并加载，保留默认值
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
   *
   * 执行四项关键检查，确保数据一致性：
   * 1. 孤立复习计划：知识点已删除但计划仍存在 → 自动删除
   * 2. 缺失复习计划：active 状态知识点没有对应计划 → 自动生成
   * 3. 图片文件丢失：记录的 image 路径文件不存在 → 自动清理
   * 4. 无效分类引用：知识点引用了不存在的分类 → 重置为未分类
   *
   * @description
   * 仅在应用启动时执行一次，修复异常数据后重新加载
   * 校验规则：
   *   - 只有 status='active' 的知识点才需要复习计划（mastered/archived 不需要）
   *   - 孤立计划直接删除（无法关联到有效知识点）
   *   - 缺失计划根据知识点 createdAt 重新生成完整的 6 次复习序列
   *   - 无效分类引用自动置空，使知识点归为"未分类"
   */
  validateIntegrity() {
    const knowledges = this.globalData.knowledges;
    const schedules = this.globalData.schedules;
    let issues = 0;

    // ========== 检查1：孤立的复习计划（关联的知识点不存在） ==========
    // 场景：用户删除了知识点，但对应的复习计划未被级联删除
    const knowledgeIds = new Set(knowledges.map(k => k.id));
    const orphanSchedules = schedules.filter(s => !knowledgeIds.has(s.knowledgePointId));
    if (orphanSchedules.length > 0) {
      console.warn(`[Integrity] Found ${orphanSchedules.length} orphan schedules`);
      // 逐个删除孤立计划
      orphanSchedules.forEach(s => storage.deleteSchedule(s.id));
      issues += orphanSchedules.length;
    }

    // ========== 检查2：active 知识点缺少复习计划 ==========
    // 场景：知识点创建时计划生成失败，或数据导入后缺失
    const scheduledKnowledgeIds = new Set(schedules.map(s => s.knowledgePointId));
    const knowledgesWithoutSchedules = knowledges.filter(
      k => k.status === 'active' && !scheduledKnowledgeIds.has(k.id)
    );
    if (knowledgesWithoutSchedules.length > 0) {
      console.warn(`[Integrity] Found ${knowledgesWithoutSchedules.length} knowledges without schedules`);
      const scheduleUtil = require('./utils/schedule.js');
      // 为每个缺失计划的知识点重新生成完整的 6 次复习计划
      knowledgesWithoutSchedules.forEach(k => {
        const newSchedules = scheduleUtil.generateSchedule(k.id, k.title, k.createdAt);
        storage.saveSchedules(newSchedules);
      });
      issues += knowledgesWithoutSchedules.length;
    }

    // ========== 检查3：图片文件是否存在 ==========
    this.validateImages(knowledges);

    // ========== 检查4：知识点引用了不存在的分类 ==========
    // 🔧 修复：新增完整性检查，清理无效的 categoryId 引用
    const categoryIds = new Set(knowledges.map(k => k.categoryId).filter(Boolean));
    const validCategoryIds = new Set(this.globalData.categories.map(c => c.id));
    const knowledgesWithInvalidCategory = knowledges.filter(
      k => k.categoryId && !validCategoryIds.has(k.categoryId)
    );
    if (knowledgesWithInvalidCategory.length > 0) {
      console.warn(`[Integrity] Found ${knowledgesWithInvalidCategory.length} knowledges with invalid category`);
      knowledgesWithInvalidCategory.forEach(k => {
        k.categoryId = '';
        k.updatedAt = new Date().toISOString();
        storage.saveKnowledge(k);
      });
      issues += knowledgesWithInvalidCategory.length;
    }

    // 修复后重新加载数据，确保 globalData 与存储一致
    if (issues > 0) {
      console.log(`[Integrity] Fixed ${issues} issues`);
      this.loadKnowledges();
      this.loadSchedules();
    } else {
      console.log('[Integrity] All good');
    }
  },

  /**
   * 校验图片文件是否存在
   *
   * 遍历所有知识点的图片列表，检查每个图片文件是否实际存在
   * 如果文件丢失，从知识点的 images 数组中移除该路径并保存
   *
   * @param {object[]} knowledges - 知识点列表
   * @description
   * 使用 FileSystemManager.accessSync 同步检查文件存在性
   * 仅当有图片丢失时才执行保存操作，避免不必要的写入
   */
  validateImages(knowledges) {
    const fs = wx.getFileSystemManager();
    knowledges.forEach(knowledge => {
      // 跳过没有图片的知识点
      if (!knowledge.images || knowledge.images.length === 0) return;

      // 过滤出仍然有效的图片路径
      const validImages = knowledge.images.filter(imgPath => {
        try {
          fs.accessSync(imgPath);
          return true;
        } catch (e) {
          console.warn(`[Integrity] Image missing: ${imgPath}`);
          return false;
        }
      });

      // 如果有图片丢失，更新知识点并保存
      if (validImages.length !== knowledge.images.length) {
        knowledge.images = validImages;
        storage.saveKnowledge(knowledge);
      }
    });
  },

  /**
   * 从本地存储加载知识点列表
   */
  loadKnowledges() {
    this.globalData.knowledges = storage.getKnowledges();
  },

  /**
   * 从本地存储加载复习计划列表
   */
  loadSchedules() {
    this.globalData.schedules = storage.getSchedules();
  },

  /**
   * 从本地存储加载分类列表
   */
  loadCategories() {
    this.globalData.categories = storage.getCategories();
  },

  /**
   * 从本地存储加载用户设置
   * 使用合并策略：保留默认值，用存储值覆盖
   */
  loadSettings() {
    const settings = storage.getSettings();
    if (settings) {
      this.globalData.settings = { ...this.globalData.settings, ...settings };
    }
  },

  /**
   * 获取今日待复习列表（含逾期未复习的）
   *
   * 筛选条件：scheduledDate <= 今天 且 status === 'pending'
   * 排序规则：日期升序（逾期优先），同日期按 reviewIndex 升序
   *
   * @returns {object[]} 今日待复习计划列表
   */
  getTodaySchedules() {
    const today = this.formatDate(new Date());
    return this.globalData.schedules.filter(
      s => s.scheduledDate <= today && s.status === 'pending'
    ).sort((a, b) => {
      // 日期不同：按日期升序（逾期多的排在前面）
      if (a.scheduledDate !== b.scheduledDate) {
        return a.scheduledDate.localeCompare(b.scheduledDate);
      }
      // 日期相同：按复习序号升序（先完成的复习排在前面）
      return a.reviewIndex - b.reviewIndex;
    });
  },

  /**
   * 获取指定日期的待复习列表
   * @param {string} date - 日期字符串 YYYY-MM-DD
   * @returns {object[]} 当天待复习计划列表
   */
  getDateSchedules(date) {
    return this.globalData.schedules.filter(
      s => s.scheduledDate === date && s.status === 'pending'
    ).sort((a, b) => a.reviewIndex - b.reviewIndex);
  },

  /**
   * 按日期分组统计待复习数量
   * 用于日历视图显示每日待复习计数
   *
   * @returns {object} { '2026-08-01': 3, '2026-08-02': 1, ... }
   */
  getScheduleCountByDate() {
    const counts = {};
    this.globalData.schedules.forEach(s => {
      // 只统计待复习状态的
      if (s.status === 'pending') {
        counts[s.scheduledDate] = (counts[s.scheduledDate] || 0) + 1;
      }
    });
    return counts;
  },

  /**
   * 根据分类 ID 获取分类名称
   * @param {string} categoryId - 分类 ID
   * @returns {string} 分类名称，未找到返回"未分类"
   */
  getCategoryName(categoryId) {
    if (!categoryId) return '未分类';
    const cat = this.globalData.categories.find(c => c.id === categoryId);
    return cat ? cat.name : '未分类';
  },

  /**
   * 根据分类 ID 获取分类图标
   * @param {string} categoryId - 分类 ID
   * @returns {string} 分类图标 emoji，未找到返回默认 📦
   */
  getCategoryIcon(categoryId) {
    if (!categoryId) return '📦';
    const cat = this.globalData.categories.find(c => c.id === categoryId);
    return cat ? cat.icon : '📦';
  },

  /**
   * 格式化日期为 YYYY-MM-DD 字符串
   * @param {Date} date - Date 对象
   * @returns {string} 格式化后的日期字符串
   */
  formatDate(date) {
    const Y = date.getFullYear();
    const M = String(date.getMonth() + 1).padStart(2, '0');
    const D = String(date.getDate()).padStart(2, '0');
    return `${Y}-${M}-${D}`;
  },

  /**
   * 显示成功提示 Toast
   * @param {string} title - 提示文字
   * @param {number} duration - 显示时长（毫秒），默认 1500
   */
  showSuccess(title, duration = 1500) {
    wx.showToast({
      title,
      icon: 'success',
      duration,
    });
  },

  /**
   * 显示错误提示 Toast（无图标，可显示较长文字）
   * @param {string} title - 提示文字，默认"操作失败"
   */
  showError(title = '操作失败') {
    wx.showToast({
      title,
      icon: 'none',
      duration: 2000,
    });
  },

  /**
   * 显示确认对话框（Promise 封装）
   * @param {string} title - 标题
   * @param {string} content - 内容
   * @param {string} confirmText - 确认按钮文字，默认"确定"
   * @param {string} cancelText - 取消按钮文字，默认"取消"
   * @returns {Promise<boolean>} 用户点击确认返回 true，取消/关闭返回 false
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
