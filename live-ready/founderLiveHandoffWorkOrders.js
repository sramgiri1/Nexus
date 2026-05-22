import { createPassResult } from "../shared/resultEnvelope.js";
import {
  P102_HANDOFF_SAFETY_FLAGS,
  buildFounderLiveHandoffManifest,
} from "./founderLiveHandoffManifest.js";

export const P102_FOUNDER_LIVE_HANDOFF_WORK_ORDERS_PHASE = "P102.3";

export const P102_WORK_ORDER_DRY_RUN_STATES = Object.freeze({
  DRY_RUN_READY_EXECUTION_BLOCKED: "founder_live_handoff_work_orders_dry_run_ready_execution_blocked",
  NEEDS_HANDOFF_MANIFEST: "founder_live_handoff_work_orders_need_manifest",
});

function blockedSafetyFlags() {
  return Object.fromEntries(P102_HANDOFF_SAFETY_FLAGS.map((flag) => [flag, false]));
}

function agentLabelForLane(lane = {}) {
  const key = lane.laneKey || "";
  if (key.includes("prd")) return "Product Strategist";
  if (key.includes("workstream")) return "Program Architect";
  if (key.includes("db")) return "Data Steward";
  if (key.includes("admission")) return "Safety Governor";
  if (key.includes("readiness")) return "Launch Readiness Lead";
  return "Founder Intake Lead";
}

function buildWorkOrderRow(lane = {}, index = 0) {
  const agentLabel = agentLabelForLane(lane);
  return {
    workOrderKey: `dry-run-${lane.laneKey || `lane-${index + 1}`}`,
    laneKey: lane.laneKey || `handoff-lane-${index + 1}`,
    title: `${agentLabel}: ${lane.label || `Handoff Lane ${index + 1}`}`,
    proposedAgent: agentLabel,
    proposedWork:
      lane.handoffState === "ready_for_governed_handoff_review"
        ? `Prepare a governed implementation plan for ${lane.label || "this lane"} after a later execution phase grants authority.`
        : `Collect missing context for ${lane.label || "this lane"} before implementation planning.`,
    dryRunState: "dry_run_only_execution_blocked",
    currentState: lane.currentState || "Not Ready",
    ownerCapability: lane.ownerCapability || "NEXUS Founder Live Handoff Governance",
    validationCommand: "npm run check:p1023-founder-live-handoff-work-orders",
    nextAction: lane.nextAction || "Review this dry-run row before any later execution phase.",
    blocker: lane.blocker || "Execution remains blocked by the P102 safety contract.",
    disabledReason:
      "P102.3 creates local dry-run work-order rows only. Agent dispatch, worker/tool execution, project mutation, provider/model calls, hosted DB mutation, deploy, release, export, package, network calls, and spend remain blocked.",
    evidenceRefs: lane.evidenceRefs || [],
    activityLocation: lane.activityLocation || "reports/os-phase-status-report.md",
    costImpact: "Dry-run work-order row only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
    executable: false,
    dispatchable: false,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    projectMutationAllowed: false,
    providerCallsAllowed: false,
    ...blockedSafetyFlags(),
  };
}

