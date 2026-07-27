const { now } = require('../../utils/uuid.js');

const METHODS = [
  { value: 'donated', label: '捐赠', icon: '💝' },
  { value: 'sold', label: '转卖', icon: '💰' },
  { value: 'discarded', label: '丢弃', icon: '🗑️' },
  { value: 'lent', label: '借出', icon: '🤝' },
];

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    methods: METHODS,
    selectedMethod: '',
    date: '',
    price: '',
    note: '',
  },

  observers: {
    'visible': function (visible) {
      if (visible) {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        this.setData({
          selectedMethod: '',
          date: dateStr,
          price: '',
          note: '',
        });
      }
    },
  },

  methods: {
    onSelectMethod(e) {
      const { method } = e.currentTarget.dataset;
      this.setData({ selectedMethod: method });
    },

    onDateChange(e) {
      this.setData({ date: e.detail.value });
    },

    onPriceInput(e) {
      this.setData({ price: e.detail.value });
    },

    onNoteInput(e) {
      this.setData({ note: e.detail.value });
    },

    onCancel() {
      this.triggerEvent('cancel');
    },

    onConfirm() {
      if (!this.data.selectedMethod) {
        wx.showToast({ title: '请选择处理方式', icon: 'none' });
        return;
      }

      if (this.data.selectedMethod === 'sold' && !this.data.price) {
        wx.showToast({ title: '请输入转卖价格', icon: 'none' });
        return;
      }

      const disposeInfo = {
        method: this.data.selectedMethod,
        date: new Date(this.data.date).toISOString(),
        note: this.data.note.trim(),
      };

      if (this.data.selectedMethod === 'sold') {
        disposeInfo.price = Number(this.data.price);
      }

      this.triggerEvent('confirm', { disposeInfo });
    },
  },
});
