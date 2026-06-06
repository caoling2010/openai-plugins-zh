import test from "node:test";
import assert from "node:assert/strict";

import { validatePluginData } from "../scripts/validate-plugin-data.mjs";

const announcementUrl =
  "https://openai.com/index/codex-for-every-role-tool-workflow/";

function makeRoleManifest(id = "product-design") {
  return {
    name: id,
    releasedAt: "2026-06-02T00:00:00.000Z",
    homepage: "https://chatgpt.com/plugins/share/example",
    interface: {
      displayName: "Product Design",
      category: "Featured",
      logo: "assets/logos/product-design.png",
      officialInfoURL: announcementUrl,
    },
  };
}

function makeGeneratedPlugin(id = "product-design") {
  return {
    id,
    name: "Product Design",
    category: "Featured",
    categoryZh: "精选",
    description: "把产品想法转化为可评审的原型。",
    homepage: "https://chatgpt.com/plugins/share/example",
    officialInfo: announcementUrl,
    logo: "assets/logos/product-design.png",
    firstSeenAt: "2026-06-02T00:00:00.000Z",
    isNew: true,
  };
}

test("accepts a complete role plugin snapshot", () => {
  const errors = validatePluginData({
    generated: {
      meta: {
        count: 1,
        generatedAt: "2026-06-06T00:00:00.000Z",
        newPluginWindowDays: 7,
      },
      plugins: [makeGeneratedPlugin()],
    },
    supplemental: {
      rolePluginAnnouncement: announcementUrl,
      rolePluginIds: ["product-design"],
      plugins: [makeRoleManifest()],
    },
    assetExists: () => true,
  });

  assert.deepEqual(errors, []);
});

test("rejects missing role plugins, logos, links, and incorrect New state", () => {
  const generatedPlugin = makeGeneratedPlugin();
  generatedPlugin.logo = "";
  generatedPlugin.officialInfo = "";
  generatedPlugin.isNew = false;

  const errors = validatePluginData({
    generated: {
      meta: {
        count: 1,
        generatedAt: "2026-06-06T00:00:00.000Z",
        newPluginWindowDays: 7,
      },
      plugins: [generatedPlugin],
    },
    supplemental: {
      rolePluginAnnouncement: announcementUrl,
      rolePluginIds: ["product-design", "sales"],
      plugins: [makeRoleManifest()],
    },
    assetExists: () => false,
  });

  assert.ok(errors.some((error) => error.includes("sales")));
  assert.ok(errors.some((error) => error.includes("logo")));
  assert.ok(errors.some((error) => error.includes("官方介绍")));
  assert.ok(errors.some((error) => error.includes("New")));
});

test("rejects duplicate generated plugin ids and an incorrect meta count", () => {
  const plugin = makeGeneratedPlugin();
  const errors = validatePluginData({
    generated: {
      meta: {
        count: 1,
        generatedAt: "2026-06-06T00:00:00.000Z",
        newPluginWindowDays: 7,
      },
      plugins: [plugin, { ...plugin }],
    },
    supplemental: {
      rolePluginAnnouncement: announcementUrl,
      rolePluginIds: ["product-design"],
      plugins: [makeRoleManifest()],
    },
    assetExists: () => true,
  });

  assert.ok(errors.some((error) => error.includes("meta.count")));
  assert.ok(errors.some((error) => error.includes("重复")));
});
