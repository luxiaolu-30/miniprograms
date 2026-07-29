/**
 * ============================================================================
 * 日记条目类型定义 - entry-type.js
 * ============================================================================
 *
 * 文件用途：
 *   定义日记条目的类型、心情、标签等常量配置。
 *   每种类型有不同的图标、颜色和引导提示。
 *
 * 条目类型：
 *   - insight    感悟    - 突然的领悟、灵感
 *   - decision   决定    - 做出的重要选择
 *   - goal       目标    - 设定的目标、计划
 *   - gratitude  感恩    - 值得感谢的人/事
 *   - lesson     教训    - 从错误中学到的
 *   - memory     记忆    - 值得珍藏的瞬间
 *   - experience 经历    - 一段特殊的经历
 *
 * 心情等级：
 *   😢 1-很难过  😕 2-不太好  😐 3-一般  🙂 4-不错  😄 5-很好
 * ============================================================================
 */

/**
 * 条目类型配置
 * 每种类型包含：key, label, icon, color, placeholder（输入提示）
 */
const ENTRY_TYPES = {
  insight: {
    key: 'insight',
    label: '感悟',
    icon: '💡',
    color: '#FAAD14',
    placeholder: '你突然想通了什么？有什么新的领悟？',
    prompt: '记录下这个灵感，未来回顾时看看它是否还闪光。',
  },
  decision: {
    key: 'decision',
    label: '决定',
    icon: '⚖️',
    color: '#1890FF',
    placeholder: '你做了一个什么决定？为什么？',
    prompt: '未来回顾时，看看这个决定带来了什么结果。',
  },
  goal: {
    key: 'goal',
    label: '目标',
    icon: '🎯',
    color: '#52C41A',
    placeholder: '你想达成什么？计划怎么做？',
    prompt: '定期回顾目标，看看进展如何，是否需要调整。',
  },
  gratitude: {
    key: 'gratitude',
    label: '感恩',
    icon: '🙏',
    color: '#EB2F96',
    placeholder: '今天想感谢谁/什么？为什么？',
    prompt: '感恩是最有力量的记录，回顾时会更温暖。',
  },
  lesson: {
    key: 'lesson',
    label: '教训',
    icon: '📝',
    color: '#E74C3C',
    placeholder: '你从什么经历中学到了什么？',
    prompt: '教训值得反复回顾，避免重复犯错。',
  },
  memory: {
    key: 'memory',
    label: '记忆',
    icon: '📸',
    color: '#722ED1',
    placeholder: '想珍藏什么样的瞬间？发生了什么？',
    prompt: '美好的记忆，回顾时会带来微笑。',
  },
  experience: {
    key: 'experience',
    label: '经历',
    icon: '🌟',
    color: '#FA8C16',
    placeholder: '经历了什么特别的事？感受如何？',
    prompt: '每段经历都是独一无二的，值得被记住。',
  },
};

/**
 * 心情等级配置
 */
const MOOD_LEVELS = [
  { value: 1, emoji: '😢', label: '很难过' },
  { value: 2, emoji: '😕', label: '不太好' },
  { value: 3, emoji: '😐', label: '一般' },
  { value: 4, emoji: '🙂', label: '不错' },
  { value: 5, emoji: '😄', label: '很好' },
];

/**
 * 认同度评分标签（用于回顾时评价）
 */
const RATING_LABELS = {
  1: '完全不认同了',
  2: '有些变化',
  3: '基本还成立',
  4: '依然很有感触',
  5: '已经成为信念',
};

/**
 * 获取所有类型列表（用于选择器）
 * @returns {object[]} 类型数组
 */
function getTypeList() {
  return Object.values(ENTRY_TYPES);
}

/**
 * 根据 key 获取类型配置
 * @param {string} key - 类型 key
 * @returns {object} 类型配置对象
 */
function getTypeConfig(key) {
  return ENTRY_TYPES[key] || ENTRY_TYPES.insight;
}

/**
 * 获取心情配置
 * @param {number} value - 心情值 1-5
 * @returns {object} 心情配置
 */
function getMoodConfig(value) {
  return MOOD_LEVELS.find(m => m.value === value) || MOOD_LEVELS[2];
}

module.exports = {
  ENTRY_TYPES,
  MOOD_LEVELS,
  RATING_LABELS,
  getTypeList,
  getTypeConfig,
  getMoodConfig,
};
