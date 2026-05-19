import { createPassResult } from "../shared/resultEnvelope.js";
import { createDeployMonitorEvent, validateDeployMonitorEvent } from "./p70-2-placeholder.js";

export const P70_3_REQUIRED_FIELDS = Object.freeze([
  "signalId",
  "monitorId",
  "deployId",
  "targetKind",
  "incidentState",
  "severity",
  "summary",
  "environmentLabel",
  "allowedFiles",
  "forbiddenFiles",
  "deployExecutionAllowed",
  "incidentExecutionAllowed",
  "mitigationExecutionAllowed",
  "rollbackExecutionAllowed",
  "alertDispatchAllowed",
  "projectMutationAllowed",
  "providerDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "providerSpendAllowed",
  "disabledReason",
  "blockers",
  "evidenceRefs",
  "activityRefs",
  "costImpact",
  "ownerCapability",
  "nextAction",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function hasProjectPath(paths = []) {
  return normalizeList(paths).some((filePath) => filePath === "projects/**" || filePath.startsWith("projects/"));
}

export function createIncidentSignalPreview(input = {}) {
  const monitorEvent = input.monitorEvent || createDeployMonitorEvent(input);
  const eventValidation = validateDeployMonitorEvent(monitorEvent);
  return {
    signalId: input.signalId || "incident-signal-preview",
    monitorId: monitorEvent.monitorId,
    deployId: monitorEvent.deployId,
    targetKind: monitorEvent.targetKind,
    incidentState: eventValidation.valid ? "signal_ready_for_review" : "blocked",
    severity: input.severity || monitorEvent.severity || "info",
    summary: input.summary || "Preview incident signal from deploy monitor event without alert dispatch or mitigation execution.",
    environmentLabel: monitorEvent.environmentLabel,
    allowedFiles: [...monitorEvent.allowedFiles],
    forbiddenFiles: [...monitorEvent.forbiddenFiles],
    deployExecutionAllowed: false,
    incidentExecutionAllowed: false,
    mitigationExecutionAllowed: false,
    rollbackExecutionAllowed: false,
    alertDispatchAllowed: false,
    projectMutationAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    dbWritesAllowed: false,
    networkCallsAllowed: false,
    providerSpendAllowed: false,
    disabledReason: "P70.3 creates incident signal previews only; alert dispatch, incident, mitigation, rollback, and deploy execution remain disabled.",
    blockers: [
      ...normalizeList(monitorEvent.blockers),
      "Alert dispatch is disabled.",
      "Incident execution, mitigation execution, rollback execution, and deploy execution are disabled.",
      ...normalizeList(input.blockers),
    ],
    evidenceRefs: [...new Set([...normalizeList(monitorEvent.evidenceRefs), "reports/p703-report.md"])],
    activityRefs: [...new Set([...normalizeList(monitorEvent.activityRefs), "os-roadmap/phase-status.json#P70.3"])],
    costImpact: "No provider calls, alert dispatch, network execution, deploy execution, incident execution, mitigation execution, rollback execution, or provider spend.",
    ownerCapability: monitorEvent.ownerCapability,
    nextAction: input.nextAction || "Route this incident signal through P70.4 mitigation readiness gates.",
    commandCenterVisible: true,
  };
}

export function validateIncidentSignalPreview(signal = {}) {
  const errors = [];
  for (const field of P70_3_REQUIRED_FIELDS) {
    if (!(field in signal)) errors.push(`missing ${field}`);
  }
  if (signal.targetKind !== "nexus_os") errors.push("targetKind must be nexus_os");
  if (!Array.isArray(signal.allowedFiles) || signal.allowedFiles.length === 0) errors.push("allowedFiles must be non-empty");
  if (hasProjectPath(signal.allowedFiles)) errors.push("allowedFiles must not include project source paths");
  if (!Array.isArray(signal.forbiddenFiles) || !signal.forbiddenFiles.includes("projects/**")) errors.push("forbiddenFiles must include projects/**");
  if (signal.deployExecutionAllowed !== false) errors.push("deployExecutionAllowed must be false");
  if (signal.incidentExecutionAllowed !== false || signal.mitigationExecutionAllowed !== false || signal.rollbackExecutionAllowed !== false) errors.push("incident/mitigation/rollback execution must be disabled");
  if (signal.alertDispatchAllowed !== false) errors.push("alertDispatchAllowed must be false");
  if (signal.projectMutationAllowed !== false) errors.push("projectMutationAllowed must be false");
  if (signal.providerDispatchAllowed !== false || signal.toolExecutionAllowed !== false || signal.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (signal.dbWritesAllowed !== false || signal.networkCallsAllowed !== false || signal.providerSpendAllowed !== false) errors.push("db/network/spend must be false");
  if (!signal.disabledReason || /alert now|incident now|rollback now|mitigate now|deploy now|execute now/i.test(signal.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(signal.blockers) || signal.blockers.length < 4) errors.push("blockers must be visible");
  if (!Array.isArray(signal.evidenceRefs) || signal.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(signal.activityRefs) || signal.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildIncidentSignalEnvelope(input = {}) {
  const signal = createIncidentSignalPreview(input);
  return createPassResult({
    phase: "P70.3",
    mode: "preview-only",
    source: "deploy-monitoring/p70-3-placeholder.js",
    summary: "Incident signal preview created without enabling alert, incident, mitigation, rollback, or deploy execution.",
    data: { signal },
    evidence: signal.evidenceRefs,
  });
}

export const P70_3_SAMPLE_SIGNALS = Object.freeze([
  createIncidentSignalPreview({
    monitorEvent: createDeployMonitorEvent({
      allowedFiles: ["deploy-monitoring/p70-3-placeholder.js", "scripts/check-p703.js", "reports/p703-report.md"],
      evidenceRefs: ["reports/p703-report.md"],
      activityRefs: ["os-roadmap/phase-status.json#P70.3"],
    }),
  }),
]);
