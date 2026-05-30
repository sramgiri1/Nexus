import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  DURABLE_DB_CRUD_RUNTIME_ENTITY_GROUP_NAMES,
  DURABLE_DB_CRUD_RUNTIME_REPOSITORY_OPERATION_NAMES,
  DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_FLAGS,
  DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_PHASE,
  DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_VERSION,
  buildDurableDbCrudRuntimeSchemaModel,
  validateDurableDbCrudRuntimeSchemaModel,
} from "../shared/durableDbCrudRuntimeSchemaModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1342-durable-db-crud-runtime-schema-model-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p134-durable-db-crud-runtime-contracts.json";
const PLAN_PATH = "docs/architecture/P134_DURABLE_DB_CRUD_RUNTIME_PLAN.md";
const MODEL_PATH = "shared/durableDbCrudRuntimeSchemaModel.js";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|display-safe|read-only|future|local-only|model-only|schema model|repository model|preview|dry run|cannot|later subphase)\b/i.test(context);
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
const p1342 = subphaseById.get("P134.2") || {};
const p1343 = subphaseById.get("P134.3") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const p1341Checker = readText("scripts/check-p1341-durable-db-crud-runtime.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const checkerSource = readText("scripts/check-p1342-durable-db-crud-runtime-schema-model.js");
const modelSource = readText(MODEL_PATH);
const model = buildDurableDbCrudRuntimeSchemaModel();
const modelValidation = validateDurableDbCrudRuntimeSchemaModel(model);
const serializedModel = JSON.stringify(model);
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P134.2";
const allowedFiles = new Set(p1342.allowedFiles || []);
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
const requiredScript = "check:p1342-durable-db-crud-runtime-schema-model";
const validationCommands = [
  "npm run check:p1342-durable-db-crud-runtime-schema-model",
  "npm run check:p1341-durable-db-crud-runtime",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];
const p1342CurrentState =
  status.currentPhase === "P134.2"
  && status.previousPhase === "P134.1"
  && status.nextPhase === "P134.3"
  && roadmap.currentPhase === "P134.2"
  && roadmap.previousPhase === "P134.1"
  && roadmap.nextPhase === "P134.3"
  && status.current?.phaseId === "P134.2"
  && status.previous?.phaseId === "P134.1"
  && status.next?.phaseId === "P134.3"
  && roadmap.current?.phaseId === "P134.2"
  && roadmap.previous?.phaseId === "P134.1"
  && roadmap.next?.phaseId === "P134.3"
  && statusById.get("P134")?.status === "in_progress"
  && roadmapById.get("P134")?.status === "in_progress"
  && statusById.get("P134.1")?.status === "complete"
  && roadmapById.get("P134.1")?.status === "complete"
  && statusById.get("P134.2")?.status === "complete"
  && roadmapById.get("P134.2")?.status === "complete"
  && statusById.get("P134.3")?.status === "planned"
  && roadmapById.get("P134.3")?.status === "planned";
const p1343StartedState =
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
  && statusById.get("P134.1")?.status === "complete"
  && roadmapById.get("P134.1")?.status === "complete"
  && statusById.get("P134.2")?.status === "complete"
  && roadmapById.get("P134.2")?.status === "complete"
  && statusById.get("P134.3")?.status === "complete"
  && roadmapById.get("P134.3")?.status === "complete"
  && statusById.get("P134.4")?.status === "planned"
  && roadmapById.get("P134.4")?.status === "planned";
const p1347FinalState =
  status.currentPhase === "P134.7"
  && status.previousPhase === "P134.6"
  && status.nextPhase === "P135"
  && roadmap.currentPhase === "P134.7"
  && roadmap.previousPhase === "P134.6"
  && roadmap.nextPhase === "P135"
  && status.current?.phaseId === "P134.7"
  && status.previous?.phaseId === "P134.6"
  && status.next?.phaseId === "P135"
  && roadmap.current?.phaseId === "P134.7"
  && roadmap.previous?.phaseId === "P134.6"
  && roadmap.next?.phaseId === "P135"
  && statusById.get("P134")?.status === "complete"
  && roadmapById.get("P134")?.status === "complete"
  && ["P134.1", "P134.2", "P134.3", "P134.4", "P134.5", "P134.6", "P134.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P135")?.status === "planned"
  && roadmapById.get("P135")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.[requiredScript]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("contract marks P134.2 complete", (contract.status === "in_progress" || contract.status === "complete") && ((contract.currentSubphase === "P134.2" && contract.previousSubphase === "P134.1" && contract.nextSubphase === "P134.3") || (contract.currentSubphase === "P134.3" && contract.previousSubphase === "P134.2" && contract.nextSubphase === "P134.4") || (contract.currentSubphase === "P134.7" && contract.previousSubphase === "P134.6" && contract.nextSubphase === "P135")) && p1342.status === "complete");
addCheck("P134.2 records expected base commit", p1342.expectedBaseCommit === "21133d6f");
addCheck("P134.3 remains planned or complete", ["planned", "complete"].includes(p1343.status));
addCheck("P134.2 allowed files include model and checker", p1342.allowedFiles?.includes(MODEL_PATH) && p1342.allowedFiles?.includes("scripts/check-p1342-durable-db-crud-runtime-schema-model.js"));
addCheck("P134.2 forbids project/dashboard/db/runtime paths", ["projects/**", "careloop/**", "generated-projects/**", "dashboard/src/**", "dashboard/tests/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1342.forbiddenFiles?.includes(path)));
addCheck("P134.2 records validation commands", validationCommands.every((command) => p1342.validationCommands?.includes(command)));
addCheck("P134.2 exports expected symbols", [
  "DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_PHASE",
  "DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_VERSION",
  "DURABLE_DB_CRUD_RUNTIME_ENTITY_GROUP_NAMES",
  "DURABLE_DB_CRUD_RUNTIME_REPOSITORY_OPERATION_NAMES",
  "DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_FLAGS",
  "buildDurableDbCrudRuntimeSchemaModel",
  "validateDurableDbCrudRuntimeSchemaModel",
].every((exportName) => modelSource.includes(`export const ${exportName}`) || modelSource.includes(`export function ${exportName}`)));
addCheck("P134.2 reuses existing SQLite repository descriptors", modelSource.includes("../db/sqliteCrudRepository.js") && modelSource.includes("describeSqliteCrudEntity") && modelSource.includes("validateSqliteCrudRepository") && !modelSource.includes("execFileSync") && !modelSource.includes("writeFileSync"));
addCheck("schema model constants are correct", DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_PHASE === "P134.2" && DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_VERSION === "1.0");
addCheck("schema model validates", modelValidation.valid, modelValidation.errors.join("; "));
addCheck("schema model remains local and hidden", model.modelOnly === true && model.schemaModelOnly === true && model.repositoryModelOnly === true && model.localOnly === true && model.commandCenterVisible === false);
addCheck("schema model reuses current DB sources", model.sourceSchemaPath === "db/schema.json" && model.sourceSqlSchemaPath === "db/schema.sql" && model.sourceRepositoryPath === "db/sqliteCrudRepository.js" && model.sourceRepositoryValidationPhase === "P92.2");
addCheck("entity groups are complete", DURABLE_DB_CRUD_RUNTIME_ENTITY_GROUP_NAMES.length === 9 && model.entityGroupCount === 9 && model.modeledEntityCount === 29 && model.missingEntityCount === 0);
addCheck("repository operation rows are complete", DURABLE_DB_CRUD_RUNTIME_REPOSITORY_OPERATION_NAMES.length === 6 && model.repositoryOperationCount === 6 && model.blockedRepositoryOperationCount === 6 && model.executableRepositoryOperationCount === 0);
addCheck("schema model flags remain false", Object.values(DURABLE_DB_CRUD_RUNTIME_SCHEMA_MODEL_FLAGS).filter((value) => typeof value === "boolean").every((value) => value === false));
addCheck("entity group authority remains blocked", model.entityGroups?.every((group) => Object.values(group.authorityFlags || {}).filter((value) => typeof value === "boolean").every((value) => value === false) && group.entities?.every((entity) => Object.values(entity.authorityFlags || {}).filter((value) => typeof value === "boolean").every((value) => value === false))));
addCheck("repository operation authority remains blocked", model.repositoryOperationRows?.every((row) => Object.values(row).filter((value) => typeof value === "boolean").every((value) => value === false) && Object.values(row.authorityFlags || {}).filter((value) => typeof value === "boolean").every((value) => value === false)));
addCheck("unsafe candidate counts remain zero", [
  "schemaCreationCandidateCount",
  "migrationCandidateCount",
  "dbReadableCandidateCount",
  "dbWritableCandidateCount",
  "crudExecutableCandidateCount",
  "runtimeWritableCandidateCount",
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
].every((key) => model[key] === 0));
addCheck("P134.1 report passes", reportPassed("reports/p1341-durable-db-crud-runtime-report.md"));
addCheck("P134.1 checker accepts P134.2 handoff", p1341Checker.includes("p1342CurrentState") && p1341Checker.includes('status.currentPhase === "P134.2"') && p1341Checker.includes('status.nextPhase === "P134.3"'));
addCheck("enterprise checker accepts P134.2", enterpriseChecker.includes("p1342CurrentState") && enterpriseChecker.includes("check:p1342-durable-db-crud-runtime-schema-model"));
addCheck("plan records P134.2 implementation", /## P134\.2 Schema and Repository Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P134.2", /P134\.2 durable DB\/CRUD schema model/i.test(readme));
addCheck("platform roadmap records P134.2", /P134\.2 is complete/i.test(platformRoadmap) && /P134\.3\s+is next/i.test(platformRoadmap));
addCheck("enterprise roadmap records P134.2", /P134\.2 is now complete/i.test(enterpriseRoadmap) && /P134\.3 is the next executable subphase/i.test(enterpriseRoadmap));
addCheck("phase status advanced", p1342CurrentState || p1343StartedState || p1347FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P134.2 entries have required fields", [statusById.get("P134"), statusById.get("P134.2"), roadmapById.get("P134.2")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("changed files stay in P134.2 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P134.2 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedModel));
addCheck("model avoids fake runnable actions", !/run migration now|create table now|execute sql now|write db now|save record now|persist record now|update record now|delete record now|enable crud now|dispatch agent now|mutate project now|deploy now|spend now/i.test(serializedModel));
const readmeP134Slice = readme.match(/P134\.1 durable DB\/CRUD contract[\s\S]*?(?:P135|$)/)?.[0] || readme;
const platformP134Slice = platformRoadmap.match(/P134\.1 is complete[\s\S]*?(?:P135|Implementation follows|$)/)?.[0] || platformRoadmap;
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
        "- Validates the P134.2 durable DB/CRUD schema and repository model.",
        "- Confirms the model reuses existing SQLite schema/repository descriptors and exposes grouped, display-safe OS entity metadata.",
        "- Confirms schema creation, migrations, DB reads/writes, CRUD execution, runtime writes, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network, and spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1342.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P134.2 is schema/repository model metadata only. It does not create DB schemas, run migrations, read or write DB/runtime records, execute CRUD, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P134.2 Durable DB CRUD Runtime Schema Model Report", phase: "P134.2" },
);

printCheckReport("P134.2 Durable DB CRUD Runtime Schema Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
