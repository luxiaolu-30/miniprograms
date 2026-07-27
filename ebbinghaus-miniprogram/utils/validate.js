/**
 * 表单验证工具
 */

/**
 * 验证知识点表单
 * @param {object} knowledge 知识点数据
 * @returns {{ valid: boolean, message: string }}
 */
function validateKnowledge(knowledge) {
  // 标题验证
  if (!knowledge.title || knowledge.title.trim().length === 0) {
    return { valid: false, message: '请输入知识点标题' };
  }
  if (knowledge.title.length > 100) {
    return { valid: false, message: '标题不能超过 100 个字符' };
  }

  // 内容验证
  if (knowledge.content && knowledge.content.length > 2000) {
    return { valid: false, message: '内容不能超过 2000 个字符' };
  }

  // 图片验证（可选，不强制）
  if (knowledge.images && knowledge.images.length > 9) {
    return { valid: false, message: '图片不能超过 9 张' };
  }

  // 标签验证
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
 */
function validateCategory(category) {
  if (!category.name || category.name.trim().length === 0) {
    return { valid: false, message: '请输入分类名称' };
  }
  if (category.name.length > 20) {
    return { valid: false, message: '分类名称不能超过 20 个字符' };
  }

  return { valid: true, message: '' };
}

module.exports = {
  validateKnowledge,
  validateCategory,
};
