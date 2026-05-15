import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildAgentBoundaryDiff,
  buildSampleAgentDefinitionProposal,
  summarizeBoundaryDiff,
  validateBoundaryDiff,
} from "../agent-definition/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/agent-boundary-diff-report.md");
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

const branch = git(["branch", "--show-current"]);
const head = git(["rev-parse", "--short", "HEAD"]);
const packageJson = JSON.parse(read("package.json") || "{}");
const proposal = buildSampleAgentDefinitionProposal();
const diff = buildAgentBoundaryDiff(proposal);
const validation = validateBoundaryDiff(diff);
const summary = summarizeBoundaryDiff(diff);
const source = read("agent-definition/boundaryDiff.js");
const docs = read("docs/architecture/AGENT_DEFINITION_UPDATE_WORKFLOW.md");

add("Module exists", existsSync(join(ROOT, "agent-definition/boundaryDiff.js")));
add("Exports", source.includes("buildAgentBoundaryDiff") && source.includes("classifyBoundaryDelta"));
add("Diff validation", validation.ok, validation.errors.join("; "));
add("Delta categories", ["capability", "toolPermission", "pathBoundary", "dataClassification", "costBudget", "approvalAuthority"].every((key) => diff.deltas?.[key]));
add("Risk classification", diff.classifications?.capability?.classification === "permission_expansion");
add("No mutation", diff.mutationAllowed === false);
add("Docs", docs.includes("P49.2 - Boundary Diff"));
add("Package script", packageJson.scripts?.["check:agent-boundary-diff"] === "node scripts/check-agent-boundary-diff.js");

const result = checks.every((check) => check.ok) ? "PASS" : "FAIL";
const report = `# Agent Boundary Diff Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P49.2 - Boundary Diff

## Summary

- Proposal: ${summary.proposalId}
- Agent: ${summary.agentId}
- Added deltas: ${summary.added}
- Removed deltas: ${summary.removed}
- Risky expansion: ${summary.riskyExpansion ? "yes" : "no"}
- Review required: ${summary.reviewRequired ? "yes" : "no"}

## Checks

${checks.map((check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Result

${result}
`;

writeFileSync(REPORT_PATH, report, "utf8");
console.log("NEXUS Agent Boundary Diff Check");
console.log("===============================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
