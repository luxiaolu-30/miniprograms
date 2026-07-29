/**
 * ============================================================================
 * ID 生成与日期工具 - uuid.js
 * ============================================================================
 *
 * 文件用途：
 *   提供唯一 ID 生成和日期格式化功能。
 *
 * 主要导出函数：
 *   - generateId(): 生成唯一 ID（时间戳+随机数，36进制）
 *   - formatDate(): 格式化日期为 YYYY-MM-DD
 *   - formatDateTime(): 格式化日期时间为 YYYY-MM-DD HH:mm
 *   - getRelativeDate(): 获取相对日期描述（今天/昨天/N天前）
 * ============================================================================
 */

/**
 * 生成唯一 ID
 * @returns {string} 如 "lz5k2k_abc12345"
 * @description 基于时间戳（36进制）+ 随机字符串，保证唯一性和排序性
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date|string} date - Date 对象或 ISO 字符串
 * @returns {string} 如 "2026-07-29"
 */
function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  return `${Y}-${M}-${D}`;
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm
 * @param {string} dateStr - ISO 格式时间字符串
 * @returns {string} 如 "2026-07-29 10:30"
 */
function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${Y}-${M}-${D} ${h}:${m}`;
}

/**
 * 获取相对日期描述
 * @param {string} dateStr - ISO 格式时间字符串
 * @returns {string} 如 "今天"、"昨天"、"3天前"、"2026-07-29"
 */
function getRelativeDate(dateStr) {
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDay = new Date(target);
  targetDay.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today - targetDay) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays === 2) return '前天';
  if (diffDays <= 7) return `${diffDays}天前`;
  if (diffDays <= 30) return `${Math.floor(diffDays / 7)}周前`;

  // 超过30天显示具体日期
  const Y = target.getFullYear();
  const currentY = today.getFullYear();
  const M = String(target.getMonth() + 1).padStart(2, '0');
  const D = String(target.getDate()).padStart(2, '0');

  // 跨年显示完整年份
  if (Y !== currentY) {
    return `${Y}-${M}-${D}`;
  }
  return `${M}-${D}`;
}

module.exports = {
  generateId,
  formatDate,
  formatDateTime,
  getRelativeDate,
};
