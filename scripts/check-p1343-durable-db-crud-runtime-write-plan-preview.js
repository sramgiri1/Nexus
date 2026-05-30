import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_FLAGS,
  DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_PHASE,
  DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_STEP_NAMES,
  DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_VERSION,
  buildDurableDbCrudRuntimeWritePlanPreview,
  validateDurableDbCrudRuntimeWritePlanPreview,
} from "../shared/durableDbCrudRuntimeWritePlanPreview.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1343-durable-db-crud-runtime-write-plan-preview-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p134-durable-db-crud-runtime-contracts.json";
const PLAN_PATH = "docs/architecture/P134_DURABLE_DB_CRUD_RUNTIME_PLAN.md";
const PREVIEW_PATH = "shared/durableDbCrudRuntimeWritePlanPreview.js";
const REQUIRED_SCRIPT = "check:p1343-durable-db-crud-runtime-write-plan-preview";
const VALIDATION_COMMANDS = [
  "npm run check:p1343-durable-db-crud-runtime-write-plan-preview",
  "npm run check:p1342-durable-db-crud-runtime-schema-model",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|local-only|model-only|preview|dry run|cannot|later subphase|before|until|non-executable)\b/i.test(context);
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
const p1343 = subphaseById.get("P134.3") || {};
const p1344 = subphaseById.get("P134.4") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1342Checker = readText("scripts/check-p1342-durable-db-crud-runtime-schema-model.js");
const checkerSource = readText("scripts/check-p1343-durable-db-crud-runtime-write-plan-preview.js");
const previewSource = readText(PREVIEW_PATH);
const preview = buildDurableDbCrudRuntimeWritePlanPreview();
const previewValidation = validateDurableDbCrudRuntimeWritePlanPreview(preview);
const serializedPreview = JSON.stringify(preview);
const changed = changedFiles();
const allowedFiles = new Set(p1343.allowedFiles || []);
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
const p1343CurrentState =
  status.currentPhase === "P134.3"
  && status.previousPhase === "P134.2"
  && status.nextPhase === "P134.4"
  && roadmap.currentPhase === "P134.3"
  && roadmap.previousPhase === "P134.2"
  && roadmap.nextPhase === "P134.4"
  && status.current?.phaseId === "P134.3"
  && status.previous?.phaseId === "P134.2"
  && status.next?.phaseId === "P134.4"
  && roadmap.current?.phaseId === "P134.3"
  && roadmap.previous?.phaseId === "P134.2"
  && roadmap.next?.phaseId === "P134.4"
  && statusById.get("P134")?.status === "in_progress"
  && roadmapById.get("P134")?.status === "in_progress"
  && ["P134.1", "P134.2", "P134.3"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P134.4")?.status === "planned"
  && roadmapById.get("P134.4")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("contract marks P134.3 complete", contract.status === "in_progress" && contract.currentSubphase === "P134.3" && contract.previousSubphase === "P134.2" && contract.nextSubphase === "P134.4" && p1343.status === "complete");
addCheck("P134.3 records expected base commit", p1343.expectedBaseCommit === "17de74c6");
addCheck("P134.4 remains planned-only", p1344.status === "planned" && p1344.allowedFiles?.length === 0);
addCheck("P134.3 allowed files include preview and checker", p1343.allowedFiles?.includes(PREVIEW_PATH) && p1343.allowedFiles?.includes("scripts/check-p1343-durable-db-crud-runtime-write-plan-preview.js"));
addCheck("P134.3 forbids project/dashboard/db/runtime paths", ["projects/**", "careloop/**", "generated-projects/**", "dashboard/src/**", "dashboard/tests/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1343.forbiddenFiles?.includes(path)));
addCheck("P134.3 records validation commands", VALIDATION_COMMANDS.every((command) => p1343.validationCommands?.includes(command)));
addCheck("P134.3 exports expected symbols", [
  "DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_PHASE",
  "DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_VERSION",
  "DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_STEP_NAMES",
  "DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_FLAGS",
  "buildDurableDbCrudRuntimeWritePlanPreview",
  "validateDurableDbCrudRuntimeWritePlanPreview",
].every((exportName) => previewSource.includes(`export const ${exportName}`) || previewSource.includes(`export function ${exportName}`)));
addCheck("P134.3 reuses P134.2 schema model", previewSource.includes("./durableDbCrudRuntimeSchemaModel.js") && previewSource.includes("buildDurableDbCrudRuntimeSchemaModel") && previewSource.includes("validateDurableDbCrudRuntimeSchemaModel"));
addCheck("P134.3 avoids direct DB/runtime/file execution helpers", !previewSource.includes("../db/") && !previewSource.includes("writeFileSync") && !previewSource.includes("execFileSync") && !previewSource.includes("fetch("));
addCheck("write-plan constants are correct", DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_PHASE === "P134.3" && DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_VERSION === "1.0");
addCheck("write-plan preview validates", previewValidation.valid, previewValidation.errors.join("; "));
addCheck("write-plan preview remains local, dry-run, and hidden", preview.previewOnly === true && preview.writePlanPreviewOnly === true && preview.dryRunOnly === true && preview.localOnly === true && preview.commandCenterVisible === false);
addCheck("write-plan preview uses P134.2 source model", preview.sourceSchemaModelPhase === "P134.2" && preview.sourceSchemaModelVersion === "1.0" && preview.sourceSchemaModelValidation === "valid");
addCheck("write-plan steps are complete", DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_STEP_NAMES.length === 8 && preview.writePlanStepCount === 8 && preview.writePlanSteps?.length === 8);
addCheck("write-plan rows are complete", preview.entityGroupWritePlanRowCount === 9 && preview.repositoryWritePlanRowCount === 6 && preview.blockedWritePlanRowCount === 23);
addCheck("write-plan flags remain false", Object.values(DURABLE_DB_CRUD_RUNTIME_WRITE_PLAN_PREVIEW_FLAGS).filter((value) => typeof value === "boolean").every((value) => value === false));
addCheck("write-plan row authority remains blocked", [
  ...(preview.writePlanSteps || []),
  ...(preview.entityGroupWritePlanRows || []),
  ...(preview.repositoryWritePlanRows || []),
].every((row) => row.currentState === "blocked" && Object.values(row).filter((value) => typeof value === "boolean").every((value) => value === false) && Object.values(row.authorityFlags || {}).filter((value) => typeof value === "boolean").every((value) => value === false)));
addCheck("unsafe candidate counts remain zero", [
  "executableWritePlanRowCount",
  "schemaCreationCandidateCount",
  "migrationCandidateCount",
  "dbReadableCandidateCount",
  "dbWritableCandidateCount",
  "crudExecutableCandidateCount",
  "runtimeWritableCandidateCount",
  "approvalCaptureCandidateCount",
  "decisionPersistenceCandidateCount",
  "rawSqlCandidateCount",
  "providerCallCandidateCount",
  "agentDispatchCandidateCount",
  "projectMutationCandidateCount",
  "hostedDbMutationCandidateCount",
  "deployCandidateCount",
  "releaseCandidateCount",
  "exportCandidateCount",
  "packageCandidateCount",
  "networkCandidateCount",
  "providerSpendCandidateCount",
].every((key) => preview[key] === 0));
addCheck("preview avoids raw table names", !/founder_sessions|business_build_sessions|founder_agent_work_orders|founder_runtime_execution/i.test(serializedPreview));
addCheck("P134.2 report passes", reportPassed("reports/p1342-durable-db-crud-runtime-schema-model-report.md"));
addCheck("P134.2 checker accepts P134.3 handoff", p1342Checker.includes("p1343StartedState") && p1342Checker.includes('status.currentPhase === "P134.3"') && p1342Checker.includes('status.nextPhase === "P134.4"'));
addCheck("enterprise checker accepts P134.3", enterpriseChecker.includes("p1343CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("plan records P134.3 implementation", /## P134\.3 DB Write Plan Preview[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P134.3", /P134\.3 durable DB\/CRUD write-plan preview/i.test(readme));
addCheck("platform roadmap records P134.3", /P134\.3 durable DB\/CRUD write-plan preview/i.test(platformRoadmap) && /P134\.4 DB Runtime Command Center UX is planned-only next/i.test(platformRoadmap));
addCheck("enterprise roadmap records P134.3", /P134\.3 is now complete/i.test(enterpriseRoadmap) && /P134\.4 is the next executable subphase/i.test(enterpriseRoadmap));
addCheck("phase status advanced", p1343CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P134.3 entries have required fields", [statusById.get("P134"), statusById.get("P134.3"), roadmapById.get("P134.3")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("changed files stay in P134.3 allowed scope", changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH), changed.join(", "));
addCheck("forbidden paths unchanged", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
addCheck("preview avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedPreview));
addCheck("preview avoids fake runnable actions", !/run migration now|create table now|execute sql now|write db now|save record now|persist record now|update record now|delete record now|enable crud now|dispatch agent now|mutate project now|deploy now|spend now/i.test(serializedPreview));
const readmeP134Slice = readme.match(/P134\.1 durable DB\/CRUD contract[\s\S]*?(?:P135|$)/)?.[0] || readme;
const platformP134Slice = platformRoadmap.match(/P134\.1 durable DB\/CRUD contract[\s\S]*?(?:P135|Implementation follows|$)/)?.[0] || platformRoadmap;
const enterpriseP134Slice = enterpriseRoadmap.match(/P134\.1 is now complete[\s\S]*?(?:P135|Implementation follows|$)/)?.[0] || enterpriseRoadmap;
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readmeP134Slice}\n${platformP134Slice}\n${enterpriseP134Slice}`;
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable DB actions", !/run migration now|create table now|execute sql now|write db now|save record now|persist record now|update record now|delete record now|enable crud now|connect hosted db now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /DB reads are enabled|DB writes are enabled|runtime writes are enabled|CRUD is live|schema is created|migration is enabled|repository writes are enabled|raw SQL is enabled|hosted DB is connected|agent dispatch is enabled|project mutation is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P134.3 durable DB/CRUD write-plan preview.",
        "- Confirms P134.3 reuses the P134.2 schema model and converts it into display-safe, blocked write-readiness rows.",
        "- Confirms DB reads, DB writes, CRUD execution, migrations, raw SQL, runtime writes, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network, and spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1343.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P134.3 is a write-plan preview only. It does not create DB schemas, run migrations, read or write DB/runtime records, execute CRUD, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P134.3 Durable DB CRUD Runtime Write Plan Preview Report", phase: "P134.3" },
);

printCheckReport("P134.3 Durable DB CRUD Runtime Write Plan Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
