import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  DATA_CLASSIFICATIONS,
  DATA_SOURCE_TYPES,
  TRUSTED_CONTEXT_SCOPES,
  getDataSourceById,
  getDataSourceRegistry,
  listDataSourcesByScope,
  validateDataSourceRegistry,
} from "../trusted-context/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/trusted-context-data-source-report.md");
const checks = [];

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function addCheck(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

const branch = git(["branch", "--show-current"]);
const head = git(["rev-parse", "--short", "HEAD"]);
const packageJson = JSON.parse(read("package.json") || "{}");
const policy = JSON.parse(read("policy/trusted-context-policy.json") || "{}");
const phaseStatus = JSON.parse(read("os-roadmap/phase-status.json") || "{}");
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const registry = getDataSourceRegistry();
const validation = validateDataSourceRegistry(registry);
const sourceIds = registry.sources.map((source) => source.sourceId);

addCheck("Trusted context modules exist", [
  "trusted-context/dataSourceRegistry.js",
  "trusted-context/dataSourceSchema.js",
  "trusted-context/index.js",
].every((path) => existsSync(join(ROOT, path))));
addCheck("Schema constants present", DATA_SOURCE_TYPES.length >= 10 && DATA_CLASSIFICATIONS.includes("local-private") && TRUSTED_CONTEXT_SCOPES.includes("os"));
addCheck("Registry validates", validation.ok, validation.errors.join("; "));
addCheck("Minimum OS sources", ["nexus-os-roadmap", "os-phase-status", "architecture-docs", "agent-registry", "module-registry"].every((id) => sourceIds.includes(id)));
addCheck("Minimum project sources", ["project-registry", "project-profile-pattern", "private-project-docs", "validation-reports"].every((id) => sourceIds.includes(id)));
addCheck("Runtime sources", ["runtime-tasks", "evidence-ledger", "audit-ledger", "event-ledger", "activity-ledger"].every((id) => sourceIds.includes(id)));
addCheck("Safety sources", ["policy-files", "safety-reports"].every((id) => sourceIds.includes(id)));
addCheck("Private sources blocked in demo/public", registry.sources.filter((source) => source.dataClassification === "local-private").every((source) => source.forbiddenModes.includes("demo") && source.forbiddenModes.includes("public")));
addCheck("Source lookup helpers work", getDataSourceById("nexus-os-roadmap")?.systemOfRecord === true && listDataSourcesByScope("os").length >= 4);
addCheck("Policy blocks runtime behavior", policy.providerCallsAllowed === false && policy.dbWritesAllowed === false && policy.runtimeAgentInjectionAllowed === false && policy.toolDispatchAllowed === false);
addCheck("Package script exists", packageJson.scripts?.["check:trusted-context-data-sources"] === "node scripts/check-trusted-context-data-sources.js");
addCheck("P47.1 status visible", ["in_progress", "complete"].includes(statusById.get("P47.1")?.status));
addCheck("P47.2 next", phaseStatus.nextPhase === "P47.2" || statusById.get("P47.1")?.nextPhase === "P47.2");
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const generatedAt = new Date().toISOString();
const report = `# Trusted Context Data Source Report

## Metadata
- Generated at: ${generatedAt}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P47.1 - Data Source Registry

## Summary
- Registry version: ${registry.registryVersion}
- Sources registered: ${registry.sources.length}
- OS scoped sources: ${listDataSourcesByScope("os").length}
- Project scoped sources: ${listDataSourcesByScope("project").length}
- Runtime/task sources: ${registry.sources.filter((source) => ["runtime", "task"].includes(source.scope)).length}
- Raw content included: false
- Provider/tool/worker dispatch enabled: false
- DB writes enabled: false

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Data Source Categories
- OS sources define the roadmap, phase status, architecture docs, agent registry metadata, and module registry.
- Project sources identify project registry/profile/docs references without reading private source content.
- Runtime sources identify task, evidence, audit, event, and activity ledgers as metadata-only sources.
- Safety sources identify policy and public/private boundary reports.

## Next Phase
P47.2 - System-of-Record Mapping
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Trusted Context Data Source Check\n=======================================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
