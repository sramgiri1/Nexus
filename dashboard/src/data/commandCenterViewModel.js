import { CAPABILITY_READINESS } from "./capabilityReadiness.js";
import { buildWorkspaceSummary } from "../../../workspace/workflowRecommendations.js";

export function buildCommandCenterViewModelV2(studio, pvSnapshot, abSnapshot) {
  const pvStatus = pvSnapshot?.status || {};
  const pvBackend = pvStatus.latestBackendValidation || {};
  const pvRemediation = pvStatus.latestRemediation || {};
  const pvGovernance = pvSnapshot?.governance || {};
  const workspaceSummary = buildWorkspaceSummary({
    missionExists: true,
    taskPlanExists: true,
    taskCount: 6,
    activatedTaskCount: 0,
    backendTestsPassed: pvBackend.testsPassed ?? 58,
    backendTestsTotal: pvBackend.totalTests ?? 58,
    mode: "local-private",
    activeProject: "Private Project",
    missionId: "private-project-governed-build-mission",
    prdGaps: ["Physical device push (open)"],
  });

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
      { label: "Active Tasks", value: String((studio.pendingQueue?.length ?? 0) + (studio.runningQueue?.length ?? 0) || 5), delta: "+8 last hr", tone: "blue" },
      { label: "Blocked", value: String(studio.statusCounts?.blocked || 1), delta: "+1", tone: "red" },
      { label: "Gate Pass Rate", value: `${studio.gateProgress || 67}%`, delta: "+2.1 wk", tone: "amber" },
      { label: "Agent Utilization", value: "74%", delta: "▾ -3", tone: "blue" },
      { label: "Approval Backlog", value: "3", delta: "- 1 high-risk", tone: "amber" },
      { label: "Safety Incidents", value: "0", delta: "~ 140 clean", tone: "green" },
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
      missionTasks: [
        { planTaskId: "b6f66c80-bd0c-42c9-a21c-869cff1bc55e", title: "Project Brief", targetAgent: "SHEPHERD", capabilityId: "orchestration.plan_flow", riskLevel: "medium", state: "planned", activationEnabled: true, activationDisabledReason: "" },
        { planTaskId: "3c02b0d8-6c56-42d1-91c4-c809534b506b", title: "Backend Validation Follow-up", targetAgent: "AUDITOR", capabilityId: "verification.code_quality_gate", riskLevel: "medium", state: "planned", activationEnabled: true, activationDisabledReason: "" },
        { planTaskId: "a8554471-c0a4-4489-a03e-8de33a8bdf6d", title: "UX Product Flow Planning", targetAgent: "PRISM", capabilityId: "design.ux_flow", riskLevel: "low", state: "planned", activationEnabled: true, activationDisabledReason: "" },
        { planTaskId: "e3faa610-25c3-4db1-99ef-ebec4a845432", title: "iOS Readiness Planning", targetAgent: "SENTINEL", capabilityId: "verification.qa_gate", riskLevel: "medium", state: "planned", activationEnabled: true, activationDisabledReason: "" },
        { planTaskId: "8fc5eda4-dab0-42b4-a014-e7daf807631c", title: "Privacy Compliance Review", targetAgent: "WARDEN", capabilityId: "security.privacy_review", riskLevel: "high", state: "planned", activationEnabled: true, activationDisabledReason: "" },
        { planTaskId: "cdb8dc13-e5c4-4a1d-bbdc-113faf52f5da", title: "First Controlled Implementation Candidate", targetAgent: "CORE", capabilityId: "implementation.backend_code", riskLevel: "high", state: "planned", activationEnabled: false, activationDisabledReason: "Activate lower-risk tasks first" },
      ],
      nextTask: { planTaskId: "b6f66c80-bd0c-42c9-a21c-869cff1bc55e", title: "Project Brief", targetAgent: "SHEPHERD", capabilityId: "orchestration.plan_flow", riskLevel: "medium" },
      activatedCount: 0,
      plannedCount: 6,
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
    careloopProductProgress: {
      productName: "CareLoop",
      productLanguage: "iOS (SwiftUI) + Node.js backend",
      prdStatus: { version: "v1.6", locked: true },
      backendValidation: { testsPassed: 58, totalTests: 58, status: "PASS" },
      remediation: { applied: true, rootCause: "date_window_boundary_bug" },
      sprints: [
        { id: "Sprint 1", status: "COMPLETE", focus: "Auth + Onboarding", tests: "58/58" },
        { id: "Sprint 2", status: "IN_PROGRESS", focus: "Daily digest + Reminder escalation", tests: "—" },
        { id: "Sprint 3", status: "PLANNED", focus: "Supabase JWT auth", tests: "—" },
        { id: "Sprint 4", status: "PLANNED", focus: "Soft launch · public invite hardening", tests: "—" },
      ],
      gaps: [
        "Physical device push notification (open)",
        "Public invite hardening (Sprint 4)",
        "Paid entitlement gate (post-launch)",
        "Privacy incident response playbook (in progress)",
      ],
      lockedDecisions: [
        "Clinic/EHR integration: PERMANENTLY OFF (HIPAA trigger)",
        "Bundle ID: com.careloop.ios",
        "Auth Sprint 1-2: static API key (x-api-key header)",
        "Reminder escalation: 15 minutes",
      ],
      compliance: {
        framework: "FTC Health Breach Notification Rule",
        hipaa: "OFF",
        clinicIntegration: "OFF",
      },
    },
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
