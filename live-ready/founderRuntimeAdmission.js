import { createPassResult } from "../shared/resultEnvelope.js";
import { createFounderIntakeSessionEnvelope } from "../founder-intake/founderIntakeSchema.js";
import { createBusinessBuildPrdDraft } from "../business-build/businessBuildPrdSchema.js";
import { buildBusinessBuildWorkstreams } from "../business-build/businessBuildWorkstreams.js";

export const P84_FOUNDER_RUNTIME_ADMISSION_PHASE = "P84.1";

export const FOUNDER_RUNTIME_REQUIRED_GATES = Object.freeze([
  "operatorApproval",
  "scopeBoundary",
  "redactionCheck",
  "activityEvidence",
  "costEvidence",
  "rollbackPlan",
  "validationCommands",
]);

const RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "modelCallsAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "agentDispatchAllowed",
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

function defaultAnswers() {
  return {
    targetCustomer: "startup founder",
    problem: "needs a governed path from idea to validated product plan",
    currentAlternatives: "manual research and scattered planning docs",
    proposedSolution: "NEXUS guides Q&A, drafts a PRD, and plans owner workstreams",
    businessModel: "subscription",
    goToMarket: "founder-led validation with focused launch channels",
    constraints: "limited time, limited budget, and high execution risk",
    successCriteria: "validated feasibility, complete PRD, and a governed local build plan",
  };
}

function buildGateState(approval = {}) {
  return Object.fromEntries(FOUNDER_RUNTIME_REQUIRED_GATES.map((gate) => [gate, approval[gate] === true]));
}

export function buildFounderRuntimeAdmission(input = {}) {
  const answers = input.answers || defaultAnswers();
  const gateState = buildGateState(input.approval || {});
  const gatesReady = Object.values(gateState).every(Boolean);
  const founderSession = createFounderIntakeSessionEnvelope({
    founderIdeaSummary: input.founderIdeaSummary || "Founder wants NEXUS to validate a startup idea and produce a PRD.",
    answers,
    evidenceRefs: input.evidenceRefs,
    activityRefs: input.activityRefs,
  });
  const prdDraft = createBusinessBuildPrdDraft({
    founderIdeaSummary: founderSession.data.session.founderIdeaSummary,
    answers,
    evidenceRefs: input.evidenceRefs,
    activityRefs: input.activityRefs,
  });
  const workstreamPlan = buildBusinessBuildWorkstreams({ prdDraft });

  const localRuntime = {
    founderIntakeAllowed: gatesReady,
    deterministicQnaAllowed: gatesReady,
    localPrdDraftAllowed: gatesReady,
    localWorkstreamPlanningAllowed: gatesReady,
    generatedWorkspacePlanningAllowed: gatesReady,
    unsafeExecutionAllowed: false,
  };

  return createPassResult({
    phase: P84_FOUNDER_RUNTIME_ADMISSION_PHASE,
    mode: "live",
    source: "live-ready/founderRuntimeAdmission.js",
    summary: gatesReady
      ? "Founder runtime admission is ready for local deterministic Q&A, PRD drafting, and workstream planning."
      : "Founder runtime admission is blocked until all local runtime gates are present.",
    data: {
      currentState: gatesReady ? "founder_runtime_local_admitted" : "founder_runtime_gates_needed",
      readinessLabel: gatesReady ? "Ready" : "Needs setup",
      gateState,
      requiredGates: [...FOUNDER_RUNTIME_REQUIRED_GATES],
      localRuntime,
      founderSession: founderSession.data.session,
      prdReadiness: prdDraft.data.readiness,
      workstreamCount: workstreamPlan.workstreams?.length || 0,
      nextAction: gatesReady
        ? "Run P84.2 to create the live-local founder Q&A to PRD runtime envelope."
        : "Complete approval, scope, redaction, activity, cost, rollback, and validation evidence before local founder runtime admission.",
      blockers: gatesReady ? [] : FOUNDER_RUNTIME_REQUIRED_GATES.filter((gate) => !gateState[gate]),
      disabledReason:
        "P84.1 admits only local deterministic founder runtime planning when gates are present. Provider/model calls, agent dispatch, tool execution, worker execution, project mutation, DB writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder Runtime Admission",
      evidenceRefs: [
        "reports/p841-founder-runtime-admission-report.md",
        "reports/p837-final-validation-report.md",
      ],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...falseRuntimeFlags(),
    },
    evidence: ["reports/p841-founder-runtime-admission-report.md"],
    warnings: ["P84.1 is an admission contract. It does not call providers, dispatch agents, mutate projects, write DB state, deploy, package, or spend."],
  });
}

export function validateFounderRuntimeAdmission(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P84_FOUNDER_RUNTIME_ADMISSION_PHASE) errors.push("phase must be P84.1");
  for (const field of ["currentState", "readinessLabel", "gateState", "requiredGates", "localRuntime", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.requiredGates) || data.requiredGates.length !== FOUNDER_RUNTIME_REQUIRED_GATES.length) errors.push("requiredGates must cover P84 gates");
  if (!Array.isArray(data.blockers)) errors.push("blockers must be an array");
  for (const gate of FOUNDER_RUNTIME_REQUIRED_GATES) {
    if (typeof data.gateState?.[gate] !== "boolean") errors.push(`gateState.${gate} must be boolean`);
  }
  for (const flag of RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  if (data.localRuntime?.unsafeExecutionAllowed !== false) errors.push("unsafeExecutionAllowed must be false");
  if (!data.disabledReason || /call provider now|dispatch agent now|write project now|deploy now|spend now/i.test(data.disabledReason)) errors.push("disabledReason must not imply unsafe runnable actions");
  if (!Array.isArray(data.evidenceRefs) || data.evidenceRefs.length === 0) errors.push("evidenceRefs must be present");
  return { valid: errors.length === 0, errors };
}
