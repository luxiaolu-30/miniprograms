# Local Storage

## Purpose

提供纯本地数据存储层，管理所有应用数据（物品元数据、品类定义、用户设置）和图片文件。不依赖任何后端服务，数据完全存储在用户手机微信本地空间。

## Requirements

### Data Persistence

- **R1**: 所有物品元数据、品类定义、设置通过 `wx.storage.sync` 持久化存储
- **R2**: 图片以本地文件形式存储在 `wx.env.USER_DATA_PATH` 路径下，元数据中只保存文件路径引用
- **R3**: 存储层提供统一的 CRUD API（`getItems`, `saveItem`, `deleteItem`, `getCategories`, `saveCategory` 等）
- **R4**: 所有写操作需做异常捕获，存储失败时向用户提示

### Image Handling

- **R5**: 图片保存前需压缩：最长边不超过 1280px，JPEG quality 0.7
- **R6**: 图片文件命名使用随机 UUID，避免冲突
- **R7**: 图片按物品 ID 分目录存储：`/images/{itemId}/{uuid}.jpg`
- **R8**: 删除物品时，同步删除其关联的所有图片文件
- **R9**: 提供图片路径到临时文件路径的转换（用于 `<image>` 组件渲染）

### Storage Limits

- **R10**: 元数据单条物品记录控制在 10KB 以内（不含图片路径）
- **R11**: 提供 `getStorageInfo` 方法返回当前 storage 使用量，超过 8MB 时提醒用户导出数据
- **R12**: 数据导出功能：将所有元数据序列化为 JSON 文件，保存到用户可通过微信分享获取的位置

### Data Integrity

- **R13**: 每次启动应用时校验数据完整性（物品引用的图片文件是否存在）
- **R14**: 发现孤立图片文件（无物品引用）时提供清理选项
- **R15**: 数据版本号管理，未来升级时支持 schema migration

## Interfaces

```
StorageService {
  // 物品
  getItems(): Item[]
  getItem(id: string): Item | null
  saveItem(item: Item): Result
  deleteItem(id: string): Result

  // 品类
  getCategories(): Category[]
  saveCategory(category: Category): Result
  deleteCategory(id: string): Result

  // 图片
  saveImage(itemId: string, tempPath: string): string  // 返回存储路径
  deleteImages(itemId: string): void
  getImageTempPath(savedPath: string): Promise<string>  // 返回可用于渲染的临时路径

  // 工具
  getStorageInfo(): { used: number, limit: number }
  exportData(): string  // 返回 JSON 文件路径
  validateIntegrity(): { orphans: string[], missing: string[] }
}
```

## State

- 无远程状态，所有状态本地
- 应用启动时从 wx.storage 读取全量数据到内存
- 写操作采用"先更新内存，再同步写入"策略
