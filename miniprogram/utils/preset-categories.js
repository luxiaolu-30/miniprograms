/**
 * 预设品类定义
 * 首次启动时自动创建
 */

function generateId() {
  return 'cat_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

const now = new Date().toISOString();

const presetCategories = [
  {
    id: 'cat_clothing',
    name: '衣物',
    icon: '👕',
    isBuiltIn: true,
    sortOrder: 0,
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
