import fs from "node:fs";
import path from "node:path";
import { getRepoRoot } from "../local-state/safeFileReader.js";
import { getNexusMode } from "../private-mode/index.js";
import { inventoryCareLoopBackend } from "./careloopInventory.js";
import { inventoryCareLoopIos } from "./careloopIosInventory.js";

const REPORT_MD_PATH = "reports/careloop-readiness-report.md";
const REPORT_JSON_PATH = "reports/careloop-inventory.json";

export function evaluateBackendReadiness(backendInventory) {
  const reasons = [];

  if (!backendInventory.exists) {
    return { status: "MISSING", reasons: ["Backend root not found."] };
  }

  if (!backendInventory.package.exists) {
    reasons.push("package.json not found.");
  }

  if (!backendInventory.structure.src) {
    reasons.push("src directory not found.");
  }

  if (backendInventory.errors.length > 0) {
    return { status: "MISSING", reasons: backendInventory.errors };
  }

  if (reasons.length > 0) {
    return { status: "NEEDS_SETUP", reasons };
  }

  if (backendInventory.structure.schemaPrisma) {
    reasons.push("Prisma schema detected — database migration readiness available.");
  }
  if (backendInventory.structure.tests) {
    reasons.push("Test directory detected.");
  }

  return { status: "READY_FOR_VALIDATION", reasons };
}

export function evaluateIosReadiness(iosInventory) {
  const reasons = [];

  if (!iosInventory.exists) {
    return { status: "MISSING", reasons: ["iOS project root not found."] };
  }

  if (iosInventory.errors.length > 0) {
    return { status: "MISSING", reasons: iosInventory.errors };
  }

  const hasProjectMarker =
    iosInventory.iosProject.xcodeproj ||
    iosInventory.iosProject.xcworkspace ||
    iosInventory.iosProject.packageSwift ||
    iosInventory.iosProject.podfile ||
    iosInventory.iosProject.projectYml;

  if (!hasProjectMarker) {
    reasons.push("No Xcode project markers (xcodeproj / xcworkspace / Package.swift / Podfile / project.yml) found.");
    return { status: "NEEDS_SETUP", reasons };
  }

  if (iosInventory.iosProject.xcodeproj) {
    reasons.push("Xcode project detected.");
  }
  if (iosInventory.iosProject.projectYml) {
    reasons.push("XcodeGen project.yml detected.");
  }
  if (iosInventory.structure.tests) {
    reasons.push(`Test directory detected: ${iosInventory.structure.testDirectory ?? "tests"}.`);
  }

  return { status: "READY_FOR_XCODE_INVENTORY", reasons };
}

export function recommendNextCareLoopTask(snapshot) {
  const backendStatus = snapshot.readiness?.backend?.status;
  const iosStatus = snapshot.readiness?.ios?.status;

  if (backendStatus === "MISSING" && iosStatus === "MISSING") {
    return {
      taskId: "careloop-p27-setup",
      title: "Locate or restore CareLoop project roots before proceeding",
      agent: "NEXUS",
      capabilityId: "nexus.decide.priority",
      riskLevel: "medium",
      requiresApproval: true,
      mutationAllowed: false,
      reason: "Both backend and iOS roots are missing — no inventory basis for a next task.",
    };
  }

  if (backendStatus === "READY_FOR_VALIDATION") {
    return {
      taskId: "careloop-p28-backend-validation",
      title: "Create CareLoop backend validation plan through NEXUS",
      agent: "SHEPHERD",
      capabilityId: "orchestration.plan_flow",
      riskLevel: "medium",
      requiresApproval: false,
      mutationAllowed: false,
      reason: "Backend src and package detected — ready for first governed validation gate.",
    };
  }

  if (iosStatus === "READY_FOR_XCODE_INVENTORY") {
    return {
      taskId: "careloop-p28-ios-validation",
      title: "Create CareLoop backend validation plan through NEXUS",
      agent: "SHEPHERD",
      capabilityId: "orchestration.plan_flow",
      riskLevel: "medium",
      requiresApproval: false,
      mutationAllowed: false,
      reason: "iOS project markers detected — ready for first governed validation gate.",
    };
  }

  return {
    taskId: "careloop-p28-setup",
    title: "Create CareLoop backend validation plan through NEXUS",
    agent: "AUDITOR",
    capabilityId: "verification.code_quality_gate",
    riskLevel: "medium",
    requiresApproval: false,
    mutationAllowed: false,
    reason: "Setup required before validation gate can proceed.",
  };
}

