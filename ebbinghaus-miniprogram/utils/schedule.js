/**
 * 复习计划算法 - 基于艾宾浩斯遗忘曲线
 *
 * 间隔序列（距上次复习的天数）: [1, 2, 4, 7, 15, 30]
 * 累计天数（距学习日的天数）: [1, 3, 7, 14, 29, 59]
 */

const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

/**
 * 生成复习计划
 * @param {string} knowledgeId 知识点 ID
 * @param {string} knowledgeTitle 知识点标题（冗余到云数据库）
 * @param {string} createdAt ISO 格式的学习日期
 * @returns {object[]} 6 条复习计划
 */
function generateSchedule(knowledgeId, knowledgeTitle, createdAt) {
  const baseDate = new Date(createdAt);
  let cumulativeDays = 0;

  return REVIEW_INTERVALS.map((interval, index) => {
    cumulativeDays += interval;
    const scheduledDate = new Date(baseDate);
    scheduledDate.setDate(scheduledDate.getDate() + cumulativeDays);

    return {
      id: `rs_${generateId()}`,
      knowledgePointId: knowledgeId,
      knowledgeTitle: knowledgeTitle,
      reviewIndex: index + 1,
      scheduledDate: formatDate(scheduledDate),
      interval: interval,
      status: 'pending',
      completedAt: null,
    };
  });
}

/**
 * 获取今日待复习列表（含逾期）
 * @param {object[]} schedules 所有复习计划
 * @param {object[]} knowledges 所有知识点
 * @returns {object[]} 今日待复习列表（含关联知识点信息）
 */
function getTodaySchedules(schedules, knowledges) {
  const today = formatDate(new Date());
  return schedules
    .filter(s => s.scheduledDate <= today && s.status === 'pending')
    .sort((a, b) => {
      // 逾期优先，同日期按 reviewIndex 升序
      if (a.scheduledDate !== b.scheduledDate) {
        return a.scheduledDate.localeCompare(b.scheduledDate);
      }
      return a.reviewIndex - b.reviewIndex;
    })
    .map(s => {
      const knowledge = knowledges.find(k => k.id === s.knowledgePointId);
      return {
        ...s,
        knowledge,
        isOverdue: s.scheduledDate < today,
        overdueDays: s.scheduledDate < today
          ? daysBetween(s.scheduledDate, today)
          : 0,
      };
    });
}

/**
 * 获取指定日期的待复习列表
 * @param {object[]} schedules 所有复习计划
 * @param {object[]} knowledges 所有知识点
 * @param {string} date 日期 YYYY-MM-DD
 * @returns {object[]} 当天待复习列表
 */
function getDateSchedules(schedules, knowledges, date) {
  return schedules
    .filter(s => s.scheduledDate === date && s.status === 'pending')
    .sort((a, b) => a.reviewIndex - b.reviewIndex)
    .map(s => {
      const knowledge = knowledges.find(k => k.id === s.knowledgePointId);
      return { ...s, knowledge };
    });
}

/**
 * 按日期分组统计待复习数量
 * @param {object[]} schedules 所有复习计划
 * @returns {object} { '2026-08-01': 3, '2026-08-02': 1, ... }
 */
function getScheduleCountByDate(schedules) {
  const counts = {};
  schedules.forEach(s => {
    if (s.status === 'pending') {
      counts[s.scheduledDate] = (counts[s.scheduledDate] || 0) + 1;
    }
  });
  return counts;
}

/**
 * 获取月统计信息
 * @param {object[]} schedules 所有复习计划
 * @param {number} year 年
 * @param {number} month 月 (1-12)
 * @returns {object} 月统计
 */
function getMonthStats(schedules, year, month) {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const monthSchedules = schedules.filter(s =>
    s.scheduledDate.startsWith(monthStr)
  );

  return {
    total: monthSchedules.length,
    pending: monthSchedules.filter(s => s.status === 'pending').length,
    done: monthSchedules.filter(s => s.status === 'done').length,
    byDate: getScheduleCountByDate(monthSchedules),
  };
}

/**
 * 重新计算复习计划（学习日期变更时）
 * @param {string} knowledgeId 知识点 ID
 * @param {string} knowledgeTitle 知识点标题
 * @param {string} newDate 新的学习日期
 * @param {object[]} existingSchedules 现有复习计划
 * @returns {object[]} 新的复习计划（保留已完成的）
 */
function recalculateSchedules(knowledgeId, knowledgeTitle, newDate, existingSchedules) {
  const oldSchedules = existingSchedules.filter(s => s.knowledgePointId === knowledgeId);
  const doneSchedules = oldSchedules.filter(s => s.status === 'done');
  const newSchedules = generateSchedule(knowledgeId, knowledgeTitle, newDate);

  // 如果新计划与已完成计划的 reviewIndex 重叠，保留已完成状态
  return newSchedules.map(ns => {
    const done = doneSchedules.find(d => d.reviewIndex === ns.reviewIndex);
    if (done) {
      return { ...ns, id: done.id, status: 'done', completedAt: done.completedAt };
    }
    return ns;
  });
}

/**
 * 检查知识点是否已掌握（6 次复习全部完成）
 * @param {object[]} schedules 该知识点的复习计划
 * @returns {boolean}
 */
function isMastered(schedules) {
  const knowledgeSchedules = schedules.filter(s => s.status !== 'skipped');
  return knowledgeSchedules.length === 6 &&
    knowledgeSchedules.every(s => s.status === 'done');
}

/**
 * 获取复习进度（已完成的次数）
 * @param {object[]} schedules 该知识点的复习计划
 * @returns {number} 0-6
 */
function getReviewProgress(schedules) {
  return schedules.filter(s => s.status === 'done').length;
}

// ==================== 辅助函数 ====================

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date) {
  const Y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, '0');
  const D = String(date.getDate()).padStart(2, '0');
  return `${Y}-${M}-${D}`;
}

/**
 * 计算两个日期之间的天数差
 */
function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 生成唯一 ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

module.exports = {
  REVIEW_INTERVALS,
  generateSchedule,
  getTodaySchedules,
  getDateSchedules,
  getScheduleCountByDate,
  getMonthStats,
  recalculateSchedules,
  isMastered,
  getReviewProgress,
  formatDate,
  daysBetween,
};
