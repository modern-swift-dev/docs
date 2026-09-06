import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const buildRoot = resolve(root, ".build");

export function sourceRoot(module: string): string {
  const parent = process.env.DOCS_SOURCES_ROOT
    ?? (existsSync(resolve(buildRoot, "sources", module)) ? resolve(buildRoot, "sources") : resolve(root, ".."));
  const path = resolve(parent, module);
  if (!existsSync(resolve(path, "Package.swift"))) throw new Error(`Missing module checkout: ${path}`);
  return path;
}
