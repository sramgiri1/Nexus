import { buildLiveExecutionGate } from "../live-execution/liveExecutionGate.js";
import { createBlockedResult, createPassResult } from "../shared/resultEnvelope.js";
import { summarizeRedaction } from "../shared/redaction.js";

export const LIVE_COMMAND_ADMISSION_PHASE = "P79.2";

export const LIVE_COMMAND_ADMISSION_STATES = ["blocked", "admitted"];

export const LIVE_COMMAND_REQUIRED_APPROVALS = [
  "operatorApproval",
  "capabilityScope",
  "budgetLimit",
  "rollbackPlan",
  "activityLedger",
  "costLedger",
  "redactionCheck",
];

function normalizeCapability(capability = "") {
  return String(capability || "").trim();
}

function collectMissingApprovals(approval = {}) {
  return LIVE_COMMAND_REQUIRED_APPROVALS.filter((field) => approval[field] !== true);
}

export function buildLiveCommandAdmission(input = {}) {
  const mode = input.mode || "unknown";
  const capability = normalizeCapability(input.capability);
  const approval = input.approval || {};
  const redaction = summarizeRedaction(input.intent || {});
  const gate = buildLiveExecutionGate({ mode });
  const capabilityGate = gate.data?.capabilities?.find((entry) => entry.capability === capability);
  const missingApprovals = collectMissingApprovals(approval);
  const knownCapability = Boolean(capabilityGate);
  const admitted = gate.ok === true && knownCapability && missingApprovals.length === 0 && capabilityGate.enabled === false;
  const envelopeFactory = admitted ? createPassResult : createBlockedResult;
  const disabledReason = admitted
    ? ""
    : capabilityGate?.disabledReason || "Live command admission is blocked because the requested capability is unknown or incomplete.";

  return envelopeFactory({
    phase: LIVE_COMMAND_ADMISSION_PHASE,
    mode,
    source: "command-interface/liveCommandAdmission.js",
    summary: admitted
      ? "Live command admission record is complete; execution remains disabled until a later runtime subphase consumes it."
      : "Live command admission is blocked until mode, capability, approval, scope, budget, rollback, activity, cost, and redaction gates pass.",
    data: {
      state: admitted ? "admitted" : "blocked",
      capability,
      knownCapability,
      intent: redaction.redacted,
      redactionChanged: redaction.changed,
      requiredApprovals: [...LIVE_COMMAND_REQUIRED_APPROVALS],
      missingApprovals,
      approvalRequired: true,
      executionEnabled: false,
      dryRunOnly: true,
      providerCallsAllowed: false,
      toolExecutionAllowed: false,
      workerExecutionAllowed: false,
      projectMutationAllowed: false,
      dbWritesAllowed: false,
      deployExecutionAllowed: false,
      providerSpendAllowed: false,
      disabledReason,
      blockers: admitted ? [] : [...missingApprovals, ...(knownCapability ? [] : ["knownCapability"])],
      nextAction: admitted
        ? "Route this admission through the next governed runtime subphase before execution."
        : "Collect missing approval evidence and re-run admission without exposing private IDs or secrets.",
      ownerCapability: capabilityGate?.ownerCapability || "NEXUS OS Runtime Governance",
      evidenceLocation: capabilityGate?.evidenceLocation || "reports/p792-live-command-intent-report.md",
      activityLocation: capabilityGate?.activityLocation || "reports/os-phase-status-report.md",
      costImpact: capabilityGate?.costImpact || "No spend in P79.2; budget evidence is required.",
    },
    warnings: admitted ? ["Admission is not execution. Runtime mutation remains disabled."] : [disabledReason],
    evidence: ["reports/p792-live-command-intent-report.md", "reports/os-phase-status-report.md"],
  });
}

export function validateLiveCommandAdmission(admission = {}) {
  const errors = [];
  const data = admission.data || {};
  if (!LIVE_COMMAND_ADMISSION_STATES.includes(data.state)) errors.push("state must be blocked or admitted");
  if (data.executionEnabled !== false) errors.push("executionEnabled must be false");
  if (data.dryRunOnly !== true) errors.push("dryRunOnly must be true");
  for (const field of [
    "providerCallsAllowed",
    "toolExecutionAllowed",
    "workerExecutionAllowed",
    "projectMutationAllowed",
    "dbWritesAllowed",
    "deployExecutionAllowed",
    "providerSpendAllowed",
  ]) {
    if (data[field] !== false) errors.push(`${field} must be false`);
  }
  if (!Array.isArray(data.missingApprovals)) errors.push("missingApprovals must be an array");
  if (!Array.isArray(data.blockers)) errors.push("blockers must be an array");
  return { valid: errors.length === 0, errors };
}
