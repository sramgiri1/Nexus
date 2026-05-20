import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildSecretProviderReadiness,
  validateSecretProviderReadiness,
} from "../live-ready/secretProviderReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p872-secret-provider-readiness-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}
function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}
function fileExists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const envelope = buildSecretProviderReadiness();
const validation = validateSecretProviderReadiness(envelope);
const data = envelope.data || {};
const serialized = JSON.stringify(envelope);
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readText("contracts/os-roadmap/p87-execution-contracts.json");
const docs = readText("docs/architecture/P87_EXPLICIT_LIVE_ACTIVATION_UNLOCKS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const moduleSource = readText("live-ready/secretProviderReadiness.js");

const blockedFlags = [
  "providerCallsAllowed",
  "modelCallsAllowed",
  "toolExecutionAllowed",
  "networkCallsAllowed",
  "providerSpendAllowed",
  "activationAllowed",
  "executionAllowed",
];

addCheck("secret provider envelope passes", envelope.ok === true && envelope.status === "PASS");
addCheck("validation passes", validation.valid, validation.errors.join("; "));
addCheck("provider profiles present", data.providerProfiles?.length >= 2);
addCheck("redaction helper reused", moduleSource.includes("summarizeRedaction") && data.redactionProbe?.changed === true && data.redactionProbe?.redactionCount >= 1);
addCheck("provider gates reused", moduleSource.includes("buildProviderToolGateProfiles") && moduleSource.includes("buildExplicitLiveActivationContract"));
addCheck("no credential environment reads", !/process\.env|readFileSync\([^)]*\.env|dotenv/i.test(moduleSource));
addCheck("all runtime flags blocked", blockedFlags.every((flag) => data[flag] === false && data.providerProfiles?.every((profile) => profile[flag] === false)));
addCheck("secrets are references only", data.providerProfiles?.every((profile) => profile.secretReferenceRequired === true && profile.secretReferencePresent === false && profile.secretMaterialVisible === false));
addCheck("primary UX fields present", ["currentState", "readinessLabel", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"].every((field) => serialized.includes(field)));
addCheck("does not import forbidden runtime roots", !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/") && !moduleSource.includes("../db/"));
addCheck("no raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized));
addCheck("no fake unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized));
addCheck("no secret-like values", !/sk-[A-Za-z0-9_-]{12,}|xox[baprs]-|BEGIN [A-Z ]*PRIVATE KEY|postgres(?:ql)?:\/\//i.test(serialized));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p872-secret-provider-readiness"]));
addCheck("contract references P87.2 files", contract.includes("live-ready/secretProviderReadiness.js") && contract.includes("check:p872-secret-provider-readiness"));
addCheck("docs mention P87.2 validation", docs.includes("P87.2 Secret / Provider Readiness") && docs.includes("npm run check:p872-secret-provider-readiness"));
addCheck("platform roadmap records P87.2", platformRoadmap.includes("P87.2 is complete") && platformRoadmap.includes("P87.3 is next"));
addCheck(
  "phase status advanced",
  statusById.get("P87")?.status === "in_progress"
    && statusById.get("P87.2")?.status === "complete"
    && status.currentPhase === "P87.2"
    && status.nextPhase === "P87.3",
);
addCheck("roadmap tracks P87.2", roadmapById.get("P87.2")?.track === "NEXUS_OS" && roadmapById.get("P87.2")?.status === "complete");
addCheck("report prerequisites exist", fileExists("reports/p871-explicit-live-activation-contract-report.md") && fileExists("reports/os-phase-status-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P87.2 secret and provider readiness metadata.",
        "- Confirms secrets are references only and no credential files are read.",
        "- Confirms provider/model calls, network calls, activation, execution, and spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Provider Profile Count", body: `- ${data.providerProfileCount || 0} provider readiness profiles` },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p872-secret-provider-readiness",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P87.2 does not read .env files, store credentials, call providers or models, open network connections, activate tools, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P87.2 Secret Provider Readiness Report", phase: "P87.2" },
);

printCheckReport("P87.2 Secret Provider Readiness Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
