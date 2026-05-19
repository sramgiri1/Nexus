import { createPassResult } from "../shared/resultEnvelope.js";
import { P67_6_REQUIRED_CHECKS, P67_6_REQUIRED_REPORTS, buildP676ValidationMatrix } from "./p67-6-placeholder.js";

export const P67_7_FINAL_CHECKS = Object.freeze([
  ...P67_6_REQUIRED_CHECKS,
  "npm run check:p677",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npm run test:pages -- --grep \"Implementation Workflow tabs\"",
]);

export function buildP677FinalValidationSummary(input = {}) {
  const matrix = input.matrix || buildP676ValidationMatrix();
  return {
    summaryId: "p67-7-final-validation",
    status: "ready_to_close",
    closedPhase: "P67",
    nextPhase: "P68",
    checks: P67_7_FINAL_CHECKS,
    reports: [...P67_6_REQUIRED_REPORTS, "reports/p677-report.md"],
    matrix,
    commandCenterVisible: true,
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
    knownLimitations: [
      "Controlled source mutation remains preview/display-only.",
      "No apply path is enabled by P67.",
      "P68 must continue from explicit implementation-grade subphase planning.",
    ],
  };
}

export function validateP677FinalValidationSummary(summary = {}) {
  const errors = [];
  if (summary.closedPhase !== "P67") errors.push("closedPhase must be P67");
  if (summary.nextPhase !== "P68") errors.push("nextPhase must be P68");
  for (const command of P67_7_FINAL_CHECKS) {
    if (!summary.checks?.includes(command)) errors.push(`missing check ${command}`);
  }
  if (!summary.reports?.includes("reports/p677-report.md")) errors.push("missing P67.7 report");
  if (summary.applyAllowed !== false || summary.mutationAllowed !== false || summary.projectMutationAllowed !== false) {
    errors.push("apply and mutation must remain disabled");
  }
  if (summary.executionAllowed !== false) errors.push("executionAllowed must be false");
  if (summary.providerDispatchAllowed !== false) errors.push("providerDispatchAllowed must be false");
  if (summary.toolExecutionAllowed !== false) errors.push("toolExecutionAllowed must be false");
  if (summary.workerExecutionAllowed !== false) errors.push("workerExecutionAllowed must be false");
  if (summary.dbWritesAllowed !== false) errors.push("dbWritesAllowed must be false");
  if (summary.deployAllowed !== false) errors.push("deployAllowed must be false");
  if (summary.providerSpendAllowed !== false) errors.push("providerSpendAllowed must be false");
  return { valid: errors.length === 0, errors };
}

export function buildP677FinalValidationEnvelope(input = {}) {
  const summary = buildP677FinalValidationSummary(input);
  return createPassResult({
    phase: "P67.7",
    mode: "final-validation",
    source: "controlled-mutation/p67-7-placeholder.js",
    summary: "P67 final validation is ready to close without enabling mutation.",
    data: { summary },
    evidence: summary.reports,
  });
}
