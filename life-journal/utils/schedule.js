/**
 * ============================================================================
 * 间隔回顾算法 - schedule.js（核心算法）
 * ============================================================================
 *
 * 文件用途：
 *   基于艾宾浩斯遗忘曲线实现日记条目的间隔回顾计划生成、查询、统计。
 *   与知识复习的区别：回顾的目的是"反思"而非"记忆"，强调对比思考。
 *
 * 主要导出函数/常量：
 *   - REVIEW_INTERVALS: 间隔天数常量 [1, 2, 4, 7, 15, 30]
 *   - generateReflections(): 生成 6 次回顾计划
 *   - getTodayReflections(): 获取今日待回顾列表（含逾期）
 *   - getDateReflections(): 获取指定日期的待回顾列表
 *   - getReflectionCountByDate(): 按日期分组统计待回顾数量
 *   - getMonthStats(): 获取月统计信息
 *   - recalculateReflections(): 重新计算回顾计划
 *   - isFullyReflected(): 检查条目是否已完成全部回顾
 *   - getReviewProgress(): 获取回顾进度
 *   - formatDate() / daysBetween(): 日期辅助函数
 *
 * 间隔算法说明：
 *   ┌──────────┬──────────────┬──────────────┬──────────────────────────┐
 *   │ 回顾次数  │ 距上次(天)    │ 累计(天)      │ 回顾重点                  │
 *   ├──────────┼──────────────┼──────────────┼──────────────────────────┤
 *   │ 第1次    │ +1           │ 第1天        │ 回顾：当时怎么想？         │
 *   │ 第2次    │ +2           │ 第3天        │ 对比：想法有变化吗？       │
 *   │ 第3次    │ +4           │ 第7天        │ 反思：一周后怎么看？       │
 *   │ 第4次    │ +7           │ 第14天       │ 深化：有什么新理解？       │
 *   │ 第5次    │ +15          │ 第29天       │ 检验：这个感悟还成立吗？   │
 *   │ 第6次    │ +30          │ 第59天       │ 内化：已经成为信念了吗？   │
 *   └──────────┴──────────────┴──────────────┴──────────────────────────┘
 *
 * 回顾状态流转：
 *   pending ──完成回顾──→ done
 *   pending ──跳过──────→ skipped
 *
 * 条目状态流转：
 *   active ──6次回顾全部完成──→ internalized（已内化）
 *   active ──主动归档────────→ archived
 * ============================================================================
 */

const { generateId } = require('./uuid.js');

/**
 * 艾宾浩斯间隔天数（距上次的天数）
 * 累计天数 = [1, 3, 7, 14, 29, 59]
 */
const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

/**
 * 每次回顾的引导问题
 * 间隔越长，问题越深入，促进元认知
 */
const REVIEW_PROMPTS = [
  '回顾：当时你为什么这样想？现在读起来有什么感受？',
  '对比：这一两天过去，你对这件事的想法有变化吗？',
  '反思：一周过去了，你有了什么新的视角或理解？',
  '深化：这个感悟对你后来的行为产生了什么影响？',
  '检验：一个月了，这个想法/决定是否还成立？有没有反转？',
  '内化：快两个月了，这已经成为你的一部分了吗？',
];

/**
 * 生成回顾计划（核心函数）
 * @param {string} entryId - 条目 ID
 * @param {string} entryTitle - 条目标题
 * @param {string} createdAt - ISO 格式的创建日期
 * @returns {object[]} 6 条回顾计划
 */
function generateReflections(entryId, entryTitle, createdAt) {
  const baseDate = new Date(createdAt);
  let cumulativeDays = 0;

  return REVIEW_INTERVALS.map((interval, index) => {
    cumulativeDays += interval;
    const scheduledDate = new Date(baseDate);
    scheduledDate.setDate(scheduledDate.getDate() + cumulativeDays);

    return {
      id: `rf_${generateId()}`,
      entryId: entryId,
      entryTitle: entryTitle,
      reviewIndex: index + 1,
      scheduledDate: formatDate(scheduledDate),
      interval: interval,
      prompt: REVIEW_PROMPTS[index],  // 本次回顾的引导问题
      status: 'pending',
      reflection: '',                 // 用户的回顾文字
      rating: null,                   // 认同度评分 1-5
      completedAt: null,
    };
  });
}

/**
 * 获取今日待回顾列表（含逾期）
 * @param {object[]} reflections - 所有回顾记录
 * @param {object[]} entries - 所有条目
 * @returns {object[]} 今日待回顾列表
 */
