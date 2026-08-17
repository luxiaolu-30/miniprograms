/**
 * ============================================================================
 * Digital Wardrobe（数字衣橱）- 应用入口文件
 * ============================================================================
 *
 * 文件用途：
 *   小程序全局应用实例，负责全局数据管理、生命周期调度和跨页面数据共享
 *
 * 全局数据（globalData）：
 *   - items: 所有衣物物品列表（内存缓存，与 storage 同步）
 *   - categories: 所有物品分类列表
 *   - settings: 用户偏好设置（视图模式、排序方式）
 *   - storageInfo: 本地存储使用情况（已用/上限，单位 KB）
 *
 * 生命周期行为：
 *   - onLaunch: 初始化数据（首次启动创建预设品类）+ 刷新存储信息
 *   - onShow: 从其他页面返回时重新加载物品和品类数据
 *
 * 对外暴露的全局方法：
 *   - loadItems() / loadCategories(): 从本地存储重新加载数据
 *   - refreshStorageInfo(): 刷新存储使用情况
 *   - getCategoryById/getCategoryName/getCategoryIcon: 分类信息查询
 *   - getActiveItems/getDisposedItems/getCategoryItemCount: 物品统计查询
 *
 * 依赖关系：
 *   - ./utils/storage.js - 本地存储工具
 *   - ./utils/preset-categories.js - 预设分类数据
 * ============================================================================
 */

const storage = require('./utils/storage.js');
const presetCategories = require('./utils/preset-categories.js');

App({
  /**
   * 全局数据（globalData）
   * 所有页面共享的数据，修改后不会自动触发视图更新
   */
  globalData: {
    /** 物品列表（内存缓存），元素结构见 items 存储格式 */
    items: [],
    /** 分类列表，每个元素包含 id/name/icon 字段 */
    categories: [],
    /** 用户偏好设置 */
    settings: {
      viewMode: 'grid', // 'grid' 网格视图 | 'list' 列表视图
      sortBy: 'updatedAt', // 'updatedAt' 按更新时间 | 'createdAt' 按创建时间 | 'name' 按名称
    },
    /** 本地存储使用情况，单位 KB */
    storageInfo: { used: 0, limit: 10 * 1024 }, // 默认上限 10MB
  },

  /**
   * 小程序启动时触发（全局只触发一次）
   * 负责初始化数据和刷新存储信息
   */
  onLaunch() {
    this.initData();
    this.refreshStorageInfo();
  },

  /**
   * 小程序切到前台时触发
   * 从其他页面返回时重新加载数据，确保数据一致性
   */
  onShow() {
    // 从其他页面返回时刷新数据
    this.loadItems();
    this.loadCategories();
  },

  /**
   * 初始化数据
   * 首次启动时创建预设品类，之后从本地存储加载
   * 最后加载物品列表到内存
   */
  initData() {
    const categories = storage.getCategories();
    if (!categories || categories.length === 0) {
      // 首次启动，将预设品类写入本地存储
      presetCategories.forEach(cat => {
        storage.saveCategory(cat);
      });
      this.globalData.categories = presetCategories;
    } else {
      // 非首次启动，使用已保存的分类数据
      this.globalData.categories = categories;
    }
    // 加载物品列表到内存缓存
    this.loadItems();
  },

  /**
   * 从本地存储加载所有物品到内存缓存
   * 用于数据刷新和跨页面数据同步
   */
  loadItems() {
    this.globalData.items = storage.getItems();
  },

  /**
   * 从本地存储加载所有品类到内存缓存
   */
  loadCategories() {
    this.globalData.categories = storage.getCategories();
  },

  /**
   * 刷新本地存储使用情况
   * 更新已用空间和上限信息
   */
  refreshStorageInfo() {
    this.globalData.storageInfo = storage.getStorageInfo();
  },

  /**
   * 根据分类 ID 获取分类完整信息
   * @param {string} categoryId - 分类唯一标识
   * @returns {Object|null} 分类对象，未找到返回 null
   */
  getCategoryById(categoryId) {
    return this.globalData.categories.find(c => c.id === categoryId) || null;
  },

  /**
   * 根据分类 ID 获取分类名称
   * @param {string} categoryId - 分类唯一标识
   * @returns {string} 分类名称，未找到返回 '未分类'
   */
  getCategoryName(categoryId) {
    const cat = this.getCategoryById(categoryId);
    return cat ? cat.name : '未分类';
  },

  /**
   * 根据分类 ID 获取分类图标
   * @param {string} categoryId - 分类唯一标识
   * @returns {string} 分类图标（emoji），未找到返回默认 📦
   */
  getCategoryIcon(categoryId) {
    const cat = this.getCategoryById(categoryId);
    return cat ? cat.icon : '📦';
  },

  /**
   * 获取活跃物品列表（在用 + 闲置状态）
   * @returns {Array} 活跃物品数组
   */
  getActiveItems() {
    return this.globalData.items.filter(
      item => item.status === 'active' || item.status === 'idle'
    );
  },

  /**
   * 获取已处理物品列表（捐赠/转卖/丢弃/借出）
   * @returns {Array} 已处理物品数组
   */
  getDisposedItems() {
    return this.globalData.items.filter(
      item => ['donated', 'sold', 'discarded', 'lent'].includes(item.status)
    );
  },

  /**
   * 获取指定分类下的活跃物品数量
   * @param {string} categoryId - 分类唯一标识
   * @returns {number} 活跃物品数量
   */
  getCategoryItemCount(categoryId) {
    return this.globalData.items.filter(
      item => item.categoryId === categoryId &&
        (item.status === 'active' || item.status === 'idle')
    ).length;
  },
});
