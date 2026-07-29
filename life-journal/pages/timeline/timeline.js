/**
 * ============================================================================
 * 时间轴页 - timeline.js
 * ============================================================================
 *
 * 页面功能：
 *   展示所有日记条目的时间线，按创建时间倒序排列。
 *   支持按类型筛选、搜索。
 *   点击条目进入详情页查看完整回顾历史。
 *
 * 数据字段：
 *   - entries: 所有条目列表
 *   - filteredEntries: 筛选后的列表
 *   - selectedFilter: 当前筛选类型（'all' 或具体类型 key）
 *   - searchKeyword: 搜索关键词
 *   - typeStats: 各类型数量统计
 * ============================================================================
 */

const app = getApp();
const storage = require('../../utils/storage.js');
const entryTypeUtil = require('../../utils/entry-type.js');

Page({
  data: {
    entries: [],
    filteredEntries: [],
    selectedFilter: 'all',
    searchKeyword: '',
    typeStats: {},
    entryTypes: [],
  },

  onShow() {
    this.setData({ entryTypes: entryTypeUtil.getTypeList() });
    this._loadEntries();
  },

  /**
   * 加载条目
   */
  _loadEntries() {
    const entries = app.globalData.entries;

    // 按创建时间倒序
    const sorted = [...entries].sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    // 统计各类型数量
    const typeStats = {};
    entries.forEach(e => {
      typeStats[e.type] = (typeStats[e.type] || 0) + 1;
    });

    this.setData({
      entries: sorted,
      filteredEntries: sorted,
      typeStats,
    });
  },

  /**
   * 选择筛选类型
   */
  onSelectFilter(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ selectedFilter: type });
    this._applyFilter(type, this.data.searchKeyword);
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    const keyword = e.detail.value.trim();
    this.setData({ searchKeyword: keyword });
    this._applyFilter(this.data.selectedFilter, keyword);
  },

  /**
   * 清除搜索
   */
  onClearSearch() {
    this.setData({ searchKeyword: '' });
    this._applyFilter(this.data.selectedFilter, '');
  },

  /**
   * 应用筛选
   */
  _applyFilter(type, keyword) {
    let filtered = this.data.entries;

    // 类型筛选
    if (type !== 'all') {
      filtered = filtered.filter(e => e.type === type);
    }

    // 关键词搜索
    if (keyword) {
      const lower = keyword.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(lower) ||
        e.content.toLowerCase().includes(lower) ||
        e.tags.some(t => t.toLowerCase().includes(lower))
      );
    }

    this.setData({ filteredEntries: filtered });
  },

  /**
   * 点击条目
   */
  onEntryTap(e) {
    const id = e.detail.id;
    wx.navigateTo({ url: `/pages/detail/detail?entryId=${id}` });
  },

  /**
   * 跳转写日记
   */
  onGoAdd() {
    wx.navigateTo({ url: '/pages/add/add' });
  },
});
