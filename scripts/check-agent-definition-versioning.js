import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildSampleAgentDefinitionProposal,
  createAgentDefinitionRollbackPlan,
  createAgentDefinitionVersionRecord,
  summarizeVersionRecord,
  validateAgentDefinitionVersionRecord,
  validateRollbackPlan,
} from "../agent-definition/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/agent-definition-versioning-report.md");
const checks = [];
function git(args) { return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim(); }
function read(path) { const full = join(ROOT, path); return existsSync(full) ? readFileSync(full, "utf8") : ""; }
function add(name, ok, detail = "") { checks.push({ name, ok, detail }); }

const branch = git(["branch", "--show-current"]);
const head = git(["rev-parse", "--short", "HEAD"]);
const packageJson = JSON.parse(read("package.json") || "{}");
const proposal = buildSampleAgentDefinitionProposal();
const versionRecord = createAgentDefinitionVersionRecord({ proposalId: proposal.proposalId, agentId: proposal.agentId });
const rollbackPlan = createAgentDefinitionRollbackPlan({ proposalId: proposal.proposalId, agentId: proposal.agentId });
const versionValidation = validateAgentDefinitionVersionRecord(versionRecord);
const rollbackValidation = validateRollbackPlan(rollbackPlan);
const summary = summarizeVersionRecord(versionRecord);
const docs = read("docs/architecture/AGENT_DEFINITION_UPDATE_WORKFLOW.md");

add("Versioning module", existsSync(join(ROOT, "agent-definition/versioning.js")));
add("Rollback module", existsSync(join(ROOT, "agent-definition/rollbackPlan.js")));
add("Version validation", versionValidation.ok, versionValidation.errors.join("; "));
add("Rollback validation", rollbackValidation.ok, rollbackValidation.errors.join("; "));
add("Dry-run only", versionRecord.status === "dry_run_only" && versionRecord.agentFileMutationAllowed === false);
add("Rollback execution disabled", rollbackPlan.rollbackExecutionEnabled === false);
add("Docs", docs.includes("P49.5 - Versioning + Rollback"));
add("Package script", packageJson.scripts?.["check:agent-definition-versioning"] === "node scripts/check-agent-definition-versioning.js");

const result = checks.every((check) => check.ok) ? "PASS" : "FAIL";
writeFileSync(REPORT_PATH, `# Agent Definition Versioning Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P49.5 - Versioning + Rollback

## Summary

- Proposal: ${summary.proposalId}
- Agent: ${summary.agentId}
- Previous version: ${summary.previousVersion}
- Proposed version: ${summary.proposedVersion}
- Mutation allowed: ${summary.mutationAllowed ? "yes" : "no"}
- Rollback checklist items: ${rollbackPlan.verificationChecklist.length}

## Checks

${checks.map((check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Result

${result}
`, "utf8");

console.log("NEXUS Agent Definition Versioning Check");
console.log("=======================================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
