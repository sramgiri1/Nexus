import { buildFounderPrdSafeAuthoring, validateFounderPrdSafeAuthoring } from "./founderPrdSafeAuthoring.js";
import {
  buildFounderIdeaToPrdModel,
  P133_FOUNDATION_PRD_FIELDS,
  P133_FOUNDER_IDEA_TO_PRD_SAFETY_FLAGS,
} from "./founderIdeaToPrdModel.js";
import { createPassResult } from "../shared/resultEnvelope.js";

export const P133_FOUNDER_IDEA_TO_PRD_PREVIEW_PHASE = "P133.3";

const FORBIDDEN_OPERATIONS = Object.freeze([
  "provider/model calls",
  "autonomous Q&A execution",
  "PRD generation execution",
  "agent dispatch",
  "tool execution",
  "worker runtime execution",
  "local executor run",
  "project creation",
  "project mutation",
  "file writes",
  "DB/runtime writes",
  "hosted DB mutation",
  "network calls",
  "deploy/release/export/package actions",
  "provider spend",
]);

function blockedSafetyFlags() {
  return Object.fromEntries(P133_FOUNDER_IDEA_TO_PRD_SAFETY_FLAGS.map((flag) => [flag, false]));
}

function prdFieldsFromModel(model = {}) {
  return Object.fromEntries(
    (model.data?.prdReadiness?.fieldRows || [])
      .filter((row) => P133_FOUNDATION_PRD_FIELDS.includes(row.field))
      .map((row) => [row.field, row.value || ""]),
  );
}

function buildReviewChecklist({ previewReady, missingSections = [] }) {
  const checklist = [
    {
      itemKey: "founder-assumptions",
      label: "Founder assumptions are visible",
      state: previewReady ? "ready_for_review" : "needs_founder_input",
      disabledReason: "Review only; no provider/model calls or project mutation are enabled.",
    },
    {
      itemKey: "prd-sections",
      label: "PRD sections are complete enough for preview",
      state: missingSections.length === 0 ? "ready_for_review" : "blocked_by_missing_sections",
      disabledReason: missingSections.length === 0 ? "Review only; preview stays in memory." : `Missing sections: ${missingSections.join(", ")}.`,
    },
    {
      itemKey: "execution-gates",
      label: "Execution gates remain blocked",
      state: "blocked_by_design",
      disabledReason: "Agent dispatch, project mutation, DB/runtime writes, deploy, release, export, package creation, and provider spend remain blocked.",
    },
  ];

  return checklist.map((item) => ({
    ...item,
    providerCallsAllowed: false,
    agentDispatchAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
    providerSpendAllowed: false,
  }));
}

