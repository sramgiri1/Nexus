import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const REPORT_MD_PATH = path.join(ROOT, "reports/careloop-readiness-report.md");
const REPORT_JSON_PATH = path.join(ROOT, "reports/careloop-inventory.json");

const REQUIRED_MODULES = [
  "careloop-readiness/careloopInventory.js",
  "careloop-readiness/careloopIosInventory.js",
  "careloop-readiness/careloopReadiness.js",
  "careloop-readiness/index.js",
];

const REQUIRED_EXPORTS_INVENTORY = [
  "inventoryCareLoopBackend",
  "readPackageSummary",
  "detectCareLoopBackendStructure",
  "summarizeCareLoopBackendInventory",
];

const REQUIRED_EXPORTS_IOS = [
  "inventoryCareLoopIos",
  "detectCareLoopIosStructure",
  "summarizeCareLoopIosInventory",
];

const REQUIRED_EXPORTS_READINESS = [
  "buildCareLoopReadinessSnapshot",
  "evaluateBackendReadiness",
  "evaluateIosReadiness",
  "recommendNextCareLoopTask",
  "writeCareLoopReadinessReport",
];

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readFile(relativePath));
}

function getMetadata() {
  const metadata = { generatedAt: new Date().toISOString(), branch: "unknown", head: "unknown" };
  try {
    metadata.branch = execFileSync("git", ["branch", "--show-current"], { cwd: ROOT, encoding: "utf8" }).trim() || "unknown";
    metadata.head = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim() || "unknown";
  } catch { /* ignore */ }
  return metadata;
}

function statusLabel(pass) {
  return pass ? "PASS" : "FAIL";
}

function checkLongLines(relativePath) {
  if (!exists(relativePath)) return [];
  return readFile(relativePath)
    .split(/\r?\n/)
    .map((line, index) => ({ line: index + 1, length: line.length }))
    .filter((entry) => entry.length > 1000)
    .map((entry) => `${relativePath}:${entry.line} (${entry.length})`);
}

