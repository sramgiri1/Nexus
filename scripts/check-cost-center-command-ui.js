import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import {
  buildCheckTable,
  formatCheckLine,
  normalizeCheckStatus,
  writeMarkdownReport,
} from "../shared/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/cost-center-command-ui-report.md");
const checks = [
  { key: "route", name: "Route", status: "PASS", details: "" },
  { key: "tabs", name: "Tabs", status: "PASS", details: "" },
  { key: "copy", name: "Preview copy", status: "PASS", details: "" },
  { key: "tests", name: "Playwright coverage", status: "PASS", details: "" },
  { key: "safety", name: "Safety boundaries", status: "PASS", details: "" },
  { key: "noForbiddenChanges", name: "No forbidden changes", status: "PASS", details: "" },
];
const failures = [];

function read(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function fail(key, details) {
  const row = checks.find((check) => check.key === key);
  if (row) {
    row.status = "FAIL";
    row.details = details;
  }
  failures.push(details);
}

function check(condition, key, details) {
  if (!condition) fail(key, details);
}

function gitOutput(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

const page = read("dashboard/src/pages/CommandCenterV2.jsx");
const costCenterBlock = page.match(/function CostCenterPage[\s\S]*?\/\* ─── Demo Mode Page ─── \*\//)?.[0] || "";
const tabs = read("dashboard/src/data/commandCenterTabs.js");
const routes = read("dashboard/src/data/commandCenterRoutes.js");
const tests = read("dashboard/tests/routes.spec.js");

check(routes.includes("/command-center/cost"), "route", "Cost Center route missing");
for (const id of ["overview", "budgets", "estimates", "ledger", "enforcement", "gaps", "developer-details"]) {
  check(tabs.includes(`id: "${id}"`), "tabs", `Missing tab id: ${id}`);
}
for (const copy of ["Ready for estimates", "Real provider spend", "Redacted cost ledger preview", "REQUIRE_APPROVAL", "RECORD_ONLY"]) {
  check(costCenterBlock.includes(copy), "copy", `Missing Cost Center copy: ${copy}`);
}
check(tests.includes("Cost Center route renders preview cost governance tabs"), "tests", "Missing Cost Center Playwright test");
for (const forbidden of ["real spend captured", "provider spend captured", "DemoApp"]) {
  check(!costCenterBlock.includes(forbidden), "safety", `Forbidden Cost Center copy present: ${forbidden}`);
}
const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.length === 0, "noForbiddenChanges", "Private project files changed");

const result = checks.every((item) => normalizeCheckStatus(item.status) === "PASS") ? "PASS" : "FAIL";
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Summary",
      body: "Command Center Cost Center now shows preview cost readiness, budgets, estimates, redacted ledger previews, enforcement decisions, gaps, and safe developer references.",
    },
    { title: "Failures", body: failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "Cost Center Command UI Report", metadata: { phase: "P57.6 - Command Center Cost Center UX" } },
);

console.log("NEXUS Cost Center Command UI Check");
console.log("==================================");
for (const item of checks) console.log(formatCheckLine(item.name, item.status, item.details));
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
