import { buildBusinessBuildWorkstreams } from "../business-build/businessBuildWorkstreams.js";
import { createBusinessBuildPrdDraft } from "../business-build/businessBuildPrdSchema.js";
import { buildWorkerRuntimeSummary } from "../worker-runtime/runtimeSummary.js";
import { createPassResult } from "../shared/resultEnvelope.js";

export const P82_WORKER_EXECUTION_GATE_PHASE = "P82.3";

const RUNTIME_FLAGS = [
  "agentDispatchAllowed",
  "providerCallsAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "deployExecutionAllowed",
  "providerSpendAllowed",
];

const REQUIRED_GATE_EVIDENCE = [
  "operatorApproval",
  "capabilityScope",
  "budgetLimit",
  "rollbackPlan",
  "activityLedger",
  "costLedger",
  "redactionCheck",
  "validationCommands",
];

function falseRuntimeFlags() {
  return Object.fromEntries(RUNTIME_FLAGS.map((flag) => [flag, false]));
}

export function buildWorkerExecutionGate(input = {}) {
  const prdDraft = input.prdDraft || createBusinessBuildPrdDraft({
    founderIdeaSummary: "Founder wants to validate and build a startup idea.",
    answers: {
      targetCustomer: "startup founder",
      problem: "needs a guided path from idea to business",
      currentAlternatives: "manual planning",
      proposedSolution: "agentic venture operating system",
      businessModel: "subscription",
      goToMarket: "founder-led",
      constraints: "limited team and budget",
      successCriteria: "validated PRD and execution plan",
    },
  });
  const workstreamPlan = input.workstreamPlan || buildBusinessBuildWorkstreams({ prdDraft });
  const runtimeSummary = buildWorkerRuntimeSummary({
    queueItems: [],
    leases: [],
    heartbeats: [],
    retryItems: [],
    deadLetterItems: [],
  });
  const workstreamRows = (workstreamPlan.workstreams || []).map((workstream) => ({
    workstream: workstream.workstream,
    ownerCapability: workstream.ownerCapability,
    currentState: "blocked_by_policy",
    readinessLabel: "Blocked by policy",
    nextAction: "Complete worker admission, lease, heartbeat, rollback, activity, cost, and validation evidence before dispatch.",
    blockers: [...REQUIRED_GATE_EVIDENCE],
    disabledReason: "Worker execution is blocked in P82.3; workstreams remain planning records only.",
    evidenceRefs: ["reports/p823-worker-execution-gate-report.md", ...new Set(workstream.evidenceRefs || [])],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No worker runtime, provider calls, project writes, DB writes, deploy, or provider spend in P82.3.",
    ...falseRuntimeFlags(),
  }));

  return createPassResult({
    phase: P82_WORKER_EXECUTION_GATE_PHASE,
    mode: input.mode || "live",
    source: "live-ready/workerExecutionGate.js",
    summary: "Worker execution readiness gate is available; workers remain blocked.",
    data: {
      currentState: "worker_execution_gate_ready",
      readinessLabel: "Needs setup",
      nextAction: "Implement P82.4 project/DB mutation admission before any worker can mutate project or DB state.",
      blockers: [...REQUIRED_GATE_EVIDENCE],
      disabledReason: "Worker execution requires explicit admission, evidence, rollback, and validation before live use.",
      ownerCapability: "NEXUS Worker Runtime Governance",
      evidenceRefs: ["reports/p823-worker-execution-gate-report.md", "reports/os-phase-status-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No spend in P82.3; worker execution is disabled.",
      runtimeSummary,
      workstreamRows,
      workerExecutionAllowed: false,
      ...falseRuntimeFlags(),
    },
    warnings: ["Worker gate readiness is not execution. Agents and workers remain stopped."],
    evidence: ["reports/p823-worker-execution-gate-report.md", "contracts/os-roadmap/p82-execution-contracts.json"],
  });
}

export function validateWorkerExecutionGate(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  const rows = data.workstreamRows || [];
  if (envelope.phase !== P82_WORKER_EXECUTION_GATE_PHASE) errors.push("phase must be P82.3");
  if (data.readinessLabel !== "Needs setup") errors.push("readinessLabel must be Needs setup");
  if (!Array.isArray(rows) || rows.length !== 8) errors.push("workstreamRows must cover 8 business build workstreams");
  for (const field of ["currentState", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.runtimeSummary?.executionEnabled !== false) errors.push("runtimeSummary.executionEnabled must be false");
  for (const flag of RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const row of rows) {
    if (row.readinessLabel !== "Blocked by policy") errors.push(`${row.workstream}.readinessLabel must be Blocked by policy`);
    if (!Array.isArray(row.blockers)) errors.push(`${row.workstream}.blockers must be an array`);
    for (const flag of RUNTIME_FLAGS) {
      if (row[flag] !== false) errors.push(`${row.workstream}.${flag} must be false`);
    }
  }
  return { valid: errors.length === 0, errors };
}
