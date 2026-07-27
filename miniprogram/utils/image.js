/**
 * 图片工具 - 压缩、保存、读取、删除
 */

const MAX_LONGEST_SIDE = 1280;
const COMPRESS_QUALITY = 0.7;
const MAX_IMAGES = 9;

/**
 * 获取图片信息
 */
function getImageInfo(src) {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src,
      success: resolve,
      fail: reject,
    });
  });
}

/**
 * 压缩图片
 * @param {string} src 原始图片路径
 * @returns {Promise<string>} 压缩后的临时路径
 */
async function compressImage(src) {
  try {
    const info = await getImageInfo(src);

    // 如果图片已经小于目标尺寸，跳过压缩
    if (info.width <= MAX_LONGEST_SIDE && info.height <= MAX_LONGEST_SIDE) {
      return src;
    }

    // 计算压缩后的尺寸
    let targetWidth, targetHeight;
    if (info.width >= info.height) {
      targetWidth = MAX_LONGEST_SIDE;
      targetHeight = Math.round((info.height / info.width) * MAX_LONGEST_SIDE);
    } else {
      targetHeight = MAX_LONGEST_SIDE;
      targetWidth = Math.round((info.width / info.height) * MAX_LONGEST_SIDE);
    }

    // 使用 canvas 压缩
    return await canvasCompress(src, targetWidth, targetHeight);
  } catch (e) {
    console.error('Compress failed:', e);
    return src; // 压缩失败返回原图
  }
}

/**
 * 使用 canvas 压缩图片
 */
function canvasCompress(src, width, height) {
  return new Promise((resolve, reject) => {
    const query = wx.createSelectorQuery();
    query.select('#compressCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          // canvas 不可用，尝试使用 wx.compressImage
          wx.compressImage({
            src,
            quality: COMPRESS_QUALITY * 100,
            success: (res) => resolve(res.tempFilePath),
            fail: () => resolve(src),
          });
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const image = canvas.createImage();
        image.src = src;
        image.onload = () => {
          ctx.drawImage(image, 0, 0, width, height);
          wx.canvasToTempFilePath({
            canvas,
            fileType: 'jpg',
            quality: COMPRESS_QUALITY,
            success: (res) => resolve(res.tempFilePath),
            fail: () => resolve(src),
          });
        };
        image.onerror = () => resolve(src);
      });
  });
}

/**
 * 保存图片到本地文件系统
 * @param {string} itemId 物品 ID
 * @param {string} tempPath 临时图片路径
 * @returns {string} 保存后的文件路径
 */
function saveImage(itemId, tempPath) {
  const fs = wx.getFileSystemManager();
  const dirPath = `${wx.env.USER_DATA_PATH}/images/${itemId}`;
  const fileName = `${generateId()}.jpg`;
  const filePath = `${dirPath}/${fileName}`;

  try {
    // 确保目录存在
    try {
      fs.accessSync(dirPath);
    } catch (e) {
      fs.mkdirSync(dirPath, true);
    }

    // 复制文件到目标位置
    const data = fs.readFileSync(tempPath);
    fs.writeFileSync(filePath, data);

    return filePath;
  } catch (e) {
    console.error('Save image failed:', e);
    return null;
  }
}

/**
 * 批量保存图片
 * @param {string} itemId 物品 ID
 * @param {string[]} tempPaths 临时图片路径数组
 * @returns {string[]} 保存后的文件路径数组
 */
function saveImages(itemId, tempPaths) {
  const results = [];
  tempPaths.forEach(tempPath => {
    const savedPath = saveImage(itemId, tempPath);
    if (savedPath) {
      results.push(savedPath);
    }
  });
  return results;
}

/**
 * 删除物品的所有图片
 * @param {string} itemId 物品 ID
 */
function deleteImages(itemId) {
  const fs = wx.getFileSystemManager();
  const dirPath = `${wx.env.USER_DATA_PATH}/images/${itemId}`;

  try {
    fs.rmdirSync(dirPath, true);
  } catch (e) {
    // 目录可能不存在，忽略
    console.warn('Delete images failed:', e);
  }
}

/**
 * 删除单张图片
 * @param {string} filePath 图片文件路径
 */
function deleteImage(filePath) {
  const fs = wx.getFileSystemManager();
  try {
    fs.unlinkSync(filePath);
  } catch (e) {
    console.warn('Delete image failed:', e);
  }
}

/**
 * 读取图片为 base64（用于渲染）
 * @param {string} filePath 文件路径
 * @returns {Promise<string>} base64 数据
 */
function readImageAsBase64(filePath) {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager();
    try {
      const data = fs.readFileSync(filePath, 'base64');
      resolve(`data:image/jpeg;base64,${data}`);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * 选择图片（拍照或相册）
 * @param {number} count 可选数量
 * @returns {Promise<string[]>} 临时文件路径数组
 */
function chooseImages(count = MAX_IMAGES) {
  return new Promise((resolve, reject) => {
    wx.chooseMedia({
      count,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        resolve(res.tempFiles.map(f => f.tempFilePath));
      },
      fail: reject,
    });
  });
}

/**
 * 生成唯一 ID
 */
function generateId() {
  return 'img_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

module.exports = {
  MAX_IMAGES,
  MAX_LONGEST_SIDE,
  compressImage,
  saveImage,
  saveImages,
  deleteImages,
  deleteImage,
  readImageAsBase64,
  chooseImages,
};
