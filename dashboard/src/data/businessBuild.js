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

const BUSINESS_BUILD_DB_RECORD_LABELS = {
  business_build_sessions: "Business Build session",
  business_build_execution_requests: "Execution requests",
  business_build_agent_lanes: "Agent lanes",
  business_build_prd_snapshots: "PRD snapshots",
};

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

function buildFounderLiveUseDisplayModels({ prdAuthoringEnvelope = {}, dryRunAdmission = {}, liveWorkstreamHandoff = {}, executionAdmissionDryRun = {} } = {}) {
  const laneRows = [
    {
      label: "Founder Q&A",
      currentState: "Founder Runtime Local Admitted",
      reviewState: "Ready For Founder Review",
      ownerCapability: "NEXUS Founder Runtime Admission",
      nextAction: "Ask the next founder question locally and keep execution controls blocked.",
      blocker: "Execution remains blocked by safety contract.",
      evidenceLocation: "reports/p1012-founder-live-use-readiness-model-report.md",
    },
    {
      label: "Local PRD",
      currentState: toTitle(prdAuthoringEnvelope.currentState),
      reviewState: toTitle(prdAuthoringEnvelope.prdArtifact?.reviewState || "ready_for_operator_review"),
      ownerCapability: prdAuthoringEnvelope.ownerCapability || "NEXUS Founder PRD Safe Authoring",
      nextAction: "Review the local PRD artifact before workstream review.",
      blocker: "Execution remains blocked by safety contract.",
      evidenceLocation: "reports/p903-founder-prd-safe-authoring-report.md",
    },
    {
      label: "Agent Workstream Plan",
      currentState: liveWorkstreamHandoff.currentState || "Local Handoff Ready",
      reviewState: "Ready For Founder Review",
      ownerCapability: liveWorkstreamHandoff.ownerCapability || "NEXUS Live Workstream Handoff",
      nextAction: liveWorkstreamHandoff.nextAction || "Review agent lane ownership and blockers before dispatch.",
      blocker: "Agent dispatch remains blocked.",
      evidenceLocation: liveWorkstreamHandoff.evidenceLocation || "reports/p982-founder-live-workstream-handoff-model-report.md",
    },
    {
      label: "Local DB Readiness",
      currentState: dryRunAdmission.currentState || "Dry Run Admission Ready Execution Blocked",
      reviewState: "Ready For Founder Review",
      ownerCapability: dryRunAdmission.ownerCapability || "NEXUS Business Build Dry-Run Admission",
      nextAction: "Keep local DB records reviewable and block hosted DB mutation.",
      blocker: "Hosted DB mutation remains blocked.",
      evidenceLocation: dryRunAdmission.evidenceLocation || "reports/p1012-founder-live-use-readiness-model-report.md",
    },
    {
      label: "Execution Admission Review",
      currentState: executionAdmissionDryRun.currentState || "Execution Admission Dry Run Ready Execution Blocked",
      reviewState: "Ready For Founder Review",
      ownerCapability: executionAdmissionDryRun.ownerCapability || "NEXUS Execution Admission Dry Run",
      nextAction: executionAdmissionDryRun.nextAction || "Show dry-run admission state while execution remains blocked.",
      blocker: "Execution remains blocked.",
      evidenceLocation: executionAdmissionDryRun.evidenceLocation || "reports/p994-founder-execution-admission-dry-run-report.md",
    },
    {
      label: "Live Readiness Gate",
      currentState: "Full Command Center Founder Safe Live Readiness Visible",
      reviewState: "Ready For Founder Review",
      ownerCapability: "NEXUS Live Readiness Governance",
      nextAction: "Use this review packet in Command Center without runnable execution controls.",
      blocker: "Provider/model calls remain blocked.",
      evidenceLocation: "reports/p1007-founder-command-center-final-report.md",
    },
  ].map((lane) => ({
    ...lane,
    disabledReason:
      "Founder live-use readiness is local review only. Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, and spend remain blocked.",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    executionAllowed: "Blocked",
    dispatchAllowed: "Blocked",
    projectMutationAllowed: "Blocked",
  }));

  const checklist = [
    {
      label: "Founder context and PRD are reviewable",
      status: "Complete",
      ownerCapability: "NEXUS Founder PRD Safe Authoring",
      nextAction: "Review the local PRD artifact before execution admission.",
    },
    {
      label: "Agent lanes are mapped without dispatch",
      status: "Complete",
      ownerCapability: "NEXUS Founder Workstream Runtime Governance",
      nextAction: "Review agent lane owners, blockers, and evidence before any later dispatch phase.",
    },
    {
      label: "Local DB readiness is reviewable",
      status: "Complete",
      ownerCapability: "NEXUS Business Build Local Execution Readiness",
      nextAction: "Keep local DB review separate from hosted DB mutation.",
    },
    {
      label: "Execution authority remains blocked",
      status: "Complete",
      ownerCapability: "NEXUS Safety Governance",
      nextAction: "Do not expose runnable execution controls in Command Center.",
    },
  ];

  const safetyRows = [
    { label: "Execution", value: "Blocked" },
    { label: "Agent dispatch", value: "Blocked" },
    { label: "Worker/tool execution", value: "Blocked" },
    { label: "Project mutation", value: "Blocked" },
    { label: "Hosted DB", value: "Blocked" },
    { label: "Deploy/package", value: "Blocked" },
    { label: "Provider spend", value: "Blocked" },
  ];

  return {
    readiness: {
      currentState: "Founder Live Use Local Review Ready Execution Blocked",
      founderLiveUseMode: "Local Governed Readiness Only",
      readyLaneCount: laneRows.length,
      totalLaneCount: laneRows.length,
      executableLaneCount: 0,
      dispatchableLaneCount: 0,
      projectMutationLaneCount: 0,
      nextAction: "Render the founder live-use review packet in Command Center without runnable execution controls.",
      blockers: [
        "Agent dispatch is blocked.",
        "Worker/tool execution is blocked.",
        "Project mutation is blocked.",
        "Hosted DB mutation is blocked.",
        "Provider spend is blocked.",
      ],
      disabledReason:
        "P101.4 renders founder live-use readiness only. Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, and spend remain blocked.",
      ownerCapability: "NEXUS Founder Live Use Hardening",
      evidenceLocation: "reports/p1012-founder-live-use-readiness-model-report.md",
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      laneRows,
      safetyRows,
    },
    review: {
      currentState: "Founder Live Use Review Packet Ready Execution Blocked",
      reviewMode: "Display Safe Local Review Only",
      ready: true,
      readyItemCount: checklist.length,
      totalItemCount: checklist.length,
      laneReviewCount: laneRows.length,
      executableLaneCount: 0,
      dispatchableLaneCount: 0,
      projectMutationLaneCount: 0,
      nextAction: "Review this founder live-use packet without enabling execution.",
      blockers: [
        "Provider/model calls remain blocked.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project mutation remains blocked.",
        "Hosted DB mutation remains blocked.",
        "Deploy/release/export/package actions remain blocked.",
        "Provider spend remains blocked.",
      ],
      disabledReason:
        "P101.4 is Command Center rendering only. Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, and spend remain blocked.",
      ownerCapability: "NEXUS Founder Live Use Review Governance",
      evidenceLocation: "reports/p1013-founder-live-use-review-packet-report.md",
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Display-safe local review only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      checklist,
      laneRows,
      safetyRows,
    },
  };
}

