import process from "node:process";
import { appendEvidence } from "../local-state/appendEvidence.js";
import { appendAuditEvent } from "../local-state/appendAuditEvent.js";
import {
  buildCareLoopReadinessSnapshot,
  writeCareLoopReadinessReport,
} from "../careloop-readiness/index.js";
import { getNexusMode, isLocalPrivateMode } from "../private-mode/index.js";

function getMode() {
  const mode = getNexusMode({ NEXUS_MODE: process.env.NEXUS_MODE });
  if (isLocalPrivateMode(mode) || mode === "test") {
    return mode;
  }
  return "local-private";
}

function appendSafeEvidence(snapshot) {
  const backendStatus = snapshot.readiness?.backend?.status ?? "UNKNOWN";
  const iosStatus = snapshot.readiness?.ios?.status ?? "UNKNOWN";
  try {
    appendEvidence({
      type: "private_project_inventory",
      result: snapshot.errors.length === 0 ? "INFO" : "FAIL",
      summary: "Private project inventory snapshot generated",
      classification: "internal",
      redacted: true,
      metadata: {
        backendStatus,
        iosStatus,
        overall: snapshot.readiness?.overall ?? "UNKNOWN",
        snapshotVersion: snapshot.snapshotVersion,
      },
    });
  } catch {
    // Evidence append is best-effort; write guard rejection is non-fatal.
  }
}

function appendSafeAuditEvent(snapshot) {
  try {
    appendAuditEvent({
      eventType: "private_project_inventory_completed",
      actorId: "system",
      actorType: "system",
      summary: "Private project inventory snapshot generated",
      classification: "internal",
      redacted: true,
      metadata: {
        snapshotVersion: snapshot.snapshotVersion,
        overall: snapshot.readiness?.overall ?? "UNKNOWN",
      },
    });
  } catch {
    // Audit append is best-effort; write guard rejection is non-fatal.
  }
}

function printConsole(snapshot) {
  const backendStatus = snapshot.readiness?.backend?.status ?? "UNKNOWN";
  const iosStatus = snapshot.readiness?.ios?.status ?? "UNKNOWN";
  const overall = snapshot.readiness?.overall ?? "UNKNOWN";
  const nextTask = snapshot.recommendedNextTask;

  const lines = [
    "NEXUS CareLoop Inventory",
    "========================",
    "",
    `Mode: ${snapshot.mode}`,
    "Project: Private project (local-private)",
    "Backend root: projects/careloop",
    "iOS root: projects/careloop-ios",
    "Mutation: disabled",
    "Build/test: disabled",
    "Provider calls: disabled",
    "",
    "Summary:",
    `- Backend: ${backendStatus}`,
    `- iOS: ${iosStatus}`,
    `- Overall: ${overall}`,
    `- Recommended next task: ${nextTask?.title ?? "(none)"}`,
  ];

  process.stdout.write(`${lines.join("\n")}\n`);
}

async function main() {
  const mode = getMode();
  const snapshot = buildCareLoopReadinessSnapshot({ mode, actor: "system" });
  writeCareLoopReadinessReport(snapshot);
  appendSafeEvidence(snapshot);
  appendSafeAuditEvent(snapshot);
  printConsole(snapshot);
  process.exit(0);
}

main();
