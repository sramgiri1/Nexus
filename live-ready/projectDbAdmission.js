import { buildDbReadinessGateEnvelope } from "../db-runtime/p72-4-placeholder.js";
import { createMutationBoundaryDecision } from "../scope-boundary/mutationBoundary.js";
import { createPassResult } from "../shared/resultEnvelope.js";

export const P82_PROJECT_DB_ADMISSION_PHASE = "P82.4";

const RUNTIME_FLAGS = [
  "projectMutationAllowed",
  "dbWritesAllowed",
  "schemaMutationAllowed",
  "migrationsAllowed",
  "providerCallsAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "deployExecutionAllowed",
  "providerSpendAllowed",
];

const REQUIRED_ADMISSION_GATES = [
  "explicitProjectScope",
  "operatorApproval",
  "rollbackPlan",
  "backupEvidence",
  "activityEvidence",
  "costEvidence",
  "redactionCheck",
  "validationCommands",
];

function falseRuntimeFlags() {
  return Object.fromEntries(RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function buildAdmissionRows(dbGate, mutationBoundary) {
  return [
    {
      admissionId: "project-source-mutation",
      label: "Project Source Mutation",
      currentState: "blocked_by_policy",
      readinessLabel: "Blocked by policy",
      ownerCapability: "NEXUS Scope Boundary",
      nextAction: "Collect explicit project scope, rollback, backup, redaction, activity, cost, and validation evidence before mutation admission.",
      blockers: [...REQUIRED_ADMISSION_GATES],
      disabledReason: "Project source mutation is blocked in P82.4; no project files are edited.",
      evidenceRefs: ["reports/p824-project-db-admission-report.md", "reports/project-os-boundary-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No spend in P82.4; source mutation remains disabled.",
      mutationBoundary,
      ...falseRuntimeFlags(),
    },
    {
      admissionId: "db-write-migration",
      label: "DB Writes / Migrations",
      currentState: "needs_setup",
      readinessLabel: "Needs setup",
      ownerCapability: "NEXUS DB Runtime Governance",
      nextAction: "Complete DB runtime, migration, backup, rollback, activity, cost, and validation evidence before DB write admission.",
      blockers: [...REQUIRED_ADMISSION_GATES, "dbRuntimeContract", "migrationPreview"],
      disabledReason: "DB writes, migrations, and schema mutation are blocked in P82.4.",
      evidenceRefs: ["reports/p824-project-db-admission-report.md", "reports/p724-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No DB service calls, DB writes, migration execution, schema mutation, or provider spend.",
      dbGate,
      ...falseRuntimeFlags(),
    },
  ];
}

export function buildProjectDbAdmissionGate(input = {}) {
  const dbEnvelope = buildDbReadinessGateEnvelope({
    evidenceRefs: ["reports/p824-project-db-admission-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P82.4"],
    nextAction: "Use this DB readiness gate as an input to P82.4 project/DB admission.",
  });
  const dbGate = dbEnvelope.data?.gate || {};
  const mutationBoundary = createMutationBoundaryDecision({
    paths: input.paths || ["selected-project-scope"],
  });
  const admissionRows = buildAdmissionRows(dbGate, mutationBoundary);

  return createPassResult({
    phase: P82_PROJECT_DB_ADMISSION_PHASE,
    mode: input.mode || "live",
    source: "live-ready/projectDbAdmission.js",
    summary: "Project and DB admission gates are available; mutation remains blocked.",
    data: {
      currentState: "project_db_admission_gates_ready",
      readinessLabel: "Needs setup",
      nextAction: "Implement P82.5 deploy/release admission before Command Center live-ready UX cleanup.",
      blockers: [...REQUIRED_ADMISSION_GATES],
      disabledReason: "Project mutation and DB writes require explicit admission, rollback, backup, evidence, and validation before live use.",
      ownerCapability: "NEXUS Project and DB Governance",
      evidenceRefs: [
        "reports/p824-project-db-admission-report.md",
        "reports/p724-report.md",
        "reports/project-os-boundary-report.md",
      ],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No DB service calls, project writes, deploys, or provider spend in P82.4.",
      admissionRows,
      dbGate,
      mutationBoundary,
      ...falseRuntimeFlags(),
    },
    warnings: ["Admission gates are not execution. Project mutation and DB writes remain disabled."],
    evidence: ["reports/p824-project-db-admission-report.md", "contracts/os-roadmap/p82-execution-contracts.json"],
  });
}

export function validateProjectDbAdmissionGate(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  const rows = data.admissionRows || [];
  if (envelope.phase !== P82_PROJECT_DB_ADMISSION_PHASE) errors.push("phase must be P82.4");
  if (data.readinessLabel !== "Needs setup") errors.push("readinessLabel must be Needs setup");
  if (!Array.isArray(rows) || rows.length !== 2) errors.push("admissionRows must include project and DB rows");
  for (const field of ["currentState", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  for (const flag of RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  if (data.dbGate?.dbWritesAllowed !== false) errors.push("dbGate.dbWritesAllowed must be false");
  if (data.mutationBoundary?.mutationAllowed !== false) errors.push("mutationBoundary.mutationAllowed must be false");
  for (const row of rows) {
    if (!["Needs setup", "Blocked by policy"].includes(row.readinessLabel)) errors.push(`${row.admissionId} invalid readinessLabel`);
    if (!Array.isArray(row.blockers)) errors.push(`${row.admissionId}.blockers must be an array`);
    for (const flag of RUNTIME_FLAGS) {
      if (row[flag] !== false) errors.push(`${row.admissionId}.${flag} must be false`);
    }
  }
  return { valid: errors.length === 0, errors };
}
