# Capability: Knowledge Input

## ADDED Requirements

### Requirement: 知识点录入

`录入知识点` 场景 SHALL 允许用户创建新的知识点记录。

#### Scenario: 用户成功录入一个带图片的知识点

- **WHEN** 用户打开录入页面
- **AND** 填写标题"TCP 三次握手"
- **AND** 填写内容"客户端发送 SYN=1, seq=x..."
- **AND** 从相册选择 2 张图片
- **AND** 选择分类"计算机网络"
- **AND** 保持默认学习日期（今天）
- **AND** 点击保存
- **THEN** 系统 SHALL 创建 KnowledgePoint 记录
- **AND** 图片 SHALL 被压缩（最长边 1280px, quality 0.7）并保存到本地文件系统
- **AND** 系统 SHALL 自动生成 6 条 ReviewSchedule 记录（间隔 1/3/7/14/29/59 天）
- **AND** 复习计划 SHALL 同步到云数据库
- **AND** 页面 SHALL 返回上一页（日历或今日）

#### Scenario: 用户补录昨天的知识点

- **WHEN** 用户打开录入页面
- **AND** 填写标题和內容
- **AND** 选择学习日期为昨天
- **AND** 点击保存
- **THEN** 系统 SHALL 以昨天为基准计算复习计划
- **AND** 已过期的复习（如 +1 天 = 今天）SHALL 标记为 pending
- **AND** 这些逾期复习 SHALL 出现在今天的复习列表中

#### Scenario: 用户录入时不选择分类

- **WHEN** 用户填写标题、内容
- **AND** 不选择分类（保持"未分类"）
- **AND** 点击保存
- **THEN** 系统 SHALL 允许保存，categoryId 为 null
- **AND** 知识点 SHALL 出现在"未分类"筛选中

#### Scenario: 用户录入时不添加图片

- **WHEN** 用户只填写标题和内容
- **AND** 不选择任何图片
- **AND** 点击保存
- **THEN** 系统 SHALL 允许保存，images 为空数组

#### Scenario: 用户未填写标题就保存

- **WHEN** 用户只填写內容，标题为空
- **AND** 点击保存
- **THEN** 系统 SHALL 阻止保存
- **AND** 显示提示"请输入知识点标题"

#### Scenario: 标题超过字数限制

- **WHEN** 用户输入超过 100 个字符的标题
- **AND** 点击保存
- **THEN** 系统 SHALL 阻止保存
- **AND** 显示提示"标题不能超过 100 个字符"

### Requirement: 知识点编辑

系统 SHALL 允许用户修改已录入的知识点。

#### Scenario: 用户编辑知识点标题

- **WHEN** 用户从详情页点击编辑
- **AND** 修改标题
- **AND** 保存
- **THEN** 系统 SHALL 更新 KnowledgePoint 的 title 和 updatedAt
- **AND** 如果知识点标题变更，云数据库中的冗余标题 SHALL 同步更新

#### Scenario: 用户删除已添加的图片

- **WHEN** 用户编辑知识点
- **AND** 删除其中一张图片
- **AND** 保存
- **THEN** 系统 SHALL 从本地文件系统删除该图片文件
- **AND** 更新 images 数组

#### Scenario: 用户变更学习日期

- **WHEN** 用户编辑知识点
- **AND** 修改学习日期
- **AND** 保存
- **THEN** 系统 SHALL 重新计算所有复习计划日期
- **AND** 已完成的复习记录 SHALL 保留不变
- **AND** 未完成的复习 SHALL 按新日期重新生成

### Requirement: 知识点删除

系统 SHALL 允许用户删除知识点及其关联数据。

#### Scenario: 用户删除知识点

- **WHEN** 用户在详情页点击删除
- **AND** 确认删除
- **THEN** 系统 SHALL 删除 KnowledgePoint 记录
- **AND** 删除所有关联的 ReviewSchedule 记录（本地 + 云端）
- **AND** 删除本地文件系统中的图片目录
- **AND** 返回上一页

## Technical Context

- 图片存储路径: `${wx.env.USER_DATA_PATH}/images/${knowledgeId}/`
- 本地存储 Key: `eb_knowledges`, `eb_schedules`, `eb_categories`
- 表单验证规则: 标题 1-100 字符必填，内容最多 2000 字符
- 图片限制: 最多 9 张，单张压缩后约 50-200KB
