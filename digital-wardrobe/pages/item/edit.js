/**
 * ============================================================================
 * 物品录入/编辑页 - 物品信息录入与修改
 * ============================================================================
 *
 * 【页面功能】
 *   - 新建物品：录入名称、图片、品类、动态字段、标签、备注、获取方式等信息
 *   - 编辑物品：修改已有物品的信息，支持清理已移除的图片
 *   - 动态字段：根据所选品类的字段模板动态渲染表单
 *
 * 【生命周期行为】
 *   - onLoad : 加载品类列表；若携带 id 参数则进入编辑模式，加载物品数据
 *
 * 【数据字段 (data)】
 *   - isEdit          : 是否为编辑模式
 *   - itemId          : 物品 ID（编辑模式）
 *   - categories      : 品类列表（用于品类选择器）
 *   - selectedCategory: 当前选中的品类对象（含 fields 模板）
 *   - categoryFields  : 当前品类的动态字段模板列表
 *   - name            : 物品名称
 *   - images          : 图片路径列表
 *   - fields          : 动态字段值 { key: value }
 *   - tags            : 标签列表
 *   - tagInput        : 标签输入框当前值
 *   - note            : 备注
 *   - acquiredDate    : 获取日期（YYYY-MM-DD 格式）
 *   - acquiredMethod  : 获取方式（purchased/gift/self-made/other）
 *   - price           : 价格（字符串，保存时转数字）
 *   - location        : 存放位置
 *   - showCategoryPicker : 品类选择器显示状态
 *   - saving          : 保存中状态标识（防重复提交）
 *   - methodOptions   : 获取方式选项列表
 *
 * 【页面路由参数 (options)】
 *   - id? : 物品 ID，存在则为编辑模式，不存在则为新建模式
 *
 * 【依赖】
 *   - storage.getItem(id)   : 获取物品数据
 *   - storage.saveItem(item): 保存物品
 *   - imageUtil.saveImages : 保存图片到正式目录
 *   - imageUtil.deleteImage: 删除已移除的图片
 *   - validate.validateItem: 物品表单验证
 */

const app = getApp();
const storage = require('../../utils/storage.js');
const imageUtil = require('../../utils/image.js');
const validate = require('../../utils/validate.js');
const { generateId, now } = require('../../utils/uuid.js');

