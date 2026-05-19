import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p66-command-center-self-healing-ux-report.md";

function read(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

const recoveryPageSource = read("dashboard/src/pages/Recovery.jsx");
const recoveryPreviewSource = read("dashboard/src/utils/recoveryPreview.js");
const routeTestSource = read("dashboard/tests/routes.spec.js");
const commandCenterUxChecker = read("scripts/check-command-center-ux.js");

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

for (const expected of [
  "Self-Healing Failure Loop",
  "Failure class",
  "Current state",
  "Proposed recovery",
  "Disabled reason",
  "Owner capability",
  "Evidence",
  "Activity",
  "Cost impact",
  "Next action",
]) {
  addCheck(`copy ${expected}`, recoveryPageSource.includes(expected) || recoveryPreviewSource.includes(expected));
}

for (const expected of [
  "Execution disabled",
  "Recovery execution, automatic retry, source mutation, project mutation, provider/tool execution, DB writes, deploy, and provider spend remain disabled.",
  "No repair action can run from Command Center.",
  "No provider spend",
]) {
  addCheck(`safety copy ${expected}`, recoveryPageSource.includes(expected) || recoveryPreviewSource.includes(expected));
}

addCheck("cards are not buttons", !recoveryPageSource.includes("Disabled action: Self-Healing Failure Loop"));
addCheck("route test updated", routeTestSource.includes("reports/p66-healing-safety-gate-report.md"));
addCheck("theme coverage preserved", routeTestSource.includes("await pickTheme(page, \"dark\")") && routeTestSource.includes("await pickTheme(page, \"system\")"));
addCheck("command center checker updated", commandCenterUxChecker.includes("selfHealingUx"));
addCheck("no DemoApp leakage", !recoveryPreviewSource.includes("DemoApp"));
addCheck("no raw JSON copy", !recoveryPreviewSource.includes("raw JSON"));
addCheck("no private raw IDs", !/project_|private_/.test(recoveryPreviewSource));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P66.5 Command Center Recovery route self-healing readiness UX.",
        "- UX is display-only and exposes no repair, retry, provider, DB, deploy, or project mutation action.",
        "- Preserves route-wide safety expectations for themes, no DemoApp leakage, and no raw private identifiers.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P66 Command Center Self-Healing UX Report", phase: "P66.5" },
);

printCheckReport("P66 Command Center Self-Healing UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
