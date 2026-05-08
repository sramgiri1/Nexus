import fs from "node:fs";
import path from "node:path";
import { getRepoRoot } from "../local-state/safeFileReader.js";
import { getNexusMode, isLocalPrivateMode } from "../private-mode/index.js";
import { runCareLoopBackendControlledValidation, writeCareLoopBackendValidationReports } from "./careloopControlledValidation.js";

const ROUTE_FILE = "projects/careloop/src/routes/circles.js";
const CONTRACT_FILE = "contracts/careloop/completion-insights-remediation-contract.json";
const CONTRACT_DIR = "contracts/careloop";

function requireAllowedMode(mode) {
  return isLocalPrivateMode(mode) || mode === "test";
}

function readFileSync(root, relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function applyDateNowFix(root) {
  const abs = path.join(root, ROUTE_FILE);
  const original = fs.readFileSync(abs, "utf8");
  const before = "const now = new Date();";
  const after = "const now = new Date(Date.now());";
  if (!original.includes(before)) {
    return { applied: false, reason: "Target pattern not found — may already be fixed or changed." };
  }
  const patched = original.replace(before, after);
  fs.writeFileSync(abs, patched, "utf8");
  return { applied: true, changedFile: ROUTE_FILE, from: before, to: after };
}

export function buildCompletionInsightsRemediationPlan(analysis) {
  const classification = analysis?.classification ?? {};
  const confidence = classification.confidence ?? "low";
  const rootCauseCategory = classification.rootCauseCategory ?? "unknown";
  const safeToApplyFixNow = classification.safeToApplyFixNow ?? false;

  const strategy = safeToApplyFixNow ? "apply_narrow_fix" : "plan_only";

  return {
    planVersion: "1.0",
    mode: "local-private",
    projectId: "careloop",
    privateProject: true,
    createdAt: new Date().toISOString(),
    failure: classification.failure ?? {},
    rootCauseCategory,
    confidence,
    remediation: {
      strategy,
      summary: strategy === "apply_narrow_fix"
        ? "Replace new Date() with new Date(Date.now()) in completion insights route to respect Date.now mock in tests."
        : "Manual review required — root cause not conclusively identified.",
      targetFiles: safeToApplyFixNow ? [ROUTE_FILE] : [],
      allowedActions: [
        "read private project source files",
        "write narrow single-file patch if confidence is high",
        "run npm test through controlled validation path",
        "emit evidence/audit/runtime records",
      ],
      forbiddenActions: [
        "npm install",
        "Prisma migrate/reset/seed",
        "start server",
        "call providers",
        "call network",
        "access external DB",
        "read .env",
        "modify iOS project",
        "broad refactor",
        "add dependencies",
        "change schema",
      ],
      validationCommands: ["NEXUS_MODE=local-private npm run careloop:backend-validate"],
    },
    risk: {
      level: safeToApplyFixNow ? "low" : "medium",
      reasons: safeToApplyFixNow
        ? ["1-line change", "well-scoped to date window source", "no schema/dependency change"]
        : ["root cause not confirmed", "manual review needed"],
    },
    safety: {
      providerCalls: false,
      networkCalls: false,
      dbAccess: false,
      apiServer: false,
      dependencyInstall: false,
      migration: false,
    },
    recommendedNextStep: {
      title: safeToApplyFixNow ? "Verify fix with controlled npm test" : "Manual review of completion insights route",
      phase: safeToApplyFixNow ? "P31" : "P31-manual",
      command: "NEXUS_MODE=local-private npm run careloop:backend-validate",
      requiresApproval: false,
    },
    warnings: [],
    errors: [],
  };
}

export function createCompletionInsightsRemediationContract(analysis, plan) {
  return {
    contractVersion: "1.0",
    contractType: "task",
    projectId: "careloop",
    privateProject: true,
    mode: "local-private",
    taskId: "careloop-completion-insights-remediation",
    title: "Investigate CareLoop completion insights test failure",
    objective: "Analyze and remediate the failing completion insights backend test through NEXUS governance.",
    sourceAgent: "auditor",
    targetAgent: "core",
    capabilityId: "implementation.backend_code",
    riskLevel: "medium",
    dataClassification: "confidential",
    mutationAllowed: true,
    mutationScope: "narrow_fix_only",
    buildExecutionAllowed: false,
    testExecutionAllowed: true,
    providerCallsAllowed: false,
    networkCallsAllowed: false,
    dbAccessAllowed: false,
    dependencyInstallAllowed: false,
    allowedRoots: ["projects/careloop/src", "projects/careloop/test"],
    forbiddenActions: [
      "modify private project schema",
      "run npm install",
      "run Prisma migrate/reset/seed",
      "start server",
      "call providers",
      "call network",
      "access external DB",
      "read .env",
      "modify iOS project",
    ],
    acceptanceCriteria: [
      "Failure root cause is classified",
      "Remediation plan is produced",
      "No broad rewrite is performed",
      "If a fix is applied, it is narrow and evidence-backed",
      "npm test result is captured through governed validation path",
      "Evidence and audit records are redacted and linked",
    ],
    requiredEvidence: [
      "backend_validation_failure",
      "failure_analysis",
      "remediation_plan",
      "optional_patch_summary",
      "controlled_test_result",
      "audit_event",
      "runtime_event",
    ],
    appliedFix: plan?.remediation?.strategy === "apply_narrow_fix"
      ? { files: plan.remediation.targetFiles, summary: plan.remediation.summary }
      : null,
    createdAt: new Date().toISOString(),
  };
}

export function optionallyApplyCompletionInsightsFix(analysis, plan, options = {}) {
  const env = options.env ?? process.env;
  const mode = getNexusMode(env);
  const root = getRepoRoot();

  if (!requireAllowedMode(mode)) {
    return { applied: false, reason: `Mode '${mode}' does not allow mutation.` };
  }
  if (plan?.remediation?.strategy !== "apply_narrow_fix") {
    return { applied: false, reason: "Plan strategy is not apply_narrow_fix." };
  }
  if (!analysis?.classification?.safeToApplyFixNow) {
    return { applied: false, reason: "safeToApplyFixNow is false." };
  }

  const fixResult = applyDateNowFix(root);
  if (!fixResult.applied) {
    return { applied: false, reason: fixResult.reason };
  }

  // Run controlled validation to verify the fix.
  const validationResult = runCareLoopBackendControlledValidation({ env });
  writeCareLoopBackendValidationReports(validationResult);

  return {
    applied: true,
    changedFile: ROUTE_FILE,
    from: fixResult.from,
    to: fixResult.to,
    validationStatus: validationResult.execution?.status ?? "UNKNOWN",
    validationExitCode: validationResult.execution?.exitCode ?? -1,
    validationDurationMs: validationResult.execution?.durationMs ?? 0,
    mutationDetected: validationResult.execution?.mutationDetected ?? false,
  };
}

export function writeCompletionInsightsRemediationReports(result) {
  const root = getRepoRoot();
  const now = new Date().toISOString();
  const plan = result.plan ?? {};
  const fixResult = result.fixResult ?? {};
  const reportsDir = path.join(root, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  // Write contract.
  const contractDir = path.join(root, CONTRACT_DIR);
  fs.mkdirSync(contractDir, { recursive: true });
  fs.writeFileSync(path.join(root, CONTRACT_FILE), JSON.stringify(result.contract, null, 2), "utf8");

  const jsonReport = {
    reportVersion: "1.0",
    mode: result.mode,
    projectId: "careloop",
    privateProject: true,
    generatedAt: now,
    rootCauseCategory: plan.rootCauseCategory ?? "unknown",
    confidence: plan.confidence ?? "low",
    strategy: plan.remediation?.strategy ?? "plan_only",
    fixApplied: fixResult.applied ?? false,
    fixDetails: fixResult.applied ? { changedFile: fixResult.changedFile, from: fixResult.from, to: fixResult.to } : null,
    validationAfterFix: fixResult.applied ? {
      status: fixResult.validationStatus,
      exitCode: fixResult.validationExitCode,
      durationMs: fixResult.validationDurationMs,
      mutationDetected: fixResult.mutationDetected,
    } : null,
    remediation: plan.remediation ?? {},
    risk: plan.risk ?? {},
    safety: plan.safety ?? {},
    recommendedNextStep: plan.recommendedNextStep ?? {},
    warnings: result.warnings ?? [],
    errors: result.errors ?? [],
  };

  fs.writeFileSync(path.join(root, "reports/careloop-remediation-plan.json"), JSON.stringify(jsonReport, null, 2), "utf8");

  const mdLines = [
    "# NEXUS Private Project Remediation Plan",
    "",
    "## Metadata",
    "",
    `- Generated at: ${now}`,
    `- Mode: ${result.mode ?? "unknown"}`,
    "- Validation HEAD: (see git log)",
    "",
    "## Root Cause",
    "",
    `- Category: ${plan.rootCauseCategory ?? "unknown"}`,
    `- Confidence: ${plan.confidence ?? "low"}`,
    "",
    "## Strategy",
    "",
    `- Strategy: ${plan.remediation?.strategy ?? "plan_only"}`,
    `- Summary: ${plan.remediation?.summary ?? "N/A"}`,
    `- Target files: ${(plan.remediation?.targetFiles ?? []).join(", ") || "none"}`,
    "",
    "## Fix Applied",
    "",
    `- Applied: ${fixResult.applied ?? false}`,
    ...(fixResult.applied
      ? [
          `- Changed file: ${fixResult.changedFile}`,
          `- From: \`${fixResult.from}\``,
          `- To: \`${fixResult.to}\``,
          "",
          "## Validation After Fix",
          "",
          `- Status: ${fixResult.validationStatus ?? "N/A"}`,
          `- Exit code: ${fixResult.validationExitCode ?? "N/A"}`,
          `- Duration: ${fixResult.validationDurationMs ?? 0}ms`,
          `- Mutation detected: ${fixResult.mutationDetected ?? false}`,
        ]
      : []),
    "",
    "## Safety",
    "",
    `- Provider calls: ${plan.safety?.providerCalls ?? false}`,
    `- Network calls: ${plan.safety?.networkCalls ?? false}`,
    `- DB access: ${plan.safety?.dbAccess ?? false}`,
    `- API server: ${plan.safety?.apiServer ?? false}`,
    `- Dependency install: ${plan.safety?.dependencyInstall ?? false}`,
    `- Migration: ${plan.safety?.migration ?? false}`,
    "",
    "## Recommended Next Step",
    "",
    `- ${plan.recommendedNextStep?.title ?? "N/A"}`,
    `- Command: \`${plan.recommendedNextStep?.command ?? "N/A"}\``,
    "",
    `## Result: ${fixResult.applied ? (fixResult.validationStatus ?? "APPLIED") : "PLAN_ONLY"}`,
    "",
    ...(result.warnings?.length ? ["## Warnings", "", ...result.warnings.map((w) => `- ${w}`), ""] : []),
  ];

  fs.writeFileSync(path.join(root, "reports/careloop-remediation-plan.md"), mdLines.join("\n"), "utf8");
}
