# Image Capture

## Purpose

处理物品图片的采集、压缩、存储和渲染。支持多角度多图录入（每物品最多 9 张），通过压缩控制存储占用，提供良好的图片浏览体验。

## Requirements

### Image Selection

- **R1**: 支持两种图片来源：调用相机拍照、从手机相册选择
- **R2**: 支持一次选择多张图片（微信 `chooseMedia` API，`count` 参数控制）
- **R3**: 选择图片时显示当前已选数量和剩余可选数量（上限 9 张）
- **R4**: 选择后展示缩略图预览列表，每张图可单独删除

### Image Compression

- **R5**: 保存前对图片进行压缩处理
- **R6**: 压缩参数：最长边不超过 1280px（保持宽高比），JPEG 格式，quality 0.7
- **R7**: 压缩在原图尺寸已小于目标参数时跳过压缩（避免无谓处理）
- **R8**: 压缩过程显示 loading 提示，避免用户误以为卡顿

### Image Storage

- **R9**: 图片保存到本地文件系统 `wx.env.USER_DATA_PATH/images/{itemId}/` 目录
- **R10**: 文件名使用 `uuid + .jpg` 格式
- **R11**: 图片路径存入物品元数据的 `images` 数组，数组顺序即展示顺序
- **R12**: 第一张图片为主图，用于卡片缩略图展示

### Image Display

- **R13**: 物品卡片展示主图缩略图（`mode: aspectFill`，适当圆角）
- **R14**: 详情页图片区支持左右滑动切换（swiper）
- **R15**: 点击图片进入全屏查看模式，支持双指缩放和左右切换
- **R16**: 图片加载失败时显示占位图（品类图标或默认图片）

### Image Management

- **R17**: 编辑物品时可新增图片、删除已有图片、拖拽调整顺序
- **R18**: 调整顺序后第一张自动成为主图
- **R19**: 删除物品时，其目录下所有图片文件一并删除
- **R20**: 更换图片时，旧图片文件在保存成功后删除

## Technical Notes

- 使用 `wx.chooseMedia` 选择图片（微信基础库 ≥ 2.10.0）
- 使用 `wx.compressImage` 或 canvas 压缩图片
- 使用 `wx.getFileSystemManager().saveFile` 保存到本地
- 渲染时使用 `wx.getFileSystemManager().readFileSync` 或 `wxfile://` 协议

## State

- 录入/编辑页中的图片为临时状态（未保存前存储在临时路径）
- 保存物品时才移动到正式目录
- 取消编辑时清理未保存的临时文件
