import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  mergeManifestItems,
  resolveFirstSeenAt,
  toSupplementalManifestItems,
} from "../scripts/plugin-sources.mjs";

test("official supplemental plugins include Product Design", async () => {
  const supplemental = JSON.parse(
    await readFile(
      new URL("../data/official-supplemental-plugins.json", import.meta.url),
      "utf8",
    ),
  );

  const productDesign = supplemental.plugins.find(
    (manifest) => manifest.name === "product-design",
  );

  assert.equal(productDesign.interface.displayName, "Product Design");
  assert.equal(productDesign.interface.category, "Design");
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
