# Design: Ebbinghaus Spaced Repetition Mini Program

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                   微信小程序 (WeChat Mini Program)                   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌────────────────────────────────────────────────────────┐       │
│  │                    Pages                                │       │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │       │
│  │  │ 日历   │ │ 今日   │ │ 录入   │ │ 我的   │          │       │
│  │  │(月视图) │ │(复习)  │ │(新增)  │ │(统计)  │          │       │
│  │  └────────┘ └────────┘ └────────┘ └────────┘          │       │
│  │  ┌────────────┐ ┌────────────┐                        │       │
│  │  │ 知识点详情  │ │ 分类管理   │                        │       │
│  │  └────────────┘ └────────────┘                        │       │
│  └────────────────────────────────────────────────────────┘       │
│                                                                    │
│  ┌────────────────────────────────────────────────────────┐       │
│  │                 Components                              │       │
│  │  calendar-grid, review-card, knowledge-form,           │       │
│  │  image-picker, category-picker, empty-state,          │       │
│  │  progress-bar                                          │       │
│  └────────────────────────────────────────────────────────┘       │
│                                                                    │
│  ┌────────────────────────────────────────────────────────┐       │
│  │                    Utils                                │       │
│  │  storage.js, image.js, uuid.js, validate.js,          │       │
│  │  schedule.js (复习计划算法), cloud-sync.js            │       │
│  └────────────────────────────────────────────────────────┘       │
│                                                                    │
│  ┌────────────────────────────────────────────────────────┐       │
│  │              微信本地存储层                              │       │
│  │  wx.storage (知识点 + 复习计划 + 分类)                 │       │
│  │  本地文件系统 (图片: /images/{knowledgeId}/)           │       │
│  └────────────────────────────────────────────────────────┘       │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                    微信云开发 (Cloud Development)                   │
│  ┌────────────────────────────────────────────────────────┐       │
│  │  云函数: daily-reminder (定时触发器, 每天 08:00)        │       │
│  │  云函数: sync-schedule (同步复习计划骨架)               │       │
│  │  云数据库: review-schedules (复习计划镜像)              │       │
│  │  订阅消息模板: 每日复习提醒                             │       │
│  └────────────────────────────────────────────────────────┘       │
└────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
ebbinghaus-miniprogram/
├── miniprogram/                  # 小程序前端
│   ├── app.js                    # 全局逻辑：启动初始化、云开发初始化
│   ├── app.json                  # 路由、tabBar、窗口配置
│   ├── app.wxss                  # 全局样式
│   ├── project.config.json       # 项目配置
│   ├── sitemap.json
│   │
│   ├── pages/
│   │   ├── calendar/             # 日历月视图
│   │   │   ├── calendar.js
│   │   │   ├── calendar.wxml
│   │   │   ├── calendar.wxss
│   │   │   └── calendar.json
│   │   ├── today/                # 今日复习
│   │   │   ├── today.js
│   │   │   ├── today.wxml
│   │   │   ├── today.wxss
│   │   │   └── today.json
│   │   ├── add/                  # 录入知识点
│   │   │   ├── add.js
│   │   │   ├── add.wxml
│   │   │   ├── add.wxss
│   │   │   └── add.json
│   │   ├── detail/               # 知识点详情
│   │   │   ├── detail.js
│   │   │   ├── detail.wxml
│   │   │   ├── detail.wxss
│   │   │   └── detail.json
│   │   ├── category/             # 分类管理
│   │   │   ├── category.js
│   │   │   ├── category.wxml
│   │   │   ├── category.wxss
│   │   │   └── category.json
│   │   └── mine/                 # 我的（统计）
│   │       ├── mine.js
│   │       ├── mine.wxml
│   │       ├── mine.wxss
│   │       └── mine.json
│   │
│   ├── components/
│   │   ├── calendar-grid/        # 日历网格组件
│   │   ├── review-card/          # 复习卡片组件
│   │   ├── knowledge-form/       # 知识点表单组件
│   │   ├── image-picker/         # 图片选择器
│   │   ├── category-picker/      # 分类选择器
│   │   ├── empty-state/          # 空状态
│   │   └── progress-bar/         # 复习进度条
│   │
│   ├── utils/
│   │   ├── storage.js            # 存储层封装
│   │   ├── image.js              # 图片压缩/保存/读取
│   │   ├── uuid.js               # ID 生成/日期格式化
│   │   ├── validate.js           # 表单验证
│   │   ├── schedule.js           # 复习计划算法
│   │   └── cloud-sync.js         # 云同步工具
│   │
│   └── images/                   # 静态资源
│
├── cloudfunctions/               # 云函数
│   └── daily-reminder/           # 每日复习提醒
│       ├── index.js
│       ├── config.json
│       └── package.json
│
└── project.config.json           # 项目级配置
```

## Key Design Decisions

### 1. 数据存储策略：本地为主 + 云最小镜像

**决策**: 知识点内容和图片纯本地存储，云数据库仅镜像复习计划骨架。

**理由**:
- 云函数无法读取用户本地存储，必须将"谁在哪天需要复习"同步到云端
- 知识点内容和图片永远不离开用户手机，保护隐私
- 云数据库只存最小必要数据（_openid + knowledgePointId + scheduledDate + reviewIndex + status）

**权衡**:
- 用户换手机后云镜像失效 → 重新登录后自动重建
- 云数据库存储量极小（每条计划约 100 字节）

### 2. 复习间隔算法

**决策**: 固定艾宾浩斯间隔，6 次复习后标记为"已掌握"。

```
间隔序列: [1, 2, 4, 7, 15, 30] (距上次复习的天数)
累计天数: [1, 3, 7, 14, 29, 59] (距学习日的天数)
```

**实现**:
```javascript
const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30]; // 距上次间隔

