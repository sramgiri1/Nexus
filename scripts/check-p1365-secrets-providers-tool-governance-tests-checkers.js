import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildProviderGovernanceDryRun, validateProviderGovernanceDryRun } from "../shared/providerGovernanceDryRun.js";
import { buildProviderGovernanceModel, validateProviderGovernanceModel } from "../shared/providerGovernanceModel.js";
import { providerGovernanceReadiness, providerGovernanceSummary } from "../dashboard/src/data/providerGovernanceReadiness.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1365-secrets-providers-tool-governance-tests-checkers-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p136-secrets-providers-tool-governance-contracts.json";
const PLAN_PATH = "docs/architecture/P136_SECRETS_PROVIDERS_TOOL_GOVERNANCE_PLAN.md";
const TEST_PATH = "dashboard/tests/routes.spec.js";
const REQUIRED_SCRIPT = "check:p1365-secrets-providers-tool-governance-tests-checkers";
const ROUTE_TEST = "Provider Governance route renders P136.4 review-only dry-run posture";
const VALIDATION_COMMANDS = [
  "npm run check:p1365-secrets-providers-tool-governance-tests-checkers",
  "npm run check:p1364-provider-governance-command-center-ux",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
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
  return /## Result[\s\S]*PASS/i.test(readText(relativePath));
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
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|dry run|read-only|review-only|model|checker|report|docs?|roadmap|status|boundary|non-runnable|zero-spend|display-safe|tests?|coverage)\b/i.test(context);
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
const p1365 = subphaseById.get("P136.5") || {};
const p1366 = subphaseById.get("P136.6") || {};
const checkerSource = readText("scripts/check-p1365-secrets-providers-tool-governance-tests-checkers.js");
const p1364Checker = readText("scripts/check-p1364-provider-governance-command-center-ux.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const testSource = readText(TEST_PATH);
const dataSource = readText("dashboard/src/data/providerGovernanceReadiness.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const changed = changedFiles();
const allowedFiles = new Set(p1365.allowedFiles || []);
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
const providerModel = buildProviderGovernanceModel();
const modelValidation = validateProviderGovernanceModel(providerModel);
const dryRun = buildProviderGovernanceDryRun({ providerGovernanceModel: providerModel });
const dryRunValidation = validateProviderGovernanceDryRun(dryRun);
const readinessText = JSON.stringify(providerGovernanceReadiness);
const p1365CurrentState =
  status.currentPhase === "P136.5"
  && status.previousPhase === "P136.4"
  && status.nextPhase === "P136.6"
  && roadmap.currentPhase === "P136.5"
  && roadmap.previousPhase === "P136.4"
  && roadmap.nextPhase === "P136.6"
  && status.current?.phaseId === "P136.5"
  && status.previous?.phaseId === "P136.4"
  && status.next?.phaseId === "P136.6"
  && roadmap.current?.phaseId === "P136.5"
  && roadmap.previous?.phaseId === "P136.4"
  && roadmap.next?.phaseId === "P136.6"
  && statusById.get("P136")?.status === "in_progress"
  && roadmapById.get("P136")?.status === "in_progress"
  && ["P136.1", "P136.2", "P136.3", "P136.4", "P136.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P136.6")?.status === "planned"
  && roadmapById.get("P136.6")?.status === "planned";
const p1366CurrentState =
  status.currentPhase === "P136.6"
  && status.previousPhase === "P136.5"
  && status.nextPhase === "P136.7"
  && roadmap.currentPhase === "P136.6"
  && roadmap.previousPhase === "P136.5"
  && roadmap.nextPhase === "P136.7"
  && status.current?.phaseId === "P136.6"
  && status.previous?.phaseId === "P136.5"
  && status.next?.phaseId === "P136.7"
  && roadmap.current?.phaseId === "P136.6"
  && roadmap.previous?.phaseId === "P136.5"
  && roadmap.next?.phaseId === "P136.7"
  && statusById.get("P136")?.status === "in_progress"
  && roadmapById.get("P136")?.status === "in_progress"
  && ["P136.1", "P136.2", "P136.3", "P136.4", "P136.5", "P136.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P136.7")?.status === "planned"
  && roadmapById.get("P136.7")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("P136.2 provider governance model validates", modelValidation.valid, modelValidation.errors.join("; "));
addCheck("P136.2 safety flags remain disabled", Object.values(providerModel.safetyFlags || {}).every((value) => value === false));
addCheck("P136.3 provider dry run validates", dryRunValidation.valid, dryRunValidation.errors.join("; "));
addCheck("P136.3 dry run remains non-runnable zero-authority", dryRun.nonRunnable === true && dryRun.localOnly === true && dryRun.executableDecisionRowCount === 0 && dryRun.budgetImpact?.estimatedUsd === 0 && Object.values(dryRun.candidateCounts || {}).every((value) => value === 0));
addCheck("Provider Governance readiness reuses P136.3 dry run", dataSource.includes("buildProviderGovernanceDryRun") && providerGovernanceSummary.sourcePhase === "P136.3" && providerGovernanceSummary.phase === "P136.4");
addCheck("Provider Governance readiness stays non-runnable and zero-spend", providerGovernanceSummary.executableRows === 0 && providerGovernanceSummary.estimatedUsd === 0 && providerGovernanceReadiness.summaryCards?.some((card) => card.value === "$0"));
addCheck("prior P136 reports pass", [
  "reports/p1361-secrets-providers-tool-governance-report.md",
  "reports/p1362-secret-provider-model-report.md",
  "reports/p1363-provider-dry-run-report.md",
  "reports/p1364-provider-governance-command-center-ux-report.md",
].every((reportPath) => reportPassed(reportPath)));
addCheck("P136.4 Playwright regression exists", testSource.includes(ROUTE_TEST) && testSource.includes("/command-center/provider-governance"));
addCheck("P136.4 Playwright covers provider tabs and themes", ["Dry Run", "Approval Needs", "Cost Impact", "Evidence", "Safety", "dark", "light", "system"].every((text) => testSource.includes(text)));
addCheck("route-wide safety assertions retained", testSource.includes("DemoApp") && testSource.includes("raw JSON") && testSource.includes("Bearer") && testSource.includes("private-project") && testSource.includes("dispatch agent now"));
addCheck("route-wide OS/project separation retained", testSource.includes("OS Roadmap") && testSource.includes("project milestones") && testSource.includes("Projects"));
addCheck("P136.4 checker accepts P136.5 handoff", p1364Checker.includes("p1365CurrentState") && p1364Checker.includes('status.currentPhase === "P136.5"') && p1364Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P136.5", enterpriseChecker.includes("p1365CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("contract marks P136.5 complete", p1365.status === "complete" && ((contract.currentSubphase === "P136.5" && contract.previousSubphase === "P136.4" && contract.nextSubphase === "P136.6" && p1366.status === "planned") || p1366CurrentState));
addCheck("P136.5 records expected base commit", p1365.expectedBaseCommit === "9cee6788");
addCheck("P136.5 allowed files include checker and route test", [TEST_PATH, "scripts/check-p1365-secrets-providers-tool-governance-tests-checkers.js"].every((file) => p1365.allowedFiles?.includes(file)));
addCheck("P136.5 forbids project/db/runtime/provider/tool paths", ["projects/**", "careloop/**", "generated-projects/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1365.forbiddenFiles?.includes(path)));
addCheck("P136.5 records validation commands", VALIDATION_COMMANDS.every((command) => p1365.validationCommands?.includes(command)));
addCheck("docs record P136.5", /### P136\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan) && /P136\.5 secrets\/providers\/tool governance tests\/checkers/i.test(readme) && /P136\.5 secrets\/providers\/tool governance tests\/checkers is complete/i.test(platformRoadmap) && /P136\.5 is now complete/i.test(enterpriseRoadmap));
addCheck("phase status starts or safely hands off P136.5", p1365CurrentState || p1366CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P136.5 entries have required fields", [statusById.get("P136"), statusById.get("P136.5"), roadmapById.get("P136.5")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P136.6 remains planned or safely handed off", (statusById.get("P136.6")?.status === "planned" && roadmapById.get("P136.6")?.status === "planned" && !(statusById.get("P136.6")?.checksRun || []).length) || p1366CurrentState);
addCheck("changed files stay in P136.5 allowed scope", status.currentPhase !== "P136.5" || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH), status.currentPhase === "P136.5" ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", status.currentPhase !== "P136.5" || changed.every((file) => file === TEST_PATH || !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), status.currentPhase === "P136.5" ? changed.join(", ") : `P136.5 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("primary UX data avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(readinessText));
addCheck("primary UX data avoids tokens URLs and raw dumps", !/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\/|raw JSON|raw logs|raw policy dump/i.test(readinessText));
addCheck("primary UX data avoids secret refs and provider payload internals", !/secret-ref-|providerBatchId|inputFileId|requestBody|headers|DATABASE_URL/i.test(readinessText));
addCheck("primary UX data avoids fake runnable provider/tool actions", !/call provider now|call model now|run tool now|execute tool now|start mcp now|rotate secret now|create secret now|validate secret now|spend now|deploy now|export now|package now|dispatch agent now|write db now/i.test(readinessText));
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable provider/tool actions", !/call provider now|call model now|run tool now|execute tool now|start mcp now|rotate secret now|create secret now|validate secret now|spend now|deploy now|export now|package now|dispatch agent now|write db now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /secret values are stored|provider calls are enabled|model calls are enabled|tool execution is enabled|MCP servers are enabled|network calls are enabled|provider spend is enabled|budget spending is enabled|approval writes are enabled|DB writes are enabled|runtime writes are enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P136.1-P136.4 validation into P136.5 tests/checkers evidence.",
        "- Verifies provider governance contract, model, dry run, Command Center UX, route-wide Playwright safety, docs, status, and forbidden path boundaries.",
        "- Does not enable secret value access, provider/model calls, tool execution, MCP startup, approval writes, DB/runtime writes, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Aggregated Coverage Summary",
      body: [
        `- P136.2 model rows: ${providerModel.providerEligibilityRows.length + providerModel.modelAccessRows.length + providerModel.toolContractRows.length}`,
        `- P136.3 dry-run decision rows: ${dryRun.decisionRowCount}`,
        `- Executable rows: ${dryRun.executableDecisionRowCount}`,
        `- Estimated spend: $${dryRun.budgetImpact.estimatedUsd}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P136.5 is tests/checkers hardening only. It does not create secret stores, provider adapters, model clients, tool executors, MCP servers, approval writers, budget ledgers, DB/runtime writes, provider/model calls, tool execution, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend paths.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P136.5 Secrets Providers Tool Governance Tests Checkers Report", phase: "P136.5" },
);

printCheckReport("P136.5 Secrets Providers Tool Governance Tests Checkers Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