function buildFounderLiveHandoffDisplayModels({ founderIdea = "Founder idea captured for governed review.", founderLiveUseReview = {} } = {}) {
  const laneSource = Array.isArray(founderLiveUseReview.laneRows) ? founderLiveUseReview.laneRows : [];
  const handoffLanes = laneSource.map((lane) => ({
    label: lane.label,
    currentState: lane.currentState,
    handoffState: "Ready For Governed Handoff Review",
    ownerCapability: lane.ownerCapability,
    nextAction: `Prepare a governed dry-run work row for ${lane.label}.`,
    blocker: lane.blocker || "Execution remains blocked by the P102 safety contract.",
    disabledReason:
      "Founder live handoff is local review only. Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, and spend remain blocked.",
    evidenceLocation: lane.evidenceLocation || "reports/p1022-founder-live-handoff-manifest-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    agentWorkAllowed: "Blocked",
    dispatchAllowed: "Blocked",
    toolExecutionAllowed: "Blocked",
    projectMutationAllowed: "Blocked",
  }));

  const workOrderRows = handoffLanes.map((lane, index) => {
    const agentMap = ["Founder Intake Lead", "Product Strategist", "Program Architect", "Data Steward", "Safety Governor", "Launch Readiness Lead"];
    const proposedAgent = agentMap[index] || "NEXUS Operator";
    return {
      label: `${proposedAgent}: ${lane.label}`,
      proposedAgent,
      proposedWork: `Prepare a governed implementation plan for ${lane.label} after a later execution phase grants authority.`,
      dryRunState: "Dry Run Only Execution Blocked",
      ownerCapability: lane.ownerCapability,
      validationCommand: "npm run check:p1023-founder-live-handoff-work-orders",
      nextAction: lane.nextAction,
      blocker: lane.blocker,
      disabledReason: lane.disabledReason,
      evidenceLocation: lane.evidenceLocation,
      activityLocation: lane.activityLocation,
      costImpact: lane.costImpact,
      executable: "Blocked",
      dispatchable: "Blocked",
      projectMutationAllowed: "Blocked",
    };
  });

  const safetyRows = [
    { label: "Work orders", value: "Dry run only" },
    { label: "Agent dispatch", value: "Blocked" },
    { label: "Worker/tool execution", value: "Blocked" },
    { label: "Project mutation", value: "Blocked" },
    { label: "Hosted DB", value: "Blocked" },
    { label: "Deploy/package", value: "Blocked" },
    { label: "Provider spend", value: "Blocked" },
  ];

  return {
    manifest: {
      currentState: "Founder Live Handoff Manifest Ready Execution Blocked",
      founderIdea,
      prdReadiness: "Local PRD reviewable",
      readyLaneCount: handoffLanes.length,
      totalLaneCount: handoffLanes.length,
      executableLaneCount: 0,
      dispatchableLaneCount: 0,
      projectMutationLaneCount: 0,
      nextAction: "Review dry-run work rows before any later execution phase.",
      blockers: [
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project mutation remains blocked.",
        "Provider/model calls remain blocked.",
        "Hosted DB mutation remains blocked.",
        "Provider spend remains blocked.",
      ],
      disabledReason:
        "P102.4 renders founder live handoff only. Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, and spend remain blocked.",
      ownerCapability: "NEXUS Founder Live Handoff Governance",
      evidenceLocation: "reports/p1022-founder-live-handoff-manifest-report.md",
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Display-safe local handoff review only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      handoffLanes,
      safetyRows,
    },
    workOrders: {
      currentState: "Founder Live Handoff Work Orders Dry Run Ready Execution Blocked",
      dryRunRowCount: workOrderRows.length,
      executableWorkOrderCount: 0,
      dispatchableWorkOrderCount: 0,
      projectMutationWorkOrderCount: 0,
      nextAction: "Use these rows to explain how agents would be put into action after a later approval phase.",
      blockers: [
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project mutation remains blocked.",
        "Provider/model calls remain blocked.",
        "Hosted DB mutation remains blocked.",
        "Provider spend remains blocked.",
      ],
      disabledReason:
        "P102.4 displays dry-run work rows only. It does not create live work orders, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Handoff Work Order Governance",
      evidenceLocation: "reports/p1023-founder-live-handoff-work-orders-report.md",
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local dry-run work-order planning only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      workOrderRows,
      safetyRows,
    },
  };
}