function generateSchedule(createdAt) {
  const baseDate = new Date(createdAt);
  let cumulativeDays = 0;
  return REVIEW_INTERVALS.map((interval, index) => {
    cumulativeDays += interval;
    const scheduledDate = new Date(baseDate);
    scheduledDate.setDate(scheduledDate.getDate() + cumulativeDays);
    return {
      reviewIndex: index + 1,
      scheduledDate: formatDate(scheduledDate),
      interval: interval,
    };
  });
}
```

**理由**: 经典艾宾浩斯曲线，经过验证的间隔比例。

### 3. 逾期复习处理

**决策**: 堆积显示，不自动跳过。

**实现**:
- 日历上显示当天所有 pending 状态的复习计划总数（含逾期）
- 今日页面展示所有 scheduledDate <= 今天 且 status = pending 的复习
- 用户逐个标记完成后，该知识点进入下一次复习

**理由**: 逾期复习仍有价值，堆积让用户感受到复习压力，激励坚持。

### 4. 补录机制

**决策**: 录入时允许选择学习日期（默认今天），可补录过去任意日期。

**实现**:
- 录入表单包含日期选择器（默认当天）
- 选择过去日期时，自动计算复习计划，已过期的复习标记为 pending（堆积到今天）
- 选择未来日期时，复习计划从未来日期开始计算

**理由**: 用户可能忘记当天录入，补录功能保证数据完整性。

### 5. 通知机制

**决策**: 订阅消息 + 云函数定时触发器，每天 08:00 推送。

**流程**:
```
08:00 定时触发器 → daily-reminder 云函数
  → 查询 review-schedules 集合
  → 找出 scheduledDate = 今天 且 status = pending 的记录
  → 按 _openid 分组统计数量
  → 发送订阅消息给每个用户
