import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { normalizeManifest } from "./plugin-data.mjs";
import {
  mergeManifestItems,
  resolveFirstSeenAt,
  toSupplementalManifestItems,
} from "./plugin-sources.mjs";
import {
  selectTranslationProvider,
  translateWithProvider,
} from "./translation-provider.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const translationsPath = resolve(rootDir, "data/translations.zh.json");
const historyPath = resolve(rootDir, "data/plugin-history.json");
const pluginsPath = resolve(rootDir, "data/plugins.json");
const supplementalPluginsPath = resolve(
  rootDir,
  "data/official-supplemental-plugins.json",
);
const githubTreeUrl =
  "https://api.github.com/repos/openai/plugins/git/trees/main?recursive=1";
const execFileAsync = promisify(execFile);
const fallbackVersion = 4;
const newPluginWindowDays = 7;
const dayMs = 24 * 60 * 60 * 1000;

function hashText(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function isWithinRecentWindow(value, now = new Date()) {
  const firstSeenAt = new Date(value).getTime();
  if (!Number.isFinite(firstSeenAt)) return false;
  return now.getTime() - firstSeenAt <= newPluginWindowDays * dayMs;
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function fetchJson(url) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "openai-plugins-zh-sync",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
}

async function listManifestItemsFromApi() {
  const tree = await fetchJson(githubTreeUrl);
  return tree.tree
    .filter((item) => item.type === "blob")
    .map((item) => item.path)
    .filter((path) => path.endsWith("/.codex-plugin/plugin.json"))
    .filter((path) => path.startsWith("plugins/"))
    .filter((path) => !path.includes("/fixtures/"))
    .map((path) => ({
      ...tree.tree.find((item) => item.path === path),
      name: path.split("/")[1],
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

async function fetchManifest(item) {
  if (item.manifest) {
    return item.manifest;
  }
  if (item.localPath) {
    return JSON.parse(await readFile(item.localPath, "utf8"));
  }
  const blob = await fetchJson(item.url);
  const raw = Buffer.from(blob.content, blob.encoding).toString("utf8");
  return JSON.parse(raw);
}

async function findManifestItemsFromClone() {
  const cloneDir = await mkdtemp(join(tmpdir(), "openai-plugins-"));
  try {
    await execFileAsync("git", [
      "clone",
      "--depth",
      "1",
      "--filter=blob:none",
      "--sparse",
      "https://github.com/openai/plugins.git",
      cloneDir,
    ]);
    await execFileAsync("git", ["sparse-checkout", "set", "plugins"], {
      cwd: cloneDir,
    });

    const pluginsDir = join(cloneDir, "plugins");
    const paths = [];
    async function walk(dir) {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (fullPath.endsWith("/.codex-plugin/plugin.json")) {
          const sourcePath = fullPath.slice(cloneDir.length + 1);
          if (!sourcePath.includes("/fixtures/")) {
            paths.push({
              name: sourcePath.split("/")[1],
              path: sourcePath,
              localPath: fullPath,
            });
          }
        }
      }
    }
    await walk(pluginsDir);
    return {
      items: paths.sort((a, b) => a.path.localeCompare(b.path)),
      cleanup: () => rm(cloneDir, { recursive: true, force: true }),
    };
  } catch (error) {
    await rm(cloneDir, { recursive: true, force: true });
    throw error;
  }
}

async function listManifestItems() {
  try {
    return {
      items: await listManifestItemsFromApi(),
      cleanup: async () => {},
    };
  } catch (error) {
    console.warn(
      `GitHub API unavailable (${error.message}); falling back to git clone.`,
    );
    return findManifestItemsFromClone();
  }
}

function fallbackTranslate(manifest) {
  const iface = manifest.interface ?? {};
  const name = iface.displayName ?? manifest.name;
  const category = iface.category ?? "Productivity";
  const englishDescription =
    iface.longDescription ?? iface.shortDescription ?? manifest.description ?? "";
  const keywords = (manifest.keywords ?? [])
    .slice(0, 5)
    .map((keyword) => String(keyword))
    .join("、");
  const lexicon = [
    [/account intelligence|buyer intelligence/i, "账户和买家情报"],
    [/prospecting|prospect/i, "潜客拓展"],
    [/earnings calls?/i, "财报电话会"],
    [/transcripts?/i, "文字记录"],
    [/financial events?|market commentary/i, "金融事件和市场评论"],
    [/product analytics|funnels?/i, "产品分析和转化漏斗"],
    [/tasks?|subtasks?|project details/i, "任务、子任务和项目详情"],
    [/jira|confluence/i, "Jira 和 Confluence 工作流"],
    [/crm|customer relationships?/i, "CRM 和客户关系管理"],
    [/full-stack apps?|frontend|backend/i, "全栈、前端或后端应用开发"],
    [/prototypes?|prototype from|product directions?/i, "产品原型和方案探索"],
    [/ux|user flows?|user friction|accessibility audit/i, "UX、用户流程和可访问性审查"],
    [/\bcli\b/i, "CLI 工作流"],
    [/sdk/i, "SDK 开发"],
    [/market data|quotes?|option chain|crypto/i, "市场数据、报价、期权链和 crypto 信息"],
    [/figures?|templates?|icons?/i, "科研图表、模板和图标"],
    [/documents?|files?|contracts?|reports?/i, "文档、文件、合同和报告"],
    [/brand mentions?|sentiment|media coverage/i, "品牌提及、情绪和媒体覆盖"],
    [/spend|reimbursement|travel|company finances/i, "企业支出、报销、差旅和财务分析"],
    [/swiftui|appkit|ios|macos/i, "SwiftUI、AppKit、iOS 和 macOS 开发"],
    [/charts?|dashboards?|maps?|webgl|three\.js|canvas|d3/i, "图表、仪表盘、地图和 WebGL/Three.js 可视化"],
    [/scheduling|meetings?|availability|attendee/i, "日程、会议和参会人跟进"],
    [/deal flow|investment memos?|private markets/i, "交易流、投资备忘录和私募市场研究"],
    [/portfolio|fund metrics|company updates/i, "投资组合、基金指标和公司动态"],
    [/\bci\b|testing|deployment/i, "CI、测试和部署"],
    [/cloudflare|workers|pages|storage|networking/i, "Cloudflare、Workers、Pages、存储和网络服务"],
    [/media library|images?|videos?|assets?/i, "媒体库、图片、视频和素材管理"],
    [/code review|diffs?|findings?/i, "代码审查、diff 和问题修复"],
    [/security scans?|threat|vulnerabilit/i, "安全扫描、威胁建模和漏洞验证"],
    [/mcp/i, "MCP (Model Context Protocol) 连接"],
    [/search|retrieve|query/i, "搜索、检索和查询"],
    [/summar/i, "总结和摘要"],
    [/create|update|manage|organize/i, "创建、更新、管理和整理"],
    [/analytics?|insights?|reports?/i, "分析、洞察和报表"],
    [/sales|pipeline|outreach|leads?/i, "销售线索、销售管道和外联"],
    [/marketing|campaign|attribution/i, "营销活动、归因和渠道分析"],
    [/database|schema|records?/i, "数据库、Schema 和记录管理"],
    [/notebooks?|sql|data workflows?/i, "notebook、SQL 和数据工作流"],
    [/calendar|email/i, "日历和 email 上下文"],
  ];
  const useCases = [
    ...new Set(
      lexicon
        .filter(([pattern]) => pattern.test(englishDescription))
        .map(([, label]) => label),
    ),
  ].slice(0, 5);
  const categoryUse = {
    Coding: "编码、代码审查和工程协作",
    Design: "设计、内容创作和视觉生产",
    Engineering: "工程开发、调试和本地验证",
    Productivity: "日常办公、知识整理和流程自动化",
    Security: "安全扫描、威胁建模和漏洞验证",
    Data: "数据分析、报表和业务洞察",
    Communication: "沟通协作、消息处理和团队上下文整理",
  };
  const useCase =
    useCases.length > 0
      ? useCases.join("、")
      : categoryUse[category] ?? "开发者工作流和任务自动化";
  const keywordText = keywords ? `，覆盖 ${keywords} 等关键词` : "";
  const separator = /^[a-z0-9]/i.test(useCase) ? " " : "";
  return `在 Codex 中使用 ${name}，帮助处理${separator}${useCase}${keywordText}。`;
}

async function buildPlugins() {
  const translations = await readJson(translationsPath, {});
  const history = await readJson(historyPath, {});
  const isBootstrapRun = Object.keys(history).length === 0;
  const now = new Date();
  const nowIso = now.toISOString();
  const bootstrapFirstSeenAt = new Date(
    now.getTime() - (newPluginWindowDays + 1) * dayMs,
  ).toISOString();
  const manifestSource = await listManifestItems();
  const supplementalData = await readJson(supplementalPluginsPath, {
    plugins: [],
  });
  const manifestPaths = mergeManifestItems(
    manifestSource.items,
    toSupplementalManifestItems(supplementalData),
  );
  const nextTranslations = {};
  const nextHistory = {};
  const plugins = [];

  try {
    for (const manifestItem of manifestPaths) {
      const sourcePath = manifestItem.path;
      const manifest = await fetchManifest(manifestItem);
      const iface = manifest.interface ?? {};
      const englishDescription =
        iface.longDescription ??
        iface.shortDescription ??
        manifest.description ??
        "";
      const sourceHash = hashText(englishDescription);
      const cached = translations[manifest.name];
      const firstSeenAt = resolveFirstSeenAt({
        recordedFirstSeenAt: history[manifest.name]?.firstSeenAt,
        officialReleasedAt: manifest.releasedAt,
        bootstrapFirstSeenAt,
        nowIso,
        isBootstrapRun,
        isSupplemental: manifestItem.isSupplemental,
        recentWindowMs: newPluginWindowDays * dayMs,
      });
      const isNew = !isBootstrapRun && isWithinRecentWindow(firstSeenAt, now);
      let zhDescription = cached?.zhDescription;
      let translationStatus = cached?.status ?? "cached";

      if (
        !zhDescription ||
        cached?.sourceHash !== sourceHash ||
        (cached?.status === "fallback" &&
          cached?.fallbackVersion !== fallbackVersion)
      ) {
        const translated = await translateWithProvider({
          manifest,
          englishDescription,
        });
        zhDescription = translated ?? fallbackTranslate(manifest);
        translationStatus =
          translated ? selectTranslationProvider()?.id : "fallback";
      }

      nextTranslations[manifest.name] = {
        sourceHash,
        zhDescription,
        status: translationStatus,
        fallbackVersion:
          translationStatus === "fallback" ? fallbackVersion : undefined,
        updatedAt: new Date().toISOString(),
      };
      nextHistory[manifest.name] = {
        firstSeenAt,
        lastSeenAt: nowIso,
      };
      plugins.push(
        normalizeManifest(manifest, {
          zhDescription,
          sourcePath,
          translationStatus,
          firstSeenAt,
          isNew,
        }),
      );
    }
  } finally {
    await manifestSource.cleanup();
  }

  plugins.sort((a, b) => a.name.localeCompare(b.name));

  return {
    meta: {
      source: "https://github.com/openai/plugins",
      supplementalSource: "Official Codex system plugin metadata snapshots",
      generatedAt: new Date().toISOString(),
      count: plugins.length,
      translationProvider: selectTranslationProvider()?.id ?? "fallback",
      translationModel: selectTranslationProvider()?.model ?? "fallback",
      newPluginWindowDays,
    },
    plugins,
    history: Object.fromEntries(
      Object.entries(nextHistory).sort(([a], [b]) => a.localeCompare(b)),
    ),
    translations: Object.fromEntries(
      Object.entries(nextTranslations).sort(([a], [b]) => a.localeCompare(b)),
    ),
  };
}

const result = await buildPlugins();
await writeJson(pluginsPath, {
  meta: result.meta,
  plugins: result.plugins,
});
await writeJson(translationsPath, result.translations);
await writeJson(historyPath, result.history);

console.log(`Synced ${result.meta.count} plugins to ${pluginsPath}`);
