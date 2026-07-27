# Capability: Learning Stats

## ADDED Requirements

### Requirement: 学习统计概览

"我的"页面 SHALL 展示用户的学习统计数据。

#### Scenario: 显示统计数据

- **WHEN** 用户进入"我的"页面
- **THEN** 系统 SHALL 显示:
  - 累计录入知识点总数
  - 学习中知识点数量（active 状态）
  - 已掌握知识点数量（mastered 状态）
  - 累计完成复习次数
  - 今日完成复习数量
  - 学习连续天数（可选）

#### Scenario: 空数据状态

- **WHEN** 用户刚使用，没有任何知识点
- **THEN** 系统 SHALL 显示引导"还没有知识点，开始录入吧"
- **AND** 提供"录入知识点"快捷入口

### Requirement: 最近学习记录

系统 SHALL 展示最近录入的知识点列表。

#### Scenario: 显示最近学习

- **WHEN** 用户进入"我的"页面
- **THEN** 系统 SHALL 显示最近 5 个录入的知识点
- **AND** 每个显示标题、录入日期、复习进度（如 2/6）
- **AND** 点击可跳转到详情页

#### Scenario: 查看全部

- **WHEN** 用户点击"查看全部"
- **THEN** 系统 SHALL 跳转到知识点列表页（可按分类/状态筛选）

### Requirement: 快捷入口

"我的"页面 SHALL 提供功能快捷入口。

#### Scenario: 快捷入口

- **WHEN** 用户进入"我的"页面
- **THEN** 系统 SHALL 显示以下入口:
  - 分类管理
  - 数据导出（预留）
  - 关于

## Technical Context

- 统计数据实时计算，不缓存
- 连续天数: 有录入或完成复习的天数（本地计算）
- 复习进度: done 的 ReviewSchedule 数量 / 6
