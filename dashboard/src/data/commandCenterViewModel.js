import { CAPABILITY_READINESS } from "./capabilityReadiness.js";
import { buildWorkspaceSummary } from "../../../workspace/workflowRecommendations.js";
import serviceManifest from "../../../nexus.services.json";
import serviceState from "../../../local-state/runtime/services/service-state.json";
import doctorReport from "../../../reports/nexus-doctor-report.json";
import projectProgressExample from "../../../os-roadmap/project-progress.example.json";
import redactedReleaseManifest from "../../../artifacts/project-release/private-project-release-manifest.json";
import {
  buildRepoDependencyMap,
  buildRepoOwnershipMap,
  getRepoRegistry,
  summarizeRepoBlastRadius,
  summarizeRepoRegistry,
} from "../../../repo-workspace/index.js";
import { buildGitWorkflowPlan, summarizeGitWorkflowPlan } from "../../../git-lifecycle/index.js";
import {
  buildAgentBoundaryModel,
} from "../../../agent-registry/agentBoundaryModel.js";
import {
  buildAgentCapabilityMatrix,
  summarizeAgentCapabilityMatrix,
} from "../../../agent-registry/agentCapabilityMatrix.js";
import { getAgentRegistry } from "../../../agent-registry/agentRegistrySchema.js";
import { getSafeMemoryFixtures } from "../../../memory/memoryFixtures.js";
import { buildMemoryPacket, summarizeMemoryPacket } from "../../../memory/memoryPacketBuilder.js";
import { assessMemoryFreshness } from "../../../memory/memoryFreshness.js";
import { listPromotionCandidates } from "../../../memory/memoryPromotion.js";
import {
  getSkillProfiles,
  getSkillRegistry,
  getSkillTemplates,
  getSkillTestRequirements,
  summarizeRegisteredSkills,
  summarizeSkillProfiles,
  summarizeSkillTemplates,
  summarizeSkillTestRequirements,
} from "../../../skills-registry/index.js";
import {
  buildHookGuardDecision,
  buildTriggerPreview,
  detectRegistryLoopRisks,
  evaluateKillSwitch,
  getHookRegistry,
  summarizeRegisteredHooks,
  summarizeLoopRisks,
  summarizeTriggerDefinitions,
} from "../../../hooks/index.js";
import toolRegistrySeed from "../../../tool-governance/seeds/tool-registry.seed.json";
import mcpRegistrySeed from "../../../tool-governance/seeds/mcp-registry.seed.json";
import toolPermissionSeed from "../../../tool-governance/seeds/tool-permissions.seed.json";
import { listToolAdapterPreviews } from "../../../tool-governance/adapters/index.js";
import { createTriggerGatewaySummary, summarizeScheduledTriggers } from "../../../trigger-gateway/index.js";
import { getGitHubTriggerCatalog } from "../../../integrations/githubTriggerPreview.js";
import { getTicketTriggerCatalog } from "../../../integrations/ticketTriggerPreview.js";
import { getChatTriggerCatalog } from "../../../integrations/chatTriggerPreview.js";
import { listProviderAdapters, summarizeProviderRegistry } from "../../../api-batch/providerRegistry.js";
import { createOpenAIRequestPreview, summarizeOpenAIRequestPreview } from "../../../api-batch/openaiAdapter.js";
import { addBatchRequest, createBatchJob, estimateBatchJobSize, summarizeBatchJob } from "../../../api-batch/batchJobBuilder.js";
import { estimateBatchCost, estimateRequestCost } from "../../../api-batch/costEstimator.js";
import { reconcileBatchResultsPreview, summarizeReconciliation } from "../../../api-batch/resultReconciler.js";
import {
  buildGapRecommendations,
  buildFlakyTestRecords,
  buildPrdTestMap,
  detectCoverageGaps,
  listTestProposalPreview,
  recommendFlakyTestActions,
  recommendTestsForChange,
  summarizeCoverageGaps,
  summarizeFlakyTests,
  summarizePrdTestCoverage,
  summarizeTestRecommendations,
} from "../../../quality-intelligence/index.js";
import {
  CARELOOP_PHASE_2_READINESS,
  CARELOOP_PHASE_2_TASKS,
  CARELOOP_PHASE_STATUS,
  getCareLoopPhaseMilestones,
  summarizeCareLoopPhase2,
} from "./projectRoadmap.js";
import { createControlledMutationReadinessCard } from "../../../controlled-mutation/p67-5-placeholder.js";

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

