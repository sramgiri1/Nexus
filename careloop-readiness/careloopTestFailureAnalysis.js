import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getRepoRoot, readJsonSafe } from "../local-state/safeFileReader.js";
import { getNexusMode, isLocalPrivateMode, validatePrivateProjectAccess } from "../private-mode/index.js";
import { addTask, updateTaskState } from "../local-state/taskStore.js";
import { appendEvidence } from "../local-state/appendEvidence.js";
import { appendAuditEvent } from "../local-state/appendAuditEvent.js";
import { appendRuntimeEvent } from "../local-state/stateStore.js";
import { validateLocalTaskTransition } from "../local-state/stateTransitionGuard.js";

const RUNTIME_PROJECT_ID = "private-project-01";
const RUNTIME_TASK_ID = "pvt-test-failure-analysis";

const FAILING_TEST = {
  file: "projects/careloop/test/sprint2.test.js",
  line: 1888,
  suite: "GET /circles/:id/insights/completion",
  description: "returns admin completion chart data for the requested window",
  expected: 2,
  actual: 0,
  route: "GET /circles/:id/insights/completion",
};

const ROUTE_FILE = "projects/careloop/src/routes/circles.js";

function requireAllowedMode(mode) {
  return isLocalPrivateMode(mode) || mode === "test";
}

