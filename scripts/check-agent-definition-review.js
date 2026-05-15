import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildAgentBoundaryDiff,
  buildSampleAgentDefinitionProposal,
  createAgentDefinitionReview,
  summarizeAgentDefinitionReviews,
  validateAgentDefinitionReview,
} from "../agent-definition/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/agent-definition-review-report.md");
const checks = [];
function git(args) { return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim(); }
function read(path) { const full = join(ROOT, path); return existsSync(full) ? readFileSync(full, "utf8") : ""; }
function add(name, ok, detail = "") { checks.push({ name, ok, detail }); }

const branch = git(["branch", "--show-current"]);
const head = git(["rev-parse", "--short", "HEAD"]);
const packageJson = JSON.parse(read("package.json") || "{}");
const proposal = buildSampleAgentDefinitionProposal();
const diff = buildAgentBoundaryDiff(proposal);
const reviews = [
  createAgentDefinitionReview({ proposalId: proposal.proposalId, reviewerAgent: "AUDITOR", riskLevel: proposal.riskLevel, riskyExpansion: diff.riskyExpansion }),
  createAgentDefinitionReview({ proposalId: proposal.proposalId, reviewerAgent: "WARDEN", riskLevel: proposal.riskLevel, riskyExpansion: diff.riskyExpansion }),
];
const reviewValidations = reviews.map(validateAgentDefinitionReview);
const summary = summarizeAgentDefinitionReviews(reviews);
const source = read("agent-definition/agentDefinitionReview.js");
const docs = read("docs/architecture/AGENT_DEFINITION_UPDATE_WORKFLOW.md");

add("Module exists", existsSync(join(ROOT, "agent-definition/agentDefinitionReview.js")));
add("Review store exists", existsSync(join(ROOT, "agent-definition/reviewStore.js")));
add("Exports", source.includes("createAgentDefinitionReview") && source.includes("validateAgentDefinitionReview"));
add("AUDITOR review", reviews.some((review) => review.reviewerAgent === "AUDITOR"));
add("WARDEN review", reviews.some((review) => review.reviewerAgent === "WARDEN"));
add("Valid reviews", reviewValidations.every((validation) => validation.ok), reviewValidations.flatMap((validation) => validation.errors).join("; "));
add("Human approval recorded", summary.humanApprovalRequired === true);
add("No mutation", reviews.every((review) => review.mutationAllowed === false));
add("Docs", docs.includes("P49.3 - AUDITOR / WARDEN Review"));
add("Package script", packageJson.scripts?.["check:agent-definition-review"] === "node scripts/check-agent-definition-review.js");

const result = checks.every((check) => check.ok) ? "PASS" : "FAIL";
writeFileSync(REPORT_PATH, `# Agent Definition Review Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P49.3 - AUDITOR / WARDEN Review

## Summary

- Reviews: ${summary.reviewCount}
- Reviewers: ${summary.reviewers.join(", ")}
- Decisions: ${summary.decisions.join(", ")}
- Human approval required: ${summary.humanApprovalRequired ? "yes" : "no"}

## Checks

${checks.map((check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Result

${result}
`, "utf8");

console.log("NEXUS Agent Definition Review Check");
console.log("===================================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
