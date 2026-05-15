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
  const safeProjectDisplayName = shellMode === "local-private"
    ? "Private Project"
    : (studio.activeProject?.name || "Demo Project");
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
  const projectOperatingSurface = {
    selectedProjectLabel: "Private Project",
    selectedProjectType: "SaaS + Mobile",
    selectedProjectStatus: "Active",
    selectedProjectMode: "local-private",
    stackSummary: "Node/Fastify + Prisma + iOS",
    activeMissionLabel: "Private Project Governed Build Mission",
    sourceLabel: "Project Registry snapshot",
    portfolioSummary: {
      totalProjects: 1,
      registeredProjects: 1,
      activeProjects: 1,
      projectsNeedingSetup: 0,
      blockedProjects: blockedTaskCount > 0 ? 1 : 0,
      pendingApprovals: runtimeApprovals.requested || 0,
      readyForValidation: 1,
      selectedProject: "Private Project",
      pinnedProjects: ["Private Project"],
      recentProjects: ["Private Project"],
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
      { name: "Planning", status: "Available", tone: "pass", description: "Turn project goals into governed mission and project plans.", nextAction: "Start a mission or generate a project brief.", owner: "SHEPHERD", required: "Mission composer" },
      { name: "Backend validation", status: "Ready", tone: "pass", description: "Approved local checkers can validate backend-facing readiness.", nextAction: "Run approved backend validation from a local terminal.", owner: "SENTINEL", required: "Backend checker" },
      { name: "iOS validation", status: "Requires setup", tone: "pending", description: "Mobile validation needs a governed local macOS/Xcode runner.", nextAction: "Prepare iOS validation setup.", owner: "SWIFT", required: "iOS/Xcode runner" },
      { name: "Android validation", status: "Not configured", tone: "disabled", description: "No Android project profile or runner is configured.", nextAction: "Add Android profile metadata before validation.", owner: "SENTINEL", required: "Android runner" },
      { name: "Web validation", status: "Ready", tone: "pass", description: "Dashboard build and page tests cover current web validation.", nextAction: "Run dashboard build and page tests when UI changes.", owner: "AUDITOR", required: "Playwright + build" },
      { name: "Controlled implementation", status: "Requires approval", tone: "pending", description: "Scoped implementation flows are represented while broad project mutation stays off.", nextAction: "Use documentation-only or explicitly scoped implementation paths.", owner: "CORE", required: "Implementation bridge" },
      { name: "Evidence/audit", status: "Available", tone: "pass", description: "Governed actions and checks produce redacted evidence summaries.", nextAction: "View project evidence after validation or review.", owner: "AUDITOR", required: "Evidence ledger" },
      { name: "Release readiness", status: "Not enabled yet", tone: "pending", description: "Release execution requires gates, evidence, and explicit release controls.", nextAction: "Complete validation gates before release planning.", owner: "NEXUS", required: "Release action bridge" },
      { name: "Packaging/export safety", status: "Ready", tone: "pass", description: "Packaging safety boundaries prevent NEXUS OS internals from shipping with projects.", nextAction: "Review blocked roots before any export dry run.", owner: "WARDEN", required: "Packaging policy" },
      { name: "Cost tracking", status: "Not enabled yet", tone: "disabled", description: "Project-level cost enforcement is planned and provider dispatch is off.", nextAction: "Keep provider spend disabled until Cost Center enforcement lands.", owner: "NEXUS", required: "Cost Center" },
    ],
    milestones: [
      { title: "Project registry foundation", status: "Complete", tone: "pass", summary: "Read-only registry, profile, and selected-project metadata are available." },
      { title: "Stack profile inventory", status: "Available", tone: "pass", summary: "Backend, web, mobile, DB, testing, and tooling expectations are summarized." },
      { title: "Capability matrix", status: "Available", tone: "pass", summary: "Project capability posture and blocked runtime areas are visible." },
      { title: "Adapter runtime", status: "Disabled by policy", tone: "disabled", summary: "Adapter execution and source mutation are not enabled." },
    ],
    openGaps: [
      { title: "iOS/Xcode runner is not configured", why: "Mobile release confidence requires a governed local runner before iOS validation is meaningful.", status: "Requires runner", tone: "pending", nextAction: "Prepare an approved iOS/Xcode runner.", owner: "SWIFT", enablingCapability: "iOS/Xcode runner" },
      { title: "Provider dispatch is not enabled", why: "NEXUS must have governance, cost, and recovery controls before provider-backed actions run.", status: "Not enabled yet", tone: "disabled", nextAction: "Keep provider-backed execution disabled until governed dispatch lands.", owner: "NEXUS", enablingCapability: "Governed provider dispatch" },
      { title: "Project adapter runtime is disabled", why: "Project adapters can affect source boundaries and require explicit approval controls before execution.", status: "Disabled by policy", tone: "disabled", nextAction: "Use read-only profile and capability surfaces until adapter execution is approved.", owner: "WARDEN", enablingCapability: "Adapter runtime controls" },
      { title: "Project Registry is single-project in this shell", why: "Portfolio operations need a real multi-project registry and adapter lifecycle before aggregation is live.", status: "Planned", tone: "pending", nextAction: "Treat portfolio cards as operating posture, not fabricated cross-project data.", owner: "NEXUS", enablingCapability: "Project Registry adapter runtime" },
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
      { title: "Latest project evidence", status: "Available", tone: "pass", summary: "Validation and Command Center checks are summarized as redacted evidence.", linkedAction: "Project readiness validation", redacted: "Yes" },
      { title: "Validation evidence", status: "Available", tone: "pass", summary: `${pvBackend.testsPassed ?? 58}/${pvBackend.totalTests ?? 58} approved backend checks passed in the current snapshot.`, linkedAction: "Backend validation", redacted: "Yes" },
      { title: "Release/package evidence", status: "Not ready", tone: "pending", summary: "Release package evidence appears after governed release and packaging checks.", linkedAction: "Release readiness", redacted: "Yes" },
    ],
    developerDetails: [
      { label: "Project ID", value: "private-project-01" },
      { label: "Mission ID", value: "private-project-governed-build-mission" },
      { label: "Profile path", value: "project-registry/examples/private-project.nexus.project.json" },
      { label: "Release manifest", value: "artifacts/project-release/private-project-release-manifest.json" },
    ],
  };
  const activeMissionId = "private-project-governed-build-mission";
  const activeMissionDisplayName = humanizeMissionId(activeMissionId);
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
      projectId: "private-project-01",
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
      selectedProjectId: "private-project-01",
      selectedProjectLabel: safeProjectDisplayName,
      pinnedProjectIds: ["private-project-01"],
    },
    scopeModel: {
      workspaceScope: "project",
      selectedProjectId: "private-project-01",
      selectedProjectLabel: safeProjectDisplayName,
      pinnedProjectIds: ["private-project-01"],
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
        projectId: "private-project-01",
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
      contractPath: "contracts/missions/private-project-mission-contract.json",
      taskPlanPath: "contracts/missions/private-project-task-plan.json",
      taskCount: 6,
      nextAction: "Generate plan from the read-only mission prompt",
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
