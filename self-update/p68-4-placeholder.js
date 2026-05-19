import { createPassResult } from "../shared/resultEnvelope.js";
import { createSelfUpdateProposalPreview, validateSelfUpdateProposalPreview } from "./p68-3-placeholder.js";

export const P68_4_REQUIRED_FIELDS = Object.freeze([
  "gateId",
  "proposalId",
  "intentId",
  "currentState",
  "approvalRequired",
  "approvalState",
  "scopeAllowed",
  "rollbackReady",
  "validationReady",
  "safetyAllowed",
  "applyAllowed",
  "selfUpdateAllowed",
  "projectMutationAllowed",
  "executionAllowed",
  "disabledReason",
  "allowedFiles",
  "forbiddenFiles",
  "blockers",
  "requiredEvidence",
  "evidenceRefs",
  "activityRefs",
  "ownerCapability",
  "nextAction",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function hasProjectPath(paths = []) {
  return normalizeList(paths).some((filePath) => filePath === "projects/**" || filePath.startsWith("projects/"));
}

export function createSelfUpdateGate(input = {}) {
  const proposal = input.proposal || createSelfUpdateProposalPreview(input);
  const proposalValidation = validateSelfUpdateProposalPreview(proposal);
  const scopeAllowed = proposalValidation.valid && !hasProjectPath(proposal.allowedFiles) && proposal.forbiddenFiles.includes("projects/**");
  const rollbackReady = proposal.rollbackPlan?.state === "documented";
  const validationReady = normalizeList(proposal.validationCommands).includes("git diff --check");
  return {
    gateId: input.gateId || "p68-4-self-update-gate",
    proposalId: proposal.proposalId,
    intentId: proposal.intentId,
    currentState: scopeAllowed && rollbackReady && validationReady ? "ready_for_operator_review" : "blocked",
    approvalRequired: true,
    approvalState: input.approvalState || "not_requested",
    scopeAllowed,
    rollbackReady,
    validationReady,
    safetyAllowed: false,
    applyAllowed: false,
    selfUpdateAllowed: false,
    projectMutationAllowed: false,
    executionAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    dbWritesAllowed: false,
    deployAllowed: false,
    providerSpendAllowed: false,
    disabledReason: "P68.4 records approval and rollback gates only; self-update apply remains disabled.",
    allowedFiles: [...proposal.allowedFiles],
    forbiddenFiles: [...proposal.forbiddenFiles],
    blockers: [
      ...normalizeList(proposal.blockers),
      "Operator approval has not been granted.",
      "Self-update gate cannot unlock apply in P68.4.",
      ...normalizeList(input.blockers),
    ],
    requiredEvidence: [
      "Operator approval record",
      "Scoped file review",
      "Rollback acknowledgement",
      "Validation command results",
    ],
    evidenceRefs: [...new Set([...normalizeList(proposal.evidenceRefs), "reports/p684-report.md"])],
    activityRefs: [...new Set([...normalizeList(proposal.activityRefs), "os-roadmap/phase-status.json#P68.4"])],
    ownerCapability: proposal.ownerCapability,
    nextAction: input.nextAction || "Render this gate as P68.5 Command Center self-update readiness.",
    commandCenterVisible: true,
  };
}

export function validateSelfUpdateGate(gate = {}) {
  const errors = [];
  for (const field of P68_4_REQUIRED_FIELDS) {
    if (!(field in gate)) errors.push(`missing ${field}`);
  }
  if (!Array.isArray(gate.allowedFiles) || gate.allowedFiles.length === 0) errors.push("allowedFiles must be non-empty");
  if (!Array.isArray(gate.forbiddenFiles) || !gate.forbiddenFiles.includes("projects/**")) errors.push("forbiddenFiles must include projects/**");
  if (hasProjectPath(gate.allowedFiles)) errors.push("allowedFiles must not include project source paths");
  if (gate.approvalRequired !== true) errors.push("approvalRequired must be true");
  if (gate.applyAllowed !== false || gate.selfUpdateAllowed !== false || gate.projectMutationAllowed !== false) errors.push("apply and mutation must remain disabled");
  if (gate.executionAllowed !== false) errors.push("executionAllowed must be false");
  if (gate.providerDispatchAllowed !== false) errors.push("providerDispatchAllowed must be false");
  if (gate.toolExecutionAllowed !== false) errors.push("toolExecutionAllowed must be false");
  if (gate.workerExecutionAllowed !== false) errors.push("workerExecutionAllowed must be false");
  if (gate.dbWritesAllowed !== false) errors.push("dbWritesAllowed must be false");
  if (gate.deployAllowed !== false) errors.push("deployAllowed must be false");
  if (gate.providerSpendAllowed !== false) errors.push("providerSpendAllowed must be false");
  if (!gate.disabledReason || /apply now|run now|execute now/i.test(gate.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(gate.blockers) || gate.blockers.length === 0) errors.push("blockers must be visible");
  if (!Array.isArray(gate.requiredEvidence) || gate.requiredEvidence.length < 4) errors.push("requiredEvidence must be visible");
  if (!Array.isArray(gate.evidenceRefs) || gate.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(gate.activityRefs) || gate.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildSelfUpdateGateEnvelope(input = {}) {
  const gate = createSelfUpdateGate(input);
  return createPassResult({
    phase: "P68.4",
    mode: "preview-only",
    source: "self-update/p68-4-placeholder.js",
    summary: "Self-update approval and rollback gate recorded without enabling apply.",
    data: { gate },
    evidence: gate.evidenceRefs,
  });
}

export const P68_4_SAMPLE_GATES = Object.freeze([
  createSelfUpdateGate({
    proposal: createSelfUpdateProposalPreview({
      allowedFiles: ["self-update/p68-4-placeholder.js", "scripts/check-p684.js", "reports/p684-report.md"],
      evidenceRefs: ["reports/p684-report.md"],
      activityRefs: ["os-roadmap/phase-status.json#P68.4"],
    }),
  }),
]);
