import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  RELEASE_DEPLOY_EXPORT_PACKAGE_SAFETY_FLAG_NAMES,
  buildReleaseDeployExportPackageModel,
  validateReleaseDeployExportPackageModel,
} from "../shared/releaseDeployExportPackageModel.js";
import {
  buildReleaseDeployExportPackagePreview,
  validateReleaseDeployExportPackagePreview,
} from "../shared/releaseDeployExportPackagePreview.js";
import {
  buildDeployMonitoringShippingPreviewUx,
  buildProjectShippingPreviewUx,
  buildReleaseControlShippingPreviewUx,
} from "../dashboard/src/data/releaseDeployExportPackageUx.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1435-release-deploy-export-package-pipeline-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p143-release-deploy-export-package-pipeline-contracts.json";
const PLAN_PATH = "docs/architecture/P143_RELEASE_DEPLOY_EXPORT_PACKAGE_PIPELINE_PLAN.md";
const REQUIRED_SCRIPT = "check:p1435-release-deploy-export-package-pipeline";
const NEXT_SCRIPT = "check:p1436-release-deploy-export-package-pipeline-docs-roadmap";
const FINAL_SCRIPT = "check:p1437-release-deploy-export-package-pipeline-final-validation";
const EXPECTED_BASE_COMMIT = "16ab133b";
const PRIOR_REPORTS = [
  "reports/p1431-release-deploy-export-package-pipeline-report.md",
  "reports/p1432-release-deploy-export-package-pipeline-report.md",
  "reports/p1433-release-deploy-export-package-pipeline-report.md",
  "reports/p1434-release-deploy-export-package-pipeline-report.md",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1435-release-deploy-export-package-pipeline",
  "npm run check:p1434-release-deploy-export-package-pipeline",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P143.5\"",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|handoff|aggregate|coverage|tests?)\b/i.test(context);
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
const p1435 = subphaseById.get("P143.5") || {};
const p1436 = subphaseById.get("P143.6") || {};
const p1437 = subphaseById.get("P143.7") || {};
const checkerSource = readText("scripts/check-p1435-release-deploy-export-package-pipeline.js");
const p1434Checker = readText("scripts/check-p1434-release-deploy-export-package-pipeline.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const model = buildReleaseDeployExportPackageModel({ createdAt: "2026-05-31T20:25:00.000Z" });
const preview = buildReleaseDeployExportPackagePreview({ sourceModel: model });
const releaseUx = buildReleaseControlShippingPreviewUx({ preview });
const monitoringUx = buildDeployMonitoringShippingPreviewUx({ preview });
const shippingUx = buildProjectShippingPreviewUx({ preview });
const allUxRows = [...releaseUx.rows, ...monitoringUx.rows, ...shippingUx.rows];
const modelValidation = validateReleaseDeployExportPackageModel(model);
const previewValidation = validateReleaseDeployExportPackagePreview(preview);
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P143.5";
const allowedFiles = new Set(p1435.allowedFiles || []);
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
const displayBundle = [
  releaseUx.label,
  monitoringUx.label,
  shippingUx.label,
  allUxRows.map((row) => `${row.label} ${row.state} ${row.nextAction} ${row.disabledReason} ${row.ownerCapability} ${row.costImpact} ${row.payloadState}`).join("\n"),
].join("\n");
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const modelPreviewDisplayBundle = `${JSON.stringify(model)}\n${JSON.stringify(preview)}\n${displayBundle}`;

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

const p1436CurrentState =
  status.currentPhase === "P143.6"
  && status.previousPhase === "P143.5"
  && status.nextPhase === "P143.7"
  && roadmap.currentPhase === "P143.6"
  && roadmap.previousPhase === "P143.5"
  && roadmap.nextPhase === "P143.7"
  && status.current?.phaseId === "P143.6"
  && status.previous?.phaseId === "P143.5"
  && status.next?.phaseId === "P143.7"
  && roadmap.current?.phaseId === "P143.6"
  && roadmap.previous?.phaseId === "P143.5"
  && roadmap.next?.phaseId === "P143.7"
  && statusById.get("P143")?.status === "in_progress"
  && roadmapById.get("P143")?.status === "in_progress"
  && ["P143.1", "P143.2", "P143.3", "P143.4", "P143.5", "P143.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P143.7")?.status === "planned"
  && roadmapById.get("P143.7")?.status === "planned"
  && statusById.get("P144")?.status === "planned"
  && roadmapById.get("P144")?.status === "planned";

const p1437FinalState =
  status.currentPhase === "P143.7"
  && status.previousPhase === "P143.6"
  && status.nextPhase === "P144"
  && roadmap.currentPhase === "P143.7"
  && roadmap.previousPhase === "P143.6"
  && roadmap.nextPhase === "P144"
  && status.current?.phaseId === "P143.7"
  && status.previous?.phaseId === "P143.6"
  && status.next?.phaseId === "P144"
  && roadmap.current?.phaseId === "P143.7"
  && roadmap.previous?.phaseId === "P143.6"
  && roadmap.next?.phaseId === "P144"
  && statusById.get("P143")?.status === "complete"
  && roadmapById.get("P143")?.status === "complete"
  && ["P143.1", "P143.2", "P143.3", "P143.4", "P143.5", "P143.6", "P143.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P144")?.status === "planned"
  && roadmapById.get("P144")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1435-release-deploy-export-package-pipeline.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("P143.1-P143.4 reports pass", PRIOR_REPORTS.every(reportPassed), `${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`);
addCheck("release model validates", modelValidation.valid, modelValidation.errors.join("; "));
addCheck("shipping preview validates", previewValidation.valid, previewValidation.errors.join("; "));
addCheck("shipping UX exposes aggregate route rows", releaseUx.rows.length >= 2 && monitoringUx.rows.length >= 2 && shippingUx.rows.length >= 2 && allUxRows.length >= 6);
addCheck("shipping UX rows are display-safe and non-runnable", allUxRows.every((row) => row.executionAllowed === false && row.rawPayloadVisible === false && row.payloadState === "Null executable payload"));
addCheck("shipping UX rows include operator fields", allUxRows.every((row) => row.label && row.state && row.nextAction && row.disabledReason && row.ownerCapability && row.evidenceLocation && row.activityLocation && row.costImpact));
addCheck("all model and preview safety flags remain blocked", RELEASE_DEPLOY_EXPORT_PACKAGE_SAFETY_FLAG_NAMES.every((flag) => model[flag] === false && model.safetyFlags?.[flag] === false && preview[flag] === false && preview.safetyFlags?.[flag] === false && preview.rows.every((row) => row[flag] === false && row.safetyFlags?.[flag] === false && row.authorityFlags?.[flag] === false)));
addCheck("model, preview, and display remain public-safe", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|release|deploy|export|package|rollback|artifact|provenance)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(modelPreviewDisplayBundle) && !/raw JSON|raw logs?|raw policy dump|Bearer\s+|jwt|id_token|access_token|postgres(?:ql)?:\/\//i.test(modelPreviewDisplayBundle));
addCheck("model, preview, and display have no fake runnable actions", !/create release now|create package now|start deploy now|deploy now|run rollback now|rollback now|run export now|export now|package now|apply patch now|run build now|run tests now|write db now|call provider now|run tool now|dispatch agent now|mutate project now|spend now/i.test(modelPreviewDisplayBundle));
addCheck("cost impact remains zero-spend", model.costImpact.providerSpendAllowed === false && preview.costImpact.providerSpendAllowed === false && allUxRows.every((row) => /No provider/.test(row.costImpact)));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("P143.5 Playwright aggregate coverage exists", routeTests.includes("P143.5 shipping aggregate coverage keeps shipping pages display-only") && routeTests.includes("P143.7") && routeTests.includes("Final Validation") && routeTests.includes("P144"));
addCheck("contract advances through P143.5 safely", contract.phaseId === "P143" && p1431.status === "complete" && p1432.status === "complete" && p1433.status === "complete" && p1434.status === "complete" && p1435.status === "complete" && (
  (contract.status === "in_progress" && contract.currentSubphase === "P143.5" && contract.previousSubphase === "P143.4" && contract.nextSubphase === "P143.6" && p1436.status === "planned")
  || (contract.status === "in_progress" && contract.currentSubphase === "P143.6" && contract.previousSubphase === "P143.5" && contract.nextSubphase === "P143.7" && p1436.status === "complete" && p1437.status === "planned")
  || (contract.status === "complete" && contract.currentSubphase === "P143.7" && contract.previousSubphase === "P143.6" && contract.nextSubphase === "P144" && p1436.status === "complete" && p1437.status === "complete")
));
addCheck("contract records expected base commit", p1435.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1435.validationCommands?.includes(command)));
addCheck("contract scope stays aggregate-checker only", /aggregate/i.test(p1435.dataShape || "") && p1435.forbiddenFiles?.includes("projects/**") && p1435.forbiddenFiles?.includes("deploy/**") && p1435.forbiddenFiles?.includes("release/**"));
addCheck("P143.4 checker accepts P143.5", p1434Checker.includes("p1435CurrentState") && p1434Checker.includes('status.currentPhase === "P143.5"') && p1434Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P143.5", enterpriseChecker.includes("p1435CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("P143 plan records P143.5", /## P143\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P143.5", /P143\.5 Tests \/ Checkers/i.test(readme));
addCheck("platform roadmap records P143.5", /P143\.5 Tests \/ Checkers is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P143.5", /P143\.5 is now complete as aggregate tests\/checkers only/i.test(enterpriseRoadmap) && (/P143\.6 is planned-only next/i.test(enterpriseRoadmap) || /P143\.6 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status advances through P143.5", p1435CurrentState || p1436CurrentState || p1437FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P143.5 entries have required fields", [statusById.get("P143"), statusById.get("P143.5"), roadmapById.get("P143"), roadmapById.get("P143.5")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("P143.6 handoff remains valid", (p1435CurrentState && [statusById.get("P143.6"), roadmapById.get("P143.6")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)) || ((p1436CurrentState || p1437FinalState) && [statusById.get("P143.6"), roadmapById.get("P143.6")].every((entry) => entry?.status === "complete" && Boolean(entry.branch) && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${NEXT_SCRIPT}`))));
addCheck("P143.7 handoff remains valid after P143.6", (p1436CurrentState && [statusById.get("P143.7"), roadmapById.get("P143.7")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)) || (p1437FinalState && [statusById.get("P143.7"), roadmapById.get("P143.7")].every((entry) => entry?.status === "complete" && Boolean(entry.branch) && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${FINAL_SCRIPT}`))) || (!p1436CurrentState && !p1437FinalState));
addCheck("P144 remains planned-only", [statusById.get("P144"), roadmapById.get("P144")].every((entry) => entry?.status === "planned" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0));
addCheck("changed files stay in P143.5 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
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
        "- Adds aggregate P143.5 checker and Playwright coverage for release, deploy, export, package, provenance, and rollback shipping surfaces.",
        "- Verifies P143.1-P143.4 reports, P143.2 model, P143.3 preview, P143.4 Command Center UX, route-wide safety coverage, docs/status, and P143.6 handoff compatibility.",
        "- Does not create release packages, start deploys, execute rollbacks, run exports, build packages, apply patches, run build/test commands, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Coverage Summary",
      body: [
        `- Prior reports passing: ${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`,
        `- Model validation: ${modelValidation.valid ? "PASS" : "FAIL"}`,
        `- Preview validation: ${previewValidation.valid ? "PASS" : "FAIL"}`,
        `- Release preview rows: ${releaseUx.rows.length}`,
        `- Deploy monitoring preview rows: ${monitoringUx.rows.length}`,
        `- Project shipping preview rows: ${shippingUx.rows.length}`,
        `- Executable UX rows: ${allUxRows.filter((row) => row.executionAllowed).length}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P143.5 is tests/checkers hardening only. It does not enable release package creation, deploy start, rollback execution, export execution, package build, patch application, build/test execution, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, network calls, or spend. P143.6 may be complete as docs/status/checker closure; P143.7 remains planned-only until its own implementation-grade plan.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P143.5 Release Deploy Export Package Pipeline Report", phase: "P143.5" },
);

printCheckReport("P143.5 Release Deploy Export Package Pipeline Check", checks, failed.length === 0 ? "PASS" : "FAIL");

if (failed.length > 0) {
  process.exitCode = 1;
}
