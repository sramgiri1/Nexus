import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TASK_PLAN_PATH = "contracts/missions/private-project-task-plan.json";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

const MISSION_TASKS = [
  {
    agent: "SHEPHERD",
    taskType: "orchestration.plan_flow",
    objective: "Project Brief",
    riskLevel: "medium",
  },
  {
    agent: "AUDITOR",
    taskType: "verification.code_quality_gate",
    objective: "Backend Validation Follow-up",
    riskLevel: "medium",
  },
  {
    agent: "PRISM",
    taskType: "design.ux_flow",
    objective: "UX Product Flow Planning",
    riskLevel: "low",
  },
  {
    agent: "SENTINEL",
    taskType: "verification.qa_gate",
    objective: "iOS Readiness Planning",
    riskLevel: "medium",
  },
  {
    agent: "WARDEN",
    taskType: "security.privacy_review",
    objective: "Privacy Compliance Review",
    riskLevel: "high",
  },
  {
    agent: "CORE",
    taskType: "implementation.backend_code",
    objective: "First Controlled Implementation Candidate",
    riskLevel: "high",
  },
];

export function createInitialMissionTaskPlan(mission = {}) {
  const projectId = normalizeString(mission.projectId) || "private-project-01";
  const projectLabel = normalizeString(mission.projectLabel) || "Private Project";
  const now = new Date().toISOString();

  const tasks = MISSION_TASKS.map((t) => ({
    taskId: randomUUID(),
    projectId,
    projectLabel,
    sourceAgent: "nexus",
    targetAgent: t.agent.toLowerCase(),
    taskType: t.taskType,
    objective: t.objective,
    state: "queued",
    riskLevel: t.riskLevel,
    mutationAllowed: false,
    executionAllowed: false,
    blocking: false,
    dependsOn: [],
    createdAt: now,
    updatedAt: now,
    redacted: true,
  }));

  return {
    planVersion: "1.0",
    planType: "mission_task_plan",
    projectId,
    projectLabel,
    source: "mission_composer",
    createdAt: now,
    tasks,
  };
}

export function createAgentAssignments(mission = {}) {
  const projectId = normalizeString(mission.projectId) || "private-project-01";

  return MISSION_TASKS.reduce((acc, t) => {
    acc[t.agent] = {
      agent: t.agent,
      taskType: t.taskType,
      objective: t.objective,
      riskLevel: t.riskLevel,
      projectId,
      mutationAllowed: false,
      executionAllowed: false,
      status: "queued",
    };
    return acc;
  }, {});
}

export function createGovernedTaskContracts(mission = {}) {
  const projectId = normalizeString(mission.projectId) || "private-project-01";
  const now = new Date().toISOString();

  return MISSION_TASKS.map((t) => ({
    contractId: randomUUID(),
    contractType: "governed_task",
    projectId,
    agent: t.agent,
    taskType: t.taskType,
    objective: t.objective,
    riskLevel: t.riskLevel,
    mutationAllowed: false,
    executionAllowed: false,
    status: "queued",
    createdAt: now,
    redacted: true,
  }));
}

export function writeMissionTaskPlan(plan = {}) {
  const absolutePath = path.join(REPO_ROOT, TASK_PLAN_PATH);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
  return { ok: true, path: TASK_PLAN_PATH };
}
