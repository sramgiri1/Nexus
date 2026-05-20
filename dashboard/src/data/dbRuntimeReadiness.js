export function buildDbRuntimeReadinessViewModel() {
  return {
    summaryRows: [
      { label: "DB primary state", value: "Local SQLite ready when initialized" },
      { label: "Read source", value: "SQLite when live; file fallback otherwise" },
      { label: "Fallback state", value: "File-backed fallback active" },
      { label: "Governed writes", value: "Evidence, audit, and activity ledgers only" },
      { label: "General mutation", value: "Disabled" },
      { label: "Owner capability", value: "NEXUS DB Runtime Governance" },
      { label: "Next action", value: "Use explicit local DB flags for governed ledger persistence; keep hosted DB and project mutation blocked." },
    ],
    statusChips: [
      { label: "SQLite CRUD", value: "Live local", tone: "teal" },
      { label: "Repository reads", value: "Wired", tone: "green" },
      { label: "Ledger writes", value: "Guarded", tone: "amber" },
      { label: "DB writes", value: "Limited", tone: "amber" },
      { label: "Hosted DB", value: "Blocked", tone: "red" },
      { label: "Project mutation", value: "Disabled", tone: "red" },
      { label: "Fallback", value: "Active", tone: "teal" },
      { label: "Cost", value: "No spend", tone: "green" },
    ],
    blockers: [
      "Hosted or production DB connections",
      "General entity mutation outside governed ledgers",
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
      { label: "Cost impact", value: "No provider spend; local SQLite only." },
      { label: "Disabled reason", value: "General DB mutation, hosted DBs, migrations, project writes, deploy, package, and provider spend remain blocked." },
    ],
    safety: {
      dbWritesAllowed: "governed-ledgers-only",
      migrationsAllowed: false,
      schemaMutationAllowed: false,
      projectMutationAllowed: false,
      providerSpendAllowed: false,
    },
  };
}

export const dbRuntimeReadinessViewModel = buildDbRuntimeReadinessViewModel();
