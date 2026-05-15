import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildBoundaryCompilerExamples,
  compileAgentBoundary,
  summarizeBoundaryCompiler,
  validateBoundaryEnvelope,
} from "../agent-registry/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/boundary-compiler-report.md");
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
const examples = buildBoundaryCompilerExamples();
const summary = summarizeBoundaryCompiler(examples);
const coreEnvelope = compileAgentBoundary({
  agentId: "CORE",
  projectId: "private-project-01",
  scope: "project",
  capabilityId: "implementation.scoped_patch",
  taskType: "implementation",
});
const validation = validateBoundaryEnvelope(coreEnvelope);
const policy = JSON.parse(read("policy/boundary-compiler-policy.json") || "{}");

addCheck("Compiler module", existsSync(join(ROOT, "agent-registry/boundaryCompiler.js")));
addCheck("Envelope module", existsSync(join(ROOT, "agent-registry/boundaryEnvelope.js")));
addCheck("Validator module", existsSync(join(ROOT, "agent-registry/boundaryValidator.js")));
addCheck("Dry-run envelope", coreEnvelope.dryRun === true && coreEnvelope.runtimeEnforcementEnabled === false);
addCheck("Envelope validates", validation.ok, validation.errors.join("; "));
addCheck("Examples", examples.length >= 4 && examples.every((example) => ["CORE", "SENTINEL", "WARDEN", "AUDITOR"].includes(example.agent.agentId)));
addCheck("Project/scope metadata", Boolean(coreEnvelope.project.projectId) && Boolean(coreEnvelope.scope.scopeType));
addCheck("Safety policy", policy.dryRunOnly === true && policy.actionBridgeBehaviorChangesAllowed === false && policy.dbWritesAllowed === false);
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const generatedAt = new Date().toISOString();
const report = `# Boundary Compiler Report

## Metadata
- Generated at: ${generatedAt}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P45.4 - Boundary Compiler

## Summary
- Compiler version: ${summary.compilerVersion}
- Dry-run only: true
- Example envelopes: ${summary.exampleCount}
- Valid examples: ${summary.validExamples}
- Runtime enforcement enabled: false

## Example Envelope Summaries
${summary.summaries.map((entry) => `- ${entry.agentId}: ${entry.scopeType} / ${entry.capabilityId} / approvals ${entry.approvalCount} / evidence ${entry.evidenceCount}`).join("\n")}

## Explicit Non-Goals
- No action bridge behavior changed.
- No runtime enforcement enabled.
- No provider/tool dispatch enabled.
- No DB writes enabled.
- No project source mutation enabled.

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Boundary Compiler Check\n=============================\n");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
