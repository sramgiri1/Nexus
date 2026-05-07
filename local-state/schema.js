export const LOCAL_STATE_VERSION = "1.0";
export const LOCAL_RUNTIME_DIR = "local-state/runtime";
export const LOCAL_TASKS_FILE = `${LOCAL_RUNTIME_DIR}/tasks.json`;
export const LOCAL_EVIDENCE_FILE = `${LOCAL_RUNTIME_DIR}/evidence.jsonl`;
export const LOCAL_AUDIT_FILE = `${LOCAL_RUNTIME_DIR}/audit.jsonl`;
export const LOCAL_EVENTS_FILE = `${LOCAL_RUNTIME_DIR}/events.jsonl`;
export const LOCAL_APPROVALS_FILE = `${LOCAL_RUNTIME_DIR}/approvals.jsonl`;
export const LOCAL_INCIDENTS_FILE = `${LOCAL_RUNTIME_DIR}/incidents.jsonl`;
export const LOCAL_RUNTIME_TASKS = LOCAL_TASKS_FILE;
export const LOCAL_RUNTIME_EVIDENCE = LOCAL_EVIDENCE_FILE;
export const LOCAL_RUNTIME_AUDIT = LOCAL_AUDIT_FILE;
export const LOCAL_RUNTIME_EVENTS = LOCAL_EVENTS_FILE;
export const LOCAL_RUNTIME_APPROVALS = LOCAL_APPROVALS_FILE;
export const LOCAL_RUNTIME_INCIDENTS = LOCAL_INCIDENTS_FILE;

export const ALLOWED_SOURCE_DIRS = [
  "reports",
  "demo",
  "artifacts",
  "capabilities",
  "policy",
  "docs/architecture",
  LOCAL_RUNTIME_DIR,
];

export const BLOCKED_SOURCE_DIRS = [
  "node_modules",
  ".git",
  "projects",
  "private",
  "memory/private",
];

export const ALLOWED_WRITE_DIRS = [LOCAL_RUNTIME_DIR];

export const BLOCKED_WRITE_DIRS = [
  "node_modules",
  ".git",
  "projects",
  "private",
  "memory",
  "config",
];

export const KNOWN_REPORTS = [
  {
    id: "command-center-live",
    name: "Command Center Live Wiring",
    path: "reports/command-center-live-report.md",
  },
  {
    id: "runtime-traffic-plane",
    name: "Runtime Traffic Plane",
    path: "reports/runtime-traffic-plane-report.md",
  },
  {
    id: "domain-ownership",
    name: "Domain Ownership",
    path: "reports/domain-ownership-report.md",
  },
  {
    id: "demo-showcase",
    name: "Demo Showcase",
    path: "reports/demo-showcase-report.md",
  },
  {
    id: "public-safety",
    name: "Public Safety",
    path: "reports/public-safety-report.md",
  },
  {
    id: "observability-evals-artifacts",
    name: "Observability Evals Artifacts",
    path: "reports/observability-evals-artifacts-report.md",
  },
  {
    id: "capabilities",
    name: "Capabilities",
    path: "reports/capability-report.md",
  },
  {
    id: "os-reliability",
    name: "OS Reliability",
    path: "reports/os-reliability-report.md",
  },
  {
    id: "security-boundary",
    name: "Security Boundary",
    path: "reports/security-boundary-report.md",
  },
  {
    id: "data-protection",
    name: "Data Protection",
    path: "reports/data-protection-report.md",
  },
  {
    id: "agent-os-readiness",
    name: "Agent OS Readiness",
    path: "reports/agent-os-readiness-report.md",
  },
  {
    id: "agent-context",
    name: "Agent Context",
    path: "reports/agent-context-report.md",
  },
  {
    id: "format-readability",
    name: "Format Readability",
    path: "reports/format-readability-report.md",
  },
  {
    id: "local-write-boundary",
    name: "Local Write Boundary",
    path: "reports/local-write-boundary-report.md",
  },
  {
    id: "command-center-runtime-ingestion",
    name: "Command Center Runtime Ingestion",
    path: "reports/command-center-runtime-ingestion-report.md",
  },
  {
    id: "local-state-machine-enforcement",
    name: "Local State Machine Enforcement",
    path: "reports/local-state-machine-enforcement-report.md",
  },
];

export const KNOWN_DEMO_CONTRACTS = [
  "demo/contracts/nexus-release-contract.json",
  "demo/contracts/core-task-contract.json",
  "demo/contracts/auditor-verification-contract.json",
  "demo/contracts/sentinel-verification-contract.json",
  "demo/contracts/warden-verification-contract.json",
];

export const KNOWN_DEMO_REPORTS = [
  "demo/reports/auditor-report.json",
  "demo/reports/sentinel-report.json",
  "demo/reports/warden-report.json",
  "demo/reports/release-decision.json",
  "demo/reports/showcase-summary.json",
];