function buildFounderLiveWorkAdmissionDisplayModels({ founderIdea = "Founder idea captured for governed review." } = {}) {
  const agentRows = [
    ["Founder Intake Lead", "Founder Q&A"],
    ["Product Strategist", "Local PRD"],
    ["Program Architect", "Agent Workstream Plan"],
    ["Data Steward", "Local DB Readiness"],
    ["Safety Governor", "Execution Admission Review"],
    ["Launch Readiness Lead", "Live Readiness Gate"],
  ];
  const disabledReason =
    "P103.4 displays local work admission evidence only. It does not approve work, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.";
  const workAdmissions = agentRows.map(([agent, lane]) => ({
    label: `${agent}: ${lane}`,
    proposedAgentLane: agent,
    proposedOutcome: `Review evidence for ${lane} before any future phase can request live execution authority.`,
    approvalState: "Operator Review Required Execution Blocked",
    missingEvidence: [
      "Founder intent confirmed",
      "PRD/workstream acceptance criteria reviewed",
      "Rollback expectation documented",
      "Validation command reviewed",
    ],
    validationCommand: "npm run check:p1032-founder-live-work-admission-model",
    nextAction: "Review admission evidence before any future phase can request live execution authority.",
    blocker: "Operator approval is not granted.",
    disabledReason,
    ownerCapability: "NEXUS Founder Live Work Admission Governance",
    evidenceLocation: "reports/p1032-founder-live-work-admission-model-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local work admission only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    executable: "Blocked",
    dispatchable: "Blocked",
    projectMutationAllowed: "Blocked",
  }));
  const approvalGates = workAdmissions.map((row) => ({
    label: row.label,
    gateState: "Review Required Approval Blocked",
    reviewQuestion: "Does this work map to founder intent and PRD acceptance criteria?",
    missingEvidence: row.missingEvidence,
    validationCommand: "npm run check:p1033-founder-live-work-admission-approval-envelope",
    blocker: "Operator approval is not granted.",
    disabledReason,
    ownerCapability: row.ownerCapability,
    evidenceLocation: "reports/p1033-founder-live-work-admission-approval-envelope-report.md",
    activityLocation: row.activityLocation,
    costImpact: row.costImpact,
    approvalAllowed: "Blocked",
    executionAllowed: "Blocked",
  }));

  return {
    admission: {
      currentState: "Founder Live Work Admission Ready Execution Blocked",
      sourceHandoffState: "Founder Live Handoff Work Orders Dry Run Ready Execution Blocked",
      sourceWorkOrderState: "Founder Live Handoff Work Orders Dry Run Ready Execution Blocked",
      founderIdea,
      admittedWorkCount: workAdmissions.length,
      blockedWorkCount: workAdmissions.length,
      executableWorkCount: 0,
      dispatchableWorkCount: 0,
      projectMutationWorkCount: 0,
      approvedWorkCount: 0,
      nextAction: "Review approval evidence before any future phase can request live execution authority.",
      blockers: [
        "Operator approval remains blocked.",
        "Provider/model calls remain blocked.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project mutation remains blocked.",
        "Hosted DB mutation remains blocked.",
        "Provider spend remains blocked.",
      ],
      disabledReason,
      ownerCapability: "NEXUS Founder Live Work Admission Governance",
      evidenceLocation: "reports/p1032-founder-live-work-admission-model-report.md",
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local deterministic work admission only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      workAdmissions,
      safetyRows: [
        { label: "Approval", value: "Blocked" },
        { label: "Execution", value: "Blocked" },
        { label: "Agent dispatch", value: "Blocked" },
        { label: "Worker/tool execution", value: "Blocked" },
        { label: "Project mutation", value: "Blocked" },
        { label: "Hosted DB", value: "Blocked" },
        { label: "Provider spend", value: "Blocked" },
      ],
    },
    approval: {
      currentState: "Founder Live Work Admission Evidence Ready Approval Blocked",
      approvalGateCount: approvalGates.length,
      approvedGateCount: 0,
      executableGateCount: 0,
      dispatchableGateCount: 0,
      projectMutationGateCount: 0,
      hostedDbMutationGateCount: 0,
      nextAction: "Render P103.4 Command Center work admission UX without approval or execution controls.",
      blockers: [
        "Operator approval remains blocked.",
        "Approval controls remain blocked.",
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project mutation remains blocked.",
        "Hosted DB mutation remains blocked.",
        "Provider spend remains blocked.",
      ],
      disabledReason,
      ownerCapability: "NEXUS Founder Live Work Admission Governance",
      evidenceLocation: "reports/p1033-founder-live-work-admission-approval-envelope-report.md",
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local approval evidence only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      approvalGates,
    },
  };
}

