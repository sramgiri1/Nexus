import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  AGENT_DEFINITION_APPROVAL_STATES,
  buildApprovalGateRecord,
  buildSampleAgentDefinitionProposal,
  canTransitionAgentDefinitionProposal,
  validateApprovalGateRecord,
} from "../agent-definition/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/agent-definition-approval-gate-report.md");
const checks = [];
function git(args) { return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim(); }
function read(path) { const full = join(ROOT, path); return existsSync(full) ? readFileSync(full, "utf8") : ""; }
function add(name, ok, detail = "") { checks.push({ name, ok, detail }); }

const branch = git(["branch", "--show-current"]);
const head = git(["rev-parse", "--short", "HEAD"]);
const packageJson = JSON.parse(read("package.json") || "{}");
const proposal = buildSampleAgentDefinitionProposal();
const gate = buildApprovalGateRecord({ proposalId: proposal.proposalId, fromStatus: "under_review", toStatus: "requires_human_approval", requiredReviewsComplete: true, requiresHumanApproval: true });
const blockedApproval = canTransitionAgentDefinitionProposal("requires_human_approval", "approved", { requiresHumanApproval: true, humanApproved: false, requiredReviewsComplete: true });
const allowedApproval = canTransitionAgentDefinitionProposal("requires_human_approval", "approved", { requiresHumanApproval: true, humanApproved: true, requiredReviewsComplete: true });
const validation = validateApprovalGateRecord(gate);
const docs = read("docs/architecture/AGENT_DEFINITION_UPDATE_WORKFLOW.md");

add("Module exists", existsSync(join(ROOT, "agent-definition/approvalGate.js")));
add("Allowed states", ["proposed", "under_review", "requires_human_approval", "approved", "rejected", "changes_requested", "expired"].every((state) => AGENT_DEFINITION_APPROVAL_STATES.includes(state)));
add("Gate validation", validation.ok, validation.errors.join("; "));
add("Human approval blocks approval", blockedApproval.ok === false);
add("Human approval allows approval", allowedApproval.ok === true);
add("No mutation", gate.mutationAllowed === false);
add("Docs", docs.includes("P49.4 - Human Approval Gate"));
add("Package script", packageJson.scripts?.["check:agent-definition-approval-gate"] === "node scripts/check-agent-definition-approval-gate.js");

const result = checks.every((check) => check.ok) ? "PASS" : "FAIL";
writeFileSync(REPORT_PATH, `# Agent Definition Approval Gate Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P49.4 - Human Approval Gate

## Summary

- Proposal: ${gate.proposalId}
- Transition: ${gate.fromStatus} -> ${gate.toStatus}
- Transition allowed: ${gate.transitionAllowed ? "yes" : "no"}
- Human approval required: ${gate.requiresHumanApproval ? "yes" : "no"}

## Checks

${checks.map((check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Result

${result}
`, "utf8");

console.log("NEXUS Agent Definition Approval Gate Check");
console.log("==========================================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
