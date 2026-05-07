import {
  createBlockedSecretDataTask,
  createDemoApprovalRequiredTask,
  createDemoBackendTask,
  createDemoQaGateTask,
  createDemoReleaseReviewTask,
} from "./dryRunTaskFactory.js";
import { runLocalOrchestratorDryRun } from "./localAdapter.js";

function countByResult(results, expected) {
  return results.filter((result) => result.result === expected).length;
}

export function summarizeDryRunResults(results = []) {
  const scenarioResults = Array.isArray(results) ? results : [];
  const pass = countByResult(scenarioResults, "PASS");
  const blocked = countByResult(scenarioResults, "BLOCKED");
  const requireApproval = countByResult(
    scenarioResults,
    "REQUIRE_APPROVAL"
  );
  const fail = countByResult(scenarioResults, "FAIL");

  return {
    ok: fail === 0,
    dryRun: true,
    scenarioCount: scenarioResults.length,
    pass,
    blocked,
    requireApproval,
    fail,
    results: scenarioResults,
    summary: `${scenarioResults.length} dry-run scenarios: ${pass} pass, ${requireApproval} require approval, ${blocked} blocked, ${fail} fail.`,
  };
}

export function runDefaultDryRunPlan() {
  const scenarios = [
    createDemoReleaseReviewTask(),
    createDemoBackendTask(),
    createDemoQaGateTask(),
    createDemoApprovalRequiredTask(),
    createBlockedSecretDataTask(),
  ];

  const results = scenarios.map((scenario) => runLocalOrchestratorDryRun(scenario));
  return summarizeDryRunResults(results);
}
