/**
 * ============================================================================
 * 物品详情页 - 物品信息展示、状态处理、删除
 * ============================================================================
 *
 * 【页面功能】
 *   - 展示物品完整信息：名称、图片、品类、动态字段、标签、备注等
 *   - 图片预览：点击图片可全屏预览
 *   - 状态流转：在用 <-> 闲置，处理（捐赠/转卖/丢弃/借出）
 *   - 编辑与删除：跳转到编辑页、删除物品（含图片清理）
 *
 * 【生命周期行为】
 *   - onLoad : 根据传入 id 加载物品数据
 *   - onShow : 从编辑页返回时刷新数据（保持信息最新）
 *
 * 【数据字段 (data)】
 *   - item          : 物品对象（完整数据）
 *   - category      : 关联的品类对象
 *   - fieldValues   : 动态字段展示列表（含 label 和 displayValue）
 *   - showDisposeModal : 处理弹窗显示状态
 *   - showActionSheet  : 操作菜单显示状态
 *   - formattedCreatedAt : 格式化后的创建时间
 *   - formattedUpdatedAt : 格式化后的更新时间
 *
 * 【页面路由参数 (options)】
 *   - id : 物品 ID（必传）
 *
 * 【物品状态流转】
 *   active(在用) <-> idle(闲置)
 *   active/idle -> donated(捐赠) / sold(转卖) / discarded(丢弃) / lent(借出)
 *
 * 【依赖】
 *   - storage.getItem(id)      : 获取物品数据
 *   - storage.saveItem(item)   : 保存物品
 *   - storage.deleteItem(id)   : 删除物品
 *   - imageUtil.deleteImages  : 删除物品关联的所有图片
 *   - formatDateTime          : 日期时间格式化工具
 */

const app = getApp();
const storage = require('../../utils/storage.js');
const { formatDateTime } = require('../../utils/uuid.js');

Page({
  data: {
    item: null,              // 物品对象
    category: null,          // 关联品类对象
    fieldValues: [],         // 动态字段展示列表
    showDisposeModal: false, // 处理弹窗显示状态
    showActionSheet: false,  // 操作菜单显示状态（保留字段，实际由 wx.showActionSheet 管理）
  },

  /**
   * 页面加载
   * 根据路由参数 id 加载物品数据
   * @param {Object} options - 路由参数
   * @param {string} options.id - 物品 ID
   */
  onLoad(options) {
    if (options.id) {
      this.loadItem(options.id);
    } else {
      // 🔧 修复：id 参数缺失时给出提示并返回，避免页面静默失败
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  /**
   * 页面显示时执行
   * 从编辑页返回时刷新数据，确保展示最新信息
   */
  onShow() {
    // 从编辑页返回时刷新（避免展示旧数据）
    if (this.data.item) {
      this.loadItem(this.data.item.id);
    }
  },

  /**
   * 加载物品数据
   * 获取物品信息和关联品类，构建动态字段展示列表
   * @param {string} id - 物品 ID
   */
  loadItem(id) {
    const item = storage.getItem(id);
    if (!item) {
      wx.showToast({ title: '物品不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    const category = app.getCategoryById(item.categoryId);

    // 构建动态字段展示列表：将字段模板与值配对，格式化展示
    const fieldValues = [];
    if (category && category.fields) {
      category.fields.forEach(field => {
        const value = item.fields && item.fields[field.key];
        // 仅展示有值的字段
        if (value !== undefined && value !== null && value !== '') {
          let displayValue = value;
          if (field.type === 'boolean') {
            displayValue = value ? '是' : '否'; // 布尔值转为中文
          } else if (field.type === 'date') {
            displayValue = value; // 日期保持原值
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
   * 图片预览（全屏查看）
   * @param {Object} e - 事件对象，e.currentTarget.dataset.index 为图片索引
   */
  onPreviewImage(e) {
    const { index } = e.currentTarget.dataset;
    wx.previewImage({
      urls: this.data.item.images,
      current: this.data.item.images[index],
    });
  },

  /**
   * 编辑 - 跳转到物品编辑页
   */
  onEdit() {
    wx.navigateTo({
      url: `/pages/item/edit?id=${this.data.item.id}`,
    });
  },

  /**
   * 标记闲置
   * 状态流转：active -> idle
   */
  onMarkIdle() {
    const item = { ...this.data.item, status: 'idle' };
    storage.saveItem(item);
    this.setData({ item });
    wx.showToast({ title: '已标记闲置', icon: 'success' });
  },

  /**
   * 标记在用
   * 状态流转：idle -> active
   */
  onMarkActive() {
    const item = { ...this.data.item, status: 'active' };
    storage.saveItem(item);
    this.setData({ item });
    wx.showToast({ title: '已恢复在用', icon: 'success' });
  },

  /**
   * 显示处理弹窗（选择处理方式：捐赠/转卖/丢弃/借出）
   */
  onShowDispose() {
    this.setData({ showDisposeModal: true });
  },

  /**
   * 隐藏处理弹窗
   */
  onHideDispose() {
    this.setData({ showDisposeModal: false });
  },

  /**
   * 确认处理
   * 状态流转：active/idle -> donated/sold/discarded/lent
   * @param {Object} e - 事件对象，e.detail.disposeInfo 含 method(处理方式) 等信息
   */
  onDisposeConfirm(e) {
    const { disposeInfo } = e.detail;
    const item = {
      ...this.data.item,
      status: disposeInfo.method, // 处理方式直接作为新状态
      disposeInfo,               // 保存处理详情（方式、日期、价格等）
    };
    storage.saveItem(item);
    this.setData({ item, showDisposeModal: false });
    wx.showToast({ title: '已处理', icon: 'success' });
  },

  /**
   * 删除物品
   * 流程：二次确认 -> 删除关联图片 -> 删除物品数据 -> 返回上一页
   * ⚠️ 注意：删除不可恢复
   */
  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除吗？',
      confirmColor: '#E74C3C', // 红色警示
      success: (res) => {
        if (res.confirm) {
          const imageUtil = require('../../utils/image.js');
          imageUtil.deleteImages(this.data.item.id); // 删除物品关联的所有图片文件
          storage.deleteItem(this.data.item.id);     // 删除物品数据
          wx.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1000);
        }
      },
    });
  },

  /**
   * 更多操作菜单
   * 根据当前物品状态动态生成可用操作：
   *   - 在用状态：可标记闲置
   *   - 闲置状态：可恢复在用
   *   - 在用/闲置：可处理
   *   - 任何状态：可删除
   */
  onMoreAction() {
    const item = this.data.item;
    const buttons = [];

    // 在用 <-> 闲置 状态切换
    if (item.status === 'active') {
      buttons.push({ text: '标记闲置', value: 'idle' });
    } else if (item.status === 'idle') {
      buttons.push({ text: '恢复在用', value: 'active' });
    }

    // 在用/闲置状态可进行处理操作
    if (['active', 'idle'].includes(item.status)) {
      buttons.push({ text: '处理', value: 'dispose' });
    }

    // 删除操作始终可用
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
      // 🔧 修复：添加 fail 回调，处理操作菜单调用失败的情况
      fail: (err) => {
        // 用户取消时 err.errMsg 包含 "cancel"，无需提示
        if (!err.errMsg || !err.errMsg.includes('cancel')) {
          console.warn('ActionSheet failed:', err);
        }
      },
    });
  },
});
