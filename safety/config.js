// safety/config.js
// Loads and caches guardrail config JSON files from /guardrails/.

import fs   from "fs/promises";
import path from "path";

const ROOT           = process.cwd();
const GUARDRAILS_DIR = path.join(ROOT, "guardrails");
const cache          = new Map();

export async function loadConfig(name) {
  if (cache.has(name)) return cache.get(name);
  const filePath = path.join(GUARDRAILS_DIR, `${name}.json`);
  const content  = await fs.readFile(filePath, "utf8");
  const config   = JSON.parse(content);
  cache.set(name, config);
  return config;
}

export function clearConfigCache() {
  cache.clear();
}
