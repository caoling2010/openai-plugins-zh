const siteUrl = "https://caoling2010.github.io/openai-plugins-zh/";
const repoUrl = "https://github.com/caoling2010/openai-plugins-zh";

const project = {
  name: "OpenAI Plugins 中文索引",
  siteUrl,
  repoUrl,
  pitch:
    "把 Codex 插件说明整理成中文，保留核心技术名词英文原文，支持关键词搜索、官方分类浏览和自动同步。",
  pain:
    "Codex 插件越来越多，但官方列表里的说明主要是英文，中文开发者判断插件用途时经常需要来回复制到翻译工具。",
};

const posts = [
  {
    platform: "V2EX",
    title: "做了一个 OpenAI Codex 插件中文索引，方便按中文说明搜索插件",
    body: `最近 Codex 插件越来越多，但官方列表里的说明主要是英文。实际找插件时，经常要点开一个个看，再复制说明去翻译，效率不太高。

我做了一个中文索引页：

${project.siteUrl}

它主要做几件事：

- 插件名称保留英文，说明翻译成中文
- MCP、CLI、Worktrees、Schema、SwiftUI 等技术词保留英文原文
- 支持关键词搜索和官方分类浏览
- 7 天内新增插件会显示 New
- 每天自动同步公开的 OpenAI 插件列表

项目是非官方的，数据来源是公开的 openai/plugins 仓库。希望能帮中文开发者更快判断每个插件适合什么任务。

如果你发现翻译不准确、分类不直观，欢迎提 issue。`,
  },
  {
    platform: "掘金 / SegmentFault / 开源中国",
    title: "给 Codex 插件做了一个中文索引：中文说明、关键词搜索、自动同步",
    body: `${project.pain}

这个项目尝试解决这个小痛点：

${project.siteUrl}

页面会展示插件英文名、中文说明、官方分类、关键词和来源链接。核心技术名词会保留英文，例如 MCP (Model Context Protocol)、CLI、Worktrees、Schema、SwiftUI，方便继续搜索官方资料。

目前功能：

- 关键词搜索
- 按官方分类浏览
- 7 天内新增插件 New 标记
- 自动同步公开 OpenAI 插件列表
- 每张卡片保留来源链接

项目仓库：

${project.repoUrl}

这是非官方中文索引，中文说明仅用于检索和学习参考，权威信息仍以原始仓库和官方页面为准。`,
  },
  {
    platform: "GitHub Release",
    title: "Initial release: OpenAI Plugins 中文索引",
    body: `发布 ${project.name} 第一版。

在线访问：

${project.siteUrl}

主要功能：

- 插件英文名 + 中文说明
- 关键词搜索
- 官方分类浏览
- 7 天内新增插件 New 标记
- 自动同步公开的 OpenAI 插件列表
- 来源与版权说明

这个项目是非官方中文索引，面向希望快速了解 Codex 插件能力的中文开发者。`,
  },
];

for (const post of posts) {
  console.log(`\n## ${post.platform}\n`);
  console.log(`标题：${post.title}\n`);
  console.log(post.body);
  console.log("\n---");
}
