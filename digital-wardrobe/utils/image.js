/**
 * ============================================================================
 * 图片工具 - 压缩、保存、读取、删除
 * ============================================================================
 *
 * 【压缩策略】
 *   - 最长边限制 1280px，超出则等比缩放
 *   - 优先使用 canvas 压缩（可控制尺寸），失败回退到 wx.compressImage（仅质量）
 *   - 输出格式统一为 JPEG，质量 70%
 *
 * 【文件存储路径规则】
 *   - 临时路径：wx.chooseMedia 返回的 tempFilePath
 *   - 持久路径：${USER_DATA_PATH}/images/${itemId}/${fileName}.jpg
 *   - 按 itemId 分目录，便于批量删除
 *
 * 【导出函数】
 *   getImageInfo / compressImage / canvasCompress
 *   saveImage / saveImages / deleteImages / deleteImage
 *   readImageAsBase64 / chooseImages
 *   MAX_IMAGES / MAX_LONGEST_SIDE
 */

/**
 * 压缩后图片最长边像素上限
 * 1280px 在清晰度与存储体积间取得平衡
 */
const MAX_LONGEST_SIDE = 1280;

/**
 * JPEG 压缩质量（0~1）
 * 0.7 在视觉可接受范围内显著减小体积
 */
const COMPRESS_QUALITY = 0.7;

/**
 * 单次可选图片数量上限
 * 微信 chooseMedia 最大支持 9 张
 */
const MAX_IMAGES = 9;

/**
 * 获取图片宽高等信息
 * @param {string} src - 图片路径（临时或本地）
 * @returns {Promise<ImageInfo>} 含 width、height、path、orientation 等
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
 * 压缩图片（智能判断）
 * - 若图片两维均不超过 MAX_LONGEST_SIDE，直接返回原图
 * - 否则等比缩放至最长边为 MAX_LONGEST_SIDE，再经 canvas 压缩输出 JPEG
 * - 任何失败都兜底返回原图，保证业务不中断
 *
 * @param {string} src - 原始图片路径
 * @returns {Promise<string>} 压缩后的临时路径（或原图）
 */
async function compressImage(src) {
  try {
    const info = await getImageInfo(src);

    // 图片尺寸已满足要求，无需压缩，避免不必要的质量损失
    if (info.width <= MAX_LONGEST_SIDE && info.height <= MAX_LONGEST_SIDE) {
      return src;
    }

    // 等比缩放：以最长边为基准，计算目标尺寸
    let targetWidth, targetHeight;
    if (info.width >= info.height) {
      // 横图或正方形：宽度固定为上限
      targetWidth = MAX_LONGEST_SIDE;
      targetHeight = Math.round((info.height / info.width) * MAX_LONGEST_SIDE);
    } else {
      // 竖图：高度固定为上限
      targetHeight = MAX_LONGEST_SIDE;
      targetWidth = Math.round((info.width / info.height) * MAX_LONGEST_SIDE);
    }

    // 使用 canvas 进行高质量压缩
    const compressed = await canvasCompress(src, targetWidth, targetHeight);

    // 🔧 修复：记录压缩结果，便于调用方判断是否真正压缩
    if (compressed === src) {
      console.warn('Image compression fell back to original (large image):', src);
    } else {
      console.log(`Compressed: ${info.width}x${info.height} → ${targetWidth}x${targetHeight}`);
    }
    return compressed;
  } catch (e) {
    // 🔧 修复：获取图片信息失败时记录详细错误，仍返回原图保证业务不中断
    console.error('Compress failed, returning original:', e);
    return src;
  }
}

/**
 * 使用 canvas 节点压缩图片
 * 优先使用 canvas 控制输出尺寸；若页面未放置 #compressCanvas 节点，
 * 则回退到 wx.compressImage（仅控制质量，不改变尺寸）
 *
 * @param {string} src - 原始图片路径
 * @param {number} width - 目标宽度（逻辑像素）
 * @param {number} height - 目标高度（逻辑像素）
 * @returns {Promise<string>} 压缩后的临时文件路径
 * @description
 *   使用设备像素比（dpr）放大 canvas 物理尺寸，保证输出清晰度。
 *   页面需放置 <canvas type="2d" id="compressCanvas"></canvas> 才能走主流程。
 */
function canvasCompress(src, width, height) {
  return new Promise((resolve, reject) => {
    const query = wx.createSelectorQuery();
    query.select('#compressCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          // canvas 节点不存在（页面未声明），回退到微信原生压缩
          wx.compressImage({
            src,
            quality: COMPRESS_QUALITY * 100, // wx.compressImage 质量为 0~100
            success: (res) => resolve(res.tempFilePath),
            fail: () => resolve(src), // 回退也失败则返回原图
          });
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio; // 设备像素比

        // 物理尺寸 = 逻辑尺寸 × dpr，保证高清输出
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr); // 缩放绘图上下文

        const image = canvas.createImage();
        image.src = src;
        image.onload = () => {
          // 绘制缩放后的图片，输出为 JPEG
          ctx.drawImage(image, 0, 0, width, height);
          wx.canvasToTempFilePath({
            canvas,
            fileType: 'jpg', // 统一输出 JPEG，体积更小
            quality: COMPRESS_QUALITY,
            success: (res) => resolve(res.tempFilePath),
            fail: () => resolve(src), // 输出失败返回原图
          });
        };
        image.onerror = () => resolve(src); // 图片加载失败返回原图
      });
  });
}

