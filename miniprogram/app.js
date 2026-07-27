const storage = require('./utils/storage.js');
const presetCategories = require('./utils/preset-categories.js');

App({
  globalData: {
    items: [],
    categories: [],
    settings: {
      viewMode: 'grid', // 'grid' | 'list'
      sortBy: 'updatedAt', // 'updatedAt' | 'createdAt' | 'name'
    },
    storageInfo: { used: 0, limit: 10 * 1024 }, // KB
  },

  onLaunch() {
    this.initData();
    this.refreshStorageInfo();
  },

  onShow() {
    // 从其他页面返回时刷新数据
    this.loadItems();
    this.loadCategories();
  },

  /**
   * 初始化数据（首次启动创建预设品类）
   */
  initData() {
    const categories = storage.getCategories();
    if (!categories || categories.length === 0) {
      // 首次启动，创建预设品类
      presetCategories.forEach(cat => {
        storage.saveCategory(cat);
      });
      this.globalData.categories = presetCategories;
    } else {
      this.globalData.categories = categories;
    }
    this.loadItems();
  },

  /**
   * 加载所有物品到内存
   */
  loadItems() {
    this.globalData.items = storage.getItems();
  },

  /**
   * 加载所有品类到内存
   */
  loadCategories() {
    this.globalData.categories = storage.getCategories();
  },

  /**
   * 刷新存储信息
   */
  refreshStorageInfo() {
    this.globalData.storageInfo = storage.getStorageInfo();
  },

  /**
   * 获取分类信息
   */
  getCategoryById(categoryId) {
    return this.globalData.categories.find(c => c.id === categoryId) || null;
  },

  /**
   * 获取分类名称
   */
  getCategoryName(categoryId) {
    const cat = this.getCategoryById(categoryId);
    return cat ? cat.name : '未分类';
  },

  /**
   * 获取分类图标
   */
  getCategoryIcon(categoryId) {
    const cat = this.getCategoryById(categoryId);
    return cat ? cat.icon : '📦';
  },

  /**
   * 获取活跃物品数量（在用+闲置）
   */
  getActiveItems() {
    return this.globalData.items.filter(
      item => item.status === 'active' || item.status === 'idle'
    );
  },

  /**
   * 获取已处理物品
   */
  getDisposedItems() {
    return this.globalData.items.filter(
      item => ['donated', 'sold', 'discarded', 'lent'].includes(item.status)
    );
  },

  /**
   * 获取某分类下的活跃物品数量
   */
  getCategoryItemCount(categoryId) {
    return this.globalData.items.filter(
      item => item.categoryId === categoryId &&
        (item.status === 'active' || item.status === 'idle')
    ).length;
  },
});
