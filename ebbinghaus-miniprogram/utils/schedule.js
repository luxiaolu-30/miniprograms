/**
 * ============================================================================
 * 复习计划算法 - schedule.js（核心算法文件）
 * ============================================================================
 *
 * 文件用途：
 *   基于艾宾浩斯遗忘曲线实现复习计划的生成、查询、统计和状态判定。
 *   这是整个小程序的核心算法模块。
 *
 * 主要导出函数/常量：
 *   - REVIEW_INTERVALS: 间隔天数常量 [1, 2, 4, 7, 15, 30]
 *   - generateSchedule(): 生成 6 次复习计划
 *   - getTodaySchedules(): 获取今日待复习列表（含逾期）
 *   - getDateSchedules(): 获取指定日期的待复习列表
 *   - getScheduleCountByDate(): 按日期分组统计待复习数量
 *   - getMonthStats(): 获取月统计信息
 *   - recalculateSchedules(): 重新计算复习计划（学习日期变更时）
 *   - isMastered(): 检查知识点是否已掌握（6 次复习全部完成）
 *   - getReviewProgress(): 获取复习进度（已完成的次数 0-6）
 *   - formatDate() / daysBetween(): 日期辅助函数
 *
 * 艾宾浩斯间隔算法说明：
 *   ┌──────────┬──────────────┬──────────────┬──────────────────────┐
 *   │ 复习次数  │ 距上次(天)    │ 累计(天)      │ 说明                  │
 *   ├──────────┼──────────────┼──────────────┼──────────────────────┤
 *   │ 第1次    │ +1           │ 第1天        │ 次日复习              │
 *   │ 第2次    │ +2           │ 第3天        │ 2天后                 │
 *   │ 第3次    │ +4           │ 第7天        │ 4天后                 │
 *   │ 第4次    │ +7           │ 第14天       │ 7天后                 │
 *   │ 第5次    │ +15          │ 第29天       │ 15天后                │
 *   │ 第6次    │ +30          │ 第59天       │ 30天后                │
 *   └──────────┴──────────────┴──────────────┴──────────────────────┘
 *   完成全部 6 次复习后，知识点标记为 mastered（已掌握）
 *
 * 复习状态流转：
 *   pending ──完成复习──→ done
 *   pending ──跳过──────→ skipped
 *   done/skipped 为终态，不可再流转
 *
 * 知识点状态流转：
 *   active ──6次复习全部完成──→ mastered
 *   active ──主动归档────────→ archived
 *   mastered/archived 不再生成新复习计划
 *
 * 核心约定：
 *   - 每个知识点生成 6 条复习计划（对应 6 个间隔）
 *   - scheduledDate 格式：YYYY-MM-DD（本地日期，无时区问题）
 *   - 逾期计算：scheduledDate < today 即为逾期
 *   - 掌握判定：6 条计划全部为 done 状态（skipped 不计入）
 *   - 学习日期变更时，保留已完成的复习记录，仅重排未完成的
 * ============================================================================
 */

/**
 * 艾宾浩斯复习间隔天数（距上次复习的天数）
 * 累计天数 = [1, 3, 7, 14, 29, 59]
 */
const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

/**
 * 生成复习计划（核心函数）
 *
 * 根据学习日期生成 6 条艾宾浩斯复习计划
 *
 * @param {string} knowledgeId - 知识点 ID
 * @param {string} knowledgeTitle - 知识点标题（冗余存储，便于云同步）
 * @param {string} createdAt - ISO 格式的学习日期（如 "2026-07-29T10:00:00.000Z"）
 * @returns {object[]} 6 条复习计划，按 reviewIndex 升序排列
 *
 * @description
 *   计算逻辑：
 *     1. 以 createdAt 为基准日期
 *     2. 遍历 REVIEW_INTERVALS，累加得到累计天数
 *     3. 基准日期 + 累计天数 = 复习日期
 *
 *   示例（createdAt = 2026-07-29）：
 *     第1次：07-29 + 1天 = 07-30
 *     第2次：07-29 + 3天 = 08-01
 *     第3次：07-29 + 7天 = 08-05
 *     第4次：07-29 + 14天 = 08-12
 *     第5次：07-29 + 29天 = 08-27
 *     第6次：07-29 + 59天 = 09-26
 *
 *   返回的复习计划对象结构：
 *     {
 *       id: 'rs_xxxxx',           // 唯一标识
 *       knowledgePointId: 'xxx',  // 关联知识点 ID
 *       knowledgeTitle: 'xxx',    // 冗余标题
 *       reviewIndex: 1,           // 复习序号（1-6）
 *       scheduledDate: '2026-07-30', // 计划复习日期
 *       interval: 1,              // 距上次复习的天数
 *       status: 'pending',        // 初始状态：待复习
 *       completedAt: null         // 完成时间（初始为空）
 *     }
 */
