/**
 * ============================================================================
 * ID 生成与日期格式化工具 - uuid.js
 * ============================================================================
 *
 * 文件用途：
 *   提供全局唯一 ID 生成和日期格式化功能，是项目的基础工具模块。
 *   被 storage.js、schedule.js 等其他模块引用。
 *
 * 主要导出函数：
 *   - generateId(prefix): 生成带前缀的唯一 ID
 *   - now(): 获取当前 ISO 格式时间戳
 *   - formatDate(iso): ISO 时间 → YYYY-MM-DD
 *   - formatDateTime(iso): ISO 时间 → YYYY-MM-DD HH:mm
 *   - getRelativeDate(dateStr): 获取相对时间描述（今天/明天/X天前）
 *
 * 核心约定：
 *   - ID 格式：{prefix}_{时间戳36进制}_{随机字符串}
 *   - 示例：id_lz5k2k_abc12345、kp_lz5k2k_xyz789ab
 *   - 时间戳使用 36 进制压缩，兼顾可读性和唯一性
 *   - 随机部分 8 字符，冲突概率极低（36^8 ≈ 2.8万亿）
 *
 * 使用场景：
 *   - 创建知识点/分类/复习计划时生成唯一标识
 *   - 记录 createdAt / updatedAt / completedAt 时间戳
 *   - 页面展示相对时间（如"3天前复习"）
 * ============================================================================
 */

/**
 * 生成唯一 ID
 *
 * @param {string} [prefix='id'] - ID 前缀，用于区分业务类型
 *   - 'kp': 知识点 (KnowledgePoint)
 *   - 'rs': 复习计划 (ReviewSchedule)
 *   - 'cat': 分类 (Category)
 *   - 'id': 默认通用前缀
 * @returns {string} 唯一 ID，如 "id_lz5k2k_abc12345"
 *
 * @description
 *   组成：前缀 + 时间戳（36进制）+ 随机字符串（8字符）
 *   时间戳保证大致有序，随机部分保证唯一性
 */
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 8)}`;
}

/**
 * 获取当前 ISO 格式时间戳
 * @returns {string} 如 "2026-07-29T10:30:00.000Z"
 * @description 用于 createdAt / updatedAt / completedAt 字段
 */
function now() {
  return new Date().toISOString();
}

/**
 * 格式化 ISO 时间为 YYYY-MM-DD
 *
 * @param {string} iso - ISO 格式时间字符串
 * @returns {string} 如 "2026-07-29"，输入为空返回空字符串
 * @description 用于将存储的 ISO 时间转为本地日期展示
 */
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  return `${Y}-${M}-${D}`;
}

/**
 * 格式化 ISO 时间为 YYYY-MM-DD HH:mm
 *
 * @param {string} iso - ISO 格式时间字符串
 * @returns {string} 如 "2026-07-29 10:30"，输入为空返回空字符串
 * @description 用于展示精确的创建/更新时间
 */
function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${Y}-${M}-${D} ${h}:${m}`;
}

/**
 * 获取相对时间描述（人性化显示）
 *
 * @param {string} dateStr - 日期字符串（YYYY-MM-DD 或 ISO 格式）
 * @returns {string} 相对时间描述
 *   - 今天 → "今天"
 *   - 明天 → "明天"
 *   - 昨天 → "昨天"
 *   - 近30天内 → "X天后"/"X天前"
 *   - 🔧 修复：跨年或超过30天 → 显示具体日期 "MM-DD" 或 "YYYY-MM-DD"
 *   - 空值 → ""
 *
 * @description
 *   将日期差值转换为自然语言，用于列表页展示复习时间
 *   计算基于本地时间 0 点，忽略时分秒影响
 */
function getRelativeDate(dateStr) {
  if (!dateStr) return '';
  // 今天 0 点（用于计算天数差）
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // 目标日期 0 点
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);

  // 无效日期直接返回空字符串
  if (isNaN(target.getTime())) return '';

  // 计算天数差（毫秒 → 天，四舍五入）
  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '明天';
  if (diffDays === -1) return '昨天';

  // 🔧 修复：跨年或超过30天时显示具体日期，更精确友好
  const absDays = Math.abs(diffDays);
  if (absDays > 30) {
    const targetY = target.getFullYear();
    const todayY = today.getFullYear();
    const M = String(target.getMonth() + 1).padStart(2, '0');
    const D = String(target.getDate()).padStart(2, '0');
    // 跨年显示完整日期，同年显示 MM-DD
    return targetY !== todayY ? `${targetY}-${M}-${D}` : `${M}-${D}`;
  }

  if (diffDays > 0) return `${diffDays}天后`;
  return `${absDays}天前`;
}

module.exports = {
  generateId,
  now,
  formatDate,
  formatDateTime,
  getRelativeDate,
};
