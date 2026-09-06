import { cp, mkdir, mkdtemp, rm, access } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { modules } from "../src/data/modules.ts";
import { buildRoot, sourceRoot } from "./paths.ts";

const requested = process.argv[2];
const selected = requested ? modules.filter((module) => module.id === requested) : modules;
if (!selected.length) throw new Error(`Unknown module: ${requested}`);

for (const module of selected) {
  const source = sourceRoot(module.id);
  const destination = resolve(buildRoot, "api", module.id);
  await mkdir(resolve(buildRoot, "api"), { recursive: true });
  const staging = await mkdtemp(resolve(buildRoot, `api-${module.id}-`));
  const output = resolve(staging, "site");
  await mkdir(output);
  const run = (command: string, args: string[]) => {
    const result = spawnSync(command, args, { cwd: source, stdio: "inherit", env: { ...process.env, SWIFT_DETERMINISTIC_HASHING: "1" } });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`${module.id}: ${command} exited ${result.status}`);
  };
  try {
    if (module.mode === "merged") {
      const archives: string[] = [];
      for (const api of module.api) {
        const archive = resolve(staging, `${api.target}.doccarchive`);
        run("swift", ["package", "--allow-writing-to-directory", archive, "generate-documentation", "--target", api.target, "--output-path", archive, ...api.flags]);
        archives.push(archive);
      }
      const archive = resolve(staging, "MarkdownLibraries.doccarchive");
      run("xcrun", ["docc", "merge", ...archives, "--synthesized-landing-page-name", "Markdown Libraries", "--output-path", archive]);
      run("xcrun", ["docc", "process-archive", "transform-for-static-hosting", archive, "--hosting-base-path", `docs/${module.id}`]);
      await cp(archive, output, { recursive: true });
      // The central Astro app supplies the module and documentation overview pages.
      await rm(resolve(output, "index.html"), { force: true });
      await rm(resolve(output, "documentation/index.html"), { force: true });
      for (const api of module.api) await access(resolve(output, api.path, "index.html"));
    } else {
      for (const api of module.api) {
        const path = resolve(output, api.path);
        await mkdir(path, { recursive: true });
        run("swift", ["package", "--allow-writing-to-directory", path, "generate-documentation", "--target", api.target, "--output-path", path,
          "--transform-for-static-hosting", "--hosting-base-path", `docs/${module.id}/${api.path}`, ...api.flags]);
        await access(resolve(path, "documentation", api.target.toLowerCase(), "index.html"));
      }
    }
    await rm(destination, { recursive: true, force: true });
    await cp(output, destination, { recursive: true });
    console.log(`Built API references for ${module.id}`);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}
