import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CONTRACT_PATH = "contracts/missions/private-project-mission-contract.json";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function createMissionContract(input = {}) {
  return {
    contractId: randomUUID(),
    contractVersion: "1.0",
    contractType: "mission",
    ownerAgent: "nexus",
    plannerAgent: "shepherd",
    projectId: normalizeString(input.projectId) || "private-project-01",
    projectLabel: normalizeString(input.projectLabel) || "Private Project",
    missionText: normalizeString(input.missionText),
    requestedBy: input.requestedBy || { userId: "local-operator", role: "founder", authType: "local" },
    mode: normalizeString(input.mode) || "local-private",
    source: "command_center_mission_composer",
    createdAt: new Date().toISOString(),
    constraints: {
      mutationAllowed: false,
      providerCallsAllowed: false,
      networkCallsAllowed: false,
      dbAccessAllowed: false,
      buildExecutionAllowed: false,
      testExecutionAllowed: false,
    },
    governance: {
      localTaskRecordAllowed: true,
      evidenceAllowed: true,
      auditAllowed: true,
      runtimeEventAllowed: true,
      requiresPrivateProjectMode: true,
      requiresTrafficPlane: true,
      requiresStateMachine: true,
      requiresLocalWriteBoundary: true,
    },
    privateProject: true,
    redacted: true,
  };
}

export function validateMissionContract(contract = {}) {
  const errors = [];

  const required = [
    "contractId",
    "contractVersion",
    "contractType",
    "ownerAgent",
    "plannerAgent",
    "projectId",
    "missionText",
    "mode",
    "createdAt",
  ];

  for (const field of required) {
    if (!normalizeString(contract[field])) {
      errors.push(`${field} is required.`);
    }
  }

  if (contract.constraints?.mutationAllowed !== false) {
    errors.push("mutationAllowed must be false.");
  }

  if (contract.redacted !== true) {
    errors.push("redacted must be true.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function writeMissionContract(contract = {}) {
  const absolutePath = path.join(REPO_ROOT, CONTRACT_PATH);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(contract, null, 2)}\n`, "utf8");
  return { ok: true, path: CONTRACT_PATH };
}
