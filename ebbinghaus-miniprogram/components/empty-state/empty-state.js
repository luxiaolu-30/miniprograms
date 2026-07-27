Component({
  properties: {
    icon: {
      type: String,
      value: '📭',
    },
    title: {
      type: String,
      value: '暂无内容',
    },
    hint: {
      type: String,
      value: '',
    },
    showAction: {
      type: Boolean,
      value: false,
    },
    actionText: {
      type: String,
      value: '去添加',
    },
  },

  methods: {
    onAction() {
      this.triggerEvent('action');
    },
  },
});
