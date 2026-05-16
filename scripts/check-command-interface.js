import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildApprovalPreview,
  buildCommandContextPacket,
  buildCommandIntentSummary,
  buildCommandRoutePreview,
  buildCommandTimeline,
  createCommandIntent,
  createCommandRecord,
  listCommandRecords,
  routeCommandIntent,
  validateApprovalPreview,
  validateCommandContextPacket,
  validateCommandIntent,
  validateCommandRecord,
  validateCommandRoute,
} from "../command-interface/index.js";
import { formatCheckLine, normalizeCheckStatus, printCheckReport } from "../shared/checkResultFormatter.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";

const ROOT = process.cwd();
const REPORTS = [
  "reports/command-interface-schema-report.md",
  "reports/command-interface-scope-report.md",
  "reports/command-interface-routing-report.md",
  "reports/command-interface-approval-report.md",
  "reports/command-interface-timeline-report.md",
  "reports/command-interface-ui-report.md",
  "reports/command-interface-final-report.md",
];

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function pass(name, details = "") {
  return { name, status: "PASS", details };
}

function fail(name, details = "") {
  return { name, status: "FAIL", details };
}

function statusCheck(condition, name, details = "") {
  return condition ? pass(name, details) : fail(name, details);
}

function hasExport(source, exportName) {
  return source.includes(`export function ${exportName}`)
    || source.includes(`export const ${exportName}`)
    || source.includes(`export { ${exportName}`)
    || source.includes(`${exportName},`);
}

function noForbiddenPrivateChanges() {
  const changed = git(["status", "--short", "--", "projects/careloop", "projects/careloop-ios"]);
  return changed.length === 0;
}

function noForbiddenRuntimeChanges() {
  const changed = git(["status", "--short"]).split("\n").filter(Boolean);
  return changed.every((line) => {
    const path = line.slice(3);
    if (!path) return true;
    if (path.startsWith("projects/careloop/") || path.startsWith("projects/careloop-ios/")) return false;
    if (path.startsWith("agents/")) return false;
    if (path.startsWith("orchestrator/")) return false;
    if (path.startsWith("providers/")) return false;
    if (path.startsWith("tools/")) return false;
    if (path.startsWith("state-machine/")) return false;
    if (path.startsWith("command-execution/")) return false;
    if (path.startsWith("local-api/")) return false;
    if (path.startsWith("db/")) return false;
    return true;
  });
}

function noLongLines(paths) {
  return paths.every((relativePath) => {
    const source = read(relativePath);
    return source.split("\n").every((line) => line.length <= 1000);
  });
}

function buildScenario(commandText, extra = {}) {
  const intent = createCommandIntent({
    commandText,
    projectId: extra.projectId ?? "selected-project-ref",
    scope: extra.scope || "project",
  });
  const contextPacket = buildCommandContextPacket(intent, {
    selectedProjectId: intent.projectId,
    selectedProjectLabel: intent.projectId ? "Private Project" : "",
    selectedProject: intent.projectId ? "Private Project" : "",
  });
  const route = routeCommandIntent(intent, {
    capabilityReadiness: {
      agentWorkbench: { status: "ready" },
      commandPalette: { status: "ready" },
      controlledImplementation: { status: "ready_limited" },
      humanReview: { status: "ready" },
      missionActionBridge: { status: "ready_limited" },
      missionComposer: { status: "ready" },
      operatorActions: { status: "ready_limited" },
      scopeBoundary: { status: "ready_read_only" },
    },
  });
  const approval = buildApprovalPreview(route);
  const record = createCommandRecord({ ...intent, ...route, correlationId: `corr_${intent.commandId}` });
  return { intent, contextPacket, route, approval, record };
}

