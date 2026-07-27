# 电子衣橱 (Digital Wardrobe)

一个纯本地化的个人物品收纳整理微信小程序，帮你轻松管理衣橱里的每一件物品。

## ✨ 功能特性

- **物品管理** — 录入、编辑、查看、删除个人物品，支持多图上传与压缩
- **分类体系** — 预设衣物、书籍、数码藏品、纪念品等品类，支持自定义分类
- **动态字段** — 每个分类可配置专属属性字段（文本/数字/单选/日期/布尔），如衣物的颜色、尺码、材质
- **状态流转** — 在用 → 闲置 → 处理（捐赠/转卖/丢弃/借出），归档可恢复
- **搜索筛选** — 关键词搜索（名称/标签/备注/属性）、分类筛选、网格/列表视图切换、多种排序
- **归档管理** — 查看已处理物品的历史记录，支持按处理方式筛选与恢复
- **数据统计** — 总览页展示物品总数、状态分布、品类占比、存储占用
- **数据导出** — 一键导出 JSON 备份文件，支持分享到电脑
- **纯本地存储** — 所有数据保存在手机本地，不上传任何服务器，保护隐私

## 📁 项目结构

```
miniprogram/
├── app.js                 # 应用入口：全局数据、生命周期、数据加载
├── app.json               # 全局配置：页面注册、TabBar、导航栏样式
├── app.wxss               # 全局样式：CSS 变量、通用组件样式
├── sitemap.json           # 索引规则
├── project.config.json    # 项目配置（AppID、编译选项）
│
├── pages/                 # 页面
│   ├── index/             # 首页：物品列表、搜索、筛选、视图切换
│   ├── category/          # 分类
│   │   ├── index/         # 分类列表：查看/编辑/删除分类
│   │   └── edit/          # 分类编辑：名称、图标、动态字段配置
│   ├── item/              # 物品
│   │   ├── edit/          # 物品录入/编辑：图片、属性、标签、获取信息
│   │   └── detail/        # 物品详情：预览、状态变更、处理、删除
│   ├── archive/           # 归档：已处理物品列表、恢复
│   └── mine/              # 我的：统计概览、数据导出、关于
│
├── components/            # 可复用组件
│   ├── category-chip/     # 分类标签（首页筛选条）
│   ├── dispose-modal/     # 处理方式弹窗（捐赠/转卖/丢弃/借出）
│   ├── dynamic-form/      # 动态表单（根据分类字段渲染表单）
│   ├── empty-state/       # 空状态占位
│   ├── image-picker/      # 图片选择器（拍照/相册、压缩、预览）
│   ├── item-card/         # 物品卡片（网格/列表项展示）
│   ├── search-bar/        # 搜索栏
│   └── status-badge/      # 状态标签（在用/闲置/已处理）
│
├── utils/                 # 工具函数
│   ├── storage.js         # 存储层：物品/品类/设置的 CRUD、数据导出
│   ├── image.js           # 图片工具：压缩、保存、读取、删除
│   ├── validate.js        # 表单验证：物品/品类校验规则
│   ├── uuid.js            # ID 生成、日期格式化
│   ├── export.js          # 数据导出与分享
│   └── preset-categories.js # 预设品类定义（衣物/书籍/数码藏品/纪念品）
│
└── images/                # TabBar 图标资源
```

## 🏗 技术架构

### 技术栈

- **框架**：微信小程序原生开发（WXML + WXSS + JS）
- **存储**：`wx.setStorageSync` 本地键值存储 + 文件系统管理图片
- **无依赖**：零第三方库，纯原生 API 实现

### 数据模型

```
物品 (Item)
├── id, name, categoryId
├── images[]              # 本地图片路径
├── fields{}              # 动态属性值（key-value）
├── tags[]                # 标签
├── note                  # 备注
├── acquiredDate          # 获取日期
├── acquiredMethod        # 获取方式（购买/赠送/自制/其他）
├── price                 # 价格
├── location              # 存放位置
├── status                # 状态：active / idle / donated / sold / discarded / lent
├── disposeInfo           # 处理信息（方式/日期/价格/备注）
├── previousDispose[]     # 历史处理记录
├── createdAt, updatedAt

分类 (Category)
├── id, name, icon
├── isBuiltIn             # 是否预设品类
├── sortOrder
├── fields[]              # 字段模板
│   ├── key, label, type (text/number/select/date/boolean)
│   ├── options[]         # 单选选项
│   └── required          # 是否必填
└── createdAt
```

### 存储 Key

| Key | 内容 |
|-----|------|
| `dw_items` | 物品列表 |
| `dw_categories` | 分类列表 |
| `dw_settings` | 用户设置（视图模式、排序方式） |

图片存储在 `${wx.env.USER_DATA_PATH}/images/{itemId}/` 目录下。

## 🚀 开发指南

### 环境准备

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入项目，AppID 使用测试号或自己的小程序 AppID

### 本地运行

1. 用微信开发者工具打开 `miniprogram/` 目录
2. 在工具中点击"编译"即可预览

### 数据存储

- 所有数据通过 `wx.setStorageSync` 持久化在本地
- 首次启动自动创建 4 个预设品类（衣物、书籍、数码藏品、纪念品）
- 存储上限 10MB（微信小程序本地存储限制）

## 📦 页面导航

```
Tab 首页
├── 首页 (pages/index/index)
│   ├── 搜索 / 分类筛选 / 视图切换
│   └── 点击物品 → 物品详情
│
├── 分类 (pages/category/index)
│   ├── 新增分类 → 分类编辑
│   ├── 编辑分类 → 分类编辑
│   └── 点击分类 → 返回首页并筛选
│
└── 我的 (pages/mine/mine)
    ├── 归档 → 归档页
    ├── 分类管理 → 分类页
    ├── 数据导出 → 导出 JSON
    └── 关于

非 Tab 页面
├── 物品详情 (pages/item/detail)
│   ├── 编辑 → 物品编辑
│   ├── 处理 → 处理弹窗
│   └── 删除
├── 物品编辑 (pages/item/edit)
├── 分类编辑 (pages/category/edit)
└── 归档 (pages/archive/archive)
    └── 恢复 / 查看详情
```

## 🎨 设计规范

- **主色调**：温暖棕色 `#8B5E3C`，米色背景 `#FAF7F2`
- **字体**：PingFang SC / 系统默认
- **圆角**：8rpx / 16rpx / 24rpx / 32rpx 四级
- **状态色**：成功绿 `#27AE60`、危险红 `#E74C3C`、警告橙 `#F39C12`

## 🔒 隐私说明

本小程序**不依赖任何后端服务器**，所有数据（包括图片）均存储在用户手机本地。数据导出功能生成的 JSON 文件也仅保存在本地，需用户主动选择分享。

## 📄 版本

v1.0 — 初始版本
