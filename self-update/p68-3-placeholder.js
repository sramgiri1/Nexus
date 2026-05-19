import { createPassResult } from "../shared/resultEnvelope.js";
import { createSelfUpdateIntentContract, validateSelfUpdateIntentContract } from "./p68-2-placeholder.js";

export const P68_3_REQUIRED_FIELDS = Object.freeze([
  "proposalId",
  "intentId",
  "currentState",
  "summary",
  "scope",
  "targetKind",
  "allowedFiles",
  "forbiddenFiles",
  "proposedUpdates",
  "validationCommands",
  "rollbackPlan",
  "approvalRequired",
  "approvalState",
  "selfUpdateAllowed",
  "projectMutationAllowed",
  "executionAllowed",
  "applyAllowed",
  "disabledReason",
  "blockers",
  "evidenceRefs",
  "activityRefs",
  "ownerCapability",
  "nextAction",
]);

const DEFAULT_VALIDATION_COMMANDS = Object.freeze([
  "npm run check:p683",
  "npm run check:p68-execution-plan",
  "npm run check:phase-validation-coverage",
  "npm run check:os-phase-status",
  "npm run check:format-readability",
  "git diff --check",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function hasProjectPath(paths = []) {
  return normalizeList(paths).some((filePath) => filePath === "projects/**" || filePath.startsWith("projects/"));
}

function createProposedUpdates(intent) {
  return intent.allowedFiles.map((filePath) => ({
    filePath,
    operation: "preview_update",
    purpose: "Prepare a reviewable NEXUS OS self-update artifact.",
    previewState: "not_generated",
    applyState: "disabled",
  }));
}

export function createSelfUpdateProposalPreview(input = {}) {
  const intent = input.intent || createSelfUpdateIntentContract(input);
  const intentValidation = validateSelfUpdateIntentContract(intent);
  return {
    proposalId: input.proposalId || "p68-3-self-update-proposal",
    intentId: intent.intentId,
    currentState: intentValidation.valid ? "preview_ready" : "blocked",
    summary: input.summary || "Preview a NEXUS OS self-update proposal without generating or applying source patches.",
    scope: intent.scope,
    targetKind: intent.targetKind,
    allowedFiles: [...intent.allowedFiles],
    forbiddenFiles: [...intent.forbiddenFiles],
    proposedUpdates: normalizeList(input.proposedUpdates).length ? input.proposedUpdates : createProposedUpdates(intent),
    validationCommands: [...new Set([...DEFAULT_VALIDATION_COMMANDS, ...normalizeList(input.validationCommands)])],
    rollbackPlan: {
      state: "documented",
      command: "git revert <future-approved-self-update-commit>",
      notes: "Rollback is documentation-only until a later approved self-update apply path exists.",
    },
    approvalRequired: true,
    approvalState: intent.approvalState || "not_requested",
    selfUpdateAllowed: false,
    projectMutationAllowed: false,
    executionAllowed: false,
    applyAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    dbWritesAllowed: false,
    deployAllowed: false,
    providerSpendAllowed: false,
    disabledReason: "P68.3 builds a self-update proposal preview only; approval and apply execution are disabled.",
    blockers: [
      ...normalizeList(intent.blockers),
      "Self-update proposal is preview-only until approval and rollback gates are complete.",
      "No apply command is available in P68.3.",
      ...normalizeList(input.blockers),
    ],
    evidenceRefs: [...new Set([...normalizeList(intent.evidenceRefs), "reports/p683-report.md"])],
    activityRefs: [...new Set([...normalizeList(intent.activityRefs), "os-roadmap/phase-status.json#P68.3"])],
    ownerCapability: intent.ownerCapability,
    nextAction: input.nextAction || "Route this proposal through P68.4 approval and rollback gates.",
    commandCenterVisible: true,
  };
}

export function validateSelfUpdateProposalPreview(proposal = {}) {
  const errors = [];
  for (const field of P68_3_REQUIRED_FIELDS) {
    if (!(field in proposal)) errors.push(`missing ${field}`);
  }
  if (proposal.targetKind !== "nexus_os") errors.push("targetKind must be nexus_os");
  if (!Array.isArray(proposal.allowedFiles) || proposal.allowedFiles.length === 0) errors.push("allowedFiles must be non-empty");
  if (!Array.isArray(proposal.forbiddenFiles) || !proposal.forbiddenFiles.includes("projects/**")) errors.push("forbiddenFiles must include projects/**");
  if (hasProjectPath(proposal.allowedFiles)) errors.push("allowedFiles must not include project source paths");
  if (!Array.isArray(proposal.proposedUpdates) || proposal.proposedUpdates.length === 0) errors.push("proposedUpdates must be visible");
  if (proposal.proposedUpdates?.some((update) => hasProjectPath([update.filePath]))) errors.push("proposedUpdates must not include project source paths");
  if (!Array.isArray(proposal.validationCommands) || !proposal.validationCommands.includes("git diff --check")) errors.push("validationCommands must include git diff --check");
  if (proposal.selfUpdateAllowed !== false || proposal.applyAllowed !== false || proposal.projectMutationAllowed !== false) errors.push("self-update apply and mutation must be disabled");
  if (proposal.executionAllowed !== false) errors.push("executionAllowed must be false");
  if (proposal.providerDispatchAllowed !== false) errors.push("providerDispatchAllowed must be false");
  if (proposal.toolExecutionAllowed !== false) errors.push("toolExecutionAllowed must be false");
  if (proposal.workerExecutionAllowed !== false) errors.push("workerExecutionAllowed must be false");
  if (proposal.dbWritesAllowed !== false) errors.push("dbWritesAllowed must be false");
  if (proposal.deployAllowed !== false) errors.push("deployAllowed must be false");
  if (proposal.providerSpendAllowed !== false) errors.push("providerSpendAllowed must be false");
  if (!proposal.disabledReason || /apply now|run now|execute now/i.test(proposal.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(proposal.blockers) || proposal.blockers.length === 0) errors.push("blockers must be visible");
  if (!Array.isArray(proposal.evidenceRefs) || proposal.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(proposal.activityRefs) || proposal.activityRefs.length === 0) errors.push("activityRefs must be visible");
  if (proposal.scope?.displaySafe !== true) errors.push("scope must be display safe");
  return { valid: errors.length === 0, errors };
}

export function buildSelfUpdateProposalEnvelope(input = {}) {
  const proposal = createSelfUpdateProposalPreview(input);
  return createPassResult({
    phase: "P68.3",
    mode: "preview-only",
    source: "self-update/p68-3-placeholder.js",
    summary: "Self-update proposal preview created without generating or applying source patches.",
    data: { proposal },
    evidence: proposal.evidenceRefs,
  });
}

export const P68_3_SAMPLE_PROPOSALS = Object.freeze([
  createSelfUpdateProposalPreview({
    intent: createSelfUpdateIntentContract({
      intentId: "p68-3-self-update-preview-intent",
      allowedFiles: ["self-update/p68-3-placeholder.js", "scripts/check-p683.js", "reports/p683-report.md"],
      evidenceRefs: ["reports/p683-report.md"],
      activityRefs: ["os-roadmap/phase-status.json#P68.3"],
    }),
  }),
]);
