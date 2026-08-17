/**
 * ============================================================================
 * 搜索栏组件（search-bar）
 * ============================================================================
 *
 * 组件用途：
 *   提供文本输入搜索功能，支持聚焦状态变化和一键清除
 *   用于物品列表页的顶部搜索区域
 *
 * 对外暴露的 properties：
 *   - {String} value - 当前搜索文本值
 *   - {String} placeholder - 输入框占位提示文字
 *   - {Number} debounce - 输入防抖延迟（毫秒），默认 0 不防抖
 *
 * 对外暴露的 events：
 *   - search - 输入内容变化时触发（含清除），detail: { value: string }
 *   - clear - 点击清除按钮时触发（search 之后额外触发）
 *
 * ⚠️ 审查意见：
 *   - 搜索逻辑由父组件实现（如过滤），组件本身不缓存搜索结果
 *   - 🔧 修复：内置可选防抖，设置 debounce > 0 即可启用，避免父组件重复实现
 * ============================================================================
 */

Component({
  /**
   * 组件属性（properties）
   * @property {String} value - 搜索框当前文本值（受控）
   * @property {String} placeholder - 输入框占位提示，默认"搜索物品名称、标签..."
   * @property {Number} debounce - 输入防抖延迟（毫秒），默认 0 不防抖
   */
  properties: {
    value: {
      type: String,
      value: '',
    },
    placeholder: {
      type: String,
      value: '搜索物品名称、标签...',
    },
    // 🔧 修复：新增 debounce 属性，支持内置输入防抖
    debounce: {
      type: Number,
      value: 0,
    },
  },

  /**
   * 组件内部数据（data）
   * @property {Boolean} focused - 输入框是否聚焦，用于样式切换
   */
  data: {
    focused: false,
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 输入事件处理
     * 🔧 修复：支持内置防抖，debounce > 0 时延迟触发 search 事件
     * @param {Object} e - 事件对象，e.detail.value 为当前输入值
     */
    onInput(e) {
      const value = e.detail.value;
      // 清除上一次未执行的防抖定时器
      if (this._debounceTimer) {
        clearTimeout(this._debounceTimer);
      }
      if (this.data.debounce > 0) {
        // 防抖模式：延迟触发
        this._debounceTimer = setTimeout(() => {
          this.triggerEvent('search', { value });
          this._debounceTimer = null;
        }, this.data.debounce);
      } else {
        // 无防抖：立即触发
        this.triggerEvent('search', { value });
      }
    },

    /**
     * 聚焦事件处理
     * 更新聚焦状态，可触发样式变化（如高亮边框）
     */
    onFocus() {
      this.setData({ focused: true });
    },

    /**
     * 失焦事件处理
     * 恢复默认聚焦状态
     */
    onBlur() {
      this.setData({ focused: false });
    },

    /**
     * 清除搜索内容
     * 先触发 search 事件将值置空，再触发 clear 事件供父组件做额外处理
     */
    onClear() {
      this.triggerEvent('search', { value: '' });
      this.triggerEvent('clear');
    },
  },
});
