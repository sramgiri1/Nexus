import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildDeployMonitoringShippingPreviewUx,
  buildProjectShippingPreviewUx,
  buildReleaseControlShippingPreviewUx,
  buildShippingPreviewUxRows,
} from "../dashboard/src/data/releaseDeployExportPackageUx.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1434-release-deploy-export-package-pipeline-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p143-release-deploy-export-package-pipeline-contracts.json";
const PLAN_PATH = "docs/architecture/P143_RELEASE_DEPLOY_EXPORT_PACKAGE_PIPELINE_PLAN.md";
const REQUIRED_SCRIPT = "check:p1434-release-deploy-export-package-pipeline";
const NEXT_SCRIPT = "check:p1435-release-deploy-export-package-pipeline";
const EXPECTED_BASE_COMMIT = "f1442f6c";
const VALIDATION_COMMANDS = [
  "npm run check:p1434-release-deploy-export-package-pipeline",
  "npm run check:p1433-release-deploy-export-package-pipeline",
  "npm run check:p1432-release-deploy-export-package-pipeline",
  "npm run check:p1431-release-deploy-export-package-pipeline",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P143.4|Release Control|Deploy Monitoring|Project Shipping|Command Center route-wide UX\"",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|handoff)\b/i.test(context);
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
const p1433 = subphaseById.get("P143.3") || {};
const p1434 = subphaseById.get("P143.4") || {};
const p1435 = subphaseById.get("P143.5") || {};
const p1436 = subphaseById.get("P143.6") || {};
const checkerSource = readText("scripts/check-p1434-release-deploy-export-package-pipeline.js");
const p1433Checker = readText("scripts/check-p1433-release-deploy-export-package-pipeline.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const helperSource = readText("dashboard/src/data/releaseDeployExportPackageUx.js");
const releaseDataSource = readText("dashboard/src/data/releaseReadiness.js");
const monitoringDataSource = readText("dashboard/src/data/deployMonitoringReadiness.js");
const shippingDataSource = readText("dashboard/src/data/projectShippingReadiness.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const changed = changedFiles();
const allowedFiles = new Set(p1434.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
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
const releaseUx = buildReleaseControlShippingPreviewUx();
const monitoringUx = buildDeployMonitoringShippingPreviewUx();
const shippingUx = buildProjectShippingPreviewUx();
const allUxRows = [...releaseUx.rows, ...monitoringUx.rows, ...shippingUx.rows];
const helperRows = buildShippingPreviewUxRows(["release_gate", "deploy_target", "export_package", "provenance_record", "rollback_plan"]);
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const enforceCurrentDiffScope = status.currentPhase === "P143.4";

const p1434CurrentState =
  status.currentPhase === "P143.4"
  && status.previousPhase === "P143.3"
  && status.nextPhase === "P143.5"
  && roadmap.currentPhase === "P143.4"
  && roadmap.previousPhase === "P143.3"
  && roadmap.nextPhase === "P143.5"
  && status.current?.phaseId === "P143.4"
  && status.previous?.phaseId === "P143.3"
  && status.next?.phaseId === "P143.5"
  && roadmap.current?.phaseId === "P143.4"
  && roadmap.previous?.phaseId === "P143.3"
  && roadmap.next?.phaseId === "P143.5"
  && statusById.get("P143")?.status === "in_progress"
  && roadmapById.get("P143")?.status === "in_progress"
  && ["P143.1", "P143.2", "P143.3", "P143.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P143.5")?.status === "planned"
  && roadmapById.get("P143.5")?.status === "planned"
  && statusById.get("P144")?.status === "planned"
  && roadmapById.get("P144")?.status === "planned";
const p1435CurrentState =
  status.currentPhase === "P143.5"
  && status.previousPhase === "P143.4"
  && status.nextPhase === "P143.6"
  && roadmap.currentPhase === "P143.5"
  && roadmap.previousPhase === "P143.4"
  && roadmap.nextPhase === "P143.6"
  && status.current?.phaseId === "P143.5"
  && status.previous?.phaseId === "P143.4"
  && status.next?.phaseId === "P143.6"
  && roadmap.current?.phaseId === "P143.5"
  && roadmap.previous?.phaseId === "P143.4"
  && roadmap.next?.phaseId === "P143.6"
  && statusById.get("P143")?.status === "in_progress"
  && roadmapById.get("P143")?.status === "in_progress"
  && ["P143.1", "P143.2", "P143.3", "P143.4", "P143.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P143.6")?.status === "planned"
  && roadmapById.get("P143.6")?.status === "planned"
  && statusById.get("P144")?.status === "planned"
  && roadmapById.get("P144")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1434-release-deploy-export-package-pipeline.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("UX helper reuses P143.3 preview", helperSource.includes("../../../shared/releaseDeployExportPackagePreview.js") && helperSource.includes("buildReleaseDeployExportPackagePreview"));
addCheck("UX helper exports expected API", [
  "buildShippingPreviewUxRows",
  "buildReleaseControlShippingPreviewUx",
  "buildDeployMonitoringShippingPreviewUx",
  "buildProjectShippingPreviewUx",
].every((entry) => helperSource.includes(`export function ${entry}`)));
addCheck("UX helper does not include writers or execution hooks", !/\b(writeFileSync|appendFileSync|mkdirSync|rmSync|execFileSync|spawn|fetch|XMLHttpRequest|sqlite|postgres|mongodb|createRelease|startDeploy|runRollback|runExport|createPackage)\b/.test(helperSource));
addCheck("release/deploy/shipping view models import UX helper", releaseDataSource.includes("buildReleaseControlShippingPreviewUx") && monitoringDataSource.includes("buildDeployMonitoringShippingPreviewUx") && shippingDataSource.includes("buildProjectShippingPreviewUx"));
addCheck("view models expose preview rows and summary", [releaseDataSource, monitoringDataSource, shippingDataSource].every((source) => source.includes("shippingPreviewRows") && source.includes("shippingPreviewSummary") && source.includes("shippingPreviewLabel")));
addCheck("Command Center renders reusable shipping preview component", commandCenterSource.includes("function ShippingPreviewRows") && (commandCenterSource.match(/<ShippingPreviewRows/g) || []).length === 3);
addCheck("shipping preview UX labels are user-facing", releaseUx.label === "Release and package preview" && monitoringUx.label === "Deploy and rollback preview" && shippingUx.label === "Export, package, and provenance preview");
addCheck("shipping preview UX has concrete rows", releaseUx.rows.length >= 2 && monitoringUx.rows.length >= 2 && shippingUx.rows.length >= 2 && helperRows.length >= 5);
addCheck("shipping preview rows stay non-runnable", allUxRows.every((row) => row.executionAllowed === false && row.rawPayloadVisible === false && row.payloadState === "Null executable payload"));
addCheck("shipping preview rows include operator fields", allUxRows.every((row) => row.label && row.state && row.nextAction && row.disabledReason && row.ownerCapability && row.evidenceLocation && row.activityLocation && row.costImpact));
addCheck("shipping preview summaries block execution", [releaseUx, monitoringUx, shippingUx].every((ux) => ux.summary.rowCount === ux.rows.length && ux.summary.executableRowCount === 0 && ux.summary.rawPayloadVisible === false && ux.summary.payloadState === "Null executable payload"));
addCheck("primary UX avoids internal phase labels", !/P143\.4/.test(commandCenterSource.replace(/\/\*[\s\S]*?\*\//g, "")));
addCheck("P143.3 report passes", reportPassed("reports/p1433-release-deploy-export-package-pipeline-report.md"));
addCheck("contract advances to P143.4 safely", contract.phaseId === "P143" && contract.status === "in_progress" && p1433.status === "complete" && p1434.status === "complete" && (
  (contract.currentSubphase === "P143.4" && contract.previousSubphase === "P143.3" && contract.nextSubphase === "P143.5" && p1435.status === "planned")
  || (contract.currentSubphase === "P143.5" && contract.previousSubphase === "P143.4" && contract.nextSubphase === "P143.6" && p1435.status === "complete" && p1436.status === "planned")
));
addCheck("contract records expected base commit", p1434.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1434.validationCommands?.includes(command)));
addCheck("contract scope stays Command Center UX only", p1434.scopeClassification === "NEXUS_OS_CHANGE" && p1434.allowedFiles?.includes("dashboard/src/pages/CommandCenterV2.jsx") && p1434.forbiddenFiles?.includes("projects/**") && p1434.forbiddenFiles?.includes("deploy/**") && p1434.forbiddenFiles?.includes("release/**"));
addCheck("P143.3 checker accepts P143.4 handoff", p1433Checker.includes("p1434CurrentState") && p1433Checker.includes('status.currentPhase === "P143.4"') && p1433Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P143.4 active state", enterpriseChecker.includes("p1434CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("P143.4 checker records P143.5 handoff", checkerSource.includes("p1435CurrentState") && checkerSource.includes(NEXT_SCRIPT));
addCheck("docs record P143.4 and P143.5 handoff", /## P143\.4 Shipping Command Center UX[\s\S]*Status:\s+complete/.test(plan) && /P143\.4 Shipping Command Center UX is complete/i.test(readme) && /P143\.4 shipping Command Center UX is complete/i.test(platformRoadmap) && /P143\.4 is now complete as display-only shipping Command Center UX/i.test(enterpriseRoadmap) && (/P143\.5 is planned-only next/i.test(enterpriseRoadmap) || /P143\.5 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status advances to P143.4", p1434CurrentState || p1435CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P143.4 entries have required fields", [statusById.get("P143"), statusById.get("P143.4"), roadmapById.get("P143"), roadmapById.get("P143.4")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("next P143.5/P144 handoff remains planned-only", p1435CurrentState
  ? [statusById.get("P143.6"), roadmapById.get("P143.6"), statusById.get("P144"), roadmapById.get("P144")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)
  : [statusById.get("P143.5"), roadmapById.get("P143.5"), statusById.get("P144"), roadmapById.get("P144")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0));
addCheck("P143.4 Playwright coverage exists", routeTests.includes("P143.4 shipping Command Center UX shows display-safe preview rows") && routeTests.includes("Release and package preview") && routeTests.includes("Deploy and rollback preview") && routeTests.includes("Export, package, and provenance preview"));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("changed files stay in P143.4 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|release|deploy|export|package|rollback|artifact|provenance)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
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
        "- Adds the P143.4 display-safe Command Center projection for release, deploy, export, package, provenance, and rollback preview rows.",
        "- Confirms P143.3 remains complete and P143.5/P144 remain planned-only.",
        "- Does not create release packages, start deploys, execute rollbacks, run exports, build packages, apply patches, run build/test commands, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Command Center Coverage",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        `- Release preview rows: ${releaseUx.rows.length}`,
        `- Deploy monitoring preview rows: ${monitoringUx.rows.length}`,
        `- Project shipping preview rows: ${shippingUx.rows.length}`,
        `- Executable preview rows: ${allUxRows.filter((row) => row.executionAllowed).length}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P143.4 is display-only Command Center UX. It does not create release packages, start deploys, execute rollbacks, run exports, build packages, apply patches, run build/test commands, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, use network calls, or spend. P143.5-P143.7 remain planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P143.4 Release Deploy Export Package Pipeline Report", phase: "P143.4" },
);

printCheckReport("P143.4 Release Deploy Export Package Pipeline Check", checks);
if (failed.length > 0) process.exitCode = 1;
