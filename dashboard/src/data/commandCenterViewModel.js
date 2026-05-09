export function buildCommandCenterViewModelV2(studio, pvSnapshot, abSnapshot) {
  const pvStatus = pvSnapshot?.status || {};
  const pvBackend = pvStatus.latestBackendValidation || {};
  const pvRemediation = pvStatus.latestRemediation || {};
  const pvGovernance = pvSnapshot?.governance || {};

  return {
    shell: {
      productName: "NEXUS OS",
      mode: "local-private",
      environment: "Local",
      operator: "Founder",
      activeProject: studio.activeProject?.name || "DemoApp",
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
      founderIntent: "Build and validate DemoApp through governed NEXUS agents.",
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
    agenticWorkspace: {
      activeMode: "local-private",
      activeProject: "Private Project",
      activeMission: {
        id: "private-project-governed-build-mission",
        exists: true,
        planReady: true,
        taskCount: 6,
      },
      nextBestAction: {
        title: "Activate First Mission Task",
        description: "Mission plan is ready. Activate the first task to move from planned to queued state in the runtime.",
        workflowId: "govern-agent-work",
        enabled: false,
        disabledReason: "Requires P37 task activation bridge",
        targetPhase: "P37",
      },
      workflowTemplates: [
        { id: "build-product", label: "Build Product", description: "Turn a product idea into governed tasks across planning, design, backend, iOS, privacy, and verification.", category: "build", primaryAgents: ["SHEPHERD", "PRISM", "CORE", "SWIFT", "SENTINEL", "WARDEN", "AUDITOR"], evidenceCreated: ["mission_contract", "task_plan", "implementation_evidence", "validation_result"], approvalRequired: "conditional", riskLevel: "high", enabledNow: false, disabledReason: "Requires task activation and implementation bridge", nextPhase: "P37" },
        { id: "fix-failing-test", label: "Fix Failing Test", description: "Analyze a failing validation result, classify root cause, apply narrow fix if safe, and re-run controlled validation.", category: "fix", primaryAgents: ["AUDITOR", "CORE", "SENTINEL"], evidenceCreated: ["failure_analysis", "remediation_plan", "patch_summary", "validation_result"], approvalRequired: "conditional", riskLevel: "medium", enabledNow: false, disabledReason: "Requires task activation bridge", nextPhase: "P37" },
        { id: "validate-backend", label: "Validate Backend", description: "Run allowlisted backend validation through preflight, controlled execution, redaction, and evidence capture.", category: "validate", primaryAgents: ["AUDITOR", "SENTINEL"], evidenceCreated: ["command_allowlist_decision", "preflight_result", "controlled_command_result"], approvalRequired: false, riskLevel: "low", enabledNow: false, disabledReason: "Requires backend validation action bridge", nextPhase: "P37" },
        { id: "review-release", label: "Review Release", description: "Collect gates, blockers, evidence, approvals, and release readiness into a NO-GO/GO decision.", category: "release", primaryAgents: ["NEXUS", "AUDITOR", "SENTINEL", "WARDEN"], evidenceCreated: ["release_gate_summary", "release_decision"], approvalRequired: true, riskLevel: "high", enabledNow: false, disabledReason: "Requires release action bridge", nextPhase: "P39" },
        { id: "plan-sprint", label: "Plan Sprint", description: "Convert PRD/product gaps into a sprint plan with tasks, owners, gates, and validation requirements.", category: "plan", primaryAgents: ["SHEPHERD", "PRISM", "AUDITOR"], evidenceCreated: ["sprint_plan", "task_plan", "risk_review"], approvalRequired: false, riskLevel: "low", enabledNow: false, disabledReason: "Requires task activation bridge", nextPhase: "P37" },
        { id: "privacy-review", label: "Run Privacy Review", description: "Review private project data, PRD compliance constraints, public/demo boundary, and incident response readiness.", category: "govern", primaryAgents: ["WARDEN", "AUDITOR"], evidenceCreated: ["privacy_review", "data_classification", "safety_decision"], approvalRequired: "conditional", riskLevel: "medium", enabledNow: false, disabledReason: "Requires WARDEN review bridge", nextPhase: "P38" },
        { id: "ios-validation", label: "Prepare iOS Validation", description: "Prepare iOS/Xcode validation path, simulator/device requirements, SENTINEL gates, and app readiness evidence.", category: "validate", primaryAgents: ["SWIFT", "SENTINEL"], evidenceCreated: ["ios_readiness_plan", "xcode_validation_plan"], approvalRequired: false, riskLevel: "medium", enabledNow: false, disabledReason: "Requires iOS/Xcode runner bridge", nextPhase: "P38" },
        { id: "govern-agent-work", label: "Govern Agent Work", description: "Inspect active tasks, agent assignments, capabilities, approvals, evidence, and policy blocks.", category: "govern", primaryAgents: ["NEXUS", "SHEPHERD", "AUDITOR", "WARDEN"], evidenceCreated: ["governance_summary", "audit_review"], approvalRequired: false, riskLevel: "low", enabledNow: true, disabledReason: "", nextPhase: "P36" },
      ],
      recommendedWorkflows: ["govern-agent-work", "plan-sprint", "build-product"],
      workspaceStatus: {
        missionReady: true,
        planReady: true,
        tasksActivated: false,
        backendValidated: true,
        tests: `${pvBackend.testsPassed ?? 58}/${pvBackend.totalTests ?? 58} PASS`,
        readyForTaskActivation: true,
      },
      currentLimitations: [
        "Workflow execution not available in P36 — arrives in P37",
        "Task activation requires P37 task activation bridge",
        "Agent dispatch requires P39 implementation workflow bridge",
        "Live API backend requires P40",
        "DB-backed state requires P41",
      ],
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
      activeProject: studio.activeProject?.name || "DemoApp",
    },
    mission: {
      founderIntent: "Build and validate DemoApp through governed NEXUS agents.",
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
