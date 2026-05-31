import { buildAdminOperationsRuntimeSettingsDryRun } from "../../../shared/adminOperationsRuntimeSettingsDryRun.js";
import { buildAdminOperationsRuntimeSettingsModel } from "../../../shared/adminOperationsRuntimeSettingsModel.js";

function displayState(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayText(value = "") {
  return String(value || "")
    .replace(/P\d+(?:\.\d+)?/g, "the current admin settings phase")
    .replace(/\braw log export\b/gi, "internal log export")
    .replace(/\braw logs?\b/gi, "internal logs")
    .replace(/\braw state\b/gi, "internal state")
    .replace(/\braw data\b/gi, "unsanitized data")
    .replace(/\braw JSON\b/gi, "unsanitized JSON")
    .replace(/\braw policy dump\b/gi, "unsanitized policy dump")
    .replace(/\s+/g, " ")
    .trim();
}

function evidenceLabel(value = "") {
  if (/dry-run|dry run/i.test(value)) return "Admin dry-run report";
  if (/phase-status|roadmap/i.test(value)) return "OS roadmap status";
  if (/activity/i.test(value)) return "Activity Log";
  return "Admin settings report";
}

function costLabel(costImpact = {}) {
  if (costImpact.estimatedUsd === 0 && costImpact.actualUsd === 0) return "No spend";
  return "Cost review required";
}

function firstBlockers(blockers = []) {
  return blockers.slice(0, 3).map(displayText);
}

function mapModelRow(row = {}, category = "setting") {
  return {
    label: displayText(row.displayName || category),
    category: displayState(category),
    currentState: displayState(row.currentState || row.captureState || row.healthState || "blocked"),
    owner: displayText(row.ownerCapability || "NEXUS Admin Operations Runtime Settings Guard"),
    nextAction: displayText(row.nextAction || "Review this settings row before any future authority phase."),
    disabledReason: displayText(row.disabledReason || "Admin operation authority remains disabled."),
    blockers: firstBlockers(row.blockers || []),
    evidence: evidenceLabel((row.evidenceRefs || [])[0]),
    activity: "Activity Log",
    cost: costLabel(row.costImpact || {}),
    stateTone: "amber",
  };
}

function mapDryRunRow(row = {}) {
  return {
    label: displayText(row.displayName || "Admin dry-run row"),
    category: displayState(row.category || "admin"),
    currentState: displayState(row.currentState || "blocked"),
    dryRunState: "Blocked",
    owner: displayText(row.ownerCapability || "NEXUS Admin Operations Dry Run Guard"),
    nextAction: displayText(row.nextAction || "Review the blocked dry-run row before any future authority phase."),
    disabledReason: displayText(row.disabledReason || "Dry run has no executable command."),
    blockers: firstBlockers(row.blockers || []),
    evidence: evidenceLabel((row.evidenceRefs || [])[0]),
    activity: "Activity Log",
    cost: costLabel(row.costImpact || {}),
  };
}

function categoryCount(rows = [], category) {
  return rows.filter((row) => row.category === category).length;
}

export function buildAdminOperationsRuntimeSettingsReadinessViewModel() {
  const model = buildAdminOperationsRuntimeSettingsModel({ createdAt: "2026-05-31T12:10:00.000Z" });
  const dryRun = buildAdminOperationsRuntimeSettingsDryRun({ sourceModel: model });
  const dryRunRows = (dryRun.dryRunRows || []).map(mapDryRunRow);

  return {
    routeId: "admin-operations-runtime-settings",
    pageTitle: "Settings",
    whatChanged: "Admin settings, feature gates, maintenance controls, runtime state, audit surfaces, and dry-run results are visible in Command Center.",
    currentState: "Admin operations settings are review-ready and display-only; mutation and execution remain disabled.",
    nextAction: "Review blocked settings posture, dry-run rows, and evidence before any future authority phase is considered.",
    ownerAgent: "WARDEN",
    ownerCapability: "NEXUS Admin Operations Runtime Settings Guard",
    evidenceLocation: "Admin settings report",
    activityLocation: "Activity Log",
    costImpact: "No provider spend",
    disabledReason: "Settings mutation, feature toggles, feature rollouts, maintenance execution, maintenance scheduling, runtime writes, audit export, credential handling, provider calls, tool execution, agent dispatch, project mutation, deploy, release, package, network calls, and spend remain disabled.",
    readinessCards: [
      { label: "Admin settings", value: `${model.settings.length} rows`, tone: "teal", detail: "Settings are visible for review without save or apply authority." },
      { label: "Feature gates", value: `${model.featureGates.length} rows`, tone: "amber", detail: "Feature toggles and rollouts remain blocked." },
      { label: "Maintenance", value: `${model.maintenanceControls.length} rows`, tone: "amber", detail: "Maintenance scheduling and execution remain disabled." },
      { label: "Runtime state", value: `${model.runtimeStates.length} rows`, tone: "amber", detail: "Runtime state and DB writes remain blocked." },
      { label: "Dry run", value: `${dryRun.dryRunRowCount} blocked`, tone: "teal", detail: "Dry-run rows have no executable command or payload." },
      { label: "Cost", value: "No spend", tone: "green", detail: "No provider, network, export, package, or deployment cost is created." },
    ],
    settingsRows: model.settings.map((row) => mapModelRow(row, "settings")),
    featureGateRows: model.featureGates.map((row) => mapModelRow(row, "feature gates")),
    maintenanceRows: model.maintenanceControls.map((row) => mapModelRow(row, "maintenance")),
    runtimeStateRows: model.runtimeStates.map((row) => mapModelRow(row, "runtime state")),
    auditSurfaceRows: model.auditSurfaces.map((row) => mapModelRow(row, "audit surface")),
    dryRunSummary: {
      rowCount: dryRun.dryRunRowCount,
      blockedRowCount: dryRun.blockedDryRunRowCount,
      executableRowCount: dryRun.executableDryRunRowCount,
      settingRows: categoryCount(dryRun.dryRunRows, "setting"),
      featureRows: categoryCount(dryRun.dryRunRows, "featureGate"),
      maintenanceRows: categoryCount(dryRun.dryRunRows, "maintenance"),
      runtimeRows: categoryCount(dryRun.dryRunRows, "runtimeState"),
      auditRows: categoryCount(dryRun.dryRunRows, "audit"),
      nextAction: displayText(dryRun.nextAction),
    },
    dryRunRows,
    evidenceRows: [
      { label: "Settings model", value: "Admin settings report", detail: "Read-only settings, gates, maintenance, runtime state, and audit posture." },
      { label: "Dry run", value: "Admin dry-run report", detail: "Blocked dry-run rows with zero executable candidates." },
      { label: "Activity", value: "Activity Log", detail: "Use activity records for operator review, not settings mutation." },
      { label: "Audit", value: "OS roadmap status", detail: "Phase status records the current handoff and blocked authority." },
    ],
    disabledActions: [
      { label: "Save settings", reason: "Settings write APIs are not enabled." },
      { label: "Apply settings", reason: "Runtime settings mutation remains disabled." },
      { label: "Toggle features", reason: "Feature toggle authority remains disabled." },
      { label: "Roll out features", reason: "Feature rollout authority remains disabled." },
      { label: "Schedule maintenance", reason: "Maintenance scheduling remains disabled." },
      { label: "Run maintenance", reason: "Maintenance execution remains disabled." },
      { label: "Write runtime state", reason: "Runtime DB writes and state mutation remain disabled." },
      { label: "Export audit", reason: "Audit export and internal log export remain disabled." },
      { label: "Call providers", reason: "Provider and model calls remain disabled." },
      { label: "Dispatch agents", reason: "Tool execution, agent dispatch, project mutation, deploy, release, package, network calls, and spend remain disabled." },
    ],
    safety: {
      settingsMutationAllowed: dryRun.settingsMutationAllowed,
      featureToggleAllowed: dryRun.featureToggleAllowed,
      featureRolloutAllowed: dryRun.featureRolloutAllowed,
      maintenanceExecutionAllowed: dryRun.maintenanceExecutionAllowed,
      maintenanceSchedulingAllowed: dryRun.maintenanceSchedulingAllowed,
      runtimeDbWriteAllowed: dryRun.runtimeDbWriteAllowed,
      auditExportAllowed: dryRun.auditExportAllowed,
      providerModelCallAllowed: dryRun.providerModelCallAllowed,
      toolExecutionAllowed: dryRun.toolExecutionAllowed,
      agentDispatchAllowed: dryRun.agentDispatchAllowed,
      projectMutationAllowed: dryRun.projectMutationAllowed,
      deployAllowed: dryRun.deployAllowed,
      releaseAllowed: dryRun.releaseAllowed,
      packageAllowed: dryRun.packageAllowed,
      networkCallAllowed: dryRun.networkCallAllowed,
      providerSpendAllowed: dryRun.providerSpendAllowed,
    },
  };
}

export const adminOperationsRuntimeSettingsReadinessViewModel = buildAdminOperationsRuntimeSettingsReadinessViewModel();
