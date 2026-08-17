/**
 * ============================================================================
 * 存储层 - 封装 wx.storage 同步操作，管理物品、品类、设置的持久化
 * ============================================================================
 *
 * 【核心存储 Key 约定】
 *   - dw_items       : 衣物/藏品物品列表（Array<Item>）
 *   - dw_categories  : 品类列表（Array<Category>），含自定义字段模板
 *   - dw_settings    : 用户设置（Object），如主题、排序偏好等
 *
 * 【数据模型】
 *   Item = {
 *     id, name, images: string[], categoryId, price, note, tags: string[],
 *     fields: { [key]: any },  // 动态字段，由品类模板定义
 *     createdAt, updatedAt
 *   }
 *   Category = {
 *     id, name, icon, isBuiltIn, sortOrder, createdAt,
 *     fields: Field[]  // 字段模板
 *   }
 *   Field = { key, label, type, options?, required, sortOrder }
 *
 * 【CRUD 约定】
 *   - 保存物品/品类后，自动调用 app.loadItems() / app.loadCategories() 刷新全局状态
 *   - 所有写操作均通过 safeStorage 捕获异常，避免存储溢出导致崩溃
 *
 * 【导出函数】
 *   getItems / getItem / saveItem / deleteItem
 *   getCategories / getCategory / saveCategory / deleteCategory
 *   getSettings / saveSettings
 *   getStorageInfo / validateIntegrity / exportData
 */

/**
 * 本地存储 Key 常量
 * 使用 'dw_' 前缀避免与其他小程序数据冲突
 */
const KEYS = {
  ITEMS: 'dw_items',       // 物品列表存储 key
  CATEGORIES: 'dw_categories', // 品类列表存储 key
  SETTINGS: 'dw_settings',     // 用户设置存储 key
};

/**
 * 微信小程序本地存储单 key 上限（单位：KB）
 * 微信官方限制为 10MB，此处用于 getStorageInfo 失败时的兜底值
 */
const STORAGE_LIMIT = 10 * 1024; // 10MB in KB

/**
 * 安全执行 storage 操作（同步）
 * 统一捕获异常，写操作失败时给用户 toast 提示
 *
 * @param {'get'|'set'|'remove'} operation - 操作类型
 * @param {string} key - 存储键名
 * @param {any} [data] - 写入数据（仅 set 操作需要）
 * @returns {any} get 返回数据（失败返回 null），set/remove 返回 boolean
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
    // 仅写操作失败时提示用户，避免存储溢出导致体验下降
    if (operation === 'set') {
      wx.showToast({
        title: '存储失败，空间可能不足',
        icon: 'none',
      });
    }
    // get 失败返回 null 便于调用方兜底，set/remove 返回 false 表示失败
    return operation === 'get' ? null : false;
  }
}

// ==================== 物品操作 ====================

/**
 * 获取全部物品列表
 * @returns {Item[]} 物品数组，无数据时返回空数组
 */
function getItems() {
  return safeStorage('get', KEYS.ITEMS) || [];
}

/**
 * 根据 ID 获取单个物品
 * @param {string} id - 物品唯一标识
 * @returns {Item|null} 找到返回物品对象，未找到返回 null
 */
function getItem(id) {
  const items = getItems();
  return items.find(item => item.id === id) || null;
}

/**
 * 保存物品（新增或更新）
 * - 已存在（同 id）则合并更新，并自动写入 updatedAt
 * - 不存在则插入到数组头部（最新物品在前）
 * - 保存成功后自动刷新全局 app.loadItems()
 *
 * @param {Item} item - 物品数据（必须含 id）
 * @returns {boolean} 是否保存成功
 */
function saveItem(item) {
  const items = getItems();
  const index = items.findIndex(i => i.id === item.id);
  const ts = now();

  if (index >= 0) {
    // 更新：合并旧数据与新数据，自动更新 updatedAt 时间戳，保留原 createdAt
    items[index] = { ...items[index], ...item, updatedAt: ts };
  } else {
    // 新增：插入到数组头部，保证列表按时间倒序；自动补全时间戳
    // 🔧 修复：新增时补全 createdAt/updatedAt，避免时间字段缺失
    items.unshift({ ...item, createdAt: ts, updatedAt: ts });
  }

  const result = safeStorage('set', KEYS.ITEMS, items);
  if (result) {
    // 刷新全局状态，保证页面数据一致性
    const app = getApp();
    if (app) app.loadItems();
  }
  return result;
}

/**
 * 删除指定物品
 * @param {string} id - 物品唯一标识
 * @returns {boolean} 是否删除成功
 */
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

/**
 * 获取全部品类列表
 * @returns {Category[]} 品类数组，无数据时返回空数组
 */
function getCategories() {
  return safeStorage('get', KEYS.CATEGORIES) || [];
}

/**
 * 根据 ID 获取单个品类
 * @param {string} id - 品类唯一标识
 * @returns {Category|null} 找到返回品类对象，未找到返回 null
 */
function getCategory(id) {
  const categories = getCategories();
  return categories.find(c => c.id === id) || null;
}

