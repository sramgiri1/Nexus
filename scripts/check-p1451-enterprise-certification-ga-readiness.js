import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1451-enterprise-certification-ga-readiness-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p145-enterprise-certification-ga-readiness-contracts.json";
const PLAN_PATH = "docs/architecture/P145_ENTERPRISE_CERTIFICATION_GA_READINESS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1451-enterprise-certification-ga-readiness";
const PRIOR_SCRIPT = "check:p1447-billing-metering-customer-operations-final-validation";
const EXPECTED_BASE_COMMIT = "540e2284";
const EXPECTED_SUBPHASES = ["P145.1", "P145.2", "P145.3", "P145.4", "P145.5", "P145.6", "P145.7"];
const REQUIRED_PLAN_FIELDS = [
  "narrow scope",
  "starting branch and expected base commit",
  "allowed files",
  "forbidden files",
  "exact files/modules",
  "expected exports/schemas/data shapes",
  "Command Center UX requirements",
  "dark/light/system theme requirements",
  "Playwright tests",
  "checker updates",
  "docs/README/roadmap updates",
  "OS phase status update",
  "validation commands",
  "final safety checks",
  "git add/commit/push commands",
  "final response checklist",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1451-enterprise-certification-ga-readiness",
  "npm run check:p1447-billing-metering-customer-operations-final-validation",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P145.1\"",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];
const REQUIRED_CERTIFICATION_GATE_FIELDS = ["gateId", "displayName", "readinessState", "certificationAllowed", "disabledReason", "ownerCapability", "evidenceRefs", "blockers"];
const REQUIRED_SECURITY_REVIEW_FIELDS = ["reviewId", "displayName", "reviewState", "scanExecutionAllowed", "findingMutationAllowed", "ownerCapability", "evidenceRefs", "disabledReason"];
const REQUIRED_LOAD_READINESS_FIELDS = ["loadCheckId", "displayName", "rehearsalState", "loadExecutionAllowed", "networkAllowed", "costImpact", "ownerCapability", "evidenceRefs", "disabledReason"];
const REQUIRED_RECOVERY_READINESS_FIELDS = ["recoveryCheckId", "displayName", "recoveryState", "restoreExecutionAllowed", "failoverAllowed", "ownerCapability", "evidenceRefs", "disabledReason"];
const REQUIRED_RELEASE_SIGNOFF_FIELDS = ["signoffId", "displayName", "signoffState", "releaseAllowed", "attestationAllowed", "ownerCapability", "evidenceRefs", "disabledReason"];

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function changedFiles() {
  return execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]{1,2}\s+/, ""))
    .map((line) => (line.includes(" -> ") ? line.split(" -> ").pop() : line));
}

function reportPassed(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  if (!existsSync(absolutePath)) return false;
  return /## Result[\s\S]*PASS|Result:\s+PASS/i.test(readText(relativePath));
}

