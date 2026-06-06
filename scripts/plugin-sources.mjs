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

export function resolveFirstSeenAt({
  recordedFirstSeenAt,
  bootstrapFirstSeenAt,
  nowIso,
  isBootstrapRun,
  isSupplemental,
  recentWindowMs,
}) {
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