/**
 * 保存品类（新增或更新）
 * - 已存在（同 id）则合并更新
 * - 不存在则追加到数组尾部
 * - 保存成功后自动刷新全局 app.loadCategories()
 *
 * @param {Category} category - 品类数据（必须含 id 和 fields 模板）
 * @returns {boolean} 是否保存成功
 */
function saveCategory(category) {
  const categories = getCategories();
  const index = categories.findIndex(c => c.id === category.id);

  if (index >= 0) {
    // 更新：合并旧数据与新数据，保留原 createdAt
    categories[index] = { ...categories[index], ...category };
  } else {
    // 新增：追加到尾部（新增品类不改变已有排序）；自动补全 createdAt
    // 🔧 修复：新增时补全 createdAt，避免时间字段缺失
    categories.push({ ...category, createdAt: now() });
  }

  const result = safeStorage('set', KEYS.CATEGORIES, categories);
  if (result) {
    const app = getApp();
    if (app) app.loadCategories();
  }
  return result;
}

/**
 * 删除指定品类
 * 若该品类下仍有关联物品，拒绝删除并提示调用方（返回 null），
 * 避免物品 categoryId 悬空（orphan）。
 *
 * @param {string} id - 品类唯一标识
 * @returns {boolean|null} 成功返回 true，存在关联物品返回 null，存储失败返回 false
 */
function deleteCategory(id) {
  // 🔧 修复：删除前检查关联物品，防止 categoryId 悬空
  const items = getItems();
  const hasRelatedItems = items.some(item => item.categoryId === id);
  if (hasRelatedItems) {
    console.warn(`deleteCategory blocked: category ${id} still has related items`);
    return null;
  }

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

/**
 * 获取用户设置
 * @returns {Object} 设置对象，无数据时返回空对象
 */
function getSettings() {
  return safeStorage('get', KEYS.SETTINGS) || {};
}

/**
 * 合并保存用户设置（浅合并）
 * 仅更新传入的字段，保留其他已有设置
 *
 * @param {Object} settings - 需要更新的设置字段
 * @returns {boolean} 是否保存成功
 */
function saveSettings(settings) {
  const current = getSettings();
  return safeStorage('set', KEYS.SETTINGS, { ...current, ...settings });
}

// ==================== 工具方法 ====================

/**
 * 获取本地存储使用情况
 * @returns {{ used: number, limit: number, keys: string[] }}
 *   - used  已用空间（KB）
 *   - limit 空间上限（KB）
 *   - keys  当前所有存储键名
 */
function getStorageInfo() {
  try {
    const info = wx.getStorageInfoSync();
    return {
      used: info.currentSize,       // 已用空间 KB
      limit: info.limitSize,        // 空间上限 KB
      keys: info.keys,              // 所有键名列表
    };
  } catch (e) {
    console.error('getStorageInfo failed:', e);
    // 失败时返回兜底值，避免页面崩溃
    return { used: 0, limit: STORAGE_LIMIT, keys: [] };
  }
}

/**
 * 校验数据完整性
 * 检查每个物品引用的图片文件是否仍存在于本地文件系统，
 * 同时检测 categoryId 悬空（引用了不存在的品类）。
 *
 * @returns {{ orphans: string[], missing: string[] }}
 *   - orphans: 悬空品类引用的物品 ID 列表
 *   - missing: 已丢失的图片路径列表
 * @description
 *   遍历全部物品：
 *     1. 对每张图片调用 fs.accessSync 探测文件是否存在；
 *     2. 检查 categoryId 是否仍存在于 categories 中，否则记入 orphans。
 */
function validateIntegrity() {
  const items = getItems();
  const categories = getCategories();
  const categoryIds = new Set(categories.map(c => c.id));

  const orphans = []; // 引用了不存在品类的物品 ID 列表
  const missing = [];

  const fs = wx.getFileSystemManager();

  items.forEach(item => {
    // 🔧 修复：实现 orphan categoryId 检测
    if (item.categoryId && !categoryIds.has(item.categoryId)) {
      orphans.push(item.id);
    }

    if (item.images && item.images.length > 0) {
      item.images.forEach(imgPath => {
        try {
          fs.accessSync(imgPath); // 探测文件是否存在
        } catch (e) {
          missing.push(imgPath);  // 文件丢失，记录路径
        }
      });
    }
  });

  return { orphans, missing };
}

/**
 * 导出全部数据为 JSON 文件（备份）
 * 写入到小程序用户数据目录，返回文件路径供分享
 *
 * @returns {string|null} 导出文件的完整路径，失败返回 null
 * @description
 *   导出结构：{ version, exportDate, items, categories, settings }
 *   文件名含时间戳避免覆盖，使用中文前缀便于用户识别
 */
function exportData() {
  const data = {
    version: '1.0',         // 数据格式版本，便于后续迁移兼容
    exportDate: now(),      // 导出时间（ISO 格式）
    items: getItems(),
    categories: getCategories(),
    settings: getSettings(),
  };

  const jsonStr = JSON.stringify(data, null, 2); // 2 空格缩进，便于用户阅读
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

/**
 * 获取当前时间的 ISO 格式字符串
 * 统一时间格式，便于排序和导出
 * @returns {string} 如 '2026-07-29T12:34:56.789Z'
 */
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
