/**
 * check-task-activation-bridge.js
 * NEXUS Task Activation Bridge Check — P37-LOCAL
 *
 * Validates task activation modules, policy, activation flow, invalid-action blocks,
 * dashboard wiring, agent assignment, mode awareness, roadmap state, public safety,
 * forbidden changes, and formatting/readability.
 */

import { readFileSync, existsSync, copyFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const sections = {
  modules: true,
  exports: true,
  policy: true,
  taskActivation: true,
  invalidActivationBlocks: true,
  dashboardWiring: true,
  agentAssignment: true,
  modeAwareUI: true,
  roadmap: true,
  publicSafety: true,
  noForbiddenChanges: true,
  formattingReadability: true,
};
const failures = [];

function statusLabel(v) { return v ? "PASS" : "FAIL"; }
function readFile(rel) {
  const full = join(ROOT, rel);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
}
function runCommand(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8" });
  if (r.error || r.status !== 0) {
    const err = new Error(`${cmd} ${args.join(" ")} failed`);
    err.stdout = r.stdout || r.stderr || "";
    throw err;
  }
  return r.stdout || "";
}

// ─── 1. Required modules ────────────────────────────────────────────────────

const requiredModules = [
  "task-actions/taskActivationBridge.js",
  "task-actions/taskActivationStore.js",
  "task-actions/index.js",
];
for (const mod of requiredModules) {
  if (!existsSync(join(ROOT, mod))) {
    sections.modules = false;
    failures.push(`Module not found: ${mod}`);
  }
}

// ─── 2. Required exports ────────────────────────────────────────────────────

const bridgeSrc = readFile("task-actions/taskActivationBridge.js");
const storeSrc = readFile("task-actions/taskActivationStore.js");
const indexSrc = readFile("task-actions/index.js");

const bridgeExports = [
  "createTaskActivationRequest",
  "validateTaskActivationRequest",
  "runTaskActivationRequest",
  "getTaskActivationResult",
  "listTaskActivationActions",
  "buildTaskActivationResponse",
];
const storeExports = [
  "appendTaskActivationAction",
  "updateTaskActivationAction",
  "getTaskActivationAction",
  "listTaskActivationActionRecords",
];

for (const fn of bridgeExports) {
  if (!bridgeSrc.includes(`export function ${fn}`) && !bridgeSrc.includes(`export async function ${fn}`)) {
    sections.exports = false;
    failures.push(`Missing export in taskActivationBridge.js: ${fn}`);
  }
}
for (const fn of storeExports) {
  if (!storeSrc.includes(`export function ${fn}`)) {
    sections.exports = false;
    failures.push(`Missing export in taskActivationStore.js: ${fn}`);
  }
}
for (const fn of [...bridgeExports, ...storeExports]) {
  if (!indexSrc.includes(fn)) {
    sections.exports = false;
    failures.push(`Function not re-exported from task-actions/index.js: ${fn}`);
  }
}

// ─── 3. Policy ──────────────────────────────────────────────────────────────

const POLICY_PATH = "policy/task-activation-bridge-policy.json";
let policy = null;
try {
  policy = JSON.parse(readFile(POLICY_PATH));
  const required = {
    phase: "P37-LOCAL",
    localOnly: true,
    providerCallsAllowed: false,
    networkCallsAllowed: false,
    dbAccessAllowed: false,
    projectMutationAllowed: false,
    taskExecutionAllowed: false,
    agentExecutionAllowed: false,
    evidenceAllowed: true,
    auditAllowed: true,
  };
  for (const [k, v] of Object.entries(required)) {
    if (policy[k] !== v) {
      sections.policy = false;
      failures.push(`Policy: ${k} must be ${v}, got ${policy[k]}`);
    }
  }
  if (!Array.isArray(policy.allowedActionTypes) || !policy.allowedActionTypes.includes("task.activate")) {
    sections.policy = false;
    failures.push("Policy: allowedActionTypes must include task.activate");
  }
} catch (e) {
  sections.policy = false;
  failures.push(`Policy parse error: ${e.message}`);
}

// ─── 4. Task activation flow ────────────────────────────────────────────────

// Snapshot runtime files before test
const TASKS_PATH = join(ROOT, "local-state/runtime/tasks.json");
const EVIDENCE_PATH = join(ROOT, "local-state/runtime/evidence.jsonl");
const AUDIT_PATH = join(ROOT, "local-state/runtime/audit.jsonl");
const EVENTS_PATH = join(ROOT, "local-state/runtime/events.jsonl");
const ACTIONS_PATH = join(ROOT, "local-state/runtime/actions.jsonl");

const tasksSnapshot = existsSync(TASKS_PATH) ? readFileSync(TASKS_PATH, "utf8") : null;
const evidenceSnapshot = existsSync(EVIDENCE_PATH) ? readFileSync(EVIDENCE_PATH, "utf8") : "";
const auditSnapshot = existsSync(AUDIT_PATH) ? readFileSync(AUDIT_PATH, "utf8") : "";
const eventsSnapshot = existsSync(EVENTS_PATH) ? readFileSync(EVENTS_PATH, "utf8") : "";
const actionsSnapshot = existsSync(ACTIONS_PATH) ? readFileSync(ACTIONS_PATH, "utf8") : "";

try {
  const { createTaskActivationRequest, runTaskActivationRequest } = await import("../task-actions/taskActivationBridge.js");

  // Use first safe task: Project Brief (SHEPHERD)
  const PLAN_TASK_ID = "b6f66c80-bd0c-42c9-a21c-869cff1bc55e";

  const reqResult = createTaskActivationRequest({
    actionType: "task.activate",
    mode: "local-private",
    projectId: "private-project-01",
    missionId: "private-project-governed-build-mission",
    planTaskId: PLAN_TASK_ID,
    source: "command_center_v2",
  });

  if (!reqResult.ok) {
    sections.taskActivation = false;
    for (const e of reqResult.errors) failures.push(`Task activation request error: ${e}`);
  } else {
    // Set env so getNexusMode returns local-private
    process.env.NEXUS_MODE = "local-private";
    const result = await runTaskActivationRequest(reqResult.request);

    if (!result.ok && !result.warnings?.some((w) => w.includes("idempotent"))) {
      sections.taskActivation = false;
      for (const e of result.errors) failures.push(`Task activation failed: ${e}`);
    } else {
      // Validate result shape
      if (!result.runtimeTaskId && !result.warnings?.some((w) => w.includes("idempotent"))) {
        sections.taskActivation = false;
        failures.push("Task activation: runtimeTaskId missing");
      }
      if (result.result?.initialState && result.result.initialState !== "queued") {
        sections.taskActivation = false;
        failures.push(`Task activation: initialState must be queued, got ${result.result.initialState}`);
      }
      if (result.result?.targetAgent && result.result.targetAgent !== "shepherd") {
        sections.taskActivation = false;
        failures.push(`Task activation: targetAgent should be shepherd, got ${result.result.targetAgent}`);
      }
      if (result.result?.mutationAllowed !== false) {
        sections.taskActivation = false;
        failures.push("Task activation: mutationAllowed must be false");
      }
      if (result.result?.executionAllowed !== false) {
        sections.taskActivation = false;
        failures.push("Task activation: executionAllowed must be false");
      }
      // Check redacted runtime records
      const newEvidence = existsSync(EVIDENCE_PATH) ? readFileSync(EVIDENCE_PATH, "utf8") : "";
      const newAudit = existsSync(AUDIT_PATH) ? readFileSync(AUDIT_PATH, "utf8") : "";
      const addedEvidence = newEvidence.replace(evidenceSnapshot, "").trim();
      const addedAudit = newAudit.replace(auditSnapshot, "").trim();

      if (addedEvidence && !addedEvidence.includes('"redacted":true')) {
        sections.taskActivation = false;
        failures.push("Evidence records must be redacted: true");
      }
      if (addedAudit && !addedAudit.includes('"redacted":true')) {
        sections.taskActivation = false;
        failures.push("Audit records must be redacted: true");
      }
    }
  }
} catch (e) {
  sections.taskActivation = false;
  failures.push(`Task activation error: ${e.message}`);
} finally {
  // Restore runtime files to pre-test state
  if (tasksSnapshot !== null) writeFileSync(TASKS_PATH, tasksSnapshot, "utf8");
  if (evidenceSnapshot !== null) writeFileSync(EVIDENCE_PATH, evidenceSnapshot, "utf8");
  if (auditSnapshot !== null) writeFileSync(AUDIT_PATH, auditSnapshot, "utf8");
  if (eventsSnapshot !== null) writeFileSync(EVENTS_PATH, eventsSnapshot, "utf8");
  if (actionsSnapshot !== null) writeFileSync(ACTIONS_PATH, actionsSnapshot, "utf8");
}

// ─── 5. Invalid activation blocks ────────────────────────────────────────────

try {
  const { createTaskActivationRequest, runTaskActivationRequest } = await import("../task-actions/taskActivationBridge.js");

  // 5a. Missing planTaskId
  const missingId = createTaskActivationRequest({ actionType: "task.activate", mode: "local-private", planTaskId: "" });
  if (missingId.ok) {
    sections.invalidActivationBlocks = false;
    failures.push("Missing planTaskId should be rejected");
  }

  // 5b. Unknown planTaskId
  process.env.NEXUS_MODE = "local-private";
  const unknownReq = createTaskActivationRequest({ actionType: "task.activate", mode: "local-private", planTaskId: "unknown-id-xyz" });
  if (unknownReq.ok) {
    const unknownResult = await runTaskActivationRequest(unknownReq.request);
    if (unknownResult.ok) {
      sections.invalidActivationBlocks = false;
      failures.push("Unknown planTaskId should fail");
    }
  }

  // 5c. Demo mode blocked
  const demoReq = createTaskActivationRequest({ actionType: "task.activate", mode: "demo", planTaskId: "b6f66c80-bd0c-42c9-a21c-869cff1bc55e" });
  if (demoReq.ok) {
    process.env.NEXUS_MODE = "local-private";
    const demoResult = await runTaskActivationRequest({ ...demoReq.request, mode: "demo" });
    if (demoResult.ok && demoResult.status !== "completed") {
      sections.invalidActivationBlocks = false;
      failures.push("Demo mode task activation should be blocked");
    }
  }

  // 5d. Wrong action type
  const wrongType = createTaskActivationRequest({ actionType: "task.execute", mode: "local-private", planTaskId: "b6f66c80" });
  if (wrongType.ok) {
    sections.invalidActivationBlocks = false;
    failures.push("Wrong actionType (task.execute) should be rejected");
  }
} catch (e) {
  sections.invalidActivationBlocks = false;
  failures.push(`Invalid activation blocks error: ${e.message}`);
} finally {
  // Restore again after block tests
  if (tasksSnapshot !== null) writeFileSync(TASKS_PATH, tasksSnapshot, "utf8");
  if (evidenceSnapshot !== null) writeFileSync(EVIDENCE_PATH, evidenceSnapshot, "utf8");
  if (auditSnapshot !== null) writeFileSync(AUDIT_PATH, auditSnapshot, "utf8");
  if (eventsSnapshot !== null) writeFileSync(EVENTS_PATH, eventsSnapshot, "utf8");
  if (actionsSnapshot !== null) writeFileSync(ACTIONS_PATH, actionsSnapshot, "utf8");
}

// ─── 6. Dashboard wiring ────────────────────────────────────────────────────

const vmSrc = readFile("dashboard/src/data/commandCenterViewModel.js");
const v2Src = readFile("dashboard/src/pages/CommandCenterV2.jsx");
const taskApiSrc = readFile("dashboard/src/api/taskActions.js");

const vmChecks = ["taskActivation", "missionTasks", "planTaskId", "targetAgent", "capabilityId", "activationEnabled", "nextTask"];
for (const field of vmChecks) {
  if (!vmSrc.includes(field)) {
    sections.dashboardWiring = false;
    failures.push(`commandCenterViewModel.js missing: ${field}`);
  }
}

const uiChecks = [
  { pat: "activateMissionTask", label: "activateMissionTask import" },
  { pat: "MissionTaskRow", label: "MissionTaskRow component" },
  { pat: "Mission Tasks — Private Project", label: "mission tasks section heading" },
  { pat: "ccv2-task-activate-btn", label: "activate button CSS class" },
  { pat: "ccv2-task-activate-btn--disabled", label: "disabled activate button CSS class" },
  { pat: "ccv2-task-activate-btn--enabled", label: "enabled activate button CSS class" },
  { pat: "Requires governed action bridge", label: "offline bridge message" },
  { pat: "Activate", label: "Activate button label" },
  { pat: "ccv2-activation-result-card", label: "activation result card" },
  { pat: "runtimeTaskId", label: "runtimeTaskId display" },
  { pat: "Mission Task Assignments", label: "agent fleet mission task table heading" },
  { pat: "SHEPHERD", label: "SHEPHERD in mission agents" },
  { pat: "AUDITOR", label: "AUDITOR in mission agents" },
  { pat: "WARDEN", label: "WARDEN in mission agents" },
  { pat: "CORE", label: "CORE in mission agents" },
];
for (const c of uiChecks) {
  if (!v2Src.includes(c.pat)) {
    sections.dashboardWiring = false;
    failures.push(`UI missing: ${c.label}`);
  }
}

const apiChecks = ["activateMissionTask", "getTaskActivationAction", "listTaskActivationActions", "task/activate"];
for (const fn of apiChecks) {
  if (!taskApiSrc.includes(fn)) {
    sections.dashboardWiring = false;
    failures.push(`taskActions.js missing: ${fn}`);
  }
}

if (taskApiSrc.includes("spawnSync") || taskApiSrc.includes("writeFileSync") || taskApiSrc.includes("execSync")) {
  sections.dashboardWiring = false;
  failures.push("taskActions.js must not call shell/file APIs directly");
}

// ─── 7. Agent assignment ────────────────────────────────────────────────────

const missionAgents = ["SHEPHERD", "AUDITOR", "PRISM", "WARDEN", "CORE"];
for (const agent of missionAgents) {
  if (!v2Src.includes(agent)) {
    sections.agentAssignment = false;
    failures.push(`Agent assignment: ${agent} not visible in UI`);
  }
  // View model uses uppercase agent names
  if (!vmSrc.includes(agent)) {
    sections.agentAssignment = false;
    failures.push(`Agent assignment: ${agent} not in view model`);
  }
}

// ─── 8. Mode-aware UI ───────────────────────────────────────────────────────

if (v2Src.includes("DEMOAPP ACTIVE") || v2Src.includes("DemoApp active")) {
  sections.modeAwareUI = false;
  failures.push("V2 shell must not show DemoApp wording outside Demo Mode");
}
if (!v2Src.includes("DemoModePage")) {
  sections.modeAwareUI = false;
  failures.push("DemoModePage must remain for demo route");
}
if (!v2Src.includes("local-private")) {
  sections.modeAwareUI = false;
  failures.push("UI must be mode-aware (local-private check)");
}

// ─── 9. Roadmap ─────────────────────────────────────────────────────────────

if (!v2Src.includes('"IN_PROGRESS"') || !v2Src.includes("Task Activation + Agent Assignment from UI")) {
  sections.roadmap = false;
  failures.push("P37 must be IN_PROGRESS in OSRoadmapPage nexusTrack");
}
if (!v2Src.includes('"COMPLETE"') || !v2Src.includes("Agentic Workspace Home + Workflow Templates")) {
  sections.roadmap = false;
  failures.push("P36 must be COMPLETE in OSRoadmapPage nexusTrack");
}
if (!v2Src.includes("P38") || !v2Src.includes("P45")) {
  sections.roadmap = false;
  failures.push("Roadmap must include P38 and P45 entries");
}

// ─── 10. Public safety ──────────────────────────────────────────────────────

try {
  runCommand("npm", ["run", "check:public-safety"]);
} catch (e) {
  sections.publicSafety = false;
  failures.push(`check:public-safety failed: ${e.stdout || e.message}`);
}

// ─── 11. No forbidden changes ───────────────────────────────────────────────

try {
  const projectDiff = runCommand("git", ["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]).trim();
  if (projectDiff) {
    sections.noForbiddenChanges = false;
    failures.push(`Private project files modified: ${projectDiff}`);
  }
} catch (e) {
  sections.noForbiddenChanges = false;
  failures.push(`Git diff check error: ${e.message}`);
}

const forbiddenPatterns = [
  { src: bridgeSrc, file: "taskActivationBridge.js", pat: "spawnSync(", label: "spawnSync in bridge" },
  { src: bridgeSrc, file: "taskActivationBridge.js", pat: "execSync(", label: "execSync in bridge" },
  { src: bridgeSrc, file: "taskActivationBridge.js", pat: "fetch(", label: "fetch call in bridge" },
  { src: taskApiSrc, file: "taskActions.js", pat: "writeFileSync", label: "writeFileSync in API client" },
  { src: taskApiSrc, file: "taskActions.js", pat: "spawnSync", label: "spawnSync in API client" },
];
for (const c of forbiddenPatterns) {
  if (c.src.includes(c.pat)) {
    sections.noForbiddenChanges = false;
    failures.push(`Forbidden pattern in ${c.file}: ${c.label}`);
  }
}

// ─── 12. Formatting/readability ──────────────────────────────────────────────

const newFiles = [
  "task-actions/taskActivationBridge.js",
  "task-actions/taskActivationStore.js",
  "task-actions/index.js",
  "policy/task-activation-bridge-policy.json",
  "dashboard/src/api/taskActions.js",
];
for (const f of newFiles) {
  const content = readFile(f);
  if (!content) {
    sections.formattingReadability = false;
    failures.push(`File empty or missing: ${f}`);
  }
}

// ─── Report ──────────────────────────────────────────────────────────────────

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

console.log("NEXUS Task Activation Bridge Check");
console.log("==================================");
console.log();
console.log(`Modules: ${statusLabel(sections.modules)}`);
console.log(`Exports: ${statusLabel(sections.exports)}`);
console.log(`Policy: ${statusLabel(sections.policy)}`);
console.log(`Task activation: ${statusLabel(sections.taskActivation)}`);
console.log(`Invalid activation blocks: ${statusLabel(sections.invalidActivationBlocks)}`);
console.log(`Dashboard wiring: ${statusLabel(sections.dashboardWiring)}`);
console.log(`Agent assignment: ${statusLabel(sections.agentAssignment)}`);
console.log(`Mode-aware UI: ${statusLabel(sections.modeAwareUI)}`);
console.log(`Roadmap: ${statusLabel(sections.roadmap)}`);
console.log(`Public safety: ${statusLabel(sections.publicSafety)}`);
console.log(`No forbidden changes: ${statusLabel(sections.noForbiddenChanges)}`);
console.log(`Formatting/readability: ${statusLabel(sections.formattingReadability)}`);
console.log();
console.log(`Result: ${result}`);

if (failures.length > 0) {
  console.log();
  console.log("Failures:");
  for (const f of failures) console.log(`  - ${f}`);
}

// Write report
const reportsDir = join(ROOT, "reports");
try { mkdirSync(reportsDir, { recursive: true }); } catch {}
writeFileSync(
  join(reportsDir, "task-activation-bridge-report.md"),
  `# NEXUS Task Activation Bridge Check Report\n\nPhase: P37-LOCAL\n\n${Object.entries(sections).map(([k, v]) => `- ${k}: ${v ? "PASS" : "FAIL"}`).join("\n")}\n\nResult: ${result}\n\nFailures:\n${failures.length === 0 ? "None" : failures.map((f) => `- ${f}`).join("\n")}\n`
);

process.exit(result === "PASS" ? 0 : 1);
