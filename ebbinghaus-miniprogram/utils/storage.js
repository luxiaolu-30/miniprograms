/**
 * 存储层 - 封装 wx.storage 操作
 * 管理知识点、复习计划、分类、设置的持久化
 */

const KEYS = {
  KNOWLEDGES: 'eb_knowledges',
  SCHEDULES: 'eb_schedules',
  CATEGORIES: 'eb_categories',
  SETTINGS: 'eb_settings',
};

const STORAGE_LIMIT = 10 * 1024; // 10MB in KB

/**
 * 安全执行 storage 操作
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
      wx.showToast({
        title: '存储失败，空间可能不足',
        icon: 'none',
      });
    }
    return operation === 'get' ? null : false;
  }
}

// ==================== 知识点操作 ====================

function getKnowledges() {
  return safeStorage('get', KEYS.KNOWLEDGES) || [];
}

function getKnowledge(id) {
  const knowledges = getKnowledges();
  return knowledges.find(k => k.id === id) || null;
}

function saveKnowledge(knowledge) {
  const knowledges = getKnowledges();
  const index = knowledges.findIndex(k => k.id === knowledge.id);

  if (index >= 0) {
    knowledges[index] = { ...knowledges[index], ...knowledge, updatedAt: now() };
  } else {
    knowledges.unshift(knowledge);
  }

  const result = safeStorage('set', KEYS.KNOWLEDGES, knowledges);
  if (result) {
    const app = getApp();
    if (app) app.loadKnowledges();
  }
  return result;
}

function deleteKnowledge(id) {
  const knowledges = getKnowledges();
  const filtered = knowledges.filter(k => k.id !== id);
  const result = safeStorage('set', KEYS.KNOWLEDGES, filtered);
  if (result) {
    const app = getApp();
    if (app) app.loadKnowledges();
  }
  return result;
}

// ==================== 复习计划操作 ====================

function getSchedules() {
  return safeStorage('get', KEYS.SCHEDULES) || [];
}

function getSchedule(id) {
  const schedules = getSchedules();
  return schedules.find(s => s.id === id) || null;
}

function getSchedulesByKnowledge(knowledgeId) {
  const schedules = getSchedules();
  return schedules.filter(s => s.knowledgePointId === knowledgeId);
}

function saveSchedule(schedule) {
  const schedules = getSchedules();
  const index = schedules.findIndex(s => s.id === schedule.id);

  if (index >= 0) {
    schedules[index] = { ...schedules[index], ...schedule };
  } else {
    schedules.push(schedule);
  }

  const result = safeStorage('set', KEYS.SCHEDULES, schedules);
  if (result) {
    const app = getApp();
    if (app) app.loadSchedules();
  }
  return result;
}

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

function updateScheduleStatus(id, status) {
  const schedules = getSchedules();
  const index = schedules.findIndex(s => s.id === id);
  if (index >= 0) {
    schedules[index].status = status;
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

function getCategories() {
  return safeStorage('get', KEYS.CATEGORIES) || [];
}

function getCategory(id) {
  const categories = getCategories();
  return categories.find(c => c.id === id) || null;
}

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

function deleteCategory(id) {
  const categories = getCategories();
  const filtered = categories.filter(c => c.id !== id);
  const result = safeStorage('set', KEYS.CATEGORIES, filtered);
  if (result) {
    const app = getApp();
    if (app) app.loadCategories();
  }
  return result;
}

// ==================== 设置操作 ====================

function getSettings() {
  return safeStorage('get', KEYS.SETTINGS) || {};
}

function saveSettings(settings) {
  const current = getSettings();
  return safeStorage('set', KEYS.SETTINGS, { ...current, ...settings });
}

// ==================== 工具方法 ====================

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
    return { used: 0, limit: STORAGE_LIMIT, keys: [] };
  }
}

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
};
