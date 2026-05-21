import { buildBusinessBuildPlan } from "../../../business-build/businessBuildPlan.js";
import { buildFounderActivationReviewPacket } from "../../../live-ready/founderActivationReviewPacket.js";
import { buildFounderPrdSafeAuthoring } from "../../../live-ready/founderPrdSafeAuthoring.js";
import { buildFounderRuntimeEnvelope } from "../../../live-ready/founderRuntimeEnvelope.js";

export const BUSINESS_BUILD_ROUTE_ID = "business-build";
export const DEFAULT_BUSINESS_BUILD_IDEA =
  "I have a startup idea. Validate if it is feasible and tell me what you need next.";

function toTitle(value = "") {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bPrd\b/g, "PRD")
    .replace(/\bDb\b/g, "DB");
}

function toBusinessBuildAnswers(prdFields = {}) {
  return {
    founderIdea: prdFields.founderIdea,
    targetCustomer: prdFields.targetCustomer,
    problem: prdFields.problem,
    proposedSolution: prdFields.solution,
    businessModel: prdFields.businessModel,
    goToMarket: prdFields.goToMarket,
    constraints: prdFields.risks,
    successCriteria: prdFields.successCriteria,
  };
}

function buildFounderHighlights(prdFields = {}) {
  return [
    {
      label: "Idea",
      value: prdFields.founderIdea || "Founder idea not captured yet.",
      detail: "NEXUS uses this as the current business build scope.",
    },
    {
      label: "Customer",
      value: prdFields.targetCustomer || "Target customer needs confirmation.",
      detail: "Agent lanes use this customer definition for product, design, GTM, and support planning.",
    },
    {
      label: "Problem",
      value: prdFields.problem || "Problem statement needs confirmation.",
      detail: "This is the pain or market gap the plan is trying to validate.",
    },
    {
      label: "Solution",
      value: prdFields.solution || "Solution direction needs confirmation.",
      detail: "This is the MVP direction agents will plan around before any execution is enabled.",
    },
  ];
}

const FOUNDER_DB_LANES = [
  { sqliteEntity: "founder_sessions", label: "Founder session" },
  { sqliteEntity: "founder_qna_turns", label: "Founder Q&A turns" },
  { sqliteEntity: "founder_prd_artifacts", label: "PRD artifact" },
  { sqliteEntity: "founder_workstream_plans", label: "Workstream plan" },
];

const FOUNDER_DB_BLOCKERS = [
  "Operator approval is required before local founder workflow persistence.",
  "Rollback acceptance is required before local founder workflow persistence.",
  "Audit acceptance is required before local founder workflow persistence.",
  "Validation command acceptance is required before local founder workflow persistence.",
  "SQLite live mode and local write flags are required before local founder workflow persistence.",
];

