Component({
  properties: {
    categories: {
      type: Array,
      value: [],
    },
    selectedId: {
      type: String,
      value: 'all',
    },
  },

  data: {
    chipList: [],
  },

  observers: {
    'categories': function (categories) {
      this.buildChipList(categories);
    },
  },

  lifetimes: {
    attached() {
      this.buildChipList(this.data.categories);
    },
  },

  methods: {
    buildChipList(categories) {
      const allChip = { id: 'all', name: '全部', icon: '📋', count: null };
      const catChips = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        count: null,
      }));
      this.setData({ chipList: [allChip, ...catChips] });
    },

    onSelect(e) {
      const { id } = e.currentTarget.dataset;
      this.triggerEvent('select', { id });
    },
  },
});
