const STATUS_MAP = {
  active: { label: '在用', color: '#27AE60', bg: '#E8F5E9' },
  idle: { label: '闲置', color: '#999999', bg: '#F0F0F0' },
  donated: { label: '已捐赠', color: '#3498DB', bg: '#E3F2FD' },
  sold: { label: '已转卖', color: '#E67E22', bg: '#FFF3E0' },
  discarded: { label: '已丢弃', color: '#95A5A6', bg: '#F5F5F5' },
  lent: { label: '已借出', color: '#9B59B6', bg: '#F3E5F5' },
};

Component({
  properties: {
    status: {
      type: String,
      value: 'active',
    },
  },

  data: {
    text: '',
    color: '',
    bg: '',
  },

  observers: {
    'status': function (status) {
      const info = STATUS_MAP[status] || STATUS_MAP.active;
      this.setData({
        text: info.label,
        color: info.color,
        bg: info.bg,
      });
    },
  },
});