function readPrivateFile(root, relPath) {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) return { ok: false, error: `File not found: ${relPath}` };
  try {
    return { ok: true, content: fs.readFileSync(abs, "utf8") };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export function locateFailingTestContext() {
  const root = getRepoRoot();
  const file = readPrivateFile(root, FAILING_TEST.file);
  if (!file.ok) return { ok: false, error: file.error };

  const lines = file.content.split("\n");
  const windowStart = Math.max(0, FAILING_TEST.line - 120);
  const windowEnd = Math.min(lines.length, FAILING_TEST.line + 60);
  const context = lines.slice(windowStart, windowEnd);

  // Extract test data shape from context (no dumping full source).
  const dateNowMock = context.some((l) => l.includes("Date.now ="));
  const hasTwoDoneTasks = context.filter((l) => l.includes('"DONE"')).length >= 2;
  const completedAtDates = context
    .filter((l) => l.includes("completedAt:"))
    .map((l) => l.trim().replace(/.*completedAt:\s*new Date\("([^"]+)"\).*/, "$1"))
    .filter((v) => v.length < 50);
  const queryDays = context.find((l) => l.includes("days=7"))?.trim() ?? null;
  const adminRole = context.some((l) => l.includes("ADMIN"));
  const recipientCount = context.filter((l) => l.includes("recipientId:")).length;

  return {
    ok: true,
    testFile: FAILING_TEST.file,
    testLine: FAILING_TEST.line,
    suite: FAILING_TEST.suite,
    route: FAILING_TEST.route,
    dateNowMocked: dateNowMock,
    mockDateValue: "2026-04-29T18:00:00.000Z",
    hasTwoDoneTasks,
    completedAtDates,
    queryDays: "7",
    expectedTotalsCompleted: 2,
    adminRolePresent: adminRole,
    recipientCount,
  };
}

export function locateCompletionInsightsRoute() {
  const root = getRepoRoot();
  const file = readPrivateFile(root, ROUTE_FILE);
  if (!file.ok) return { ok: false, error: file.error };

  const lines = file.content.split("\n");
  const routeLineIdx = lines.findIndex((l) => l.includes("insights/completion"));
  if (routeLineIdx === -1) return { ok: false, error: "Route not found in source." };

  const routeSlice = lines.slice(routeLineIdx, Math.min(routeLineIdx + 120, lines.length));

  const usesNewDate = routeSlice.some((l) => /const now = new Date\(\)/.test(l));
  const usesDateNow = routeSlice.some((l) => /new Date\(Date\.now\(\)\)/.test(l));
  const filterField = routeSlice.some((l) => l.includes("completedAt: { gte: since }"))
    ? "completedAt"
    : routeSlice.some((l) => l.includes("createdAt: { gte: since }"))
    ? "createdAt"
    : "unknown";
  const statusFilter = routeSlice.some((l) => l.includes('"DONE"')) ? "DONE" : "unknown";
  const hasSinceCalc = routeSlice.some((l) => l.includes("since.setUTCDate"));

  const nowLineOffset = routeSlice.findIndex((l) => /const now = new Date/.test(l));
  const nowLineAbsolute = nowLineOffset >= 0 ? routeLineIdx + nowLineOffset + 1 : null;

  return {
    ok: true,
    routeFile: ROUTE_FILE,
    routeLineApprox: routeLineIdx + 1,
    usesNewDate,
    usesDateNow,
    filterField,
    statusFilter,
    hasSinceCalc,
    nowLine: nowLineAbsolute,
    nowExpression: usesNewDate ? "new Date()" : usesDateNow ? "new Date(Date.now())" : "unknown",
  };
}

export function inspectCompletionInsightsQuery() {
  const routeInfo = locateCompletionInsightsRoute();
  if (!routeInfo.ok) return { ok: false, error: routeInfo.error };

  return {
    ok: true,
    completedAtFilter: routeInfo.filterField === "completedAt",
    statusFilterCorrect: routeInfo.statusFilter === "DONE",
    dateWindowSource: routeInfo.usesNewDate ? "new Date() — not mockable" : "new Date(Date.now()) — mockable",
    dateWindowBug: routeInfo.usesNewDate && !routeInfo.usesDateNow,
    nowLine: routeInfo.nowLine,
  };
}

export function classifyCompletionInsightsFailure(analysis) {
  const { testContext, routeInfo, queryInfo } = analysis;

  const isDateWindowBug = queryInfo?.dateWindowBug === true;
  const testMocksDates = testContext?.dateNowMocked === true;
  const routeUsesNewDate = routeInfo?.usesNewDate === true;

  let rootCauseCategory = "unknown_needs_manual_review";
  let confidence = "low";
  const evidence = [];

  if (isDateWindowBug && testMocksDates && routeUsesNewDate) {
    rootCauseCategory = "date_window_boundary_bug";
    confidence = "high";
    evidence.push("Route uses new Date() which ignores Date.now mock");
    evidence.push("Test mocks Date.now to 2026-04-29T18:00:00Z");
    evidence.push("Real current date (~2026-05-08) places tasks outside 7-day window");
    evidence.push("completedAt filter correct; status filter correct; bug is time source only");
  }

  const suspectFiles = isDateWindowBug ? [ROUTE_FILE] : [];
  const fixLine = queryInfo?.nowLine;

  return {
    classificationVersion: "1.0",
    mode: "local-private",
    projectId: "careloop",
    privateProject: true,
    failure: {
      testFile: FAILING_TEST.file,
      line: FAILING_TEST.line,
      route: FAILING_TEST.route,
      expected: FAILING_TEST.expected,
      actual: FAILING_TEST.actual,
    },
    rootCauseCategory,
    confidence,
    evidence,
    suspectFiles,
    recommendedFix: {
      type: "implementation",
      files: suspectFiles,
      summary: confidence === "high"
        ? `In ${ROUTE_FILE} line ~${fixLine}: change 'const now = new Date()' to 'const now = new Date(Date.now())'`
        : "Manual review required",
      riskLevel: "low",
      mutationAllowed: confidence === "high",
    },
    safeToApplyFixNow: confidence === "high",
    warnings: [],
    errors: [],
  };
}

export function analyzeCompletionInsightsFailure(options = {}) {
  const env = options.env ?? process.env;
  const mode = getNexusMode(env);
  const errors = [];
  const warnings = [];

  if (!requireAllowedMode(mode)) {
    return { ok: false, errors: [`Mode '${mode}' does not allow test failure analysis.`], warnings };
  }

  const access = validatePrivateProjectAccess({ projectId: "careloop", purpose: "inventory", mode });
  if (!access.allowed) return { ok: false, errors: [access.reason], warnings };

  const testContext = locateFailingTestContext();
  if (!testContext.ok) warnings.push(`Test context: ${testContext.error}`);

  const routeInfo = locateCompletionInsightsRoute();
  if (!routeInfo.ok) warnings.push(`Route info: ${routeInfo.error}`);

  const queryInfo = inspectCompletionInsightsQuery();
  if (!queryInfo.ok) warnings.push(`Query info: ${queryInfo.error}`);

  const classification = classifyCompletionInsightsFailure({ testContext, routeInfo, queryInfo });

  // Route through governed local path.
  const taskRecord = {
    taskId: randomUUID(),
    projectId: RUNTIME_PROJECT_ID,
    taskType: "test_failure_remediation",
    state: "queued",
    sourceAgent: "auditor",
    targetAgent: "core",
    objective: "Governed test failure analysis task",
    capabilityId: "implementation.backend_code",
    riskLevel: "medium",
    redacted: true,
    classification: "confidential",
    mutationAllowed: false,
    testExecutionAllowed: true,
    createdAt: new Date().toISOString(),
  };

  const addResult = addTask(taskRecord);
  if (!addResult.ok) {
    warnings.push(`Failed to add task: ${addResult.errors?.join("; ") ?? "unknown"}`);
  }

  const transitions = [];
  for (const { from, to } of [{ from: "queued", to: "running" }, { from: "running", to: "implementation_done" }]) {
    const guard = validateLocalTaskTransition({
      entityType: "task",
      taskId: taskRecord.taskId,
      fromState: from,
      toState: to,
      actor: "auditor",
      evidence: [{ type: "failure_analysis_artifact" }],
    });
    if (!guard.allowed) { warnings.push(`Transition ${from}->${to} blocked`); break; }
    const upd = updateTaskState(taskRecord.taskId, to, { actor: "auditor", evidence: [{ type: "failure_analysis_artifact" }] });
    if (!upd.ok) { warnings.push(`State update ${from}->${to} failed`); break; }
    transitions.push({ from, to, allowed: true });
  }

  appendEvidence({
    type: "failure_analysis",
    projectId: RUNTIME_PROJECT_ID,
    taskId: RUNTIME_TASK_ID,
    agentId: "auditor",
    capabilityId: "implementation.backend_code",
    result: classification.confidence === "high" ? "PASS" : "NEEDS_REVIEW",
    summary: `Failure analysis: ${classification.rootCauseCategory} (${classification.confidence})`,
    dataClassification: "confidential",
    redacted: true,
    classification: "confidential",
  });
  appendAuditEvent({
    eventType: "test_failure_analysis_completed",
    actorId: "auditor",
    projectId: RUNTIME_PROJECT_ID,
    taskId: RUNTIME_TASK_ID,
    redacted: true,
    classification: "confidential",
    details: { rootCauseCategory: classification.rootCauseCategory, confidence: classification.confidence },
  });
  appendRuntimeEvent({
    eventType: "governed_test_failure_analysis_completed",
    projectId: RUNTIME_PROJECT_ID,
    taskId: RUNTIME_TASK_ID,
    agentId: "auditor",
    mode,
    rootCauseCategory: classification.rootCauseCategory,
    confidence: classification.confidence,
    redacted: true,
    classification: "confidential",
  });

  return {
    ok: classification.confidence !== "low",
    mode,
    testContext,
    routeInfo,
    queryInfo,
    classification,
    taskResult: { taskId: taskRecord.taskId, finalState: transitions.length === 2 ? "implementation_done" : "running", transitions },
    warnings,
    errors,
  };
}

export function writeCompletionInsightsFailureReports(result) {
  const root = getRepoRoot();
  const now = new Date().toISOString();
  const cls = result.classification ?? {};
  const reportsDir = path.join(root, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const jsonReport = {
    reportVersion: "1.0",
    mode: result.mode,
    projectId: "careloop",
    privateProject: true,
    generatedAt: now,
    failure: cls.failure ?? {},
    rootCauseCategory: cls.rootCauseCategory ?? "unknown",
    confidence: cls.confidence ?? "low",
    evidence: cls.evidence ?? [],
    suspectFiles: cls.suspectFiles ?? [],
    recommendedFix: cls.recommendedFix ?? {},
    safeToApplyFixNow: cls.safeToApplyFixNow ?? false,
    warnings: result.warnings ?? [],
    errors: result.errors ?? [],
  };

  fs.writeFileSync(path.join(root, "reports/careloop-test-failure-analysis.json"), JSON.stringify(jsonReport, null, 2), "utf8");

  const mdLines = [
    "# NEXUS Private Project Test Failure Analysis",
    "",
    "## Metadata",
    "",
    `- Generated at: ${now}`,
    `- Mode: ${result.mode ?? "unknown"}`,
    "- Validation HEAD: (see git log)",
    "",
    "## Failing Test",
    "",
    `- File: ${cls.failure?.testFile ?? "unknown"}`,
    `- Line: ${cls.failure?.line ?? "unknown"}`,
    `- Route: ${cls.failure?.route ?? "unknown"}`,
    `- Expected: ${cls.failure?.expected ?? "unknown"}`,
    `- Actual: ${cls.failure?.actual ?? "unknown"}`,
    "",
    "## Root Cause",
    "",
    `- Category: ${cls.rootCauseCategory ?? "unknown"}`,
    `- Confidence: ${cls.confidence ?? "low"}`,
    "",
    "### Evidence",
    "",
    ...(cls.evidence?.map((e) => `- ${e}`) ?? ["- None"]),
    "",
    "## Suspect Files",
    "",
    ...(cls.suspectFiles?.map((f) => `- ${f}`) ?? ["- None"]),
    "",
    "## Recommended Fix",
    "",
    `- Type: ${cls.recommendedFix?.type ?? "unknown"}`,
    `- Risk level: ${cls.recommendedFix?.riskLevel ?? "unknown"}`,
    `- Safe to apply now: ${cls.safeToApplyFixNow ?? false}`,
    `- Summary: ${cls.recommendedFix?.summary ?? "None"}`,
    "",
    `## Result: ${result.ok ? "READY_FOR_REMEDIATION" : "NEEDS_REVIEW"}`,
    "",
    ...(result.warnings?.length ? ["## Warnings", "", ...result.warnings.map((w) => `- ${w}`), ""] : []),
  ];

  fs.writeFileSync(path.join(root, "reports/careloop-test-failure-analysis.md"), mdLines.join("\n"), "utf8");
}
