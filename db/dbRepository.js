/**
 * dbRepository.js — P41-LOCAL read-only repository.
 * All reads come from file-backed sources. DB writes not supported in P41.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const ROOT = process.cwd();

function safeReadJson(relPath) {
  const full = join(ROOT, relPath);
  if (!existsSync(full)) return null;
  try { return JSON.parse(readFileSync(full, "utf8")); } catch { return null; }
}

function safeReadJsonl(relPath) {
  const full = join(ROOT, relPath);
  if (!existsSync(full)) return [];
  try {
    return readFileSync(full, "utf8")
      .split("\n")
      .filter(Boolean)
      .map(l => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean);
  } catch { return []; }
}

export function createDbRepository() {
  return {
    mode: "file-backed",
    dbWritesEnabled: false,
    fileFallbackRequired: true,
  };
}

export function getRepositoryMode() {
  return "file-backed";
}

export function readProjects() {
  const contract = safeReadJson("contracts/missions/private-project-mission-contract.json");
  if (!contract) return [];
  return [{
    projectId: contract.projectId || "unknown",
    label: contract.projectLabel || "Private Project",
    mode: contract.mode || "local-private",
    active: true,
    createdAt: contract.createdAt || null,
    updatedAt: contract.updatedAt || null,
    _source: "contracts/missions/private-project-mission-contract.json",
  }];
}

export function readMissions() {
  const contract = safeReadJson("contracts/missions/private-project-mission-contract.json");
  if (!contract) return [];
  return [{
    contractId: contract.contractId || "unknown",
    projectId: contract.projectId || "unknown",
    missionText: contract.missionText || "",
    mode: contract.mode || "local-private",
    source: "mission-contract",
    createdAt: contract.createdAt || null,
    _source: "contracts/missions/private-project-mission-contract.json",
  }];
}

export function readTasks() {
  const plan = safeReadJson("contracts/missions/private-project-task-plan.json");
  const runtime = safeReadJson("local-state/runtime/tasks.json");
  const missionTasks = plan?.tasks || [];
  const runtimeTasks = runtime?.tasks || [];
  return { missionTasks, runtimeTasks };
}

export function readAgents() {
  const status = safeReadJson("memory/agent-status.json");
  if (!status) return [];
  const agents = Array.isArray(status) ? status : Object.values(status);
  return agents.map(a => ({
    agentId: a.agentId || a.id || "unknown",
    role: a.role || "unknown",
    tier: a.tier || null,
    capabilities: a.capabilities || [],
    active: a.active !== false,
    _source: "memory/agent-status.json",
  }));
}

export function readEvidence() {
  return safeReadJsonl("local-state/runtime/evidence.jsonl");
}

export function readAuditEvents() {
  return safeReadJsonl("local-state/runtime/audit.jsonl");
}

export function readRuntimeEvents() {
  return safeReadJsonl("local-state/runtime/events.jsonl");
}

export function readContracts() {
  const mission = safeReadJson("contracts/missions/private-project-mission-contract.json");
  const plan = safeReadJson("contracts/missions/private-project-task-plan.json");
  const contracts = [];
  if (mission) contracts.push({ contractId: mission.contractId || "mission", contractType: "mission", projectId: mission.projectId, _source: "contracts/missions/private-project-mission-contract.json" });
  if (plan) contracts.push({ contractId: plan.contractId || "task-plan", contractType: "task_plan", projectId: plan.projectId, _source: "contracts/missions/private-project-task-plan.json" });
  return contracts;
}

export function readRoadmap() {
  return safeReadJson("reports/command-center-snapshot.json")?.data?.roadmap?.phases || [];
}

export function readActions() {
  return safeReadJsonl("local-state/runtime/actions.jsonl");
}

export function writeNotSupportedYet(entity, record) {
  throw new Error(`DB writes not supported in P41. entity=${entity}. Enable in P42.`);
}
