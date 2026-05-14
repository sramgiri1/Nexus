import { CAPABILITY_READINESS } from "./capabilityReadiness.js";
import { buildWorkspaceSummary } from "../../../workspace/workflowRecommendations.js";
import serviceManifest from "../../../nexus.services.json";
import serviceState from "../../../local-state/runtime/services/service-state.json";
import doctorReport from "../../../reports/nexus-doctor-report.json";
import projectProgressExample from "../../../os-roadmap/project-progress.example.json";

const SERVICE_ROLE_COPY = {
  "command-center": "Primary operator UI for Mission Control, platform status, and governed workflows.",
  "local-api": "Read-only local API for live task, evidence, project, and durable-state summaries.",
  "action-bridge": "Governed action endpoint for mission, task, workbench, and implementation actions.",
  db: "Durable State foundation while runtime remains file-backed and DB writes stay disabled.",
  workers: "Future worker runtime for governed background execution once intentionally enabled.",
  "mcp-gateway": "Planned MCP and tool access boundary for future governed integrations.",
  "provider-gateway": "Planned provider dispatch boundary. Provider execution remains disabled in this phase.",
  "batch-jobs": "Future batch execution surface for scheduled or deferred governed jobs.",
};

const SERVICE_DISPLAY_LABELS = {
  "mcp-gateway": "Tool/MCP Gateway",
  "provider-gateway": "Provider Dispatch",
};

const SERVICE_GUIDANCE = {
  "command-center": "Use npm run nexus:up to start the Command Center, or npm run nexus:status to confirm current local service state.",
  "local-api": "Use npm run nexus:status for the current snapshot. If the API is offline, run npm run nexus:up or npm run local-api:start in a local terminal.",
  "action-bridge": "Run npm run nexus:doctor if actions remain offline, then start the bridge with npm run nexus:up or npm run mission:action-server in a local terminal.",
  db: "DB writes remain disabled by policy. Use file-backed state and Durable State inspection until a governed DB write phase is delivered.",
  workers: "Worker runtime is intentionally not enabled yet. No governed background execution is available in this phase.",
  "mcp-gateway": "MCP and tool gateways remain planned. They are represented here so operators can distinguish planned services from failures.",
  "provider-gateway": "Provider dispatch is intentionally disabled. No provider-backed execution can be started from NEXUS right now.",
  "batch-jobs": "Batch jobs remain a future platform capability. Use Task Queue and Mission Control for current operator work.",
};

function getServiceStateEntry(serviceId) {
  return serviceState?.services?.find((entry) => entry.id === serviceId) || null;
}

function deriveConfiguredServiceStatus(service) {
  if (!service) {
    return { value: "Unknown", tone: "disabled" };
  }

  if (service.enabled === false) {
    if (service.currentPhaseBehavior === "file_backed_read_only") {
      return { value: "Disabled by policy", tone: "disabled" };
    }
    return { value: "Not enabled", tone: "disabled" };
  }

  const state = getServiceStateEntry(service.id);
  if (state?.status === "running") return { value: "Running", tone: "pass" };
  if (state?.status === "starting") return { value: "Starting", tone: "pending" };
  if (state?.status === "failed") return { value: "Offline", tone: "fail" };
  if (state?.status === "stopped") return { value: "Offline", tone: "fail" };
  return { value: "Unknown", tone: "disabled" };
}

function buildServiceCard(service) {
  const status = deriveConfiguredServiceStatus(service);

  return {
    id: service.id,
    label: SERVICE_DISPLAY_LABELS[service.id] || service.label,
    role: SERVICE_ROLE_COPY[service.id] || "Local NEXUS service",
    requiredLabel: service.required ? "Required" : "Optional",
    configuredPort: service.port ?? "Not applicable",
    healthUrl: service.healthUrl || "Not applicable",
    currentStatus: status.value,
    statusTone: status.tone,
    operatorGuidance:
      SERVICE_GUIDANCE[service.id]
      || "Run npm run nexus:status for the latest local service snapshot.",
    safetyNote:
      service.externalNetworkAllowed === false
        ? "Localhost-only. External network disabled."
        : "Inspect service policy before use.",
  };
}

