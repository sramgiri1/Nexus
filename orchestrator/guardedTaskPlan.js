import {
  runGuardedLocalAgentTask,
  summarizeGuardedTaskResult,
} from "./guardedTaskExecutor.js";

function buildBaseInput(overrides = {}) {
  return {
    projectId: "demoapp",
    sourceAgent: "shepherd",
    targetAgent: "auditor",
    riskLevel: "medium",
    dataClassification: "internal",
    promptClassification: "internal",
    responseExpectedClass: "internal",
    provider: "none",
    runtime: "node-local",
    originatingUser: {
      userId: "demo-user",
      role: "operator",
      authType: "demo",
      scopes: ["demo:read", "demo:run", "local:write"],
    },
    executionMode: "guarded-local",
    ...overrides,
  };
}

function countByResult(results, expected) {
  return results.filter((result) => result.result === expected).length;
}

export function createAuditorDemoContractsTask() {
  return buildBaseInput({
    taskType: "verification_gate",
    objective: "Run a deterministic local contract validation for DemoApp.",
    targetAgent: "auditor",
    capabilityId: "verification.code_quality_gate",
    allowedLocalAction: "validate_demo_contracts",
    expectedResult: "PASS",
  });
}

export function createSentinelDemoReportsTask() {
  return buildBaseInput({
    taskType: "verification_gate",
    objective: "Run a deterministic local report validation for DemoApp.",
    targetAgent: "sentinel",
    capabilityId: "verification.qa_gate",
    allowedLocalAction: "validate_demo_reports",
    expectedResult: "PASS",
  });
}

export function createWardenPublicSafetyTask() {
  return buildBaseInput({
    taskType: "verification_gate",
    objective: "Run a deterministic public-safety surface validation for DemoApp.",
    targetAgent: "warden",
    capabilityId: "verification.compliance_gate",
    riskLevel: "high",
    allowedLocalAction: "validate_public_safety_surface",
    expectedResult: "PASS",
  });
}

export function createCoreRuntimeSnapshotTask() {
  return buildBaseInput({
    taskType: "backend.code_edit",
    objective: "Run a deterministic local runtime snapshot validation for DemoApp.",
    targetAgent: "core",
    capabilityId: "implementation.backend_code",
    allowedLocalAction: "validate_runtime_snapshot",
    expectedResult: "PASS",
  });
}

export function createBlockedUnknownActionTask() {
  return buildBaseInput({
    taskType: "backend.code_edit",
    objective: "Attempt an unknown deterministic local action that must be blocked.",
    targetAgent: "core",
    capabilityId: "implementation.backend_code",
    allowedLocalAction: "unknown_guarded_action",
    expectedResult: "BLOCKED",
  });
}

export function summarizeGuardedTaskPlanResults(results = []) {
  const scenarioResults = Array.isArray(results) ? results : [];
  const pass = countByResult(scenarioResults, "PASS");
  const blocked = countByResult(scenarioResults, "BLOCKED");
  const fail = countByResult(scenarioResults, "FAIL");
  const transitionsAttempted = scenarioResults.reduce(
    (total, result) => total + (Number(result.transitionsAttempted) || 0),
    0
  );
  const transitionsAllowed = scenarioResults.reduce(
    (total, result) => total + (Number(result.transitionsAllowed) || 0),
    0
  );
  const transitionsBlocked = scenarioResults.reduce(
    (total, result) => total + (Number(result.transitionsBlocked) || 0),
    0
  );
  const transitionEvidenceCount = scenarioResults.reduce(
    (total, result) => total + (Number(result.transitionEvidenceCount) || 0),
    0
  );
  const summaries = scenarioResults.map((result) => summarizeGuardedTaskResult(result));

  return {
    ok: fail === 0,
    executionMode: "guarded-local",
    scenarioCount: scenarioResults.length,
    pass,
    blocked,
    fail,
    transitionsAttempted,
    transitionsAllowed,
    transitionsBlocked,
    transitionEvidenceCount,
    results: scenarioResults,
    summaries,
    summary: `${scenarioResults.length} guarded-local scenarios: ${pass} pass, ${blocked} blocked, ${fail} fail, ${transitionsAllowed}/${transitionsAttempted} transitions allowed.`,
  };
}

export function runGuardedTaskPlan() {
  const scenarios = [
    createAuditorDemoContractsTask(),
    createSentinelDemoReportsTask(),
    createWardenPublicSafetyTask(),
    createCoreRuntimeSnapshotTask(),
    createBlockedUnknownActionTask(),
  ];
  const results = scenarios.map((scenario) => runGuardedLocalAgentTask(scenario));
  return summarizeGuardedTaskPlanResults(results);
}
