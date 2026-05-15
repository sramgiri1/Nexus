import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  evaluateMemoryAccess,
  explainMemoryAccessDecision,
  loadMemoryAccessPolicy,
  validateMemoryAccessPolicy,
} from "../memory/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/memory-access-policy-report.md");
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
const policy = loadMemoryAccessPolicy();
const allowed = evaluateMemoryAccess({
  memoryId: "mem-project-private-summary",
  agentId: "CORE",
  projectId: "private-project",
  memoryProjectId: "private-project",
  scope: "project",
  mode: "local-private",
  capabilityId: "implementation.backend_code",
  classification: "project_private",
  allowedAgents: ["CORE", "AUDITOR"],
  summary: "Redacted project summary",
});
const demoDenied = evaluateMemoryAccess({ ...allowed, mode: "demo", classification: "project_private" });
const unrelatedDenied = evaluateMemoryAccess({ ...allowed, projectId: "other-project", memoryProjectId: "private-project" });
const forbiddenDenied = evaluateMemoryAccess({ ...allowed, classification: "forbidden" });
const redacted = evaluateMemoryAccess({
  ...allowed,
  agentId: "WARDEN",
  classification: "sensitive_metadata",
  allowedAgents: ["CORE"],
});
const approval = evaluateMemoryAccess({
  ...allowed,
  agentId: "CORE",
  classification: "sensitive_metadata",
  allowedAgents: ["CORE"],
});

addCheck("Access modules exist", ["memory/memoryAccessPolicy.js", "memory/memoryAccessDecision.js", "policy/memory-access-policy.json"].every((path) => existsSync(join(ROOT, path))));
addCheck("Policy validates", validateMemoryAccessPolicy(policy).ok);
addCheck("ALLOW decision", allowed.decision === "ALLOW" && allowed.runtimeEnforcementEnabled === false);
addCheck("Demo/public blocked", demoDenied.decision === "DENY");
addCheck("Unrelated project blocked", unrelatedDenied.decision === "DENY");
addCheck("Raw secret/source/prompt blocked", forbiddenDenied.decision === "DENY");
addCheck("WARDEN/AUDITOR metadata redaction", redacted.decision === "REDACT" && redacted.redactions.length > 0);
addCheck("Approval required decision", approval.decision === "REQUIRE_APPROVAL");
addCheck("Decision explanation", explainMemoryAccessDecision(allowed).startsWith("ALLOW"));
addCheck("Package script exists", packageJson.scripts?.["check:memory-access-policy"] === "node scripts/check-memory-access-policy.js");
addCheck("P46.4 status visible", ["in_progress", "complete"].includes(statusById.get("P46.4")?.status));
addCheck("P46.5 next", phaseStatus.nextPhase === "P46.5" || statusById.get("P46.4")?.nextPhase === "P46.5");
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const generatedAt = new Date().toISOString();
const report = `# Memory Access Policy Report

## Metadata
- Generated at: ${generatedAt}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P46.4 - Memory Access Policy

## Summary
- Decisions: ${policy.decisions.join(", ")}
- Runtime injection enabled: false
- Provider/tool dispatch enabled: false
- DB writes enabled: false
- Demo/private leakage allowed: false

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Next Phase
P46.5 - Memory Freshness + Staleness
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Memory Access Policy Check\n================================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