function writeReport(metadata, sections, failures) {
  const lines = [
    "# NEXUS CareLoop Readiness Check",
    "",
    "## Metadata",
    "",
    `- Generated at: ${metadata.generatedAt}`,
    `- Validation branch: ${metadata.branch}`,
    `- Validation HEAD: ${metadata.head}`,
    "- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Policy: ${statusLabel(sections.policy)}`,
    `Mode boundary: ${statusLabel(sections.modeBoundary)}`,
    `Inventory: ${statusLabel(sections.inventory)}`,
    `Readiness snapshot: ${statusLabel(sections.readinessSnapshot)}`,
    `Reports: ${statusLabel(sections.reports)}`,
    `Evidence/audit: ${statusLabel(sections.evidenceAudit)}`,
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
  fs.mkdirSync(path.dirname(REPORT_MD_PATH), { recursive: true });
  fs.writeFileSync(REPORT_MD_PATH, lines.join("\n"), "utf8");
}

function printConsole(sections, overallPass) {
  const lines = [
    "NEXUS CareLoop Readiness Check",
    "==============================",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Policy: ${statusLabel(sections.policy)}`,
    `Mode boundary: ${statusLabel(sections.modeBoundary)}`,
    `Inventory: ${statusLabel(sections.inventory)}`,
    `Readiness snapshot: ${statusLabel(sections.readinessSnapshot)}`,
    `Reports: ${statusLabel(sections.reports)}`,
    `Evidence/audit: ${statusLabel(sections.evidenceAudit)}`,
    `Public safety: ${statusLabel(sections.publicSafety)}`,
    `No forbidden changes: ${statusLabel(sections.noForbiddenChanges)}`,
    `Formatting/readability: ${statusLabel(sections.formattingReadability)}`,
    "",
    `Result: ${statusLabel(overallPass)}`,
  ];
  console.log(lines.join("\n"));
}

async function loadModules() {
  const modules = {};
  for (const relativePath of REQUIRED_MODULES) {
    modules[relativePath] = await import(
      `${pathToFileURL(path.join(ROOT, relativePath)).href}?t=${Date.now()}`
    );
  }
  return modules;
}

async function main() {
  const failures = [];
  const sections = {
    modules: true,
    exports: true,
    policy: true,
    modeBoundary: true,
    inventory: true,
    readinessSnapshot: true,
    reports: true,
    evidenceAudit: true,
    publicSafety: true,
    noForbiddenChanges: true,
    formattingReadability: true,
  };

  // 1. Required modules exist
  for (const relativePath of REQUIRED_MODULES) {
    if (!exists(relativePath)) {
      sections.modules = false;
      failures.push(`Missing required module: ${relativePath}`);
    }
  }

  // Load modules
  let modules = {};
  try {
    modules = await loadModules();
  } catch (error) {
    sections.modules = false;
    sections.exports = false;
    failures.push(`Failed to import careloop-readiness modules: ${error.message}`);
  }

  const indexModule = modules["careloop-readiness/index.js"] || {};
  const inventoryModule = modules["careloop-readiness/careloopInventory.js"] || {};
  const iosModule = modules["careloop-readiness/careloopIosInventory.js"] || {};
  const readinessModule = modules["careloop-readiness/careloopReadiness.js"] || {};

  // 2. Required exports
  for (const exportName of REQUIRED_EXPORTS_INVENTORY) {
    if (!(exportName in inventoryModule) || !(exportName in indexModule)) {
      sections.exports = false;
      failures.push(`Missing export: ${exportName}`);
    }
  }
  for (const exportName of REQUIRED_EXPORTS_IOS) {
    if (!(exportName in iosModule) || !(exportName in indexModule)) {
      sections.exports = false;
      failures.push(`Missing export: ${exportName}`);
    }
  }
  for (const exportName of REQUIRED_EXPORTS_READINESS) {
    if (!(exportName in readinessModule) || !(exportName in indexModule)) {
      sections.exports = false;
      failures.push(`Missing export: ${exportName}`);
    }
  }

  // 3. Policy
  let readinessPolicy = null;
  try {
    readinessPolicy = readJson("policy/careloop-readiness-policy.json");
  } catch (error) {
    sections.policy = false;
    failures.push(`Failed to parse careloop-readiness-policy.json: ${error.message}`);
  }

  if (readinessPolicy) {
    const requiredFlags = {
      providerCallsAllowed: false,
      networkCallsAllowed: false,
      dbAccessAllowed: false,
      apiServerAllowed: false,
      projectMutationAllowed: false,
      buildExecutionAllowed: false,
      testExecutionAllowed: false,
      sourceContentExtractionAllowed: false,
      publicDemoOutputAllowed: false,
      evidenceAllowed: true,
      auditAllowed: true,
    };
    for (const [key, expected] of Object.entries(requiredFlags)) {
      if (readinessPolicy[key] !== expected) {
        sections.policy = false;
        failures.push(`careloop-readiness-policy.json: ${key} should be ${expected}`);
      }
    }
    if (readinessPolicy.modeRequired !== "local-private") {
      sections.policy = false;
      failures.push("careloop-readiness-policy.json: modeRequired should be local-private");
    }
    const projectIds = readinessPolicy.projectIds ?? [];
    if (!projectIds.includes("careloop") || !projectIds.includes("careloop-ios")) {
      sections.policy = false;
      failures.push("careloop-readiness-policy.json: missing required projectIds");
    }
  }

  // 4. Mode boundary
  if (inventoryModule.inventoryCareLoopBackend) {
    const demoResult = inventoryModule.inventoryCareLoopBackend({ mode: "demo" });
    if (demoResult.exists !== false || demoResult.errors.length === 0) {
      sections.modeBoundary = false;
      failures.push("Demo mode must block CareLoop backend inventory.");
    }

    const lpResult = inventoryModule.inventoryCareLoopBackend({ mode: "local-private" });
    if (lpResult.errors.length > 0 && !lpResult.warnings.length && !lpResult.exists) {
      const hasAccessError = lpResult.errors.some((e) => e.includes("Access denied") || e.includes("does not allow"));
      if (hasAccessError) {
        sections.modeBoundary = false;
        failures.push("local-private mode should allow CareLoop backend inventory.");
      }
    }
  }

  if (readinessModule.buildCareLoopReadinessSnapshot) {
    const demoSnap = readinessModule.buildCareLoopReadinessSnapshot({ mode: "demo" });
    if (
      demoSnap.backend?.errors?.length === 0 &&
      demoSnap.ios?.errors?.length === 0 &&
      demoSnap.readiness?.overall !== "BLOCKED"
    ) {
      sections.modeBoundary = false;
      failures.push("Demo mode snapshot should have access errors.");
    }
  }

  // 5. Inventory
  if (inventoryModule.inventoryCareLoopBackend) {
    const testResult = inventoryModule.inventoryCareLoopBackend({ mode: "test" });

    if (testResult.package?.exists) {
      if (!Array.isArray(testResult.package.scripts)) {
        sections.inventory = false;
        failures.push("Backend package.scripts must be an array.");
      }
      if (!Array.isArray(testResult.package.dependencies)) {
        sections.inventory = false;
        failures.push("Backend package.dependencies must be an array.");
      }
    }

    const allStrings = (arr) => Array.isArray(arr) && arr.every((x) => typeof x === "string");
    if (
      testResult.package?.exists &&
      (!allStrings(testResult.package.scripts) ||
        !allStrings(testResult.package.dependencies))
    ) {
      sections.inventory = false;
      failures.push("Backend package fields must contain strings only.");
    }

    if (typeof testResult.structure?.src !== "boolean") {
      sections.inventory = false;
      failures.push("Backend structure fields must be booleans.");
    }
  }

  if (iosModule.inventoryCareLoopIos) {
    const testResult = iosModule.inventoryCareLoopIos({ mode: "test" });
    if (typeof testResult.exists !== "boolean") {
      sections.inventory = false;
      failures.push("iOS inventory must return exists boolean.");
    }
    if (typeof testResult.iosProject !== "object" || testResult.iosProject === null) {
      sections.inventory = false;
      failures.push("iOS inventory must return iosProject object.");
    }
  }

  // 6. Readiness snapshot
  if (readinessModule.buildCareLoopReadinessSnapshot) {
    const snap = readinessModule.buildCareLoopReadinessSnapshot({ mode: "test" });

    if (snap.snapshotVersion !== "1.0") {
      sections.readinessSnapshot = false;
      failures.push("Snapshot snapshotVersion must be '1.0'.");
    }
    if (snap.readOnly !== true) {
      sections.readinessSnapshot = false;
      failures.push("Snapshot readOnly must be true.");
    }
    if (snap.mode !== "test") {
      sections.readinessSnapshot = false;
      failures.push("Snapshot mode should reflect input mode.");
    }
    if (!snap.safety || typeof snap.safety !== "object") {
      sections.readinessSnapshot = false;
      failures.push("Snapshot must have safety flags object.");
    } else {
      const safetyFlags = ["providerCalls", "projectMutation", "buildExecuted", "testExecuted", "dbAccess", "apiServer"];
      for (const flag of safetyFlags) {
        if (snap.safety[flag] !== false) {
          sections.readinessSnapshot = false;
          failures.push(`Snapshot safety.${flag} must be false.`);
        }
      }
    }
    if (!snap.recommendedNextTask || typeof snap.recommendedNextTask !== "object") {
      sections.readinessSnapshot = false;
      failures.push("Snapshot must have recommendedNextTask.");
    } else if (snap.recommendedNextTask.mutationAllowed !== false) {
      sections.readinessSnapshot = false;
      failures.push("Snapshot recommendedNextTask.mutationAllowed must be false.");
    }
    if (!snap.readiness || !snap.readiness.backend || !snap.readiness.ios || !snap.readiness.overall) {
      sections.readinessSnapshot = false;
      failures.push("Snapshot readiness must have backend, ios, and overall fields.");
    }
  }

  // 7. Reports
  if (!fs.existsSync(REPORT_MD_PATH)) {
    sections.reports = false;
    failures.push("reports/careloop-readiness-report.md does not exist.");
  } else {
    const reportContent = fs.readFileSync(REPORT_MD_PATH, "utf8");
    if (!/Validation HEAD/.test(reportContent)) {
      sections.reports = false;
      failures.push("careloop-readiness-report.md must include 'Validation HEAD' metadata line.");
    }
    const secretPatterns = [/sk-[A-Za-z0-9]{10,}/, /sk-ant-[A-Za-z0-9_-]{6,}/, /ANTHROPIC_API_KEY=/, /DATABASE_URL=/];
    for (const pattern of secretPatterns) {
      if (pattern.test(reportContent)) {
        sections.reports = false;
        failures.push("careloop-readiness-report.md contains secret-like content.");
      }
    }
  }

  if (!fs.existsSync(REPORT_JSON_PATH)) {
    sections.reports = false;
    failures.push("reports/careloop-inventory.json does not exist.");
  } else {
    try {
      const jsonData = readJson("reports/careloop-inventory.json");
      if (!jsonData.snapshotVersion || !jsonData.readOnly) {
        sections.reports = false;
        failures.push("careloop-inventory.json missing required fields.");
      }
    } catch {
      sections.reports = false;
      failures.push("careloop-inventory.json is not valid JSON.");
    }
  }

  // 8. Evidence/audit — best-effort check
  const evidencePath = path.join(ROOT, "local-state/runtime/evidence.jsonl");
  const auditPath = path.join(ROOT, "local-state/runtime/audit.jsonl");
  for (const runtimePath of [evidencePath, auditPath]) {
    if (fs.existsSync(runtimePath)) {
      const lines = fs.readFileSync(runtimePath, "utf8").trim().split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const record = JSON.parse(line);
          if (record.type === "private_project_inventory" || record.eventType === "private_project_inventory_completed") {
            if (record.redacted !== true) {
              sections.evidenceAudit = false;
              failures.push(`Evidence/audit record of type private_project_inventory must have redacted: true`);
            }
          }
        } catch { /* ignore malformed lines */ }
      }
    }
  }

  // 9. Public safety
  try {
    execFileSync("node", ["scripts/check-public-safety.js"], { cwd: ROOT, encoding: "utf8", stdio: "pipe" });
  } catch {
    sections.publicSafety = false;
    failures.push("check:public-safety failed — CareLoop references detected in public surfaces.");
  }

  // 10. No forbidden changes
  const projectDiff = execFileSync(
    "git",
    ["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"],
    { cwd: ROOT, encoding: "utf8" }
  ).trim();
  if (projectDiff) {
    sections.noForbiddenChanges = false;
    failures.push("Private project files were modified.");
  }

  const forbiddenDiff = execFileSync(
    "git",
    ["diff", "--name-only", "--", "agents", "orchestrator/loop.js", "orchestrator/runner.js", "tools", "skills", "providers", "contracts", "state-machine", "config", "memory"],
    { cwd: ROOT, encoding: "utf8" }
  ).trim();
  if (forbiddenDiff) {
    sections.noForbiddenChanges = false;
    failures.push("Forbidden paths were modified.");
  }

  const packageJson = readJson("package.json");
  if (packageJson.scripts?.["careloop:inventory"] !== "NEXUS_MODE=local-private node scripts/careloop-inventory.js") {
    sections.modules = false;
    failures.push("package.json is missing careloop:inventory script.");
  }
  if (packageJson.scripts?.["check:careloop-readiness"] !== "node scripts/check-careloop-readiness.js") {
    sections.modules = false;
    failures.push("package.json is missing check:careloop-readiness script.");
  }

  // 11. Formatting/readability
  const filesToCheck = [
    ...REQUIRED_MODULES,
    "scripts/careloop-inventory.js",
    "scripts/check-careloop-readiness.js",
    "policy/careloop-readiness-policy.json",
    "docs/architecture/CARELOOP_LOCAL_READINESS.md",
    "reports/careloop-readiness-report.md",
    "reports/careloop-inventory.json",
  ];
  for (const relativePath of filesToCheck) {
    const longLines = checkLongLines(relativePath);
    if (longLines.length > 0) {
      sections.formattingReadability = false;
      failures.push(...longLines.map((entry) => `Line exceeds 1000 chars: ${entry}`));
    }
  }

  const metadata = getMetadata();
  const overallPass = failures.length === 0;
  writeReport(metadata, sections, failures);
  printConsole(sections, overallPass);
  process.exit(overallPass ? 0 : 1);
}

main();
