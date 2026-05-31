import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildComplianceReadinessViewModel } from "../dashboard/src/data/complianceReadiness.js";
import { buildSecurityPrivacyComplianceControlModel, validateSecurityPrivacyComplianceControlModel } from "../shared/securityPrivacyComplianceControlModel.js";
import { buildSecurityPrivacyCompliancePreview, validateSecurityPrivacyCompliancePreview } from "../shared/securityPrivacyCompliancePreview.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1415-security-privacy-compliance-controls-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p141-security-privacy-compliance-controls-contracts.json";
const PLAN_PATH = "docs/architecture/P141_SECURITY_PRIVACY_COMPLIANCE_CONTROLS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1415-security-privacy-compliance-controls";
const EXPECTED_BASE_COMMIT = "9baa0e1d";
const PRIOR_REPORTS = [
  "reports/p1411-security-privacy-compliance-controls-report.md",
  "reports/p1412-security-privacy-compliance-controls-report.md",
  "reports/p1413-security-privacy-compliance-controls-report.md",
  "reports/p1414-security-privacy-compliance-controls-report.md",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1415-security-privacy-compliance-controls",
  "npm run check:p1414-security-privacy-compliance-controls",
  "npm run check:p1413-security-privacy-compliance-controls",
  "npm run check:p1412-security-privacy-compliance-controls",
  "npm run check:p1411-security-privacy-compliance-controls",
  "npm run check:p1407-backup-recovery-dr-final-validation",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Compliance|Auth Governance|safety center|Command Center route-wide UX\"",
  "git diff --check",
];

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function reportPassed(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  if (!existsSync(absolutePath)) return false;
  return /## Result[\s\S]*PASS|Result:\s+PASS/i.test(readText(relativePath));
}

