# Category Management

## Purpose

允许用户管理物品分类。系统提供预设品类（衣物、书籍、数码藏品、纪念品），同时支持用户创建自定义品类，并为每个品类定义属性模板。品类是动态表单的基础——录入物品时，表单字段由所选品类的模板决定。

## Requirements

### Preset Categories

- **R1**: 首次启动时自动创建 4 个预设品类：衣物、书籍、数码藏品、纪念品
- **R2**: 预设品类不可删除，但可修改名称和图标
- **R3**: 每个预设品类自带推荐字段模板：
  - 衣物：名称、颜色、尺码、材质、季节、品牌、风格
  - 书籍：书名、作者、出版社、ISBN、页数、读完日期、评分
  - 数码藏品：名称、品牌、型号、购买价格、序列号、保修期
  - 纪念品：名称、来源、纪念事件、相关人物、情感价值

### Custom Categories

- **R4**: 用户可创建自定义品类，需指定名称和图标（emoji 选择器）
- **R5**: 用户自定义品类可编辑和删除
- **R6**: 删除品类时，若该品类下仍有物品，提示用户需先处理（转移或删除）物品后才能删除品类
- **R7**: 品类支持拖拽排序，决定展示顺序

### Field Template

- **R8**: 每个品类可定义 0-N 个自定义字段
- **R9**: 字段类型支持：`text`（文本）、`number`（数字）、`select`（单选）、`date`（日期）、`boolean`（是/否）
- **R10**: `select` 类型字段需定义选项列表
- **R11**: 字段可标记为"必填"或"选填"
- **R12**: 字段支持拖拽排序，决定录入表单中的展示顺序
- **R13**: 编辑已有品类的字段模板时：
  - 新增字段：该品类下已有物品此字段为空
  - 删除字段：该品类下已有物品此字段数据一并删除（需二次确认）
  - 修改字段类型：尝试兼容转换，无法转换时置空

### Category List Display

- **R14**: 品类列表展示每个品类的物品数量（不含已处理物品）
- **R15**: 预设品类和自定义品类在同一个列表中展示，预设品类有标识

## Interfaces

```
Category {
  id: string
  name: string
  icon: string            // emoji
  fields: Field[]
  isBuiltIn: boolean
  sortOrder: number
  createdAt: string
}

Field {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'date' | 'boolean'
  options?: string[]      // for select type
  required: boolean
  sortOrder: number
}
```

## State

- 品类列表在应用启动时加载到内存
- 修改后即时持久化
- 字段模板变更需记录影响范围（影响多少物品）
