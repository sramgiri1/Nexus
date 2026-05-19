import { createPassResult } from "../shared/resultEnvelope.js";

export const P70_2_REQUIRED_FIELDS = Object.freeze([
  "monitorId",
  "deployId",
  "targetKind",
  "environmentLabel",
  "observedState",
  "severity",
  "allowedFiles",
  "forbiddenFiles",
  "deployExecutionAllowed",
  "monitorExecutionAllowed",
  "incidentExecutionAllowed",
  "mitigationExecutionAllowed",
  "rollbackExecutionAllowed",
  "alertDispatchAllowed",
  "projectMutationAllowed",
  "providerDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "providerSpendAllowed",
  "disabledReason",
  "blockers",
  "evidenceRefs",
  "activityRefs",
  "costImpact",
  "ownerCapability",
  "nextAction",
]);

const DEFAULT_ALLOWED_FILES = Object.freeze([
  "deploy-monitoring/p70-2-placeholder.js",
  "scripts/check-p702.js",
  "reports/p702-report.md",
]);

const DEFAULT_FORBIDDEN_FILES = Object.freeze([
  "projects/**",
  "project-roadmap/**",
  "providers/**",
  "tool-governance/adapters/**",
  "worker-runtime/workerRunner.js",
  "worker-runtime/queueRunner.js",
  "db/**",
  "prisma/**",
  "deploy/**",
  "release/**",
  "scripts/deploy*.js",
  "scripts/release*.js",
  ".env",
  ".env.*",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function hasProjectPath(paths = []) {
  return normalizeList(paths).some((filePath) => filePath === "projects/**" || filePath.startsWith("projects/"));
}

export function createDeployMonitorEvent(input = {}) {
  return {
    monitorId: input.monitorId || "deploy-monitor-event-preview",
    deployId: input.deployId || "nexus-os-deploy-preview",
    targetKind: "nexus_os",
    environmentLabel: input.environmentLabel || "local preview",
    observedState: input.observedState || "monitor_ready_for_review",
    severity: input.severity || "info",
    allowedFiles: normalizeList(input.allowedFiles).length > 0 ? normalizeList(input.allowedFiles) : [...DEFAULT_ALLOWED_FILES],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
    deployExecutionAllowed: false,
    monitorExecutionAllowed: false,
    incidentExecutionAllowed: false,
    mitigationExecutionAllowed: false,
    rollbackExecutionAllowed: false,
    alertDispatchAllowed: false,
    projectMutationAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    dbWritesAllowed: false,
    networkCallsAllowed: false,
    providerSpendAllowed: false,
    disabledReason: "P70.2 records deploy monitor events only; deploy, monitor, alert, incident, rollback, and mitigation execution remain disabled.",
    blockers: [
      "Monitor execution is disabled.",
      "Alert dispatch, incident execution, rollback execution, and mitigation execution are disabled.",
      "Provider/tool/worker execution, DB writes, network calls, project mutation, and provider spend remain disabled.",
      ...normalizeList(input.blockers),
    ],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p702-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P70.2"])],
    costImpact: "No provider calls, alert dispatch, network execution, deploy execution, mitigation execution, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.deployMonitoringPreview",
    nextAction: input.nextAction || "Route this monitor event through P70.3 incident signal preview.",
    commandCenterVisible: true,
  };
}

export function validateDeployMonitorEvent(event = {}) {
  const errors = [];
  for (const field of P70_2_REQUIRED_FIELDS) {
    if (!(field in event)) errors.push(`missing ${field}`);
  }
  if (event.targetKind !== "nexus_os") errors.push("targetKind must be nexus_os");
  if (!Array.isArray(event.allowedFiles) || event.allowedFiles.length === 0) errors.push("allowedFiles must be non-empty");
  if (hasProjectPath(event.allowedFiles)) errors.push("allowedFiles must not include project source paths");
  if (!Array.isArray(event.forbiddenFiles) || !event.forbiddenFiles.includes("projects/**")) errors.push("forbiddenFiles must include projects/**");
  if (event.deployExecutionAllowed !== false || event.monitorExecutionAllowed !== false) errors.push("deploy/monitor execution must be disabled");
  if (event.incidentExecutionAllowed !== false || event.mitigationExecutionAllowed !== false || event.rollbackExecutionAllowed !== false) errors.push("incident/mitigation/rollback execution must be disabled");
  if (event.alertDispatchAllowed !== false) errors.push("alertDispatchAllowed must be false");
  if (event.projectMutationAllowed !== false) errors.push("projectMutationAllowed must be false");
  if (event.providerDispatchAllowed !== false || event.toolExecutionAllowed !== false || event.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (event.dbWritesAllowed !== false || event.networkCallsAllowed !== false || event.providerSpendAllowed !== false) errors.push("db/network/spend must be false");
  if (!event.disabledReason || /monitor now|alert now|deploy now|rollback now|mitigate now|execute now/i.test(event.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(event.blockers) || event.blockers.length < 3) errors.push("blockers must be visible");
  if (!Array.isArray(event.evidenceRefs) || event.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(event.activityRefs) || event.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildDeployMonitorEventEnvelope(input = {}) {
  const event = createDeployMonitorEvent(input);
  return createPassResult({
    phase: "P70.2",
    mode: "preview-only",
    source: "deploy-monitoring/p70-2-placeholder.js",
    summary: "Deploy monitor event recorded without enabling monitor, alert, deploy, incident, rollback, or mitigation execution.",
    data: { event },
    evidence: event.evidenceRefs,
  });
}

export const P70_2_SAMPLE_EVENTS = Object.freeze([
  createDeployMonitorEvent({
    evidenceRefs: ["reports/p702-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P70.2"],
  }),
]);
