/**
 * ============================================================================
 * 分类管理页 - 品类列表
 * ============================================================================
 *
 * 【页面功能】
 *   - 展示所有品类（预设 + 自定义），显示每个品类下的在用/闲置物品数量
 *   - 支持查看品类下的物品（跳转到首页并筛选）
 *   - 支持编辑、删除品类（预设品类不可删除，含物品时不可删除）
 *
 * 【生命周期行为】
 *   - onShow : 每次进入页面重新加载品类列表（含物品计数）
 *
 * 【数据字段 (data)】
 *   - categories : 品类列表，每项含 itemCount（在用/闲置物品数量）
 *
 * 【页面路由参数 (options)】
 *   - 无（品类管理页为 tab 页，不接受参数）
 *
 * 【依赖】
 *   - app.globalData.categories      : 全局品类列表
 *   - app.getCategoryItemCount(id)   : 获取某品类下在用/闲置物品数量
 *   - storage.deleteCategory(id)     : 删除品类
 */

const app = getApp();
const storage = require('../../utils/storage.js');

Page({
  data: {
    categories: [], // 品类列表（含 itemCount 字段）
  },

  /**
   * 页面显示时执行
   * 重新加载品类列表，确保数据与全局状态同步
   */
  onShow() {
    this.loadCategories();
  },

  /**
   * 加载品类列表
   * 从全局数据获取品类，并为每个品类附加在用/闲置物品数量
   */
  loadCategories() {
    const categories = app.globalData.categories;
    const categoriesWithCount = categories.map(cat => ({
      ...cat,
      itemCount: app.getCategoryItemCount(cat.id), // 该品类下在用+闲置物品数量
    }));
    this.setData({ categories: categoriesWithCount });
  },

  /**
   * 查看品类下的物品
   * 设置全局筛选参数后跳转到首页，首页 onShow 会读取该参数并筛选
   * @param {Object} e - 事件对象，e.currentTarget.dataset.id 为品类 ID
   */
  onViewCategory(e) {
    const { id } = e.currentTarget.dataset;
    app.globalData.filterCategoryId = id; // 设置临时筛选参数
    wx.switchTab({
      url: '/pages/index/index', // 切换到首页 tab
    });
  },

  /**
   * 编辑品类 - 跳转到品类编辑页
   * @param {Object} e - 事件对象，e.currentTarget.dataset.id 为品类 ID
   */
  onEditCategory(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/category/edit?id=${id}`,
    });
  },

  /**
   * 删除品类
   * 业务规则：
   *   - 预设品类（isBuiltIn=true）不可删除
   *   - 品类下还有在用/闲置物品时不可删除（需先处理物品）
   *   - 删除前需用户二次确认
   * @param {Object} e - 事件对象，e.currentTarget.dataset.id 为品类 ID
   */
  onDeleteCategory(e) {
    const { id } = e.currentTarget.dataset;
    const category = this.data.categories.find(c => c.id === id);

    // 🔧 修复：添加 category 不存在时的防护，避免空指针访问
    if (!category) {
      wx.showToast({ title: '品类不存在', icon: 'none' });
      return;
    }

    // 预设品类不允许删除
    if (category.isBuiltIn) {
      wx.showToast({ title: '预设品类不能删除', icon: 'none' });
      return;
    }

    // 品类下还有物品时不允许删除
    if (category.itemCount > 0) {
      wx.showModal({
        title: '无法删除',
        content: `该品类下还有 ${category.itemCount} 个物品，请先处理这些物品后再删除品类。`,
        showCancel: false,
      });
      return;
    }

    // 二次确认后删除
    wx.showModal({
      title: '确认删除',
      content: `确定要删除品类"${category.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          // 🔧 修复：deleteCategory 返回 null 表示存在关联物品（双重保险）
          const result = storage.deleteCategory(id);
          if (result === null) {
            wx.showToast({ title: '该品类下还有物品，无法删除', icon: 'none' });
            return;
          }
          app.loadCategories();   // 刷新全局品类数据
          this.loadCategories();  // 刷新页面列表
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      },
    });
  },

  /**
   * 新增品类 - 跳转到品类编辑页（无 id 参数表示新建）
   */
  onAddCategory() {
    wx.navigateTo({
      url: '/pages/category/edit',
    });
  },
});
