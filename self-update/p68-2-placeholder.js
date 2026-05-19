import { createPassResult } from "../shared/resultEnvelope.js";
import { summarizeRedaction } from "../shared/redaction.js";

export const P68_2_REQUIRED_FIELDS = Object.freeze([
  "intentId",
  "scope",
  "targetKind",
  "displayTitle",
  "currentState",
  "allowedFiles",
  "forbiddenFiles",
  "previewState",
  "approvalRequired",
  "approvalState",
  "rollbackPlan",
  "selfUpdateAllowed",
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

function hasProjectPath(paths = []) {
  return normalizeList(paths).some((filePath) => filePath === "projects/**" || filePath.startsWith("projects/"));
}

function buildScope(input = {}) {
  const redaction = summarizeRedaction({
    label: input.displayLabel || "NEXUS OS",
    privateProjectId: input.privateProjectId || "",
  });
  return {
    label: redaction.redacted.label || "NEXUS OS",
    target: "nexus_os",
    displaySafe: true,
    redacted: redaction.changed || Boolean(input.privateProjectId),
  };
}

export function createSelfUpdateIntentContract(input = {}) {
  const allowedFiles = normalizeList(input.allowedFiles);
  const forbiddenFiles = [...new Set([...DEFAULT_FORBIDDEN_FILES, ...normalizeList(input.forbiddenFiles)])];
  return {
    intentId: input.intentId || "p68-2-self-update-intent",
    scope: buildScope(input),
    targetKind: "nexus_os",
    displayTitle: input.displayTitle || "NEXUS OS self-update intent",
    currentState: input.currentState || "needs_review",
    allowedFiles,
    forbiddenFiles,
    previewState: "not_built",
    approvalRequired: true,
    approvalState: input.approvalState || "not_requested",
    rollbackPlan: input.rollbackPlan || "Revert future approved self-update commit before any apply path is enabled.",
    selfUpdateAllowed: false,
    projectMutationAllowed: false,
    executionAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    dbWritesAllowed: false,
    deployAllowed: false,
    providerSpendAllowed: false,
    disabledReason: "Self-update is intent-only in this subphase; preview, approval, and apply gates are not complete.",
    blockers: [
      "Self-update apply is disabled.",
      "Project source mutation is forbidden.",
      ...normalizeList(input.blockers),
    ],
    evidenceRefs: normalizeList(input.evidenceRefs),
    activityRefs: normalizeList(input.activityRefs),
    ownerCapability: input.ownerCapability || "CORE.selfUpdate",
    nextAction: input.nextAction || "Build a preview-only self-update proposal.",
    commandCenterVisible: true,
  };
}

export function validateSelfUpdateIntentContract(intent = {}) {
  const errors = [];
  for (const field of P68_2_REQUIRED_FIELDS) {
    if (!(field in intent)) errors.push(`missing ${field}`);
  }
  if (intent.targetKind !== "nexus_os") errors.push("targetKind must be nexus_os");
  if (!Array.isArray(intent.allowedFiles) || intent.allowedFiles.length === 0) errors.push("allowedFiles must be non-empty");
  if (!Array.isArray(intent.forbiddenFiles) || !intent.forbiddenFiles.includes("projects/**")) errors.push("forbiddenFiles must include projects/**");
  if (hasProjectPath(intent.allowedFiles)) errors.push("allowedFiles must not include project source paths");
  if (intent.selfUpdateAllowed !== false) errors.push("selfUpdateAllowed must be false");
  if (intent.projectMutationAllowed !== false) errors.push("projectMutationAllowed must be false");
  if (intent.executionAllowed !== false) errors.push("executionAllowed must be false");
  if (intent.providerDispatchAllowed !== false) errors.push("providerDispatchAllowed must be false");
  if (intent.toolExecutionAllowed !== false) errors.push("toolExecutionAllowed must be false");
  if (intent.workerExecutionAllowed !== false) errors.push("workerExecutionAllowed must be false");
  if (intent.dbWritesAllowed !== false) errors.push("dbWritesAllowed must be false");
  if (intent.deployAllowed !== false) errors.push("deployAllowed must be false");
  if (intent.providerSpendAllowed !== false) errors.push("providerSpendAllowed must be false");
  if (!intent.disabledReason || /apply now|run now|execute now/i.test(intent.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(intent.blockers) || intent.blockers.length === 0) errors.push("blockers must be visible");
  if (!Array.isArray(intent.evidenceRefs) || intent.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(intent.activityRefs) || intent.activityRefs.length === 0) errors.push("activityRefs must be visible");
  if (intent.scope?.displaySafe !== true) errors.push("scope must be display safe");
  return { valid: errors.length === 0, errors };
}

export function buildSelfUpdateIntentEnvelope(input = {}) {
  const intent = createSelfUpdateIntentContract(input);
  return createPassResult({
    phase: "P68.2",
    mode: "preview-only",
    source: "self-update/p68-2-placeholder.js",
    summary: "Display-safe self-update intent created without enabling apply or execution.",
    data: { intent },
    evidence: intent.evidenceRefs,
  });
}

export const P68_2_SAMPLE_INTENTS = Object.freeze([
  createSelfUpdateIntentContract({
    allowedFiles: ["self-update/p68-2-placeholder.js", "scripts/check-p682.js", "reports/p682-report.md"],
    evidenceRefs: ["reports/p682-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P68.2"],
  }),
]);
