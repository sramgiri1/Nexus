import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const MODE = process.env.NEXUS_MODE || "local-private";
const NOW = new Date().toISOString();

const TASKS = [
  {
    taskId: "careloop-p2-task-01-product-brief",
    title: "Phase 2 Product Brief",
    ownerAgent: "SHEPHERD",
    supportAgents: ["PRISM", "NEXUS"],
    capabilityId: "orchestration.plan_flow",
    riskLevel: "medium",
    purpose: "Summarize Phase 2 goals, dependencies, and operator handoff points.",
    mutationAllowed: false,
    executionAllowed: false,
    requiredEvidence: ["Phase 2 mission contract", "CareLoop PRD summary"],
    blockedUntil: "Governed planning review",
    nextRecommendedAction: "Review Phase 2 task plan in Command Center.",
  },
  {
    taskId: "careloop-p2-task-02-prd-gap-review",
    title: "PRD Gap Review",
    ownerAgent: "PRISM",
    supportAgents: ["AUDITOR"],
    capabilityId: "product.prd_review",
    riskLevel: "medium",
    purpose: "Compare the current PRD and local status against Phase 2 goals.",
    mutationAllowed: false,
    executionAllowed: false,
    requiredEvidence: ["PRD version and sprint gap audit"],
    blockedUntil: "Product owner confirms Phase 2 scope freeze",
    nextRecommendedAction: "Confirm which PRD gaps are first implementation candidates.",
  },
  {
    taskId: "careloop-p2-task-03-backend-validation-readiness",
    title: "Backend Validation Readiness",
    ownerAgent: "SENTINEL",
    supportAgents: ["AUDITOR"],
    capabilityId: "verification.code_quality_gate",
    riskLevel: "medium",
    purpose: "Confirm backend test suite baseline and next test gaps without running tests.",
    mutationAllowed: false,
    executionAllowed: false,
    requiredEvidence: ["Existing backend validation report", "Test Suite Manager posture"],
    blockedUntil: "Controlled validation command selected",
    nextRecommendedAction: "Review existing backend validation artifacts before any new run.",
  },
  {
    taskId: "careloop-p2-task-04-privacy-safety-review",
    title: "Privacy and Safety Review",
    ownerAgent: "WARDEN",
    supportAgents: ["AUDITOR"],
    capabilityId: "security.privacy_review",
    riskLevel: "high",
    purpose: "Review privacy constraints, notes risk, public/demo separation, and secrets boundary.",
    mutationAllowed: false,
    executionAllowed: false,
    requiredEvidence: ["Privacy policy source", "Secrets boundary status", "Public/demo boundary check"],
    blockedUntil: "Privacy review checklist accepted",
    nextRecommendedAction: "Confirm sensitive-data handling before implementation planning.",
  },
  {
    taskId: "careloop-p2-task-05-ios-validation-readiness",
    title: "iOS Validation Readiness",
    ownerAgent: "SWIFT",
    supportAgents: ["SENTINEL"],
    capabilityId: "verification.ios_readiness",
    riskLevel: "medium",
    purpose: "Prepare iOS validation plan without running xcodebuild.",
    mutationAllowed: false,
    executionAllowed: false,
    requiredEvidence: ["iOS validation plan", "Xcode runner not-enabled status"],
    blockedUntil: "iOS/Xcode runner is approved for a later validation phase",
    nextRecommendedAction: "Document simulator/device validation requirements.",
  },
  {
    taskId: "careloop-p2-task-06-test-gap-proposal",
    title: "Test Gap Proposal",
    ownerAgent: "AUDITOR",
    supportAgents: ["SENTINEL"],
    capabilityId: "quality.test_gap_detection",
    riskLevel: "medium",
    purpose: "Use existing Test Suite Manager and Quality Intelligence outputs to identify Phase 2 test gaps.",
    mutationAllowed: false,
    executionAllowed: false,
    requiredEvidence: ["Quality Intelligence gap summary", "Test Suite Manager snapshot"],
    blockedUntil: "Gap review is accepted by operator",
    nextRecommendedAction: "Prioritize test gaps before source mutation.",
  },
  {
    taskId: "careloop-p2-task-07-implementation-candidates",
    title: "Controlled Implementation Candidate Selection",
    ownerAgent: "CORE",
    supportAgents: ["NEXUS"],
    capabilityId: "implementation.planning",
    riskLevel: "high",
    purpose: "Identify safe first implementation candidates for later controlled source mutation.",
    mutationAllowed: false,
    executionAllowed: false,
    requiredEvidence: ["PRD gap review", "Privacy and validation gates"],
    blockedUntil: "P67 controlled source mutation expansion and operator approval",
    nextRecommendedAction: "Select the smallest low-risk implementation candidate.",
  },
  {
    taskId: "careloop-p2-task-08-release-readiness-outline",
    title: "Release Readiness Outline",
    ownerAgent: "NEXUS",
    supportAgents: ["AUDITOR", "WARDEN"],
    capabilityId: "release.readiness_planning",
    riskLevel: "high",
    purpose: "Define what CareLoop needs before release/deploy phases.",
    mutationAllowed: false,
    executionAllowed: false,
    requiredEvidence: ["Release gate outline", "Privacy/security gate status", "Validation readiness"],
    blockedUntil: "P69/P70 release and deploy loops are enabled",
    nextRecommendedAction: "Keep release actions disabled and document launch blockers.",
  },
];

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function read(relativePath) {
  const path = join(ROOT, relativePath);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function write(relativePath, content) {
  const path = join(ROOT, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function writeJson(relativePath, value) {
  write(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function appendUniqueJsonl(relativePath, idField, record) {
  const source = read(relativePath);
  if (source.includes(`"${idField}":"${record[idField]}"`) || source.includes(`"${idField}": "${record[idField]}"`)) {
    return false;
  }
  write(relativePath, `${source}${source && !source.endsWith("\n") ? "\n" : ""}${JSON.stringify(record)}\n`);
  return true;
}

function updateProjectRegistry() {
  const registryPath = "project-registry/projects.json";
  const registry = JSON.parse(read(registryPath));
  const careloop = {
    projectId: "careloop",
    label: "CareLoop",
    displayLabel: "CareLoop",
    visibility: "local-private",
    scope: "project",
    status: "active",
    root: "projects/careloop",
    projectType: "saas-mobile",
    adapterId: "careloop-planned-adapter",
    stackProfileId: "careloop-local-stack",
    modeAllowed: ["local-private"],
    publicSafeLabel: "Private Project",
    localPrivateLabel: "CareLoop",
    demoOnly: false,
    localPrivateOnly: true,
    allowedRoots: ["projects/careloop"],
    forbiddenRoots: ["projects/careloop/src", "projects/careloop/prisma", "projects/careloop-ios"],
    docs: [
      "projects/careloop/docs/PRD.md",
      "projects/careloop/docs/NEXUS_CARELOOP_PHASE_2.md",
      "projects/careloop/docs/NEXUS_PROJECT_STATUS.md",
    ],
    testSuites: ["check:careloop-backend-validation", "check:careloop-validation-plan"],
    workflows: ["plan", "review", "qa", "privacy-review", "ios-readiness", "release-readiness"],
    releaseBoundary: {
      enabled: false,
      reason: "Release and deployment execution remain disabled until P69/P70.",
    },
    createdAt: NOW,
    updatedAt: NOW,
  };
  const index = registry.projects.findIndex((project) => project.projectId === "careloop");
  if (index >= 0) registry.projects[index] = { ...registry.projects[index], ...careloop };
  else registry.projects.splice(2, 0, careloop);
  registry.generatedAt = NOW;
  writeJson(registryPath, registry);
}

function buildMissionContract() {
  return {
    contractVersion: "1.0",
    contractType: "project_mission",
    projectId: "careloop",
    projectDisplayName: "CareLoop",
    mode: "local-private",
    phaseId: "CARELOOP-P2",
    title: "CareLoop Phase 2: Product Hardening and Validation",
    objective:
      "Start CareLoop Phase 2 as a governed NEXUS project mission focused on product hardening, validation readiness, privacy review, test coverage, and release preparation.",
    source: "nexus_command_center",
    owner: "local-operator",
    missionType: "project_phase_start",
    scope: "PROJECT_CHANGE_PLANNING",
    mutationAllowed: false,
    providerCallsAllowed: false,
    toolExecutionAllowed: false,
    dbWritesAllowed: false,
    deploymentAllowed: false,
    riskLevel: "medium",
    dataClassification: "confidential",
    agents: ["SHEPHERD", "PRISM", "CORE", "SWIFT", "SENTINEL", "AUDITOR", "WARDEN", "NEXUS"],
    acceptanceCriteria: [
      "CareLoop Phase 2 mission is visible in Command Center Projects and Mission Control",
      "Phase 2 task plan is created with agent ownership",
      "Phase 2 readiness gates are defined",
      "No CareLoop source files are modified",
      "No provider/tool/DB/deploy actions are executed",
      "Evidence, audit, and activity records are redacted and linked",
    ],
    createdAt: NOW,
  };
}

function buildTaskPlan() {
  return {
    planVersion: "1.0",
    projectId: "careloop",
    phaseId: "CARELOOP-P2",
    title: "CareLoop Phase 2 Governed Task Plan",
    status: "planned",
    mutationAllowed: false,
    executionAllowed: false,
    generatedAt: NOW,
    tasks: TASKS,
  };
}

function buildRoadmap() {
  return {
    projectId: "careloop",
    displayName: "CareLoop",
    activePhase: "CARELOOP-P2",
    updatedAt: NOW,
    phases: [
      {
        phaseId: "CARELOOP-P1",
        title: "Foundation and Backend Validation",
        status: "complete",
        summary:
          "Inventory, validation plan, command classification, backend validation, and known test remediation completed.",
      },
      {
        phaseId: "CARELOOP-P2",
        title: "Product Hardening and Validation",
        status: "in_progress",
        summary:
          "Begin governed product hardening, PRD gap review, validation readiness, privacy review, and release readiness planning.",
      },
      {
        phaseId: "CARELOOP-P3",
        title: "Controlled Implementation and Expanded Validation",
        status: "planned",
      },
      {
        phaseId: "CARELOOP-P4",
        title: "Release Preparation and Deployment Readiness",
        status: "planned",
      },
    ],
  };
}

function buildPhaseStatus() {
  return {
    projectId: "careloop",
    displayName: "CareLoop",
    activePhase: "CARELOOP-P2",
    activeMission: "CareLoop Phase 2",
    status: "in_progress",
    nextAction: "Review Phase 2 task plan",
    generatedAt: NOW,
    missionContractPath: "contracts/projects/careloop/phase-2-mission-contract.json",
    taskPlanPath: "contracts/projects/careloop/phase-2-task-plan.json",
    readinessReportPath: "reports/careloop-phase-2-readiness.json",
    mutationAllowed: false,
    providerCallsAllowed: false,
    toolExecutionAllowed: false,
    dbWritesAllowed: false,
    deploymentAllowed: false,
    taskCounts: {
      planned: TASKS.length,
      active: 0,
      blocked: TASKS.filter((task) => task.blockedUntil).length,
      complete: 0,
    },
  };
}

function buildReadiness(prdSource) {
  const requiredSignals = [
    "Product Vision",
    "Role Permissions",
    "Sprint 2",
    "Privacy",
    "APNs",
    "StoreKit",
  ];
  const presentSignals = requiredSignals.filter((signal) => prdSource.includes(signal));
  return {
    generatedAt: NOW,
    projectId: "careloop",
    phaseId: "CARELOOP-P2",
    prdClearEnoughToStart: presentSignals.length >= 5,
    prdSignalsFound: presentSignals,
    clarityAssessment:
      "The PRD is clear enough to start Phase 2 planning and readiness gates. It is not a source-mutation-ready implementation contract by itself.",
    implementationGaps: [
      "Phase 2 source changes need a dedicated controlled implementation subphase.",
      "Live APNs, Resend, Railway, Prisma migration, and iOS/Xcode validation require explicit operator approval and environment readiness.",
      "Privacy and invite-delivery hardening need acceptance tests before implementation.",
    ],
    readinessGates: [
      { gate: "PRD gap review", status: "pending" },
      { gate: "Backend validation readiness", status: "pending" },
      { gate: "Privacy and safety review", status: "pending" },
      { gate: "iOS validation readiness", status: "pending" },
      { gate: "Release readiness outline", status: "pending" },
    ],
    execution: {
      mutationAllowed: false,
      providerCallsAllowed: false,
      toolExecutionAllowed: false,
      dbWritesAllowed: false,
      deploymentAllowed: false,
      testsRun: false,
      xcodeRun: false,
    },
  };
}

function writeDocs(taskPlan) {
  const taskLines = taskPlan.tasks
    .map((task) => `- ${task.title}: ${task.ownerAgent}${task.supportAgents.length ? ` + ${task.supportAgents.join(", ")}` : ""} — ${task.purpose}`)
    .join("\n");
  const phase2Doc = [
    "# NEXUS CareLoop Phase 2",
    "",
    "## Purpose",
    "",
    "Start CareLoop Phase 2 as a governed NEXUS project mission for product hardening, validation readiness, privacy review, test coverage, and release preparation.",
    "",
    "## Goals",
    "",
    "- Review the PRD and current local status before source mutation.",
    "- Define validation, privacy, iOS, and release readiness gates.",
    "- Select safe implementation candidates for a later controlled source mutation phase.",
    "- Keep provider calls, tool execution, DB writes, deployment, and project mutation disabled.",
    "",
    "## Task Plan",
    "",
    taskLines,
    "",
    "## Readiness Gates",
    "",
    "- PRD gap review",
    "- Backend validation readiness",
    "- Privacy and safety review",
    "- iOS validation readiness",
    "- Test gap proposal",
    "- Release readiness outline",
    "",
    "## Not Enabled Yet",
    "",
    "- CareLoop source mutation",
    "- Prisma migrations or DB writes",
    "- Provider/tool/MCP execution",
    "- iOS/Xcode execution",
    "- Deployment or release execution",
    "",
    "## Next Platform Dependencies",
    "",
    "- P63 recovery snapshots",
    "- P64 provider/tool dispatch through governance",
    "- P67 controlled source mutation expansion",
    "- P69/P70 release and deploy monitoring",
    "",
  ].join("\n");
  const statusDoc = [
    "# NEXUS Project Status - CareLoop",
    "",
    "- Project: CareLoop",
    "- Active phase: CARELOOP-P2",
    "- Mission: CareLoop Phase 2",
    "- Status: In Progress",
    "- Next action: Review Phase 2 task plan",
    "- Mutation: disabled",
    "- Provider calls: disabled",
    "- Tool execution: disabled",
    "- DB writes: disabled",
    "- Deployment: disabled",
    "",
    "CareLoop project progress is tracked in project-roadmap files and Command Center Projects. It is not part of the NEXUS OS Roadmap.",
    "",
  ].join("\n");
  write(
    "projects/careloop/docs/NEXUS_CARELOOP_PHASE_2.md",
    phase2Doc,
  );
  write(
    "projects/careloop/docs/NEXUS_PROJECT_STATUS.md",
    statusDoc,
  );
}

function writeProfile() {
  writeJson("projects/careloop/nexus.project.json", {
    profileVersion: "1.0",
    projectId: "careloop",
    projectLabel: "CareLoop",
    label: "CareLoop",
    visibility: "local-private",
    projectType: "saas-mobile",
    root: "projects/careloop",
    scope: "project",
    stacks: {
      backend: { label: "Fastify API + Prisma", kind: "backend-service", runtimeEnabled: false, execute: false },
      ios: { label: "SwiftUI iOS app", kind: "ios-app", runtimeEnabled: false, execute: false },
    },
    databases: {
      postgres: { label: "Supabase Postgres / Prisma", runtimeEnabled: false, connect: false },
    },
    testSuites: [
      { id: "backend-validation", label: "Backend validation", runtimeEnabled: false, execute: false },
      { id: "ios-validation", label: "iOS validation readiness", runtimeEnabled: false, execute: false },
    ],
    agents: {
      planning: ["SHEPHERD", "PRISM"],
      implementation: ["CORE", "NEXUS"],
      validation: ["AUDITOR", "SENTINEL"],
      safety: ["WARDEN"],
      ios: ["SWIFT"],
    },
    workflows: [
      { id: "plan-sprint", label: "Plan Sprint" },
      { id: "validate-backend", label: "Validate Backend" },
      { id: "privacy-review", label: "Run Privacy Review" },
      { id: "ios-readiness", label: "Prepare iOS Validation" },
      { id: "release-readiness", label: "Review Release" },
    ],
    allowedRoots: ["projects/careloop"],
    allowedPaths: ["projects/careloop"],
    forbiddenPatterns: [".env", "*.pem", "*.key", "*.p12", "secrets/**"],
    forbiddenPaths: [
      ".env",
      "*.pem",
      "*.key",
      "*.p12",
      "secrets/**",
      "projects/careloop/src/**",
      "projects/careloop/prisma/**",
      "projects/careloop-ios/**",
    ],
    costPolicy: { enabled: false },
    releaseGates: ["privacy-review", "backend-validation", "ios-validation", "release-readiness"],
    docs: [
      "projects/careloop/docs/PRD.md",
      "projects/careloop/docs/NEXUS_CARELOOP_PHASE_2.md",
      "projects/careloop/docs/NEXUS_PROJECT_STATUS.md",
    ],
    adapterRuntimeEnabled: false,
    projectSelectorEnabled: true,
    projectMutationAllowed: false,
    providerCallsAllowed: false,
    dbAccessAllowed: false,
    metadata: {
      source: "careloop-phase-2-nexus-start",
      publicSafeLabel: "Private Project",
      phaseId: "CARELOOP-P2",
    },
  });
}

function writeReports(mission, taskPlan, readiness) {
  const branch = git(["branch", "--show-current"]);
  const head = git(["rev-parse", "--short", "HEAD"]);
  const taskSummary = taskPlan.tasks
    .map((task) => `- ${task.title} — ${task.ownerAgent}; ${task.nextRecommendedAction}`)
    .join("\n");
  const missionReport = [
    "# CareLoop Phase 2 Mission Report",
    "",
    "## Metadata",
    "",
    `- Generated at: ${NOW}`,
    `- Validation branch: ${branch}`,
    `- Validation HEAD: ${head}`,
    "- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.",
    "",
    "## Scope",
    "",
    "CARELOOP-P2.1 - Start CareLoop Phase 2 from NEXUS.",
    "",
    "## Summary",
    "",
    "- Project: CareLoop",
    "- Phase: CARELOOP-P2",
    "- Mission: Product Hardening and Validation",
    `- Tasks planned: ${taskPlan.tasks.length}`,
    "- Mutation: disabled",
    "- Provider calls: disabled",
    "- Tool execution: disabled",
    "- DB writes: disabled",
    "- Deployment: disabled",
    "",
    "## PRD Clarity",
    "",
    readiness.clarityAssessment,
    "",
    "## Task Plan",
    "",
    taskSummary,
    "",
    "## Explicit Non-Goals",
    "",
    "- No CareLoop product features implemented.",
    "- No CareLoop source, Prisma, or iOS source mutation.",
    "- No provider/tool/worker execution.",
    "- No DB writes, migrations, xcodebuild, or deploy.",
    "",
    "## Next",
    "",
    "Review Phase 2 task plan in Command Center.",
    "",
  ].join("\n");
  writeJson("reports/careloop-phase-2-mission.json", { mission, taskPlan });
  writeJson("reports/careloop-phase-2-readiness.json", readiness);
  write(
    "reports/careloop-phase-2-mission-report.md",
    missionReport,
  );
}

function main() {
  if (!["local-private", "test"].includes(MODE)) {
    console.error(`CareLoop Phase 2 start requires NEXUS_MODE=local-private or test. Got: ${MODE}`);
    process.exit(1);
  }

  const prd = read("projects/careloop/docs/PRD.md");
  const mission = buildMissionContract();
  const taskPlan = buildTaskPlan();
  const roadmap = buildRoadmap();
  const phaseStatus = buildPhaseStatus();
  const readiness = buildReadiness(prd);

  updateProjectRegistry();
  writeProfile();
  writeJson("contracts/projects/careloop/phase-2-mission-contract.json", mission);
  writeJson("contracts/projects/careloop/phase-2-task-plan.json", taskPlan);
  writeJson("project-roadmap/careloop-roadmap.json", roadmap);
  writeJson("project-roadmap/careloop-phase-status.json", phaseStatus);
  writeDocs(taskPlan);
  writeReports(mission, taskPlan, readiness);

  appendUniqueJsonl("local-state/runtime/evidence.jsonl", "evidenceId", {
    evidenceId: "selected-project-p2-mission-start",
    type: "project_mission_started",
    projectId: "private-project-01",
    taskId: "",
    agentId: "NEXUS",
    capabilityId: "orchestration.plan_flow",
    result: "INFO",
    summary: "Selected project Phase 2 mission started as a NEXUS governed planning mission.",
    artifactPaths: [],
    traceIds: ["selected-project-p2-start"],
    policyDecisionId: "selected-project-p2-preview-only",
    dataClassification: "confidential",
    createdAt: NOW,
    redacted: true,
  });
  appendUniqueJsonl("local-state/runtime/activity.jsonl", "eventId", {
    eventId: "selected-project-p2-mission-start",
    eventType: "project_mission_started",
    source: "nexus_command_center",
    projectId: "private-project-01",
    summary: "Selected project Phase 2 planning mission initialized.",
    correlationId: "selected-project-p2-start",
    redacted: true,
    createdAt: NOW,
  });

  console.log("NEXUS CareLoop Phase 2 Start");
  console.log("============================");
  console.log("");
  console.log("Project: CareLoop");
  console.log("Phase: CARELOOP-P2");
  console.log("Mission: Product Hardening and Validation");
  console.log("Mutation: disabled");
  console.log("Provider calls: disabled");
  console.log("Tool execution: disabled");
  console.log("DB writes: disabled");
  console.log("");
  console.log("Created:");
  console.log("- mission contract");
  console.log("- task plan");
  console.log("- project roadmap status");
  console.log("- readiness report");
  console.log("- evidence/activity records if available");
  console.log("");
  console.log("Next:");
  console.log("Review Phase 2 task plan in Command Center.");
}

main();
