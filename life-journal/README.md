# 人生间隔重复日记 (Life Journal)

基于艾宾浩斯遗忘曲线的**自我反思日记**微信小程序。

## 💡 核心理念

> 不只是记知识点，**重要的人生经验也值得间隔重复**。

普通的日记写完就束之高阁。但如果你在 1 天后、3 天后、7 天后、14 天后、29 天后、59 天后被温柔地提醒"看看你当时写的东西"——

你会看到**自己思维的演变**，发现那些当时以为天大的事已经云淡风轻，也会发现那些随手记下的感悟早已成为信念。

## ✨ 功能特性

- **📝 多元记录** — 7 种类型：感悟、决定、目标、感恩、教训、记忆、经历
- **😊 心情追踪** — 每次记录时标记心情，长期追踪情绪变化
- **🔄 智能回顾** — 基于艾宾浩斯曲线自动生成 6 次间隔回顾（+1/+3/+7/+14/+29/+59 天）
- **💬 深度引导** — 每次回顾有不同的引导问题，从"当时怎么想"到"已经成为信念了吗"
- **⭐ 认同度评分** — 回顾时给当时的想法打分（1-5），追踪思维变化
- **📅 回顾日历** — 月视图展示每天待回顾数量，逾期提醒
- **📜 时间轴** — 所有记录按时间倒序，支持类型筛选和搜索
- **📊 思维演变** — 详情页对比展示"当时写的内容"和"每次回顾的思考"
- **🔥 连续打卡** — 每日完成回顾即打卡，培养反思习惯
- **📈 数据统计** — 类型分布、心情趋势、累计字数、完成率
- **💾 纯本地存储** — 所有数据在手机上，完全隐私

## 📁 项目结构

```
life-journal/
├── app.js                     # 应用入口：全局数据、生命周期、打卡管理
├── app.json                   # 全局配置：页面注册、TabBar
├── app.wxss                   # 全局样式：温暖知性棕主题
├── project.config.json        # 项目配置
├── sitemap.json
│
├── pages/                     # 页面
│   ├── today/                 # 今日回顾：核心页面，引导完成反思
│   ├── calendar/              # 回顾日历：月视图 + 日期详情
│   ├── add/                   # 写日记：类型/心情/内容/标签
│   ├── timeline/              # 时间轴：全部记录 + 筛选搜索
│   ├── detail/                # 详情：原始记录 + 回顾历程对比
│   └── stats/                 # 我的统计：打卡/分布/趋势
│
├── components/                # 可复用组件
│   ├── entry-card/            # 日记条目卡片
│   ├── reflection-prompt/     # 回顾引导卡片（核心交互组件）
│   ├── mood-badge/            # 心情徽章
│   ├── streak-flame/          # 连续打卡火焰
│   └── empty-state/           # 空状态占位
│
├── utils/                     # 工具函数
│   ├── storage.js             # 存储层：条目/回顾/设置的 CRUD
│   ├── schedule.js            # 间隔回顾算法（核心）
│   ├── entry-type.js          # 类型/心情/评分常量配置
│   └── uuid.js                # ID 生成/日期格式化
│
└── images/                    # 静态资源
```

## 🏗 技术架构

### 技术栈

- **框架**：微信小程序原生开发（WXML + WXSS + JS）
- **存储**：`wx.setStorageSync` 本地键值存储
- **无依赖**：零第三方库，纯原生 API

### 数据模型

```
日记条目 (Entry)
├── id, title, content
├── type          // insight | decision | goal | gratitude | lesson | memory | experience
├── mood          // 1-5（😢😕😐🙂😄）
├── tags[]        // 自定义标签
├── status        // active | internalized | archived
├── createdAt, updatedAt

回顾记录 (Reflection)
├── id, entryId, entryTitle
├── reviewIndex   // 1-6（第几次回顾）
├── scheduledDate // 计划回顾日期 YYYY-MM-DD
├── interval      // 距上次的天数
├── prompt        // 本次回顾的引导问题
├── status        // pending | done | skipped
├── reflection    // 用户的回顾文字
├── rating        // 认同度评分 1-5
├── completedAt   // 完成时间

设置 (Settings)
├── streak        // 连续打卡天数
├── lastCheckIn   // 上次打卡日期
```

### 回顾间隔算法

| 回顾次数 | 距上次 | 累计 | 引导问题 |
|---------|--------|------|---------|
| R1 | +1 天 | D+1 | 回顾：当时你为什么这样想？ |
| R2 | +2 天 | D+3 | 对比：想法有变化吗？ |
| R3 | +4 天 | D+7 | 反思：一周后怎么看？ |
| R4 | +7 天 | D+14 | 深化：有什么新理解？ |
| R5 | +15 天 | D+29 | 检验：这个感悟还成立吗？ |
| R6 | +30 天 | D+59 | 内化：已经成为信念了吗？ |

6 次回顾全部完成后，条目标记为 **internalized（已内化）**。

### 存储 Key

| Key | 内容 |
|-----|------|
| `lj_entries` | 日记条目列表 |
| `lj_reflections` | 回顾记录列表 |
| `lj_settings` | 用户设置 |

## 🎨 设计规范

- **主色调**：温暖棕色 `#6B4226`，米色背景 `#FAF5EE`
- **字体**：PingFang SC / 系统默认
- **圆角**：12rpx / 16rpx / 20rpx / 24rpx 四级
- **风格**：温暖、知性、有呼吸感

## 🚀 开始使用

1. 用微信开发者工具打开 `life-journal/` 目录
2. 点击"编译"即可预览
3. 首次使用点击"写日记"开始记录

## 📋 实施状态

- [x] 项目基础结构
- [x] 存储层 storage.js
- [x] 间隔回顾算法 schedule.js
- [x] 类型/心情配置 entry-type.js
- [x] 今日回顾页 today
- [x] 回顾日历页 calendar
- [x] 写日记页 add
- [x] 时间轴页 timeline
- [x] 详情页 detail
- [x] 统计页 stats
- [x] 条目卡片组件 entry-card
- [x] 回顾引导组件 reflection-prompt
- [x] 心情徽章组件 mood-badge
- [x] 打卡火焰组件 streak-flame
- [x] 空状态组件 empty-state
- [x] 连续打卡机制
- [x] 数据完整性保护

## 📄 版本

v1.0 — 纯本地版本
