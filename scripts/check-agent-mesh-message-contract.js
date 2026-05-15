import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  createAgentMeshMessage,
  isAllowedMeshMessageType,
  listAgentMeshMessageTypes,
  normalizeAgentMeshMessage,
  validateAgentMeshMessage,
} from "../agent-mesh/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/agent-mesh-message-contract-report.md");
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
const policy = JSON.parse(read("policy/agent-mesh-policy.json") || "{}");
const phaseStatus = JSON.parse(read("os-roadmap/phase-status.json") || "{}");
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const sample = createAgentMeshMessage({
  roomId: "room-private-project-validation",
  scope: "PROJECT_CHANGE",
  projectId: "private-project",
  missionId: "private-project-governed-build-mission",
  taskId: "task-validation-summary",
  fromAgent: "SENTINEL",
  toAgent: "AUDITOR",
  messageType: "evidence_request",
  capabilityId: "verification.qa_gate",
  payloadSummary: "Request redacted evidence summary for governed validation review.",
  requiresApproval: false,
});
const invalidType = createAgentMeshMessage({
  roomId: "room-invalid",
  fromAgent: "CORE",
  toAgent: "AUDITOR",
  messageType: "free_chat",
  payloadSummary: "Unsafe free chat attempt.",
});
const unsafePayload = validateAgentMeshMessage(normalizeAgentMeshMessage({
  roomId: "room-unsafe",
  fromAgent: "CORE",
  toAgent: "AUDITOR",
  messageType: "context_update",
  payloadSummary: "api_key=secret",
}));
const demoPrivate = createAgentMeshMessage({
  roomId: "room-demo-private",
  fromAgent: "CORE",
  toAgent: "AUDITOR",
  messageType: "context_update",
  payloadSummary: "Private project context summary.",
  dataClassification: "local-private",
  mode: "demo",
});

addCheck("Modules exist", ["agent-mesh/messageContract.js", "agent-mesh/messageTypes.js", "agent-mesh/index.js"].every((path) => existsSync(join(ROOT, path))));
addCheck("Required message types", ["clarification_request", "handoff_request", "evidence_request", "review_request", "context_update", "blocker_report", "approval_request", "validation_request", "implementation_ready", "failure_report"].every((type) => listAgentMeshMessageTypes().includes(type)));
addCheck("Allowed type helper", isAllowedMeshMessageType("handoff_request") && !isAllowedMeshMessageType("free_chat"));
addCheck("Sample message validates", sample.ok && validateAgentMeshMessage(sample.message).ok);
addCheck("Unknown type blocked", !invalidType.ok);
addCheck("Unsafe payload blocked", !unsafePayload.ok);
addCheck("Demo/private message blocked", !demoPrivate.ok);
addCheck("Raw payload storage blocked", sample.message?.rawPayloadStored === false && sample.message?.redacted === true);
addCheck("Policy blocks execution", policy.providerCallsAllowed === false && policy.toolDispatchAllowed === false && policy.workerRuntimeAllowed === false && policy.dbWritesAllowed === false && policy.projectMutationAllowed === false && policy.taskStateMutationAllowed === false);
addCheck("Package script exists", packageJson.scripts?.["check-agent-mesh-message-contract"] === "node scripts/check-agent-mesh-message-contract.js");
addCheck("P48.1 status visible", ["in_progress", "complete"].includes(statusById.get("P48.1")?.status));
addCheck("P48.2 next", phaseStatus.nextPhase === "P48.2" || statusById.get("P48.1")?.nextPhase === "P48.2");
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const report = `# Agent Mesh Message Contract Report

## Metadata
- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P48.1 - Agent Message Contract

## Summary
- Message types: ${listAgentMeshMessageTypes().length}
- Sample message ID: ${sample.message?.messageId || "not-created"}
- Raw payload storage allowed: false
- Direct agent chat allowed: false
- Provider/tool/worker dispatch enabled: false
- DB writes enabled: false
- Project/task mutation enabled: false

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Next Phase
P48.2 - Agent Message Bus
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Agent Mesh Message Contract Check\n======================================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
