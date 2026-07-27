/**
 * 数据导出工具
 */

const storage = require('./storage.js');

/**
 * 导出所有数据为 JSON 文件并分享
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

  wx.showModal({
    title: '导出成功',
    content: '数据已导出，是否分享保存到电脑或其他位置？',
    confirmText: '分享',
    cancelText: '稍后',
    success(res) {
      if (res.confirm) {
        wx.shareFileMessage({
          filePath,
          fileName: `电子衣橱_备份_${formatDateForFileName()}.json`,
          success() {
            wx.showToast({ title: '已分享', icon: 'success' });
          },
          fail(err) {
            console.error('Share failed:', err);
            wx.showToast({ title: '分享取消', icon: 'none' });
          },
        });
      }
    },
  });
}

function formatDateForFileName() {
  const d = new Date();
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  return `${Y}${M}${D}`;
}

module.exports = {
  exportAndShare,
};
