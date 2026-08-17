/**
 * ============================================================================
 * 物品卡片组件（item-card）
 * ============================================================================
 *
 * 组件用途：
 *   展示单件衣物的卡片视图，支持网格和列表两种显示模式
 *   用于物品列表页的卡片渲染
 *
 * 对外暴露的 properties：
 *   - {Object} item - 物品数据对象，必须包含 id 字段
 *   - {String} viewMode - 显示模式：'grid' 网格 | 'list' 列表
 *   - {String} categoryName - 分类名称（显示用，避免组件内查询）
 *   - {String} categoryIcon - 分类图标（emoji）
 *   - {String} imagePath - 封面图片路径（为空时自动取 item.images[0]）
 *
 * 对外暴露的 events：
 *   - tap - 点击卡片时触发，detail: { id: string }
 *
 * ⚠️ 审查意见：
 *   - item 缺少 id 时点击不会触发事件，并输出 warn 提示
 *   - imagePath 优先，为空时自动 fallback 到 item.images[0]，消除冗余
 *   - categoryName/categoryIcon 由父组件传入而非组件内查询，这是性能优化考量
 * ============================================================================
 */

Component({
  /**
   * 组件属性（properties）
   * @property {Object} item - 物品完整数据对象
   * @property {String} viewMode - 视图模式，'grid' 或 'list'
   * @property {String} categoryName - 分类显示名称
   * @property {String} categoryIcon - 分类图标（emoji）
   * @property {String} imagePath - 封面图片本地路径
   */
  properties: {
    item: {
      type: Object,
      value: {},
    },
    viewMode: {
      type: String,
      value: 'grid', // 'grid' 网格视图 | 'list' 列表视图
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

  /**
   * 组件内部数据（data）
   * @property {String} coverImage - 计算后的封面图路径（imagePath 优先，fallback 到 item.images[0]）
   */
  data: {
    coverImage: '',
  },

  /**
   * 数据监听器（observers）
   * 🔧 修复：监听 imagePath 和 item.images 变化，自动计算封面图
   * 优先使用 imagePath，为空时 fallback 到 item.images[0]
   */
  observers: {
    'imagePath, item.images': function (imagePath, images) {
      const cover = imagePath || (Array.isArray(images) && images.length > 0 ? images[0] : '');
      this.setData({ coverImage: cover });
    },
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 卡片点击事件
     * 传递物品 ID 给父组件进行跳转详情等操作
     * 🔧 修复：item 缺少 id 时不触发事件，并输出 warn 提示
     */
    onTap() {
      const id = this.data.item && this.data.item.id;
      if (!id) {
        console.warn('[item-card] item 缺少 id 字段，无法触发 tap 事件');
        return;
      }
      this.triggerEvent('tap', { id });
    },
  },
});
