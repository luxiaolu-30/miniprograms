Component({
  properties: {
    current: {
      type: Number,
      value: 0,
    },
    total: {
      type: Number,
      value: 6,
    },
    showText: {
      type: Boolean,
      value: true,
    },
    color: {
      type: String,
      value: 'primary', // primary | success
    },
  },

  data: {
    percent: 0,
  },

  observers: {
    'current, total': function (current, total) {
      this.setData({
        percent: total > 0 ? Math.round((current / total) * 100) : 0,
      });
    },
  },
});
