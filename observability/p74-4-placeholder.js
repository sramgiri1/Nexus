import { createPassResult } from "../shared/resultEnvelope.js";
import { P74_2_SAMPLE_CONTRACTS, validateTelemetryEventContract } from "./p74-2-placeholder.js";
import { P74_3_SAMPLE_CATALOGS, validateSloObjectiveCatalog } from "./p74-3-placeholder.js";

export const P74_4_REQUIRED_FIELDS = Object.freeze([
  "healthSnapshotId",
  "sourceTelemetryContractId",
  "sourceSloCatalogId",
  "healthState",
  "incidentState",
  "affectedSurface",
  "sloState",
  "errorBudgetState",
  "remediationAllowed",
  "pagingAllowed",
  "sloEnforcementAllowed",
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
  "snapshotRows",
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

export function createObservabilityHealthSnapshot(input = {}) {
  const telemetryContract = input.telemetryContract || P74_2_SAMPLE_CONTRACTS[0];
  const sloCatalog = input.sloCatalog || P74_3_SAMPLE_CATALOGS[0];
  const telemetryValidation = validateTelemetryEventContract(telemetryContract);
  const sloValidation = validateSloObjectiveCatalog(sloCatalog);

  return {
    healthSnapshotId: input.healthSnapshotId || "observability-health-snapshot-preview",
    sourceTelemetryContractId: telemetryValidation.valid ? telemetryContract.telemetryContractId : "telemetry-contract-unavailable",
    sourceSloCatalogId: sloValidation.valid ? sloCatalog.sloCatalogId : "slo-catalog-unavailable",
    healthState: input.healthState || "preview_health_defined_not_live",
    incidentState: input.incidentState || "incident_snapshot_defined_not_automated",
    affectedSurface: input.affectedSurface || "NEXUS OS local runtime",
    sloState: input.sloState || "slo_catalog_defined_not_enforced",
    errorBudgetState: input.errorBudgetState || sloCatalog.errorBudgetState || "defined_not_enforced",
    remediationAllowed: false,
    pagingAllowed: false,
    sloEnforcementAllowed: false,
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
    snapshotRows: [
      {
        label: "Health posture",
        state: "defined",
        detail: "Preview health snapshot is available for Command Center readiness.",
      },
      {
        label: "Incident automation",
        state: "disabled",
        detail: "Paging and remediation remain blocked.",
      },
      {
        label: "SLO posture",
        state: "defined_not_enforced",
        detail: "SLO catalog is linked but enforcement remains disabled.",
      },
    ],
    blockedOperations: [
      "Remediation execution",
      "Incident paging",
      "SLO enforcement",
      "External telemetry export",
      "DB health writes",
      "Network telemetry calls",
    ],
    disabledReason: "P74.4 records health and incident snapshots only; remediation, paging, SLO enforcement, telemetry export, DB writes, and network calls remain disabled.",
    blockers: [
      "Remediation execution is disabled.",
      "Incident paging is disabled.",
      "SLO enforcement is disabled.",
      "External telemetry export and raw log exposure are disabled.",
      "DB writes, project mutation, provider/tool/worker execution, network calls, deploy/release/export/package behavior, auth mutation, and provider spend remain disabled.",
      ...normalizeList(input.blockers),
    ],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p744-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P74.4"])],
    costImpact: "No paging provider calls, telemetry exporter calls, network calls, provider calls, DB service calls, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.observabilityHealthPreview",
    nextAction: input.nextAction || "Route this health snapshot through P74.5 Command Center observability readiness UX.",
    commandCenterVisible: true,
  };
}

export function validateObservabilityHealthSnapshot(snapshot = {}) {
  const errors = [];
  for (const field of P74_4_REQUIRED_FIELDS) {
    if (!(field in snapshot)) errors.push(`missing ${field}`);
  }
  if (snapshot.remediationAllowed !== false || snapshot.pagingAllowed !== false || snapshot.sloEnforcementAllowed !== false) errors.push("remediation, paging, and SLO enforcement must be false");
  if (snapshot.telemetryExportAllowed !== false || snapshot.rawLogExposureAllowed !== false) errors.push("telemetry export and raw log exposure must be false");
  if (snapshot.projectMutationAllowed !== false || snapshot.dbWritesAllowed !== false) errors.push("project mutation and DB writes must be false");
  if (snapshot.providerDispatchAllowed !== false || snapshot.toolExecutionAllowed !== false || snapshot.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (snapshot.networkCallsAllowed !== false || snapshot.providerSpendAllowed !== false) errors.push("network/spend must be false");
  if (snapshot.deployExecutionAllowed !== false || snapshot.releaseExecutionAllowed !== false || snapshot.exportExecutionAllowed !== false || snapshot.packageCreationAllowed !== false) errors.push("deploy/release/export/package execution must be false");
  if (snapshot.authMutationAllowed !== false) errors.push("auth mutation must be false");
  if (!Array.isArray(snapshot.snapshotRows) || snapshot.snapshotRows.length < 3) errors.push("snapshotRows must be visible");
  if (!Array.isArray(snapshot.blockedOperations) || snapshot.blockedOperations.length < 6) errors.push("blockedOperations must be visible");
  if (!Array.isArray(snapshot.blockers) || snapshot.blockers.length < 5) errors.push("blockers must be visible");
  if (!Array.isArray(snapshot.forbiddenFiles) || !snapshot.forbiddenFiles.includes("projects/**") || !snapshot.forbiddenFiles.includes("db/**") || !snapshot.forbiddenFiles.includes("providers/**")) errors.push("project, DB, and provider files must remain forbidden");
  if (!snapshot.disabledReason || /remediate now|page now|enforce now|send telemetry|execute now/i.test(snapshot.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(snapshot.evidenceRefs) || snapshot.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(snapshot.activityRefs) || snapshot.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildObservabilityHealthSnapshotEnvelope(input = {}) {
  const snapshot = createObservabilityHealthSnapshot(input);
  return createPassResult({
    phase: "P74.4",
    mode: "preview-only",
    source: "observability/p74-4-placeholder.js",
    summary: "Observability health snapshot recorded without enabling remediation, paging, SLO enforcement, exporters, DB writes, or network calls.",
    data: { snapshot },
    evidence: snapshot.evidenceRefs,
  });
}

export const P74_4_SAMPLE_SNAPSHOTS = Object.freeze([
  createObservabilityHealthSnapshot({
    telemetryContract: P74_2_SAMPLE_CONTRACTS[0],
    sloCatalog: P74_3_SAMPLE_CATALOGS[0],
    evidenceRefs: ["reports/p744-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P74.4"],
  }),
]);
