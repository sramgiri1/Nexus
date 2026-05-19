import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildProjectDbAdmissionGate, validateProjectDbAdmissionGate } from "../live-ready/projectDbAdmission.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p824-project-db-admission-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function fileExists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const envelope = buildProjectDbAdmissionGate({ mode: "live" });
const validation = validateProjectDbAdmissionGate(envelope);
const serialized = JSON.stringify(envelope);
const rows = envelope.data?.admissionRows || [];
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const moduleSource = readText("live-ready/projectDbAdmission.js");
const docs = readText("docs/architecture/P82_LIVE_READY_ACTIVATION_PLAN.md");
const contract = readText("contracts/os-roadmap/p82-execution-contracts.json");

const dangerousFlags = [
  "projectMutationAllowed",
  "dbWritesAllowed",
  "schemaMutationAllowed",
  "migrationsAllowed",
  "providerCallsAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "deployExecutionAllowed",
  "providerSpendAllowed",
];

addCheck("gate envelope passes", envelope.ok === true && envelope.status === "PASS");
addCheck("project DB admission validation passes", validation.valid, validation.errors.join("; "));
addCheck("project and DB rows represented", rows.some((row) => row.admissionId === "project-source-mutation") && rows.some((row) => row.admissionId === "db-write-migration"));
addCheck("primary UX fields are present", ["currentState", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"].every((field) => serialized.includes(field)));
addCheck("DB readiness gate reused", serialized.includes('"readinessDecision":"not_ready_for_execution"') && serialized.includes('"dbWritesAllowed":false'));
addCheck("mutation boundary reused", serialized.includes('"mutationAllowed":false') && serialized.includes('"requiresApproval":true'));
addCheck("dangerous flags explicitly false", dangerousFlags.every((flag) => serialized.includes(`"${flag}":false`)));
addCheck("no provider/tool/project source imports", !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/"));
addCheck("no fake runnable mutation actions", !/mutate now|write now|migrate now|apply now|execute now|deploy now/i.test(serialized));
addCheck("no DemoApp, DB URLs, or raw private IDs", !serialized.includes("DemoApp") && !/postgres(?:ql)?:\/\//i.test(serialized) && !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p824-project-db-admission"]));
addCheck("contract references P82.4 files", contract.includes("live-ready/projectDbAdmission.js") && contract.includes("check:p824-project-db-admission"));
addCheck("docs mention P82.4 validation", docs.includes("P82.4 Project / DB Mutation Admission") && docs.includes("npm run check:p824-project-db-admission"));
addCheck(
  "phase status advanced",
  statusById.get("P82.4")?.status === "complete" &&
    ["P82.4", "P82.5", "P82.6", "P82.7"].includes(status.currentPhase),
  `current=${status.currentPhase}; next=${status.nextPhase}`,
);
addCheck("report path is distinct", REPORT_PATH.endsWith("p824-project-db-admission-report.md"));
addCheck("report prerequisites exist", fileExists("reports/p823-worker-execution-gate-report.md") && fileExists("reports/p724-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P82.4 project and DB mutation admission gates.",
        "- Reuses existing DB readiness and mutation boundary helpers.",
        "- Does not mutate project files, write DB state, run migrations, mutate schema, call providers/tools, start workers, deploy, release, export, package, mutate auth/session/user/workspace state, or spend provider budget.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p824-project-db-admission",
        "- npm run check:p823-worker-execution-gate",
        "- npm run check:p822-provider-tool-gates",
        "- npm run check:p82-execution-plan",
        "- npm run check:p817-final-validation",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: [
        "- P82.4 creates local admission gates only.",
        "- Project mutation, DB writes, migrations, schema mutation, provider/tool/worker execution, deploy, and provider spend remain disabled.",
        "- Command Center label cleanup is planned for P82.6 after deploy/release admission gates exist.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P82.4 Project DB Admission Report", phase: "P82.4" },
);

printCheckReport("P82.4 Project DB Admission Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
