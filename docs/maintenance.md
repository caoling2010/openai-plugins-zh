# 插件更新与发布检查

## 本次问题复盘

2026 年 6 月 2 日发布的六个角色型插件没有全部进入页面，后续补充时又陆续出现 Logo 缺失、截图 Logo 带黑边、安装链接被标成“官网”、发布日期未参与 `New` 判断等问题。

根因不是单一的页面错误，而是更新流程只覆盖了公开的 `openai/plugins` 仓库。部分 Codex 官方系统插件和角色型插件没有公开 manifest，需要从 OpenAI 官方公告补充展示元数据。此前也缺少发布前的数据完整性校验和页面检查清单。

## 数据来源

1. **公开插件**：每天从 [`openai/plugins`](https://github.com/openai/plugins) 自动同步。
2. **非公开官方插件**：维护在 `data/official-supplemental-plugins.json`。
3. **角色型插件清单**：由该文件的 `rolePluginIds` 明确列出，并记录统一的官方公告来源。

公开仓库中的同名 manifest 始终优先于补充快照。如果某个补充插件以后进入公开仓库，不需要删除快照也不会产生重复卡片。

## 自动发布门禁

GitHub Actions 按以下顺序运行：

1. 同步公开 manifest，并合并补充快照。
2. 运行全部单元测试。
3. 运行 `npm run validate:data` 数据审计。
4. 仅在全部通过后提交生成文件。

数据审计会检查：

- 生成数量与 `meta.count` 一致，且不存在重复 id。
- 六个官方角色插件全部存在。
- 角色插件具有英文名称、中文说明、`Featured` 分类、Logo、发布日期。
- “安装插件”必须指向 `chatgpt.com/plugins/share/...`。
- “官方介绍”必须指向登记的 OpenAI 官方公告。
- 本地 Logo 文件真实存在。
- `New` 状态与发布日期及 7 天窗口一致。
- 插件总数不会无提示地下降超过 10%。

如果确认上游确实批量删除插件，可在人工复核后使用：

```bash
ALLOW_PLUGIN_COUNT_DROP=1 npm run sync:plugins
```

## 新增非公开官方插件

1. 从 OpenAI 官方公告确认英文名称、功能、发布日期和安装分享链接。
2. 将插件加入 `data/official-supplemental-plugins.json`。
3. 角色型插件同时加入 `rolePluginIds`。
4. 优先使用官方原始 Logo；不得使用带界面边框的截图裁切。
5. 安装链接写入 `homepage`，官方说明写入 `interface.officialInfoURL`。
6. 执行完整检查：

```bash
npm run sync:plugins
npm test
npm run validate:data
npm run serve
```

7. 在浏览器中确认搜索、分类、Logo、中文说明、链接文案及 `New` 标签。

由于 OpenAI 暂未提供覆盖所有非公开 Codex 插件的稳定公共 API，这部分不能可靠地完全自动发现。看到新的官方插件公告时，需要先更新补充清单；自动门禁负责阻止不完整数据被直接发布。
