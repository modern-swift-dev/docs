import { access, cp, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { modules } from "../src/data/modules.ts";
import { buildRoot } from "./paths.ts";

await access(resolve(buildRoot, "guides/index.html"));
for (const module of modules) {
  await access(resolve(buildRoot, "guides", module.id, "index.html"));
  for (const api of module.api) {
    const entry = module.mode === "merged" ? `${api.path}/index.html` : `${api.path}/documentation/${api.target.toLowerCase()}/index.html`;
    await access(resolve(buildRoot, "api", module.id, entry));
  }
}
const staging = await mkdtemp(resolve(buildRoot, "site-"));
try {
  for (const module of modules) await cp(resolve(buildRoot, "api", module.id), resolve(staging, module.id), { recursive: true });
  // Guides replace only intentional landing pages, including Pathways' API overview.
  await cp(resolve(buildRoot, "guides"), staging, { recursive: true });
  await writeFile(resolve(staging, ".nojekyll"), "");
  await rm(resolve(buildRoot, "site"), { recursive: true, force: true });
  await rename(staging, resolve(buildRoot, "site"));
  console.log(`Assembled ${modules.length} modules with one shared Astro theme`);
} finally {
  await rm(staging, { recursive: true, force: true });
}
