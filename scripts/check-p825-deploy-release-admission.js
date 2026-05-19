import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildDeployReleaseAdmissionGate,
  validateDeployReleaseAdmissionGate,
} from "../live-ready/deployReleaseAdmission.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p825-deploy-release-admission-report.md";

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

const envelope = buildDeployReleaseAdmissionGate({ mode: "live" });
const validation = validateDeployReleaseAdmissionGate(envelope);
const serialized = JSON.stringify(envelope);
const rows = envelope.data?.admissionRows || [];
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const moduleSource = readText("live-ready/deployReleaseAdmission.js");
const docs = readText("docs/architecture/P82_LIVE_READY_ACTIVATION_PLAN.md");
const contract = readText("contracts/os-roadmap/p82-execution-contracts.json");

const dangerousFlags = [
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportAllowed",
  "packageCreationAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "providerCallsAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "providerSpendAllowed",
];

addCheck("gate envelope passes", envelope.ok === true && envelope.status === "PASS");
addCheck("deploy release admission validation passes", validation.valid, validation.errors.join("; "));
addCheck("deploy/release and export/package rows represented", rows.some((row) => row.admissionId === "deploy-release") && rows.some((row) => row.admissionId === "export-package"));
addCheck("primary UX fields are present", ["currentState", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"].every((field) => serialized.includes(field)));
addCheck("deploy readiness gate reused", serialized.includes('"deployExecutionAllowed":false') && serialized.includes('"releaseExecutionAllowed":false'));
addCheck("shipping readiness gate reused", serialized.includes('"exportAllowed":false') && serialized.includes('"packageCreationAllowed":false'));
addCheck("dangerous flags explicitly false", dangerousFlags.every((flag) => serialized.includes(`"${flag}":false`)));
addCheck("no provider/tool/project source imports", !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/"));
addCheck("no fake runnable shipping actions", !/deploy now|release now|export now|package now|ship now|execute now/i.test(serialized));
addCheck("no DemoApp or raw private IDs", !serialized.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p825-deploy-release-admission"]));
addCheck("contract references P82.5 files", contract.includes("live-ready/deployReleaseAdmission.js") && contract.includes("check:p825-deploy-release-admission"));
addCheck("docs mention P82.5 validation", docs.includes("P82.5 Deploy / Release Admission") && docs.includes("npm run check:p825-deploy-release-admission"));
addCheck("phase status advanced", statusById.get("P82.5")?.status === "complete" && status.currentPhase === "P82.5" && status.nextPhase === "P82.6");
addCheck("report path is distinct", REPORT_PATH.endsWith("p825-deploy-release-admission-report.md"));
addCheck("report prerequisites exist", fileExists("reports/p824-project-db-admission-report.md") && fileExists("reports/p694-report.md") && fileExists("reports/p714-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P82.5 deploy, release, export, and package admission gates.",
        "- Reuses existing deploy readiness and shipping readiness helpers.",
        "- Does not deploy, release, export, package, create artifacts, mutate project files, write DB state, call providers/tools, start workers, call networks, mutate auth/session/user/workspace state, or spend provider budget.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p825-deploy-release-admission",
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
        "- P82.5 creates local admission gates only.",
        "- Deploy, release, export, package creation, project mutation, DB writes, network calls, provider/tool/worker execution, and provider spend remain disabled.",
        "- Command Center label cleanup is planned for P82.6.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P82.5 Deploy Release Admission Report", phase: "P82.5" },
);

printCheckReport("P82.5 Deploy Release Admission Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
