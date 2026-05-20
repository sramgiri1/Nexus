import { createPassResult } from "../shared/resultEnvelope.js";
import { buildLocalProjectCreationAdmission } from "./localProjectCreationAdmission.js";
import { buildLocalAgentDispatchAdmission } from "./localAgentDispatchAdmission.js";

export const P87_GENERATED_PROJECT_WORKSPACE_ADMISSION_PHASE = "P87.4";

const BLOCKED_RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
  "newWorkspaceFileWritesAllowed",
  "existingProjectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
  "activationAllowed",
  "executionAllowed",
]);

const FORBIDDEN_ROOTS = Object.freeze([
  "projects/**",
  "careloop/**",
  "generated-projects/*/Sources/**",
  "generated-projects/*/Tests/**",
  "providers/**",
  "tools/**",
  "worker-runtime/**",
  "db/**",
  "prisma/**",
  "migrations/**",
  "deploy/**",
  "release/**",
  "exports/**",
  "packages/**",
  ".env*",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(BLOCKED_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

export function buildGeneratedProjectWorkspaceAdmission(input = {}) {
  const localAdmission = input.localAdmission || buildLocalProjectCreationAdmission({
    projectName: input.projectName || "Founder App",
    projectType: input.projectType || "generated-app",
    approval: {},
  });
  const dispatchAdmission = input.dispatchAdmission || buildLocalAgentDispatchAdmission(input);
  const targetRoot = localAdmission.data?.targetRoot || "generated-projects/founder-app";

  return createPassResult({
    phase: P87_GENERATED_PROJECT_WORKSPACE_ADMISSION_PHASE,
    mode: "live-activation-contract",
    source: "live-ready/generatedProjectWorkspaceAdmission.js",
    summary: "Generated project workspace admission boundary is available; no project files are created or mutated.",
    data: {
      schemaVersion: "1.0",
      currentState: "generated_project_workspace_boundary_ready",
      readinessLabel: "Workspace review only",
      workspaceRootPolicy: "new generated workspace only after later explicit approval",
      targetRoot,
      allowedFutureRoots: [targetRoot],
      forbiddenRoots: [...FORBIDDEN_ROOTS],
      requiredBeforeFileWrites: [
        "operatorApproval",
        "newWorkspaceRoot",
        "scopeBoundary",
        "rollbackPlan",
        "validationCommands",
        "activityEvidence",
        "costEvidence",
        "redactionCheck",
        "projectTypeContract",
        "sourceTestBoundary",
      ],
      blockers: ["operatorApproval", "newWorkspaceRoot", "projectTypeContract", "sourceTestBoundary", "workspaceCreationExecutorNotEnabled"],
      dispatchAdmissionPhase: dispatchAdmission.phase,
      localProjectAdmissionPhase: localAdmission.phase,
      projectCreationAllowed: false,
      newWorkspaceFileWritesAllowed: false,
      existingProjectMutationAllowed: false,
      nextAction: "Implement P87.5 Command Center live unlock UX without project source mutation.",
      disabledReason:
        "P87.4 defines generated workspace admission boundaries only. It does not create files, mutate generated app Sources/Tests, mutate existing projects, write DB state, deploy, package, or spend.",
      ownerCapability: "NEXUS Generated Workspace Governance",
      evidenceRefs: ["reports/p874-generated-project-workspace-admission-report.md", "reports/p873-local-agent-dispatch-admission-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No project file writes, DB writes, provider calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p874-generated-project-workspace-admission-report.md",
      "contracts/os-roadmap/p87-execution-contracts.json",
    ],
    warnings: ["P87.4 does not create or mutate project files. It defines workspace boundaries only."],
  });
}

export function validateGeneratedProjectWorkspaceAdmission(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P87_GENERATED_PROJECT_WORKSPACE_ADMISSION_PHASE) errors.push("phase must be P87.4");
  for (const field of ["schemaVersion", "currentState", "readinessLabel", "workspaceRootPolicy", "targetRoot", "allowedFutureRoots", "forbiddenRoots", "requiredBeforeFileWrites", "blockers", "nextAction", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!String(data.targetRoot || "").startsWith("generated-projects/")) errors.push("targetRoot must stay inside generated-projects/");
  for (const expected of FORBIDDEN_ROOTS) {
    if (!data.forbiddenRoots?.includes(expected)) errors.push(`forbidden root missing: ${expected}`);
  }
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  if (data.projectCreationAllowed !== false || data.newWorkspaceFileWritesAllowed !== false || data.existingProjectMutationAllowed !== false) {
    errors.push("project creation and mutation flags must remain false");
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("workspace admission must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized)) errors.push("workspace admission must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
