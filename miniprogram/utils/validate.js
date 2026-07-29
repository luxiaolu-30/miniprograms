/**
 * ============================================================================
 * 表单验证工具 - 物品与品类表单的前置校验
 * ============================================================================
 *
 * 【验证策略】
 *   - 采用"短路"模式：遇到第一个不通过项立即返回错误，提升性能
 *   - 返回统一结构 { valid, message }，便于页面直接绑定提示
 *
 * 【校验维度】
 *   - 物品：名称、图片、价格、备注、标签、品类动态必填字段
 *   - 品类：名称、字段模板（key 唯一性、必填项、select 选项）
 *
 * 【导出函数】
 *   validateItem / validateCategory
 */

/**
 * 验证物品表单数据
 * 按字段重要性依次校验，任一失败即返回错误信息
 *
 * @param {Item} item - 物品数据
 * @param {Category} category - 所属品类（含动态字段模板），用于必填项校验
 * @returns {{ valid: boolean, message: string }} 校验结果
 */
function validateItem(item, category) {
  // 🔧 修复：防御 item 为 null/undefined 的情况
  if (!item) {
    return { valid: false, message: '物品数据不能为空' };
  }

  // 名称：必填，去空后长度 > 0，最大 50 字符
  if (!item.name || item.name.trim().length === 0) {
    return { valid: false, message: '请输入物品名称' };
  }
  if (item.name.length > 50) {
    return { valid: false, message: '名称不能超过 50 个字符' };
  }

  // 图片：至少一张
  if (!item.images || item.images.length === 0) {
    return { valid: false, message: '请至少添加一张图片' };
  }

  // 价格：填写了才校验，允许为空（非必填）；填写则必须 ≥ 0
  if (item.price !== undefined && item.price !== null && item.price !== '') {
    const price = Number(item.price);
    if (isNaN(price) || price < 0) {
      return { valid: false, message: '价格必须大于等于 0' };
    }
  }

  // 备注：填写了才校验，最大 500 字符
  if (item.note && item.note.length > 500) {
    return { valid: false, message: '备注不能超过 500 个字符' };
  }

  // 标签：最多 10 个，单个最长 20 字符
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

  // 动态字段：仅校验品类模板中标记为 required 的字段
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
 * 验证品类表单数据（创建/编辑品类）
 * 重点校验字段模板的合法性：key 唯一、必填字段完整、select 有选项
 *
 * @param {Category} category - 品类数据
 * @returns {{ valid: boolean, message: string }} 校验结果
 */
function validateCategory(category) {
  // 🔧 修复：防御 category 为 null/undefined 的情况
  if (!category) {
    return { valid: false, message: '品类数据不能为空' };
  }

  // 品类名称：必填，最大 20 字符
  if (!category.name || category.name.trim().length === 0) {
    return { valid: false, message: '请输入品类名称' };
  }
  if (category.name.length > 20) {
    return { valid: false, message: '品类名称不能超过 20 个字符' };
  }

  // 字段 key 必须唯一，避免动态字段冲突
  if (category.fields && category.fields.length > 0) {
    const keys = category.fields.map(f => f.key);
    const uniqueKeys = new Set(keys);
    if (keys.length !== uniqueKeys.size) {
      return { valid: false, message: '字段标识不能重复' };
    }

    // 逐字段校验
    for (const field of category.fields) {
      if (!field.key || !field.label) {
        return { valid: false, message: '字段标识和名称不能为空' };
      }
      // select 类型必须提供至少一个选项
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