function hasFields(actual = [], required = []) {
  return required.every((field) => actual.includes(field));
}

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    if (/^\s*-\s+`[^`]+`\s*$/.test(line)) return false;
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|handoff|coverage|tests?|ux)\b/i.test(context);
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
const p145 = statusById.get("P145") || {};
const p145Roadmap = roadmapById.get("P145") || {};
const p1451 = subphaseById.get("P145.1") || {};
const p1452 = subphaseById.get("P145.2") || {};
const checkerSource = readText("scripts/check-p1451-enterprise-certification-ga-readiness.js");
const p1447Checker = readText("scripts/check-p1447-billing-metering-customer-operations-final-validation.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P145.1";
const allowedFiles = new Set(p1451.allowedFiles || []);
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
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;

const p1451StartedState =
  status.currentPhase === "P145.1"
  && status.previousPhase === "P144.7"
  && status.nextPhase === "P145.2"
  && roadmap.currentPhase === "P145.1"
  && roadmap.previousPhase === "P144.7"
  && roadmap.nextPhase === "P145.2"
  && status.current?.phaseId === "P145.1"
  && status.previous?.phaseId === "P144.7"
  && status.next?.phaseId === "P145.2"
  && roadmap.current?.phaseId === "P145.1"
  && roadmap.previous?.phaseId === "P144.7"
  && roadmap.next?.phaseId === "P145.2"
  && statusById.get("P144")?.status === "complete"
  && roadmapById.get("P144")?.status === "complete"
  && statusById.get("P144.7")?.status === "complete"
  && roadmapById.get("P144.7")?.status === "complete"
  && statusById.get("P145")?.status === "in_progress"
  && roadmapById.get("P145")?.status === "in_progress"
  && statusById.get("P145.1")?.status === "complete"
  && roadmapById.get("P145.1")?.status === "complete"
  && statusById.get("P145.2")?.status === "planned"
  && roadmapById.get("P145.2")?.status === "planned";

const allAuthorityFlagsFalse = Object.values(contract.authorityFlags || {}).every((value) => value === false);

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1451-enterprise-certification-ga-readiness.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("prior P144.7 report still passes", reportPassed("reports/p1447-billing-metering-customer-operations-final-validation-report.md"));
addCheck("contract starts P145.1", contract.phaseId === "P145" && contract.status === "in_progress" && contract.currentSubphase === "P145.1" && contract.previousSubphase === "P144.7" && contract.nextSubphase === "P145.2" && p1451.status === "complete" && p1452.status === "planned");
addCheck("contract records expected base commit", p1451.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records seven subphases", EXPECTED_SUBPHASES.every((phaseId) => subphaseById.has(phaseId)));
addCheck("subphases include implementation plan fields", EXPECTED_SUBPHASES.every((phaseId) => {
  const subphase = subphaseById.get(phaseId) || {};
  const required = subphase.requiredPlanFields || REQUIRED_PLAN_FIELDS;
  return Boolean(subphase.narrowGoal) && subphase.scopeClassification === "NEXUS_OS_CHANGE" && REQUIRED_PLAN_FIELDS.every((field) => required.includes(field) || JSON.stringify(subphase).toLowerCase().includes(field.toLowerCase()));
}));
addCheck("P145.1 records allowed and forbidden files", p1451.allowedFiles?.includes(CONTRACT_PATH) && p1451.allowedFiles?.includes("scripts/check-p1451-enterprise-certification-ga-readiness.js") && p1451.forbiddenFiles?.includes("projects/**") && p1451.forbiddenFiles?.includes("dashboard/src/**") && p1451.forbiddenFiles?.includes("db/**") && p1451.forbiddenFiles?.includes("providers/**") && p1451.forbiddenFiles?.includes("tools/**"));
addCheck("P145.1 records validation commands", VALIDATION_COMMANDS.every((command) => p1451.validationCommands?.includes(command)));
addCheck("certification gate shape present", hasFields(contract.certificationGateShape, REQUIRED_CERTIFICATION_GATE_FIELDS));
addCheck("security review shape present", hasFields(contract.securityReviewShape, REQUIRED_SECURITY_REVIEW_FIELDS));
addCheck("load readiness shape present", hasFields(contract.loadReadinessShape, REQUIRED_LOAD_READINESS_FIELDS));
addCheck("recovery readiness shape present", hasFields(contract.recoveryReadinessShape, REQUIRED_RECOVERY_READINESS_FIELDS));
addCheck("release signoff shape present", hasFields(contract.releaseSignoffShape, REQUIRED_RELEASE_SIGNOFF_FIELDS));
addCheck("authority flags block enterprise GA authority", allAuthorityFlagsFalse, JSON.stringify(contract.authorityFlags || {}));
addCheck("P145.2 handoff is safe", p1452.status === "planned" && p1452.expectedBaseCommit === "after-P145.1" && p1452.commit === "" && Array.isArray(p1452.checksRun) && p1452.checksRun.length === 0);
addCheck("P144.7 checker accepts P145.1 handoff", p1447Checker.includes("p1451StartedState") && p1447Checker.includes('status.currentPhase === "P145.1"'));
addCheck("enterprise checker accepts P145.1 active state", enterpriseChecker.includes("p1451StartedState") && enterpriseChecker.includes("p145ActiveState") && enterpriseChecker.includes("currentP145CheckCommand") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P145 subphases", osStatusChecker.includes('"P145.1"') && osStatusChecker.includes('"P145.2"') && osStatusChecker.includes('"P145.7"'));
addCheck("docs record P145.1 and P145.2 handoff", /## P145\.1 Contract \/ Policy \/ Safety Boundary[\s\S]*Status:\s+complete/.test(plan) && /P145\.1\s+Enterprise\s+Certification\s+GA\s+Readiness\s+Contract\s+is\s+complete/i.test(readme) && /P145\.1\s+enterprise\s+GA\s+readiness\s+contract\s+is\s+complete/i.test(platformRoadmap) && /P145\.1 is now complete as contract\/policy\/safety-boundary only/i.test(enterpriseRoadmap) && /P145\.2 is planned-only next/i.test(enterpriseRoadmap));
addCheck("phase status starts P145.1", p1451StartedState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P145 parent records active status", [p145, p145Roadmap].every((entry) => entry.status === "in_progress" && entry.commit && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${REQUIRED_SCRIPT}`) && entry.commandCenterVisible === true));
addCheck("P145.1 records required status fields", [statusById.get("P145.1"), roadmapById.get("P145.1")].every((entry) => Boolean(entry?.phaseId) && entry.track === "NEXUS_OS" && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("P145.2 remains planned-only", [statusById.get("P145.2"), roadmapById.get("P145.2")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0));
addCheck("P145.1 Playwright coverage exists", routeTests.includes("P145.1 enterprise GA readiness contract keeps roadmap current") && routeTests.includes("P145.1") && routeTests.includes("P145.2") && routeTests.includes("Enterprise Certification and GA Readiness"));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("changed files stay in P145.1 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => file === "dashboard/tests/routes.spec.js" || !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `forbidden path check relaxed for ${status.currentPhase}`);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|billing|payment|invoice|subscription|entitlement|customer|support|certification|attestation|scan|load|recovery|release)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid raw storage or provider URLs", !/s3:\/\/|gs:\/\/|az:\/\/|https:\/\/[^ \n]*(audit|evidence|billing|payment|invoice|subscription|customer|support|storage|secret|artifact|certification|attestation|release)/i.test(docsBundle));
addCheck("docs avoid fake runnable enterprise actions", !/certify now|issue certification now|attest now|sign attestation now|run security scan now|mutate finding now|run load test now|run recovery now|restore now|failover now|release now|deploy now|export now|package now|write db now|call provider now|call model now|run tool now|dispatch agent now|mutate project now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /certification is enabled|certification issuance is enabled|attestation is enabled|security scanning is enabled|finding mutation is enabled|load execution is enabled|recovery execution is enabled|restore execution is enabled|failover is enabled|release is enabled|deploy is enabled|DB writes are enabled|runtime writes are enabled|provider calls are enabled|model calls are enabled|tool execution is enabled|agent dispatch is enabled|project mutation is enabled|network calls are enabled|spend is enabled/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump|raw certification payload|raw attestation payload|raw scan payload|raw load payload|raw recovery payload|raw release payload/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Starts P145.1 as contract/policy/safety-boundary work for enterprise certification and GA readiness.",
        "- Confirms P144.7 remains complete and P145.2-P145.7 remain planned-only.",
        "- Does not issue certifications, sign attestations, run scans, execute load checks, execute recovery, write DB/runtime state, call providers/models, execute tools, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Contract Coverage",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        `- Authority flags blocked: ${allAuthorityFlagsFalse}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P145.1 is contract/policy/safety-boundary work only. It does not enable certification issuance, attestation signing, security scan execution, load execution, recovery execution, restore, failover, DB/runtime writes, provider/model calls, tool execution, agent dispatch, project mutation, deploy/release/export/package actions, network calls, or spend. P145.2-P145.7 remain planned-only.",
    },
    { title: "Result", body: failed.length ? `FAIL (${failed.length}/${checks.length})` : `PASS (${checks.length}/${checks.length})` },
  ],
  { title: "P145.1 Enterprise Certification GA Readiness Report", phase: "P145.1" },
);

printCheckReport("P145.1 Enterprise Certification GA Readiness Check", checks);

if (failed.length) {
  process.exit(1);
}
