import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  appendMeshMessage,
  createAgentMeshMessage,
  ensureMeshMessageStore,
  getMeshMessage,
  listMeshMessages,
  listMessagesForAgent,
  listMessagesForRoom,
  listMessagesForTask,
  summarizeMeshMessages,
} from "../agent-mesh/index.js";
import { logActivityDryRun } from "../observability/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/agent-mesh-message-bus-report.md");
const STORE_PATH = "local-state/runtime/agent-messages.jsonl";
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

ensureMeshMessageStore({ storePath: STORE_PATH });
const created = createAgentMeshMessage({
  messageId: "meshmsg-p48-2-validation",
  roomId: "room-p48-validation",
  scope: "NEXUS_OS_CHANGE",
  projectId: "nexus-os",
  missionId: "p48-governed-agentic-mesh",
  taskId: "p48-2-message-bus",
  fromAgent: "NEXUS",
  toAgent: "AUDITOR",
  messageType: "review_request",
  capabilityId: "governance.mesh_review",
  dataClassification: "internal",
  payloadSummary: "Request redacted review of governed mesh message bus validation.",
});
const existingMessage = getMeshMessage("meshmsg-p48-2-validation", { storePath: STORE_PATH });
const appendResult = existingMessage
  ? { ok: true, written: false, message: existingMessage, errors: [] }
  : appendMeshMessage(created.message, { storePath: STORE_PATH });
const allMessages = listMeshMessages({}, { storePath: STORE_PATH });
const found = getMeshMessage("meshmsg-p48-2-validation", { storePath: STORE_PATH });
const summary = summarizeMeshMessages(allMessages);
const activityDryRun = logActivityDryRun({
  category: "agent",
  eventType: "agent_message_created",
  summary: "Governed agent mesh message recorded in append-only store.",
  scope: "NEXUS_OS_CHANGE",
  source: "system",
  status: "success",
  metadata: { messageId: "meshmsg-p48-2-validation" },
});

addCheck("Message bus modules exist", ["agent-mesh/messageBus.js", "agent-mesh/messageStore.js"].every((path) => existsSync(join(ROOT, path))));
addCheck("Message store exists", existsSync(join(ROOT, STORE_PATH)));
addCheck("Append result", appendResult.ok && (appendResult.written || existingMessage));
addCheck("List filters work", listMeshMessages({ messageType: "review_request" }, { storePath: STORE_PATH }).some((message) => message.messageId === "meshmsg-p48-2-validation"));
addCheck("Message lookup works", found?.messageId === "meshmsg-p48-2-validation");
addCheck("Room/task/agent filters work", listMessagesForRoom("room-p48-validation", { storePath: STORE_PATH }).length >= 1 && listMessagesForTask("p48-2-message-bus", { storePath: STORE_PATH }).length >= 1 && listMessagesForAgent("AUDITOR", { storePath: STORE_PATH }).length >= 1);
addCheck("Records are redacted", allMessages.every((message) => message.redacted === true && message.rawPayloadStored === false));
addCheck("No unsafe payloads", !read(STORE_PATH).match(/api[_-]?key|password|-----BEGIN|raw source/i));
addCheck("Activity dry-run available", activityDryRun.ok && activityDryRun.dryRun === true);
addCheck("Package script exists", packageJson.scripts?.["check-agent-mesh-message-bus"] === "node scripts/check-agent-mesh-message-bus.js");
addCheck("P48.1 complete", statusById.get("P48.1")?.status === "complete");
addCheck("P48.2 status visible", ["in_progress", "complete"].includes(statusById.get("P48.2")?.status));
addCheck("P48.3 next", phaseStatus.nextPhase === "P48.3" || statusById.get("P48.2")?.nextPhase === "P48.3");
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const report = `# Agent Mesh Message Bus Report

## Metadata
- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P48.2 - Agent Message Bus

## Summary
- Store path: ${STORE_PATH}
- Messages listed: ${allMessages.length}
- Message types recorded: ${Object.keys(summary.byType).length}
- Activity logger dry-run available: ${activityDryRun.ok}
- Raw payload storage enabled: false
- Provider/tool/worker dispatch enabled: false
- DB writes enabled: false

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Next Phase
P48.3 - Agent Rooms
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Agent Mesh Message Bus Check\n==================================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
