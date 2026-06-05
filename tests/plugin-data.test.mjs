import test from "node:test";
import assert from "node:assert/strict";

import {
  filterPlugins,
  getCategoryLabel,
  normalizeManifest,
} from "../scripts/plugin-data.mjs";

const browserManifest = {
  name: "browser",
  version: "1.0.0",
  description: "Browser / browser-use plugin",
  homepage: "https://openai.com/",
  repository: "https://github.com/openai/plugins",
  keywords: ["browser", "automation", "localhost"],
  interface: {
    displayName: "Browser",
    shortDescription: "Control the in-app browser with Codex",
    longDescription:
      "Browser lets Codex open and control the in-app browser, mainly for local development pages and files.",
    developerName: "OpenAI",
    category: "Engineering",
    capabilities: ["Interactive", "Read", "Write"],
    defaultPrompt: ["Test my checkout flow on localhost"],
    brandColor: "#013B7B",
  },
};

test("normalizes plugin manifest into Chinese directory record", () => {
  const plugin = normalizeManifest(browserManifest, {
    zhDescription:
      "让 Codex 控制内置浏览器，适合测试 localhost 页面、点击、输入和截图。",
    sourcePath: "plugins/browser/.codex-plugin/plugin.json",
  });

  assert.equal(plugin.id, "browser");
  assert.equal(plugin.name, "Browser");
  assert.equal(plugin.category, "Engineering");
  assert.equal(plugin.categoryZh, "工程开发");
  assert.deepEqual(plugin.capabilities, ["Interactive", "Read", "Write"]);
  assert.match(plugin.searchText, /localhost/);
  assert.match(plugin.searchText, /内置浏览器/);
});

test("maps unknown category to original category", () => {
  assert.equal(getCategoryLabel("Experimental"), "Experimental");
});

test("filters plugins by category and Chinese or English keywords", () => {
  const plugins = [
    normalizeManifest(browserManifest, {
      zhDescription: "让 Codex 控制内置浏览器，适合测试 localhost 页面。",
    }),
    normalizeManifest(
      {
        name: "documents",
        keywords: ["docx", "word"],
        interface: {
          displayName: "Documents",
          longDescription: "Create and edit DOCX document artifacts.",
          category: "Productivity",
          capabilities: ["Write"],
        },
      },
      {
        zhDescription: "创建、编辑和导出 DOCX 文档。",
      },
    ),
  ];

  assert.deepEqual(
    filterPlugins(plugins, { query: "内置浏览器", category: "all" }).map(
      (plugin) => plugin.id,
    ),
    ["browser"],
  );
  assert.deepEqual(
    filterPlugins(plugins, { query: "docx", category: "Productivity" }).map(
      (plugin) => plugin.id,
    ),
    ["documents"],
  );
  assert.deepEqual(
    filterPlugins(plugins, { query: "", category: "Engineering" }).map(
      (plugin) => plugin.id,
    ),
    ["browser"],
  );
});
