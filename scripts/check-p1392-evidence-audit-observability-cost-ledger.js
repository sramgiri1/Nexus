import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PHASE,
  EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_SAFETY_FLAG_NAMES,
  EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_VERSION,
  buildEvidenceAuditObservabilityCostLedgerEnvelope,
  buildEvidenceAuditObservabilityCostLedgerModel,
  buildEvidenceAuditObservabilityCostLedgerRecord,
  validateEvidenceAuditObservabilityCostLedgerModel,
  validateEvidenceAuditObservabilityCostLedgerRecord,
} from "../shared/evidenceAuditObservabilityCostLedgerModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1392-evidence-audit-observability-cost-ledger-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p139-evidence-audit-observability-cost-ledger-contracts.json";
const PLAN_PATH = "docs/architecture/P139_EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PLAN.md";
const REQUIRED_SCRIPT = "check:p1392-evidence-audit-observability-cost-ledger";
const EXPECTED_BASE_COMMIT = "28dc465a";
const EXPECTED_EXPORTS = [
  "EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PHASE",
  "EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_VERSION",
  "EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_SAFETY_FLAG_NAMES",
  "buildEvidenceAuditObservabilityCostLedgerRecord",
  "validateEvidenceAuditObservabilityCostLedgerRecord",
  "buildEvidenceAuditObservabilityCostLedgerModel",
  "validateEvidenceAuditObservabilityCostLedgerModel",
  "buildEvidenceAuditObservabilityCostLedgerEnvelope",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1392-evidence-audit-observability-cost-ledger",
  "npm run check:p1391-evidence-audit-observability-cost-ledger",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|audit|observability|cost|redacted|validation-only|closure|zero-spend)\b/i.test(context);
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
const p1392 = subphaseById.get("P139.2") || {};
const p1393 = subphaseById.get("P139.3") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const checkerSource = readText("scripts/check-p1392-evidence-audit-observability-cost-ledger.js");
const modelSource = readText("shared/evidenceAuditObservabilityCostLedgerModel.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P139.2";
const allowedFiles = new Set(p1392.allowedFiles || []);
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
const model = buildEvidenceAuditObservabilityCostLedgerModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
  createdAt: "2026-05-30T00:00:00.000Z",
});
const record = buildEvidenceAuditObservabilityCostLedgerRecord({
  createdAt: "2026-05-30T00:00:00.000Z",
});
const modelValidation = validateEvidenceAuditObservabilityCostLedgerModel(model);
const recordValidation = validateEvidenceAuditObservabilityCostLedgerRecord(record);
const envelope = buildEvidenceAuditObservabilityCostLedgerEnvelope({ model });
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const p1392CurrentState =
  status.currentPhase === "P139.2"
  && status.previousPhase === "P139.1"
  && status.nextPhase === "P139.3"
  && roadmap.currentPhase === "P139.2"
  && roadmap.previousPhase === "P139.1"
  && roadmap.nextPhase === "P139.3"
  && status.current?.phaseId === "P139.2"
  && status.previous?.phaseId === "P139.1"
  && status.next?.phaseId === "P139.3"
  && roadmap.current?.phaseId === "P139.2"
  && roadmap.previous?.phaseId === "P139.1"
  && roadmap.next?.phaseId === "P139.3"
  && statusById.get("P138")?.status === "complete"
  && roadmapById.get("P138")?.status === "complete"
  && statusById.get("P139")?.status === "in_progress"
  && roadmapById.get("P139")?.status === "in_progress"
  && statusById.get("P139.1")?.status === "complete"
  && roadmapById.get("P139.1")?.status === "complete"
  && statusById.get("P139.2")?.status === "complete"
  && roadmapById.get("P139.2")?.status === "complete"
  && statusById.get("P139.3")?.status === "planned"
  && roadmapById.get("P139.3")?.status === "planned";
