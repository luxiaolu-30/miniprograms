/**
 * ============================================================================
 * 数据导出工具 - 将本地数据导出为 JSON 文件并引导用户分享
 * ============================================================================
 *
 * 【导出流程】
 *   1. 调用 storage.exportData() 生成 JSON 文件到本地
 *   2. 弹窗询问用户是否分享
 *   3. 用户确认后调用 wx.shareFileMessage 发送到微信聊天/电脑
 *
 * 【导出文件命名】
 *   - 本地文件：电子衣橱_export_<时间戳>.json
 *   - 分享文件：电子衣橱_备份_<YYYYMMDD>.json
 *
 * 【导出函数】
 *   exportAndShare
 */

const storage = require('./storage.js');

/**
 * 导出所有数据为 JSON 文件并引导用户分享
 * 流程：导出 → 弹窗确认 → 调用微信分享文件接口
 *
 * @returns {void}
 * @description
 *   分享成功后提示"已分享"，用户取消分享也提示"分享取消"（微信 API 特性：
 *   用户取消时走 fail 回调而非 cancel）。
 */
function exportAndShare() {
  const filePath = storage.exportData();
  if (!filePath) {
    wx.showToast({
      title: '导出失败',
      icon: 'none',
    });
    return;
  }

  // 弹窗询问用户是否要分享导出的文件
  wx.showModal({
    title: '导出成功',
    content: '数据已导出，是否分享保存到电脑或其他位置？',
    confirmText: '分享',
    cancelText: '稍后',
    success(res) {
      if (res.confirm) {
        // 用户确认分享，调用微信文件分享接口
        wx.shareFileMessage({
          filePath,
          // 文件名含日期，便于用户识别备份版本
          fileName: `电子衣橱_备份_${formatDateForFileName()}.json`,
          success() {
            wx.showToast({ title: '已分享', icon: 'success' });
          },
          // 🔧 修复：区分用户取消与真实错误，避免误报
          fail(err) {
            console.error('Share failed:', err);
            // 微信分享取消时 errMsg 包含 "cancel" 关键字
            const isCancel = err && err.errMsg && err.errMsg.indexOf('cancel') !== -1;
            if (isCancel) {
              // 用户主动取消，无需提示（静默处理）
              return;
            }
            // 真实错误给用户明确提示
            wx.showToast({ title: '分享失败，请重试', icon: 'none' });
          },
        });
      }
    },
  });
}

/**
 * 格式化当前日期为文件名友好格式（YYYYMMDD）
 * @returns {string} 如 '20260729'
 */
function formatDateForFileName() {
  const d = new Date();
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0'); // 月份补零
  const D = String(d.getDate()).padStart(2, '0');       // 日期补零
  return `${Y}${M}${D}`;
}

module.exports = {
  exportAndShare,
};
