/**
 * 进度条组件（progress-bar）
 *
 * 用途：展示学习/复习进度，根据当前进度与总进度计算百分比。
 *       常用于艾宾浩斯复习计划中展示每日任务完成情况。
 *
 * 对外暴露的 properties：
 *   - current {Number}  - 当前已完成数量，默认 0
 *   - total   {Number}  - 总数量，默认 6（艾宾浩斯 6 个复习周期）
 *   - showText {Boolean} - 是否显示进度文字，默认 true
 *   - color   {String}  - 进度条主题色，'primary' | 'success'，默认 'primary'
 *
 * 对外暴露的内部状态（通过 data 传递给模板）：
 *   - percent {Number} - 计算后的进度百分比（0-100）
 *
 * 注意：本组件未对外触发事件，仅做展示用途。
 */
Component({
  /**
   * 组件属性（properties）
   * 由父组件传入进度数据与展示配置
   */
  properties: {
    current: {
      type: Number,
      value: 0, // 当前已完成数量
    },
    total: {
      type: Number,
      value: 6, // 总数量（默认 6，对应艾宾浩斯 6 个复习阶段）
    },
    showText: {
      type: Boolean,
      value: true, // 默认显示进度文字（如 "3/6"）
    },
    color: {
      type: String,
      value: 'primary', // 主题色：primary（主色）或 success（完成色）
    },
  },

  /**
   * 组件内部数据（data）
   * percent 由 observers 自动计算，模板直接绑定展示
   */
  data: {
    percent: 0, // 进度百分比（0-100）
  },

  /**
   * 数据监听器（observers）
   * 监听 current 或 total 变化，自动重新计算百分比
   */
  observers: {
    'current, total': function (current, total) {
      // 🔧 修复：限制百分比在 0-100 之间，防止 current>total 或负值导致异常
      let percent = 0;
      if (total > 0) {
        percent = Math.round((current / total) * 100);
        percent = Math.max(0, Math.min(100, percent));
      }
      this.setData({ percent });
    },
  },
});
