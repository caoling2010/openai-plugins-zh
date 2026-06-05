const state = {
  plugins: [],
  query: "",
  category: "all",
};

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

function getFilteredPlugins() {
  const query = normalizeText(state.query);
  return state.plugins.filter((plugin) => {
    const matchesCategory =
      state.category === "all" || plugin.category === state.category;
    const matchesQuery = !query || plugin.searchText.includes(query);
    return matchesCategory && matchesQuery;
  });
}

function getCategories() {
  const map = new Map();
  for (const plugin of state.plugins) {
    if (!map.has(plugin.category)) {
      map.set(plugin.category, plugin.categoryZh || plugin.category);
    }
  }
  return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "zh-CN"));
}

function renderCategoryTabs() {
  const categories = [["all", "全部"], ...getCategories()];
  elements.categoryTabs.innerHTML = categories
    .map(([id, label]) => {
      const count =
        id === "all"
          ? state.plugins.length
          : state.plugins.filter((plugin) => plugin.category === id).length;
      return `<button class="category-tab" type="button" data-category="${id}" aria-pressed="${state.category === id}">${label} ${count}</button>`;
    })
    .join("");
}

function renderPlugin(plugin) {
  const initial = plugin.name.slice(0, 1).toUpperCase();
  const tags = [
    plugin.categoryZh,
    ...plugin.terms.slice(0, 3),
    ...plugin.keywords.slice(0, 2),
  ].filter(Boolean);
  const sourceUrl = plugin.sourcePath
    ? `https://github.com/openai/plugins/tree/main/${plugin.sourcePath
        .split("/")
        .slice(0, -2)
        .join("/")}`
    : plugin.repository;

  return `
    <article class="plugin-card">
      <div class="card-top">
        <div class="plugin-icon" style="background: ${safeColor(plugin.brandColor)}">${escapeHtml(initial)}</div>
        <div class="plugin-title">
          <h2>${escapeHtml(plugin.name)}</h2>
          <p class="developer">${escapeHtml(plugin.developer || "OpenAI plugin")}</p>
        </div>
      </div>
      <p class="description">${escapeHtml(plugin.description)}</p>
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
            ? `<a href="${escapeHtml(plugin.homepage)}" target="_blank" rel="noreferrer">官网</a>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderPlugins() {
  const filtered = getFilteredPlugins();
  elements.resultSummary.textContent = `显示 ${filtered.length} / ${state.plugins.length} 个插件`;
  elements.emptyState.hidden = filtered.length !== 0;
  elements.pluginGrid.innerHTML = filtered.map(renderPlugin).join("");
}

function render() {
  renderCategoryTabs();
  renderPlugins();
}

async function init() {
  const response = await fetch("data/plugins.json");
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
  renderPlugins();
});

elements.categoryTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  render();
});

init().catch((error) => {
  elements.resultSummary.textContent = error.message;
});