const p1393CurrentState =
  status.currentPhase === "P139.3"
  && status.previousPhase === "P139.2"
  && status.nextPhase === "P139.4"
  && roadmap.currentPhase === "P139.3"
  && roadmap.previousPhase === "P139.2"
  && roadmap.nextPhase === "P139.4"
  && status.current?.phaseId === "P139.3"
  && status.previous?.phaseId === "P139.2"
  && status.next?.phaseId === "P139.4"
  && roadmap.current?.phaseId === "P139.3"
  && roadmap.previous?.phaseId === "P139.2"
  && roadmap.next?.phaseId === "P139.4"
  && statusById.get("P139")?.status === "in_progress"
  && roadmapById.get("P139")?.status === "in_progress"
  && ["P139.1", "P139.2", "P139.3"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P139.4")?.status === "planned"
  && roadmapById.get("P139.4")?.status === "planned";
const p1396CurrentState =
  status.currentPhase === "P139.6"
  && status.previousPhase === "P139.5"
  && status.nextPhase === "P139.7"
  && roadmap.currentPhase === "P139.6"
  && roadmap.previousPhase === "P139.5"
  && roadmap.nextPhase === "P139.7"
  && status.current?.phaseId === "P139.6"
  && status.previous?.phaseId === "P139.5"
  && status.next?.phaseId === "P139.7"
  && roadmap.current?.phaseId === "P139.6"
  && roadmap.previous?.phaseId === "P139.5"
  && roadmap.next?.phaseId === "P139.7"
  && statusById.get("P139")?.status === "in_progress"
  && roadmapById.get("P139")?.status === "in_progress"
  && ["P139.1", "P139.2", "P139.3", "P139.4", "P139.5", "P139.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P139.7")?.status === "planned"
  && roadmapById.get("P139.7")?.status === "planned";
const p1392OrLaterState = p1392CurrentState || p1393CurrentState || p1396CurrentState;

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1392-evidence-audit-observability-cost-ledger.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("model exports expected API", EXPECTED_EXPORTS.every((entry) => modelSource.includes(`export const ${entry}`) || modelSource.includes(`export function ${entry}`)));
addCheck("model reuses existing schemas", [
  "../cost-center/costLedgerSchema.js",
  "../observability/activitySchema.js",
  "../runtime/evidenceRecord.js",
  "./modeGuard.js",
  "./redaction.js",
  "./resultEnvelope.js",
].every((target) => modelSource.includes(target)));
addCheck("model does not include writers or execution hooks", !/\b(writeFileSync|appendFileSync|mkdirSync|rmSync|execFileSync|spawn|fetch|XMLHttpRequest|sqlite|postgres|mongodb)\b/.test(modelSource));
addCheck("model constants are correct", EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PHASE === "P139.2" && EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_VERSION === "1.0");
addCheck("record validator passes", recordValidation.valid, recordValidation.errors.join("; "));
addCheck("ledger model validator passes", modelValidation.valid, modelValidation.errors.join("; "));
addCheck("result envelope passes", envelope.ok === true && envelope.status === "PASS" && envelope.phase === "P139.2");
addCheck("ledger model has useful trace records", model.ledgerRecords.length >= 3 && model.ledgerSummary.recordCount === model.ledgerRecords.length && model.evidenceRefs.length > 0 && model.auditRefs.length > 0 && model.activityRefs.length > 0 && model.observabilityRefs.length > 0);
addCheck("all authority flags remain blocked", EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_SAFETY_FLAG_NAMES.every((flag) => model[flag] === false && model.safetyFlags?.[flag] === false));
addCheck("cost model remains zero-spend", model.costSummary.estimatedUsd === 0 && model.costSummary.actualUsd === 0 && model.providerSpendAllowed === false);
addCheck("contract advances P139.2 safely", contract.phaseId === "P139" && contract.status === "in_progress" && ["P139.2", "P139.3", "P139.6"].includes(contract.currentSubphase) && ["P139.1", "P139.2", "P139.5"].includes(contract.previousSubphase) && ["P139.3", "P139.4", "P139.7"].includes(contract.nextSubphase));
addCheck("contract records expected base commit", contract.expectedBaseCommit === "afe98694" && p1392.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("P139.2 complete and P139.3 handoff known", p1392.status === "complete" && ["planned", "complete"].includes(p1393.status) && p1392.nextPhase === "P139.3");
addCheck("contract records expected exports", EXPECTED_EXPORTS.every((entry) => p1392.expectedExports?.includes(entry)));
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1392.validationCommands?.includes(command)));
addCheck("contract scope stays model-only", /read-only ledger model/i.test(p1392.dataShape || "") && p1392.forbiddenFiles?.includes("dashboard/src/**") && p1392.forbiddenFiles?.includes("db/**") && p1392.forbiddenFiles?.includes("projects/**"));
addCheck("P139.1 report passes", reportPassed("reports/p1391-evidence-audit-observability-cost-ledger-report.md"));
addCheck("enterprise checker accepts P139.2", enterpriseChecker.includes("p1392CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("P139 plan records P139.2", /## P139\.2 Ledger Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P139.2", /P139\.2 evidence, audit, observability, and cost ledger model/i.test(readme));
addCheck("platform roadmap records P139.2", /P139\.2 evidence, audit, observability, and cost ledger model is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P139.2", /P139\.2 is now complete/i.test(enterpriseRoadmap) && (/P139\.3 is the next executable subphase/i.test(enterpriseRoadmap) || /P139\.3 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status keeps P139.2 complete", p1392OrLaterState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P139.2 entries have required fields", [statusById.get("P139"), statusById.get("P139.2"), roadmapById.get("P139"), roadmapById.get("P139.2")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P139.3 handoff remains valid", (p1392CurrentState && statusById.get("P139.3")?.status === "planned" && roadmapById.get("P139.3")?.status === "planned" && !(statusById.get("P139.3")?.checksRun || []).length) || p1393CurrentState || p1396CurrentState);
addCheck("changed files stay in P139.2 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P139.2 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("route-wide safety coverage retained", ["Command Center route-wide UX", "DemoApp", "raw JSON", "private-project", "dispatch agent now", "Use system theme", "Use dark theme", "Use light theme"].every((text) => routeTests.includes(text)));
addCheck("model and docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|ledger)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(`${JSON.stringify(model)}\n${docsBundle}`));
addCheck("docs avoid fake runnable actions", !/write ledger now|persist ledger now|write audit now|write evidence now|write cost now|call provider now|dispatch agent now|mutate project now|apply patch now|run build now|run tests now|deploy now|release now|export now|package now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /\b(ledger writes are enabled|audit writes are enabled|evidence writes are enabled|observability writes are enabled|cost writes are enabled|DB writes are enabled|runtime writes are enabled|CRUD is live|provider calls are enabled|model calls are enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled|spend is enabled)\b/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /\b(raw JSON|raw logs?|raw policy dumps?|raw ledger payloads?|raw registry dumps?)\b/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Adds a read-only evidence, audit, observability, and cost ledger model.",
        "- Reuses existing evidence record, activity event, cost ledger, mode guard, redaction, and result envelope helpers.",
        "- Does not write ledger records, DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Model Exports",
      body: EXPECTED_EXPORTS.map((entry) => `- ${entry}`).join("\n"),
    },
    {
      title: "Ledger Summary",
      body: [
        `- Records: ${model.ledgerSummary.recordCount}`,
        `- Evidence refs: ${model.ledgerSummary.evidenceRefCount}`,
        `- Audit refs: ${model.ledgerSummary.auditRefCount}`,
        `- Activity refs: ${model.ledgerSummary.activityRefCount}`,
        `- Observability refs: ${model.ledgerSummary.observabilityRefCount}`,
        `- Estimated spend: ${model.costSummary.estimatedUsd}`,
        `- Actual spend: ${model.costSummary.actualUsd}`,
      ].join("\n"),
    },
    {
      title: "Phase Status",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        p1396CurrentState ? "- P139.6 has advanced from the P139.2 handoff chain." : p1393CurrentState ? "- P139.3 has advanced from the P139.2 handoff." : "- P139.3 remains planned-only.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: p1393CurrentState || p1396CurrentState
        ? "- P139.2 is model-only. It does not enable live ledger persistence, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. Later P139 subphases have advanced through separate guarded work."
        : "- P139.2 is model-only. It does not enable live ledger persistence, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. P139.3 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P139.2 Evidence Audit Observability Cost Ledger Report", phase: "P139.2" },
);

printCheckReport("P139.2 Evidence Audit Observability Cost Ledger Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
