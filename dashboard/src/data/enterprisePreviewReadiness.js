import { createFounderIntakePreview } from "../../../enterprise-preview/p78-2-placeholder.js";
import { createPrdAssemblyPreview } from "../../../enterprise-preview/p78-3-placeholder.js";
import { createAgentWorkplanPreview } from "../../../enterprise-preview/p78-4-placeholder.js";

const founderIntake = createFounderIntakePreview({
  nextAction: "Review founder answers before any future PRD generation is considered.",
});
const prdPreview = createPrdAssemblyPreview({
  sourceIntake: founderIntake,
  nextAction: "Review PRD readiness before any future project workplan is considered.",
});
const agentWorkplan = createAgentWorkplanPreview({
  sourcePrd: prdPreview,
  nextAction: "Prepare validation aggregation before any runtime execution is considered.",
});

export function buildEnterprisePreviewReadinessViewModel() {
  return {
    routeId: "enterprise-preview-readiness",
    pageTitle: "Enterprise Preview",
    whatChanged: "Founder idea intake, feasibility Q&A, PRD preview, agent workplan, business build lanes, and self-healing readiness are visible in Command Center.",
    currentState: "Display-only founder-to-business preview; Q&A automation, PRD generation, agent dispatch, business build execution, self-healing apply, project mutation, DB writes, runtime execution, and provider spend remain disabled.",
    nextAction: agentWorkplan.nextAction,
    ownerAgent: "ORCHESTRATOR",
    ownerCapability: "NEXUS Enterprise Preview",
    evidenceLocation: "reports/command-center-enterprise-preview-ux-report.md",
    activityLocation: "os-roadmap/phase-status.json enterprise preview entry",
    costImpact: agentWorkplan.costImpact,
    disabledReason: "Enterprise Preview is display-only; founder Q&A automation, PRD generation, agent dispatch, business build execution, self-healing apply, project mutation, DB writes, provider calls, tool execution, worker execution, network calls, deploy, release, export, package creation, and provider spend remain disabled.",
    readinessCards: [
      { label: "Startup idea", value: "Ready for intake", tone: "teal", detail: "Founder can bring an idea for structured feasibility discovery." },
      { label: "Founder intake", value: "Preview only", tone: "teal", detail: founderIntake.qnaState },
      { label: "Q&A readiness", value: "Needs answers", tone: "amber", detail: founderIntake.missingAnswers.join(", ") },
      { label: "PRD preview", value: "Display only", tone: "amber", detail: prdPreview.prdPreviewState },
      { label: "Agent workplan", value: "Not dispatched", tone: "amber", detail: agentWorkplan.agentWorkplanState },
      { label: "Business build", value: "Execution disabled", tone: "red", detail: "Agents are not yet allowed to build, launch, or operate the business." },
      { label: "Self-healing", value: "Apply disabled", tone: "red", detail: agentWorkplan.selfHealingState },
      { label: "Cost", value: "No spend", tone: "green", detail: "No provider, model, tool, worker, DB, network, or project write cost is incurred." },
    ],
    journeyRows: [
      { label: "Idea intake", currentState: "Founder describes the startup idea and constraints.", executionState: "display-only" },
      { label: "Feasibility Q&A", currentState: "NEXUS lists required clarifying questions before validation.", executionState: "automation disabled" },
      { label: "PRD assembly", currentState: "Problem, audience, value, MVP scope, risks, and acceptance criteria are previewed.", executionState: "generation disabled" },
      { label: "Agent assignment", currentState: "Strategy, product, architecture, validation, and operations lanes are visible.", executionState: "dispatch disabled" },
      { label: "Business build", currentState: "Build, launch, revenue, support, and growth lanes are modeled as future work.", executionState: "execution disabled" },
      { label: "Operating loop", currentState: "Self-healing and validation loops are visible for future governed runtime.", executionState: "apply disabled" },
    ],
    founderRows: founderIntake.questionRows.map((row) => ({
      label: row.label,
      currentState: row.state,
      prompt: row.prompt,
    })),
    prdRows: [
      { label: "Problem", currentState: prdPreview.problemStatement },
      { label: "Audience", currentState: prdPreview.targetAudience },
      { label: "Value proposition", currentState: prdPreview.valueProposition },
      { label: "MVP scope", currentState: prdPreview.mvpScope.join(", ") },
      { label: "Acceptance", currentState: prdPreview.acceptanceCriteria[0] },
    ],
    workplanRows: agentWorkplan.taskLanes.map((lane) => ({
      label: lane.lane,
      currentState: lane.currentState,
      executionState: lane.dispatchState,
    })),
    validationRows: agentWorkplan.validationGates.map((gate) => ({
      label: gate.gate,
      currentState: gate.currentState,
      requiredState: gate.requiredState,
    })),
    healingRows: agentWorkplan.healingLoops.map((loop) => ({
      label: loop.loop,
      currentState: loop.applyState,
      trigger: loop.trigger,
    })),
    blockers: agentWorkplan.blockers.slice(0, 6),
    disabledActions: [
      { label: "Founder Q&A automation", reason: "Founder Q&A automation is not enabled." },
      { label: "PRD generation", reason: "PRD generation and project file writes are not enabled." },
      { label: "Agent dispatch", reason: "Agent dispatch and tool execution are not enabled." },
      { label: "Business build execution", reason: "Build, launch, support, revenue, and growth execution are not enabled." },
      { label: "Self-healing apply", reason: "Self-healing apply and project mutation are not enabled." },
      { label: "Provider and worker runtime", reason: "Provider calls, worker execution, network calls, and spend are not enabled." },
    ],
    safety: {
      founderIntakeExecutionAllowed: agentWorkplan.founderIntakeExecutionAllowed,
      autonomousQnaAllowed: agentWorkplan.autonomousQnaAllowed,
      prdGenerationAllowed: agentWorkplan.prdGenerationAllowed,
      agentDispatchAllowed: agentWorkplan.agentDispatchAllowed,
      selfHealingApplyAllowed: agentWorkplan.selfHealingApplyAllowed,
      projectMutationAllowed: agentWorkplan.projectMutationAllowed,
      dbWritesAllowed: agentWorkplan.dbWritesAllowed,
      providerDispatchAllowed: agentWorkplan.providerDispatchAllowed,
      toolExecutionAllowed: agentWorkplan.toolExecutionAllowed,
      workerExecutionAllowed: agentWorkplan.workerExecutionAllowed,
      networkCallsAllowed: agentWorkplan.networkCallsAllowed,
      deployExecutionAllowed: agentWorkplan.deployExecutionAllowed,
      releaseExecutionAllowed: agentWorkplan.releaseExecutionAllowed,
      exportExecutionAllowed: agentWorkplan.exportExecutionAllowed,
      packageCreationAllowed: agentWorkplan.packageCreationAllowed,
      providerSpendAllowed: agentWorkplan.providerSpendAllowed,
    },
  };
}

export const enterprisePreviewReadinessViewModel = buildEnterprisePreviewReadinessViewModel();
