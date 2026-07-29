/**
 * ============================================================================
 * 存储层 - storage.js
 * ============================================================================
 *
 * 文件用途：
 *   封装微信小程序 wx.storage 同步接口，提供统一的 CRUD 操作，
 *   管理知识点、复习计划、分类、设置四类数据的本地持久化。
 *
 * 主要导出函数：
 *   - 知识点：getKnowledges / getKnowledge / saveKnowledge / deleteKnowledge
 *   - 复习计划：getSchedules / getSchedule / getSchedulesByKnowledge /
 *              saveSchedule / saveSchedules / updateScheduleStatus /
 *              deleteSchedule / deleteSchedulesByKnowledge
 *   - 分类：getCategories / getCategory / saveCategory / deleteCategory
 *   - 设置：getSettings / saveSettings
 *   - 工具：getStorageInfo
 *
 * 核心约定：
 *   - 所有存储操作通过 safeStorage 包装，统一异常处理
 *   - 写入成功后自动调用 app.loadXxx() 同步全局状态
 *   - 存储键名以 'eb_' 为前缀，避免与其他小程序冲突
 *   - 微信小程序单键存储上限约 10MB（实际按 10MB 预留）
 *   - saveKnowledge 更新时自动设置 updatedAt 时间戳
 *   - updateScheduleStatus 标记为 done 时自动记录 completedAt
 *
 * 数据模型：
 *   - KnowledgePoint: { id, title, content, images, categoryId, tags, status, createdAt, updatedAt }
 *   - ReviewSchedule: { id, knowledgePointId, knowledgeTitle, reviewIndex, scheduledDate, interval, status, completedAt }
 *   - Category: { id, name, icon, createdAt }
 *   - Settings: { 用户偏好设置 }
 * ============================================================================
 */

/**
 * 存储键名常量
 * 使用 'eb_' 前缀（Ebbinghaus）避免命名冲突
 */
const KEYS = {
  KNOWLEDGES: 'eb_knowledges',   // 知识点列表
  SCHEDULES: 'eb_schedules',     // 复习计划列表
  CATEGORIES: 'eb_categories',   // 分类列表
  SETTINGS: 'eb_settings',       // 用户设置
};

/**
 * 存储限制常量（10MB，单位 KB）
 * 微信小程序单键存储上限约为 10MB
 */
const STORAGE_LIMIT = 10 * 1024; // 10MB in KB

/**
 * 安全执行 storage 操作（统一异常处理）
 *
 * @param {string} operation - 操作类型：'get' | 'set' | 'remove'
 * @param {string} key - 存储键名
 * @param {*} data - 写入数据（set 操作时传入）
 * @returns {*} get 返回数据，set/remove 返回 boolean
 * @description
 *   - 存储失败时自动弹出 Toast 提示用户
 *   - get 失败返回 null，set/remove 返回 false
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
    // 写入失败时提示用户（通常是存储空间不足）
    if (operation === 'set') {
      wx.showToast({
        title: '存储失败，空间可能不足',
        icon: 'none',
      });
    }
    return operation === 'get' ? null : false;
  }
}

// ==================== 知识点操作 ====================

/**
 * 获取所有知识点列表
 * @returns {object[]} 知识点数组，无数据返回空数组
 */
function getKnowledges() {
  return safeStorage('get', KEYS.KNOWLEDGES) || [];
}

/**
 * 根据 ID 获取单个知识点
 * @param {string} id - 知识点 ID
 * @returns {object|null} 知识点对象，未找到返回 null
 */
function getKnowledge(id) {
  const knowledges = getKnowledges();
  return knowledges.find(k => k.id === id) || null;
}

/**
 * 保存知识点（新增或更新）
 *
 * @param {object} knowledge - 知识点对象（必须包含 id）
 * @returns {boolean} 保存是否成功
 * @description
 *   - 已存在（同 id）→ 合并更新，自动设置 updatedAt
 *   - 不存在 → 插入到数组头部（最新在前）
 *   - 保存成功后自动刷新 app.globalData.knowledges
 */
function saveKnowledge(knowledge) {
  const knowledges = getKnowledges();
  const index = knowledges.findIndex(k => k.id === knowledge.id);

  if (index >= 0) {
    // 更新：合并新旧数据，自动更新 updatedAt
    knowledges[index] = { ...knowledges[index], ...knowledge, updatedAt: now() };
  } else {
    // 新增：插入到数组头部，保证最新数据在前
    knowledges.unshift(knowledge);
  }

  const result = safeStorage('set', KEYS.KNOWLEDGES, knowledges);
  if (result) {
    // 同步更新全局状态
    const app = getApp();
    if (app) app.loadKnowledges();
  }
  return result;
}

