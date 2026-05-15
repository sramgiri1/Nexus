import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const DEFAULT_REPORT_PATH = "reports/project-export-safety-report.md";

function pathRows(paths) {
  if (!Array.isArray(paths) || paths.length === 0) return "| none | none | none |\n";
  return paths.map((entry) => `| ${entry.path} | ${entry.category} | ${entry.reason} |`).join("\n");
}

export function buildProjectExportSafetyReport(result = {}, options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const branch = options.branch || "unknown";
  const head = options.head || "unknown";

  return `# NEXUS Project Export Safety Report

## Metadata

- Generated at: ${generatedAt}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P43.3 - Project Export Safety Rules

## Summary

- Project: ${result.projectId || "private-project"}
- Mode: ${result.mode || "local-private"}
- Export execution: disabled
- Dry-run only: ${result.dryRunOnly === true ? "yes" : "no"}
- Package created: no
- Candidate paths allowed: ${Array.isArray(result.allowedPaths) ? result.allowedPaths.length : 0}
- Candidate paths blocked: ${Array.isArray(result.blockedPaths) ? result.blockedPaths.length : 0}
- NEXUS internals detected: ${result.nexusInternalsDetected === true ? "yes" : "no"}
- Secrets detected: ${result.secretsDetected === true ? "yes" : "no"}
- Demo data detected: ${result.demoDataDetected === true ? "yes" : "no"}

## Allowed Dry-Run Paths

| Path | Category | Reason |
| --- | --- | --- |
${pathRows(result.allowedPaths)}

## Blocked Paths

| Path | Category | Reason |
| --- | --- | --- |
${pathRows(result.blockedPaths)}

## Blocked Reasons

${(result.blockedReasons || []).map((reason) => `- ${reason}`).join("\n") || "- none"}

## Explicit Non-Goals

- No project package is created.
- No project source is mutated.
- No NEXUS OS internals are exported into a project package.
- Raw evidence, audit, activity, local-state runtime files, and secrets remain blocked.
- Provider/tool/worker execution and DB writes remain disabled.

## Next Phase

P43.4 - Redacted Release Manifest
`;
}

export function writeProjectExportSafetyReport(report, options = {}) {
  const root = options.root || process.cwd();
  const reportPath = options.reportPath || DEFAULT_REPORT_PATH;
  const fullPath = join(root, reportPath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, report, "utf8");
  return {
    reportPath,
    bytes: Buffer.byteLength(report, "utf8"),
  };
}
