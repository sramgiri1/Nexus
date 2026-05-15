import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const DEFAULT_REPORT_PATH = "reports/scope-classification-report.md";

function row(label, classification) {
  return `| ${label} | ${classification.scopeType} | ${classification.changeType} | ${
    classification.packagingRisk
  } | ${classification.requiresReview ? "yes" : "no"} |`;
}

export function buildScopeClassificationReport(results = {}, options = {}) {
  const branch = options.branch || "unknown";
  const head = options.head || "unknown";
  const generatedAt = options.generatedAt || new Date().toISOString();
  const samples = results.samples || {};
  const policy = results.policy || {};

  return `# NEXUS Scope Classification Report

## Metadata

- Generated at: ${generatedAt}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P43.1 - Scope Classification Model

## Scope Model Summary

- Scope types: NEXUS_OS, PROJECT, CROSS_CUTTING, DEMO, UNKNOWN
- Change types: NEXUS_OS_CHANGE, PROJECT_CHANGE, CROSS_CUTTING_CHANGE, DEMO_CHANGE, UNKNOWN_CHANGE
- Classification only: yes
- Runtime enforcement: not enabled
- Project mutation: disabled
- Export and packaging pipeline: not enabled

## Sample Classifications

| Sample | Scope type | Change type | Packaging risk | Requires review |
| --- | --- | --- | --- | --- |
${row("NEXUS OS file", samples.nexusOs)}
${row("Project file", samples.project)}
${row("Demo file", samples.demo)}
${row("Cross-cutting file set", samples.crossCutting)}
${row("Unknown file", samples.unknown)}

## Policy Summary

- Policy phase: ${policy.phase || "unknown"}
- Cross-cutting requires review: ${policy.crossCuttingRequiresReview === true ? "yes" : "no"}
- Unknown requires review: ${policy.unknownRequiresReview === true ? "yes" : "no"}
- Packaging safety checks enabled: ${policy.packagingSafetyChecksEnabled === true ? "yes" : "no"}
- Export pipeline enabled: ${policy.exportPipelineEnabled === true ? "yes" : "no"}
- Provider calls allowed: ${policy.providerCallsAllowed === true ? "yes" : "no"}
- Tool dispatch allowed: ${policy.toolDispatchAllowed === true ? "yes" : "no"}
- Worker runtime allowed: ${policy.workerRuntimeAllowed === true ? "yes" : "no"}
- DB writes allowed: ${policy.dbWritesAllowed === true ? "yes" : "no"}

## Limitations

- P43.1 classifies scope only; it does not enforce runtime boundaries.
- Packaging safety checks are planned for later P43 subphases.
- Project export, release manifests, provider/tool execution, worker runtime, and DB writes remain disabled.

## Next Phase

P43.2 - Project vs OS Mutation Boundary
`;
}

export function writeScopeClassificationReport(report, options = {}) {
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
