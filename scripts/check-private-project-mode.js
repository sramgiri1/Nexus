import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports/private-project-mode-report.md");
const REQUIRED_MODULES = [
  "private-mode/privateMode.js",
  "private-mode/privateProjectPolicy.js",
  "private-mode/privateProjectScanner.js",
  "private-mode/index.js",
];
const REQUIRED_DOCS = [
  "docs/architecture/PRIVATE_PROJECT_MODE.md",
  "docs/architecture/PUBLIC_PRIVATE_MODE_BOUNDARY.md",
];
const REQUIRED_POLICIES = [
  "policy/private-project-mode-policy.json",
  "policy/private-project-allowlist.json",
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
  const metadata = {
    generatedAt: new Date().toISOString(),
    branch: "unknown",
    head: "unknown",
  };

  try {
    metadata.branch = execFileSync("git", ["branch", "--show-current"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim() || "unknown";
    metadata.head = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim() || "unknown";
  } catch {
    // Ignore git metadata failures.
  }

  return metadata;
}

function statusLabel(pass) {
  return pass ? "PASS" : "FAIL";
}

function checkLongLines(relativePath) {
  return readFile(relativePath)
    .split(/\r?\n/)
    .map((line, index) => ({ line: index + 1, length: line.length }))
    .filter((entry) => entry.length > 1000)
    .map((entry) => `${relativePath}:${entry.line} (${entry.length})`);
}

function writeReport(metadata, sections, failures) {
  const lines = [
    "# NEXUS Private Project Mode Check",
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
    `Mode resolution: ${statusLabel(sections.modeResolution)}`,
    `Access rules: ${statusLabel(sections.accessRules)}`,
    `Scanner behavior: ${statusLabel(sections.scannerBehavior)}`,
    `Public safety integration: ${statusLabel(sections.publicSafetyIntegration)}`,
    `Repo safety: ${statusLabel(sections.repoSafety)}`,
    `Formatting/readability: ${statusLabel(sections.formattingReadability)}`,
    "",
    "## Failures",
    "",
    ...(failures.length ? failures.map((failure) => `- ${failure}`) : ["- None"]),
    "",
    `Result: ${statusLabel(failures.length === 0)}`,
    "",
  ];

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf8");
}

function printConsole(sections, overallPass) {
  const lines = [
    "NEXUS Private Project Mode Check",
    "================================",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Policy: ${statusLabel(sections.policy)}`,
    `Mode resolution: ${statusLabel(sections.modeResolution)}`,
    `Access rules: ${statusLabel(sections.accessRules)}`,
    `Scanner behavior: ${statusLabel(sections.scannerBehavior)}`,
    `Public safety integration: ${statusLabel(sections.publicSafetyIntegration)}`,
    `Repo safety: ${statusLabel(sections.repoSafety)}`,
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
    modeResolution: true,
    accessRules: true,
    scannerBehavior: true,
    publicSafetyIntegration: true,
    repoSafety: true,
    formattingReadability: true,
  };

  for (const relativePath of [...REQUIRED_MODULES, ...REQUIRED_DOCS, ...REQUIRED_POLICIES]) {
    if (!exists(relativePath)) {
      failures.push(`Missing required file: ${relativePath}`);
      if (REQUIRED_MODULES.includes(relativePath)) {
        sections.modules = false;
      } else if (REQUIRED_POLICIES.includes(relativePath)) {
        sections.policy = false;
      }
    }
  }

  let modules = {};
  try {
    modules = await loadModules();
  } catch (error) {
    sections.modules = false;
    sections.exports = false;
    failures.push(`Failed to import private-mode modules: ${error.message}`);
  }

  const privateModeModule = modules["private-mode/privateMode.js"] || {};
  const privatePolicyModule = modules["private-mode/privateProjectPolicy.js"] || {};
  const privateScannerModule = modules["private-mode/privateProjectScanner.js"] || {};
  const indexModule = modules["private-mode/index.js"] || {};

  for (const exportName of [
    "getNexusMode",
    "isPublicMode",
    "isDemoMode",
    "isLocalPrivateMode",
    "requireLocalPrivateMode",
  ]) {
    if (!(exportName in privateModeModule) || !(exportName in indexModule)) {
      sections.exports = false;
      failures.push(`Missing export ${exportName}.`);
    }
  }

  for (const exportName of [
    "loadPrivateProjectAllowlist",
    "isPrivateProjectAllowed",
    "isPrivatePathAllowed",
    "validatePrivateProjectAccess",
  ]) {
    if (!(exportName in privatePolicyModule) || !(exportName in indexModule)) {
      sections.exports = false;
      failures.push(`Missing export ${exportName}.`);
    }
  }

  for (const exportName of [
    "scanPrivateProjectBoundary",
    "listAllowedPrivateProjects",
    "validateNoPrivateLeakageInPublicMode",
  ]) {
    if (!(exportName in privateScannerModule) || !(exportName in indexModule)) {
      sections.exports = false;
      failures.push(`Missing export ${exportName}.`);
    }
  }

  let modePolicy = null;
  let allowlistPolicy = null;
  try {
    modePolicy = readJson("policy/private-project-mode-policy.json");
    allowlistPolicy = readJson("policy/private-project-allowlist.json");
  } catch (error) {
    sections.policy = false;
    failures.push(`Failed to parse private-mode policies: ${error.message}`);
  }

  if (modePolicy) {
    if (
      modePolicy.defaultMode !== "demo" ||
      modePolicy.publicModePrivateProjectAccess !== "deny" ||
      modePolicy.demoModePrivateProjectAccess !== "deny" ||
      modePolicy.localPrivateModePrivateProjectAccess !== "allow_with_allowlist" ||
      modePolicy.providerCallsAllowed !== false ||
      modePolicy.dbAccessAllowed !== false ||
      modePolicy.apiServerAllowed !== false ||
      modePolicy.projectMutationAllowed !== false ||
      modePolicy.publicSafetyMustRemainStrict !== true
    ) {
      sections.policy = false;
      failures.push("private-project-mode-policy.json does not match required values.");
    }
  }

  if (allowlistPolicy) {
    const allowlistedIds = Array.isArray(allowlistPolicy.projects)
      ? allowlistPolicy.projects.map((entry) => entry.projectId)
      : [];
    if (
      !allowlistedIds.includes("careloop") ||
      !allowlistedIds.includes("careloop-ios")
    ) {
      sections.policy = false;
      failures.push("private-project-allowlist.json is missing required project roots.");
    }
  }

  if (privateModeModule.getNexusMode) {
    const { getNexusMode, isPublicMode, isDemoMode, isLocalPrivateMode, requireLocalPrivateMode } =
      privateModeModule;

    if (getNexusMode({}) !== "demo") {
      sections.modeResolution = false;
      failures.push("Default mode must resolve to demo.");
    }
    if (getNexusMode({ NEXUS_MODE: "public" }) !== "public") {
      sections.modeResolution = false;
      failures.push("public mode did not resolve correctly.");
    }
    if (getNexusMode({ NEXUS_MODE: "local-private" }) !== "local-private") {
      sections.modeResolution = false;
      failures.push("local-private mode did not resolve correctly.");
    }
    if (getNexusMode({ NEXUS_MODE: "unknown-mode" }) !== "demo") {
      sections.modeResolution = false;
      failures.push("Unknown mode must fail closed to demo.");
    }
    if (!isPublicMode("public") || !isDemoMode("demo") || !isLocalPrivateMode("local-private")) {
      sections.modeResolution = false;
      failures.push("Mode helper predicates returned unexpected values.");
    }
    if (requireLocalPrivateMode("demo").ok !== false) {
      sections.modeResolution = false;
      failures.push("requireLocalPrivateMode must reject demo mode.");
    }
  }

  if (privatePolicyModule.validatePrivateProjectAccess) {
    const {
      loadPrivateProjectAllowlist,
      isPrivateProjectAllowed,
      isPrivatePathAllowed,
      validatePrivateProjectAccess,
    } = privatePolicyModule;

    const allowlist = loadPrivateProjectAllowlist();
    if (!allowlist.ok) {
      sections.accessRules = false;
      failures.push("Could not load private project allowlist.");
    }

    if (isPrivateProjectAllowed("careloop", "demo")) {
      sections.accessRules = false;
      failures.push("Demo mode must not allow private project access.");
    }
    if (!isPrivateProjectAllowed("careloop", "local-private")) {
      sections.accessRules = false;
      failures.push("local-private mode must allow careloop inventory/read access.");
    }
    if (!isPrivatePathAllowed("projects/careloop", "local-private")) {
      sections.accessRules = false;
      failures.push("Allowlisted careloop root should be accessible in local-private mode.");
    }
    if (isPrivatePathAllowed("projects/shiftpay", "local-private")) {
      sections.accessRules = false;
      failures.push("Non-allowlisted private project roots must stay blocked.");
    }

    const deniedWrite = validatePrivateProjectAccess({
      projectId: "careloop",
      relativePath: "projects/careloop",
      mode: "local-private",
      purpose: "write",
      actor: "nexus",
    });
    if (deniedWrite.allowed) {
      sections.accessRules = false;
      failures.push("Write access must remain denied in this phase.");
    }

    const allowedRead = validatePrivateProjectAccess({
      projectId: "careloop",
      relativePath: "projects/careloop",
      mode: "local-private",
      purpose: "read",
      actor: "nexus",
    });
    if (!allowedRead.allowed) {
      sections.accessRules = false;
      failures.push("Allowlisted local-private read access should be allowed.");
    }

    const blockedSecretPath = validatePrivateProjectAccess({
      projectId: "careloop",
      relativePath: "projects/careloop/.env",
      mode: "local-private",
      purpose: "read",
      actor: "system",
    });
    if (blockedSecretPath.allowed) {
      sections.accessRules = false;
      failures.push("Secret-like private paths must stay blocked.");
    }
  }

  if (privateScannerModule.scanPrivateProjectBoundary) {
    const {
      scanPrivateProjectBoundary,
      listAllowedPrivateProjects,
      validateNoPrivateLeakageInPublicMode,
    } = privateScannerModule;

    const scanResult = scanPrivateProjectBoundary({
      mode: "local-private",
      actor: "system",
    });
    if (
      scanResult.mode !== "local-private" ||
      scanResult.scannedProjects.length < 2
    ) {
      sections.scannerBehavior = false;
      failures.push("Private project scanner did not inventory the allowlisted roots.");
    }
    if (
      !scanResult.scannedProjects.every((project) => typeof project.topLevelEntries === "number")
    ) {
      sections.scannerBehavior = false;
      failures.push("Private project scanner must return safe top-level inventory counts.");
    }

    const allowedProjects = listAllowedPrivateProjects("local-private");
    if (
      !allowedProjects.some((entry) => entry.projectId === "careloop") ||
      !allowedProjects.some((entry) => entry.projectId === "careloop-ios")
    ) {
      sections.scannerBehavior = false;
      failures.push("listAllowedPrivateProjects must expose the allowlisted roots.");
    }

    const leakageCheck = validateNoPrivateLeakageInPublicMode();
    if (!leakageCheck.valid) {
      sections.publicSafetyIntegration = false;
      failures.push(...leakageCheck.errors);
    }
  }

  const packageJson = readJson("package.json");
  if (packageJson.scripts?.["check:private-project-mode"] !== "node scripts/check-private-project-mode.js") {
    sections.modules = false;
    failures.push("package.json is missing check:private-project-mode.");
  }

  const projectDiff = execFileSync(
    "git",
    ["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"],
    { cwd: ROOT, encoding: "utf8" }
  ).trim();
  if (projectDiff) {
    sections.repoSafety = false;
    failures.push("Private project files were modified.");
  }

  const forbiddenDiff = execFileSync(
    "git",
    ["diff", "--name-only", "--", "dashboard", "memory", "config"],
    { cwd: ROOT, encoding: "utf8" }
  ).trim();
  if (forbiddenDiff) {
    sections.repoSafety = false;
    failures.push("Forbidden paths were modified by the private-mode phase.");
  }

  for (const relativePath of [
    ...REQUIRED_MODULES,
    ...REQUIRED_DOCS,
    ...REQUIRED_POLICIES,
    "scripts/check-private-project-mode.js",
    "README.md",
    "docs/architecture/LOCAL_ORCHESTRATOR_INTEGRATION.md",
    "docs/architecture/LOCAL_STATE_ADAPTER.md",
    "docs/architecture/LOCAL_STATE_WRITE_BOUNDARY.md",
    "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
    "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  ]) {
    if (!exists(relativePath)) {
      continue;
    }

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
