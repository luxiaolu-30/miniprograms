/**
 * 表单验证工具
 */

/**
 * 验证物品表单
 * @param {object} item 物品数据
 * @param {object} category 品类数据（含字段模板）
 * @returns {{ valid: boolean, message: string }}
 */
function validateItem(item, category) {
  // 名称验证
  if (!item.name || item.name.trim().length === 0) {
    return { valid: false, message: '请输入物品名称' };
  }
  if (item.name.length > 50) {
    return { valid: false, message: '名称不能超过 50 个字符' };
  }

  // 图片验证
  if (!item.images || item.images.length === 0) {
    return { valid: false, message: '请至少添加一张图片' };
  }

  // 价格验证
  if (item.price !== undefined && item.price !== null && item.price !== '') {
    const price = Number(item.price);
    if (isNaN(price) || price < 0) {
      return { valid: false, message: '价格必须大于等于 0' };
    }
  }

  // 备注验证
  if (item.note && item.note.length > 500) {
    return { valid: false, message: '备注不能超过 500 个字符' };
  }

  // 标签验证
  if (item.tags && item.tags.length > 10) {
    return { valid: false, message: '标签不能超过 10 个' };
  }
  if (item.tags) {
    for (const tag of item.tags) {
      if (tag.length > 20) {
        return { valid: false, message: '单个标签不能超过 20 个字符' };
      }
    }
  }

  // 动态字段验证（必填项）
  if (category && category.fields) {
    for (const field of category.fields) {
      if (field.required) {
        const value = item.fields && item.fields[field.key];
        if (value === undefined || value === null || value === '') {
          return { valid: false, message: `请填写${field.label}` };
        }
      }
    }
  }

  return { valid: true, message: '' };
}

/**
 * 验证品类表单
 */
function validateCategory(category) {
  if (!category.name || category.name.trim().length === 0) {
    return { valid: false, message: '请输入品类名称' };
  }
  if (category.name.length > 20) {
    return { valid: false, message: '品类名称不能超过 20 个字符' };
  }

  // 验证字段 key 唯一性
  if (category.fields && category.fields.length > 0) {
    const keys = category.fields.map(f => f.key);
    const uniqueKeys = new Set(keys);
    if (keys.length !== uniqueKeys.size) {
      return { valid: false, message: '字段标识不能重复' };
    }

    // 验证字段
    for (const field of category.fields) {
      if (!field.key || !field.label) {
        return { valid: false, message: '字段标识和名称不能为空' };
      }
      if (field.type === 'select' && (!field.options || field.options.length === 0)) {
        return { valid: false, message: `字段"${field.label}"需要至少一个选项` };
      }
    }
  }

  return { valid: true, message: '' };
}

module.exports = {
  validateItem,
  validateCategory,
};
