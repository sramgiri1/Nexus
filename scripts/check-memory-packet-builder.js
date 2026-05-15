import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildMemoryPacket,
  explainMemoryInclusion,
  getSafeMemoryFixtures,
  summarizeMemoryPacket,
  validateMemoryPacket,
} from "../memory/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/memory-packet-builder-report.md");
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
const packet = buildMemoryPacket({
  scope: "task",
  projectId: "private-project",
  missionId: "private-project-governed-build-mission",
  taskId: "task-governed-build-summary",
  agentId: "CORE",
  capabilityId: "implementation.backend_code",
  mode: "local-private",
  memoryBudget: { maxItems: 4, maxSummaryCharacters: 1200 },
});
const demoPacket = buildMemoryPacket({
  scope: "project",
  projectId: "private-project",
  agentId: "CORE",
  capabilityId: "implementation.backend_code",
  mode: "demo",
  memoryItems: getSafeMemoryFixtures(),
});
const summary = summarizeMemoryPacket(packet);
const explanation = explainMemoryInclusion(packet);

addCheck("Packet modules exist", ["memory/memoryPacketBuilder.js", "memory/memorySelection.js", "memory/memoryBudget.js"].every((path) => existsSync(join(ROOT, path))));
addCheck("Packet validates", validateMemoryPacket(packet).ok);
addCheck("Packet includes scoped memory", packet.includedMemory.length >= 2 && packet.includedMemory.every((item) => !item.projectId || item.projectId === "private-project"));
addCheck("Packet excludes demo/private leakage", demoPacket.includedMemory.length === 0 && demoPacket.excludedMemory.length >= 1);
addCheck("Packet summarizes", summary.includedCount === packet.includedMemory.length && typeof summary.tokenBudgetEstimate === "number");
addCheck("Inclusion explanation", explanation.length === packet.includedMemory.length && explanation.every((entry) => entry.reasons.length > 0));
addCheck("Raw content disabled", packet.rawContentIncluded === false && packet.runtimeInjectionEnabled === false && packet.providerReady === false);
addCheck("Package script exists", packageJson.scripts?.["check:memory-packet-builder"] === "node scripts/check-memory-packet-builder.js");
addCheck("P46.3 status visible", ["in_progress", "complete"].includes(statusById.get("P46.3")?.status));
addCheck("P46.4 next", phaseStatus.nextPhase === "P46.4" || statusById.get("P46.3")?.nextPhase === "P46.4");
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const generatedAt = new Date().toISOString();
const report = `# Memory Packet Builder Report

## Metadata
- Generated at: ${generatedAt}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P46.3 - Memory Packet Builder

## Summary
- Included memory: ${summary.includedCount}
- Excluded memory: ${summary.excludedCount}
- Freshness warnings: ${summary.freshnessWarnings}
- Trust warnings: ${summary.trustWarnings}
- Token budget estimate: ${summary.tokenBudgetEstimate}
- Runtime injection enabled: false
- Provider dispatch enabled: false

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Next Phase
P46.4 - Memory Access Policy
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Memory Packet Builder Check\n=================================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
