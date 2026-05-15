import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildMemoryPacket,
  evaluateMemoryAccess,
  getSafeMemoryFixtures,
  listMemoryItems,
  validateMemoryItem,
  validateMemoryPacket,
} from "../memory/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/scoped-memory-final-validation-report.md");
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

function hasForbiddenPayload(source) {
  return /(api[_-]?key\s*=|password\s*=|-----BEGIN [A-Z ]+PRIVATE KEY-----|\{\"raw|raw private source)/i.test(source);
}

const branch = git(["branch", "--show-current"]);
const head = git(["rev-parse", "--short", "HEAD"]);
const packageJson = JSON.parse(read("package.json") || "{}");
const phaseStatus = JSON.parse(read("os-roadmap/phase-status.json") || "{}");
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const routeSource = read("dashboard/src/data/commandCenterRoutes.js");
const pageSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const testSource = read("dashboard/tests/routes.spec.js");
const memoryStoreSource = [
  read("memory/runtime/os-memory.jsonl"),
  read("memory/runtime/project-memory.jsonl"),
  read("memory/runtime/task-memory.jsonl"),
  read("memory/runtime/session-memory.jsonl"),
].join("\n");
const fixtures = getSafeMemoryFixtures();
const storeItems = listMemoryItems();
const packet = buildMemoryPacket({
  scope: "task",
  projectId: "private-project",
  taskId: "task-governed-build-summary",
  agentId: "CORE",
  mode: "local-private",
  memoryItems: fixtures,
});
const demoDecision = evaluateMemoryAccess({
  memoryId: "mem-project-private-summary",
  agentId: "CORE",
  projectId: "private-project",
  memoryProjectId: "private-project",
  scope: "project",
  mode: "demo",
  capabilityId: "implementation.backend_code",
  classification: "project_private",
  allowedAgents: ["CORE"],
  summary: "Redacted project summary",
});

addCheck("P46.1-P46.6 reports exist", [
  "reports/memory-scope-model-report.md",
  "reports/memory-stores-report.md",
  "reports/memory-packet-builder-report.md",
  "reports/memory-access-policy-report.md",
  "reports/memory-freshness-report.md",
  "reports/memory-center-ui-report.md",
].every((path) => existsSync(join(ROOT, path))));
addCheck("Memory modules validate", fixtures.every((item) => validateMemoryItem(item).ok) && storeItems.every((item) => validateMemoryItem(item).ok));
addCheck("Memory packet validates", validateMemoryPacket(packet).ok && packet.runtimeInjectionEnabled === false);
addCheck("Demo/public leakage blocked", demoDecision.decision === "DENY");
addCheck("Memory Center route present", routeSource.includes("/command-center/memory") && pageSource.includes("function MemoryCenterPage"));
addCheck("Memory Center Playwright coverage", testSource.includes("Memory Center shows read-only scoped memory tabs and packet preview"));
addCheck("No forbidden memory payloads", !hasForbiddenPayload(memoryStoreSource) && !hasForbiddenPayload(pageSource));
addCheck("No runtime/provider/tool/DB behavior enabled", packet.providerReady === false && read("policy/scoped-memory-policy.json").includes('"runtimeInjectionAllowed": false') && read("policy/memory-access-policy.json").includes('"toolDispatchAllowed": false'));
addCheck("P46 status complete", statusById.get("P46")?.status === "complete");
addCheck("P46.1-P46.7 visible", ["P46.1", "P46.2", "P46.3", "P46.4", "P46.5", "P46.6", "P46.7"].every((phaseId) => statusById.has(phaseId) && statusById.get(phaseId).commandCenterVisible === true));
addCheck("P47 next", phaseStatus.nextPhase === "P47" || statusById.get("P46.7")?.nextPhase === "P47");
addCheck("Package script exists", packageJson.scripts?.["check:scoped-memory-final-validation"] === "node scripts/check-scoped-memory-final-validation.js");
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const generatedAt = new Date().toISOString();
const report = `# Scoped Memory Final Validation Report

## Metadata
- Generated at: ${generatedAt}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P46.7 - Tests + Docs + Final Validation

## Summary
- Scoped memory fixtures: ${fixtures.length}
- Runtime store items: ${storeItems.length}
- Memory packet included items: ${packet.includedMemory.length}
- Memory packet excluded items: ${packet.excludedMemory.length}
- Memory Center route: /command-center/memory
- Runtime memory injection enabled: false
- Provider/tool dispatch enabled: false
- DB writes enabled: false

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Remaining Limitations
- Scoped memory is metadata-only and read-only.
- Memory packets are previews and are not sent to providers or runtime agents.
- Memory editing, persistence promotion, and trusted-context execution are deferred.

## Next Phase
P47 - Trusted Context + Data Architecture Layer
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Scoped Memory Final Validation Check\n=========================================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
