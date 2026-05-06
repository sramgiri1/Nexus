import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports/public-safety-report.md");

const SCANNED_FILES = [
  "README.md",
  "docs/demo-walkthrough.md",
  "docs/safety-model.md",
  "docs/use-cases.md",
  "docs/roadmap.md",
  "docs/PUBLIC_REPO_BOUNDARY.md",
  "docs/PRIVATE_PROJECT_BOUNDARY.md",
  "docs/architecture/DEMO_SHOWCASE_MODE.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "docs/architecture/COMMAND_CENTER_UI.md",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "demo/README.md",
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
  "docs/images/nexus-architecture.svg",
  "docs/images/dashboard-screenshot-placeholder.svg",
];

const EXCEPTION_FILES = new Set([
  "docs/PRIVATE_PROJECT_BOUNDARY.md",
  "security/pii-patterns.json",
  "scripts/check-public-safety.js",
  "reports/public-safety-report.md",
  "docs/safety-model.md",
]);

const BANNED_PROJECT_TERMS = [
  /CareLoop/g,
  /careloop/g,
  /care loop/g,
  /projects\/careloop/g,
  /projects\/careloop-ios/g,
];

const SECRET_PATTERNS = [
  { label: "OpenAI key prefix", regex: /sk-[A-Za-z0-9]{10,}/g },
  { label: "Anthropic key prefix", regex: /sk-ant-[A-Za-z0-9_-]{6,}/g },
  { label: "OPENAI_API_KEY assignment", regex: /OPENAI_API_KEY=/g },
  { label: "ANTHROPIC_API_KEY assignment", regex: /ANTHROPIC_API_KEY=/g },
  { label: "DATABASE_URL assignment", regex: /DATABASE_URL=/g },
  { label: "Private key block", regex: /-----BEGIN [A-Z ]+PRIVATE KEY-----/g },
  {
    label: "refreshToken value",
    regex: /refreshToken\s*[:=]\s*["'][A-Za-z0-9._-]{6,}["']/g,
  },
  {
    label: "accessToken value",
    regex: /accessToken\s*[:=]\s*["'][A-Za-z0-9._-]{6,}["']/g,
  },
];

const PRIVATE_DATA_PATTERNS = [
  {
    label: "Email address",
    regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  },
  {
    label: "Phone number",
    regex: /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]\d{4}\b/g,
  },
];

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function getMetadata() {
  let branch = "unknown";
  let head = "unknown";

  try {
    branch = execFileSync("git", ["branch", "--show-current"], { cwd: ROOT, encoding: "utf8" }).trim() || "unknown";
    head = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim() || "unknown";
  } catch {
    // ignore git failures
  }

  return {
    generatedAt: new Date().toISOString(),
    branch,
    head,
  };
}

function findMatches(text, regex) {
  const matches = [];
  for (const match of text.matchAll(regex)) {
    matches.push(match[0]);
  }
  return matches;
}

function collectFindings(files, rules, failures, sectionLabel) {
  const findings = [];

  for (const file of files) {
    if (!exists(file)) {
      failures.push(`Missing scanned file: ${file}`);
      continue;
    }

    if (EXCEPTION_FILES.has(file)) {
      continue;
    }

    const text = readFile(file);
    for (const rule of rules) {
      const matches = findMatches(text, rule.regex || rule);
      if (matches.length) {
        findings.push(`${file} → ${rule.label || "project term"} (${matches[0]})`);
      }
    }
  }

  if (findings.length) {
    failures.push(`${sectionLabel} violations detected.`);
  }

  return findings;
}

function main() {
  const failures = [];

  const missingFiles = SCANNED_FILES.filter((file) => !exists(file));
  if (missingFiles.length) {
    failures.push(...missingFiles.map((file) => `Missing required public surface file: ${file}`));
  }

  const projectFindings = collectFindings(
    SCANNED_FILES,
    BANNED_PROJECT_TERMS.map((regex) => ({ label: "banned project term", regex })),
    failures,
    "Banned project term"
  );
  const secretFindings = collectFindings(SCANNED_FILES, SECRET_PATTERNS, failures, "Secret pattern");
  const privateDataFindings = collectFindings(SCANNED_FILES, PRIVATE_DATA_PATTERNS, failures, "Private data");

  const dashboardFiles = [
    "dashboard/src/data/studio.js",
    "dashboard/src/pages/CommandCenter.jsx",
    "dashboard/tests/routes.spec.js",
  ];
  const dashboardSafe = dashboardFiles.every((file) => readFile(file).includes("DemoApp"));
  if (!dashboardSafe) {
    failures.push("Dashboard static source does not consistently use DemoApp.");
  }

  const demoFiles = SCANNED_FILES.filter((file) => file.startsWith("demo/"));
  const demoSafe = demoFiles.every((file) => !/CareLoop|careloop|care loop/.test(readFile(file)));
  if (!demoSafe) {
    failures.push("Demo artifacts contain private project references.");
  }

  const packageJson = JSON.parse(readFile("package.json"));
  if (packageJson.scripts?.demo !== "node scripts/demo.js") {
    failures.push("package.json is missing npm run demo.");
  }

  const requiredDemoFiles = [
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
  ];
  const demoArtifactsExist = requiredDemoFiles.every(exists);
  if (!demoArtifactsExist) {
    failures.push("One or more demo contracts or reports are missing.");
  }

  const readme = readFile("README.md");
  const readmeLinks = [
    "docs/demo-walkthrough.md",
    "docs/safety-model.md",
    "docs/use-cases.md",
    "docs/roadmap.md",
  ];
  const readmeNavigationOk = readmeLinks.every((target) => readme.includes(target));
  if (!readmeNavigationOk) {
    failures.push("README is missing demo navigation links.");
  }

  const metadata = getMetadata();
  const pass = failures.length === 0;
  const lines = [
    "# NEXUS Public Safety Check",
    "",
    "## Metadata",
    "",
    `- Generated at: ${metadata.generatedAt}`,
    `- Validation branch: ${metadata.branch}`,
    `- Validation HEAD: ${metadata.head}`,
    "- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.",
    "",
    "Scanned files:",
    ...SCANNED_FILES.map((file) => `- ${file}`),
    "",
    "Banned project terms:",
    ...(projectFindings.length ? projectFindings.map((item) => `- ${item}`) : ["- None"]),
    "",
    "Secret patterns:",
    ...(secretFindings.length ? secretFindings.map((item) => `- ${item}`) : ["- None"]),
    "",
    "Private data patterns:",
    ...(privateDataFindings.length ? privateDataFindings.map((item) => `- ${item}`) : ["- None"]),
    "",
    `Dashboard data: ${dashboardSafe ? "PASS" : "FAIL"}`,
    `Demo artifacts: ${demoSafe && demoArtifactsExist ? "PASS" : "FAIL"}`,
    `README navigation: ${readmeNavigationOk ? "PASS" : "FAIL"}`,
    "",
    `Result: ${pass ? "PASS" : "FAIL"}`,
  ];

  fs.writeFileSync(REPORT_PATH, `${lines.join("\n")}\n`);

  process.stdout.write("NEXUS Public Safety Check\n=========================\n\n");
  process.stdout.write(`Result: ${pass ? "PASS" : "FAIL"}\n`);
  process.exit(pass ? 0 : 1);
}

main();
