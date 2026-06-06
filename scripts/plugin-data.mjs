export const CATEGORY_LABELS_ZH = {
  Featured: "精选",
  Coding: "编码开发",
  Design: "设计创作",
  Engineering: "工程开发",
  Productivity: "效率工具",
  Security: "安全",
  "Developer Tools": "开发者工具",
  Data: "数据分析",
  Communication: "沟通协作",
  Business: "商务",
  "Corporate Finance": "企业财务",
  "Creative Production": "创意生产",
  "Data Analytics": "数据分析",
  Finance: "金融",
  "Financial Markets": "金融市场",
  Lifestyle: "生活方式",
  Research: "研究",
  Sales: "销售",
  "Strategy & Consulting": "战略咨询",
  "User Ops": "用户运营",
};

export const PROTECTED_TERMS = [
  "MCP",
  "Model Context Protocol",
  "CLI",
  "Worktrees",
  "Schema",
  "SwiftUI",
  "AppKit",
  "React",
  "React Native",
  "Expo",
  "EAS",
  "GSAP",
  "HTML",
  "CSS",
  "JavaScript",
  "TypeScript",
  "Python",
  "Node.js",
  "GitHub Actions",
  "GitHub",
  "Figma",
  "Canva",
  "Google Docs",
  "Google Sheets",
  "Google Slides",
  "PowerPoint",
  "PPTX",
  "DOCX",
  "XLSX",
  "CSV",
  "TSV",
  "localhost",
  "Codex",
  "OpenAI",
];

export function getCategoryLabel(category) {
  return CATEGORY_LABELS_ZH[category] ?? category ?? "未分类";
}

export function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKC")
    .trim();
}

export function extractTerms(...values) {
  const haystack = values.filter(Boolean).join(" ");
  return PROTECTED_TERMS.filter((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(
      haystack,
    );
  });
}

export function buildPluginSearchText(plugin) {
  return normalizeText(
    [
      plugin.id,
      plugin.name,
      plugin.category,
      plugin.categoryZh,
      plugin.description,
      (plugin.keywords ?? []).join(" "),
      (plugin.terms ?? []).join(" "),
      plugin.isNew ? "new recently added 最近新增" : "",
    ].join(" "),
  );
}

export function normalizeManifest(manifest, options = {}) {
  const iface = manifest.interface ?? {};
  const id = manifest.name;
  const name = iface.displayName ?? manifest.name;
  const englishDescription =
    iface.longDescription ?? iface.shortDescription ?? manifest.description ?? "";
  const shortDescription = iface.shortDescription ?? manifest.description ?? "";
  const category = iface.category ?? "Uncategorized";
  const keywords = Array.isArray(manifest.keywords) ? manifest.keywords : [];
  const zhDescription = options.zhDescription ?? englishDescription;
  const terms = extractTerms(
    name,
    englishDescription,
    shortDescription,
    keywords.join(" "),
    zhDescription,
  );

  return {
    id,
    name,
    version: manifest.version ?? "",
    category,
    categoryZh: getCategoryLabel(category),
    developer: iface.developerName ?? manifest.author?.name ?? "",
    description: zhDescription,
    keywords,
    terms,
    homepage: iface.websiteURL ?? manifest.homepage ?? "",
    repository: manifest.repository ?? "",
    brandColor: iface.brandColor ?? "#111827",
    logo: iface.logo ?? "",
    sourcePath: options.sourcePath ?? "",
    translationStatus: options.translationStatus ?? "ready",
    firstSeenAt: options.firstSeenAt ?? "",
    isNew: Boolean(options.isNew),
  };
}

export function filterPlugins(plugins, { query = "", category = "all" } = {}) {
  const normalizedQuery = normalizeText(query);
  return plugins.filter((plugin) => {
    const matchesCategory = category === "all" || plugin.category === category;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      buildPluginSearchText(plugin).includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });
}
