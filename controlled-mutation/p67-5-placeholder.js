import { createPassResult } from "../shared/resultEnvelope.js";
import { createMutationScopeGate, validateMutationScopeGate } from "./p67-4-placeholder.js";

export const P67_5_REQUIRED_FIELDS = Object.freeze([
  "cardId",
  "title",
  "currentState",
  "intent",
  "diffPreviewState",
  "approvalState",
  "ownerCapability",
  "allowedFiles",
  "forbiddenFiles",
  "blockers",
  "rollbackPosture",
  "evidenceLocation",
  "activityLocation",
  "nextAction",
  "applyAllowed",
  "mutationAllowed",
  "projectMutationAllowed",
  "executionAllowed",
  "disabledReason",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

export function createControlledMutationReadinessCard(input = {}) {
  const gate = input.gate || createMutationScopeGate(input);
  const gateValidation = validateMutationScopeGate(gate);
  const allowedFiles = normalizeList(gate.allowedFiles);
  return {
    cardId: input.cardId || "controlled-mutation-readiness",
    title: "Controlled Mutation Readiness",
    currentState: gateValidation.valid ? "Blocked - review required" : "Blocked - invalid gate",
    intent: "Preview a scoped source change before approval or apply exists.",
    diffPreviewState: "Preview only",
    approvalState: gate.approvalState || "not_requested",
    ownerCapability: gate.ownerCapability || "CORE.controlledMutation",
    allowedFiles: allowedFiles.length ? allowedFiles : [
      "controlled-mutation/p67-5-placeholder.js",
      "scripts/check-p675.js",
      "reports/p675-report.md",
    ],
    forbiddenFiles: normalizeList(gate.forbiddenFiles),
    blockers: normalizeList(gate.blockers),
    rollbackPosture: gate.rollbackReady ? "Documented" : "Missing",
    evidenceLocation: gate.evidenceRefs?.[0] || "reports/p675-report.md",
    activityLocation: gate.activityRefs?.[0] || "os-roadmap/phase-status.json",
    nextAction: input.nextAction || "Complete tests, docs, and final validation before any future apply gate.",
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
    disabledReason: "Apply disabled: controlled source mutation requires later validation and explicit approval gates.",
    commandCenterVisible: true,
  };
}

export function validateControlledMutationReadinessCard(card = {}) {
  const errors = [];
  for (const field of P67_5_REQUIRED_FIELDS) {
    if (!(field in card)) errors.push(`missing ${field}`);
  }
  if (!Array.isArray(card.allowedFiles) || card.allowedFiles.length === 0) errors.push("allowedFiles must be visible");
  if (!Array.isArray(card.forbiddenFiles) || !card.forbiddenFiles.includes("projects/**")) {
    errors.push("forbiddenFiles must include projects/**");
  }
  if (card.allowedFiles?.some((filePath) => filePath.startsWith("projects/"))) {
    errors.push("allowedFiles must not include project source paths");
  }
  if (!Array.isArray(card.blockers) || card.blockers.length === 0) errors.push("blockers must be visible");
  if (card.applyAllowed !== false || card.mutationAllowed !== false || card.projectMutationAllowed !== false) {
    errors.push("apply and mutation must remain disabled");
  }
  if (card.executionAllowed !== false) errors.push("executionAllowed must be false");
  if (card.providerDispatchAllowed !== false) errors.push("providerDispatchAllowed must be false");
  if (card.toolExecutionAllowed !== false) errors.push("toolExecutionAllowed must be false");
  if (card.workerExecutionAllowed !== false) errors.push("workerExecutionAllowed must be false");
  if (card.dbWritesAllowed !== false) errors.push("dbWritesAllowed must be false");
  if (card.deployAllowed !== false) errors.push("deployAllowed must be false");
  if (card.providerSpendAllowed !== false) errors.push("providerSpendAllowed must be false");
  if (!card.disabledReason || /apply now|run now|execute now/i.test(card.disabledReason)) {
    errors.push("disabledReason must not imply runnable behavior");
  }
  if (/P67\./.test(`${card.title} ${card.intent} ${card.nextAction}`)) {
    errors.push("primary card copy must not expose internal phase labels");
  }
  return { valid: errors.length === 0, errors };
}

export function buildControlledMutationReadinessEnvelope(input = {}) {
  const card = createControlledMutationReadinessCard(input);
  return createPassResult({
    phase: "P67.5",
    mode: "display-only",
    source: "controlled-mutation/p67-5-placeholder.js",
    summary: "Command Center readiness card created without runnable apply actions.",
    data: { card },
    evidence: [card.evidenceLocation],
  });
}

export const P67_5_SAMPLE_READINESS_CARDS = Object.freeze([
  createControlledMutationReadinessCard(),
]);