function changedFiles() {
  return execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]{1,2}\s+/, ""))
    .map((line) => (line.includes(" -> ") ? line.split(" -> ").pop() : line));
}

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    if (/^\s*-\s+`[^`]+`\s*$/.test(line)) return false;
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|read-only|display-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|validation-only|zero-spend|hidden|coverage)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson(CONTRACT_PATH);
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1414 = subphaseById.get("P141.4") || {};
const p1415 = subphaseById.get("P141.5") || {};
const p1416 = subphaseById.get("P141.6") || {};
const checkerSource = readText("scripts/check-p1415-security-privacy-compliance-controls.js");
const p1414Checker = readText("scripts/check-p1414-security-privacy-compliance-controls.js");
const p1413Checker = readText("scripts/check-p1413-security-privacy-compliance-controls.js");
const p1412Checker = readText("scripts/check-p1412-security-privacy-compliance-controls.js");
const p1411Checker = readText("scripts/check-p1411-security-privacy-compliance-controls.js");
const p1407Checker = readText("scripts/check-p1407-backup-recovery-dr-final-validation.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const readiness = buildComplianceReadinessViewModel();
const controlModel = buildSecurityPrivacyComplianceControlModel();
const preview = buildSecurityPrivacyCompliancePreview();
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P141.5";
const allowedFiles = new Set(p1415.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
  "db/",
  "local-state/runtime/",
  "providers/",
  "tools/",
  "worker-runtime/",
  "deploy/",
  "release/",
  "exports/",
  "packages/",
  ".env",
];
const displayBundle = [
  readiness.pageTitle,
  readiness.whatChanged,
  readiness.currentState,
  readiness.nextAction,
  readiness.evidenceLocation,
  readiness.activityLocation,
  readiness.costImpact,
  readiness.readinessCards.map((card) => `${card.label} ${card.value} ${card.detail}`).join(" "),
  readiness.compliancePreviewRows.map((row) => `${row.type} ${row.label} ${row.currentState} ${row.blockedState} ${row.owner} ${row.nextAction} ${row.blockers.join(" ")}`).join(" "),
  readiness.compliancePreviewSections.map((section) => `${section.label} ${section.rowCount} ${section.blockedCount} ${section.nextAction}`).join(" "),
  readiness.disabledActions.map((action) => `${action.label} ${action.reason}`).join(" "),
].join("\n");
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const p1415CurrentState =
  status.currentPhase === "P141.5"
  && status.previousPhase === "P141.4"
  && status.nextPhase === "P141.6"
  && roadmap.currentPhase === "P141.5"
  && roadmap.previousPhase === "P141.4"
  && roadmap.nextPhase === "P141.6"
  && status.current?.phaseId === "P141.5"
  && status.previous?.phaseId === "P141.4"
  && status.next?.phaseId === "P141.6"
  && roadmap.current?.phaseId === "P141.5"
  && roadmap.previous?.phaseId === "P141.4"
  && roadmap.next?.phaseId === "P141.6"
  && statusById.get("P141")?.status === "in_progress"
  && roadmapById.get("P141")?.status === "in_progress"
  && ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P141.6")?.status === "planned"
  && roadmapById.get("P141.6")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1415-security-privacy-compliance-controls.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("P141.1-P141.4 reports pass", PRIOR_REPORTS.every(reportPassed));
addCheck("P141 control model still validates", validateSecurityPrivacyComplianceControlModel(controlModel).valid);
addCheck("P141 preview still validates", validateSecurityPrivacyCompliancePreview(preview).valid);
addCheck("Compliance view model exposes aggregate UX data", readiness.compliancePreviewRows.length >= 12 && readiness.compliancePreviewSections.length >= 4 && readiness.disabledActions.length >= 6 && readiness.compliancePreviewSummary.runnableActionCount === 0);
addCheck("Compliance display remains public-safe", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|backup|restore|runbook|storage|control|evidence|compliance)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(displayBundle) && !/P141\.|raw JSON|raw logs?|raw policy dump|Bearer\s+|jwt|id_token|access_token|postgres(?:ql)?:\/\//i.test(displayBundle));
addCheck("Compliance display has no fake runnable actions", !/certify now|attest now|export audit now|create package now|enforce policy now|handle credentials now|write db now|call provider now|run tool now|dispatch agent now|mutate project now|deploy now|release now|package now|execute now|spend now/i.test(displayBundle));
addCheck("Playwright aggregate coverage added", routeTests.includes("P141.5 security privacy compliance aggregate coverage keeps Compliance review-only") && routeTests.includes("Security Preview Summary") && routeTests.includes("Policy enforcement disabled") && routeTests.includes("Credential handling disabled") && routeTests.includes("P141\\."));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("contract advances to P141.5 safely", contract.phaseId === "P141" && contract.status === "in_progress" && contract.currentSubphase === "P141.5" && contract.previousSubphase === "P141.4" && contract.nextSubphase === "P141.6");
addCheck("contract records expected base commit", p1415.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("P141.4 complete, P141.5 complete, P141.6 planned", p1414.status === "complete" && p1415.status === "complete" && p1416.status === "planned");
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1415.validationCommands?.includes(command)));
addCheck("P141.4 checker accepts P141.5", p1414Checker.includes("p1415CurrentState") && p1414Checker.includes('status.currentPhase === "P141.5"'));
addCheck("P141.3 checker accepts P141.5", p1413Checker.includes("p1415CurrentState") && p1413Checker.includes('status.currentPhase === "P141.5"'));
addCheck("P141.2 checker accepts P141.5", p1412Checker.includes("p1415CurrentState") && p1412Checker.includes('status.currentPhase === "P141.5"'));
addCheck("P141.1 checker accepts P141.5", p1411Checker.includes("p1415CurrentState") && p1411Checker.includes('status.currentPhase === "P141.5"'));
addCheck("P140.7 checker accepts P141.5", p1407Checker.includes("p1415CurrentState") && p1407Checker.includes('status.currentPhase === "P141.5"'));
addCheck("enterprise checker accepts P141.5", enterpriseChecker.includes("p1415CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P141.6 handoff", ["P141.4", "P141.5", "P141.6"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P141 plan records P141.5", /## P141\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P141.5", /P141\.5 Tests \/ Checkers/i.test(readme));
addCheck("platform roadmap records P141.5", /P141\.5 Tests \/ Checkers is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P141.5", /P141\.5 is now complete/i.test(enterpriseRoadmap) && /P141\.6 is the next executable subphase/i.test(enterpriseRoadmap));
addCheck("phase status advances to P141.5", p1415CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P141.5 entries have required fields", [statusById.get("P141"), statusById.get("P141.5"), roadmapById.get("P141"), roadmapById.get("P141.5")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P141.6 remains planned-only", statusById.get("P141.6")?.status === "planned" && roadmapById.get("P141.6")?.status === "planned" && !(statusById.get("P141.6")?.checksRun || []).length && !(roadmapById.get("P141.6")?.checksRun || []).length);
addCheck("changed files stay in P141.5 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) || file === "dashboard/tests/routes.spec.js"), changed.join(", "));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|backup|restore|runbook|storage|control|evidence|compliance)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid raw storage or export URLs", !/s3:\/\/|gs:\/\/|az:\/\/|https:\/\/[^ \n]*(audit|evidence|export|package|compliance|storage|secret)/i.test(docsBundle));
addCheck("docs avoid fake runnable security actions", !/certify now|attest now|export audit now|export logs now|create package now|enforce policy now|handle credentials now|read secret now|write db now|call provider now|run tool now|dispatch agent now|mutate project now|deploy now|release now|export now|package now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /credentials are handled|raw data is exposed|policy enforcement is enabled|certification is enabled|legal attestation is enabled|audit export is enabled|raw log export is enabled|compliance package creation is enabled|DB writes are enabled|runtime writes are enabled|CRUD is live|provider calls are enabled|model calls are enabled|tool execution is enabled|MCP startup is enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled|spend is enabled/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump|raw compliance payload|raw audit payload|raw evidence payload|raw secret/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Adds aggregate P141.5 checker and Playwright coverage for security/privacy/compliance controls.",
        "- Verifies P141.1-P141.4 reports, control model, preview model, Compliance UX data, route-wide safety coverage, and P141.6 handoff.",
        "- Does not handle credentials, expose raw data, enforce policy, certify compliance, export audits, export logs, create packages, write DB/runtime state, call providers/models, execute tools, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Coverage Summary",
      body: [
        `- Prior reports passing: ${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`,
        `- Preview rows: ${readiness.compliancePreviewRows.length}`,
        `- Preview sections: ${readiness.compliancePreviewSections.length}`,
        `- Disabled actions: ${readiness.disabledActions.length}`,
        `- Runnable actions: ${readiness.compliancePreviewSummary.runnableActionCount}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P141.5 is tests/checkers hardening only. It does not handle credentials, expose raw data, enforce policy at runtime, certify compliance, sign legal attestations, export audits, export logs, create compliance packages, write DB/runtime state, run live CRUD, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend. P141.6 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P141.5 Security Privacy Compliance Controls Report", phase: "P141.5" },
);

printCheckReport("P141.5 Security Privacy Compliance Controls Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
