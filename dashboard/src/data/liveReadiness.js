import { buildLiveExecutionGate } from "../../../live-execution/liveExecutionGate.js";
import { ACTION_BRIDGE_CAPABILITY_MAP } from "../../../live-execution/actionBridgeAdmissionController.js";
import { buildLiveReadyActivationViewModel } from "./liveReadyActivation.js";

export const LIVE_READINESS_ROUTE_ID = "live-readiness";

function labelFromCapability(value = "") {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase())
    .trim();
}

function displayGate(value = "") {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bDb\b/g, "DB");
}

const APPROVAL_QUEUE_ROWS = [
  "Provider Calls",
  "Provider Spend",
  "Read-only Tool Contracts",
  "Mutation-capable Tools",
  "Agent Dispatch / Worker Execution",
  "Project / DB Mutation",
  "Generated Project Creation",
  "Deploy / Release / Package",
  "Founder Task Board Dispatch",
].map((label) => ({
  label,
  queueState: "Not Requestable",
  approvalDecision: "Not Requested",
  ownerCapability: label.includes("Spend") ? "NEXUS Cost Governance" : label.includes("Deploy") ? "NEXUS Release Governance" : "NEXUS Live Operator Approval Governance",
  nextAction: "Complete governed admission evidence before this item can enter operator review.",
  disabledReason: "Approval queue record is local only. Approval does not execute providers, agents, tools, workers, project writes, DB writes, deploys, packages, or spend.",
  missingEvidence: ["Operator Approval", "Runtime Lock", "Rollback Confirmation", "Per Capability Validation"],
  requiredEvidence: ["Operator Approval", "Approval Expiry", "Runtime Lock", "Rollback Confirmation", "Validation"],
  evidenceLocation: "reports/p863-operator-approval-queue-report.md",
  activityLocation: "reports/os-phase-status-report.md",
  costImpact: "No spend.",
}));

const LIVE_UNLOCK_ROWS = [
  {
    label: "Explicit Activation Contract",
    currentState: "Contract ready",
    ownerCapability: "NEXUS Live Activation Governance",
    nextAction: "Use P87.2-P87.4 evidence before any lane can request execution review.",
    blockers: ["Per-lane unlock contract", "Operator approval", "Runtime executor policy", "Cost admission"],
    disabledReason: "P87.1 defines live activation contracts only. It does not unlock or execute live capabilities.",
    evidenceLocation: "reports/p871-explicit-live-activation-contract-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No provider calls, worker runtime, deploy, package creation, network calls, or provider spend.",
  },
  {
    label: "Secret / Provider Readiness",
    currentState: "Needs setup",
    ownerCapability: "NEXUS Provider Governance",
    nextAction: "Register redacted secret references, provider policy, budget, cost ledger, rollback, and validation evidence.",
    blockers: ["Redacted secret reference", "Provider policy profile", "Budget limit", "Operator approval", "Cost ledger"],
    disabledReason: "P87.2 does not read .env files, reveal secrets, call providers or models, open network connections, activate tools, or spend.",
    evidenceLocation: "reports/p872-secret-provider-readiness-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No provider calls, model calls, network calls, or provider spend.",
  },
  {
    label: "Local Agent Dispatch Admission",
    currentState: "Dispatch review only",
    ownerCapability: "NEXUS Agent Dispatch Governance",
    nextAction: "Keep local agent lanes in planning until dispatch execution is separately scoped and approved.",
    blockers: ["Dispatch executor not enabled", "Worker execution admission", "Project mutation admission", "Per-lane operator approval"],
    disabledReason: "P87.3 defines local agent dispatch admission records only. It does not dispatch agents or execute workers, tools, providers, or project writes.",
    evidenceLocation: "reports/p873-local-agent-dispatch-admission-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No provider calls, agent runtime, worker runtime, project writes, DB writes, network calls, deploy, package, or spend.",
  },
  {
    label: "Generated Project Workspace Admission",
    currentState: "Workspace review only",
    ownerCapability: "NEXUS Generated Workspace Governance",
    nextAction: "Expose this boundary in Command Center before any generated workspace file-write phase.",
    blockers: ["Operator approval", "New workspace root", "Project type contract", "Source/test boundary", "Workspace creation executor not enabled"],
    disabledReason: "P87.4 defines generated workspace admission boundaries only. It does not create files, mutate generated app Sources/Tests, mutate existing projects, write DB state, deploy, package, or spend.",
    evidenceLocation: "reports/p874-generated-project-workspace-admission-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No project file writes, DB writes, provider calls, network calls, deploy, package creation, or provider spend.",
  },
];

