import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildTrustedContextPacket,
  createTrustedContextRequest,
  explainContextExclusion,
  explainContextInclusion,
  summarizeTrustedContextPacket,
  validateTrustedContextPacket,
} from "../trusted-context/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/trusted-context-packet-report.md");
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
const request = createTrustedContextRequest({
  scope: "PROJECT_CHANGE",
  projectId: "private-project",
  taskId: "task-trusted-context-preview",
  agentId: "CORE",
  capabilityId: "implementation.preview",
  mode: "local-private",
  maxSources: 20,
  summariesOnly: true,
});
const packet = buildTrustedContextPacket(request);
const demoPacket = buildTrustedContextPacket({ ...request, mode: "demo" });
const publicPacket = buildTrustedContextPacket({ ...request, mode: "public-safe" });
const packetValidation = validateTrustedContextPacket(packet);
const demoValidation = validateTrustedContextPacket(demoPacket);
const publicValidation = validateTrustedContextPacket(publicPacket);
const inclusion = explainContextInclusion(packet);
const exclusion = explainContextExclusion(demoPacket);
const summary = summarizeTrustedContextPacket(packet);

addCheck("Packet modules exist", ["trusted-context/trustedContextPacket.js", "trusted-context/contextPacketPolicy.js"].every((path) => existsSync(join(ROOT, path))));
addCheck("Request shape defaults", request.mode === "local-private" && request.summariesOnly === true);
addCheck("Packet validates", packetValidation.ok, packetValidation.errors.join("; "));
addCheck("Demo excludes private sources", demoValidation.ok && demoPacket.includedSources.every((source) => !["local-private", "confidential"].includes(source.dataClassification)));
addCheck("Public-safe excludes private sources", publicValidation.ok && publicPacket.includedSources.every((source) => !["local-private", "confidential"].includes(source.dataClassification)));
addCheck("No raw content", packet.rawContentIncluded === false && packet.redacted === true);
addCheck("Inclusion/exclusion explanations", inclusion.length > 0 && exclusion.length > 0);
addCheck("Packet summary works", summary.included === packet.includedSources.length && summary.rawContentIncluded === false);
addCheck("Package script exists", packageJson.scripts?.["check:trusted-context-packet"] === "node scripts/check-trusted-context-packet.js");
addCheck("P47.4 complete", statusById.get("P47.4")?.status === "complete");
addCheck("P47.5 status visible", ["in_progress", "complete"].includes(statusById.get("P47.5")?.status));
addCheck("P47.6 next", phaseStatus.nextPhase === "P47.6" || statusById.get("P47.5")?.nextPhase === "P47.6");
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const report = `# Trusted Context Packet Report

## Metadata
- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P47.5 - Trusted Context Packet

## Summary
- Included sources: ${packet.includedSources.length}
- Excluded sources: ${packet.excludedSources.length}
- Demo included sources: ${demoPacket.includedSources.length}
- Public-safe included sources: ${publicPacket.includedSources.length}
- Raw content included: ${packet.rawContentIncluded}
- Redacted: ${packet.redacted}
- Runtime agent injection enabled: false

## Packet Preview
- Scope: ${packet.scope}
- Mode: ${packet.mode}
- Agent: ${packet.agentId}
- Capability: ${packet.capabilityId}
- Trust high/medium/low/unavailable: ${packet.trustSummary.high}/${packet.trustSummary.medium}/${packet.trustSummary.low}/${packet.trustSummary.unavailable}

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Next Phase
P47.6 - Command Center Data / Context Center
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Trusted Context Packet Check\n==================================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
