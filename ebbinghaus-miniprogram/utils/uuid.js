/**
 * ID 生成与日期格式化工具
 */

/**
 * 生成唯一 ID
 */
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 8)}`;
}

/**
 * 获取当前 ISO 时间
 */
function now() {
  return new Date().toISOString();
}

/**
 * 格式化日期为 YYYY-MM-DD
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
 * 格式化日期时间为 YYYY-MM-DD HH:mm
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
 * 获取相对时间描述（如 "3天前"、"今天"、"明天"）
 */
function getRelativeDate(dateStr) {
  if (!dateStr) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '明天';
  if (diffDays === -1) return '昨天';
  if (diffDays > 0) return `${diffDays}天后`;
  return `${Math.abs(diffDays)}天前`;
}

module.exports = {
  generateId,
  now,
  formatDate,
  formatDateTime,
  getRelativeDate,
};
