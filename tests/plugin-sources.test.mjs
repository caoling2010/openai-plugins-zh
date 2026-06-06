import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  assertPluginCountNotDropped,
  mergeManifestItems,
  resolveFirstSeenAt,
  toSupplementalManifestItems,
} from "../scripts/plugin-sources.mjs";

test("official supplemental plugins include all six role-specific plugins", async () => {
  const supplemental = JSON.parse(
    await readFile(
      new URL("../data/official-supplemental-plugins.json", import.meta.url),
      "utf8",
    ),
  );

  assert.equal(supplemental.rolePluginIds.length, 6);
  for (const id of supplemental.rolePluginIds) {
    const plugin = supplemental.plugins.find((manifest) => manifest.name === id);
    assert.ok(plugin?.interface.displayName);
    assert.match(plugin?.homepage ?? "", /^https:\/\/chatgpt\.com\/plugins\/share\//);
    assert.match(plugin?.interface.logo ?? "", /^assets\/logos\/.+\.png$/);
    assert.equal(
      plugin?.interface.officialInfoURL,
      supplemental.rolePluginAnnouncement,
    );
    assert.equal(plugin?.releasedAt, "2026-06-02T00:00:00.000Z");
  }
});

test("public manifests take precedence over supplemental snapshots", () => {
  const publicItem = {
    name: "product-design",
    path: "plugins/product-design/.codex-plugin/plugin.json",
    url: "https://api.github.test/product-design",
  };
  const supplementalItem = {
    name: "product-design",
    path: "",
    manifest: { name: "product-design", version: "1.0.0" },
  };

  const merged = mergeManifestItems([publicItem], [supplementalItem]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].url, "https://api.github.test/product-design");
});

test("supplemental snapshots are treated as existing plugins", () => {
  const [item] = toSupplementalManifestItems({
    plugins: [{ name: "product-design" }],
  });
  const firstSeenAt = resolveFirstSeenAt({
    recordedFirstSeenAt: "2026-06-06T00:00:00.000Z",
    bootstrapFirstSeenAt: "2026-05-29T00:00:00.000Z",
    nowIso: "2026-06-06T12:00:00.000Z",
    isBootstrapRun: false,
    isSupplemental: item.isSupplemental,
    recentWindowMs: 7 * 24 * 60 * 60 * 1000,
  });

  assert.equal(firstSeenAt, "2026-05-29T00:00:00.000Z");
});

test("official release date takes precedence for newly launched plugins", () => {
  const firstSeenAt = resolveFirstSeenAt({
    recordedFirstSeenAt: "2026-05-29T00:00:00.000Z",
    officialReleasedAt: "2026-06-02T00:00:00.000Z",
    bootstrapFirstSeenAt: "2026-05-29T00:00:00.000Z",
    nowIso: "2026-06-06T12:00:00.000Z",
    isBootstrapRun: false,
    isSupplemental: true,
    recentWindowMs: 7 * 24 * 60 * 60 * 1000,
  });

  assert.equal(firstSeenAt, "2026-06-02T00:00:00.000Z");
});

test("rejects an unexpected plugin count drop", () => {
  assert.throws(
    () => assertPluginCountNotDropped(184, 150),
    /插件数量异常下降/,
  );
  assert.doesNotThrow(() => assertPluginCountNotDropped(184, 180));
  assert.doesNotThrow(() =>
    assertPluginCountNotDropped(184, 100, { allowDrop: true }),
  );
});
