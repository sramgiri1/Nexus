import { createPassResult } from "../shared/resultEnvelope.js";
import { buildFounderPrdLiveAuthoringLane } from "./founderPrdLiveAuthoringLane.js";

export const P90_FOUNDER_PRD_SAFE_AUTHORING_PHASE = "P90.3";

export const P90_SAFE_AUTHORING_SECTIONS = Object.freeze([
  "founderIdea",
  "problem",
  "targetCustomer",
  "solution",
  "businessModel",
  "goToMarket",
  "successCriteria",
  "risks",
]);

const UNSAFE_RUNTIME_FLAGS = Object.freeze([
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
  return Object.fromEntries(UNSAFE_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function artifactTitle(sections = []) {
  const idea = sections.find((section) => section.sourceField === "founderIdea")?.content;
  return idea ? `PRD - ${idea}` : "PRD - Founder Idea";
}

function renderMarkdown(title, sections = []) {
  const lines = [`# ${title}`, ""];
  for (const section of sections) {
    lines.push(`## ${section.title}`);
    lines.push(section.content || "_Missing founder input._");
    lines.push("");
  }
  lines.push("## Operator Review");
  lines.push("- Confirm founder assumptions.");
  lines.push("- Confirm scope boundaries before project mutation.");
  lines.push("- Confirm no provider/model calls, agent dispatch, DB writes, deploy, package, network calls, or spend are enabled by this PRD artifact.");
  return lines.join("\n").trim();
}

function buildAcceptanceCriteria(sections = []) {
  return [
    "Founder idea, problem, target customer, solution, business model, go-to-market, success criteria, and risks are represented.",
    "PRD artifact is local and deterministic.",
    "Operator review is required before any later project mutation or agent dispatch phase.",
    `Ready section count: ${sections.filter((section) => section.status === "ready_for_operator_review").length}/${sections.length}.`,
  ];
}

export function buildFounderPrdSafeAuthoring(input = {}) {
  const lane = input.lane || buildFounderPrdLiveAuthoringLane(input);
  const sections = lane.data?.prdSections || [];
  const title = artifactTitle(sections);
  const missingSections = sections.filter((section) => section.status !== "ready_for_operator_review").map((section) => section.sourceField);
  const markdown = renderMarkdown(title, sections);

  return createPassResult({
    phase: P90_FOUNDER_PRD_SAFE_AUTHORING_PHASE,
    mode: "safe-local-founder-prd-authoring",
    source: "live-ready/founderPrdSafeAuthoring.js",
    summary: "Founder PRD artifact authored locally in memory; unsafe runtime operations remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: missingSections.length === 0
        ? "local_prd_authored_ready_for_operator_review"
        : "local_prd_authored_needs_founder_inputs",
      authoringMode: "local-deterministic-in-memory",
      sourcePhase: lane.phase,
      localAuthoring: {
        allowed: true,
        writesFiles: false,
        mutatesProjects: false,
        dispatchesAgents: false,
        callsProviders: false,
        usesNetwork: false,
        spendsBudget: false,
      },
      prdArtifact: {
        artifactKey: "founder-prd-local-artifact",
        title,
        sections: sections.map((section) => ({
          sectionKey: section.sectionKey,
          title: section.title,
          sourceField: section.sourceField,
          content: section.content,
          status: section.status,
        })),
        markdown,
        acceptanceCriteria: buildAcceptanceCriteria(sections),
        missingSections,
        reviewState: missingSections.length === 0 ? "ready_for_operator_review" : "needs_founder_inputs",
      },
      sectionCount: sections.length,
      readiness: {
        ...lane.data?.prdReadiness,
        artifactReady: missingSections.length === 0,
      },
      allowedLocalOperations: [
        "assemble deterministic PRD artifact in memory",
        "review local PRD artifact",
        "prepare operator review checklist",
      ],
      forbiddenOperations: [...FORBIDDEN_OPERATIONS],
      runtimeFlags: blockedRuntimeFlags(),
      nextAction: missingSections.length === 0
        ? "Implement P90.4 Command Center UX so the operator can inspect the local PRD artifact."
        : `Collect ${missingSections[0]} before operator review.`,
      blockers: missingSections.map((field) => `${field} is required before operator review.`),
      disabledReason:
        "P90.3 only authors a deterministic PRD artifact in memory. Project files, provider/model calls, agent dispatch, tool execution, worker execution, local executor runs, DB writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder PRD Safe Authoring",
      evidenceRefs: [
        "reports/p903-founder-prd-safe-authoring-report.md",
        "reports/p902-founder-prd-local-model-report.md",
      ],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local in-memory authoring only. No provider calls, model calls, network calls, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p903-founder-prd-safe-authoring-report.md",
      "contracts/os-roadmap/p90-execution-contracts.json",
    ],
    warnings: ["P90.3 authors an in-memory PRD artifact only. It does not create, export, package, or mutate project files."],
  });
}

export function validateFounderPrdSafeAuthoring(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P90_FOUNDER_PRD_SAFE_AUTHORING_PHASE) errors.push("phase must be P90.3");
  for (const field of ["schemaVersion", "currentState", "authoringMode", "sourcePhase", "localAuthoring", "prdArtifact", "sectionCount", "readiness", "allowedLocalOperations", "forbiddenOperations", "runtimeFlags", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.authoringMode !== "local-deterministic-in-memory") errors.push("authoringMode must stay local-deterministic-in-memory");
  if (data.localAuthoring?.allowed !== true) errors.push("localAuthoring.allowed must be true for P90.3");
  for (const field of ["writesFiles", "mutatesProjects", "dispatchesAgents", "callsProviders", "usesNetwork", "spendsBudget"]) {
    if (data.localAuthoring?.[field] !== false) errors.push(`localAuthoring.${field} must be false`);
  }
  if (!Array.isArray(data.prdArtifact?.sections) || data.prdArtifact.sections.length !== P90_SAFE_AUTHORING_SECTIONS.length) errors.push("prdArtifact.sections must cover required sections");
  if (!String(data.prdArtifact?.markdown || "").includes("## Operator Review")) errors.push("prdArtifact.markdown must include operator review");
  if (!Array.isArray(data.prdArtifact?.acceptanceCriteria) || data.prdArtifact.acceptanceCriteria.length < 3) errors.push("acceptanceCriteria must be present");
  for (const flag of UNSAFE_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.runtimeFlags?.[flag] !== false) errors.push(`runtimeFlags.${flag} must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("safe PRD authoring must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|execute now/i.test(serialized)) errors.push("safe PRD authoring must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
