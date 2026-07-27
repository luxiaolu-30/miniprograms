Component({
  properties: {
    value: {
      type: String,
      value: '',
    },
    placeholder: {
      type: String,
      value: '搜索物品名称、标签...',
    },
  },

  data: {
    focused: false,
  },

  methods: {
    onInput(e) {
      this.triggerEvent('search', { value: e.detail.value });
    },

    onFocus() {
      this.setData({ focused: true });
    },

    onBlur() {
      this.setData({ focused: false });
    },

    onClear() {
      this.triggerEvent('search', { value: '' });
      this.triggerEvent('clear');
    },
  },
});
