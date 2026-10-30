# 池树孝的个人网站

React + Vite 单页网站，包括首页照片隧道、个人经历、个人作品集及实践相册。

## 本地运行

```sh
npm ci
npm run dev
```

## 内容与素材

当前主站入口为 `src/portfolio/PortfolioPage.tsx`，个人信息、项目和外部链接在 `src/portfolio/content.ts`。相册、照片隧道和背景照片使用同目录的 JSON 清单；媒体位于 `public/media/`。`src/content/profile.ts` 等文件属于历史版本，不是当前主站内容入口。

三段视频使用 `media/flight/optimized/v1/` 中的电脑和手机副本。原片、旧网页副本、本地截图与备份不纳入发布仓库。新照片和视频应先生成适合网页的副本，原件保存在仓库外。

## Cloudflare Pages 自动发布

连接这个 GitHub 仓库，项目根目录保持仓库根目录，输出目录填写 `dist`，构建命令填写 `npm run build:cloudflare`。该命令包含 Lint、测试、TypeScript 和 Vite 构建；检查失败时不会生成新的发布产物。

生产分支使用 `codex/site-launch`。Node 版本由 `.nvmrc` 固定为 24.16.0。

首次测试部署不设置 `SITE_URL`，页面保持禁止收录。正式域名确定后，在 Cloudflare 的生产环境变量中设置：

- `SITE_URL`：实际的 HTTPS 根地址，不带路径、参数或账号信息。
- `PAGES_PRODUCTION_BRANCH`：`codex/site-launch`。

仅当部署分支匹配生产分支、上述变量存在且处于 Cloudflare 构建环境时，构建才会开放收录并生成 canonical、og:url、robots 和 sitemap。其他分支继续禁止收录。

`npm run build` 始终生成本地预览版。`npm run build:release` 用于在设置 `SITE_URL` 后手动生成正式版，不作为所有分支统一使用的云端构建命令。

`scripts/prepare-pages.mjs` 生成 Pages 缓存响应头和 404 页面，并拒绝任何超过 25 MiB 的文件。生产部署完成后仍需核验实际响应头、视频范围请求、正式域名访问与手机播放。

## 检查

```sh
npm run test:run
npm run typecheck
npm run lint
npm run build
```

## 更新约定

原始素材与历史设计目录不随网站仓库上传。当前工作区的主开发目录仍为 `portfolio-vite/`；整理完成后通过本机的 `scripts/export-github-site.mjs` 同步到旁边的独立发布仓库，再检查差异并提交。导出器遇到发布仓库中的独立修改时会停止，先合并修改再同步，避免覆盖。

也可以在 GitHub 克隆下来的仓库中直接开发、检查和提交。使用哪一份本地目录前，应先确认其 Git 远端，避免在两个目录中分别修改后互相覆盖。
