/**
 * check-agent-workbench.js
 * Validates P38-LOCAL Agent Workbench + Human Review Loop implementation.
 * 13 sections — run: npm run check:agent-workbench
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
let pass = 0;
let fail = 0;
const failures = [];

function check(section, condition, detail = "") {
  if (condition) {
    console.log(`  ✓ ${section}`);
    pass++;
  } else {
    console.log(`  ✗ ${section}${detail ? ` — ${detail}` : ""}`);
    fail++;
    failures.push(`${section}${detail ? `: ${detail}` : ""}`);
  }
}

function readFile(relPath) {
  const full = join(ROOT, relPath);
  if (!existsSync(full)) return null;
  return readFileSync(full, "utf8");
}

function fileExists(relPath) {
  return existsSync(join(ROOT, relPath));
}

console.log("\nP38-LOCAL · Agent Workbench + Human Review Loop — 13 checks\n");

// ─── 1. Policy file ───────────────────────────────────────────────────────────
console.log("1. Policy file (policy/agent-workbench-policy.json)");
{
  const content = readFile("policy/agent-workbench-policy.json");
  check("File exists", content !== null);
  if (content) {
    const parsed = JSON.parse(content);
    check("Phase is P38-LOCAL", parsed.phase === "P38-LOCAL");
    check("taskExecutionAllowed: false", parsed.taskExecutionAllowed === false);
    check("reviewActionsAllowed: true", parsed.reviewActionsAllowed === true);
    check("allowedActionTypes includes task.review", Array.isArray(parsed.allowedActionTypes) && parsed.allowedActionTypes.includes("task.review"));
  }
}

// ─── 2. Review store ──────────────────────────────────────────────────────────
console.log("\n2. Review store (workbench/reviewStore.js)");
{
  const content = readFile("workbench/reviewStore.js");
  check("File exists", content !== null);
  if (content) {
    check("appendReviewRecord exported", content.includes("export function appendReviewRecord"));
    check("listReviewRecords exported", content.includes("export function listReviewRecords"));
    check("getReviewRecord exported", content.includes("export function getReviewRecord"));
    check("listReviewsForTask exported", content.includes("export function listReviewsForTask"));
    check("reviews.jsonl path referenced", content.includes("reviews.jsonl"));
    check("redacted: true on records", content.includes("redacted: true"));
  }
}

// ─── 3. Agent workbench data model ───────────────────────────────────────────
console.log("\n3. Agent workbench (workbench/agentWorkbench.js)");
{
  const content = readFile("workbench/agentWorkbench.js");
  check("File exists", content !== null);
  if (content) {
    check("loadActivatedTasks exported", content.includes("export function loadActivatedTasks"));
    check("loadTaskWorkbench exported", content.includes("export function loadTaskWorkbench"));
    check("buildAgentWorkbenchView exported", content.includes("export function buildAgentWorkbenchView"));
    check("validateAgentWorkbenchView exported", content.includes("export function validateAgentWorkbenchView"));
    check("listAgentWorkbenchItems exported", content.includes("export function listAgentWorkbenchItems"));
    check("mutationAllowed: false in view", content.includes("mutationAllowed: false"));
    check("executionAllowed: false in view", content.includes("executionAllowed: false"));
    check("agentExpectedOutput.available: false", content.includes("available: false"));
  }
}

// ─── 4. Review bridge ─────────────────────────────────────────────────────────
console.log("\n4. Review bridge (workbench/reviewBridge.js)");
{
  const content = readFile("workbench/reviewBridge.js");
  check("File exists", content !== null);
  if (content) {
    check("createReviewRequest exported", content.includes("export function createReviewRequest"));
    check("validateReviewRequest exported", content.includes("export function validateReviewRequest"));
    check("runReviewRequest exported", content.includes("export async function runReviewRequest"));
    check("getReviewResult exported", content.includes("export function getReviewResult"));
    check("buildReviewResponse exported", content.includes("export function buildReviewResponse"));
    check("ALLOWED_DECISIONS: approve/reject/request_changes", content.includes('"approve"') && content.includes('"reject"') && content.includes('"request_changes"'));
    check("EVIDENCE_RESULT_MAP present", content.includes("EVIDENCE_RESULT_MAP"));
    check("appendEvidence called", content.includes("appendEvidence"));
    check("appendAuditEvent called", content.includes("appendAuditEvent"));
  }
}

// ─── 5. Workbench index ───────────────────────────────────────────────────────
console.log("\n5. Workbench index (workbench/index.js)");
{
  const content = readFile("workbench/index.js");
  check("File exists", content !== null);
  if (content) {
    check("Exports from reviewStore", content.includes("reviewStore"));
    check("Exports from agentWorkbench", content.includes("agentWorkbench"));
    check("Exports from reviewBridge", content.includes("reviewBridge"));
  }
}

// ─── 6. Action server routes ──────────────────────────────────────────────────
console.log("\n6. Action server routes (scripts/mission-action-server.js)");
{
  const content = readFile("scripts/mission-action-server.js");
  check("File exists", content !== null);
  if (content) {
    check("POST /actions/workbench/review route", content.includes('"/actions/workbench/review"'));
    check("GET /workbench route", content.includes('url === "/workbench"'));
    check("GET /workbench/:taskId route", content.includes("url.startsWith(\"/workbench/\")"));
    check("GET /workbench/:taskId/reviews route", content.includes("/reviews$"));
    check("Imports createReviewRequest", content.includes("createReviewRequest"));
    check("Imports loadTaskWorkbench", content.includes("loadTaskWorkbench"));
  }
}

// ─── 7. Browser API client ────────────────────────────────────────────────────
console.log("\n7. Browser API client (dashboard/src/api/workbenchActions.js)");
{
  const content = readFile("dashboard/src/api/workbenchActions.js");
  check("File exists", content !== null);
  if (content) {
    check("reviewTask exported", content.includes("export async function reviewTask"));
    check("getReviewResult exported", content.includes("export async function getReviewResult"));
    check("listTaskReviews exported", content.includes("export async function listTaskReviews"));
    check("loadWorkbenchView exported", content.includes("export async function loadWorkbenchView"));
    check("listWorkbenchItems exported", content.includes("export async function listWorkbenchItems"));
    check("Uses fetch only (no Node.js imports)", !content.includes("import fs") && !content.includes("node:"));
    check("Offline fallback in reviewTask", content.includes("offline: true") || content.includes("Action bridge offline"));
  }
}

// ─── 8. View model ────────────────────────────────────────────────────────────
console.log("\n8. View model (dashboard/src/data/commandCenterViewModel.js)");
{
  const content = readFile("dashboard/src/data/commandCenterViewModel.js");
  check("File exists", content !== null);
  if (content) {
    check("agentWorkbench field present", content.includes("agentWorkbench:"));
    check("policyPhase: P38-LOCAL", content.includes('"P38-LOCAL"'));
    check("reviewPolicy present", content.includes("reviewPolicy:"));
    check("allowedDecisions present", content.includes("allowedDecisions:"));
    check("taskExecutionAllowed: false", content.includes("taskExecutionAllowed: false"));
  }
}

// ─── 9. UI nav item ───────────────────────────────────────────────────────────
console.log("\n9. UI nav item (dashboard/src/pages/CommandCenterV2.jsx)");
{
  const content = readFile("dashboard/src/pages/CommandCenterV2.jsx");
  check("File exists", content !== null);
  if (content) {
    check("Agent Workbench nav label", content.includes('"Agent Workbench"'));
    check("Workbench route /command-center/workbench", content.includes('"/command-center/workbench"'));
    check("workbench: Agent Workbench in PAGE_LABELS", content.includes("workbench: \"Agent Workbench\""));
  }
}

// ─── 10. WorkbenchPage component ──────────────────────────────────────────────
console.log("\n10. WorkbenchPage component");
{
  const content = readFile("dashboard/src/pages/CommandCenterV2.jsx");
  if (content) {
    check("WorkbenchPage function defined", content.includes("function WorkbenchPage("));
    check("listWorkbenchItems imported", content.includes("listWorkbenchItems"));
    check("loadWorkbenchView imported", content.includes("loadWorkbenchView"));
    check("reviewTask imported", content.includes("reviewTask"));
    check("Approve button", content.includes('"Approve"') || content.includes("Approve"));
    check("Request Changes button", content.includes("Request Changes"));
    check("Reject button", content.includes('"Reject"') || content.includes("Reject"));
    check("Review buttons disabled when bridge offline", content.includes("!bridgeOnline"));
    check("WorkbenchPage rendered in router", content.includes('"workbench" && <WorkbenchPage'));
    check("Open Workbench button in TaskQueuePage", content.includes("Open Workbench"));
  }
}

// ─── 11. CSS ──────────────────────────────────────────────────────────────────
console.log("\n11. CSS workbench classes (dashboard/src/styles-command-center-v2.css)");
{
  const content = readFile("dashboard/src/styles-command-center-v2.css");
  check("File exists", content !== null);
  if (content) {
    check(".ccv2-wb-layout defined", content.includes(".ccv2-wb-layout"));
    check(".ccv2-wb-sidebar defined", content.includes(".ccv2-wb-sidebar"));
    check(".ccv2-wb-task-item defined", content.includes(".ccv2-wb-task-item"));
    check(".ccv2-wb-review-panel defined", content.includes(".ccv2-wb-review-panel"));
    check(".ccv2-wb-review-actions defined", content.includes(".ccv2-wb-review-actions"));
    check(".ccv2-wb-review-btn--approve defined", content.includes(".ccv2-wb-review-btn--approve"));
    check(".ccv2-wb-review-btn--reject defined", content.includes(".ccv2-wb-review-btn--reject"));
    check(".ccv2-wb-review-btn--changes defined", content.includes(".ccv2-wb-review-btn--changes"));
    check(".ccv2-task-activate-btn--workbench defined", content.includes(".ccv2-task-activate-btn--workbench"));
  }
}

// ─── 12. E2E tests ────────────────────────────────────────────────────────────
console.log("\n12. E2E tests (dashboard/tests/routes.spec.js)");
{
  const content = readFile("dashboard/tests/routes.spec.js");
  check("File exists", content !== null);
  if (content) {
    check("Agent Workbench nav item test", content.includes("Agent Workbench nav item"));
    check("Agent Workbench page renders test", content.includes("Agent Workbench page renders"));
    check("Bridge offline state test", content.includes("bridge offline"));
    check("Go to Task Queue button test", content.includes("Go to Task Queue"));
    check("OS Roadmap P38 IN PROGRESS test", content.includes("P38 IN PROGRESS") || content.includes("P38 IN_PROGRESS") || content.includes("P37 COMPLETE"));
  }
}

// ─── 13. OS Roadmap P38 status ───────────────────────────────────────────────
console.log("\n13. OS Roadmap P38 status");
{
  const content = readFile("dashboard/src/pages/CommandCenterV2.jsx");
  if (content) {
    check("P37 shows COMPLETE", content.includes('"P37"') && content.includes('status: "COMPLETE"'));
    check("P38 shows IN_PROGRESS", content.includes('"P38"') && content.includes('status: "IN_PROGRESS"'));
    check("P38 detail mentions review loop", content.includes("review loop") || content.includes("approve/reject"));
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(60)}`);
console.log(`PASS: ${pass}   FAIL: ${fail}   TOTAL: ${pass + fail}`);
if (failures.length > 0) {
  console.log("\nFailed checks:");
  failures.forEach((f) => console.log(`  ✗ ${f}`));
  console.log("");
  process.exit(1);
} else {
  console.log("\nAll P38-LOCAL checks passed.\n");
}