const SCOPED_ACTIVATION_ROWS = [
  {
    label: "Local founder task orchestration",
    kind: "P88 local executor admission",
    currentState: "Executor admission blocked",
    ownerCapability: "NEXUS Founder Runtime",
    nextAction: "Implement P88.5 validation aggregation before any runtime wiring can be considered.",
    blockers: ["Controlled local execution policy review", "Guarded task execution policy review", "Operator approval", "Executor runtime lock", "Post-run review plan"],
    disabledReason: "P88.3 defines executor admission only. The local executor cannot run and no agent, tool, worker, provider, file, DB, network, deploy, package, or spend action is enabled.",
    evidenceLocation: "reports/p883-local-executor-admission-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
  },
  {
    label: "Generated workspace boundary",
    kind: "P88 local executor admission",
    currentState: "Executor admission blocked",
    ownerCapability: "NEXUS Generated Workspace Governance",
    nextAction: "Keep workspace activation blocked until post-run review and file-write admission are separately scoped.",
    blockers: ["Controlled local execution policy review", "Source/test boundary", "Operator approval", "Executor runtime lock", "Post-run review plan"],
    disabledReason: "P88.3 defines executor admission only. It does not create directories, mutate generated app source/tests, mutate existing projects, deploy, package, or spend.",
    evidenceLocation: "reports/p883-local-executor-admission-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No project file writes, DB writes, provider calls, network calls, deploy, package creation, or provider spend.",
  },
  {
    label: "Live unlock review",
    kind: "P88 local executor admission",
    currentState: "Executor admission blocked",
    ownerCapability: "NEXUS Live Activation Governance",
    nextAction: "Expose scoped activation evidence in Command Center and keep execution blocked until final P88 validation.",
    blockers: ["Controlled local execution policy review", "Guarded task execution policy review", "Operator approval", "Executor runtime lock", "Post-run review plan"],
    disabledReason: "P88.3 defines executor admission only. It does not unlock provider/model calls, agent dispatch, worker execution, project mutation, DB writes, network calls, deploy, package, or spend.",
    evidenceLocation: "reports/p883-local-executor-admission-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
  },
];

