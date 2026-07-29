/**
 * ============================================================================
 * 图片工具 - image.js
 * ============================================================================
 *
 * 文件用途：
 *   提供知识点图片的全生命周期管理，包括选择、压缩、保存、读取、删除。
 *   与电子衣橱小程序保持一致的压缩策略。
 *
 * 主要导出函数/常量：
 *   - compressImage(src): 压缩图片（最长边不超过 1280px）
 *   - saveImage(knowledgeId, tempPath): 保存单张图片到本地文件系统
 *   - saveImages(knowledgeId, tempPaths): 批量保存图片
 *   - deleteImages(knowledgeId): 删除某知识点的所有图片
 *   - deleteImage(filePath): 删除单张图片
 *   - readImageAsBase64(filePath): 读取图片为 base64 数据
 *   - chooseImages(count): 调用微信选图/拍照接口
 *   - MAX_IMAGES / MAX_LONGEST_SIDE: 常量
 *
 * 核心约定：
 *   - 图片存储路径：{USER_DATA_PATH}/images/{knowledgeId}/{img_xxx}.jpg
 *   - 压缩策略：最长边 1280px，JPEG 质量 70%
 *   - 压缩方式优先使用 canvas，不可用时回退到 wx.compressImage
 *   - 单知识点最多 9 张图片
 *   - 知识点删除时应同步调用 deleteImages 清理图片文件
 *
 * 文件结构：
 *   images/
 *     └── {knowledgeId}/
 *           ├── img_xxxxx.jpg
 *           ├── img_yyyyy.jpg
 *           └── ...
 * ============================================================================
 */

/** 图片最长边限制（像素） */
const MAX_LONGEST_SIDE = 1280;

/** JPEG 压缩质量（0-1） */
const COMPRESS_QUALITY = 0.7;

/** 单知识点最大图片数量 */
const MAX_IMAGES = 9;

/**
 * 获取图片宽高等信息（Promise 封装）
 * @param {string} src - 图片路径
 * @returns {Promise<object>} wx.getImageInfo 的 success 回调参数
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
 * 压缩图片（保持宽高比，最长边不超过 MAX_LONGEST_SIDE）
 *
 * @param {string} src - 原始图片路径
 * @returns {Promise<string>} 压缩后的图片路径（临时文件）
 * @description
 *   - 图片已小于目标尺寸时跳过压缩，直接返回原路径
 *   - 压缩失败时返回原图，不影响后续流程
 *   - 优先使用 canvas 压缩，不可用时回退到 wx.compressImage
 */
async function compressImage(src) {
  try {
    const info = await getImageInfo(src);

    // 如果图片已经小于目标尺寸，无需压缩
    if (info.width <= MAX_LONGEST_SIDE && info.height <= MAX_LONGEST_SIDE) {
      return src;
    }

    // 计算压缩后的尺寸（保持宽高比）
    let targetWidth, targetHeight;
    if (info.width >= info.height) {
      // 横向图片：以宽为基准
      targetWidth = MAX_LONGEST_SIDE;
      targetHeight = Math.round((info.height / info.width) * MAX_LONGEST_SIDE);
    } else {
      // 竖向图片：以高为基准
      targetHeight = MAX_LONGEST_SIDE;
      targetWidth = Math.round((info.width / info.height) * MAX_LONGEST_SIDE);
    }

    // 使用 canvas 压缩（质量更可控）
    return await canvasCompress(src, targetWidth, targetHeight);
  } catch (e) {
    console.error('Compress failed:', e);
    return src; // 压缩失败返回原图，保证流程不中断
  }
}

/**
 * 使用 canvas 压缩图片（核心压缩逻辑）
 *
 * @param {string} src - 原始图片路径
 * @param {number} width - 目标宽度
 * @param {number} height - 目标高度
 * @returns {Promise<string>} 压缩后的临时文件路径
 * @description
 *   - 需要页面中存在 id="compressCanvas" 的 canvas 节点
 *   - 考虑设备像素比（dpr），保证清晰度
 *   - canvas 不可用时回退到 wx.compressImage API
 *   - 输出格式统一为 JPEG
 */
function canvasCompress(src, width, height) {
  return new Promise((resolve, reject) => {
    const query = wx.createSelectorQuery();
    query.select('#compressCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          // canvas 不可用（如页面未放置该节点），回退到 wx.compressImage
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

        // 设置 canvas 实际像素（考虑 dpr 保证清晰度）
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const image = canvas.createImage();
        image.src = src;
        image.onload = () => {
          // 绘制压缩后的图片
          ctx.drawImage(image, 0, 0, width, height);
          // 导出为临时文件
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
 *
 * @param {string} knowledgeId - 知识点 ID（用于创建子目录）
 * @param {string} tempPath - 临时图片路径（压缩后的）
 * @returns {string|null} 保存后的文件路径，失败返回 null
 * @description
 *   - 存储路径：{USER_DATA_PATH}/images/{knowledgeId}/{img_xxx}.jpg
 *   - 自动创建目录（如果不存在）
 *   - 文件名使用时间戳+随机数生成，避免冲突
 */
function saveImage(knowledgeId, tempPath) {
  const fs = wx.getFileSystemManager();
  const dirPath = `${wx.env.USER_DATA_PATH}/images/${knowledgeId}`;
  const fileName = `${generateId()}.jpg`;
  const filePath = `${dirPath}/${fileName}`;

  try {
    // 确保目录存在（不存在则递归创建）
    try {
      fs.accessSync(dirPath);
    } catch (e) {
      fs.mkdirSync(dirPath, true);
    }

    // 读取临时文件并写入目标位置
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
 * @param {string} knowledgeId - 知识点 ID
 * @param {string[]} tempPaths - 临时图片路径数组
 * @returns {string[]} 保存后的文件路径数组（仅包含成功保存的）
 */
function saveImages(knowledgeId, tempPaths) {
  const results = [];
  tempPaths.forEach(tempPath => {
    const savedPath = saveImage(knowledgeId, tempPath);
    if (savedPath) {
      results.push(savedPath);
    }
  });
  return results;
}

/**
 * 删除某知识点的所有图片（整个目录）
 * @param {string} knowledgeId - 知识点 ID
 * @description 删除知识点时应同步调用此方法清理关联图片
 */
function deleteImages(knowledgeId) {
  const fs = wx.getFileSystemManager();
  const dirPath = `${wx.env.USER_DATA_PATH}/images/${knowledgeId}`;

  try {
    // recursive: true 递归删除目录及内容
    fs.rmdirSync(dirPath, true);
  } catch (e) {
    // 目录可能不存在，忽略错误
    console.warn('Delete images failed:', e);
  }
}

/**
 * 删除单张图片
 * @param {string} filePath - 图片文件路径
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
 * 读取图片文件为 base64 数据（用于页面渲染）
 * @param {string} filePath - 文件路径
 * @returns {Promise<string>} base64 数据（带 data URI 前缀）
 * @description 返回格式：data:image/jpeg;base64,xxxxx
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
 * 调用微信选图/拍照接口
 * @param {number} count - 可选图片数量，默认 MAX_IMAGES(9)
 * @returns {Promise<string[]>} 临时文件路径数组
 * @description
 *   - 支持相册和相机两种来源
 *   - 使用压缩模式（sizeType: 'compressed'），减少传输数据量
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
 * 生成图片文件名唯一 ID
 * @returns {string} 如 "img_lz5k2k_abc123"
 * @description 使用时间戳（36进制）+ 随机字符串保证唯一性
 * 🔧 修复：增加随机字符串长度从 6 → 8，降低并发创建时的冲突概率
 */
function generateId() {
  return 'img_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 8);
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
