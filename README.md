# Fluidica

**AI-designed microfluidics, manufactured on demand.**

面向自定义 3D 打印微流控芯片的英文品牌网站，使用 Astro 和 Tailwind CSS 构建。包含品牌首页、技术优势、真实实验室照片图集、合作流程、可切换的应用场景、FAQ、项目咨询弹窗、隐私说明和 404 页面，适配桌面与手机。

## 本地运行

推荐使用 **Node.js 24**；项目要求 Node.js ≥ 22.12.0。

```bash
npm install
npm run dev
```

开发地址以终端输出为准，默认通常是 `http://localhost:4321`。

```bash
npm run check    # Astro / TypeScript 检查
npm run build    # 生成静态网站到 dist/
npm run preview  # 本地预览构建结果
```

`dev` 和 `build` 会先根据主题配置生成 CSS。修改主题配置后，重新运行相应命令即可。

首次运行浏览器检查需安装 Chromium：

```bash
npx playwright install chromium
npm run build
npm test
```

检查覆盖桌面和手机布局、应用场景键盘切换、FAQ、导航焦点、咨询表校验与文件下载，以及自动无障碍扫描。`npm run format` 可统一格式化代码。

## 修改内容

| 内容                                | 文件                                         |
| ----------------------------------- | -------------------------------------------- |
| 技术优势、流程、应用场景与 FAQ 文案 | `src/content/homepage/content.ts`            |
| 首页首屏、其他区块标题与页面结构    | `src/pages/index.astro`                      |
| 品牌名称、标语、描述与联系邮箱      | `src/config/site.ts`                         |
| 页面样式、布局与响应式规则          | `src/styles/main.css`                        |
| 主题颜色与字体配置                  | `src/config/theme.json`                      |
| 网站标题、社交分享元数据与公共布局  | `src/layouts/Base.astro`                     |
| 项目咨询表单及交互                  | `src/layouts/components/ProjectDialog.astro` |
| 用户提供的首页原图                  | `public/images/fluidica-chip.png`            |
| 7 张真实实验室原始照片              | `public/images/lab/`                         |
| 实验照片顺序、标题、说明            | `src/content/homepage/lab.ts`                |
| 实验室板块布局、原图查看器          | `src/layouts/components/LabGallery.astro`    |
| 隐私说明                            | `src/pages/privacy.astro`                    |

`src/styles/generated-theme.css` 由 `scripts/themeGenerator.js` 自动生成，请修改主题配置而非直接修改生成文件。字体随项目安装并由网站本地提供。

## 项目咨询

目前联系邮箱为 `danielzhong2000@gmail.com`，统一在 `src/config/site.ts` 修改。

“Start your project” 打开咨询表单。填写后可以打开本机邮件应用，生成包含项目需求的邮件草稿；用户检查并发送邮件后，咨询才会送达。也可以下载项目简介文本文件，再自行发送。网站不会自动通过服务器发送邮件，也不会保存表单内容。

## 在 GitHub 上发布

项目已经连接到 [`danielzhong/Fluidica`](https://github.com/danielzhong/Fluidica)，当前分支为 `main`。GitHub Pages 自动部署配置已准备好，但本次修改尚未推送，也没有实际发布。

1. 打开仓库的 **Settings → Pages**，将 **Build and deployment → Source** 设为 **GitHub Actions**。免费个人账户使用 GitHub Pages 时，仓库需为公开仓库。
2. 在本地项目目录提交并上传网站文件（包含 `.github/workflows/deploy.yml`、`package-lock.json` 和 `public/images/`）：

   ```bash
   git add .
   git commit -m "Build Fluidica website with lab gallery"
   git push origin main
   ```

3. 打开仓库的 **Actions**，等待 **Deploy Fluidica to GitHub Pages** 工作流的 build 和 deploy 都变为绿色。
4. 部署成功后的默认公开网址是 **https://danielzhong.github.io/Fluidica/**。这个网址可以直接分享，访客无需 GitHub 账号。以 **Settings → Pages → Visit site** 显示的地址为准。

以后修改内容后再次提交、推送到 `main`，网站就会自动更新；也可以在 Actions 中手动运行该工作流。若刚启用 Pages 时没有运行记录，先推送代码，再在 Actions 中选择 **Run workflow**。

这是静态网站：GitHub Pages 负责展示页面和图片，咨询表仍通过访客自己的邮件应用准备草稿，网站不会自动代发邮件。

配置参考：[Astro 官方 GitHub Pages 指南](https://docs.astro.build/en/guides/deploy/github/)、[GitHub Pages 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)。

## 部署路径与本地验证

本地开发默认根路径 `/`。GitHub 工作流会设置 `SITE_URL=https://danielzhong.github.io` 和 `BASE_PATH=/Fluidica`。所有图片、导航、隐私页、404 返回链接都通过 `src/lib/paths.ts` 适配子路径；正式构建也会生成完整 canonical 和社交分享图片地址。

在本地验证 GitHub Pages 子路径（先安装 Playwright 浏览器）：

```bash
SITE_URL=https://danielzhong.github.io BASE_PATH=/Fluidica npm run build
SITE_URL=https://danielzhong.github.io BASE_PATH=/Fluidica npm test
```

验证结束后运行 `npm run build` 可重新生成根路径版本。部署到其他静态托管平台时同样发布 `dist/`，并将 `SITE_URL` 设为真实域名。将来绑定自定义域名时，按 GitHub 的域名配置流程操作，同时将工作流的 `SITE_URL` 改为该域名、`BASE_PATH` 改为 `/`，重新部署。

## 模板来源

基于 Themefisher 的 [Automark Astro](https://github.com/themefisher/automark-astro) 模板改造。沿用并调整了选定组件、页面布局方式与主题生成脚本，移除了与 Fluidica 无关的 CRM 和演示内容，加入微流控品牌文案、用户图片及定制交互。

原模板的 MIT 版权声明保留在 [`LICENSE-THEMEFISHER`](./LICENSE-THEMEFISHER) 中；分发相关代码时请保留该声明。