/**
 * 删除知识点（按 ID）
 * @param {string} id - 知识点 ID
 * @returns {boolean} 删除是否成功
 * @description
 *   - 保存成功后自动刷新 app.globalData.knowledges
 *   - 🔧 修复：级联删除对应的复习计划，避免产生孤立计划
 */
function deleteKnowledge(id) {
  const knowledges = getKnowledges();
  const filtered = knowledges.filter(k => k.id !== id);
  const result = safeStorage('set', KEYS.KNOWLEDGES, filtered);
  if (result) {
    const app = getApp();
    if (app) app.loadKnowledges();
    // 🔧 修复：级联删除该知识点的所有复习计划
    deleteSchedulesByKnowledge(id);
  }
  return result;
}

// ==================== 复习计划操作 ====================

/**
 * 获取所有复习计划列表
 * @returns {object[]} 复习计划数组，无数据返回空数组
 */
function getSchedules() {
  return safeStorage('get', KEYS.SCHEDULES) || [];
}

/**
 * 根据 ID 获取单个复习计划
 * @param {string} id - 复习计划 ID
 * @returns {object|null} 复习计划对象，未找到返回 null
 */
function getSchedule(id) {
  const schedules = getSchedules();
  return schedules.find(s => s.id === id) || null;
}

/**
 * 根据知识点 ID 获取其所有复习计划
 * @param {string} knowledgeId - 知识点 ID
 * @returns {object[]} 该知识点的复习计划数组
 */
function getSchedulesByKnowledge(knowledgeId) {
  const schedules = getSchedules();
  return schedules.filter(s => s.knowledgePointId === knowledgeId);
}

/**
 * 保存单个复习计划（新增或更新）
 * @param {object} schedule - 复习计划对象（必须包含 id）
 * @returns {boolean} 保存是否成功
 * @description 保存成功后自动刷新 app.globalData.schedules
 */
function saveSchedule(schedule) {
  const schedules = getSchedules();
  const index = schedules.findIndex(s => s.id === schedule.id);

  if (index >= 0) {
    // 更新：合并新旧数据
    schedules[index] = { ...schedules[index], ...schedule };
  } else {
    // 新增：追加到数组
    schedules.push(schedule);
  }

  const result = safeStorage('set', KEYS.SCHEDULES, schedules);
  if (result) {
    const app = getApp();
    if (app) app.loadSchedules();
  }
  return result;
}

/**
 * 批量保存复习计划（用于一次性保存多条，如生成计划时）
 * @param {object[]} newSchedules - 复习计划数组
 * @returns {boolean} 保存是否成功
 * @description
 *   - 已存在（同 id）→ 合并更新
 *   - 不存在 → 追加
 *   - 只执行一次存储写入，性能优于循环调用 saveSchedule
 */
function saveSchedules(newSchedules) {
  const schedules = getSchedules();
  newSchedules.forEach(ns => {
    const index = schedules.findIndex(s => s.id === ns.id);
    if (index >= 0) {
      schedules[index] = { ...schedules[index], ...ns };
    } else {
      schedules.push(ns);
    }
  });

  const result = safeStorage('set', KEYS.SCHEDULES, schedules);
  if (result) {
    const app = getApp();
    if (app) app.loadSchedules();
  }
  return result;
}

/**
 * 更新复习计划状态
 * @param {string} id - 复习计划 ID
 * @param {string} status - 新状态：pending | done | skipped
 * @returns {boolean} 更新是否成功
 * @description
 *   - 标记为 'done' 时自动记录 completedAt 时间戳
 *   - 计划不存在时返回 false
 */
function updateScheduleStatus(id, status) {
  const schedules = getSchedules();
  const index = schedules.findIndex(s => s.id === id);
  if (index >= 0) {
    schedules[index].status = status;
    // 完成时自动记录完成时间
    if (status === 'done') {
      schedules[index].completedAt = now();
    }
    const result = safeStorage('set', KEYS.SCHEDULES, schedules);
    if (result) {
      const app = getApp();
      if (app) app.loadSchedules();
    }
    return result;
  }
  return false;
}

/**
 * 删除某知识点的所有复习计划（级联删除）
 * @param {string} knowledgeId - 知识点 ID
 * @returns {boolean} 删除是否成功
 * @description 删除知识点时应同步调用此方法清理关联计划
 */
function deleteSchedulesByKnowledge(knowledgeId) {
  const schedules = getSchedules();
  const filtered = schedules.filter(s => s.knowledgePointId !== knowledgeId);
  const result = safeStorage('set', KEYS.SCHEDULES, filtered);
  if (result) {
    const app = getApp();
    if (app) app.loadSchedules();
  }
  return result;
}

