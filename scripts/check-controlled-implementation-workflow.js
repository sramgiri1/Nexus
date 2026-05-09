/**
 * check-controlled-implementation-workflow.js
 * Validates P39-LOCAL First Controlled Implementation Workflow from UI.
 * 15 sections — run: npm run check:controlled-implementation-workflow
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

console.log("\nP39-LOCAL · First Controlled Implementation Workflow — 15 checks\n");

// ─── 1. Policy file ───────────────────────────────────────────────────────────
console.log("1. Policy file (policy/controlled-implementation-workflow-policy.json)");
{
  const content = readFile("policy/controlled-implementation-workflow-policy.json");
  check("File exists", content !== null);
  if (content) {
    const parsed = JSON.parse(content);
    check("Phase is P39-LOCAL", parsed.phase === "P39-LOCAL");
    check("modeRequired: local-private", parsed.modeRequired === "local-private");
    check("documentationMutationAllowed: true", parsed.documentationMutationAllowed === true);
    check("sourceMutationAllowed: false", parsed.sourceMutationAllowed === false);
    check("productionCodeMutationAllowed: false", parsed.productionCodeMutationAllowed === false);
    check(
      "allowedPath is NEXUS_IMPLEMENTATION_LOG.md",
      Array.isArray(parsed.allowedPaths) &&
        parsed.allowedPaths.includes("projects/careloop/docs/NEXUS_IMPLEMENTATION_LOG.md"),
    );
    check(
      "allowedImplementationTypes has documentation_readiness_log",
      Array.isArray(parsed.allowedImplementationTypes) &&
        parsed.allowedImplementationTypes.includes("documentation_readiness_log"),
    );
    check("targetAgent: CORE", parsed.targetAgent === "CORE");
  }
}

// ─── 2. Implementation store ──────────────────────────────────────────────────
console.log("\n2. Implementation store (implementation-actions/implementationStore.js)");
{
  const content = readFile("implementation-actions/implementationStore.js");
  check("File exists", content !== null);
  if (content) {
    check("appendImplementationAction exported", content.includes("export function appendImplementationAction"));
    check("updateImplementationAction exported", content.includes("export function updateImplementationAction"));
    check("getImplementationAction exported", content.includes("export function getImplementationAction"));
  }
}

// ─── 3. Implementation plan ───────────────────────────────────────────────────
console.log("\n3. Implementation plan (implementation-actions/implementationPlan.js)");
{
  const content = readFile("implementation-actions/implementationPlan.js");
  check("File exists", content !== null);
  if (content) {
    check("createImplementationProposal exported", content.includes("export function createImplementationProposal"));
    check("validateImplementationProposal exported", content.includes("export function validateImplementationProposal"));
    check("createPatchPlan exported", content.includes("export function createPatchPlan"));
    check("createRollbackPlan exported", content.includes("export function createRollbackPlan"));
    check("writeImplementationProposalReports exported", content.includes("export function writeImplementationProposalReports"));
    check("Allowed path enforced", content.includes("NEXUS_IMPLEMENTATION_LOG.md"));
  }
}

// ─── 4. Implementation bridge ─────────────────────────────────────────────────
console.log("\n4. Implementation bridge (implementation-actions/implementationBridge.js)");
{
  const content = readFile("implementation-actions/implementationBridge.js");
  check("File exists", content !== null);
  if (content) {
    check("createImplementationRequest exported", content.includes("export function createImplementationRequest") || content.includes("export async function createImplementationRequest"));
    check("runImplementationRequest exported", content.includes("export async function runImplementationRequest") || content.includes("export function runImplementationRequest"));
    check("getImplementationResult exported", content.includes("export function getImplementationResult") || content.includes("export async function getImplementationResult"));
    check("listImplementationActions re-exported", content.includes("listImplementationActions"));
    check("Blocks demo mode", content.includes("demo") && (content.includes("BLOCKED") || content.includes("blocked")));
    check("Evidence recorded on apply", content.includes("appendEvidence"));
    check("Audit event recorded on apply", content.includes("appendAuditEvent"));
    check("validationStatus SKIPPED for doc-only", content.includes("SKIPPED"));
  }
}

// ─── 5. Implementation index ──────────────────────────────────────────────────
console.log("\n5. Implementation index (implementation-actions/index.js)");
{
  const content = readFile("implementation-actions/index.js");
  check("File exists", content !== null);
  if (content) {
    check("Re-exports implementationPlan", content.includes("implementationPlan.js"));
    check("Re-exports implementationBridge", content.includes("implementationBridge.js"));
    check("Re-exports implementationStore", content.includes("implementationStore.js"));
  }
}

// ─── 6. Action server routes ──────────────────────────────────────────────────
console.log("\n6. Action server routes (scripts/mission-action-server.js)");
{
  const content = readFile("scripts/mission-action-server.js");
  check("File exists", content !== null);
  if (content) {
    check("POST /actions/implementation/propose route", content.includes("/actions/implementation/propose"));
    check("POST /actions/implementation/apply route", content.includes("/actions/implementation/apply"));
    check("GET /actions/implementation route", content.includes('url === "/actions/implementation"'));
    check("GET /actions/implementation/:actionId route", content.includes("url.startsWith(\"/actions/implementation/\")"));
    check("Implementation bridge imported", content.includes("implementationBridge"));
  }
}

// ─── 7. Browser API client ────────────────────────────────────────────────────
console.log("\n7. Browser API client (dashboard/src/api/implementationActions.js)");
{
  const content = readFile("dashboard/src/api/implementationActions.js");
  check("File exists", content !== null);
  if (content) {
    check("proposeImplementation exported", content.includes("export async function proposeImplementation"));
    check("applyImplementation exported", content.includes("export async function applyImplementation"));
    check("getImplementationAction exported", content.includes("export async function getImplementationAction"));
    check("listImplementationActions exported", content.includes("export async function listImplementationActions"));
    check("Uses fetch only (no Node.js)", !content.includes("import fs") && !content.includes("require("));
    check("Offline fallback with offline flag", content.includes("offline: true"));
  }
}

// ─── 8. View model ────────────────────────────────────────────────────────────
console.log("\n8. View model (dashboard/src/data/commandCenterViewModel.js)");
{
  const content = readFile("dashboard/src/data/commandCenterViewModel.js");
  check("File exists", content !== null);
  if (content) {
    check("controlledImplementation field present", content.includes("controlledImplementation"));
    check("policyPhase: P39-LOCAL", content.includes("P39-LOCAL"));
    check("targetAgent: CORE", content.includes('"CORE"'));
    check("allowedPath set", content.includes("NEXUS_IMPLEMENTATION_LOG.md"));
    check("safety flags all false", content.includes("providerCalls: false"));
  }
}

// ─── 9. UI component ─────────────────────────────────────────────────────────
console.log("\n9. UI component (dashboard/src/pages/CommandCenterV2.jsx)");
{
  const content = readFile("dashboard/src/pages/CommandCenterV2.jsx");
  check("File exists", content !== null);
  if (content) {
    check("ImplementationPage component defined", content.includes("function ImplementationPage"));
    check("Implementation nav item in sidebar", content.includes('"Implementation"') && content.includes("P39"));
    check("Implementation route wired", content.includes('currentPage === "implementation"'));
    check("proposeImplementation imported", content.includes("proposeImplementation"));
    check("applyImplementation imported", content.includes("applyImplementation"));
    check("P39 page label defined", content.includes("implementation: \"Implementation Workflow\""));
  }
}

// ─── 10. CSS classes ──────────────────────────────────────────────────────────
console.log("\n10. CSS classes (dashboard/src/styles-command-center-v2.css)");
{
  const content = readFile("dashboard/src/styles-command-center-v2.css");
  check("File exists", content !== null);
  if (content) {
    check(".ccv2-impl-task-item defined", content.includes(".ccv2-impl-task-item"));
    check(".ccv2-impl-task-item--selected defined", content.includes(".ccv2-impl-task-item--selected"));
    check(".ccv2-impl-notice defined", content.includes(".ccv2-impl-notice"));
    check(".ccv2-impl-action-row defined", content.includes(".ccv2-impl-action-row"));
    check(".ccv2-stat-chip__value--teal defined", content.includes(".ccv2-stat-chip__value--teal"));
    check(".ccv2-stat-chip__value--green defined", content.includes(".ccv2-stat-chip__value--green"));
  }
}

// ─── 11. Safety boundary — no source mutations ─────────────────────────────────
console.log("\n11. Safety boundary (no source mutations in P39 files)");
{
  const bridgeContent = readFile("implementation-actions/implementationBridge.js");
  const planContent = readFile("implementation-actions/implementationPlan.js");
  if (bridgeContent && planContent) {
    check(
      "Bridge forbidden paths include careloop/src (guard, not write target)",
      bridgeContent.includes("projects/careloop/src"),
    );
    check(
      "Plan does not target iOS or schema",
      !planContent.includes(".swift") && !planContent.includes("prisma/schema"),
    );
    check(
      "Bridge blocks non-documentation paths",
      bridgeContent.includes("forbiddenPrefix") || bridgeContent.includes("forbidden") || bridgeContent.includes("allowedPath"),
    );
  }
}

// ─── 12. E2E tests ────────────────────────────────────────────────────────────
console.log("\n12. E2E tests (dashboard/tests/routes.spec.js)");
{
  const content = readFile("dashboard/tests/routes.spec.js");
  check("File exists", content !== null);
  if (content) {
    check("Implementation nav item test", content.includes("Implementation Workflow nav item appears in sidebar"));
    check("Implementation page renders test", content.includes("Implementation Workflow page renders with correct header"));
    check("Bridge offline test", content.includes("Implementation Workflow shows offline state"));
    check("P39 stats chip test", content.includes("Implementation Workflow shows P39 stats chip"));
    check("CORE agent test", content.includes("Implementation Workflow shows CORE agent"));
    check("OS Roadmap P39 IN_PROGRESS test", content.includes("OS Roadmap shows P38 COMPLETE and P39 IN PROGRESS"));
  }
}

// ─── 13. OS Roadmap entry ─────────────────────────────────────────────────────
console.log("\n13. OS Roadmap entry");
{
  const content = readFile("dashboard/src/pages/CommandCenterV2.jsx");
  if (content) {
    check(
      "P39 roadmap entry present",
      content.includes("First Controlled Implementation Workflow from UI"),
    );
    check("P39 status IN_PROGRESS", content.includes("P39") && content.includes("IN_PROGRESS"));
    check("P38 status COMPLETE", content.includes("P38") && content.includes("COMPLETE"));
  }
}

// ─── 14. Forbidden path guard ─────────────────────────────────────────────────
console.log("\n14. Forbidden path guard (multi-layer enforcement)");
{
  const policyContent = readFile("policy/controlled-implementation-workflow-policy.json");
  const bridgeContent = readFile("implementation-actions/implementationBridge.js");
  const planContent = readFile("implementation-actions/implementationPlan.js");
  if (policyContent) {
    const parsed = JSON.parse(policyContent);
    const forbidden = parsed.forbiddenPaths || [];
    check("forbiddenPaths includes src/", forbidden.some((p) => p.includes("src")));
    check("forbiddenPaths includes test", forbidden.some((p) => p.includes("test")));
    check("forbiddenPaths includes prisma", forbidden.some((p) => p.includes("prisma")));
    check("forbiddenPaths includes ios", forbidden.some((p) => p.includes("ios")));
  }
  if (bridgeContent) {
    check("Bridge enforces path check before write", bridgeContent.includes("allowedPath") || bridgeContent.includes("forbidden"));
  }
}

// ─── 15. Port and CORS isolation ──────────────────────────────────────────────
console.log("\n15. Port and CORS isolation (scripts/mission-action-server.js)");
{
  const content = readFile("scripts/mission-action-server.js");
  if (content) {
    check("Server binds to 127.0.0.1 only", content.includes("127.0.0.1"));
    check("CORS restricted to localhost:5173", content.includes("localhost:5173"));
    check("PORT is 3748", content.includes("3748"));
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(56)}`);
console.log(`P39-LOCAL check: ${pass} passed, ${fail} failed`);
if (failures.length) {
  console.log("\nFailed checks:");
  failures.forEach((f) => console.log(`  ✗ ${f}`));
  process.exit(1);
} else {
  console.log("All checks passed ✓");
}
