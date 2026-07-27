const app = getApp();
const storage = require('../../utils/storage.js');
const { formatDateTime } = require('../../utils/uuid.js');

Page({
  data: {
    item: null,
    category: null,
    fieldValues: [],
    showDisposeModal: false,
    showActionSheet: false,
  },

  onLoad(options) {
    if (options.id) {
      this.loadItem(options.id);
    }
  },

  onShow() {
    // 从编辑页返回时刷新
    if (this.data.item) {
      this.loadItem(this.data.item.id);
    }
  },

  loadItem(id) {
    const item = storage.getItem(id);
    if (!item) {
      wx.showToast({ title: '物品不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    const category = app.getCategoryById(item.categoryId);

    // 构建动态字段展示列表
    const fieldValues = [];
    if (category && category.fields) {
      category.fields.forEach(field => {
        const value = item.fields && item.fields[field.key];
        if (value !== undefined && value !== null && value !== '') {
          let displayValue = value;
          if (field.type === 'boolean') {
            displayValue = value ? '是' : '否';
          } else if (field.type === 'date') {
            displayValue = value;
          }
          fieldValues.push({
            label: field.label,
            value: displayValue,
          });
        }
      });
    }

    this.setData({
      item,
      category,
      fieldValues,
      formattedCreatedAt: formatDateTime(item.createdAt),
      formattedUpdatedAt: formatDateTime(item.updatedAt),
    });
  },

  /**
   * 图片预览
   */
  onPreviewImage(e) {
    const { index } = e.currentTarget.dataset;
    wx.previewImage({
      urls: this.data.item.images,
      current: this.data.item.images[index],
    });
  },

  /**
   * 编辑
   */
  onEdit() {
    wx.navigateTo({
      url: `/pages/item/edit?id=${this.data.item.id}`,
    });
  },

  /**
   * 标记闲置
   */
  onMarkIdle() {
    const item = { ...this.data.item, status: 'idle' };
    storage.saveItem(item);
    this.setData({ item });
    wx.showToast({ title: '已标记闲置', icon: 'success' });
  },

  /**
   * 标记在用
   */
  onMarkActive() {
    const item = { ...this.data.item, status: 'active' };
    storage.saveItem(item);
    this.setData({ item });
    wx.showToast({ title: '已恢复在用', icon: 'success' });
  },

  /**
   * 显示处理弹窗
   */
  onShowDispose() {
    this.setData({ showDisposeModal: true });
  },

  onHideDispose() {
    this.setData({ showDisposeModal: false });
  },

  /**
   * 确认处理
   */
  onDisposeConfirm(e) {
    const { disposeInfo } = e.detail;
    const item = {
      ...this.data.item,
      status: disposeInfo.method,
      disposeInfo,
    };
    storage.saveItem(item);
    this.setData({ item, showDisposeModal: false });
    wx.showToast({ title: '已处理', icon: 'success' });
  },

  /**
   * 删除
   */
  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除吗？',
      confirmColor: '#E74C3C',
      success: (res) => {
        if (res.confirm) {
          const imageUtil = require('../../utils/image.js');
          imageUtil.deleteImages(this.data.item.id);
          storage.deleteItem(this.data.item.id);
          wx.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1000);
        }
      },
    });
  },

  /**
   * 更多操作
   */
  onMoreAction() {
    const item = this.data.item;
    const buttons = [];

    if (item.status === 'active') {
      buttons.push({ text: '标记闲置', value: 'idle' });
    } else if (item.status === 'idle') {
      buttons.push({ text: '恢复在用', value: 'active' });
    }

    if (['active', 'idle'].includes(item.status)) {
      buttons.push({ text: '处理', value: 'dispose' });
    }

    buttons.push({ text: '删除', value: 'delete', destructive: true });

    wx.showActionSheet({
      itemList: buttons.map(b => b.text),
      success: (res) => {
        const action = buttons[res.tapIndex].value;
        if (action === 'idle') this.onMarkIdle();
        else if (action === 'active') this.onMarkActive();
        else if (action === 'dispose') this.onShowDispose();
        else if (action === 'delete') this.onDelete();
      },
    });
  },
});
