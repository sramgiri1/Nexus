import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  getHookRegistry,
  summarizeRegisteredHooks,
  validateRegisteredHooks,
} from "../hooks/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "hook-registry-report.md");
const sections = {
  modules: true,
  schema: true,
  registry: true,
  policy: true,
  docs: true,
  osPhaseStatus: true,
  noForbiddenChanges: true,
  formatting: true,
  reportWritten: true,
};
const failures = [];

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function parseJson(relativePath, section) {
  try {
    return JSON.parse(read(relativePath));
  } catch (error) {
    fail(section, `${relativePath} did not parse: ${error.message}`);
    return {};
  }
}

function fail(section, message) {
  sections[section] = false;
  failures.push(message);
}

function check(condition, section, message) {
  if (!condition) fail(section, message);
}

function gitOutput(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function changedFiles() {
  return gitOutput(["status", "--short"])
    .split("\n")
    .map((line) => line.trim().slice(3))
    .filter(Boolean);
}

console.log("NEXUS Hook Registry Check");
console.log("=========================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "modules");
const policy = parseJson("policy/hook-registry-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const hooks = getHookRegistry();
const validation = validateRegisteredHooks(hooks);
const summary = summarizeRegisteredHooks(hooks);

for (const file of [
  "hooks/hookSchema.js",
  "hooks/hookRegistry.js",
  "hooks/index.js",
]) {
  check(existsSync(join(ROOT, file)), "modules", `Missing module: ${file}`);
}

check(packageJson.scripts?.["check:hook-registry"] === "node scripts/check-hook-registry.js", "modules", "Missing package script check:hook-registry");
check(validation.valid, "schema", `Hook validation failed: ${validation.errors.join("; ")}`);
check(summary.hookCount >= 5, "registry", "Expected at least five disabled seed hooks");
check(summary.enabledCount === 0, "registry", "No hooks may be enabled in P51");
check(summary.failClosedCount === summary.hookCount, "registry", "Every hook must fail closed");

for (const hookId of [
  "test-failure-classification",
  "prd-change-test-gap-proposal",
  "validation-pass-evidence-update",
  "repeated-failure-escalation",
  "docs-drift-reminder",
]) {
  const hook = hooks.find((entry) => entry.hookId === hookId);
  check(Boolean(hook), "registry", `Missing seed hook: ${hookId}`);
  check(hook?.enabled === false, "registry", `${hookId} must be disabled`);
  check(Boolean(hook?.killSwitchId), "registry", `${hookId} must have kill switch id`);
  check((hook?.requiredEvidence || []).length > 0, "registry", `${hookId} must require evidence`);
  check((hook?.requiredApprovals || []).length > 0, "registry", `${hookId} must require approvals`);
}

check(policy.phase === "P51", "policy", "Policy phase must be P51");
for (const field of [
  "hookExecutionAllowed",
  "automaticExecutionAllowed",
  "schedulerAllowed",
  "cronAllowed",
  "webhookRuntimeAllowed",
  "providerCallsAllowed",
  "toolCallsAllowed",
  "mcpCallsAllowed",
  "workerRuntimeAllowed",
  "dbWritesAllowed",
  "projectMutationAllowed",
  "externalNetworkCallsAllowed",
]) {
  check(policy[field] === false, "policy", `Policy must set ${field} false`);
}
check(policy.registryReadinessOnly === true, "policy", "Policy must be registry/readiness only");
check(policy.dryRunPreviewOnly === true, "policy", "Policy must be dry-run preview only");

const docs = read("docs/architecture/HOOK_REGISTRY_SAFE_AUTOMATION_LIFECYCLE.md");
check(docs.includes("P51.1 - Hook Registry Schema"), "docs", "Architecture doc missing P51.1 section");
check(docs.includes("Hook execution is not enabled"), "docs", "Architecture doc must state hook execution is disabled");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P50")?.status === "complete", "osPhaseStatus", "P50 parent must remain complete");
check(statusById.get("P51")?.status === "in_progress", "osPhaseStatus", "P51 parent must be in progress");
check(statusById.get("P51.1")?.status === "complete", "osPhaseStatus", "P51.1 must be complete");
check(statusById.get("P51.1")?.branch === "arch/hook-registry-safe-automation-lifecycle", "osPhaseStatus", "P51.1 branch mismatch");
check(statusById.get("P51.1")?.nextPhase === "P51.2", "osPhaseStatus", "P51.1 next phase must be P51.2");
check(statusById.get("P51.2")?.status === "planned", "osPhaseStatus", "P51.2 must be planned");
check(phaseStatus.currentPhase === "P51.1", "osPhaseStatus", "Current phase must be P51.1");
check(phaseStatus.nextPhase === "P51.2", "osPhaseStatus", "Next phase must be P51.2");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("agents/"), "noForbiddenChanges", `Forbidden agent definition change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider runtime change: ${file}`);
  check(!file.startsWith("tools/"), "noForbiddenChanges", `Forbidden tool runtime change: ${file}`);
  check(!file.startsWith("command-execution/"), "noForbiddenChanges", `Forbidden command execution change: ${file}`);
  check(!file.startsWith("db/"), "noForbiddenChanges", `Forbidden DB behavior change: ${file}`);
}

for (const file of [
  "hooks/hookSchema.js",
  "hooks/hookRegistry.js",
  "hooks/index.js",
  "scripts/check-hook-registry.js",
  "policy/hook-registry-policy.json",
  "docs/architecture/HOOK_REGISTRY_SAFE_AUTOMATION_LIFECYCLE.md",
]) {
  check(!read(file).split("\n").some((line) => line.length > 1000), "formatting", `Line over 1000 chars in ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Hook Registry Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P51.1 - Hook Registry Schema

## Summary

- Hooks: ${summary.hookCount}
- Enabled hooks: ${summary.enabledCount}
- Fail-closed hooks: ${summary.failClosedCount}
- Trigger types: ${Object.keys(summary.triggerCounts).join(", ")}
- Scopes: ${Object.keys(summary.scopeCounts).join(", ")}

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Schema: ${sections.schema ? "PASS" : "FAIL"}
- Registry: ${sections.registry ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

## Failures

${failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None"}

## Result

${result}
`;

try {
  writeFileSync(REPORT_PATH, report, "utf8");
} catch (error) {
  fail("reportWritten", `Could not write report: ${error.message}`);
}

result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
console.log(`Modules: ${sections.modules ? "PASS" : "FAIL"}`);
console.log(`Schema: ${sections.schema ? "PASS" : "FAIL"}`);
console.log(`Registry: ${sections.registry ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
