import { createPassResult } from "../shared/resultEnvelope.js";
import {
  P94_FOUNDER_RUNTIME_DB_ENTITIES,
  buildFounderRuntimeDbCrudWorkflow,
} from "./founderRuntimeDbCrudWorkflow.js";
import {
  buildFounderPersistenceOperatorControls,
  validateFounderPersistenceOperatorControls,
} from "./founderPersistenceOperatorControls.js";

export const P96_FOUNDER_BUSINESS_BUILD_READINESS_PHASE = "P96.2";
export const P96_FOUNDER_BUSINESS_BUILD_DRY_RUN_ADMISSION_PHASE = "P96.3";
export const P96_FOUNDER_BUSINESS_BUILD_DRY_RUN_PHASE = "P96.3";

const BLOCKED_RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "localExecutorRunAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
  "newWorkspaceFileWritesAllowed",
  "existingProjectMutationAllowed",
  "hostedDbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
]);

const FORBIDDEN_OPERATIONS = Object.freeze([
  "provider/model calls",
  "agent dispatch",
  "worker/tool execution",
  "project creation",
  "project mutation",
  "hosted DB mutation",
  "raw SQL",
  "delete",
  "network calls",
  "deploy/release/export/package",
  "provider spend",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(BLOCKED_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function displayState(value = "") {
  return String(value || "not_ready")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function summarizeFounderSession(record = {}) {
  return {
    label: record.publicLabel || "Founder session",
    currentState: record.currentState || "not_persisted",
    founderIdeaSummary: record.founderIdeaSummary || "Founder idea summary pending.",
    nextQuestion: record.nextQuestion || "Confirm target customer, launch constraint, and success metric.",
    readinessPercent: record.readinessPercent ?? 0,
    rawIdsHidden: true,
  };
}

function summarizePrdArtifact(record = {}) {
  return {
    title: record.title || "Founder PRD",
    currentState: record.currentState || "not_drafted",
    problemSummary: record.problemSummary || "Problem summary pending.",
    customerSummary: record.customerSummary || "Target customer pending.",
    solutionSummary: record.solutionSummary || "Solution summary pending.",
    readinessPercent: record.readinessPercent ?? 0,
    rawIdsHidden: true,
  };
}

function summarizeWorkstreamPlan(record = {}) {
  return {
    label: record.lane ? `${displayState(record.lane)} lane` : "Business build lane",
    currentState: record.currentState || "not_planned",
    ownerCapability: record.ownerCapability || "NEXUS Business Build Readiness",
    nextAction: record.nextAction || "Review readiness evidence before any later execution phase.",
    dispatchAllowed: false,
    workerExecutionAllowed: false,
    projectMutationAllowed: false,
    rawIdsHidden: true,
  };
}

function buildLane(entitySummary = {}, index = 0) {
  return {
    laneId: `business-build-readiness-${index + 1}`,
    label: entitySummary.label || displayState(entitySummary.entity || "Business build readiness"),
    ownerCapability: index === 0 ? "NEXUS Founder Runtime DB" : "NEXUS Business Build Readiness",
    readinessState: entitySummary.currentState || "local_record_review_required",
    allowedLocalInspection: true,
    executionAllowed: false,
    dispatchAllowed: false,
    projectMutationAllowed: false,
    missingEvidence: ["operatorApproval", "rollbackAccepted", "auditAccepted", "validationCommandsAccepted"],
    nextAction: "Review local founder workflow evidence before execution readiness can advance.",
    disabledReason: "P96.2 models Business Build local execution readiness only. Runtime execution remains blocked.",
    evidenceRefs: ["reports/p962-founder-business-build-readiness-model-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local deterministic readiness model only. No provider spend.",
  };
}

function buildDryRunAdmissionLane(lane = {}, snapshotData = {}) {
  const snapshotMissingEvidence = snapshotData.missingEvidence || [];
  const missingEvidence = snapshotMissingEvidence.length === 0
    ? []
    : Array.from(new Set([
      ...(lane.missingEvidence || []),
      ...snapshotMissingEvidence,
    ]));
  const futureReviewEligible = missingEvidence.length === 0;
  return {
    laneId: lane.laneId,
    label: lane.label,
    ownerCapability: lane.ownerCapability,
    readinessState: lane.readinessState,
    dryRunAdmissionState: futureReviewEligible
      ? "eligible_for_future_governed_execution_review"
      : "blocked_until_required_evidence",
    allowedLocalInspection: true,
    admissionPreviewAllowed: true,
    futureReviewEligible,
    executionAllowed: false,
    dispatchAllowed: false,
    projectMutationAllowed: false,
    ...blockedRuntimeFlags(),
    requiredEvidence: [
      "operatorApproval",
      "rollbackAccepted",
      "auditAccepted",
      "validationCommandsAccepted",
      "sqliteLiveMode",
      "sqliteWritesEnabled",
      "laterExecutionPhaseContract",
      "scopedFounderBusinessBuildTask",
      "postRunReviewPlan",
    ],
    missingEvidence,
    validationCommands: [
      "npm run check:p963-founder-business-build-dry-run-admission",
      "npm run check:p962-founder-business-build-readiness-model",
      "npm run check:p961-founder-business-build-readiness-contract",
      "npm run check:os-phase-status",
      "npm run check:phase-validation-coverage",
    ],
    nextAction: futureReviewEligible
      ? "Carry this lane into P96.4 Command Center UX as a blocked admission preview."
      : "Collect local readiness evidence before this lane can be reviewed by a later execution phase.",
    disabledReason:
      "P96.3 is a dry-run admission preview only. No agent dispatch, worker/tool execution, project mutation, provider/model call, hosted DB mutation, deploy, release, export, package, network call, or spend is enabled.",
    evidenceRefs: [
      "reports/p963-founder-business-build-dry-run-admission-report.md",
      ...(lane.evidenceRefs || []),
    ],
    activityLocation: lane.activityLocation || "reports/os-phase-status-report.md",
    costImpact: "Local deterministic dry-run admission only. No provider spend.",
  };
}

export function buildFounderBusinessBuildPersistenceSnapshot(input = {}) {
  const workflow = buildFounderRuntimeDbCrudWorkflow(input);
  const controls = buildFounderPersistenceOperatorControls(input);
  const workflowData = workflow.data || {};
  const controlData = controls.data || {};
  const controlValidation = validateFounderPersistenceOperatorControls(controls);
  const localEntitySummaries = controlData.localEntitySummaries || [];
  const missingEvidence = controlData.approvalState?.missingEvidence || [];
  const readinessReady = controlValidation.valid && missingEvidence.length === 0;

  return createPassResult({
    phase: P96_FOUNDER_BUSINESS_BUILD_READINESS_PHASE,
    mode: "founder-business-build-local-execution-readiness",
    source: "live-ready/founderBusinessBuildExecutionReadiness.js",
    summary: "Business Build local execution readiness is modeled from display-safe founder workflow persistence state.",
    data: {
      schemaVersion: "1.0",
      phaseId: P96_FOUNDER_BUSINESS_BUILD_READINESS_PHASE,
      currentState: readinessReady
        ? "business_build_local_execution_readiness_evidence_complete"
        : "business_build_local_execution_readiness_blocked_until_evidence",
      readinessMode: "local-readiness-model-only",
      dbSourceState: {
        mode: workflowData.runtimeMode || "local-sqlite-founder-workflow",
        currentState: workflowData.currentState || "founder_runtime_db_crud_blocked_until_local_admission_evidence",
        displaySafe: true,
        rawTablesHidden: true,
        rawIdsHidden: true,
      },
      founderSessionSummary: summarizeFounderSession(workflowData.founderSession),
      prdArtifactSummary: summarizePrdArtifact(workflowData.prdArtifact),
      workstreamPlanSummary: summarizeWorkstreamPlan(workflowData.workstreamPlan),
      sourceRecords: P94_FOUNDER_RUNTIME_DB_ENTITIES.map((entity) => ({
        label: displayState(entity),
        displaySafe: true,
        rawTablesHidden: true,
        rawIdsHidden: true,
      })),
      executionReadiness: {
        ready: false,
        readyReason: "P96.2 does not enable execution. It only models local readiness evidence.",
        approvalEvidenceComplete: missingEvidence.length === 0,
        missingEvidence,
      },
      lanes: localEntitySummaries.map(buildLane),
      requiredEvidence: ["operatorApproval", "rollbackAccepted", "auditAccepted", "validationCommandsAccepted", "sqliteLiveMode", "sqliteWritesEnabled"],
      missingEvidence,
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: readinessReady
        ? "Route P96.3 to dry-run admission mapping before any execution can be considered."
        : "Complete local approval and persistence evidence before P96.3 dry-run admission.",
      blockers: missingEvidence.map((key) => `${key} is required before Business Build readiness can advance.`),
      disabledReason:
        "P96.2 is a local readiness model only. Provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Business Build Local Execution Readiness",
      evidenceRefs: ["reports/p962-founder-business-build-readiness-model-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local deterministic model only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p962-founder-business-build-readiness-model-report.md",
      "reports/p961-founder-business-build-readiness-contract-report.md",
    ],
    warnings: [
      "P96.2 does not execute Business Build lanes, dispatch agents, mutate projects, call providers/models, deploy, package, or spend.",
    ],
  });
}

export function buildFounderBusinessBuildReadinessViewModel(input = {}) {
  const snapshot = buildFounderBusinessBuildPersistenceSnapshot(input);
  const data = snapshot.data || {};
  return {
    currentState: displayState(data.currentState),
    readinessMode: "Local readiness only",
    dbSourceState: displayState(data.dbSourceState?.currentState),
    founderSessionSummary: data.founderSessionSummary,
    prdArtifactSummary: data.prdArtifactSummary,
    workstreamPlanSummary: data.workstreamPlanSummary,
    readyLaneCount: 0,
    totalLaneCount: data.lanes?.length || 0,
    lanes: data.lanes || [],
    nextAction: data.nextAction,
    blockers: data.blockers || [],
    disabledReason: data.disabledReason,
    ownerCapability: data.ownerCapability,
    evidenceLocation: data.evidenceRefs?.[0] || "reports/p962-founder-business-build-readiness-model-report.md",
    activityLocation: data.activityLocation,
    costImpact: data.costImpact,
    commandCenterVisible: true,
  };
}

export function buildFounderBusinessBuildDryRunAdmission(input = {}) {
  const snapshot = input.snapshot || buildFounderBusinessBuildPersistenceSnapshot(input);
  const snapshotData = snapshot.data || {};
  const lanes = (snapshotData.lanes || []).map((lane) => buildDryRunAdmissionLane(lane, snapshotData));
  const futureReviewEligibleCount = lanes.filter((lane) => lane.futureReviewEligible).length;
  return createPassResult({
    phase: P96_FOUNDER_BUSINESS_BUILD_DRY_RUN_ADMISSION_PHASE,
    mode: "founder-business-build-dry-run-admission",
    source: "live-ready/founderBusinessBuildExecutionReadiness.js",
    summary: "Business Build dry-run admission matrix is available for local readiness review; execution remains blocked.",
    data: {
      schemaVersion: "1.0",
      phaseId: P96_FOUNDER_BUSINESS_BUILD_DRY_RUN_ADMISSION_PHASE,
      currentState: futureReviewEligibleCount > 0
        ? "dry_run_admission_preview_ready_execution_blocked"
        : "dry_run_admission_blocked_until_local_evidence",
      readinessMode: "dry-run-admission-preview-only",
      sourceReadinessPhase: snapshot.phase,
      sourceReadinessState: snapshotData.currentState,
      laneCount: lanes.length,
      futureReviewEligibleCount,
      admittedForExecutionCount: 0,
      lanes,
      requiredEvidence: [
        "operatorApproval",
        "rollbackAccepted",
        "auditAccepted",
        "validationCommandsAccepted",
        "sqliteLiveMode",
        "sqliteWritesEnabled",
        "laterExecutionPhaseContract",
        "scopedFounderBusinessBuildTask",
        "postRunReviewPlan",
      ],
      missingEvidence: snapshotData.missingEvidence || [],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: "Render this dry-run admission matrix in P96.4 Command Center UX without runnable execution controls.",
      blockers: lanes
        .filter((lane) => lane.missingEvidence.length > 0)
        .map((lane) => `${lane.label}: ${lane.missingEvidence.join(", ")}`),
      disabledReason:
        "P96.3 is dry-run admission only. Execution, dispatch, provider/model calls, worker/tool runs, project mutation, hosted DB mutation, deploy, release, export, package creation, network calls, and spend remain blocked.",
      ownerCapability: "NEXUS Business Build Dry-Run Admission",
      evidenceRefs: [
        "reports/p963-founder-business-build-dry-run-admission-report.md",
        "reports/p962-founder-business-build-readiness-model-report.md",
      ],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local deterministic dry-run admission only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p963-founder-business-build-dry-run-admission-report.md",
      "reports/p962-founder-business-build-readiness-model-report.md",
      "contracts/os-roadmap/p96-execution-contracts.json",
    ],
    warnings: [
      "P96.3 does not dispatch agents, execute tools/workers, mutate projects, call providers/models, use hosted DBs, use network calls, deploy, release, export, package, or spend.",
    ],
  });
}

export function validateFounderBusinessBuildPersistenceSnapshot(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P96_FOUNDER_BUSINESS_BUILD_READINESS_PHASE) errors.push("phase must be P96.2");
  for (const field of ["schemaVersion", "phaseId", "currentState", "readinessMode", "dbSourceState", "founderSessionSummary", "prdArtifactSummary", "workstreamPlanSummary", "sourceRecords", "executionReadiness", "lanes", "requiredEvidence", "missingEvidence", "forbiddenOperations", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact", "commandCenterVisible"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.dbSourceState?.rawTablesHidden !== true) errors.push("dbSourceState.rawTablesHidden must be true");
  if (data.dbSourceState?.rawIdsHidden !== true) errors.push("dbSourceState.rawIdsHidden must be true");
  if (!Array.isArray(data.sourceRecords) || data.sourceRecords.length !== P94_FOUNDER_RUNTIME_DB_ENTITIES.length) errors.push("sourceRecords must cover founder workflow entities");
  if (!Array.isArray(data.lanes) || data.lanes.length !== P94_FOUNDER_RUNTIME_DB_ENTITIES.length) errors.push("lanes must cover founder workflow entities");
  for (const lane of data.lanes || []) {
    if (lane.executionAllowed !== false) errors.push(`${lane.label} executionAllowed must be false`);
    if (lane.dispatchAllowed !== false) errors.push(`${lane.label} dispatchAllowed must be false`);
    if (lane.projectMutationAllowed !== false) errors.push(`${lane.label} projectMutationAllowed must be false`);
  }
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data.runtimeFlags?.[flag] !== false) errors.push(`runtimeFlags.${flag} must be false`);
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  if (data.executionReadiness?.ready !== false) errors.push("executionReadiness.ready must remain false in P96.2");
  if (data.commandCenterVisible !== true) errors.push("commandCenterVisible must be true");
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("snapshot must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now/i.test(serialized)) errors.push("snapshot must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}

export function validateFounderBusinessBuildDryRunAdmission(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P96_FOUNDER_BUSINESS_BUILD_DRY_RUN_ADMISSION_PHASE) errors.push("phase must be P96.3");
  for (const field of ["schemaVersion", "phaseId", "currentState", "readinessMode", "sourceReadinessPhase", "sourceReadinessState", "laneCount", "futureReviewEligibleCount", "admittedForExecutionCount", "lanes", "requiredEvidence", "missingEvidence", "forbiddenOperations", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact", "commandCenterVisible"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.sourceReadinessPhase !== P96_FOUNDER_BUSINESS_BUILD_READINESS_PHASE) errors.push("sourceReadinessPhase must be P96.2");
  if (data.readinessMode !== "dry-run-admission-preview-only") errors.push("readinessMode must stay dry-run-admission-preview-only");
  if (data.admittedForExecutionCount !== 0) errors.push("admittedForExecutionCount must stay 0");
  if (!Array.isArray(data.lanes) || data.lanes.length !== P94_FOUNDER_RUNTIME_DB_ENTITIES.length) errors.push("lanes must cover founder workflow entities");
  if (data.laneCount !== data.lanes?.length) errors.push("laneCount must match lanes length");
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data.runtimeFlags?.[flag] !== false) errors.push(`runtimeFlags.${flag} must be false`);
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const lane of data.lanes || []) {
    for (const field of ["laneId", "label", "ownerCapability", "readinessState", "dryRunAdmissionState", "allowedLocalInspection", "admissionPreviewAllowed", "futureReviewEligible", "executionAllowed", "dispatchAllowed", "projectMutationAllowed", "requiredEvidence", "missingEvidence", "validationCommands", "nextAction", "disabledReason", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in lane)) errors.push(`${lane.label || "lane"}.${field} missing`);
    }
    if (lane.allowedLocalInspection !== true) errors.push(`${lane.label}.allowedLocalInspection must be true`);
    if (lane.admissionPreviewAllowed !== true) errors.push(`${lane.label}.admissionPreviewAllowed must be true`);
    for (const flag of BLOCKED_RUNTIME_FLAGS) {
      if (lane[flag] !== false) errors.push(`${lane.label}.${flag} must be false`);
    }
    if (!Array.isArray(lane.validationCommands) || !lane.validationCommands.includes("npm run check:p963-founder-business-build-dry-run-admission")) {
      errors.push(`${lane.label}.validationCommands must include P96.3 checker`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("dry-run admission must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now/i.test(serialized)) errors.push("dry-run admission must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