export function buildCommandCenterViewModelV2(studio, pvSnapshot, abSnapshot) {
  const pvStatus = pvSnapshot?.status || {};
  const pvBackend = pvStatus.latestBackendValidation || {};
  const pvRemediation = pvStatus.latestRemediation || {};
  const pvGovernance = pvSnapshot?.governance || {};
  const runtimeSnapshot = studio.runtimeSnapshot || {};
  const runtimeState = runtimeSnapshot.runtimeState || {};
  const runtimeTasks = runtimeState.tasks || {};
  const runtimeEvidence = runtimeState.evidence || {};
  const runtimeIncidents = runtimeState.incidents || {};
  const runtimeApprovals =
    studio.localReports?.approvalWorkflow
    || runtimeSnapshot.approvalWorkflow
    || {};
  const runtimeTaskStates = runtimeTasks.byState || {};
  const gateStatuses = { AUDITOR: "PASS", SENTINEL: "PENDING", WARDEN: "PASS" };
  const gatePassCount = Object.values(gateStatuses).filter((status) => status === "PASS").length;
  const activeTaskCount =
    (runtimeTaskStates.queued || 0)
    + (runtimeTaskStates.running || 0)
    + (runtimeTaskStates.awaiting_verification || 0)
    + (runtimeTaskStates.implementation_done || 0);
  const blockedTaskCount =
    (runtimeTaskStates.blocked || 0)
    + (runtimeTaskStates.awaiting_approval || 0);
  const activeAgentCount = studio.currentLoad?.length || 0;
  const totalAgentCount = studio.agentEntries?.length || AGENT_DIRECTORY.length;
  const plannedMissionTasks = [
    { planTaskId: "b6f66c80-bd0c-42c9-a21c-869cff1bc55e", title: "Project Brief", targetAgent: "SHEPHERD", capabilityId: "orchestration.plan_flow", riskLevel: "medium", state: "planned", activationEnabled: true, activationDisabledReason: "" },
    { planTaskId: "3c02b0d8-6c56-42d1-91c4-c809534b506b", title: "Backend Validation Follow-up", targetAgent: "AUDITOR", capabilityId: "verification.code_quality_gate", riskLevel: "medium", state: "planned", activationEnabled: true, activationDisabledReason: "" },
    { planTaskId: "a8554471-c0a4-4489-a03e-8de33a8bdf6d", title: "UX Product Flow Planning", targetAgent: "PRISM", capabilityId: "design.ux_flow", riskLevel: "low", state: "planned", activationEnabled: true, activationDisabledReason: "" },
    { planTaskId: "e3faa610-25c3-4db1-99ef-ebec4a845432", title: "iOS Readiness Planning", targetAgent: "SENTINEL", capabilityId: "verification.qa_gate", riskLevel: "medium", state: "planned", activationEnabled: true, activationDisabledReason: "" },
    { planTaskId: "8fc5eda4-dab0-42b4-a014-e7daf807631c", title: "Privacy Compliance Review", targetAgent: "WARDEN", capabilityId: "security.privacy_review", riskLevel: "high", state: "planned", activationEnabled: true, activationDisabledReason: "" },
    { planTaskId: "cdb8dc13-e5c4-4a1d-bbdc-113faf52f5da", title: "First Controlled Implementation Candidate", targetAgent: "CORE", capabilityId: "implementation.backend_code", riskLevel: "high", state: "planned", activationEnabled: false, activationDisabledReason: "Activate lower-risk tasks first" },
  ];
  const workspaceSummary = buildWorkspaceSummary({
    missionExists: true,
    taskPlanExists: true,
    taskCount: plannedMissionTasks.length,
    activatedTaskCount: activeTaskCount,
    backendTestsPassed: pvBackend.testsPassed ?? 58,
    backendTestsTotal: pvBackend.totalTests ?? 58,
    mode: "local-private",
    activeProject: "Private Project",
    missionId: "private-project-governed-build-mission",
    prdGaps: ["Physical device push (open)"],
  });
  const manifestServices = Array.isArray(serviceManifest?.services)
    ? serviceManifest.services
    : [];
  const configuredServiceCards = manifestServices.map(buildServiceCard);
  const batchJobsCard = {
    id: "batch-jobs",
    label: "Batch Jobs",
    role: SERVICE_ROLE_COPY["batch-jobs"],
    requiredLabel: "Optional",
    configuredPort: "Not applicable",
    healthUrl: "Not applicable",
    currentStatus: "Planned",
    statusTone: "disabled",
    operatorGuidance: SERVICE_GUIDANCE["batch-jobs"],
    safetyNote: "Planned capability. No UI or runtime execution is enabled yet.",
  };
  const doctorChecks = Object.values(doctorReport?.checks || {});
  const doctorWarnings = Array.isArray(doctorReport?.warnings)
    ? doctorReport.warnings
    : [];
  const doctorFailures = Array.isArray(doctorReport?.errors)
    ? doctorReport.errors
    : [];
  const doctorPassCount = doctorChecks.filter((entry) => entry?.ok).length;
  const doctorFailureCount = doctorChecks.filter((entry) => entry?.ok === false).length;
  const projectProgressExampleEntry = projectProgressExample?.projects?.[0] || null;

  return {
    shell: {
      productName: "NEXUS OS",
      mode: "local-private",
      environment: "Local",
      operator: "Founder",
      activeProject: studio.activeProject?.name || "Private Project",
    },
    missionComposer: {
      title: "Start a Mission",
      subtitle: "Tell NEXUS what you want to build. The OS turns it into governed tasks for agents.",
      placeholder: "Describe what you want to build...",
      missionText: "Build the private project through governed planning, validation, privacy review, and controlled implementation.",
      projectLabel: "Private Project",
      mode: "local-private",
      bridgeReady: abSnapshot?.bridgeReadiness?.status === "READY",
      buttons: [
        { label: "Generate Plan", enabled: false, reason: "Requires governed action bridge" },
        { label: "Create Project Brief", enabled: false, reason: "Requires governed action bridge" },
        { label: "Start Governed Run", enabled: false, reason: "Requires governed action bridge" },
      ],
      contractPath: "contracts/missions/private-project-mission-contract.json",
      taskPlanPath: "contracts/missions/private-project-task-plan.json",
      taskCount: 6,
      nextAction: "Create governed project brief from mission composer",
    },
    mission: {
      founderIntent: "Build and validate the active mission through governed NEXUS agents.",
      quote: "Ship a calm, governed private-project companion — beta in 6 weeks, audit-ready from day one.",
      sprintId: "Sprint 2026.18",
      sprintDay: "Day 6 of 7",
      lead: "SHEPHERD",
      sprintProgress: studio.gateProgress || 62,
      releaseStatus: "NO-GO",
      releaseBlocker: "SENTINEL gate pending · approval evidence missing",
      gates: gateStatuses,
    },
    pipeline: {
      queued: studio.pendingQueue?.length ?? 2,
      running: studio.runningQueue?.length ?? 5,
      verifying: 3,
      blocked: studio.statusCounts?.blocked ?? 1,
      done: 3,
    },
    metrics: [
      {
        label: "Active Tasks",
        value: String(activeTaskCount),
        delta: activeTaskCount > 0 ? `${activeTaskCount} in governed runtime` : "No activated tasks yet",
        tone: "blue",
      },
      {
        label: "Blocked",
        value: String(blockedTaskCount),
        delta: blockedTaskCount > 0 ? "Needs review or approval" : "No active blockers",
        tone: "red",
      },
      {
        label: "Gate Pass Rate",
        value: `${Math.round((gatePassCount / Object.keys(gateStatuses).length) * 100)}%`,
        delta: `${gatePassCount}/${Object.keys(gateStatuses).length} verification gates passing`,
        tone: "amber",
      },
      {
        label: "Agent Utilization",
        value: activeAgentCount > 0 ? `${activeAgentCount}/${totalAgentCount}` : "Not available yet",
        delta: activeAgentCount > 0 ? `${activeAgentCount} agents engaged` : "Runtime engagement required",
        tone: "blue",
      },
      {
        label: "Approval Backlog",
        value: String(runtimeApprovals.requested || 0),
        delta: runtimeApprovals.requested > 0 ? `${runtimeApprovals.requested} awaiting decision` : "No pending approvals",
        tone: "amber",
      },
      {
        label: "Safety Incidents",
        value: String(runtimeIncidents.total || 0),
        delta: (runtimeIncidents.total || 0) > 0 ? `${runtimeIncidents.total} incidents open` : "No incidents reported",
        tone: "green",
      },
    ],
    activity: [
      { time: "09:47", agent: "SENTINEL", text: "verified synthetic E2E suite passed", status: "done" },
      { time: "09:41", agent: "SHEPHERD", text: "dispatched task T-1042 → PIXEL", status: "done" },
      { time: "09:38", agent: "NEXUS", text: "Governor denied SWIFT: capability not in contract", status: "blocked" },
      { time: "09:33", agent: "WARDEN", text: "requesting human approval: privacy review", status: "working" },
      { time: "09:27", agent: "AUDITOR", text: "static analysis clean — 0 findings", status: "done" },
      { time: "09:21", agent: "FORGE", text: "applied migration 2026_M5_01_rls.sql", status: "done" },
    ],
    privateValidation: {
      overall: pvStatus.overall || "VALIDATED",
      backendTests: `${pvBackend.testsPassed ?? 58}/${pvBackend.totalTests ?? 58}`,
      backendStatus: pvBackend.status || "PASS",
      latestCommand: pvBackend.command || "npm test",
      remediationApplied: pvRemediation.applied !== false,
      rootCause: pvRemediation.rootCauseCategory || "date_window_boundary_bug",
      uiMutation: pvGovernance.mutationEnabledFromUi === false ? "Disabled" : "Unknown",
      timeline: pvSnapshot?.timeline || [],
    },
    release: {
      status: "NO-GO",
      readiness: studio.gateProgress || 72,
      blocker: "SENTINEL gate pending · approval evidence missing",
    },
    safety: {
      incidents: 0,
      lastClean: "24h",
    },
    actions: {
      missionComposer: {
        available: true,
        status: "idle",
        lastActionId: "",
        lastResult: null,
        disabledReason: "Requires mission action server (npm run mission:action-server)",
      },
    },
    taskActivation: {
      bridgeEndpoint: "http://localhost:3748",
      policyPhase: "P37-LOCAL",
      missionId: "private-project-governed-build-mission",
      projectId: "private-project-01",
      missionTasks: plannedMissionTasks,
      nextTask: plannedMissionTasks[0],
      activatedCount: activeTaskCount,
      plannedCount: plannedMissionTasks.length,
      activationPolicy: { allowed: true, requiresBridge: true, disabledReason: "Requires governed action bridge (npm run mission:action-server)" },
    },
    controlledImplementation: {
      policyPhase: "P39-LOCAL",
      bridgeEndpoint: "http://localhost:3748",
      targetAgent: "CORE",
      capabilityId: "implementation.backend_code",
      implementationType: "documentation_readiness_log",
      allowedPath: "projects/careloop/docs/NEXUS_IMPLEMENTATION_LOG.md",
      riskLevel: "low",
      proposal: {
        changeSummary: "Append a governed implementation log entry documenting the current NEXUS/private-project baseline.",
        validationPlan: "Run controlled backend validation through careloop:backend-validate.",
        rollbackPlan: "Remove the appended NEXUS implementation log entry from the docs file.",
      },
      safety: {
        providerCalls: false,
        networkCalls: false,
        dbAccess: false,
        productionBehaviorChange: false,
        dependencyInstall: false,
        schemaChange: false,
      },
      nextBestAction: {
        title: "Run First Controlled Implementation",
        description: "Select an activated implementation task, create a governed proposal, and apply a documentation change to prove the end-to-end workflow.",
        enabled: true,
        action: "navigate:/command-center/implementation",
      },
    },
    agentWorkbench: {
      policyPhase: "P38-LOCAL",
      bridgeEndpoint: "http://localhost:3748",
      workbenchItems: [],
      reviewPolicy: {
        allowedDecisions: ["approve", "reject", "request_changes"],
        taskExecutionAllowed: false,
        agentExecutionAllowed: false,
        requiresActivatedTask: true,
        requiresBridge: true,
      },
      nextBestAction: {
        title: "Review an Activated Task",
        description: "Open an activated task in the Agent Workbench — inspect agent assignment, capability, risk, evidence, and record your approval decision.",
        enabled: true,
        action: "navigate:/command-center/workbench",
      },
    },
    agenticWorkspace: {
      activeMode: workspaceSummary.activeMode,
      activeProject: workspaceSummary.activeProject,
      activeMission: workspaceSummary.activeMission,
      workflowTemplates: workspaceSummary.workflowTemplates,
      nextBestAction: {
        ...workspaceSummary.nextBestAction,
        description:
          "Mission plan is ready. Activate the first task to move it from planned to queued state in the runtime.",
        action: "navigate:/command-center/tasks",
      },
      recommendedWorkflows: ["govern-agent-work", "plan-sprint", "build-product"],
      workspaceStatus: workspaceSummary.workspaceStatus,
      currentLimitations: workspaceSummary.currentLimitations,
    },
    liveApi: {
      policyPhase: "P40-LOCAL",
      endpoint: "http://localhost:4321",
      actionBridgeEndpoint: "http://localhost:3748",
      localOnly: true,
      dbBacked: false,
      providerCallsEnabled: false,
      externalNetworkEnabled: false,
      liveApiOnline: false,
      usingSnapshotFallback: true,
      lastRefreshStatus: "idle",
      lastRefreshAt: null,
      apiError: null,
      nextBestAction: {
        title: "Start Live Local API",
        description: "Run `NEXUS_MODE=local-private npm run local-api:start` to enable live data for Command Center.",
        enabled: true,
        action: "shell:npm run local-api:start",
      },
    },
    serviceHealth: {
      mode: "local-private",
      sourceLabel: "service manifest + status snapshot",
      manifestPath: "nexus.services.json",
      statusPath: "local-state/runtime/services/service-state.json",
      doctorReportPath: "reports/nexus-doctor-report.json",
      commands: [
        "npm run nexus:up",
        "npm run nexus:down",
        "npm run nexus:status",
        "npm run nexus:doctor",
      ],
      cards: [...configuredServiceCards, batchJobsCard],
      doctorSummary: {
        available: Boolean(doctorReport?.checks),
        passCount: doctorPassCount,
        warningCount: doctorWarnings.length,
        failureCount: doctorFailureCount,
        warnings: doctorWarnings,
        failures: doctorFailures,
        recommendedFix:
          doctorWarnings[0]
          || doctorFailures[0]
          || "Run npm run nexus:doctor to refresh diagnostics.",
      },
    },
    commandPalette: {
      title: "NEXUS Command Palette",
      keyboardHint: "Cmd/Ctrl+K",
      primaryActionIds: ["plan", "review", "qa", "explain"],
      secondaryActionIds: ["fix", "ship", "guard", "freeze", "retro"],
      summary:
        "Use the command palette to preview governed operator actions without bypassing current safety boundaries.",
    },
    capabilityReadiness: CAPABILITY_READINESS,
    dbFoundation: {
      phase: "P41-LOCAL",
      mode: "disabled",
      dbWritesEnabled: false,
      fileFallbackRequired: true,
      productionDbAllowed: false,
      schemaVersion: "1.0",
      entityCount: 18,
      schemaDefined: true,
      importPlan: {
        totalEntities: 18,
        sourcesAvailable: null,
        sourcesMissing: null,
        dryRunOnly: true,
        dbWritesEnabled: false,
      },
      entities: [],
      nextPhase: "P42-LOCAL",
      nextPhaseAction: "Enable DB writes and migrate file-backed state to DB when policy allows it.",
    },
    projectProgress: projectProgressExampleEntry
      ? {
        projectName: projectProgressExampleEntry.displayName,
        safeProjectName: projectProgressExampleEntry.safeDisplayName,
        productLanguage: projectProgressExampleEntry.projectType,
        prdStatus: { version: projectProgressExampleEntry.prdVersion, locked: true },
        backendValidation: projectProgressExampleEntry.backendValidation,
        remediation: { applied: true, rootCause: "date_window_boundary_bug" },
        sprints: projectProgressExampleEntry.sprints,
        gaps: projectProgressExampleEntry.openGaps,
        lockedDecisions: projectProgressExampleEntry.lockedDecisions,
        compliance: projectProgressExampleEntry.compliance,
        milestone: projectProgressExampleEntry.milestone,
      }
      : null,
    careloopProductProgress: projectProgressExampleEntry
      ? {
        productName: projectProgressExampleEntry.displayName,
        productLanguage: projectProgressExampleEntry.projectType,
        prdStatus: { version: projectProgressExampleEntry.prdVersion, locked: true },
        backendValidation: projectProgressExampleEntry.backendValidation,
        remediation: { applied: true, rootCause: "date_window_boundary_bug" },
        sprints: projectProgressExampleEntry.sprints,
        gaps: projectProgressExampleEntry.openGaps,
        lockedDecisions: projectProgressExampleEntry.lockedDecisions,
        compliance: projectProgressExampleEntry.compliance,
        milestone: projectProgressExampleEntry.milestone,
      }
      : null,
  };
}

