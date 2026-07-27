# Capability: Today Review

## ADDED Requirements

### Requirement: 今日待复习列表

系统 SHALL 展示今天所有待复习的知识点列表（含逾期）。

#### Scenario: 加载今日复习列表

- **WHEN** 用户打开今日页面
- **THEN** 系统 SHALL 查询所有 scheduledDate <= 今天 且 status = "pending" 的 ReviewSchedule
- **AND** 按 scheduledDate 升序排列（逾期优先）
- **AND** 关联 KnowledgePoint 获取完整信息
- **AND** 显示每个知识点的标题、分类、第几次复习、是否逾期

#### Scenario: 今日无待复习

- **WHEN** 用户打开今日页面但没有待复习内容
- **THEN** 系统 SHALL 显示空状态"今天没有复习计划，休息一下吧 🎉"
- **AND** 提供"录入新知识点"快捷入口

### Requirement: 完成复习操作

系统 SHALL 允许用户标记复习完成。

#### Scenario: 点击完成按钮

- **WHEN** 用户点击某知识点的"完成"按钮
- **THEN** 系统 SHALL:
  1. 更新 ReviewSchedule.status = "done"
  2. 记录 completedAt
  3. 同步到云数据库
  4. 从列表中移除该条目（带动画）
  5. 显示 toast "已完成，还剩 N 个"

#### Scenario: 左滑完成

- **WHEN** 用户左滑某个复习卡片
- **THEN** 系统 SHALL 显示"完成"快捷按钮
- **AND** 点击后执行与点击完成按钮相同的操作

#### Scenario: 全部完成

- **WHEN** 用户完成最后一个待复习
- **THEN** 系统 SHALL 显示空状态"今日复习全部完成！🎉"
- **AND** 显示今日完成统计

### Requirement: 复习详情查看

系统 SHALL 允许用户查看知识点完整内容。

#### Scenario: 点击复习卡片

- **WHEN** 用户点击某个复习卡片
- **THEN** 系统 SHALL 跳转到知识点详情页
- **AND** 详情页 SHALL 显示标题、内容、图片、复习进度

### Requirement: 订阅授权

系统 SHALL 引导用户授权每日通知订阅。

#### Scenario: 首次进入今日页

- **WHEN** 用户首次进入今日页且未授权订阅
- **THEN** 系统 SHALL 显示订阅引导横幅
- **AND** 用户点击"开启提醒"后调用 `wx.requestSubscribeMessage`
- **AND** 授权成功后隐藏横幅，显示"已开启每日提醒"

#### Scenario: 授权被拒绝

- **WHEN** 用户拒绝订阅授权
- **THEN** 系统 SHALL 温和提示"开启提醒不会错过复习哦"
- **AND** 不强制要求，用户可继续使用

## Technical Context

- 查询条件: `scheduledDate <= formatDate(today) AND status = "pending"`
- 排序: `scheduledDate ASC`（逾期优先），同日期按 reviewIndex ASC
- 订阅消息模板ID: 需在微信公众平台申请
- 空状态插画: 使用 emoji 或简单图标
