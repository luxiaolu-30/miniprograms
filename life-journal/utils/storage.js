/**
 * ============================================================================
 * 存储层 - storage.js
 * ============================================================================
 *
 * 文件用途：
 *   封装微信小程序 wx.storage 同步接口，提供统一的 CRUD 操作，
 *   管理日记条目、回顾记录、设置三类数据的本地持久化。
 *
 * 主要导出函数：
 *   - 日记条目：getEntries / getEntry / saveEntry / deleteEntry
 *   - 回顾记录：getReflections / getReflection / getReflectionsByEntry /
 *              saveReflection / saveReflections / updateReflectionStatus /
 *              deleteReflection / deleteReflectionsByEntry
 *   - 设置：getSettings / saveSettings
 *   - 工具：getStorageInfo
 *
 * 核心约定：
 *   - 所有存储操作通过 safeStorage 包装，统一异常处理
 *   - 写入成功后自动调用 app.loadXxx() 同步全局状态
 *   - 存储键名以 'lj_' 为前缀（Life Journal）
 *   - saveEntry 更新时自动设置 updatedAt 时间戳
 *   - updateReflectionStatus 标记为 done 时自动记录 completedAt
 *
 * 数据模型：
 *   - Entry: { id, title, content, type, mood, tags[], createdAt, updatedAt, status }
 *   - Reflection: { id, entryId, entryTitle, reviewIndex, scheduledDate, interval, status, reflection, rating, completedAt }
 *   - Settings: { streak, lastCheckIn, 其他用户偏好 }
 * ============================================================================
 */

/**
 * 存储键名常量
 * 使用 'lj_' 前缀（Life Journal）避免命名冲突
 */
const KEYS = {
  ENTRIES: 'lj_entries',         // 日记条目列表
  REFLECTIONS: 'lj_reflections', // 回顾记录列表
  SETTINGS: 'lj_settings',       // 用户设置
};

/**
 * 存储限制常量（10MB，单位 KB）
 */
const STORAGE_LIMIT = 10 * 1024; // 10MB in KB

/**
 * 安全执行 storage 操作（统一异常处理）
 * @param {string} operation - 'get' | 'set' | 'remove'
 * @param {string} key - 存储键名
 * @param {*} data - 写入数据（set 操作时传入）
 * @returns {*} get 返回数据，set/remove 返回 boolean
 */
function safeStorage(operation, key, data) {
  try {
    if (operation === 'get') {
      return wx.getStorageSync(key);
    } else if (operation === 'set') {
      wx.setStorageSync(key, data);
      return true;
    } else if (operation === 'remove') {
      wx.removeStorageSync(key);
      return true;
    }
  } catch (e) {
    console.error(`Storage ${operation} failed for key ${key}:`, e);
    if (operation === 'set') {
      wx.showToast({ title: '存储失败，空间可能不足', icon: 'none' });
    }
    return operation === 'get' ? null : false;
  }
}

// ==================== 日记条目操作 ====================

/**
 * 获取所有日记条目
 * @returns {object[]} 条目数组，无数据返回空数组
 */
function getEntries() {
  return safeStorage('get', KEYS.ENTRIES) || [];
}

/**
 * 根据 ID 获取单个条目
 * @param {string} id - 条目 ID
 * @returns {object|null} 条目对象，未找到返回 null
 */
function getEntry(id) {
  const entries = getEntries();
  return entries.find(e => e.id === id) || null;
}

/**
 * 保存日记条目（新增或更新）
 * @param {object} entry - 条目对象（必须包含 id）
 * @returns {boolean} 保存是否成功
 * @description
 *   - 已存在（同 id）→ 合并更新，自动设置 updatedAt
 *   - 不存在 → 插入到数组头部（最新在前）
 */
function saveEntry(entry) {
  const entries = getEntries();
  const index = entries.findIndex(e => e.id === entry.id);

  if (index >= 0) {
    entries[index] = { ...entries[index], ...entry, updatedAt: now() };
  } else {
    entries.unshift(entry);
  }

  const result = safeStorage('set', KEYS.ENTRIES, entries);
  if (result) {
    const app = getApp();
    if (app) app.loadEntries();
  }
  return result;
}

/**
 * 删除日记条目（按 ID）
 * @param {string} id - 条目 ID
 * @returns {boolean} 删除是否成功
 * @description 级联删除对应的回顾记录
 */
function deleteEntry(id) {
  const entries = getEntries();
  const filtered = entries.filter(e => e.id !== id);
  const result = safeStorage('set', KEYS.ENTRIES, filtered);
  if (result) {
    const app = getApp();
    if (app) app.loadEntries();
    // 级联删除该条目的所有回顾记录
    deleteReflectionsByEntry(id);
  }
  return result;
}

// ==================== 回顾记录操作 ====================

/**
 * 获取所有回顾记录
 * @returns {object[]} 回顾记录数组，无数据返回空数组
 */
function getReflections() {
  return safeStorage('get', KEYS.REFLECTIONS) || [];
}

