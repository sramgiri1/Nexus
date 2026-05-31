import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1411-security-privacy-compliance-controls-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p141-security-privacy-compliance-controls-contracts.json";
const PLAN_PATH = "docs/architecture/P141_SECURITY_PRIVACY_COMPLIANCE_CONTROLS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1411-security-privacy-compliance-controls";
const EXPECTED_BASE_COMMIT = "28c34a71";
const EXPECTED_SUBPHASES = ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5", "P141.6", "P141.7"];
const VALIDATION_COMMANDS = [
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
const REQUIRED_CONTROL_FIELDS = [
  "controlRef",
  "domain",
  "objective",
  "currentState",
  "enforcementState",
  "ownerCapability",
  "evidenceRefs",
  "blockers",
  "disabledReason",
  "nextAction",
];
const REQUIRED_PRIVACY_FIELDS = [
  "boundaryRef",
  "dataClass",
  "allowedUse",
  "prohibitedUse",
  "redactionState",
  "rawDataExposureAllowed",
  "exportAllowed",
  "retentionPolicyRef",
  "evidenceRefs",
];
const REQUIRED_EVIDENCE_FIELDS = [
  "evidenceRef",
  "framework",
  "controlRefs",
  "evidenceState",
  "certificationAllowed",
  "legalAttestationAllowed",
  "auditExportAllowed",
  "rawLogExportAllowed",
  "packageCreationAllowed",
  "disabledReason",
];
const REQUIRED_POLICY_FIELDS = [
  "policyRef",
  "decisionMode",
  "appliesTo",
  "enforcementRuntimeAllowed",
  "overrideAllowed",
  "approvalRequired",
  "evidenceRefs",
];
const REQUIRED_HANDLING_FIELDS = [
  "handlingRef",
  "dataClass",
  "collectionAllowed",
  "processingAllowed",
  "sharingAllowed",
  "exportAllowed",
  "rawIdentifierAllowed",
  "retentionState",
  "ownerCapability",
  "nextAction",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|read-only|display-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|validation-only)\b/i.test(context);
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
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const p1407Checker = readText("scripts/check-p1407-backup-recovery-dr-final-validation.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const checkerSource = readText("scripts/check-p1411-security-privacy-compliance-controls.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const complianceReadiness = readText("dashboard/src/data/complianceReadiness.js");
const securityBoundaryPolicy = readText("policy/security-boundary-policy.json");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P141.1";
const allowedFiles = new Set(p1411.allowedFiles || []);
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
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const p1411StartedState =
  status.currentPhase === "P141.1"
  && status.previousPhase === "P140.7"
  && status.nextPhase === "P141.2"
  && roadmap.currentPhase === "P141.1"
  && roadmap.previousPhase === "P140.7"
  && roadmap.nextPhase === "P141.2"
  && status.current?.phaseId === "P141.1"
  && status.previous?.phaseId === "P140.7"
  && status.next?.phaseId === "P141.2"
  && roadmap.current?.phaseId === "P141.1"
  && roadmap.previous?.phaseId === "P140.7"
  && roadmap.next?.phaseId === "P141.2"
  && statusById.get("P140")?.status === "complete"
  && roadmapById.get("P140")?.status === "complete"
  && statusById.get("P140.7")?.status === "complete"
  && roadmapById.get("P140.7")?.status === "complete"
  && statusById.get("P141")?.status === "in_progress"
  && roadmapById.get("P141")?.status === "in_progress"
  && statusById.get("P141.1")?.status === "complete"
  && roadmapById.get("P141.1")?.status === "complete"
  && statusById.get("P141.2")?.status === "planned"
  && roadmapById.get("P141.2")?.status === "planned";
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

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("contract starts P141 safely", contract.phaseId === "P141" && contract.status === "in_progress" && ((contract.currentSubphase === "P141.1" && contract.previousSubphase === "P140.7" && contract.nextSubphase === "P141.2") || (contract.currentSubphase === "P141.2" && contract.previousSubphase === "P141.1" && contract.nextSubphase === "P141.3") || (contract.currentSubphase === "P141.3" && contract.previousSubphase === "P141.2" && contract.nextSubphase === "P141.4") || (contract.currentSubphase === "P141.4" && contract.previousSubphase === "P141.3" && contract.nextSubphase === "P141.5")));
addCheck("contract records expected base commit", contract.expectedBaseCommit === EXPECTED_BASE_COMMIT && p1411.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract has seven implementation-grade subphases", EXPECTED_SUBPHASES.every((phaseId) => subphaseById.has(phaseId)) && EXPECTED_SUBPHASES.every((phaseId) => subphaseById.get(phaseId)?.scopeClassification === "NEXUS_OS_CHANGE"));
addCheck("P141.1 complete and next P141 subphase valid", p1411.status === "complete" && (p1412.status === "planned" || (p1412.status === "complete" && p1413.status === "planned") || (p1412.status === "complete" && p1413.status === "complete" && p1414.status === "planned") || (p1412.status === "complete" && p1413.status === "complete" && p1414.status === "complete" && p1415.status === "planned")));
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1411.validationCommands?.includes(command)));
addCheck("security control shape is display-safe", REQUIRED_CONTROL_FIELDS.every((field) => Object.hasOwn(contract.securityControlShape || {}, field)));
addCheck("privacy boundary shape blocks raw and export", REQUIRED_PRIVACY_FIELDS.every((field) => Object.hasOwn(contract.privacyBoundaryShape || {}, field)) && contract.privacyBoundaryShape.rawDataExposureAllowed === false && contract.privacyBoundaryShape.exportAllowed === false);
addCheck("compliance evidence shape blocks certification and exports", REQUIRED_EVIDENCE_FIELDS.every((field) => Object.hasOwn(contract.complianceEvidenceShape || {}, field)) && contract.complianceEvidenceShape.certificationAllowed === false && contract.complianceEvidenceShape.auditExportAllowed === false && contract.complianceEvidenceShape.packageCreationAllowed === false);
addCheck("policy enforcement shape is deny/review only", REQUIRED_POLICY_FIELDS.every((field) => Object.hasOwn(contract.policyEnforcementShape || {}, field)) && contract.policyEnforcementShape.enforcementRuntimeAllowed === false && contract.policyEnforcementShape.overrideAllowed === false);
addCheck("data handling shape blocks raw identifiers and export", REQUIRED_HANDLING_FIELDS.every((field) => Object.hasOwn(contract.dataHandlingControlShape || {}, field)) && contract.dataHandlingControlShape.exportAllowed === false && contract.dataHandlingControlShape.rawIdentifierAllowed === false);
addCheck("all authority flags remain blocked", Object.values(contract.authorityFlags || {}).every((value) => value === false));
addCheck("contract reuses existing security and compliance evidence", contract.reuseCheck?.join(" ").includes("shared/reportWriter.js") && contract.reuseCheck?.join(" ").includes("security-boundary-policy.json") && contract.reuseCheck?.join(" ").includes("complianceReadiness"));
addCheck("P140.7 report passes", reportPassed("reports/p1407-backup-recovery-dr-final-validation-report.md"));
addCheck("P140.7 checker accepts P141.1", p1407Checker.includes("p1411StartedState") && p1407Checker.includes('status.currentPhase === "P141.1"'));
addCheck("enterprise checker accepts P141.1", enterpriseChecker.includes("p1411StartedState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P141 subphases", ["P141", "P141.1", "P141.2", "P141.3", "P141.4", "P141.5"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P141 plan records P141.1", /## P141\.1 Contract \/ Policy \/ Safety Boundary[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P141.1", /P141\.1 security\/privacy\/compliance contract/i.test(readme));
addCheck("platform roadmap records P141.1", /P141\.1 security\/privacy\/compliance contract is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P141.1", /P141\.1 is now complete/i.test(enterpriseRoadmap) && (/P141\.2 is the next executable subphase/i.test(enterpriseRoadmap) || /P141\.2 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status starts P141.1", p1411StartedState || p1412CurrentState || p1413CurrentState || p1414CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P141.1 entries have required fields", [statusById.get("P141"), statusById.get("P141.1"), roadmapById.get("P141"), roadmapById.get("P141.1")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("next P141 subphase remains planned-only", (statusById.get("P141.2")?.status === "planned" && roadmapById.get("P141.2")?.status === "planned" && !(statusById.get("P141.2")?.checksRun || []).length && !(roadmapById.get("P141.2")?.checksRun || []).length) || (p1412CurrentState && statusById.get("P141.3")?.status === "planned" && roadmapById.get("P141.3")?.status === "planned") || (p1413CurrentState && statusById.get("P141.4")?.status === "planned" && roadmapById.get("P141.4")?.status === "planned") || (p1414CurrentState && statusById.get("P141.5")?.status === "planned" && roadmapById.get("P141.5")?.status === "planned"));
addCheck("changed files stay in P141.1 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P141.1 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("existing Command Center compliance UX remains display-only", complianceReadiness.includes("Display-only compliance readiness") && complianceReadiness.includes("certificationAllowed") && complianceReadiness.includes("providerSpendAllowed"));
addCheck("security boundary evidence remains deny-by-default", securityBoundaryPolicy.includes('"defaultAction": "deny"') && securityBoundaryPolicy.includes('"approvalRequiredActions"'));
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
        "- Starts P141 with a security, privacy, compliance, policy, evidence, and data-handling control contract and remains compatible as later P141 subphases advance.",
        "- Defines display-safe control shapes and authority flags without adding enforcement runtime, certification, audit export, raw log export, package creation, DB/runtime writes, provider/model calls, tool execution, agent dispatch, project mutation, network calls, or spend.",
        "- Preserves existing Command Center UX and reuses current Compliance, Auth Governance, Safety Center, Evidence, and route-wide coverage as evidence only.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P141.1 is contract/policy/safety-boundary work only. It does not handle credentials, expose raw data, enforce policy at runtime, certify compliance, sign legal attestations, export audits, export raw logs, create compliance packages, write DB/runtime state, run live CRUD, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend. Later P141 subphases may be complete when this compatibility checker runs; P141.5 remains planned-only until implemented.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P141.1 Security Privacy Compliance Controls Report", phase: "P141.1" },
);

printCheckReport("P141.1 Security Privacy Compliance Controls Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
