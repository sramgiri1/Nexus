import { createPassResult } from "../shared/resultEnvelope.js";
import { createPatchPlanPreview, validatePatchPlanPreview } from "./p67-3-placeholder.js";

export const SCOPE_GATE_STATES = Object.freeze({
  BLOCKED: "blocked",
  READY_FOR_OPERATOR_REVIEW: "ready_for_operator_review",
});

export const P67_4_REQUIRED_FIELDS = Object.freeze([
  "gateId",
  "planId",
  "intentId",
  "currentState",
  "approvalRequired",
  "approvalState",
  "scopeAllowed",
  "safetyAllowed",
  "rollbackReady",
  "validationReady",
  "applyAllowed",
  "mutationAllowed",
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

export function createMutationScopeGate(input = {}) {
  const plan = input.plan || createPatchPlanPreview(input);
  const planValidation = validatePatchPlanPreview(plan);
  const scopeAllowed = planValidation.valid && !hasProjectPath(plan.allowedFiles) && plan.forbiddenFiles.includes("projects/**");
  const validationReady = normalizeList(plan.validationCommands).includes("git diff --check");
  const rollbackReady = plan.rollbackPlan?.state === "documented";
  const requiredEvidence = [
    "Operator approval record",
    "Scoped file review",
    "Rollback acknowledgement",
    "Validation command results",
  ];
  const blockers = [
    ...normalizeList(plan.blockers),
    "Operator approval has not been granted.",
    "Scope gate is preview-only and cannot unlock apply in P67.4.",
    ...normalizeList(input.blockers),
  ];

  return {
    gateId: input.gateId || "p67-4-approval-scope-gate",
    planId: plan.planId,
    intentId: plan.intentId,
    currentState: scopeAllowed && rollbackReady && validationReady
      ? SCOPE_GATE_STATES.READY_FOR_OPERATOR_REVIEW
      : SCOPE_GATE_STATES.BLOCKED,
    approvalRequired: true,
    approvalState: input.approvalState || "not_requested",
    scopeAllowed,
    safetyAllowed: false,
    rollbackReady,
    validationReady,
    applyAllowed: false,
    mutationAllowed: false,
    projectMutationAllowed: false,
    executionAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    dbWritesAllowed: false,
    deployAllowed: false,
    providerSpendAllowed: false,
    disabledReason: "P67.4 records approval and scope gates only; apply execution remains disabled.",
    allowedFiles: [...plan.allowedFiles],
    forbiddenFiles: [...plan.forbiddenFiles],
    blockers,
    requiredEvidence,
    evidenceRefs: [...new Set([...normalizeList(plan.evidenceRefs), "reports/p674-report.md"])],
    activityRefs: [...new Set([...normalizeList(plan.activityRefs), "os-roadmap/phase-status.json#P67.4"])],
    ownerCapability: plan.ownerCapability,
    nextAction: input.nextAction || "Render this gate as P67.5 Command Center controlled mutation readiness.",
    commandCenterVisible: true,
  };
}

export function validateMutationScopeGate(gate = {}) {
  const errors = [];
  for (const field of P67_4_REQUIRED_FIELDS) {
    if (!(field in gate)) errors.push(`missing ${field}`);
  }
  if (!Array.isArray(gate.allowedFiles) || gate.allowedFiles.length === 0) errors.push("allowedFiles must be non-empty");
  if (!Array.isArray(gate.forbiddenFiles) || !gate.forbiddenFiles.includes("projects/**")) {
    errors.push("forbiddenFiles must include projects/**");
  }
  if (hasProjectPath(gate.allowedFiles)) errors.push("allowedFiles must not include project source paths");
  if (gate.approvalRequired !== true) errors.push("approvalRequired must be true");
  if (gate.applyAllowed !== false || gate.mutationAllowed !== false || gate.projectMutationAllowed !== false) {
    errors.push("apply and mutation must remain disabled");
  }
  if (gate.executionAllowed !== false) errors.push("executionAllowed must be false");
  if (gate.providerDispatchAllowed !== false) errors.push("providerDispatchAllowed must be false");
  if (gate.toolExecutionAllowed !== false) errors.push("toolExecutionAllowed must be false");
  if (gate.workerExecutionAllowed !== false) errors.push("workerExecutionAllowed must be false");
  if (gate.dbWritesAllowed !== false) errors.push("dbWritesAllowed must be false");
  if (gate.deployAllowed !== false) errors.push("deployAllowed must be false");
  if (gate.providerSpendAllowed !== false) errors.push("providerSpendAllowed must be false");
  if (!gate.disabledReason || /apply now|run now|execute now/i.test(gate.disabledReason)) {
    errors.push("disabledReason must not imply runnable behavior");
  }
  if (!Array.isArray(gate.blockers) || gate.blockers.length === 0) errors.push("blockers must be visible");
  if (!Array.isArray(gate.requiredEvidence) || gate.requiredEvidence.length < 4) errors.push("requiredEvidence must be visible");
  if (!Array.isArray(gate.evidenceRefs) || gate.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(gate.activityRefs) || gate.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildMutationScopeGateEnvelope(input = {}) {
  const gate = createMutationScopeGate(input);
  return createPassResult({
    phase: "P67.4",
    mode: "preview-only",
    source: "controlled-mutation/p67-4-placeholder.js",
    summary: "Approval and scope gate recorded without enabling apply or execution.",
    data: { gate },
    evidence: gate.evidenceRefs,
  });
}

export const P67_4_SAMPLE_SCOPE_GATES = Object.freeze([
  createMutationScopeGate({
    plan: createPatchPlanPreview({
      allowedFiles: [
        "controlled-mutation/p67-4-placeholder.js",
        "scripts/check-p674.js",
        "reports/p674-report.md",
      ],
      evidenceRefs: ["reports/p674-report.md"],
      activityRefs: ["os-roadmap/phase-status.json#P67.4"],
    }),
  }),
]);
