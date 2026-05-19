import { createPassResult } from "../shared/resultEnvelope.js";

export const P69_2_REQUIRED_FIELDS = Object.freeze([
  "releaseId",
  "targetKind",
  "environmentLabel",
  "currentState",
  "allowedFiles",
  "forbiddenFiles",
  "releaseExecutionAllowed",
  "deployExecutionAllowed",
  "projectMutationAllowed",
  "providerDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "providerSpendAllowed",
  "approvalRequired",
  "approvalState",
  "rollbackPlan",
  "disabledReason",
  "blockers",
  "evidenceRefs",
  "activityRefs",
  "costImpact",
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
  "scripts/deploy*.js",
  "scripts/release*.js",
  ".env",
  ".env.*",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function hasProjectPath(paths = []) {
  return normalizeList(paths).some((filePath) => filePath === "projects/**" || filePath.startsWith("projects/"));
}

export function createReleaseIntentContract(input = {}) {
  const allowedFiles = normalizeList(input.allowedFiles);
  const forbiddenFiles = [...new Set([...DEFAULT_FORBIDDEN_FILES, ...normalizeList(input.forbiddenFiles)])];
  return {
    releaseId: input.releaseId || "release-intent-preview",
    targetKind: "nexus_os",
    environmentLabel: input.environmentLabel || "Local preview",
    currentState: allowedFiles.length > 0 && !hasProjectPath(allowedFiles) ? "intent_ready" : "blocked",
    allowedFiles,
    forbiddenFiles,
    releaseExecutionAllowed: false,
    deployExecutionAllowed: false,
    projectMutationAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    dbWritesAllowed: false,
    networkCallsAllowed: false,
    providerSpendAllowed: false,
    approvalRequired: true,
    approvalState: input.approvalState || "not_requested",
    rollbackPlan: {
      state: "required_before_execution",
      notes: "Rollback is required before any future governed release or deploy execution can be considered.",
    },
    disabledReason: "P69.2 records release intent only; release and deploy execution remain disabled.",
    blockers: [
      "Release approval has not been granted.",
      "Deploy readiness gates are not complete.",
      "Release and deploy execution are disabled.",
      ...normalizeList(input.blockers),
    ],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p692-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P69.2"])],
    costImpact: "No provider calls, network execution, deploy execution, or provider spend.",
    ownerCapability: input.ownerCapability || "WARDEN.releaseGovernance",
    nextAction: input.nextAction || "Convert this release intent into a P69.3 release candidate preview.",
    commandCenterVisible: true,
  };
}

export function validateReleaseIntentContract(intent = {}) {
  const errors = [];
  for (const field of P69_2_REQUIRED_FIELDS) {
    if (!(field in intent)) errors.push(`missing ${field}`);
  }
  if (intent.targetKind !== "nexus_os") errors.push("targetKind must be nexus_os");
  if (!Array.isArray(intent.allowedFiles) || intent.allowedFiles.length === 0) errors.push("allowedFiles must be non-empty");
  if (hasProjectPath(intent.allowedFiles)) errors.push("allowedFiles must not include project source paths");
  if (!Array.isArray(intent.forbiddenFiles) || !intent.forbiddenFiles.includes("projects/**")) errors.push("forbiddenFiles must include projects/**");
  if (intent.releaseExecutionAllowed !== false || intent.deployExecutionAllowed !== false) errors.push("release/deploy execution must be disabled");
  if (intent.projectMutationAllowed !== false) errors.push("projectMutationAllowed must be false");
  if (intent.providerDispatchAllowed !== false || intent.toolExecutionAllowed !== false || intent.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (intent.dbWritesAllowed !== false || intent.networkCallsAllowed !== false || intent.providerSpendAllowed !== false) errors.push("db/network/spend must be false");
  if (intent.approvalRequired !== true) errors.push("approvalRequired must be true");
  if (!intent.disabledReason || /release now|deploy now|execute now/i.test(intent.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(intent.blockers) || intent.blockers.length === 0) errors.push("blockers must be visible");
  if (!Array.isArray(intent.evidenceRefs) || intent.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(intent.activityRefs) || intent.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildReleaseIntentEnvelope(input = {}) {
  const intent = createReleaseIntentContract(input);
  return createPassResult({
    phase: "P69.2",
    mode: "preview-only",
    source: "release-governance/p69-2-placeholder.js",
    summary: "Release intent recorded without enabling release or deploy execution.",
    data: { intent },
    evidence: intent.evidenceRefs,
  });
}

export const P69_2_SAMPLE_INTENTS = Object.freeze([
  createReleaseIntentContract({
    allowedFiles: ["release-governance/p69-2-placeholder.js", "scripts/check-p692.js", "reports/p692-report.md"],
    evidenceRefs: ["reports/p692-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P69.2"],
  }),
]);
