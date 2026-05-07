export const LOCAL_STATE_VERSION = "1.0";

export const ALLOWED_SOURCE_DIRS = [
  "reports",
  "demo",
  "artifacts",
  "capabilities",
  "policy",
  "docs/architecture",
];

export const BLOCKED_SOURCE_DIRS = [
  "node_modules",
  ".git",
  "projects",
  "private",
  "memory/private",
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
