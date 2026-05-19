import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildLocalProjectCreationAdmission,
  validateLocalProjectCreationAdmission,
} from "../live-ready/localProjectCreationAdmission.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p831-local-project-creation-admission-report.md";

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

const approval = {
  operatorApproval: true,
  newWorkspaceRoot: true,
  scopeBoundary: true,
  rollbackPlan: true,
  validationCommands: true,
  activityEvidence: true,
  costEvidence: true,
  redactionCheck: true,
};
const admitted = buildLocalProjectCreationAdmission({
  projectName: "Snake iOS",
  projectType: "ios-game",
  approval,
});
const blocked = buildLocalProjectCreationAdmission({
  projectName: "Snake iOS",
  projectType: "ios-game",
  approval: {},
});
const unsafeRoot = buildLocalProjectCreationAdmission({
  projectName: "Snake iOS",
  projectType: "ios-game",
  targetRoot: "projects/snake-ios",
  approval,
});
const validation = validateLocalProjectCreationAdmission(admitted);
const blockedValidation = validateLocalProjectCreationAdmission(blocked);
const unsafeValidation = validateLocalProjectCreationAdmission(unsafeRoot);
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readText("contracts/os-roadmap/p83-execution-contracts.json");
const docs = readText("docs/architecture/P83_RUNTIME_ADMISSION_ACTIVATION_PLAN.md");
const moduleSource = readText("live-ready/localProjectCreationAdmission.js");
const admittedText = JSON.stringify(admitted);

const dangerousFlags = [
  "providerCallsAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "providerSpendAllowed",
];

addCheck("admitted envelope passes", admitted.ok === true && admitted.status === "PASS");
addCheck("admitted validation passes", validation.valid, validation.errors.join("; "));
addCheck("blocked validation passes as needs setup", blockedValidation.valid && blocked.data.projectCreationAllowed === false && blocked.data.readinessLabel === "Needs setup");
addCheck("unsafe projects root is rejected", unsafeValidation.valid === false && unsafeValidation.errors.some((error) => error.includes("generated-projects")));
addCheck("generated snake root admitted", admitted.data.targetRoot === "generated-projects/snake-ios" && admitted.data.projectCreationAllowed === true);
addCheck("new workspace writes only", admitted.data.newWorkspaceFileWritesAllowed === true && admitted.data.existingProjectMutationAllowed === false);
addCheck("runtime flags remain false", dangerousFlags.every((flag) => admitted.data[flag] === false));
addCheck("primary UX fields present", ["currentState", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"].every((field) => admittedText.includes(field)));
addCheck("project registry reused", moduleSource.includes("generateProjectProfile") && moduleSource.includes("generateProjectId"));
addCheck("mutation boundary reused", moduleSource.includes("createMutationBoundaryDecision"));
addCheck("no provider/tool/project source imports", !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/"));
addCheck("no fake unsafe runnable actions", !/deploy now|call provider now|spend now|mutate existing project/i.test(admittedText));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p831-local-project-creation-admission"]));
addCheck("contract references P83.1 files", contract.includes("live-ready/localProjectCreationAdmission.js") && contract.includes("check:p831-local-project-creation-admission"));
addCheck("docs mention P83.1 validation", docs.includes("P83.1 Local Project Creation Admission") && docs.includes("npm run check:p831-local-project-creation-admission"));
addCheck("phase status advanced", statusById.get("P83.1")?.status === "complete" && status.currentPhase === "P83.1" && status.nextPhase === "P83.2");
addCheck("report prerequisites exist", fileExists("reports/founder-snake-ios-test-report.md") && fileExists("reports/p827-final-validation-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P83.1 local project creation admission for Snake iOS.",
        "- Admits only `generated-projects/snake-ios` after approval gates are present.",
        "- Does not write project files, mutate existing projects, call providers/tools, start workers, write DB state, deploy, release, package, call networks, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Admission",
      body: [
        `- Target root: ${admitted.data.targetRoot}`,
        `- Project creation allowed: ${admitted.data.projectCreationAllowed ? "yes" : "no"}`,
        `- Existing project mutation allowed: ${admitted.data.existingProjectMutationAllowed ? "yes" : "no"}`,
        `- Next action: ${admitted.data.nextAction}`,
      ].join("\n"),
    },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p831-local-project-creation-admission",
        "- npm run check:p83-execution-plan",
        "- npm run check:p827-final-validation",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    { title: "Known Limitations", body: "- P83.1 admits local project creation but does not create app files. P83.2 plans the scaffold and P83.3 writes only the admitted generated workspace root." },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P83.1 Local Project Creation Admission Report", phase: "P83.1" },
);

printCheckReport("P83.1 Local Project Creation Admission Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
