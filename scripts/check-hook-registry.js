import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  getHookRegistry,
  buildTriggerPreview,
  buildHookGuardDecision,
  evaluateHookLimits,
  evaluateRetryPolicy,
  detectHookLoopRisks,
  detectRegistryLoopRisks,
  summarizeLoopRisks,
  validateLoopRiskResult,
  disableHookPreview,
  evaluateKillSwitch,
  reenableHookPreview,
  validateKillSwitchState,
  HOOK_GUARD_DECISIONS,
  summarizeRegisteredHooks,
  summarizeTriggerDefinitions,
  validateRegisteredHooks,
  validateTriggerDefinitions,
} from "../hooks/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "hook-registry-report.md");
const sections = {
  modules: true,
  schema: true,
  registry: true,
  triggers: true,
  guards: true,
  loopRisk: true,
  killSwitches: true,
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
const triggerValidation = validateTriggerDefinitions();
const triggerSummary = summarizeTriggerDefinitions();

for (const file of [
  "hooks/hookSchema.js",
  "hooks/hookRegistry.js",
  "hooks/triggerDefinitions.js",
  "hooks/triggerContract.js",
  "hooks/hookLimits.js",
  "hooks/hookRuntimeGuard.js",
  "hooks/loopRiskDetector.js",
  "hooks/hookKillSwitch.js",
  "hooks/index.js",
]) {
  check(existsSync(join(ROOT, file)), "modules", `Missing module: ${file}`);
}

check(packageJson.scripts?.["check:hook-registry"] === "node scripts/check-hook-registry.js", "modules", "Missing package script check:hook-registry");
check(validation.valid, "schema", `Hook validation failed: ${validation.errors.join("; ")}`);
check(summary.hookCount >= 5, "registry", "Expected at least five disabled seed hooks");
check(summary.enabledCount === 0, "registry", "No hooks may be enabled in P51");
check(summary.failClosedCount === summary.hookCount, "registry", "Every hook must fail closed");
check(triggerValidation.valid, "triggers", `Trigger validation failed: ${triggerValidation.errors.join("; ")}`);
check(triggerSummary.triggerCount >= 7, "triggers", "Expected all trigger definitions");
check(triggerSummary.runtimeEnabledCount === 0, "triggers", "No trigger runtime may be enabled");
check(triggerSummary.schedulerAllowedCount === 0, "triggers", "No scheduler trigger may be enabled");
check(triggerSummary.webhookAllowedCount === 0, "triggers", "No webhook trigger may be enabled");
check(triggerSummary.externalInputAllowedCount === 0, "triggers", "No external trigger input may be enabled");

const preview = buildTriggerPreview(hooks[0], { eventType: "manual_preview" });
check(preview.dryRun === true, "triggers", "Trigger preview must be dry-run");
check(preview.wouldExecute === false, "triggers", "Trigger preview must not execute");
check(preview.decision === "PREVIEW_ONLY", "triggers", "Trigger preview decision mismatch");

const disabledGuard = buildHookGuardDecision(hooks[0]);
check(disabledGuard.decision === HOOK_GUARD_DECISIONS.BLOCK_DISABLED, "guards", "Disabled hook must block");
check(disabledGuard.allowed === false, "guards", "Disabled hook must not be allowed");
const enabledSample = {
  ...hooks[0],
  enabled: true,
  maxRunsPerDay: 2,
  maxRuntimeSeconds: 30,
  maxRetries: 1,
  costPolicy: { maxUsdPerRun: 1, maxUsdPerDay: 1, requiresApprovalAboveUsd: 0 },
};
const allowedSample = buildHookGuardDecision(enabledSample, {
  historyPreview: { runsToday: 0, secondsSinceLastRun: 7200, estimatedRuntimeSeconds: 1, estimatedUsd: 0 },
  attemptPreview: { attempt: 0, consecutiveFailures: 0 },
});
check(allowedSample.decision === HOOK_GUARD_DECISIONS.ALLOW_DRY_RUN, "guards", "Safe sample must allow dry-run");
check(evaluateHookLimits(hooks[0]).decision === "BLOCK_RATE_LIMIT", "guards", "P51 seed limits must block");
check(evaluateRetryPolicy(hooks[0], { attempt: 1 }).decision === "BLOCK_RETRY_LIMIT", "guards", "Seed retries must block");

const loopResults = detectRegistryLoopRisks(hooks);
const loopSummary = summarizeLoopRisks(loopResults);
for (const resultEntry of loopResults) {
  const loopValidation = validateLoopRiskResult(resultEntry);
  check(loopValidation.valid, "loopRisk", `Loop risk result invalid: ${loopValidation.errors.join("; ")}`);
}
const selfTriggerResult = detectHookLoopRisks({ ...hooks[0], enabled: true, triggerSource: hooks[0].hookId }, hooks);
check(selfTriggerResult.decision === "BLOCK", "loopRisk", "Self-trigger loop must block");
check(selfTriggerResult.riskLevel === "critical", "loopRisk", "Self-trigger loop must be critical");

for (const hook of hooks) {
  const killSwitch = evaluateKillSwitch(hook);
  const stateValidation = validateKillSwitchState(killSwitch.state);
  check(stateValidation.valid, "killSwitches", `Kill switch state invalid: ${stateValidation.errors.join("; ")}`);
  check(killSwitch.disabled === true, "killSwitches", `${hook.hookId} kill switch must block disabled hook`);
  check(killSwitch.requiresReviewToReenable === true, "killSwitches", `${hook.hookId} must require re-enable review`);
}
const disablePreview = disableHookPreview(hooks[0], "Checker preview");
const reenablePreview = reenableHookPreview(hooks[0], { approved: true, approver: "human-operator" });
check(disablePreview.dryRun === true && disablePreview.wouldWrite === false, "killSwitches", "Disable preview must not write");
check(reenablePreview.dryRun === true && reenablePreview.wouldWrite === false, "killSwitches", "Re-enable preview must not write");

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
check(docs.includes("P51.2 - Trigger Definition Model"), "docs", "Architecture doc missing P51.2 section");
check(docs.includes("P51.3 - Rate Limits, Retry Limits, and Runtime Guard Model"), "docs", "Architecture doc missing P51.3 section");
check(docs.includes("P51.4 - Loop-Risk Detector"), "docs", "Architecture doc missing P51.4 section");
check(docs.includes("P51.5 - Kill Switch and Safe Disable Model"), "docs", "Architecture doc missing P51.5 section");
check(docs.includes("P51.6 - Command Center Hooks UX"), "docs", "Architecture doc missing P51.6 section");
check(docs.includes("Hook execution is not enabled"), "docs", "Architecture doc must state hook execution is disabled");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P50")?.status === "complete", "osPhaseStatus", "P50 parent must remain complete");
check(statusById.get("P51")?.status === "complete", "osPhaseStatus", "P51 parent must be complete");
check(statusById.get("P51")?.nextPhase === "P52", "osPhaseStatus", "P51 parent next phase must be P52");
check(statusById.get("P51.1")?.status === "complete", "osPhaseStatus", "P51.1 must be complete");
check(statusById.get("P51.1")?.commit === "081e733", "osPhaseStatus", "P51.1 commit mismatch");
check(statusById.get("P51.1")?.branch === "arch/hook-registry-safe-automation-lifecycle", "osPhaseStatus", "P51.1 branch mismatch");
check(statusById.get("P51.1")?.nextPhase === "P51.2", "osPhaseStatus", "P51.1 next phase must be P51.2");
check(statusById.get("P51.2")?.status === "complete", "osPhaseStatus", "P51.2 must be complete");
check(statusById.get("P51.2")?.commit === "81e8016", "osPhaseStatus", "P51.2 commit mismatch");
check(statusById.get("P51.2")?.nextPhase === "P51.3", "osPhaseStatus", "P51.2 next phase must be P51.3");
check(statusById.get("P51.3")?.status === "complete", "osPhaseStatus", "P51.3 must be complete");
check(statusById.get("P51.3")?.commit === "c21218d", "osPhaseStatus", "P51.3 commit mismatch");
check(statusById.get("P51.3")?.nextPhase === "P51.4", "osPhaseStatus", "P51.3 next phase must be P51.4");
check(statusById.get("P51.4")?.status === "complete", "osPhaseStatus", "P51.4 must be complete");
check(statusById.get("P51.4")?.commit === "0e18569", "osPhaseStatus", "P51.4 commit mismatch");
check(statusById.get("P51.4")?.nextPhase === "P51.5", "osPhaseStatus", "P51.4 next phase must be P51.5");
check(statusById.get("P51.5")?.status === "complete", "osPhaseStatus", "P51.5 must be complete");
check(statusById.get("P51.5")?.commit === "aae9171", "osPhaseStatus", "P51.5 commit mismatch");
check(statusById.get("P51.5")?.nextPhase === "P51.6", "osPhaseStatus", "P51.5 next phase must be P51.6");
check(statusById.get("P51.6")?.status === "complete", "osPhaseStatus", "P51.6 must be complete");
check(statusById.get("P51.6")?.commit === "3706de7", "osPhaseStatus", "P51.6 commit mismatch");
check(statusById.get("P51.6")?.nextPhase === "P51.7", "osPhaseStatus", "P51.6 next phase must be P51.7");
check(statusById.get("P51.7")?.status === "complete", "osPhaseStatus", "P51.7 must be complete");
check(statusById.get("P51.7")?.nextPhase === "P52", "osPhaseStatus", "P51.7 next phase must be P52");
check(statusById.get("P52")?.status === "planned", "osPhaseStatus", "P52 must be planned");
check(phaseStatus.currentPhase === "P51.7", "osPhaseStatus", "Current phase must be P51.7");
check(phaseStatus.nextPhase === "P52", "osPhaseStatus", "Next phase must be P52");

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
  "hooks/triggerDefinitions.js",
  "hooks/triggerContract.js",
  "hooks/hookLimits.js",
  "hooks/hookRuntimeGuard.js",
  "hooks/loopRiskDetector.js",
  "hooks/hookKillSwitch.js",
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

P51.7 - Hook Registry Final Validation

## Summary

- Hooks: ${summary.hookCount}
- Enabled hooks: ${summary.enabledCount}
- Fail-closed hooks: ${summary.failClosedCount}
- Trigger definitions: ${triggerSummary.triggerCount}
- Runtime-enabled triggers: ${triggerSummary.runtimeEnabledCount}
- Loop-risk blocked hooks: ${loopSummary.blockedCount}
- Loop-risk warnings: ${loopSummary.warningCount}
- Kill switch states: ${hooks.length}
- Trigger types: ${Object.keys(summary.triggerCounts).join(", ")}
- Scopes: ${Object.keys(summary.scopeCounts).join(", ")}

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Schema: ${sections.schema ? "PASS" : "FAIL"}
- Registry: ${sections.registry ? "PASS" : "FAIL"}
- Triggers: ${sections.triggers ? "PASS" : "FAIL"}
- Guards: ${sections.guards ? "PASS" : "FAIL"}
- Loop risk: ${sections.loopRisk ? "PASS" : "FAIL"}
- Kill switches: ${sections.killSwitches ? "PASS" : "FAIL"}
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
console.log(`Triggers: ${sections.triggers ? "PASS" : "FAIL"}`);
console.log(`Guards: ${sections.guards ? "PASS" : "FAIL"}`);
console.log(`Loop risk: ${sections.loopRisk ? "PASS" : "FAIL"}`);
console.log(`Kill switches: ${sections.killSwitches ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
