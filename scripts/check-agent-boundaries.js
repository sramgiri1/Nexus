import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildAgentBoundaryModel,
  validateAgentBoundaryModel,
} from "../agent-registry/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/agent-boundaries-report.md");
const checks = [];

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function read(relativePath) {
  const path = join(ROOT, relativePath);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function addCheck(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

const branch = git(["branch", "--show-current"]);
const head = git(["rev-parse", "--short", "HEAD"]);
const model = buildAgentBoundaryModel();
const validation = validateAgentBoundaryModel(model);
const policy = JSON.parse(read("policy/agent-boundary-policy.json") || "{}");

addCheck("Boundary modules", ["agentBoundaryModel.js", "pathBoundaryRules.js", "dataBoundaryRules.js", "toolBoundaryRules.js"].every((file) => existsSync(join(ROOT, "agent-registry", file))));
addCheck("Boundary dimensions", policy.requiredBoundaryDimensions.every((dimension) => model.dimensions.includes(dimension)));
addCheck("Required examples", ["CORE", "SENTINEL", "AUDITOR", "WARDEN", "SWIFT"].every((agentId) => model.examples[agentId]));
addCheck("Boundaries validate", validation.ok, validation.errors.join("; "));
addCheck("Tool dispatch disabled", model.toolDispatchEnabled === false && policy.toolDispatchAllowed === false);
addCheck("Metadata only", model.runtimeEnforcementEnabled === false && policy.runtimeEnforcementAllowed === false);
addCheck(
  "No broad paths",
  model.agents.every((agent) => {
    const allowed = agent.pathBoundary?.allowedPathPatterns || [];
    return !allowed.includes("**/*") && !allowed.includes("*");
  }),
);
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const generatedAt = new Date().toISOString();
const report = `# Agent Boundaries Report

## Metadata
- Generated at: ${generatedAt}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P45.3 - Agent Path / Tool / Data Boundaries

## Summary
- Agents with boundary metadata: ${model.agents.length}
- Runtime enforcement enabled: false
- Tool dispatch enabled: false
- Boundary dimensions: ${model.dimensions.join(", ")}

## Examples
${Object.entries(model.examples).map(([agentId, summary]) => `- ${agentId}: ${summary}`).join("\n")}

## Warnings
${validation.warnings.length ? validation.warnings.map((warning) => `- ${warning}`).join("\n") : "- None"}

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Agent Boundaries Check\n============================\n");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
