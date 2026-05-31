import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  RELEASE_DEPLOY_EXPORT_PACKAGE_PREVIEW_PHASE,
  RELEASE_DEPLOY_EXPORT_PACKAGE_PREVIEW_SAFETY_FLAG_NAMES,
  RELEASE_DEPLOY_EXPORT_PACKAGE_PREVIEW_VERSION,
  buildPreviewRow,
  buildReleaseDeployExportPackagePreview,
  buildReleaseDeployExportPackagePreviewEnvelope,
  validatePreviewRow,
  validateReleaseDeployExportPackagePreview,
} from "../shared/releaseDeployExportPackagePreview.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1433-release-deploy-export-package-pipeline-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p143-release-deploy-export-package-pipeline-contracts.json";
const PLAN_PATH = "docs/architecture/P143_RELEASE_DEPLOY_EXPORT_PACKAGE_PIPELINE_PLAN.md";
const REQUIRED_SCRIPT = "check:p1433-release-deploy-export-package-pipeline";
const EXPECTED_BASE_COMMIT = "8154a4b5";
const EXPECTED_EXPORTS = [
  "RELEASE_DEPLOY_EXPORT_PACKAGE_PREVIEW_PHASE",
  "RELEASE_DEPLOY_EXPORT_PACKAGE_PREVIEW_VERSION",
  "RELEASE_DEPLOY_EXPORT_PACKAGE_PREVIEW_SAFETY_FLAG_NAMES",
  "buildPreviewRow",
  "validatePreviewRow",
  "buildReleaseDeployExportPackagePreview",
  "validateReleaseDeployExportPackagePreview",
  "buildReleaseDeployExportPackagePreviewEnvelope",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1433-release-deploy-export-package-pipeline",
  "npm run check:p1432-release-deploy-export-package-pipeline",
  "npm run check:p1431-release-deploy-export-package-pipeline",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P143.3|Release Control|Deploy Monitoring|Project Shipping|Command Center route-wide UX\"",
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
const p1431 = subphaseById.get("P143.1") || {};
const p1432 = subphaseById.get("P143.2") || {};
const p1433 = subphaseById.get("P143.3") || {};
const p1434 = subphaseById.get("P143.4") || {};
const checkerSource = readText("scripts/check-p1433-release-deploy-export-package-pipeline.js");
const p1432Checker = readText("scripts/check-p1432-release-deploy-export-package-pipeline.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const helperSource = readText("shared/releaseDeployExportPackagePreview.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P143.3";
const allowedFiles = new Set(p1433.allowedFiles || []);
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
const previewRow = buildPreviewRow({ sequence: 1 });
const preview = buildReleaseDeployExportPackagePreview({ createdAt: "2026-05-31T19:15:00.000Z" });
const rowValidation = validatePreviewRow(previewRow);
const previewValidation = validateReleaseDeployExportPackagePreview(preview);
const envelope = buildReleaseDeployExportPackagePreviewEnvelope({ preview });
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const previewAndDocs = `${JSON.stringify(preview)}\n${docsBundle}`;

const p1433CurrentState =
  status.currentPhase === "P143.3"
  && status.previousPhase === "P143.2"
  && status.nextPhase === "P143.4"
  && roadmap.currentPhase === "P143.3"
  && roadmap.previousPhase === "P143.2"
  && roadmap.nextPhase === "P143.4"
  && status.current?.phaseId === "P143.3"
  && status.previous?.phaseId === "P143.2"
  && status.next?.phaseId === "P143.4"
  && roadmap.current?.phaseId === "P143.3"
  && roadmap.previous?.phaseId === "P143.2"
  && roadmap.next?.phaseId === "P143.4"
  && statusById.get("P143")?.status === "in_progress"
  && roadmapById.get("P143")?.status === "in_progress"
  && ["P143.1", "P143.2", "P143.3"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P143.4")?.status === "planned"
  && roadmapById.get("P143.4")?.status === "planned"
  && statusById.get("P144")?.status === "planned"
  && roadmapById.get("P144")?.status === "planned";

const p1434CurrentState =
  status.currentPhase === "P143.4"
  && status.previousPhase === "P143.3"
  && status.nextPhase === "P143.5"
  && roadmap.currentPhase === "P143.4"
  && roadmap.previousPhase === "P143.3"
  && roadmap.nextPhase === "P143.5"
  && ["P143.1", "P143.2", "P143.3", "P143.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P143.5")?.status === "planned"
  && roadmapById.get("P143.5")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1433-release-deploy-export-package-pipeline.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("preview exports expected API", EXPECTED_EXPORTS.every((entry) => helperSource.includes(`export const ${entry}`) || helperSource.includes(`export function ${entry}`)));
addCheck("preview reuses P143.2 model and shared helpers", ["./releaseDeployExportPackageModel.js", "./modeGuard.js", "./redaction.js", "./resultEnvelope.js"].every((target) => helperSource.includes(target)));
addCheck("preview helper does not include writers or execution hooks", !/\b(writeFileSync|appendFileSync|mkdirSync|rmSync|execFileSync|spawn|fetch|XMLHttpRequest|sqlite|postgres|mongodb)\b/.test(helperSource));
addCheck("preview constants are correct", RELEASE_DEPLOY_EXPORT_PACKAGE_PREVIEW_PHASE === "P143.3" && RELEASE_DEPLOY_EXPORT_PACKAGE_PREVIEW_VERSION === "1.0" && RELEASE_DEPLOY_EXPORT_PACKAGE_PREVIEW_SAFETY_FLAG_NAMES.length >= 15);
addCheck("preview row validator passes", rowValidation.valid, rowValidation.errors.join("; "));
addCheck("preview validator passes", previewValidation.valid, previewValidation.errors.join("; "));
addCheck("preview envelope passes", envelope.ok === true && envelope.status === "PASS" && envelope.phase === "P143.3" && envelope.envelopeValid === true);
addCheck("preview maps all P143.2 source rows", preview.rows.length >= 12 && ["release_gate", "deploy_target", "export_package", "provenance_record", "rollback_plan"].every((type) => preview.rows.some((row) => row.sourceType === type)));
addCheck("preview rows are non-runnable", preview.rows.every((row) => row.executablePayload === null && row.deployPayload === null && row.exportPayload === null && row.packagePayload === null && row.rollbackPayload === null && row.providerPayload === null && row.toolPayload === null && row.projectMutationPayload === null && row.dbRuntimeMutationPayload === null && row.executionAllowed === false));
addCheck("preview hides raw internals", preview.rows.every((row) => row.rawPayloadVisible === false && row.rawPrivateIdsVisible === false && row.rawInternalPayloadsVisible === false) && preview.redaction.rawPrivateIdsVisible === false && preview.redaction.rawInternalPayloadsVisible === false);
addCheck("readiness summary blocks runtime candidates", preview.readinessSummary.runnableActionCount === 0 && preview.readinessSummary.deployStartCandidateCount === 0 && preview.readinessSummary.exportExecutionCandidateCount === 0 && preview.readinessSummary.packageBuildCandidateCount === 0 && preview.readinessSummary.rollbackExecutionCandidateCount === 0 && preview.readinessSummary.providerSpendCandidateCount === 0);
addCheck("all authority flags remain blocked", RELEASE_DEPLOY_EXPORT_PACKAGE_PREVIEW_SAFETY_FLAG_NAMES.every((flag) => preview[flag] === false && preview.safetyFlags?.[flag] === false && preview.rows.every((row) => row[flag] === false && row.safetyFlags?.[flag] === false && row.authorityFlags?.[flag] === false)));
addCheck("cost impact remains zero-spend", preview.costImpact.estimatedUsd === 0 && preview.costImpact.actualUsd === 0 && preview.costImpact.providerSpendAllowed === false && preview.costImpact.networkCallsAllowed === false && preview.rows.every((row) => row.costImpact.estimatedUsd === 0 && row.costImpact.actualUsd === 0 && row.costImpact.providerSpendAllowed === false));
addCheck("P143.2 report passes", reportPassed("reports/p1432-release-deploy-export-package-pipeline-report.md"));
addCheck("contract advances to P143.3 safely", contract.phaseId === "P143" && contract.status === "in_progress" && p1431.status === "complete" && p1432.status === "complete" && p1433.status === "complete" && (
  (contract.currentSubphase === "P143.3" && contract.previousSubphase === "P143.2" && contract.nextSubphase === "P143.4" && p1434.status === "planned")
  || (contract.currentSubphase === "P143.4" && contract.previousSubphase === "P143.3" && contract.nextSubphase === "P143.5" && p1434.status === "complete")
));
addCheck("contract records expected base commit", p1433.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records expected exports", EXPECTED_EXPORTS.every((entry) => p1433.expectedExports?.includes(entry)));
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1433.validationCommands?.includes(command)));
addCheck("contract scope stays preview-only", /non-runnable preview/i.test(p1433.dataShape || "") && p1433.forbiddenFiles?.includes("dashboard/src/**") && p1433.forbiddenFiles?.includes("projects/**") && p1433.forbiddenFiles?.includes("deploy/**") && p1433.forbiddenFiles?.includes("release/**"));
addCheck("P143.2 checker accepts P143.3 handoff", p1432Checker.includes("p1433CurrentState") && p1432Checker.includes('status.currentPhase === "P143.3"') && p1432Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P143.3 active state", enterpriseChecker.includes("p1433CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P143.4 handoff", osStatusChecker.includes('"P143.4"') && osStatusChecker.includes('"P143.7"'));
addCheck("docs record P143.3 and P143.4 handoff", /## P143\.3 Deploy \/ Export \/ Package Preview[\s\S]*Status:\s+complete/.test(plan) && /P143\.3\s+Deploy \/ Export \/ Package Preview\s+is\s+complete/i.test(readme) && /P143\.3\s+shipping preview\s+is\s+complete/i.test(platformRoadmap) && /P143\.3 is now complete as a non-runnable shipping preview/i.test(enterpriseRoadmap) && (/P143\.4 is planned-only next/i.test(enterpriseRoadmap) || /P143\.4 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status advances to P143.3", p1433CurrentState || p1434CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P143.3 entries have required fields", [statusById.get("P143"), statusById.get("P143.3"), roadmapById.get("P143"), roadmapById.get("P143.3")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("next P143.4/P144 handoff remains planned-only", p1434CurrentState
  ? [statusById.get("P143.5"), roadmapById.get("P143.5"), statusById.get("P144"), roadmapById.get("P144")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)
  : [statusById.get("P143.4"), roadmapById.get("P143.4"), statusById.get("P144"), roadmapById.get("P144")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0));
addCheck("P143.3 Playwright coverage exists", routeTests.includes("P143.3 shipping preview keeps shipping routes non-runnable") && routeTests.includes("Release Control") && routeTests.includes("Deploy Monitoring") && routeTests.includes("Project Shipping") && routeTests.includes("P143.3") && routeTests.includes("P143.4"));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("changed files stay in P143.3 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => file === "dashboard/tests/routes.spec.js" || !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `forbidden path check relaxed for ${status.currentPhase}`);
addCheck("preview and docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|release|deploy|export|package|rollback|artifact|provenance)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(previewAndDocs));
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
        "- Adds the P143.3 display-safe release, deploy, export, package, provenance, and rollback preview.",
        "- Confirms P143.2 remains complete and P143.4/P144 remain planned-only.",
        "- Does not create release packages, start deploys, execute rollbacks, run exports, build packages, apply patches, run build/test commands, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Preview Coverage",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        `- Preview validation: ${previewValidation.valid ? "PASS" : "FAIL"}`,
        `- Preview rows: ${preview.rows.length}`,
        `- Authority flags: ${RELEASE_DEPLOY_EXPORT_PACKAGE_PREVIEW_SAFETY_FLAG_NAMES.every((flag) => preview[flag] === false) ? "blocked" : "unsafe"}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P143.3 is a non-runnable local preview only. It does not render new Command Center UI, create release packages, start deploys, execute rollbacks, run exports, build packages, apply patches, run build/test commands, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, use network calls, or spend. P143.4-P143.7 remain planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P143.3 Release Deploy Export Package Pipeline Report", phase: "P143.3" },
);

printCheckReport("P143.3 Release Deploy Export Package Pipeline Check", checks);
if (failed.length > 0) process.exitCode = 1;
