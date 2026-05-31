import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  SECURITY_PRIVACY_COMPLIANCE_PREVIEW_AUTHORITY_FLAGS,
  SECURITY_PRIVACY_COMPLIANCE_PREVIEW_PHASE,
  SECURITY_PRIVACY_COMPLIANCE_PREVIEW_VERSION,
  buildSecurityPrivacyCompliancePreview,
  buildSecurityPrivacyCompliancePreviewEnvelope,
  buildSecurityPrivacyCompliancePreviewRow,
  buildSecurityPrivacyCompliancePreviewSection,
  validateSecurityPrivacyCompliancePreview,
  validateSecurityPrivacyCompliancePreviewRow,
  validateSecurityPrivacyCompliancePreviewSection,
} from "../shared/securityPrivacyCompliancePreview.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1413-security-privacy-compliance-controls-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p141-security-privacy-compliance-controls-contracts.json";
const PLAN_PATH = "docs/architecture/P141_SECURITY_PRIVACY_COMPLIANCE_CONTROLS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1413-security-privacy-compliance-controls";
const EXPECTED_BASE_COMMIT = "41573ae5";
const EXPECTED_EXPORTS = [
  "SECURITY_PRIVACY_COMPLIANCE_PREVIEW_PHASE",
  "SECURITY_PRIVACY_COMPLIANCE_PREVIEW_VERSION",
  "SECURITY_PRIVACY_COMPLIANCE_PREVIEW_AUTHORITY_FLAGS",
  "buildSecurityPrivacyCompliancePreviewRow",
  "validateSecurityPrivacyCompliancePreviewRow",
  "buildSecurityPrivacyCompliancePreviewSection",
  "validateSecurityPrivacyCompliancePreviewSection",
  "buildSecurityPrivacyCompliancePreview",
  "validateSecurityPrivacyCompliancePreview",
  "buildSecurityPrivacyCompliancePreviewEnvelope",
];
const VALIDATION_COMMANDS = [
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|read-only|display-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|validation-only|zero-spend|hidden)\b/i.test(context);
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
const p1412 = subphaseById.get("P141.2") || {};
const p1413 = subphaseById.get("P141.3") || {};
const p1414 = subphaseById.get("P141.4") || {};
const p1415 = subphaseById.get("P141.5") || {};
const p1416 = subphaseById.get("P141.6") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const p1412Checker = readText("scripts/check-p1412-security-privacy-compliance-controls.js");
const p1411Checker = readText("scripts/check-p1411-security-privacy-compliance-controls.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const checkerSource = readText("scripts/check-p1413-security-privacy-compliance-controls.js");
const helperSource = readText("shared/securityPrivacyCompliancePreview.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P141.3";
const allowedFiles = new Set(p1413.allowedFiles || []);
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
const previewRow = buildSecurityPrivacyCompliancePreviewRow();
const previewSection = buildSecurityPrivacyCompliancePreviewSection({ rows: [previewRow] });
const preview = buildSecurityPrivacyCompliancePreview({ createdAt: "2026-05-31T07:30:00.000Z" });
const rowValidation = validateSecurityPrivacyCompliancePreviewRow(previewRow);
const sectionValidation = validateSecurityPrivacyCompliancePreviewSection(previewSection);
const previewValidation = validateSecurityPrivacyCompliancePreview(preview);
const envelope = buildSecurityPrivacyCompliancePreviewEnvelope({ preview });
const serializedPreview = JSON.stringify(preview);
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
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
  && statusById.get("P141")?.status === "in_progress"
  && roadmapById.get("P141")?.status === "in_progress"
  && ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P141.6")?.status === "planned"
  && roadmapById.get("P141.6")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1413-security-privacy-compliance-controls.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("preview exports expected API", EXPECTED_EXPORTS.every((entry) => helperSource.includes(`export const ${entry}`) || helperSource.includes(`export function ${entry}`)));
addCheck("preview reuses P141.2 model and shared helpers", [
  "./securityPrivacyComplianceControlModel.js",
  "./modeGuard.js",
  "./redaction.js",
  "./resultEnvelope.js",
].every((target) => helperSource.includes(target)));
addCheck("preview helper has no writers or execution hooks", !/\b(writeFileSync|appendFileSync|mkdirSync|rmSync|execFileSync|spawn|fetch|XMLHttpRequest|sqlite|postgres|mongodb|createServer|listen)\b/.test(helperSource));
addCheck("preview constants are correct", SECURITY_PRIVACY_COMPLIANCE_PREVIEW_PHASE === "P141.3" && SECURITY_PRIVACY_COMPLIANCE_PREVIEW_VERSION === "1.0" && SECURITY_PRIVACY_COMPLIANCE_PREVIEW_AUTHORITY_FLAGS.length >= 25);
addCheck("preview row validates", rowValidation.valid, rowValidation.errors.join("; "));
addCheck("preview section validates", sectionValidation.valid, sectionValidation.errors.join("; "));
addCheck("preview validates", previewValidation.valid, previewValidation.errors.join("; "));
addCheck("preview envelope passes", envelope.ok === true && envelope.status === "PASS" && envelope.phase === "P141.3" && envelope.envelopeValid === true);
addCheck("preview is display-safe and hidden from direct Command Center rendering", preview.previewOnly === true && preview.localOnly === true && preview.readOnly === true && preview.commandCenterVisible === false);
addCheck("preview covers controls privacy evidence policy and data rows", preview.previewRows.length >= 12 && ["control", "privacy", "evidence", "policy", "data"].every((rowType) => preview.previewRows.some((row) => row.rowType === rowType)) && preview.previewSections.length >= 4);
addCheck("all preview authority flags remain blocked", SECURITY_PRIVACY_COMPLIANCE_PREVIEW_AUTHORITY_FLAGS.every((flag) => preview[flag] === false && preview.safetyFlags?.[flag] === false && preview.previewRows.every((row) => row[flag] === false && row.safetyFlags?.[flag] === false)));
addCheck("preview keeps every row non-runnable", preview.previewRows.every((row) => row.previewState === "ready-for-review" && row.blockers.length >= 1 && /remain blocked/i.test(row.disabledReason)));
addCheck("preview cost remains zero-spend", preview.costImpact.estimatedUsd === 0 && preview.costImpact.actualUsd === 0 && preview.costImpact.providerSpendAllowed === false && preview.previewRows.every((row) => row.costImpact.actualUsd === 0));
addCheck("preview avoids raw private ids and raw payloads", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|backup|restore|runbook|storage|control|evidence|compliance)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedPreview) && !/Bearer\s+|sk-[A-Za-z0-9]|DATABASE_URL|postgres(?:ql)?:\/\/|raw JSON|raw logs|raw policy dump|raw compliance payload|raw audit payload|raw evidence payload/i.test(serializedPreview));
addCheck("preview avoids fake runnable actions", !/certify now|attest now|export audit now|export logs now|create package now|enforce policy now|handle credentials now|read secret now|write db now|call provider now|run tool now|dispatch agent now|mutate project now|deploy now|release now|export now|package now|spend now/i.test(serializedPreview));
addCheck("P141.2 report passes", reportPassed("reports/p1412-security-privacy-compliance-controls-report.md"));
addCheck("contract advances to P141.3 safely", contract.phaseId === "P141" && contract.status === "in_progress" && ((contract.currentSubphase === "P141.3" && contract.previousSubphase === "P141.2" && contract.nextSubphase === "P141.4") || (contract.currentSubphase === "P141.4" && contract.previousSubphase === "P141.3" && contract.nextSubphase === "P141.5") || (contract.currentSubphase === "P141.5" && contract.previousSubphase === "P141.4" && contract.nextSubphase === "P141.6")));
addCheck("contract records expected base commit", p1413.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("P141.2 complete, P141.3 complete, next P141 state valid", p1412.status === "complete" && p1413.status === "complete" && (p1414.status === "planned" || (p1414.status === "complete" && p1415.status === "planned") || (p1414.status === "complete" && p1415.status === "complete" && p1416.status === "planned")));
addCheck("contract records expected exports", EXPECTED_EXPORTS.every((entry) => p1413.expectedExports?.includes(entry)));
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1413.validationCommands?.includes(command)));
addCheck("contract scope stays compliance-preview-only", /display-safe compliance/i.test(p1413.dataShape || "") && p1413.forbiddenFiles?.includes("dashboard/src/**") && p1413.forbiddenFiles?.includes("db/**") && p1413.forbiddenFiles?.includes("projects/**"));
addCheck("P141.2 checker accepts P141.3", p1412Checker.includes("p1413CurrentState") && p1412Checker.includes('status.currentPhase === "P141.3"'));
addCheck("P141.1 checker accepts P141.3", p1411Checker.includes("p1413CurrentState") && p1411Checker.includes('status.currentPhase === "P141.3"'));
addCheck("enterprise checker accepts P141.3", enterpriseChecker.includes("p1413CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P141.6 handoff", ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5", "P141.6"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P141 plan records P141.3", /## P141\.3 Compliance Preview[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P141.3", /P141\.3 security\/privacy\/compliance preview/i.test(readme));
addCheck("platform roadmap records P141.3", /P141\.3 security\/privacy\/compliance preview is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P141.3", /P141\.3 is now complete/i.test(enterpriseRoadmap) && (/P141\.4 is the next executable subphase/i.test(enterpriseRoadmap) || /P141\.5 is the next executable subphase/i.test(enterpriseRoadmap) || /P141\.6 is the next executable subphase/i.test(enterpriseRoadmap)));
addCheck("phase status advances to P141.3", p1413CurrentState || p1414CurrentState || p1415CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P141.3 entries have required fields", [statusById.get("P141"), statusById.get("P141.3"), roadmapById.get("P141"), roadmapById.get("P141.3")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("next P141 subphase remains planned-only", (statusById.get("P141.4")?.status === "planned" && roadmapById.get("P141.4")?.status === "planned" && !(statusById.get("P141.4")?.checksRun || []).length && !(roadmapById.get("P141.4")?.checksRun || []).length) || (p1414CurrentState && statusById.get("P141.5")?.status === "planned" && roadmapById.get("P141.5")?.status === "planned" && !(statusById.get("P141.5")?.checksRun || []).length && !(roadmapById.get("P141.5")?.checksRun || []).length) || (p1415CurrentState && statusById.get("P141.6")?.status === "planned" && roadmapById.get("P141.6")?.status === "planned" && !(statusById.get("P141.6")?.checksRun || []).length && !(roadmapById.get("P141.6")?.checksRun || []).length));
addCheck("changed files stay in P141.3 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P141.3 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("route-wide security/compliance coverage retained", ["Compliance route renders readiness", "Auth Governance route renders readiness", "safety center shows plain-language safety posture", "Command Center route-wide UX"].every((text) => routeTests.includes(text)));
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
        "- Adds a display-safe P141 security, privacy, compliance, policy, evidence, and data-handling preview.",
        "- Reuses the P141.2 control model, mode guard, redaction, and result-envelope helpers.",
        "- Does not render new Command Center UI, certify compliance, sign attestations, export audits, export raw logs, create compliance packages, enforce policy at runtime, handle credentials, expose raw data, write DB/runtime state, run live CRUD, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Preview Shape", body: EXPECTED_EXPORTS.map((entry) => `- ${entry}`).join("\n") },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P141.3 is a display-safe local preview only. It does not handle credentials, expose raw data, enforce policy at runtime, certify compliance, sign legal attestations, export audits, export raw logs, create compliance packages, write DB/runtime state, run live CRUD, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend. Later P141 subphases may be complete when this compatibility checker runs; P141.6 remains planned-only until implemented.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P141.3 Security Privacy Compliance Controls Report", phase: "P141.3" },
);

printCheckReport("P141.3 Security Privacy Compliance Controls Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
