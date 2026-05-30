import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  PROVIDER_GOVERNANCE_FLAG_NAMES,
  PROVIDER_GOVERNANCE_MODEL_PHASE,
  PROVIDER_GOVERNANCE_MODEL_VERSION,
  buildProviderGovernanceModel,
  buildProviderGovernanceModelEnvelope,
  validateProviderGovernanceModel,
} from "../shared/providerGovernanceModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1362-secret-provider-model-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p136-secrets-providers-tool-governance-contracts.json";
const PLAN_PATH = "docs/architecture/P136_SECRETS_PROVIDERS_TOOL_GOVERNANCE_PLAN.md";
const REQUIRED_SCRIPT = "check:p1362-secret-provider-model";
const VALIDATION_COMMANDS = [
  "npm run check:p1362-secret-provider-model",
  "npm run check:p1361-secrets-providers-tool-governance",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];
const EXPECTED_EXPORTS = [
  "PROVIDER_GOVERNANCE_MODEL_PHASE",
  "PROVIDER_GOVERNANCE_MODEL_VERSION",
  "PROVIDER_GOVERNANCE_FLAG_NAMES",
  "buildProviderGovernanceModel",
  "validateProviderGovernanceModel",
  "buildProviderGovernanceModelEnvelope",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|read-only|checker|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|model)\b/i.test(context);
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
const p1362 = subphaseById.get("P136.2") || {};
const p1363 = subphaseById.get("P136.3") || {};
const p1364 = subphaseById.get("P136.4") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1361Checker = readText("scripts/check-p1361-secrets-providers-tool-governance.js");
const checkerSource = readText("scripts/check-p1362-secret-provider-model.js");
const modelSource = readText("shared/providerGovernanceModel.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P136.2";
const model = buildProviderGovernanceModel();
const modelValidation = validateProviderGovernanceModel(model);
const envelope = buildProviderGovernanceModelEnvelope();
const allowedFiles = new Set([
  "shared/providerGovernanceModel.js",
  CONTRACT_PATH,
  PLAN_PATH,
  "README.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md",
  "os-roadmap/nexus-phases.json",
  "os-roadmap/phase-status.json",
  "package.json",
  "scripts/check-p1362-secret-provider-model.js",
  "scripts/check-p1361-secrets-providers-tool-governance.js",
  "scripts/check-enterprise-readiness-roadmap.js",
  REPORT_PATH,
  "reports/p1361-secrets-providers-tool-governance-report.md",
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
const p1362CurrentState =
  status.currentPhase === "P136.2"
  && status.previousPhase === "P136.1"
  && status.nextPhase === "P136.3"
  && roadmap.currentPhase === "P136.2"
  && roadmap.previousPhase === "P136.1"
  && roadmap.nextPhase === "P136.3"
  && status.current?.phaseId === "P136.2"
  && status.previous?.phaseId === "P136.1"
  && status.next?.phaseId === "P136.3"
  && roadmap.current?.phaseId === "P136.2"
  && roadmap.previous?.phaseId === "P136.1"
  && roadmap.next?.phaseId === "P136.3"
  && statusById.get("P136")?.status === "in_progress"
  && roadmapById.get("P136")?.status === "in_progress"
  && statusById.get("P136.1")?.status === "complete"
  && roadmapById.get("P136.1")?.status === "complete"
  && statusById.get("P136.2")?.status === "complete"
  && roadmapById.get("P136.2")?.status === "complete"
  && statusById.get("P136.3")?.status === "planned"
  && roadmapById.get("P136.3")?.status === "planned";
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
addCheck("model reuses existing governance helpers", [
  "./resultEnvelope.js",
  "../secrets/providerCredentialBoundary.js",
  "../secrets/secretAccessPolicy.js",
  "../tool-governance/toolPermissionMatrix.js",
  "../cost-center/budgetModel.js",
].every((needle) => modelSource.includes(needle)));
addCheck("model avoids forbidden runtime imports", !/from\s+["'][^"']*(providers|tools|worker-runtime|db|local-state\/runtime|deploy|release|exports|packages)\//.test(modelSource));
addCheck("expected exports exist", PROVIDER_GOVERNANCE_MODEL_PHASE === "P136.2" && PROVIDER_GOVERNANCE_MODEL_VERSION === "1.0" && Array.isArray(PROVIDER_GOVERNANCE_FLAG_NAMES) && EXPECTED_EXPORTS.every((name) => modelSource.includes(`export ${name}`) || modelSource.includes(`export function ${name}`) || modelSource.includes(`export const ${name}`)));
addCheck("model validates", modelValidation.valid, modelValidation.errors.join("; "));
addCheck("result envelope validates", envelope.ok === true && envelope.status === "PASS" && envelope.phase === "P136.2" && envelope.data?.phase === "P136.2", (envelope.errors || []).join("; "));
addCheck("all authority flags blocked", PROVIDER_GOVERNANCE_FLAG_NAMES.every((flag) => model.safetyFlags?.[flag] === false));
addCheck("model includes required rows", model.providerEligibilityRows.length > 0 && model.modelAccessRows.length > 0 && model.toolContractRows.length > 0 && model.budgetPolicyRows.length > 0 && model.approvalGateRows.length > 0);
addCheck("model hides secret references and values", !/secret-ref-|sk-[A-Za-z0-9]|Bearer\s+|DATABASE_URL/i.test(JSON.stringify(model)));
addCheck("model has visible operator fields", Boolean(model.ownerCapability) && Boolean(model.nextAction) && Boolean(model.disabledReason) && Array.isArray(model.evidenceRefs) && Array.isArray(model.activityRefs) && Boolean(model.costImpact));
addCheck(
  "contract advances P136.2",
  contract.phaseId === "P136"
    && contract.status === "in_progress"
    && p1362.status === "complete"
    && (
      (contract.currentSubphase === "P136.2" && contract.previousSubphase === "P136.1" && contract.nextSubphase === "P136.3" && p1363.status === "planned")
      || (contract.currentSubphase === "P136.3" && contract.previousSubphase === "P136.2" && contract.nextSubphase === "P136.4" && p1363.status === "complete" && p1364.status === "planned")
    ),
);
addCheck("contract records expected exports", EXPECTED_EXPORTS.every((name) => p1362.expectedExports?.includes(name)));
addCheck("P136.2 records validation commands", VALIDATION_COMMANDS.every((command) => p1362.validationCommands?.includes(command)));
addCheck("P136.1 report passes", reportPassed("reports/p1361-secrets-providers-tool-governance-report.md"));
addCheck("P136.1 checker accepts P136.2", p1361Checker.includes("p1362CurrentState") && p1361Checker.includes('status.currentPhase === "P136.2"'));
addCheck("enterprise checker accepts P136.2", enterpriseChecker.includes("p1362CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("P136 plan records P136.2", /### P136\.2 Secret and Provider Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P136.2", /P136\.2 secret\/provider model/i.test(readme));
addCheck("platform roadmap records P136.2", /P136\.2 secret\/provider model is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P136.2", /P136\.2 is now complete/i.test(enterpriseRoadmap) && (/P136\.3 is the next executable subphase/i.test(enterpriseRoadmap) || (/P136\.3 is now complete/i.test(enterpriseRoadmap) && /P136\.4 is the next executable subphase/i.test(enterpriseRoadmap))));
addCheck("phase status advances P136.2", p1362CurrentState || p1363CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P136.2 entries have required fields", [statusById.get("P136"), statusById.get("P136.2"), roadmapById.get("P136.2")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P136.3 remains planned or safely handed off", (statusById.get("P136.3")?.status === "planned" && roadmapById.get("P136.3")?.status === "planned" && !(statusById.get("P136.3")?.checksRun || []).length) || p1363CurrentState);
addCheck(
  "changed files stay in P136.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P136.2 forbidden path check relaxed for ${status.currentPhase}`,
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
        "- Adds a display-safe P136.2 provider governance model over existing secret, provider credential, tool permission, budget, approval, and result-envelope helpers.",
        "- The model returns rows for secret reference policy, provider eligibility, model access, tool contracts, budget policy, approval gates, blockers, evidence, activity, cost impact, owner, and next action.",
        "- Confirms this subphase does not create secret stores, read credential values, call providers/models, execute tools, start MCP servers, write DB/runtime state, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Model Summary", body: `- Providers: ${model.providerEligibilityRows.length}\n- Tool contract rows: ${model.toolContractRows.length}\n- Budget rows: ${model.budgetPolicyRows.length}\n- Approval rows: ${model.approvalGateRows.length}` },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P136.2 is read-only model work. It does not create secret stores, provider adapters, model clients, tool executors, MCP servers, budget ledgers, approval writers, DB/runtime writes, dashboard source, Playwright source, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. Later P136 subphases remain governed by their own implementation-grade contracts.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P136.2 Secret Provider Model Report", phase: "P136.2" },
);

printCheckReport("P136.2 Secret Provider Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
