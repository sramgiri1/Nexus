import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import process from "node:process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "nexus-boot-report.md");

const sections = {
  manifest: true,
  localOnlyBoundary: true,
  processManager: true,
  nexusUp: true,
  nexusDown: true,
  statusIntegration: true,
  doctorIntegration: true,
  policy: true,
  dryRun: true,
  docs: true,
  noForbiddenChanges: true,
  formattingReadability: true,
};

const failures = [];

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function fail(section, message) {
  sections[section] = false;
  failures.push(message);
}

function check(condition, section, message) {
  if (!condition) fail(section, message);
}

function gitOutput(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function lineWarnings(relativePath) {
  return read(relativePath)
    .split("\n")
    .map((line, index) => ({ length: line.length, lineNumber: index + 1 }))
    .filter((entry) => entry.length > 1000);
}

console.log("NEXUS Local Boot Check\n======================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

const requiredFiles = [
  "nexus.services.json",
  "scripts/nexus-up.js",
  "scripts/nexus-down.js",
  "scripts/nexus-status.js",
  "scripts/nexus-doctor.js",
  "service-runtime/serviceManifest.js",
  "service-runtime/serviceProcessManager.js",
  "service-runtime/serviceStateStore.js",
  "service-runtime/serviceHealth.js",
  "service-runtime/servicePorts.js",
  "service-runtime/index.js",
  "policy/nexus-local-boot-policy.json",
  "docs/architecture/UNIFIED_NEXUS_LOCAL_BOOT.md",
  "reports/nexus-service-status-report.md",
];
for (const file of requiredFiles) {
  check(existsSync(join(ROOT, file)), "processManager", `Missing required file: ${file}`);
}

let manifest = null;
try {
  manifest = JSON.parse(read("nexus.services.json"));
} catch (error) {
  fail("manifest", `Could not parse nexus.services.json: ${error.message}`);
}
check(Array.isArray(manifest?.services), "manifest", "Manifest services array missing");
for (const id of ["command-center", "local-api", "action-bridge", "db", "workers", "mcp-gateway", "provider-gateway"]) {
  check(manifest?.services?.some((service) => service.id === id), "manifest", `Missing service: ${id}`);
}
for (const service of manifest?.services || []) {
  if (service.enabled === true && service.port !== null) {
    check(service.host === "127.0.0.1" || service.host === "localhost", "localOnlyBoundary", `Enabled service ${service.id} must be localhost-only`);
  }
}
for (const id of ["workers", "mcp-gateway", "provider-gateway"]) {
  const service = manifest?.services?.find((entry) => entry.id === id);
  check(service?.enabled === false, "manifest", `${id} must stay disabled by default`);
}

const runtimeIndex = await import("../service-runtime/index.js");
for (const name of [
  "loadServiceManifest",
  "validateServiceManifest",
  "buildBootPlan",
  "startService",
  "stopService",
  "stopAllServices",
  "readServiceState",
  "writeServiceState",
  "isServiceRunning",
  "validateLocalOnlyService",
  "checkServiceHealth",
  "checkPortAvailable",
]) {
  check(typeof runtimeIndex[name] === "function", "processManager", `Missing export: ${name}`);
}

const pkg = JSON.parse(read("package.json"));
for (const scriptName of ["nexus:up", "nexus:down", "nexus:status", "nexus:doctor", "check:nexus-local-boot"]) {
  check(Boolean(pkg.scripts?.[scriptName]), "processManager", `Missing package script: ${scriptName}`);
}

let dryRunOutput = "";
try {
  dryRunOutput = execFileSync("npm", ["run", "nexus:up", "--", "--dry-run"], {
    cwd: ROOT,
    encoding: "utf8",
  });
} catch (error) {
  fail("dryRun", `nexus:up --dry-run failed: ${error.message}`);
}
check(dryRunOutput.includes("NEXUS OS Local Boot"), "nexusUp", "nexus:up dry-run missing heading");
check(dryRunOutput.includes("Bind address: 127.0.0.1"), "localOnlyBoundary", "nexus:up dry-run must show bind address");

let downOutput = "";
try {
  downOutput = execFileSync("npm", ["run", "nexus:down"], {
    cwd: ROOT,
    encoding: "utf8",
  });
} catch (error) {
  fail("nexusDown", `nexus:down failed: ${error.message}`);
}
check(downOutput.includes("NEXUS OS Local Shutdown"), "nexusDown", "nexus:down missing heading");

let doctorOutput = "";
let statusOutput = "";
try {
  doctorOutput = execFileSync("npm", ["run", "nexus:doctor"], {
    cwd: ROOT,
    encoding: "utf8",
  });
} catch (error) {
  fail("doctorIntegration", `nexus:doctor failed: ${error.message}`);
}
try {
  statusOutput = execFileSync("npm", ["run", "nexus:status"], {
    cwd: ROOT,
    encoding: "utf8",
  });
} catch (error) {
  fail("statusIntegration", `nexus:status failed: ${error.message}`);
}
check(doctorOutput.includes("NEXUS Local Doctor"), "doctorIntegration", "nexus:doctor missing heading");
check(statusOutput.includes("NEXUS Local Service Status"), "statusIntegration", "nexus:status missing heading");

let policy = null;
try {
  policy = JSON.parse(read("policy/nexus-local-boot-policy.json"));
} catch (error) {
  fail("policy", `Could not parse policy: ${error.message}`);
}
check(policy?.phase === "P41.6.2", "policy", "Policy phase must be P41.6.2");
check(policy?.localOnly === true, "policy", "Policy must enforce localOnly");
check(policy?.managedPidOnlyShutdown === true, "policy", "Policy must enforce managedPidOnlyShutdown");

const docsToCheck = {
  "docs/architecture/UNIFIED_NEXUS_LOCAL_BOOT.md": ["nexus:up", "nexus:down", "nexus:status", "nexus:doctor", "P41.6.3"],
  "docs/usage/RUNNING_NEXUS_LOCALLY.md": ["npm run nexus:up", "npm run nexus:down", "npm run nexus:status", "npm run nexus:doctor"],
  "README.md": ["Local boot commands", "nexus:up", "nexus:down"],
};
for (const [file, expectedStrings] of Object.entries(docsToCheck)) {
  const content = read(file);
  check(content.length > 0, "docs", `Missing updated doc: ${file}`);
  for (const expected of expectedStrings) {
    check(content.includes(expected), "docs", `${file} missing expected text: ${expected}`);
  }
}

check(read("service-runtime/serviceProcessManager.js").includes("managedByNexus"), "nexusDown", "Shutdown must be managed-PID-only by contract");

try {
  const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
  check(privateDiff.length === 0, "noForbiddenChanges", "Private project files changed");
} catch (error) {
  fail("noForbiddenChanges", `Could not inspect private project diff: ${error.message}`);
}

for (const relativePath of [
  "nexus.services.json",
  "scripts/nexus-up.js",
  "scripts/nexus-down.js",
  "scripts/nexus-status.js",
  "scripts/nexus-doctor.js",
  "scripts/check-nexus-local-boot.js",
  "service-runtime/serviceManifest.js",
  "service-runtime/serviceProcessManager.js",
  "service-runtime/serviceStateStore.js",
  "service-runtime/serviceHealth.js",
  "service-runtime/servicePorts.js",
  "service-runtime/index.js",
  "docs/architecture/UNIFIED_NEXUS_LOCAL_BOOT.md",
  "docs/usage/RUNNING_NEXUS_LOCALLY.md",
  "README.md",
]) {
  check(lineWarnings(relativePath).length === 0, "formattingReadability", `${relativePath} contains lines over 1000 characters`);
}

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
console.log(`Service manifest: ${sections.manifest ? "PASS" : "FAIL"}`);
console.log(`Local-only boundary: ${sections.localOnlyBoundary ? "PASS" : "FAIL"}`);
console.log(`Process manager: ${sections.processManager ? "PASS" : "FAIL"}`);
console.log(`nexus:up: ${sections.nexusUp ? "PASS" : "FAIL"}`);
console.log(`nexus:down: ${sections.nexusDown ? "PASS" : "FAIL"}`);
console.log(`Status integration: ${sections.statusIntegration ? "PASS" : "FAIL"}`);
console.log(`Doctor integration: ${sections.doctorIntegration ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Dry run: ${sections.dryRun ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formattingReadability ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

const report = `# NEXUS Local Boot Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Checks

- Service manifest: ${sections.manifest ? "PASS" : "FAIL"}
- Local-only boundary: ${sections.localOnlyBoundary ? "PASS" : "FAIL"}
- Process manager: ${sections.processManager ? "PASS" : "FAIL"}
- nexus:up: ${sections.nexusUp ? "PASS" : "FAIL"}
- nexus:down: ${sections.nexusDown ? "PASS" : "FAIL"}
- Status integration: ${sections.statusIntegration ? "PASS" : "FAIL"}
- Doctor integration: ${sections.doctorIntegration ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- Dry run: ${sections.dryRun ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formattingReadability ? "PASS" : "FAIL"}

## Failures

${failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n")}

## Result

${result}
`;

writeFileSync(REPORT_PATH, report, "utf8");
if (result !== "PASS") {
  process.exitCode = 1;
}
