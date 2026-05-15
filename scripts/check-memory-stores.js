import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildMemoryIndex,
  getMemoryItem,
  getSafeMemoryFixtures,
  listMemoryByScope,
  listMemoryForAgent,
  listMemoryForProject,
  listMemoryForTask,
  listMemoryItems,
  sanitizeMemoryItem,
  summarizeMemoryStore,
} from "../memory/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/memory-stores-report.md");
const checks = [];

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function addCheck(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

const branch = git(["branch", "--show-current"]);
const head = git(["rev-parse", "--short", "HEAD"]);
const packageJson = JSON.parse(read("package.json") || "{}");
const phaseStatus = JSON.parse(read("os-roadmap/phase-status.json") || "{}");
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const items = listMemoryItems();
const fixtures = getSafeMemoryFixtures();
const index = buildMemoryIndex({ items });
const summary = summarizeMemoryStore({ items });

addCheck("Store modules exist", ["memory/memoryStore.js", "memory/memoryIndex.js", "memory/memoryFixtures.js"].every((path) => existsSync(join(ROOT, path))));
addCheck("Runtime store files exist", ["memory/runtime/os-memory.jsonl", "memory/runtime/project-memory.jsonl", "memory/runtime/task-memory.jsonl", "memory/runtime/session-memory.jsonl"].every((path) => existsSync(join(ROOT, path))));
addCheck("Fixtures are safe", fixtures.length >= 4 && fixtures.every((item) => item.redacted === true && !String(item.summary).includes("DemoApp")));
addCheck("Stores parse", items.length >= 4 && items.every((item) => item.memoryId && item.redacted === true));
addCheck("Scoped listing works", listMemoryByScope("project").length >= 1 && listMemoryForProject("private-project").length >= 3);
addCheck("Task and agent listing works", listMemoryForTask("task-governed-build-summary").length === 1 && listMemoryForAgent("CORE").length >= 2);
addCheck("Get memory item works", getMemoryItem("mem-os-roadmap-p46")?.scope === "nexus_os");
addCheck("Index summarizes", index.itemCount >= 4 && summary.scopes >= 4);
addCheck("Secret-like content rejected", (() => {
  try {
    sanitizeMemoryItem({ memoryId: "bad", scope: "project", type: "note", summary: "api_key=123", source: "test", classification: "local_private", freshness: "fresh", confidence: 0.5, version: "1.0", redacted: true });
    return false;
  } catch {
    return true;
  }
})());
addCheck("Package script exists", packageJson.scripts?.["check:memory-stores"] === "node scripts/check-memory-stores.js");
addCheck("P46.2 status visible", ["in_progress", "complete"].includes(statusById.get("P46.2")?.status));
addCheck("P46.3 next", phaseStatus.nextPhase === "P46.3" || statusById.get("P46.2")?.nextPhase === "P46.3");
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const generatedAt = new Date().toISOString();
const report = `# Memory Stores Report

## Metadata
- Generated at: ${generatedAt}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P46.2 - Project / OS / Task / Session Memory Stores

## Summary
- Memory items: ${items.length}
- Scopes represented: ${summary.scopes}
- Projects represented: ${summary.projects}
- Agent visibility entries: ${summary.agents}
- Runtime injection enabled: false
- Store posture: metadata-only JSONL

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Next Phase
P46.3 - Memory Packet Builder
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Memory Stores Check\n=========================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
