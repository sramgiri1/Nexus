import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildAgentCapabilityMatrix,
  summarizeAgentCapabilityMatrix,
  validateSeparationOfDuties,
} from "../agent-registry/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/agent-capability-matrix-report.md");
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
const matrix = buildAgentCapabilityMatrix();
const summary = summarizeAgentCapabilityMatrix(matrix);
const validation = validateSeparationOfDuties(matrix);
const policy = JSON.parse(read("policy/agent-capability-matrix-policy.json") || "{}");
const requiredCategories = policy.capabilityCategories || [];

addCheck("Modules", existsSync(join(ROOT, "agent-registry/agentCapabilityMatrix.js")) && existsSync(join(ROOT, "agent-registry/capabilityRules.js")));
addCheck("Matrix output", matrix.agents.length >= 9 && matrix.capabilityCatalog.length >= 10);
addCheck("Capability categories", requiredCategories.every((category) => matrix.capabilityCatalog.some((entry) => entry.category === category)));
addCheck("Separation of duties", validation.ok, validation.errors.join("; "));
addCheck("Stable capability IDs", matrix.capabilityCatalog.every((entry) => /^[a-z]+[a-z0-9]*(\.[a-z]+[a-z0-9_]*)+$/.test(entry.capabilityId)));
addCheck("Runtime enforcement disabled", matrix.runtimeEnforcementEnabled === false && policy.runtimeEnforcementAllowed === false);
addCheck("Safety policy", policy.providerCallsAllowed === false && policy.dbWritesAllowed === false && policy.toolDispatchAllowed === false);
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const generatedAt = new Date().toISOString();
const report = `# Agent Capability Matrix Report

## Metadata
- Generated at: ${generatedAt}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P45.2 - Agent Capability Matrix

## Summary
- Agents: ${summary.agentCount}
- Capabilities: ${summary.capabilityCount}
- Risky permissions requiring governance: ${summary.riskyPermissionCount}
- Runtime enforcement enabled: false

## Separation of Duties
${validation.errors.length === 0 ? "- PASS: No separation-of-duties violations found." : validation.errors.map((error) => `- FAIL: ${error}`).join("\n")}
${validation.warnings.map((warning) => `- WARNING: ${warning}`).join("\n")}

## Category Coverage
${Object.entries(summary.categoryCounts).map(([category, count]) => `- ${category}: ${count}`).join("\n")}

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Agent Capability Matrix Check\n===================================\n");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
