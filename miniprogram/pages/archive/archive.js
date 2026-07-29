/**
 * ============================================================================
 * 归档页 - 已处理物品列表与恢复
 * ============================================================================
 *
 * 【页面功能】
 *   - 展示所有已处理的物品（捐赠/转卖/丢弃/借出）
 *   - 按处理类型筛选
 *   - 按处理日期倒序排列
 *   - 支持恢复物品（恢复到在用状态，保留历史处理记录）
 *
 * 【生命周期行为】
 *   - onShow : 每次进入页面重新加载已处理物品列表
 *
 * 【数据字段 (data)】
 *   - items          : 已处理物品列表（含 categoryName/categoryIcon/disposeDate/disposePrice）
 *   - filteredItems  : 筛选后的物品列表
 *   - filters        : 筛选选项列表（全部/捐赠/转卖/丢弃/借出）
 *   - currentFilter  : 当前筛选条件（默认 'all'）
 *
 * 【页面路由参数 (options)】
 *   - 无
 *
 * 【恢复逻辑】
 *   - 状态从 donated/sold/discarded/lent 恢复为 active
 *   - 当前 disposeInfo 移入 previousDispose 历史数组
 *   - 恢复后物品重新出现在首页主列表
 *
 * 【依赖】
 *   - app.getDisposedItems() : 获取所有已处理物品
 *   - storage.saveItem(item) : 保存物品
 *   - formatDate             : 日期格式化工具
 */

const app = getApp();
const storage = require('../../utils/storage.js');
const { formatDate } = require('../../utils/uuid.js');

/**
 * 处理类型筛选选项
 * 对应物品状态：donated(捐赠) / sold(转卖) / discarded(丢弃) / lent(借出)
 */
const FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'donated', label: '捐赠' },
  { value: 'sold', label: '转卖' },
  { value: 'discarded', label: '丢弃' },
  { value: 'lent', label: '借出' },
];

Page({
  data: {
    items: [],              // 已处理物品列表（含展示附加字段）
    filteredItems: [],      // 筛选后的物品列表
    filters: FILTERS,       // 筛选选项（供模板渲染）
    currentFilter: 'all',   // 当前筛选条件（默认：全部）
  },

  /**
   * 页面显示时执行
   * 重新加载已处理物品列表，确保数据最新
   */
  onShow() {
    this.loadItems();
  },

  /**
   * 加载已处理物品列表
   * 从全局数据获取已处理物品，按处理日期倒序排列，补充展示字段
   */
  loadItems() {
    const items = app.getDisposedItems(); // 获取所有已处理物品

    // 按处理日期倒序排列（最新处理的在前）
    items.sort((a, b) => {
      const dateA = a.disposeInfo ? new Date(a.disposeInfo.date) : new Date(0);
      const dateB = b.disposeInfo ? new Date(b.disposeInfo.date) : new Date(0);
      return dateB - dateA;
    });

    // 补充展示字段：品类名称、品类图标、处理日期、处理价格
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

  /**
   * 应用筛选条件
   * 根据当前筛选类型过滤物品列表
   */
  applyFilter() {
    let result = this.data.items;
    if (this.data.currentFilter !== 'all') {
      result = result.filter(item => item.status === this.data.currentFilter);
    }
    this.setData({ filteredItems: result });
  },

  /**
   * 筛选条件变化
   * @param {Object} e - 事件对象，e.currentTarget.dataset.value 为筛选值
   */
  onFilterChange(e) {
    const { value } = e.currentTarget.dataset;
    this.setData({ currentFilter: value });
    this.applyFilter();
  },

  /**
   * 恢复物品
   * 将已处理物品恢复到在用状态，当前处理信息移入历史记录
   * @param {Object} e - 事件对象，e.currentTarget.dataset.id 为物品 ID
   */
  onRestore(e) {
    const { id } = e.currentTarget.dataset;
    const item = storage.getItem(id);

    // 🔧 修复：添加 item 不存在时的防护，避免空指针访问
    if (!item) {
      wx.showToast({ title: '物品不存在', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '恢复物品',
      content: '恢复后物品将重新出现在主列表，状态变为"在用"。',
      success: (res) => {
        if (res.confirm) {
          // 将当前处理信息移入历史处理记录数组（便于追溯）
          const previousDispose = item.previousDispose || [];
          previousDispose.unshift(item.disposeInfo);

          const updatedItem = {
            ...item,
            status: 'active',            // 恢复为在用状态
            disposeInfo: null,           // 清空当前处理信息
            previousDispose,             // 保留历史处理记录
          };
          storage.saveItem(updatedItem);
          this.loadItems();            // 刷新列表（恢复后物品不再属于已处理）
          wx.showToast({ title: '已恢复', icon: 'success' });
        }
      },
    });
  },

  /**
   * 查看详情 - 跳转到物品详情页
   * @param {Object} e - 事件对象，e.currentTarget.dataset.id 为物品 ID
   */
  onViewDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/item/detail?id=${id}`,
    });
  },
});
