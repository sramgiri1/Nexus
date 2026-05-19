import { createPassResult } from "../shared/resultEnvelope.js";
import { createReleaseIntentContract, validateReleaseIntentContract } from "./p69-2-placeholder.js";

export const P69_3_REQUIRED_FIELDS = Object.freeze([
  "candidateId",
  "releaseId",
  "targetKind",
  "currentState",
  "summary",
  "environmentLabel",
  "allowedFiles",
  "forbiddenFiles",
  "validationCommands",
  "rollbackPlan",
  "packageCreated",
  "releaseExecutionAllowed",
  "deployExecutionAllowed",
  "projectMutationAllowed",
  "providerDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "providerSpendAllowed",
  "disabledReason",
  "blockers",
  "evidenceRefs",
  "activityRefs",
  "costImpact",
  "ownerCapability",
  "nextAction",
]);

const DEFAULT_VALIDATION_COMMANDS = Object.freeze([
  "npm run check:p693",
  "npm run check:p69-execution-plan",
  "npm run check:phase-validation-coverage",
  "npm run check:os-phase-status",
  "git diff --check",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function hasProjectPath(paths = []) {
  return normalizeList(paths).some((filePath) => filePath === "projects/**" || filePath.startsWith("projects/"));
}

export function createReleaseCandidatePreview(input = {}) {
  const intent = input.intent || createReleaseIntentContract(input);
  const intentValidation = validateReleaseIntentContract(intent);
  return {
    candidateId: input.candidateId || "release-candidate-preview",
    releaseId: intent.releaseId,
    targetKind: intent.targetKind,
    currentState: intentValidation.valid ? "candidate_preview_ready" : "blocked",
    summary: input.summary || "Preview a release candidate without packaging, releasing, deploying, or mutating source.",
    environmentLabel: intent.environmentLabel,
    allowedFiles: [...intent.allowedFiles],
    forbiddenFiles: [...intent.forbiddenFiles],
    validationCommands: [...new Set([...DEFAULT_VALIDATION_COMMANDS, ...normalizeList(input.validationCommands)])],
    rollbackPlan: {
      state: "documented",
      notes: "Rollback plan is documentation-only until a later approved release/deploy execution path exists.",
    },
    packageCreated: false,
    releaseExecutionAllowed: false,
    deployExecutionAllowed: false,
    projectMutationAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    dbWritesAllowed: false,
    networkCallsAllowed: false,
    providerSpendAllowed: false,
    disabledReason: "P69.3 creates release candidate previews only; package, release, and deploy execution remain disabled.",
    blockers: [
      ...normalizeList(intent.blockers),
      "Release package creation is disabled.",
      "Release and deploy execution are disabled.",
      ...normalizeList(input.blockers),
    ],
    evidenceRefs: [...new Set([...normalizeList(intent.evidenceRefs), "reports/p693-report.md"])],
    activityRefs: [...new Set([...normalizeList(intent.activityRefs), "os-roadmap/phase-status.json#P69.3"])],
    costImpact: "No provider calls, packaging execution, network execution, deploy execution, or provider spend.",
    ownerCapability: intent.ownerCapability,
    nextAction: input.nextAction || "Route this release candidate preview through P69.4 deploy readiness gates.",
    commandCenterVisible: true,
  };
}

export function validateReleaseCandidatePreview(candidate = {}) {
  const errors = [];
  for (const field of P69_3_REQUIRED_FIELDS) {
    if (!(field in candidate)) errors.push(`missing ${field}`);
  }
  if (candidate.targetKind !== "nexus_os") errors.push("targetKind must be nexus_os");
  if (!Array.isArray(candidate.allowedFiles) || candidate.allowedFiles.length === 0) errors.push("allowedFiles must be non-empty");
  if (hasProjectPath(candidate.allowedFiles)) errors.push("allowedFiles must not include project source paths");
  if (!Array.isArray(candidate.forbiddenFiles) || !candidate.forbiddenFiles.includes("projects/**")) errors.push("forbiddenFiles must include projects/**");
  if (!Array.isArray(candidate.validationCommands) || !candidate.validationCommands.includes("git diff --check")) errors.push("validationCommands must include git diff --check");
  if (candidate.packageCreated !== false) errors.push("packageCreated must be false");
  if (candidate.releaseExecutionAllowed !== false || candidate.deployExecutionAllowed !== false) errors.push("release/deploy execution must be disabled");
  if (candidate.projectMutationAllowed !== false) errors.push("projectMutationAllowed must be false");
  if (candidate.providerDispatchAllowed !== false || candidate.toolExecutionAllowed !== false || candidate.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (candidate.dbWritesAllowed !== false || candidate.networkCallsAllowed !== false || candidate.providerSpendAllowed !== false) errors.push("db/network/spend must be false");
  if (!candidate.disabledReason || /release now|deploy now|package now|execute now/i.test(candidate.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(candidate.blockers) || candidate.blockers.length === 0) errors.push("blockers must be visible");
  if (!Array.isArray(candidate.evidenceRefs) || candidate.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(candidate.activityRefs) || candidate.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildReleaseCandidateEnvelope(input = {}) {
  const candidate = createReleaseCandidatePreview(input);
  return createPassResult({
    phase: "P69.3",
    mode: "preview-only",
    source: "release-governance/p69-3-placeholder.js",
    summary: "Release candidate preview created without packaging, release, or deploy execution.",
    data: { candidate },
    evidence: candidate.evidenceRefs,
  });
}

export const P69_3_SAMPLE_CANDIDATES = Object.freeze([
  createReleaseCandidatePreview({
    intent: createReleaseIntentContract({
      releaseId: "release-candidate-preview-intent",
      allowedFiles: ["release-governance/p69-3-placeholder.js", "scripts/check-p693.js", "reports/p693-report.md"],
      evidenceRefs: ["reports/p693-report.md"],
      activityRefs: ["os-roadmap/phase-status.json#P69.3"],
    }),
  }),
]);
