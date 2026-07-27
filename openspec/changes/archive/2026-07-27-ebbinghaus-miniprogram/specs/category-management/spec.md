# Capability: Category Management

## ADDED Requirements

### Requirement: 分类列表

系统 SHALL 展示用户创建的所有分类。

#### Scenario: 查看分类列表

- **WHEN** 用户进入分类管理页
- **THEN** 系统 SHALL 展示所有分类（含预设和用户创建）
- **AND** 每个分类显示名称、图标、关联知识点数量
- **AND** 预设分类 SHALL 标记"系统"标签且不可删除

#### Scenario: 空分类列表

- **WHEN** 用户未创建任何分类
- **THEN** 系统 SHALL 显示引导"还没有分类，创建一个吧"
- **AND** 提供"新建分类"按钮

### Requirement: 分类创建

系统 SHALL 允许用户创建自定义分类。

#### Scenario: 创建新分类

- **WHEN** 用户点击"新建分类"
- **AND** 输入名称"计算机网络"
- **AND** 选择图标"🌐"
- **AND** 保存
- **THEN** 系统 SHALL 创建 Category 记录
- **AND** 返回到分类列表，新分类出现在末尾

#### Scenario: 分类名称重复

- **WHEN** 用户输入已存在的分类名称
- **AND** 保存
- **THEN** 系统 SHALL 提示"分类名称已存在"

### Requirement: 分类编辑

系统 SHALL 允许用户修改分类信息。

#### Scenario: 编辑分类

- **WHEN** 用户点击分类的编辑按钮
- **AND** 修改名称或图标
- **AND** 保存
- **THEN** 系统 SHALL 更新 Category 记录
- **AND** 所有关联的知识点显示更新后的分类信息

### Requirement: 分类删除

系统 SHALL 允许用户删除空的自定义分类。

#### Scenario: 删除空分类

- **WHEN** 用户删除一个没有关联知识点的自定义分类
- **AND** 确认删除
- **THEN** 系统 SHALL 删除 Category 记录

#### Scenario: 删除有关联知识点的分类

- **WHEN** 用户尝试删除一个有关联知识点的分类
- **THEN** 系统 SHALL 阻止删除
- **AND** 提示"该分类下还有 N 个知识点，请先处理"

#### Scenario: 删除预设分类

- **WHEN** 用户尝试删除预设分类
- **THEN** 系统 SHALL 阻止删除
- **AND** 提示"预设分类不能删除"

### Requirement: 分类选择

录入/编辑知识点时 SHALL 允许用户选择分类。

#### Scenario: 选择分类

- **WHEN** 用户在录入页点击分类选择器
- **THEN** 系统 SHALL 弹出分类列表
- **AND** 用户选择一个分类后，选择器显示分类名称和图标

#### Scenario: 不选择分类

- **WHEN** 用户选择"未分类"选项
- **THEN** 知识点 SHALL 保存为 categoryId = null

## Technical Context

- 预设分类: 无（与电子衣橱不同，艾宾浩斯助记不预设分类，由用户自建）
- 本地存储 Key: `eb_categories`
- 分类图标: emoji 选择器
- 排序: 按 sortOrder 升序