export function buildBusinessBuildDbCrudViewModel(founderIdeaSummary = DEFAULT_BUSINESS_BUILD_IDEA) {
  const recordRows = [
    {
      label: BUSINESS_BUILD_DB_RECORD_LABELS.business_build_sessions,
      currentState: "Planned Locally",
      ownerCapability: "NEXUS Business Build DB",
      nextAction: "Review local CRUD admission evidence before saving Business Build state.",
      blocker: "Operator approval, rollback, audit, validation, sqlite-live mode, and local write flags are required.",
      evidenceLocation: "reports/p973-business-build-crud-model-report.md",
    },
    {
      label: BUSINESS_BUILD_DB_RECORD_LABELS.business_build_execution_requests,
      currentState: "Blocked Until Governed Admission",
      ownerCapability: "NEXUS Execution Governance",
      nextAction: "Keep execution requests in local review until operator evidence admits a specific DB record.",
      blocker: "Execution remains blocked; P97.4 displays local CRUD metadata only.",
      evidenceLocation: "reports/p973-business-build-crud-model-report.md",
    },
    {
      label: BUSINESS_BUILD_DB_RECORD_LABELS.business_build_agent_lanes,
      currentState: "2 lanes planned locally",
      ownerCapability: "NEXUS Agent Lane Planner",
      nextAction: "Show planned agent lanes while dispatch, worker execution, and project mutation remain blocked.",
      blocker: "Agent dispatch, worker execution, and project mutation remain blocked.",
      evidenceLocation: "reports/p973-business-build-crud-model-report.md",
    },
    {
      label: BUSINESS_BUILD_DB_RECORD_LABELS.business_build_prd_snapshots,
      currentState: "Captured Locally",
      ownerCapability: "NEXUS PRD Governance",
      nextAction: "Review the local PRD snapshot before routing workstream planning.",
      blocker: "Project source mutation and generated app writes remain blocked.",
      evidenceLocation: "reports/p973-business-build-crud-model-report.md",
    },
  ];

  const lanes = recordRows.map((record) => ({
    ...record,
    disabledReason: "P97.4 only renders governed local SQLite CRUD state for Business Build OS records. Provider/model calls, agent dispatch, tool/worker execution, project creation, project mutation, hosted DB mutation, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local SQLite CRUD only after approval. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    executionAllowed: "Blocked",
    dispatchAllowed: "Blocked",
    projectMutationAllowed: "Blocked",
  }));

  return {
    currentState: "Business Build DB CRUD Ready For Approved Local Admission",
    runtimeMode: "Local SQLite Business Build",
    dbMode: "Local SQLite guarded by explicit approval",
    founderIdea: founderIdeaSummary,
    savedSessionState: "Planned Locally",
    prdSnapshotState: "Captured Locally",
    executionRequestState: "Blocked Until Governed Admission",
    agentLaneState: "2 lanes planned locally; dispatch blocked",
    allowedLocalCrudOperations: ["Create", "Read", "Update", "Upsert", "List"],
    allowedRecords: Object.values(BUSINESS_BUILD_DB_RECORD_LABELS),
    readyRecordCount: lanes.length,
    totalRecordCount: lanes.length,
    nextAction: "Review approved local CRUD evidence, then admit only selected Business Build records through the governed SQLite helper.",
    blockers: [
      "Delete and raw SQL remain blocked.",
      "Agent dispatch and worker/tool execution remain blocked.",
      "Project source mutation remains blocked.",
      "Hosted DB mutation remains blocked.",
      "Deploy, package, network calls, and provider spend remain blocked.",
    ],
    disabledReason: "P97.4 only renders governed local SQLite CRUD state for Business Build OS records. Provider/model calls, agent dispatch, tool/worker execution, project creation, project mutation, hosted DB mutation, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
    ownerCapability: "NEXUS Business Build DB CRUD",
    evidenceLocation: "reports/p973-business-build-crud-model-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local SQLite CRUD only after approval. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    commandCenterVisible: true,
    lanes,
    safetyRows: [
      { label: "Local CRUD", value: "Guarded" },
      { label: "Delete/raw SQL", value: "Blocked" },
      { label: "Agent dispatch", value: "Blocked" },
      { label: "Worker/tool execution", value: "Blocked" },
      { label: "Project mutation", value: "Blocked" },
      { label: "Hosted DB", value: "Blocked" },
      { label: "Deploy/package", value: "Blocked" },
      { label: "Provider spend", value: "Blocked" },
    ],
  };
}

const LIVE_WORKSTREAM_HANDOFF_LANES = [
  {
    lane: "Product",
    ownerCapability: "NEXUS Product Definition",
    plannedWork: "Confirm MVP scope, acceptance criteria, and PRD completeness.",
  },
  {
    lane: "Design",
    ownerCapability: "NEXUS Design Planning",
    plannedWork: "Prepare interaction requirements and first-run UX review notes.",
  },
  {
    lane: "Engineering",
    ownerCapability: "NEXUS Engineering Planning",
    plannedWork: "Map implementation boundaries, test scope, and source ownership.",
  },
  {
    lane: "iOS",
    ownerCapability: "NEXUS iOS Delivery Planning",
    plannedWork: "Identify app target, signing needs, simulator checks, and release blockers.",
  },
  {
    lane: "Quality",
    ownerCapability: "NEXUS Quality Verification",
    plannedWork: "Define deterministic checks, Playwright coverage, and release evidence.",
  },
  {
    lane: "Go-to-market",
    ownerCapability: "NEXUS Launch Planning",
    plannedWork: "Prepare positioning, App Store readiness notes, and launch checklist.",
  },
];

