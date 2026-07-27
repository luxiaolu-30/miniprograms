# Capability: Daily Notification

## ADDED Requirements

### Requirement: 每日定时通知

系统 SHALL 每天早上 8:00 通过微信订阅消息推送今日复习提醒。

#### Scenario: 云函数定时触发

- **WHEN** 每天 08:00 定时触发器触发
- **THEN** 云函数 SHALL:
  1. 获取今天的日期 `YYYY-MM-DD`
  2. 查询 `review-schedules` 集合中 `scheduledDate = 今天 AND status = pending` 的记录
  3. 按 `_openid` 分组统计每个用户的待复习数量
  4. 对有待复习的用户发送订阅消息
  5. 对没有待复习的用户不发送消息

#### Scenario: 用户收到通知

- **WHEN** 云函数发送订阅消息
- **THEN** 用户 SHALL 在微信服务通知中收到消息
- **AND** 消息内容 SHALL 包含: 日期、待复习数量
- **AND** 点击消息 SHALL 打开小程序并跳转到今日页面

#### Scenario: 用户未授权订阅

- **WHEN** 用户未授权订阅消息
- **THEN** 云函数 SHALL 跳过该用户
- **AND** 不报错，不影响其他用户

### Requirement: 复习计划云同步

系统 SHALL 将复习计划骨架同步到云数据库。

#### Scenario: 创建知识点时同步

- **WHEN** 用户保存新知识点
- **THEN** 系统 SHALL 调用云函数 `sync-schedule`
- **AND** 将 6 条 ReviewSchedule 写入云数据库 `review-schedules` 集合
- **AND** 每条记录包含 `_openid`（自动）、`id`、`knowledgePointId`、`knowledgeTitle`、`reviewIndex`、`scheduledDate`、`status`

#### Scenario: 完成复习时同步

- **WHEN** 用户标记复习完成
- **THEN** 系统 SHALL 更新云数据库中对应记录的 `status` 和 `completedAt`

#### Scenario: 删除知识点时同步

- **WHEN** 用户删除知识点
- **THEN** 系统 SHALL 删除云数据库中所有关联的 `review-schedules` 记录

#### Scenario: 网络不可用时同步

- **WHEN** 用户操作时网络不可用
- **THEN** 系统 SHALL 将同步操作加入本地队列
- **AND** 在网络恢复后自动重试同步
- **AND** 不影响本地功能正常使用

### Requirement: 云开发初始化

小程序启动时 SHALL 初始化云开发环境。

#### Scenario: 首次启动初始化

- **WHEN** 小程序首次启动
- **THEN** 系统 SHALL 调用 `wx.cloud.init` 初始化云开发
- **AND** 使用 `cloud.init` 中的 `env` 参数指定环境

#### Scenario: 云开发未开通

- **WHEN** 小程序未开通云开发
- **THEN** 系统 SHALL 降级为纯本地模式
- **AND** 通知功能不可用，但其他功能正常
- **AND** 显示提示"未开通云开发，通知功能不可用"

## Technical Context

- 云函数名称: `daily-reminder`
- 触发器 cron: `0 8 * * *`（每天 8:00）
- 云数据库集合: `review-schedules`
- 订阅消息模板: 需在微信公众平台申请"每日复习提醒"模板
- 云开发环境 ID: 在 `app.js` 中配置
- 同步策略: 实时同步 + 失败队列重试