function buildFounderRuntimeDbWorkflowData(founderIdeaSummary = DEFAULT_BUSINESS_BUILD_IDEA) {
  return {
    currentState: "founder_runtime_db_view_model_ready",
    founderSession: {
      publicLabel: "Founder session",
      founderIdeaSummary,
      currentState: "captured_locally",
      nextQuestion: "Who is the target customer, launch constraint, and success metric?",
    },
    qnaTurns: [
      {
        speaker: "founder",
        prompt: founderIdeaSummary,
        responseSummary: "Founder idea is captured locally for DB-backed PRD and workstream planning.",
        turnState: "captured_locally",
      },
    ],
    prdArtifact: {
      title: "Founder App PRD",
      currentState: "drafted_locally",
      readinessPercent: 65,
    },
    workstreamPlan: {
      currentState: "planned_locally",
      dispatchAllowed: false,
      workerExecutionAllowed: false,
      projectMutationAllowed: false,
    },
    mutationRequests: FOUNDER_DB_LANES.map((lane) => ({
      ...lane,
      requestState: "ready_for_operator_review",
      ownerCapability: "NEXUS Founder Runtime DB",
      missingEvidence: ["operatorApproval", "rollbackAccepted", "auditAccepted", "validationCommandsAccepted"],
      evidenceRefs: ["reports/p943-founder-runtime-crud-model-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local SQLite only after approval. No provider spend.",
    })),
    allowedLocalCrudOperations: ["create", "read", "update", "upsert", "list"],
    forbiddenOperations: [
      "delete",
      "hosted DB mutation",
      "project mutation",
      "provider/model calls",
      "agent dispatch",
      "worker/tool execution",
      "deploy/release/export/package",
      "provider spend",
    ],
    nextAction: "Review display-safe founder workflow records before P94.5 Command Center rendering.",
    blockers: FOUNDER_DB_BLOCKERS,
    disabledReason:
      "P94.4 only prepares display-safe founder DB workflow state. Provider/model calls, agent dispatch, tool/worker execution, project creation, project mutation, hosted DB mutation, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
    ownerCapability: "NEXUS Founder Runtime DB View Model",
    evidenceRefs: ["reports/p944-founder-db-view-model-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Display-safe local model only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
  };
}

function toDisplayLane(request = {}) {
  return {
    label: request.label || toTitle(request.sqliteEntity || "Founder record"),
    currentState: toTitle(request.requestState || "ready_for_operator_review"),
    ownerCapability: request.ownerCapability || "NEXUS Founder Runtime DB",
    nextAction: "Review the local save request and required evidence before approved SQLite admission.",
    blocker: request.missingEvidence?.[0]
      ? `${toTitle(request.missingEvidence[0])} required`
      : "No local approval evidence missing",
    disabledReason: "Local save remains blocked until operator approval, rollback, audit, validation, sqlite-live mode, and local write flags are present.",
    evidenceLocation: request.evidenceRefs?.[0] || "reports/p943-founder-runtime-crud-model-report.md",
    activityLocation: request.activityLocation || "reports/os-phase-status-report.md",
    costImpact: request.costImpact || "Local SQLite only after approval. No provider spend.",
  };
}

function toReadinessLane(lane = {}) {
  return {
    label: lane.label || "Business Build lane",
    currentState: lane.currentState || toTitle(lane.dryRunAdmissionState || lane.readinessState || "blocked_until_required_evidence"),
    ownerCapability: lane.ownerCapability || "NEXUS Business Build Readiness",
    nextAction: lane.nextAction || "Review local readiness evidence before execution can be considered.",
    blocker: lane.missingEvidence?.length ? `${toTitle(lane.missingEvidence[0])} required` : "No local evidence blocker",
    disabledReason: lane.disabledReason || "Dry-run admission is display-only and cannot execute or mutate.",
    evidenceLocation: lane.evidenceLocation || "Local readiness evidence",
    activityLocation: lane.activityLocation || "OS activity report",
    costImpact: lane.costImpact || "Local deterministic preview only. No provider spend.",
    executionAllowed: lane.executionAllowed === true ? "Allowed" : "Blocked",
    dispatchAllowed: lane.dispatchAllowed === true ? "Allowed" : "Blocked",
    projectMutationAllowed: lane.projectMutationAllowed === true ? "Allowed" : "Blocked",
  };
}

function buildBusinessBuildDryRunAdmissionView(founderDbWorkflow = {}) {
  const lanes = (founderDbWorkflow.lanes || FOUNDER_DB_LANES).map((lane) => ({
    label: lane.label || "Business Build lane",
    currentState: "Eligible For Future Governed Execution Review",
    ownerCapability: lane.ownerCapability || "NEXUS Business Build Readiness",
    nextAction: "Keep this lane in local review until a later execution phase explicitly admits it.",
    blocker: "Execution blocked",
    disabledReason: "Dry-run admission is display-only and cannot dispatch agents, execute workers/tools, mutate projects, call providers, deploy, package, or spend.",
    evidenceLocation: "Dry-run admission report",
    activityLocation: "OS activity report",
    costImpact: "Local deterministic dry-run admission only. No provider spend.",
    executionAllowed: "Blocked",
    dispatchAllowed: "Blocked",
    projectMutationAllowed: "Blocked",
  }));

  return {
    currentState: "Dry Run Admission Ready Execution Blocked",
    readinessMode: "DB-backed local readiness review",
    dbSourceState: founderDbWorkflow.currentState || "DB-backed founder workflow is ready for local review",
    readyLaneCount: lanes.length,
    totalLaneCount: lanes.length,
    admittedForExecutionCount: 0,
    nextAction: "Review the local DB-backed founder workflow and keep execution blocked until a later governed phase admits it.",
    blockers: [
      "Agent dispatch is blocked.",
      "Worker/tool execution is blocked.",
      "Project mutation is blocked.",
      "Hosted DB mutation is blocked.",
      "Provider spend is blocked.",
    ],
    disabledReason: "This is dry-run admission only. Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, package, network calls, and spend remain blocked.",
    ownerCapability: "NEXUS Business Build Dry-Run Admission",
    evidenceLocation: "Dry-run admission report",
    activityLocation: "OS activity report",
    costImpact: "Local deterministic readiness only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    lanes,
    safetyRows: [
      { label: "Execution", value: "Blocked" },
      { label: "Agent dispatch", value: "Blocked" },
      { label: "Worker/tool execution", value: "Blocked" },
      { label: "Project mutation", value: "Blocked" },
      { label: "Hosted DB mutation", value: "Blocked" },
      { label: "Deploy/package", value: "Blocked" },
      { label: "Provider spend", value: "Blocked" },
    ],
  };
}

export function buildFounderRuntimeDbViewModel(founderIdeaSummary = DEFAULT_BUSINESS_BUILD_IDEA) {
  const workflow = buildFounderRuntimeDbWorkflowData(founderIdeaSummary);
  const session = workflow.founderSession || {};
  const prd = workflow.prdArtifact || {};
  const workstream = workflow.workstreamPlan || {};
  const qnaTurn = workflow.qnaTurns?.[0] || {};

  return {
    currentState: "DB-backed founder workflow ready for local review",
    savedSessionState: toTitle(session.currentState || "captured_locally"),
    founderIdea: session.founderIdeaSummary || founderIdeaSummary,
    nextQuestion: session.nextQuestion || "Confirm the target customer, launch constraint, and success metric.",
    prdReadiness: `${prd.readinessPercent || 0}%`,
    prdState: toTitle(prd.currentState || "drafted_locally"),
    qnaSummary: qnaTurn.responseSummary || "Founder Q&A turn is ready to persist locally after approval.",
    workstreamState: toTitle(workstream.currentState || "planned_locally"),
    nextAction: workflow.nextAction,
    blockers: workflow.blockers,
    disabledReason: workflow.disabledReason,
    ownerCapability: workflow.ownerCapability,
    evidenceLocation: workflow.evidenceRefs?.[0] || "reports/p943-founder-runtime-crud-model-report.md",
    activityLocation: workflow.activityLocation,
    costImpact: workflow.costImpact,
    allowedLocalCrudOperations: workflow.allowedLocalCrudOperations.map(toTitle),
    forbiddenOperations: workflow.forbiddenOperations.map(toTitle),
    lanes: (workflow.mutationRequests || []).map(toDisplayLane),
    safety: {
      providerCallsAllowed: false,
      modelCallsAllowed: false,
      agentDispatchAllowed: false,
      toolExecutionAllowed: false,
      workerExecutionAllowed: false,
      projectMutationAllowed: false,
      hostedDbWritesAllowed: false,
      deployExecutionAllowed: false,
      releaseExecutionAllowed: false,
      exportExecutionAllowed: false,
      packageCreationAllowed: false,
      providerSpendAllowed: false,
    },
  };
}

const FOUNDER_WORKSTREAM_DRY_RUN_ROWS = [
  {
    label: "Local founder task orchestration",
    currentState: "Local envelope defined needs founder answers",
    previewNextState: "Local preview ready for operator review",
    founderInputsNeeded: ["problem", "target customer", "solution", "business model", "constraints"],
    previewOutputs: ["clarifying question plan", "PRD readiness packet outline", "agent lane plan", "operator review checklist"],
    blockers: ["founder answers missing", "operator approval missing", "runtime policy review missing"],
    ownerCapability: "NEXUS Founder Runtime",
  },
  {
    label: "Generated workspace boundary",
    currentState: "Local envelope defined needs founder answers",
    previewNextState: "Local preview ready for operator review",
    founderInputsNeeded: ["problem", "target customer", "solution", "business model", "constraints"],
    previewOutputs: ["PRD readiness packet outline", "solution architecture checklist", "agent lane plan", "workspace boundary review"],
    blockers: ["source/test boundary review", "operator approval missing", "runtime policy review missing"],
    ownerCapability: "NEXUS Generated Workspace Governance",
  },
  {
    label: "Live unlock review",
    currentState: "Local envelope defined needs founder answers",
    previewNextState: "Local preview ready for operator review",
    founderInputsNeeded: ["problem", "target customer", "solution", "business model", "constraints"],
    previewOutputs: ["risk checklist", "cost review packet", "agent lane plan", "operator review checklist"],
    blockers: ["cost evidence missing", "operator approval missing", "runtime policy review missing"],
    ownerCapability: "NEXUS Live Activation Governance",
  },
];

export function buildBusinessBuildViewModel(founderIdeaSummary = DEFAULT_BUSINESS_BUILD_IDEA) {
  const founderEnvelope = buildFounderRuntimeEnvelope({ founderIdeaSummary }).data;
  const prdAuthoringEnvelope = buildFounderPrdSafeAuthoring({ founderIdeaSummary }).data;
  const activationReviewPacket = buildFounderActivationReviewPacket({ founderIdeaSummary }).data;
  const prdFields = founderEnvelope.prdDraft?.fields || {};
  const plan = buildBusinessBuildPlan({
    founderIdeaSummary: prdFields.founderIdea,
    answers: toBusinessBuildAnswers(prdFields),
    evidenceRefs: ["Business build plan evidence report"],
    activityRefs: ["OS phase status evidence report"],
  });
  const data = plan.data;
  const readinessPercent = Math.round((data.prdReadiness.score || 0) * 100);
  const nextAgentLane = founderEnvelope.agentFlow?.[0];
  const founderHighlights = buildFounderHighlights(prdFields);
  const founderDbWorkflow = buildFounderRuntimeDbViewModel(founderIdeaSummary);
  const dryRunAdmission = buildBusinessBuildDryRunAdmissionView(founderDbWorkflow);

  return {
    routeId: BUSINESS_BUILD_ROUTE_ID,
    pageTitle: "Business Build",
    founderIdea: prdFields.founderIdea,
    targetCustomer: prdFields.targetCustomer,
    problem: prdFields.problem,
    solution: prdFields.solution,
    founderHighlights,
    feasibilityVerdict: data.prdReadiness.readyForWorkstreams
      ? "Feasible enough for local MVP planning"
      : "Needs more founder answers before MVP planning",
    founderNextStep: founderEnvelope.chat?.nextAction || data.nextAction,
    agentPlanSummary: nextAgentLane
      ? `${nextAgentLane.lane} starts with ${nextAgentLane.nextAction}`
      : "NEXUS will map the PRD to owner lanes after intake is complete.",
    safetySummary: "Planning is live-local. Local SQLite readiness is visible; dispatch, provider calls, project writes, hosted DB mutation, deploy, package creation, and spend remain blocked.",
    whatChanged: "Business Build now follows the founder idea from Chat with NEXUS into PRD readiness, workstreams, and milestones.",
    currentState: "Founder plan is ready for local review. Runtime execution remains disabled.",
    nextAction: data.nextAction,
    ownerAgent: "WARDEN",
    ownerCapability: data.ownerCapability,
    evidenceLocation: "Business build plan evidence report",
    activityLocation: "OS phase status evidence report",
    costImpact: data.costImpact,
    disabledReason: "Business Build is a dry-run planning surface. Provider calls, agent dispatch, tool execution, worker execution, project mutation, DB writes, deploy, release, export, package creation, auth/session/user/workspace mutation, and provider spend remain blocked.",
    readinessCards: [
      { label: "Founder idea", value: "Captured", tone: "pass", detail: prdFields.founderIdea },
      { label: "PRD readiness", value: `${readinessPercent}%`, tone: "pass", detail: "Local PRD fields are complete for planning." },
      { label: "Agent lanes", value: String(data.workstreams.length), tone: "teal", detail: "Product, design, engineering, GTM, finance, operations, legal, and support lanes are mapped." },
      { label: "Execution", value: "Blocked", tone: "disabled", detail: "No provider, worker, project, DB, deploy, or spend path is invoked." },
    ],
    prdReadiness: {
      ready: data.prdReadiness.readyForWorkstreams,
      score: readinessPercent,
      missingFields: data.prdReadiness.missingFields,
      source: "Founder intake answers mapped to local PRD fields.",
      fields: prdFields,
    },
    founderPrdAuthoring: {
      title: prdAuthoringEnvelope.prdArtifact?.title || "Local PRD Artifact",
      currentState: toTitle(prdAuthoringEnvelope.currentState),
      reviewState: toTitle(prdAuthoringEnvelope.prdArtifact?.reviewState),
      authoringMode: toTitle(prdAuthoringEnvelope.authoringMode),
      nextAction: prdAuthoringEnvelope.prdArtifact?.missingSections?.length
        ? "Collect the missing founder input before operator review."
        : "Inspect the local PRD artifact and approve the next scoped planning review.",
      disabledReason:
        "This lane only authors a deterministic PRD artifact in memory. Project files, provider/model calls, agent dispatch, tool execution, worker execution, local executor runs, DB writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: prdAuthoringEnvelope.ownerCapability,
      evidenceLocation: prdAuthoringEnvelope.evidenceRefs?.[0] ? "Founder PRD safety report" : "Local PRD evidence report",
      activityLocation: prdAuthoringEnvelope.activityLocation ? "OS phase status report" : "Activity report pending",
      costImpact: prdAuthoringEnvelope.costImpact,
      localAuthoring: prdAuthoringEnvelope.localAuthoring,
      forbiddenOperations: prdAuthoringEnvelope.forbiddenOperations,
      acceptanceCriteria: prdAuthoringEnvelope.prdArtifact?.acceptanceCriteria || [],
      sections: (prdAuthoringEnvelope.prdArtifact?.sections || []).map((section) => ({
        label: section.title,
        status: toTitle(section.status),
        content: section.content || "Founder input required before operator review.",
      })),
      safetyRows: [
        { label: "Project writes", value: prdAuthoringEnvelope.localAuthoring?.writesFiles === false ? "Blocked" : "Allowed" },
        { label: "Project mutation", value: prdAuthoringEnvelope.localAuthoring?.mutatesProjects === false ? "Blocked" : "Allowed" },
        { label: "Agent dispatch", value: prdAuthoringEnvelope.localAuthoring?.dispatchesAgents === false ? "Blocked" : "Allowed" },
        { label: "Provider calls", value: prdAuthoringEnvelope.localAuthoring?.callsProviders === false ? "Blocked" : "Allowed" },
        { label: "Network", value: prdAuthoringEnvelope.localAuthoring?.usesNetwork === false ? "Blocked" : "Allowed" },
        { label: "Spend", value: prdAuthoringEnvelope.localAuthoring?.spendsBudget === false ? "Blocked" : "Allowed" },
      ],
    },
    workstreamRows: data.workstreams.map((entry) => ({
      label: toTitle(entry.workstream),
      ownerCapability: entry.ownerCapability,
      status: toTitle(entry.status),
      objective: entry.objective,
      nextInput: entry.inputsNeeded[0] || "Validated PRD draft",
      blocker: entry.blockers[0] || "No blocker",
    })),
    milestoneRows: data.milestones.map((entry) => ({
      label: toTitle(entry.milestone),
      ownerCapability: entry.ownerCapability,
      status: toTitle(entry.status),
      objective: entry.objective,
      blocker: entry.blockers[0] || "No blocker",
    })),
    founderWorkstreamDryRun: {
      currentState: dryRunAdmission.currentState,
      nextAction: dryRunAdmission.nextAction,
      disabledReason: dryRunAdmission.disabledReason,
      ownerCapability: dryRunAdmission.ownerCapability,
      evidenceLocation: dryRunAdmission.evidenceLocation,
      activityLocation: dryRunAdmission.activityLocation,
      costImpact: dryRunAdmission.costImpact,
      readyLaneCount: dryRunAdmission.readyLaneCount,
      totalLaneCount: dryRunAdmission.totalLaneCount,
      admittedForExecutionCount: dryRunAdmission.admittedForExecutionCount,
      admissionLanes: (dryRunAdmission.lanes || []).map(toReadinessLane),
      rows: FOUNDER_WORKSTREAM_DRY_RUN_ROWS.map((run) => ({
        ...run,
        nextAction: "Complete founder answers and operator review evidence before any execution-enabling phase.",
        disabledReason: "Dry-run row is display-only and cannot execute or mutate.",
        evidenceLocation: "Founder workstream dry-run report",
        activityLocation: "OS phase status report",
        costImpact: "No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      })),
    },
    localExecutionReadiness: {
      currentState: dryRunAdmission.currentState,
      readinessMode: dryRunAdmission.readinessMode,
      dbSourceState: dryRunAdmission.dbSourceState,
      readyLaneCount: dryRunAdmission.readyLaneCount,
      totalLaneCount: dryRunAdmission.totalLaneCount,
      nextAction: dryRunAdmission.nextAction,
      blockers: dryRunAdmission.blockers,
      disabledReason: dryRunAdmission.disabledReason,
      ownerCapability: dryRunAdmission.ownerCapability,
      evidenceLocation: dryRunAdmission.evidenceLocation,
      activityLocation: dryRunAdmission.activityLocation,
      costImpact: dryRunAdmission.costImpact,
      lanes: (dryRunAdmission.lanes || []).map(toReadinessLane),
      safetyRows: dryRunAdmission.safetyRows,
    },
    founderDbWorkflow,
    activationReview: {
      currentState: toTitle(activationReviewPacket.currentState),
      packetMode: toTitle(activationReviewPacket.packetMode),
      ready: activationReviewPacket.reviewReadiness?.ready === true,
      readyItemCount: activationReviewPacket.reviewReadiness?.readyItemCount || 0,
      totalItemCount: activationReviewPacket.reviewReadiness?.totalItemCount || 0,
      blockerCount: activationReviewPacket.reviewReadiness?.blockerCount || 0,
      nextAction: activationReviewPacket.reviewReadiness?.ready
        ? "Review the activation packet and prepare aggregate validation."
        : activationReviewPacket.nextAction,
      disabledReason:
        "The local activation review packet is review-only. Provider/model calls, agent dispatch, tool execution, worker execution, project creation, project mutation, DB writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: activationReviewPacket.ownerCapability,
      evidenceLocation: activationReviewPacket.evidenceRefs?.[0] ? "Founder activation review report" : "Activation review evidence pending",
      activityLocation: activationReviewPacket.activityLocation ? "OS phase status report" : "Activity report pending",
      costImpact: activationReviewPacket.costImpact,
      checklist: activationReviewPacket.operatorChecklist || [],
      reviewItems: (activationReviewPacket.reviewItems || []).map((item) => ({
        label: toTitle(item.lane),
        ownerCapability: item.ownerCapability,
        status: toTitle(item.status),
        objective: item.objective,
        blocker: item.blocker,
        nextAction: item.nextAction,
        disabledReason: item.disabledReason,
        activationAllowed: item.activationAllowed === true ? "Allowed" : "Blocked",
        requiredEvidence: item.requiredEvidence || [],
      })),
      safetyRows: [
        { label: "Activation", value: activationReviewPacket.activationAllowed === false ? "Blocked" : "Allowed" },
        { label: "Agent dispatch", value: activationReviewPacket.agentDispatchAllowed === false ? "Blocked" : "Allowed" },
        { label: "Project mutation", value: activationReviewPacket.projectMutationAllowed === false ? "Blocked" : "Allowed" },
        { label: "DB writes", value: activationReviewPacket.dbWritesAllowed === false ? "Blocked" : "Allowed" },
        { label: "Deploy/package", value: activationReviewPacket.deployExecutionAllowed === false && activationReviewPacket.packageCreationAllowed === false ? "Blocked" : "Allowed" },
        { label: "Provider spend", value: activationReviewPacket.providerSpendAllowed === false ? "Blocked" : "Allowed" },
      ],
    },
    blockers: data.blockers,
    disabledActions: data.disabledActions.map((action) => ({
      label: toTitle(action),
      reason: "Unavailable from Business Build until explicit approval, scope, budget, rollback, activity, cost, and redaction evidence exist.",
    })),
    safety: {
      executionEnabled: false,
      providerCallsAllowed: false,
      agentDispatchAllowed: false,
      toolExecutionAllowed: false,
      workerExecutionAllowed: false,
      projectMutationAllowed: false,
      dbWritesAllowed: false,
      deployExecutionAllowed: false,
      providerSpendAllowed: false,
    },
  };
}

export const businessBuildViewModel = buildBusinessBuildViewModel();
