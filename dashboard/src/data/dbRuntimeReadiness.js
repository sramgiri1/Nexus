import {
  buildFounderLiveAgentWorkOrderPersistenceDisplayModel,
  buildFounderLiveOperatorDecisionLedgerPersistenceDisplayModel,
  buildFounderRuntimeDbViewModel,
} from "./businessBuild.js";

export function buildDbRuntimeReadinessViewModel() {
  const founderRuntime = buildFounderRuntimeDbViewModel();
  const operatorDecisionLedgerPersistence = buildFounderLiveOperatorDecisionLedgerPersistenceDisplayModel(founderRuntime.founderIdea);
  const agentWorkOrderPersistence = buildFounderLiveAgentWorkOrderPersistenceDisplayModel(founderRuntime.founderIdea);
  const enterpriseRuntime = {
    currentState: "Local CRUD admission ready",
    requestState: "Mutation request envelopes ready for operator review",
    ownerCapability: "NEXUS Enterprise Local CRUD Admission",
    nextAction: "Use approved local SQLite admission for OS runtime records; keep project, provider, hosted DB, deploy, package, and spend actions blocked.",
    disabledReason: "Command Center shows local CRUD admission state only. It does not expose mutation buttons, raw SQL, hosted DB controls, project writes, provider calls, agent dispatch, deploy, package, or spend.",
    evidenceLocation: "reports/p934-local-crud-execution-admission-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local SQLite only; no provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    allowedOperations: ["Create", "Read", "Update", "Upsert", "List"],
    allowedEntities: [
      "Founder conversation events",
      "PRD artifact contracts",
      "Workstream plan tasks",
      "Activation review actions",
      "Runtime task queue",
      "Evidence records",
      "Audit events",
      "Roadmap phase state",
    ],
    lanes: [
      { label: "Founder session", state: "Persistable locally", owner: "NEXUS Founder Runtime", evidence: "P93.4 local CRUD admission" },
      { label: "PRD artifact", state: "Persistable locally", owner: "NEXUS PRD Authoring", evidence: "P93.3 request envelope" },
      { label: "Workstream plan", state: "Persistable locally", owner: "NEXUS Workstream Planning", evidence: "P93.2 CRUD plan" },
      { label: "Activation review", state: "Persistable locally", owner: "NEXUS Activation Governance", evidence: "P93.4 local CRUD admission" },
      { label: "Runtime task queue", state: "Persistable locally", owner: "NEXUS Runtime Task Queue", evidence: "P93.4 local CRUD admission" },
      { label: "Evidence and audit", state: "Persistable locally", owner: "NEXUS Evidence Governance", evidence: "P92.4 governed ledgers" },
    ],
    blockedOperations: [
      "Delete and raw SQL remain blocked",
      "Hosted DB mutation remains blocked",
      "Project source mutation remains blocked",
      "Provider/model calls remain blocked",
      "Agent dispatch and worker execution remain blocked",
      "Deploy, release, export, package, and spend remain blocked",
    ],
  };

  return {
    summaryRows: [
      { label: "DB primary state", value: "Local SQLite ready when initialized" },
      { label: "Read source", value: "SQLite when live; file fallback otherwise" },
      { label: "Fallback state", value: "File-backed fallback active" },
      { label: "Governed writes", value: "Evidence, audit, activity, and approved OS runtime records" },
      { label: "Enterprise runtime CRUD", value: "Admitted locally with explicit approval and write flags" },
      { label: "Founder workflow records", value: founderRuntime.savedSessionState },
      { label: "Operator decision ledger", value: operatorDecisionLedgerPersistence.currentState },
      { label: "Agent work orders", value: agentWorkOrderPersistence.currentState },
      { label: "General mutation", value: "Blocked outside the OS runtime allowlist" },
      { label: "Owner capability", value: "NEXUS DB Runtime Governance" },
      { label: "Next action", value: enterpriseRuntime.nextAction },
    ],
    statusChips: [
      { label: "SQLite CRUD", value: "Live local", tone: "teal" },
      { label: "Repository reads", value: "Wired", tone: "green" },
      { label: "Ledger writes", value: "Guarded", tone: "amber" },
      { label: "Request envelopes", value: "Ready", tone: "green" },
      { label: "Enterprise CRUD", value: "Admitted", tone: "teal" },
      { label: "Founder workflow", value: "DB-ready", tone: "teal" },
      { label: "Decision ledger", value: "Guarded local", tone: "amber" },
      { label: "Agent work orders", value: "Approved local only", tone: "amber" },
      { label: "DB writes", value: "Approved local only", tone: "amber" },
      { label: "Hosted DB", value: "Blocked", tone: "red" },
      { label: "Project mutation", value: "Disabled", tone: "red" },
      { label: "Fallback", value: "Active", tone: "teal" },
      { label: "Cost", value: "No spend", tone: "green" },
    ],
    blockers: [
      "Hosted or production DB connections",
      "General entity mutation outside the P93 OS runtime allowlist",
      "Provider/model calls and tool execution",
      "Project source mutation",
      "Deploy, export, package, or release actions",
    ],
    blockedOperations: [
      "No hosted DB credentials or URLs are accepted in Command Center",
      "No DB migration, schema mutation, or general write button is exposed",
      "No provider spend or external network call is triggered",
    ],
    evidenceRows: [
      { label: "SQLite foundation", value: "reports/p921-sqlite-runtime-foundation-report.md" },
      { label: "CRUD core", value: "reports/p922-sqlite-crud-repository-report.md" },
      { label: "Read wiring", value: "reports/p923-sqlite-runtime-read-wiring-report.md" },
      { label: "Governed writes", value: "reports/p924-governed-sqlite-runtime-writes-report.md" },
      { label: "Enterprise CRUD plan", value: "reports/p932-enterprise-runtime-crud-plan-report.md" },
      { label: "Mutation request model", value: "reports/p933-governed-runtime-mutation-request-report.md" },
      { label: "Local CRUD admission", value: enterpriseRuntime.evidenceLocation },
      { label: "Founder DB workflow", value: founderRuntime.evidenceLocation },
      { label: "Decision ledger DB", value: operatorDecisionLedgerPersistence.evidenceLocation },
      { label: "Agent work order DB", value: agentWorkOrderPersistence.evidenceLocation },
      { label: "Cost impact", value: "No provider spend; local SQLite only." },
      { label: "Disabled reason", value: enterpriseRuntime.disabledReason },
    ],
    enterpriseRuntime,
    founderRuntime,
    operatorDecisionLedgerPersistence,
    agentWorkOrderPersistence,
    safety: {
      dbWritesAllowed: "approved-os-runtime-entities-only",
      migrationsAllowed: false,
      schemaMutationAllowed: false,
      projectMutationAllowed: false,
      providerSpendAllowed: false,
    },
  };
}

export const dbRuntimeReadinessViewModel = buildDbRuntimeReadinessViewModel();