Page({
  data: {
    isEdit: false,              // 是否为编辑模式
    itemId: '',                 // 物品 ID（编辑模式）
    categories: [],             // 品类列表（用于品类选择器）
    selectedCategory: null,     // 当前选中的品类对象
    categoryFields: [],         // 当前品类的动态字段模板列表
    name: '',                   // 物品名称
    images: [],                 // 图片路径列表
    fields: {},                 // 动态字段值 { key: value }
    tags: [],                   // 标签列表
    tagInput: '',               // 标签输入框当前值
    note: '',                   // 备注
    acquiredDate: '',           // 获取日期（YYYY-MM-DD 格式）
    acquiredMethod: 'purchased', // 获取方式（默认：购买）
    price: '',                  // 价格（字符串，保存时转数字）
    location: '',               // 存放位置
    showCategoryPicker: false,  // 品类选择器显示状态
    saving: false,              // 保存中状态标识（防重复提交）
    // 获取方式选项列表
    methodOptions: [
      { value: 'purchased', label: '购买' },
      { value: 'gift', label: '赠送' },
      { value: 'self-made', label: '自制' },
      { value: 'other', label: '其他' },
    ],
  },

  /**
   * 页面加载
   * 加载品类列表；若携带 id 参数则进入编辑模式
   * @param {Object} options - 路由参数
   * @param {string} [options.id] - 物品 ID
   */
  onLoad(options) {
    const categories = app.globalData.categories;
    this.setData({ categories });

    if (options.id) {
      // 编辑模式：加载物品数据
      this.loadItem(options.id);
    }
  },

  /**
   * 加载物品数据（编辑模式）
   * 从存储中读取物品信息并填充到表单
   * @param {string} id - 物品 ID
   */
  loadItem(id) {
    const item = storage.getItem(id);
    if (!item) {
      wx.showToast({ title: '物品不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    // 根据品类 ID 获取品类对象（含动态字段模板）
    const category = app.getCategoryById(item.categoryId);
    this.setData({
      isEdit: true,
      itemId: id,
      name: item.name,
      images: [...(item.images || [])],
      selectedCategory: category,
      categoryFields: category ? category.fields : [],
      fields: { ...(item.fields || {}) },
      tags: [...(item.tags || [])],
      note: item.note || '',
      // ISO 日期字符串转为 YYYY-MM-DD 格式（用于日期选择器）
      acquiredDate: item.acquiredDate ? item.acquiredDate.split('T')[0] : '',
      acquiredMethod: item.acquiredMethod || 'purchased',
      price: item.price !== undefined ? String(item.price) : '',
      location: item.location || '',
    });
  },

  /**
   * 显示品类选择器
   */
  onShowCategoryPicker() {
    this.setData({ showCategoryPicker: true });
  },

  /**
   * 隐藏品类选择器
   */
  onHideCategoryPicker() {
    this.setData({ showCategoryPicker: false });
  },

  /**
   * 选择品类
   * 更换品类时清空动态字段（避免旧字段值与新模板不匹配）
   * @param {Object} e - 事件对象，e.currentTarget.dataset.id 为品类 ID
   */
  onSelectCategory(e) {
    const { id } = e.currentTarget.dataset;
    const category = app.getCategoryById(id);

    // 🔧 修复：品类不存在时给出提示并阻止后续访问，避免空指针
    if (!category) {
      wx.showToast({ title: '品类不存在', icon: 'none' });
      return;
    }

    // 如果更换品类（或首次选择），清空动态字段值
    let fields = this.data.fields;
    if (!this.data.selectedCategory || this.data.selectedCategory.id !== id) {
      fields = {};
    }

    this.setData({
      selectedCategory: category,
      categoryFields: category.fields || [], // 更新动态字段模板
      fields,
      showCategoryPicker: false,
    });
  },

  /**
   * 名称输入
   * @param {Object} e - 事件对象，e.detail.value 为输入值
   */
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  /**
   * 图片变化（由 image-picker 组件触发）
   * @param {Object} e - 事件对象，e.detail.images 为图片路径列表
   */
  onImagesChange(e) {
    this.setData({ images: e.detail.images });
  },

  /**
   * 动态字段变化（由 dynamic-form 组件触发）
   * @param {Object} e - 事件对象，e.detail.formData 为字段值对象
   */
  onFieldsChange(e) {
    this.setData({ fields: e.detail.formData });
  },

  /**
   * 标签输入
   * @param {Object} e - 事件对象，e.detail.value 为输入值
   */
  onTagInput(e) {
    this.setData({ tagInput: e.detail.value });
  },

  /**
   * 添加标签
   * 业务规则：标签不能为空、不能重复、最多 10 个
   */
  onAddTag() {
    const tag = this.data.tagInput.trim();
    if (!tag) return;
    if (this.data.tags.includes(tag)) {
      wx.showToast({ title: '标签已存在', icon: 'none' });
      return;
    }
    if (this.data.tags.length >= 10) {
      wx.showToast({ title: '最多 10 个标签', icon: 'none' });
      return;
    }
    this.setData({
      tags: [...this.data.tags, tag],
      tagInput: '', // 清空输入框
    });
  },

  /**
   * 移除标签
   * @param {Object} e - 事件对象，e.currentTarget.dataset.index 为标签索引
   */
  onRemoveTag(e) {
    const { index } = e.currentTarget.dataset;
    const tags = this.data.tags.filter((_, i) => i !== index);
    this.setData({ tags });
  },

  /**
   * 备注输入
   * @param {Object} e - 事件对象，e.detail.value 为输入值
   */
  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  /**
   * 获取方式变化（picker 组件触发）
   * @param {Object} e - 事件对象，e.detail.value 为选项索引
   */
  onMethodChange(e) {
    const index = e.detail.value;
    const method = this.data.methodOptions[index].value;
    this.setData({ acquiredMethod: method });
  },

  /**
   * 获取日期变化（日期选择器触发）
   * @param {Object} e - 事件对象，e.detail.value 为 YYYY-MM-DD 格式日期
   */
  onDateChange(e) {
    this.setData({ acquiredDate: e.detail.value });
  },

  /**
   * 价格输入
   * @param {Object} e - 事件对象，e.detail.value 为输入值
   */
  onPriceInput(e) {
    this.setData({ price: e.detail.value });
  },

  /**
   * 存放位置输入
   * @param {Object} e - 事件对象，e.detail.value 为输入值
   */
  onLocationInput(e) {
    this.setData({ location: e.detail.value });
  },

  /**
   * 保存物品
   * 流程：构建数据 -> 验证 -> 处理图片 -> 保存到存储 -> 返回上一页
   * @description
   *   - 编辑模式：保留原有 id/status/createdAt/disposeInfo/previousDispose，清理已移除的图片
   *   - 新建模式：生成 id，状态设为 active，图片保存到正式目录
   */
  async onSave() {
    if (this.data.saving) return; // 防重复提交

    // 构建物品对象
    const item = {
      name: this.data.name.trim(),
      categoryId: this.data.selectedCategory ? this.data.selectedCategory.id : '',
      images: this.data.images,
      fields: this.data.fields,
      tags: this.data.tags,
      note: this.data.note.trim(),
      // 日期字符串转为 ISO 格式存储
      acquiredDate: this.data.acquiredDate ? new Date(this.data.acquiredDate).toISOString() : '',
      acquiredMethod: this.data.acquiredMethod,
      price: this.data.price !== '' ? Number(this.data.price) : undefined,
      location: this.data.location.trim(),
    };

    // 表单验证（含名称、图片、价格、备注、标签、动态必填字段）
    const category = this.data.selectedCategory;
    const result = validate.validateItem(item, category);
    if (!result.valid) {
      wx.showToast({ title: result.message, icon: 'none' });
      return;
    }

    this.setData({ saving: true });

    try {
      wx.showLoading({ title: '保存中...' });

      if (this.data.isEdit) {
        // ========== 编辑模式 ==========
        const existing = storage.getItem(this.data.itemId);
        item.id = this.data.itemId;
        item.createdAt = existing.createdAt;         // 保留原创建时间
        item.status = existing.status;               // 保留原状态（不因编辑改变状态）
        item.disposeInfo = existing.disposeInfo;     // 保留处理信息
        item.previousDispose = existing.previousDispose; // 保留历史处理记录

        // 处理图片：删除用户从列表中移除的图片文件
        const oldImages = existing.images || [];
        const newImages = this.data.images;
        const toDelete = oldImages.filter(img => !newImages.includes(img));
        toDelete.forEach(img => imageUtil.deleteImage(img));

        // 保存物品（storage 层会自动更新 updatedAt）
        storage.saveItem(item);
      } else {
        // ========== 新建模式 ==========
        item.id = generateId('item');                // 生成物品 ID（前缀 item）
        item.status = 'active';                       // 新物品默认状态：在用
        item.createdAt = now();                       // 创建时间 ISO 字符串
        item.updatedAt = now();                       // 更新时间 ISO 字符串

        // 保存图片到正式目录（从临时路径复制到持久化目录）
        // 🔧 修复：saveImages 已改为异步返回 Promise，需 await 获取实际路径数组
        const savedImages = await imageUtil.saveImages(item.id, this.data.images);
        item.images = savedImages;

        storage.saveItem(item);
      }

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });

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
