import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import process from "node:process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "nexus-service-orchestration-report.md");

const sections = {
  manifest: true,
  modules: true,
  exports: true,
  policy: true,
  packageScripts: true,
  statusCli: true,
  doctorCli: true,
  reports: true,
  safety: true,
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
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
}

function lineWarnings(relativePath) {
  const content = read(relativePath);
  return content
    .split("\n")
    .map((line, index) => ({ lineNumber: index + 1, length: line.length }))
    .filter((entry) => entry.length > 1000);
}

console.log("\nNEXUS Service Orchestration Check\n");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

const requiredFiles = [
  "nexus.services.json",
  "service-orchestration/serviceManifest.js",
  "service-orchestration/serviceStatus.js",
  "service-orchestration/serviceDoctor.js",
  "service-orchestration/servicePorts.js",
  "service-orchestration/index.js",
  "scripts/nexus-status.js",
  "scripts/nexus-doctor.js",
  "policy/nexus-service-orchestration-policy.json",
  "docs/architecture/NEXUS_SERVICE_ORCHESTRATION.md",
  "reports/nexus-service-status.json",
  "reports/nexus-doctor-report.json",
];

for (const file of requiredFiles) {
  check(existsSync(join(ROOT, file)), "modules", `Missing required file: ${file}`);
}

let manifest = null;
try {
  manifest = JSON.parse(read("nexus.services.json"));
} catch (error) {
  fail("manifest", `Could not parse nexus.services.json: ${error.message}`);
}

const requiredServiceIds = [
  "dashboard",
  "local-api",
  "action-bridge",
  "db-foundation",
  "worker-runtime",
  "tool-gateway",
  "mcp-gateway",
];

check(!!manifest, "manifest", "Service manifest must parse");
check(Array.isArray(manifest?.services), "manifest", "Service manifest must contain services array");
for (const id of requiredServiceIds) {
  check(manifest?.services?.some((service) => service.id === id), "manifest", `Service manifest missing ${id}`);
}

const manifestText = read("nexus.services.json");
for (const forbidden of ["0.0.0.0", "DATABASE_URL", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "sk-"]) {
  check(!manifestText.includes(forbidden), "safety", `Service manifest contains forbidden marker: ${forbidden}`);
}
for (const service of manifest?.services || []) {
  if (service.enabled === true && service.port !== null) {
    check(service.host === "127.0.0.1", "safety", `Enabled network service must use 127.0.0.1: ${service.id}`);
  }
}

let policy = null;
try {
  policy = JSON.parse(read("policy/nexus-service-orchestration-policy.json"));
} catch (error) {
  fail("policy", `Could not parse policy: ${error.message}`);
}
check(policy?.phase === "P41.6.1", "policy", "Policy phase must be P41.6.1");
check(policy?.startServicesAllowed === false, "policy", "Policy must keep startServicesAllowed false");
check(policy?.localhostOnlyRequired === true, "policy", "Policy must require localhost-only");

const packageJson = JSON.parse(read("package.json"));
for (const scriptName of ["nexus:status", "nexus:doctor", "check:nexus-service-orchestration"]) {
  check(Boolean(packageJson.scripts?.[scriptName]), "packageScripts", `Missing package script: ${scriptName}`);
}

const { loadServiceManifest, validateServiceManifest, listServices, getServiceById, summarizeServiceManifest } =
  await import("../service-orchestration/serviceManifest.js");
const { buildServiceStatus, summarizeServiceStatus, writeServiceStatusReport } =
  await import("../service-orchestration/serviceStatus.js");
const {
  runNexusDoctor,
  checkNodeRuntime,
  checkPackageScripts,
  checkServiceManifest,
  checkLocalhostBindingPolicy,
  checkKnownPorts,
  summarizeDoctorResult,
  writeDoctorReport,
} = await import("../service-orchestration/serviceDoctor.js");
const { isLocalhostHost, checkPortAvailable, normalizePort, summarizePortStatus } =
  await import("../service-orchestration/servicePorts.js");

for (const [name, value] of Object.entries({
  loadServiceManifest,
  validateServiceManifest,
  listServices,
  getServiceById,
  summarizeServiceManifest,
  buildServiceStatus,
  summarizeServiceStatus,
  writeServiceStatusReport,
  runNexusDoctor,
  checkNodeRuntime,
  checkPackageScripts,
  checkServiceManifest,
  checkLocalhostBindingPolicy,
  checkKnownPorts,
  summarizeDoctorResult,
  writeDoctorReport,
  isLocalhostHost,
  checkPortAvailable,
  normalizePort,
  summarizePortStatus,
})) {
  check(typeof value === "function", "exports", `Missing or invalid export: ${name}`);
}

let statusOutput = "";
let doctorOutput = "";
try {
  statusOutput = execFileSync("npm", ["run", "nexus:status"], {
    cwd: ROOT,
    encoding: "utf8",
  });
} catch (error) {
  fail("statusCli", `nexus:status failed: ${error.message}`);
}
try {
  doctorOutput = execFileSync("npm", ["run", "nexus:doctor"], {
    cwd: ROOT,
    encoding: "utf8",
  });
} catch (error) {
  fail("doctorCli", `nexus:doctor failed: ${error.message}`);
}

