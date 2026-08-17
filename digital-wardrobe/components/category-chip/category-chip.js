/**
 * ============================================================================
 * 分类标签组件（category-chip）
 * ============================================================================
 *
 * 组件用途：
 *   横向滚动的分类筛选标签栏，顶部固定一个"全部"标签
 *   用于物品列表页的分类筛选功能
 *
 * 对外暴露的 properties：
 *   - {Array} categories - 分类数据数组，每项包含 id/name/icon
 *   - {String} selectedId - 当前选中的分类 ID，默认 'all'
 *   - {Object} counts - 各分类的物品数量映射 { [categoryId]: number }，可选
 *
 * 对外暴露的 events：
 *   - select - 点击标签时触发，detail: { id: string }
 *
 * ⚠️ 审查意见：
 *   - count 字段优先取外部传入的 counts 映射，未传则为 null
 *   - selectedId 为单向传入，组件内部不维护选中状态，由父组件通过样式类控制
 * ============================================================================
 */

Component({
  /**
   * 组件属性（properties）
   * @property {Array} categories - 分类数据源数组
   * @property {String} selectedId - 当前选中的分类标识，'all' 表示全部
   * @property {Object} counts - 各分类的物品数量映射 { [categoryId]: number }，可选
   */
  properties: {
    categories: {
      type: Array,
      value: [],
    },
    selectedId: {
      type: String,
      value: 'all',
    },
    // 🔧 修复：新增 counts 属性，支持父组件传入各分类数量
    counts: {
      type: Object,
      value: null,
    },
  },

  /**
   * 组件内部数据（data）
   * @property {Array} chipList - 渲染用的标签列表，包含"全部"+各分类
   */
  data: {
    chipList: [],
  },

  /**
   * 数据监听器（observers）
   * 🔧 修复：监听 categories 和 counts 变化，重新构建标签列表
   */
  observers: {
    'categories, counts': function (categories, counts) {
      this.buildChipList(categories, counts);
    },
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    /**
     * 组件挂载到页面时
     * 使用初始 categories 数据构建标签列表
     */
    attached() {
      this.buildChipList(this.data.categories, this.data.counts);
    },
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 构建标签列表
     * 在分类列表头部插入"全部"标签
     * 🔧 修复：优先从 counts 映射中取数量，未传则 count 为 null
     * @param {Array} categories - 原始分类数据
     * @param {Object|null} counts - 分类数量映射 { [categoryId]: number }
     */
    buildChipList(categories, counts) {
      const getCount = (id) => {
        if (counts && typeof counts[id] === 'number') return counts[id];
        return null;
      };
      // 构造"全部"标签
      const allChip = { id: 'all', name: '全部', icon: '📋', count: getCount('all') };
      // 将分类数据转换为标签格式
      const catChips = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        count: getCount(cat.id),
      }));
      // 合并标签列表
      this.setData({ chipList: [allChip, ...catChips] });
    },

    /**
     * 标签点击事件
     * @param {Object} e - 事件对象，e.currentTarget.dataset.id 为标签 ID
     */
    onSelect(e) {
      const { id } = e.currentTarget.dataset;
      // 通知父组件选中分类变化
      this.triggerEvent('select', { id });
    },
  },
});
