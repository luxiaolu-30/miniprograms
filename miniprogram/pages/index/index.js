const app = getApp();
const imageUtil = require('../../utils/image.js');

Page({
  data: {
    items: [],
    filteredItems: [],
    categories: [],
    selectedCategory: 'all',
    searchKeyword: '',
    viewMode: 'grid',
    loading: true,
  },

  onLoad() {
    const settings = app.globalData.settings || {};
    this.setData({
      viewMode: settings.viewMode || 'grid',
    });
  },

  onShow() {
    // 检查是否从分类页跳转过来并携带了筛选参数
    const filterCategoryId = app.globalData.filterCategoryId;
    if (filterCategoryId) {
      this.setData({ selectedCategory: filterCategoryId });
      app.globalData.filterCategoryId = null;
    }
    this.refreshData();
  },

  refreshData() {
    const items = app.getActiveItems();
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
   */
  applyFilter() {
    let result = this.data.items;

    // 品类筛选
    if (this.data.selectedCategory !== 'all') {
      result = result.filter(item => item.categoryId === this.data.selectedCategory);
    }

    // 搜索
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase();
      result = result.filter(item => {
        // 搜索名称
        if (item.name.toLowerCase().includes(keyword)) return true;
        // 搜索标签
        if (item.tags && item.tags.some(t => t.toLowerCase().includes(keyword))) return true;
        // 搜索备注
        if (item.note && item.note.toLowerCase().includes(keyword)) return true;
        // 搜索动态属性值
        if (item.fields) {
          const fieldValues = Object.values(item.fields).join(' ').toLowerCase();
          if (fieldValues.includes(keyword)) return true;
        }
        return false;
      });
    }

    // 排序
    result = this.sortItems(result);

    // 加载首图路径
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

  sortItems(items) {
    const sortBy = app.globalData.settings.sortBy || 'updatedAt';
    return [...items].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'zh-CN');
      }
      // 默认按时间倒序
      return new Date(b[sortBy]) - new Date(a[sortBy]);
    });
  },

  /**
   * 搜索事件
   */
  onSearch(e) {
    this.setData({ searchKeyword: e.detail.value });
    this.applyFilter();
  },

  onClearSearch() {
    this.setData({ searchKeyword: '' });
    this.applyFilter();
  },

  /**
   * 品类筛选
   */
  onCategorySelect(e) {
    this.setData({ selectedCategory: e.detail.id });
    this.applyFilter();
  },

  /**
   * 切换视图模式
   */
  onToggleView() {
    const newMode = this.data.viewMode === 'grid' ? 'list' : 'grid';
    this.setData({ viewMode: newMode });
    app.globalData.settings.viewMode = newMode;
    const storage = require('../../utils/storage.js');
    storage.saveSettings({ viewMode: newMode });
  },

  /**
   * 点击物品卡片
   */
  onItemTap(e) {
    wx.navigateTo({
      url: `/pages/item/detail?id=${e.detail.id}`,
    });
  },

  /**
   * 悬浮按钮 - 新增物品
   */
  onAddItem() {
    wx.navigateTo({
      url: '/pages/item/edit',
    });
  },
});
