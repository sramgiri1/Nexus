import { createPassResult } from "../shared/resultEnvelope.js";
import { createFounderIntakeSessionEnvelope } from "../founder-intake/founderIntakeSchema.js";
import { selectNextFounderQuestion } from "../founder-intake/founderIntakeQuestions.js";
import { createFounderIntakeSession } from "../founder-intake/founderIntakeSession.js";
import { createBusinessBuildPrdDraft } from "../business-build/businessBuildPrdSchema.js";
import { buildBusinessBuildWorkstreams } from "../business-build/businessBuildWorkstreams.js";
import { buildFounderRuntimeAdmission } from "./founderRuntimeAdmission.js";

export const P84_FOUNDER_RUNTIME_ENVELOPE_PHASE = "P84.2";

const BLOCKED_RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(BLOCKED_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function defaultAnswers() {
  return {
    targetCustomer: "startup founder",
    problem: "needs a guided way to validate an idea before spending build budget",
    currentAlternatives: "manual research, generic docs, and disconnected contractors",
    proposedSolution: "NEXUS interviews the founder, drafts a PRD, and plans governed agent workstreams",
    businessModel: "subscription with service-assisted onboarding",
    goToMarket: "founder-led discovery calls and focused launch cohorts",
    constraints: "limited budget, limited team capacity, and high product-market risk",
    successCriteria: "complete feasibility review, PRD, owner lanes, validation gates, and a build plan",
  };
}

function normalizeFounderIdeaSummary(value = "") {
  const trimmed = String(value || "").trim();
  return trimmed || "Founder wants NEXUS to validate a startup idea and turn it into a governed business build.";
}

function inferAnswersFromFounderIdea(founderIdeaSummary = "", overrides = {}) {
  const summary = normalizeFounderIdeaSummary(founderIdeaSummary);
  const snakeGame = /snake|ios|iphone|app store|game/i.test(summary);
  const inferred = snakeGame
    ? {
        targetCustomer: "casual iPhone players who want a fast arcade game",
        problem: "classic Snake games are easy to find, but many feel low polish, overloaded with ads, or lack clear mobile-first controls",
        currentAlternatives: "existing App Store snake games, browser games, and retro arcade bundles",
        proposedSolution: "a clean SwiftUI and SpriteKit Snake game with responsive touch controls, score tracking, pause/restart states, and a focused App Store launch checklist",
        businessModel: "free app with optional future cosmetic upgrade or ad-free paid version",
        goToMarket: "App Store keyword positioning, short gameplay clips, and indie game launch posts",
        constraints: "small scope, no backend, local build validation first, no provider spend, and no deploy until release admission is approved",
        successCriteria: "playable MVP, passing game-state tests, clean iPhone layout, release checklist, and launch assets ready for review",
      }
    : {
        ...defaultAnswers(),
        problem: "the founder needs a feasibility read, PRD, and execution plan before spending build budget",
        proposedSolution: "NEXUS turns the founder idea into a local PRD and maps it to governed agent workstreams",
        successCriteria: "clear feasibility summary, complete PRD fields, owner lanes, blockers, validation gates, and a local build plan",
      };
  return {
    ...inferred,
    ...overrides,
    founderIdea: summary,
  };
}

function toDisplayName(value = "") {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bPrd\b/g, "PRD")
    .replace(/\bQa\b/g, "QA")
    .replace(/\bDb\b/g, "DB");
}

function buildAgentFlow(workstreamPlan) {
  const selected = workstreamPlan.workstreams || [];
  return selected.map((entry, index) => ({
    step: index + 1,
    lane: toDisplayName(entry.workstream),
    ownerCapability: entry.ownerCapability,
    currentState: entry.status === "ready_for_dry_run" ? "Ready for local planning" : "Blocked on PRD",
    nextAction: entry.inputsNeeded?.[0] || "Review local PRD draft",
    blocker: entry.blockers?.[0] || "No blocker",
    dispatchAllowed: false,
    workerExecutionAllowed: false,
    projectMutationAllowed: false,
    costImpact: entry.costImpact,
  }));
}