export function buildCareLoopReadinessSnapshot(options = {}) {
  const mode = getNexusMode({ NEXUS_MODE: options.mode ?? process.env.NEXUS_MODE });
  const warnings = [];
  const errors = [];

  const backendInventory = inventoryCareLoopBackend({ mode, actor: options.actor ?? "system" });
  const iosInventory = inventoryCareLoopIos({ mode, actor: options.actor ?? "system" });

  if (backendInventory.errors.length > 0) {
    warnings.push(...backendInventory.errors.map((e) => `Backend: ${e}`));
  }
  if (iosInventory.errors.length > 0) {
    warnings.push(...iosInventory.errors.map((e) => `iOS: ${e}`));
  }

  const backendReadiness = evaluateBackendReadiness(backendInventory);
  const iosReadiness = evaluateIosReadiness(iosInventory);

  let overall = "READY_FOR_NEXT_GOVERNED_TASK";
  if (backendReadiness.status === "MISSING" && iosReadiness.status === "MISSING") {
    overall = "BLOCKED";
  } else if (backendReadiness.status === "NEEDS_SETUP" || iosReadiness.status === "NEEDS_SETUP") {
    overall = "NEEDS_SETUP";
  }

  const snapshot = {
    snapshotVersion: "1.0",
    mode,
    generatedAt: new Date().toISOString(),
    readOnly: true,
    project: {
      id: "private-project-01",
      private: true,
      publicSafe: false,
    },
    backend: backendInventory,
    ios: iosInventory,
    readiness: {
      backend: backendReadiness,
      ios: iosReadiness,
      overall,
    },
    recommendedNextTask: null,
    safety: {
      providerCalls: false,
      projectMutation: false,
      buildExecuted: false,
      testExecuted: false,
      dbAccess: false,
      apiServer: false,
    },
    evidence: [],
    warnings,
    errors,
  };

  snapshot.recommendedNextTask = recommendNextCareLoopTask(snapshot);

  return snapshot;
}