export function buildFounderLiveHandoffWorkOrders(input = {}) {
  const manifestEnvelope = input.manifestEnvelope || buildFounderLiveHandoffManifest(input);
  const manifestData = manifestEnvelope.data || {};
  const workOrderRows = (manifestData.handoffLanes || []).map(buildWorkOrderRow);
  const dryRunReady = workOrderRows.length > 0 && manifestData.handoffReadiness?.manifestReady === true;

  return createPassResult({
    phase: P102_FOUNDER_LIVE_HANDOFF_WORK_ORDERS_PHASE,
    mode: "founder-live-handoff-work-order-dry-run",
    source: "live-ready/founderLiveHandoffWorkOrders.js",
    summary: "Founder live handoff work-order rows are generated as local dry-run planning artifacts; execution remains blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: dryRunReady
        ? P102_WORK_ORDER_DRY_RUN_STATES.DRY_RUN_READY_EXECUTION_BLOCKED
        : P102_WORK_ORDER_DRY_RUN_STATES.NEEDS_HANDOFF_MANIFEST,
      sourceManifestPhase: manifestEnvelope.phase,
      sourceManifestState: manifestData.currentState,
      founderContextSummary: manifestData.founderContextSummary,
      workOrderReadiness: {
        dryRunReady,
        dryRunRowCount: workOrderRows.length,
        executableWorkOrderCount: 0,
        dispatchableWorkOrderCount: 0,
        projectMutationWorkOrderCount: 0,
      },
      workOrderRows,
      nextAction: dryRunReady
        ? "Render these dry-run work-order rows in P102.4 Command Center UX without runnable controls."
        : "Complete the handoff manifest before dry-run work-order review.",
      blockers: [
        "Agent dispatch remains blocked.",
        "Worker/tool execution remains blocked.",
        "Project mutation remains blocked.",
        "Provider/model calls remain blocked.",
        "Hosted DB mutation remains blocked.",
        "Provider spend remains blocked.",
      ],
      disabledReason:
        "P102.3 is local dry-run planning only. It does not create live work orders, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ownerCapability: "NEXUS Founder Live Handoff Work Order Governance",
      evidenceRefs: [
        "reports/p1023-founder-live-handoff-work-orders-report.md",
        ...(manifestData.evidenceRefs || []),
      ],
      activityLocation: manifestData.activityLocation || "reports/os-phase-status-report.md",
      costImpact: "Local dry-run work-order planning only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedSafetyFlags(),
    },
    evidence: [
      "reports/p1023-founder-live-handoff-work-orders-report.md",
      "reports/p1022-founder-live-handoff-manifest-report.md",
      "contracts/os-roadmap/p102-founder-live-handoff-contracts.json",
    ],
    warnings: [
      "P102.3 does not create live work orders, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function validateFounderLiveHandoffWorkOrders(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P102_FOUNDER_LIVE_HANDOFF_WORK_ORDERS_PHASE) errors.push("phase must be P102.3");
  for (const field of [
    "schemaVersion",
    "currentState",
    "sourceManifestPhase",
    "founderContextSummary",
    "workOrderReadiness",
    "workOrderRows",
    "nextAction",
    "blockers",
    "disabledReason",
    "ownerCapability",
    "evidenceRefs",
    "activityLocation",
    "costImpact",
  ]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.workOrderRows) || data.workOrderRows.length < 5) errors.push("workOrderRows must cover handoff lanes");
  if (data.workOrderReadiness?.executableWorkOrderCount !== 0) errors.push("executableWorkOrderCount must be 0");
  if (data.workOrderReadiness?.dispatchableWorkOrderCount !== 0) errors.push("dispatchableWorkOrderCount must be 0");
  if (data.workOrderReadiness?.projectMutationWorkOrderCount !== 0) errors.push("projectMutationWorkOrderCount must be 0");
  for (const row of data.workOrderRows || []) {
    for (const field of ["workOrderKey", "laneKey", "title", "proposedAgent", "proposedWork", "dryRunState", "ownerCapability", "validationCommand", "nextAction", "blocker", "disabledReason", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in row)) errors.push(`${row.title || "row"}.${field} missing`);
    }
    if (row.executable !== false) errors.push(`${row.title}.executable must be false`);
    if (row.dispatchable !== false) errors.push(`${row.title}.dispatchable must be false`);
    if (row.projectMutationAllowed !== false) errors.push(`${row.title}.projectMutationAllowed must be false`);
    for (const flag of P102_HANDOFF_SAFETY_FLAGS) {
      if (row[flag] !== false) errors.push(`${row.title}.${flag} must be false`);
    }
  }
  for (const flag of P102_HANDOFF_SAFETY_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("work-order dry run must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|execute now/i.test(serialized)) errors.push("work-order dry run must not expose fake unsafe runnable actions");
  if (/raw json|raw logs|raw policy dump/i.test(serialized)) errors.push("work-order dry run must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}
