const state = {
  plugins: [],
  query: "",
  activeCategory: "all",
};

const CATEGORY_ORDER = [
  "recently-added",
  "Featured",
  "Design",
  "Developer Tools",
  "Productivity",
  "Research",
  "Lifestyle",
  "Finance",
  "Financial Markets",
  "Sales",
  "Business",
  "Creative Production",
  "Coding",
  "Corporate Finance",
  "Data",
  "Data Analytics",
  "Engineering",
  "Security",
  "Strategy & Consulting",
  "User Ops",
];

function getCategorySortIndex(category) {
  if (category === "recently-added") return -1;
  const index = CATEGORY_ORDER.indexOf(category);
  return index === -1 ? Infinity : index;
}

const elements = {
  totalCount: document.querySelector("#totalCount"),
  updatedAt: document.querySelector("#updatedAt"),
  searchInput: document.querySelector("#searchInput"),
  resultSummary: document.querySelector("#resultSummary"),
  categoryTabs: document.querySelector("#categoryTabs"),
  pluginGrid: document.querySelector("#pluginGrid"),
  emptyState: document.querySelector("#emptyState"),
};

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKC")
    .trim();
}

function buildPluginSearchText(plugin) {
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

function formatDate(value) {
  if (!value) return "更新时间未知";
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeColor(value) {
  return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value ?? "")
    ? value
    : "#334155";
}

function getLogoUrls(plugin) {
  if (!plugin.logo) return [];
  if (/^https?:\/\//i.test(plugin.logo)) return [plugin.logo];
  if (!plugin.sourcePath) return [plugin.logo.replace(/^\.?\//, "")];
  const pluginRoot = plugin.sourcePath.split("/").slice(0, -2).join("/");
  const manifestDir = plugin.sourcePath.split("/").slice(0, -1).join("/");
  const logoPath = plugin.logo.replace(/^\.?\//, "");
  return [
    `https://raw.githubusercontent.com/openai/plugins/main/${pluginRoot}/${logoPath}`,
    `https://raw.githubusercontent.com/openai/plugins/main/${manifestDir}/${logoPath}`,
  ];
}

function getFilteredPlugins() {
  const query = normalizeText(state.query);
  return state.plugins
    .filter((plugin) => {
      return !query || buildPluginSearchText(plugin).includes(query);
    })
    .sort((a, b) => {
      const categoryOrder =
        getCategorySortIndex(a.category) - getCategorySortIndex(b.category);
      if (categoryOrder !== 0) return categoryOrder;
      return a.name.localeCompare(b.name);
    });
}

function getCategories(plugins = state.plugins) {
  const map = new Map();
  for (const plugin of plugins) {
    if (!map.has(plugin.category)) {
      map.set(plugin.category, plugin.categoryZh || plugin.category);
    }
  }
  return [...map.entries()].sort((a, b) => {
    const orderA = getCategorySortIndex(a[0]);
    const orderB = getCategorySortIndex(b[0]);
    if (orderA !== orderB) return orderA - orderB;
    return a[0].localeCompare(b[0]);
  });
}

function formatCategoryLabel(category, categoryZh) {
  if (category === "recently-added") return "Recently Added / 最近新增";
  if (!categoryZh || categoryZh === category) return category;
  return `${category} / ${categoryZh}`;
}

function getCategoryId(category) {
  return `category-${encodeURIComponent(category).replaceAll("%", "-")}`;
}

function renderCategoryTabs() {
  const filtered = getFilteredPlugins();
  const categories = [["all", "全部"], ...getCategories(filtered)];
  const newCount = filtered.filter((plugin) => plugin.isNew).length;
  if (newCount > 0) {
    categories.splice(1, 0, ["recently-added", "Recently Added / 最近新增"]);
  }
  elements.categoryTabs.innerHTML = categories
    .map(([id, label]) => {
      const count =
        id === "all"
          ? filtered.length
          : id === "recently-added"
            ? newCount
          : filtered.filter((plugin) => plugin.category === id).length;
      const displayLabel =
        id === "all" || id === "recently-added"
          ? label
          : formatCategoryLabel(id, label);
      return `<button class="category-tab" type="button" data-category="${escapeHtml(id)}" aria-pressed="${state.activeCategory === id}"><span>${escapeHtml(displayLabel)}</span><strong>${count}</strong></button>`;
    })
    .join("");
}

function renderPlugin(plugin) {
  const initial = plugin.name.slice(0, 1).toUpperCase();
  const logoUrls = getLogoUrls(plugin);
  const tags = [
    formatCategoryLabel(plugin.category, plugin.categoryZh),
    ...plugin.terms.slice(0, 3),
    ...plugin.keywords.slice(0, 2),
  ].filter(Boolean);
  const sourceUrl = plugin.sourcePath
    ? `https://github.com/openai/plugins/tree/main/${plugin.sourcePath
        .split("/")
        .slice(0, -2)
        .join("/")}`
    : plugin.repository;
  const isPluginShareLink = /^https:\/\/chatgpt\.com\/plugins\/share\//i.test(
    plugin.homepage ?? "",
  );

  return `
    <article class="plugin-card">
      <div class="card-top">
        <div class="plugin-icon" style="background: ${safeColor(plugin.brandColor)}">
          ${
            logoUrls.length > 0
              ? `<img src="${escapeHtml(logoUrls[0])}" data-logo-fallback="${escapeHtml(logoUrls[1] ?? "")}" alt="" loading="lazy" />`
              : ""
          }
          <span ${logoUrls.length > 0 ? "hidden" : ""}>${escapeHtml(initial)}</span>
        </div>
        <div class="plugin-title">
          <h2>${escapeHtml(plugin.name)}${plugin.isNew ? '<span class="new-badge">New</span>' : ""}</h2>
          <p class="developer">${escapeHtml(plugin.developer || "OpenAI plugin")}</p>
        </div>
      </div>
      <div class="description-block">
        <p class="description">${escapeHtml(plugin.description)}</p>
        <button class="description-toggle" type="button" hidden>展开</button>
      </div>
      <div class="tags">
        ${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <div class="card-actions">
        ${
          sourceUrl
            ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">查看来源</a>`
            : ""
        }
        ${
          plugin.homepage
            ? `<a href="${escapeHtml(plugin.homepage)}" target="_blank" rel="noreferrer">${isPluginShareLink ? "安装插件" : "官网"}</a>`
            : ""
        }
        ${
          plugin.officialInfo
            ? `<a href="${escapeHtml(plugin.officialInfo)}" target="_blank" rel="noreferrer">官方介绍</a>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderCategorySection([category, plugins]) {
  const categoryZh =
    category === "recently-added" ? "最近新增" : plugins[0]?.categoryZh ?? category;
  return `
    <section class="category-section" id="${escapeHtml(getCategoryId(category))}" data-category-section="${escapeHtml(category)}">
      <header class="category-heading">
        <h2>${escapeHtml(formatCategoryLabel(category, categoryZh))}</h2>
        <span>${plugins.length} 个插件</span>
      </header>
      <div class="category-card-grid">
        ${plugins.map(renderPlugin).join("")}
      </div>
    </section>
  `;
}

function groupPluginsByCategory(plugins) {
  const groups = new Map();
  const newPlugins = plugins.filter((plugin) => plugin.isNew);
  if (newPlugins.length > 0) {
    groups.set("recently-added", newPlugins);
  }
  for (const plugin of plugins) {
    if (!groups.has(plugin.category)) {
      groups.set(plugin.category, []);
    }
    groups.get(plugin.category).push(plugin);
  }
  return [...groups.entries()];
}

function renderPlugins() {
  const filtered = getFilteredPlugins();
  elements.resultSummary.textContent = `显示 ${filtered.length} / ${state.plugins.length} 个插件`;
  elements.emptyState.hidden = filtered.length !== 0;
  elements.pluginGrid.innerHTML = groupPluginsByCategory(filtered)
    .map(renderCategorySection)
    .join("");
  requestAnimationFrame(updateDescriptionToggles);
}

function render() {
  renderCategoryTabs();
  renderPlugins();
}

async function init() {
  const response = await fetch("data/plugins.json", { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`无法加载插件数据：${response.status}`);
  }
  const data = await response.json();
  state.plugins = data.plugins ?? [];
  elements.totalCount.textContent = data.meta?.count ?? state.plugins.length;
  elements.updatedAt.textContent = `更新于 ${formatDate(data.meta?.generatedAt)}`;
  render();
}

elements.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  state.activeCategory = "all";
  render();
});

elements.categoryTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.activeCategory = button.dataset.category;
  renderCategoryTabs();
  const target =
    state.activeCategory === "all"
      ? elements.pluginGrid
      : document.querySelector(
          `#${CSS.escape(getCategoryId(state.activeCategory))}`,
        );
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
});

elements.pluginGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".description-toggle");
  if (!button) return;
  const block = button.closest(".description-block");
  const isExpanded = block.classList.toggle("is-expanded");
  button.textContent = isExpanded ? "收起" : "展开";
});

elements.pluginGrid.addEventListener(
  "error",
  (event) => {
    if (!event.target.matches(".plugin-icon img")) return;
    const image = event.target;
    const fallbackUrl = image.dataset.logoFallback;
    if (fallbackUrl && image.src !== fallbackUrl) {
      image.src = fallbackUrl;
      image.dataset.logoFallback = "";
      return;
    }
    image.hidden = true;
    image.nextElementSibling.hidden = false;
  },
  true,
);

function updateDescriptionToggles() {
  for (const block of elements.pluginGrid.querySelectorAll(".description-block")) {
    const description = block.querySelector(".description");
    const button = block.querySelector(".description-toggle");
    block.classList.remove("is-expanded");
    block.classList.remove("has-overflow");
    button.textContent = "展开";
    const hasOverflow = description.scrollHeight > description.clientHeight + 1;
    block.classList.toggle("has-overflow", hasOverflow);
    button.hidden = !hasOverflow;
  }
}

init().catch((error) => {
  elements.resultSummary.textContent = error.message;
});
