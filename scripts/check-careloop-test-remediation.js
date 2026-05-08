import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();

const REQUIRED_MODULES = [
  "careloop-readiness/careloopTestFailureAnalysis.js",
  "careloop-readiness/careloopRemediationPlan.js",
];

const REQUIRED_ANALYSIS_EXPORTS = [
  "analyzeCompletionInsightsFailure",
  "locateFailingTestContext",
  "locateCompletionInsightsRoute",
  "inspectCompletionInsightsQuery",
  "classifyCompletionInsightsFailure",
  "writeCompletionInsightsFailureReports",
];

const REQUIRED_PLAN_EXPORTS = [
  "buildCompletionInsightsRemediationPlan",
  "createCompletionInsightsRemediationContract",
  "optionallyApplyCompletionInsightsFix",
  "writeCompletionInsightsRemediationReports",
];

const RUNTIME_FILES = [
  "local-state/runtime/tasks.json",
  "local-state/runtime/evidence.jsonl",
  "local-state/runtime/audit.jsonl",
  "local-state/runtime/events.jsonl",
];

function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }
function readFile(rel) { return fs.readFileSync(path.join(ROOT, rel), "utf8"); }
function readJson(rel) { return JSON.parse(readFile(rel)); }

function snapshotRuntimeFiles() {
  const snap = {};
  for (const rel of RUNTIME_FILES) {
    const abs = path.join(ROOT, rel);
    snap[rel] = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
  }
  return snap;
}

function restoreRuntimeFiles(snap) {
  for (const [rel, content] of Object.entries(snap)) {
    const abs = path.join(ROOT, rel);
    if (content === null) { if (fs.existsSync(abs)) fs.unlinkSync(abs); }
    else { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, content, "utf8"); }
  }
}

function snapshotProjectTree(projectRoot) {
  const absRoot = path.join(ROOT, projectRoot);
  if (!fs.existsSync(absRoot)) return {};
  const paths = {};
  function walk(dir, relBase) {
    let entries; try { entries = fs.readdirSync(dir); } catch { return; }
    for (const entry of entries) {
      if (entry === "node_modules" || entry === ".git") continue;
      const relPath = relBase ? `${relBase}/${entry}` : entry;
      const fullPath = path.join(dir, entry);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) walk(fullPath, relPath);
        else paths[relPath] = { size: stat.size, mtime: stat.mtimeMs };
      } catch { /* ignore */ }
    }
  }
  walk(absRoot, "");
  return paths;
}

function getMetadata() {
  const meta = { generatedAt: new Date().toISOString(), branch: "unknown", head: "unknown" };
  try {
    meta.branch = execFileSync("git", ["branch", "--show-current"], { cwd: ROOT, encoding: "utf8" }).trim() || "unknown";
    meta.head = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim() || "unknown";
  } catch { /* ignore */ }
  return meta;
}

function statusLabel(pass) { return pass ? "PASS" : "FAIL"; }

function checkLongLines(rel) {
  if (!exists(rel)) return [];
  return readFile(rel).split(/\r?\n/)
    .map((line, i) => ({ line: i + 1, length: line.length }))
    .filter((e) => e.length > 1000)
    .map((e) => `${rel}:${e.line} (${e.length})`);
}

function writeReport(meta, sections, failures) {
  const reportPath = path.join(ROOT, "reports/careloop-test-remediation-check.md");
  const lines = [
    "# NEXUS CareLoop Test Remediation Check",
    "",
    "## Metadata",
    "",
    `- Generated at: ${meta.generatedAt}`,
    `- Validation branch: ${meta.branch}`,
    `- Validation HEAD: ${meta.head}`,
    "- Note: Validation HEAD is the commit checked out when the report was generated.",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Policy: ${statusLabel(sections.policy)}`,
    `Contract: ${statusLabel(sections.contract)}`,
    `Failure analysis: ${statusLabel(sections.failureAnalysis)}`,
    `Remediation plan: ${statusLabel(sections.remediationPlan)}`,
    `Governed local path: ${statusLabel(sections.governedLocalPath)}`,
    `Optional fix safety: ${statusLabel(sections.optionalFixSafety)}`,
    `Public safety: ${statusLabel(sections.publicSafety)}`,
    `No forbidden changes: ${statusLabel(sections.noForbiddenChanges)}`,
    `Formatting/readability: ${statusLabel(sections.formattingReadability)}`,
    "",
    "## Failures",
    "",
    ...(failures.length ? failures.map((f) => `- ${f}`) : ["- None"]),
    "",
    `Result: ${statusLabel(failures.length === 0)}`,
    "",
  ];
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, lines.join("\n"), "utf8");
}

function printConsole(sections, overallPass) {
  console.log([
    "NEXUS CareLoop Test Remediation Check",
    "====================================",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Policy: ${statusLabel(sections.policy)}`,
    `Contract: ${statusLabel(sections.contract)}`,
    `Failure analysis: ${statusLabel(sections.failureAnalysis)}`,
    `Remediation plan: ${statusLabel(sections.remediationPlan)}`,
    `Governed local path: ${statusLabel(sections.governedLocalPath)}`,
    `Optional fix safety: ${statusLabel(sections.optionalFixSafety)}`,
    `Public safety: ${statusLabel(sections.publicSafety)}`,
    `No forbidden changes: ${statusLabel(sections.noForbiddenChanges)}`,
    `Formatting/readability: ${statusLabel(sections.formattingReadability)}`,
    "",
    `Result: ${statusLabel(overallPass)}`,
  ].join("\n"));
}

