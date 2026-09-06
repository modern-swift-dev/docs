import { readFile, readdir, stat } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { buildRoot } from "./paths.ts";

const site = resolve(buildRoot, "site");
const failures: string[] = [];
let count = 0;
const checked = new Map<string, boolean>();
const guideIDs = new Map<string, Set<string>>();

async function collectGuideIDs(directory: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) { await collectGuideIDs(file); continue; }
    if (!entry.name.endsWith(".html")) continue;
    const html = await readFile(file, "utf8");
    const ids = [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]);
    if (ids.length !== new Set(ids).size) failures.push(`${relative(buildRoot, file)}: duplicate heading IDs`);
    guideIDs.set(resolve(site, relative(resolve(buildRoot, "guides"), file)), new Set(ids));
  }
}

async function exists(path: string): Promise<boolean> {
  if (checked.has(path)) return checked.get(path)!;
  let valid = false;
  try {
    const entry = await stat(path);
    valid = entry.isFile() || (entry.isDirectory() && (await stat(resolve(path, "index.html"))).isFile());
  } catch { /* Report absent targets below. */ }
  checked.set(path, valid);
  return valid;
}

async function check(directory: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) { await check(file); continue; }
    if (!entry.name.endsWith(".html")) continue;
    count++;
    const html = await readFile(file, "utf8");
    const page = new URL(`/docs/${relative(site, file).split(sep).join("/")}`, "https://modern-swift-dev.github.io");
    for (const match of html.matchAll(/\b(?:href|src|poster)\s*=\s*["']([^"']+)["']/gi)) {
      const value = match[1].replaceAll("&amp;", "&");
      if (/^(?:data:|mailto:|tel:|javascript:)/i.test(value)) continue;
      const url = new URL(value, page);
      if (url.origin !== page.origin) continue;
      if (!url.pathname.startsWith("/docs/")) { failures.push(`${relative(site, file)}: outside documentation base: ${value}`); continue; }
      const target = resolve(site, decodeURIComponent(url.pathname.slice("/docs/".length)));
      if (!target.startsWith(site + sep) && target !== site || !await exists(target)) failures.push(`${relative(site, file)}: ${value}`);
      const ids = guideIDs.get(target) ?? guideIDs.get(resolve(target, "index.html"));
      if (ids && url.hash && !ids.has(decodeURIComponent(url.hash.slice(1)))) failures.push(`${relative(site, file)}: missing guide anchor ${value}`);
    }
  }
}

await collectGuideIDs(resolve(buildRoot, "guides"));
await check(site);
if (failures.length) throw new Error(`${failures.length} broken local links:\n${failures.slice(0, 40).join("\n")}`);
console.log(`Checked local links in ${count} HTML files`);
