import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StoryboardConfig } from "../src/types/scene";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PROJECTS = path.join(ROOT, "projects");
export const CACHE = path.join(ROOT, ".cache");

export const projectDir = (slug: string) => {
  const dir = path.join(PROJECTS, slug);
  if (!fs.existsSync(path.join(dir, "storyboard.json"))) {
    const known = fs
      .readdirSync(PROJECTS)
      .filter((d) => fs.existsSync(path.join(PROJECTS, d, "storyboard.json")));
    throw new Error(`No projects/${slug}/storyboard.json. Known projects: ${known.join(", ")}`);
  }
  return dir;
};

export const readStoryboard = (slug: string): StoryboardConfig =>
  JSON.parse(fs.readFileSync(path.join(projectDir(slug), "storyboard.json"), "utf8"));

/** Tiny argv parser: positional args + --flag / --key value / --key=value. */
export const parseArgs = (argv = process.argv.slice(2)) => {
  const positional: string[] = [];
  const flags: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      positional.push(a);
      continue;
    }
    const [k, v] = a.slice(2).split("=", 2);
    if (v !== undefined) flags[k] = v;
    else if (argv[i + 1] && !argv[i + 1].startsWith("--")) flags[k] = argv[++i];
    else flags[k] = true;
  }
  return { positional, flags };
};

export const isMain = (importMetaUrl: string) =>
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(importMetaUrl);

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
