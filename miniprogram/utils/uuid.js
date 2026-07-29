/**
 * ============================================================================
 * ID 生成与时间格式化工具
 * ============================================================================
 *
 * 【ID 生成策略】
 *   格式：<prefix>_<时间戳36位>_<随机8位>
 *   - 时间戳 36 位编码：保证大致有序
 *   - 随机 8 位：避免同一毫秒内碰撞
 *
 * 【时间格式化】
 *   - formatDate     : YYYY-MM-DD（日期）
 *   - formatDateTime : YYYY-MM-DD HH:mm（日期+时间）
 *   - now            : 返回 ISO 格式（用于存储）
 *
 * 【导出函数】
 *   generateId / now / formatDate / formatDateTime
 */

/**
 * 生成唯一 ID
 * 适用于物品、品类、图片等各类实体标识
 *
 * @param {string} [prefix='id'] - ID 前缀（如 'item'、'cat'、'img'）
 * @returns {string} 唯一标识字符串，如 'id_lxqz1234_ab3f9k2m'
 */
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 8)}`;
}

/**
 * 获取当前时间的 ISO 格式字符串
 * 用于存储 createdAt、updatedAt 等字段
 * @returns {string} 如 '2026-07-29T12:34:56.789Z'
 */
function now() {
  return new Date().toISOString();
}

/**
 * 将 ISO 时间字符串格式化为日期（YYYY-MM-DD）
 * 用于页面展示创建时间、读完日期等
 *
 * @param {string} iso - ISO 格式时间字符串
 * @returns {string} 如 '2026-07-29'，输入为空或非法时返回空字符串
 */
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  // 🔧 修复：防御非法日期字符串（Invalid Date）
  if (isNaN(d.getTime())) return '';
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始，需 +1 并补零
  const D = String(d.getDate()).padStart(2, '0');       // 日期补零
  return `${Y}-${M}-${D}`;
}

/**
 * 将 ISO 时间字符串格式化为日期+时间（YYYY-MM-DD HH:mm）
 * 用于页面展示详细时间
 *
 * @param {string} iso - ISO 格式时间字符串
 * @returns {string} 如 '2026-07-29 14:30'，输入为空或非法时返回空字符串
 */
function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  // 🔧 修复：防御非法日期字符串（Invalid Date）
  if (isNaN(d.getTime())) return '';
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');       // 小时补零
  const m = String(d.getMinutes()).padStart(2, '0');     // 分钟补零
  return `${Y}-${M}-${D} ${h}:${m}`;
}

module.exports = {
  generateId,
  now,
  formatDate,
  formatDateTime,
};
