import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const scenarioPath = path.join(ROOT, "demo/scenarios/demoapp-sprint.json");
const contractPaths = [
  "demo/contracts/nexus-release-contract.json",
  "demo/contracts/core-task-contract.json",
  "demo/contracts/auditor-verification-contract.json",
  "demo/contracts/sentinel-verification-contract.json",
  "demo/contracts/warden-verification-contract.json",
];
const reportPaths = [
  "demo/reports/auditor-report.json",
  "demo/reports/sentinel-report.json",
  "demo/reports/warden-report.json",
  "demo/reports/release-decision.json",
  "demo/reports/showcase-summary.json",
];

function readJson(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing demo file: ${relativePath}`);
  }

  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (error) {
    throw new Error(`Invalid JSON in ${relativePath}: ${error.message}`);
  }
}

function collectGateStatuses(reports) {
  return reports
    .filter((report) => ["auditor", "sentinel", "warden"].includes(report.agentId))
    .map((report) => `- ${report.agentId.toUpperCase()}: ${report.status}`);
}

function countEvidence(reports) {
  return reports.reduce((sum, report) => sum + (report.evidence?.length || 0), 0);
}

function main() {
  const scenario = readJson("demo/scenarios/demoapp-sprint.json");
  const contracts = contractPaths.map((file) => ({ file, data: readJson(file) }));
  const reports = reportPaths.map((file) => ({ file, data: readJson(file) }));
  const releaseDecision = readJson("demo/reports/release-decision.json");
  const showcaseSummary = readJson("demo/reports/showcase-summary.json");

  if (scenario.projectName !== "DemoApp" || scenario.publicSafe !== true) {
    throw new Error("Demo scenario is not public-safe DemoApp data.");
  }

  const gateStatuses = collectGateStatuses(reports.map((item) => item.data));
  const evidenceCount = countEvidence(reports.map((item) => item.data));

  const lines = [
    "NEXUS Agentic OS — Zero-Key Demo",
    "================================",
    "",
    "What is NEXUS?",
    "NEXUS is a governed Agentic OS for coordinating specialized AI agents through contracts, verification gates, evidence, and human approvals.",
    "",
    "Demo Scenario:",
    `- Project: ${scenario.projectName}`,
    `- Mission: ${scenario.mission}`,
    "",
    "Flow:",
    "1. Founder intent captured",
    "2. NEXUS evaluates mission",
    "3. SHEPHERD plans work",
    "4. CORE/SWIFT produce sample implementation tasks",
    "5. AUDITOR/SENTINEL/WARDEN verify",
    "6. Evidence supports release decision",
    "7. Release decision: BLOCKED or NO_GO until SENTINEL completes macOS/Xcode evidence",
    "",
    "Agents involved:",
    ...scenario.agents.map((agentId) => `- ${agentId.toUpperCase()}`),
    "",
    "Contracts loaded:",
    ...contracts.map((item) => `- ${item.file}`),
    "",
    "Reports loaded:",
    ...reports.map((item) => `- ${item.file}`),
    "",
    "Gate statuses:",
    ...gateStatuses,
    "",
    `Evidence count: ${evidenceCount}`,
    `Final demo release decision: ${releaseDecision.result}`,
    `Release status: ${releaseDecision.status}`,
    `Summary: ${showcaseSummary.summary}`,
    "",
    "Next commands:",
    "- npm run check:demo-showcase",
    "- cd dashboard && npm run build",
    "- cd dashboard && npm run test:pages",
  ];

  process.stdout.write(`${lines.join("\n")}\n`);
}

try {
  main();
  process.exit(0);
} catch (error) {
  process.stderr.write(`Demo failed: ${error.message}\n`);
  process.exit(1);
}