/**
 * 根据 ID 获取单个回顾记录
 * @param {string} id - 回顾记录 ID
 * @returns {object|null} 回顾记录对象
 */
function getReflection(id) {
  const reflections = getReflections();
  return reflections.find(r => r.id === id) || null;
}

/**
 * 根据条目 ID 获取其所有回顾记录
 * @param {string} entryId - 条目 ID
 * @returns {object[]} 该条目的回顾记录数组
 */
function getReflectionsByEntry(entryId) {
  const reflections = getReflections();
  return reflections.filter(r => r.entryId === entryId);
}

/**
 * 保存单个回顾记录
 * @param {object} reflection - 回顾记录对象
 * @returns {boolean} 保存是否成功
 */
function saveReflection(reflection) {
  const reflections = getReflections();
  const index = reflections.findIndex(r => r.id === reflection.id);

  if (index >= 0) {
    reflections[index] = { ...reflections[index], ...reflection };
  } else {
    reflections.push(reflection);
  }

  const result = safeStorage('set', KEYS.REFLECTIONS, reflections);
  if (result) {
    const app = getApp();
    if (app) app.loadReflections();
  }
  return result;
}

/**
 * 批量保存回顾记录
 * @param {object[]} newReflections - 回顾记录数组
 * @returns {boolean} 保存是否成功
 */
function saveReflections(newReflections) {
  const reflections = getReflections();
  newReflections.forEach(nr => {
    const index = reflections.findIndex(r => r.id === nr.id);
    if (index >= 0) {
      reflections[index] = { ...reflections[index], ...nr };
    } else {
      reflections.push(nr);
    }
  });

  const result = safeStorage('set', KEYS.REFLECTIONS, reflections);
  if (result) {
    const app = getApp();
    if (app) app.loadReflections();
  }
  return result;
}

/**
 * 更新回顾记录状态
 * @param {string} id - 回顾记录 ID
 * @param {string} status - 新状态：pending | done | skipped
 * @returns {boolean} 更新是否成功
 * @description 标记为 'done' 时自动记录 completedAt 时间戳
 */
function updateReflectionStatus(id, status) {
  const reflections = getReflections();
  const index = reflections.findIndex(r => r.id === id);
  if (index >= 0) {
    reflections[index].status = status;
    if (status === 'done') {
      reflections[index].completedAt = now();
    }
    const result = safeStorage('set', KEYS.REFLECTIONS, reflections);
    if (result) {
      const app = getApp();
      if (app) app.loadReflections();
    }
    return result;
  }
  return false;
}

/**
 * 删除某条目的所有回顾记录（级联删除）
 * @param {string} entryId - 条目 ID
 * @returns {boolean} 删除是否成功
 */
function deleteReflectionsByEntry(entryId) {
  const reflections = getReflections();
  const filtered = reflections.filter(r => r.entryId !== entryId);
  const result = safeStorage('set', KEYS.REFLECTIONS, filtered);
  if (result) {
    const app = getApp();
    if (app) app.loadReflections();
  }
  return result;
}

/**
 * 删除单个回顾记录
 * @param {string} id - 回顾记录 ID
 * @returns {boolean} 删除是否成功
 */
function deleteReflection(id) {
  const reflections = getReflections();
  const filtered = reflections.filter(r => r.id !== id);
  const result = safeStorage('set', KEYS.REFLECTIONS, filtered);
  if (result) {
    const app = getApp();
    if (app) app.loadReflections();
  }
  return result;
}

// ==================== 设置操作 ====================

/**
 * 获取用户设置
 * @returns {object} 设置对象，无数据返回空对象
 */
function getSettings() {
  return safeStorage('get', KEYS.SETTINGS) || {};
}

/**
 * 保存用户设置（合并更新）
 * @param {object} settings - 要更新的设置项
 * @returns {boolean} 保存是否成功
 */
function saveSettings(settings) {
  const current = getSettings();
  return safeStorage('set', KEYS.SETTINGS, { ...current, ...settings });
}

// ==================== 工具方法 ====================

/**
 * 获取存储使用情况
 * @returns {{ used: number, limit: number, keys: string[] }}
 */
function getStorageInfo() {
  try {
    const info = wx.getStorageInfoSync();
    return {
      used: info.currentSize,
      limit: info.limitSize,
      keys: info.keys,
    };
  } catch (e) {
    console.error('getStorageInfo failed:', e);
    return { used: 0, limit: STORAGE_LIMIT, keys: [] };
  }
}

/**
 * 获取当前 ISO 格式时间戳
 * @returns {string} 如 "2026-07-29T10:30:00.000Z"
 */
function now() {
  return new Date().toISOString();
}

module.exports = {
  // 日记条目
  getEntries,
  getEntry,
  saveEntry,
  deleteEntry,
  // 回顾记录
  getReflections,
  getReflection,
  getReflectionsByEntry,
  saveReflection,
  saveReflections,
  updateReflectionStatus,
  deleteReflection,
  deleteReflectionsByEntry,
  // 设置
  getSettings,
  saveSettings,
  // 工具
  getStorageInfo,
};
