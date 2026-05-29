import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalApplicationAuthorityActivationBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1237-founder-runtime-approval-application-authority-activation-boundary-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function changedFiles() {
  return execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]{1,2}\s+/, ""))
    .map((line) => (line.includes(" -> ") ? line.split(" -> ").pop() : line));
}

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|preview-only|display-only|read-only|future|validation-only|docs-only|final-validation-only|planned)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p123-founder-runtime-approval-application-authority-activation-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p123Subphases = ["P123.1", "P123.2", "P123.3", "P123.4", "P123.5", "P123.6", "P123.7"];
const p1237 = subphaseById.get("P123.7") || {};
const p124Status = statusById.get("P124") || {};
const p124Roadmap = roadmapById.get("P124") || {};
const plan = readText("docs/architecture/P123_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1236Checker = readText("scripts/check-p1236-founder-runtime-approval-application-authority-activation-boundary.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const displayModel = buildFounderApprovalApplicationAuthorityActivationBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const serializedDisplayModel = JSON.stringify(displayModel);
const primaryUxSource = `${pageSource}\n${serializedDisplayModel}`;
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P123.7";
const allowedFiles = new Set(p1237.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
  "dashboard/tests/",
  "db/",
  "live-ready/",
  "local-state/runtime/",
  "providers/",
  "tools/",
  "worker-runtime/",
  "deploy/",
  "release/",
  "exports/",
  "packages/",
  ".env",
];
const p123Entries = [statusById.get("P123"), ...p123Subphases.map((phaseId) => statusById.get(phaseId))].filter(Boolean);
const stalePending = p123Entries.filter((entry) => entry.commit === "pending-final-commit" && !["P123", "P123.7"].includes(entry.phaseId));
const requiredScripts = [
  "check:p1231-founder-runtime-approval-application-authority-activation-boundary",
  "check:p1232-founder-runtime-approval-application-authority-activation-boundary",
  "check:p1233-founder-runtime-approval-application-authority-activation-boundary",
  "check:p1234-founder-runtime-approval-application-authority-activation-boundary",
  "check:p1235-founder-runtime-approval-application-authority-activation-boundary",
  "check:p1236-founder-runtime-approval-application-authority-activation-boundary",
  "check:p1237-founder-runtime-approval-application-authority-activation-boundary",
];
const validationCommands = [
  "npm run check:p1237-founder-runtime-approval-application-authority-activation-boundary",
  "npm run check:p1236-founder-runtime-approval-application-authority-activation-boundary",
  "npm run check:p1235-founder-runtime-approval-application-authority-activation-boundary",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Approval application authority activation appears only on scoped pages\"",
  "git diff --check",
];

const p1237StatusAccepted = status.currentPhase === "P123.7"
  && status.previousPhase === "P123.6"
  && status.nextPhase === "P124"
  && roadmap.currentPhase === "P123.7"
  && roadmap.previousPhase === "P123.6"
  && roadmap.nextPhase === "P124";
const p124HandoffAccepted = (p124Status.status === "planned" && p124Roadmap.status === "planned")
  || (p124Status.status === "in_progress" && p124Roadmap.status === "in_progress");

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("contract marks P123 complete", contract.status === "complete" && contract.currentSubphase === "P123.7" && contract.previousSubphase === "P123.6" && contract.nextSubphase === "P124");
addCheck("contract marks every P123 subphase complete", p123Subphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract records final validation scope", p1237.status === "complete" && p1237.scopeClassification === "NEXUS_OS_CHANGE" && p1237.expectedExports?.length === 0 && p1237.dataShape?.includes("No runtime exports"));
addCheck("contract forbids dashboard source edits", (p1237.forbiddenFiles || []).includes("dashboard/src/**") && (p1237.forbiddenFiles || []).includes("dashboard/tests/**"));
addCheck("P123.7 records validation commands", validationCommands.every((command) => p1237.validationCommands?.includes(command)));
addCheck("OS checker recognizes P124", /\"P124\"/.test(osStatusChecker));
addCheck("P123.6 checker accepts P123.7 handoff", p1236Checker.includes("P123.7") && p1236Checker.includes("P124") && p1236Checker.includes("p1237FinalState"));
addCheck("P123.5 route regression coverage remains present", routeTests.includes("Approval application authority activation appears only on scoped pages") && routeTests.includes("Founder approval application authority activation") && routeTests.includes("Activation scope"));
addCheck("display model remains safe", displayModel.readinessRowCount === 4 && displayModel.blockedReadinessRowCount === 4 && displayModel.activationCandidateCount === 0 && displayModel.authorityGrantCandidateCount === 0 && displayModel.providerSpendCandidateCount === 0);
addCheck("primary UX stays scoped", pageSource.includes("Business Build Approval Application Authority Activation") && pageSource.includes("Agent Flow Approval Application Authority Activation") && !pageSource.includes("Lite Approval Application Authority Activation") && !pageSource.includes("Chat Approval Application Authority Activation"));
addCheck("primary UX avoids internal phase labels and report paths", !/P123|p123\d|reports\/p123/i.test(primaryUxSource));
addCheck("primary UX avoids raw schema names and private IDs", !/(founderApprovalApplicationAuthorityActivation|approval_authority_activation|activationDraftRef|activationEventRef|activationEvidenceRef|approvalApplicationAuthorityActivationKey|(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*)/i.test(serializedDisplayModel));
addCheck("primary UX avoids fake runnable actions", !/run now|execute now|deploy now|activate now|grant authority now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(primaryUxSource));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));
addCheck("docs record P123.7", /P123\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P123.7 and parent completion", /P123\.7 is complete/.test(platformRoadmap) && /P123 is complete/.test(platformRoadmap) && /P124\s+is\s+next/.test(platformRoadmap));
addCheck("README records P123.7 and parent completion", /P123\.7 approval application authority activation final validation/.test(readme) && /P123\s+is\s+complete/.test(readme) && /P124\s+is\s+next/.test(readme));
addCheck(
  "phase status advanced",
  p1237StatusAccepted
    && statusById.get("P123")?.status === "complete"
    && statusById.get("P123.7")?.status === "complete"
    && p123Subphases.every((phaseId) => statusById.get(phaseId)?.status === "complete")
    && roadmapById.get("P123")?.status === "complete"
    && roadmapById.get("P123.7")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P124 planned handoff exists", p124HandoffAccepted && p124Status.commandCenterVisible === true && p124Roadmap.commandCenterVisible === true);
addCheck("completed P123 entries have commits", p123Entries.length === 8 && p123Entries.every((entry) => Boolean(entry.commit)) && stalePending.length === 0, stalePending.map((entry) => entry.phaseId).join(", "));
addCheck(
  "changed files stay in P123.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P123.7 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P123.7 contract avoids forbidden file scope", !(p1237.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("checker reuses report helpers", p1237.checkerUpdates?.some((item) => item.includes("shared/reportWriter.js")) && p1237.checkerUpdates?.some((item) => item.includes("shared/checkResultFormatter.js")));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(`${p1236Checker}\n${readText("scripts/check-p1237-founder-runtime-approval-application-authority-activation-boundary.js")}`) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${docsBundle}\n${primaryUxSource}`));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /activation is enabled|approval application authority activation is enabled|authority grant is enabled|approval decision application is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|activation authority is granted|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P123.7 final validation and parent phase closure.",
        "- Confirms P123.1-P123.7 are complete, P123 is complete, and P124 is the next planned OS phase.",
        "- Does not modify Command Center source/tests and does not enable activation, authority grant, apply, submit, approve, reject, save, decision persistence, approve/reject recording, DB/runtime writes, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1237.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P123.7 is final validation only. It does not activate authority, grant authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P123.7 Approval Application Authority Activation Final Validation Report", phase: "P123.7" },
);

printCheckReport("P123.7 Approval Application Authority Activation Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
