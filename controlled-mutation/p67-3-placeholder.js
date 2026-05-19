import { createPassResult } from "../shared/resultEnvelope.js";
import { createMutationIntentContract, validateMutationIntentContract } from "./p67-2-placeholder.js";

export const PATCH_PLAN_STATES = Object.freeze({
  PREVIEW_READY: "preview_ready",
  BLOCKED: "blocked",
});

export const P67_3_REQUIRED_FIELDS = Object.freeze([
  "planId",
  "intentId",
  "currentState",
  "summary",
  "scope",
  "targetKind",
  "allowedFiles",
  "forbiddenFiles",
  "proposedChanges",
  "validationCommands",
  "rollbackPlan",
  "approvalRequired",
  "approvalState",
  "mutationAllowed",
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
  "npm run check:p673",
  "npm run check:p67-execution-plan",
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

function createProposedChanges(intent) {
  return intent.allowedFiles.map((filePath) => ({
    filePath,
    operation: "preview_update",
    purpose: "Prepare a reviewable P67 controlled mutation artifact.",
    diffState: "not_generated",
    applyState: "disabled",
  }));
}

export function createPatchPlanPreview(input = {}) {
  const intent = input.intent || createMutationIntentContract(input);
  const intentValidation = validateMutationIntentContract(intent);
  const blockers = [
    ...normalizeList(intent.blockers),
    "Patch plan is preview-only until approval and scope gates are complete.",
    "No apply command is available in P67.3.",
    ...normalizeList(input.blockers),
  ];

  return {
    planId: input.planId || "p67-3-patch-plan-preview",
    intentId: intent.intentId,
    currentState: intentValidation.valid ? PATCH_PLAN_STATES.PREVIEW_READY : PATCH_PLAN_STATES.BLOCKED,
    summary: input.summary || "Preview controlled mutation plan without generating or applying a source patch.",
    scope: intent.scope,
    targetKind: intent.targetKind,
    allowedFiles: [...intent.allowedFiles],
    forbiddenFiles: [...intent.forbiddenFiles],
    proposedChanges: normalizeList(input.proposedChanges).length ? input.proposedChanges : createProposedChanges(intent),
    validationCommands: [...new Set([...DEFAULT_VALIDATION_COMMANDS, ...normalizeList(input.validationCommands)])],
    rollbackPlan: {
      state: "documented",
      command: "git revert <future-approved-commit>",
      ownerCapability: intent.ownerCapability,
      notes: "Rollback is documentation-only until a later approved mutation path exists.",
    },
    approvalRequired: true,
    approvalState: intent.approvalState || "not_requested",
    mutationAllowed: false,
    projectMutationAllowed: false,
    executionAllowed: false,
    applyAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    dbWritesAllowed: false,
    deployAllowed: false,
    providerSpendAllowed: false,
    disabledReason: "P67.3 builds a patch plan preview only; approval, scope gate, and apply execution are disabled.",
    blockers,
    evidenceRefs: [...new Set([...normalizeList(intent.evidenceRefs), "reports/p673-report.md"])],
    activityRefs: [...new Set([...normalizeList(intent.activityRefs), "os-roadmap/phase-status.json#P67.3"])],
    ownerCapability: intent.ownerCapability,
    nextAction: input.nextAction || "Route this preview through P67.4 approval and scope gates.",
    commandCenterVisible: true,
  };
}

export function validatePatchPlanPreview(plan = {}) {
  const errors = [];
  for (const field of P67_3_REQUIRED_FIELDS) {
    if (!(field in plan)) errors.push(`missing ${field}`);
  }
  if (plan.targetKind !== "nexus_os") errors.push("targetKind must remain nexus_os in P67.3");
  if (!Array.isArray(plan.allowedFiles) || plan.allowedFiles.length === 0) errors.push("allowedFiles must be non-empty");
  if (!Array.isArray(plan.forbiddenFiles) || !plan.forbiddenFiles.includes("projects/**")) {
    errors.push("forbiddenFiles must include projects/**");
  }
  if (hasProjectPath(plan.allowedFiles)) errors.push("allowedFiles must not include project source paths");
  if (!Array.isArray(plan.proposedChanges) || plan.proposedChanges.length === 0) errors.push("proposedChanges must be visible");
  if (plan.proposedChanges?.some((change) => hasProjectPath([change.filePath]))) {
    errors.push("proposedChanges must not include project source paths");
  }
  if (!Array.isArray(plan.validationCommands) || !plan.validationCommands.includes("git diff --check")) {
    errors.push("validationCommands must include git diff --check");
  }
  if (plan.mutationAllowed !== false || plan.projectMutationAllowed !== false || plan.applyAllowed !== false) {
    errors.push("mutation and apply must be disabled");
  }
  if (plan.executionAllowed !== false) errors.push("executionAllowed must be false");
  if (plan.providerDispatchAllowed !== false) errors.push("providerDispatchAllowed must be false");
  if (plan.toolExecutionAllowed !== false) errors.push("toolExecutionAllowed must be false");
  if (plan.workerExecutionAllowed !== false) errors.push("workerExecutionAllowed must be false");
  if (plan.dbWritesAllowed !== false) errors.push("dbWritesAllowed must be false");
  if (plan.deployAllowed !== false) errors.push("deployAllowed must be false");
  if (plan.providerSpendAllowed !== false) errors.push("providerSpendAllowed must be false");
  if (!plan.disabledReason || /apply now|run now|execute now/i.test(plan.disabledReason)) {
    errors.push("disabledReason must not imply runnable behavior");
  }
  if (!Array.isArray(plan.blockers) || plan.blockers.length === 0) errors.push("blockers must be visible");
  if (!Array.isArray(plan.evidenceRefs) || plan.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(plan.activityRefs) || plan.activityRefs.length === 0) errors.push("activityRefs must be visible");
  if (plan.scope?.displaySafe !== true) errors.push("scope must be display safe");
  return { valid: errors.length === 0, errors };
}

export function buildPatchPlanEnvelope(input = {}) {
  const plan = createPatchPlanPreview(input);
  return createPassResult({
    phase: "P67.3",
    mode: "preview-only",
    source: "controlled-mutation/p67-3-placeholder.js",
    summary: "Patch plan preview created without generating or applying source patches.",
    data: { plan },
    evidence: plan.evidenceRefs,
  });
}

export const P67_3_SAMPLE_PATCH_PLANS = Object.freeze([
  createPatchPlanPreview({
    intent: createMutationIntentContract({
      intentId: "p67-3-nexus-os-preview-intent",
      displayTitle: "Preview controlled mutation plan",
      allowedFiles: [
        "controlled-mutation/p67-3-placeholder.js",
        "scripts/check-p673.js",
        "reports/p673-report.md",
      ],
      evidenceRefs: ["reports/p673-report.md"],
      activityRefs: ["os-roadmap/phase-status.json#P67.3"],
    }),
  }),
]);
