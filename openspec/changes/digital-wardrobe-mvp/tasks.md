# Tasks: Digital Wardrobe MVP

## Task List

### Phase 1: 项目基础 (Project Foundation)

- [ ] **T1**: 初始化微信小程序项目
  - 创建 miniprogram 目录结构
  - 配置 app.json（路由、tabBar、窗口样式）
  - 配置 project.config.json
  - 创建全局样式变量（app.wxss）

- [ ] **T2**: 实现存储层 (utils/storage.js)
  - 封装 wx.storage CRUD API
  - 实现 getItems / saveItem / deleteItem
  - 实现 getCategories / saveCategory / deleteCategory
  - 实现 getStorageInfo / validateIntegrity
  - 错误处理和用户提示

- [ ] **T3**: 实现图片工具 (utils/image.js)
  - 图片压缩（1280px, quality 0.7）
  - 保存到本地文件系统（按 itemId 分目录）
  - 读取为可渲染路径
  - 批量删除
  - 临时文件清理

- [ ] **T4**: 实现预设品类数据 (utils/preset-categories.js)
  - 定义 4 个预设品类及其字段模板
  - 应用启动时检查并初始化预设品类

### Phase 2: 核心功能 (Core Features)

- [ ] **T5**: 实现首页浏览 (pages/index)
  - 物品列表渲染（网格/列表切换）
  - 品类筛选 chips
  - 搜索功能（名称/标签/备注/属性）
  - 空状态引导
  - 悬浮 + 按钮跳转录入

- [ ] **T6**: 实现物品录入页 (pages/item/edit)
  - 品类选择器
  - 多图选择器（拍照+相册，最多 9 张）
  - 动态表单渲染（根据品类字段模板）
  - 通用字段（名称/标签/备注/日期/方式/价格/位置）
  - 表单验证 + 保存

- [ ] **T7**: 实现物品详情页 (pages/item/detail)
  - 图片轮播 + 全屏查看
  - 所有属性展示
  - 编辑入口
  - 状态操作（标记闲置/处理）
  - 删除（二次确认）

- [ ] **T8**: 实现处理流程 (components/dispose-modal)
  - 处理方式选择
  - 处理表单（日期/价格/备注）
  - 状态变更 + 归档
  - 恢复功能

### Phase 3: 品类管理 (Category Management)

- [ ] **T9**: 实现分类管理页 (pages/category/index)
  - 品类列表展示（含物品数量）
  - 拖拽排序
  - 新增/编辑入口
  - 删除（含物品时阻止）

- [ ] **T10**: 实现品类编辑器 (pages/category/edit)
  - 名称和图标编辑
  - 字段模板 CRUD
  - 字段类型选择（text/number/select/date/boolean）
  - 字段选项配置（select 类型）
  - 字段排序
  - 影响范围提示

### Phase 4: 归档与统计 (Archive & Stats)

- [ ] **T11**: 实现归档页 (pages/archive)
  - 已处理物品列表（按日期倒序）
  - 按处理方式筛选
  - 恢复操作
  - 详情查看

- [ ] **T12**: 实现"我的"页 (pages/mine)
  - 统计概览（总数/品类分布/状态分布）
  - 最近录入列表
  - 快捷入口（归档/品类管理/导出）

### Phase 5: 数据导出与收尾 (Export & Polish)

- [ ] **T13**: 实现数据导出 (utils/export.js)
  - 全量数据序列化为 JSON
  - 保存为文件 + 微信分享
  - 导出前确认

- [ ] **T14**: 组件封装与复用
  - item-card 组件
  - image-picker 组件
  - dynamic-form 组件
  - category-chip 组件
  - status-badge 组件
  - empty-state 组件

- [ ] **T15**: 体验优化
  - 启动 loading
  - 图片加载占位
  - 操作反馈（toast/loading）
  - 左滑快捷操作
  - 数据完整性校验（启动时）

## Dependencies

```
T1 (项目初始化)
  └── T2 (存储层) + T3 (图片工具) + T4 (预设品类)
        └── T5 (首页) + T6 (录入) + T7 (详情) + T8 (处理)
              └── T9 (分类管理) + T10 (品类编辑器)
                    └── T11 (归档) + T12 (我的)
                          └── T13 (导出) + T14 (组件) + T15 (优化)
```

## Estimated Effort

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| Phase 1 | T1-T4 | 1-2 天 |
| Phase 2 | T5-T8 | 3-4 天 |
| Phase 3 | T9-T10 | 1-2 天 |
| Phase 4 | T11-T12 | 1 天 |
| Phase 5 | T13-T15 | 1-2 天 |
| **Total** | **15 tasks** | **7-11 天** |