function writePhaseReport(filePath, title, checks, summary = "") {
  writeMarkdownReport(
    filePath,
    [
      { title: "Scope", body: "P62 - Conversational NEXUS Command Interface." },
      { title: "Summary", body: summary || "Preview-only command interface validation." },
      { title: "Checks", body: buildCheckTable(checks) },
      {
        title: "Safety",
        body: [
          "- Provider calls: disabled.",
          "- Tool execution: disabled.",
          "- Worker execution: disabled.",
          "- DB writes: disabled.",
          "- Project mutation: disabled.",
          "- Release/deploy execution: disabled.",
        ].join("\n"),
      },
    ],
    { title, metadata: { branch: git(["branch", "--show-current"]), head: git(["rev-parse", "--short", "HEAD"]) } },
  );
}

const branch = git(["branch", "--show-current"]);
const head = git(["rev-parse", "--short", "HEAD"]);
const packageSource = read("package.json");
const policySource = read("policy/command-interface-policy.json");
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const viewModelSource = read("dashboard/src/data/commandCenterViewModel.js");
const testSource = read("dashboard/tests/routes.spec.js");
const roadmapSource = `${read("os-roadmap/phase-status.json")}\n${read("os-roadmap/nexus-phases.json")}\n${read("dashboard/src/data/nexusRoadmap.js")}`;

const moduleSources = {
  "command-interface/commandIntentSchema.js": read("command-interface/commandIntentSchema.js"),
  "command-interface/commandScopeResolver.js": read("command-interface/commandScopeResolver.js"),
  "command-interface/projectCommandContext.js": read("command-interface/projectCommandContext.js"),
  "command-interface/commandRouter.js": read("command-interface/commandRouter.js"),
  "command-interface/operatorActionCatalog.js": read("command-interface/operatorActionCatalog.js"),
  "command-interface/commandApprovalPreview.js": read("command-interface/commandApprovalPreview.js"),
  "command-interface/commandTimeline.js": read("command-interface/commandTimeline.js"),
  "command-interface/commandStore.js": read("command-interface/commandStore.js"),
  "command-interface/index.js": read("command-interface/index.js"),
};

let policy = {};
try {
  policy = JSON.parse(policySource);
} catch {
  policy = {};
}

const planScenario = buildScenario("Plan mission for selected project");
const noProjectScenario = buildScenario("Plan mission", { projectId: "" });
const qaScenario = buildScenario("Run QA gate");
const shipScenario = buildScenario("Ship release");
const freezeScenario = buildScenario("Freeze workspace");
const explainScenario = buildScenario("Explain current NEXUS status", { scope: "os", projectId: "" });
const timelineRecords = listCommandRecords({ limit: 10 });
const timeline = buildCommandTimeline({ records: timelineRecords });

