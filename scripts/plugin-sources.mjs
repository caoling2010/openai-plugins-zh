export function mergeManifestItems(primaryItems, supplementalItems) {
  const merged = new Map();

  for (const item of supplementalItems) {
    merged.set(item.name ?? item.manifest.name, item);
  }
  for (const item of primaryItems) {
    merged.set(item.name ?? item.manifest.name, item);
  }

  return [...merged.values()].sort((a, b) =>
    (a.name ?? a.manifest.name).localeCompare(b.name ?? b.manifest.name),
  );
}

export function toSupplementalManifestItems(data) {
  return (data.plugins ?? []).map((manifest) => ({
    name: manifest.name,
    path: "",
    manifest,
    isSupplemental: true,
  }));
}

export function assertPluginCountNotDropped(
  previousCount,
  nextCount,
  { allowedDropRatio = 0.1, allowDrop = false } = {},
) {
  if (allowDrop || !previousCount) return;
  const minimumExpected = Math.floor(previousCount * (1 - allowedDropRatio));
  if (nextCount < minimumExpected) {
    throw new Error(
      `插件数量异常下降：从 ${previousCount} 降至 ${nextCount}。如确认是正常删除，请设置 ALLOW_PLUGIN_COUNT_DROP=1 后重新同步。`,
    );
  }
}

export function resolveFirstSeenAt({
  recordedFirstSeenAt,
  officialReleasedAt,
  bootstrapFirstSeenAt,
  nowIso,
  isBootstrapRun,
  isSupplemental,
  recentWindowMs,
}) {
  if (officialReleasedAt) {
    return officialReleasedAt;
  }

  if (!isSupplemental) {
    return (
      recordedFirstSeenAt ??
      (isBootstrapRun ? bootstrapFirstSeenAt : nowIso)
    );
  }

  if (!recordedFirstSeenAt) {
    return bootstrapFirstSeenAt;
  }

  const age =
    new Date(nowIso).getTime() - new Date(recordedFirstSeenAt).getTime();
  return age > recentWindowMs ? recordedFirstSeenAt : bootstrapFirstSeenAt;
}
