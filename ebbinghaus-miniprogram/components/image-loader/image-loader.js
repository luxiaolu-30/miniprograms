Component({
  properties: {
    src: {
      type: String,
      value: '',
    },
    mode: {
      type: String,
      value: 'aspectFill',
    },
    lazyLoad: {
      type: Boolean,
      value: true,
    },
  },

  data: {
    loaded: false,
    error: false,
  },

  methods: {
    onLoad() {
      this.setData({ loaded: true });
    },
    onError() {
      this.setData({ error: true });
    },
  },
});
