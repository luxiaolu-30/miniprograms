Component({
  properties: {
    fields: {
      type: Array,
      value: [],
    },
    values: {
      type: Object,
      value: {},
    },
  },

  data: {
    formData: {},
  },

  observers: {
    'values': function (values) {
      this.setData({ formData: { ...(values || {}) } });
    },
  },

  methods: {
    onTextChange(e) {
      const { key } = e.currentTarget.dataset;
      this.updateField(key, e.detail.value);
    },

    onNumberChange(e) {
      const { key } = e.currentTarget.dataset;
      this.updateField(key, e.detail.value);
    },

    onSelectChange(e) {
      const { key } = e.currentTarget.dataset;
      this.updateField(key, e.detail.value);
    },

    onDateChange(e) {
      const { key } = e.currentTarget.dataset;
      this.updateField(key, e.detail.value);
    },

    onBooleanChange(e) {
      const { key } = e.currentTarget.dataset;
      this.updateField(key, e.detail.value);
    },

    updateField(key, value) {
      const formData = { ...this.data.formData, [key]: value };
      this.setData({ formData });
      this.triggerEvent('change', { key, value, formData });
    },

    /**
     * 获取当前表单数据
     */
    getFormData() {
      return { ...this.data.formData };
    },
  },
});
