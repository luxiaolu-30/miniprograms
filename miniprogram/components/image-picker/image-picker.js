const imageUtil = require('../../utils/image.js');

Component({
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

  data: {
    localImages: [],
  },

  observers: {
    'images': function (images) {
      this.setData({ localImages: [...(images || [])] });
    },
  },

  methods: {
    /**
     * 选择图片
     */
    async onChooseImage() {
      const remain = this.data.maxCount - this.data.localImages.length;
      if (remain <= 0) {
        wx.showToast({ title: `最多${this.data.maxCount}张图片`, icon: 'none' });
        return;
      }

      try {
        wx.showLoading({ title: '处理中...' });
        const tempPaths = await imageUtil.chooseImages(remain);

        // 压缩图片
        const compressedPaths = [];
        for (const path of tempPaths) {
          const compressed = await imageUtil.compressImage(path);
          compressedPaths.push(compressed);
        }

        const newImages = [...this.data.localImages, ...compressedPaths];
        this.setData({ localImages: newImages });
        this.triggerEvent('change', { images: newImages });
      } catch (e) {
        if (e.errMsg && e.errMsg.includes('cancel')) {
          // 用户取消，忽略
        } else {
          wx.showToast({ title: '选择图片失败', icon: 'none' });
        }
      } finally {
        wx.hideLoading();
      }
    },

    /**
     * 删除图片
     */
    onDeleteImage(e) {
      const { index } = e.currentTarget.dataset;
      const newImages = this.data.localImages.filter((_, i) => i !== index);
      this.setData({ localImages: newImages });
      this.triggerEvent('change', { images: newImages });
    },

    /**
     * 预览图片
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
     */
    onDragStart(e) {
      this.dragIndex = e.currentTarget.dataset.index;
    },

    /**
     * 拖拽排序结束
     */
    onDragEnd(e) {
      const dragToIndex = e.currentTarget.dataset.index;
      if (this.dragIndex === undefined || this.dragIndex === dragToIndex) return;

      const images = [...this.data.localImages];
      const [moved] = images.splice(this.dragIndex, 1);
      images.splice(dragToIndex, 0, moved);

      this.setData({ localImages: images });
      this.triggerEvent('change', { images });
      this.dragIndex = undefined;
    },
  },
});
