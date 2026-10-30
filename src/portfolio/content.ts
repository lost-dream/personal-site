import heroPhotos from "./tunnel-photos.json";
import heroTunnelOrder from "./hero-tunnel-order.json";
import experiencePhotos from "./experience-photos.json";

export type Photo = {
  width?: number;
  height?: number;
  id: string;
  title: string;
  note?: string;
  src?: string;
  mobileSrc?: string;
  thumbnail?: string;
  alt?: string;
  kind?: "image" | "video";
  poster?: string;
  captions?: string;
};
export type Work = {
  id: string;
  title: string;
  note: string;
  image?: Photo;
  video?: Photo;
  href?: string;
  contribution?: string;
  source?: string;
  publishedAt?: string;
  excerpt?: string;
  photos?: Photo[];
  imageUnavailable?: boolean;
};
export type Publication = {
  id: string;
  title: string;
  author: string;
  journal: string;
  year: number;
  volume: number;
  issue: number;
  firstPage: number;
  doi: string;
  summary: string;
  href: string;
  pdf: string;
  pages: Photo[];
};
export type Social = {
  platform?: "qq" | "wechat" | "douyin";
  label: string;
  value?: string;
  href?: string;
  qr?: Photo;
};
export type PortfolioContent = {
  name?: string;
  introduction?: string;
  hero: Photo[];
  awards: Photo[];
  certificates: Photo[];
  socials: [Social, Social, Social, Social];
  videos: Work[];
  programs: Array<Work & { qr?: Photo }>;
  github: [Work, Work];
  news: [Work, Work, Work];
  publications?: Publication[];
  practice: Photo[];
  life: Array<{ id: string; title: string; note: string; photos: Photo[] }>;
};

const slots = (prefix: string, titles: string[]): Photo[] =>
  titles.map((title, i) => ({ id: `${prefix}-${i}`, title }));
const documents = (group: "awards" | "certificates", label: string): Photo[] =>
  experiencePhotos[group].map((photo, index, pages) => ({
    id: `${group}-${index + 1}`,
    title: `${label} ${String(index + 1).padStart(2, "0")}`,
    src: `${import.meta.env.BASE_URL}media/experience/${group}/${photo.file}`,
    width: photo.width,
    height: photo.height,
    alt: `池树孝的${label}材料，第 ${index + 1} 页`,
    note: `${label}记录 · ${index + 1} / ${pages.length} · 点击图片放大查看`,
  }));