export function buildFounderLiveWorkstreamHandoffContract() {
  return {
    phase: "P98.2",
    mode: "display_safe_local_handoff_model",
    source: "Business Build DB CRUD view model",
    allowedSourceRecords: Object.values(BUSINESS_BUILD_DB_RECORD_LABELS),
    requiredEvidence: [
      "Business Build session reviewed",
      "PRD snapshot reviewed",
      "Agent lane state reviewed",
      "Execution request remains blocked",
      "Operator approval not yet granted for dispatch",
    ],
    blockedOperations: [
      "provider/model calls",
      "agent dispatch",
      "worker/tool execution",
      "project source mutation",
      "hosted DB mutation",
      "deploy/release/export/package",
      "network calls",
      "provider spend",
    ],
    runtimeFlags: {
      providerCallsAllowed: false,
      modelCallsAllowed: false,
      agentDispatchAllowed: false,
      workerExecutionAllowed: false,
      toolExecutionAllowed: false,
      projectMutationAllowed: false,
      hostedDbWritesAllowed: false,
      deployAllowed: false,
      releaseAllowed: false,
      exportAllowed: false,
      packageCreationAllowed: false,
      networkCallsAllowed: false,
      providerSpendAllowed: false,
    },
  };
}

export function validateFounderLiveWorkstreamHandoffReadiness(packet = {}) {
  const flags = packet.runtimeFlags || {};
  const unsafeFlags = [
    "providerCallsAllowed",
    "modelCallsAllowed",
    "agentDispatchAllowed",
    "workerExecutionAllowed",
    "toolExecutionAllowed",
    "projectMutationAllowed",
    "hostedDbWritesAllowed",
    "deployAllowed",
    "releaseAllowed",
    "exportAllowed",
    "packageCreationAllowed",
    "networkCallsAllowed",
    "providerSpendAllowed",
  ];
  const errors = [];

  if (!Array.isArray(packet.sourceRecords) || packet.sourceRecords.length < 4) {
    errors.push("P98.2 handoff packet must include display-safe Business Build source records.");
  }
  if (!Array.isArray(packet.agentLanes) || packet.agentLanes.length < 4) {
    errors.push("P98.2 handoff packet must include display-safe agent lanes.");
  }
  if (!Array.isArray(packet.requiredEvidence) || packet.requiredEvidence.length < 4) {
    errors.push("P98.2 handoff packet must include required evidence.");
  }
  if (unsafeFlags.some((flag) => flags[flag] !== false)) {
    errors.push("P98.2 handoff packet must keep all unsafe runtime flags false.");
  }

  return {
    valid: errors.length === 0,
    errors,
    readyForCommandCenterUx: errors.length === 0,
    readyForExecution: false,
  };
}

export function buildFounderLiveWorkstreamHandoffPacket(founderIdeaSummary = DEFAULT_BUSINESS_BUILD_IDEA) {
  const contract = buildFounderLiveWorkstreamHandoffContract();
  const businessBuildDbCrud = buildBusinessBuildDbCrudViewModel(founderIdeaSummary);
  const sourceRecords = (businessBuildDbCrud.lanes || []).map((record) => ({
    label: record.label,
    currentState: record.currentState,
    ownerCapability: record.ownerCapability,
    nextAction: record.nextAction,
    blocker: record.blocker,
    disabledReason: record.disabledReason,
    evidenceLocation: record.evidenceLocation,
    activityLocation: record.activityLocation,
    costImpact: record.costImpact,
  }));
  const agentLanes = LIVE_WORKSTREAM_HANDOFF_LANES.map((lane, index) => ({
    ...lane,
    currentState: index < 3 ? "Ready For Handoff Review" : "Blocked Until Handoff Evidence",
    nextAction: "Review the local handoff packet before any dispatch-enabling phase can consider this lane.",
    blocker: "Agent dispatch and project mutation remain blocked.",
    disabledReason: "P98.2 only models live workstream handoff readiness. It cannot dispatch agents, run workers/tools, mutate projects, call providers, deploy, package, use hosted DBs, use network calls, or spend.",
    evidenceLocation: "reports/p982-founder-live-workstream-handoff-model-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local deterministic handoff packet only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    dispatchAllowed: "Blocked",
    workerExecutionAllowed: "Blocked",
    projectMutationAllowed: "Blocked",
  }));
  const packet = {
    handoffId: "local-business-build-workstream-handoff",
    currentState: "Ready For Local Handoff Review Execution Blocked",
    source: contract.source,
    founderIdea: founderIdeaSummary,
    sourceRecords,
    agentLanes,
    requiredEvidence: contract.requiredEvidence,
    blockedOperations: contract.blockedOperations,
    runtimeFlags: contract.runtimeFlags,
    nextAction: "Review the display-safe handoff packet and keep all execution blocked until a later phase explicitly admits dispatch.",
    blockers: [
      "Agent dispatch is blocked.",
      "Worker/tool execution is blocked.",
      "Project source mutation is blocked.",
      "Provider/model calls are blocked.",
      "Hosted DB mutation, deploy, package, network calls, and provider spend are blocked.",
    ],
    disabledReason: "P98.2 is a local handoff model only. Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package creation, network calls, and provider spend remain blocked.",
    ownerCapability: "NEXUS Live Workstream Handoff",
    evidenceLocation: "reports/p982-founder-live-workstream-handoff-model-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local deterministic model only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    commandCenterVisible: true,
  };

  return {
    ...packet,
    validation: validateFounderLiveWorkstreamHandoffReadiness(packet),
  };
}

