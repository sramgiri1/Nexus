import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p925-command-center-db-live-state-ux-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const viewModel = readText("dashboard/src/data/dbRuntimeReadiness.js");
const routeSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const tabs = readText("dashboard/src/data/commandCenterTabs.js");
const tests = readText("dashboard/tests/routes.spec.js");
const source = [viewModel, routeSource, tabs, tests].join("\n");
const uxSource = [viewModel, routeSource, tabs].join("\n");

addCheck("DB live-state view model labels local SQLite", viewModel.includes("Local SQLite ready when initialized"));
addCheck("repository read state is visible", viewModel.includes("Repository reads") && viewModel.includes("Wired"));
addCheck("governed ledger write scope is visible", viewModel.includes("Evidence, audit, and activity ledgers only"));
addCheck("general mutation remains disabled", viewModel.includes("General mutation") && viewModel.includes("Disabled"));
addCheck("owner and next action visible", viewModel.includes("NEXUS DB Runtime Governance") && viewModel.includes("Next action"));
addCheck("evidence locations visible", viewModel.includes("reports/p924-governed-sqlite-runtime-writes-report.md"));
addCheck("tab badge no longer preview-blocked", tabs.includes('badge: "Local"') && tabs.includes("Local SQLite live state"));
addCheck("overview UX shows governed writes", routeSource.includes("Governed ledgers only") && routeSource.includes("SQLite reads when live mode is initialized"));
addCheck("developer details keep hosted DB blocked", routeSource.includes("Production DB") && routeSource.includes("Not allowed") && routeSource.includes("External DB"));
addCheck("focused Playwright test added", tests.includes("DB live state route renders readiness without runnable DB actions"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p925-command-center-db-live-state-ux"]));
addCheck("no raw DB URLs", !/postgres:\/\/|postgresql:\/\/|mysql:\/\/|mongodb:\/\//i.test(source));
addCheck("no runnable DB commands exposed", !/migrate now|write now|schema now|run db|execute now|enable now/i.test(uxSource));
addCheck("no DemoApp exposure", !uxSource.includes("DemoApp"));
addCheck("no provider/tool/worker/project/deploy imports", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(source));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P92.5 Command Center DB live-state UX.",
        "- Confirms local SQLite read/write state is display-safe and operator-oriented.",
        "- Confirms no raw DB URLs, runnable DB actions, DemoApp exposure, or mutation controls are introduced.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p925-command-center-db-live-state-ux",
        "- cd dashboard && npm run build",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"DB live state\"",
        "- npm run check:p924-governed-sqlite-runtime-writes",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P92.5 is display-only UX. It does not add DB toggles, hosted DB setup, migrations, general mutation, provider calls, or deploy/package actions.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P92.5 Command Center DB Live-State UX Report", phase: "P92.5" },
);

printCheckReport("P92.5 Command Center DB Live-State UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
