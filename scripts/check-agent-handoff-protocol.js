import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  approveHandoff,
  createHandoffRequest,
  listHandoffs,
  rejectHandoff,
  validateHandoffRequest,
} from "../agent-mesh/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/agent-handoff-protocol-report.md");
const HANDOFF_STORE = "local-state/runtime/agent-handoffs.jsonl";
const MESSAGE_STORE = "local-state/runtime/agent-messages.jsonl";
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
const handoffResult = createHandoffRequest(
  {
    handoffId: "handoff-p48-validation",
    roomId: "room-p48-validation",
    fromAgent: "SHEPHERD",
    toAgent: "AUDITOR",
    scope: "NEXUS_OS_CHANGE",
    projectId: "nexus-os",
    missionId: "p48-governed-agentic-mesh",
    taskId: "p48-4-handoff-protocol",
    reason: "Request governed review of mesh handoff evidence.",
    requestedCapabilityId: "agent_mesh.handoff.review",
    providedEvidenceIds: ["evidence-p48-4-validation"],
    requiredNextEvidence: ["handoff-decision-record"],
    dataClassification: "internal",
    policyDecision: "ALLOW_METADATA_ONLY",
  },
  { handoffStorePath: HANDOFF_STORE, storePath: MESSAGE_STORE },
);
const approvalResult = approveHandoff("handoff-p48-validation", { handoffStorePath: HANDOFF_STORE });
const rejectionSeed = createHandoffRequest(
  {
    handoffId: "handoff-p48-reject-validation",
    roomId: "room-p48-validation",
    fromAgent: "CORE",
    toAgent: "WARDEN",
    scope: "NEXUS_OS_CHANGE",
    projectId: "nexus-os",
    missionId: "p48-governed-agentic-mesh",
    taskId: "p48-4-handoff-protocol",
    reason: "Request policy review for a blocked handoff scenario.",
    requestedCapabilityId: "agent_mesh.handoff.policy_review",
    providedEvidenceIds: [],
    requiredNextEvidence: ["policy-review-record"],
    dataClassification: "internal",
    policyDecision: "ALLOW_METADATA_ONLY",
  },
  { handoffStorePath: HANDOFF_STORE, storePath: MESSAGE_STORE },
);
const rejectResult = rejectHandoff("handoff-p48-reject-validation", "Rejected by validation scenario.", { handoffStorePath: HANDOFF_STORE });
const handoffs = listHandoffs({}, { handoffStorePath: HANDOFF_STORE });
const approved = handoffs.find((handoff) => handoff.handoffId === "handoff-p48-validation");
const rejected = handoffs.find((handoff) => handoff.handoffId === "handoff-p48-reject-validation");
const crossScopeBlocked = validateHandoffRequest({
  ...approved,
  handoffId: "handoff-cross-scope-blocked",
  sourceScope: "PROJECT_CHANGE",
  targetScope: "NEXUS_OS_CHANGE",
  scope: "PROJECT_CHANGE",
  status: "requested",
  taskOwnershipMutated: false,
  redacted: true,
});
const sensitiveBlocked = validateHandoffRequest({
  ...approved,
  handoffId: "handoff-sensitive-blocked",
  dataClassification: "confidential",
  requiresHumanReview: false,
  status: "requested",
  taskOwnershipMutated: false,
  redacted: true,
});

addCheck("Handoff module exists", existsSync(join(ROOT, "agent-mesh/handoffProtocol.js")));
addCheck("Create handoff works", handoffResult.ok && handoffResult.handoff?.taskOwnershipMutated === false);
addCheck("Handoff creates mesh message", handoffResult.ok && handoffResult.message?.messageType === "handoff_request");
addCheck("Approve handoff works", approvalResult.ok && approved?.status === "approved");
addCheck("Reject handoff works", rejectionSeed.ok && rejectResult.ok && rejected?.status === "rejected");
addCheck("List handoffs works", handoffs.length >= 2);
addCheck("Cross-scope handoff blocked", !crossScopeBlocked.ok);
addCheck("Sensitive handoff requires review", !sensitiveBlocked.ok);
addCheck("No task ownership mutation", handoffs.every((handoff) => handoff.taskOwnershipMutated === false));
addCheck("No unsafe payloads", !read(HANDOFF_STORE).match(/api[_-]?key|password|-----BEGIN|raw source/i));
addCheck("Package script exists", packageJson.scripts?.["check-agent-handoff-protocol"] === "node scripts/check-agent-handoff-protocol.js");
addCheck("P48.3 complete", statusById.get("P48.3")?.status === "complete");
addCheck("P48.4 status visible", ["in_progress", "complete"].includes(statusById.get("P48.4")?.status));
addCheck("P48.5 next", phaseStatus.nextPhase === "P48.5" || statusById.get("P48.4")?.nextPhase === "P48.5");
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const report = `# Agent Handoff Protocol Report

## Metadata
- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P48.4 - Handoff Protocol

## Summary
- Handoff store: ${HANDOFF_STORE}
- Handoffs visible: ${handoffs.length}
- Task ownership mutation enabled: false
- Provider/tool/worker dispatch enabled: false
- DB writes enabled: false

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Next Phase
P48.5 - Context Sync Through Policy
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Agent Handoff Protocol Check\n===================================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