export function buildFounderLiveWorkstreamHandoffDryRun(founderIdeaSummary = DEFAULT_BUSINESS_BUILD_IDEA) {
  const packet = buildFounderLiveWorkstreamHandoffPacket(founderIdeaSummary);
  const dryRunLanes = (packet.agentLanes || []).map((lane, index) => ({
    lane: lane.lane,
    ownerCapability: lane.ownerCapability,
    plannedWork: lane.plannedWork,
    dryRunState: index < 3 ? "Ready For Operator Review Dry Run" : "Blocked Until Handoff Evidence",
    previewNextAction: "Review required evidence and keep this lane blocked until a later execution admission phase.",
    requiredEvidence: packet.requiredEvidence,
    blockers: [lane.blocker, "Operator approval for execution admission is missing."],
    disabledReason: lane.disabledReason,
    evidenceLocation: "reports/p983-founder-live-workstream-handoff-dry-run-report.md",
    activityLocation: packet.activityLocation,
    costImpact: packet.costImpact,
    dryRunOnly: true,
    wouldDispatchAgent: false,
    wouldRunWorker: false,
    wouldExecuteTool: false,
    wouldMutateProject: false,
    wouldWriteHostedDb: false,
    wouldDeployOrPackage: false,
    wouldSpend: false,
    validationCommands: [
      "npm run check:p983-founder-live-workstream-handoff-dry-run",
      "npm run check:p982-founder-live-workstream-handoff-model",
    ],
  }));

  return {
    dryRunId: "local-business-build-workstream-handoff-dry-run",
    currentState: "Local Handoff Dry Run Ready Execution Blocked",
    dryRunOnly: true,
    commandCenterVisible: true,
    sourceHandoffState: packet.currentState,
    founderIdea: packet.founderIdea,
    laneCount: dryRunLanes.length,
    readyPreviewCount: dryRunLanes.filter((lane) => lane.dryRunState === "Ready For Operator Review Dry Run").length,
    executableCount: 0,
    nextAction: "Use this dry-run preview to prepare P98.4 Command Center UX without enabling execution.",
    blockers: packet.blockers,
    disabledReason: "P98.3 creates deterministic local dry-run records only. Provider/model calls, agent dispatch, tool/worker execution, project mutation, hosted DB mutation, deploy, release, export, package creation, network calls, and provider spend remain blocked.",
    ownerCapability: "NEXUS Live Workstream Handoff Dry Run",
    evidenceLocation: "reports/p983-founder-live-workstream-handoff-dry-run-report.md",
    activityLocation: packet.activityLocation,
    costImpact: packet.costImpact,
    lanes: dryRunLanes,
    runtimeFlags: packet.runtimeFlags,
    safetyRows: [
      { label: "Dry run only", value: "Yes" },
      { label: "Agent dispatch", value: "Blocked" },
      { label: "Worker/tool execution", value: "Blocked" },
      { label: "Project mutation", value: "Blocked" },
      { label: "Hosted DB", value: "Blocked" },
      { label: "Deploy/package", value: "Blocked" },
      { label: "Provider spend", value: "Blocked" },
    ],
  };
}

export function validateFounderExecutionAdmissionModel(model = {}) {
  const flags = model.runtimeFlags || {};
  const unsafeFlags = [
    "providerCallsAllowed",
    "modelCallsAllowed",
    "agentDispatchAllowed",
    "workerExecutionAllowed",
    "toolExecutionAllowed",
    "projectMutationAllowed",
    "hostedDbWritesAllowed",
    "deployAllowed",
    "releaseAllowed",
    "exportAllowed",
    "packageCreationAllowed",
    "networkCallsAllowed",
    "providerSpendAllowed",
  ];
  const errors = [];

  if (!Array.isArray(model.lanes) || model.lanes.length < 4) {
    errors.push("P99.2 admission model must include display-safe admission lanes.");
  }
  if (!Array.isArray(model.requiredApprovals) || model.requiredApprovals.length < 4) {
    errors.push("P99.2 admission model must include required approvals.");
  }
  if (!Array.isArray(model.requiredEvidence) || model.requiredEvidence.length < 4) {
    errors.push("P99.2 admission model must include required evidence.");
  }
  if (unsafeFlags.some((flag) => flags[flag] !== false)) {
    errors.push("P99.2 admission model must keep all unsafe runtime flags false.");
  }

  return {
    valid: errors.length === 0,
    errors,
    readyForCommandCenterUx: errors.length === 0,
    readyForExecution: false,
  };
}

