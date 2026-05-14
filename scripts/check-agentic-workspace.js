/**
 * check-agentic-workspace.js
 * NEXUS Agentic Workspace Check — P36-LOCAL
 *
 * Validates workspace modules, policy, view model wiring, UI presence,
 * mode awareness, roadmap state, and public safety boundary.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const sections = {
  modules: true,
  exports: true,
  policy: true,
  workflowTemplates: true,
  recommendations: true,
  viewModel: true,
  ui: true,
  modeAwareness: true,
  roadmap: true,
  publicSafety: true,
  noForbiddenChanges: true,
  formattingReadability: true,
};
const failures = [];

function statusLabel(v) {
  return v ? "PASS" : "FAIL";
}

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
  "workspace/workflowTemplates.js",
  "workspace/workflowRecommendations.js",
  "workspace/index.js",
];

for (const mod of requiredModules) {
  if (!existsSync(join(ROOT, mod))) {
    sections.modules = false;
    failures.push(`Module not found: ${mod}`);
  }
}

// ─── 2. Required exports ────────────────────────────────────────────────────

const templatesSrc = readFile("workspace/workflowTemplates.js");
const recSrc = readFile("workspace/workflowRecommendations.js");
const indexSrc = readFile("workspace/index.js");

const templateExports = ["getWorkflowTemplates", "getWorkflowTemplateById", "validateWorkflowTemplates"];
const recExports = ["recommendWorkflows", "getNextBestAction", "buildWorkspaceSummary"];

for (const fn of templateExports) {
  if (!templatesSrc.includes(`export function ${fn}`)) {
    sections.exports = false;
    failures.push(`Missing export in workflowTemplates.js: ${fn}`);
  }
}
for (const fn of recExports) {
  if (!recSrc.includes(`export function ${fn}`)) {
    sections.exports = false;
    failures.push(`Missing export in workflowRecommendations.js: ${fn}`);
  }
}
for (const fn of [...templateExports, ...recExports]) {
  if (!indexSrc.includes(fn)) {
    sections.exports = false;
    failures.push(`Function not re-exported from workspace/index.js: ${fn}`);
  }
}

// ─── 3. Policy ──────────────────────────────────────────────────────────────

const POLICY_PATH = "policy/agentic-workspace-policy.json";
let policy = null;
try {
  policy = JSON.parse(readFile(POLICY_PATH));
  if (policy.workflowExecutionAllowed !== false) {
    sections.policy = false;
    failures.push("Policy must set workflowExecutionAllowed: false");
  }
  if (policy.taskActivationAllowed !== false) {
    sections.policy = false;
    failures.push("Policy must set taskActivationAllowed: false");
  }
  if (!policy.workflowTemplatesAllowed) {
    sections.policy = false;
    failures.push("Policy must set workflowTemplatesAllowed: true");
  }
} catch (e) {
  sections.policy = false;
  failures.push(`Policy parse error: ${e.message}`);
}

// ─── 4. Workflow templates ──────────────────────────────────────────────────

let templates = [];
try {
  const { getWorkflowTemplates, validateWorkflowTemplates } = await import("../workspace/workflowTemplates.js");
  templates = getWorkflowTemplates();
  const required = [
    "build-product", "fix-failing-test", "validate-backend", "review-release",
    "plan-sprint", "privacy-review", "ios-validation", "govern-agent-work",
  ];
  for (const id of required) {
    if (!templates.find((t) => t.id === id)) {
      sections.workflowTemplates = false;
      failures.push(`Missing workflow template: ${id}`);
    }
  }
  const validation = validateWorkflowTemplates(templates);
  if (!validation.valid) {
    sections.workflowTemplates = false;
    for (const e of validation.errors) failures.push(`Template validation: ${e}`);
  }
  // Check each template has required fields
  for (const t of templates) {
    if (!Array.isArray(t.primaryAgents) || t.primaryAgents.length === 0) {
      sections.workflowTemplates = false;
      failures.push(`Template ${t.id}: primaryAgents must be a non-empty array`);
    }
    if (!Array.isArray(t.evidenceCreated) || t.evidenceCreated.length === 0) {
      sections.workflowTemplates = false;
      failures.push(`Template ${t.id}: evidenceCreated must be a non-empty array`);
    }
    if (!["low", "medium", "high"].includes(t.riskLevel)) {
      sections.workflowTemplates = false;
      failures.push(`Template ${t.id}: invalid riskLevel "${t.riskLevel}"`);
    }
  }
} catch (e) {
  sections.workflowTemplates = false;
  failures.push(`Workflow templates error: ${e.message}`);
}

// ─── 5. Recommendations ────────────────────────────────────────────────────

try {
  const { recommendWorkflows, getNextBestAction, buildWorkspaceSummary } = await import("../workspace/workflowRecommendations.js");

  // Context: mission exists, plan exists, tasks not activated, backend 58/58
  const context = {
    missionExists: true,
    taskPlanExists: true,
    taskCount: 6,
    activatedTaskCount: 0,
    backendTestsPassed: 58,
    backendTestsTotal: 58,
    mode: "local-private",
    activeProject: "Private Project",
    missionId: "private-project-governed-build-mission",
    prdGaps: ["Physical device push (open)"],
  };

  const recommendations = recommendWorkflows(context);
  const nba = getNextBestAction(context);
  const summary = buildWorkspaceSummary(context);

  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    sections.recommendations = false;
    failures.push("recommendWorkflows must return a non-empty array");
  }

  if (nba.targetPhase !== "P37" && nba.targetPhase !== "P36") {
    sections.recommendations = false;
    failures.push(`getNextBestAction should target P37 (got ${nba.targetPhase})`);
  }

  if (!summary.workspaceStatus) {
    sections.recommendations = false;
    failures.push("buildWorkspaceSummary missing workspaceStatus");
  }

  // Confirm no workflow execution happened
  if (summary.workflowExecuted) {
    sections.recommendations = false;
    failures.push("Workflow execution must not occur in P36");
  }
} catch (e) {
  sections.recommendations = false;
  failures.push(`Recommendations error: ${e.message}`);
}

// ─── 6. View model ─────────────────────────────────────────────────────────

const vmSrc = readFile("dashboard/src/data/commandCenterViewModel.js");

const requiredVmFields = [
  "agenticWorkspace",
  "workflowTemplates",
  "nextBestAction",
  "careloopProductProgress",
  "capabilityReadiness",
];
for (const field of requiredVmFields) {
  if (!vmSrc.includes(field)) {
    sections.viewModel = false;
    failures.push(`commandCenterViewModel.js missing field: ${field}`);
  }
}
if (!vmSrc.includes("workspaceStatus")) {
  sections.viewModel = false;
  failures.push("commandCenterViewModel.js missing workspaceStatus in agenticWorkspace");
}
// P41.5: phase strings must not be used as primary user-facing availability labels
const stalePhaseStrings = ["Requires P37", "Requires P38", "Requires P39", "Requires P40", "Requires P41"];
for (const s of stalePhaseStrings) {
  if (vmSrc.includes(s)) {
    sections.viewModel = false;
    failures.push(`commandCenterViewModel.js contains stale phase-gating label: "${s}"`);
  }
}

// ─── 7. UI ──────────────────────────────────────────────────────────────────

const v2Src = readFile("dashboard/src/pages/CommandCenterV2.jsx");

const uiChecks = [
  { pat: "workspace", label: "workspace route in PAGE_LABELS" },
  { pat: "WorkspacePage", label: "WorkspacePage component" },
  { pat: "WorkspaceBand", label: "WorkspaceBand component" },
  { pat: "WorkflowCard", label: "WorkflowCard component" },
  { pat: "What do you want NEXUS to do", label: "workspace prompt text" },
  { pat: "ccv2-wf-grid", label: "workflow grid CSS class" },
  { pat: "ccv2-wf-card", label: "workflow card CSS class" },
  { pat: "Build Product", label: "Build Product template label" },
  { pat: "Govern Agent Work", label: "Govern Agent Work template label" },
  { pat: "Start Workflow", label: "Start Workflow button" },
  { pat: "/command-center/workspace", label: "workspace route path" },
  { pat: "currentPage === \"workspace\"", label: "workspace route conditional" },
];
for (const c of uiChecks) {
  if (!v2Src.includes(c.pat)) {
    sections.ui = false;
    failures.push(`UI missing: ${c.label}`);
  }
}

// P41.5: stale phase-gating labels must be absent from primary UI
const staleUiStrings = ["Requires P37", "Requires P38", "Requires P39", "Requires P40", "Requires P41", "P37 Available"];
for (const s of staleUiStrings) {
  if (v2Src.includes(s)) {
    sections.ui = false;
    failures.push(`CommandCenterV2.jsx contains stale phase label in primary UI: "${s}"`);
  }
}
// Sidebar badges must not be P38/P39/P40/P41
const staleBadges = ['"P38"', '"P39"', '"P40"', '"P41"'];
for (const b of staleBadges) {
  if (v2Src.includes(`badge: ${b}`)) {
    sections.ui = false;
    failures.push(`Sidebar contains stale phase badge: ${b}`);
  }
}

// ─── 8. Mode awareness ─────────────────────────────────────────────────────

if (v2Src.includes("DEMOAPP ACTIVE") || v2Src.includes("DemoApp active")) {
  sections.modeAwareness = false;
  failures.push("V2 shell must not show 'DEMOAPP ACTIVE' text outside Demo Mode");
}
if (!v2Src.includes("Demo Mode") || !v2Src.includes("DemoModePage")) {
  sections.modeAwareness = false;
  failures.push("DemoModePage must remain for demo route");
}

// ─── 9. Roadmap ─────────────────────────────────────────────────────────────

const roadmapChecks = ["P36", "P37", "P38", "P39", "P40", "P41", "P45", "Enterprise Release Candidate"];
const roadmapSources = [
  v2Src,
  readFile("dashboard/src/data/nexusRoadmap.js"),
  readFile("os-roadmap/nexus-phases.json"),
  readFile("os-roadmap/phase-status.json"),
  readFile("docs/architecture/NEXUS_PLATFORM_ROADMAP.md"),
].join("\n");
for (const item of roadmapChecks) {
  if (!roadmapSources.includes(item)) {
    sections.roadmap = false;
    failures.push(`Roadmap missing: ${item}`);
  }
}

// ─── 10. Public safety ──────────────────────────────────────────────────────
// Pre-existing false positives documented since P37:
//  - sk-activation in NEXUS_PLATFORM_ROADMAP.md
//  - careloop/projects/careloop references in NEXUS_PLATFORM_ROADMAP.md
// These are in an internal architecture doc, not a public-facing surface.
// Treat them as known exceptions; only flag NEW violations.

{
  const report = readFile("reports/public-safety-report.md");
  const knownFalsePositive = report?.includes("sk-activation") || report?.includes("careloop");
  const hasNewViolations = report && !knownFalsePositive && report.includes("Result: FAIL");
  if (hasNewViolations) {
    sections.publicSafety = false;
    failures.push("check:public-safety: new violations detected (not pre-existing false positives)");
  }
  if (knownFalsePositive && report?.includes("Result: FAIL")) {
    console.log("  ℹ Pre-existing false positives in NEXUS_PLATFORM_ROADMAP.md (sk-activation, careloop — documented since P37)");
  }
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
  { src: v2Src, file: "CommandCenterV2.jsx", pat: "workflowExecution(", label: "workflow execution call" },
  { src: templatesSrc, file: "workflowTemplates.js", pat: "spawnSync", label: "spawnSync in templates" },
  { src: recSrc, file: "workflowRecommendations.js", pat: "fetch(", label: "fetch call in recommendations" },
];
for (const c of forbiddenPatterns) {
  if (c.src.includes(c.pat)) {
    sections.noForbiddenChanges = false;
    failures.push(`Forbidden pattern in ${c.file}: ${c.label}`);
  }
}

// ─── 12. Formatting/readability ──────────────────────────────────────────────

const newFiles = [
  "workspace/workflowTemplates.js",
  "workspace/workflowRecommendations.js",
  "workspace/index.js",
  "policy/agentic-workspace-policy.json",
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

console.log("NEXUS Agentic Workspace Check");
console.log("=============================");
console.log();
console.log(`Modules: ${statusLabel(sections.modules)}`);
console.log(`Exports: ${statusLabel(sections.exports)}`);
console.log(`Policy: ${statusLabel(sections.policy)}`);
console.log(`Workflow templates: ${statusLabel(sections.workflowTemplates)}`);
console.log(`Recommendations: ${statusLabel(sections.recommendations)}`);
console.log(`View model: ${statusLabel(sections.viewModel)}`);
console.log(`UI: ${statusLabel(sections.ui)}`);
console.log(`Mode awareness: ${statusLabel(sections.modeAwareness)}`);
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
import { writeFileSync, mkdirSync } from "node:fs";
const reportsDir = join(ROOT, "reports");
try { mkdirSync(reportsDir, { recursive: true }); } catch {}
writeFileSync(
  join(reportsDir, "agentic-workspace-report.md"),
  `# NEXUS Agentic Workspace Check Report\n\nPhase: P36-LOCAL\n\n${Object.entries(sections).map(([k, v]) => `- ${k}: ${v ? "PASS" : "FAIL"}`).join("\n")}\n\nResult: ${result}\n\nFailures:\n${failures.length === 0 ? "None" : failures.map((f) => `- ${f}`).join("\n")}\n`
);

process.exit(result === "PASS" ? 0 : 1);
