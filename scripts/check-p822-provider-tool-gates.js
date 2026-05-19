import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildProviderToolGateProfiles,
  validateProviderToolGateProfiles,
} from "../live-ready/providerToolGateProfiles.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p822-provider-tool-gates-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function fileExists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const envelope = buildProviderToolGateProfiles({ mode: "live" });
const validation = validateProviderToolGateProfiles(envelope);
const serialized = JSON.stringify(envelope);
const profiles = envelope.data?.profiles || [];
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const moduleSource = readText("live-ready/providerToolGateProfiles.js");
const docs = readText("docs/architecture/P82_LIVE_READY_ACTIVATION_PLAN.md");
const contract = readText("contracts/os-roadmap/p82-execution-contracts.json");

const dangerousFlags = [
  "providerCallsAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "deployExecutionAllowed",
  "providerSpendAllowed",
];

addCheck("gate envelope passes", envelope.ok === true && envelope.status === "PASS");
addCheck("profile validation passes", validation.valid, validation.errors.join("; "));
addCheck("provider and tool surfaces represented", profiles.some((profile) => profile.surface === "provider") && profiles.some((profile) => profile.surface === "tool"));
addCheck("readiness labels are display safe", ["Ready", "Needs setup", "Blocked by policy"].every((label) => serialized.includes(label)));
addCheck("primary UX fields are present", ["currentState", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"].every((field) => serialized.includes(field)));
addCheck("dangerous flags explicitly false", dangerousFlags.every((flag) => serialized.includes(`"${flag}":false`)));
addCheck("no provider/tool/project imports", !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/"));
addCheck("no fake runnable actions", !/run now|execute now|call provider now|apply now|deploy now|spend now/i.test(serialized));
addCheck("no DemoApp or raw private IDs", !serialized.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p822-provider-tool-gates"]));
addCheck("contract references P82.2 files", contract.includes("live-ready/providerToolGateProfiles.js") && contract.includes("check:p822-provider-tool-gates"));
addCheck("docs mention P82.2 validation", docs.includes("P82.2 Provider / Tool Live Gates") && docs.includes("npm run check:p822-provider-tool-gates"));
addCheck(
  "phase status advanced",
  statusById.get("P82.2")?.status === "complete" &&
    ["P82.2", "P82.3", "P82.4", "P82.5", "P82.6", "P82.7", "P83", "P83.1", "P83.2", "P83.3", "P83.4", "P83.5", "P83.6", "P83.7"].includes(status.currentPhase),
  `current=${status.currentPhase}; next=${status.nextPhase}`,
);
addCheck("report path is distinct", REPORT_PATH.endsWith("p822-provider-tool-gates-report.md"));
addCheck("report prerequisites exist", fileExists("reports/os-phase-status-report.md") && fileExists("reports/p82-execution-plan-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P82.2 provider and tool live-readiness gate profiles.",
        "- Profiles classify provider/tool surfaces as Ready, Needs setup, or Blocked by policy for later Command Center UX.",
        "- Does not call providers, execute tools, start workers, mutate project files, write DB state, deploy, release, export, package, mutate auth/session/user/workspace state, or spend provider budget.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
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
        "- P82.2 creates local readiness profiles only.",
        "- Provider calls and tool execution remain disabled.",
        "- Command Center label cleanup is planned for P82.6 after worker, project/DB, and deploy/release admission gates exist.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P82.2 Provider Tool Gates Report", phase: "P82.2" },
);

printCheckReport("P82.2 Provider Tool Gates Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