export function buildFounderExecutionAdmissionModel(founderIdeaSummary = DEFAULT_BUSINESS_BUILD_IDEA) {
  const handoffPacket = buildFounderLiveWorkstreamHandoffPacket(founderIdeaSummary);
  const dryRun = buildFounderLiveWorkstreamHandoffDryRun(founderIdeaSummary);
  const requiredApprovals = [
    "Operator approval for execution admission",
    "Rollback acceptance for any future local mutation",
    "Audit acceptance for admission decision",
    "Validation command acceptance for the lane",
    "Cost review acceptance with zero provider spend",
  ];
  const lanes = (dryRun.lanes || []).map((lane) => ({
    lane: lane.lane,
    ownerCapability: lane.ownerCapability,
    admissionState: lane.dryRunState === "Ready For Operator Review Dry Run"
      ? "Eligible For Governed Admission Review Execution Blocked"
      : "Blocked Until Handoff Evidence",
    sourceDryRunState: lane.dryRunState,
    plannedWork: lane.plannedWork,
    requiredApprovals,
    requiredEvidence: lane.requiredEvidence,
    blockers: [...lane.blockers, "Execution admission approval envelope is not present."],
    nextAction: "Prepare the local approval envelope for this lane without dispatching agents or mutating project files.",
    disabledReason: "P99.2 models governed execution admission only. It cannot dispatch agents, run workers/tools, mutate projects, call providers, use hosted DBs, deploy, package, use network calls, or spend.",
    evidenceLocation: "reports/p992-founder-execution-admission-model-report.md",
    activityLocation: dryRun.activityLocation,
    costImpact: "Local deterministic admission model only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    readyForExecution: false,
    canDispatchAgent: false,
    canRunWorker: false,
    canExecuteTool: false,
    canMutateProject: false,
    canWriteHostedDb: false,
    canDeployOrPackage: false,
    canSpend: false,
  }));
  const model = {
    admissionId: "local-business-build-execution-admission",
    currentState: "Governed Admission Review Ready Execution Blocked",
    commandCenterVisible: true,
    sourceHandoffId: handoffPacket.handoffId,
    sourceHandoffState: handoffPacket.currentState,
    sourceDryRunState: dryRun.currentState,
    founderIdea: handoffPacket.founderIdea,
    laneCount: lanes.length,
    reviewEligibleLaneCount: lanes.filter((lane) => lane.admissionState === "Eligible For Governed Admission Review Execution Blocked").length,
    executableCount: 0,
    requiredApprovals,
    requiredEvidence: [
      ...handoffPacket.requiredEvidence,
      "Execution admission approval envelope is not present",
      "Operator has not accepted lane-specific rollback, audit, validation, and cost gates",
    ],
    blockedOperations: handoffPacket.blockedOperations,
    runtimeFlags: handoffPacket.runtimeFlags,
    nextAction: "Prepare P99.3 approval envelopes while keeping every lane non-executable.",
    blockers: [
      "Approval envelope is missing.",
      "Agent dispatch is blocked.",
      "Worker/tool execution is blocked.",
      "Project source mutation is blocked.",
      "Provider/model calls, hosted DB mutation, deploy, package, network calls, and provider spend are blocked.",
    ],
    disabledReason: "P99.2 is a local admission model only. Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package creation, network calls, and provider spend remain blocked.",
    ownerCapability: "NEXUS Execution Admission Governance",
    evidenceLocation: "reports/p992-founder-execution-admission-model-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local deterministic admission model only. No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    lanes,
    safetyRows: [
      { label: "Execution", value: "Blocked" },
      { label: "Agent dispatch", value: "Blocked" },
      { label: "Worker/tool execution", value: "Blocked" },
      { label: "Project mutation", value: "Blocked" },
      { label: "Hosted DB", value: "Blocked" },
      { label: "Deploy/package", value: "Blocked" },
      { label: "Provider spend", value: "Blocked" },
    ],
  };

  return {
    ...model,
    validation: validateFounderExecutionAdmissionModel(model),
  };
}

export function validateFounderExecutionAdmissionApprovalEnvelope(envelope = {}) {
  const flags = envelope.runtimeFlags || {};
  const errors = [];

  if (!Array.isArray(envelope.approvals) || envelope.approvals.length < 4) {
    errors.push("P99.3 approval envelope must include required approval gates.");
  }
  if (!Array.isArray(envelope.lanes) || envelope.lanes.length < 4) {
    errors.push("P99.3 approval envelope must include lane approval state.");
  }
  if (envelope.approvalReady === true || envelope.executableCount !== 0) {
    errors.push("P99.3 approval envelope must not mark execution approval ready.");
  }
  if (Object.values(flags).some((value) => value !== false)) {
    errors.push("P99.3 approval envelope must keep all unsafe runtime flags false.");
  }

  return {
    valid: errors.length === 0,
    errors,
    readyForCommandCenterUx: errors.length === 0,
    readyForExecution: false,
  };
}

export function buildFounderExecutionAdmissionApprovalEnvelope(founderIdeaSummary = DEFAULT_BUSINESS_BUILD_IDEA) {
  const admission = buildFounderExecutionAdmissionModel(founderIdeaSummary);
  const approvals = admission.requiredApprovals.map((approval) => ({
    label: approval,
    state: "Missing",
    accepted: false,
    ownerCapability: "NEXUS Execution Admission Governance",
    disabledReason: "Approval capture is not enabled in P99.3. This envelope only shows required gates.",
  }));
  const lanes = (admission.lanes || []).map((lane) => ({
    lane: lane.lane,
    ownerCapability: lane.ownerCapability,
    approvalState: "Missing Approval Envelope",
    admissionState: lane.admissionState,
    requiredApprovals: lane.requiredApprovals,
    requiredEvidence: lane.requiredEvidence,
    missingApprovals: lane.requiredApprovals,
    blockers: lane.blockers,
    nextAction: "Collect explicit operator approval, rollback acceptance, audit acceptance, validation acceptance, and cost review before any later execution phase.",
    disabledReason: "P99.3 records the approval envelope only. It cannot approve execution, dispatch agents, run workers/tools, mutate projects, call providers, use hosted DBs, deploy, package, use network calls, or spend.",
    evidenceLocation: "reports/p993-founder-execution-admission-approval-envelope-report.md",
    activityLocation: admission.activityLocation,
    costImpact: admission.costImpact,
    approvalAccepted: false,
    readyForExecution: false,
    canApproveForExecution: false,
    canDispatchAgent: false,
    canRunWorker: false,
    canMutateProject: false,
    canSpend: false,
  }));
  const envelope = {
    envelopeId: "local-business-build-execution-admission-approval-envelope",
    currentState: "Approval Envelope Required Execution Blocked",
    commandCenterVisible: true,
    sourceAdmissionId: admission.admissionId,
    sourceAdmissionState: admission.currentState,
    founderIdea: admission.founderIdea,
    approvalReady: false,
    approvalsAcceptedCount: 0,
    approvalsRequiredCount: approvals.length,
    executableCount: 0,
    approvals,
    requiredEvidence: admission.requiredEvidence,
    blockedOperations: admission.blockedOperations,
    runtimeFlags: admission.runtimeFlags,
    nextAction: "Prepare the approval envelope evidence while keeping every lane non-executable.",
    blockers: [
      "Operator approval is missing.",
      "Rollback acceptance is missing.",
      "Audit acceptance is missing.",
      "Validation command acceptance is missing.",
      "Cost review acceptance is missing.",
    ],
    disabledReason: "P99.3 is an approval envelope model only. Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package creation, network calls, and provider spend remain blocked.",
    ownerCapability: "NEXUS Execution Admission Approval Envelope",
    evidenceLocation: "reports/p993-founder-execution-admission-approval-envelope-report.md",
    activityLocation: admission.activityLocation,
    costImpact: admission.costImpact,
    lanes,
    safetyRows: admission.safetyRows,
  };

  return {
    ...envelope,
    validation: validateFounderExecutionAdmissionApprovalEnvelope(envelope),
  };
}

