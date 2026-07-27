# Item Disposal

## Purpose

管理物品的生命周期状态流转。物品从"在用"开始，可标记为"闲置"，最终通过"处理"流程归档。已处理物品不在主浏览列表展示，但可查看历史记录和恢复。

## Requirements

### Status Definitions

- **R1**: 物品有 6 种状态：
  - `active`（在用）：日常使用中的物品
  - `idle`（闲置）：暂时不用但保留的物品
  - `donated`（已捐赠）：送给他人或机构
  - `sold`（已转卖）：出售给他人
  - `discarded`（已丢弃）：废弃处理
  - `lent`（已借出）：借给他人，预期归还

### Status Transitions

- **R2**: 允许的状态流转：
  - `active` ↔ `idle`（自由切换，无需确认）
  - `active`/`idle` → `donated`/`sold`/`discarded`/`lent`（需填写处理信息）
  - `donated`/`sold`/`discarded`/`lent` → `active`（恢复，需确认）
- **R3**: 状态变更即时生效并持久化

### Disposal Flow

- **R4**: 触发处理操作时弹出处理表单，包含：
  - 处理方式（捐赠/转卖/丢弃/借出）— 单选
  - 处理日期 — 日期选择器，默认今天
  - 处理价格 — 仅"转卖"时显示且必填
  - 备注 — 选填，如"送给张三"、"闲鱼 50 元"
- **R5**: 提交后物品状态变更，记录 `disposeInfo`，物品从主列表移入归档

### Archive

- **R6**: 归档页展示所有已处理物品，按处理日期倒序排列
- **R7**: 归档列表可按处理方式筛选
- **R8**: 归档物品详情可查看完整处理信息
- **R9**: 归档物品支持"恢复"操作：
  - 恢复后状态回到 `active`
  - `disposeInfo` 保留在历史记录中（`previousDispose` 字段）
  - 物品重新出现在主列表

### UI Indicators

- **R10**: 在用物品无特殊标识
- **R11**: 闲置物品卡片显示"闲置"标签（灰色）
- **R12**: 详情页状态区域提供快捷操作按钮（"标记闲置"/"处理"）

## State Machine

```
                  ┌──────────┐
                  │  新建    │
                  └────┬─────┘
                       │
                       ▼
             ┌─────────────────┐
        ┌───▶│    active       │◄───┐
        │    │    (在用)        │    │
        │    └────────┬────────┘    │
        │             │              │
        │      markIdle│              │ restore
        │             ▼              │
        │    ┌─────────────────┐    │
        │    │    idle         │────┘
        │    │    (闲置)        │ markActive
        │    └────────┬────────┘
        │             │
        │    ┌────────┼────────┐
        │    │        │        │
        │    ▼        ▼        ▼
        │ donated  sold   discarded  lent
        │    │        │        │       │
        │    └────────┼────────┘       │
        │             │                │
        │             ▼                │
        │    ┌─────────────────┐       │
        └────│   归档 (历史)    │◄──────┘
             └─────────────────┘
```

## Interfaces

```
DisposeInfo {
  method: 'donated' | 'sold' | 'discarded' | 'lent'
  date: string
  price?: number
  note?: string
}

Item {
  // ... 其他字段
  status: 'active' | 'idle' | 'donated' | 'sold' | 'discarded' | 'lent'
  disposeInfo?: DisposeInfo
  previousDispose?: DisposeInfo[]  // 历史处理记录
}
```