function getTodayReflections(reflections, entries) {
  const today = formatDate(new Date());
  return reflections
    .filter(r => r.scheduledDate <= today && r.status === 'pending')
    .sort((a, b) => {
      if (a.scheduledDate !== b.scheduledDate) {
        return a.scheduledDate.localeCompare(b.scheduledDate);
      }
      return a.reviewIndex - b.reviewIndex;
    })
    .map(r => {
      const entry = entries.find(e => e.id === r.entryId);
      return {
        ...r,
        entry,
        isOverdue: r.scheduledDate < today,
        overdueDays: r.scheduledDate < today
          ? daysBetween(r.scheduledDate, today)
          : 0,
      };
    });
}

/**
 * 获取指定日期的待回顾列表
 * @param {object[]} reflections - 所有回顾记录
 * @param {object[]} entries - 所有条目
 * @param {string} date - 日期字符串 YYYY-MM-DD
 * @returns {object[]} 当天待回顾列表
 */
function getDateReflections(reflections, entries, date) {
  return reflections
    .filter(r => r.scheduledDate === date && r.status === 'pending')
    .sort((a, b) => a.reviewIndex - b.reviewIndex)
    .map(r => {
      const entry = entries.find(e => e.id === r.entryId);
      return { ...r, entry };
    });
}

/**
 * 按日期分组统计待回顾数量
 * @param {object[]} reflections - 所有回顾记录
 * @returns {object} { '2026-08-01': 3, ... }
 */
function getReflectionCountByDate(reflections) {
  const counts = {};
  reflections.forEach(r => {
    if (r.status === 'pending') {
      counts[r.scheduledDate] = (counts[r.scheduledDate] || 0) + 1;
    }
  });
  return counts;
}

/**
 * 获取月统计信息
 * @param {object[]} reflections - 所有回顾记录
 * @param {number} year - 年
 * @param {number} month - 月（1-12）
 * @returns {object} 月统计对象
 */
function getMonthStats(reflections, year, month) {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const monthReflections = reflections.filter(r =>
    r.scheduledDate.startsWith(monthStr)
  );

  return {
    total: monthReflections.length,
    pending: monthReflections.filter(r => r.status === 'pending').length,
    done: monthReflections.filter(r => r.status === 'done').length,
    byDate: getReflectionCountByDate(monthReflections),
  };
}

/**
 * 重新计算回顾计划（创建日期变更时）
 * @param {string} entryId - 条目 ID
 * @param {string} entryTitle - 条目标题
 * @param {string} newDate - 新的创建日期
 * @param {object[]} existingReflections - 现有回顾记录
 * @returns {object[]} 新的回顾计划
 */
function recalculateReflections(entryId, entryTitle, newDate, existingReflections) {
  const oldReflections = existingReflections.filter(r => r.entryId === entryId);
  const doneReflections = oldReflections.filter(r => r.status === 'done');
  const newReflections = generateReflections(entryId, entryTitle, newDate);

  return newReflections.map(nr => {
    const done = doneReflections.find(d => d.reviewIndex === nr.reviewIndex);
    if (done) {
      return {
        ...nr,
        id: done.id,
        status: 'done',
        reflection: done.reflection,
        rating: done.rating,
        completedAt: done.completedAt,
      };
    }
    return nr;
  });
}

/**
 * 检查条目是否已完成全部回顾（已内化）
 * @param {object[]} entryReflections - 该条目的回顾记录
 * @returns {boolean} 是否已内化
 */
function isFullyReflected(entryReflections) {
  return entryReflections.length === 6 &&
    entryReflections.every(r => r.status === 'done' || r.status === 'skipped');
}

/**
 * 获取回顾进度
 * @param {object[]} entryReflections - 该条目的回顾记录
 * @returns {number} 已完成次数（0-6）
 */
function getReviewProgress(entryReflections) {
  return entryReflections.filter(r => r.status === 'done').length;
}

// ==================== 辅助函数 ====================

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date} date - Date 对象
 * @returns {string} 如 "2026-07-29"
 */
function formatDate(date) {
  const Y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, '0');
  const D = String(date.getDate()).padStart(2, '0');
  return `${Y}-${M}-${D}`;
}

/**
 * 计算两个日期字符串之间的天数差
 * @param {string} dateStr1 - 日期字符串 YYYY-MM-DD
 * @param {string} dateStr2 - 日期字符串 YYYY-MM-DD
 * @returns {number} 天数差（绝对值）
 */
function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

module.exports = {
  REVIEW_INTERVALS,
  REVIEW_PROMPTS,
  generateReflections,
  getTodayReflections,
  getDateReflections,
  getReflectionCountByDate,
  getMonthStats,
  recalculateReflections,
  isFullyReflected,
  getReviewProgress,
  formatDate,
  daysBetween,
};
