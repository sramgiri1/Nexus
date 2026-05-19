import { createPassResult } from "../shared/resultEnvelope.js";
import { createIncidentSignalPreview, validateIncidentSignalPreview } from "./p70-3-placeholder.js";

export const P70_4_REQUIRED_FIELDS = Object.freeze([
  "gateId",
  "signalId",
  "monitorId",
  "deployId",
  "incidentState",
  "severity",
  "approvalRequired",
  "approvalState",
  "validationReady",
  "rollbackReady",
  "evidenceReady",
  "costReviewed",
  "mitigationAllowed",
  "rollbackExecutionAllowed",
  "alertDispatchAllowed",
  "deployExecutionAllowed",
  "incidentExecutionAllowed",
  "projectMutationAllowed",
  "providerDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "providerSpendAllowed",
  "disabledReason",
  "blockers",
  "requiredEvidence",
  "evidenceRefs",
  "activityRefs",
  "costImpact",
  "ownerCapability",
  "nextAction",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

export function createMitigationReadinessGate(input = {}) {
  const signal = input.signal || createIncidentSignalPreview(input);
  const signalValidation = validateIncidentSignalPreview(signal);
  return {
    gateId: input.gateId || "mitigation-readiness-gate-preview",
    signalId: signal.signalId,
    monitorId: signal.monitorId,
    deployId: signal.deployId,
    incidentState: signal.incidentState,
    severity: signal.severity,
    approvalRequired: true,
    approvalState: input.approvalState || "not_requested",
    validationReady: signalValidation.valid,
    rollbackReady: true,
    evidenceReady: normalizeList(signal.evidenceRefs).length > 0,
    costReviewed: String(signal.costImpact || "").includes("No provider calls"),
    mitigationAllowed: false,
    rollbackExecutionAllowed: false,
    alertDispatchAllowed: false,
    deployExecutionAllowed: false,
    incidentExecutionAllowed: false,
    projectMutationAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    dbWritesAllowed: false,
    networkCallsAllowed: false,
    providerSpendAllowed: false,
    disabledReason: "P70.4 records mitigation readiness only; mitigation, rollback, alert, incident, and deploy execution remain disabled.",
    blockers: [
      ...normalizeList(signal.blockers),
      "Operator approval has not been granted.",
      "Mitigation execution cannot be unlocked in P70.4.",
      ...normalizeList(input.blockers),
    ],
    requiredEvidence: [
      "Operator approval record",
      "Incident signal preview",
      "Validation command results",
      "Rollback acknowledgement",
      "Cost review",
      "Mitigation safety review",
    ],
    evidenceRefs: [...new Set([...normalizeList(signal.evidenceRefs), "reports/p704-report.md"])],
    activityRefs: [...new Set([...normalizeList(signal.activityRefs), "os-roadmap/phase-status.json#P70.4"])],
    costImpact: signal.costImpact,
    ownerCapability: signal.ownerCapability,
    nextAction: input.nextAction || "Render this gate as P70.5 Command Center monitoring readiness.",
    commandCenterVisible: true,
  };
}

export function validateMitigationReadinessGate(gate = {}) {
  const errors = [];
  for (const field of P70_4_REQUIRED_FIELDS) {
    if (!(field in gate)) errors.push(`missing ${field}`);
  }
  if (gate.approvalRequired !== true) errors.push("approvalRequired must be true");
  if (gate.mitigationAllowed !== false) errors.push("mitigationAllowed must be false");
  if (gate.rollbackExecutionAllowed !== false || gate.alertDispatchAllowed !== false) errors.push("rollback/alert execution must be disabled");
  if (gate.deployExecutionAllowed !== false || gate.incidentExecutionAllowed !== false) errors.push("deploy/incident execution must be disabled");
  if (gate.projectMutationAllowed !== false) errors.push("projectMutationAllowed must be false");
  if (gate.providerDispatchAllowed !== false || gate.toolExecutionAllowed !== false || gate.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (gate.dbWritesAllowed !== false || gate.networkCallsAllowed !== false || gate.providerSpendAllowed !== false) errors.push("db/network/spend must be false");
  if (!gate.disabledReason || /mitigate now|rollback now|alert now|incident now|deploy now|execute now/i.test(gate.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(gate.blockers) || gate.blockers.length < 4) errors.push("blockers must be visible");
  if (!Array.isArray(gate.requiredEvidence) || gate.requiredEvidence.length < 6) errors.push("requiredEvidence must be visible");
  if (!Array.isArray(gate.evidenceRefs) || gate.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(gate.activityRefs) || gate.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildMitigationReadinessGateEnvelope(input = {}) {
  const gate = createMitigationReadinessGate(input);
  return createPassResult({
    phase: "P70.4",
    mode: "preview-only",
    source: "deploy-monitoring/p70-4-placeholder.js",
    summary: "Mitigation readiness gate recorded without enabling mitigation, rollback, alert, incident, or deploy execution.",
    data: { gate },
    evidence: gate.evidenceRefs,
  });
}

export const P70_4_SAMPLE_GATES = Object.freeze([
  createMitigationReadinessGate({
    signal: createIncidentSignalPreview({
      allowedFiles: ["deploy-monitoring/p70-4-placeholder.js", "scripts/check-p704.js", "reports/p704-report.md"],
      evidenceRefs: ["reports/p704-report.md"],
      activityRefs: ["os-roadmap/phase-status.json#P70.4"],
    }),
  }),
]);
