const app = getApp();
const storage = require('../../utils/storage.js');
const exportUtil = require('../../utils/export.js');
const { formatDateTime } = require('../../utils/uuid.js');

Page({
  data: {
    totalCount: 0,
    activeCount: 0,
    idleCount: 0,
    disposedCount: 0,
    categoryStats: [],
    recentItems: [],
    storageUsed: 0,
    storageLimit: 10240,
  },

  onShow() {
    this.loadStats();
  },

  loadStats() {
    const items = app.globalData.items;
    const categories = app.globalData.categories;

    const activeCount = items.filter(i => i.status === 'active').length;
    const idleCount = items.filter(i => i.status === 'idle').length;
    const disposedCount = items.filter(i => ['donated', 'sold', 'discarded', 'lent'].includes(i.status)).length;

    // 品类统计
    const categoryStats = categories.map(cat => ({
      name: cat.name,
      icon: cat.icon,
      count: items.filter(i => i.categoryId === cat.id && ['active', 'idle'].includes(i.status)).length,
    })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

    // 最近录入
    const recentItems = [...items]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(item => ({
        ...item,
        categoryName: app.getCategoryName(item.categoryId),
        categoryIcon: app.getCategoryIcon(item.categoryId),
        formattedDate: formatDateTime(item.createdAt),
      }));

    // 存储信息
    const storageInfo = storage.getStorageInfo();

    this.setData({
      totalCount: activeCount + idleCount,
      activeCount,
      idleCount,
      disposedCount,
      categoryStats,
      recentItems,
      storageUsed: storageInfo.used,
      storageLimit: storageInfo.limit,
    });
  },

  /**
   * 进入归档
   */
  onGotoArchive() {
    wx.navigateTo({
      url: '/pages/archive/archive',
    });
  },

  /**
   * 进入品类管理
   */
  onGotoCategories() {
    wx.switchTab({
      url: '/pages/category/index',
    });
  },

  /**
   * 数据导出
   */
  onExport() {
    wx.showModal({
      title: '导出数据',
      content: '将所有物品数据导出为 JSON 文件，可用于备份或迁移。',
      confirmText: '导出',
      success: (res) => {
        if (res.confirm) {
          exportUtil.exportAndShare();
        }
      },
    });
  },

  /**
   * 关于
   */
  onAbout() {
    wx.showModal({
      title: '关于电子衣橱',
      content: '电子衣橱 v1.0\n\n一个纯本地的个人物品收纳整理工具。\n数据完全存储在您的手机中，不会上传到任何服务器。',
      showCancel: false,
    });
  },

  /**
   * 查看最近物品详情
   */
  onViewItem(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/item/detail?id=${id}`,
    });
  },
});
