# Brand Compass 品牌罗盘

一个「超级个人品牌人格原型测试 + AI 品牌策划工作台」网站产品。

本项目把《品牌罗盘人格原型》问卷整理成可交互测试，参考《原型报告》样稿结构生成原型报告，并融合《品牌策划专用AI提示词包》，把原型报告继续转化为 slogan、定位、竞品、视觉、活动、传播、危机和长期规划等品牌策划方案。

## 当前版本包含

- 48 题品牌情境问卷
- 12 个品牌人格原型：统治者、创造者、智者、纯真者、照顾者、探索者、英雄、魔术师、颠覆者、情人、开心果、平凡人
- 4 个驱动力象限：建立规则、追求探索、留下传奇、追求喜悦
- 自动评分：输出主原型 + 次原型 + 象限倾向
- 动态生成原型报告：概要、写在前面、原型精髓、品牌启示、创始人 DNA、优势与软肋、品牌罗盘、行动建议
- AI 策划工作台：把原型报告与品牌信息带入 DeepSeek，生成可执行品牌方案
- 提示词库：10 大模块、50 个品牌策划高频提示词，可搜索、复制、带入工作台
- 资料库：两个 PDF 与一个 DOCX 的结构化 JSON 数据源
- 支持打印 / 保存 PDF、复制 Markdown、下载 Markdown
- GitHub Actions 自动部署到 GitHub Pages

## GitHub Pages

本仓库已加入 Pages 部署工作流：

```text
.github/workflows/pages.yml
```

每次 push 到 `main` 后会自动部署。GitHub Pages 地址通常为：

```text
https://yt-feng.github.io/brand_compass/
```

在 GitHub 仓库中确认：Settings → Pages → Build and deployment → Source 选择 `GitHub Actions`。

## DeepSeek API Key

工作流会读取仓库 Secret：

```text
DEEPSEEK_API_KEY
```

并在部署时写入：

```text
src/runtime-config.js
```

注意：当前是静态 GitHub Pages。如果把 API Key 注入前端 JS，任何访问网页的人都可能在浏览器里看到 Key。公开产品建议改为 Cloudflare Worker、Vercel Function 或自有后端代理，再由后端调用 DeepSeek。

## 本地预览

```bash
python3 -m http.server 8080
```

然后访问：

```text
http://localhost:8080
```

## 数据来源说明

- `src/data.js` 中的题目来自上传的《品牌罗盘人格原型.pdf》可见页面。
- 由于该 PDF 为截图型文件，部分早期题号在当前上传文件中不可见，项目中已补齐为「引导题」，并在数据里标注 `source: "supplement"`。
- 报告结构参考上传的《原型报告_探索者 + 平凡人.pdf》，内容已改写为可复用的动态报告模板。
- `src/promptPack.js` 与 `data/source_docs/品牌策划专用AI提示词包.json` 来自上传的《品牌策划专用AI提示词包.docx》。

## 文件结构

```text
.
├── .github/workflows/pages.yml
├── index.html
├── README.md
├── data
│   ├── source_docs
│   │   └── 品牌策划专用AI提示词包.json
│   └── source_pdfs
│       ├── 品牌罗盘人格原型.json
│       └── 原型报告_探索者_平凡人.json
├── src
│   ├── app.js
│   ├── data.js
│   ├── promptPack.js
│   ├── runtime-config.js
│   └── styles.css
└── examples
    └── 原型报告_探索者_平凡人.md
```

## 后续可继续增强

- 改为后端代理调用 DeepSeek，避免前端暴露 Key
- 增加用户账号、历史报告和项目管理
- 将报告导出为排版更精细的 PDF
- 为 132 种「主原型 + 次原型」组合补充更细的专属报告文案
- 增加品牌视觉风格建议：色彩、字体、摄影、版式、语气词库
