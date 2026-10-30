# 第二版内容接入

页面入口：`PortfolioPage.tsx`。全部素材和文字集中在 `content.ts` 的 `portfolioContent`。

## 图片

把图片放入 `public/media/`，对应项填写 `src: '/media/photo.webp'` 和描述图片内容的 `alt`。`id` 保持稳定且唯一；`title` 为可见名称，`note` 可写日期、颁发单位或本人角色。奖状、证书与二维码完整显示，不裁切。

没有 `src` 会显示蓝色占位，不需要删除该项。空数组会取消照片墙，单张照片不会自动轮换。

## 社交入口

`socials` 固定 QQ、微信、抖音账号 01、抖音账号 02。`value` 为账号，`href` 为主页链接，`qr` 为二维码 Photo。缺失值不会产生空链接或无效复制按钮。

## 作品

- `videos`: 每项 `image` 是封面，`note` 是一句创作说明，`href` 是对应抖音视频链接。点击在新窗口打开，不嵌入播放器。
- `programs`: `image` 为小程序截图，`qr` 为二维码。
- `github`: 用户确认的两个项目（cangmeng、story-workbenches）；`image` 可放真实截图或明确标注的仓库信息图，`href` 为仓库，`contribution` 说明整合与维护贡献，不将上游内容写成全部独立原创。
- `news`: 三篇原文，`title` 为真实标题，`note` 写来源、日期与参与说明，`href` 为原文。
- `publications`: 本人撰写的期刊论文，单独于新闻数据维护，在“新闻里的足迹”中置顶；记录作者、期刊、卷期、起始页、DOI、简介、原文链接、原始PDF及逐页图片。`PublicationCard`打开`PublicationReader`站内弹窗，支持翻页/缩放/键盘/Esc，不替换原有三篇新闻。原PDF保持不变，首页只加载缩略图。

## 生活视频

在生活组的 Photo 中设置 `kind: 'video'`、`src: '/media/flight.mp4'`、`poster: '/media/flight-cover.webp'`。点击后打开带原生控制的播放器，不自动播放。`note` 可放视频说明；有对白时提供字幕文件 `captions: '/media/flight.zh.vtt'`。

## 运行

第三模块当前背景：`WorksPhotoBackground`，素材清单 `works-mosaic-photos.json`，布局/羽化参数在 `works-photo-mosaic.ts`。原始照片静态拼贴，0px间距、每边至少12px等比外扩以遮住接缝、5px边缘羽化，按模块高度自动覆盖，背景不响应点击。旧飘动海报背景仅保留源码供回溯，不在主站或独立预览挂载。

三个内嵌飞行视频保持静音自动循环及原生控件；`flight-videos.css` 中默认opacity=0.5，hover/focus=0.85，过渡450ms，原16px圆角与8px视频羽化不变。

在 `portfolio-vite` 目录执行 `npm run dev -- --host 127.0.0.1`，打开终端输出的本地网址。`npm run build` 生成静态构建。

旧 V1 组件、内容和动效源码仍在原目录；新版没有加载旧的 `styles/sections.css` 或项目卡片堆叠场景。原始 `site/` 未修改。

当前保持 noindex/nofollow，不设置真实身份或公开索引。提供真实媒体后，需要复查图片清晰度、压缩体积、二维码识别及视频字幕。
