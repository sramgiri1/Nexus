import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1431-release-deploy-export-package-pipeline-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p143-release-deploy-export-package-pipeline-contracts.json";
const PLAN_PATH = "docs/architecture/P143_RELEASE_DEPLOY_EXPORT_PACKAGE_PIPELINE_PLAN.md";
const REQUIRED_SCRIPT = "check:p1431-release-deploy-export-package-pipeline";
const EXPECTED_BASE_COMMIT = "ab8ae03a";
const EXPECTED_SUBPHASES = ["P143.1", "P143.2", "P143.3", "P143.4", "P143.5", "P143.6", "P143.7"];
const VALIDATION_COMMANDS = [
  "npm run check:p1431-release-deploy-export-package-pipeline",
  "npm run check:p1427-admin-operations-runtime-settings-final-validation",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P143.1|Release Control|Deploy Monitoring|Project Shipping|Command Center route-wide UX\"",
  "git diff --check",
];
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
const REQUIRED_RELEASE_GATE_FIELDS = ["gateRef", "displayName", "stage", "currentState", "approvalRequired", "executionAllowed", "disabledReason", "ownerCapability", "evidenceRefs", "blockers"];
const REQUIRED_DEPLOY_TARGET_FIELDS = ["targetRef", "displayName", "environment", "currentState", "deployAllowed", "rollbackAllowed", "requiresApproval", "ownerCapability", "evidenceRefs", "disabledReason"];
const REQUIRED_EXPORT_PACKAGE_FIELDS = ["artifactRef", "displayName", "artifactType", "creationAllowed", "exportAllowed", "includesPrivateData", "provenanceRequired", "ownerCapability", "evidenceRefs", "disabledReason"];
const REQUIRED_PROVENANCE_FIELDS = ["provenanceRef", "displayName", "captureState", "rawPayloadExposureAllowed", "signingAllowed", "exportAllowed", "ownerCapability", "evidenceRefs", "disabledReason"];
const REQUIRED_ROLLBACK_FIELDS = ["rollbackRef", "displayName", "rollbackType", "previewAllowed", "executionAllowed", "requiresApproval", "ownerCapability", "evidenceRefs", "disabledReason"];

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

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    if (/^\s*-\s+`[^`]+`\s*$/.test(line)) return false;
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|coverage|tests?|ux|handoff)\b/i.test(context);
  });
}

function hasFields(actual = [], required = []) {
  return required.every((field) => actual.includes(field));
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
const p143 = statusById.get("P143") || {};
const p143Roadmap = roadmapById.get("P143") || {};
const p1431 = subphaseById.get("P143.1") || {};
const p1432 = subphaseById.get("P143.2") || {};
const p1433 = subphaseById.get("P143.3") || {};
const checkerSource = readText("scripts/check-p1431-release-deploy-export-package-pipeline.js");
const p1427Checker = readText("scripts/check-p1427-admin-operations-runtime-settings-final-validation.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P143.1";
const allowedFiles = new Set(p1431.allowedFiles || []);
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

const p1431StartedState =
  status.currentPhase === "P143.1"
  && status.previousPhase === "P142.7"
  && status.nextPhase === "P143.2"
  && roadmap.currentPhase === "P143.1"
  && roadmap.previousPhase === "P142.7"
  && roadmap.nextPhase === "P143.2"
  && status.current?.phaseId === "P143.1"
  && status.previous?.phaseId === "P142.7"
  && status.next?.phaseId === "P143.2"
  && roadmap.current?.phaseId === "P143.1"
  && roadmap.previous?.phaseId === "P142.7"
  && roadmap.next?.phaseId === "P143.2"
  && statusById.get("P142")?.status === "complete"
  && roadmapById.get("P142")?.status === "complete"
  && statusById.get("P142.7")?.status === "complete"
  && roadmapById.get("P142.7")?.status === "complete"
  && statusById.get("P143")?.status === "in_progress"
  && roadmapById.get("P143")?.status === "in_progress"
  && statusById.get("P143.1")?.status === "complete"
  && roadmapById.get("P143.1")?.status === "complete"
  && statusById.get("P143.2")?.status === "planned"
  && roadmapById.get("P143.2")?.status === "planned"
  && statusById.get("P144")?.status === "planned"
  && roadmapById.get("P144")?.status === "planned";

const p1432CurrentState =
  status.currentPhase === "P143.2"
  && status.previousPhase === "P143.1"
  && status.nextPhase === "P143.3"
  && roadmap.currentPhase === "P143.2"
  && roadmap.previousPhase === "P143.1"
  && roadmap.nextPhase === "P143.3"
  && status.current?.phaseId === "P143.2"
  && status.previous?.phaseId === "P143.1"
  && status.next?.phaseId === "P143.3"
  && roadmap.current?.phaseId === "P143.2"
  && roadmap.previous?.phaseId === "P143.1"
  && roadmap.next?.phaseId === "P143.3"
  && statusById.get("P142")?.status === "complete"
  && roadmapById.get("P142")?.status === "complete"
  && statusById.get("P143")?.status === "in_progress"
  && roadmapById.get("P143")?.status === "in_progress"
  && statusById.get("P143.1")?.status === "complete"
  && roadmapById.get("P143.1")?.status === "complete"
  && statusById.get("P143.2")?.status === "complete"
  && roadmapById.get("P143.2")?.status === "complete"
  && statusById.get("P143.3")?.status === "planned"
  && roadmapById.get("P143.3")?.status === "planned"
  && statusById.get("P144")?.status === "planned"
  && roadmapById.get("P144")?.status === "planned";

const allAuthorityFlagsFalse = Object.values(contract.authorityFlags || {}).every((value) => value === false);

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1431-release-deploy-export-package-pipeline.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("prior P142.7 report still passes", reportPassed("reports/p1427-admin-operations-runtime-settings-final-validation-report.md"));
addCheck("contract keeps P143.1 complete", contract.phaseId === "P143" && contract.status === "in_progress" && p1431.status === "complete" && (
  (contract.currentSubphase === "P143.1" && contract.previousSubphase === "P142.7" && contract.nextSubphase === "P143.2" && p1432.status === "planned")
  || (contract.currentSubphase === "P143.2" && contract.previousSubphase === "P143.1" && contract.nextSubphase === "P143.3" && p1432.status === "complete" && p1433.status === "planned")
));
addCheck("contract records expected base commit", p1431.expectedBaseCommit === EXPECTED_BASE_COMMIT && contract.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records seven subphases", EXPECTED_SUBPHASES.every((phaseId) => subphaseById.has(phaseId)));
addCheck("subphases include implementation plan fields", EXPECTED_SUBPHASES.every((phaseId) => {
  const subphase = subphaseById.get(phaseId) || {};
  const required = subphase.requiredPlanFields || REQUIRED_PLAN_FIELDS;
  return Boolean(subphase.narrowGoal) && subphase.scopeClassification === "NEXUS_OS_CHANGE" && REQUIRED_PLAN_FIELDS.every((field) => required.includes(field) || JSON.stringify(subphase).toLowerCase().includes(field.toLowerCase()));
}));
addCheck("P143.1 records allowed and forbidden files", p1431.allowedFiles?.includes(CONTRACT_PATH) && p1431.allowedFiles?.includes("scripts/check-p1431-release-deploy-export-package-pipeline.js") && p1431.forbiddenFiles?.includes("projects/**") && p1431.forbiddenFiles?.includes("dashboard/src/**") && p1431.forbiddenFiles?.includes("deploy/**") && p1431.forbiddenFiles?.includes("release/**") && p1431.forbiddenFiles?.includes("exports/**") && p1431.forbiddenFiles?.includes("packages/**"));
addCheck("P143.1 records validation commands", VALIDATION_COMMANDS.every((command) => p1431.validationCommands?.includes(command)));
addCheck("release gate shape present", hasFields(contract.releaseGateShape, REQUIRED_RELEASE_GATE_FIELDS));
addCheck("deploy target shape present", hasFields(contract.deployTargetShape, REQUIRED_DEPLOY_TARGET_FIELDS));
addCheck("export package shape present", hasFields(contract.exportPackageShape, REQUIRED_EXPORT_PACKAGE_FIELDS));
addCheck("provenance shape present", hasFields(contract.provenanceShape, REQUIRED_PROVENANCE_FIELDS));
addCheck("rollback shape present", hasFields(contract.rollbackShape, REQUIRED_ROLLBACK_FIELDS));
addCheck("authority flags block shipping authority", allAuthorityFlagsFalse, JSON.stringify(contract.authorityFlags || {}));
addCheck("P143.2 handoff is safe", p1431StartedState
  ? p1432.status === "planned" && p1432.expectedBaseCommit === "after-P143.1" && p1432.commit === "" && Array.isArray(p1432.checksRun) && p1432.checksRun.length === 0
  : p1432CurrentState && p1432.status === "complete" && p1433.status === "planned");
addCheck("P142.7 checker accepts P143.1 handoff", p1427Checker.includes("p1431StartedState") && p1427Checker.includes('status.currentPhase === "P143.1"'));
addCheck("enterprise checker accepts P143.1 active state", enterpriseChecker.includes("p1431StartedState") && enterpriseChecker.includes("p143ActiveState") && enterpriseChecker.includes("currentP143CheckCommand") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P143 subphases", osStatusChecker.includes('"P143.1"') && osStatusChecker.includes('"P143.2"') && osStatusChecker.includes('"P143.7"'));
addCheck("docs record P143.1 and P143.2 handoff", /## P143\.1 Contract \/ Policy \/ Safety Boundary[\s\S]*Status:\s+complete/.test(plan) && /P143\.1\s+Release\s+Deploy\s+Export\s+Package\s+Pipeline\s+Contract\s+is\s+complete/i.test(readme) && /P143\.1\s+release\s+pipeline\s+contract\s+is\s+complete/i.test(platformRoadmap) && /P143\.1 is now complete as contract\/policy\/safety-boundary only/i.test(enterpriseRoadmap) && (/P143\.2 is planned-only next/i.test(enterpriseRoadmap) || (p1432CurrentState && /P143\.2 is now complete as a read-only model/i.test(enterpriseRoadmap) && /P143\.3 is planned-only next/i.test(enterpriseRoadmap))));
addCheck("phase status starts P143.1", p1431StartedState || p1432CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P143 parent records active status", [p143, p143Roadmap].every((entry) => entry.status === "in_progress" && entry.commit && Array.isArray(entry.checksRun) && (entry.checksRun.includes("npm run check:p1431-release-deploy-export-package-pipeline") || entry.checksRun.includes("npm run check:p1432-release-deploy-export-package-pipeline")) && entry.commandCenterVisible === true));
addCheck("P143.1 records required status fields", [statusById.get("P143.1"), roadmapById.get("P143.1")].every((entry) => Boolean(entry?.phaseId) && entry.track === "NEXUS_OS" && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("next P143/P144 handoff remains safe", p1432CurrentState
  ? [statusById.get("P143.3"), roadmapById.get("P143.3"), statusById.get("P144"), roadmapById.get("P144")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)
  : [statusById.get("P143.2"), roadmapById.get("P143.2"), statusById.get("P144"), roadmapById.get("P144")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0));
addCheck("P143.1 Playwright coverage exists", routeTests.includes("P143.1 release pipeline contract keeps shipping routes non-runnable") && routeTests.includes("Release Control") && routeTests.includes("Deploy Monitoring") && routeTests.includes("Project Shipping") && routeTests.includes("P143.1") && routeTests.includes("P143.2"));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("changed files stay in P143.1 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => file === "dashboard/tests/routes.spec.js" || !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `forbidden path check relaxed for ${status.currentPhase}`);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|release|deploy|export|package|rollback|artifact|provenance)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid raw storage or export URLs", !/s3:\/\/|gs:\/\/|az:\/\/|https:\/\/[^ \n]*(audit|evidence|export|package|release|deploy|storage|secret|artifact|provenance)/i.test(docsBundle));
addCheck("docs avoid fake runnable shipping actions", !/create release now|create package now|start deploy now|deploy now|run rollback now|rollback now|run export now|export now|package now|apply patch now|run build now|run tests now|write db now|call provider now|run tool now|dispatch agent now|mutate project now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /release package creation is enabled|deploy start is enabled|rollback execution is enabled|export execution is enabled|package build is enabled|patch application is enabled|build execution is enabled|test execution is enabled|DB writes are enabled|runtime writes are enabled|provider calls are enabled|model calls are enabled|tool execution is enabled|agent dispatch is enabled|project mutation is enabled|network calls are enabled|spend is enabled/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump|raw release payload|raw deploy payload|raw export payload|raw package payload|raw provenance payload/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Starts P143.1 as contract/policy/safety-boundary work for release, deploy, export, package, provenance, and rollback.",
        `- Confirms P142.7 remains complete and ${p1432CurrentState ? "P143.2 is complete with P143.3/P144 planned-only next" : "P143.2/P144 remain planned-only"}.`,
        "- Does not create release packages, start deploys, execute rollbacks, run exports, build packages, apply patches, run build/test commands, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, use network calls, or spend.",
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
      body: `- P143.1 is contract/policy/safety-boundary work only. It does not create release packages, start deploys, execute rollbacks, run exports, build packages, apply patches, run build/test commands, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, use network calls, or spend. ${p1432CurrentState ? "P143.2 is complete as read-only model work and P143.3-P143.7 remain planned-only." : "P143.2-P143.7 remain planned-only."}`,
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P143.1 Release Deploy Export Package Pipeline Report", phase: "P143.1" },
);

printCheckReport("P143.1 Release Deploy Export Package Pipeline Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
