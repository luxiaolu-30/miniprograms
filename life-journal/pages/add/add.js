/**
 * ============================================================================
 * 写日记页 - add.js
 * ============================================================================
 *
 * 页面功能：
 *   创建新的日记条目，选择类型、心情，写下内容。
 *   保存后自动生成 6 次间隔回顾计划。
 *
 * 数据字段：
 *   - entryTypes: 所有条目类型列表
 *   - selectedType: 当前选中的类型
 *   - moodLevels: 心情等级列表
 *   - selectedMood: 当前选中的心情
 *   - title: 标题
 *   - content: 内容
 *   - tags: 标签列表
 *   - tagInput: 当前输入的标签
 *   - saving: 是否正在保存
 *
 * 业务流程：
 *   1. 选择类型（感悟/决定/目标/感恩/教训/记忆/经历）
 *   2. 选择心情（1-5）
 *   3. 填写标题和内容
 *   4. 可选添加标签
 *   5. 保存 → 生成回顾计划 → 返回
 * ============================================================================
 */

const app = getApp();
const storage = require('../../utils/storage.js');
const scheduleUtil = require('../../utils/schedule.js');
const entryTypeUtil = require('../../utils/entry-type.js');
const { generateId } = require('../../utils/uuid.js');

Page({
  data: {
    entryTypes: [],          // 类型列表
    selectedType: 'insight', // 默认类型
    moodLevels: [],          // 心情等级
    selectedMood: 3,         // 默认心情：一般
    title: '',
    content: '',
    tags: [],
    tagInput: '',
    saving: false,
    typePlaceholder: '写下你的想法...',
  },

  /**
   * 页面加载
   */
  onLoad() {
    const config = entryTypeUtil.getTypeConfig(this.data.selectedType);
    this.setData({
      entryTypes: entryTypeUtil.getTypeList(),
      moodLevels: entryTypeUtil.MOOD_LEVELS,
      typePlaceholder: config.placeholder,
    });
  },

  /**
   * 选择类型
   */
  onSelectType(e) {
    const type = e.currentTarget.dataset.type;
    const config = entryTypeUtil.getTypeConfig(type);
    this.setData({
      selectedType: type,
      typePlaceholder: config.placeholder,
    });
  },

  /**
   * 选择心情
   */
  onSelectMood(e) {
    const mood = Number(e.currentTarget.dataset.mood);
    this.setData({ selectedMood: mood });
  },

  /**
   * 标题输入
   */
  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  /**
   * 内容输入
   */
  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  /**
   * 标签输入
   */
  onTagInput(e) {
    this.setData({ tagInput: e.detail.value });
  },

  /**
   * 添加标签
   */
  onAddTag() {
    const tag = this.data.tagInput.trim();
    if (!tag) return;
    if (this.data.tags.includes(tag)) {
      wx.showToast({ title: '标签已存在', icon: 'none' });
      return;
    }
    if (this.data.tags.length >= 5) {
      wx.showToast({ title: '最多5个标签', icon: 'none' });
      return;
    }
    this.setData({
      tags: [...this.data.tags, tag],
      tagInput: '',
    });
  },

  /**
   * 删除标签
   */
  onRemoveTag(e) {
    const index = e.currentTarget.dataset.index;
    const tags = [...this.data.tags];
    tags.splice(index, 1);
    this.setData({ tags });
  },

  /**
   * 保存日记条目
   */
  onSave() {
    if (this.data.saving) return;

    // 验证
    const title = this.data.title.trim();
    const content = this.data.content.trim();

    if (!title) {
      wx.showToast({ title: '写个标题吧', icon: 'none' });
      return;
    }
    if (!content) {
      wx.showToast({ title: '写下你的想法吧', icon: 'none' });
      return;
    }

    this.setData({ saving: true });
    wx.showLoading({ title: '保存中...' });

    try {
      const now = app.now();
      const entryId = `et_${generateId()}`;

      // 创建条目
      const entry = {
        id: entryId,
        title,
        content,
        type: this.data.selectedType,
        mood: this.data.selectedMood,
        tags: this.data.tags,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };

      // 保存条目
      storage.saveEntry(entry);

      // 生成回顾计划
      const reflections = scheduleUtil.generateReflections(entryId, title, now);
      storage.saveReflections(reflections);

      wx.hideLoading();
      wx.showToast({ title: '记录成功 ✨', icon: 'success' });

      // 清空表单
      this.setData({
        title: '',
        content: '',
        tags: [],
        tagInput: '',
        saving: false,
      });

      // 延迟返回
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } catch (e) {
      wx.hideLoading();
      console.error('Save failed:', e);
      wx.showToast({ title: '保存失败', icon: 'none' });
      this.setData({ saving: false });
    }
  },
});
