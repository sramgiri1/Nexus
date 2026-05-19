import { FOUNDER_INTAKE_REQUIRED_FIELDS } from "../founder-intake/founderIntakeSchema.js";
import { createFounderIntakeSession } from "../founder-intake/founderIntakeSession.js";
import { createPassResult } from "../shared/resultEnvelope.js";
import { summarizeRedaction } from "../shared/redaction.js";

export const BUSINESS_BUILD_PRD_PHASE = "P81.2";

export const BUSINESS_BUILD_PRD_REQUIRED_FIELDS = Object.freeze([
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
  "prdGenerationAllowed",
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
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function mapFounderAnswersToPrd(answers = {}, fallbackIdea = "") {
  return {
    founderIdea: fallbackIdea || answers.founderIdea || "",
    problem: answers.problem || "",
    targetCustomer: answers.targetCustomer || "",
    solution: answers.proposedSolution || answers.solution || "",
    businessModel: answers.businessModel || "",
    goToMarket: answers.goToMarket || "",
    successCriteria: answers.successCriteria || "",
    risks: answers.constraints || answers.risks || "",
  };
}

export function createBusinessBuildPrdDraft(input = {}) {
  const founderSession = createFounderIntakeSession({
    founderIdeaSummary: input.founderIdeaSummary,
    answers: input.answers,
    evidenceRefs: input.evidenceRefs,
    activityRefs: input.activityRefs,
  });
  const mapped = mapFounderAnswersToPrd(founderSession.answers, founderSession.founderIdeaSummary);
  const redaction = summarizeRedaction({
    founderIdea: mapped.founderIdea,
    problem: mapped.problem,
    solution: mapped.solution,
    notes: input.notes || "",
  });
  const prdFields = {
    ...mapped,
    founderIdea: redaction.redacted.founderIdea || mapped.founderIdea,
    problem: redaction.redacted.problem || mapped.problem,
    solution: redaction.redacted.solution || mapped.solution,
  };
  const answeredFields = BUSINESS_BUILD_PRD_REQUIRED_FIELDS.filter((field) => Boolean(prdFields[field]));
  const missingFields = BUSINESS_BUILD_PRD_REQUIRED_FIELDS.filter((field) => !answeredFields.includes(field));
  const runtimeFlags = Object.fromEntries(RUNTIME_FLAGS.map((flag) => [flag, false]));
  const readyForWorkstreams = missingFields.length === 0;

  return createPassResult({
    phase: BUSINESS_BUILD_PRD_PHASE,
    mode: "live",
    source: "business-build/businessBuildPrdSchema.js",
    summary: "Business build PRD draft schema is local; PRD generation execution and project mutation remain blocked.",
    data: {
      schemaVersion: "1.0",
      draftId: input.draftId || "business-build-prd-draft",
      sourceSessionKey: founderSession.safeSessionKey,
      sourceFields: [...FOUNDER_INTAKE_REQUIRED_FIELDS],
      prdFields,
      answeredFields,
      missingFields,
      readyForWorkstreams,
      readiness: {
        score: answeredFields.length / BUSINESS_BUILD_PRD_REQUIRED_FIELDS.length,
        threshold: 1,
        reasons: missingFields.length === 0 ? ["All local PRD draft fields are present."] : missingFields.map((field) => `${field} is missing.`),
      },
      evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p812-prd-schema-report.md"])],
      activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P81.2"])],
      costImpact: "No provider calls, PRD generation execution, agent dispatch, project creation, DB writes, deploy, or provider spend.",
      ownerCapability: "NEXUS.businessBuildPrd",
      nextAction: readyForWorkstreams ? "Route local PRD draft to P81.3 workstream planning." : `Collect ${missingFields[0]} before workstream planning.`,
      disabledReason:
        "P81.2 defines a local PRD draft schema only. Provider calls, PRD generation execution, agent dispatch, project creation, project mutation, DB writes, deploy, release, export, package creation, and provider spend remain blocked.",
      blockers: missingFields.map((field) => `${field} is required before business build workstreams.`),
      ...runtimeFlags,
    },
    evidence: ["reports/p812-prd-schema-report.md"],
    warnings: ["This is a local draft schema, not an executed PRD generator or project creator."],
  });
}

export function validateBusinessBuildPrdDraft(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  for (const field of ["draftId", "sourceSessionKey", "prdFields", "answeredFields", "missingFields", "readiness", "evidenceRefs", "costImpact"]) {
    if (!(field in data)) errors.push(`missing ${field}`);
  }
  for (const field of BUSINESS_BUILD_PRD_REQUIRED_FIELDS) {
    if (!(field in (data.prdFields || {}))) errors.push(`prdFields.${field} is missing`);
  }
  if (!Array.isArray(data.missingFields)) errors.push("missingFields must be an array");
  if (!Array.isArray(data.answeredFields)) errors.push("answeredFields must be an array");
  if (typeof data.readiness?.score !== "number") errors.push("readiness.score must be numeric");
  for (const flag of RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  if (!data.disabledReason || /generate now|create project|dispatch agent|deploy now|run now/i.test(data.disabledReason)) {
    errors.push("disabledReason must not imply runnable actions");
  }
  if (!Array.isArray(data.evidenceRefs) || data.evidenceRefs.length === 0) errors.push("evidenceRefs must be present");
  if (!Array.isArray(data.activityRefs) || data.activityRefs.length === 0) errors.push("activityRefs must be present");
  return { valid: errors.length === 0, errors };
}