export function buildFounderRuntimeEnvelope(input = {}) {
  const founderIdeaSummary = normalizeFounderIdeaSummary(input.founderIdeaSummary);
  const answers = input.answers || inferAnswersFromFounderIdea(founderIdeaSummary);
  const evidenceRefs = input.evidenceRefs || ["reports/p842-command-center-lite-report.md"];
  const activityRefs = input.activityRefs || ["reports/os-phase-status-report.md"];
  const admission = buildFounderRuntimeAdmission({
    approval: {
      operatorApproval: true,
      scopeBoundary: true,
      redactionCheck: true,
      activityEvidence: true,
      costEvidence: true,
      rollbackPlan: true,
      validationCommands: true,
    },
    answers,
    evidenceRefs,
    activityRefs,
  });
  const intakeEnvelope = createFounderIntakeSessionEnvelope({
    founderIdeaSummary,
    answers,
    evidenceRefs,
    activityRefs,
  });
  const session = createFounderIntakeSession({
    founderIdeaSummary: intakeEnvelope.data.session.founderIdeaSummary,
    answers,
    evidenceRefs,
    activityRefs,
  });
  const nextQuestion = selectNextFounderQuestion(session);
  const prdDraft = createBusinessBuildPrdDraft({
    founderIdeaSummary: session.founderIdeaSummary,
    answers,
    evidenceRefs,
    activityRefs,
  });
  const workstreamPlan = buildBusinessBuildWorkstreams({ prdDraft, evidenceRefs, activityRefs });
  const agentFlow = buildAgentFlow(workstreamPlan);
  const prdScore = Math.round((prdDraft.data.readiness.score || 0) * 100);

  return createPassResult({
    phase: P84_FOUNDER_RUNTIME_ENVELOPE_PHASE,
    mode: "live-local",
    source: "live-ready/founderRuntimeEnvelope.js",
    summary: "Command Center Lite can show local founder Q&A, PRD readiness, and agent workstream planning without unsafe execution.",
    data: {
      currentState: "founder_runtime_lite_ready",
      readinessLabel: "Lite ready",
      chat: {
        title: "Chat with NEXUS",
        prompt: `I understand the idea as: ${founderIdeaSummary}`,
        suggestedPrompts: [
          "Build a simple iOS Snake game for the App Store",
          "Validate my startup idea",
          "Draft the PRD from what you know",
          "Show which agents will work on this",
        ],
        nextAction: nextQuestion.prompt || "Review the local PRD envelope and agent lanes.",
      },
      founderIntake: {
        answeredFields: intakeEnvelope.data.answerState.answeredFields,
        missingFields: intakeEnvelope.data.answerState.missingFields,
        nextQuestion,
      },
      prdDraft: {
        readinessPercent: prdScore,
        readyForWorkstreams: prdDraft.data.readyForWorkstreams,
        fields: prdDraft.data.prdFields,
        missingFields: prdDraft.data.missingFields,
        nextAction: prdDraft.data.nextAction,
      },
      agentFlow,
      disabledActions: [
        { label: "Provider calls", reason: "Provider/model calls remain disabled until explicit budget, policy, and approval gates exist." },
        { label: "Agent dispatch", reason: "Agent lanes are planned locally; no agents are dispatched in P84.2." },
        { label: "Project mutation", reason: "No project files, DB records, deploys, exports, or packages are created from Lite." },
      ],
      safety: {
        localQnaAllowed: admission.data.localRuntime.deterministicQnaAllowed,
        localPrdDraftAllowed: admission.data.localRuntime.localPrdDraftAllowed,
        localWorkstreamPlanningAllowed: admission.data.localRuntime.localWorkstreamPlanningAllowed,
        ...blockedRuntimeFlags(),
      },
      nextAction: "Use the Lite screen to collect founder answers, review PRD readiness, and inspect planned agent lanes.",
      blockers: [],
      disabledReason: "P84.2 is local Command Center Lite planning only. Provider/model calls, agent dispatch, tool execution, worker execution, project mutation, DB writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Founder Runtime Envelope",
      evidenceRefs,
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "Local-only. No provider calls, worker runtime, deploy, package creation, network calls, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: evidenceRefs,
    warnings: ["P84.2 displays local founder runtime planning. It does not dispatch agents, mutate projects, call providers, write DB state, deploy, package, or spend."],
  });
}

export function validateFounderRuntimeEnvelope(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P84_FOUNDER_RUNTIME_ENVELOPE_PHASE) errors.push("phase must be P84.2");
  for (const field of ["currentState", "chat", "founderIntake", "prdDraft", "agentFlow", "disabledActions", "safety", "nextAction", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.chat?.suggestedPrompts) || data.chat.suggestedPrompts.length < 4) errors.push("chat.suggestedPrompts must guide founder use");
  if (!Array.isArray(data.agentFlow) || data.agentFlow.length < 4) errors.push("agentFlow must show multiple owner lanes");
  for (const lane of data.agentFlow || []) {
    if (!lane.lane || !lane.ownerCapability || !lane.nextAction) errors.push("agent lane must include label, owner, and next action");
    if (lane.dispatchAllowed !== false || lane.workerExecutionAllowed !== false || lane.projectMutationAllowed !== false) {
      errors.push(`${lane.lane || "lane"} must remain non-executing`);
    }
  }
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.safety?.[flag] !== false) errors.push(`safety.${flag} must be false`);
  }
  if (!data.disabledReason || /dispatch now|run agent|call provider now|write project now|deploy now|spend now/i.test(data.disabledReason)) {
    errors.push("disabledReason must not imply unsafe runnable actions");
  }
  if (!Array.isArray(data.evidenceRefs) || data.evidenceRefs.length === 0) errors.push("evidenceRefs must be present");
  return { valid: errors.length === 0, errors };
}