function generateSchedule(knowledgeId, knowledgeTitle, createdAt) {
  const baseDate = new Date(createdAt);
  let cumulativeDays = 0;

  return REVIEW_INTERVALS.map((interval, index) => {
    // 累加间隔天数得到累计天数
    cumulativeDays += interval;
    // 计算复习日期：基准日期 + 累计天数
    const scheduledDate = new Date(baseDate);
    scheduledDate.setDate(scheduledDate.getDate() + cumulativeDays);

    return {
      id: `rs_${generateId()}`,
      knowledgePointId: knowledgeId,
      knowledgeTitle: knowledgeTitle,
      reviewIndex: index + 1,           // 复习序号从 1 开始
      scheduledDate: formatDate(scheduledDate),
      interval: interval,               // 保存间隔天数，便于后续分析
      status: 'pending',                // 初始状态：待复习
      completedAt: null,                // 初始无完成时间
    };
  });
}

/**
 * 获取今日待复习列表（含逾期未复习的）
 *
 * @param {object[]} schedules - 所有复习计划
 * @param {object[]} knowledges - 所有知识点（用于关联查询）
 * @returns {object[]} 今日待复习列表，附带逾期信息和关联知识点
 *
 * @description
 *   筛选逻辑：scheduledDate <= 今天 且 status === 'pending'
 *   排序规则：
 *     1. 日期升序（逾期多的排在前面，优先处理）
 *     2. 同日期按 reviewIndex 升序（先完成的复习优先）
 *
 *   返回对象额外字段：
 *     - knowledge: 关联的知识点对象（便于展示详情）
 *     - isOverdue: 是否逾期（scheduledDate < today）
 *     - overdueDays: 逾期天数（0 表示未逾期）
 *
 *   逾期计算示例：
 *     scheduledDate = '2026-07-25', today = '2026-07-29'
 *     → isOverdue = true, overdueDays = 4
 */
function getTodaySchedules(schedules, knowledges) {
  const today = formatDate(new Date());
  return schedules
    // 筛选：今天及之前到期的待复习计划
    .filter(s => s.scheduledDate <= today && s.status === 'pending')
    // 排序：逾期优先，同日期按复习序号
    .sort((a, b) => {
      if (a.scheduledDate !== b.scheduledDate) {
        return a.scheduledDate.localeCompare(b.scheduledDate);
      }
      return a.reviewIndex - b.reviewIndex;
    })
    // 关联知识点信息并计算逾期状态
    .map(s => {
      const knowledge = knowledges.find(k => k.id === s.knowledgePointId);
      return {
        ...s,
        knowledge,                          // 关联知识点对象
        isOverdue: s.scheduledDate < today, // 是否逾期
        overdueDays: s.scheduledDate < today
          ? daysBetween(s.scheduledDate, today) // 逾期天数
          : 0,
      };
    });
}

/**
 * 获取指定日期的待复习列表
 *
 * @param {object[]} schedules - 所有复习计划
 * @param {object[]} knowledges - 所有知识点
 * @param {string} date - 日期字符串 YYYY-MM-DD
 * @returns {object[]} 当天待复习列表（含关联知识点）
 * @description 用于日历视图点击某天后展示当天需要复习的内容
 */
function getDateSchedules(schedules, knowledges, date) {
  return schedules
    // 精确匹配日期 + 待复习状态
    .filter(s => s.scheduledDate === date && s.status === 'pending')
    // 按复习序号升序
    .sort((a, b) => a.reviewIndex - b.reviewIndex)
    // 关联知识点信息
    .map(s => {
      const knowledge = knowledges.find(k => k.id === s.knowledgePointId);
      return { ...s, knowledge };
    });
}

/**
 * 按日期分组统计待复习数量
 *
 * @param {object[]} schedules - 所有复习计划
 * @returns {object} { '2026-08-01': 3, '2026-08-02': 1, ... }
 * @description
 *   用于日历视图显示每日待复习数量标记（红点/数字）
 *   只统计 pending 状态的计划
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
 *
 * @param {object[]} schedules - 所有复习计划
 * @param {number} year - 年（如 2026）
 * @param {number} month - 月（1-12）
 * @returns {object} 月统计对象
 *   - total: 当月总计划数
 *   - pending: 待复习数
 *   - done: 已完成数
 *   - byDate: 按日期分组的待复习数量
 * @description 用于统计页面展示月度学习数据
 */
