import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  AGENT_TYPES,
  CHANGE_SCOPES,
  REQUIRED_AGENT_FIELDS,
  getAgentRegistry,
  validateAgentRegistry,
} from "../agent-registry/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/agent-registry-schema-report.md");
const REQUIRED_AGENTS = ["NEXUS", "SHEPHERD", "CORE", "SWIFT", "SENTINEL", "AUDITOR", "WARDEN", "PRISM", "FORGE"];
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
const registry = getAgentRegistry();
const validation = validateAgentRegistry(registry);
const policy = JSON.parse(read("policy/agent-registry-policy.json") || "{}");

addCheck("Schema module", existsSync(join(ROOT, "agent-registry/agentRegistrySchema.js")));
addCheck("Agent types", AGENT_TYPES.includes("coordinator") && AGENT_TYPES.includes("implementer"));
addCheck("Change scopes", CHANGE_SCOPES.includes("NEXUS_OS_CHANGE") && CHANGE_SCOPES.includes("DOCS_CHANGE"));
addCheck(
  "Required fields",
  ["agentId", "allowedCapabilities", "allowedChangeScopes", "reviewSeparationPolicy", "notes"]
    .every((field) => REQUIRED_AGENT_FIELDS.includes(field)),
);
addCheck("Registry validates", validation.ok, validation.errors.join("; "));
addCheck("Known agents", REQUIRED_AGENTS.every((agentId) => registry.agents.some((entry) => entry.agentId === agentId)));
addCheck("Metadata only", registry.runtimePermissionsGranted === false && policy.runtimePermissionsGranted === false);
addCheck("Safety policy", policy.providerCallsAllowed === false && policy.dbWritesAllowed === false && policy.sourceMutationAllowed === false);
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const generatedAt = new Date().toISOString();
const report = `# Agent Registry Schema Report

## Metadata
- Generated at: ${generatedAt}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P45.1 - Agent Registry Schema

## Summary
- Agents registered: ${registry.agents.length}
- Runtime permissions granted: false
- Provider/tool/DB/runtime execution enabled: false

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Registered Agents
${registry.agents.map((entry) => `- ${entry.agentId}: ${entry.role}`).join("\n")}
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Agent Registry Schema Check\n=================================\n");
for (const check of checks) {
  console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
}
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);

if (failed.length > 0) {
  process.exitCode = 1;
}
