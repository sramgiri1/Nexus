import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/agent-definition-update-final-report.md");
const checks = [];

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function read(path) {
  const full = join(ROOT, path);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
}

function add(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

const branch = git(["branch", "--show-current"]);
const head = git(["rev-parse", "--short", "HEAD"]);
const packageJson = JSON.parse(read("package.json") || "{}");
const phaseStatus = JSON.parse(read("os-roadmap/phase-status.json") || "{}");
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const policy = JSON.parse(read("policy/agent-definition-update-policy.json") || "{}");
const changed = git(["status", "--short"]);
const source = [
  "agent-definition/agentDefinitionProposal.js",
  "agent-definition/boundaryDiff.js",
  "agent-definition/agentDefinitionReview.js",
  "agent-definition/approvalGate.js",
  "agent-definition/versioning.js",
  "agent-definition/rollbackPlan.js",
].map(read).join("\n");

for (const scriptName of [
  "check:agent-definition-proposal",
  "check:agent-boundary-diff",
  "check:agent-definition-review",
  "check:agent-definition-approval-gate",
  "check:agent-definition-versioning",
  "check:agent-definition-command-center",
  "check:agent-definition-update-final",
]) {
  add(`Package script ${scriptName}`, Boolean(packageJson.scripts?.[scriptName]));
}

for (const phaseId of ["P49.1", "P49.2", "P49.3", "P49.4", "P49.5", "P49.6", "P49.7"]) {
  const entry = statusById.get(phaseId);
  add(`${phaseId} complete`, entry?.status === "complete");
  add(`${phaseId} branch`, entry?.branch === "arch/agent-definition-update-workflow");
}

add("P50 next", phaseStatus.nextPhase === "P50" && statusById.get("P49.7")?.nextPhase === "P50");
add("Policy blocks runtime expansion", policy.directAgentFileMutationAllowed === false && policy.providerCallsAllowed === false && policy.toolDispatchAllowed === false && policy.dbWritesAllowed === false);
add("No mutation flags in modules", !source.includes("agentFileMutationAllowed: true") && !source.includes("mutationAllowed: true"));
add("No agents modified", !changed.split("\n").some((line) => line.includes(" agents/")));
add("No private project modified", !changed.includes("projects/careloop") && !changed.includes("projects/careloop-ios"));
add("Reports exist", [
  "reports/agent-definition-proposal-report.md",
  "reports/agent-boundary-diff-report.md",
  "reports/agent-definition-review-report.md",
  "reports/agent-definition-approval-gate-report.md",
  "reports/agent-definition-versioning-report.md",
  "reports/agent-definition-command-center-report.md",
].every((path) => existsSync(join(ROOT, path))));

const result = checks.every((check) => check.ok) ? "PASS" : "FAIL";
writeFileSync(REPORT_PATH, `# Agent Definition Update Final Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P49.7 - Final Validation

## Summary

P49 defines proposal-first agent definition update governance. It adds proposal,
boundary diff, AUDITOR/WARDEN review, human approval gate, dry-run versioning,
rollback planning, Command Center visibility, and final validation.

## Checks

${checks.map((check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}${check.detail && !check.ok ? ` - ${check.detail}` : ""}`).join("\n")}

## Explicit Non-Goals

- no direct agent markdown mutation
- no provider dispatch
- no tool dispatch
- no worker runtime
- no DB writes
- no project mutation

## Next Phase

P50 - Skill Registry + Skill Authoring Workflow

## Result

${result}
`, "utf8");

console.log("NEXUS Agent Definition Update Final Check");
console.log("=========================================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
