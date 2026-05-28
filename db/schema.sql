-- NEXUS Durable State Schema — P41-LOCAL
-- Portable SQL schema artifact. Not executed against any real DB in P41.
-- DB writes are disabled in P41 (dbWritesEnabled: false).
-- This file is the schema foundation for P42+ DB implementation.

-- projects
CREATE TABLE IF NOT EXISTS projects (
  project_id     TEXT        NOT NULL,
  label          TEXT        NOT NULL,
  mode           TEXT        NOT NULL,
  active         BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id)
);
CREATE INDEX IF NOT EXISTS idx_projects_mode   ON projects (mode);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects (active);

-- missions
CREATE TABLE IF NOT EXISTS missions (
  contract_id    TEXT        NOT NULL,
  project_id     TEXT        NOT NULL,
  mission_text   TEXT        NOT NULL,
  mode           TEXT,
  source         TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (contract_id)
);
CREATE INDEX IF NOT EXISTS idx_missions_project_id ON missions (project_id);
CREATE INDEX IF NOT EXISTS idx_missions_mode       ON missions (mode);
CREATE INDEX IF NOT EXISTS idx_missions_source     ON missions (source);

-- mission_tasks
CREATE TABLE IF NOT EXISTS mission_tasks (
  task_id           TEXT        NOT NULL,
  mission_id        TEXT,
  project_id        TEXT        NOT NULL,
  title             TEXT        NOT NULL,
  target_agent      TEXT,
  capability_id     TEXT,
  risk_level        TEXT,
  state             TEXT        NOT NULL,
  mutation_allowed  BOOLEAN     NOT NULL DEFAULT false,
  execution_allowed BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id)
);
CREATE INDEX IF NOT EXISTS idx_mission_tasks_project_id   ON mission_tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_mission_tasks_mission_id   ON mission_tasks (mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_tasks_target_agent ON mission_tasks (target_agent);
CREATE INDEX IF NOT EXISTS idx_mission_tasks_state        ON mission_tasks (state);

-- runtime_tasks
CREATE TABLE IF NOT EXISTS runtime_tasks (
  task_id           TEXT        NOT NULL,
  mission_id        TEXT,
  project_id        TEXT        NOT NULL,
  title             TEXT        NOT NULL,
  target_agent      TEXT,
  capability_id     TEXT,
  risk_level        TEXT,
  state             TEXT        NOT NULL,
  mutation_allowed  BOOLEAN     NOT NULL DEFAULT false,
  execution_allowed BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id)
);
CREATE INDEX IF NOT EXISTS idx_runtime_tasks_project_id    ON runtime_tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_runtime_tasks_mission_id    ON runtime_tasks (mission_id);
CREATE INDEX IF NOT EXISTS idx_runtime_tasks_state         ON runtime_tasks (state);
CREATE INDEX IF NOT EXISTS idx_runtime_tasks_target_agent  ON runtime_tasks (target_agent);
CREATE INDEX IF NOT EXISTS idx_runtime_tasks_capability_id ON runtime_tasks (capability_id);

-- actions
CREATE TABLE IF NOT EXISTS actions (
  action_id    TEXT        NOT NULL,
  action_type  TEXT        NOT NULL,
  project_id   TEXT,
  task_id      TEXT,
  status       TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (action_id)
);
CREATE INDEX IF NOT EXISTS idx_actions_action_type ON actions (action_type);
CREATE INDEX IF NOT EXISTS idx_actions_project_id  ON actions (project_id);
CREATE INDEX IF NOT EXISTS idx_actions_task_id     ON actions (task_id);
CREATE INDEX IF NOT EXISTS idx_actions_status      ON actions (status);

-- agents
CREATE TABLE IF NOT EXISTS agents (
  agent_id     TEXT        NOT NULL,
  role         TEXT        NOT NULL,
  tier         TEXT,
  capabilities JSONB,
  active       BOOLEAN     NOT NULL DEFAULT true,
  PRIMARY KEY (agent_id)
);
CREATE INDEX IF NOT EXISTS idx_agents_tier   ON agents (tier);
CREATE INDEX IF NOT EXISTS idx_agents_active ON agents (active);

-- capabilities
CREATE TABLE IF NOT EXISTS capabilities (
  capability_id TEXT NOT NULL,
  agent_id      TEXT NOT NULL,
  skill_id      TEXT,
  description   TEXT,
  PRIMARY KEY (capability_id)
);
CREATE INDEX IF NOT EXISTS idx_capabilities_agent_id ON capabilities (agent_id);

