function buildBaseInput(overrides = {}) {
  return {
    projectId: "demoapp",
    sourceAgent: "shepherd",
    targetAgent: "nexus",
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
      scopes: ["demo:read", "demo:run"],
    },
    approvalEvidence: [],
    requiredSkills: [],
    acceptanceCriteria: [
      "Dry-run only. No live execution or release decision is asserted.",
    ],
    dryRun: true,
    ...overrides,
  };
}

export function createDemoReleaseReviewTask() {
  return buildBaseInput({
    taskType: "demo.release_review",
    objective:
      "Evaluate DemoApp release readiness through a governed dry-run path.",
    sourceAgent: "nexus",
    targetAgent: "nexus",
    capabilityId: "control.decide_release",
    riskLevel: "high",
    actionType: "runtime_call",
    target: "release_review_dry_run",
    intent: "release_review",
    operation: "release_review",
    expectedResult: "PASS_OR_REVIEW",
  });
}

export function createDemoBackendTask() {
  return buildBaseInput({
    taskType: "backend.code_edit",
    objective:
      "Simulate a governed DemoApp backend implementation handoff in dry-run mode.",
    targetAgent: "core",
    capabilityId: "implementation.backend_code",
    actionType: "runtime_call",
    target: "backend_code_dry_run",
    allowedFiles: ["src/demo/backend.js"],
    expectedResult: "PASS",
  });
}

export function createDemoQaGateTask() {
  return buildBaseInput({
    taskType: "verification_gate",
    objective:
      "Simulate a DemoApp QA verification request without running live tests.",
    targetAgent: "sentinel",
    capabilityId: "verification.qa_gate",
    actionType: "runtime_call",
    target: "qa_gate_dry_run",
    requiredSkills: ["sentinel.qa.tests.execute"],
    expectedResult: "PASS",
  });
}

export function createDemoApprovalRequiredTask() {
  return buildBaseInput({
    taskType: "deploy.plan",
    objective:
      "Simulate a deploy-plan request that should stop for approval in dry-run mode.",
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

export function createBlockedSecretDataTask() {
  return buildBaseInput({
    taskType: "ai.integration_blocked_review",
    objective:
      "Simulate a secret-data AI integration request that must be blocked locally.",
    targetAgent: "synapse",
    capabilityId: "platform.ai_integration",
    riskLevel: "high",
    dataClassification: "secret",
    promptClassification: "secret",
    responseExpectedClass: "secret",
    actionType: "model_call",
    target: "blocked_data_review_dry_run",
    intent: "blocked_data_review",
    operation: "blocked_data_review",
    requestedAction: "blocked_data_review",
    expectedResult: "BLOCKED",
  });
}