/**
 * 保存单张图片到本地文件系统（持久化）
 * 将临时路径的图片复制到用户数据目录，按物品 ID 分目录存放
 *
 * @param {string} itemId - 物品 ID，用于创建子目录
 * @param {string} tempPath - 临时图片路径（来自 chooseMedia 或压缩后）
 * @returns {string|null} 保存后的持久化路径，失败返回 null
 */
function saveImage(itemId, tempPath) {
  const fs = wx.getFileSystemManager();
  // 路径格式：usr/images/{itemId}/{randomId}.jpg
  const dirPath = `${wx.env.USER_DATA_PATH}/images/${itemId}`;
  const fileName = `${generateId()}.jpg`;
  const filePath = `${dirPath}/${fileName}`;

  try {
    // 确保目录存在，不存在则递归创建
    try {
      fs.accessSync(dirPath);
    } catch (e) {
      fs.mkdirSync(dirPath, true); // recursive = true
    }

    // 读取临时文件二进制，写入目标位置（复制）
    const data = fs.readFileSync(tempPath);
    fs.writeFileSync(filePath, data);

    return filePath;
  } catch (e) {
    console.error('Save image failed:', e);
    return null;
  }
}

/**
 * 批量保存图片（异步，避免阻塞主线程）
 * 使用 fs.readFile + fs.writeFile 异步 API，逐张写入并在每张完成后
 * 让出事件循环，防止大图多时长时间阻塞 UI。
 *
 * @param {string} itemId - 物品 ID
 * @param {string[]} tempPaths - 临时图片路径数组
 * @returns {Promise<string[]>} 成功保存的路径数组（跳过失败项）
 */
function saveImages(itemId, tempPaths) {
  // 🔧 修复：改为异步逐张写入，避免同步阻塞主线程
  const fs = wx.getFileSystemManager();
  const dirPath = `${wx.env.USER_DATA_PATH}/images/${itemId}`;

  // 确保目录存在
  try {
    fs.accessSync(dirPath);
  } catch (e) {
    fs.mkdirSync(dirPath, true);
  }

  const results = [];

  // 异步单张保存，返回 Promise
  function saveOne(tempPath) {
    return new Promise((resolve) => {
      const fileName = `${generateId()}.jpg`;
      const filePath = `${dirPath}/${fileName}`;
      fs.readFile({
        filePath: tempPath,
        success(res) {
          fs.writeFile({
            filePath,
            data: res.data,
            success() {
              resolve(filePath);
            },
            fail() {
              console.warn('Write image failed:', tempPath);
              resolve(null);
            },
          });
        },
        fail() {
          console.warn('Read image failed:', tempPath);
          resolve(null);
        },
      });
    });
  }

  // 串行异步写入，每张完成后让出事件循环
  return tempPaths.reduce(
    (p, tempPath) =>
      p.then(async (acc) => {
        const savedPath = await saveOne(tempPath);
        if (savedPath) acc.push(savedPath);
        return acc;
      }),
    Promise.resolve(results)
  );
}

/**
 * 删除某个物品的所有图片（整个目录）
 * @param {string} itemId - 物品 ID
 * @description 使用 rmdirSync(recursive=true) 一次性清理该物品的图片目录
 */
function deleteImages(itemId) {
  const fs = wx.getFileSystemManager();
  const dirPath = `${wx.env.USER_DATA_PATH}/images/${itemId}`;

  try {
    fs.rmdirSync(dirPath, true); // recursive 删除整个目录
  } catch (e) {
    // 目录可能已被删除或不存在，静默忽略
    console.warn('Delete images failed:', e);
  }
}

/**
 * 删除单张图片文件
 * @param {string} filePath - 图片完整路径
 */
function deleteImage(filePath) {
  const fs = wx.getFileSystemManager();
  try {
    fs.unlinkSync(filePath); // 删除单个文件
  } catch (e) {
    console.warn('Delete image failed:', e);
  }
}

/**
 * 读取图片文件并转为 base64 data URI（用于渲染或上传）
 * @param {string} filePath - 本地文件路径
 * @returns {Promise<string>} data:image/jpeg;base64,xxx 格式
 */
function readImageAsBase64(filePath) {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager();
    try {
      const data = fs.readFileSync(filePath, 'base64');
      // 拼接 data URI 前缀，可直接用于 image 标签 src
      resolve(`data:image/jpeg;base64,${data}`);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * 调用微信选择图片（支持相册和相机）
 * @param {number} [count=MAX_IMAGES] - 可选图片数量，默认 9
 * @returns {Promise<string[]>} 临时文件路径数组
 * @description
 *   - mediaType 仅图片
 *   - sizeType 使用 compressed（系统先压缩一次，减小体积）
 *   - sourceType 同时支持相册和相机
 */
function chooseImages(count = MAX_IMAGES) {
  return new Promise((resolve, reject) => {
    wx.chooseMedia({
      count,
      mediaType: ['image'],          // 仅图片
      sourceType: ['album', 'camera'], // 相册 + 相机
      sizeType: ['compressed'],      // 使用系统压缩，减小初始体积
      success: (res) => {
        // 仅提取路径，丢弃其他字段
        resolve(res.tempFiles.map(f => f.tempFilePath));
      },
      fail: reject,
    });
  });
}

/**
 * 生成图片文件名唯一 ID
 * 格式：img_<时间戳36位><随机6位>
 * @returns {string} 唯一标识字符串
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
