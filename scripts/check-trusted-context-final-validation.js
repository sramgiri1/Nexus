import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildTrustedContextPacket,
  getDataSourceRegistry,
  getSystemOfRecordMap,
  scoreDataSources,
  validateDataSourceRegistry,
  validateSystemOfRecordMap,
  validateTrustedContextPacket,
} from "../trusted-context/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/trusted-context-final-validation-report.md");
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
const phaseStatus = JSON.parse(read("os-roadmap/phase-status.json") || "{}");
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const registry = getDataSourceRegistry();
const sourceMap = getSystemOfRecordMap();
const scores = scoreDataSources(registry.sources);
const packet = buildTrustedContextPacket({ mode: "local-private", scope: "PROJECT_CHANGE" });
const demoPacket = buildTrustedContextPacket({ mode: "demo", scope: "PROJECT_CHANGE" });
const publicPacket = buildTrustedContextPacket({ mode: "public-safe", scope: "PROJECT_CHANGE" });
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const routeSource = read("dashboard/src/data/commandCenterRoutes.js");

addCheck("P47.1 data source registry", validateDataSourceRegistry(registry).ok);
addCheck("P47.2 system-of-record map", validateSystemOfRecordMap(sourceMap).ok);
addCheck("P47.3 trust scoring", scores.length >= registry.sources.length && scores.every((score) => ["high", "medium", "low", "unavailable"].includes(score.band)));
addCheck("P47.4 freshness and lineage", existsSync(join(ROOT, "trusted-context/contextFreshness.js")) && existsSync(join(ROOT, "trusted-context/contextLineage.js")));
addCheck("P47.5 trusted context packet", validateTrustedContextPacket(packet).ok && packet.rawContentIncluded === false);
addCheck("P47.6 Command Center context center", routeSource.includes("/command-center/context") && commandCenterSource.includes("function DataContextCenterPage"));
addCheck("Demo/public private context blocked", demoPacket.includedSources.every((source) => !["local-private", "confidential"].includes(source.dataClassification)) && publicPacket.includedSources.every((source) => !["local-private", "confidential"].includes(source.dataClassification)));
addCheck(
  "No raw secrets/source/docs in primary UI",
  !/api[_-]?key|password|-----BEGIN/i.test(commandCenterSource)
    && !commandCenterSource.includes("JSON.stringify(context")
    && !commandCenterSource.includes("<pre>"),
);
addCheck("No provider/tool/worker dispatch enabled", read("policy/trusted-context-policy.json").includes('"providerCallsAllowed": false') && read("policy/trusted-context-policy.json").includes('"toolDispatchAllowed": false') && read("policy/trusted-context-policy.json").includes('"workerRuntimeAllowed": false'));
addCheck("No DB writes enabled", read("policy/trusted-context-policy.json").includes('"dbWritesAllowed": false'));
addCheck("No project mutation", read("policy/trusted-context-policy.json").includes('"projectMutationAllowed": false'));
addCheck("P47.1-P47.7 visible", ["P47.1", "P47.2", "P47.3", "P47.4", "P47.5", "P47.6", "P47.7"].every((phaseId) => statusById.has(phaseId) && statusById.get(phaseId).commandCenterVisible === true));
addCheck("P47 closed and P48 next", statusById.get("P47")?.status === "complete" && Boolean(statusById.get(phaseStatus.nextPhase)));
addCheck("Reports exist", [
  "reports/trusted-context-data-source-report.md",
  "reports/system-of-record-map-report.md",
  "reports/source-trust-score-report.md",
  "reports/context-freshness-lineage-report.md",
  "reports/trusted-context-packet-report.md",
  "reports/trusted-context-command-center-report.md",
].every((path) => existsSync(join(ROOT, path))));
addCheck("Package script exists", packageJson.scripts?.["check:trusted-context-final-validation"] === "node scripts/check-trusted-context-final-validation.js");
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const report = `# Trusted Context Final Validation Report

## Metadata
- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P47.7 - Tests + Docs + Final Validation

## Summary
- Data sources registered: ${registry.sources.length}
- System-of-record domains: ${sourceMap.domains.length}
- Trust scores generated: ${scores.length}
- Packet included sources: ${packet.includedSources.length}
- Packet excluded sources: ${packet.excludedSources.length}
- Command Center route: /command-center/context
- Provider/tool/worker dispatch enabled: false
- DB writes enabled: false
- Project mutation enabled: false

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Known Limitations
- P47 remains metadata-only and read-only.
- Trusted context packets are previews and are not sent to providers or runtime agents.
- Freshness markers are deterministic validation metadata, not automatic source rewrites.
- Command Center uses a browser-safe summary snapshot for P47.6 while Node checkers validate canonical modules.

## Next Phase
P48 - Governed Agentic Mesh

## Result
${failed.length === 0 ? "PASS" : "FAIL"}
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Trusted Context Final Validation Check\n===========================================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