async function main() {
  const failures = [];
  const sections = {
    modules: true, exports: true, policy: true, contract: true,
    failureAnalysis: true, remediationPlan: true, governedLocalPath: true,
    optionalFixSafety: true, publicSafety: true, noForbiddenChanges: true,
    formattingReadability: true,
  };

  // 1. Modules
  for (const rel of REQUIRED_MODULES) {
    if (!exists(rel)) { sections.modules = false; failures.push(`Missing module: ${rel}`); }
  }
  const pkg = readJson("package.json");
  if (pkg.scripts?.["careloop:analyze-test-failure"] !==
    "NEXUS_MODE=local-private node scripts/careloop-analyze-test-failure.js") {
    sections.modules = false;
    failures.push("package.json missing careloop:analyze-test-failure script.");
  }
  if (pkg.scripts?.["check:careloop-test-remediation"] !==
    "node scripts/check-careloop-test-remediation.js") {
    sections.modules = false;
    failures.push("package.json missing check:careloop-test-remediation script.");
  }

  // 2. Exports
  let analysisModule = {}, planModule = {};
  try {
    analysisModule = await import(`${pathToFileURL(path.join(ROOT, "careloop-readiness/careloopTestFailureAnalysis.js")).href}?t=${Date.now()}`);
    planModule = await import(`${pathToFileURL(path.join(ROOT, "careloop-readiness/careloopRemediationPlan.js")).href}?t=${Date.now()}`);
  } catch (err) {
    sections.modules = false; sections.exports = false;
    failures.push(`Failed to import modules: ${err.message}`);
  }
  for (const name of REQUIRED_ANALYSIS_EXPORTS) {
    if (!(name in analysisModule)) { sections.exports = false; failures.push(`Missing export: ${name} from careloopTestFailureAnalysis.js`); }
  }
  for (const name of REQUIRED_PLAN_EXPORTS) {
    if (!(name in planModule)) { sections.exports = false; failures.push(`Missing export: ${name} from careloopRemediationPlan.js`); }
  }

  // 3. Policy
  if (!exists("policy/careloop-test-remediation-policy.json")) {
    sections.policy = false; failures.push("Missing policy: policy/careloop-test-remediation-policy.json");
  } else {
    try {
      const pol = readJson("policy/careloop-test-remediation-policy.json");
      const polChecks = {
        modeRequired: "local-private", mutationAllowed: true, mutationScope: "narrow_fix_only",
        testExecutionAllowed: true, providerCallsAllowed: false, networkCallsAllowed: false,
        dbAccessAllowed: false, dependencyInstallAllowed: false, migrationAllowed: false,
        requiresFailureAnalysis: true, requiresRemediationPlan: true,
      };
      for (const [k, v] of Object.entries(polChecks)) {
        if (pol[k] !== v) { sections.policy = false; failures.push(`Policy: ${k} should be ${JSON.stringify(v)}, got ${JSON.stringify(pol[k])}`); }
      }
    } catch { sections.policy = false; failures.push("Invalid JSON: policy/careloop-test-remediation-policy.json"); }
  }

  // 4. Contract
  const contractPath = "contracts/careloop/completion-insights-remediation-contract.json";
  if (!exists(contractPath)) {
    sections.contract = false; failures.push(`Missing contract: ${contractPath}`);
  } else {
    try {
      const c = readJson(contractPath);
      if (c.testExecutionAllowed !== true) { sections.contract = false; failures.push("Contract: testExecutionAllowed must be true"); }
      if (c.mutationAllowed !== true) { sections.contract = false; failures.push("Contract: mutationAllowed must be true"); }
      if (c.mutationScope !== "narrow_fix_only") { sections.contract = false; failures.push("Contract: mutationScope must be narrow_fix_only"); }
      if (c.capabilityId !== "implementation.backend_code") { sections.contract = false; failures.push("Contract: capabilityId must be implementation.backend_code"); }
    } catch { sections.contract = false; failures.push("Invalid JSON in contract."); }
  }

  // 5. Failure analysis report
  const analysisJsonPath = "reports/careloop-test-failure-analysis.json";
  const analysisMdPath = "reports/careloop-test-failure-analysis.md";
  if (!exists(analysisJsonPath)) {
    sections.failureAnalysis = false; failures.push("Missing: reports/careloop-test-failure-analysis.json");
  } else {
    try {
      const a = readJson(analysisJsonPath);
      if (!a.failure?.route?.includes("completion")) { sections.failureAnalysis = false; failures.push("Analysis JSON: must reference completion route"); }
      if (a.failure?.expected !== 2 || a.failure?.actual !== 0) { sections.failureAnalysis = false; failures.push("Analysis JSON: expected 2 actual 0"); }
      if (!a.rootCauseCategory) { sections.failureAnalysis = false; failures.push("Analysis JSON: rootCauseCategory missing"); }
      if (!a.confidence) { sections.failureAnalysis = false; failures.push("Analysis JSON: confidence missing"); }
      if (!Array.isArray(a.suspectFiles)) { sections.failureAnalysis = false; failures.push("Analysis JSON: suspectFiles must be array"); }
    } catch { sections.failureAnalysis = false; failures.push("Invalid JSON: reports/careloop-test-failure-analysis.json"); }
  }
  if (!exists(analysisMdPath)) {
    sections.failureAnalysis = false; failures.push("Missing: reports/careloop-test-failure-analysis.md");
  } else {
    const md = readFile(analysisMdPath);
    if (!md.includes("completion")) { sections.failureAnalysis = false; failures.push("Analysis MD: must reference completion"); }
    if (!md.includes("Validation HEAD")) { sections.failureAnalysis = false; failures.push("Analysis MD: must include Validation HEAD"); }
  }

  // 6. Remediation plan report
  const planJsonPath = "reports/careloop-remediation-plan.json";
  const planMdPath = "reports/careloop-remediation-plan.md";
  if (!exists(planJsonPath)) {
    sections.remediationPlan = false; failures.push("Missing: reports/careloop-remediation-plan.json");
  } else {
    try {
      const p = readJson(planJsonPath);
      if (!p.strategy) { sections.remediationPlan = false; failures.push("Plan JSON: strategy missing"); }
      if (!p.recommendedNextStep) { sections.remediationPlan = false; failures.push("Plan JSON: recommendedNextStep missing"); }
      const safety = p.safety ?? {};
      for (const flag of ["providerCalls", "networkCalls", "dbAccess", "apiServer", "dependencyInstall", "migration"]) {
        if (safety[flag] !== false) { sections.remediationPlan = false; failures.push(`Plan JSON: safety.${flag} must be false`); }
      }
    } catch { sections.remediationPlan = false; failures.push("Invalid JSON: reports/careloop-remediation-plan.json"); }
  }
  if (!exists(planMdPath)) {
    sections.remediationPlan = false; failures.push("Missing: reports/careloop-remediation-plan.md");
  } else {
    const pmd = readFile(planMdPath);
    if (!pmd.includes("Strategy") && !pmd.includes("strategy")) {
      sections.remediationPlan = false; failures.push("Plan MD: must include strategy");
    }
    if (!pmd.includes("Validation HEAD")) { sections.remediationPlan = false; failures.push("Plan MD: must include Validation HEAD"); }
  }

  // 7. Governed local path — snapshot/restore
  const runtimeSnap = snapshotRuntimeFiles();
  try {
    const projectSnap = snapshotProjectTree("projects/careloop");
    if (analysisModule.analyzeCompletionInsightsFailure) {
      const testResult = analysisModule.analyzeCompletionInsightsFailure({ env: { NEXUS_MODE: "demo" } });
      if (testResult.ok !== false || !testResult.errors?.length) {
        sections.governedLocalPath = false; failures.push("Demo mode must block test failure analysis.");
      }
    }

    const tasksPath = path.join(ROOT, "local-state/runtime/tasks.json");
    if (fs.existsSync(tasksPath)) {
      try {
        const tasks = JSON.parse(fs.readFileSync(tasksPath, "utf8"));
        const remediationTasks = (tasks.tasks ?? []).filter(
          (t) => t.taskType === "test_failure_remediation" || t.projectId === "private-project-01"
        );
        if (remediationTasks.length === 0) {
          sections.governedLocalPath = false; failures.push("No test_failure_remediation task in local task store.");
        }
      } catch { sections.governedLocalPath = false; failures.push("tasks.json is not valid JSON."); }
    } else {
      sections.governedLocalPath = false; failures.push("local-state/runtime/tasks.json does not exist.");
    }

    for (const runtimeRel of ["local-state/runtime/evidence.jsonl", "local-state/runtime/audit.jsonl", "local-state/runtime/events.jsonl"]) {
      if (!exists(runtimeRel)) { sections.governedLocalPath = false; failures.push(`Missing: ${runtimeRel}`); continue; }
      const lines = readFile(runtimeRel).trim().split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const rec = JSON.parse(line);
          if (
            rec.type === "failure_analysis" ||
            rec.eventType === "test_failure_analysis_completed" ||
            rec.eventType === "governed_test_failure_analysis_completed"
          ) {
            if (rec.redacted !== true) {
              sections.governedLocalPath = false; failures.push("Runtime record of test failure analysis must have redacted: true");
            }
          }
        } catch { /* ignore */ }
      }
    }

    const projectAfter = snapshotProjectTree("projects/careloop");
    const added = Object.keys(projectAfter).filter((k) => !(k in projectSnap));
    const removed = Object.keys(projectSnap).filter((k) => !(k in projectAfter));
    const changed = Object.keys(projectSnap).filter((k) => k in projectAfter && projectAfter[k].mtime !== projectSnap[k].mtime);
    if (added.length > 0 || removed.length > 0 || changed.length > 0) {
      sections.optionalFixSafety = false;
      failures.push(`Checker must not mutate private project: added=${added.length}, removed=${removed.length}, changed=${changed.length}`);
    }
  } finally {
    restoreRuntimeFiles(runtimeSnap);
  }

  // 8. Optional fix safety — check if any backend files outside allowed roots are modified
  const projectDiff = execFileSync("git", ["diff", "--name-only", "--", "projects/careloop"], { cwd: ROOT, encoding: "utf8" }).trim();
  if (projectDiff) {
    const allowedRoots = ["projects/careloop/src/", "projects/careloop/test/"];
    const changedFiles = projectDiff.split("\n").filter(Boolean);
    const outOfScope = changedFiles.filter((f) => !allowedRoots.some((r) => f.startsWith(r)));
    if (outOfScope.length > 0) {
      sections.optionalFixSafety = false;
      failures.push(`Private project files changed outside allowed roots: ${outOfScope.join(", ")}`);
    }
    // Schema/deps changes are never allowed
    const schemaOrDeps = changedFiles.filter((f) => f.includes("schema.prisma") || f.includes("package.json") || f.includes("package-lock.json"));
    if (schemaOrDeps.length > 0) {
      sections.optionalFixSafety = false;
      failures.push(`Schema or dependency files must not be changed: ${schemaOrDeps.join(", ")}`);
    }
  }
  const iosDiff = execFileSync("git", ["diff", "--name-only", "--", "projects/careloop-ios"], { cwd: ROOT, encoding: "utf8" }).trim();
  if (iosDiff) { sections.optionalFixSafety = false; failures.push("projects/careloop-ios must not be modified."); }

  // 9. Public safety
  try {
    execFileSync("node", ["scripts/check-public-safety.js"], { cwd: ROOT, encoding: "utf8", stdio: "pipe" });
  } catch { sections.publicSafety = false; failures.push("check:public-safety failed."); }

  // 10. No forbidden changes
  const forbiddenDiff = execFileSync(
    "git", ["diff", "--name-only", "--", "agents", "orchestrator/loop.js", "orchestrator/runner.js", "tools", "skills", "providers", "state-machine", "config", "memory"],
    { cwd: ROOT, encoding: "utf8" }
  ).trim();
  if (forbiddenDiff) {
    sections.noForbiddenChanges = false;
    failures.push(`Forbidden paths modified: ${forbiddenDiff}`);
  }

  // 11. Formatting/readability
  const filesToCheck = [
    "careloop-readiness/careloopTestFailureAnalysis.js",
    "careloop-readiness/careloopRemediationPlan.js",
    "scripts/careloop-analyze-test-failure.js",
    "scripts/check-careloop-test-remediation.js",
    "policy/careloop-test-remediation-policy.json",
    "contracts/careloop/completion-insights-remediation-contract.json",
    "docs/architecture/CARELOOP_TEST_FAILURE_REMEDIATION.md",
    "reports/careloop-test-failure-analysis.md",
    "reports/careloop-test-failure-analysis.json",
    "reports/careloop-remediation-plan.md",
    "reports/careloop-remediation-plan.json",
  ];
  for (const rel of filesToCheck) {
    for (const entry of checkLongLines(rel)) {
      sections.formattingReadability = false; failures.push(`Line exceeds 1000 chars: ${entry}`);
    }
  }

  const meta = getMetadata();
  const overallPass = failures.length === 0;
  writeReport(meta, sections, failures);
  printConsole(sections, overallPass);
  process.exit(overallPass ? 0 : 1);
}

main();
