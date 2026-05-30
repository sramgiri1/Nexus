import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  PROVIDER_GOVERNANCE_DRY_RUN_PHASE,
  buildProviderGovernanceDryRun,
  validateProviderGovernanceDryRun,
} from "../shared/providerGovernanceDryRun.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1363-provider-dry-run-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p136-secrets-providers-tool-governance-contracts.json";
const PLAN_PATH = "docs/architecture/P136_SECRETS_PROVIDERS_TOOL_GOVERNANCE_PLAN.md";
const REQUIRED_SCRIPT = "check:p1363-provider-dry-run";
const VALIDATION_COMMANDS = [
  "npm run check:p1363-provider-dry-run",
  "npm run check:p1362-secret-provider-model",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];
const EXPECTED_EXPORTS = [
  "PROVIDER_GOVERNANCE_DRY_RUN_PHASE",
  "buildProviderGovernanceDryRun",
  "validateProviderGovernanceDryRun",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|dry run|read-only|model|checker|report|docs?|roadmap|status|boundary|non-runnable)\b/i.test(context);
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
const p1363 = subphaseById.get("P136.3") || {};
const p1364 = subphaseById.get("P136.4") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1362Checker = readText("scripts/check-p1362-secret-provider-model.js");
const checkerSource = readText("scripts/check-p1363-provider-dry-run.js");
const dryRunSource = readText("shared/providerGovernanceDryRun.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P136.3";
const dryRun = buildProviderGovernanceDryRun();
const dryRunValidation = validateProviderGovernanceDryRun(dryRun);
const serializedDryRun = JSON.stringify(dryRun);
const allowedFiles = new Set([
  "shared/providerGovernanceDryRun.js",
  CONTRACT_PATH,
  PLAN_PATH,
  "README.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md",
  "os-roadmap/nexus-phases.json",
  "os-roadmap/phase-status.json",
  "package.json",
  "scripts/check-p1363-provider-dry-run.js",
  "scripts/check-p1362-secret-provider-model.js",
  "scripts/check-enterprise-readiness-roadmap.js",
  REPORT_PATH,
  "reports/p1362-secret-provider-model-report.md",
  "reports/enterprise-readiness-roadmap-report.md",
  "reports/os-phase-status-report.md",
  "reports/phase-validation-coverage-report.md",
]);
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
const p1363CurrentState =
  status.currentPhase === "P136.3"
  && status.previousPhase === "P136.2"
  && status.nextPhase === "P136.4"
  && roadmap.currentPhase === "P136.3"
  && roadmap.previousPhase === "P136.2"
  && roadmap.nextPhase === "P136.4"
  && status.current?.phaseId === "P136.3"
  && status.previous?.phaseId === "P136.2"
  && status.next?.phaseId === "P136.4"
  && roadmap.current?.phaseId === "P136.3"
  && roadmap.previous?.phaseId === "P136.2"
  && roadmap.next?.phaseId === "P136.4"
  && statusById.get("P136")?.status === "in_progress"
  && roadmapById.get("P136")?.status === "in_progress"
  && statusById.get("P136.1")?.status === "complete"
  && roadmapById.get("P136.1")?.status === "complete"
  && statusById.get("P136.2")?.status === "complete"
  && roadmapById.get("P136.2")?.status === "complete"
  && statusById.get("P136.3")?.status === "complete"
  && roadmapById.get("P136.3")?.status === "complete"
  && statusById.get("P136.4")?.status === "planned"
  && roadmapById.get("P136.4")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("dry run reuses P136.2 governance model", dryRunSource.includes("./providerGovernanceModel.js") && dryRunSource.includes("buildProviderGovernanceModel") && dryRunSource.includes("validateProviderGovernanceModel"));
addCheck("dry run avoids forbidden runtime imports", !/from\s+["'][^"']*(providers|tools|worker-runtime|db|local-state\/runtime|deploy|release|exports|packages)\//.test(dryRunSource));
addCheck("expected exports exist", PROVIDER_GOVERNANCE_DRY_RUN_PHASE === "P136.3" && EXPECTED_EXPORTS.every((name) => dryRunSource.includes(`export ${name}`) || dryRunSource.includes(`export function ${name}`) || dryRunSource.includes(`export const ${name}`)));
addCheck("dry run validates", dryRunValidation.valid, dryRunValidation.errors.join("; "));
addCheck("dry run is non-runnable", dryRun.dryRunOnly === true && dryRun.nonRunnable === true && dryRun.localOnly === true && dryRun.executableCommand === null && dryRun.providerPayload === null && dryRun.toolPayload === null);
addCheck("eligibility remains blocked", dryRun.eligibilityDecision?.status === "blocked" && dryRun.eligibilityDecision.providerEligible === false && dryRun.eligibilityDecision.modelEligible === false && dryRun.eligibilityDecision.toolEligible === false);
addCheck("decision rows explain blocked provider/tool state", dryRun.decisionRows.length > 0 && dryRun.decisionRows.every((row) => row.currentState === "blocked" && row.executableCandidateCount === 0 && row.providerCallsAllowed === false && row.modelCallsAllowed === false && row.toolExecutionAllowed === false));
addCheck("approval needs and budget impact remain blocked", dryRun.approvalNeeds.length > 0 && dryRun.approvalNeeds.every((row) => row.approvalWritesAllowed === false) && dryRun.budgetImpact.estimatedUsd === 0 && dryRun.budgetImpact.spendAllowed === false);
addCheck("all authority flags and candidates blocked", Object.values(dryRun.safetyFlags).filter((value) => typeof value === "boolean").every((value) => value === false) && Object.values(dryRun.candidateCounts).every((value) => value === 0));
addCheck("dry run hides secret references and provider payloads", !/secret-ref-|sk-[A-Za-z0-9]|Bearer\s+|DATABASE_URL|providerBatchId|inputFileId|requestBody|headers/i.test(serializedDryRun));
addCheck("dry run has visible operator fields", Boolean(dryRun.ownerCapability) && Boolean(dryRun.nextAction) && Boolean(dryRun.disabledReason) && Array.isArray(dryRun.evidenceRefs) && Array.isArray(dryRun.auditRefs) && Boolean(dryRun.costImpact));
addCheck("contract advances P136.3", contract.phaseId === "P136" && contract.status === "in_progress" && contract.currentSubphase === "P136.3" && contract.previousSubphase === "P136.2" && contract.nextSubphase === "P136.4" && p1363.status === "complete" && p1364.status === "planned");
addCheck("contract records expected exports", EXPECTED_EXPORTS.every((name) => p1363.expectedExports?.includes(name)));
addCheck("P136.3 records validation commands", VALIDATION_COMMANDS.every((command) => p1363.validationCommands?.includes(command)));
addCheck("P136.2 report passes", reportPassed("reports/p1362-secret-provider-model-report.md"));
addCheck("P136.2 checker accepts P136.3", p1362Checker.includes("p1363CurrentState") && p1362Checker.includes('status.currentPhase === "P136.3"'));
addCheck("enterprise checker accepts P136.3", enterpriseChecker.includes("p1363CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("P136 plan records P136.3", /### P136\.3 Provider Dry Run[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P136.3", /P136\.3 provider dry run/i.test(readme));
addCheck("platform roadmap records P136.3", /P136\.3 provider dry run is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P136.3", /P136\.3 is now complete/i.test(enterpriseRoadmap) && /P136\.4 is the next executable subphase/i.test(enterpriseRoadmap));
addCheck("phase status advances P136.3", p1363CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P136.3 entries have required fields", [statusById.get("P136"), statusById.get("P136.3"), roadmapById.get("P136.3")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P136.4 remains planned-only", statusById.get("P136.4")?.status === "planned" && roadmapById.get("P136.4")?.status === "planned" && !(statusById.get("P136.4")?.checksRun || []).length);
addCheck(
  "changed files stay in P136.3 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P136.3 forbidden path check relaxed for ${status.currentPhase}`,
);
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
        "- Adds a non-runnable P136.3 provider governance dry run over the P136.2 model.",
        "- The dry run explains provider eligibility, model access, tool contract posture, approval needs, budget impact, blockers, evidence, audit references, owner, and next action.",
        "- Confirms this subphase does not create secret stores, prepare provider payloads, call providers/models, execute tools, start MCP servers, write DB/runtime state, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Dry Run Summary", body: `- Decision rows: ${dryRun.decisionRowCount}\n- Approval needs: ${dryRun.approvalNeedCount}\n- Executable rows: ${dryRun.executableDecisionRowCount}\n- Estimated spend: $${dryRun.budgetImpact.estimatedUsd}` },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P136.3 is non-runnable dry-run work. It does not create secret stores, provider adapters, model clients, tool executors, MCP servers, budget ledgers, approval writers, DB/runtime writes, dashboard source, Playwright source, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. P136.4 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P136.3 Provider Dry Run Report", phase: "P136.3" },
);

printCheckReport("P136.3 Provider Dry Run Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
