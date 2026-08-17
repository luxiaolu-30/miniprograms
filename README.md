# 电子衣橱 (Digital Wardrobe)

一个微信小程序，用于拍照/文字录入个人物品，支持多品类自定义，纯本地存储。

## 功能特性

- 📷 **拍照录入** - 多角度多图，自动压缩
- 🏷️ **自定义品类** - 预设衣物/书籍/数码/纪念品，支持自建品类和属性模板
- 📦 **物品管理** - 完整的 CRUD，动态属性表单
- 🔄 **处理流程** - 在用/闲置/捐赠/转卖/丢弃/借出，归档与恢复
- 🔍 **浏览搜索** - 网格/列表视图，品类筛选，全文搜索
- 📊 **统计概览** - 品类分布，存储监控
- 💾 **纯本地存储** - 数据完全在本地，无需后端
- 📤 **数据导出** - JSON 格式导出备份

## 项目结构

```
电子衣橱/
├── digital-wardrobe/           # 小程序源码
│   ├── app.js                  # 全局逻辑
│   ├── app.json                # 路由和窗口配置
│   ├── app.wxss                # 全局样式
│   ├── pages/                  # 页面
│   │   ├── index/              # 首页（浏览）
│   │   ├── category/           # 分类管理
│   │   ├── item/               # 物品录入/详情
│   │   ├── archive/            # 归档
│   │   └── mine/               # 我的（统计）
│   ├── components/             # 组件
│   │   ├── item-card/          # 物品卡片
│   │   ├── image-picker/       # 多图选择器
│   │   ├── dynamic-form/       # 动态属性表单
│   │   ├── category-chip/      # 品类筛选
│   │   ├── status-badge/       # 状态标签
│   │   ├── search-bar/         # 搜索栏
│   │   ├── empty-state/        # 空状态
│   │   └── dispose-modal/      # 处理弹窗
│   ├── utils/                  # 工具函数
│   │   ├── storage.js          # 存储层
│   │   ├── image.js            # 图片处理
│   │   ├── uuid.js             # ID 生成
│   │   ├── validate.js         # 表单验证
│   │   ├── export.js           # 数据导出
│   │   └── preset-categories.js # 预设品类
│   └── images/                 # 静态资源
└── openspec/                   # OpenSpec 设计文档
    └── changes/digital-wardrobe-mvp/
        ├── proposal.md
        ├── design.md
        ├── tasks.md
        └── specs/
```

## 开始使用

1. 用微信开发者工具打开 `电子衣橱/` 目录
2. 在工具中点击"编译"即可预览
3. 首次启动会自动创建 4 个预设品类

## 技术栈

- 微信小程序原生开发（WXML/WXSS/JS）
- 纯本地存储（wx.storage + 文件系统）
- 无第三方依赖

## 设计文档

详见 `openspec/changes/digital-wardrobe-mvp/` 目录：
- `proposal.md` - 变更提案
- `design.md` - 技术设计
- `tasks.md` - 任务列表
- `specs/` - 各模块规格说明
