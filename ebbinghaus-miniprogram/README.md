# 艾宾浩斯助记 (Ebbinghaus Spaced Repetition)

基于艾宾浩斯遗忘曲线的间隔重复记忆微信小程序，帮助你高效记忆知识点。

## ✨ 功能特性

- **知识点录入** — 标题 + 内容 + 图片（拍照/相册），支持补录（选择学习日期）
- **智能复习计划** — 根据艾宾浩斯曲线自动生成 6 次复习（+1/+3/+7/+14/+29/+59 天）
- **日历视图** — 月视图展示每天待复习数量，点击日期查看当天复习列表
- **今日复习** — 展示当天所有待复习（含逾期），一键标记完成
- **分类管理** — 自定义分类，可选关联
- **学习统计** — 累计录入/学习中/已掌握/复习进度
- **纯本地存储** — 所有数据存储在手机本地，保护隐私

## 📁 项目结构

```
ebbinghaus-miniprogram/
├── app.js                    # 全局逻辑：数据加载、完整性校验
├── app.json                  # 路由、tabBar、窗口配置
├── app.wxss                  # 全局样式（知性蓝主题）
├── project.config.json       # 项目配置
├── sitemap.json
│
├── pages/
│   ├── calendar/             # 日历月视图
│   ├── today/                # 今日复习
│   ├── add/                  # 录入/编辑知识点
│   ├── detail/               # 知识点详情
│   ├── category/             # 分类管理
│   └── mine/                 # 我的（统计）
│
├── components/               # 可复用组件
│   ├── empty-state/          # 空状态组件
│   ├── progress-bar/         # 进度条组件
│   └── image-loader/         # 图片加载器
│
├── utils/
│   ├── storage.js            # 存储层封装
│   ├── image.js              # 图片压缩/保存/读取
│   ├── uuid.js               # ID 生成/日期格式化
│   ├── validate.js           # 表单验证
│   └── schedule.js           # 复习计划算法
│
└── images/                   # 静态资源（TabBar 图标）
```

## 🏗 技术架构

### 技术栈

- **框架**: 微信小程序原生开发（WXML + WXSS + JS）
- **存储**: 本地 wx.storage + 文件系统（纯本地，无后端）

### 数据模型

```
知识点 (KnowledgePoint)
├── id, title, content, images[], categoryId
├── createdAt (学习日期), status (active/mastered/archived)

复习计划 (ReviewSchedule)
├── id, knowledgePointId, knowledgeTitle
├── reviewIndex (1-6), scheduledDate, status (pending/done/skipped)
├── completedAt

分类 (Category)
├── id, name, icon, sortOrder, createdAt
```

### 复习间隔

| 复习次数 | 距上次间隔 | 累计天数 |
|---------|-----------|---------|
| R1 | 1 天 | D+1 |
| R2 | 2 天 | D+3 |
| R3 | 4 天 | D+7 |
| R4 | 7 天 | D+14 |
| R5 | 15 天 | D+29 |
| R6 | 30 天 | D+59 |

6 次复习全部完成后，知识点标记为"已掌握"。

## 🚀 开发指南

### 环境准备

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 用微信开发者工具打开 `ebbinghaus-miniprogram/` 目录
3. 点击"编译"即可预览

### 数据存储

- 所有数据通过 `wx.setStorageSync` 持久化在本地
- 图片存储在本地文件系统 `${wx.env.USER_DATA_PATH}/images/{knowledgeId}/`
- 存储上限 ~10MB

## 📋 实施状态

### 已完成
- [x] 项目基础结构
- [x] 存储层 storage.js
- [x] 图片工具 image.js
- [x] 复习计划算法 schedule.js
- [x] 日历月视图 calendar
- [x] 今日复习 today
- [x] 录入页面 add
- [x] 详情页面 detail
- [x] 分类管理 category
- [x] 我的页面 mine
- [x] 空状态组件 empty-state
- [x] 进度条组件 progress-bar
- [x] 图片加载器 image-loader
- [x] 启动 loading + 数据完整性校验
- [x] 完成动画 + 正向激励
- [x] 页面切换动画
- [x] 表单验证反馈

## 📄 版本

v1.0 — 纯本地版本（无云开发依赖）