-- contracts
CREATE TABLE IF NOT EXISTS contracts (
  contract_id    TEXT        NOT NULL,
  contract_type  TEXT        NOT NULL,
  project_id     TEXT,
  target_agent   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (contract_id)
);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_type ON contracts (contract_type);
CREATE INDEX IF NOT EXISTS idx_contracts_project_id    ON contracts (project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_target_agent  ON contracts (target_agent);

-- evidence
CREATE TABLE IF NOT EXISTS evidence (
  evidence_id TEXT        NOT NULL,
  task_id     TEXT,
  type        TEXT        NOT NULL,
  result      TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (evidence_id)
);
CREATE INDEX IF NOT EXISTS idx_evidence_task_id ON evidence (task_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type    ON evidence (type);
CREATE INDEX IF NOT EXISTS idx_evidence_result  ON evidence (result);

-- audit_events
CREATE TABLE IF NOT EXISTS audit_events (
  audit_id    TEXT        NOT NULL,
  task_id     TEXT,
  event_type  TEXT        NOT NULL,
  agent       TEXT,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (audit_id)
);
CREATE INDEX IF NOT EXISTS idx_audit_events_task_id    ON audit_events (task_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_event_type ON audit_events (event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_agent      ON audit_events (agent);

-- runtime_events
CREATE TABLE IF NOT EXISTS runtime_events (
  event_id    TEXT        NOT NULL,
  task_id     TEXT,
  event_type  TEXT        NOT NULL,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id)
);
CREATE INDEX IF NOT EXISTS idx_runtime_events_task_id    ON runtime_events (task_id);
CREATE INDEX IF NOT EXISTS idx_runtime_events_event_type ON runtime_events (event_type);

-- approvals
CREATE TABLE IF NOT EXISTS approvals (
  approval_id   TEXT        NOT NULL,
  task_id       TEXT,
  decision      TEXT        NOT NULL,
  requested_by  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (approval_id)
);
CREATE INDEX IF NOT EXISTS idx_approvals_task_id  ON approvals (task_id);
CREATE INDEX IF NOT EXISTS idx_approvals_decision ON approvals (decision);

-- incidents
CREATE TABLE IF NOT EXISTS incidents (
  incident_id TEXT        NOT NULL,
  type        TEXT        NOT NULL,
  severity    TEXT,
  agent       TEXT,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (incident_id)
);
CREATE INDEX IF NOT EXISTS idx_incidents_type     ON incidents (type);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents (severity);
CREATE INDEX IF NOT EXISTS idx_incidents_agent    ON incidents (agent);

-- roadmap_phases
CREATE TABLE IF NOT EXISTS roadmap_phases (
  phase   TEXT    NOT NULL,
  label   TEXT    NOT NULL,
  status  TEXT    NOT NULL,
  current BOOLEAN NOT NULL DEFAULT false,
  next    BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (phase)
);
CREATE INDEX IF NOT EXISTS idx_roadmap_phases_status  ON roadmap_phases (status);
CREATE INDEX IF NOT EXISTS idx_roadmap_phases_current ON roadmap_phases (current);
CREATE INDEX IF NOT EXISTS idx_roadmap_phases_next    ON roadmap_phases (next);

-- workflow_templates
CREATE TABLE IF NOT EXISTS workflow_templates (
  workflow_id  TEXT    NOT NULL,
  label        TEXT    NOT NULL,
  category     TEXT,
  enabled_now  BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (workflow_id)
);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category    ON workflow_templates (category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_enabled_now ON workflow_templates (enabled_now);

-- implementation_records
CREATE TABLE IF NOT EXISTS implementation_records (
  action_id           TEXT        NOT NULL,
  task_id             TEXT,
  implementation_type TEXT        NOT NULL,
  allowed_path        TEXT,
  validation_status   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (action_id)
);
CREATE INDEX IF NOT EXISTS idx_implementation_records_task_id             ON implementation_records (task_id);
CREATE INDEX IF NOT EXISTS idx_implementation_records_implementation_type ON implementation_records (implementation_type);
CREATE INDEX IF NOT EXISTS idx_implementation_records_validation_status   ON implementation_records (validation_status);

-- review_records
CREATE TABLE IF NOT EXISTS review_records (
  review_id    TEXT        NOT NULL,
  task_id      TEXT,
  decision     TEXT        NOT NULL,
  requested_by TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (review_id)
);
CREATE INDEX IF NOT EXISTS idx_review_records_task_id  ON review_records (task_id);
CREATE INDEX IF NOT EXISTS idx_review_records_decision ON review_records (decision);

-- validation_results
CREATE TABLE IF NOT EXISTS validation_results (
  validation_id TEXT        NOT NULL,
  project_id    TEXT,
  total         INTEGER,
  pass          INTEGER,
  status        TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (validation_id)
);
CREATE INDEX IF NOT EXISTS idx_validation_results_project_id ON validation_results (project_id);
CREATE INDEX IF NOT EXISTS idx_validation_results_status     ON validation_results (status);

-- founder_sessions
CREATE TABLE IF NOT EXISTS founder_sessions (
  session_id           TEXT        NOT NULL,
  public_label         TEXT        NOT NULL,
  founder_idea_summary TEXT,
  current_state        TEXT        NOT NULL,
  next_question        TEXT,
  readiness_percent    INTEGER,
  owner_capability     TEXT,
  evidence_refs        JSONB,
  activity_refs        JSONB,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id)
);
CREATE INDEX IF NOT EXISTS idx_founder_sessions_current_state    ON founder_sessions (current_state);
CREATE INDEX IF NOT EXISTS idx_founder_sessions_owner_capability ON founder_sessions (owner_capability);
CREATE INDEX IF NOT EXISTS idx_founder_sessions_updated_at       ON founder_sessions (updated_at);

-- founder_qna_turns
CREATE TABLE IF NOT EXISTS founder_qna_turns (
  turn_id          TEXT        NOT NULL,
  session_id       TEXT        NOT NULL,
  speaker          TEXT        NOT NULL,
  prompt           TEXT,
  response_summary TEXT,
  turn_state       TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (turn_id)
);
CREATE INDEX IF NOT EXISTS idx_founder_qna_turns_session_id ON founder_qna_turns (session_id);
CREATE INDEX IF NOT EXISTS idx_founder_qna_turns_speaker    ON founder_qna_turns (speaker);
CREATE INDEX IF NOT EXISTS idx_founder_qna_turns_turn_state ON founder_qna_turns (turn_state);
CREATE INDEX IF NOT EXISTS idx_founder_qna_turns_created_at ON founder_qna_turns (created_at);

-- founder_prd_artifacts
CREATE TABLE IF NOT EXISTS founder_prd_artifacts (
  prd_id                 TEXT        NOT NULL,
  session_id             TEXT        NOT NULL,
  title                  TEXT        NOT NULL,
  problem_summary        TEXT,
  customer_summary       TEXT,
  solution_summary       TEXT,
  business_model_summary TEXT,
  readiness_percent      INTEGER,
  current_state          TEXT        NOT NULL,
  evidence_refs          JSONB,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (prd_id)
);
CREATE INDEX IF NOT EXISTS idx_founder_prd_artifacts_session_id        ON founder_prd_artifacts (session_id);
CREATE INDEX IF NOT EXISTS idx_founder_prd_artifacts_current_state     ON founder_prd_artifacts (current_state);
CREATE INDEX IF NOT EXISTS idx_founder_prd_artifacts_readiness_percent ON founder_prd_artifacts (readiness_percent);
CREATE INDEX IF NOT EXISTS idx_founder_prd_artifacts_updated_at        ON founder_prd_artifacts (updated_at);

-- founder_workstream_plans
CREATE TABLE IF NOT EXISTS founder_workstream_plans (
  plan_id                  TEXT        NOT NULL,
  session_id               TEXT        NOT NULL,
  prd_id                   TEXT,
  lane                     TEXT        NOT NULL,
  owner_capability         TEXT,
  current_state            TEXT        NOT NULL,
  next_action              TEXT,
  blocker_summary          TEXT,
  dispatch_allowed         BOOLEAN     NOT NULL DEFAULT false,
  worker_execution_allowed BOOLEAN     NOT NULL DEFAULT false,
  project_mutation_allowed BOOLEAN     NOT NULL DEFAULT false,
  evidence_refs            JSONB,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_id)
);
CREATE INDEX IF NOT EXISTS idx_founder_workstream_plans_session_id       ON founder_workstream_plans (session_id);
CREATE INDEX IF NOT EXISTS idx_founder_workstream_plans_prd_id           ON founder_workstream_plans (prd_id);
CREATE INDEX IF NOT EXISTS idx_founder_workstream_plans_lane             ON founder_workstream_plans (lane);
CREATE INDEX IF NOT EXISTS idx_founder_workstream_plans_current_state    ON founder_workstream_plans (current_state);
CREATE INDEX IF NOT EXISTS idx_founder_workstream_plans_owner_capability ON founder_workstream_plans (owner_capability);

-- business_build_sessions
CREATE TABLE IF NOT EXISTS business_build_sessions (
  build_session_id  TEXT        NOT NULL,
  public_label      TEXT        NOT NULL,
  session_id        TEXT,
  prd_id            TEXT,
  current_state     TEXT        NOT NULL,
  readiness_percent INTEGER,
  next_action       TEXT,
  owner_capability  TEXT,
  evidence_refs     JSONB,
  activity_refs     JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (build_session_id)
);
CREATE INDEX IF NOT EXISTS idx_business_build_sessions_session_id       ON business_build_sessions (session_id);
CREATE INDEX IF NOT EXISTS idx_business_build_sessions_prd_id           ON business_build_sessions (prd_id);
CREATE INDEX IF NOT EXISTS idx_business_build_sessions_current_state    ON business_build_sessions (current_state);
CREATE INDEX IF NOT EXISTS idx_business_build_sessions_owner_capability ON business_build_sessions (owner_capability);
CREATE INDEX IF NOT EXISTS idx_business_build_sessions_updated_at       ON business_build_sessions (updated_at);

-- business_build_execution_requests
CREATE TABLE IF NOT EXISTS business_build_execution_requests (
  request_id               TEXT        NOT NULL,
  build_session_id         TEXT        NOT NULL,
  requested_lane           TEXT,
  requested_operation      TEXT        NOT NULL,
  request_state            TEXT        NOT NULL,
  approval_state           TEXT,
  disabled_reason          TEXT,
  validation_commands      JSONB,
  execution_allowed        BOOLEAN     NOT NULL DEFAULT false,
  dispatch_allowed         BOOLEAN     NOT NULL DEFAULT false,
  project_mutation_allowed BOOLEAN     NOT NULL DEFAULT false,
  evidence_refs            JSONB,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id)
);
CREATE INDEX IF NOT EXISTS idx_business_build_execution_requests_build_session_id    ON business_build_execution_requests (build_session_id);
CREATE INDEX IF NOT EXISTS idx_business_build_execution_requests_requested_lane      ON business_build_execution_requests (requested_lane);
CREATE INDEX IF NOT EXISTS idx_business_build_execution_requests_requested_operation ON business_build_execution_requests (requested_operation);
CREATE INDEX IF NOT EXISTS idx_business_build_execution_requests_request_state       ON business_build_execution_requests (request_state);
CREATE INDEX IF NOT EXISTS idx_business_build_execution_requests_approval_state      ON business_build_execution_requests (approval_state);

-- business_build_agent_lanes
CREATE TABLE IF NOT EXISTS business_build_agent_lanes (
  lane_id                  TEXT        NOT NULL,
  build_session_id         TEXT        NOT NULL,
  lane                     TEXT        NOT NULL,
  owner_capability         TEXT,
  current_state            TEXT        NOT NULL,
  next_action              TEXT,
  blocker_summary          TEXT,
  dispatch_allowed         BOOLEAN     NOT NULL DEFAULT false,
  worker_execution_allowed BOOLEAN     NOT NULL DEFAULT false,
  project_mutation_allowed BOOLEAN     NOT NULL DEFAULT false,
  evidence_refs            JSONB,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (lane_id)
);
CREATE INDEX IF NOT EXISTS idx_business_build_agent_lanes_build_session_id ON business_build_agent_lanes (build_session_id);
CREATE INDEX IF NOT EXISTS idx_business_build_agent_lanes_lane             ON business_build_agent_lanes (lane);
CREATE INDEX IF NOT EXISTS idx_business_build_agent_lanes_current_state    ON business_build_agent_lanes (current_state);
CREATE INDEX IF NOT EXISTS idx_business_build_agent_lanes_owner_capability ON business_build_agent_lanes (owner_capability);

-- business_build_prd_snapshots
CREATE TABLE IF NOT EXISTS business_build_prd_snapshots (
  snapshot_id            TEXT        NOT NULL,
  build_session_id       TEXT        NOT NULL,
  prd_id                 TEXT,
  title                  TEXT        NOT NULL,
  problem_summary        TEXT,
  customer_summary       TEXT,
  solution_summary       TEXT,
  business_model_summary TEXT,
  readiness_percent      INTEGER,
  snapshot_state         TEXT        NOT NULL,
  evidence_refs          JSONB,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (snapshot_id)
);
CREATE INDEX IF NOT EXISTS idx_business_build_prd_snapshots_build_session_id  ON business_build_prd_snapshots (build_session_id);
CREATE INDEX IF NOT EXISTS idx_business_build_prd_snapshots_prd_id            ON business_build_prd_snapshots (prd_id);
CREATE INDEX IF NOT EXISTS idx_business_build_prd_snapshots_snapshot_state    ON business_build_prd_snapshots (snapshot_state);
CREATE INDEX IF NOT EXISTS idx_business_build_prd_snapshots_readiness_percent ON business_build_prd_snapshots (readiness_percent);
CREATE INDEX IF NOT EXISTS idx_business_build_prd_snapshots_updated_at        ON business_build_prd_snapshots (updated_at);

-- operator_decision_ledger_entries
CREATE TABLE IF NOT EXISTS operator_decision_ledger_entries (
  ledger_entry_id           TEXT        NOT NULL,
  public_label              TEXT        NOT NULL,
  source_candidate_label    TEXT,
  source_review_label       TEXT,
  proposed_agent_lane       TEXT,
  proposed_outcome          TEXT,
  decision_state            TEXT        NOT NULL,
  decision_summary          TEXT,
  next_action               TEXT,
  disabled_reason           TEXT,
  owner_capability          TEXT,
  ledger_write_allowed      BOOLEAN     NOT NULL DEFAULT false,
  db_write_allowed          BOOLEAN     NOT NULL DEFAULT false,
  hosted_db_mutation_allowed BOOLEAN    NOT NULL DEFAULT false,
  replay_allowed            BOOLEAN     NOT NULL DEFAULT false,
  execution_unlock_allowed  BOOLEAN     NOT NULL DEFAULT false,
  runtime_admission_allowed BOOLEAN     NOT NULL DEFAULT false,
  dispatch_allowed          BOOLEAN     NOT NULL DEFAULT false,
  project_mutation_allowed  BOOLEAN     NOT NULL DEFAULT false,
  provider_spend_allowed    BOOLEAN     NOT NULL DEFAULT false,
  evidence_refs             JSONB,
  activity_refs             JSONB,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (ledger_entry_id)
);
CREATE INDEX IF NOT EXISTS idx_operator_decision_ledger_entries_decision_state      ON operator_decision_ledger_entries (decision_state);
CREATE INDEX IF NOT EXISTS idx_operator_decision_ledger_entries_proposed_agent_lane ON operator_decision_ledger_entries (proposed_agent_lane);
CREATE INDEX IF NOT EXISTS idx_operator_decision_ledger_entries_owner_capability    ON operator_decision_ledger_entries (owner_capability);
CREATE INDEX IF NOT EXISTS idx_operator_decision_ledger_entries_updated_at          ON operator_decision_ledger_entries (updated_at);

-- operator_decision_ledger_events
CREATE TABLE IF NOT EXISTS operator_decision_ledger_events (
  ledger_event_id           TEXT        NOT NULL,
  ledger_entry_id           TEXT        NOT NULL,
  event_type                TEXT        NOT NULL,
  event_state               TEXT        NOT NULL,
  actor_label               TEXT,
  event_summary             TEXT,
  rollback_available        BOOLEAN     NOT NULL DEFAULT false,
  replay_allowed            BOOLEAN     NOT NULL DEFAULT false,
  execution_unlock_allowed  BOOLEAN     NOT NULL DEFAULT false,
  runtime_admission_allowed BOOLEAN     NOT NULL DEFAULT false,
  evidence_refs             JSONB,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (ledger_event_id)
);
CREATE INDEX IF NOT EXISTS idx_operator_decision_ledger_events_ledger_entry_id ON operator_decision_ledger_events (ledger_entry_id);
CREATE INDEX IF NOT EXISTS idx_operator_decision_ledger_events_event_type      ON operator_decision_ledger_events (event_type);
CREATE INDEX IF NOT EXISTS idx_operator_decision_ledger_events_event_state     ON operator_decision_ledger_events (event_state);
CREATE INDEX IF NOT EXISTS idx_operator_decision_ledger_events_created_at      ON operator_decision_ledger_events (created_at);

-- operator_decision_ledger_evidence_refs
CREATE TABLE IF NOT EXISTS operator_decision_ledger_evidence_refs (
  evidence_ref_id    TEXT        NOT NULL,
  ledger_entry_id    TEXT        NOT NULL,
  evidence_label     TEXT        NOT NULL,
  evidence_type      TEXT,
  evidence_location  TEXT        NOT NULL,
  redaction_required BOOLEAN     NOT NULL DEFAULT true,
  retained_for_audit BOOLEAN     NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (evidence_ref_id)
);
CREATE INDEX IF NOT EXISTS idx_operator_decision_ledger_evidence_refs_ledger_entry_id   ON operator_decision_ledger_evidence_refs (ledger_entry_id);
CREATE INDEX IF NOT EXISTS idx_operator_decision_ledger_evidence_refs_evidence_type     ON operator_decision_ledger_evidence_refs (evidence_type);
CREATE INDEX IF NOT EXISTS idx_operator_decision_ledger_evidence_refs_evidence_location ON operator_decision_ledger_evidence_refs (evidence_location);

-- founder_agent_work_orders
CREATE TABLE IF NOT EXISTS founder_agent_work_orders (
  work_order_id             TEXT        NOT NULL,
  public_label              TEXT        NOT NULL,
  source_handoff_label      TEXT,
  source_admission_label    TEXT,
  proposed_agent            TEXT,
  proposed_work             TEXT,
  work_order_state          TEXT        NOT NULL,
  work_order_summary        TEXT,
  next_action               TEXT,
  disabled_reason           TEXT,
  owner_capability          TEXT,
  local_crud_allowed        BOOLEAN     NOT NULL DEFAULT false,
  db_write_allowed          BOOLEAN     NOT NULL DEFAULT false,
  hosted_db_mutation_allowed BOOLEAN    NOT NULL DEFAULT false,
  dispatch_allowed          BOOLEAN     NOT NULL DEFAULT false,
  execution_allowed         BOOLEAN     NOT NULL DEFAULT false,
  worker_execution_allowed  BOOLEAN     NOT NULL DEFAULT false,
  runtime_admission_allowed BOOLEAN     NOT NULL DEFAULT false,
  project_mutation_allowed  BOOLEAN     NOT NULL DEFAULT false,
  provider_spend_allowed    BOOLEAN     NOT NULL DEFAULT false,
  evidence_refs             JSONB,
  activity_refs             JSONB,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (work_order_id)
);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_orders_work_order_state ON founder_agent_work_orders (work_order_state);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_orders_proposed_agent   ON founder_agent_work_orders (proposed_agent);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_orders_owner_capability ON founder_agent_work_orders (owner_capability);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_orders_updated_at       ON founder_agent_work_orders (updated_at);

-- founder_agent_work_order_events
CREATE TABLE IF NOT EXISTS founder_agent_work_order_events (
  work_order_event_id     TEXT        NOT NULL,
  work_order_id           TEXT        NOT NULL,
  event_type              TEXT        NOT NULL,
  event_state             TEXT        NOT NULL,
  actor_label             TEXT,
  event_summary           TEXT,
  rollback_available      BOOLEAN     NOT NULL DEFAULT false,
  dispatch_allowed        BOOLEAN     NOT NULL DEFAULT false,
  execution_allowed       BOOLEAN     NOT NULL DEFAULT false,
  project_mutation_allowed BOOLEAN    NOT NULL DEFAULT false,
  evidence_refs           JSONB,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (work_order_event_id)
);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_order_events_work_order_id ON founder_agent_work_order_events (work_order_id);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_order_events_event_type    ON founder_agent_work_order_events (event_type);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_order_events_event_state   ON founder_agent_work_order_events (event_state);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_order_events_created_at    ON founder_agent_work_order_events (created_at);

-- founder_agent_work_order_evidence_refs
CREATE TABLE IF NOT EXISTS founder_agent_work_order_evidence_refs (
  work_order_evidence_ref_id TEXT        NOT NULL,
  work_order_id              TEXT        NOT NULL,
  evidence_label             TEXT        NOT NULL,
  evidence_type              TEXT,
  evidence_location          TEXT        NOT NULL,
  redaction_required         BOOLEAN     NOT NULL DEFAULT true,
  retained_for_audit         BOOLEAN     NOT NULL DEFAULT true,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (work_order_evidence_ref_id)
);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_order_evidence_refs_work_order_id      ON founder_agent_work_order_evidence_refs (work_order_id);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_order_evidence_refs_evidence_type      ON founder_agent_work_order_evidence_refs (evidence_type);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_order_evidence_refs_evidence_location  ON founder_agent_work_order_evidence_refs (evidence_location);

-- founder_agent_work_queue_items
CREATE TABLE IF NOT EXISTS founder_agent_work_queue_items (
  queue_item_id            TEXT        NOT NULL,
  work_order_id            TEXT        NOT NULL,
  public_label             TEXT        NOT NULL,
  queue_lane               TEXT,
  queue_state              TEXT        NOT NULL,
  queue_summary            TEXT,
  priority_label           TEXT,
  next_action              TEXT,
  disabled_reason          TEXT,
  owner_capability         TEXT,
  local_crud_allowed       BOOLEAN     NOT NULL DEFAULT false,
  db_write_allowed         BOOLEAN     NOT NULL DEFAULT false,
  hosted_db_mutation_allowed BOOLEAN   NOT NULL DEFAULT false,
  dispatch_allowed         BOOLEAN     NOT NULL DEFAULT false,
  execution_allowed        BOOLEAN     NOT NULL DEFAULT false,
  worker_execution_allowed BOOLEAN     NOT NULL DEFAULT false,
  runtime_admission_allowed BOOLEAN    NOT NULL DEFAULT false,
  project_mutation_allowed BOOLEAN     NOT NULL DEFAULT false,
  provider_spend_allowed   BOOLEAN     NOT NULL DEFAULT false,
  evidence_refs            JSONB,
  activity_refs            JSONB,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (queue_item_id)
);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_queue_items_work_order_id    ON founder_agent_work_queue_items (work_order_id);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_queue_items_queue_state      ON founder_agent_work_queue_items (queue_state);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_queue_items_queue_lane       ON founder_agent_work_queue_items (queue_lane);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_queue_items_owner_capability ON founder_agent_work_queue_items (owner_capability);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_queue_items_updated_at       ON founder_agent_work_queue_items (updated_at);

-- founder_agent_work_queue_events
CREATE TABLE IF NOT EXISTS founder_agent_work_queue_events (
  queue_event_id          TEXT        NOT NULL,
  queue_item_id           TEXT        NOT NULL,
  work_order_id           TEXT,
  event_type              TEXT        NOT NULL,
  event_state             TEXT        NOT NULL,
  actor_label             TEXT,
  event_summary           TEXT,
  rollback_available      BOOLEAN     NOT NULL DEFAULT false,
  dispatch_allowed        BOOLEAN     NOT NULL DEFAULT false,
  execution_allowed       BOOLEAN     NOT NULL DEFAULT false,
  project_mutation_allowed BOOLEAN    NOT NULL DEFAULT false,
  evidence_refs           JSONB,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (queue_event_id)
);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_queue_events_queue_item_id ON founder_agent_work_queue_events (queue_item_id);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_queue_events_work_order_id ON founder_agent_work_queue_events (work_order_id);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_queue_events_event_type    ON founder_agent_work_queue_events (event_type);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_queue_events_event_state   ON founder_agent_work_queue_events (event_state);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_queue_events_created_at    ON founder_agent_work_queue_events (created_at);

-- founder_agent_work_queue_evidence_refs
CREATE TABLE IF NOT EXISTS founder_agent_work_queue_evidence_refs (
  queue_evidence_ref_id TEXT        NOT NULL,
  queue_item_id         TEXT        NOT NULL,
  work_order_id         TEXT,
  evidence_label        TEXT        NOT NULL,
  evidence_type         TEXT,
  evidence_location     TEXT        NOT NULL,
  redaction_required    BOOLEAN     NOT NULL DEFAULT true,
  retained_for_audit    BOOLEAN     NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (queue_evidence_ref_id)
);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_queue_evidence_refs_queue_item_id     ON founder_agent_work_queue_evidence_refs (queue_item_id);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_queue_evidence_refs_work_order_id     ON founder_agent_work_queue_evidence_refs (work_order_id);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_queue_evidence_refs_evidence_type     ON founder_agent_work_queue_evidence_refs (evidence_type);
CREATE INDEX IF NOT EXISTS idx_founder_agent_work_queue_evidence_refs_evidence_location ON founder_agent_work_queue_evidence_refs (evidence_location);