function humanizeMissionId(missionId) {
  if (!missionId || typeof missionId !== "string") {
    return "Active Mission";
  }

  return missionId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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
  const shellMode = "local-private";
  const careloopPhase2 = summarizeCareLoopPhase2();
  const safeProjectDisplayName = careloopPhase2.displayName || "CareLoop";
  const activeMissionId = "careloop-premium";
  const activeMissionDisplayName = careloopPhase2.activeMission || "CareLoop Phase 2";
  const phase2TaskRows = CARELOOP_PHASE_2_TASKS.map((task) => ({
    planTaskId: task.taskId,
    title: task.title,
    targetAgent: task.ownerAgent,
    supportAgents: task.supportAgents || [],
    capabilityId: task.capabilityId,
    riskLevel: task.riskLevel,
    state: "planned",
    activationEnabled: false,
    activationDisabledReason: task.blockedUntil || "Planning-only task",
    requiredEvidence: task.requiredEvidence || [],
    nextRecommendedAction: task.nextRecommendedAction,
  }));
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
  const plannedMissionTasks = phase2TaskRows;
  const workspaceSummary = buildWorkspaceSummary({
    missionExists: true,
    taskPlanExists: true,
    taskCount: plannedMissionTasks.length,
    activatedTaskCount: activeTaskCount,
    backendTestsPassed: pvBackend.testsPassed ?? 58,
    backendTestsTotal: pvBackend.totalTests ?? 58,
    mode: "local-private",
    activeProject: safeProjectDisplayName,
    missionId: activeMissionId,
    prdGaps: CARELOOP_PHASE_2_READINESS.implementationGaps || [],
  });
  const prdTestMap = buildPrdTestMap({ projectId: "private-project" });
  const prdCoverageSummary = summarizePrdTestCoverage(prdTestMap);
  const coverageGaps = detectCoverageGaps(prdTestMap, []);
  const coverageGapSummary = summarizeCoverageGaps(coverageGaps);
  const gapRecommendations = buildGapRecommendations(coverageGaps);
  const flakyTestRecords = buildFlakyTestRecords([]);
  const flakyTestSummary = summarizeFlakyTests(flakyTestRecords);
  const flakyTestActions = recommendFlakyTestActions(flakyTestRecords);
  const testRecommendations = recommendTestsForChange({
    changedFiles: ["dashboard/src/pages/CommandCenterV2.jsx", "quality-intelligence/prdTestMapper.js"],
    coverageGaps,
  });
  const testRecommendationSummary = summarizeTestRecommendations(testRecommendations);
  const testProposals = listTestProposalPreview({
    projectId: "private-project",
    gaps: coverageGaps.length ? coverageGaps.slice(0, 3) : undefined,
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
  const phase2ReadinessGates = CARELOOP_PHASE_2_READINESS.readinessGates || [];
  const projectOperatingSurface = {
    selectedProjectLabel: safeProjectDisplayName,
    selectedProjectType: "SaaS + Mobile",
    selectedProjectStatus: "In Progress",
    selectedProjectMode: "local-private",
    stackSummary: "Node/Fastify + Prisma + iOS",
    activePhaseLabel: careloopPhase2.activePhase || "CARELOOP-P3-PREMIUM",
    activePhaseSummary: "Receiver-Scoped Premium Monetization",
    activeMissionLabel: activeMissionDisplayName,
    nextAction: careloopPhase2.nextAction || "Review Phase 2 task plan",
    sourceLabel: "Project Registry snapshot",
    portfolioSummary: {
      totalProjects: 1,
      registeredProjects: 1,
      activeProjects: 1,
      projectsNeedingSetup: 0,
      blockedProjects: blockedTaskCount > 0 ? 1 : 0,
      pendingApprovals: runtimeApprovals.requested || 0,
      readyForValidation: 1,
      selectedProject: safeProjectDisplayName,
      pinnedProjects: [safeProjectDisplayName],
      recentProjects: [safeProjectDisplayName],
      registryState: "Ready",
      projectRegistryPlannedNote: "Project Registry is read-only here; multi-project adapter runtime remains disabled.",
    },
    projectHealthStrip: [
      { label: "Project Registry", status: "Ready", tone: "pass", note: "Read-only registry metadata is available." },
      { label: "Profile", status: "Valid", tone: "pass", note: "The selected project profile validates." },
      { label: "Stack Profile", status: "Available", tone: "pass", note: "Stack and runner expectations are summarized." },
      { label: "Capability Matrix", status: "Available", tone: "pass", note: "Capability posture is visible without execution." },
      { label: "Adapter Runtime", status: "Disabled by policy", tone: "disabled", note: "No project adapter execution is enabled." },
      { label: "Project Mutation", status: "Disabled by policy", tone: "disabled", note: "Project source writes are not enabled." },
      { label: "Provider Dispatch", status: "Disabled by policy", tone: "disabled", note: "Provider-backed execution remains off." },
      { label: "DB Writes", status: "Disabled by policy", tone: "disabled", note: "Runtime remains file-backed/read-only." },
    ],
    stackProfile: [
      { area: "Backend", status: "Detected", tone: "pass", summary: "Node/Fastify-style backend validation can be represented by governed local checks.", runner: "Approved backend checker" },
      { area: "Database", status: "Needs setup", tone: "pending", summary: "Prisma/Postgres posture is tracked, but DB writes and production DB are disabled by policy.", runner: "File-backed durable state" },
      { area: "Mobile", status: "Requires runner", tone: "pending", summary: "iOS validation requires an approved local iOS/Xcode runner.", runner: "iOS/Xcode runner" },
      { area: "Android", status: "Not configured", tone: "disabled", summary: "No Android runner is configured for the selected project.", runner: "Future mobile runner" },
      { area: "Web", status: "Detected", tone: "pass", summary: "Command Center and web validation use dashboard build and page tests.", runner: "Dashboard build and Playwright" },
      { area: "Tests", status: "Available", tone: "pass", summary: "Approved repository checkers and dashboard tests define current validation.", runner: "NEXUS check scripts" },
      { area: "Tooling", status: "Not enabled yet", tone: "pending", summary: "Tool/MCP and provider dispatch are represented but not executable.", runner: "Governed dispatch planned" },
    ],
    capabilityCards: [
      { name: "Planning", status: "Available", tone: "pass", description: "Turn Phase 2 goals into governed mission and project plans.", nextAction: "Review Phase 2 task plan.", owner: "SHEPHERD", required: "Mission composer" },
      { name: "Backend validation", status: "Ready", tone: "pass", description: "Approved local checkers can validate backend-facing readiness.", nextAction: "Run approved backend validation from a local terminal.", owner: "SENTINEL", required: "Backend checker" },
      { name: "iOS validation", status: "Requires setup", tone: "pending", description: "Mobile validation needs a governed local macOS/Xcode runner.", nextAction: "Prepare iOS validation setup.", owner: "SWIFT", required: "iOS/Xcode runner" },
      { name: "Android validation", status: "Not configured", tone: "disabled", description: "No Android project profile or runner is configured.", nextAction: "Add Android profile metadata before validation.", owner: "SENTINEL", required: "Android runner" },
      { name: "Web validation", status: "Ready", tone: "pass", description: "Dashboard build and page tests cover current web validation.", nextAction: "Run dashboard build and page tests when UI changes.", owner: "AUDITOR", required: "Playwright + build" },
      { name: "Controlled implementation", status: "Planned", tone: "pending", description: "Phase 2 implementation candidates are planning-only until controlled source mutation is approved.", nextAction: "Select the smallest low-risk candidate after readiness gates.", owner: "CORE", required: "P67 controlled source mutation" },
      { name: "Evidence/audit", status: "Available", tone: "pass", description: "Governed actions and checks produce redacted evidence summaries.", nextAction: "View project evidence after validation or review.", owner: "AUDITOR", required: "Evidence ledger" },
      { name: "Release readiness", status: "Not enabled yet", tone: "pending", description: "Release execution requires gates, evidence, and explicit release controls.", nextAction: "Complete the Phase 2 release readiness outline.", owner: "NEXUS", required: "Release action bridge" },
      { name: "Packaging/export safety", status: "Ready", tone: "pass", description: "Packaging safety boundaries prevent NEXUS OS internals from shipping with projects.", nextAction: "Review blocked roots before any export dry run.", owner: "WARDEN", required: "Packaging policy" },
      { name: "Cost tracking", status: "Not enabled yet", tone: "disabled", description: "Project-level cost enforcement is planned and provider dispatch is off.", nextAction: "Keep provider spend disabled until Cost Center enforcement lands.", owner: "NEXUS", required: "Cost Center" },
    ],
    milestones: [
      ...getCareLoopPhaseMilestones(),
    ],
    openGaps: [
      ...(CARELOOP_PHASE_2_READINESS.implementationGaps || []).map((gap, index) => ({
        title: gap,
        why: "This gap must be closed before Phase 2 source implementation or release readiness can proceed.",
        status: "Pending",
        tone: "pending",
        nextAction: phase2ReadinessGates[index]?.gate
          ? `Complete ${phase2ReadinessGates[index].gate}.`
          : "Keep as a governed Phase 2 planning blocker.",
        owner: index === 0 ? "CORE" : index === 1 ? "SENTINEL" : "WARDEN",
        enablingCapability: index === 0 ? "Controlled implementation planning" : index === 1 ? "Validation readiness" : "Privacy and safety review",
      })),
      { title: "Provider dispatch remains disabled", why: "Phase 2 starts from NEXUS without provider-backed execution.", status: "Disabled by policy", tone: "disabled", nextAction: "Wait for governed provider/tool dispatch phases.", owner: "NEXUS", enablingCapability: "P64 provider/tool dispatch" },
      { title: "Release/deploy execution remains disabled", why: "Release and deployment require later platform phases and completed gates.", status: "Not enabled yet", tone: "disabled", nextAction: "Use release readiness planning only.", owner: "AUDITOR", enablingCapability: "P69/P70 release/deploy loops" },
    ],
    adapterSettings: [
      { label: "Profile source", value: "Project Registry snapshot" },
      { label: "Project adapter status", value: "Project adapter not enabled yet" },
      { label: "Adapter runtime", value: "Disabled by policy" },
      { label: "Project mutation", value: "Disabled by policy" },
      { label: "Provider dispatch", value: "Disabled by policy" },
      { label: "DB writes", value: "Disabled by policy" },
      { label: "External network", value: "Disabled by policy" },
    ],
    evidenceSummary: [
      { title: "Premium phase plan", status: "Active", tone: "pending", summary: "Receiver-scoped premium implementation is split into P1-P8 with tests and commits at each phase boundary.", linkedAction: "CareLoop premium plan", redacted: "Yes" },
      { title: "Phase 2 mission contract", status: "Available", tone: "pass", summary: "Phase 2 remains available as the completed hardening baseline.", linkedAction: "CareLoop Phase 2 start", redacted: "Yes" },
      { title: "Readiness gates", status: "Pending", tone: "pending", summary: `${phase2ReadinessGates.length} readiness gates plus premium phase checks remain active.`, linkedAction: "Premium phase readiness", redacted: "Yes" },
    ],
    developerDetails: [
      { label: "Project ID", value: "careloop" },
      { label: "Mission ID", value: activeMissionId },
      { label: "Profile path", value: "projects/careloop/nexus.project.json" },
      { label: "Premium plan", value: "projects/careloop/docs/PREMIUM_PHASE_PLAN.md" },
      { label: "Task plan", value: "contracts/projects/careloop/phase-2-task-plan.json" },
    ],
  };
  const trustedContextSources = [
    {
      sourceId: "nexus-os-roadmap",
      label: "NEXUS OS Roadmap",
      type: "roadmap",
      scope: "os",
      owner: "NEXUS",
      dataClassification: "internal",
      systemOfRecord: true,
    },
    {
      sourceId: "os-phase-status",
      label: "OS Phase Status Registry",
      type: "phase_status",
      scope: "os",
      owner: "NEXUS",
      dataClassification: "internal",
      systemOfRecord: true,
    },
    {
      sourceId: "project-registry",
      label: "Project Registry",
      type: "project_registry",
      scope: "portfolio",
      owner: "NEXUS",
      dataClassification: "local-private",
      systemOfRecord: true,
    },
    {
      sourceId: "runtime-tasks",
      label: "Runtime Task State",
      type: "runtime_state",
      scope: "task",
      owner: "NEXUS",
      dataClassification: "local-private",
      systemOfRecord: true,
    },
    {
      sourceId: "evidence-ledger",
      label: "Evidence Ledger",
      type: "evidence_ledger",
      scope: "task",
      owner: "AUDITOR",
      dataClassification: "local-private",
      systemOfRecord: true,
    },
    {
      sourceId: "policy-files",
      label: "Policy Files",
      type: "policy",
      scope: "safety",
      owner: "WARDEN",
      dataClassification: "internal",
      systemOfRecord: true,
    },
  ];
  const trustedContextScores = trustedContextSources.map((source, index) => ({
    sourceId: source.sourceId,
    label: source.label,
    band: index < 4 ? "high" : "medium",
    score: index < 4 ? 90 : 75,
    sourceExists: true,
  }));
  const trustedContextFreshness = trustedContextSources.map((source, index) => ({
    sourceId: source.sourceId,
    status: index < 2 ? "unknown" : "fresh",
    redacted: true,
  }));
  const trustedContextPacket = {
    scope: "PROJECT_CHANGE",
    projectId: "private-project",
    taskId: "trusted-context-preview",
    agentId: "NEXUS",
    capabilityId: "trusted-context.preview",
    mode: shellMode,
    includedSources: trustedContextSources.slice(2).map((source) => ({
      ...source,
      trustBand: trustedContextScores.find((score) => score.sourceId === source.sourceId)?.band || "medium",
      freshnessStatus: trustedContextFreshness.find((record) => record.sourceId === source.sourceId)?.status || "unknown",
      summaryOnly: true,
      redacted: true,
    })),
    excludedSources: trustedContextSources.slice(0, 2).map((source) => ({
      sourceId: source.sourceId,
      label: source.label,
      reasons: ["Source scope does not match requested project context scope."],
      redacted: true,
    })),
    trustSummary: { high: 3, medium: 1, low: 0, unavailable: 0 },
    freshnessSummary: { fresh: 4, stale: 0, unknown: 0, unavailable: 0 },
    lineageSummary: {
      lineageId: "lineage-trusted-context-preview",
      derivedFromCount: 4,
      redacted: true,
    },
    rawContentIncluded: false,
    redacted: true,
  };
  const trustBands = trustedContextScores.reduce((acc, score) => {
    acc[score.band] = (acc[score.band] || 0) + 1;
    return acc;
  }, { high: 0, medium: 0, low: 0, unavailable: 0 });
  const projectSummaries = [
    {
      projectId: "careloop",
      label: safeProjectDisplayName,
      mode: shellMode,
      status: blockedTaskCount > 0 ? "Needs review" : "Active",
      activeMissionId,
      activeTasks: activeTaskCount,
      blockedTasks: blockedTaskCount,
      gateStatus: `${gatePassCount}/${Object.keys(gateStatuses).length} gates passing`,
      releaseStatus: "Not ready",
      costStatus: "Cost enforcement not enabled yet",
    },
  ];
  const portfolioSummary = {
    totalProjects: projectSummaries.length,
    activeProjects: projectSummaries.filter((project) => project.status === "Active" || project.status === "Needs review").length,
    blockedProjects: projectSummaries.filter((project) => project.blockedTasks > 0).length,
    pendingApprovals: runtimeApprovals.requested || 0,
    activeTasks: activeTaskCount,
  };
  const osSummary = {
    currentPhase: "P41.7.3B - Mission Control Tabbed Cockpit",
    nextPhase: "P41.7.3C - Page Tab Rollout - Workspace / Tasks / Workbench / Implementation",
    serviceHealth: configuredServiceCards.some((service) => service.currentStatus === "Running")
      ? "Some local services running"
      : "Status snapshot available",
    docsStatus: "Codebase docs and reuse catalog available",
    roadmapStatus: "OS roadmap tracked separately from project progress",
  };
  const scopeBoundary = {
    activeScope: "Project",
    selectedProjectLabel: safeProjectDisplayName,
    osBoundary: "NEXUS OS is the control plane",
    projectBoundary: "Projects are workloads",
    projectMutation: "Disabled unless governed",
    osMutation: "Disabled unless governed",
    crossCutting: "Review required",
    unknown: "Review required",
    exportSafety: "Dry-run only",
    exportPackageCreated: false,
    nexusInternalsBlocked: true,
    ledgerExportBlocked: true,
    secretsBlocked: true,
    demoDataBlocked: true,
    redactedManifestAvailable: Boolean(redactedReleaseManifest?.manifestVersion),
    manifestPath: "artifacts/project-release/private-project-release-manifest.json",
    manifestPackageCreated: redactedReleaseManifest?.releaseReadiness?.packageCreated === true,
    manifestDryRunOnly: redactedReleaseManifest?.releaseReadiness?.exportDryRunOnly === true,
    releaseExecutionEnabled: redactedReleaseManifest?.releaseReadiness?.releaseExecutionEnabled === true,
    safetyCopy:
      "NEXUS OS is the control plane. Projects are workloads. Shipping a project must not include NEXUS agents, policies, evidence ledgers, local-state runtime files, or secrets.",
  };
  const repoRegistry = getRepoRegistry();
  const repoRegistrySummary = summarizeRepoRegistry(repoRegistry);
  const repoOwnershipMap = buildRepoOwnershipMap(repoRegistry);
  const repoDependencyMap = buildRepoDependencyMap(repoRegistry);
  const repoBlastRadius = summarizeRepoBlastRadius({ repoIds: ["nexus-os", "private-project-backend"] }, repoRegistry);
  const gitWorkflowPlan = buildGitWorkflowPlan({
    changeId: "p44-3-command-center-summary",
    scope: "NEXUS_OS_CHANGE",
    projectId: "nexus-os",
    repoIds: ["nexus-os"],
    summary: "show git workflow planning model",
  });
  const agentRegistry = getAgentRegistry();
  const agentCapabilityMatrix = buildAgentCapabilityMatrix(agentRegistry.agents);
  const agentCapabilitySummary = summarizeAgentCapabilityMatrix(agentCapabilityMatrix);
  const agentBoundaryModel = buildAgentBoundaryModel(agentRegistry.agents);
  const agentCapabilityById = new Map(
    agentCapabilityMatrix.agents.map((entry) => [entry.agentId, entry]),
  );
  const agentBoundaryById = new Map(
    agentBoundaryModel.agents.map((entry) => [entry.agentId, entry]),
  );
  const memoryItems = getSafeMemoryFixtures();
  const memoryPacket = buildMemoryPacket({
    scope: "task",
    projectId: "private-project",
    missionId: activeMissionId,
    taskId: "task-governed-build-summary",
    agentId: "CORE",
    capabilityId: "implementation.backend_code",
    mode: shellMode,
    memoryItems,
    memoryBudget: { maxItems: 5, maxSummaryCharacters: 1400 },
  });
  const memoryFreshness = memoryItems.map((item) => assessMemoryFreshness(item, { now: "2026-05-15T00:00:00.000Z" }));
  const memoryPromotionCandidates = listPromotionCandidates(memoryItems);
  const multiRepoWorkspace = {
    phase: "P44.2",
    title: "Multi-Repo Workspace",
    status: "Registry and dependency map ready",
    summary: repoRegistrySummary,
    ownership: {
      ownerCount: repoOwnershipMap.owners.length,
      owners: repoOwnershipMap.owners,
    },
    dependencies: {
      relationshipCount: repoDependencyMap.relationships.length,
      relationships: repoDependencyMap.relationships,
      blastRadius: repoBlastRadius,
    },
    gitWorkflow: {
      summary: summarizeGitWorkflowPlan(gitWorkflowPlan),
      allowedGitActions: gitWorkflowPlan.allowedGitActions,
      forbiddenGitActions: gitWorkflowPlan.forbiddenGitActions,
      rollbackBranchPlan: gitWorkflowPlan.rollbackBranchPlan,
    },
    repos: repoRegistry.repos.map((repo) => ({
      repoId: repo.repoId,
      projectId: repo.projectId,
      label: repo.label,
      root: repo.root,
      repoType: repo.repoType,
      visibility: repo.visibility,
      status: repo.status,
      ownerAgent: repo.ownerAgent,
      packageBoundary: repo.packageBoundary,
      currentBranch: repo.currentBranch,
    })),
    safetyPosture: {
      gitActionsEnabled: false,
      branchCreationAllowed: false,
      commitsAllowed: false,
      prCreationAllowed: false,
      projectMutationAllowed: false,
      privateSourceDetailedScanningAllowed: false,
      note: "No git branch, commit, PR, merge, or push actions are enabled.",
    },
  };
  const registeredSkills = getSkillRegistry();
  const skillTemplates = getSkillTemplates();
  const skillProfiles = getSkillProfiles();
  const skillTestRequirements = getSkillTestRequirements(skillTemplates);
  const skillRequirementById = new Map(skillTestRequirements.map((requirement) => [requirement.skillId, requirement]));
  const skillProfileBySkillId = skillProfiles.reduce((acc, profile) => {
    for (const skillId of profile.compatibleSkillIds) {
      if (!acc.has(skillId)) acc.set(skillId, []);
      acc.get(skillId).push(profile.label);
    }
    return acc;
  }, new Map());
  const skillRegistrySummary = summarizeRegisteredSkills(registeredSkills);
  const skillTemplateSummary = summarizeSkillTemplates(skillTemplates);
  const skillProfileSummary = summarizeSkillProfiles(skillProfiles);
  const skillTestSummary = summarizeSkillTestRequirements(skillTestRequirements);
  const skillRegistryView = {
    summary: {
      skills: skillRegistrySummary.skillCount,
      templates: skillTemplateSummary.templateCount,
      profiles: skillProfileSummary.profileCount,
      testRequirementSets: skillTestSummary.requirementCount,
      executionEnabled: false,
      providerCallsEnabled: false,
      toolExecutionEnabled: false,
      workerRuntimeEnabled: false,
      dbWritesEnabled: false,
      projectMutationEnabled: false,
      status: "Read-only registry",
      nextPhase: "P51 - Hook Registry + Safe Automation Lifecycle",
    },
    skills: registeredSkills.map((skill) => ({
      ...skill,
      statusLabel: skill.executionEnabled ? "Executable" : "Not enabled",
      disabledReason: "Skill execution not enabled yet",
      compatibleProfiles: skillProfileBySkillId.get(skill.skillId) || [],
      testRequirementCount: skill.testRequirements?.length || 0,
    })),
    templates: skillTemplates.map((template) => ({
      ...template,
      statusLabel: template.executionEnabled ? "Executable" : "Not enabled",
      testRequirements: skillRequirementById.get(template.skillId) || null,
    })),
    profiles: skillProfiles,
    testRequirements: skillTestRequirements,
    safetyNotes: [
      "Skill execution is not enabled yet.",
      "Provider, tool, worker, DB write, and project mutation paths remain disabled.",
      "Skills are registry, contract, template, profile, and test metadata only in P50.",
    ],
  };
  const registeredHooks = getHookRegistry();
  const hookSummary = summarizeRegisteredHooks(registeredHooks);
  const hookTriggerSummary = summarizeTriggerDefinitions();
  const hookLoopResults = detectRegistryLoopRisks(registeredHooks);
  const hookLoopSummary = summarizeLoopRisks(hookLoopResults);
  const hookLoopById = new Map(hookLoopResults.map((result) => [result.hookId, result]));
  const hookRegistryView = {
    summary: {
      hooks: hookSummary.hookCount,
      enabledHooks: hookSummary.enabledCount,
      failClosedHooks: hookSummary.failClosedCount,
      triggerDefinitions: hookTriggerSummary.triggerCount,
      loopRiskBlocked: hookLoopSummary.blockedCount,
      killSwitchStates: registeredHooks.length,
      status: "Read-only registry",
      executionEnabled: false,
      schedulerEnabled: false,
      webhookRuntimeEnabled: false,
      workerRuntimeEnabled: false,
      providerCallsEnabled: false,
      toolCallsEnabled: false,
      dbWritesEnabled: false,
      projectMutationEnabled: false,
      nextPhase: "P52 - Tool / MCP Registry + Tool Governance",
    },
    hooks: registeredHooks.map((hook) => {
      const triggerPreview = buildTriggerPreview(hook);
      const guardDecision = buildHookGuardDecision(hook);
      const killSwitch = evaluateKillSwitch(hook);
      return {
        ...hook,
        statusLabel: hook.enabled ? "Ready" : "Not enabled",
        disabledReason: "Hook execution is not enabled yet.",
        triggerPreview,
        guardDecision,
        killSwitch,
        loopRisk: hookLoopById.get(hook.hookId),
      };
    }),
    triggerSummary: hookTriggerSummary,
    loopRiskSummary: hookLoopSummary,
    safetyNotes: [
      "Hook execution is not enabled yet.",
      "Hooks are registry/readiness only in P51.",
      "Schedulers, cron, external webhooks, workers, provider/tool dispatch, DB writes, and project mutation remain disabled.",
      "Worker/runtime integration comes later.",
    ],
  };
  const toolGatewayView = {
    summary: {
      gatewayLabel: "Governed Tool Gateway",
      mode: "metadata and preview only",
      tools: toolRegistrySeed.length,
      mcpPlaceholders: mcpRegistrySeed.length,
      permissionEntries: toolPermissionSeed.length,
      adapterPreviews: listToolAdapterPreviews().length,
      executionEnabled: false,
      providerCallsEnabled: false,
      externalNetworkEnabled: false,
      dbWritesEnabled: false,
      projectMutationEnabled: false,
      lazyContractLoading: "Required",
      nextPhase: "P52.9 - Final Validation",
    },
    tools: toolRegistrySeed.map((tool) => ({
      toolId: tool.toolId,
      displayName: tool.displayName,
      category: tool.category,
      interfaceType: tool.interfaceType,
      status: tool.status,
      riskLevel: tool.riskLevel,
      owner: tool.owner,
      lazyContractAvailable: tool.lazyContractAvailable,
      executionEnabled: tool.executionEnabled,
    })),
    mcpServers: mcpRegistrySeed.map((server) => ({
      mcpServerId: server.mcpServerId,
      displayName: server.displayName,
      status: server.status,
      transport: server.transport,
      serverEnabled: server.serverEnabled,
      lazySchemaLoadingRequired: server.lazySchemaLoadingRequired,
      egressPolicy: server.egressPolicy,
    })),
    permissions: toolPermissionSeed.map((entry) => ({
      permissionId: entry.permissionId,
      toolId: entry.toolId,
      agentId: entry.agentId,
      permission: entry.permission,
      approvalRequired: entry.approvalRequired,
      reason: entry.reason,
    })),
    adapters: listToolAdapterPreviews().map((adapter) => ({
      ...adapter,
      status: "Preview only",
    })),
    lazyLoading: {
      maxContractsPerTask: 3,
      maxToolSummaries: 20,
      allToolSchemasAllowed: false,
      allMcpSchemasAllowed: false,
      selectedContractLoadingRequired: true,
    },
    safetyNotes: [
      "One governed tool gateway evaluates tool metadata and preview decisions.",
      "Tool execution, MCP server runtime, shell execution, provider calls, external network, DB writes, workers, and project mutation remain disabled.",
      "Tool search returns summaries only. Selected contracts load lazily and never as all-tool or all-MCP schemas.",
      "Adapter previews describe future actions only; they do not execute them.",
    ],
  };
  const triggerGatewaySummary = createTriggerGatewaySummary();
  const scheduledSummary = summarizeScheduledTriggers();
  const triggerIntegrationView = {
    summary: {
      gatewayLabel: "Trigger + Integrations",
      mode: "preview and dry-run only",
      triggerTypes: triggerGatewaySummary.triggerTypes,
      manualPreviews: 9,
      scheduledPreviews: scheduledSummary.previewCount,
      githubEvents: getGitHubTriggerCatalog().length,
      ticketEvents: getTicketTriggerCatalog().length,
      chatCommands: getChatTriggerCatalog().length,
      executionEnabled: false,
      webhookListenersEnabled: false,
      schedulersEnabled: false,
      providerCallsEnabled: false,
      externalNetworkEnabled: false,
      dbWritesEnabled: false,
      projectMutationEnabled: false,
      nextPhase: "P54 - API + Batch Execution Adapter",
    },
    manualActions: ["plan", "review", "qa", "fix", "ship", "retro", "guard", "freeze", "explain"],
    scheduled: scheduledSummary.previews,
    githubEvents: getGitHubTriggerCatalog(),
    ticketEvents: getTicketTriggerCatalog(),
    chatCommands: getChatTriggerCatalog(),
    safetyNotes: [
      "Trigger execution is not enabled.",
      "GitHub, Jira, Linear, Slack, Teams, and webhook integrations are preview-only.",
      "No credentials, external network calls, webhook listeners, schedulers, DB writes, workers, provider calls, or project mutation are enabled.",
      "Future runtime execution requires a dedicated governed phase.",
    ],
  };
  const providerAdapters = listProviderAdapters();
  const providerRegistrySummary = summarizeProviderRegistry(providerAdapters);
  const openAIRequestPreview = createOpenAIRequestPreview({
    endpoint: "responses",
    modelPolicy: "balanced",
    inputSummary: "Redacted Command Center API request preview.",
  });
  let apiBatchJob = createBatchJob({ batchJobId: "command-center-api-batch-preview", workloadType: "docs_generation" });
  apiBatchJob = addBatchRequest(apiBatchJob, {
    custom_id: "docs-preview-001",
    inputSummary: "Redacted documentation generation request.",
  });
  apiBatchJob = addBatchRequest(apiBatchJob, {
    custom_id: "test-gap-preview-001",
    inputSummary: "Redacted test gap analysis request.",
  });
  const apiBatchCost = estimateBatchCost(apiBatchJob, { modelPolicy: "balanced", approvalThresholdUsd: 0.01 });
  const apiBatchReconciliation = reconcileBatchResultsPreview(apiBatchJob, [
    {
      custom_id: "docs-preview-001",
      outputSummary: "Preview-only result summary for documentation generation.",
      rawProviderPayloadStored: false,
    },
  ]);
  const apiBatchView = {
    summary: {
      label: "API / Batch Adapter",
      mode: "preview-only",
      providerAdapters: providerRegistrySummary.providerCount,
      previewOnlyAdapters: providerRegistrySummary.previewOnlyCount,
      externalCallsEnabled: false,
      externalUploadAllowed: false,
      providerExecutionEnabled: false,
      apiKeysRead: false,
      dbWritesEnabled: false,
      workerRuntimeEnabled: false,
      projectMutationEnabled: false,
      nextDependencies: ["Cost Center", "Worker Runtime", "Provider Dispatch"],
    },
    providers: providerAdapters.map((adapter) => ({
      ...adapter,
      displayStatus: adapter.status === "preview_only" ? "Preview only" : "Planned",
    })),
    openAIRequestPreview: summarizeOpenAIRequestPreview(openAIRequestPreview),
    requestCostPreview: estimateRequestCost(openAIRequestPreview, { modelPolicy: "balanced" }),
    batchJob: summarizeBatchJob(apiBatchJob),
    batchJobSize: estimateBatchJobSize(apiBatchJob),
    batchCost: apiBatchCost,
    reconciliation: summarizeReconciliation(apiBatchReconciliation),
    jsonlPreview: {
      available: true,
      path: "reports/api-batch/sample-batch-preview.jsonl",
      safeForReview: true,
      rawPromptStored: false,
    },
    disabledActions: [
      { label: "Create preview batch job", reason: "Use local checker-generated preview artifacts for now." },
      { label: "Upload batch", reason: "Upload disabled; provider calls disabled." },
      { label: "Execute provider request", reason: "Provider execution disabled until governed dispatch exists." },
    ],
    safetyNotes: [
      "Provider adapters are preview-only.",
      "External provider calls disabled.",
      "External upload disabled.",
      "API keys and credentials are not read.",
      "Cost estimate is available before any future execution.",
      "Result reconciliation is preview-only and maps summaries by custom_id.",
    ],
  };

  return {
    shell: {
      productName: "NEXUS OS",
      productTitle: "NEXUS OS - Agentic Command Center",
      mode: shellMode,
      environment: "Desktop",
      previewLabel: "Local Preview",
      operator: "Founder",
      activeProject: safeProjectDisplayName,
      defaultScope: "project",
      availableScopes: ["portfolio", "project", "os"],
      projectRegistryStatus: "planned",
      workspaceScope: "project",
      selectedProjectId: "careloop",
      selectedProjectLabel: safeProjectDisplayName,
      pinnedProjectIds: ["careloop"],
    },
    scopeModel: {
      workspaceScope: "project",
      selectedProjectId: "careloop",
      selectedProjectLabel: safeProjectDisplayName,
      pinnedProjectIds: ["careloop"],
      projectSummaries,
      portfolioSummary,
      osSummary,
    },
    scopeBoundary,
    multiRepoWorkspace,
    skillRegistry: skillRegistryView,
    hookRegistry: hookRegistryView,
    toolGateway: toolGatewayView,
    triggerIntegration: triggerIntegrationView,
    apiBatch: apiBatchView,
    workerRuntime: {
      runtimeMode: "preview_only",
      executionEnabled: false,
      warning: "P60 defines runtime primitives only. It does not execute agents, tools, providers, or project mutations yet.",
      nextAction: "Inspect P61 concurrency previews before any future parallel execution is enabled.",
      concurrencyPreview: {
        executionStatus: "Not enabled yet",
        policyStatus: "Preview-only policy loaded",
        lockModel: "Preview-ready",
        duplicateDetection: "Preview-ready",
        priorityModel: "Preview-ready",
        cancellationModel: "Preview-ready",
        maxConcurrentTasksPerProject: 1,
        maxConcurrentTasksPerRepo: 1,
        maxConcurrentTasksPerAgent: 1,
        lockStatePath: "local-state/runtime/concurrency-locks.jsonl",
        policyPath: "policy/concurrency-policy.json",
        reports: [
          "reports/concurrency-policy-report.md",
          "reports/concurrency-locks-report.md",
          "reports/work-deduplication-report.md",
          "reports/queue-priority-report.md",
          "reports/task-cancellation-report.md",
        ],
        safetyNotes: [
          "No real parallel execution is enabled.",
          "Lock conflicts are preview warnings only.",
          "Duplicate work detection does not merge tasks.",
          "Priority previews do not reorder worker queues.",
          "Cancellation previews do not terminate workers or mutate task state.",
        ],
      },
      statusCards: [
        { label: "Worker queue", value: "Modeled", detail: "Queue schema validates preview-only work items." },
        { label: "Leases", value: "Preview", detail: "Lease records can be modeled; no worker claims execute." },
        { label: "Heartbeats", value: "Preview", detail: "Heartbeat records and stale detection are deterministic previews." },
        { label: "Retry/timeout", value: "Modeled", detail: "Retry delays and timeout classifications are calculated only." },
        { label: "Dead-letter queue", value: "Modeled", detail: "DLQ records preserve blockers; requeue is not enabled." },
        { label: "Concurrency", value: "Preview-ready", detail: "Locks, deduplication, priority, and cancellation are modeled only." },
        { label: "Runtime execution", value: "Not enabled", detail: "No agents, tools, providers, DB writes, or project mutations execute." },
      ],
      developerDetails: {
        policyPath: "policy/worker-runtime-policy.json",
        concurrencyPolicyPath: "policy/concurrency-policy.json",
        concurrencyLockPath: "local-state/runtime/concurrency-locks.jsonl",
        statusPath: "reports/worker-runtime-status.json",
        queueStatePath: "local-state/runtime/worker-queue.jsonl",
        leaseStatePath: "local-state/runtime/worker-leases.jsonl",
        heartbeatStatePath: "local-state/runtime/worker-heartbeats.jsonl",
        deadLetterStatePath: "local-state/runtime/dead-letter-queue.jsonl",
      },
    },
    agentRegistry: {
      registryVersion: agentRegistry.registryVersion,
      runtimePermissionsGranted: false,
      runtimeEnforcementEnabled: false,
      toolDispatchEnabled: false,
      providerCallsEnabled: false,
      dbWritesEnabled: false,
      activeProjectLabel: safeProjectDisplayName,
      selectedAgentId: "CORE",
      capabilitySummary: agentCapabilitySummary,
      agents: agentRegistry.agents.map((agent) => {
        const capabilityEntry = agentCapabilityById.get(agent.agentId);
        const boundaryEntry = agentBoundaryById.get(agent.agentId);
        return {
          agentId: agent.agentId,
          displayName: agent.displayName,
          role: agent.role,
          status: agent.status,
          agentType: agent.agentType,
          capabilityCount: agent.allowedCapabilities.length,
          capabilities: agent.allowedCapabilities,
          forbiddenCapabilities: agent.forbiddenCapabilities,
          boundarySummary: {
            allowedPathCount: boundaryEntry?.pathBoundary?.allowedPathPatterns?.length || 0,
            forbiddenPathCount: boundaryEntry?.pathBoundary?.forbiddenPathPatterns?.length || 0,
            dataClassifications: boundaryEntry?.dataBoundary?.allowedDataClassifications || [],
            toolDispatchEnabled: boundaryEntry?.toolBoundary?.dispatchEnabled === true,
          },
          approvalRequirements: agent.approvalRequirements,
          evidenceRequirements: agent.evidenceRequirements,
          costPolicy: agent.costPolicy?.providerSpendAllowed ? "Provider spend requires policy review" : "Provider spend disabled",
          memoryPolicy: agent.memoryPolicy?.persistentMemoryWriteAllowed ? "Persistent memory write requires policy review" : "Persistent memory writes disabled",
          categoryCoverage: capabilityEntry?.categoryCoverage || [],
        };
      }),
      envelopePreview: {
        agentId: "CORE",
        projectId: "selected-project-ref",
        scopeType: "project",
        capabilityId: "implementation.scoped_patch",
        dryRun: true,
        valid: true,
        approvalCount: 2,
        evidenceCount: 3,
        allowedPathCount: agentBoundaryById.get("CORE")?.pathBoundary?.allowedPathPatterns?.length || 0,
        forbiddenPathCount: agentBoundaryById.get("CORE")?.pathBoundary?.forbiddenPathPatterns?.length || 0,
        dataClassificationLimits: agentBoundaryById.get("CORE")?.dataBoundary?.allowedDataClassifications || [],
        warnings: ["Runtime enforcement is not enabled yet."],
      },
      definitionUpdates: {
        workflowStatus: "Read-only",
        proposalId: "agent-def-proposal-core-docs-boundary",
        selectedAgent: "CORE",
        changeType: "Capability update",
        riskLevel: "medium",
        status: "Requires human approval",
        mutationAllowed: false,
        directAgentFileMutationAllowed: false,
        providerDispatchAllowed: false,
        toolDispatchAllowed: false,
        workerRuntimeAllowed: false,
        dbWritesAllowed: false,
        proposalSummary: "Allow CORE to propose documentation-only implementation summaries while keeping runtime execution disabled.",
        boundaryDiff: [
          { label: "Capability delta", value: "docs.update proposed", tone: "pending" },
          { label: "Path boundary", value: "docs/** proposed", tone: "pending" },
          { label: "Tool permission", value: "No tool expansion", tone: "pass" },
          { label: "Data access", value: "No new classification", tone: "pass" },
          { label: "Cost budget", value: "No budget expansion", tone: "pass" },
          { label: "Approval authority", value: "No approval authority expansion", tone: "pass" },
        ],
        reviews: [
          { reviewer: "AUDITOR", focus: "Correctness, tests, and evidence", decision: "requires_human_approval" },
          { reviewer: "WARDEN", focus: "Safety, privacy, and permission expansion", decision: "requires_human_approval" },
        ],
        approvalGate: {
          currentState: "requires_human_approval",
          requiredHumanApproval: true,
          approvedForApply: false,
          disabledReason: "Agent definition updates cannot be applied without completed reviews and human approval.",
        },
        versioning: {
          previousVersion: "1.0.0",
          proposedVersion: "1.0.1-dry-run",
          rollbackStatus: "Rollback plan recorded",
          rollbackExecutionEnabled: false,
        },
      },
    },
    memoryCenter: {
      mode: shellMode,
      sourceLabel: "scoped memory fixtures + packet preview",
      runtimeInjectionEnabled: false,
      providerDispatchEnabled: false,
      dbWritesEnabled: false,
      rawContentVisible: false,
      activeProjectLabel: safeProjectDisplayName,
      memoryItems,
      freshness: memoryFreshness,
      promotionCandidates: memoryPromotionCandidates,
      packetPreview: memoryPacket,
      packetSummary: summarizeMemoryPacket(memoryPacket),
      overview: {
        totalItems: memoryItems.length,
        osItems: memoryItems.filter((item) => item.scope === "nexus_os").length,
        projectItems: memoryItems.filter((item) => item.scope === "project").length,
        agentItems: memoryItems.filter((item) => item.scope === "global_agent").length,
        taskItems: memoryItems.filter((item) => item.scope === "task").length,
        sessionItems: memoryItems.filter((item) => item.scope === "session").length,
        staleItems: memoryFreshness.filter((item) => item.stale).length,
        promotionCandidates: memoryPromotionCandidates.length,
      },
      safetyNotes: [
        "Memory Center is read-only.",
        "No source payloads, secrets, prompt payloads, or logs are displayed.",
        "Runtime memory injection is not enabled.",
        "Provider/tool dispatch remains disabled.",
      ],
    },
    missionComposer: {
      title: "Active Mission",
      subtitle: "Review the governed mission summary and move the current scope through planning, review, and validation.",
      placeholder: "Describe what you want to build...",
      missionText: "Build the private project through governed planning, validation, privacy review, and controlled implementation.",
      missionDisplayName: activeMissionDisplayName,
      missionId: activeMissionId,
      projectLabel: safeProjectDisplayName,
      mode: shellMode,
      readOnly: true,
      readOnlyNote: "Read-only until mission edit workflow is enabled.",
      generatedPlanReady: false,
      approvedTaskPlanReady: false,
      bridgeReady: abSnapshot?.bridgeReadiness?.status === "READY",
      buttons: [
        { label: "Generate Plan", enabled: false, reason: "Requires governed action bridge" },
        { label: "Create Project Brief", enabled: false, reason: "Requires generated mission plan" },
        { label: "Start Governed Run", enabled: false, reason: "Requires approved task plan" },
      ],
      contractPath: "contracts/projects/careloop/phase-2-mission-contract.json",
      taskPlanPath: "contracts/projects/careloop/phase-2-task-plan.json",
      taskCount: plannedMissionTasks.length,
      nextAction: careloopPhase2.nextAction || "Review Phase 2 task plan",
    },
    mission: {
      displayName: activeMissionDisplayName,
      founderIntent: "Validate the founder's startup idea through clarifying Q&A, feasibility review, PRD creation, agent assignments, and governed business buildout.",
      quote: "Do not build blindly. Understand the business, prove feasibility, create the PRD, assign agents, then execute through gates.",
      sprintId: CARELOOP_PHASE_STATUS.activePhase || "CARELOOP-P2",
      sprintDay: "Planning start",
      lead: "SHEPHERD",
      lifecycle: [
        { label: "Idea intake", state: "Ready", owner: "NEXUS", nextAction: "Capture raw idea, customer, problem, and constraints." },
        { label: "Founder Q&A", state: "Needs answers", owner: "SHEPHERD", nextAction: "Ask only blocking questions needed to understand the business." },
        { label: "Feasibility validation", state: "Preview", owner: "MERIDIAN + RADAR", nextAction: "Validate market, business model, risk, and technical feasibility." },
        { label: "PRD creation", state: "Planned", owner: "ATLAS", nextAction: "Create PRD with assumptions, risks, acceptance criteria, and evidence requirements." },
        { label: "Agent execution", state: "Governed", owner: "SHEPHERD", nextAction: "Assign agents only after contracts, scope, and gates exist." },
        { label: "Business buildout", state: "Gated", owner: "NEXUS", nextAction: "Advance product, operations, growth, release, and support through evidence." },
      ],
      sprintProgress: studio.gateProgress || 15,
      releaseStatus: "NO-GO",
      releaseBlocker: "Release/deploy execution disabled until Phase 2 gates and later platform phases are complete",
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
      missionId: activeMissionId,
      projectId: "careloop",
      missionTasks: plannedMissionTasks,
      nextTask: plannedMissionTasks[0],
      activatedCount: activeTaskCount,
      plannedCount: plannedMissionTasks.length,
      activationPolicy: { allowed: false, requiresBridge: true, disabledReason: "CareLoop Phase 2 tasks are planning-only until operator approval and safe activation are enabled." },
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
      controlledMutationReadiness: createControlledMutationReadinessCard(),
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
      mode: shellMode,
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
    contextCenter: {
      mode: shellMode,
      sourceLabel: "trusted context registry + packet preview",
      activeProjectLabel: safeProjectDisplayName,
      registryVersion: "1.0",
      dataSources: trustedContextSources,
      sourceSummary: {
        total: trustedContextSources.length,
        os: trustedContextSources.filter((source) => source.scope === "os").length,
        project: trustedContextSources.filter((source) => source.scope === "project").length,
        runtime: trustedContextSources.filter((source) => ["runtime", "task"].includes(source.scope)).length,
        safety: trustedContextSources.filter((source) => source.scope === "safety").length,
      },
      systemOfRecord: [
        {
          domain: "project_requirements",
          primarySourceId: "project-registry",
          owner: "Project Owner",
          freshnessRequirement: "manual_verified",
          allowedScopes: ["project", "mission", "task"],
          agentAccessNotes: "Use redacted project summaries only; raw project docs stay excluded.",
        },
        {
          domain: "task_state",
          primarySourceId: "runtime-tasks",
          owner: "NEXUS",
          freshnessRequirement: "runtime_snapshot",
          allowedScopes: ["task", "mission", "project"],
          agentAccessNotes: "Task state is read-only metadata until governed runtime execution exists.",
        },
        {
          domain: "evidence",
          primarySourceId: "evidence-ledger",
          owner: "AUDITOR",
          freshnessRequirement: "append_only_ledger",
          allowedScopes: ["task", "mission", "project", "os"],
          agentAccessNotes: "Evidence summaries may be referenced; raw payloads stay excluded.",
        },
        {
          domain: "policy",
          primarySourceId: "policy-files",
          owner: "WARDEN",
          freshnessRequirement: "manual_verified",
          allowedScopes: ["safety", "os", "project", "task"],
          agentAccessNotes: "Policy context is summarized; raw policy JSON is not primary UI content.",
        },
      ],
      trustScores: trustedContextScores,
      trustBands,
      freshness: trustedContextFreshness,
      packetPreview: trustedContextPacket,
      packetSummary: {
        included: trustedContextPacket.includedSources.length,
        excluded: trustedContextPacket.excludedSources.length,
        rawContentIncluded: false,
        redacted: true,
      },
      exclusions: trustedContextPacket.excludedSources,
      safetyNotes: [
        "Summaries only; raw source content is hidden.",
        "Demo/public modes cannot include private project sources.",
        "Provider, tool, worker, DB write, and runtime agent injection remain disabled.",
      ],
    },
    agentMesh: {
      mode: shellMode,
      sourceLabel: "agent mesh local runtime snapshot + safe fallback",
      coordinationRule: "Agents coordinate through NEXUS governance, not direct free chat.",
      safetyCopy: "Messages are scoped, redacted, audited, and policy-checked.",
      disabledRuntimeCopy: "Provider/tool/worker dispatch is not enabled by P48.",
      overview: {
        rooms: 3,
        messages: 3,
        handoffs: 2,
        contextSyncSummaries: 1,
        rawPayloadsVisible: false,
        taskMutationEnabled: false,
        dispatchEnabled: false,
      },
      rooms: [
        {
          roomId: "room-p48-validation",
          roomType: "validation_room",
          title: "P48 Validation Room",
          scope: "NEXUS_OS_CHANGE",
          status: "closed",
          ownerAgent: "NEXUS",
          participants: ["NEXUS", "AUDITOR", "SENTINEL", "WARDEN"],
          messageCount: 3,
          handoffCount: 2,
          contextStatus: "Summary available",
        },
        {
          roomId: "room-p48-context-sync",
          roomType: "os_update_room",
          title: "P48 Context Sync Room",
          scope: "NEXUS_OS_CHANGE",
          status: "open",
          ownerAgent: "NEXUS",
          participants: ["NEXUS", "WARDEN", "AUDITOR"],
          messageCount: 0,
          handoffCount: 0,
          contextStatus: "Policy-scoped summary",
        },
        {
          roomId: "room-future-project-handoff",
          roomType: "task_room",
          title: "Future Project Task Room",
          scope: "PROJECT_CHANGE",
          status: "planned",
          ownerAgent: "SHEPHERD",
          participants: ["SHEPHERD", "CORE", "AUDITOR"],
          messageCount: 0,
          handoffCount: 0,
          contextStatus: "Planned until Project Registry is enabled",
        },
      ],
      messages: [
        {
          messageId: "meshmsg-p48-2-validation",
          roomId: "room-p48-validation",
          fromAgent: "NEXUS",
          toAgent: "AUDITOR",
          messageType: "review_request",
          payloadSummary: "Request redacted review of governed mesh message bus validation.",
          policyDecision: "ALLOW_METADATA_ONLY",
          redacted: true,
        },
        {
          messageId: "meshmsg-handoff-p48-validation",
          roomId: "room-p48-validation",
          fromAgent: "SHEPHERD",
          toAgent: "AUDITOR",
          messageType: "handoff_request",
          payloadSummary: "Governed handoff requested for mesh handoff evidence review.",
          policyDecision: "ALLOW_METADATA_ONLY",
          redacted: true,
        },
        {
          messageId: "meshmsg-handoff-p48-reject-validation",
          roomId: "room-p48-validation",
          fromAgent: "CORE",
          toAgent: "WARDEN",
          messageType: "handoff_request",
          payloadSummary: "Governed handoff requested for a policy review scenario.",
          policyDecision: "ALLOW_METADATA_ONLY",
          redacted: true,
        },
      ],
      handoffs: [
        {
          handoffId: "handoff-p48-validation",
          fromAgent: "SHEPHERD",
          toAgent: "AUDITOR",
          status: "approved",
          reason: "Governed review of mesh handoff evidence.",
          requiredNextEvidence: ["handoff-decision-record"],
          taskOwnershipMutated: false,
        },
        {
          handoffId: "handoff-p48-reject-validation",
          fromAgent: "CORE",
          toAgent: "WARDEN",
          status: "rejected",
          reason: "Validation scenario for blocked handoff review.",
          requiredNextEvidence: ["policy-review-record"],
          taskOwnershipMutated: false,
        },
      ],
      contextSync: {
        roomId: "room-p48-context-sync",
        allowedContext: trustedContextPacket.includedSources.map((source) => ({
          sourceId: source.sourceId,
          label: source.label,
          trustBand: source.trustBand,
          freshnessStatus: source.freshnessStatus,
          summaryOnly: true,
        })),
        excludedContext: trustedContextPacket.excludedSources,
        staleContext: trustedContextPacket.includedSources.filter((source) => source.freshnessStatus !== "fresh"),
        rawContextIncluded: false,
        runtimeAgentInjectionAllowed: false,
      },
      policyDecisions: [
        "Direct agent-to-agent free chat is disabled.",
        "Task ownership is not mutated by mesh messages or handoffs.",
        "Private project context is blocked from demo and public-safe modes.",
        "Provider, tool, worker, DB write, and project mutation remain disabled.",
      ],
    },
    qualityIntelligence: {
      phase: "P56.6",
      mode: "preview-only",
      source: "P56 quality-intelligence metadata modules",
      executionEnabled: false,
      testGenerationEnabled: false,
      projectMutationAllowed: false,
      providerCallsAllowed: false,
      toolExecutionAllowed: false,
      workerRuntimeAllowed: false,
      dbWritesAllowed: false,
      externalNetworkCallsAllowed: false,
      privateSourceContentScanned: false,
      prdTestMap,
      prdCoverageSummary,
      coverageGaps,
      coverageGapSummary,
      gapRecommendations,
      flakyTestRecords,
      flakyTestSummary,
      flakyTestActions,
      testRecommendations,
      testRecommendationSummary,
      testProposals,
      safetyNotes: [
        "Preview-only: NEXUS does not run tests from Quality Intelligence.",
        "Proposal-only: missing test coverage creates governed proposals, not files.",
        "No private project source content is scanned by this view model.",
      ],
    },
    commandPalette: {
      title: "NEXUS Command Palette",
      keyboardHint: "Cmd/Ctrl+K",
      primaryActionIds: ["plan", "review", "qa", "explain"],
      secondaryActionIds: ["fix", "ship", "guard", "freeze", "retro"],
      summary:
        "Use the command palette to preview governed operator actions without bypassing current safety boundaries.",
    },
    commandInterface: {
      title: "Conversational NEXUS Command Interface",
      helpText: "Commands are route-first previews until worker/provider/tool execution is enabled.",
      selectedScope: "Project",
      selectedProjectLabel: safeProjectDisplayName,
      noProjectBlockedReason: "Select or create a project first.",
      safetyPosture: {
        executionEnabled: false,
        providerCallsAllowed: false,
        toolExecutionAllowed: false,
        workerExecutionAllowed: false,
        dbWritesAllowed: false,
        projectMutationAllowed: false,
        releaseDeployAllowed: false,
      },
      previewCommands: [
        {
          command: "Plan",
          intent: "Turn a goal into a governed mission plan.",
          route: "Mission Control",
          risk: "low",
          approval: "not required",
          status: "Preview ready",
          blockedReason: "",
          nextAction: "Preview route and approval requirements before execution.",
        },
        {
          command: "Review",
          intent: "Review task output, evidence, and blockers.",
          route: "Agent Workbench",
          risk: "medium",
          approval: "recommended",
          status: "Preview ready",
          blockedReason: "",
          nextAction: "Open review context when a task is activated.",
        },
        {
          command: "QA",
          intent: "Preview approved validation gates.",
          route: "Test Center",
          risk: "medium",
          approval: "blocked until capability ready",
          status: "Blocked",
          blockedReason: "Requires controlled validation bridge.",
          nextAction: "Inspect validation prerequisites before any future run.",
        },
        {
          command: "Fix",
          intent: "Prepare a safe fix preview for a known failure.",
          route: "Implementation Workflow",
          risk: "high",
          approval: "required before execution",
          status: "Blocked",
          blockedReason: "Requires failing validation evidence.",
          nextAction: "Collect validation evidence, then preview controlled implementation.",
        },
        {
          command: "Ship",
          intent: "Prepare release readiness and release evidence.",
          route: "Release Control",
          risk: "high",
          approval: "blocked until capability ready",
          status: "Blocked",
          blockedReason: "Requires release action bridge.",
          nextAction: "Inspect release blockers; deployment execution is not enabled.",
        },
        {
          command: "Guard",
          intent: "Review the active scope boundary.",
          route: "Safety Center",
          risk: "medium",
          approval: "recommended",
          status: "Read-only",
          blockedReason: "",
          nextAction: "Open Safety Center for scope and policy posture.",
        },
        {
          command: "Freeze",
          intent: "Preview runtime freeze requirements.",
          route: "Worker Runtime",
          risk: "high",
          approval: "blocked until capability ready",
          status: "Blocked",
          blockedReason: "Requires runtime lock controls.",
          nextAction: "Inspect lock preview; runtime freeze is not enabled.",
        },
        {
          command: "Retro",
          intent: "Summarize recent activity, blockers, lessons learned, and next actions.",
          route: "Activity Log",
          risk: "low",
          approval: "not required",
          status: "Read-only",
          blockedReason: "",
          nextAction: "Show read-only activity and evidence summary.",
        },
        {
          command: "Explain",
          intent: "Explain current state, blockers, and next actions.",
          route: "Mission Control",
          risk: "low",
          approval: "not required",
          status: "Preview ready",
          blockedReason: "",
          nextAction: "Show read-only local state summary.",
        },
      ],
      recentTimeline: [
        {
          commandId: "cmd_record_seed",
          correlationId: "corr_command_preview_seed",
          commandText: "Explain current NEXUS state",
          intentType: "explain_status",
          routeStatus: "preview",
          redacted: true,
        },
      ],
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
    projectOperatingSurface,
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
  const prdTestMap = buildPrdTestMap({ projectId: "private-project" });
  const prdCoverageSummary = summarizePrdTestCoverage(prdTestMap);
  const coverageGaps = detectCoverageGaps(prdTestMap, []);
  const coverageGapSummary = summarizeCoverageGaps(coverageGaps);
  const gapRecommendations = buildGapRecommendations(coverageGaps);
  const flakyTestRecords = buildFlakyTestRecords([]);
  const flakyTestSummary = summarizeFlakyTests(flakyTestRecords);
  const flakyTestActions = recommendFlakyTestActions(flakyTestRecords);
  const testRecommendations = recommendTestsForChange({
    changedFiles: ["dashboard/src/pages/CommandCenterV2.jsx", "quality-intelligence/prdTestMapper.js"],
    coverageGaps,
  });
  const testRecommendationSummary = summarizeTestRecommendations(testRecommendations);
  const testProposals = listTestProposalPreview({
    projectId: "private-project",
    gaps: coverageGaps.length ? coverageGaps.slice(0, 3) : undefined,
  });

  return {
    shell: {
      mode: "local-private",
      environment: "Prototype",
      activeProject: studio.activeProject?.name || "Selected Project",
    },
    mission: {
      founderIntent: "Validate the founder's startup idea, produce a PRD, assign agents, and build the business through governed execution.",
      sprintId: "Sprint 2026.18",
      lead: "SHEPHERD",
      lifecycle: [
        { label: "Idea intake", state: "Ready", owner: "NEXUS", nextAction: "Capture raw idea and target customer." },
        { label: "Founder Q&A", state: "Needs answers", owner: "SHEPHERD", nextAction: "Ask clarifying business questions." },
        { label: "Feasibility validation", state: "Preview", owner: "MERIDIAN + RADAR", nextAction: "Validate business and market assumptions." },
        { label: "PRD creation", state: "Planned", owner: "ATLAS", nextAction: "Draft PRD and acceptance criteria." },
        { label: "Agent execution", state: "Governed", owner: "SHEPHERD", nextAction: "Assign bounded agent work." },
        { label: "Business buildout", state: "Gated", owner: "NEXUS", nextAction: "Advance product, release, growth, and operations." },
      ],
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
    projectTestSuites: {
      total: 5,
      executionEnabled: false,
      byLayer: { backend: 1, ios: 1, policy: 2, release: 1 },
      byStatus: { ready: 1, planned: 4 },
      projectIds: ["careloop"],
      suites: [
        { suiteId: "careloop-backend-validation", layer: "backend", tool: "npm", riskLevel: "medium", status: "ready", commandPreview: "npm test", forbiddenInDemo: true },
        { suiteId: "careloop-ios-readiness", layer: "ios", tool: "xcodebuild", riskLevel: "high", status: "planned", commandPreview: "xcodebuild test -scheme CareLoop ...", forbiddenInDemo: true },
        { suiteId: "careloop-prd-acceptance", layer: "policy", tool: "none", riskLevel: "medium", status: "planned", commandPreview: "(manual PRD acceptance checklist)", forbiddenInDemo: true },
        { suiteId: "careloop-privacy-compliance", layer: "policy", tool: "none", riskLevel: "high", status: "planned", commandPreview: "(review-only: FTC compliance checklist)", forbiddenInDemo: true },
        { suiteId: "careloop-release-readiness", layer: "release", tool: "none", riskLevel: "critical", status: "planned", commandPreview: "(release gate: all gates PASS)", forbiddenInDemo: true },
      ],
    },
    testSuiteManager: {
      policyPhase: "P55",
      executionEnabled: false,
      registryOnly: true,
      projectTestCount: 5,
      osTestCount: 15,
      selectedProjectSuites: [
        { suiteId: "careloop-backend-validation", layer: "backend", tool: "npm", riskLevel: "medium", status: "ready", commandPreview: "npm test", forbiddenInDemo: true },
        { suiteId: "careloop-ios-readiness", layer: "ios", tool: "xcodebuild", riskLevel: "high", status: "planned", commandPreview: "xcodebuild test -scheme CareLoop ...", forbiddenInDemo: true },
        { suiteId: "careloop-prd-acceptance", layer: "policy", tool: "none", riskLevel: "medium", status: "planned", commandPreview: "(manual PRD acceptance checklist)", forbiddenInDemo: true },
        { suiteId: "careloop-privacy-compliance", layer: "policy", tool: "none", riskLevel: "high", status: "planned", commandPreview: "(review-only: FTC compliance checklist)", forbiddenInDemo: true },
        { suiteId: "careloop-release-readiness", layer: "release", tool: "none", riskLevel: "critical", status: "planned", commandPreview: "(release gate: all gates PASS)", forbiddenInDemo: true },
      ],
      osSuites: [
        { suiteId: "os-command-center-route-tests", layer: "ui", tool: "playwright", ownerAgent: "AUDITOR", status: "ready" },
        { suiteId: "os-public-private-demo-boundary-checks", layer: "policy", tool: "node-script", ownerAgent: "AUDITOR", status: "ready" },
        { suiteId: "os-project-registry-checks", layer: "policy", tool: "node-script", ownerAgent: "AUDITOR", status: "ready" },
        { suiteId: "os-scope-boundary-checks", layer: "policy", tool: "node-script", ownerAgent: "AUDITOR", status: "ready" },
        { suiteId: "os-agent-boundary-checks", layer: "policy", tool: "node-script", ownerAgent: "AUDITOR", status: "ready" },
        { suiteId: "os-memory-trusted-context-checks", layer: "runtime", tool: "node-script", ownerAgent: "AUDITOR", status: "ready" },
        { suiteId: "os-mesh-checks", layer: "runtime", tool: "node-script", ownerAgent: "AUDITOR", status: "ready" },
        { suiteId: "os-skill-registry-checks", layer: "policy", tool: "node-script", ownerAgent: "AUDITOR", status: "ready" },
        { suiteId: "os-hook-registry-checks", layer: "policy", tool: "node-script", ownerAgent: "AUDITOR", status: "ready" },
        { suiteId: "os-tool-mcp-governance-checks", layer: "policy", tool: "node-script", ownerAgent: "AUDITOR", status: "ready" },
        { suiteId: "os-trigger-gateway-checks", layer: "api", tool: "node-script", ownerAgent: "AUDITOR", status: "ready" },
        { suiteId: "os-api-batch-adapter-checks", layer: "api", tool: "node-script", ownerAgent: "AUDITOR", status: "ready" },
        { suiteId: "os-db-foundation-checks", layer: "db", tool: "node-script", ownerAgent: "AUDITOR", status: "ready" },
        { suiteId: "os-activity-observability-checks", layer: "runtime", tool: "node-script", ownerAgent: "AUDITOR", status: "ready" },
        { suiteId: "os-docs-diagram-readability-checks", layer: "docs", tool: "node-script", ownerAgent: "AUDITOR", status: "ready" },
      ],
      selectionPreview: {
        executionEnabled: false,
        selectedSuites: 0,
        reason: "No changed files in current snapshot",
      },
      evidenceModel: {
        supported: true,
        executionEnabled: false,
      },
      gaps: [
        {
          title: "Test execution is not enabled",
          why: "P55 is registry and visibility only. No execution runtime has been wired or approved yet.",
          nextAction: "Enable controlled test execution in a future governed phase (P56+) with SENTINEL oversight.",
          owner: "SENTINEL",
        },
        {
          title: "iOS test runner not configured",
          why: "xcodebuild requires a macOS runner with Xcode installed and a provisioned simulator.",
          nextAction: "Configure Xcode runner environment and update iOS suite to executionEnabled: true when ready.",
          owner: "SWIFT",
        },
      ],
    },
    qualityIntelligence: {
      phase: "P56.6",
      mode: "preview-only",
      source: "P56 quality-intelligence metadata modules",
      executionEnabled: false,
      testGenerationEnabled: false,
      projectMutationAllowed: false,
      providerCallsAllowed: false,
      toolExecutionAllowed: false,
      workerRuntimeAllowed: false,
      dbWritesAllowed: false,
      externalNetworkCallsAllowed: false,
      privateSourceContentScanned: false,
      prdTestMap,
      prdCoverageSummary,
      coverageGaps,
      coverageGapSummary,
      gapRecommendations,
      flakyTestRecords,
      flakyTestSummary,
      flakyTestActions,
      testRecommendations,
      testRecommendationSummary,
      testProposals,
      safetyNotes: [
        "Preview-only: NEXUS does not run tests from Quality Intelligence.",
        "Proposal-only: missing test coverage creates governed proposals, not files.",
        "No private project source content is scanned by this view model.",
      ],
    },
  };
}
