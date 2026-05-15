import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  CHANGE_SCOPES,
  FORBIDDEN_MEMORY_CLASSES,
  MEMORY_ITEM_FIELDS,
  MEMORY_SCOPES,
  createMemoryItem,
  validateMemoryItem,
  validateMemorySchema,
} from "../memory/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/memory-scope-model-report.md");
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
const policy = JSON.parse(read("policy/scoped-memory-policy.json") || "{}");
const phaseStatus = JSON.parse(read("os-roadmap/phase-status.json") || "{}");
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const sample = createMemoryItem({
  memoryId: "mem-scope-model-sample",
  scope: "project",
  projectId: "private-project",
  type: "decision",
  summary: "Private Project uses scoped memory summaries only.",
  source: "P46.1 model fixture",
  classification: "local_private",
  freshness: "fresh",
  confidence: 0.9,
  version: "1.0",
  redacted: true,
});

addCheck("Memory modules exist", ["memory/memoryScopes.js", "memory/memorySchema.js", "memory/index.js"].every((path) => existsSync(join(ROOT, path))));
addCheck("Required scopes", ["global_agent", "nexus_os", "project", "mission", "task", "session", "evidence_linked", "promotion_candidate"].every((scope) => MEMORY_SCOPES.includes(scope)));
addCheck("Change scopes", ["NEXUS_OS_CHANGE", "PROJECT_CHANGE", "CROSS_CUTTING_CHANGE", "DEMO_CHANGE", "DOCS_CHANGE", "UNKNOWN"].every((scope) => CHANGE_SCOPES.includes(scope)));
addCheck("Memory item fields", ["memoryId", "scope", "projectId", "missionId", "taskId", "agentId", "type", "summary", "source", "classification", "allowedAgents", "forbiddenModes", "freshness", "confidence", "lastVerifiedAt", "expiresAt", "version", "redacted", "evidenceIds", "auditIds"].every((field) => MEMORY_ITEM_FIELDS.includes(field)));
addCheck("Forbidden memory classes", ["secrets", ".env", "raw credentials", "unrelated project memory", "raw private source"].every((entry) => FORBIDDEN_MEMORY_CLASSES.includes(entry)));
addCheck("Memory schema validates", validateMemorySchema().ok);
addCheck("Sample memory item validates", validateMemoryItem(sample).ok);
addCheck("Policy blocks runtime behavior", policy.runtimeInjectionAllowed === false && policy.providerCallsAllowed === false && policy.dbWritesAllowed === false && policy.toolDispatchAllowed === false);
addCheck("Package script exists", packageJson.scripts?.["check:memory-scope-model"] === "node scripts/check-memory-scope-model.js");
addCheck("P45 repaired", statusById.get("P45")?.commit === "ba3032c" && statusById.get("P45.6")?.commit === "ba3032c");
addCheck("P46.1 status visible", ["in_progress", "complete"].includes(statusById.get("P46.1")?.status));
addCheck("P46.2 next", phaseStatus.nextPhase === "P46.2" || statusById.get("P46.1")?.nextPhase === "P46.2");
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const generatedAt = new Date().toISOString();
const report = `# Memory Scope Model Report

## Metadata
- Generated at: ${generatedAt}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P46.1 - Memory Scope Model

## Summary
- Memory scopes: ${MEMORY_SCOPES.length}
- Change scopes: ${CHANGE_SCOPES.length}
- Memory item fields: ${MEMORY_ITEM_FIELDS.length}
- Forbidden memory classes: ${FORBIDDEN_MEMORY_CLASSES.length}
- Runtime injection enabled: false
- Provider/tool/worker execution enabled: false
- DB writes enabled: false

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Next Phase
P46.2 - Project / OS / Task / Session Memory Stores
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Memory Scope Model Check\n==============================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
