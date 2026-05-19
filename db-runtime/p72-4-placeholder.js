import { createPassResult } from "../shared/resultEnvelope.js";
import { createDbMigrationPreview, validateDbMigrationPreview } from "./p72-3-placeholder.js";
import { createDbRuntimePrimaryContract, validateDbRuntimePrimaryContract } from "./p72-2-placeholder.js";

export const P72_4_REQUIRED_FIELDS = Object.freeze([
  "readinessGateId",
  "runtimeId",
  "gateState",
  "dbPrimaryState",
  "fallbackState",
  "migrationState",
  "readinessDecision",
  "dbWritesAllowed",
  "migrationsAllowed",
  "schemaMutationAllowed",
  "projectMutationAllowed",
  "providerDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
  "preconditions",
  "blockedOperations",
  "blockers",
  "disabledReason",
  "safetyPosture",
  "evidenceRefs",
  "activityRefs",
  "costImpact",
  "ownerCapability",
  "nextAction",
  "commandCenterVisible",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

export function createDbReadinessGate(input = {}) {
  const contract = input.contract || createDbRuntimePrimaryContract(input);
  const preview = input.preview || createDbMigrationPreview({ ...input, contract });
  const contractValidation = validateDbRuntimePrimaryContract(contract);
  const previewValidation = validateDbMigrationPreview(preview);
  const validationBlockers = [
    ...(contractValidation.valid ? [] : contractValidation.errors),
    ...(previewValidation.valid ? [] : previewValidation.errors),
  ];

  return {
    readinessGateId: input.readinessGateId || "db-readiness-gate-preview",
    runtimeId: contract.runtimeId,
    gateState: input.gateState || "blocked_pending_explicit_db_enablement",
    dbPrimaryState: contract.dbPrimaryState,
    fallbackState: contract.fallbackState,
    migrationState: preview.migrationState,
    readinessDecision: "not_ready_for_execution",
    dbWritesAllowed: false,
    migrationsAllowed: false,
    schemaMutationAllowed: false,
    projectMutationAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    networkCallsAllowed: false,
    deployExecutionAllowed: false,
    releaseExecutionAllowed: false,
    exportExecutionAllowed: false,
    packageCreationAllowed: false,
    providerSpendAllowed: false,
    preconditions: [
      "DB runtime contract is display-safe.",
      "Migration preview is display-safe.",
      "File-backed runtime remains primary.",
      "A later explicit phase must authorize governed DB mutation before execution.",
    ],
    blockedOperations: [
      "DB writes",
      "Migration execution",
      "Schema mutation",
      "Runtime storage mutation",
      "Project mutation",
    ],
    blockers: [
      "DB mutation has not been explicitly authorized.",
      "Migration execution is disabled.",
      "Schema mutation is disabled.",
      "Runtime storage mutation remains file-backed.",
      "Project mutation, provider/tool/worker execution, network calls, deploy/release/export execution, package creation, and provider spend remain disabled.",
      ...validationBlockers,
      ...normalizeList(input.blockers),
    ],
    disabledReason: "P72.4 records a DB readiness gate only; DB writes, migrations, schema mutation, and runtime storage mutation remain disabled.",
    safetyPosture: "preview_only_blocked_gate",
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), ...contract.evidenceRefs, ...preview.evidenceRefs, "reports/p724-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), ...contract.activityRefs, ...preview.activityRefs, "os-roadmap/phase-status.json#P72.4"])],
    costImpact: "No DB service calls, DB writes, migration execution, schema mutation, network calls, provider calls, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.dbReadinessGate",
    nextAction: input.nextAction || "Expose this blocked DB readiness gate in P72.5 Command Center DB Runtime UX.",
    commandCenterVisible: true,
  };
}

export function validateDbReadinessGate(gate = {}) {
  const errors = [];
  for (const field of P72_4_REQUIRED_FIELDS) {
    if (!(field in gate)) errors.push(`missing ${field}`);
  }
  if (gate.readinessDecision !== "not_ready_for_execution") errors.push("readinessDecision must remain not_ready_for_execution");
  if (gate.dbWritesAllowed !== false || gate.migrationsAllowed !== false || gate.schemaMutationAllowed !== false) errors.push("DB writes, migrations, and schema mutation must be false");
  if (gate.projectMutationAllowed !== false) errors.push("projectMutationAllowed must be false");
  if (gate.providerDispatchAllowed !== false || gate.toolExecutionAllowed !== false || gate.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (gate.networkCallsAllowed !== false || gate.providerSpendAllowed !== false) errors.push("network/spend must be false");
  if (gate.deployExecutionAllowed !== false || gate.releaseExecutionAllowed !== false || gate.exportExecutionAllowed !== false || gate.packageCreationAllowed !== false) errors.push("deploy/release/export/package execution must be false");
  if (!Array.isArray(gate.preconditions) || gate.preconditions.length < 4) errors.push("preconditions must be visible");
  if (!Array.isArray(gate.blockedOperations) || gate.blockedOperations.length < 5) errors.push("blockedOperations must be visible");
  if (!Array.isArray(gate.blockers) || gate.blockers.length < 5) errors.push("blockers must be visible");
  if (!gate.disabledReason || /enable now|migrate now|write now|schema now|run db|execute now/i.test(gate.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (gate.safetyPosture !== "preview_only_blocked_gate") errors.push("safetyPosture must stay preview_only_blocked_gate");
  if (!Array.isArray(gate.evidenceRefs) || gate.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(gate.activityRefs) || gate.activityRefs.length === 0) errors.push("activityRefs must be visible");
  if (gate.commandCenterVisible !== true) errors.push("commandCenterVisible must be true for P72.5 display");
  return { valid: errors.length === 0, errors };
}

export function buildDbReadinessGateEnvelope(input = {}) {
  const gate = createDbReadinessGate(input);
  return createPassResult({
    phase: "P72.4",
    mode: "preview-only",
    source: "db-runtime/p72-4-placeholder.js",
    summary: "DB readiness gate recorded without enabling DB writes, migrations, schema mutation, or runtime storage mutation.",
    data: { gate },
    evidence: gate.evidenceRefs,
  });
}

export const P72_4_SAMPLE_GATES = Object.freeze([
  createDbReadinessGate({
    evidenceRefs: ["reports/p724-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P72.4"],
  }),
]);