```

**订阅消息模板**:
```
标题: 艾宾浩斯助记
日期: 2026年8月1日
内容: 今日有 3 个知识点待复习
点击查看详情
```

**注意**: 需要用户先点击"订阅"按钮授权，每次授权可发一条消息（微信限制）。

### 6. 图片压缩策略

**决策**: 与电子衣橱一致，保存前压缩至 1280px / quality 0.7。

**理由**:
- 知识点图片多为文字截图，1280px 足够清晰
- 控制存储占用，避免快速耗尽 10MB 本地存储

### 7. 状态管理

**决策**: 与电子衣橱一致，app.globalData 共享 + 页面级 data，无全局状态管理库。

**理由**:
- 小程序规模适中，数据量有限
- 写操作直接持久化，读操作从内存获取

## Data Model

### KnowledgePoint (本地)

```javascript
{
  id: "kp_1a2b3c4d",           // 唯一标识
  title: "TCP 三次握手",        // 标题
  content: "客户端发送SYN...",   // 内容（纯文本）
  images: [                     // 本地图片路径数组
    "/images/kp_1a2b3c4d/img_xxx.jpg"
  ],
  categoryId: "cat_network",    // 分类ID（可选，null=未分类）
  createdAt: "2026-07-27T10:00:00.000Z",  // 学习日期（可补录）
  status: "active",             // active | mastered | archived
  tags: ["网络", "TCP"],        // 标签（可选）
  updatedAt: "2026-07-27T10:00:00.000Z"
}
```

### ReviewSchedule (本地 + 云镜像)

```javascript
{
  id: "rs_9f8e7d6c",            // 唯一标识
  knowledgePointId: "kp_1a2b3c4d",  // 关联知识点
  reviewIndex: 3,               // 第几次复习 (1-6)
  scheduledDate: "2026-08-03",  // 计划日期 "YYYY-MM-DD"
  status: "pending",            // pending | done | skipped
  completedAt: null,            // 完成时间
  // 云镜像额外字段:
  _openid: "oXXXXX",            // 用户标识（云数据库自动添加）
}
```

### Category (本地)

```javascript
{
  id: "cat_network",
  name: "计算机网络",
  icon: "🌐",
  sortOrder: 0,
  createdAt: "2026-07-27T10:00:00.000Z"
}
```

## Data Flow

### 录入知识点

```
用户填写表单 → 选择学习日期 → 点击保存
  ↓
1. 表单验证（标题必填）
2. 图片压缩 + 保存到本地文件系统
3. 构建 KnowledgePoint 对象，saveKnowledge(kp)
4. 调用 schedule.js 生成 6 条 ReviewSchedule
5. saveSchedule(schedule) × 6
6. 调用 cloud-sync.js 同步到云数据库
7. navigateBack → 日历页刷新
```

### 完成复习

```
今日页点击"完成"按钮
  ↓
1. 更新 ReviewSchedule.status = "done", completedAt = now()
2. 保存到本地 storage
3. 同步状态到云数据库
4. 检查是否全部 6 次完成 → 更新 KnowledgePoint.status = "masterd"
5. 刷新列表
```

### 每日通知

```
08:00 定时触发器
  ↓
1. 云函数查询 review-schedules 集合
   WHERE scheduledDate = 今天 AND status = "pending"
2. 按 _openid 分组统计
3. 发送订阅消息
  ↓
用户收到微信通知 → 点击 → 打开小程序 → 今日页
```

## UI/UX Guidelines

- **配色**: 清新学术风，主色调采用知性蓝 `#4A90D9` 或成长绿 `#27AE60`，背景浅色
- **日历**: 当天有待复习的日期用圆点/数字标记，颜色深浅表示数量
- **今日页**: 卡片式列表，左滑标记完成，点击展开详情
- **进度可视化**: 每个知识点显示 6 次复习的完成进度条
- **空状态**: 日历无复习日显示"今天没有复习计划，休息一下吧"
- **反馈**: 完成复习时正向激励（"已完成 3/6 次复习，继续加油！"）

## Cloud Database Schema

### Collection: `review-schedules`

| 字段 | 类型 | 说明 |
|------|------|------|
| _openid | string | 用户标识（自动） |
| id | string | 计划ID |
| knowledgePointId | string | 知识点ID |
| knowledgeTitle | string | 知识点标题（冗余，方便通知显示） |
| reviewIndex | number | 第几次复习 (1-6) |
| scheduledDate | string | 计划日期 "YYYY-MM-DD" |
| status | string | pending / done / skipped |
| completedAt | string? | 完成时间 |

**索引**:
- `_openid + scheduledDate` (用于每日查询)
- `knowledgePointId` (用于按知识点查询)

## Notification Template

### 订阅消息模板（已配置）

```
模板标题: 日程提醒
模板编号: 1677
模板ID: ZBxNrcShhhPcamdzNosUqP4RaxmHk8tiChXegCJ0VCU
类目: 日历

字段映射:
  {{date2.DATA}}   → 提醒日期    → 2026年8月1日
  {{thing3.DATA}}  → 提醒事项    → 知识点标题（最多3个，如"TCP三次握手、HTTP协议 等5个知识点"）
  {{thing10.DATA}} → 类型        → 复习提醒

示例展示:
┌─────────────────────────────┐
│ 日程提醒                      │
│                             │
│ 提醒日期: 2026年8月1日        │
│ 提醒事项: TCP三次握手、HTTP.. │
│ 类型: 复习提醒                │
└─────────────────────────────┘
```
