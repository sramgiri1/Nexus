import { runControlledLocalExecution } from "./localExecutor.js";

function buildBaseInput(overrides = {}) {
  return {
    projectId: "demoapp",
    sourceAgent: "nexus",
    targetAgent: "core",
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
    approvalEvidence: [],
    requiredSkills: [],
    acceptanceCriteria: [
      "Controlled local execution only. No provider call, tool call, or project mutation is performed.",
    ],
    executionMode: "controlled-local",
    allowLocalWrites: true,
    ...overrides,
  };
}

function countByResult(results, expected) {
  return results.filter((result) => result.result === expected).length;
}

export function createControlledDemoTask() {
  return buildBaseInput({
    taskType: "demo.local_execution",
    objective:
      "Execute a controlled local DemoApp task through a governed NEXUS path.",
    targetAgent: "core",
    capabilityId: "implementation.backend_code",
    actionType: "runtime_call",
    target: "demo_local_execution",
    intent: "implementation",
    operation: "local_execution_record",
    expectedResult: "PASS",
  });
}

export function createControlledApprovalTask() {
  return buildBaseInput({
    taskType: "deploy.plan",
    objective:
      "Record a controlled local deploy-plan request that should stop for approval.",
    targetAgent: "forge",
    capabilityId: "platform.deploy_plan",
    riskLevel: "critical",
    actionType: "runtime_call",
    target: "deploy",
    intent: "deploy",
    operation: "deploy",
    requestedAction: "deploy",
    expectedResult: "REQUIRE_APPROVAL",
  });
}

export function createControlledBlockedSecretTask() {
  return buildBaseInput({
    taskType: "ai.integration_blocked_review",
    objective:
      "Record a secret-data AI integration request that must be blocked locally.",
    targetAgent: "synapse",
    capabilityId: "platform.ai_integration",
    riskLevel: "high",
    dataClassification: "secret",
    promptClassification: "secret",
    responseExpectedClass: "secret",
    actionType: "model_call",
    target: "blocked_data_review_local",
    intent: "blocked_data_review",
    operation: "blocked_data_review",
    requestedAction: "blocked_data_review",
    expectedResult: "BLOCKED",
  });
}

export function summarizeControlledExecutionResults(results = []) {
  const scenarioResults = Array.isArray(results) ? results : [];
  const pass = countByResult(scenarioResults, "PASS");
  const blocked = countByResult(scenarioResults, "BLOCKED");
  const requireApproval = countByResult(
    scenarioResults,
    "REQUIRE_APPROVAL"
  );
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

  return {
    ok: fail === 0,
    executionMode: "controlled-local",
    scenarioCount: scenarioResults.length,
    pass,
    blocked,
    requireApproval,
    fail,
    transitionsAttempted,
    transitionsAllowed,
    transitionsBlocked,
    transitionEvidenceCount,
    results: scenarioResults,
    summary: `${scenarioResults.length} controlled-local scenarios: ${pass} pass, ${requireApproval} require approval, ${blocked} blocked, ${fail} fail, ${transitionsAllowed}/${transitionsAttempted} transitions allowed.`,
  };
}

export function runControlledLocalExecutionPlan() {
  const scenarios = [
    createControlledDemoTask(),
    createControlledApprovalTask(),
    createControlledBlockedSecretTask(),
  ];
  const results = scenarios.map((scenario) => runControlledLocalExecution(scenario));
  return summarizeControlledExecutionResults(results);
}