/**
 * 删除单个复习计划
 * @param {string} id - 复习计划 ID
 * @returns {boolean} 删除是否成功
 */
function deleteSchedule(id) {
  const schedules = getSchedules();
  const filtered = schedules.filter(s => s.id !== id);
  const result = safeStorage('set', KEYS.SCHEDULES, filtered);
  if (result) {
    const app = getApp();
    if (app) app.loadSchedules();
  }
  return result;
}

// ==================== 分类操作 ====================

/**
 * 获取所有分类列表
 * @returns {object[]} 分类数组，无数据返回空数组
 */
function getCategories() {
  return safeStorage('get', KEYS.CATEGORIES) || [];
}

/**
 * 根据 ID 获取单个分类
 * @param {string} id - 分类 ID
 * @returns {object|null} 分类对象，未找到返回 null
 */
function getCategory(id) {
  const categories = getCategories();
  return categories.find(c => c.id === id) || null;
}

/**
 * 保存分类（新增或更新）
 * @param {object} category - 分类对象（必须包含 id）
 * @returns {boolean} 保存是否成功
 * @description 保存成功后自动刷新 app.globalData.categories
 */
function saveCategory(category) {
  const categories = getCategories();
  const index = categories.findIndex(c => c.id === category.id);

  if (index >= 0) {
    categories[index] = { ...categories[index], ...category };
  } else {
    categories.push(category);
  }

  const result = safeStorage('set', KEYS.CATEGORIES, categories);
  if (result) {
    const app = getApp();
    if (app) app.loadCategories();
  }
  return result;
}

/**
 * 删除分类（按 ID）
 * @param {string} id - 分类 ID
 * @returns {boolean} 删除是否成功
 * @description
 *   - 保存成功后自动刷新 app.globalData.categories
 *   - 🔧 修复：将该分类下的知识点重置为未分类（categoryId 置空）
 */
function deleteCategory(id) {
  const categories = getCategories();
  const filtered = categories.filter(c => c.id !== id);
  const result = safeStorage('set', KEYS.CATEGORIES, filtered);
  if (result) {
    const app = getApp();
    if (app) app.loadCategories();
    // 🔧 修复：将该分类下的知识点重置为未分类
    resetKnowledgesCategory(id);
  }
  return result;
}

/**
 * 将指定分类下的所有知识点重置为未分类
 * @param {string} categoryId - 要清除的分类 ID
 * @description 删除分类时调用，将关联知识点的 categoryId 置为空字符串
 */
function resetKnowledgesCategory(categoryId) {
  const knowledges = getKnowledges();
  let changed = false;
  const updated = knowledges.map(k => {
    if (k.categoryId === categoryId) {
      changed = true;
      return { ...k, categoryId: '', updatedAt: now() };
    }
    return k;
  });
  if (changed) {
    const result = safeStorage('set', KEYS.KNOWLEDGES, updated);
    if (result) {
      const app = getApp();
      if (app) app.loadKnowledges();
    }
  }
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
 * @description 与已有设置合并，保留未修改的设置项
 */
function saveSettings(settings) {
  const current = getSettings();
  return safeStorage('set', KEYS.SETTINGS, { ...current, ...settings });
}

// ==================== 工具方法 ====================

/**
 * 获取存储使用情况
 * @returns {{ used: number, limit: number, keys: string[] }}
 *   - used: 已用空间（KB）
 *   - limit: 总空间限制（KB）
 *   - keys: 所有存储键名数组
 */
function getStorageInfo() {
  try {
    const info = wx.getStorageInfoSync();
    return {
      used: info.currentSize,       // KB
      limit: info.limitSize,        // KB
      keys: info.keys,
    };
  } catch (e) {
    console.error('getStorageInfo failed:', e);
    // 失败时返回默认值
    return { used: 0, limit: STORAGE_LIMIT, keys: [] };
  }
}

/**
 * 获取当前 ISO 格式时间戳
 * @returns {string} 如 "2026-07-29T10:30:00.000Z"
 * @description 用于 createdAt / updatedAt / completedAt 字段
 */
function now() {
  return new Date().toISOString();
}

module.exports = {
  // 知识点
  getKnowledges,
  getKnowledge,
  saveKnowledge,
  deleteKnowledge,
  // 复习计划
  getSchedules,
  getSchedule,
  getSchedulesByKnowledge,
  saveSchedule,
  saveSchedules,
  updateScheduleStatus,
  deleteSchedule,
  deleteSchedulesByKnowledge,
  // 分类
  getCategories,
  getCategory,
  saveCategory,
  deleteCategory,
  // 设置
  getSettings,
  saveSettings,
  // 工具
  getStorageInfo,
  resetKnowledgesCategory,
};
