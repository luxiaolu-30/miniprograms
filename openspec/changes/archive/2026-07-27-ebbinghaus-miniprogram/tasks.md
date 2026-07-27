# Tasks: Ebbinghaus Spaced Repetition Mini Program

## Task List

### Phase 1: 项目基础 (Project Foundation)

- [x] **T1**: 初始化微信小程序项目
  - 在 `D:\files\miniprograms\` 下创建 `ebbinghaus-miniprogram/` 目录
  - 配置 `app.json`（路由、tabBar、窗口样式）
  - 配置 `project.config.json`
  - 创建全局样式变量（`app.wxss`），主色调知性蓝 `#4A90D9`

- [x] **T2**: 实现存储层 (`utils/storage.js`)
  - 封装 wx.storage CRUD API
  - 实现 `getKnowledges / saveKnowledge / deleteKnowledge`
  - 实现 `getSchedules / saveSchedule / deleteSchedule / updateScheduleStatus`
  - 实现 `getCategories / saveCategory / deleteCategory`
  - 实现 `getSettings / saveSettings`
  - 错误处理和用户提示

- [x] **T3**: 实现图片工具 (`utils/image.js`)
  - 图片压缩（1280px, quality 0.7）
  - 保存到本地文件系统（按 knowledgeId 分目录）
  - 读取为可渲染路径
  - 批量删除
  - 选择图片（拍照/相册）

- [x] **T4**: 实现复习计划算法 (`utils/schedule.js`)
  - 定义间隔常量 `REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30]`
  - 实现 `generateSchedule(createdAt)` 生成 6 条计划
  - 实现 `getTodaySchedules()` 查询今日待复习（含逾期）
  - 实现 `getDateSchedules(date)` 查询指定日期
  - 实现 `getMonthStats(year, month)` 按月统计
  - 实现 `recalculateSchedules(knowledgeId, newDate)` 重新计算

- [x] **T5**: ~~实现云同步工具~~ **已放弃**
  - 改为纯本地版本，无云同步功能

### Phase 2: 核心页面 (Core Pages)

- [x] **T6**: 实现日历月视图 (`pages/calendar`)
  - 自研日历网格（6×7 网格）
  - 月份切换（上/下月、回到今天）
  - 日期格子显示待复习数量标记
  - 点击日期展开当天复习列表
  - 选中日期高亮
  - 顶部统计摘要（今日/本周/累计）

- [x] **T7**: 实现今日复习页 (`pages/today`)
  - 加载今日所有待复习（含逾期）
  - 按日期升序排列（逾期优先）
  - 复习卡片展示（标题、分类、第几次、是否逾期）
  - 点击"完成"按钮标记 done
  - 完成动画 + 正向激励
  - 空状态引导
  - 下拉刷新

- [x] **T8**: 实现知识点录入页 (`pages/add`)
  - 标题输入（必填，最多 100 字符）
  - 内容输入（多行文本，最多 2000 字符）
  - 图片选择器（拍照/相册，最多 9 张，压缩）
  - 分类选择器（可选，弹出列表）
  - 学习日期选择器（默认今天，可补录）
  - 表单验证 + 保存
  - 保存后生成复习计划

- [x] **T9**: 实现知识点详情页 (`pages/detail`)
  - 展示标题、内容、图片预览
  - 复习进度条（6 次完成状态可视化）
  - 编辑入口
  - 删除（二次确认）
  - 复习时间线

### Phase 3: 分类与统计 (Category & Stats)

- [x] **T10**: 实现分类管理页 (`pages/category`)
  - 分类列表展示（名称、图标、知识点数量）
  - 新建分类（名称 + emoji 图标选择）
  - 编辑分类
  - 删除分类（含知识点时阻止）
  - 空状态引导

- [x] **T11**: 实现"我的"页 (`pages/mine`)
  - 学习统计概览（总数/学习中/已掌握/今日完成）
  - 最近学习记录（最近 5 条）
  - 快捷入口（分类管理、关于）
  - 空数据引导

### Phase 4: 云函数与通知 (Cloud & Notification) - **已放弃**

- [x] **T12**: ~~实现每日提醒云函数~~ **已放弃**
  - 改为纯本地版本，无定时推送

- [x] **T13**: ~~配置订阅消息模板~~ **已放弃**
  - 一次性订阅无法满足定时推送需求

### Phase 5: 组件封装与优化 (Components & Polish)

- [x] **T14**: 组件封装
  - `empty-state` 空状态组件 ✅
  - `progress-bar` 进度条组件 ✅
  - `image-loader` 图片加载器组件 ✅

- [x] **T15**: 体验优化
  - 启动 loading + 数据初始化 ✅
  - 图片加载占位 ✅
  - 操作反馈（toast/loading/动画） ✅
  - 完成复习正向激励 ✅
  - 数据完整性校验（启动时） ✅

## Dependencies

```
T1 (项目初始化)
  └── T2 (存储层) + T3 (图片工具) + T4 (复习算法)
        └── T6 (日历) + T7 (今日) + T8 (录入) + T9 (详情)
              └── T10 (分类管理) + T11 (我的)
                    └── T14 (组件) + T15 (优化)
```

## Actual Effort

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1 | T1-T4 | ✅ 完成 |
| Phase 2 | T6-T9 | ✅ 完成 |
| Phase 3 | T10-T11 | ✅ 完成 |
| Phase 4 | T12-T13 | ❌ 已放弃（纯本地版本） |
| Phase 5 | T14-T15 | ✅ 完成 |
| **Total** | **13/15 tasks** | **核心功能完成** |
