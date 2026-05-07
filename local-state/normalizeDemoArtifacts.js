import { KNOWN_DEMO_CONTRACTS, KNOWN_DEMO_REPORTS } from "./schema.js";
import { readJsonSafe } from "./safeFileReader.js";

const PRIVATE_NAME_PATTERN = new RegExp(
  [["Care", "Loop"].join(""), ["care", "loop"].join("")].join("|")
);
const SECRET_PATTERN = new RegExp(
  [
    "sk-[A-Za-z0-9]{10,}",
    "sk-ant-[A-Za-z0-9_-]{6,}",
    ["OPENAI", "_", "API", "_", "KEY", "="].join(""),
    ["ANTHROPIC", "_", "API", "_", "KEY", "="].join(""),
    ["DATABASE", "_", "URL", "="].join(""),
    "-----BEGIN [A-Z ]+PRIVATE KEY-----",
  ].join("|")
);

function collectArtifactIssues(serializedValue, path, errors) {
  if (PRIVATE_NAME_PATTERN.test(serializedValue)) {
    errors.push(`Private project reference found in ${path}`);
  }

  if (SECRET_PATTERN.test(serializedValue)) {
    errors.push(`Secret-like content found in ${path}`);
  }
}

function normalizeJsonArtifacts(paths) {
  const items = [];
  const errors = [];

  for (const relativePath of paths) {
    const result = readJsonSafe(relativePath);
    if (!result.ok) {
      errors.push(`Unable to read ${relativePath}: ${result.error}`);
      continue;
    }

    const serializedValue = JSON.stringify(result.data);
    collectArtifactIssues(serializedValue, relativePath, errors);

    items.push({
      id:
        result.data.contractId ||
        result.data.reportId ||
        result.data.scenarioId ||
        relativePath,
      path: relativePath,
      data: result.data,
    });
  }

  return { items, errors };
}

export function readDemoContracts() {
  const { items, errors } = normalizeJsonArtifacts(KNOWN_DEMO_CONTRACTS);
  return { contracts: items, errors };
}

export function readDemoReports() {
  const { items, errors } = normalizeJsonArtifacts(KNOWN_DEMO_REPORTS);
  return { reports: items, errors };
}

export function readDemoScenario() {
  const result = readJsonSafe("demo/scenarios/demoapp-sprint.json");

  if (!result.ok) {
    return {
      scenario: {},
      errors: [`Unable to read demo scenario: ${result.error}`],
    };
  }

  const errors = [];
  collectArtifactIssues(JSON.stringify(result.data), result.path, errors);

  return {
    scenario: result.data,
    errors,
  };
}

export function summarizeDemoArtifacts() {
  const contractsState = readDemoContracts();
  const reportsState = readDemoReports();
  const scenarioState = readDemoScenario();
  const errors = [
    ...contractsState.errors,
    ...reportsState.errors,
    ...scenarioState.errors,
  ];

  const gateStatus = {
    AUDITOR: "UNKNOWN",
    SENTINEL: "UNKNOWN",
    WARDEN: "UNKNOWN",
  };

  let releaseDecision = "UNKNOWN";
  const evidenceIds = new Set();

  for (const report of reportsState.reports) {
    if (Array.isArray(report.data.evidence)) {
      for (const evidence of report.data.evidence) {
        if (evidence?.evidenceId) {
          evidenceIds.add(evidence.evidenceId);
        }
      }
    }

    if (report.data.agentId === "auditor") {
      gateStatus.AUDITOR = report.data.status || report.data.result || "UNKNOWN";
    }
    if (report.data.agentId === "sentinel") {
      gateStatus.SENTINEL = report.data.status || report.data.result || "UNKNOWN";
    }
    if (report.data.agentId === "warden") {
      gateStatus.WARDEN = report.data.status || report.data.result || "UNKNOWN";
    }
    if (report.data.agentId === "nexus") {
      releaseDecision = report.data.result || report.data.status || "UNKNOWN";
    }
  }

  if (Array.isArray(scenarioState.scenario?.evidence)) {
    for (const evidenceId of scenarioState.scenario.evidence) {
      evidenceIds.add(evidenceId);
    }
  }

  if (releaseDecision === "PASS") {
    releaseDecision = "GO";
  }

  return {
    contracts: contractsState.contracts,
    reports: reportsState.reports,
    scenario: scenarioState.scenario,
    summary: {
      contracts: contractsState.contracts.length,
      reports: reportsState.reports.length,
      scenarioPresent: Boolean(scenarioState.scenario?.scenarioId),
      releaseDecision,
      gateStatus,
      evidenceCount: evidenceIds.size,
    },
    errors,
    warnings: [],
  };
}