export function buildFounderIdeaToPrdPreview(input = {}) {
  const model = input.model || buildFounderIdeaToPrdModel(input);
  const prdFields = prdFieldsFromModel(model);
  const safeAuthoring = input.safeAuthoring || buildFounderPrdSafeAuthoring({
    ...input,
    prdDraft: {
      phase: model.phase,
      data: { prdFields },
    },
  });
  const safeValidation = validateFounderPrdSafeAuthoring(safeAuthoring);
  const artifact = safeAuthoring.data?.prdArtifact || {};
  const missingSections = artifact.missingSections || [];
  const previewReady = model.data?.prdReadiness?.readyForSafePreview === true
    && artifact.reviewState === "ready_for_operator_review"
    && safeValidation.valid;
  const safetyFlags = blockedSafetyFlags();

  return createPassResult({
    phase: P133_FOUNDER_IDEA_TO_PRD_PREVIEW_PHASE,
    mode: "safe-local-prd-preview",
    source: "live-ready/founderIdeaToPrdPreview.js",
    summary: "Safe founder idea-to-PRD preview is assembled locally in memory from the P133.2 model and existing safe authoring helper while execution remains blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: previewReady
        ? "founder_idea_to_prd_safe_preview_ready"
        : "founder_idea_to_prd_safe_preview_needs_founder_inputs",
      previewMode: "read-only-local-in-memory",
      sourceModel: {
        phase: model.phase,
        currentState: model.data?.currentState || "",
        readinessScore: model.data?.prdReadiness?.score || 0,
        readyForSafePreview: model.data?.prdReadiness?.readyForSafePreview === true,
        nextQuestion: model.data?.question?.prompt || "",
      },
      prdPreview: {
        previewKey: "founder-idea-to-prd-safe-preview",
        title: artifact.title || "PRD - Founder Idea",
        reviewState: artifact.reviewState || "needs_founder_inputs",
        sectionCount: artifact.sections?.length || 0,
        missingSections,
        sections: (artifact.sections || []).map((section) => ({
          sectionKey: section.sectionKey,
          title: section.title,
          sourceField: section.sourceField,
          content: section.content,
          state: section.status,
          rawPrivateIdsHidden: true,
        })),
        acceptanceCriteria: artifact.acceptanceCriteria || [],
        markdown: artifact.markdown || "",
      },
      previewSafety: {
        rendersInMemoryOnly: true,
        writesFiles: false,
        writesDb: false,
        mutatesProjects: false,
        dispatchesAgents: false,
        callsProviders: false,
        usesNetwork: false,
        exportsPackages: false,
        spendsBudget: false,
      },
      reviewChecklist: buildReviewChecklist({ previewReady, missingSections }),
      allowedLocalOperations: [
        "render safe local PRD preview in memory",
        "review PRD sections",
        "review acceptance criteria",
        "review blockers before Command Center rendering",
      ],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      safetyFlags,
      nextAction: previewReady
        ? "Route to P133.4 Chat and PRD Command Center UX."
        : `Collect ${missingSections[0] || model.data?.prdReadiness?.missingFields?.[0] || "founder input"} before Command Center PRD UX.`,
      blockers: [
        ...missingSections.map((section) => `${section} is required before Command Center PRD UX.`),
        "Provider/model PRD generation remains blocked.",
        "Agent dispatch remains blocked.",
        "Project mutation remains blocked.",
      ],
      disabledReason:
        "P133.3 renders a safe local PRD preview in memory only. Autonomous Q&A execution, provider/model calls, PRD generation execution, agent dispatch, project creation, project mutation, file writes, DB/runtime writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder Idea-to-PRD Preview",
      evidenceRefs: [
        "reports/p1333-founder-idea-to-prd-preview-report.md",
        "reports/p1332-founder-idea-to-prd-model-report.md",
        "reports/p903-founder-prd-safe-authoring-report.md",
      ],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local in-memory preview only. No provider/model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...safetyFlags,
    },
    evidence: [
      "reports/p1333-founder-idea-to-prd-preview-report.md",
      "contracts/os-roadmap/p133-founder-idea-to-prd-productization-contracts.json",
    ],
    warnings: [
      "P133.3 does not write PRD files, call providers/models, dispatch agents, mutate projects, write DB/runtime state, deploy, export, package, or spend.",
    ],
  });
}

export function validateFounderIdeaToPrdPreview(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P133_FOUNDER_IDEA_TO_PRD_PREVIEW_PHASE) errors.push("phase must be P133.3");
  for (const field of [
    "schemaVersion",
    "currentState",
    "previewMode",
    "sourceModel",
    "prdPreview",
    "previewSafety",
    "reviewChecklist",
    "allowedLocalOperations",
    "forbiddenOperations",
    "safetyFlags",
    "nextAction",
    "blockers",
    "disabledReason",
    "ownerCapability",
    "evidenceRefs",
    "activityLocation",
    "costImpact",
    "commandCenterVisible",
  ]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.previewMode !== "read-only-local-in-memory") errors.push("previewMode must stay read-only-local-in-memory");
  if (data.sourceModel?.phase !== "P133.2") errors.push("sourceModel.phase must be P133.2");
  if (!Array.isArray(data.prdPreview?.sections) || data.prdPreview.sections.length !== P133_FOUNDATION_PRD_FIELDS.length) errors.push("prdPreview.sections must cover required PRD fields");
  if (!String(data.prdPreview?.markdown || "").includes("## Operator Review")) errors.push("prdPreview.markdown must include operator review");
  if (!Array.isArray(data.prdPreview?.acceptanceCriteria) || data.prdPreview.acceptanceCriteria.length < 3) errors.push("acceptanceCriteria must be present");
  for (const field of ["writesFiles", "writesDb", "mutatesProjects", "dispatchesAgents", "callsProviders", "usesNetwork", "exportsPackages", "spendsBudget"]) {
    if (data.previewSafety?.[field] !== false) errors.push(`previewSafety.${field} must be false`);
  }
  if (data.previewSafety?.rendersInMemoryOnly !== true) errors.push("previewSafety.rendersInMemoryOnly must be true");
  if (!Array.isArray(data.reviewChecklist) || data.reviewChecklist.length < 3) errors.push("reviewChecklist must be present");
  for (const item of data.reviewChecklist || []) {
    for (const flag of ["providerCallsAllowed", "agentDispatchAllowed", "projectMutationAllowed", "dbWritesAllowed", "providerSpendAllowed"]) {
      if (item[flag] !== false) errors.push(`${item.itemKey}.${flag} must be false`);
    }
  }
  for (const flag of P133_FOUNDER_IDEA_TO_PRD_SAFETY_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.safetyFlags?.[flag] !== false) errors.push(`safetyFlags.${flag} must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("preview must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|write hosted db now|execute now/i.test(serialized)) errors.push("preview must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
