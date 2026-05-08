import process from "node:process";
import { getNexusMode, isLocalPrivateMode } from "../private-mode/index.js";
import {
  analyzeCompletionInsightsFailure,
  writeCompletionInsightsFailureReports,
} from "../careloop-readiness/careloopTestFailureAnalysis.js";
import {
  buildCompletionInsightsRemediationPlan,
  createCompletionInsightsRemediationContract,
  optionallyApplyCompletionInsightsFix,
  writeCompletionInsightsRemediationReports,
} from "../careloop-readiness/careloopRemediationPlan.js";

const mode = getNexusMode(process.env);
const applyFix = process.argv.includes("--apply-narrow-fix");

if (!isLocalPrivateMode(mode)) {
  console.error(`NEXUS CareLoop Test Failure Analysis requires NEXUS_MODE=local-private. Got: ${mode}`);
  process.exit(1);
}

console.log("NEXUS CareLoop Test Failure Analysis");
console.log("====================================");
console.log("");
console.log(`Mode: ${mode}`);
console.log("Failure: GET /circles/:id/insights/completion");
console.log("Expected: 2");
console.log("Actual: 0");
console.log("Test: projects/careloop/test/sprint2.test.js:1888");
console.log("");
console.log("Safety:");
console.log("- Install: disabled");
console.log("- Provider/network: disabled");
console.log("- DB/API: disabled");
console.log("- Migrations: disabled");
console.log(`- Fix application: ${applyFix ? "ENABLED (--apply-narrow-fix)" : "disabled (plan-only)"}`);
console.log("");

const analysis = analyzeCompletionInsightsFailure({ env: process.env });
writeCompletionInsightsFailureReports(analysis);

const cls = analysis.classification ?? {};
console.log("Root cause:");
console.log(`- category: ${cls.rootCauseCategory ?? "unknown"}`);
console.log(`- confidence: ${cls.confidence ?? "low"}`);
if (cls.suspectFiles?.length) {
  console.log(`- suspect files: ${cls.suspectFiles.join(", ")}`);
}
console.log("");

const plan = buildCompletionInsightsRemediationPlan(analysis);
const contract = createCompletionInsightsRemediationContract(analysis, plan);

let fixResult = { applied: false, reason: "plan-only mode (no --apply-narrow-fix flag)" };
if (applyFix) {
  if (cls.safeToApplyFixNow) {
    fixResult = optionallyApplyCompletionInsightsFix(analysis, plan, { env: process.env });
  } else {
    fixResult = { applied: false, reason: `safeToApplyFixNow is false (confidence: ${cls.confidence ?? "low"})` };
  }
}

writeCompletionInsightsRemediationReports({
  mode,
  plan,
  contract,
  fixResult,
  warnings: [...(analysis.warnings ?? [])],
  errors: [...(analysis.errors ?? [])],
});

console.log("Remediation:");
console.log(`- strategy: ${plan.remediation?.strategy ?? "plan_only"}`);
console.log(`- mutation applied: ${fixResult.applied}`);
if (fixResult.applied) {
  console.log(`- changed file: ${fixResult.changedFile}`);
}
if (!fixResult.applied && fixResult.reason) {
  console.log(`- reason: ${fixResult.reason}`);
}
if (plan.remediation?.targetFiles?.length) {
  console.log(`- target files: ${plan.remediation.targetFiles.join(", ")}`);
}
console.log("");

const validationStatus = fixResult.validationStatus;
const validationExitCode = fixResult.validationExitCode;
console.log("Validation:");
if (fixResult.applied) {
  console.log(`- npm test status: ${validationStatus ?? "N/A"}`);
  console.log(`- exit code: ${validationExitCode ?? "N/A"}`);
  console.log(`- failing test remains: ${validationStatus === "PASS" ? "no" : "yes (see report)"}`);
} else {
  console.log("- npm test status: not run (plan-only)");
  console.log("- failing test remains: unknown (no validation run)");
}
console.log("");
console.log("Result:");
console.log(`- analysis report: reports/careloop-test-failure-analysis.md`);
console.log(`- remediation plan: reports/careloop-remediation-plan.md`);
console.log(`- contract: contracts/careloop/completion-insights-remediation-contract.json`);
console.log("");

if (analysis.warnings?.length > 0) {
  console.log("Warnings:");
  for (const w of analysis.warnings) console.log(`  - ${w}`);
  console.log("");
}

// Exit 0 always — analysis result is a legitimate data point, not an infra error.
