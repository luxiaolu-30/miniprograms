/**
 * 存储层 - 封装 wx.storage 操作
 * 管理物品、品类、设置的持久化
 */

const KEYS = {
  ITEMS: 'dw_items',
  CATEGORIES: 'dw_categories',
  SETTINGS: 'dw_settings',
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

// ==================== 物品操作 ====================

function getItems() {
  return safeStorage('get', KEYS.ITEMS) || [];
}

function getItem(id) {
  const items = getItems();
  return items.find(item => item.id === id) || null;
}

function saveItem(item) {
  const items = getItems();
  const index = items.findIndex(i => i.id === item.id);

  if (index >= 0) {
    items[index] = { ...items[index], ...item, updatedAt: now() };
  } else {
    items.unshift(item);
  }

  const result = safeStorage('set', KEYS.ITEMS, items);
  if (result) {
    const app = getApp();
    if (app) app.loadItems();
  }
  return result;
}

function deleteItem(id) {
  const items = getItems();
  const filtered = items.filter(i => i.id !== id);
  const result = safeStorage('set', KEYS.ITEMS, filtered);
  if (result) {
    const app = getApp();
    if (app) app.loadItems();
  }
  return result;
}

// ==================== 品类操作 ====================

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

function validateIntegrity() {
  const items = getItems();
  const orphans = [];
  const missing = [];

  const fs = wx.getFileSystemManager();
  const imageDir = `${wx.env.USER_DATA_PATH}/images`;

  items.forEach(item => {
    if (item.images && item.images.length > 0) {
      item.images.forEach(imgPath => {
        try {
          fs.accessSync(imgPath);
        } catch (e) {
          missing.push(imgPath);
        }
      });
    }
  });

  return { orphans, missing };
}

function exportData() {
  const data = {
    version: '1.0',
    exportDate: now(),
    items: getItems(),
    categories: getCategories(),
    settings: getSettings(),
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const filePath = `${wx.env.USER_DATA_PATH}/电子衣橱_export_${Date.now()}.json`;

  try {
    const fs = wx.getFileSystemManager();
    fs.writeFileSync(filePath, jsonStr, 'utf8');
    return filePath;
  } catch (e) {
    console.error('Export failed:', e);
    return null;
  }
}

// ==================== 辅助函数 ====================

function now() {
  return new Date().toISOString();
}

module.exports = {
  // 物品
  getItems,
  getItem,
  saveItem,
  deleteItem,
  // 品类
  getCategories,
  getCategory,
  saveCategory,
  deleteCategory,
  // 设置
  getSettings,
  saveSettings,
  // 工具
  getStorageInfo,
  validateIntegrity,
  exportData,
};
