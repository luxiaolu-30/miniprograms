/**
 * ============================================================================
 * 预设品类定义 - 小程序首次启动时自动创建
 * ============================================================================
 *
 * 【品类字段模板说明】
 *   每个品类含 fields 数组，定义该品类下物品的动态字段：
 *   - key        : 字段标识（唯一，用于 item.fields[key] 存取）
 *   - label      : 字段显示名称（表单标签）
 *   - type       : 字段类型（text | number | select | date）
 *   - options    : select 类型的选项列表
 *   - required   : 是否必填
 *   - sortOrder  : 字段排序权重（升序展示）
 *
 * 【预设品类】
 *   - cat_clothing  : 衣物（颜色/尺码/材质/季节/品牌/风格）
 *   - cat_book      : 书籍（作者/出版社/ISBN/页数/读完日期/评分）
 *   - cat_digital   : 数码藏品（品牌/型号/购买价格/序列号/保修期）
 *   - cat_souvenir  : 纪念品（来源/纪念事件/相关人物/情感价值）
 *
 * 【导出】
 *   presetCategories : Category[] 数组
 */

// 统一创建时间（模块加载时固定，保证同一批次品类时间一致）
const now = new Date().toISOString();

/**
 * 预设品类数组
 * 这些品类为系统内置（isBuiltIn: true），不可被用户删除
 */
const presetCategories = [
  {
    // 衣物品类 - 管理服装类物品
    id: 'cat_clothing',
    name: '衣物',
    icon: '👕',
    isBuiltIn: true,   // 系统内置，不可删除
    sortOrder: 0,      // 排序权重，越小越靠前
    createdAt: now,
    fields: [
      { key: 'color', label: '颜色', type: 'text', required: false, sortOrder: 0 },
      { key: 'size', label: '尺码', type: 'text', required: false, sortOrder: 1 },
      { key: 'material', label: '材质', type: 'text', required: false, sortOrder: 2 },
      { key: 'season', label: '季节', type: 'select', options: ['春', '夏', '秋', '冬', '四季'], required: false, sortOrder: 3 },
      { key: 'brand', label: '品牌', type: 'text', required: false, sortOrder: 4 },
      { key: 'style', label: '风格', type: 'select', options: ['休闲', '正式', '运动', '复古', '简约', '街头', '其他'], required: false, sortOrder: 5 },
    ],
  },
  {
    // 书籍品类 - 管理个人藏书
    id: 'cat_book',
    name: '书籍',
    icon: '📚',
    isBuiltIn: true,
    sortOrder: 1,
    createdAt: now,
    fields: [
      { key: 'author', label: '作者', type: 'text', required: false, sortOrder: 0 },
      { key: 'publisher', label: '出版社', type: 'text', required: false, sortOrder: 1 },
      { key: 'isbn', label: 'ISBN', type: 'text', required: false, sortOrder: 2 },
      { key: 'pages', label: '页数', type: 'number', required: false, sortOrder: 3 },
      { key: 'finishedDate', label: '读完日期', type: 'date', required: false, sortOrder: 4 },
      { key: 'rating', label: '评分', type: 'select', options: ['1', '2', '3', '4', '5'], required: false, sortOrder: 5 },
    ],
  },
  {
    // 数码藏品品类 - 管理电子设备、数码产品
    id: 'cat_digital',
    name: '数码藏品',
    icon: '📱',
    isBuiltIn: true,
    sortOrder: 2,
    createdAt: now,
    fields: [
      { key: 'brand', label: '品牌', type: 'text', required: false, sortOrder: 0 },
      { key: 'model', label: '型号', type: 'text', required: false, sortOrder: 1 },
      { key: 'purchasePrice', label: '购买价格', type: 'number', required: false, sortOrder: 2 },
      { key: 'serialNumber', label: '序列号', type: 'text', required: false, sortOrder: 3 },
      { key: 'warranty', label: '保修期至', type: 'date', required: false, sortOrder: 4 },
    ],
  },
  {
    // 纪念品类 - 管理有纪念意义的物品
    id: 'cat_souvenir',
    name: '纪念品',
    icon: '🎁',
    isBuiltIn: true,
    sortOrder: 3,
    createdAt: now,
    fields: [
      { key: 'source', label: '来源', type: 'text', required: false, sortOrder: 0 },
      { key: 'event', label: '纪念事件', type: 'text', required: false, sortOrder: 1 },
      { key: 'relatedPerson', label: '相关人物', type: 'text', required: false, sortOrder: 2 },
      { key: 'sentimentalValue', label: '情感价值', type: 'select', options: ['一般', '较重要', '非常重要', '无价'], required: false, sortOrder: 3 },
    ],
  },
];

module.exports = presetCategories;