// Add only verified personal material here. Undefined sources/links remain honest placeholders.
export const portfolioContent: PortfolioContent = {
  name: "池树孝",
  // Exact 269-photo sequence approved in “支线2”; keep the original asset IDs.
  hero: heroTunnelOrder.map((index) => {
    const photo = heroPhotos[index];
    const number = String(index + 1).padStart(2, "0");
    return {
      id: `home-${number}`,
      title: `首页照片 ${number}`,
      src: `${import.meta.env.BASE_URL}media/hero-tunnel/${photo.file}`,
      thumbnail: `${import.meta.env.BASE_URL}media/hero-tunnel/${photo.thumbnail}`,
      width: photo.width,
      height: photo.height,
      alt: `池树孝的影像档案：${photo.source.replace(/\.[^.]+$/, "")}`,
    };
  }),
  awards: documents("awards", "荣誉"),
  certificates: documents("certificates", "证书"),
  socials: [
    { label: "QQ", value: "2830394265", platform: "qq" },
    { label: "微信", value: "cysy0318", platform: "wechat" },
    { label: "抖音账号 01", value: "67224716452", platform: "douyin" },
    { label: "抖音账号 02", value: "26471967472", platform: "douyin" },
  ],
  videos: [
    { id: "video-1", title: "飞行影像", note: "", video: { id: "flight-1", title: "右侧飞行视频", kind: "video", src: `${import.meta.env.BASE_URL}media/flight/optimized/v1/1-desktop.mp4`, mobileSrc: `${import.meta.env.BASE_URL}media/flight/optimized/v1/1-mobile.mp4`, poster: `${import.meta.env.BASE_URL}media/flight/1-poster.jpg`, width: 1440, height: 1080 } },
    { id: "video-2", title: "飞行影像", note: "", video: { id: "flight-2", title: "左上飞行视频", kind: "video", src: `${import.meta.env.BASE_URL}media/flight/optimized/v1/2-desktop.mp4`, mobileSrc: `${import.meta.env.BASE_URL}media/flight/optimized/v1/2-mobile.mp4`, poster: `${import.meta.env.BASE_URL}media/flight/2-poster.jpg`, width: 1920, height: 1080 } },
    { id: "video-3", title: "飞行影像", note: "", video: { id: "flight-3", title: "左下飞行视频", kind: "video", src: `${import.meta.env.BASE_URL}media/flight/optimized/v1/3-desktop.mp4`, mobileSrc: `${import.meta.env.BASE_URL}media/flight/optimized/v1/3-mobile.mp4`, poster: `${import.meta.env.BASE_URL}media/flight/3-poster.jpg`, width: 1920, height: 1080 } },
  ],
  programs: [
    {
      id: "program-1",
      title: "职业技能刷题",
      note: "面向铁路线路工的普速题库，提供章节练习、模拟考试与错题复习。",
      image: {
        id: "program-1-screen",
        title: "职业技能刷题·首页",
        alt: "职业技能刷题小程序首页，展示章节练习、模拟考试、错题复习和学习进度",
        src: `${import.meta.env.BASE_URL}media/programs/railway-practice/home.png`,
        width: 615,
        height: 1169,
      },
      qr: {
        id: "program-1-qr",
        title: "职业技能刷题·小程序码",
        alt: "职业技能刷题的微信小程序码",
        src: `${import.meta.env.BASE_URL}media/programs/railway-practice/qr.jpg`,
        width: 430,
        height: 430,
      },
    },
    {
      id: "program-2",
      title: "左到右计算",
      note: "采用黑底大按键界面，提供加减乘除、百分比、正负切换与退格等基础计算操作。",
      image: {
        id: "program-2-screen",
        title: "左到右计算·界面",
        alt: "左到右计算小程序界面，黑色背景、数字按键及橙色四则运算按键",
        src: `${import.meta.env.BASE_URL}media/programs/calculator/screen.png`,
        width: 622,
        height: 1178,
      },
      qr: {
        id: "program-2-qr",
        title: "左到右计算·小程序码",
        alt: "左到右计算的微信小程序码",
        src: `${import.meta.env.BASE_URL}media/programs/calculator/qr.jpg`,
        width: 430,
        height: 430,
      },
    },
  ],
  github: [
    {
      id: "repo-1",
      title: "苍梦 · cangmeng",
      note: "把照片海报创作、PNG 来源元数据处理与本地视觉技能扩展，整合到同一个任务入口。",
      contribution: "整合与维护：任务路由、扩展发现、元数据工具及使用文档；保留上游海报指南的署名与许可。",
      href: "https://github.com/lost-dream/cangmeng",
      image: {
        id: "repo-1-overview",
        title: "苍梦 GitHub 仓库信息图",
        alt: "GitHub 提供的 lost-dream/cangmeng 仓库信息图，非软件界面截图",
        src: `${import.meta.env.BASE_URL}media/github/cangmeng.png`,
        width: 1200,
        height: 600,
      },
    },
    {
      id: "repo-2",
      title: "小说创作工作台 · story-workbenches",
      note: "面向 Codex 的长短篇创作技能，串联构思、规划、写作、旧稿导入、表达精修、审稿与封面流程。",
      contribution: "整合与维护：长短篇双入口、模块适配、旧稿导入衔接及使用文档；保留上游技能的来源说明与许可。",
      href: "https://github.com/lost-dream/story-workbenches",
      image: {
        id: "repo-2-overview",
        title: "小说创作工作台 GitHub 仓库信息图",
        alt: "GitHub 提供的 lost-dream/story-workbenches 仓库信息图，非软件界面截图",
        src: `${import.meta.env.BASE_URL}media/github/story-workbenches.png`,
        width: 1200,
        height: 600,
      },
    },
  ],
  publications: [{
    id: "railway-support-review",
    title: "铁路轨道测量设备可调支撑结构技术综述与展望",
    author: "池树孝",
    journal: "社会发展与科技创新",
    year: 2026,
    volume: 3,
    issue: 9,
    firstPage: 113,
    doi: "10.64649/yh.shfzykjcx.issn3078-8994.202609037",
    summary: "围绕铁路轨道测量设备的支撑结构，对比螺旋传动、液压驱动与机电混合三类方案的调平原理、精度、效率和适用工况，并讨论智能化与高精度化的发展方向。",
    href: "https://yuanhong.pub/shfzykjcx/shfz260937.html",
    pdf: `${import.meta.env.BASE_URL}media/publications/railway-support/article.pdf`,
    pages: [1, 2, 3].map((page) => ({
      id: `railway-support-page-${page}`,
      title: `铁路轨道测量设备可调支撑结构技术综述与展望 · 第${page}页`,
      alt: `论文正文第${page}页，刊物第${112 + page}页`,
      src: `${import.meta.env.BASE_URL}media/publications/railway-support/page-${page}.webp`,
      thumbnail: page === 1 ? `${import.meta.env.BASE_URL}media/publications/railway-support/cover.webp` : undefined,
      width: 1697,
      height: 2400,
    })),
  }],
  news: [
    {
      id: "news-1",
      title: "校企协同探新路 数智赋能育英才 ——西安铁路职业技术学院以产教融合推动技术创新",
      source: "陕工网—陕西工人报",
      publishedAt: "2025-04-23",
      excerpt: "大一学生梁金雨、景怡清和池树孝也积极参与其中",
      photos: [{
        id: "news-1-photo",
        title: "陕工网桥梁项目报道配图",
        alt: "陕工网—陕西工人报桥梁减隔震项目报道中的现场配图",
        src: `${import.meta.env.BASE_URL}media/news/sxworker-bridge.jpg`,
        width: 400,
        height: 246,
      }],
      note: "作为学生团队成员参与桥梁减隔震技术研发，相关校企协同实践获报道。",
      href: "https://www.sxworker.com/e/wap/show.php?id=198401",
    },
    {
      id: "news-2",
      title: "西安铁路职业技术学院师生研发桥梁减隔震产品在工程上试用",
      source: "中华网",
      publishedAt: "2025-03-20",
      excerpt: "大一年级学生梁金雨、景怡清和池树孝",
      imageUnavailable: true,
      note: "报道记录桥梁减隔震产品的研发与工程试用，并将池树孝列为项目核心团队成员。",
      href: "https://m.tech.china.com/redian/2025/0320/032025_1650395.html",
    },
    {
      id: "news-3",
      title: "西安铁路职业技术学院学子深入蔬菜种植基地调研，赋能乡村振兴",
      source: "中华网",
      publishedAt: "2025-05-27",
      excerpt: "土木工程学院的梁金雨、杨雨轩、池树孝和郁童童",
      imageUnavailable: true,
      note: "作为调研小组成员走进蔬菜种植基地，参与乡村振兴主题调研。",
      href: "https://m.tech.china.com/redian/2025/0527/052025_1678309.html",
    },
  ],
  practice: slots("practice", [
    "比赛现场",
    "团队协作",
    "校园活动",
    "活动实践",
    "赛后合影",
    "实践记录",
  ]),
  life: [
    {
      id: "fpv",
      title: "穿越机",
      note: "换个高度，看世界。",
      photos: [
        { id: "fpv-photo", title: "穿越机照片" },
        { id: "fpv-video", title: "飞行视频", kind: "video" },
      ],
    },
    {
      id: "mountain",
      title: "山野之间",
      note: "走进山里，也走近自己。",
      photos: slots("mountain", ["爬山照片"]),
    },
    {
      id: "dolls",
      title: "小小陪伴",
      note: "收藏一些可爱的瞬间。",
      photos: slots("dolls", ["小玩偶照片"]),
    },
    {
      id: "daily",
      title: "日常的我",
      note: "普通的一天，也值得留下。",
      photos: slots("daily", ["日常自拍"]),
    },
  ],
};

export function externalHref(value?: string) {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
