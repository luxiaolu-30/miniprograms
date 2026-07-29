/**
 * ============================================================================
 * 表单验证工具 - validate.js
 * ============================================================================
 *
 * 文件用途：
 *   提供知识点和分类表单的前置校验，确保提交数据符合业务规则。
 *   所有验证函数返回统一格式：{ valid: boolean, message: string }
 *
 * 主要导出函数：
 *   - validateKnowledge(knowledge): 验证知识点表单
 *   - validateCategory(category): 验证分类表单
 *
 * 验证规则：
 *   ┌──────────┬────────────────┬──────────────────────────────┐
 *   │ 字段      │ 限制            │ 说明                          │
 *   ├──────────┼────────────────┼──────────────────────────────┤
 *   │ 知识点标题 │ 必填，≤100字符  │ 去除首尾空格后判断             │
 *   │ 知识点内容 │ 选填，≤2000字符 │ 为空跳过验证                   │
 *   │ 知识点图片 │ ≤9张           │ 与 MAX_IMAGES 常量保持一致     │
 *   │ 知识点标签 │ ≤10个，单个≤20字符│ 标签数量 + 单标签长度双重校验 │
 *   │ 分类名称   │ 必填，≤20字符   │ 去除首尾空格后判断             │
 *   └──────────┴────────────────┴──────────────────────────────┘
 *
 * 返回格式：
 *   - 验证通过：{ valid: true, message: '' }
 *   - 验证失败：{ valid: false, message: '错误提示文字' }
 *
 * 使用方式：
 *   const result = validateKnowledge(formData);
 *   if (!result.valid) {
 *     app.showError(result.message);
 *     return;
 *   }
 * ============================================================================
 */

/**
 * 验证知识点表单
 *
 * @param {object} knowledge - 知识点数据对象
 * @param {string} knowledge.title - 标题（必填）
 * @param {string} [knowledge.content] - 内容（选填）
 * @param {string[]} [knowledge.images] - 图片路径数组（选填）
 * @param {string[]} [knowledge.tags] - 标签数组（选填）
 * @returns {{ valid: boolean, message: string }} 验证结果
 *
 * @description
 *   验证顺序：标题 → 内容 → 图片 → 标签
 *   遇到第一个不满足的条件立即返回，不再继续后续校验
 */
function validateKnowledge(knowledge) {
  // ========== 标题验证（必填） ==========
  if (!knowledge.title || knowledge.title.trim().length === 0) {
    return { valid: false, message: '请输入知识点标题' };
  }
  // 🔧 修复：使用 trim 后的长度判断，避免首尾空格占用字符限额
  if (knowledge.title.trim().length > 100) {
    return { valid: false, message: '标题不能超过 100 个字符' };
  }

  // ========== 内容验证（选填，有值时校验长度） ==========
  if (knowledge.content && knowledge.content.length > 2000) {
    return { valid: false, message: '内容不能超过 2000 个字符' };
  }

  // ========== 图片验证（选填，限制数量） ==========
  if (knowledge.images && knowledge.images.length > 9) {
    return { valid: false, message: '图片不能超过 9 张' };
  }

  // ========== 标签验证（选填，限制数量和单标签长度） ==========
  if (knowledge.tags && knowledge.tags.length > 10) {
    return { valid: false, message: '标签不能超过 10 个' };
  }
  if (knowledge.tags) {
    for (const tag of knowledge.tags) {
      if (tag.length > 20) {
        return { valid: false, message: '单个标签不能超过 20 个字符' };
      }
    }
  }

  return { valid: true, message: '' };
}

/**
 * 验证分类表单
 *
 * @param {object} category - 分类数据对象
 * @param {string} category.name - 分类名称（必填）
 * @returns {{ valid: boolean, message: string }} 验证结果
 *
 * @description
 *   分类名称必填，去除首尾空格后判断，最长 20 字符
 */
function validateCategory(category) {
  if (!category.name || category.name.trim().length === 0) {
    return { valid: false, message: '请输入分类名称' };
  }
  // 🔧 修复：使用 trim 后的长度判断，避免首尾空格占用字符限额
  if (category.name.trim().length > 20) {
    return { valid: false, message: '分类名称不能超过 20 个字符' };
  }

  return { valid: true, message: '' };
}

module.exports = {
  validateKnowledge,
  validateCategory,
};
