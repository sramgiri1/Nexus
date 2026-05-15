import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/agent-definition-command-center-report.md");
const checks = [];

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function read(path) {
  const full = join(ROOT, path);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
}

function add(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

function changedFiles() {
  return git(["status", "--short"]).split("\n").map((line) => line.trim().slice(3)).filter(Boolean);
}

const branch = git(["branch", "--show-current"]);
const head = git(["rev-parse", "--short", "HEAD"]);
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const tabsSource = read("dashboard/src/data/commandCenterTabs.js");
const viewModelSource = read("dashboard/src/data/commandCenterViewModel.js");
const testsSource = read("dashboard/tests/routes.spec.js");
const docs = read("docs/architecture/AGENT_DEFINITION_UPDATE_WORKFLOW.md");
const packageJson = JSON.parse(read("package.json") || "{}");

for (const expected of [
  "Agent Definition Updates",
  "Boundary Diff Summary",
  "AUDITOR / WARDEN Review",
  "Human Approval Gate",
  "Versioning + Rollback",
  "Apply disabled",
]) {
  add(`UI copy: ${expected}`, commandCenterSource.includes(expected), `Missing ${expected}`);
}

add("Tab config", tabsSource.includes('id: "definition-updates"'));
add("View model", viewModelSource.includes("definitionUpdates") && viewModelSource.includes("directAgentFileMutationAllowed"));
add("Route test", testsSource.includes("Agent Registry shows read-only agent definition update workflow"));
add("Docs", docs.includes("P49.6 - Command Center UX"));
add("Package script", packageJson.scripts?.["check:agent-definition-command-center"] === "node scripts/check-agent-definition-command-center.js");
add("No direct apply", !commandCenterSource.includes("applyAgentDefinitionChange"));
add("No forbidden changes", !changedFiles().some((file) => file.startsWith("projects/careloop") || file.startsWith("projects/careloop-ios") || file.startsWith("agents/")));

const result = checks.every((check) => check.ok) ? "PASS" : "FAIL";
writeFileSync(REPORT_PATH, `# Agent Definition Command Center Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P49.6 - Agent Regression Tests + Command Center UX

## Summary

Agent Definition Updates are visible as a read-only Agent Registry tab. No UI
execution or agent file mutation is enabled.

## Checks

${checks.map((check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}${check.detail && !check.ok ? ` - ${check.detail}` : ""}`).join("\n")}

## Result

${result}
`, "utf8");

console.log("NEXUS Agent Definition Command Center Check");
console.log("===========================================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
