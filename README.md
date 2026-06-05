# OpenAI Plugins 中文索引

这是一个面向中文开发者的 Codex 插件索引页。插件名称保留英文，介绍翻译成中文；MCP (Model Context Protocol)、CLI、Worktrees、Schema、SwiftUI 等核心技术名词保持英文，方便继续搜索官方资料。

## 功能

- 从公开的 `openai/plugins` 仓库同步插件 manifest
- 展示插件英文名、中文介绍、分类、关键词和来源链接
- 支持关键词搜索和分类筛选
- GitHub Actions 每天自动同步并直接提交生成数据
- 配置 `DEEPSEEK_API_KEY` 后，新增或变更插件会自动生成更自然的中文翻译

## 本地运行

```bash
npm test
npm run sync:plugins
npm run serve
```

然后打开 `http://localhost:4173`。

## GitHub Pages 部署

1. 打开仓库的 Settings。
2. 进入 Pages。
3. Source 选择 `Deploy from a branch`。
4. Branch 选择 `main`，目录选择 `/root`。
5. 保存后，GitHub Pages 会发布 `index.html`。

## 自动更新

`.github/workflows/sync-plugins.yml` 会在每天 UTC 02:20 运行，也可以在 Actions 页面手动触发。

工作流会：

1. 读取 `openai/plugins` 最新插件 manifest。
2. 生成 `data/plugins.json`。
3. 更新 `data/translations.zh.json`。
4. 如果有变化，直接提交到当前分支。

建议在仓库 Secrets 中添加：

- `DEEPSEEK_API_KEY`：用于自动翻译新增或变更的插件介绍。

可选在仓库 Variables 中添加：

- `DEEPSEEK_TRANSLATION_MODEL`：默认是 `deepseek-chat`。

如果同时配置了 `DEEPSEEK_API_KEY` 和 `OPENAI_API_KEY`，脚本会优先使用 DeepSeek。没有任何 API key 时，同步脚本仍会生成中文概述，但不会调用模型做精细翻译。

如需改用 OpenAI，可添加：

- `OPENAI_API_KEY`
- `OPENAI_TRANSLATION_MODEL`：默认是 `gpt-5-mini`
