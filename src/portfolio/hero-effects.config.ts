/** Hero 效果的集中参数。改动后 Vite 会自动更新预览。 */
export const heroEffects = {
  tunnel: {
    autoSpeed: 120, // px/秒；0 = 不自动推进
    depthGap: 300, // 相邻照片的纵深距离（px）
    angleStep: 50, // 支线2 最新选定：错落螺旋（度）
    direction: 1, // 1 = 顺时针，-1 = 逆时针；照片和漩涡共用
    wheelSensitivity: 1.5, // 上滑前进、下滑后退
    smoothing: 0.07, // 60fps 的惯性系数；越小越柔缓
    visibleCount: 20, // 只挂载这一小段，不同时挂载全部 269 张
    radiusX: 0.43, // 最新版收紧的横向半径 / 展示区域宽度
    radiusY: 0.38, // 最新版收紧的纵向半径 / 展示区域高度
    centerY: 0.56,
    referenceWidth: 1086, // 支线预览基准；照片尺寸随区域宽度缩放
    photoMaxWidth: 200,
    photoMaxHeight: 240,
    minimumScale: 0.15,
    scalePower: 3,
    innerRadius: 0.18,
    radiusPower: 1.4,
    outerExtension: 0.16,
    outerExtensionPower: 1.6,
    entryDuration: 1, // 秒；中心补入的新照片
    exitDuration: 0.5, // 秒；外圈退出
    photoOpacity: 0.8,
    feather: 6, // px
    photoRadius: 16, // px；投影到远处时会随照片一起缩小
    backgroundBlur: 12, // 额外的局部背景虚化（px）
    backgroundShade: 0.34,
  },
  galaxy: {
    dustCount: 480,
    starCount: 96,
    fieldOpacity: 0.5,
    streamOpacity: 0.65,
    drift: 0.22, // 与有正负号的照片推进共用方向
    fps: 30,
    maxPixelCount: 650000, // 每层画布预算
    maxPixelRatio: 1.25,
    colors: { blue: "#a7c8ff", violet: "#b5a0df", gold: "#f0d3a3", core: "#d4b5de" },
  },
  border: {
    speed: 0.4,
    radius: 30,
    thickness: 1.5, // shader 实际传入 0.015
    softness: 75,
    intensity: 30,
    bloom: 50,
    spotSize: 60,
    spread: 25,
    spots: 3,
    pulse: 0,
    smoke: 0.35,
    smokeSize: 0.63,
    colors: ["#7FAEFF", "#68BFC3", "#E7F0FC"],
  },
} as const;