export function buildCommandCenterViewModel(studio) {
  const localReports = studio.localReports || {};
  const validation = localReports.validation || {};
  const runtimeTrafficStatus = localReports.runtimeTrafficPlane || {};
  const approvalWorkflow = localReports.approvalWorkflow || {};
  const privateValidation = localReports.privateValidation || {};
  const actionBridge = localReports.actionBridge || {};

  const pvStatus = privateValidation.status || {};
  const pvBackend = pvStatus.latestBackendValidation || {};
  const pvRemediation = pvStatus.latestRemediation || {};
  const pvGovernance = privateValidation.governance || {};
  const bridgeReadiness = actionBridge.bridgeReadiness || {};
  const lastDemoAction = actionBridge.lastDemoAction || {};

  return {
    shell: {
      mode: "local-private",
      environment: "Prototype",
      activeProject: studio.activeProject?.name || "Private Project",
    },
    mission: {
      founderIntent: "Build and validate the active mission through governed NEXUS agents.",
      sprintId: "Sprint 2026.18",
      lead: "SHEPHERD",
      sprintProgress: studio.gateProgress || 62,
      releaseStatus: "NO-GO",
      releaseBlocker: "SENTINEL gate pending · approval evidence missing",
      gates: { AUDITOR: "PASS", SENTINEL: "PENDING", WARDEN: "PASS" },
    },
    pipeline: {
      queued: studio.pendingQueue?.length ?? 2,
      running: studio.runningQueue?.length ?? 5,
      verifying: 3,
      blocked: studio.statusCounts?.blocked ?? 1,
      done: 3,
    },
    metrics: [
      { label: "Active Tasks", value: String((studio.pendingQueue?.length ?? 0) + (studio.runningQueue?.length ?? 0) || 5), meta: "running + pending", tone: "blue" },
      { label: "Blocked", value: String(studio.statusCounts?.blocked || 1), meta: "tasks awaiting decision", tone: "red" },
      { label: "Gate Pass Rate", value: `${studio.gateProgress || 67}%`, meta: "AUDITOR · WARDEN pass", tone: "amber" },
      { label: "Agent Utilization", value: "74%", meta: "20 agents loaded", tone: "blue", fallback: true },
      { label: "Approval Backlog", value: String(approvalWorkflow.requested || 3), meta: "pending decisions", tone: "amber" },
      { label: "Safety Incidents", value: "0", meta: "24h clean", tone: "green", fallback: true },
    ],
    privateValidation: {
      overall: pvStatus.overall || "VALIDATED",
      backendTests: `${pvBackend.testsPassed ?? 58}/${pvBackend.totalTests ?? 58}`,
      backendStatus: pvBackend.status || "PASS",
      latestCommand: pvBackend.command || "npm test",
      remediationApplied: pvRemediation.applied !== false,
      rootCause: pvRemediation.rootCauseCategory || "date_window_boundary_bug",
      providerCalls: pvGovernance.providerCalls === false ? "Disabled" : "Unknown",
      networkDisabled:
        pvGovernance.networkCalls === false && pvGovernance.dbAccess === false
          ? "Disabled"
          : "Unknown",
      uiMutation: pvGovernance.mutationEnabledFromUi === false ? "Disabled" : "Unknown",
    },
    actionBridge: {
      ready: bridgeReadiness.status === "READY",
      lastActionType: lastDemoAction.actionType || "none",
      commandExecuted: lastDemoAction.commandExecuted === false,
      approvalRequired: lastDemoAction.approvalRequired === true,
    },
    trafficPlane: {
      status: runtimeTrafficStatus.status || "PASS",
      identityPropagation: runtimeTrafficStatus.identityPropagation || "Ready",
    },
    release: {
      status: "NO-GO",
      posture: "Blocked pending SENTINEL + approval evidence",
      readiness: studio.gateProgress || 72,
    },
    approvals: {
      total: approvalWorkflow.total || 0,
      requested: approvalWorkflow.requested || 0,
      approved: approvalWorkflow.approved || 0,
      rejected: (approvalWorkflow.rejected || 0) + (approvalWorkflow.expired || 0),
    },
    validation: {
      summary: validation.summary || {},
      reports: validation.reports || [],
    },
  };
}
