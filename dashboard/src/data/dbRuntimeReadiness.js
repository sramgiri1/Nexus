import { createDbReadinessGate } from "../../../db-runtime/p72-4-placeholder.js";

const gate = createDbReadinessGate({
  nextAction: "Keep runtime database readiness display-only until governed DB enablement is explicitly approved.",
});

export function buildDbRuntimeReadinessViewModel() {
  return {
    summaryRows: [
      { label: "DB primary state", value: "Contract ready for review" },
      { label: "Fallback state", value: "File-backed runtime remains primary" },
      { label: "Migration readiness", value: "Preview only" },
      { label: "Readiness decision", value: "Not ready for execution" },
      { label: "Owner capability", value: "NEXUS DB Readiness Gate" },
      { label: "Next action", value: gate.nextAction },
    ],
    statusChips: [
      { label: "DB writes", value: "Disabled", tone: "red" },
      { label: "Migrations", value: "Disabled", tone: "red" },
      { label: "Schema mutation", value: "Disabled", tone: "red" },
      { label: "Fallback", value: "Active", tone: "teal" },
      { label: "Cost", value: "No spend", tone: "green" },
    ],
    blockers: gate.blockers.slice(0, 5),
    blockedOperations: gate.blockedOperations,
    evidenceRows: [
      { label: "Evidence", value: "reports/command-center-db-runtime-ux-report.md" },
      { label: "Activity", value: "os-roadmap/phase-status.json DB readiness gate entry" },
      { label: "Safety posture", value: "Preview-only blocked gate" },
      { label: "Cost impact", value: gate.costImpact },
      { label: "Disabled reason", value: "DB readiness is display-only; writes, migrations, schema mutation, and runtime storage mutation remain disabled." },
    ],
    safety: {
      dbWritesAllowed: gate.dbWritesAllowed,
      migrationsAllowed: gate.migrationsAllowed,
      schemaMutationAllowed: gate.schemaMutationAllowed,
      projectMutationAllowed: gate.projectMutationAllowed,
      providerSpendAllowed: gate.providerSpendAllowed,
    },
  };
}

export const dbRuntimeReadinessViewModel = buildDbRuntimeReadinessViewModel();