function getMonthStats(schedules, year, month) {
  // 构造月份前缀，如 "2026-07"
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  // 筛选当月计划（scheduledDate 以月份前缀开头）
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
 *
 * @param {string} knowledgeId - 知识点 ID
 * @param {string} knowledgeTitle - 知识点标题
 * @param {string} newDate - 新的学习日期
 * @param {object[]} existingSchedules - 现有复习计划（全量）
 * @returns {object[]} 新的复习计划（保留已完成记录）
 *
 * @description
 *   核心逻辑：
 *     1. 从现有计划中筛选出该知识点的已完成计划
 *     2. 基于新日期生成全新的 6 条计划
 *     3. 对比新旧计划的 reviewIndex，保留已完成状态
 *
 *   保留策略：
 *     - 已完成（done）的计划保持原 ID 和完成时间
 *     - 待复习（pending）的计划重新生成日期和 ID
 *     - 跳过的（skipped）计划不保留，重新生成
 *
 *   应用场景：
 *     - 用户修改知识点的学习日期
 *     - 知识点被标记为"重新学习"
 *
 * ⚠️ 注意：此函数只返回新计划，不自动写入存储，调用方需自行保存
 */
function recalculateSchedules(knowledgeId, knowledgeTitle, newDate, existingSchedules) {
  // 筛选该知识点的已完成计划
  const oldSchedules = existingSchedules.filter(s => s.knowledgePointId === knowledgeId);
  const doneSchedules = oldSchedules.filter(s => s.status === 'done');
  // 基于新日期生成全新计划
  const newSchedules = generateSchedule(knowledgeId, knowledgeTitle, newDate);

  // 合并：保留已完成状态，重排未完成
  return newSchedules.map(ns => {
    const done = doneSchedules.find(d => d.reviewIndex === ns.reviewIndex);
    if (done) {
      // 保留已完成记录的 ID 和完成时间
      return { ...ns, id: done.id, status: 'done', completedAt: done.completedAt };
    }
    return ns;
  });
}

/**
 * 检查知识点是否已掌握（6 次复习全部完成）
 *
 * @param {object[]} schedules - 该知识点的复习计划（仅该知识点的）
 * @returns {boolean} 是否已掌握
 *
 * @description
 *   掌握条件：
 *     1. 总共恰好 6 条复习计划
 *     2. 所有非 pending 计划（done 或 skipped）均已处理完毕
 *
 *   业务语义：
 *   - done = 完成复习（正常完成）
 *   - skipped = 跳过复习（用户表示已经掌握，无需复习）
 *   - 只要没有 pending 计划，即视为已掌握
 */
function isMastered(schedules) {
  // 🔧 修复：原逻辑排除 skipped 后判断 length === 6，
  // 导致存在 skipped 时永远无法达到 6 条，无法判定为 mastered
  // 修复后：要求总计划数为 6，且所有计划均为终态（done 或 skipped，无 pending）
  return schedules.length === 6 &&
    schedules.every(s => s.status === 'done' || s.status === 'skipped');
}

/**
 * 获取复习进度（已完成的次数）
 *
 * @param {object[]} schedules - 该知识点的复习计划
 * @returns {number} 已完成次数（0-6）
 * @description 用于展示复习进度条/百分比
 */
function getReviewProgress(schedules) {
  return schedules.filter(s => s.status === 'done').length;
}

// ==================== 辅助函数 ====================

/**
 * 格式化日期为 YYYY-MM-DD 字符串
 * @param {Date} date - Date 对象
 * @returns {string} 如 "2026-07-29"
 * @description 用于 scheduledDate 字段的标准化存储
 */
function formatDate(date) {
  const Y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, '0');
  const D = String(date.getDate()).padStart(2, '0');
  return `${Y}-${M}-${D}`;
}

/**
 * 计算两个日期字符串之间的天数差
 *
 * @param {string} dateStr1 - 日期字符串 YYYY-MM-DD
 * @param {string} dateStr2 - 日期字符串 YYYY-MM-DD
 * @returns {number} 天数差（绝对值，向上取整）
 * @description 用于计算逾期天数
 */
function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = Math.abs(d2 - d1);
  // 毫秒转天数，向上取整（不足 1 天按 1 天算）
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 生成唯一 ID（时间戳 + 随机数）
 * @returns {string} 如 "lz5k2k_abc12345"
 * @description 用于生成复习计划 ID（前缀 'rs_' 由调用方添加）
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