const checks = [
  statusCheck(branch === "arch/conversational-nexus-command-interface", "Branch", branch),
  statusCheck(Object.values(moduleSources).every(Boolean), "Modules", "command-interface modules are present"),
  statusCheck(
    [
      "createCommandIntent",
      "validateCommandIntent",
      "normalizeCommandText",
      "classifyCommandPreview",
      "buildCommandIntentSummary",
    ].every((name) => hasExport(moduleSources["command-interface/commandIntentSchema.js"], name)),
    "Intent schema exports",
  ),
  statusCheck(
    ["resolveCommandScope", "resolveCommandProject", "buildCommandContextPacket", "validateCommandContextPacket"]
      .every((name) => hasExport(moduleSources["command-interface/commandScopeResolver.js"], name)),
    "Scope exports",
  ),
  statusCheck(
    ["OPERATOR_ACTION_CATALOG", "routeCommandIntent", "validateCommandRoute", "buildCommandRoutePreview"]
      .every((name) => Object.values(moduleSources).some((source) => hasExport(source, name))),
    "Routing exports",
  ),
  statusCheck(
    ["buildApprovalPreview", "classifyApprovalRequirement", "validateApprovalPreview"]
      .every((name) => hasExport(moduleSources["command-interface/commandApprovalPreview.js"], name)),
    "Approval exports",
  ),
  statusCheck(
    ["createCommandRecord", "appendCommandRecord", "listCommandRecords", "getCommandRecord", "buildCommandTimeline", "validateCommandRecord"]
      .every((name) => Object.values(moduleSources).some((source) => hasExport(source, name))),
    "Timeline exports",
  ),
  statusCheck(policy.previewOnly === true && policy.executionAllowed === false, "Policy", "preview-only policy is enforced"),
  statusCheck(validateCommandIntent(planScenario.intent).valid, "Intent validation", buildCommandIntentSummary(planScenario.intent).intentType),
  statusCheck(validateCommandContextPacket(planScenario.contextPacket).valid, "Scope validation", planScenario.contextPacket.scope),
  statusCheck(validateCommandRoute(planScenario.route).valid, "Route validation", planScenario.route.routeStatus),
  statusCheck(validateApprovalPreview(shipScenario.approval).valid, "Approval validation", shipScenario.approval.state),
  statusCheck(validateCommandRecord(planScenario.record).valid, "Command record validation", planScenario.record.commandId),
  statusCheck(noProjectScenario.route.blockedReason === "Select or create a project first.", "No-project blocker", noProjectScenario.route.blockedReason),
  statusCheck(qaScenario.route.routeStatus === "blocked", "QA prerequisite preview", qaScenario.route.blockedReason),
  statusCheck(shipScenario.route.blockedReason.includes("release action bridge"), "Ship blocker", shipScenario.route.blockedReason),
  statusCheck(freezeScenario.approval.state === "blocked_until_capability_ready", "Freeze approval", freezeScenario.approval.state),
  statusCheck(explainScenario.route.previewOnly === true, "Explain preview", explainScenario.route.nextAction),
  statusCheck(timeline.previewOnly === true && timelineRecords.every((record) => record.redacted), "Timeline", `${timelineRecords.length} records`),
  statusCheck(packageSource.includes("\"check:command-interface\""), "Package script", "check:command-interface"),
  statusCheck(
    commandCenterSource.includes("Conversational NEXUS Command Interface")
      && commandCenterSource.includes("Commands are route-first previews until worker/provider/tool execution is enabled."),
    "Command Center UI",
    "command preview panel copy present",
  ),
  statusCheck(
    ["Plan", "Review", "QA", "Fix", "Ship", "Guard", "Freeze", "Explain"].every((label) => commandCenterSource.includes(label) || viewModelSource.includes(label)),
    "Command UI labels",
    "all simple operator labels present",
  ),
  statusCheck(testSource.includes("conversational command interface preview"), "Playwright coverage", "command interface tests present"),
  statusCheck(roadmapSource.includes("P62") && roadmapSource.includes("Conversational NEXUS Command Interface") && roadmapSource.includes("P63"), "OS phase status", "P62/P63 present"),
  statusCheck(noForbiddenPrivateChanges(), "No private project changes", "projects/careloop paths unchanged"),
  statusCheck(noForbiddenRuntimeChanges(), "No forbidden runtime changes", "runtime behavior paths unchanged"),
  statusCheck(
    noLongLines([
      ...Object.keys(moduleSources),
      "scripts/check-command-interface.js",
      "policy/command-interface-policy.json",
      "docs/architecture/CONVERSATIONAL_NEXUS_COMMAND_INTERFACE.md",
    ]),
    "Formatting/readability",
    "no checked lines over 1000 chars",
  ),
];

for (const reportPath of REPORTS) {
  const reportTitle = reportPath
    .replace("reports/", "")
    .replace(".md", "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  writePhaseReport(reportPath, reportTitle, checks, `Validation branch: ${branch}; Validation HEAD: ${head}.`);
}

const result = checks.every((check) => normalizeCheckStatus(check.status) === "PASS") ? "PASS" : "FAIL";
printCheckReport("NEXUS Command Interface Check", checks, result);
if (result !== "PASS") {
  console.error(checks.filter((check) => normalizeCheckStatus(check.status) !== "PASS").map((check) => formatCheckLine(check.name, check.status, check.details)).join("\n"));
  process.exitCode = 1;
}
