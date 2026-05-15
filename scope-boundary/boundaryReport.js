import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const DEFAULT_REPORT_PATH = "reports/project-os-boundary-report.md";

function decisionRow(label, decision) {
  return `| ${label} | ${decision.changeScope} | ${decision.mutationAllowed ? "yes" : "no"} | ${
    decision.requiresReview ? "yes" : "no"
  } | ${decision.reason} |`;
}

export function buildProjectOsBoundaryReport(results = {}, options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const branch = options.branch || "unknown";
  const head = options.head || "unknown";
  const decisions = results.decisions || {};

  return `# NEXUS Project / OS Boundary Report

## Metadata

- Generated at: ${generatedAt}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P43.2 - Project vs OS Mutation Boundary

## Summary

- Boundary model: classification and dry-run decision only
- Project mutation: disabled
- OS mutation: disabled
- Cross-cutting changes: review required
- Unknown changes: review required

## Sample Decisions

| Sample | Change scope | Mutation allowed | Requires review | Reason |
| --- | --- | --- | --- | --- |
${decisionRow("NEXUS OS paths", decisions.os)}
${decisionRow("Project paths", decisions.project)}
${decisionRow("iOS project paths", decisions.projectIos)}
${decisionRow("Docs paths", decisions.docs)}
${decisionRow("Reports paths", decisions.reports)}
${decisionRow("Mixed OS + project paths", decisions.crossCutting)}
${decisionRow("Unknown paths", decisions.unknown)}

## Limitations

- P43.2 does not enable mutation enforcement.
- P43.2 does not package or export projects.
- Provider/tool/worker execution and DB writes remain disabled.

## Next Phase

P43.3 - Project Export Safety Rules
`;
}

export function writeProjectOsBoundaryReport(report, options = {}) {
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
