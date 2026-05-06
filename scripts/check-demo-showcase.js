import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports/demo-showcase-report.md");

const REQUIRED_FILES = [
  "scripts/demo.js",
  "docs/demo-walkthrough.md",
  "docs/safety-model.md",
  "docs/use-cases.md",
  "docs/roadmap.md",
  "docs/PUBLIC_REPO_BOUNDARY.md",
  "docs/PRIVATE_PROJECT_BOUNDARY.md",
  "docs/architecture/DEMO_SHOWCASE_MODE.md",
  "docs/architecture/COMMAND_CENTER_UI.md",
  "demo/scenarios/demoapp-sprint.json",
  "demo/contracts/nexus-release-contract.json",
  "demo/contracts/core-task-contract.json",
  "demo/contracts/auditor-verification-contract.json",
  "demo/contracts/sentinel-verification-contract.json",
  "demo/contracts/warden-verification-contract.json",
  "demo/reports/auditor-report.json",
  "demo/reports/sentinel-report.json",
  "demo/reports/warden-report.json",
  "demo/reports/release-decision.json",
  "demo/reports/showcase-summary.json",
  "dashboard/src/data/studio.js",
  "dashboard/src/pages/CommandCenter.jsx",
  "dashboard/src/hooks/useStudioData.js",
  "dashboard/tests/routes.spec.js",
];

const README_LINK_TARGETS = [
  "docs/demo-walkthrough.md",
  "docs/safety-model.md",
  "docs/use-cases.md",
  "docs/roadmap.md",
  "demo/contracts",
  "demo/reports",
];

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readFile(relativePath));
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function getMetadata() {
  const generatedAt = new Date().toISOString();
  let branch = "unknown";
  let head = "unknown";

  try {
    branch = execFileSync("git", ["branch", "--show-current"], { cwd: ROOT, encoding: "utf8" }).trim() || "unknown";
    head = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim() || "unknown";
  } catch {
    // ignore git metadata failures
  }

  return { generatedAt, branch, head };
}

function formatStatus(pass) {
  return pass ? "PASS" : "FAIL";
}

function main() {
  const failures = [];
  const warnings = [];

  const requiredFilesPass = REQUIRED_FILES.every((file) => {
    const exists = fileExists(file);
    if (!exists) failures.push(`Missing required file: ${file}`);
    return exists;
  });

  const packageJson = JSON.parse(readFile("package.json"));
  if (packageJson.scripts?.demo !== "node scripts/demo.js") {
    failures.push('package.json missing expected "demo" script');
  }

  const jsonFiles = REQUIRED_FILES.filter((file) => file.endsWith(".json"));
  for (const file of jsonFiles) {
    try {
      readJson(file);
    } catch (error) {
      failures.push(`Invalid JSON: ${file} (${error.message})`);
    }
  }

  const demoJsonFiles = [
    "demo/scenarios/demoapp-sprint.json",
    ...jsonFiles.filter((file) => file.startsWith("demo/contracts/")),
    ...jsonFiles.filter((file) => file.startsWith("demo/reports/")),
  ];

  for (const file of demoJsonFiles) {
    const text = readFile(file);
    if (/CareLoop|careloop|care loop/.test(text)) {
      failures.push(`Demo JSON contains private project reference: ${file}`);
    }
  }

  const releaseDecision = readJson("demo/reports/release-decision.json");
  const evidenceBasedDecision =
    ["NO_GO", "BLOCKED"].includes(releaseDecision.result) &&
    Array.isArray(releaseDecision.requiredEvidence) &&
    releaseDecision.requiredEvidence.length > 0 &&
    Array.isArray(releaseDecision.blockedBy) &&
    releaseDecision.blockedBy.length > 0;
  if (!evidenceBasedDecision) {
    failures.push("Release decision is not evidence-based or is a fake GO.");
  }

  let demoOutput = "";
  try {
    demoOutput = execFileSync("node", ["scripts/demo.js"], { cwd: ROOT, encoding: "utf8" });
  } catch (error) {
    failures.push(`scripts/demo.js did not run successfully: ${error.message}`);
  }

  if (demoOutput) {
    if (!demoOutput.includes("NEXUS Agentic OS — Zero-Key Demo")) {
      failures.push("Demo output missing zero-key demo header.");
    }
    if (!demoOutput.includes("Project: DemoApp")) {
      failures.push("Demo output missing DemoApp project summary.");
    }
    if (/CareLoop|careloop|care loop/.test(demoOutput)) {
      failures.push("Demo output contains private project reference.");
    }
  }

  const readme = readFile("README.md");
  for (const linkTarget of README_LINK_TARGETS) {
    if (!readme.includes(linkTarget)) {
      failures.push(`README is missing demo navigation link: ${linkTarget}`);
    }
  }

  const studioData = readFile("dashboard/src/data/studio.js");
  const commandCenter = readFile("dashboard/src/pages/CommandCenter.jsx");
  const routesSpec = readFile("dashboard/tests/routes.spec.js");
  const hooksSource = readFile("dashboard/src/hooks/useStudioData.js");

  if (!studioData.includes("DemoApp")) {
    failures.push("dashboard/src/data/studio.js does not use DemoApp.");
  }
  if (!commandCenter.includes("DemoApp")) {
    failures.push("dashboard/src/pages/CommandCenter.jsx does not present DemoApp.");
  }
  if (!routesSpec.includes("DemoApp")) {
    warnings.push("dashboard/tests/routes.spec.js does not assert DemoApp explicitly.");
  }
  if (!hooksSource.includes("buildStudioSnapshot")) {
    failures.push("dashboard static hook source is missing expected snapshot builder.");
  }

  const metadata = getMetadata();
  const pass = failures.length === 0;
  const lines = [
    "# NEXUS Demo Showcase Check",
    "",
    "## Metadata",
    "",
    `- Generated at: ${metadata.generatedAt}`,
    `- Validation branch: ${metadata.branch}`,
    `- Validation HEAD: ${metadata.head}`,
    "- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.",
    "",
    `Required files: ${formatStatus(requiredFilesPass)}`,
    `Demo JSON parse: ${formatStatus(jsonFiles.length > 0 && failures.filter((item) => item.startsWith("Invalid JSON")).length === 0)}`,
    `Demo script: ${formatStatus(demoOutput.length > 0 && !failures.some((item) => item.includes("scripts/demo.js")))}`,
    `Release decision: ${formatStatus(evidenceBasedDecision)}`,
    `README navigation: ${formatStatus(README_LINK_TARGETS.every((target) => readme.includes(target)))}`,
    `Dashboard static source: ${formatStatus(studioData.includes("DemoApp") && commandCenter.includes("DemoApp"))}`,
    "",
    "## Failures",
    "",
    ...(failures.length ? failures.map((item) => `- ${item}`) : ["- None"]),
    "",
    "## Warnings",
    "",
    ...(warnings.length ? warnings.map((item) => `- ${item}`) : ["- None"]),
    "",
    `Result: ${formatStatus(pass)}`,
  ];

  fs.writeFileSync(REPORT_PATH, `${lines.join("\n")}\n`);
  process.stdout.write(`NEXUS Demo Showcase Check\n=========================\n\nResult: ${formatStatus(pass)}\n`);
  process.exit(pass ? 0 : 1);
}

main();
