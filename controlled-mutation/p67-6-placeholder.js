import { createPassResult } from "../shared/resultEnvelope.js";

export const P67_6_REQUIRED_CHECKS = Object.freeze([
  "npm run check:p672",
  "npm run check:p673",
  "npm run check:p674",
  "npm run check:p675",
  "npm run check:command-center-ux",
  "npm run check:p67-execution-plan",
  "npm run check:phase-validation-coverage",
  "npm run check:os-phase-status",
  "npm run check:format-readability",
  "git diff --check",
]);

export const P67_6_REQUIRED_REPORTS = Object.freeze([
  "reports/p672-report.md",
  "reports/p673-report.md",
  "reports/p674-report.md",
  "reports/p675-report.md",
  "reports/command-center-ux-report.md",
  "reports/p67-execution-plan-report.md",
  "reports/phase-validation-coverage-report.md",
  "reports/os-phase-status-report.md",
]);

export function buildP676ValidationMatrix(input = {}) {
  const checks = input.checks || P67_6_REQUIRED_CHECKS;
  const reports = input.reports || P67_6_REQUIRED_REPORTS;
  return {
    matrixId: "p67-6-validation-matrix",
    currentState: "ready_for_final_validation",
    checks,
    reports,
    commandCenterCoverage: true,
    docsCoverage: true,
    statusCoverage: true,
    applyAllowed: false,
    mutationAllowed: false,
    projectMutationAllowed: false,
    executionAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    dbWritesAllowed: false,
    deployAllowed: false,
    providerSpendAllowed: false,
    blockers: ["Final P67 closeout remains P67.7.", "Apply remains disabled until a later explicit phase."],
    nextAction: "Run P67.7 final validation and close the phase if every gate remains green.",
  };
}

export function validateP676ValidationMatrix(matrix = {}) {
  const errors = [];
  for (const command of P67_6_REQUIRED_CHECKS) {
    if (!matrix.checks?.includes(command)) errors.push(`missing check ${command}`);
  }
  for (const report of P67_6_REQUIRED_REPORTS) {
    if (!matrix.reports?.includes(report)) errors.push(`missing report ${report}`);
  }
  if (matrix.commandCenterCoverage !== true) errors.push("commandCenterCoverage must be true");
  if (matrix.docsCoverage !== true) errors.push("docsCoverage must be true");
  if (matrix.statusCoverage !== true) errors.push("statusCoverage must be true");
  if (matrix.applyAllowed !== false || matrix.mutationAllowed !== false || matrix.projectMutationAllowed !== false) {
    errors.push("apply and mutation must remain disabled");
  }
  if (matrix.executionAllowed !== false) errors.push("executionAllowed must be false");
  if (matrix.providerDispatchAllowed !== false) errors.push("providerDispatchAllowed must be false");
  if (matrix.toolExecutionAllowed !== false) errors.push("toolExecutionAllowed must be false");
  if (matrix.workerExecutionAllowed !== false) errors.push("workerExecutionAllowed must be false");
  if (matrix.dbWritesAllowed !== false) errors.push("dbWritesAllowed must be false");
  if (matrix.deployAllowed !== false) errors.push("deployAllowed must be false");
  if (matrix.providerSpendAllowed !== false) errors.push("providerSpendAllowed must be false");
  return { valid: errors.length === 0, errors };
}

export function buildP676ValidationEnvelope(input = {}) {
  const matrix = buildP676ValidationMatrix(input);
  return createPassResult({
    phase: "P67.6",
    mode: "validation-only",
    source: "controlled-mutation/p67-6-placeholder.js",
    summary: "P67 validation matrix aggregated before final validation.",
    data: { matrix },
    evidence: matrix.reports,
  });
}
