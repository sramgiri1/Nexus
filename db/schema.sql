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
