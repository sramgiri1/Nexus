import { createPassResult } from "../shared/resultEnvelope.js";
import { createReleaseCandidatePreview, validateReleaseCandidatePreview } from "./p69-3-placeholder.js";

export const P69_4_REQUIRED_FIELDS = Object.freeze([
  "gateId",
  "candidateId",
  "releaseId",
  "currentState",
  "approvalRequired",
  "approvalState",
  "validationReady",
  "rollbackReady",
  "evidenceReady",
  "costReviewed",
  "safetyAllowed",
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
  "requiredEvidence",
  "evidenceRefs",
  "activityRefs",
  "costImpact",
  "ownerCapability",
  "nextAction",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function hasProjectPath(paths = []) {
  return normalizeList(paths).some((filePath) => filePath === "projects/**" || filePath.startsWith("projects/"));
}

export function createDeployReadinessGate(input = {}) {
  const candidate = input.candidate || createReleaseCandidatePreview(input);
  const candidateValidation = validateReleaseCandidatePreview(candidate);
  const validationReady = candidateValidation.valid && candidate.validationCommands.includes("git diff --check") && !hasProjectPath(candidate.allowedFiles);
  return {
    gateId: input.gateId || "deploy-readiness-gate-preview",
    candidateId: candidate.candidateId,
    releaseId: candidate.releaseId,
    currentState: validationReady ? "ready_for_operator_review" : "blocked",
    approvalRequired: true,
    approvalState: input.approvalState || "not_requested",
    validationReady,
    rollbackReady: candidate.rollbackPlan?.state === "documented",
    evidenceReady: normalizeList(candidate.evidenceRefs).length > 0,
    costReviewed: String(candidate.costImpact || "").includes("No provider calls"),
    safetyAllowed: false,
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
    disabledReason: "P69.4 records deploy readiness only; deploy and release execution remain disabled.",
    blockers: [
      ...normalizeList(candidate.blockers),
      "Operator approval has not been granted.",
      "Deploy execution cannot be unlocked in P69.4.",
      ...normalizeList(input.blockers),
    ],
    requiredEvidence: [
      "Operator approval record",
      "Validation command results",
      "Rollback acknowledgement",
      "Cost review",
      "Release candidate preview",
    ],
    evidenceRefs: [...new Set([...normalizeList(candidate.evidenceRefs), "reports/p694-report.md"])],
    activityRefs: [...new Set([...normalizeList(candidate.activityRefs), "os-roadmap/phase-status.json#P69.4"])],
    costImpact: candidate.costImpact,
    ownerCapability: candidate.ownerCapability,
    nextAction: input.nextAction || "Render this gate as P69.5 Command Center release readiness.",
    commandCenterVisible: true,
  };
}

export function validateDeployReadinessGate(gate = {}) {
  const errors = [];
  for (const field of P69_4_REQUIRED_FIELDS) {
    if (!(field in gate)) errors.push(`missing ${field}`);
  }
  if (gate.approvalRequired !== true) errors.push("approvalRequired must be true");
  if (gate.safetyAllowed !== false) errors.push("safetyAllowed must be false");
  if (gate.packageCreated !== false) errors.push("packageCreated must be false");
  if (gate.releaseExecutionAllowed !== false || gate.deployExecutionAllowed !== false) errors.push("release/deploy execution must be disabled");
  if (gate.projectMutationAllowed !== false) errors.push("projectMutationAllowed must be false");
  if (gate.providerDispatchAllowed !== false || gate.toolExecutionAllowed !== false || gate.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (gate.dbWritesAllowed !== false || gate.networkCallsAllowed !== false || gate.providerSpendAllowed !== false) errors.push("db/network/spend must be false");
  if (!gate.disabledReason || /deploy now|release now|execute now/i.test(gate.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(gate.blockers) || gate.blockers.length === 0) errors.push("blockers must be visible");
  if (!Array.isArray(gate.requiredEvidence) || gate.requiredEvidence.length < 5) errors.push("requiredEvidence must be visible");
  if (!Array.isArray(gate.evidenceRefs) || gate.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(gate.activityRefs) || gate.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildDeployReadinessGateEnvelope(input = {}) {
  const gate = createDeployReadinessGate(input);
  return createPassResult({
    phase: "P69.4",
    mode: "preview-only",
    source: "release-governance/p69-4-placeholder.js",
    summary: "Deploy readiness gate recorded without enabling release or deploy execution.",
    data: { gate },
    evidence: gate.evidenceRefs,
  });
}

export const P69_4_SAMPLE_GATES = Object.freeze([
  createDeployReadinessGate({
    candidate: createReleaseCandidatePreview({
      allowedFiles: ["release-governance/p69-4-placeholder.js", "scripts/check-p694.js", "reports/p694-report.md"],
      evidenceRefs: ["reports/p694-report.md"],
      activityRefs: ["os-roadmap/phase-status.json#P69.4"],
    }),
  }),
]);
