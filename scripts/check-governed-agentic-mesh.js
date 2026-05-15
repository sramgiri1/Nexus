import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildMeshContextSummary,
  createAgentMeshMessage,
  createAgentRoom,
  createHandoffRequest,
  listAgentMeshMessageTypes,
  validateAgentMeshMessage,
  validateAgentRoom,
} from "../agent-mesh/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/governed-agentic-mesh-report.md");
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
const policy = JSON.parse(read("policy/agent-mesh-policy.json") || "{}");
const meshSource = [
  "agent-mesh/messageContract.js",
  "agent-mesh/messageStore.js",
  "agent-mesh/messageBus.js",
  "agent-mesh/agentRooms.js",
  "agent-mesh/roomStore.js",
  "agent-mesh/handoffProtocol.js",
  "agent-mesh/contextSync.js",
].map(read).join("\n");
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const viewModelSource = read("dashboard/src/data/commandCenterViewModel.js");
const routeSource = read("dashboard/src/data/commandCenterRoutes.js");
const testsSource = read("dashboard/tests/routes.spec.js");
const docsSource = read("docs/architecture/GOVERNED_AGENTIC_MESH.md");
const reportSources = [
  "reports/agent-mesh-message-contract-report.md",
  "reports/agent-mesh-message-bus-report.md",
  "reports/agent-rooms-report.md",
  "reports/agent-handoff-protocol-report.md",
  "reports/agent-mesh-context-sync-report.md",
  "reports/command-center-ux-report.md",
].map(read).join("\n");
const sampleMessage = createAgentMeshMessage({
  messageId: "meshmsg-final-validation",
  roomId: "room-p48-final-validation",
  scope: "NEXUS_OS_CHANGE",
  projectId: "nexus-os",
  missionId: "p48-governed-agentic-mesh",
  taskId: "p48-7-final-validation",
  fromAgent: "NEXUS",
  toAgent: "AUDITOR",
  messageType: "review_request",
  capabilityId: "agent_mesh.final_validation",
  dataClassification: "internal",
  payloadSummary: "Request final governed mesh validation summary review.",
  policyDecision: "ALLOW_METADATA_ONLY",
});
const unsafeMessage = validateAgentMeshMessage({
  ...sampleMessage.message,
  payloadSummary: "raw source password api_key",
});
const sampleRoom = createAgentRoom({
  roomId: "room-p48-final-validation",
  roomType: "os_update_room",
  scope: "NEXUS_OS_CHANGE",
  projectId: "nexus-os",
  title: "P48 Final Validation Room",
  participants: ["NEXUS", "AUDITOR", "WARDEN"],
  ownerAgent: "NEXUS",
  dataClassification: "internal",
});
const sampleHandoff = createHandoffRequest(
  {
    handoffId: "handoff-p48-final-validation",
    roomId: sampleRoom.roomId,
    fromAgent: "NEXUS",
    toAgent: "AUDITOR",
    scope: "NEXUS_OS_CHANGE",
    projectId: "nexus-os",
    missionId: "p48-governed-agentic-mesh",
    taskId: "p48-7-final-validation",
    reason: "Request final validation evidence review.",
    requestedCapabilityId: "agent_mesh.final_validation",
    providedEvidenceIds: ["reports/governed-agentic-mesh-report.md"],
    requiredNextEvidence: ["final-validation-summary"],
    dataClassification: "internal",
    policyDecision: "ALLOW_METADATA_ONLY",
  },
  {
    handoffStorePath: "local-state/runtime/agent-handoffs-final-validation.jsonl",
    storePath: "local-state/runtime/agent-messages-final-validation.jsonl",
  },
);
rmSync(join(ROOT, "local-state/runtime/agent-handoffs-final-validation.jsonl"), { force: true });
rmSync(join(ROOT, "local-state/runtime/agent-messages-final-validation.jsonl"), { force: true });
const contextSummary = buildMeshContextSummary("room-p48-context-sync", {
  storePath: "local-state/runtime/agent-rooms.jsonl",
  mode: "local-private",
});

