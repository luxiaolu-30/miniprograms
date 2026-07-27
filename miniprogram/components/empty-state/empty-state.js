Component({
  properties: {
    icon: {
      type: String,
      value: '👕',
    },
    title: {
      type: String,
      value: '还没有物品',
    },
    desc: {
      type: String,
      value: '点击下方按钮开始录入你的第一件物品吧',
    },
    showAction: {
      type: Boolean,
      value: true,
    },
    actionText: {
      type: String,
      value: '立即录入',
    },
  },

  methods: {
    onAction() {
      this.triggerEvent('action');
    },
  },
});
