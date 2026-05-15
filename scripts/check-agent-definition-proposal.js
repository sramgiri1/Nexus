import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildSampleAgentDefinitionProposal,
  summarizeAgentDefinitionProposal,
  validateAgentDefinitionProposal,
} from "../agent-definition/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/agent-definition-proposal-report.md");
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
const packageJson = JSON.parse(read("package.json") || "{}");
const policy = JSON.parse(read("policy/agent-definition-update-policy.json") || "{}");
const proposal = buildSampleAgentDefinitionProposal();
const validation = validateAgentDefinitionProposal(proposal);
const summary = summarizeAgentDefinitionProposal(proposal);
const source = read("agent-definition/agentDefinitionProposal.js");
const docs = read("docs/architecture/AGENT_DEFINITION_UPDATE_WORKFLOW.md");

add("Module exists", existsSync(join(ROOT, "agent-definition/agentDefinitionProposal.js")));
add("Required exports", source.includes("createAgentDefinitionProposal") && source.includes("validateAgentDefinitionProposal"));
add("Policy", policy.proposalFirst === true && policy.directAgentFileMutationAllowed === false);
add("Proposal validation", validation.ok, validation.errors.join("; "));
add("Required fields", ["proposalId", "agentId", "changeType", "permissionDelta", "rollbackPlan", "status"].every((field) => proposal[field] !== undefined));
add("Reviewer policy", proposal.requiredReviewers.includes("AUDITOR") && proposal.requiredReviewers.includes("WARDEN"));
add("No mutation", proposal.mutationAllowed === false && proposal.appliesToAgentFile === false);
add("Docs", docs.includes("P49.1 - Agent Definition Change Proposal"));
add("Package script", packageJson.scripts?.["check:agent-definition-proposal"] === "node scripts/check-agent-definition-proposal.js");
add("No forbidden changes", !changedFiles().some((file) => file.startsWith("projects/careloop") || file.startsWith("projects/careloop-ios") || file.startsWith("agents/")));

const result = checks.every((check) => check.ok) ? "PASS" : "FAIL";
const report = `# Agent Definition Proposal Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P49.1 - Agent Definition Change Proposal

## Summary

- Proposal: ${summary.proposalId}
- Agent: ${summary.agentId}
- Change type: ${summary.changeType}
- Risk: ${summary.riskLevel}
- Status: ${summary.status}
- Mutation allowed: ${summary.mutationAllowed ? "yes" : "no"}

## Checks

${checks.map((check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Result

${result}
`;

writeFileSync(REPORT_PATH, report, "utf8");

console.log("NEXUS Agent Definition Proposal Check");
console.log("=====================================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
