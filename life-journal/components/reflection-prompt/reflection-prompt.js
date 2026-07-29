/**
 * ============================================================================
 * 回顾引导卡片组件 - reflection-prompt
 * ============================================================================
 *
 * 用途：展示回顾引导问题和输入框，引导用户进行深度反思
 *
 * Properties：
 *   - prompt: 引导问题文本
 *   - reviewIndex: 回顾次数（1-6）
 *   - originalContent: 原始条目内容（对比展示）
 *   - existingReflection: 已有的回顾内容（编辑模式）
 *
 * Events：
 *   - submit: 提交回顾，传递 { reflection, rating }
 *   - skip: 跳过本次回顾
 */

const { RATING_LABELS } = require('../../utils/entry-type.js');

Component({
  properties: {
    prompt: {
      type: String,
      value: '',
    },
    reviewIndex: {
      type: Number,
      value: 1,
    },
    originalContent: {
      type: String,
      value: '',
    },
    existingReflection: {
      type: String,
      value: '',
    },
  },

  data: {
    reflection: '',
    rating: 0,
    ratingLabels: RATING_LABELS,
    showRating: false,
  },

  observers: {
    'existingReflection': function (val) {
      if (val) {
        this.setData({ reflection: val });
      }
    },
  },

  methods: {
    /**
     * 输入回顾内容
     */
    onReflectionInput(e) {
      this.setData({ reflection: e.detail.value });
    },

    /**
     * 选择认同度
     */
    onSelectRating(e) {
      const rating = Number(e.currentTarget.dataset.rating);
      this.setData({ rating });
    },

    /**
     * 提交回顾
     */
    onSubmit() {
      const { reflection, rating } = this.data;
      if (!reflection.trim()) {
        wx.showToast({ title: '写下你的思考吧', icon: 'none' });
        return;
      }
      if (rating === 0) {
        wx.showToast({ title: '给个认同度评分吧', icon: 'none' });
        return;
      }
      this.triggerEvent('submit', {
        reflection: reflection.trim(),
        rating,
      });
    },

    /**
     * 跳过本次
     */
    onSkip() {
      this.triggerEvent('skip');
    },
  },
});
