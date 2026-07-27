const app = getApp();
const storage = require('../../utils/storage.js');
const { formatDate } = require('../../utils/uuid.js');

const FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'donated', label: '捐赠' },
  { value: 'sold', label: '转卖' },
  { value: 'discarded', label: '丢弃' },
  { value: 'lent', label: '借出' },
];

Page({
  data: {
    items: [],
    filteredItems: [],
    filters: FILTERS,
    currentFilter: 'all',
  },

  onShow() {
    this.loadItems();
  },

  loadItems() {
    const items = app.getDisposedItems();

    // 按处理日期倒序
    items.sort((a, b) => {
      const dateA = a.disposeInfo ? new Date(a.disposeInfo.date) : new Date(0);
      const dateB = b.disposeInfo ? new Date(b.disposeInfo.date) : new Date(0);
      return dateB - dateA;
    });

    const itemsWithInfo = items.map(item => ({
      ...item,
      categoryName: app.getCategoryName(item.categoryId),
      categoryIcon: app.getCategoryIcon(item.categoryId),
      disposeDate: item.disposeInfo ? formatDate(item.disposeInfo.date) : '',
      disposePrice: item.disposeInfo && item.disposeInfo.price ? `¥${item.disposeInfo.price}` : '',
    }));

    this.setData({ items: itemsWithInfo });
    this.applyFilter();
  },

  applyFilter() {
    let result = this.data.items;
    if (this.data.currentFilter !== 'all') {
      result = result.filter(item => item.status === this.data.currentFilter);
    }
    this.setData({ filteredItems: result });
  },

  onFilterChange(e) {
    const { value } = e.currentTarget.dataset;
    this.setData({ currentFilter: value });
    this.applyFilter();
  },

  /**
   * 恢复物品
   */
  onRestore(e) {
    const { id } = e.currentTarget.dataset;
    const item = storage.getItem(id);

    wx.showModal({
      title: '恢复物品',
      content: '恢复后物品将重新出现在主列表，状态变为"在用"。',
      success: (res) => {
        if (res.confirm) {
          // 保存历史处理记录
          const previousDispose = item.previousDispose || [];
          previousDispose.unshift(item.disposeInfo);

          const updatedItem = {
            ...item,
            status: 'active',
            disposeInfo: null,
            previousDispose,
          };
          storage.saveItem(updatedItem);
          this.loadItems();
          wx.showToast({ title: '已恢复', icon: 'success' });
        }
      },
    });
  },

  /**
   * 查看详情
   */
  onViewDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/item/detail?id=${id}`,
    });
  },
});
