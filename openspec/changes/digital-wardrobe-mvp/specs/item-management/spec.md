# Item Management

## Purpose

物品的核心 CRUD 管理。用户可以创建、查看、编辑、删除物品。每个物品属于一个品类，拥有该品类模板定义的动态属性字段，同时包含通用属性（名称、图片、标签、状态等）。

## Requirements

### Item Creation

- **R1**: 创建物品时必须选择品类（品类决定动态表单字段）
- **R2**: 物品名称必填，同一品类下名称可重复
- **R3**: 至少 1 张图片（主图），最多 9 张
- **R4**: 动态属性表单根据所选品类字段模板渲染，必填字段未填时阻止提交
- **R5**: 通用字段：名称、图片、标签（多标签，自由输入）、备注（多行文本）、获取日期、获取方式（购买/赠送/自制/其他）、购买价格（可选）、存放位置（可选）
- **R6**: 创建成功后返回首页，新物品出现在列表顶部

### Item Display

- **R7**: 物品卡片展示：主图缩略图、名称、品类图标+名称、状态标签
- **R8**: 物品详情页展示：图片轮播（可放大查看）、所有属性（通用+动态）、标签、备注、状态
- **R9**: 详情页展示创建时间和最后更新时间

### Item Editing

- **R10**: 可编辑物品所有属性（名称、图片、动态字段、标签、备注等）
- **R11**: 编辑时可更换品类，更换后：
  - 原品类特有字段数据丢弃（需提示用户）
  - 新品类必填字段需补充
- **R12**: 图片编辑：新增、删除、拖拽排序（第一张为主图）

### Item Deletion

- **R13**: 删除物品需二次确认
- **R14**: 删除物品时同步删除关联的所有图片文件
- **R15**: 删除后从列表中移除，不可恢复（区别于"处理"流程）

### Data Validation

- **R16**: 名称长度 1-50 字符
- **R17**: 备注长度 0-500 字符
- **R18**: 价格若非空则必须 ≥ 0
- **R19**: 标签单个 1-20 字符，每物品最多 10 个标签

## Interfaces

```
Item {
  id: string
  name: string
  categoryId: string
  images: string[]          // 本地文件路径，第一张为主图
  fields: Record<string, any>  // 动态属性，key 对应 Field.key
  tags: string[]
  note: string
  status: 'active' | 'idle' | 'donated' | 'sold' | 'discarded' | 'lent'
  acquiredDate: string
  acquiredMethod: 'purchased' | 'gift' | 'self-made' | 'other'
  price?: number
  location?: string
  disposeInfo?: DisposeInfo
  createdAt: string
  updatedAt: string
}

DisposeInfo {
  method: 'donated' | 'sold' | 'discarded' | 'lent'
  date: string
  price?: number           // 转卖价格
  note?: string
}
```

## State

- 物品列表在首页/分类页展示，默认只展示 status 为 active 或 idle 的物品
- 已处理物品（donated/sold/discarded/lent）移入归档，不在主列表展示
- 编辑中的表单状态为页面级临时状态，保存后才持久化
