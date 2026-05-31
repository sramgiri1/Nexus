import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE,
  SECURITY_PRIVACY_COMPLIANCE_CONTROL_SAFETY_FLAG_NAMES,
  SECURITY_PRIVACY_COMPLIANCE_CONTROL_VERSION,
  buildSecurityPrivacyComplianceControlEnvelope,
  buildSecurityPrivacyComplianceControlModel,
  buildSecurityPrivacyComplianceDataHandlingControl,
  buildSecurityPrivacyComplianceEvidence,
  buildSecurityPrivacyCompliancePolicyEnforcement,
  buildSecurityPrivacyCompliancePrivacyBoundary,
  buildSecurityPrivacyComplianceSecurityControl,
  validateSecurityPrivacyComplianceControlModel,
  validateSecurityPrivacyComplianceDataHandlingControl,
  validateSecurityPrivacyComplianceEvidence,
  validateSecurityPrivacyCompliancePolicyEnforcement,
  validateSecurityPrivacyCompliancePrivacyBoundary,
  validateSecurityPrivacyComplianceSecurityControl,
} from "../shared/securityPrivacyComplianceControlModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1412-security-privacy-compliance-controls-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p141-security-privacy-compliance-controls-contracts.json";
const PLAN_PATH = "docs/architecture/P141_SECURITY_PRIVACY_COMPLIANCE_CONTROLS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1412-security-privacy-compliance-controls";
const EXPECTED_BASE_COMMIT = "43cfaaf8";
const EXPECTED_EXPORTS = [
  "SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE",
  "SECURITY_PRIVACY_COMPLIANCE_CONTROL_VERSION",
  "SECURITY_PRIVACY_COMPLIANCE_CONTROL_SAFETY_FLAG_NAMES",
  "buildSecurityPrivacyComplianceSecurityControl",
  "validateSecurityPrivacyComplianceSecurityControl",
  "buildSecurityPrivacyCompliancePrivacyBoundary",
  "validateSecurityPrivacyCompliancePrivacyBoundary",
  "buildSecurityPrivacyComplianceEvidence",
  "validateSecurityPrivacyComplianceEvidence",
  "buildSecurityPrivacyCompliancePolicyEnforcement",
  "validateSecurityPrivacyCompliancePolicyEnforcement",
  "buildSecurityPrivacyComplianceDataHandlingControl",
  "validateSecurityPrivacyComplianceDataHandlingControl",
  "buildSecurityPrivacyComplianceControlModel",
  "validateSecurityPrivacyComplianceControlModel",
  "buildSecurityPrivacyComplianceControlEnvelope",
];
const VALIDATION_COMMANDS = [
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|read-only|display-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|validation-only|zero-spend)\b/i.test(context);
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
const p1411 = subphaseById.get("P141.1") || {};
const p1412 = subphaseById.get("P141.2") || {};
const p1413 = subphaseById.get("P141.3") || {};
const p1414 = subphaseById.get("P141.4") || {};
const p1415 = subphaseById.get("P141.5") || {};
const p1416 = subphaseById.get("P141.6") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const p1411Checker = readText("scripts/check-p1411-security-privacy-compliance-controls.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const checkerSource = readText("scripts/check-p1412-security-privacy-compliance-controls.js");
const modelSource = readText("shared/securityPrivacyComplianceControlModel.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P141.2";
const allowedFiles = new Set(p1412.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
  "dashboard/tests/",
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
const securityControl = buildSecurityPrivacyComplianceSecurityControl({ sequence: 1 });
const privacyBoundary = buildSecurityPrivacyCompliancePrivacyBoundary({ sequence: 1 });
const complianceEvidence = buildSecurityPrivacyComplianceEvidence({ sequence: 1 });
const policyEnforcement = buildSecurityPrivacyCompliancePolicyEnforcement({ sequence: 1 });
const dataHandlingControl = buildSecurityPrivacyComplianceDataHandlingControl({ sequence: 1 });
const model = buildSecurityPrivacyComplianceControlModel({ createdAt: "2026-05-31T07:10:00.000Z" });
const envelope = buildSecurityPrivacyComplianceControlEnvelope({ model });
const modelValidation = validateSecurityPrivacyComplianceControlModel(model);
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const p1412CurrentState =
  status.currentPhase === "P141.2"
  && status.previousPhase === "P141.1"
  && status.nextPhase === "P141.3"
  && roadmap.currentPhase === "P141.2"
  && roadmap.previousPhase === "P141.1"
  && roadmap.nextPhase === "P141.3"
  && status.current?.phaseId === "P141.2"
  && status.previous?.phaseId === "P141.1"
  && status.next?.phaseId === "P141.3"
  && roadmap.current?.phaseId === "P141.2"
  && roadmap.previous?.phaseId === "P141.1"
  && roadmap.next?.phaseId === "P141.3"
  && statusById.get("P140")?.status === "complete"
  && roadmapById.get("P140")?.status === "complete"
  && statusById.get("P140.7")?.status === "complete"
  && roadmapById.get("P140.7")?.status === "complete"
  && statusById.get("P141")?.status === "in_progress"
  && roadmapById.get("P141")?.status === "in_progress"
  && statusById.get("P141.1")?.status === "complete"
  && roadmapById.get("P141.1")?.status === "complete"
  && statusById.get("P141.2")?.status === "complete"
  && roadmapById.get("P141.2")?.status === "complete"
  && statusById.get("P141.3")?.status === "planned"
  && roadmapById.get("P141.3")?.status === "planned";
const p1413CurrentState =
  status.currentPhase === "P141.3"
  && status.previousPhase === "P141.2"
  && status.nextPhase === "P141.4"
  && roadmap.currentPhase === "P141.3"
  && roadmap.previousPhase === "P141.2"
  && roadmap.nextPhase === "P141.4"
  && status.current?.phaseId === "P141.3"
  && status.previous?.phaseId === "P141.2"
  && status.next?.phaseId === "P141.4"
  && roadmap.current?.phaseId === "P141.3"
  && roadmap.previous?.phaseId === "P141.2"
  && roadmap.next?.phaseId === "P141.4"
  && statusById.get("P140")?.status === "complete"
  && roadmapById.get("P140")?.status === "complete"
  && statusById.get("P140.7")?.status === "complete"
  && roadmapById.get("P140.7")?.status === "complete"
  && statusById.get("P141")?.status === "in_progress"
  && roadmapById.get("P141")?.status === "in_progress"
  && statusById.get("P141.1")?.status === "complete"
  && roadmapById.get("P141.1")?.status === "complete"
  && statusById.get("P141.2")?.status === "complete"
  && roadmapById.get("P141.2")?.status === "complete"
  && statusById.get("P141.3")?.status === "complete"
  && roadmapById.get("P141.3")?.status === "complete"
  && statusById.get("P141.4")?.status === "planned"
  && roadmapById.get("P141.4")?.status === "planned";
const p1414CurrentState =
  status.currentPhase === "P141.4"
  && status.previousPhase === "P141.3"
  && status.nextPhase === "P141.5"
  && roadmap.currentPhase === "P141.4"
  && roadmap.previousPhase === "P141.3"
  && roadmap.nextPhase === "P141.5"
  && status.current?.phaseId === "P141.4"
  && status.previous?.phaseId === "P141.3"
  && status.next?.phaseId === "P141.5"
  && roadmap.current?.phaseId === "P141.4"
  && roadmap.previous?.phaseId === "P141.3"
  && roadmap.next?.phaseId === "P141.5"
  && statusById.get("P140")?.status === "complete"
  && roadmapById.get("P140")?.status === "complete"
  && statusById.get("P140.7")?.status === "complete"
  && roadmapById.get("P140.7")?.status === "complete"
  && statusById.get("P141")?.status === "in_progress"
  && roadmapById.get("P141")?.status === "in_progress"
  && statusById.get("P141.1")?.status === "complete"
  && roadmapById.get("P141.1")?.status === "complete"
  && statusById.get("P141.2")?.status === "complete"
  && roadmapById.get("P141.2")?.status === "complete"
  && statusById.get("P141.3")?.status === "complete"
  && roadmapById.get("P141.3")?.status === "complete"
  && statusById.get("P141.4")?.status === "complete"
  && roadmapById.get("P141.4")?.status === "complete"
  && statusById.get("P141.5")?.status === "planned"
  && roadmapById.get("P141.5")?.status === "planned";
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
  && statusById.get("P140")?.status === "complete"
  && roadmapById.get("P140")?.status === "complete"
  && statusById.get("P140.7")?.status === "complete"
  && roadmapById.get("P140.7")?.status === "complete"
  && statusById.get("P141")?.status === "in_progress"
  && roadmapById.get("P141")?.status === "in_progress"
  && ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P141.6")?.status === "planned"
  && roadmapById.get("P141.6")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1412-security-privacy-compliance-controls.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("model exports expected API", EXPECTED_EXPORTS.every((entry) => modelSource.includes(`export const ${entry}`) || modelSource.includes(`export function ${entry}`)));
addCheck("model reuses existing control, mode, redaction, and envelope helpers", [
  "../compliance/p77-4-placeholder.js",
  "./modeGuard.js",
  "./redaction.js",
  "./resultEnvelope.js",
].every((target) => modelSource.includes(target)));
addCheck("model constants are correct", SECURITY_PRIVACY_COMPLIANCE_CONTROL_PHASE === "P141.2" && SECURITY_PRIVACY_COMPLIANCE_CONTROL_VERSION === "1.0" && SECURITY_PRIVACY_COMPLIANCE_CONTROL_SAFETY_FLAG_NAMES.length >= 20);
addCheck("security control validates", validateSecurityPrivacyComplianceSecurityControl(securityControl).valid);
addCheck("privacy boundary validates", validateSecurityPrivacyCompliancePrivacyBoundary(privacyBoundary).valid);
addCheck("compliance evidence validates", validateSecurityPrivacyComplianceEvidence(complianceEvidence).valid);
addCheck("policy enforcement validates", validateSecurityPrivacyCompliancePolicyEnforcement(policyEnforcement).valid);
addCheck("data handling control validates", validateSecurityPrivacyComplianceDataHandlingControl(dataHandlingControl).valid);
addCheck("control model validates", modelValidation.valid, modelValidation.errors.join("; "));
addCheck("control model is read-only and hidden from direct Command Center rendering", model.modelOnly === true && model.readOnly === true && model.localOnly === true && model.commandCenterVisible === false);
addCheck("control model has required rows", model.controls.length >= 3 && model.privacyBoundaries.length >= 3 && model.complianceEvidence.length >= 2 && model.policyEnforcement.length >= 1 && model.dataHandlingControls.length >= 3);
addCheck("control mapping preview reused and blocked", model.controlMappingPreview?.valid === true && model.controlMappingPreview.certificationAllowed === false && model.controlMappingPreview.providerSpendAllowed === false);
addCheck("all safety flags remain false", Object.values(model.safetyFlags || {}).every((value) => value === false) && SECURITY_PRIVACY_COMPLIANCE_CONTROL_SAFETY_FLAG_NAMES.every((flag) => model[flag] === false));
addCheck("cost impact remains zero-spend", model.costImpact.estimatedUsd === 0 && model.costImpact.actualUsd === 0 && model.costImpact.providerSpendAllowed === false && model.costImpact.networkCallsAllowed === false);
addCheck("envelope validates", envelope.envelopeValid === true && envelope.ok === true && envelope.status === "PASS");
addCheck("P141.1 report passes", reportPassed("reports/p1411-security-privacy-compliance-controls-report.md"));
addCheck("contract advances to P141.2 safely", contract.phaseId === "P141" && contract.status === "in_progress" && ((contract.currentSubphase === "P141.2" && contract.previousSubphase === "P141.1" && contract.nextSubphase === "P141.3") || (contract.currentSubphase === "P141.3" && contract.previousSubphase === "P141.2" && contract.nextSubphase === "P141.4") || (contract.currentSubphase === "P141.4" && contract.previousSubphase === "P141.3" && contract.nextSubphase === "P141.5") || (contract.currentSubphase === "P141.5" && contract.previousSubphase === "P141.4" && contract.nextSubphase === "P141.6")));
addCheck("contract records expected base commit", p1412.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("P141.1 complete, P141.2 complete, next P141 state valid", p1411.status === "complete" && p1412.status === "complete" && (p1413.status === "planned" || (p1413.status === "complete" && p1414.status === "planned") || (p1413.status === "complete" && p1414.status === "complete" && p1415.status === "planned") || (p1413.status === "complete" && p1414.status === "complete" && p1415.status === "complete" && p1416.status === "planned")));
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1412.validationCommands?.includes(command)));
addCheck("P141.1 checker accepts P141.2", p1411Checker.includes("p1412CurrentState") && p1411Checker.includes('status.currentPhase === "P141.2"'));
addCheck("enterprise checker accepts P141.2", enterpriseChecker.includes("p1412CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P141.6 handoff", ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5", "P141.6"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P141 plan records P141.2", /## P141\.2 Control Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P141.2", /P141\.2 security\/privacy\/compliance control model/i.test(readme));
addCheck("platform roadmap records P141.2", /P141\.2 security\/privacy\/compliance control model is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P141.2", /P141\.2 is now complete/i.test(enterpriseRoadmap) && (/P141\.3 is the next executable subphase/i.test(enterpriseRoadmap) || /P141\.4 is the next executable subphase/i.test(enterpriseRoadmap) || /P141\.5 is the next executable subphase/i.test(enterpriseRoadmap) || /P141\.6 is the next executable subphase/i.test(enterpriseRoadmap)));
addCheck("phase status advances to P141.2", p1412CurrentState || p1413CurrentState || p1414CurrentState || p1415CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P141.2 entries have required fields", [statusById.get("P141"), statusById.get("P141.2"), roadmapById.get("P141"), roadmapById.get("P141.2")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("next P141 subphase remains planned-only", (statusById.get("P141.3")?.status === "planned" && roadmapById.get("P141.3")?.status === "planned" && !(statusById.get("P141.3")?.checksRun || []).length && !(roadmapById.get("P141.3")?.checksRun || []).length) || (p1413CurrentState && statusById.get("P141.4")?.status === "planned" && roadmapById.get("P141.4")?.status === "planned" && !(statusById.get("P141.4")?.checksRun || []).length && !(roadmapById.get("P141.4")?.checksRun || []).length) || (p1414CurrentState && statusById.get("P141.5")?.status === "planned" && roadmapById.get("P141.5")?.status === "planned" && !(statusById.get("P141.5")?.checksRun || []).length && !(roadmapById.get("P141.5")?.checksRun || []).length) || (p1415CurrentState && statusById.get("P141.6")?.status === "planned" && roadmapById.get("P141.6")?.status === "planned" && !(statusById.get("P141.6")?.checksRun || []).length && !(roadmapById.get("P141.6")?.checksRun || []).length));
addCheck("changed files stay in P141.2 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P141.2 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("route-wide security/compliance coverage retained", ["Compliance route renders readiness", "Auth Governance route renders readiness", "safety center shows plain-language safety posture", "Command Center route-wide UX"].every((text) => routeTests.includes(text)));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|backup|restore|runbook|storage|control|evidence)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
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
        "- Adds a read-only P141 security, privacy, compliance, policy, evidence, and data-handling control model.",
        "- Reuses existing control-mapping preview, mode guard, redaction, and result-envelope helpers.",
        "- Does not enable credential handling, raw data exposure, runtime policy enforcement, certification, legal attestation, audit export, raw log export, compliance package creation, DB/runtime writes, live CRUD, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P141.2 is a read-only local control model. It does not render new Command Center UI, handle credentials, expose raw data, enforce policy at runtime, certify compliance, sign legal attestations, export audits, export raw logs, create compliance packages, write DB/runtime state, run live CRUD, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend. Later P141 subphases may be complete when this compatibility checker runs; P141.6 remains planned-only until implemented.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P141.2 Security Privacy Compliance Controls Report", phase: "P141.2" },
);

printCheckReport("P141.2 Security Privacy Compliance Controls Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
