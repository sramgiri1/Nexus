import { createPassResult } from "../shared/resultEnvelope.js";
import { P74_2_SAMPLE_CONTRACTS, validateTelemetryEventContract } from "./p74-2-placeholder.js";

export const P74_3_REQUIRED_FIELDS = Object.freeze([
  "sloCatalogId",
  "sourceTelemetryContractId",
  "signalType",
  "sloName",
  "sloTarget",
  "measurementWindow",
  "errorBudgetState",
  "enforcementAllowed",
  "pagingAllowed",
  "remediationAllowed",
  "telemetryExportAllowed",
  "rawLogExposureAllowed",
  "dbWritesAllowed",
  "projectMutationAllowed",
  "providerDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "authMutationAllowed",
  "providerSpendAllowed",
  "objectiveRows",
  "blockedOperations",
  "disabledReason",
  "blockers",
  "forbiddenFiles",
  "evidenceRefs",
  "activityRefs",
  "costImpact",
  "ownerCapability",
  "nextAction",
]);

const DEFAULT_FORBIDDEN_FILES = Object.freeze([
  "projects/**",
  "project-roadmap/**",
  "db/**",
  "prisma/**",
  "migrations/**",
  "providers/**",
  "tools/**",
  "worker-runtime/**",
  "deploy/**",
  "release/**",
  "auth/**",
  "users/**",
  "rbac/**",
  ".env",
  ".env.*",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

export function createSloObjectiveCatalog(input = {}) {
  const telemetryContract = input.telemetryContract || P74_2_SAMPLE_CONTRACTS[0];
  const telemetryValidation = validateTelemetryEventContract(telemetryContract);
  const sourceTelemetryContractId = telemetryValidation.valid
    ? telemetryContract.telemetryContractId
    : "telemetry-contract-unavailable";

  return {
    sloCatalogId: input.sloCatalogId || "slo-objective-catalog-preview",
    sourceTelemetryContractId,
    signalType: input.signalType || telemetryContract.signalType || "runtime_health",
    sloName: input.sloName || "Runtime readiness objective",
    sloTarget: input.sloTarget || "99 percent local preview task readiness",
    measurementWindow: input.measurementWindow || "local_preview_window",
    errorBudgetState: input.errorBudgetState || "defined_not_enforced",
    enforcementAllowed: false,
    pagingAllowed: false,
    remediationAllowed: false,
    telemetryExportAllowed: false,
    rawLogExposureAllowed: false,
    dbWritesAllowed: false,
    projectMutationAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    networkCallsAllowed: false,
    deployExecutionAllowed: false,
    releaseExecutionAllowed: false,
    exportExecutionAllowed: false,
    packageCreationAllowed: false,
    authMutationAllowed: false,
    providerSpendAllowed: false,
    objectiveRows: [
      {
        label: "Runtime readiness",
        target: "99 percent",
        currentState: "objective_defined_not_measured",
        enforcementState: "disabled",
      },
      {
        label: "Evidence coverage",
        target: "100 percent required validation evidence",
        currentState: "objective_defined_not_measured",
        enforcementState: "disabled",
      },
    ],
    blockedOperations: [
      "SLO enforcement",
      "Incident paging",
      "Remediation execution",
      "External telemetry export",
      "DB metric writes",
      "Network telemetry calls",
    ],
    disabledReason: "P74.3 records SLO objectives only; SLO enforcement, paging, remediation, external telemetry export, DB writes, and network calls remain disabled.",
    blockers: [
      "SLO enforcement is disabled.",
      "Paging and remediation execution are disabled.",
      "External telemetry export and raw log exposure are disabled.",
      "DB writes, project mutation, provider/tool/worker execution, and network calls are disabled.",
      "Deploy, release, export, package, auth mutation, and provider spend remain disabled.",
      ...normalizeList(input.blockers),
    ],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p743-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P74.3"])],
    costImpact: "No paging service calls, telemetry exporter calls, network calls, provider calls, DB service calls, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.observabilitySloPreview",
    nextAction: input.nextAction || "Route this SLO objective catalog through P74.4 health and incident snapshot preview.",
    commandCenterVisible: true,
  };
}

export function validateSloObjectiveCatalog(catalog = {}) {
  const errors = [];
  for (const field of P74_3_REQUIRED_FIELDS) {
    if (!(field in catalog)) errors.push(`missing ${field}`);
  }
  if (catalog.enforcementAllowed !== false || catalog.pagingAllowed !== false || catalog.remediationAllowed !== false) errors.push("SLO enforcement, paging, and remediation must be false");
  if (catalog.telemetryExportAllowed !== false || catalog.rawLogExposureAllowed !== false) errors.push("telemetry export and raw log exposure must be false");
  if (catalog.projectMutationAllowed !== false || catalog.dbWritesAllowed !== false) errors.push("project mutation and DB writes must be false");
  if (catalog.providerDispatchAllowed !== false || catalog.toolExecutionAllowed !== false || catalog.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (catalog.networkCallsAllowed !== false || catalog.providerSpendAllowed !== false) errors.push("network/spend must be false");
  if (catalog.deployExecutionAllowed !== false || catalog.releaseExecutionAllowed !== false || catalog.exportExecutionAllowed !== false || catalog.packageCreationAllowed !== false) errors.push("deploy/release/export/package execution must be false");
  if (catalog.authMutationAllowed !== false) errors.push("auth mutation must be false");
  if (!Array.isArray(catalog.objectiveRows) || catalog.objectiveRows.length < 2) errors.push("objectiveRows must be visible");
  if (!Array.isArray(catalog.blockedOperations) || catalog.blockedOperations.length < 6) errors.push("blockedOperations must be visible");
  if (!Array.isArray(catalog.blockers) || catalog.blockers.length < 5) errors.push("blockers must be visible");
  if (!Array.isArray(catalog.forbiddenFiles) || !catalog.forbiddenFiles.includes("projects/**") || !catalog.forbiddenFiles.includes("db/**") || !catalog.forbiddenFiles.includes("providers/**")) errors.push("project, DB, and provider files must remain forbidden");
  if (!catalog.disabledReason || /enforce now|page now|remediate now|send telemetry|execute now/i.test(catalog.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(catalog.evidenceRefs) || catalog.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(catalog.activityRefs) || catalog.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildSloObjectiveCatalogEnvelope(input = {}) {
  const catalog = createSloObjectiveCatalog(input);
  return createPassResult({
    phase: "P74.3",
    mode: "preview-only",
    source: "observability/p74-3-placeholder.js",
    summary: "SLO objective catalog recorded without enabling enforcement, paging, remediation, exporters, DB writes, or network calls.",
    data: { catalog },
    evidence: catalog.evidenceRefs,
  });
}

export const P74_3_SAMPLE_CATALOGS = Object.freeze([
  createSloObjectiveCatalog({
    telemetryContract: P74_2_SAMPLE_CONTRACTS[0],
    evidenceRefs: ["reports/p743-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P74.3"],
  }),
]);
