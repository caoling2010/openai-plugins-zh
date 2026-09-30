export function mergeManifestItems(primaryItems, supplementalItems) {
  const merged = new Map();

  for (const item of supplementalItems) {
    merged.set(item.name ?? item.manifest.name, item);
  }
  for (const item of primaryItems) {
    const name = item.name ?? item.manifest.name;
    const supplementalItem = merged.get(name);
    merged.set(name, {
      ...item,
      supplementalManifest: supplementalItem?.manifest,
    });
  }

  return [...merged.values()].sort((a, b) =>
    (a.name ?? a.manifest.name).localeCompare(b.name ?? b.manifest.name),
  );
}

export function applySupplementalPresentation(manifest, supplementalManifest) {
  if (!supplementalManifest) return manifest;

  const interfaceMetadata = supplementalManifest.interface ?? {};
  return {
    ...manifest,
    homepage: supplementalManifest.homepage ?? manifest.homepage,
    releasedAt: supplementalManifest.releasedAt ?? manifest.releasedAt,
    interface: {
      ...(manifest.interface ?? {}),
      category: interfaceMetadata.category ?? manifest.interface?.category,
      websiteURL: interfaceMetadata.websiteURL ?? manifest.interface?.websiteURL,
      officialInfoURL:
        interfaceMetadata.officialInfoURL ?? manifest.interface?.officialInfoURL,
      logo: interfaceMetadata.logo ?? manifest.interface?.logo,
      brandColor: interfaceMetadata.brandColor ?? manifest.interface?.brandColor,
    },
  };
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
  { allowedDropRatio = 0.1, allowDrop = false, sourceIsComplete = false } = {},
) {
  if (allowDrop || sourceIsComplete || !previousCount) return;
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
