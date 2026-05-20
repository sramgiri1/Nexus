import { createPassResult } from "../shared/resultEnvelope.js";
import { createBusinessBuildPrdDraft } from "../business-build/businessBuildPrdSchema.js";
import { buildFounderRuntimeEnvelope } from "./founderRuntimeEnvelope.js";

export const P90_FOUNDER_PRD_LIVE_AUTHORING_PHASE = "P90.2";

export const P90_FOUNDER_PRD_REQUIRED_INPUTS = Object.freeze([
  "founderIdea",
  "problem",
  "targetCustomer",
  "solution",
  "businessModel",
  "goToMarket",
  "successCriteria",
  "risks",
]);

const RUNTIME_FLAGS = Object.freeze([
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
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
  "localPrdAuthoringAllowed",
  "activationAllowed",
  "executionAllowed",
]);

const FORBIDDEN_OPERATIONS = Object.freeze([
  "provider/model calls",
  "agent dispatch",
  "tool execution",
  "worker runtime execution",
  "local executor run",
  "project creation",
  "project mutation",
  "DB writes",
  "network calls",
  "deploy/release/export/package actions",
  "provider spend",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function titleFromField(field = "") {
  return String(field)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bPrd\b/g, "PRD");
}

function sectionStatus(value = "") {
  return String(value || "").trim() ? "ready_for_operator_review" : "missing_founder_input";
}

function buildPrdSections(prdFields = {}) {
  return P90_FOUNDER_PRD_REQUIRED_INPUTS.map((field) => ({
    sectionKey: `prd-${field.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
    title: titleFromField(field),
    sourceField: field,
    content: prdFields[field] || "",
    status: sectionStatus(prdFields[field]),
    localAuthoringAllowed: false,
    nextAction: prdFields[field]
      ? "Review this local PRD section with the operator before any later authoring lane is enabled."
      : `Collect ${titleFromField(field)} before local PRD authoring can proceed.`,
    disabledReason:
      "P90.2 defines the local PRD model only. It does not write project files, dispatch agents, call providers, use network calls, deploy, package, or spend.",
  }));
}

function summarize(sections) {
  return sections.reduce((acc, section) => {
    acc[section.status] = (acc[section.status] || 0) + 1;
    return acc;
  }, {});
}

export function buildFounderPrdLiveAuthoringLane(input = {}) {
  const founderRuntimeEnvelope = input.founderRuntimeEnvelope || buildFounderRuntimeEnvelope(input);
  const prdDraft = input.prdDraft || (
    founderRuntimeEnvelope.data?.prdDraft?.fields
      ? {
          phase: founderRuntimeEnvelope.phase,
          data: { prdFields: founderRuntimeEnvelope.data.prdDraft.fields },
        }
      : createBusinessBuildPrdDraft(input)
  );
  const prdFields = prdDraft.data?.prdFields || {};
  const prdSections = buildPrdSections(prdFields);
  const missingInputs = P90_FOUNDER_PRD_REQUIRED_INPUTS.filter((field) => !String(prdFields[field] || "").trim());
  const readySections = prdSections.filter((section) => section.status === "ready_for_operator_review").length;
  const readinessScore = prdSections.length ? readySections / prdSections.length : 0;

  return createPassResult({
    phase: P90_FOUNDER_PRD_LIVE_AUTHORING_PHASE,
    mode: "local-founder-prd-live-authoring-model",
    source: "live-ready/founderPrdLiveAuthoringLane.js",
    summary: "Local founder PRD authoring model is defined; authoring execution remains blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: "local_founder_prd_model_ready_blocked",
      readinessLabel: missingInputs.length === 0 ? "PRD model ready for operator review" : "PRD model needs founder inputs",
      laneMode: "local-prd-authoring-model",
      sourcePhase: prdDraft.phase,
      founderInputs: P90_FOUNDER_PRD_REQUIRED_INPUTS.map((field) => ({
        key: field,
        label: titleFromField(field),
        captured: !missingInputs.includes(field),
      })),
      prdSections,
      prdReadiness: {
        score: readinessScore,
        readySections,
        totalSections: prdSections.length,
        missingInputs,
        summary: summarize(prdSections),
      },
      allowedLocalOperations: [
        "review local PRD section model",
        "prepare operator review checklist",
        "prepare safe local authoring evidence packet",
      ],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: missingInputs.length === 0
        ? "Implement P90.3 safe local PRD authoring result envelope without project mutation."
        : `Collect ${titleFromField(missingInputs[0])} before safe local PRD authoring can be considered.`,
      blockers: missingInputs.map((field) => `${field} is required before local PRD authoring.`),
      disabledReason:
        "P90.2 defines the local PRD model only. Provider/model calls, agent dispatch, tool execution, worker execution, local executor runs, project creation, project mutation, DB writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder PRD Live Authoring Governance",
      evidenceRefs: [
        "reports/p902-founder-prd-local-model-report.md",
        "reports/p901-founder-prd-live-lane-contract-report.md",
      ],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local-only model. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p902-founder-prd-local-model-report.md",
      "contracts/os-roadmap/p90-execution-contracts.json",
    ],
    warnings: ["P90.2 defines a local PRD model only. It does not write project files or run authoring execution."],
  });
}

export function validateFounderPrdLiveAuthoringLane(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P90_FOUNDER_PRD_LIVE_AUTHORING_PHASE) errors.push("phase must be P90.2");
  for (const field of ["schemaVersion", "currentState", "laneMode", "sourcePhase", "founderInputs", "prdSections", "prdReadiness", "allowedLocalOperations", "forbiddenOperations", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.laneMode !== "local-prd-authoring-model") errors.push("laneMode must stay local-prd-authoring-model");
  if (!Array.isArray(data.founderInputs) || data.founderInputs.length !== P90_FOUNDER_PRD_REQUIRED_INPUTS.length) errors.push("founderInputs must cover required inputs");
  if (!Array.isArray(data.prdSections) || data.prdSections.length !== P90_FOUNDER_PRD_REQUIRED_INPUTS.length) errors.push("prdSections must cover required PRD sections");
  if (typeof data.prdReadiness?.score !== "number") errors.push("prdReadiness.score must be numeric");
  for (const section of data.prdSections || []) {
    for (const field of ["sectionKey", "title", "sourceField", "content", "status", "localAuthoringAllowed", "nextAction", "disabledReason"]) {
      if (!(field in section)) errors.push(`${section.title || "section"}.${field} missing`);
    }
    if (section.localAuthoringAllowed !== false) errors.push(`${section.title}.localAuthoringAllowed must be false`);
  }
  for (const flag of RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.runtimeFlags?.[flag] !== false) errors.push(`runtimeFlags.${flag} must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("founder PRD live authoring lane must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|execute now/i.test(serialized)) errors.push("founder PRD live authoring lane must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
