import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

function isPluginShareUrl(value) {
  return /^https:\/\/chatgpt\.com\/plugins\/share\/[^/]+$/i.test(value ?? "");
}

function isOfficialInfoUrl(value) {
  return /^https:\/\/openai\.com\//i.test(value ?? "");
}

function expectedNewState(plugin, meta) {
  const releasedAt = new Date(plugin.firstSeenAt).getTime();
  const generatedAt = new Date(meta.generatedAt).getTime();
  const windowMs = Number(meta.newPluginWindowDays) * 24 * 60 * 60 * 1000;
  if (![releasedAt, generatedAt, windowMs].every(Number.isFinite)) return null;
  const age = generatedAt - releasedAt;
  return age >= 0 && age <= windowMs;
}

export function validatePluginData({
  generated,
  supplemental,
  assetExists = (path) => existsSync(resolve(rootDir, path)),
}) {
  const errors = [];
  const plugins = generated?.plugins ?? [];
  const meta = generated?.meta ?? {};
  const rolePluginIds = supplemental?.rolePluginIds ?? [];
  const rolePluginAnnouncement = supplemental?.rolePluginAnnouncement ?? "";
  const supplementalById = new Map(
    (supplemental?.plugins ?? []).map((plugin) => [plugin.name, plugin]),
  );
  const generatedById = new Map();

  if (meta.count !== plugins.length) {
    errors.push(
      `meta.count 为 ${meta.count}，但实际生成了 ${plugins.length} 个插件。`,
    );
  }

  for (const plugin of plugins) {
    if (generatedById.has(plugin.id)) {
      errors.push(`生成数据中存在重复插件 id：${plugin.id}。`);
    }
    generatedById.set(plugin.id, plugin);
    if (!plugin.name || !plugin.category || !plugin.description) {
      errors.push(`插件 ${plugin.id || "(unknown)"} 缺少名称、分类或中文说明。`);
    }
    if (/^\s*[{[]/.test(plugin.description ?? "")) {
      errors.push(
        `插件 ${plugin.id || "(unknown)"} 的中文说明包含未解析的结构化模型输出。`,
      );
    }
  }

  for (const id of rolePluginIds) {
    const manifest = supplementalById.get(id);
    const plugin = generatedById.get(id);
    if (!manifest) {
      errors.push(`官方角色插件 ${id} 不在补充数据源中。`);
      continue;
    }
    if (!plugin) {
      errors.push(`官方角色插件 ${id} 未进入最终生成数据。`);
      continue;
    }

    const logo = manifest.interface?.logo ?? "";
    if (!logo || !assetExists(logo)) {
      errors.push(`官方角色插件 ${id} 的 logo 文件缺失：${logo || "(empty)"}。`);
    }
    if (!isPluginShareUrl(manifest.homepage)) {
      errors.push(`官方角色插件 ${id} 缺少有效的安装插件链接。`);
    }
    if (!isOfficialInfoUrl(manifest.interface?.officialInfoURL)) {
      errors.push(`官方角色插件 ${id} 缺少有效的官方介绍链接。`);
    }
    if (manifest.interface?.officialInfoURL !== rolePluginAnnouncement) {
      errors.push(`官方角色插件 ${id} 的官方介绍链接与公告来源不一致。`);
    }
    if (!Number.isFinite(new Date(manifest.releasedAt).getTime())) {
      errors.push(`官方角色插件 ${id} 缺少有效的发布日期。`);
    }
    if (manifest.interface?.category !== "Featured") {
      errors.push(`官方角色插件 ${id} 必须归入 Featured 分类。`);
    }
    if (plugin.logo !== logo) {
      errors.push(`官方角色插件 ${id} 的生成 logo 与补充数据不一致。`);
    }
    if (!isPluginShareUrl(plugin.homepage)) {
      errors.push(`官方角色插件 ${id} 的生成数据缺少安装插件链接。`);
    }
    if (!isOfficialInfoUrl(plugin.officialInfo)) {
      errors.push(`官方角色插件 ${id} 的生成数据缺少官方介绍链接。`);
    }

    const shouldBeNew = expectedNewState(plugin, meta);
    if (shouldBeNew !== null && plugin.isNew !== shouldBeNew) {
      errors.push(
        `官方角色插件 ${id} 的 New 状态错误：应为 ${shouldBeNew}，实际为 ${plugin.isNew}。`,
      );
    }
  }

  return errors;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errors = validatePluginData({
    generated: readJson(resolve(rootDir, "data/plugins.json")),
    supplemental: readJson(
      resolve(rootDir, "data/official-supplemental-plugins.json"),
    ),
  });

  if (errors.length > 0) {
    console.error("插件数据审计失败：");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log("插件数据审计通过。");
  }
}
