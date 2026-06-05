# OpenAI Plugins 中文索引

在线访问：[https://caoling2010.github.io/openai-plugins-zh/](https://caoling2010.github.io/openai-plugins-zh/)

Codex 插件越来越多，但官方列表里的说明主要是英文。对英文阅读不熟练的开发者来说，判断一个插件能做什么、适不适合当前任务，常常需要在页面和翻译工具之间来回复制。

这个项目把 Codex 插件说明整理成中文，同时保留 MCP (Model Context Protocol)、CLI、Worktrees、Schema、SwiftUI 等核心技术名词的英文原文，方便继续搜索官方资料。

## 页面功能

- 插件名称保留英文，说明翻译成中文
- 支持关键词搜索和官方分类浏览
- 7 天内新增的插件会显示 `New` 标记
- 每个插件保留来源链接，便于查看原始 manifest
- 每天自动同步公开的 OpenAI 插件列表

## 适合谁

- 想快速了解 Codex 插件能力的中文开发者
- 不想逐条复制英文说明到翻译工具里的用户
- 需要按任务场景查找插件的人，比如设计、开发、数据分析、研究、效率工具等

## 维护说明

插件数据来自公开的 [`openai/plugins`](https://github.com/openai/plugins) 仓库，并通过 GitHub Actions 自动同步。

如果仓库配置了 `DEEPSEEK_API_KEY`，新增或变更的插件说明会自动生成中文翻译；没有 API key 时，也会生成基础中文概述。

本地预览：

```bash
npm run serve
```

## 来源与版权

本项目是非官方中文索引，不代表 OpenAI 或任何插件提供方。

插件名称、Logo、商标和品牌素材归各自权利人所有。中文介绍为原始说明的翻译或概述，仅用于检索和学习参考；权威信息以原始仓库和各插件官方页面为准。

本仓库自写代码采用 MIT License；第三方插件元数据、Logo、商标和品牌素材不包含在本项目代码许可范围内。
