import { readFileSync } from "node:fs";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { dbRuntimeReadinessViewModel } from "../dashboard/src/data/dbRuntimeReadiness.js";

const REPORT_PATH = "reports/command-center-db-runtime-ux-report.md";
const page = readFileSync("dashboard/src/pages/CommandCenterV2.jsx", "utf8");
const tabs = readFileSync("dashboard/src/data/commandCenterTabs.js", "utf8");
const routesTest = readFileSync("dashboard/tests/routes.spec.js", "utf8");
const data = readFileSync("dashboard/src/data/dbRuntimeReadiness.js", "utf8");
const packageJson = readFileSync("package.json", "utf8");
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const serializedVm = JSON.stringify(dbRuntimeReadinessViewModel);
const combinedUiSource = `${page}\n${tabs}\n${data}`;

addCheck("DB Runtime tab registered", tabs.includes('id: "db-runtime"') && tabs.includes('label: "DB Runtime"'));
addCheck("Command Center imports readiness data", page.includes("dbRuntimeReadinessViewModel"));
addCheck("readiness summary visible", page.includes("DB Runtime Readiness") && dbRuntimeReadinessViewModel.summaryRows.length >= 6);
addCheck("required UX fields present", ["DB primary state", "Fallback state", "Migration readiness", "Next action", "Owner capability"].every((label) => serializedVm.includes(label)));
addCheck("blockers visible", dbRuntimeReadinessViewModel.blockers.length >= 5 && page.includes("Blockers"));
addCheck("disabled reason visible", serializedVm.includes("Disabled reason") && serializedVm.includes("runtime storage mutation remain disabled"));
addCheck("evidence activity cost visible", ["Evidence", "Activity", "Cost impact"].every((label) => serializedVm.includes(label)) && page.includes("Evidence, Activity, And Cost"));
addCheck("DB mutation disabled", dbRuntimeReadinessViewModel.safety.dbWritesAllowed === false && dbRuntimeReadinessViewModel.safety.migrationsAllowed === false && dbRuntimeReadinessViewModel.safety.schemaMutationAllowed === false);
addCheck("project/provider spend disabled", dbRuntimeReadinessViewModel.safety.projectMutationAllowed === false && dbRuntimeReadinessViewModel.safety.providerSpendAllowed === false);
addCheck("no runnable DB action", !/migrate now|write now|schema now|run db|execute now|enable now/i.test(serializedVm));
addCheck("no raw private IDs or DB URLs", !/(?:project|private)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serializedVm) && !/postgres(?:ql)?:\/\//i.test(combinedUiSource));
addCheck("no DemoApp leakage", !combinedUiSource.includes("DEMOAPP ACTIVE") && !data.includes("DemoApp"));
addCheck("no internal phase label in primary UX data", !/P72\./.test(serializedVm));
addCheck("Playwright DB Runtime route test added", routesTest.includes('test("DB Runtime route renders readiness without runnable DB actions"'));
addCheck("package script registered", packageJson.includes('"check:p725-command-center-db-runtime-ux": "node scripts/check-p725-command-center-db-runtime-ux.js"'));

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P72.5 display-only Command Center DB Runtime UX.\n- Does not write DB state, create migrations, mutate schema, mutate projects, dispatch providers/tools/workers, call network services, deploy, release, export, package, or spend provider budget." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Command Center UX", body: "- Durable State gains a DB Runtime tab.\n- Primary UX shows DB primary state, fallback state, migration readiness, next action, blockers, disabled reason, owner capability, evidence/activity location, safety posture, and cost impact.\n- Primary UX avoids raw JSON, raw logs, raw DB URLs, raw private IDs, DemoApp leakage, internal phase labels, and runnable DB actions." },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P72.5 Command Center DB Runtime UX Report", phase: "P72.5" },
);

printCheckReport("P72.5 Command Center DB Runtime UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
