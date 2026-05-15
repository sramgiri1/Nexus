import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  addRoomParticipant,
  closeAgentRoom,
  createAgentRoom,
  ensureAgentRoomStore,
  getAgentRoom,
  listAgentRooms,
  saveAgentRoom,
  validateAgentRoom,
} from "../agent-mesh/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/agent-rooms-report.md");
const STORE_PATH = "local-state/runtime/agent-rooms.jsonl";
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
ensureAgentRoomStore({ storePath: STORE_PATH });
const room = createAgentRoom({
  roomId: "room-p48-validation",
  roomType: "validation_room",
  scope: "NEXUS_OS_CHANGE",
  projectId: "nexus-os",
  missionId: "p48-governed-agentic-mesh",
  taskId: "p48-3-agent-rooms",
  title: "P48 Validation Room",
  participants: ["NEXUS", "AUDITOR", "SENTINEL"],
  ownerAgent: "NEXUS",
  dataClassification: "internal",
});
const existing = getAgentRoom(room.roomId, { storePath: STORE_PATH });
const saveResult = existing ? { ok: true, written: false, room: existing, errors: [] } : saveAgentRoom(room, { storePath: STORE_PATH });
const participantResult = addRoomParticipant(room.roomId, "WARDEN", { storePath: STORE_PATH });
const closeResult = closeAgentRoom(room.roomId, { storePath: STORE_PATH });
const rooms = listAgentRooms({}, { storePath: STORE_PATH });
const currentRoom = getAgentRoom(room.roomId, { storePath: STORE_PATH });
const demoValidation = validateAgentRoom({ ...room, dataClassification: "local-private" }, { mode: "demo" });
const unknownParticipant = validateAgentRoom({ ...room, participants: ["UNKNOWN_AGENT"] });

addCheck("Room modules exist", ["agent-mesh/agentRooms.js", "agent-mesh/roomStore.js"].every((path) => existsSync(join(ROOT, path))));
addCheck("Store exists", existsSync(join(ROOT, STORE_PATH)));
addCheck("Room validates", validateAgentRoom(room).ok);
addCheck("Save room works", saveResult.ok);
addCheck("Participant update works", participantResult.ok && getAgentRoom(room.roomId, { storePath: STORE_PATH })?.participants.includes("WARDEN"));
addCheck("Close room works", closeResult.ok && currentRoom?.status === "closed");
addCheck("List/get rooms works", rooms.length >= 1 && currentRoom?.roomId === room.roomId);
addCheck("Demo/private room blocked", !demoValidation.ok);
addCheck("Unknown participant blocked", !unknownParticipant.ok);
addCheck("No unsafe payloads", !read(STORE_PATH).match(/api[_-]?key|password|-----BEGIN|raw source/i));
addCheck("Package script exists", packageJson.scripts?.["check-agent-rooms"] === "node scripts/check-agent-rooms.js");
addCheck("P48.2 complete", statusById.get("P48.2")?.status === "complete");
addCheck("P48.3 status visible", ["in_progress", "complete"].includes(statusById.get("P48.3")?.status));
addCheck("P48.4 next", phaseStatus.nextPhase === "P48.4" || statusById.get("P48.3")?.nextPhase === "P48.4");
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const report = `# Agent Rooms Report

## Metadata
- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P48.3 - Agent Rooms

## Summary
- Store path: ${STORE_PATH}
- Rooms visible: ${rooms.length}
- Validation room status: ${currentRoom?.status || "unknown"}
- Direct agent execution enabled: false
- Provider/tool/worker dispatch enabled: false
- DB writes enabled: false

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Next Phase
P48.4 - Handoff Protocol
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Agent Rooms Check\n=======================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
