import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { modules } from "../src/data/modules.ts";
import { buildRoot, sourceRoot } from "./paths.ts";

interface Release { version: string; releaseDate: string; releaseURL: string; releaseNotes: string; }

async function releaseFor(module: string): Promise<Release> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`https://api.github.com/repos/modern-swift-dev/${module}/releases/latest`, { headers, signal: AbortSignal.timeout(30_000) });
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

async function markdownFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(path));
    else if (entry.name.endsWith(".md")) files.push(path);
  }
  return files.sort();
}

const requested = process.argv[2];
const selected = requested ? modules.filter((module) => module.id === requested) : modules;
if (!selected.length) throw new Error(`Unknown module: ${requested}`);
for (const module of selected) {
  const source = sourceRoot(module.id);
  const guides = resolve(source, "Documentation/Site");
  const destination = resolve(buildRoot, "content", module.id);
  const files = await markdownFiles(guides);
  if (!files.includes(resolve(guides, "index.md"))) throw new Error(`Missing overview for ${module.id}`);
  const documents = await Promise.all(files.map(async (path) => ({ path, text: await readFile(path, "utf8") })));
  const release = documents.some(({ text }) => /\{\{(?:version|releaseDate|releaseURL|releaseNotes)\}\}/.test(text)) ? await releaseFor(module.id) : undefined;
  await rm(destination, { recursive: true, force: true });
  for (const document of documents) {
    let content = document.text;
    for (const match of content.matchAll(/<!--\s*include:\s*(.+?)\s*-->/g)) {
      const file = resolve(source, match[1]);
      if (!file.startsWith(source + sep)) throw new Error(`Include escapes source checkout: ${match[1]}`);
      const sample = await readFile(file, "utf8");
      const included = extname(file) === ".md"
        ? sample.trimEnd()
        : `\`\`\`\`swift\n${sample.trimEnd()}\n\`\`\`\``;
      content = content.replace(match[0], () => `\n\n${included}\n\n`);
    }
    if (release) {
      content = content.replace(/\{\{(version|releaseDate|releaseURL|releaseNotes)\}\}/g, (_match, key: keyof Release) => release[key]);
    }
    const path = resolve(destination, relative(guides, document.path));
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
  console.log(`Prepared ${files.length} guides for ${module.id}`);
}