export function buildLiveReadinessViewModel() {
  const gate = buildLiveExecutionGate({ mode: "live" });
  const activation = buildLiveReadyActivationViewModel();
  const capabilities = gate.data.capabilities || [];
  const approvalRows = APPROVAL_QUEUE_ROWS.map((row) => ({ ...row, missingEvidence: [...row.missingEvidence], requiredEvidence: [...row.requiredEvidence] }));
  const bridgeRows = Object.entries(ACTION_BRIDGE_CAPABILITY_MAP).map(([actionType, capability]) => ({
    label: actionType,
    currentState: "Blocked before bridge execution",
    capability: labelFromCapability(capability),
    disabledReason: "Live bridge execution is blocked until a future runtime subphase consumes approved admission records.",
  }));

  return {
    routeId: LIVE_READINESS_ROUTE_ID,
    pageTitle: "Live Readiness",
    whatChanged: "Command Center now shows evidence-backed live-ready labels, setup gaps, policy blockers, owner capabilities, evidence, activity, and cost posture.",
    currentState: "Live readiness labels are available; runtime execution remains blocked by governed admission gates.",
    nextAction: activation.nextAction,
    ownerAgent: "WARDEN",
    ownerCapability: activation.ownerCapability,
    evidenceLocation: activation.evidenceLocation,
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No provider calls, worker runtime, network execution, DB writes, deploy, package, or provider spend.",
    disabledReason: activation.disabledReason,
    labelSummary: activation.labelSummary,
    readinessCards: [
      { label: "Ready", value: String(activation.labelSummary.Ready), tone: "pass", detail: "Local, display-safe Command Center capabilities with evidence." },
      { label: "Needs setup", value: String(activation.labelSummary["Needs setup"]), tone: "amber", detail: "Capabilities with explicit setup gaps and next actions." },
      { label: "Blocked by policy", value: String(activation.labelSummary["Blocked by policy"]), tone: "disabled", detail: "Mutation, deploy, spend, or execution surfaces blocked by governance." },
      { label: "Approval queue", value: String(approvalRows.length), tone: "disabled", detail: "Local review records only; approvals cannot execute actions." },
      { label: "Live unlocks", value: String(LIVE_UNLOCK_ROWS.length), tone: "amber", detail: "P87 lanes are visible for review only; execution remains disabled." },
      { label: "Scoped activation", value: String(SCOPED_ACTIVATION_ROWS.length), tone: "disabled", detail: "P88 profile, request, and executor admission state; no executor can run." },
      { label: "Cost", value: "No spend", tone: "pass", detail: "Budget evidence is required before future execution phases." },
    ],
    approvalQueue: {
      currentState: "Local Records Ready",
      nextAction: "Complete P86.5 activation dry-run records before any live action can be considered.",
      disabledReason: "P86.4 shows local approval queue records only. Runtime execution remains disabled.",
      ownerCapability: "NEXUS Live Operator Approval Governance",
      evidenceLocation: "reports/p863-operator-approval-queue-report.md",
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      queueSummary: { notRequestable: approvalRows.length },
      rows: approvalRows,
    },
    liveUnlocks: {
      currentState: "P87 review-only lanes visible",
      nextAction: "Complete P87.6 validation aggregation after UX coverage passes.",
      disabledReason: "Live unlock rows are Command Center guidance only. They do not execute provider calls, agent dispatch, worker tasks, project writes, DB writes, deploy, package, network calls, or spend.",
      ownerCapability: "NEXUS Live Activation Governance",
      evidenceLocation: "reports/p875-command-center-live-unlock-ux-report.md",
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No spend.",
      rows: LIVE_UNLOCK_ROWS.map((row) => ({ ...row, blockers: [...row.blockers] })),
    },
    scopedActivation: {
      currentState: "P88 local activation admission visible",
      nextAction: "Aggregate P88 validation evidence before any runtime wiring can be considered.",
      disabledReason: "Scoped activation records are display-only. The local executor cannot run, and no provider, agent, worker, project, DB, deploy, package, network, or spend action is enabled.",
      ownerCapability: "NEXUS Local Executor Governance",
      evidenceLocation: "reports/p884-command-center-scoped-activation-ux-report.md",
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      rows: SCOPED_ACTIVATION_ROWS.map((row) => ({ ...row, blockers: [...row.blockers] })),
    },
    activationRows: activation.readinessRows,
    gateRows: capabilities.map((capability) => ({
      label: labelFromCapability(capability.capability),
      currentState: capability.status === "blocked" ? "Blocked by policy" : capability.status,
      disabledReason: capability.disabledReason,
      blockers: capability.blockers,
      nextAction: capability.nextAction,
      ownerCapability: capability.ownerCapability,
      evidenceLocation: capability.evidenceLocation,
      activityLocation: capability.activityLocation,
      costImpact: "No spend in this view; cost gate remains blocked.",
    })),
    bridgeRows,
    disabledActions: capabilities.slice(0, 8).map((capability) => ({
      label: labelFromCapability(capability.capability),
      reason: capability.disabledReason,
    })),
    safety: {
      executionEnabled: false,
      providerCallsAllowed: gate.data.providerCallsAllowed,
      toolExecutionAllowed: gate.data.toolExecutionAllowed,
      workerExecutionAllowed: gate.data.workerExecutionAllowed,
      projectMutationAllowed: gate.data.projectMutationAllowed,
      dbWritesAllowed: gate.data.dbWritesAllowed,
      deployExecutionAllowed: gate.data.deployExecutionAllowed,
      providerSpendAllowed: gate.data.providerSpendAllowed,
    },
  };
}

export const liveReadinessViewModel = buildLiveReadinessViewModel();
