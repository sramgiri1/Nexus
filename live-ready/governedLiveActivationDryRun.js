import { createPassResult } from "../shared/resultEnvelope.js";
import { buildGovernedLiveOperatorApprovalQueue } from "./governedLiveOperatorApprovalQueue.js";

export const P86_ACTIVATION_DRY_RUN_PHASE = "P86.5";

const BLOCKED_RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
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

function blockedRuntimeFlags() {
  return Object.fromEntries(BLOCKED_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function intentKey(label = "") {
  return `dry-run-${String(label).replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}`;
}

function buildIntent(item = {}) {
  return {
    intentKey: intentKey(item.label),
    label: item.label,
    ownerCapability: item.ownerCapability,
    dryRunState: "blocked_before_activation",
    activationAllowed: false,
    executionAllowed: false,
    nextAction: item.nextAction,
    blockers: item.missingEvidence || [],
    rollbackRequired: true,
    validationCommands: [
      "npm run check:p865-activation-dry-run",
      "npm run check:os-phase-status",
    ],
    disabledReason:
      "P86.5 creates activation dry-run records only. It does not activate providers, agents, tools, workers, project writes, DB writes, deploys, packages, or spend.",
    evidenceRefs: ["reports/p865-activation-dry-run-report.md", ...(item.evidenceRefs || [])],
    activityLocation: item.activityLocation,
    costImpact: item.costImpact,
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

function summarize(intents) {
  return intents.reduce((acc, intent) => {
    acc[intent.dryRunState] = (acc[intent.dryRunState] || 0) + 1;
    return acc;
  }, {});
}

export function buildGovernedLiveActivationDryRun(input = {}) {
  const queue = input.queue || buildGovernedLiveOperatorApprovalQueue(input);
  const intents = (queue.data?.queueItems || []).map(buildIntent);

  return createPassResult({
    phase: P86_ACTIVATION_DRY_RUN_PHASE,
    mode: "live-admission",
    source: "live-ready/governedLiveActivationDryRun.js",
    summary: "Activation dry-run records are available; activation and execution remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: "activation_dry_run_records_ready",
      readinessLabel: "Blocked",
      intentSummary: summarize(intents),
      intents,
      nextAction: "Aggregate P86 tests, docs, reports, and roadmap evidence in P86.6.",
      blockers: ["runtimeLock", "operatorApprovalQueuePolicy", "perCapabilityValidation", "activationExecutorNotImplemented"],
      disabledReason:
        "P86.5 creates dry-run records only. Provider/model calls, agent dispatch, tool execution, worker execution, project creation, project mutation, DB writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Live Activation Governance",
      evidenceRefs: ["reports/p865-activation-dry-run-report.md", "reports/p864-command-center-live-admission-ux-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: ["reports/p865-activation-dry-run-report.md", "contracts/os-roadmap/p86-execution-contracts.json"],
    warnings: ["P86.5 is activation dry-run only. It does not unlock or execute live actions."],
  });
}

export function validateGovernedLiveActivationDryRun(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P86_ACTIVATION_DRY_RUN_PHASE) errors.push("phase must be P86.5");
  for (const field of ["schemaVersion", "currentState", "readinessLabel", "intentSummary", "intents", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.intents) || data.intents.length < 8) errors.push("intents must cover approval queue items");
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const intent of data.intents || []) {
    for (const field of ["intentKey", "label", "ownerCapability", "dryRunState", "nextAction", "blockers", "rollbackRequired", "validationCommands", "disabledReason", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in intent)) errors.push(`${intent.label || "intent"}.${field} missing`);
    }
    if (intent.activationAllowed !== false || intent.executionAllowed !== false) errors.push(`${intent.label}.activation/execution flags must be false`);
    if (intent.rollbackRequired !== true) errors.push(`${intent.label}.rollbackRequired must be true`);
    if (!Array.isArray(intent.validationCommands) || intent.validationCommands.length === 0) errors.push(`${intent.label}.validationCommands required`);
    for (const flag of BLOCKED_RUNTIME_FLAGS) {
      if (intent[flag] !== false) errors.push(`${intent.label}.${flag} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("activation dry run must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized)) errors.push("activation dry run must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
