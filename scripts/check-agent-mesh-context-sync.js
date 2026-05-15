import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildMeshContextSummary,
  createContextSyncRequest,
  listAllowedContextForRoom,
  listExcludedContextForRoom,
  saveAgentRoom,
  validateContextSyncRequest,
} from "../agent-mesh/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/agent-mesh-context-sync-report.md");
const ROOM_STORE = "local-state/runtime/agent-rooms.jsonl";
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
const roomResult = saveAgentRoom(
  {
    roomId: "room-p48-context-sync",
    roomType: "os_update_room",
    scope: "NEXUS_OS_CHANGE",
    projectId: "nexus-os",
    missionId: "p48-governed-agentic-mesh",
    taskId: "p48-5-context-sync",
    title: "P48 Context Sync Room",
    participants: ["NEXUS", "WARDEN", "AUDITOR"],
    ownerAgent: "NEXUS",
    dataClassification: "internal",
  },
  { storePath: ROOM_STORE },
);
const request = createContextSyncRequest({
  roomId: "room-p48-context-sync",
  scope: "NEXUS_OS_CHANGE",
  projectId: "nexus-os",
  taskId: "p48-5-context-sync",
  agentId: "NEXUS",
  capabilityId: "agent_mesh.context_sync",
  mode: "local-private",
});
const unsafeRequest = validateContextSyncRequest({ ...request, summariesOnly: false, includeRawContext: true });
const demoRequest = validateContextSyncRequest({ ...request, mode: "demo", projectId: "private-project" });
const contextSummary = buildMeshContextSummary("room-p48-context-sync", { storePath: ROOM_STORE, mode: "local-private" });
const allowed = listAllowedContextForRoom("room-p48-context-sync", { storePath: ROOM_STORE, mode: "local-private" });
const excluded = listExcludedContextForRoom("room-p48-context-sync", { storePath: ROOM_STORE, mode: "local-private" });

addCheck("Context sync module exists", existsSync(join(ROOT, "agent-mesh/contextSync.js")));
addCheck("Room seed works", roomResult.ok);
addCheck("Request validates", validateContextSyncRequest(request).ok);
addCheck("Raw context blocked", !unsafeRequest.ok);
addCheck("Demo/private context blocked", !demoRequest.ok);
addCheck("Context summary builds", contextSummary.ok && contextSummary.summary?.rawContentIncluded === false);
addCheck("Allowed context is summary-only", allowed.length > 0 && allowed.every((source) => source.summaryOnly === true && source.redacted === true));
addCheck("Excluded context explains policy", excluded.length > 0 && excluded.every((source) => Array.isArray(source.reasons)));
addCheck("Stale context is identified", Array.isArray(contextSummary.staleContext));
addCheck("No raw payloads", !JSON.stringify(contextSummary).match(/api[_-]?key|password|-----BEGIN|raw source/i));
addCheck("No runtime injection", contextSummary.summary?.runtimeAgentInjectionAllowed === false);
addCheck("Package script exists", packageJson.scripts?.["check-agent-mesh-context-sync"] === "node scripts/check-agent-mesh-context-sync.js");
addCheck("P48.4 complete", statusById.get("P48.4")?.status === "complete");
addCheck("P48.5 status visible", ["in_progress", "complete"].includes(statusById.get("P48.5")?.status));
addCheck("P48.6 next", phaseStatus.nextPhase === "P48.6" || statusById.get("P48.5")?.nextPhase === "P48.6");
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const report = `# Agent Mesh Context Sync Report

## Metadata
- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P48.5 - Context Sync Through Policy

## Summary
- Room: room-p48-context-sync
- Allowed context sources: ${allowed.length}
- Excluded context sources: ${excluded.length}
- Stale or non-fresh context sources: ${contextSummary.staleContext?.length || 0}
- Raw context included: false
- Runtime agent injection enabled: false

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Next Phase
P48.6 - Command Center Agent Rooms UX
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Agent Mesh Context Sync Check\n===================================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
