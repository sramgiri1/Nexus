import { buildReleaseDeployExportPackagePreview } from "../../../shared/releaseDeployExportPackagePreview.js";

const DEFAULT_COST_IMPACT = "No provider calls, deploy jobs, export jobs, package jobs, network calls, or provider spend.";
const PAYLOAD_STATE = "Null executable payload";

function labelForSourceType(sourceType = "") {
  return String(sourceType)
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function asDisplayRow(row = {}) {
  return {
    label: row.displayName || labelForSourceType(row.sourceType),
    sourceType: row.sourceType,
    state: row.currentState || "blocked preview",
    nextAction: row.nextAction || "Review this item before any future shipping authority is considered.",
    disabledReason: row.disabledReason || "Execution remains blocked.",
    ownerCapability: row.ownerCapability || "NEXUS Release Deploy Export Package Preview Guard",
    evidenceLocation: row.evidenceRefs?.[0] || "reports/p1433-release-deploy-export-package-pipeline-report.md",
    activityLocation: row.activityRefs?.[0] || "os-roadmap/phase-status.json#P143.3",
    costImpact: row.costImpact?.providerSpendAllowed === false ? DEFAULT_COST_IMPACT : DEFAULT_COST_IMPACT,
    payloadState: PAYLOAD_STATE,
    rawPayloadVisible: row.rawPayloadVisible === true ? true : false,
    executionAllowed: row.executionAllowed === true ? true : false,
  };
}

export function buildShippingPreviewUxRows(sourceTypes = [], options = {}) {
  const preview = options.preview || buildReleaseDeployExportPackagePreview();
  const allowedSourceTypes = new Set(sourceTypes);
  return (preview.rows || [])
    .filter((row) => allowedSourceTypes.has(row.sourceType))
    .map(asDisplayRow);
}

function summarizeRows(rows = []) {
  return {
    rowCount: rows.length,
    blockedRowCount: rows.filter((row) => row.executionAllowed === false).length,
    executableRowCount: rows.filter((row) => row.executionAllowed === true).length,
    rawPayloadVisible: rows.some((row) => row.rawPayloadVisible === true),
    payloadState: PAYLOAD_STATE,
    costImpact: DEFAULT_COST_IMPACT,
  };
}

export function buildReleaseControlShippingPreviewUx(options = {}) {
  const rows = buildShippingPreviewUxRows(["release_gate", "export_package"], options);
  return {
    label: "Release and package preview",
    rows,
    summary: summarizeRows(rows),
  };
}

export function buildDeployMonitoringShippingPreviewUx(options = {}) {
  const rows = buildShippingPreviewUxRows(["deploy_target", "rollback_plan"], options);
  return {
    label: "Deploy and rollback preview",
    rows,
    summary: summarizeRows(rows),
  };
}

export function buildProjectShippingPreviewUx(options = {}) {
  const rows = buildShippingPreviewUxRows(["export_package", "provenance_record"], options);
  return {
    label: "Export, package, and provenance preview",
    rows,
    summary: summarizeRows(rows),
  };
}
