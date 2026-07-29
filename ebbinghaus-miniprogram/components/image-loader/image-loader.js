/**
 * 图片加载器组件（image-loader）
 *
 * 用途：封装小程序原生 <image> 组件，提供加载状态与错误状态的统一管理，
 *       父组件可根据 loaded / error 状态展示 loading 或错误占位。
 *
 * 对外暴露的 properties：
 *   - src {String}      - 图片资源地址，默认 ''
 *   - mode {String}     - 图片裁剪/缩放模式，默认 'aspectFill'
 *   - lazyLoad {Boolean} - 是否开启图片懒加载，默认 true
 *
 * 对外暴露的内部状态（通过 data 传递给模板）：
 *   - loaded {Boolean} - 图片是否加载成功
 *   - error  {Boolean} - 图片是否加载失败
 *
 * 注意：本组件未对外触发事件，状态通过 data 在模板中绑定使用。
 */
Component({
  /**
   * 组件属性（properties）
   * 透传给内部 <image> 标签的常用属性
   */
  properties: {
    src: {
      type: String,
      value: '', // 图片资源路径（本地或网络地址）
    },
    mode: {
      type: String,
      value: 'aspectFill', // 缩放模式：保持纵横比缩放，短边填满
    },
    lazyLoad: {
      type: Boolean,
      value: true, // 默认开启懒加载，提升页面性能
    },
  },

  /**
   * 组件内部数据（data）
   * 用于追踪图片加载过程的状态
   */
  data: {
    loaded: false, // 图片是否加载完成
    error: false,  // 图片是否加载失败
  },

  /**
   * 数据监听器（observers）
   * 监听 src 变化时重置加载状态，避免切换图片时沿用旧状态
   */
  observers: {
    'src': function () {
      // 🔧 修复：src 变化时重置 loaded/error，确保新图片重新走加载流程
      this.setData({ loaded: false, error: false });
    },
  },

  /**
   * 组件方法
   * 监听 <image> 原生事件，更新内部加载状态
   */
  methods: {
    /**
     * 图片加载成功回调
     * 将 loaded 置为 true，模板可据此隐藏 loading 占位
     */
    onLoad() {
      this.setData({ loaded: true });
    },
    /**
     * 图片加载失败回调
     * 将 error 置为 true，模板可据此展示错误占位或重试按钮
     */
    onError() {
      this.setData({ error: true });
    },
  },
});
