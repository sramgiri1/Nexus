export const PATH_BOUNDARY_RULE_VERSION = "1.0";

export const GLOBAL_FORBIDDEN_PATH_PATTERNS = [
  ".env*",
  "**/.env*",
  "secrets/**",
  "providers/**",
  "orchestrator/loop.js",
  "orchestrator/runner.js",
  "projects/careloop/**",
  "projects/careloop-ios/**",
];

export const AGENT_PATH_BOUNDARIES = {
  CORE: {
    allowedPathPatterns: ["dashboard/src/**", "scripts/**", "docs/**", "reports/**", "agent-registry/**"],
    forbiddenPathPatterns: [...GLOBAL_FORBIDDEN_PATH_PATTERNS, "db/**", "policy/**"],
    notes: [
      "Can propose backend or dashboard implementation in scoped paths.",
      "Cannot touch secrets, policies, schema, deploy, or private project source without approval.",
    ],
  },
  SENTINEL: {
    allowedPathPatterns: ["scripts/check-*.js", "reports/**", "docs/**"],
    forbiddenPathPatterns: [...GLOBAL_FORBIDDEN_PATH_PATTERNS, "dashboard/src/**"],
    notes: ["Can validate and test; cannot mutate product code."],
  },
  AUDITOR: {
    allowedPathPatterns: ["reports/**", "docs/**", "activity-log/**"],
    forbiddenPathPatterns: [...GLOBAL_FORBIDDEN_PATH_PATTERNS],
    notes: ["Can review evidence and reports; cannot approve its own implementation work."],
  },
  WARDEN: {
    allowedPathPatterns: ["policy/**", "docs/architecture/**", "reports/**"],
    forbiddenPathPatterns: [...GLOBAL_FORBIDDEN_PATH_PATTERNS, "dashboard/src/**"],
    notes: ["Can block security and privacy risk; cannot implement product feature code."],
  },
  SWIFT: {
    allowedPathPatterns: ["docs/**", "reports/**"],
    forbiddenPathPatterns: [...GLOBAL_FORBIDDEN_PATH_PATTERNS],
    notes: ["iOS scope is metadata-only until the iOS runner is explicitly enabled."],
  },
};

export function getPathBoundaryForAgent(agentId) {
  return AGENT_PATH_BOUNDARIES[agentId] || {
    allowedPathPatterns: ["docs/**", "reports/**"],
    forbiddenPathPatterns: GLOBAL_FORBIDDEN_PATH_PATTERNS,
    notes: ["Default metadata-only boundary."],
  };
}
