/**
 * ============================================================================
 * 首页 - 物品浏览、搜索、筛选
 * ============================================================================
 *
 * 【页面功能】
 *   - 展示用户的所有在用/闲置物品（网格/列表双视图）
 *   - 支持按品类筛选、关键词搜索（名称/标签/备注/动态字段）
 *   - 视图模式（网格/列表）可切换，偏好持久化到本地设置
 *
 * 【生命周期行为】
 *   - onLoad : 从全局设置中读取视图模式（grid/list）
 *   - onShow : 每次进入页面刷新数据；支持从分类页携带 filterCategoryId 进行品类筛选
 *
 * 【数据字段 (data)】
 *   - items          : 原始物品列表（在用+闲置）
 *   - filteredItems  : 筛选/搜索后的物品列表（含 categoryName/categoryIcon/imagePath）
 *   - categories     : 品类列表（用于筛选器渲染）
 *   - selectedCategory: 当前选中的品类 ID，'all' 表示全部
 *   - searchKeyword  : 搜索关键词
 *   - viewMode       : 视图模式，'grid'（网格）或 'list'（列表）
 *   - loading        : 加载状态标识
 *
 * 【页面路由参数 (options)】
 *   - 无（首页为 tab 页，不接受参数）
 *
 * 【依赖】
 *   - app.globalData.settings.viewMode : 全局视图偏好
 *   - app.globalData.filterCategoryId  : 从分类页传入的临时筛选参数
 *   - app.getActiveItems()             : 获取在用+闲置物品
 */

const app = getApp();

Page({
  data: {
    items: [],              // 原始物品列表（在用+闲置）
    filteredItems: [],      // 筛选/搜索后的物品列表（含展示用附加字段）
    categories: [],         // 品类列表（用于筛选器渲染）
    selectedCategory: 'all', // 当前选中的品类 ID，'all' 表示全部
    searchKeyword: '',      // 搜索关键词
    viewMode: 'grid',       // 视图模式：'grid'（网格）| 'list'（列表）
    loading: true,          // 加载状态标识
  },

  /**
   * 页面加载时执行一次
   * 从全局设置中读取用户偏好的视图模式（grid/list）
   */
  onLoad() {
    const settings = app.globalData.settings || {};
    this.setData({
      viewMode: settings.viewMode || 'grid',
    });
  },

  /**
   * 页面显示时执行（每次进入页面都会触发）
   * - 检查是否从分类页跳转过来并携带了筛选参数 filterCategoryId
   * - 刷新物品和品类数据，重新应用筛选
   */
  onShow() {
    // 检查是否从分类页跳转过来并携带了筛选参数
    const filterCategoryId = app.globalData.filterCategoryId;
    if (filterCategoryId) {
      this.setData({ selectedCategory: filterCategoryId });
      // 消费后清除，避免下次进入页面仍应用旧筛选
      app.globalData.filterCategoryId = null;
    }
    this.refreshData();
  },

  /**
   * 刷新数据
   * 从全局数据获取在用/闲置物品和品类列表，然后应用筛选条件
   */
  refreshData() {
    const items = app.getActiveItems();       // 获取在用+闲置物品
    const categories = app.globalData.categories;
    this.setData({
      items,
      categories,
      loading: false,
    });
    this.applyFilter();
  },

  /**
   * 应用筛选和搜索
   * 根据当前品类筛选条件和搜索关键词过滤物品列表，然后排序并补充展示字段
   */
  applyFilter() {
    let result = this.data.items;

    // 品类筛选：仅展示选中品类下的物品
    if (this.data.selectedCategory !== 'all') {
      result = result.filter(item => item.categoryId === this.data.selectedCategory);
    }

    // 搜索：支持名称、标签、备注、动态属性值的全文匹配（不区分大小写）
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase();
      result = result.filter(item => {
        // 搜索名称
        if (item.name.toLowerCase().includes(keyword)) return true;
        // 搜索标签（任一标签匹配即可）
        if (item.tags && item.tags.some(t => t.toLowerCase().includes(keyword))) return true;
        // 搜索备注
        if (item.note && item.note.toLowerCase().includes(keyword)) return true;
        // 搜索动态属性值（将所有字段值拼接后匹配）
        if (item.fields) {
          const fieldValues = Object.values(item.fields).join(' ').toLowerCase();
          if (fieldValues.includes(keyword)) return true;
        }
        return false;
      });
    }

    // 排序
    result = this.sortItems(result);

    // 补充展示字段：品类名称、品类图标、首图路径
    const itemsWithImages = result.map(item => {
      const category = app.getCategoryById(item.categoryId);
      return {
        ...item,
        categoryName: category ? category.name : '未分类',
        categoryIcon: category ? category.icon : '📦',
        imagePath: item.images && item.images.length > 0 ? item.images[0] : '',
      };
    });

    this.setData({ filteredItems: itemsWithImages });
  },

  /**
   * 物品排序
   * 根据全局设置中的排序字段对物品进行排序
   * @param {Array<Item>} items - 待排序的物品列表
   * @returns {Array<Item>} 排序后的新数组
   */
  sortItems(items) {
    const sortBy = app.globalData.settings.sortBy || 'updatedAt';
    return [...items].sort((a, b) => {
      if (sortBy === 'name') {
        // 按名称拼音/字母排序（中文使用 zh-CN 区域）
        return a.name.localeCompare(b.name, 'zh-CN');
      }
      // 默认按时间倒序（最新更新的在前）
      return new Date(b[sortBy]) - new Date(a[sortBy]);
    });
  },

  /**
   * 搜索事件（由 search-bar 组件触发）
   * @param {Object} e - 事件对象，e.detail.value 为输入的搜索关键词
   */
  onSearch(e) {
    this.setData({ searchKeyword: e.detail.value });
    this.applyFilter();
  },

  /**
   * 清空搜索框
   */
  onClearSearch() {
    this.setData({ searchKeyword: '' });
    this.applyFilter();
  },

  /**
   * 品类筛选（由 category-chip 组件触发）
   * @param {Object} e - 事件对象，e.detail.id 为选中的品类 ID
   */
  onCategorySelect(e) {
    this.setData({ selectedCategory: e.detail.id });
    this.applyFilter();
  },

  /**
   * 切换视图模式（网格 <-> 列表）
   * 切换后持久化到本地设置，下次进入页面保持用户偏好
   */
  onToggleView() {
    const newMode = this.data.viewMode === 'grid' ? 'list' : 'grid';
    this.setData({ viewMode: newMode });
    // 更新全局设置并持久化
    app.globalData.settings.viewMode = newMode;
    const storage = require('../../utils/storage.js');
    storage.saveSettings({ viewMode: newMode });
  },

  /**
   * 点击物品卡片 - 跳转到物品详情页
   * @param {Object} e - 事件对象，e.detail.id 为物品 ID
   */
  onItemTap(e) {
    wx.navigateTo({
      url: `/pages/item/detail?id=${e.detail.id}`,
    });
  },

  /**
   * 悬浮按钮 - 跳转到新增物品页面
   */
  onAddItem() {
    wx.navigateTo({
      url: '/pages/item/edit',
    });
  },
});