export function buildFounderExecutionAdmissionDryRun(founderIdeaSummary = DEFAULT_BUSINESS_BUILD_IDEA) {
  const envelope = buildFounderExecutionAdmissionApprovalEnvelope(founderIdeaSummary);
  const lanes = (envelope.lanes || []).map((lane) => ({
    lane: lane.lane,
    ownerCapability: lane.ownerCapability,
    dryRunState: "Blocked Missing Approval Envelope",
    sourceApprovalState: lane.approvalState,
    previewDecision: "Do Not Admit Execution",
    missingApprovals: lane.missingApprovals,
    requiredEvidence: lane.requiredEvidence,
    blockers: lane.blockers,
    nextAction: "Keep this lane in admission dry run until the approval envelope and validation evidence are complete.",
    disabledReason: "P99.4 dry-run records cannot approve execution, dispatch agents, run workers/tools, mutate projects, call providers, use hosted DBs, deploy, package, use network calls, or spend.",
    evidenceLocation: "reports/p994-founder-execution-admission-dry-run-report.md",
    activityLocation: envelope.activityLocation,
    costImpact: envelope.costImpact,
    dryRunOnly: true,
    wouldApproveExecution: false,
    wouldDispatchAgent: false,
    wouldRunWorker: false,
    wouldExecuteTool: false,
    wouldMutateProject: false,
    wouldWriteHostedDb: false,
    wouldDeployOrPackage: false,
    wouldSpend: false,
  }));

  return {
    dryRunId: "local-business-build-execution-admission-dry-run",
    currentState: "Execution Admission Dry Run Ready Execution Blocked",
    commandCenterVisible: true,
    dryRunOnly: true,
    sourceEnvelopeId: envelope.envelopeId,
    sourceEnvelopeState: envelope.currentState,
    founderIdea: envelope.founderIdea,
    laneCount: lanes.length,
    blockedLaneCount: lanes.length,
    executableCount: 0,
    approvalReadyCount: 0,
    nextAction: "Use this dry-run preview to prepare P99.5 Command Center UX without enabling execution.",
    blockers: envelope.blockers,
    disabledReason: "P99.4 creates deterministic admission dry-run records only. Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package creation, network calls, and provider spend remain blocked.",
    ownerCapability: "NEXUS Execution Admission Dry Run",
    evidenceLocation: "reports/p994-founder-execution-admission-dry-run-report.md",
    activityLocation: envelope.activityLocation,
    costImpact: envelope.costImpact,
    lanes,
    runtimeFlags: envelope.runtimeFlags,
    safetyRows: envelope.safetyRows,
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
  const businessBuildDbCrud = buildBusinessBuildDbCrudViewModel(founderIdeaSummary);
  const liveWorkstreamHandoff = buildFounderLiveWorkstreamHandoffPacket(founderIdeaSummary);
  const liveWorkstreamHandoffDryRun = buildFounderLiveWorkstreamHandoffDryRun(founderIdeaSummary);
  const executionAdmission = buildFounderExecutionAdmissionModel(founderIdeaSummary);
  const executionAdmissionApprovalEnvelope = buildFounderExecutionAdmissionApprovalEnvelope(founderIdeaSummary);
  const executionAdmissionDryRun = buildFounderExecutionAdmissionDryRun(founderIdeaSummary);
  const founderLiveUse = buildFounderLiveUseDisplayModels({
    prdAuthoringEnvelope,
    dryRunAdmission,
    liveWorkstreamHandoff,
    executionAdmissionDryRun,
  });
  const founderLiveHandoff = buildFounderLiveHandoffDisplayModels({
    founderIdea: prdFields.founderIdea,
    founderLiveUseReview: founderLiveUse.review,
  });
  const founderLiveWorkAdmission = buildFounderLiveWorkAdmissionDisplayModels({
    founderIdea: prdFields.founderIdea,
  });

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
    businessBuildDbCrud,
    founderDbWorkflow,
    founderLiveUseReadiness: founderLiveUse.readiness,
    founderLiveUseReview: founderLiveUse.review,
    founderLiveHandoffManifest: founderLiveHandoff.manifest,
    founderLiveHandoffWorkOrders: founderLiveHandoff.workOrders,
    founderLiveWorkAdmission: founderLiveWorkAdmission.admission,
    founderLiveWorkAdmissionApproval: founderLiveWorkAdmission.approval,
    liveWorkstreamHandoff,
    liveWorkstreamHandoffDryRun,
    executionAdmission,
    executionAdmissionApprovalEnvelope,
    executionAdmissionDryRun,
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
