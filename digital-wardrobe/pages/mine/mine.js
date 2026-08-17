/**
 * ============================================================================
 * 我的页 - 统计概览、数据导出、关于
 * ============================================================================
 *
 * 【页面功能】
 *   - 统计概览：在用/闲置/已处理物品数量，品类分布，存储使用情况
 *   - 最近录入：展示最近添加的 5 件物品
 *   - 快捷入口：进入归档页、品类管理页
 *   - 数据导出：将所有数据导出为 JSON 文件（用于备份/迁移）
 *   - 关于：展示应用版本和简介
 *
 * 【生命周期行为】
 *   - onShow : 每次进入页面重新加载统计数据
 *
 * 【数据字段 (data)】
 *   - totalCount    : 在用+闲置物品总数
 *   - activeCount   : 在用物品数量
 *   - idleCount     : 闲置物品数量
 *   - disposedCount : 已处理物品数量（捐赠+转卖+丢弃+借出）
 *   - categoryStats : 品类统计列表（仅显示有物品的品类，按数量倒序）
 *   - recentItems   : 最近录入的 5 件物品
 *   - storageUsed   : 已用存储空间（KB）
 *   - storageLimit  : 存储上限（KB）
 *
 * 【页面路由参数 (options)】
 *   - 无（"我的"页为 tab 页，不接受参数）
 *
 * 【依赖】
 *   - app.globalData.items      : 全局物品列表
 *   - app.globalData.categories : 全局品类列表
 *   - storage.getStorageInfo()  : 获取存储使用情况
 *   - exportUtil.exportAndShare: 导出并分享数据
 */

const app = getApp();
const storage = require('../../utils/storage.js');
const exportUtil = require('../../utils/export.js');
const { formatDateTime } = require('../../utils/uuid.js');

Page({
  data: {
    totalCount: 0,        // 在用+闲置物品总数
    activeCount: 0,       // 在用物品数量
    idleCount: 0,         // 闲置物品数量
    disposedCount: 0,     // 已处理物品数量
    categoryStats: [],    // 品类统计列表
    recentItems: [],      // 最近录入的物品（最多 5 件）
    storageUsed: 0,       // 已用存储空间（KB）
    storageLimit: 10240,  // 存储上限（KB），默认 10MB
  },

  /**
   * 页面显示时执行
   * 重新加载统计数据，确保展示最新信息
   */
  onShow() {
    this.loadStats();
  },

  /**
   * 加载统计数据
   * 计算各类物品数量、品类分布、最近录入、存储使用情况
   */
  loadStats() {
    const items = app.globalData.items;
    const categories = app.globalData.categories;

    // 按状态统计物品数量
    const activeCount = items.filter(i => i.status === 'active').length;
    const idleCount = items.filter(i => i.status === 'idle').length;
    const disposedCount = items.filter(i => ['donated', 'sold', 'discarded', 'lent'].includes(i.status)).length;

    // 品类统计：统计每个品类下在用+闲置物品数量，过滤空品类，按数量倒序
    const categoryStats = categories.map(cat => ({
      name: cat.name,
      icon: cat.icon,
      count: items.filter(i => i.categoryId === cat.id && ['active', 'idle'].includes(i.status)).length,
    })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

    // 最近录入：按创建时间倒序取前 5 件
    const recentItems = [...items]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(item => ({
        ...item,
        categoryName: app.getCategoryName(item.categoryId),
        categoryIcon: app.getCategoryIcon(item.categoryId),
        formattedDate: formatDateTime(item.createdAt),
      }));

    // 存储信息：获取本地存储使用情况
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
   * 进入归档页 - 查看已处理物品
   */
  onGotoArchive() {
    wx.navigateTo({
      url: '/pages/archive/archive',
    });
  },

  /**
   * 进入品类管理页（切换到品类 tab）
   */
  onGotoCategories() {
    wx.switchTab({
      url: '/pages/category/index',
    });
  },

  /**
   * 数据导出
   * 二次确认后调用导出工具，将所有数据导出为 JSON 文件
   */
  onExport() {
    wx.showModal({
      title: '导出数据',
      content: '将所有物品数据导出为 JSON 文件，可用于备份或迁移。',
      confirmText: '导出',
      success: (res) => {
        if (res.confirm) {
          // 🔧 修复：添加 loading 反馈，避免用户不知道导出正在进行
          wx.showLoading({ title: '导出中...', mask: true });
          try {
            exportUtil.exportAndShare(); // 导出并唤起分享/保存界面
          } catch (e) {
            console.error('Export failed:', e);
            wx.showToast({ title: '导出失败', icon: 'none' });
          } finally {
            wx.hideLoading();
          }
        }
      },
    });
  },

  /**
   * 关于 - 展示应用版本和简介
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
   * @param {Object} e - 事件对象，e.currentTarget.dataset.id 为物品 ID
   */
  onViewItem(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/item/detail?id=${id}`,
    });
  },
});
