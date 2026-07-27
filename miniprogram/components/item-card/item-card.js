Component({
  properties: {
    item: {
      type: Object,
      value: {},
    },
    viewMode: {
      type: String,
      value: 'grid', // 'grid' | 'list'
    },
    categoryName: {
      type: String,
      value: '',
    },
    categoryIcon: {
      type: String,
      value: '📦',
    },
    imagePath: {
      type: String,
      value: '',
    },
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', { id: this.data.item.id });
    },
  },
});
