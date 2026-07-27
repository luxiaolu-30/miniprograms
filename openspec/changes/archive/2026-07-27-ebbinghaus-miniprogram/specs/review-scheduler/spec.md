# Capability: Review Scheduler

## ADDED Requirements

### Requirement: 复习计划生成

系统 SHALL 根据艾宾浩斯遗忘曲线自动生成 6 次复习计划。

#### Scenario: 新知识点生成复习计划

- **WHEN** 用户保存一个学习日期为 2026-07-27 的知识点
- **THEN** 系统 SHALL 生成 6 条 ReviewSchedule:
  - R1: scheduledDate = 2026-07-28 (+1 天)
  - R2: scheduledDate = 2026-07-30 (+3 天)
  - R3: scheduledDate = 2026-08-03 (+7 天)
  - R4: scheduledDate = 2026-08-10 (+14 天)
  - R5: scheduledDate = 2026-08-25 (+29 天)
  - R6: scheduledDate = 2026-08-26 (+59 天)
- **AND** 所有计划初始 status = "pending"

#### Scenario: 补录知识点生成复习计划（含逾期）

- **WHEN** 用户补录一个学习日期为 3 天前的知识点（今天为 2026-07-30）
- **THEN** 系统 SHALL 生成:
  - R1: scheduledDate = 2026-07-28 (已过期)
  - R2: scheduledDate = 2026-07-30 (今天)
  - R3: scheduledDate = 2026-08-03
  - ...
- **AND** 已过期的计划 SHALL 保持 status = "pending"
- **AND** 这些逾期计划 SHALL 堆积显示在今日复习列表中

### Requirement: 复习完成标记

系统 SHALL 允许用户标记单次复习为已完成。

#### Scenario: 用户完成一次复习

- **WHEN** 用户点击今日页某知识点的"完成"按钮
- **THEN** 系统 SHALL 将该 ReviewSchedule.status 更新为 "done"
- **AND** 记录 completedAt 时间
- **AND** 同步更新云数据库中的状态
- **AND** 从今日待复习列表中移除该条目

#### Scenario: 用户完成最后一次复习

- **WHEN** 用户完成第 6 次复习（R6）
- **THEN** 系统 SHALL 将该 ReviewSchedule.status 更新为 "done"
- **AND** 将关联 KnowledgePoint.status 更新为 "mastered"
- **AND** 显示正向激励提示"恭喜！该知识点已掌握"

#### Scenario: 用户完成一个已逾期的复习

- **WHEN** 用户完成一个 scheduledDate 为 3 天前的复习计划
- **THEN** 系统 SHALL 正常标记为 done
- **AND** 不影响后续复习计划的日期（不重新计算）

### Requirement: 复习计划查询

系统 SHALL 支持按日期查询复习计划。

#### Scenario: 查询某天的所有复习计划

- **WHEN** 日历页面渲染 2026年8月
- **THEN** 系统 SHALL 查询 scheduledDate 在 2026-08-01 至 2026-08-31 之间的所有计划
- **AND** 按日期分组统计数量
- **AND** 在日历对应日期格子上显示数量标记

#### Scenario: 查询今日所有待复习

- **WHEN** 用户打开今日页面
- **THEN** 系统 SHALL 查询所有 scheduledDate <= 今天 且 status = "pending" 的计划
- **AND** 按 scheduledDate 升序排列（逾期优先）
- **AND** 关联查询 KnowledgePoint 获取标题、内容、图片

### Requirement: 复习计划重新计算

当学习日期变更时，系统 SHALL 重新计算未完成的复习计划。

#### Scenario: 用户修改学习日期

- **WHEN** 用户将知识点学习日期从 2026-07-27 改为 2026-07-20
- **THEN** 系统 SHALL 删除所有 status = "pending" 的 ReviewSchedule
- **AND** 以 2026-07-20 为基准重新生成 6 条计划
- **AND** 已完成的复习记录 SHALL 保留不变
- **AND** 同步更新云数据库

## Technical Context

- 间隔常量: `REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30]`
- 日期格式: `YYYY-MM-DD`（本地存储），ISO DateTime（completedAt）
- 云数据库集合: `review-schedules`
- 同步策略: 创建/更新/删除时实时同步，标记完成时实时同步
