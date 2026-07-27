# Capability: Calendar View

## ADDED Requirements

### Requirement: 日历月视图渲染

系统 SHALL 展示当前月份的日历网格，并标记有待复习的日期。

#### Scenario: 渲染当前月份日历

- **WHEN** 用户打开日历页面
- **THEN** 系统 SHALL 渲染当前月份的 6×7 网格（含上月/下月填充日期）
- **AND** 当天日期 SHALL 高亮显示
- **AND** 有待复习的日期 SHALL 显示数字标记（表示当天待复习数量）
- **AND** 无待复习的日期 SHALL 不显示标记

#### Scenario: 切换月份

- **WHEN** 用户点击"上个月"按钮
- **THEN** 日历 SHALL 切换到上一个月
- **AND** 重新计算该月每天的待复习数量
- **WHEN** 用户点击"下个月"按钮
- **THEN** 日历 SHALL 切换到下一个月

#### Scenario: 滚动到今日

- **WHEN** 用户在其他月份时点击"今天"按钮
- **THEN** 日历 SHALL 切换回当前月份

### Requirement: 日期详情展开

系统 SHALL 允许用户点击日历日期查看当天复习列表。

#### Scenario: 点击有待复习的日期

- **WHEN** 用户点击一个有待复习的日期格子
- **THEN** 系统 SHALL 在日历下方展开该日期的复习列表
- **AND** 列表 SHALL 显示每个知识点的标题、分类、第几次复习
- **AND** 逾期的复习 SHALL 用特殊样式标记（如橙色"逾期3天"）

#### Scenario: 点击无待复习的日期

- **WHEN** 用户点击一个没有待复习的日期
- **THEN** 系统 SHALL 显示空状态"这一天没有复习计划"

#### Scenario: 从日期列表进入详情

- **WHEN** 用户点击列表中某个知识点
- **THEN** 系统 SHALL 跳转到知识点详情页

### Requirement: 顶部统计信息

日历页面顶部 SHALL 显示学习统计摘要。

#### Scenario: 显示统计摘要

- **WHEN** 日历页面加载
- **THEN** 系统 SHALL 显示:
  - 今日待复习数量
  - 本周待复习数量
  - 累计已掌握知识点数量
  - 学习中知识点数量

## Technical Context

- 日历组件: 自研 `calendar-grid` 组件（不依赖第三方）
- 数据源: 本地 ReviewSchedule 集合，按 scheduledDate 分组统计
- 标记样式: 数字徽章，颜色深浅表示数量级（1-2 浅色，3-5 中等，6+ 深色）
- 日期格式: `YYYY-MM-DD`