check(statusOutput.includes("NEXUS Local Service Status"), "statusCli", "nexus:status output missing heading");
check(statusOutput.includes("This phase does not start or stop services."), "statusCli", "nexus:status must explain read-only behavior");
check(doctorOutput.includes("NEXUS Local Doctor"), "doctorCli", "nexus:doctor output missing heading");
check(doctorOutput.includes("No service start attempted: PASS"), "doctorCli", "nexus:doctor must confirm no service start attempted");

let statusReport = null;
let doctorReport = null;
try {
  statusReport = JSON.parse(read("reports/nexus-service-status.json"));
} catch (error) {
  fail("reports", `Could not parse nexus-service-status.json: ${error.message}`);
}
try {
  doctorReport = JSON.parse(read("reports/nexus-doctor-report.json"));
} catch (error) {
  fail("reports", `Could not parse nexus-doctor-report.json: ${error.message}`);
}

check(statusReport?.phase === "P41.6.1", "reports", "Status report phase must be P41.6.1");
check(doctorReport?.phase === "P41.6.1", "reports", "Doctor report phase must be P41.6.1");
check(Array.isArray(statusReport?.services), "reports", "Status report must contain services array");
check(typeof doctorReport?.checks === "object", "reports", "Doctor report must contain checks object");

const docsToCheck = {
  "docs/architecture/NEXUS_SERVICE_ORCHESTRATION.md": [
    "P41.6.1",
    "nexus:status",
    "nexus:doctor",
    "P41.6.2",
    "P41.6.3",
  ],
  "docs/usage/RUNNING_NEXUS_LOCALLY.md": [
    "npm run nexus:status",
    "npm run nexus:doctor",
    "P41.6.2",
  ],
  "docs/usage/GETTING_STARTED.md": [
    "nexus:status",
    "nexus:doctor",
  ],
  "README.md": [
    "P41.6.1",
    "service manifest",
  ],
};

for (const [file, expectedStrings] of Object.entries(docsToCheck)) {
  const content = read(file);
  check(content.length > 0, "docs", `Missing updated doc: ${file}`);
  for (const expected of expectedStrings) {
    check(content.includes(expected), "docs", `${file} missing expected text: ${expected}`);
  }
}

try {
  const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
  check(privateDiff.length === 0, "noForbiddenChanges", "Private project files changed");
} catch (error) {
  fail("noForbiddenChanges", `Could not inspect private project diff: ${error.message}`);
}

check(read("local-api/server.js").includes("Port 4321"), "noForbiddenChanges", "local-api/server.js changed unexpectedly");
check(read("scripts/mission-action-server.js").includes("const PORT = 3748;"), "noForbiddenChanges", "mission-action-server.js changed unexpectedly");

for (const relativePath of [
  "nexus.services.json",
  "service-orchestration/serviceManifest.js",
  "service-orchestration/serviceStatus.js",
  "service-orchestration/serviceDoctor.js",
  "service-orchestration/servicePorts.js",
  "scripts/nexus-status.js",
  "scripts/nexus-doctor.js",
  "scripts/check-nexus-service-orchestration.js",
  "docs/architecture/NEXUS_SERVICE_ORCHESTRATION.md",
  "docs/usage/RUNNING_NEXUS_LOCALLY.md",
  "docs/usage/GETTING_STARTED.md",
  "docs/usage/TROUBLESHOOTING.md",
  "docs/codebase/MODULE_REGISTRY.md",
  "docs/codebase/PHASE_MODULE_INDEX.md",
  "README.md",
]) {
  const warnings = lineWarnings(relativePath);
  check(warnings.length === 0, "formattingReadability", `${relativePath} contains lines over 1000 characters`);
}

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

console.log(`Manifest: ${sections.manifest ? "PASS" : "FAIL"}`);
console.log(`Modules: ${sections.modules ? "PASS" : "FAIL"}`);
console.log(`Exports: ${sections.exports ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Package scripts: ${sections.packageScripts ? "PASS" : "FAIL"}`);
console.log(`Status CLI: ${sections.statusCli ? "PASS" : "FAIL"}`);
console.log(`Doctor CLI: ${sections.doctorCli ? "PASS" : "FAIL"}`);
console.log(`Reports: ${sections.reports ? "PASS" : "FAIL"}`);
console.log(`Safety: ${sections.safety ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formattingReadability ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

const report = `# NEXUS Service Orchestration Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Checks

- Manifest: ${sections.manifest ? "PASS" : "FAIL"}
- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Exports: ${sections.exports ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- Package scripts: ${sections.packageScripts ? "PASS" : "FAIL"}
- Status CLI: ${sections.statusCli ? "PASS" : "FAIL"}
- Doctor CLI: ${sections.doctorCli ? "PASS" : "FAIL"}
- Reports: ${sections.reports ? "PASS" : "FAIL"}
- Safety: ${sections.safety ? "PASS" : "FAIL"}
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
