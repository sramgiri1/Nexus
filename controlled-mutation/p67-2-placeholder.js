import { createPassResult } from "../shared/resultEnvelope.js";
import { summarizeRedaction } from "../shared/redaction.js";

export const MUTATION_INTENT_STATES = Object.freeze({
  DRAFT: "draft",
  NEEDS_SCOPE_REVIEW: "needs_scope_review",
  BLOCKED: "blocked",
});

export const APPROVAL_STATES = Object.freeze({
  REQUIRED: "required",
  NOT_REQUESTED: "not_requested",
});

export const P67_2_REQUIRED_FIELDS = Object.freeze([
  "intentId",
  "scope",
  "targetKind",
  "displayTitle",
  "currentState",
  "allowedFiles",
  "forbiddenFiles",
  "diffPreview",
  "approvalRequired",
  "approvalState",
  "rollbackPlan",
  "mutationAllowed",
  "projectMutationAllowed",
  "executionAllowed",
  "disabledReason",
  "blockers",
  "evidenceRefs",
  "activityRefs",
  "ownerCapability",
  "nextAction",
]);

const DEFAULT_FORBIDDEN_FILES = Object.freeze([
  "projects/**",
  "providers/**",
  "tool-governance/adapters/**",
  "worker-runtime/workerRunner.js",
  "worker-runtime/queueRunner.js",
  "db/**",
  "prisma/**",
  "deploy/**",
  "release/**",
  "scripts/apply-project-mutation.js",
  ".env",
  ".env.*",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function hasForbiddenProjectPath(paths = []) {
  return normalizeList(paths).some((filePath) => filePath === "projects/**" || filePath.startsWith("projects/"));
}

function buildDisplayScope(input = {}) {
  const redaction = summarizeRedaction({
    label: input.displayLabel || input.scope || "NEXUS OS",
    privateProjectId: input.privateProjectId || "",
    rawProjectId: input.rawProjectId || "",
  });
  return {
    label: redaction.redacted.label || "NEXUS OS",
    target: input.targetKind || "nexus_os",
    redacted: redaction.changed || Boolean(input.privateProjectId || input.rawProjectId),
    displaySafe: true,
  };
}

export function createMutationIntentContract(input = {}) {
  const allowedFiles = normalizeList(input.allowedFiles);
  const forbiddenFiles = [...new Set([...DEFAULT_FORBIDDEN_FILES, ...normalizeList(input.forbiddenFiles)])];
  const blockers = [
    "Project source mutation is forbidden in P67.2.",
    "Automatic apply is disabled until patch preview and approval gates are complete.",
    ...normalizeList(input.blockers),
  ];

  return {
    intentId: input.intentId || "p67-2-controlled-mutation-intent",
    scope: buildDisplayScope(input),
    targetKind: input.targetKind || "nexus_os",
    displayTitle: input.displayTitle || "Controlled source mutation intent",
    currentState: input.currentState || MUTATION_INTENT_STATES.NEEDS_SCOPE_REVIEW,
    allowedFiles,
    forbiddenFiles,
    diffPreview: {
      state: "not_built",
      summary: "Patch preview is deferred to P67.3.",
      changedFiles: [],
    },
    approvalRequired: true,
    approvalState: input.approvalState || APPROVAL_STATES.NOT_REQUESTED,
    rollbackPlan: input.rollbackPlan || "Revert the future patch-plan commit before any apply path is enabled.",
    mutationAllowed: false,
    projectMutationAllowed: false,
    executionAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    dbWritesAllowed: false,
    deployAllowed: false,
    providerSpendAllowed: false,
    disabledReason: "Controlled mutation is intent-only in P67.2; patch preview, approval, and apply gates are not complete.",
    blockers,
    evidenceRefs: normalizeList(input.evidenceRefs),
    activityRefs: normalizeList(input.activityRefs),
    ownerCapability: input.ownerCapability || "CORE.controlledMutation",
    nextAction: input.nextAction || "Build P67.3 preview-only patch plan from this intent.",
    commandCenterVisible: true,
  };
}

export function validateMutationIntentContract(intent = {}) {
  const errors = [];
  for (const field of P67_2_REQUIRED_FIELDS) {
    if (!(field in intent)) errors.push(`missing ${field}`);
  }
  if (intent.targetKind !== "nexus_os") errors.push("targetKind must remain nexus_os in P67.2");
  if (!Array.isArray(intent.allowedFiles) || intent.allowedFiles.length === 0) errors.push("allowedFiles must be a non-empty array");
  if (!Array.isArray(intent.forbiddenFiles) || !intent.forbiddenFiles.includes("projects/**")) {
    errors.push("forbiddenFiles must include projects/**");
  }
  if (hasForbiddenProjectPath(intent.allowedFiles)) errors.push("allowedFiles must not include project source paths");
  if (intent.mutationAllowed !== false) errors.push("mutationAllowed must be false");
  if (intent.projectMutationAllowed !== false) errors.push("projectMutationAllowed must be false");
  if (intent.executionAllowed !== false) errors.push("executionAllowed must be false");
  if (intent.providerDispatchAllowed !== false) errors.push("providerDispatchAllowed must be false");
  if (intent.toolExecutionAllowed !== false) errors.push("toolExecutionAllowed must be false");
  if (intent.workerExecutionAllowed !== false) errors.push("workerExecutionAllowed must be false");
  if (intent.dbWritesAllowed !== false) errors.push("dbWritesAllowed must be false");
  if (intent.deployAllowed !== false) errors.push("deployAllowed must be false");
  if (intent.providerSpendAllowed !== false) errors.push("providerSpendAllowed must be false");
  if (!intent.disabledReason || /apply now|run now|execute now/i.test(intent.disabledReason)) {
    errors.push("disabledReason must be explicit and must not imply runnable apply behavior");
  }
  if (!Array.isArray(intent.blockers) || intent.blockers.length === 0) errors.push("blockers must be visible");
  if (!Array.isArray(intent.evidenceRefs) || intent.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(intent.activityRefs) || intent.activityRefs.length === 0) errors.push("activityRefs must be visible");
  if (intent.scope?.displaySafe !== true) errors.push("scope must be display safe");
  return { valid: errors.length === 0, errors };
}

export function buildMutationIntentEnvelope(input = {}) {
  const intent = createMutationIntentContract(input);
  return createPassResult({
    phase: "P67.2",
    mode: "preview-only",
    source: "controlled-mutation/p67-2-placeholder.js",
    summary: "Display-safe controlled mutation intent created without enabling mutation or execution.",
    data: { intent },
    evidence: intent.evidenceRefs,
  });
}

export const P67_2_SAMPLE_INTENTS = Object.freeze([
  createMutationIntentContract({
    intentId: "p67-2-nexus-os-doc-intent",
    displayTitle: "Document controlled mutation intent shape",
    allowedFiles: [
      "controlled-mutation/p67-2-placeholder.js",
      "docs/architecture/P67_CONTROLLED_SOURCE_MUTATION_PLAN.md",
      "scripts/check-p672.js",
      "reports/p672-report.md",
    ],
    evidenceRefs: ["reports/p672-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P67.2"],
  }),
]);