addCheck("Message contract", sampleMessage.ok && listAgentMeshMessageTypes().includes("handoff_request"));
addCheck("Unsafe message blocked", !unsafeMessage.ok);
addCheck("Agent rooms", validateAgentRoom(sampleRoom).ok);
addCheck("Handoff protocol", sampleHandoff.ok && sampleHandoff.handoff?.taskOwnershipMutated === false);
addCheck("Context sync", contextSummary.ok && contextSummary.summary?.rawContentIncluded === false);
addCheck("Command Center route", routeSource.includes("/command-center/agent-rooms") && commandCenterSource.includes("AgentRoomsPage"));
addCheck("Command Center copy", `${commandCenterSource}\n${viewModelSource}`.includes("Agents coordinate through NEXUS governance, not direct free chat."));
addCheck("Playwright coverage", testsSource.includes("Agent Rooms route shows governed mesh coordination"));
addCheck("Docs updated", docsSource.includes("P48.7") && docsSource.includes("Command Center Agent Rooms UX"));
addCheck("Reports exist", reportSources.includes("Validation HEAD") && reportSources.includes("Agent Mesh Context Sync Report"));
addCheck("Policy blocks execution", policy.directAgentChatAllowed === false && policy.providerCallsAllowed === false && policy.toolDispatchAllowed === false && policy.workerRuntimeAllowed === false);
addCheck("No direct agent chat", !meshSource.match(/direct free chat allowed|directAgentChatAllowed["']?\s*[:=]\s*true/i));
addCheck("No task mutation by mesh", !meshSource.match(/taskOwnershipMutated\s*[:=]\s*true|mutateTaskOwnership|transferTaskOwnership/i));
addCheck("No provider/tool/worker dispatch", !meshSource.match(/provider\.create|dispatchTool\(|startWorker\(|workerRuntimeAllowed\s*[:=]\s*true/i));
addCheck("No DB writes", !meshSource.match(/prisma\.|INSERT INTO|UPDATE .* SET|dbWritesAllowed\s*[:=]\s*true/i));
addCheck("No raw payload/source/secrets", !reportSources.match(/api[_-]?key|password|-----BEGIN/i));
addCheck("P48.1 complete", statusById.get("P48.1")?.status === "complete");
addCheck("P48.2 complete", statusById.get("P48.2")?.status === "complete");
addCheck("P48.3 complete", statusById.get("P48.3")?.status === "complete");
addCheck("P48.4 complete", statusById.get("P48.4")?.status === "complete");
addCheck("P48.5 complete", statusById.get("P48.5")?.status === "complete");
addCheck("P48.6 complete", statusById.get("P48.6")?.status === "complete");
addCheck("P48.7 visible", ["in_progress", "complete"].includes(statusById.get("P48.7")?.status));
addCheck("P49 next", phaseStatus.nextPhase === "P49" || statusById.get("P48.7")?.nextPhase === "P49");
addCheck("Package script exists", packageJson.scripts?.["check-governed-agentic-mesh"] === "node scripts/check-governed-agentic-mesh.js");
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const report = `# Governed Agentic Mesh Final Validation Report

## Metadata
- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P48.7 - Mesh Tests + Docs + Final Validation

## Summary
- Message contract: metadata-only, typed, scoped, redacted.
- Message bus: append-only local JSONL.
- Agent rooms: governed room metadata.
- Handoffs: request and decision records only; task ownership unchanged.
- Context sync: trusted context summaries only; raw context excluded.
- Command Center: Agent Rooms route is read-only.

## Safety
- Direct agent-to-agent free chat: disabled.
- Provider/tool/worker dispatch: disabled.
- DB writes: disabled.
- Project mutation: disabled.
- Raw payload/source/secrets: not allowed.

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Next Phase
P49 - Agent Definition Update Workflow
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Governed Agentic Mesh Check\n=================================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
