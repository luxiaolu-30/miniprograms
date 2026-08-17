/**
 * ============================================================================
 * 图片选择器组件（image-picker）
 * ============================================================================
 *
 * 组件用途：
 *   提供图片选择、压缩、预览、删除和拖拽排序功能
 *   用于物品录入/编辑页面中的图片管理
 *
 * 对外暴露的 properties：
 *   - {Array} images - 初始图片路径数组
 *   - {Number} maxCount - 最大可选图片数量，默认 9
 *
 * 对外暴露的 events：
 *   - change - 图片列表变化时触发，detail: { images: Array }
 *
 * 依赖关系：
 *   - ../../utils/image.js - 图片处理工具（选择、压缩）
 *
 * ⚠️ 审查意见：
 *   - dragIndex 使用组件实例属性（非 data），不会触发视图更新，这是合理的
 * ============================================================================
 */

const imageUtil = require('../../utils/image.js');

Component({
  /**
   * 组件属性（properties）
   * @property {Array} images - 外部传入的初始图片路径数组
   * @property {Number} maxCount - 允许选择的最大图片数量，默认 9 张
   */
  properties: {
    images: {
      type: Array,
      value: [],
    },
    maxCount: {
      type: Number,
      value: 9,
    },
  },

  /**
   * 组件内部数据（data）
   * @property {Array} localImages - 组件内部维护的图片路径副本，用于编辑操作
   */
  data: {
    localImages: [],
  },

  /**
   * 数据监听器（observers）
   * 监听外部传入的 images 变化，同步到内部 localImages
   */
  observers: {
    'images': function (images) {
      // 使用展开运算符创建新数组，避免引用问题
      this.setData({ localImages: [...(images || [])] });
    },
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 选择图片
     * 检查剩余可选数量 -> 调用微信选图 -> 逐张压缩 -> 更新列表 -> 触发 change 事件
     * 用户取消时不显示错误提示
     */
    async onChooseImage() {
      // 计算剩余可选图片数量
      const remain = this.data.maxCount - this.data.localImages.length;
      if (remain <= 0) {
        wx.showToast({ title: `最多${this.data.maxCount}张图片`, icon: 'none' });
        return;
      }

      try {
        wx.showLoading({ title: '处理中...' });
        // 调用微信 API 选择图片
        const tempPaths = await imageUtil.chooseImages(remain);

        // 逐张压缩图片，减少存储占用
        const compressedPaths = [];
        for (const path of tempPaths) {
          const compressed = await imageUtil.compressImage(path);
          compressedPaths.push(compressed);
        }

        // 合并新旧图片列表
        const newImages = [...this.data.localImages, ...compressedPaths];
        this.setData({ localImages: newImages });
        // 通知父组件图片列表已变化
        this.triggerEvent('change', { images: newImages });
      } catch (e) {
        if (e.errMsg && e.errMsg.includes('cancel')) {
          // 用户主动取消选择，静默忽略
        } else {
          wx.showToast({ title: '选择图片失败', icon: 'none' });
        }
      } finally {
        wx.hideLoading();
      }
    },

    /**
     * 删除指定索引的图片
     * @param {Object} e - 事件对象，e.currentTarget.dataset.index 为图片索引
     */
    onDeleteImage(e) {
      const { index } = e.currentTarget.dataset;
      // 过滤掉指定索引的图片
      const newImages = this.data.localImages.filter((_, i) => i !== index);
      this.setData({ localImages: newImages });
      // 通知父组件图片列表已变化
      this.triggerEvent('change', { images: newImages });
    },

    /**
     * 预览图片（支持滑动切换）
     * @param {Object} e - 事件对象，e.currentTarget.dataset.index 为当前图片索引
     */
    onPreviewImage(e) {
      const { index } = e.currentTarget.dataset;
      wx.previewImage({
        urls: this.data.localImages,
        current: this.data.localImages[index],
      });
    },

    /**
     * 拖拽排序开始
     * 记录被拖拽图片的起始索引
     * @param {Object} e - 事件对象，e.currentTarget.dataset.index 为拖拽起始索引
     */
    onDragStart(e) {
      this.dragIndex = e.currentTarget.dataset.index;
    },

    /**
     * 拖拽排序结束
     * 根据起始和目标索引重新排列图片数组
     * @param {Object} e - 事件对象，e.currentTarget.dataset.index 为拖拽目标索引
     */
    onDragEnd(e) {
      const dragToIndex = e.currentTarget.dataset.index;
      // 无效拖拽（未移动或位置不变）直接返回
      if (this.dragIndex === undefined || this.dragIndex === dragToIndex) return;

      // 从数组中移除原位置元素，插入到新位置
      const images = [...this.data.localImages];
      const [moved] = images.splice(this.dragIndex, 1);
      images.splice(dragToIndex, 0, moved);

      this.setData({ localImages: images });
      // 通知父组件图片列表已变化
      this.triggerEvent('change', { images });
      // 清除拖拽状态
      this.dragIndex = undefined;
    },
  },
});
