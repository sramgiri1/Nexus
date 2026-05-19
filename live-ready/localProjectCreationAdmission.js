import { createPassResult } from "../shared/resultEnvelope.js";
import { createMutationBoundaryDecision } from "../scope-boundary/mutationBoundary.js";
import { generateProjectId, generateProjectProfile } from "../project-registry/index.js";

export const P83_LOCAL_PROJECT_CREATION_PHASE = "P83.1";

export const LOCAL_PROJECT_CREATION_REQUIRED_GATES = Object.freeze([
  "operatorApproval",
  "newWorkspaceRoot",
  "scopeBoundary",
  "rollbackPlan",
  "validationCommands",
  "activityEvidence",
  "costEvidence",
  "redactionCheck",
]);

export const LOCAL_PROJECT_CREATION_FORBIDDEN_ROOTS = Object.freeze([
  "projects/",
  "project-roadmap/",
  "careloop/",
  "db/",
  "prisma/",
  "migrations/",
  "providers/",
  "tools/",
  "worker-runtime/",
  "deploy/",
  "release/",
  "auth/",
  "users/",
  "rbac/",
  ".env",
]);

const RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
]);

function falseRuntimeFlags() {
  return Object.fromEntries(RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function safeRootForName(name = "Snake iOS") {
  return `generated-projects/${generateProjectId(name)}`;
}

function normalizeApproval(input = {}) {
  return Object.fromEntries(LOCAL_PROJECT_CREATION_REQUIRED_GATES.map((gate) => [gate, input.approval?.[gate] === true]));
}

function hasRequiredApproval(approvalState = {}) {
  return LOCAL_PROJECT_CREATION_REQUIRED_GATES.every((gate) => approvalState[gate] === true);
}

function rootIsAllowed(root = "") {
  const normalized = String(root || "").replaceAll("\\", "/").replace(/^\.\//, "");
  return normalized.startsWith("generated-projects/")
    && !LOCAL_PROJECT_CREATION_FORBIDDEN_ROOTS.some((forbidden) => normalized === forbidden.replace(/\/$/, "") || normalized.startsWith(forbidden));
}

export function buildLocalProjectCreationAdmission(input = {}) {
  const projectName = input.projectName || "Snake iOS";
  const projectType = input.projectType || "ios-game";
  const targetRoot = input.targetRoot || safeRootForName(projectName);
  const profile = {
    ...generateProjectProfile({ name: projectName, type: projectType }),
    projectType,
    root: targetRoot,
    allowedRoots: [targetRoot],
    allowedPaths: [targetRoot],
    stackProfileId: "swiftui-spritekit-ios",
    projectMutationAllowed: false,
    providerCallsAllowed: false,
    dbAccessAllowed: false,
  };
  const approvalState = normalizeApproval(input);
  const approvalReady = hasRequiredApproval(approvalState);
  const allowedRoot = rootIsAllowed(targetRoot);
  const mutationBoundary = createMutationBoundaryDecision({ paths: [targetRoot] });
  const projectCreationAllowed = approvalReady && allowedRoot && mutationBoundary.changeScope !== "CROSS_CUTTING_CHANGE";

  return createPassResult({
    phase: P83_LOCAL_PROJECT_CREATION_PHASE,
    mode: "live",
    source: "live-ready/localProjectCreationAdmission.js",
    summary: projectCreationAllowed
      ? "Local project creation admission is approved for a new generated workspace root; execution remains limited to future scoped file creation."
      : "Local project creation admission needs setup before any project files can be created.",
    data: {
      currentState: projectCreationAllowed ? "local_project_creation_admitted" : "local_project_creation_needs_setup",
      readinessLabel: projectCreationAllowed ? "Ready" : "Needs setup",
      projectName,
      projectType,
      targetRoot,
      profile,
      approvalState,
      requiredGates: [...LOCAL_PROJECT_CREATION_REQUIRED_GATES],
      allowedRoot,
      forbiddenRoots: [...LOCAL_PROJECT_CREATION_FORBIDDEN_ROOTS],
      mutationBoundary,
      projectCreationAllowed,
      newWorkspaceFileWritesAllowed: projectCreationAllowed,
      existingProjectMutationAllowed: false,
      nextAction: projectCreationAllowed
        ? "Use P83.2 to create a SwiftUI/SpriteKit Snake iOS scaffold plan for this generated workspace root."
        : "Collect operator approval, generated workspace root, rollback, validation, activity, cost, and redaction evidence before local project creation.",
      blockers: LOCAL_PROJECT_CREATION_REQUIRED_GATES.filter((gate) => approvalState[gate] !== true),
      disabledReason: projectCreationAllowed
        ? "Only a new generated workspace root is admitted. Existing projects, DB writes, provider calls, workers, deploy, release, package creation, network calls, and spend remain disabled."
        : "Local project creation is blocked until every admission gate is approved and the target root is inside generated-projects/.",
      ownerCapability: "NEXUS Local Project Admission",
      evidenceRefs: ["reports/p831-local-project-creation-admission-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, network calls, deploy, package creation, or provider spend. Local file creation is the only future admitted action after P83.2/P83.3.",
      ...falseRuntimeFlags(),
    },
    evidence: ["reports/p831-local-project-creation-admission-report.md", "contracts/os-roadmap/p83-execution-contracts.json"],
    warnings: ["P83.1 does not write project files. It creates a local admission record for a new generated workspace root only."],
  });
}

export function validateLocalProjectCreationAdmission(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P83_LOCAL_PROJECT_CREATION_PHASE) errors.push("phase must be P83.1");
  if (!["Ready", "Needs setup"].includes(data.readinessLabel)) errors.push("readinessLabel must be Ready or Needs setup");
  if (!Array.isArray(data.requiredGates) || data.requiredGates.length !== LOCAL_PROJECT_CREATION_REQUIRED_GATES.length) errors.push("requiredGates must be complete");
  if (!data.targetRoot?.startsWith("generated-projects/")) errors.push("targetRoot must be inside generated-projects/");
  if (LOCAL_PROJECT_CREATION_FORBIDDEN_ROOTS.some((root) => data.targetRoot?.startsWith(root))) errors.push("targetRoot overlaps a forbidden root");
  if (data.existingProjectMutationAllowed !== false) errors.push("existingProjectMutationAllowed must remain false");
  for (const flag of RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  if (data.projectCreationAllowed === true && data.newWorkspaceFileWritesAllowed !== true) errors.push("admitted project creation must allow new workspace file writes");
  if (data.projectCreationAllowed === true && data.blockers?.length !== 0) errors.push("admitted project creation must not have blockers");
  if (!data.disabledReason || /deploy now|call provider now|spend now|mutate existing project/i.test(data.disabledReason)) errors.push("disabledReason must not imply unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