export function writeCareLoopReadinessReport(snapshot) {
  const reportMdPath = path.join(getRepoRoot(), REPORT_MD_PATH);
  const reportJsonPath = path.join(getRepoRoot(), REPORT_JSON_PATH);

  fs.mkdirSync(path.dirname(reportMdPath), { recursive: true });

  const backendStatus = snapshot.readiness?.backend?.status ?? "UNKNOWN";
  const iosStatus = snapshot.readiness?.ios?.status ?? "UNKNOWN";
  const overall = snapshot.readiness?.overall ?? "UNKNOWN";
  const nextTask = snapshot.recommendedNextTask;

  const backendReasons = snapshot.readiness?.backend?.reasons ?? [];
  const iosReasons = snapshot.readiness?.ios?.reasons ?? [];

  const backendInventory = snapshot.backend ?? {};
  const iosInventory = snapshot.ios ?? {};

  const mdLines = [
    "# CareLoop Readiness Report",
    "",
    "## Metadata",
    "",
    `- Generated at: ${snapshot.generatedAt}`,
    `- Mode: ${snapshot.mode}`,
    `- Read-only: ${snapshot.readOnly}`,
    "- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.",
    "",
    "## Readiness Summary",
    "",
    `| Component | Status |`,
    `|---|---|`,
    `| Backend | ${backendStatus} |`,
    `| iOS | ${iosStatus} |`,
    `| Overall | ${overall} |`,
    "",
    "## Backend Inventory",
    "",
    `- Root: ${backendInventory.root ?? "N/A"}`,
    `- Exists: ${backendInventory.exists ?? false}`,
    `- Package: ${backendInventory.package?.exists ? "found" : "not found"}`,
    `- Source dir: ${backendInventory.structure?.src ?? false}`,
    `- Tests: ${backendInventory.structure?.tests ?? false}`,
    `- Prisma: ${backendInventory.structure?.prisma ?? false}`,
    `- Prisma schema: ${backendInventory.structure?.schemaPrisma ?? false}`,
    `- Docs: ${backendInventory.structure?.docs ?? false}`,
    "",
    "Backend readiness reasons:",
    ...backendReasons.map((r) => `- ${r}`),
    "",
    "## iOS Inventory",
    "",
    `- Root: ${iosInventory.root ?? "N/A"}`,
    `- Exists: ${iosInventory.exists ?? false}`,
    `- Xcode project: ${iosInventory.iosProject?.xcodeproj ?? false}`,
    `- project.yml: ${iosInventory.iosProject?.projectYml ?? false}`,
    `- Source dirs: ${iosInventory.structure?.sources ?? false}`,
    `- Tests: ${iosInventory.structure?.tests ?? false}`,
    "",
    "iOS readiness reasons:",
    ...iosReasons.map((r) => `- ${r}`),
    "",
    "## Recommended Next Task",
    "",
    nextTask ? [
      `- Task ID: ${nextTask.taskId}`,
      `- Title: ${nextTask.title}`,
      `- Agent: ${nextTask.agent}`,
      `- Capability: ${nextTask.capabilityId}`,
      `- Risk level: ${nextTask.riskLevel}`,
      `- Requires approval: ${nextTask.requiresApproval}`,
      `- Mutation allowed: ${nextTask.mutationAllowed}`,
      `- Reason: ${nextTask.reason}`,
    ].join("\n") : "- None",
    "",
    "## Safety Flags",
    "",
    `- Provider calls: ${snapshot.safety.providerCalls}`,
    `- Project mutation: ${snapshot.safety.projectMutation}`,
    `- Build executed: ${snapshot.safety.buildExecuted}`,
    `- Test executed: ${snapshot.safety.testExecuted}`,
    `- DB access: ${snapshot.safety.dbAccess}`,
    `- API server: ${snapshot.safety.apiServer}`,
    "",
    "## Warnings",
    "",
    ...(snapshot.warnings.length ? snapshot.warnings.map((w) => `- ${w}`) : ["- None"]),
    "",
    `Result: ${snapshot.errors.length === 0 ? "PASS" : "FAIL"}`,
    "",
  ];

  fs.writeFileSync(reportMdPath, mdLines.join("\n"), "utf8");

  const safeJson = {
    snapshotVersion: snapshot.snapshotVersion,
    mode: snapshot.mode,
    generatedAt: snapshot.generatedAt,
    readOnly: snapshot.readOnly,
    project: snapshot.project,
    readiness: snapshot.readiness,
    recommendedNextTask: snapshot.recommendedNextTask,
    safety: snapshot.safety,
    backendExists: backendInventory.exists ?? false,
    backendPackage: backendInventory.package?.exists ? {
      name: backendInventory.package.name,
      scripts: backendInventory.package.scripts,
      dependencies: backendInventory.package.dependencies,
      devDependencies: backendInventory.package.devDependencies,
    } : null,
    backendStructure: backendInventory.structure ?? null,
    iosExists: iosInventory.exists ?? false,
    iosProject: iosInventory.iosProject ?? null,
    iosStructure: iosInventory.structure ?? null,
    warnings: snapshot.warnings,
    errors: snapshot.errors,
  };

  fs.writeFileSync(reportJsonPath, JSON.stringify(safeJson, null, 2), "utf8");

  return { reportMdPath: REPORT_MD_PATH, reportJsonPath: REPORT_JSON_PATH };
}
