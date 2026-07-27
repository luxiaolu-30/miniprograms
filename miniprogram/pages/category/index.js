const app = getApp();
const storage = require('../../utils/storage.js');

Page({
  data: {
    categories: [],
  },

  onShow() {
    this.loadCategories();
  },

  loadCategories() {
    const categories = app.globalData.categories;
    const categoriesWithCount = categories.map(cat => ({
      ...cat,
      itemCount: app.getCategoryItemCount(cat.id),
    }));
    this.setData({ categories: categoriesWithCount });
  },

  onViewCategory(e) {
    const { id } = e.currentTarget.dataset;
    app.globalData.filterCategoryId = id;
    wx.switchTab({
      url: '/pages/index/index',
    });
  },

  onEditCategory(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/category/edit?id=${id}`,
    });
  },

  onDeleteCategory(e) {
    const { id } = e.currentTarget.dataset;
    const category = this.data.categories.find(c => c.id === id);

    if (category.isBuiltIn) {
      wx.showToast({ title: '预设品类不能删除', icon: 'none' });
      return;
    }

    if (category.itemCount > 0) {
      wx.showModal({
        title: '无法删除',
        content: `该品类下还有 ${category.itemCount} 个物品，请先处理这些物品后再删除品类。`,
        showCancel: false,
      });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: `确定要删除品类"${category.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          storage.deleteCategory(id);
          app.loadCategories();
          this.loadCategories();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      },
    });
  },

  onAddCategory() {
    wx.navigateTo({
      url: '/pages/category/edit',
    });
  },
});
