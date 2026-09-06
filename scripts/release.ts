interface Release { version: string; releaseDate: string; releaseURL: string; releaseNotes: string; }

async function latestTagFor(module: string, headers: Record<string, string>): Promise<Release> {
  let latest: { name: string; parts: bigint[] } | undefined;
  for (let page = 1; ; page++) {
    const response = await fetch(`https://api.github.com/repos/modern-swift-dev/${module}/tags?per_page=100&page=${page}`, { headers, signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`Tag lookup for ${module}: HTTP ${response.status}`);
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error(`Invalid tag data: ${module}`);
    for (const tag of data) {
      if (typeof tag !== "object" || tag === null || !("name" in tag) || typeof tag.name !== "string") throw new Error(`Invalid tag data: ${module}`);
      const match = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(tag.name);
      if (!match) continue;
      const parts = match.slice(1).map((part) => BigInt(part));
      const currentParts = latest?.parts;
      const difference = currentParts ? parts.findIndex((part, index) => part !== currentParts[index]) : -1;
      if (!latest || (difference !== -1 && parts[difference] > latest.parts[difference])) latest = { name: tag.name, parts };
    }
    if (data.length < 100) break;
  }
  if (!latest) throw new Error(`No stable version tags found: ${module}`);
  return {
    version: latest.name.replace(/^v/, ""),
    releaseDate: "via Git tag",
    releaseURL: `https://github.com/modern-swift-dev/${module}/tree/${encodeURIComponent(latest.name)}`,
    releaseNotes: "No GitHub release notes are available for this tag.",
  };
}

export async function releaseFor(module: string): Promise<Release> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`https://api.github.com/repos/modern-swift-dev/${module}/releases/latest`, { headers, signal: AbortSignal.timeout(30_000) });
  if (response.status === 404) return latestTagFor(module, headers);
  if (!response.ok) throw new Error(`Release lookup for ${module}: HTTP ${response.status}`);
  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null || !("tag_name" in data) || typeof data.tag_name !== "string"
    || !("published_at" in data) || typeof data.published_at !== "string"
    || !("html_url" in data) || typeof data.html_url !== "string") throw new Error(`Invalid release data: ${module}`);
  return {
    version: data.tag_name.replace(/^v/, ""),
    releaseDate: new Date(data.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }),
    releaseURL: data.html_url,
    releaseNotes: "body" in data && typeof data.body === "string" ? data.body : "",
  };
}
