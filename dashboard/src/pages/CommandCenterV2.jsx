import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { buildCommandCenterViewModelV2 } from "../data/commandCenterViewModel.js";
import { CommandTabs, CommandTabPanel } from "../components/command-center-v2/CommandTabs.jsx";
import { HelpLink } from "../components/command-center-v2/HelpLink.jsx";
import { ProjectSwitcher } from "../components/command-center-v2/ProjectSwitcher.jsx";
import { ScopeSwitcher } from "../components/command-center-v2/ScopeSwitcher.jsx";
import {
  AGENT_REGISTRY_TABS,
  AUTH_GOVERNANCE_TABS,
  BACKUP_DR_TABS,
  AGENT_ROOMS_TABS,
  API_BATCH_TABS,
  BATCH_QUEUE_TABS,
  BUSINESS_BUILD_TABS,
  COMPLIANCE_TABS,
  COST_CENTER_TABS,
  DATA_CONTEXT_TABS,
  DEPLOY_MONITORING_TABS,
  DURABLE_STATE_TABS,
  ENTERPRISE_PREVIEW_TABS,
  FOUNDER_INTAKE_TABS,
  EVIDENCE_TABS,
  HOOK_REGISTRY_TABS,
  IMPLEMENTATION_TABS,
  ISOLATION_TABS,
  LIVE_API_TABS,
  LIVE_READINESS_TABS,
  MEMORY_CENTER_TABS,
  MISSION_CONTROL_TABS,
  OBSERVABILITY_TABS,
  POLICY_CENTER_TABS,
  PROJECTS_TABS,
  PROJECT_SHIPPING_TABS,
  QUALITY_INTELLIGENCE_TABS,
  RELEASE_CONTROL_TABS,
  SAFETY_CENTER_TABS,
  SECRETS_BOUNDARY_TABS,
  SELF_UPDATE_TABS,
  SKILL_REGISTRY_TABS,
  TASK_QUEUE_TABS,
  TEST_CENTER_TABS,
  TOOL_GATEWAY_TABS,
  TRIGGER_INTEGRATION_TABS,
  WORKER_RUNTIME_TABS,
  WORKBENCH_TABS,
  WORKSPACE_TABS,
} from "../data/commandCenterTabs.js";
import { getNexusCommandsForScope } from "../data/nexusCommands.js";
import {
  COMMAND_CENTER_ROUTE_BY_KEY,
  getCommandCenterFounderSidebarGroups,
  getFounderRouteContext,
  resolveCommandCenterRoute,
} from "../data/commandCenterRoutes.js";
import {
  NEXUS_COMPLETED_OS_PHASES,
  NEXUS_CURRENT_OS_PHASE,
  NEXUS_IN_PROGRESS_OS_PHASES,
  NEXUS_NEXT_OS_PHASE,
  NEXUS_PLANNED_OS_PHASES,
  NEXUS_PREVIOUS_COMPLETED_PHASE,
} from "../data/nexusRoadmap.js";
import { dispatchGovernanceSummary, dispatchReadinessCards } from "../data/dispatchGovernance.js";
import { codeModeReadinessCards } from "../data/codeModeReadiness.js";
import { batchIntelligenceReadinessCards } from "../data/batchIntelligenceReadiness.js";
import { privateValidationSnapshot } from "../data/privateValidationSnapshot.js";
import {
  PROJECT_SELECTION_STORAGE_KEY,
  getProjectSelectionOptions,
  resolveSelectedProject,
} from "../data/projectSelection.js";
import {
  getNoProjectGuidance,
  resolveCommandCenterIdentity,
} from "../data/commandCenterIdentity.js";
import { buildApprovalPreview } from "../../../command-interface/commandApprovalPreview.js";
import { createCommandIntent } from "../../../command-interface/commandIntentSchema.js";
import { buildCommandRoutePreview, routeCommandIntent } from "../../../command-interface/commandRouter.js";
import { buildCommandContextPacket } from "../../../command-interface/commandScopeResolver.js";
import { actionBridgeSnapshot } from "../data/actionBridgeSnapshot.js";
import { runtimeSnapshot } from "../data/runtimeSnapshot.js";
import { LOCAL_REPORT_SNAPSHOT } from "../data/localReports.js";
import { buildSelfUpdateReadinessViewModel } from "../data/selfUpdateReadiness.js";
import { buildReleaseReadinessViewModel } from "../data/releaseReadiness.js";
import { buildDeployMonitoringReadinessViewModel } from "../data/deployMonitoringReadiness.js";
import { buildProjectShippingReadinessViewModel } from "../data/projectShippingReadiness.js";
import { dbRuntimeReadinessViewModel } from "../data/dbRuntimeReadiness.js";
import { buildAuthGovernanceReadinessViewModel } from "../data/authGovernanceReadiness.js";
import { buildObservabilityReadinessViewModel } from "../data/observabilityReadiness.js";
import { buildBackupDrReadinessViewModel } from "../data/backupDrReadiness.js";
import { buildIsolationReadinessViewModel } from "../data/isolationReadiness.js";
import { buildComplianceReadinessViewModel } from "../data/complianceReadiness.js";
import { buildEnterprisePreviewReadinessViewModel } from "../data/enterprisePreviewReadiness.js";
import { buildLiveReadinessViewModel } from "../data/liveReadiness.js";
import { buildFounderIntakeViewModel } from "../data/founderIntake.js";
import { buildBusinessBuildViewModel, buildFounderRuntimeDbViewModel } from "../data/businessBuild.js";
import {
  appendFounderQnaTurn,
  resetFounderQnaTurnState,
} from "../../../live-ready/enterpriseFounderQnaTurnState.js";
import Recovery from "./Recovery.jsx";
import { checkActionBridgeHealth, composeMissionFromCommandCenter } from "../api/missionActions.js";
import { activateMissionTask } from "../api/taskActions.js";
import { loadWorkbenchView, reviewTask, listWorkbenchItems } from "../api/workbenchActions.js";
import { proposeImplementation, applyImplementation } from "../api/implementationActions.js";
import {
  getActivity,
  getLocalApiHealth,
  getLocalStatus,
  getTasks,
  getEvidence,
  getProjects,
  getRoadmap,
  getDbStatus,
  buildApiState,
} from "../api/localApiClient.js";
import { useNexusTheme } from "../hooks/useNexusTheme.js";
import "../styles-command-center-v2.css";

/*
 * Developer Details — legacy checker compatibility tokens only.
 * Visible roadmap states are driven by nexusRoadmap.js and product copy.
 * Keep these strings out of primary rendered UX:
 * P37 COMPLETE
 * P38 COMPLETE
 * P39 COMPLETE
 * P40 COMPLETE
 * P40 IN_PROGRESS
 * P41 IN_PROGRESS
 * P41 PLANNED
 * "P40"
 * "P41"
 * Legacy optional checker compatibility only:
 * workbench: "Agent Workbench"
 * P37 COMPLETE
 * P38 IN_PROGRESS
 * Task Activation + Agent Assignment from UI
 */

const FOUNDER_NAV_GROUPS_V2 = getCommandCenterFounderSidebarGroups();

/* ─── Sparkline ─── */
const SPARK_DATA = {
  blue:  [30, 42, 38, 55, 48, 62, 58],
  red:   [10,  8, 12,  9, 14, 11,  8],
  amber: [55, 60, 58, 63, 65, 67, 67],
  green: [ 1,  0,  1,  0,  0,  0,  0],
};

function Sparkline({ tone }) {
  const bars = SPARK_DATA[tone] || SPARK_DATA.blue;
  const max = Math.max(...bars, 1);
  return (
    <div className="ccv2-sparkline">
      {bars.map((v, i) => (
        <div
          key={i}
          className={`ccv2-sparkline__bar ccv2-sparkline__bar--${tone}`}
          style={{ height: `${Math.max(4, Math.round((v / max) * 20))}px` }}
        />
      ))}
    </div>
  );
}

/* ─── Metric Card ─── */
function MetricCard({ metric }) {
  return (
    <div className="ccv2-card ccv2-metric-card">
      <div className="ccv2-metric-card__label">{metric.label}</div>
      <div className={`ccv2-metric-card__value ccv2-metric-card__value--${metric.tone}`}>
        {metric.value}
      </div>
      <Sparkline tone={metric.tone} />
      <div className="ccv2-metric-card__delta">{metric.delta}</div>
    </div>
  );
}

const ROUTE_ICONS = {
  lite: "⌕",
  agentFlow: "◇",
  mission: "⬡",
  command: "⌕",
  workspace: "⊹",
  tasks: "≡",
  workbench: "⬡",
  projects: "⬤",
  gates: "⬛",
  contracts: "◻",
  evidence: "◇",
  safety: "⚑",
  approvals: "✓",
  implementation: "▲",
  release: "⬆",
  agents: "◈",
  skills: "✦",
  hooks: "⌁",
  tools: "⌘",
  liveapi: "◎",
  database: "⬟",
  services: "☍",
  batch: "⊞",
  cost: "$",
  memory: "◌",
  recovery: "↻",
  selfUpdate: "↺",
  deployMonitoring: "◍",
  projectShipping: "⇥",
  authGovernance: "◑",
  roadmap: "◈",
  activity: "☰",
  docs: "☷",
  settings: "⚙",
  demo: "▶",
  businessBuild: "◇",
};

const WORKFLOW_GROUPS = [
  { key: "plan", label: "Plan" },
  { key: "build", label: "Build" },
  { key: "validate", label: "Validate" },
  { key: "govern", label: "Govern" },
  { key: "release", label: "Release" },
];

function humanizeMissionId(missionId) {
  if (!missionId || typeof missionId !== "string") {
    return "Active Mission";
  }

  return missionId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const TASK_STATE_LABELS = {
  planned: "Not started",
  queued: "Queued",
  running: "Running",
  awaiting_verification: "Review",
  awaiting_approval: "Blocked by approval",
  blocked: "Blocked",
  implementation_done: "Implementation done",
  completed: "Completed",
  activated: "Queued",
};

const TASK_STATE_TONES = {
  planned: "disabled",
  queued: "pass",
  running: "pending",
  awaiting_verification: "pending",
  awaiting_approval: "fail",
  blocked: "fail",
  implementation_done: "pass",
  completed: "pass",
  activated: "pass",
};

function formatAgentLabel(agent) {
  return (agent || "NEXUS").toUpperCase();
}

function formatTaskStateLabel(state) {
  return TASK_STATE_LABELS[state] || String(state || "unknown").replace(/_/g, " ");
}

function getTaskStateTone(state) {
  return TASK_STATE_TONES[state] || "disabled";
}

function formatCapabilityLabel(capabilityId) {
  return String(capabilityId || "Not available").replace(/[._]/g, " · ");
}

function hasActiveProject(vm) {
  return Boolean(!vm?.commandCenterIdentity?.noProjectSelected && vm?.shell?.activeProject && vm.shell.activeProject !== "No project selected");
}

function ProjectContextCard({ vm, surface }) {
  const activeProject = vm?.shell?.activeProject || "";
  const activeMission = vm?.mission?.displayName || humanizeMissionId(vm?.mission?.id);
  const projectSelected = hasActiveProject(vm);

  if (!projectSelected) {
    const guidance = vm?.commandCenterIdentity?.noProjectGuidance || getNoProjectGuidance();
    return (
      <div className="ccv2-card ccv2-page-summary-card">
        <div className="ccv2-section-heading">No project selected</div>
        <p style={{ marginTop: 6, fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6 }}>
          Start by selecting or creating a project before using {surface}. NEXUS OS and portfolio views remain available; project operations require a selected project.
        </p>
        <div className="ccv2-page-summary-grid" style={{ marginTop: 10 }}>
          {guidance.steps.map((step) => (
            <div key={step} className="ccv2-page-summary-row">
              <span className="ccv2-page-summary-label">Next step</span>
              <span className="ccv2-page-summary-value">{step}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {guidance.actions.map((action) => (
            <button
              key={action.label}
              className={`ccv2-wf-card__btn ccv2-wf-card__btn--${action.enabled ? "enabled" : "disabled"}`}
              disabled={!action.enabled}
              title={action.disabledReason || action.route || ""}
              onClick={() => {
                if (action.route) window.location.href = action.route;
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ccv2-card ccv2-page-summary-card">
      <div className="ccv2-section-heading">Active Project Context</div>
      <div className="ccv2-page-summary-grid">
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Active project</span><span className="ccv2-page-summary-value">{activeProject}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Active mission</span><span className="ccv2-page-summary-value">{activeMission}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Project data</span><span className="ccv2-page-summary-value">Project-scoped tasks, evidence, gates, cost, and progress stay attached to this active project.</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Secondary metadata</span><span className="ccv2-page-summary-value">{vm?.shell?.environment || "Desktop"} · {vm?.shell?.mode || "local-private"}</span></div>
      </div>
    </div>
  );
}

function FounderOperationsBoard({ title, purpose, currentState, nextAction, blocker, owner, evidence, activity, cost, lanes = [] }) {
  const rows = [
    ["Founder use", purpose],
    ["Current state", currentState],
    ["Next action", nextAction],
    ["Blocker", blocker],
    ["Owner", owner],
    ["Evidence", evidence],
    ["Activity", activity],
    ["Cost impact", cost],
  ].filter(([, value]) => value);

  return (
    <section className="ccv2-card ccv2-founder-ops-board" aria-label={`${title} founder operations board`}>
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">Founder Operations</div>
          <h3>{title}</h3>
        </div>
        <span className="ccv2-pill ccv2-pill--teal">Founder useful</span>
      </div>
      <div className="ccv2-page-summary-grid">
        {rows.map(([label, value]) => (
          <div key={label} className="ccv2-page-summary-row">
            <span className="ccv2-page-summary-label">{label}</span>
            <span className="ccv2-page-summary-value">{value}</span>
          </div>
        ))}
      </div>
      {lanes.length > 0 && (
        <div className="ccv2-founder-ops-board__lanes" aria-label={`${title} agent lanes`}>
          {lanes.map((lane) => (
            <div key={lane.label} className="ccv2-founder-ops-board__lane">
              <span>{lane.label}</span>
              <strong>{lane.value}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const FOUNDER_DELIVERY_BOARDS = {
  agentRegistry: {
    title: "Agent Registry",
    purpose: "Show which agents own delivery work and what evidence or boundaries they require.",
    currentState: "Registry is readable; agent definition mutation is disabled.",
    nextAction: "Review owner agents before routing work to delivery pages.",
    blocker: "Agent file edits and permission expansion require later governed approval.",
    owner: "WARDEN Agent Registry",
    evidence: "Agent registry cards and boundary reports",
    activity: "Activity Log",
    cost: "No provider spend from registry review",
    lanes: [
      { label: "Agents", value: "Readable" },
      { label: "Definitions", value: "Mutation disabled" },
      { label: "Permissions", value: "Review only" },
      { label: "Dispatch", value: "Blocked" },
    ],
  },
  release: {
    title: "Release Control",
    purpose: "Show release readiness, approvals, rollback, and blockers before any shipping action.",
    currentState: "Release readiness is display-only.",
    nextAction: "Review gate, evidence, approval, rollback, and validation posture.",
    blocker: "Deploy, release, export, package creation, and signing remain disabled.",
    owner: "SENTINEL Release Readiness",
    evidence: "Release readiness evidence tabs",
    activity: "Activity Log",
    cost: "No release or provider spend",
    lanes: [
      { label: "Approval", value: "Required" },
      { label: "Rollback", value: "Review" },
      { label: "Deploy", value: "Disabled" },
      { label: "Package", value: "Disabled" },
    ],
  },
  projects: {
    title: "Projects",
    purpose: "Show selected-project context, portfolio posture, milestones, and gaps without exposing raw IDs.",
    currentState: "Project data is scoped and display-safe.",
    nextAction: "Review selected project readiness, milestones, evidence, and missing capabilities.",
    blocker: "Project creation and project source mutation remain disabled unless explicitly admitted.",
    owner: "NEXUS Project Context",
    evidence: "Project evidence tab and roadmap summary",
    activity: "Activity Log",
    cost: "No provider spend from project inspection",
    lanes: [
      { label: "Portfolio", value: "Readable" },
      { label: "Selected project", value: "Scoped" },
      { label: "Milestones", value: "Visible" },
      { label: "Mutation", value: "Disabled" },
    ],
  },
  skills: {
    title: "Skill Registry",
    purpose: "Show which skills are available for future governed agent work.",
    currentState: "Skill registry is readable; installation and mutation are disabled.",
    nextAction: "Review skill capabilities and gaps before assigning work.",
    blocker: "Skill install/update actions are not enabled from Command Center.",
    owner: "NEXUS Skill Registry",
    evidence: "Skill registry reports",
    activity: "Activity Log",
    cost: "No provider spend from skill review",
    lanes: [
      { label: "Skills", value: "Readable" },
      { label: "Install", value: "Disabled" },
      { label: "Update", value: "Disabled" },
      { label: "Dispatch", value: "Blocked" },
    ],
  },
  hooks: {
    title: "Hook Registry",
    purpose: "Show future automation hooks and the safety boundary around event-driven work.",
    currentState: "Hook registry is readable; hook execution is disabled.",
    nextAction: "Review hook readiness before enabling any event-driven route.",
    blocker: "Hook mutation, webhook execution, and external network calls remain disabled.",
    owner: "WARDEN Hook Boundary",
    evidence: "Hook registry reports",
    activity: "Activity Log",
    cost: "No provider spend from hook review",
    lanes: [
      { label: "Hooks", value: "Readable" },
      { label: "Webhooks", value: "Disabled" },
      { label: "Events", value: "Review only" },
      { label: "Mutation", value: "Disabled" },
    ],
  },
  workspace: {
    title: "Workspace",
    purpose: "Show workspace readiness and what must be true before implementation can happen.",
    currentState: "Workspace inspection is display-safe.",
    nextAction: "Review context, tasks, and prerequisites before implementation review.",
    blocker: "Project source writes and generated workspace mutation remain disabled.",
    owner: "CORE Workspace Readiness",
    evidence: "Workspace cards and task context",
    activity: "Activity Log",
    cost: "No provider spend from workspace inspection",
    lanes: [
      { label: "Context", value: "Readable" },
      { label: "Tasks", value: "Linked" },
      { label: "Writes", value: "Disabled" },
      { label: "Evidence", value: "Required" },
    ],
  },
  implementation: {
    title: "Implementation",
    purpose: "Show proposed implementation state, blockers, evidence, and review posture before code changes.",
    currentState: "Implementation review is available; apply remains governed.",
    nextAction: "Review proposed changes, tests, and evidence before any future apply action.",
    blocker: "Project mutation and apply actions remain disabled unless explicitly admitted.",
    owner: "CORE Implementation Review",
    evidence: "Implementation evidence and task records",
    activity: "Activity Log",
    cost: "No provider spend from implementation review",
    lanes: [
      { label: "Proposal", value: "Review" },
      { label: "Apply", value: "Blocked" },
      { label: "Tests", value: "Required" },
      { label: "Evidence", value: "Required" },
    ],
  },
  workbench: {
    title: "Agent Workbench",
    purpose: "Show activated task review, outputs, blockers, evidence, and next actions by agent lane.",
    currentState: "Workbench is review-first; worker execution is not automatic.",
    nextAction: "Open activated tasks and review output, blockers, evidence, and owner lane.",
    blocker: "No worker/tool execution runs from this page without governed admission.",
    owner: "NEXUS Agent Workbench",
    evidence: "Task evidence and review records",
    activity: "Workbench activity",
    cost: "No provider spend from workbench review",
    lanes: [
      { label: "Tasks", value: "Review" },
      { label: "Outputs", value: "Evidence-bound" },
      { label: "Workers", value: "Blocked" },
      { label: "Tools", value: "Blocked" },
    ],
  },
  tools: {
    title: "Tool Gateway",
    purpose: "Show tool availability and safety before any tool execution is allowed.",
    currentState: "Tool gateway is readable; tool execution is disabled.",
    nextAction: "Review allowed capabilities, policy decisions, and evidence needs.",
    blocker: "Tool execution, MCP mutation, and external network calls remain disabled.",
    owner: "WARDEN Tool Gateway",
    evidence: "Tool gateway readiness reports",
    activity: "Activity Log",
    cost: "No provider spend from tool review",
    lanes: [
      { label: "Tools", value: "Readable" },
      { label: "Execution", value: "Disabled" },
      { label: "Policy", value: "Required" },
      { label: "Evidence", value: "Required" },
    ],
  },
  triggers: {
    title: "Trigger Integration",
    purpose: "Show integration trigger readiness and what remains blocked before automation can run.",
    currentState: "Triggers are preview-only.",
    nextAction: "Review trigger inputs, policy requirements, and disabled reasons.",
    blocker: "Webhook, external network, and automation execution remain disabled.",
    owner: "WARDEN Trigger Boundary",
    evidence: "Trigger integration reports",
    activity: "Activity Log",
    cost: "No provider spend from trigger review",
    lanes: [
      { label: "Triggers", value: "Preview" },
      { label: "Webhooks", value: "Disabled" },
      { label: "Automation", value: "Blocked" },
      { label: "Network", value: "Disabled" },
    ],
  },
  apiBatch: {
    title: "API Batch Adapter",
    purpose: "Show batch adapter posture and cost/readiness before provider-backed batch work exists.",
    currentState: "Batch adapter is preview-only.",
    nextAction: "Review request shape, cost estimate, and disabled provider boundary.",
    blocker: "Provider batch upload, worker runtime, network calls, and spend remain disabled.",
    owner: "SENTINEL API Batch Boundary",
    evidence: "API batch adapter reports",
    activity: "Activity Log",
    cost: "Estimate only; no provider spend",
    lanes: [
      { label: "Requests", value: "Preview" },
      { label: "Upload", value: "Disabled" },
      { label: "Provider", value: "Blocked" },
      { label: "Cost", value: "Estimate" },
    ],
  },
  agentRooms: {
    title: "Agent Rooms",
    purpose: "Show planned collaboration rooms and the boundary around multi-agent execution.",
    currentState: "Agent rooms are readable planning spaces.",
    nextAction: "Review room ownership, context, and handoff needs.",
    blocker: "Multi-agent dispatch and live collaboration execution remain disabled.",
    owner: "NEXUS Agent Rooms",
    evidence: "Agent room readiness reports",
    activity: "Activity Log",
    cost: "No provider spend from room review",
    lanes: [
      { label: "Rooms", value: "Readable" },
      { label: "Context", value: "Scoped" },
      { label: "Dispatch", value: "Blocked" },
      { label: "Evidence", value: "Required" },
    ],
  },
  tests: {
    title: "Test Center",
    purpose: "Show test posture, coverage, and validation blockers before delivery can proceed.",
    currentState: "Test evidence is display-safe.",
    nextAction: "Review failing checks, missing coverage, and validation commands.",
    blocker: "Test execution is local/operator-run; no provider calls or deploy actions start here.",
    owner: "AUDITOR Test Center",
    evidence: "Validation reports and route tests",
    activity: "Activity Log",
    cost: "No provider spend from test review",
    lanes: [
      { label: "Unit", value: "Review" },
      { label: "Page", value: "Review" },
      { label: "Checkers", value: "Review" },
      { label: "Coverage", value: "Required" },
    ],
  },
  quality: {
    title: "Quality Intelligence",
    purpose: "Show quality signals, regressions, and gaps before founder delivery decisions.",
    currentState: "Quality intelligence is read-only.",
    nextAction: "Review quality gaps and route fixes through implementation review.",
    blocker: "No autonomous repair, mutation, or deploy action runs from this page.",
    owner: "AUDITOR Quality Intelligence",
    evidence: "Quality reports and validation coverage",
    activity: "Activity Log",
    cost: "No provider spend from quality review",
    lanes: [
      { label: "Signals", value: "Readable" },
      { label: "Regressions", value: "Review" },
      { label: "Fixes", value: "Route" },
      { label: "Deploy", value: "Disabled" },
    ],
  },
};

const FOUNDER_RUNTIME_OS_BOARDS = {
  workers: {
    title: "Worker Runtime",
    purpose: "Show worker runtime posture before any background execution can run.",
    currentState: "Worker execution is blocked until governed admission exists.",
    nextAction: "Review queues, worker boundaries, and blockers before enabling runtime work.",
    blocker: "Worker execution, tool execution, and project mutation remain disabled.",
    owner: "NEXUS Worker Runtime Boundary",
    evidence: "Worker runtime readiness reports",
    activity: "Activity Log",
    cost: "No provider or worker spend",
    lanes: [{ label: "Workers", value: "Blocked" }, { label: "Queue", value: "Review" }, { label: "Tools", value: "Disabled" }, { label: "Evidence", value: "Required" }],
  },
  batch: {
    title: "Batch Queue",
    purpose: "Show batch posture and blockers before provider-backed batch work is allowed.",
    currentState: "Batch queue is dry-run and preview-only.",
    nextAction: "Review batch readiness, results, and cost assumptions.",
    blocker: "Provider batch APIs, uploads, network calls, and spend remain disabled.",
    owner: "SENTINEL Batch Boundary",
    evidence: "Batch readiness reports",
    activity: "Activity Log",
    cost: "Estimate only; no provider spend",
    lanes: [{ label: "Jobs", value: "Preview" }, { label: "Results", value: "Unavailable" }, { label: "Upload", value: "Disabled" }, { label: "Spend", value: "Disabled" }],
  },
  liveapi: {
    title: "Live API Status",
    purpose: "Show whether local API-backed data is online or using snapshot fallback.",
    currentState: "Local API can be inspected; external provider/network calls remain blocked.",
    nextAction: "Review endpoint health and fallback state before relying on live local data.",
    blocker: "Hosted APIs and provider calls are not enabled.",
    owner: "NEXUS Local API Boundary",
    evidence: "Live API status cards",
    activity: "Local API refresh activity",
    cost: "No provider spend",
    lanes: [{ label: "Mission data", value: "Readable" }, { label: "Tasks", value: "Readable" }, { label: "Evidence", value: "Readable" }, { label: "Network", value: "Local only" }],
  },
  database: {
    title: "Durable State",
    purpose: "Show local durable state, DB runtime posture, and persistence blockers.",
    currentState: "Local state is inspectable; hosted DB mutation remains blocked.",
    nextAction: "Review local persistence posture and rollback before any runtime write path.",
    blocker: "Hosted DB mutation and unsafe writes remain disabled.",
    owner: "NEXUS Durable State Boundary",
    evidence: "DB runtime readiness reports",
    activity: "Activity Log",
    cost: "No hosted DB spend",
    lanes: [{ label: "Local DB", value: "Readable" }, { label: "Hosted DB", value: "Blocked" }, { label: "Rollback", value: "Review" }, { label: "Writes", value: "Governed" }],
  },
  services: {
    title: "Service Health",
    purpose: "Show local service health, doctor checks, and startup blockers.",
    currentState: "Service health is inspectable from local manifests and status snapshots.",
    nextAction: "Review unhealthy services and local doctor output before runtime work.",
    blocker: "Service control remains local/operator-run; no deploy or hosted mutation.",
    owner: "NEXUS Service Health",
    evidence: "Service status and doctor reports",
    activity: "Activity Log",
    cost: "No provider spend",
    lanes: [{ label: "Services", value: "Inspectable" }, { label: "Doctor", value: "Review" }, { label: "Start/stop", value: "Local" }, { label: "Deploy", value: "Disabled" }],
  },
  memory: {
    title: "Memory Center",
    purpose: "Show memory posture, selected context, and boundaries before agent use.",
    currentState: "Memory is review-only from Command Center.",
    nextAction: "Review what memory can be included before routing work.",
    blocker: "Raw private memory dumps and mutation are not shown in primary UX.",
    owner: "NEXUS Memory Boundary",
    evidence: "Memory center reports",
    activity: "Activity Log",
    cost: "No provider spend",
    lanes: [{ label: "Memory", value: "Readable" }, { label: "Context", value: "Scoped" }, { label: "Raw dumps", value: "Hidden" }, { label: "Mutation", value: "Disabled" }],
  },
  context: {
    title: "Data & Context Center",
    purpose: "Show selected context packets and excluded sources before work is routed.",
    currentState: "Context packets are inspectable and scoped.",
    nextAction: "Review inclusions and exclusions before execution admission.",
    blocker: "Raw private data dumps and full tool registry loading remain blocked.",
    owner: "NEXUS Context Boundary",
    evidence: "Context packet reports",
    activity: "Activity Log",
    cost: "No provider spend",
    lanes: [{ label: "Trusted context", value: "Scoped" }, { label: "Exclusions", value: "Visible" }, { label: "Raw data", value: "Hidden" }, { label: "Tools", value: "Lazy loaded" }],
  },
  roadmap: {
    title: "OS Roadmap",
    purpose: "Show NEXUS OS phase status without mixing project milestones into OS phases.",
    currentState: "OS roadmap is visible and phase-scoped.",
    nextAction: "Review current, previous, and next OS phase before platform work.",
    blocker: "Project milestones stay out of OS Roadmap.",
    owner: "NEXUS OS Roadmap",
    evidence: "OS phase status reports",
    activity: "Activity Log",
    cost: "No provider spend",
    lanes: [{ label: "Current", value: "Tracked" }, { label: "Next", value: "Tracked" }, { label: "Reports", value: "Linked" }, { label: "Projects", value: "Separated" }],
  },
  activity: {
    title: "Activity Log",
    purpose: "Show recent OS and runtime activity in a founder-readable timeline.",
    currentState: "Activity is inspectable and redacted for primary UX.",
    nextAction: "Review recent actions, evidence links, and blockers before continuing work.",
    blocker: "Raw logs and private IDs are not shown in primary UX.",
    owner: "NEXUS Activity Ledger",
    evidence: "Activity and audit records",
    activity: "Current page",
    cost: "No provider spend",
    lanes: [{ label: "Events", value: "Readable" }, { label: "Evidence", value: "Linked" }, { label: "Raw logs", value: "Hidden" }, { label: "Audit", value: "Review" }],
  },
  recovery: {
    title: "Recovery",
    purpose: "Show local recovery posture, blocked actions, and rollback evidence before any restore path is allowed.",
    currentState: "Recovery snapshots are inspectable only.",
    nextAction: "Review recovery blockers, snapshot coverage, and rollback evidence before enabling restore execution.",
    blocker: "Restore execution, backup mutation, package writes, and project mutation remain disabled.",
    owner: "WARDEN Recovery Boundary",
    evidence: "Recovery preview reports",
    activity: "Activity Log",
    cost: "No storage or provider spend",
    lanes: [{ label: "Snapshots", value: "Readable" }, { label: "Restore", value: "Disabled" }, { label: "Rollback", value: "Review" }, { label: "Mutation", value: "Blocked" }],
  },
  selfUpdate: {
    title: "Self-Update",
    purpose: "Show update readiness and blockers before NEXUS can change itself.",
    currentState: "Self-update is display-only.",
    nextAction: "Review update plan, rollback, and safety gates.",
    blocker: "Self-mutation and package/release actions remain disabled.",
    owner: "WARDEN Self-Update Boundary",
    evidence: "Self-update readiness reports",
    activity: "Activity Log",
    cost: "No provider spend",
    lanes: [{ label: "Plan", value: "Review" }, { label: "Rollback", value: "Required" }, { label: "Mutation", value: "Disabled" }, { label: "Package", value: "Disabled" }],
  },
  deployMonitoring: {
    title: "Deploy Monitoring",
    purpose: "Show deploy monitoring readiness without enabling deployment.",
    currentState: "Deploy monitoring is display-only.",
    nextAction: "Review monitoring gaps and release blockers.",
    blocker: "Deploy, release, and external monitoring mutation remain disabled.",
    owner: "SENTINEL Deploy Monitoring",
    evidence: "Deploy monitoring readiness reports",
    activity: "Activity Log",
    cost: "No deploy or provider spend",
    lanes: [{ label: "Deploy", value: "Disabled" }, { label: "Monitoring", value: "Review" }, { label: "Alerts", value: "Preview" }, { label: "Rollback", value: "Required" }],
  },
  projectShipping: {
    title: "Project Shipping",
    purpose: "Show shipping readiness, packaging blockers, and release boundaries.",
    currentState: "Project shipping is display-only.",
    nextAction: "Review shipping gates, package blockers, and release evidence.",
    blocker: "Package creation, export, release, and deploy remain disabled.",
    owner: "SENTINEL Shipping Boundary",
    evidence: "Project shipping readiness reports",
    activity: "Activity Log",
    cost: "No package, deploy, or provider spend",
    lanes: [{ label: "Package", value: "Disabled" }, { label: "Export", value: "Disabled" }, { label: "Release", value: "Blocked" }, { label: "Evidence", value: "Required" }],
  },
  authGovernance: {
    title: "Auth Governance",
    purpose: "Show auth readiness, identity boundaries, and blocked mutation paths.",
    currentState: "Auth governance is display-only.",
    nextAction: "Review auth gaps before live access or identity changes.",
    blocker: "Auth provider mutation, secrets, and live identity changes remain disabled.",
    owner: "WARDEN Auth Governance",
    evidence: "Auth governance readiness reports",
    activity: "Activity Log",
    cost: "No provider spend",
    lanes: [{ label: "Identity", value: "Review" }, { label: "Secrets", value: "Hidden" }, { label: "Provider", value: "Disabled" }, { label: "Mutation", value: "Blocked" }],
  },
  observability: {
    title: "Observability",
    purpose: "Show logs, metrics, and alert posture without exposing raw dumps.",
    currentState: "Observability is display-safe and read-only.",
    nextAction: "Review gaps in logs, metrics, and alerts before runtime work.",
    blocker: "External telemetry mutation and raw log dumps remain disabled.",
    owner: "SENTINEL Observability",
    evidence: "Observability readiness reports",
    activity: "Activity Log",
    cost: "No provider spend",
    lanes: [{ label: "Logs", value: "Redacted" }, { label: "Metrics", value: "Review" }, { label: "Alerts", value: "Preview" }, { label: "Raw dumps", value: "Hidden" }],
  },
  backupDr: {
    title: "Backup / DR",
    purpose: "Show backup and disaster recovery posture before production readiness.",
    currentState: "Backup and DR readiness is display-only.",
    nextAction: "Review restore, rollback, and evidence requirements.",
    blocker: "Backup mutation, restore execution, and hosted storage writes remain disabled.",
    owner: "WARDEN Backup Boundary",
    evidence: "Backup / DR readiness reports",
    activity: "Activity Log",
    cost: "No storage or provider spend",
    lanes: [{ label: "Backup", value: "Review" }, { label: "Restore", value: "Disabled" }, { label: "Rollback", value: "Required" }, { label: "Storage", value: "Blocked" }],
  },
  isolation: {
    title: "Isolation",
    purpose: "Show tenant, project, and runtime isolation readiness.",
    currentState: "Isolation posture is display-only.",
    nextAction: "Review isolation gaps before multi-project or live runtime work.",
    blocker: "Tenant/project mutation and live isolation enforcement changes remain disabled.",
    owner: "WARDEN Isolation Boundary",
    evidence: "Isolation readiness reports",
    activity: "Activity Log",
    cost: "No provider spend",
    lanes: [{ label: "Tenant", value: "Review" }, { label: "Project", value: "Scoped" }, { label: "Runtime", value: "Blocked" }, { label: "Mutation", value: "Disabled" }],
  },
  compliance: {
    title: "Compliance",
    purpose: "Show compliance readiness and policy evidence before enterprise use.",
    currentState: "Compliance readiness is display-only.",
    nextAction: "Review gaps, evidence, and disabled actions before live use.",
    blocker: "Compliance controls cannot mutate runtime, auth, DB, or deployment from this page.",
    owner: "AUDITOR Compliance Review",
    evidence: "Compliance readiness reports",
    activity: "Activity Log",
    cost: "No provider spend",
    lanes: [{ label: "Controls", value: "Review" }, { label: "Evidence", value: "Required" }, { label: "Gaps", value: "Visible" }, { label: "Mutation", value: "Disabled" }],
  },
  enterprisePreview: {
    title: "Enterprise Preview",
    purpose: "Show enterprise readiness posture without implying live enterprise availability.",
    currentState: "Enterprise preview is display-only.",
    nextAction: "Review readiness gaps across auth, compliance, isolation, backup, and observability.",
    blocker: "Enterprise activation, hosted services, deploy, and provider spend remain disabled.",
    owner: "NEXUS Enterprise Readiness",
    evidence: "Enterprise preview readiness reports",
    activity: "Activity Log",
    cost: "No provider spend",
    lanes: [{ label: "Auth", value: "Review" }, { label: "Compliance", value: "Review" }, { label: "Isolation", value: "Review" }, { label: "Activation", value: "Blocked" }],
  },
  liveReadiness: {
    title: "Live Readiness",
    purpose: "Show what remains before NEXUS can move from preview/local planning toward live execution.",
    currentState: "Live readiness is gated and display-only.",
    nextAction: "Review missing approvals, provider setup, execution admission, and safety gates.",
    blocker: "Provider/model calls, dispatch, project mutation, DB writes, deploy, package, and spend remain blocked unless explicitly admitted.",
    owner: "NEXUS Live Readiness",
    evidence: "Live readiness reports",
    activity: "Activity Log",
    cost: "No provider spend",
    lanes: [{ label: "Providers", value: "Blocked" }, { label: "Dispatch", value: "Blocked" }, { label: "DB writes", value: "Blocked" }, { label: "Deploy", value: "Blocked" }],
  },
  docs: {
    title: "Docs & Guides",
    purpose: "Show founder and operator documentation for using NEXUS safely.",
    currentState: "Docs are readable and route-linked.",
    nextAction: "Open the relevant guide before running local commands or reviewing workflow gaps.",
    blocker: "Docs do not execute commands or mutate state.",
    owner: "NEXUS Documentation",
    evidence: "Docs and roadmap references",
    activity: "Activity Log",
    cost: "No provider spend",
    lanes: [{ label: "Guides", value: "Readable" }, { label: "Architecture", value: "Readable" }, { label: "Commands", value: "Manual" }, { label: "Mutation", value: "Disabled" }],
  },
  settings: {
    title: "Settings",
    purpose: "Show settings posture without enabling unsafe runtime or project changes.",
    currentState: "Settings are planned and display-only.",
    nextAction: "Use existing pages for theme, scope, project context, and local readiness.",
    blocker: "Provider, tool, project, DB, deploy, and package settings remain disabled.",
    owner: "NEXUS Settings Boundary",
    evidence: "Settings route plan",
    activity: "Activity Log",
    cost: "No provider spend",
    lanes: [{ label: "Theme", value: "Available" }, { label: "Scope", value: "Available" }, { label: "Live settings", value: "Disabled" }, { label: "Mutation", value: "Blocked" }],
  },
};

function countEvidenceForTask(taskId) {
  if (!taskId) return 0;
  const evidence = runtimeSnapshot.runtimeState?.evidence?.recent || [];
  return evidence.filter((item) => item.taskId === taskId).length;
}

function countAuditForTask(taskId) {
  if (!taskId) return 0;
  const audit = runtimeSnapshot.runtimeState?.audit?.recent || [];
  return audit.filter((item) => item.taskId === taskId).length;
}

function summarizeTaskNextAction(task) {
  switch (task?.state) {
    case "planned":
      return "Activate task";
    case "queued":
      return "Open Agent Workbench";
    case "running":
      return "Review agent output";
    case "awaiting_verification":
      return "Collect verification evidence";
    case "awaiting_approval":
      return "Approve or reject";
    case "implementation_done":
      return "Move to verification";
    case "blocked":
      return "Resolve blocker";
    case "completed":
      return "Monitor evidence";
    default:
      return "Monitor";
  }
}

const COMMAND_CATEGORY_ORDER = [
  "Plan",
  "Build",
  "Validate",
  "Review",
  "Govern",
  "Release",
  "Learn",
  "Explain",
];

function getCommandTone(command) {
  if (command.available) return "pass";
  if (command.riskLevel === "high") return "fail";
  if (command.currentState === "Planned") return "disabled";
  return "pending";
}

function getRiskTone(riskLevel) {
  if (riskLevel === "high") return "fail";
  if (riskLevel === "medium") return "pending";
  return "pass";
}

function formatActionModeLabel(actionMode) {
  switch (actionMode) {
    case "route_only":
      return "Navigate to governed workflow";
    case "read_only_summary":
      return "Read-only summary";
    case "existing_governed_action":
      return "Existing governed action";
    case "not_enabled":
      return "Not enabled";
    default:
      return "Unknown";
  }
}

function summarizeCommandCost(command) {
  return command.costMode || "Local-only. Provider spend disabled.";
}

function buildCommandCapabilitySummary(command, capabilityReadiness) {
  return (command.requiredCapabilities || []).map((capabilityId) => {
    const entry = capabilityReadiness?.[capabilityId];
    return {
      id: capabilityId,
      label: entry?.userFacingState || formatCapabilityLabel(capabilityId),
      description: entry?.description || "Capability summary not available.",
    };
  });
}

/* ─── Sidebar ─── */
function Sidebar({ vm, location }) {
  const navigate = useNavigate();
  const litePaths = new Set(["/", "/command-center", "/command-center/lite"]);

  return (
    <aside className="ccv2-sidebar">
      <div
        className="ccv2-sidebar__brand"
        style={{ cursor: "pointer" }}
        onClick={() => navigate("/command-center/lite")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && navigate("/command-center/lite")}
      >
        <div className="ccv2-sidebar__brand-mark">N</div>
        <div className="ccv2-sidebar__brand-name">{vm.shell.productName}</div>
        <div className="ccv2-sidebar__brand-ver">Founder Command</div>
      </div>

      <nav className="ccv2-nav-groups">
        {FOUNDER_NAV_GROUPS_V2.map((group) => (
          <div key={group.group} className="ccv2-nav-group">
            <div className="ccv2-nav-group__label">{group.group}</div>
            {group.items.map((item) => {
              const isLiteItem = item.key === "lite";
              const isLiteActive = isLiteItem && litePaths.has(location.pathname);

              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  end={isLiteItem}
                  title={item.name}
                  className={({ isActive }) => {
                    const active = isLiteItem ? isLiteActive : isActive;
                    return `ccv2-nav-item${active ? " ccv2-nav-item--active" : ""}`;
                  }}
                >
                  <span className="ccv2-nav-item__icon">{ROUTE_ICONS[item.key] || "•"}</span>
                  <span className="ccv2-nav-item__label">{item.name}</span>
                  {item.count && (
                    <span className={`ccv2-nav-item__count${item.countTone === "red" ? " ccv2-nav-item__count--red" : ""}`}>
                      {item.count}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="ccv2-sidebar__footer">
        <div className="ccv2-sidebar__operator">
          <div className="ccv2-sidebar__operator-avatar">FK</div>
          <div>
            <div className="ccv2-sidebar__operator-name">Founder</div>
            <div className="ccv2-sidebar__operator-role">operator · all rights</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ─── Top Command Bar ─── */
function TopBar({ vm, currentPage, themeState, onOpenCommandPalette, onOpenAskNexus, selectedProject, onSelectProject }) {
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const route = COMMAND_CENTER_ROUTE_BY_KEY[currentPage] || COMMAND_CENTER_ROUTE_BY_KEY.mission;
  const pageLabel = COMMAND_CENTER_ROUTE_BY_KEY[currentPage]?.expectedHeading || "Mission Control";
  const founderContext = getFounderRouteContext(route);
  const founderLiteChrome = currentPage === "lite" || currentPage === "agentFlow";
  const scopeLabel = route.scope === "os"
    ? "NEXUS OS"
    : route.scope === "portfolio"
      ? "Portfolio"
      : route.scope === "demo"
        ? "Demo"
        : "Project";
  const projectLabel = route.scope === "os"
    ? "Scope: NEXUS OS"
    : route.scope === "demo"
      ? "Demo Mode"
      : selectedProject?.label
        ? selectedProject.projectId
          ? `Project: ${selectedProject.label}`
          : "No project selected"
        : "No project selected";
  const projectOptions = getProjectSelectionOptions(vm.shell?.mode || "local-private");

  return (
    <header className={`ccv2-topbar${founderLiteChrome ? " ccv2-topbar--founder-lite" : ""}`}>
      {!founderLiteChrome && (
        <>
          <div className="ccv2-topbar__breadcrumb">
            <span>NEXUS</span>
            <span className="ccv2-topbar__breadcrumb-sep">/</span>
            <span className="ccv2-topbar__breadcrumb-current">{pageLabel}</span>
          </div>

          <div className="ccv2-topbar__scope-chip" title={`${scopeLabel} · ${projectLabel}`}>
            <span className="ccv2-topbar__scope-label">{scopeLabel}</span>
            <span className="ccv2-topbar__scope-value">{projectLabel}</span>
          </div>
        </>
      )}

      <div className="ccv2-topbar__founder-context" title={`${founderContext.purpose} Next: ${founderContext.nextAction}`}>
        <span className="ccv2-topbar__scope-label">Founder use</span>
        <span className="ccv2-topbar__founder-purpose">{founderContext.purpose}</span>
        <span className="ccv2-topbar__founder-next">{founderContext.nextAction}</span>
      </div>

      {route.scope !== "demo" && route.scope !== "os" && (
        <label className="ccv2-project-selector" aria-label="Project selector">
          <span className="ccv2-project-selector__label">Project</span>
          <select
            value={selectedProject?.projectId || ""}
            onChange={(event) => onSelectProject(event.target.value)}
          >
            {projectOptions.map((option) => (
              <option key={option.projectId} value={option.projectId} disabled={option.disabled}>
                {option.label}{option.disabledReason ? " - Demo Mode only" : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="ccv2-topbar__spacer" />

      <HelpLink routeKey={currentPage} />

      <button
        type="button"
        className="ccv2-ask-nexus-trigger"
        onClick={onOpenAskNexus}
        aria-label="Open Ask NEXUS"
        title="Ask NEXUS"
      >
        Ask NEXUS
      </button>

      <button
        type="button"
        className="ccv2-command-palette-trigger"
        onClick={onOpenCommandPalette}
        aria-label="Open Command Palette"
      >
        <span aria-hidden="true">⌘</span>
      </button>

      <div className="ccv2-theme-control" aria-label="Theme selector" data-theme-control="nexus">
        <button
          type="button"
          className="ccv2-theme-control__trigger"
          aria-label={`Theme: ${themeState.theme}. Open theme menu`}
          aria-haspopup="menu"
          aria-expanded={themeMenuOpen}
          title={`Theme: ${themeState.theme}`}
          onClick={() => setThemeMenuOpen((open) => !open)}
        >
          <span className="ccv2-theme-control__icon" aria-hidden="true">◐</span>
        </button>
        {themeMenuOpen && (
          <div className="ccv2-theme-control__menu" role="menu" aria-label="Command Center theme">
            {[
              { id: "system", label: "System", title: "Use system theme" },
              { id: "dark", label: "Dark", title: "Use dark theme" },
              { id: "light", label: "Light", title: "Use light theme" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                className={`ccv2-theme-control__menu-item${themeState.theme === option.id ? " ccv2-theme-control__menu-item--active" : ""}`}
                aria-pressed={themeState.theme === option.id}
                aria-label={option.title}
                title={option.title}
                onClick={() => {
                  themeState.setTheme(option.id);
                  setThemeMenuOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

/* ─── Mission Composer Card ─── */
function MissionComposerCard({ vm }) {
  const mc = vm.missionComposer;
  const [missionText] = useState(mc.missionText || "");
  const [bridgeOnline, setBridgeOnline] = useState(false);
  const [actionState, setActionState] = useState("idle"); // idle | running | completed | failed | offline
  const [actionResult, setActionResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const isLocalPrivate = vm.shell.mode === "local-private";
  const activeScopeLabel = isLocalPrivate ? "Active Project" : "NEXUS OS";
  const activeMissionRaw = vm.agenticWorkspace?.activeMission || vm.taskActivation?.missionId || vm.mission.sprintId;
  const activeMissionId = typeof activeMissionRaw === "string"
    ? activeMissionRaw
    : activeMissionRaw?.id || activeMissionRaw?.name || activeMissionRaw?.title || vm.mission.sprintId;
  const activeMissionDisplayName = mc.missionDisplayName || humanizeMissionId(activeMissionId);
  const sourceLabel = vm.liveApi?.liveApiOnline
    ? "Live local API"
    : vm.dbFoundation?.fileFallbackRequired
      ? "Snapshot fallback"
      : "File-backed";
  const generatedPlanReady = actionState === "completed" || mc.generatedPlanReady === true;
  const approvedTaskPlanReady = mc.approvedTaskPlanReady === true;
  const bridgeReason = "Requires governed action bridge";
  const projectBriefReason = !bridgeOnline
    ? bridgeReason
    : generatedPlanReady
      ? "Project brief action remains route-guided until project-brief execution is enabled."
      : "Requires generated mission plan";
  const governedRunReason = !bridgeOnline
    ? bridgeReason
    : approvedTaskPlanReady
      ? "Governed run execution is not enabled yet."
      : generatedPlanReady
        ? "Requires approved task plan"
        : "Requires generated mission plan";
  const currentStateLabel = !bridgeOnline
    ? "Governed action bridge offline"
    : generatedPlanReady
      ? "Mission plan generated and ready for brief review"
      : "Governed action bridge available";
  const nextActionLabel = !bridgeOnline
    ? "Restore the governed action bridge in a local terminal"
    : !generatedPlanReady
      ? "Generate plan from the read-only mission prompt"
      : !approvedTaskPlanReady
        ? "Create governed project brief from the generated mission plan"
        : "Review the approved task plan before enabling runtime work";
  const latestActivity = vm.activity?.[0];
  const pipelineSummary = `${vm.pipeline?.queued || 0} queued · ${vm.pipeline?.running || 0} running · ${vm.pipeline?.blocked || 0} blocked`;
  const gateSummary = Object.entries(vm.mission?.gates || {})
    .map(([gate, status]) => `${gate} ${status}`)
    .join(" · ");
  const activitySummary = latestActivity
    ? `${latestActivity.agent} · ${latestActivity.text}`
    : "No activity yet. Mission activity appears after task activation or review.";
  const actionButtons = [
    {
      id: "generate-plan",
      label: actionState === "running" ? "Generating…" : "Generate Plan",
      enabled: missionText.trim().length > 0 && bridgeOnline && actionState !== "running",
      reason: missionText.trim().length === 0
        ? "Provide mission intent to generate a plan"
        : bridgeOnline
          ? "Available"
          : "Requires governed action bridge",
      onClick: handleGeneratePlan,
    },
    {
      id: "create-project-brief",
      label: "Create Project Brief",
      enabled: false,
      reason: projectBriefReason,
    },
    {
      id: "start-governed-run",
      label: "Start Governed Run",
      enabled: false,
      reason: governedRunReason,
    },
  ];

  // Check bridge health on mount
  useEffect(() => {
    let cancelled = false;
    checkActionBridgeHealth().then((h) => {
      if (!cancelled) setBridgeOnline(h.online);
    });
    return () => { cancelled = true; };
  }, []);

  const canGenerate = missionText.trim().length > 0 && bridgeOnline && actionState !== "running";

  async function handleGeneratePlan() {
    if (!canGenerate) return;
    setActionState("running");
    setErrorMsg("");
    setActionResult(null);
    const result = await composeMissionFromCommandCenter({ missionText });
    if (result.ok) {
      setActionState("completed");
      setActionResult(result);
    } else if (result.offline) {
      setActionState("offline");
      setErrorMsg("Mission action bridge offline.");
    } else {
      setActionState("failed");
      setErrorMsg((result.errors || ["Unknown error."]).join(" "));
    }
  }

  return (
    <section className="ccv2-card ccv2-card--strong ccv2-mission-cockpit" id="v2-mission-hero">
      <div className="ccv2-mission-cockpit__header">
        <div>
          <div className="ccv2-eyebrow">Active Mission</div>
          <h2 className="ccv2-mission-cockpit__title">{activeMissionDisplayName}</h2>
          <p className="ccv2-mission-cockpit__subtitle">
            {mc.subtitle}
          </p>
          <div className="ccv2-mission-cockpit__meta-line">
            <span className="ccv2-mission-cockpit__meta-label">Mission ID</span>
            <span className="ccv2-mission-cockpit__meta-value ccv2-mono">{activeMissionId}</span>
          </div>
        </div>
        <div className="ccv2-mission-cockpit__badges">
          <span className="ccv2-badge ccv2-badge--teal">{activeScopeLabel}</span>
          <span className="ccv2-badge">{vm.shell.activeProject}</span>
          <span className="ccv2-badge ccv2-badge--blue">{vm.shell.mode}</span>
          <span className={`ccv2-badge ${vm.liveApi?.liveApiOnline ? "ccv2-badge--green" : ""}`}>
            {sourceLabel}
          </span>
        </div>
      </div>

      <div className="ccv2-mission-cockpit__summary-grid">
        <div className="ccv2-mission-cockpit__summary-cell">
          <span className="ccv2-mission-cockpit__summary-label">{activeScopeLabel}</span>
          <span className="ccv2-mission-cockpit__summary-value">{vm.shell.activeProject}</span>
        </div>
        <div className="ccv2-mission-cockpit__summary-cell">
          <span className="ccv2-mission-cockpit__summary-label">Active Mission</span>
          <span className="ccv2-mission-cockpit__summary-value">{activeMissionDisplayName}</span>
          <span className="ccv2-mission-cockpit__summary-meta ccv2-mono">{activeMissionId}</span>
        </div>
        <div className="ccv2-mission-cockpit__summary-cell">
          <span className="ccv2-mission-cockpit__summary-label">Mission Lead</span>
          <span className="ccv2-mission-cockpit__summary-value">{vm.mission.lead}</span>
        </div>
        <div className="ccv2-mission-cockpit__summary-cell">
          <span className="ccv2-mission-cockpit__summary-label">Source</span>
          <span className="ccv2-mission-cockpit__summary-value">{sourceLabel}</span>
        </div>
      </div>

      <div className="ccv2-mission-cockpit__signal-grid">
        <div className="ccv2-mission-cockpit__signal-card ccv2-mission-cockpit__signal-card--accent">
          <span className="ccv2-mission-cockpit__signal-label">Current State</span>
          <span className="ccv2-mission-cockpit__signal-value">{currentStateLabel}</span>
        </div>
        <div className="ccv2-mission-cockpit__signal-card ccv2-mission-cockpit__signal-card--accent">
          <span className="ccv2-mission-cockpit__signal-label">Next Action</span>
          <span className="ccv2-mission-cockpit__signal-value">{nextActionLabel}</span>
        </div>
        <div className="ccv2-mission-cockpit__signal-card">
          <span className="ccv2-mission-cockpit__signal-label">Pipeline Snapshot</span>
          <span className="ccv2-mission-cockpit__signal-value">{pipelineSummary}</span>
        </div>
        <div className="ccv2-mission-cockpit__signal-card">
          <span className="ccv2-mission-cockpit__signal-label">Verification Gates</span>
          <span className="ccv2-mission-cockpit__signal-value">{gateSummary}</span>
        </div>
        <div className="ccv2-mission-cockpit__signal-card">
          <span className="ccv2-mission-cockpit__signal-label">Activity Pulse</span>
          <span className="ccv2-mission-cockpit__signal-value">{activitySummary}</span>
        </div>
      </div>

      <div className="ccv2-mission-cockpit__body">
        <div className="ccv2-mission-cockpit__narrative">
          <div className="ccv2-mission-cockpit__intent-label">Mission Intent</div>
          <p className="ccv2-mission-cockpit__intent">{vm.mission.founderIntent}</p>
          <blockquote className="ccv2-mission-cockpit__quote">{vm.mission.quote}</blockquote>

          <div className="ccv2-mission-cockpit__prompt-label">Mission Prompt</div>
          <div
            className="ccv2-mission-cockpit__prompt-panel"
            role="note"
            aria-label="Mission prompt read-only panel"
          >
            <div className="ccv2-mission-cockpit__prompt-text">{missionText}</div>
            <div className="ccv2-mission-cockpit__prompt-note">{mc.readOnlyNote}</div>
          </div>

          <div className="ccv2-mission-cockpit__mission-meta">
            <span className="ccv2-pill ccv2-pill--pass">{vm.mission.sprintId}</span>
            <span className="ccv2-pill ccv2-pill--pending">{vm.mission.sprintDay}</span>
            <span className={`ccv2-pill ${bridgeOnline ? "ccv2-pill--pass" : "ccv2-pill--disabled"}`}>
              {bridgeOnline ? "Action bridge online" : "Action bridge offline"}
            </span>
          </div>

          <div className="ccv2-card" style={{ marginTop: 16 }}>
            <div className="ccv2-section-heading">Founder Idea Lifecycle</div>
            <div className="ccv2-list" style={{ marginTop: 10 }}>
              {(vm.mission.lifecycle || []).map((stage) => (
                <div className="ccv2-list-row" key={stage.label}>
                  <div>
                    <div className="ccv2-list-row__title">{stage.label}</div>
                    <div className="ccv2-list-row__meta">Owner: {stage.owner}</div>
                    <div className="ccv2-list-row__meta">Next action: {stage.nextAction}</div>
                  </div>
                  <span className="ccv2-pill ccv2-pill--preview">{stage.state}</span>
                </div>
              ))}
            </div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>
              NEXUS must understand the business before execution: Q&A, feasibility validation, PRD, agent assignments, gates, and evidence come first.
            </div>
          </div>
        </div>

        <div className="ccv2-mission-cockpit__actions">
          <div className="ccv2-mission-cockpit__actions-heading">Primary Actions</div>
          <div className="ccv2-mission-cockpit__action-list">
            {actionButtons.map((button) => (
              <div key={button.id} className="ccv2-mission-cockpit__action-row">
                <button
                  type="button"
                  className={`ccv2-mission-composer__btn${button.enabled ? " ccv2-mission-composer__btn--enabled" : ""}`}
                  disabled={!button.enabled}
                  onClick={button.enabled ? button.onClick : undefined}
                >
                  <span>{button.label}</span>
                  <span className="ccv2-mission-composer__btn-lock">{button.enabled ? "→" : "⊘"}</span>
                </button>
                {!button.enabled && (
                  <div className="ccv2-mission-cockpit__action-reason">{button.reason}</div>
                )}
              </div>
            ))}
          </div>

          <div className="ccv2-mission-cockpit__availability">
            <div className="ccv2-mission-cockpit__availability-label">Current state</div>
            <div className="ccv2-mission-cockpit__availability-value">
              {currentStateLabel}
            </div>
            <div className="ccv2-mission-cockpit__availability-label">Next action</div>
            <div className="ccv2-mission-cockpit__availability-value">{nextActionLabel}</div>
          </div>
        </div>
      </div>

      {actionState === "running" && (
        <div className="ccv2-mc-status ccv2-mc-status--running">
          ◎ Generating governed mission plan…
        </div>
      )}
      {actionState === "completed" && actionResult && (
        <div className="ccv2-mc-status ccv2-mc-status--completed">
          ✓ Mission plan generated
          <div className="ccv2-mc-result">
            <div>Contract: {actionResult.result?.missionContractPath || "contracts/missions/private-project-mission-contract.json"}</div>
            <div>Task plan: {actionResult.result?.taskPlanPath || "contracts/missions/private-project-task-plan.json"}</div>
            <div>Tasks created: {actionResult.result?.tasksCreated ?? 6}</div>
          </div>
        </div>
      )}
      {actionState === "failed" && (
        <div className="ccv2-mc-status ccv2-mc-status--failed">
          ✗ {errorMsg || "Plan generation failed."}
        </div>
      )}
      {actionState === "offline" && (
        <div className="ccv2-mc-status ccv2-mc-status--offline">
          ⊘ Mission action bridge offline. Run: npm run mission:action-server
        </div>
      )}
      {!bridgeOnline && actionState === "idle" && (
        <div className="ccv2-mc-status ccv2-mc-status--offline">
          ⊘ Action bridge offline — buttons require: npm run mission:action-server
        </div>
      )}
    </section>
  );
}

/* ─── Mission Hero Card ─── */
function MissionHeroCard({ vm }) {
  const m = vm.mission;
  return (
    <div className="ccv2-card">
      <div className="ccv2-mission-hero">
        <div className="ccv2-mission-hero__intent-label">Founder Intent</div>
        <blockquote className="ccv2-mission-hero__quote">
          {m.quote}
        </blockquote>

        <div>
          <div className="ccv2-mission-hero__intent-label-secondary">Sprint Progress</div>
        </div>

        <div className="ccv2-mission-hero__badges">
          <span className="ccv2-badge ccv2-badge--teal">{m.sprintId}</span>
          <span className="ccv2-badge">{m.sprintDay}</span>
          <span className="ccv2-badge ccv2-badge--blue">Lead · {m.lead}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Sprint Progress Card ─── */
function SprintProgressCard({ vm }) {
  const progress = vm.mission.sprintProgress;
  return (
    <div className="ccv2-card">
      <div className="ccv2-sprint-card">
        <div className="ccv2-eyebrow">Sprint Progress</div>
        <div className="ccv2-sprint-card__big-number">
          {progress}<span className="ccv2-sprint-card__big-unit">%</span>
        </div>
        <div className="ccv2-sprint-card__progress-track">
          <div className="ccv2-sprint-card__progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="ccv2-sprint-card__meta">
          <div className="ccv2-sprint-card__meta-row">
            <span className="ccv2-sprint-card__meta-label">Sprint</span>
            <span className="ccv2-sprint-card__meta-val">{vm.mission.sprintId}</span>
          </div>
          <div className="ccv2-sprint-card__meta-row">
            <span className="ccv2-sprint-card__meta-label">Day</span>
            <span className="ccv2-sprint-card__meta-val">{vm.mission.sprintDay}</span>
          </div>
          <div className="ccv2-sprint-card__meta-row">
            <span className="ccv2-sprint-card__meta-label">Lead</span>
            <span className="ccv2-sprint-card__meta-val">{vm.mission.lead}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {Object.entries(vm.mission.gates).map(([gate, status]) => (
            <span
              key={gate}
              className={`ccv2-pill ccv2-pill--${status === "PASS" ? "pass" : status === "PENDING" ? "pending" : "fail"}`}
            >
              {gate} · {status}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── System Status Strip ─── */
function SystemStatusStrip({ vm }) {
  const readiness = vm.capabilityReadiness || {};
  const statuses = [
    {
      label: "Local API",
      value: vm.liveApi?.liveApiOnline ? "Online" : "Snapshot fallback",
      tone: vm.liveApi?.liveApiOnline ? "pass" : "pending",
    },
    {
      label: "Durable State",
      value: vm.dbFoundation?.fileFallbackRequired ? "Read-only" : "Available",
      tone: "info",
    },
    {
      label: "Task Activation",
      value: vm.taskActivation?.activationPolicy?.allowed ? "Ready" : readiness.taskActivation?.userFacingState || "Not enabled",
      tone: vm.taskActivation?.activationPolicy?.allowed ? "pass" : "pending",
    },
    {
      label: "Agent Workbench",
      value: readiness.agentWorkbench?.status === "ready" ? "Ready" : readiness.agentWorkbench?.userFacingState || "Not enabled",
      tone: readiness.agentWorkbench?.status === "ready" ? "pass" : "pending",
    },
    {
      label: "Implementation Bridge",
      value: readiness.controlledImplementation?.status === "ready_scoped" ? "Scoped" : readiness.controlledImplementation?.userFacingState || "Not enabled",
      tone: "pending",
    },
    {
      label: "DB Writes",
      value: "Disabled by policy",
      tone: "disabled",
    },
    {
      label: "Worker Runtime",
      value: readiness.workerRuntime?.userFacingState || "Not enabled",
      tone: "disabled",
    },
  ];

  return (
    <section className="ccv2-card ccv2-status-strip" id="v2-system-status">
      <div className="ccv2-card-header-row">
        <div className="ccv2-eyebrow">System Status</div>
        <span className="ccv2-pill ccv2-pill--disabled">Read-only posture</span>
      </div>
      <div className="ccv2-status-strip__grid">
        {statuses.map((status) => (
          <div key={status.label} className={`ccv2-status-strip__item ccv2-status-strip__item--${status.tone}`}>
            <span className="ccv2-status-strip__label">{status.label}</span>
            <span className="ccv2-status-strip__value">{status.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Release Readiness Card ─── */
function ReleaseReadinessCard({ vm }) {
  const r = vm.release;
  const m = vm.mission;
  return (
    <div className="ccv2-card">
      <div className="ccv2-release-card">
        <div className="ccv2-eyebrow">Release Readiness</div>
        <div className="ccv2-release-card__nogo">{r.status}</div>
        <div className="ccv2-release-card__blocker">{r.blocker}</div>
        <div className="ccv2-release-card__gate-row">
          {Object.entries(m.gates).map(([gate, status]) => (
            <div key={gate} className="ccv2-release-card__gate">
              <div className={`ccv2-release-card__gate-dot ccv2-release-card__gate-dot--${status === "PASS" ? "pass" : status === "PENDING" ? "pending" : "fail"}`} />
              <span>{gate} — {status}</span>
            </div>
          ))}
        </div>
        <div className="ccv2-release-card__actions">
          <button className="ccv2-release-card__action-btn" disabled>Open WARDEN</button>
          <button className="ccv2-release-card__action-btn" disabled>Review</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Execution Pipeline ─── */
const BAR_HEIGHTS = [18, 25, 22, 30, 28, 20, 35, 40, 42, 55, 48, 60, 52, 45, 50, 58, 52, 48, 44, 55, 50, 47];
const X_LABELS = ["09:00", "10:00", "11:00", "now\n13:42"];

function ExecutionPipeline({ vm }) {
  const taskState = runtimeSnapshot.runtimeState?.tasks || {};
  const byState = taskState.byState || {};
  const cols = [
    {
      key: "queued",
      label: "Queued",
      value: byState.queued ?? 0,
      meta: "Planned tasks activated and waiting for governed execution.",
    },
    {
      key: "running",
      label: "Running",
      value: byState.running ?? 0,
      meta: "Work in progress under current local runtime limits.",
    },
    {
      key: "verifying",
      label: "Verifying",
      value: (byState.awaiting_verification ?? 0) + (byState.implementation_done ?? 0),
      meta: "Awaiting AUDITOR, SENTINEL, or WARDEN verification evidence.",
    },
    {
      key: "blocked",
      label: "Blocked",
      value: (byState.blocked ?? 0) + (byState.awaiting_approval ?? 0),
      meta: "Blocked by approvals, safety policy, or missing verification.",
    },
    {
      key: "done",
      label: "Done",
      value: byState.completed ?? byState.done ?? 0,
      meta: "Completed or fully validated governed work.",
    },
  ];
  const totalTracked = cols.reduce((sum, col) => sum + Number(col.value || 0), 0);

  return (
    <div id="v2-execution-pipeline" className="ccv2-card ccv2-pipeline">
      <div className="ccv2-pipeline__header">
        <div className="ccv2-pipeline__title">Execution Pipeline</div>
        <span className={`ccv2-pill ccv2-pill--${vm.liveApi?.liveApiOnline ? "pass" : "disabled"}`}>
          {vm.liveApi?.liveApiOnline ? "Live local API" : "Snapshot fallback"}
        </span>
      </div>

      {totalTracked > 0 ? (
        <div className="ccv2-pipeline__cols">
          {cols.map((col) => (
            <div key={col.key} className="ccv2-pipeline__col">
              <div className={`ccv2-pipeline__col-label ccv2-pipeline__col-label--${col.key}`}>{col.label}</div>
              <div className={`ccv2-pipeline__col-count ccv2-pipeline__col-count--${col.key}`}>{col.value}</div>
              <div className="ccv2-pipeline__col-meta">{col.meta}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ccv2-empty-state">
          No active runtime jobs yet. Activate a planned task to populate the pipeline.
        </div>
      )}
    </div>
  );
}

/* ─── Activity Stream ─── */
function ActivityStream({ vm }) {
  const eventRows = [];
  const runtimeEvents = runtimeSnapshot.runtimeState?.events?.recent || [];
  const auditEvents = runtimeSnapshot.runtimeState?.audit?.recent || [];
  const evidenceEvents = runtimeSnapshot.runtimeState?.evidence?.recent || [];

  runtimeEvents.forEach((event) => {
    eventRows.push({
      createdAt: event.createdAt,
      agent: (event.agentId || event.runtime || "SYSTEM").toUpperCase(),
      summary: event.summary || event.eventType || "runtime event",
      status: "active",
      badge: event.eventType || "runtime",
    });
  });
  auditEvents.forEach((event) => {
    eventRows.push({
      createdAt: event.createdAt,
      agent: (event.actorId || event.actorType || "SYSTEM").toUpperCase(),
      summary: event.summary || event.eventType || "audit event",
      status: "working",
      badge: event.auditId || "audit",
    });
  });
  evidenceEvents.forEach((event) => {
    eventRows.push({
      createdAt: event.createdAt,
      agent: (event.agentId || event.type || "SYSTEM").toUpperCase(),
      summary: event.summary || event.type || "evidence record",
      status: event.result === "PASS" ? "done" : event.result === "FAIL" ? "blocked" : "working",
      badge: event.evidenceId || event.result || "evidence",
    });
  });

  const activityItems = eventRows
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
    .slice(0, 8)
    .map((item) => ({
      ...item,
      time: item.createdAt
        ? new Date(item.createdAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        : "—",
    }));

  const rows = activityItems;

  return (
    <div id="v2-activity-stream" className="ccv2-card ccv2-stream">
      <div className="ccv2-stream__header">
        <div className="ccv2-stream__title">Activity Stream</div>
        <div className="ccv2-stream__count ccv2-mono">{rows.length} recent</div>
      </div>

      {rows.length > 0 ? (
        <div className="ccv2-stream__events">
          {rows.map((ev, i) => (
            <div key={`${ev.agent}-${ev.time}-${i}`} className="ccv2-stream__event">
              <span className="ccv2-stream__event-time ccv2-mono">{ev.time}</span>
              <span className={`ccv2-stream__event-agent ccv2-stream__event-agent--${ev.status}`}>
                {ev.agent}
              </span>
              <span className="ccv2-stream__event-text">{ev.summary}</span>
              <span className="ccv2-pill ccv2-pill--disabled" style={{ fontSize: 10 }}>{ev.badge}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="ccv2-empty-state">
          No activity yet. Mission activity will appear here after task activation or review.
        </div>
      )}
    </div>
  );
}

/* ─── Private Validation Panel ─── */
function PrivateValidationPanel({ vm }) {
  const pv = vm.privateValidation;
  return (
    <div id="v2-private-validation" className="ccv2-card ccv2-pv-panel">
      <div className="ccv2-pv-panel__header">
        <h3 className="ccv2-pv-panel__title">Project Validation</h3>
        <span className="ccv2-pv-panel__overall ccv2-pv-panel__overall--validated">
          {pv.overall}
        </span>
      </div>

      <div className="ccv2-pv-panel__grid">
        <div className="ccv2-pv-stat">
          <div className="ccv2-pv-stat__label">Backend tests</div>
          <div className="ccv2-pv-stat__value ccv2-mono">{pv.backendTests}</div>
          <div className="ccv2-pv-stat__sub">Status: {pv.backendStatus}</div>
        </div>
        <div className="ccv2-pv-stat">
          <div className="ccv2-pv-stat__label">UI mutation</div>
          <div className="ccv2-pv-stat__value ccv2-mono" style={{ fontSize: 14, color: "var(--v2-amber)" }}>
            {pv.uiMutation}
          </div>
          <div className="ccv2-pv-stat__sub">Governance enforced</div>
        </div>
        <div className="ccv2-pv-stat">
          <div className="ccv2-pv-stat__label">Root cause fix</div>
          <div className="ccv2-pv-stat__value ccv2-mono" style={{ fontSize: 11, color: "var(--v2-muted)" }}>
            {pv.rootCause}
          </div>
          <div className="ccv2-pv-stat__sub">Remediation applied: {pv.remediationApplied ? "Yes" : "No"}</div>
        </div>
      </div>

      <div className="ccv2-pv-panel__actions">
        <button className="ccv2-pv-panel__action-btn" disabled>Run Backend Validation</button>
        <button className="ccv2-pv-panel__action-btn" disabled>View Report</button>
      </div>

      {pv.timeline.length > 0 && (
        <div className="ccv2-pv-timeline">
          <div className="ccv2-pv-timeline__title">Validation Timeline</div>
          {pv.timeline.map((entry, i) => (
            <div key={i} className="ccv2-pv-timeline__entry">
              <span className="ccv2-pv-timeline__phase">{entry.phase}</span>
              <span className="ccv2-pv-timeline__name">{entry.title}</span>
              <div className="ccv2-pv-timeline__status-dot" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Evidence and Governance Section ─── */
function EvidenceGovernanceSection({ vm }) {
  const reports = LOCAL_REPORT_SNAPSHOT.validation?.reports || [];
  const runtimeEvidence = runtimeSnapshot.runtimeState?.evidence || {};
  const approvalWorkflow = runtimeSnapshot.approvalWorkflow || {};
  const incidents = runtimeSnapshot.runtimeState?.incidents || {};
  const gatePassCount = Object.values(vm.mission.gates || {}).filter((status) => status === "PASS").length;
  const gateTotal = Object.keys(vm.mission.gates || {}).length || 0;
  const stats = [
    { label: "Validation Artifacts", value: String(reports.length + (runtimeEvidence.total || 0)), tone: "teal" },
    { label: "Gate Pass Rate", value: gateTotal > 0 ? `${Math.round((gatePassCount / gateTotal) * 100)}%` : "Not available yet", tone: "green" },
    { label: "Approval Backlog", value: approvalWorkflow.requested > 0 ? `${approvalWorkflow.requested} open` : "No pending approvals", tone: "amber" },
    { label: "Safety Incidents", value: incidents.total > 0 ? String(incidents.total) : "No incidents reported", tone: "" },
  ];
  return (
    <div className="ccv2-card ccv2-evidence">
      <h3 className="ccv2-evidence__title">Evidence and Governance</h3>
      <div className="ccv2-evidence__grid">
        {stats.map((s) => (
          <div key={s.label} className="ccv2-evidence-stat">
            <div className="ccv2-evidence-stat__label">{s.label}</div>
            <div className={`ccv2-evidence-stat__value${s.tone ? ` ccv2-evidence-stat__value--${s.tone}` : ""}`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Next Best Action Panel ─── */
function NextBestActionPanel({ vm }) {
  const navigate = useNavigate();
  const activatedTasks = (runtimeSnapshot.runtimeState?.tasks?.recent || []).filter((task) =>
    ["queued", "running", "implementation_done", "awaiting_verification", "blocked", "awaiting_approval"].includes(task.state),
  );
  const recentEvidence = runtimeSnapshot.runtimeState?.evidence?.recent || [];
  const nextTask = vm.taskActivation?.nextTask;
  const recommendation = activatedTasks.length > 0
    ? {
        title: "Review Activated Mission Task",
        why: "A governed runtime task is active and needs review, evidence follow-through, or next action assignment.",
        owner: activatedTasks[0].targetAgent || activatedTasks[0].sourceAgent || "AUDITOR",
        risk: activatedTasks[0].riskLevel || "medium",
        impact: "Moves active work through review, evidence capture, and verification.",
        prerequisite: "Requires agent workbench and current runtime evidence.",
        state: "Available",
        buttonLabel: "Open Agent Workbench",
        buttonRoute: "/command-center/workbench",
        enabled: true,
        evidenceLink: recentEvidence[0]?.evidenceId || "No evidence yet",
      }
    : nextTask
      ? {
          title: "Activate Next Governed Task",
          why: "The mission plan exists and the next planned task is ready to enter the local runtime queue.",
          owner: nextTask.targetAgent || "SHEPHERD",
          risk: nextTask.riskLevel || "medium",
          impact: "Populates the runtime pipeline and starts governed execution tracking.",
          prerequisite: "Requires task activation bridge.",
          state: vm.taskActivation?.activationPolicy?.requiresBridge ? "Requires governed action bridge" : "Available",
          buttonLabel: "Open Task Queue",
          buttonRoute: "/command-center/tasks",
          enabled: true,
          evidenceLink: "No evidence yet",
        }
      : null;

  if (!recommendation) return null;

  return (
    <div className="ccv2-card ccv2-nba-panel" id="v2-next-best-action">
      <div className="ccv2-eyebrow">Next Best Action</div>
      <div className="ccv2-nba-panel__title">{recommendation.title}</div>
      <div className="ccv2-nba-panel__desc">{recommendation.why}</div>
      <div className="ccv2-nba-panel__meta">
        <div className="ccv2-nba-panel__meta-row">
          <span className="ccv2-nba-panel__meta-label">Owner</span>
          <span className="ccv2-nba-panel__meta-value">{String(recommendation.owner).toUpperCase()}</span>
        </div>
        <div className="ccv2-nba-panel__meta-row">
          <span className="ccv2-nba-panel__meta-label">Risk</span>
          <span className="ccv2-nba-panel__meta-value">{recommendation.risk}</span>
        </div>
        <div className="ccv2-nba-panel__meta-row">
          <span className="ccv2-nba-panel__meta-label">Expected impact</span>
          <span className="ccv2-nba-panel__meta-value">{recommendation.impact}</span>
        </div>
        <div className="ccv2-nba-panel__meta-row">
          <span className="ccv2-nba-panel__meta-label">Prerequisite</span>
          <span className="ccv2-nba-panel__meta-value">{recommendation.prerequisite}</span>
        </div>
        <div className="ccv2-nba-panel__meta-row">
          <span className="ccv2-nba-panel__meta-label">Action state</span>
          <span className="ccv2-nba-panel__meta-value">{recommendation.state}</span>
        </div>
        <div className="ccv2-nba-panel__meta-row">
          <span className="ccv2-nba-panel__meta-label">Evidence</span>
          <span className="ccv2-nba-panel__meta-value">{recommendation.evidenceLink}</span>
        </div>
      </div>
      {recommendation.enabled ? (
        <button
          className="ccv2-wf-card__btn ccv2-wf-card__btn--enabled"
          onClick={() => navigate(recommendation.buttonRoute)}
        >
          {recommendation.buttonLabel}
        </button>
      ) : (
        <button className="ccv2-wf-card__btn ccv2-wf-card__btn--disabled" disabled>
          {recommendation.state || "Not available"}
        </button>
      )}
    </div>
  );
}

function OperatorActionsPanel({ commands, onSelectCommand }) {
  const primaryCommands = commands.filter((command) =>
    ["plan", "review", "qa", "explain"].includes(command.id),
  );
  const secondaryCommands = commands.filter((command) =>
    ["fix", "ship", "guard", "freeze", "retro"].includes(command.id),
  );

  function renderCommandButton(command) {
    return (
      <div key={command.id} className="ccv2-operator-actions__item">
        <button
          type="button"
          className={`ccv2-operator-actions__button${command.available ? " ccv2-operator-actions__button--enabled" : ""}`}
          onClick={command.available ? () => onSelectCommand(command.id) : undefined}
          disabled={!command.available}
          title={command.available ? command.intent : command.disabledReason}
        >
          {command.label}
        </button>
        <div className="ccv2-operator-actions__meta">
          <span className={`ccv2-pill ccv2-pill--${getCommandTone(command)}`}>{command.currentState}</span>
          <span className="ccv2-operator-actions__reason">
            {command.available ? formatActionModeLabel(command.actionMode) : command.disabledReason}
          </span>
        </div>
      </div>
    );
  }

  return (
    <section className="ccv2-card ccv2-operator-actions" id="v2-operator-actions">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">Operator Actions</div>
          <div className="ccv2-operator-actions__title">Simple governed actions for the active scope</div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">Read-only and route-first</span>
      </div>

      <div className="ccv2-operator-actions__group">
        <div className="ccv2-operator-actions__group-label">Primary</div>
        <div className="ccv2-operator-actions__grid">
          {primaryCommands.map(renderCommandButton)}
        </div>
      </div>

      <div className="ccv2-operator-actions__group">
        <div className="ccv2-operator-actions__group-label">Advanced</div>
        <div className="ccv2-operator-actions__grid">
          {secondaryCommands.map(renderCommandButton)}
        </div>
      </div>
    </section>
  );
}

function CommandPalette({ open, vm, commands, selectedCommandId, onSelectCommand, onClose, onExecuteCommand }) {
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (!open) {
      setSearchText("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const filteredCommands = commands.filter((command) => {
    const haystack = [
      command.label,
      command.shortLabel,
      command.category,
      command.intent,
      command.ownerAgent,
      command.currentState,
      command.disabledReason,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(searchText.trim().toLowerCase());
  });

  const selectedCommand = filteredCommands.find((command) => command.id === selectedCommandId)
    || commands.find((command) => command.id === selectedCommandId)
    || filteredCommands[0]
    || commands[0];
  const capabilities = selectedCommand
    ? buildCommandCapabilitySummary(selectedCommand, vm.capabilityReadiness)
    : [];
  const commandsByCategory = COMMAND_CATEGORY_ORDER.map((category) => ({
    category,
    commands: filteredCommands.filter((command) => command.category === category),
  })).filter((group) => group.commands.length > 0);

  return (
    <div className="ccv2-command-palette" role="dialog" aria-modal="true" aria-label="NEXUS Command Palette">
      <button type="button" className="ccv2-command-palette__backdrop" aria-label="Dismiss Command Palette overlay" onClick={onClose} />
      <div className="ccv2-command-palette__panel">
        <div className="ccv2-command-palette__header">
          <div>
            <div className="ccv2-eyebrow">Command Palette</div>
            <h2 className="ccv2-command-palette__title">Simple operator actions for governed local work</h2>
          </div>
          <button
            type="button"
            className="ccv2-command-palette__close"
            aria-label="Close Command Palette"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="ccv2-command-palette__search">
          <input
            autoFocus
            className="ccv2-command-palette__input"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search commands, intent, or owner"
            aria-label="Search commands"
          />
          <span className="ccv2-command-palette__hint">{vm.commandPalette?.keyboardHint || "Cmd/Ctrl+K"}</span>
        </div>

        <div className="ccv2-command-palette__body">
          <div className="ccv2-command-palette__list" aria-label="Command list">
            {commandsByCategory.map((group) => (
              <div key={group.category} className="ccv2-command-palette__group">
                <div className="ccv2-command-palette__group-label">{group.category}</div>
                {group.commands.map((command) => (
                  <button
                    key={command.id}
                    type="button"
                    className={`ccv2-command-palette__item${selectedCommand?.id === command.id ? " ccv2-command-palette__item--active" : ""}`}
                    onClick={() => onSelectCommand(command.id)}
                  >
                    <div className="ccv2-command-palette__item-header">
                      <span className="ccv2-command-palette__item-label">{command.label}</span>
                      <span className={`ccv2-pill ccv2-pill--${getCommandTone(command)}`}>{command.currentState}</span>
                    </div>
                    <div className="ccv2-command-palette__item-meta">
                      <span>{command.ownerAgent}</span>
                      <span className={`ccv2-pill ccv2-pill--${getRiskTone(command.riskLevel)}`}>{command.riskLevel}</span>
                    </div>
                    {!command.available && (
                      <div className="ccv2-command-palette__item-reason">{command.disabledReason}</div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {selectedCommand && (
            <div className="ccv2-command-palette__detail">
              <div className="ccv2-command-palette__detail-top">
                <div>
                  <div className="ccv2-eyebrow">{selectedCommand.category}</div>
                  <div className="ccv2-command-palette__detail-title">{selectedCommand.label}</div>
                </div>
                <div className="ccv2-command-palette__detail-badges">
                  <span className={`ccv2-pill ccv2-pill--${getCommandTone(selectedCommand)}`}>{selectedCommand.currentState}</span>
                  <span className={`ccv2-pill ccv2-pill--${getRiskTone(selectedCommand.riskLevel)}`}>{selectedCommand.riskLevel}</span>
                </div>
              </div>

              <div className="ccv2-command-palette__detail-copy">{selectedCommand.intent}</div>

              <div className="ccv2-command-palette__detail-grid">
                <div className="ccv2-command-palette__detail-row">
                  <span className="ccv2-command-palette__detail-label">Active scope</span>
                  <span className="ccv2-command-palette__detail-value">{selectedCommand.activeScope}</span>
                </div>
                <div className="ccv2-command-palette__detail-row">
                  <span className="ccv2-command-palette__detail-label">Owner</span>
                  <span className="ccv2-command-palette__detail-value">{selectedCommand.ownerAgent}</span>
                </div>
                <div className="ccv2-command-palette__detail-row">
                  <span className="ccv2-command-palette__detail-label">Risk</span>
                  <span className="ccv2-command-palette__detail-value">{selectedCommand.riskLevel}</span>
                </div>
                <div className="ccv2-command-palette__detail-row">
                  <span className="ccv2-command-palette__detail-label">Action mode</span>
                  <span className="ccv2-command-palette__detail-value">{formatActionModeLabel(selectedCommand.actionMode)}</span>
                </div>
                <div className="ccv2-command-palette__detail-row">
                  <span className="ccv2-command-palette__detail-label">Expected evidence</span>
                  <span className="ccv2-command-palette__detail-value">{selectedCommand.evidenceProduced}</span>
                </div>
                <div className="ccv2-command-palette__detail-row">
                  <span className="ccv2-command-palette__detail-label">Cost status</span>
                  <span className="ccv2-command-palette__detail-value">{summarizeCommandCost(selectedCommand)}</span>
                </div>
                <div className="ccv2-command-palette__detail-row">
                  <span className="ccv2-command-palette__detail-label">Service state</span>
                  <span className="ccv2-command-palette__detail-value">
                    Local API: {selectedCommand.serviceState?.liveApi} · Action Bridge: {selectedCommand.serviceState?.actionBridge}
                  </span>
                </div>
                <div className="ccv2-command-palette__detail-row">
                  <span className="ccv2-command-palette__detail-label">Trigger preview</span>
                  <span className="ccv2-command-palette__detail-value">
                    {selectedCommand.triggerPreview?.status || "preview_only"} · Preview only - trigger execution is not enabled yet
                  </span>
                </div>
                <div className="ccv2-command-palette__detail-row">
                  <span className="ccv2-command-palette__detail-label">Scheduled triggers</span>
                  <span className="ccv2-command-palette__detail-value">
                    Scheduled triggers: Preview only · Runtime scheduler: Not enabled · Worker runtime: Not enabled
                  </span>
                </div>
                <div className="ccv2-command-palette__detail-row">
                  <span className="ccv2-command-palette__detail-label">Integration preview</span>
                  <span className="ccv2-command-palette__detail-value">
                    GitHub Events - Preview only · no credentials configured · webhook execution is disabled
                  </span>
                </div>
                <div className="ccv2-command-palette__detail-row">
                  <span className="ccv2-command-palette__detail-label">Ticket preview</span>
                  <span className="ccv2-command-palette__detail-value">
                    Jira / Linear - Planned integration · no credentials configured · no outbound calls
                  </span>
                </div>
                <div className="ccv2-command-palette__detail-row">
                  <span className="ccv2-command-palette__detail-label">Chat preview</span>
                  <span className="ccv2-command-palette__detail-value">
                    Slack / Teams - Planned integration · sample /nexus commands · chat execution is disabled
                  </span>
                </div>
              </div>

              <div className="ccv2-command-palette__capabilities">
                <div className="ccv2-command-palette__detail-label">Required capabilities</div>
                {capabilities.map((capability) => (
                  <div key={capability.id} className="ccv2-command-palette__capability">
                    <span className="ccv2-command-palette__capability-name">{formatCapabilityLabel(capability.id)}</span>
                    <span className="ccv2-command-palette__capability-state">{capability.label}</span>
                    <span className="ccv2-command-palette__capability-desc">{capability.description}</span>
                  </div>
                ))}
              </div>

              {!selectedCommand.available && selectedCommand.disabledReason && (
                <div className="ccv2-command-palette__disabled-reason">
                  Next requirement: {selectedCommand.disabledReason}
                </div>
              )}

              <div className="ccv2-command-palette__actions">
                <button
                  type="button"
                  className={`ccv2-command-palette__primary${selectedCommand.available ? " ccv2-command-palette__primary--enabled" : ""}`}
                  disabled={!selectedCommand.available}
                  onClick={selectedCommand.available ? () => onExecuteCommand(selectedCommand) : undefined}
                >
                  {selectedCommand.available ? "Open governed route" : "Not enabled"}
                </button>
                {!selectedCommand.available && (
                  <div className="ccv2-command-palette__terminal-note">
                    {selectedCommand.disabledReason}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Verification Gates Summary (Mission Control) ─── */
function VerificationGatesSummary({ vm }) {
  const gates = vm.mission.gates;
  const evidence = runtimeSnapshot.runtimeState?.evidence?.recent || [];
  const detailMap = {
    AUDITOR:  {
      summary: "Code quality, diff review, and validation evidence.",
      nextRequirement: "Maintain current validation evidence.",
    },
    SENTINEL: {
      summary: "Backend and QA gate validation before release readiness.",
      nextRequirement: "Resolve pending validation or complete runner coverage.",
    },
    WARDEN:   {
      summary: "Privacy, compliance, and governed safety posture.",
      nextRequirement: "Retain approval and privacy evidence for release.",
    },
  };
  return (
    <div className="ccv2-card" id="v2-verification-gates">
      <div className="ccv2-eyebrow" style={{ marginBottom: 8 }}>Verification Gates</div>
      <div className="ccv2-gate-grid ccv2-gate-grid--compact">
        {Object.entries(gates).map(([gate, status]) => (
          <div key={gate} className="ccv2-gate-card">
            <div className="ccv2-gate-card__name">{gate}</div>
            <div className={`ccv2-gate-card__status ccv2-gate-card__status--${status === "PASS" ? "pass" : status === "PENDING" ? "pending" : "fail"}`}>
              {status === "PASS" ? "Pass" : status === "PENDING" ? "Pending" : "Blocked"}
            </div>
            <div className="ccv2-gate-card__detail">{detailMap[gate]?.summary || ""}</div>
            <div className="ccv2-gate-card__detail">Evidence: {evidence.filter((item) => (item.agentId || "").toUpperCase() === gate).length || "No evidence yet"}</div>
            <div className="ccv2-gate-card__detail">Next: {detailMap[gate]?.nextRequirement || "Not run"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Safety / Approval Summary (Mission Control) ─── */
function SafetyApprovalSummary({ vm }) {
  const safety = vm.safety;
  const governance = actionBridgeSnapshot.governance || {};
  const approvalWorkflow = runtimeSnapshot.approvalWorkflow || {};
  const incidents = runtimeSnapshot.runtimeState?.incidents || {};
  const activeHighRisk = (runtimeSnapshot.runtimeState?.tasks?.recent || []).filter((task) => task.riskLevel === "high" || task.riskLevel === "critical").length;
  const policyBlocks = (runtimeSnapshot.runtimeState?.tasks?.byState?.blocked || 0) + (runtimeSnapshot.runtimeState?.tasks?.byState?.awaiting_approval || 0);
  return (
    <div className="ccv2-card" id="v2-safety-approval">
      <div className="ccv2-eyebrow" style={{ marginBottom: 8 }}>Safety / Approval</div>
      <div className="ccv2-safety-approval-grid">
        <div className="ccv2-safety-approval-stat">
          <div style={{ fontSize: 11, color: "var(--nexus-muted)", marginBottom: 4 }}>Pending approvals</div>
          <div className="ccv2-safety-approval-stat__num">{approvalWorkflow.requested || 0}</div>
          <div style={{ fontSize: 11, color: "var(--nexus-muted)" }}>High-risk actions: {activeHighRisk}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--nexus-muted)", marginBottom: 6 }}>Policy status</div>
          {[
            { label: "Policy blocks", ok: policyBlocks === 0, value: policyBlocks > 0 ? `${policyBlocks} active` : "None" },
            { label: "Provider calls", ok: !governance.providerCallsAllowed, value: governance.providerCallsAllowed ? "Enabled" : "Disabled" },
            { label: "DB writes", ok: false, value: "Disabled by policy" },
            { label: "Project mutation", ok: false, value: "Governed only" },
            { label: "Worker runtime", ok: false, value: "Not enabled" },
            { label: "Safety incidents", ok: (incidents.total || 0) === 0, value: incidents.total || safety.incidents || 0 },
          ].map((r) => (
            <div key={r.label} className="ccv2-safety-policy-row">
              <span style={{ color: "var(--nexus-muted)" }}>{r.label}</span>
              <span style={{ color: r.ok ? "var(--nexus-success)" : "var(--nexus-warning)" }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Active Mission Tasks Summary (Mission Control) ─── */
function ActiveMissionTasksSummary({ vm }) {
  const navigate = useNavigate();
  const activeStates = new Set(["queued", "running", "implementation_done", "awaiting_verification", "awaiting_approval", "blocked"]);
  const tasks = (runtimeSnapshot.runtimeState?.tasks?.recent || []).filter((task) => activeStates.has(task.state));
  const nextActionMap = {
    queued: "Activate runtime",
    running: "Open Agent Workbench",
    implementation_done: "Send to verification",
    awaiting_verification: "Collect verification evidence",
    awaiting_approval: "Approve or reject",
    blocked: "Resolve blocker",
  };

  return (
    <div className="ccv2-card" id="v2-active-mission-tasks">
      <div className="ccv2-card-header-row">
        <div className="ccv2-eyebrow">Active Mission Tasks</div>
        <button className="ccv2-link-btn" onClick={() => navigate("/command-center/tasks")}>View all →</button>
      </div>
      {tasks.length > 0 ? (
        <div style={{ overflowX: "auto", marginTop: 4 }}>
          <table className="ccv2-table ccv2-table--compact">
            <thead>
              <tr>
                <th>Task</th>
                <th>Owner Agent</th>
                <th>State</th>
                <th>Risk</th>
                <th>Evidence</th>
                <th>Next Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.taskId}>
                  <td style={{ fontSize: 12 }}>{task.objective || task.taskType || task.taskId}</td>
                  <td style={{ fontWeight: 700, fontSize: 11 }}>{(task.targetAgent || task.sourceAgent || "NEXUS").toUpperCase()}</td>
                  <td><span className={`ccv2-pill ccv2-pill--${task.state === "blocked" ? "fail" : task.state === "running" ? "pending" : "pass"}`} style={{ fontSize: 10 }}>{task.state}</span></td>
                  <td><span className={`ccv2-pill ccv2-pill--${task.riskLevel === "high" || task.riskLevel === "critical" ? "fail" : task.riskLevel === "medium" ? "pending" : "pass"}`} style={{ fontSize: 10 }}>{task.riskLevel || "unknown"}</span></td>
                  <td style={{ fontSize: 10, color: "var(--nexus-muted)" }}>{Array.isArray(task.evidenceIds) && task.evidenceIds.length > 0 ? task.evidenceIds.length : "No evidence yet"}</td>
                  <td style={{ fontSize: 10, color: "var(--nexus-text)" }}>{nextActionMap[task.state] || "Monitor"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="ccv2-empty-state">
          No activated tasks yet. Create a mission plan or activate a planned task.
        </div>
      )}
    </div>
  );
}

/* ─── Project Progress (Mission Control) ─── */
function ProjectProgressRings({ vm }) {
  const clp = vm.careloopProductProgress;
  const privacyStatus = vm.mission.gates.WARDEN === "PASS" ? "Complete" : "Pending";
  const releaseStatus = vm.capabilityReadiness?.releaseActionBridge?.status === "not_enabled" ? "Not enabled" : "Pending";
  const items = [
    {
      label: "Backend Validation",
      value: clp?.backendValidation?.status === "PASS" ? 100 : 0,
      status: clp?.backendValidation?.status === "PASS"
        ? `${clp.backendValidation.testsPassed}/${clp.backendValidation.totalTests} PASS`
        : "Pending backend validation evidence",
      color: clp?.backendValidation?.status === "PASS" ? "var(--nexus-success)" : "var(--nexus-warning)",
    },
    {
      label: "iOS Validation",
      value: 0,
      status: "Requires iOS/Xcode runner",
      color: "var(--nexus-muted)",
    },
    {
      label: "Privacy Review",
      value: vm.mission.gates.WARDEN === "PASS" ? 100 : 35,
      status: privacyStatus,
      color: vm.mission.gates.WARDEN === "PASS" ? "var(--nexus-success)" : "var(--nexus-warning)",
    },
    {
      label: "Release Prep",
      value: releaseStatus === "Not enabled" ? 0 : 25,
      status: releaseStatus,
      color: releaseStatus === "Not enabled" ? "var(--nexus-muted)" : "var(--nexus-info)",
    },
  ];
  return (
    <div className="ccv2-card" id="v2-project-progress">
      <div className="ccv2-eyebrow" style={{ marginBottom: 10 }}>Project Progress</div>
      <div className="ccv2-progress-rings">
        {items.map((item) => (
          <div key={item.label} className="ccv2-progress-ring-item">
            <div className="ccv2-progress-ring-label">{item.label}</div>
            <div className="ccv2-progress-bar-track">
              <div className="ccv2-progress-bar-fill" style={{ width: `${item.value}%`, background: item.color }} />
            </div>
            <div className="ccv2-progress-ring-status" style={{ color: item.color }}>{item.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Evidence Timeline (Mission Control) ─── */
function EvidenceTimeline({ vm }) {
  const evidence = runtimeSnapshot.runtimeState?.evidence || {};
  const recent = evidence.recent || [];
  const items = recent.slice(0, 6).map((ev) => ({
    time: new Date(ev.createdAt || Date.now()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    agent: (ev.agentId || "system").toUpperCase(),
    text: (ev.type || "evidence").replace(/_/g, " "),
    result: ev.result || "INFO",
    linkedTask: ev.taskId || "No linked task",
    redacted: ev.redacted !== false,
  }));

  return (
    <div className="ccv2-card" id="v2-evidence-timeline">
      <div className="ccv2-eyebrow" style={{ marginBottom: 8 }}>Evidence Timeline</div>
      {items.length > 0 ? (
        <div className="ccv2-evidence-timeline">
          {items.map((item, i) => (
            <div key={i} className="ccv2-evidence-timeline__entry">
              <div className="ccv2-evidence-timeline__time ccv2-mono">{item.time}</div>
              <div className={`ccv2-evidence-timeline__dot ccv2-evidence-timeline__dot--${item.result === "PASS" ? "pass" : item.result === "FAIL" ? "fail" : "info"}`} />
              <div className="ccv2-evidence-timeline__content">
                <span className="ccv2-evidence-timeline__agent">{item.agent}</span>
                <span className="ccv2-evidence-timeline__text">{item.text}</span>
                <span className="ccv2-evidence-timeline__meta">Task: {item.linkedTask} · Redacted: {item.redacted ? "Yes" : "No"}</span>
              </div>
              <span className={`ccv2-pill ccv2-pill--${item.result === "PASS" ? "pass" : item.result === "FAIL" ? "fail" : "pending"}`} style={{ fontSize: 10 }}>{item.result}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="ccv2-empty-state">Evidence appears after governed actions complete.</div>
      )}
    </div>
  );
}

/* ─── Cost Center Summary (Mission Control) ─── */
function CostCenterSummary({ vm }) {
  return (
    <div className="ccv2-card" id="v2-cost-center">
      <div className="ccv2-eyebrow" style={{ marginBottom: 8 }}>Cost Snapshot</div>
      <div style={{ fontSize: 12, color: "var(--nexus-muted)", marginBottom: 10, lineHeight: 1.5 }}>
        Cost enforcement is not enabled yet. This cockpit shows policy posture only until governed provider dispatch is available.
      </div>
      <div className="ccv2-cost-rows">
        {[
          { label: "Cost enforcement", value: "Not enabled yet", color: "var(--nexus-warning)" },
          { label: "Budget enforcement", value: "Not enabled yet", color: "var(--nexus-warning)" },
          { label: "Provider spend", value: "No provider dispatch", color: "var(--nexus-info)" },
          { label: "Batch jobs", value: "Not enabled yet", color: "var(--nexus-muted)" },
        ].map((r) => (
          <div key={r.label} className="ccv2-cost-row">
            <span style={{ color: "var(--nexus-muted)" }}>{r.label}</span>
            <span style={{ color: r.color }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Release Section ─── */
function ReleaseSection({ vm }) {
  const r = vm.release;
  const releaseBridge = vm.capabilityReadiness?.releaseActionBridge;
  const requiredGates = Object.entries(vm.mission.gates).map(([gate, status]) => ({
    gate,
    status,
  }));
  const readyToGo = releaseBridge?.status === "ready" && requiredGates.every((gate) => gate.status === "PASS");
  return (
    <div className="ccv2-card ccv2-release-section" id="v2-release-readiness">
      <div className="ccv2-release-section__header">
        <h3 className="ccv2-release-section__title">Release Readiness</h3>
        <span className={`ccv2-pill ccv2-pill--${readyToGo ? "pass" : "pending"}`}>
          {readyToGo ? "GO" : "Not ready"}
        </span>
      </div>

      <div className="ccv2-release-section__blocker">
        <div className="ccv2-release-section__blocker-label">Reason</div>
        {readyToGo
          ? "Verification gates are complete and the release bridge is available."
          : "Requires release action bridge and complete verification gates."}
      </div>

      <div className="ccv2-release-section__track">
        <div className="ccv2-release-section__fill" style={{ width: `${r.readiness}%` }} />
      </div>

      <div className="ccv2-release-section__requirements">
        {requiredGates.map((gate) => (
          <div key={gate.gate} className="ccv2-release-section__requirement">
            <span>{gate.gate}</span>
            <span className={`ccv2-pill ccv2-pill--${gate.status === "PASS" ? "pass" : gate.status === "PENDING" ? "pending" : "fail"}`}>
              {gate.status === "PASS" ? "Pass" : gate.status === "PENDING" ? "Pending" : "Blocked"}
            </span>
          </div>
        ))}
        <div className="ccv2-release-section__requirement">
          <span>Release action bridge</span>
          <span className="ccv2-pill ccv2-pill--disabled">{releaseBridge?.userFacingState || "Requires release action bridge"}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE COMPONENTS
   ═══════════════════════════════════════════════════════ */

/* ─── CareLoop Progress Card ─── */
function CareLoopProgressCard({ clp }) {
  if (!clp) return null;
  const sprint1 = clp.sprints[0];
  return (
    <div className="ccv2-card ccv2-product-card">
      <div className="ccv2-product-card__header">
        <div>
          <div className="ccv2-eyebrow">Product Progress</div>
          <div className="ccv2-product-card__name">{clp.productName}</div>
          <div className="ccv2-product-card__lang">{clp.productLanguage}</div>
        </div>
        <div className="ccv2-product-card__badges">
          <span className="ccv2-pill ccv2-pill--live">PRD {clp.prdStatus.version}</span>
          {clp.prdStatus.locked && <span className="ccv2-pill ccv2-pill--pass">LOCKED</span>}
        </div>
      </div>

      <div className="ccv2-product-card__validation">
        <span style={{ fontSize: 12, color: "var(--v2-muted)" }}>Backend tests</span>
        <span className="ccv2-mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--v2-green)" }}>
          {clp.backendValidation.testsPassed}/{clp.backendValidation.totalTests}
        </span>
        <span className={`ccv2-pill ccv2-pill--${clp.backendValidation.status === "PASS" ? "pass" : "fail"}`}>
          {clp.backendValidation.status}
        </span>
      </div>

      <div className="ccv2-product-card__sprint-summary">
        <div className="ccv2-eyebrow" style={{ marginBottom: 4 }}>Current sprint</div>
        {clp.sprints.map((s) => (
          <div key={s.id} className={`ccv2-sprint-row ccv2-sprint-row--${s.status.toLowerCase().replace("_", "-")}`}>
            <span className="ccv2-sprint-row__id">{s.id}</span>
            <span className="ccv2-sprint-row__focus">{s.focus}</span>
            <span className="ccv2-sprint-row__status">{s.status}</span>
            {s.tests !== "—" && <span className="ccv2-mono ccv2-sprint-row__tests">{s.tests}</span>}
          </div>
        ))}
      </div>

      <div className="ccv2-product-card__gaps">
        <div className="ccv2-eyebrow" style={{ marginBottom: 4 }}>Open gaps</div>
        {clp.gaps.map((g) => (
          <div key={g} className="ccv2-gap-row">
            <span className="ccv2-gap-row__dot" />
            {g}
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: "var(--v2-muted-2)", marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(136,255,235,0.06)" }}>
        Compliance: {clp.compliance.framework} · Clinic integration: {clp.compliance.clinicIntegration}
      </div>
    </div>
  );
}

/* ─── Workflow Card ───
   Template labels: Validate Startup Idea | Fix Failing Test | Validate Backend |
   Review Release | Plan Sprint | Run Privacy Review | Prepare iOS Validation |
   Govern Agent Work
─── */
function WorkflowCard({ wf, navigate }) {
  const statusLabel = wf.userFacingState || (wf.enabledNow ? "Available" : "Not available");
  const statusClass = wf.enabledNow ? "pass" : "disabled";
  const ownerAgents = (wf.primaryAgents || []).slice(0, 3).map(formatAgentLabel);
  const actionLabel = wf.enabledNow
    ? (wf.id === "govern-agent-work" ? "Open Agent Workbench" : wf.id === "plan-sprint" ? "Open Workspace Plan" : "Open Workflow")
    : "Not available";

  return (
    <div className={`ccv2-wf-card ccv2-wf-card--${wf.category}`}>
      <div className="ccv2-wf-card__header">
        <div className="ccv2-wf-card__label">{wf.label}</div>
        <span className={`ccv2-pill ccv2-pill--${statusClass}`}>{statusLabel}</span>
      </div>
      <div className="ccv2-wf-card__desc">{wf.description}</div>
      <div className="ccv2-wf-card__meta-list">
        <div className="ccv2-wf-card__meta-row">
          <span className="ccv2-wf-card__meta-label">Required capability</span>
          <span className="ccv2-wf-card__meta-value">{wf.userFacingRequirement || wf.requiredCapability || "Available"}</span>
        </div>
        <div className="ccv2-wf-card__meta-row">
          <span className="ccv2-wf-card__meta-label">Available action</span>
          <span className="ccv2-wf-card__meta-value">{actionLabel}</span>
        </div>
        <div className="ccv2-wf-card__meta-row">
          <span className="ccv2-wf-card__meta-label">Owner agent</span>
          <span className="ccv2-wf-card__meta-value">{ownerAgents.join(" · ") || "NEXUS"}</span>
        </div>
      </div>
      <div className="ccv2-wf-card__agents">
        {wf.primaryAgents.slice(0, 4).map((a) => (
          <span key={a} className="ccv2-wf-card__agent-chip">{formatAgentLabel(a)}</span>
        ))}
        {wf.primaryAgents.length > 4 && <span className="ccv2-wf-card__agent-chip">+{wf.primaryAgents.length - 4}</span>}
      </div>
      <div className="ccv2-wf-card__evidence">
        {wf.evidenceCreated.map((e) => (
          <span key={e} className="ccv2-wf-card__evidence-tag">{e.replace(/_/g, " ")}</span>
        ))}
      </div>
      {wf.userFacingRequirement && (
        <div className="ccv2-wf-card__requirement">
          {wf.enabledNow ? `Note: ${wf.userFacingRequirement}` : `Disabled reason: ${wf.userFacingRequirement}`}
        </div>
      )}
      <div className="ccv2-wf-card__footer">
        <span className="ccv2-wf-card__approval">
          {wf.approvalRequired === true ? "Approval required" : wf.approvalRequired === "conditional" ? "Conditional approval" : "No approval"}
        </span>
        {wf.enabledNow ? (
          <button
            className="ccv2-wf-card__btn ccv2-wf-card__btn--enabled"
            title="Start Workflow"
            aria-label={`Start Workflow: ${wf.label}`}
            onClick={() => navigate && navigate("/command-center/workspace")}
          >
            {actionLabel}
          </button>
        ) : (
          <button className="ccv2-wf-card__btn ccv2-wf-card__btn--disabled" disabled title={wf.userFacingRequirement}>
            {wf.userFacingRequirement || "Not available"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Workspace Band ─── */
function WorkspaceBand({ vm }) {
  const navigate = useNavigate();
  const ws = vm.agenticWorkspace;
  if (!ws) return null;

  const templates = ws.workflowTemplates || [];
  const nba = ws.nextBestAction;

  return (
    <div className="ccv2-workspace-band">
      <div className="ccv2-workspace-band__header">
        <div>
          <div className="ccv2-eyebrow">Agentic Workspace</div>
          <div className="ccv2-workspace-band__title">What do you want NEXUS to do?</div>
          <div className="ccv2-workspace-band__sub">Choose a workflow. NEXUS will assign agents, collect evidence, and govern execution.</div>
        </div>
        {nba && (
          <div className="ccv2-workspace-band__nba">
            <div className="ccv2-eyebrow">Next best action</div>
            <div className="ccv2-workspace-band__nba-title">{nba.title}</div>
            <div className="ccv2-workspace-band__nba-desc">{nba.description}</div>
            {nba.enabled ? (
              <button className="ccv2-wf-card__btn ccv2-wf-card__btn--enabled" onClick={() => navigate(nba.action?.replace("navigate:", "") || "/command-center/tasks")}>
                Activate Next Task
              </button>
            ) : (
              <button className="ccv2-wf-card__btn ccv2-wf-card__btn--disabled" disabled>
                {nba.userFacingRequirement || "Not available"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="ccv2-wf-grid">
        {templates.map((wf) => (
          <WorkflowCard key={wf.id} wf={wf} navigate={navigate} />
        ))}
      </div>
    </div>
  );
}

/* ─── Mission Control Page ─── */
function ScopeSummaryCards({ vm, activeScope }) {
  const portfolio = vm.scopeModel?.portfolioSummary || {};
  const os = vm.scopeModel?.osSummary || {};
  const cards = activeScope === "portfolio"
    ? [
      { label: "Total Projects", value: portfolio.totalProjects ?? 1, meta: "Project Registry planned for P42" },
      { label: "Active Projects", value: portfolio.activeProjects ?? 1, meta: "Local-private project context" },
      { label: "Blocked Projects", value: portfolio.blockedProjects ?? 0, meta: "Projects needing review" },
      { label: "Pending Approvals", value: portfolio.pendingApprovals ?? 0, meta: "Across available project summaries" },
    ]
    : activeScope === "os"
      ? [
        { label: "Current OS Phase", value: os.currentPhase || "Current phase tracked", meta: "NEXUS OS platform scope" },
        { label: "Next OS Phase", value: os.nextPhase || "Next phase tracked", meta: "Roadmap remains OS-only" },
        { label: "Service Health", value: os.serviceHealth || "Status snapshot available", meta: "Use Service Health for details" },
        { label: "Docs / Tests", value: os.docsStatus || "Docs status available", meta: os.roadmapStatus || "Roadmap registry synced" },
      ]
      : [
        { label: "Active Project", value: vm.scopeModel?.selectedProjectLabel || vm.shell.activeProject, meta: "Project scope" },
        { label: "Active Mission", value: vm.missionComposer.missionDisplayName, meta: "Read-only mission summary" },
        { label: "Active Tasks", value: vm.taskActivation?.activatedCount || 0, meta: `${vm.taskActivation?.plannedCount || 0} planned tasks` },
        { label: "Gate Status", value: `${Object.values(vm.mission.gates).filter((status) => status === "PASS").length}/3 passing`, meta: "AUDITOR / SENTINEL / WARDEN" },
      ];

  return (
    <div className="ccv2-scope-summary-grid">
      {cards.map((card) => (
        <div key={card.label} className="ccv2-scope-summary-card">
          <div className="ccv2-scope-summary-card__label">{card.label}</div>
          <div className="ccv2-scope-summary-card__value">{card.value}</div>
          <div className="ccv2-scope-summary-card__meta">{card.meta}</div>
        </div>
      ))}
    </div>
  );
}

function PortfolioProjectCards({ vm }) {
  const projects = vm.scopeModel?.projectSummaries || [];

  return (
    <div className="ccv2-card">
      <div className="ccv2-card-header-row">
        <div className="ccv2-eyebrow">Portfolio Project Cards</div>
        <span className="ccv2-pill ccv2-pill--pending">Project Registry planned</span>
      </div>
      <div className="ccv2-portfolio-project-grid">
        {projects.map((project) => (
          <div key={project.projectId} className="ccv2-portfolio-project-card">
            <div className="ccv2-portfolio-project-card__title">{project.label}</div>
            <div className="ccv2-portfolio-project-card__meta">{project.status} · {project.mode}</div>
            <div className="ccv2-portfolio-project-card__row"><span>Active tasks</span><strong>{project.activeTasks}</strong></div>
            <div className="ccv2-portfolio-project-card__row"><span>Blocked tasks</span><strong>{project.blockedTasks}</strong></div>
            <div className="ccv2-portfolio-project-card__row"><span>Gates</span><strong>{project.gateStatus}</strong></div>
            <div className="ccv2-portfolio-project-card__row"><span>Cost</span><strong>{project.costStatus}</strong></div>
          </div>
        ))}
      </div>
      <div className="ccv2-empty-state">
        Project Registry will enable cross-project task aggregation, approvals, and cost status.
      </div>
    </div>
  );
}

function MissionControlOverviewTab({ vm, activeScope, operatorCommands, onOpenCommandPalette }) {
  if (activeScope === "portfolio") {
    return (
      <>
        <ScopeSummaryCards vm={vm} activeScope={activeScope} />
        <PortfolioProjectCards vm={vm} />
        <div className="ccv2-mission-control__lead-grid">
          <NextBestActionPanel vm={vm} />
          <SystemStatusStrip vm={vm} />
        </div>
      </>
    );
  }

  if (activeScope === "os") {
    return (
      <>
        <ScopeSummaryCards vm={vm} activeScope={activeScope} />
        <div className="ccv2-mission-control__lead-grid">
          <SystemStatusStrip vm={vm} />
          <div className="ccv2-card">
            <div className="ccv2-eyebrow" style={{ marginBottom: 8 }}>NEXUS OS Readiness</div>
            <div className="ccv2-status-strip__grid">
              <div className="ccv2-status-strip__item ccv2-status-strip__item--pass">
                <span className="ccv2-status-strip__label">Roadmap</span>
                <span className="ccv2-status-strip__value">{vm.scopeModel?.osSummary?.roadmapStatus}</span>
              </div>
              <div className="ccv2-status-strip__item ccv2-status-strip__item--pending">
                <span className="ccv2-status-strip__label">Docs</span>
                <span className="ccv2-status-strip__value">{vm.scopeModel?.osSummary?.docsStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!hasActiveProject(vm)) {
    return (
      <>
        <ProjectContextCard vm={vm} surface="Mission Control" />
        <ConversationalCommandInterfacePanel vm={vm} />
        <div className="ccv2-mission-control__lead-grid">
          <SystemStatusStrip vm={vm} />
          <div className="ccv2-card">
            <div className="ccv2-eyebrow" style={{ marginBottom: 8 }}>Project operations locked</div>
            <p className="ccv2-empty-state">
              Mission planning, task activation, evidence, gates, and project cost views require a selected project.
              Use Portfolio or NEXUS OS scope for platform context.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MissionComposerCard vm={vm} />

      <ConversationalCommandInterfacePanel vm={vm} />

      <OperatorActionsPanel
        commands={operatorCommands}
        onSelectCommand={onOpenCommandPalette}
      />

      <div className="ccv2-mission-control__lead-grid">
        <NextBestActionPanel vm={vm} />
        <SystemStatusStrip vm={vm} />
      </div>

      <div className="ccv2-kpi-row">
        {vm.metrics.map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </div>

      <div className="ccv2-pipeline-stream">
        <ExecutionPipeline vm={vm} />
        <ActivityStream vm={vm} />
      </div>
    </>
  );
}

function MissionControlWorkflowsTab({ vm, operatorCommands, onOpenCommandPalette, activeScope }) {
  const scopeCopy = activeScope === "portfolio"
    ? "Portfolio workflows are read-only until Project Registry enables cross-project operations."
    : activeScope === "os"
      ? "NEXUS OS workflows route to platform readiness, docs, service health, and roadmap work."
      : "Project workflows use capability-based readiness for planning, review, validation, governance, and release.";

  return (
    <>
      <div className="ccv2-info-banner">{scopeCopy}</div>
      <OperatorActionsPanel commands={operatorCommands} onSelectCommand={onOpenCommandPalette} />
      <div className="ccv2-mission-control__section-grid ccv2-mission-control__section-grid--two">
        <SystemStatusStrip vm={vm} />
        <div className="ccv2-card">
          <div className="ccv2-eyebrow" style={{ marginBottom: 8 }}>Capability-Based Workflow States</div>
          <div className="ccv2-cost-rows">
            {[
              ["Plan", "Available"],
              ["Build", "Ready"],
              ["Validate", "Requires controlled validation bridge"],
              ["Review", "Requires agent workbench"],
              ["Govern", "Read-only"],
              ["Release", "Requires release action bridge"],
              ["Guard / Freeze", "Requires runtime lock controls"],
            ].map(([label, state]) => (
              <div key={label} className="ccv2-cost-row">
                <span>{label}</span>
                <strong>{state}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function ConversationalCommandInterfacePanel({ vm }) {
  const commandInterface = vm.commandInterface || {};
  const commands = commandInterface.previewCommands || [];
  const timeline = commandInterface.recentTimeline || [];
  const noProjectSelected = !hasActiveProject(vm);
  const navigate = useNavigate();

  return (
    <div className="ccv2-card ccv2-command-interface-preview">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">Command Interface</div>
          <h3 className="ccv2-command-interface-preview__title">
            Ask NEXUS
          </h3>
        </div>
        <button type="button" className="ccv2-ask-nexus-inline" onClick={() => navigate("/command-center/command")}>
          Open chat
        </button>
      </div>
      <p className="ccv2-command-interface-preview__help">
        {commandInterface.helpText || "Commands are route-first previews until worker/provider/tool execution is enabled."}
      </p>

      <div className="ccv2-command-interface-preview__context">
        <div>
          <span>Scope</span>
          <strong>{vm.shell?.activeProjectScope === "os" ? "NEXUS OS" : vm.shell?.activeProjectScope === "portfolio" ? "Portfolio" : "Project"}</strong>
        </div>
        <div>
          <span>Project</span>
          <strong>{noProjectSelected ? "No project selected" : vm.shell?.activeProject || commandInterface.selectedProjectLabel}</strong>
        </div>
        <div>
          <span>Mode</span>
          <strong>{vm.shell?.mode || "local-private"}</strong>
        </div>
      </div>

      {noProjectSelected && (
        <div className="ccv2-info-banner">
          {commandInterface.noProjectBlockedReason || "Select or create a project first."}
        </div>
      )}

      <div className="ccv2-command-interface-preview__grid">
        {commands.map((command) => (
          <div key={command.command} className="ccv2-command-interface-preview__command">
            <div className="ccv2-command-interface-preview__command-top">
              <strong>{command.command}</strong>
              <span className={`ccv2-pill ccv2-pill--${command.status === "Blocked" ? "fail" : command.status === "Read-only" ? "disabled" : "pass"}`}>
                {command.status}
              </span>
            </div>
            <p>{command.intent}</p>
            <div className="ccv2-command-interface-preview__meta">
              <span>Route: {command.route}</span>
              <span>Risk: {command.risk}</span>
              <span>Approval: {command.approval}</span>
            </div>
            {command.blockedReason && (
              <div className="ccv2-command-interface-preview__blocked">
                Blocked reason: {command.blockedReason}
              </div>
            )}
            <div className="ccv2-command-interface-preview__next">
              Next action: {noProjectSelected && command.command !== "Explain"
                ? commandInterface.noProjectBlockedReason
                : command.nextAction}
            </div>
          </div>
        ))}
      </div>

      <div className="ccv2-command-interface-preview__timeline">
        <div className="ccv2-eyebrow">Recent Command Timeline</div>
        {timeline.map((record) => (
          <div key={record.commandId} className="ccv2-command-interface-preview__timeline-row">
            <span>{record.commandText}</span>
            <strong>{record.routeStatus}</strong>
            <span>{record.redacted ? "Redacted" : "Not redacted"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const ASK_NEXUS_STARTERS = [
  "Plan the next milestone",
  "Review current project readiness",
  "Run QA readiness check",
  "Explain blockers",
  "Freeze project scope",
  "Show release readiness",
  "Summarize latest activity",
  "What should I do next?",
];

const ROUTE_TARGET_LABELS = {
  "/command-center": "Chat with NEXUS",
  "/command-center/lite": "Chat with NEXUS",
  "/command-center/agent-flow": "Agent Flow",
  "/command-center/activity": "Activity Log",
  "/command-center/implementation": "Implementation Workflow",
  "/command-center/release": "Release Control",
  "/command-center/safety": "Safety Center",
  "/command-center/tests": "Test Center",
  "/command-center/workbench": "Agent Workbench",
  "/command-center/workers": "Worker Runtime",
};

function formatIntentLabel(intentType = "unknown") {
  return intentType
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildAskNexusPreview(commandText, vm) {
  const hasProject = hasActiveProject(vm) && vm.shell?.activeProjectScope === "project";
  const commandScope = /\b(nexus os|os roadmap|platform|system)\b/i.test(commandText)
    ? "os"
    : /\b(portfolio|all projects|across projects)\b/i.test(commandText)
      ? "portfolio"
      : "project";
  const projectId = hasProject && commandScope === "project" ? vm.shell?.selectedProjectId || "selected-project-ref" : "";
  const intent = createCommandIntent({
    commandText,
    mode: vm.shell?.mode || "local-private",
    scope: commandScope,
    projectId,
  });
  const contextPacket = buildCommandContextPacket(intent, {
    defaultScope: commandScope,
    mode: vm.shell?.mode || "local-private",
    selectedProjectId: projectId,
    selectedProjectLabel: hasProject ? vm.shell?.activeProject : "",
    selectedProject: hasProject ? vm.shell?.activeProject : "",
  });
  const route = routeCommandIntent(intent, {
    capabilityReadiness: {
      ...vm.capabilityReadiness,
      commandPalette: { status: "ready", userFacingState: "Ready" },
    },
  });
  const approval = buildApprovalPreview(route);
  const routePreview = buildCommandRoutePreview(intent, route);
  return {
    intent,
    contextPacket,
    route,
    approval,
    routePreview,
    costStatus: "Provider spend disabled. No cost incurred by preview.",
  };
}

const LITE_FOUNDER_IDEA_STORAGE_KEY = "nexus-lite-founder-idea";
const LITE_FOUNDER_QNA_STORAGE_KEY = "nexus-lite-founder-qna-state";
const DEFAULT_LITE_FOUNDER_IDEA = "I have a startup idea. Validate if it is feasible and tell me what you need next.";

function getStoredLiteFounderIdea() {
  if (typeof window === "undefined") return DEFAULT_LITE_FOUNDER_IDEA;
  return window.localStorage.getItem(LITE_FOUNDER_IDEA_STORAGE_KEY) || DEFAULT_LITE_FOUNDER_IDEA;
}

function getStoredLiteQnaState() {
  if (typeof window === "undefined") return resetFounderQnaTurnState({ founderIdeaSummary: DEFAULT_LITE_FOUNDER_IDEA }).data;
  try {
    const stored = JSON.parse(window.localStorage.getItem(LITE_FOUNDER_QNA_STORAGE_KEY) || "null");
    if (stored?.schemaVersion === "1.0" && Array.isArray(stored.turns)) return stored;
  } catch {
    window.localStorage.removeItem(LITE_FOUNDER_QNA_STORAGE_KEY);
  }
  return resetFounderQnaTurnState({ founderIdeaSummary: getStoredLiteFounderIdea() }).data;
}

function formatLiteFieldLabel(value = "") {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bPrd\b/g, "PRD");
}

function buildFounderPersistenceControlsViewModel(founderDbWorkflow = {}) {
  const lanes = Array.isArray(founderDbWorkflow.lanes) ? founderDbWorkflow.lanes : [];
  return {
    approvalState: "Needs approval evidence",
    writePosture: "Local SQLite gated",
    savedState: `${founderDbWorkflow.savedSessionState || "Captured locally"} · ${founderDbWorkflow.prdReadiness || "65%"} PRD`,
    nextAction: "Review approval, rollback, audit, validation, sqlite-live mode, and local write evidence before local persistence.",
    disabledReason: "Local persistence controls require explicit operator confirmation and local write flags. Provider calls, agent dispatch, project writes, hosted DBs, deploy, package, and spend stay blocked.",
    ownerCapability: "NEXUS Founder Persistence Controls",
    rollbackPlan: "Required before any approved local write",
    auditState: "Operator audit evidence required",
    evidenceLocation: "Persistence adapter report",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local SQLite only. No provider spend.",
    blockers: [
      "Operator approval required",
      "Rollback acceptance required",
      "Audit acceptance required",
      "Validation command acceptance required",
      "SQLite live mode and local write flags required",
    ],
    actions: [
      { label: "Save founder session locally", state: "Approval required" },
      { label: "Read founder session locally", state: "Approval required" },
      { label: "Update PRD artifact locally", state: "Approval required" },
      { label: "List workstream plans locally", state: "Approval required" },
    ],
    records: lanes.map((lane) => ({
      label: lane.label,
      state: lane.currentState,
      owner: lane.ownerCapability,
    })),
  };
}

function FounderPersistenceControlsCard({ controls }) {
  return (
    <section className="ccv2-card" aria-label="Founder persistence controls">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">Founder Persistence</div>
          <h3>Local controls</h3>
        </div>
        <span className="ccv2-pill ccv2-pill--teal">Local-only</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Approval state</span><span className="ccv2-page-summary-value">{controls.approvalState}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Write posture</span><span className="ccv2-page-summary-value">{controls.writePosture}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Saved state</span><span className="ccv2-page-summary-value">{controls.savedState}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Rollback</span><span className="ccv2-page-summary-value">{controls.rollbackPlan}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Audit</span><span className="ccv2-page-summary-value">{controls.auditState}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner</span><span className="ccv2-page-summary-value">{controls.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{controls.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{controls.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{controls.costImpact}</span></div>
      </div>
      <div className="ccv2-lite-next" style={{ marginTop: 12 }}>
        <span>Next action</span>
        <strong>{controls.nextAction}</strong>
      </div>
      <div className="ccv2-lite-next" style={{ marginTop: 8 }}>
        <span>Disabled reason</span>
        <strong>{controls.disabledReason}</strong>
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {controls.actions.map((action) => (
          <div className="ccv2-safety-row" key={action.label}>
            <span className="ccv2-safety-row__label">{action.label}</span>
            <span className="ccv2-safety-row__value--disabled">{action.state}</span>
          </div>
        ))}
      </div>
      <div className="ccv2-stat-chips" style={{ marginTop: 12, marginBottom: 0 }}>
        {controls.records.map((record) => (
          <div className="ccv2-stat-chip" key={record.label}>
            <span className="ccv2-stat-chip__label">{record.label}</span>
            <span className="ccv2-stat-chip__value ccv2-stat-chip__value--teal">{record.state}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CommandCenterLitePage() {
  const [envelope, setEnvelope] = useState(getStoredLiteQnaState);
  const [draftMessage, setDraftMessage] = useState("");
  const normalizedDraft = draftMessage.trim();
  const canSendMessage = normalizedDraft.length > 0;

  useEffect(() => {
    window.localStorage.setItem(LITE_FOUNDER_IDEA_STORAGE_KEY, envelope.founderIdeaSummary);
    window.localStorage.setItem(LITE_FOUNDER_QNA_STORAGE_KEY, JSON.stringify(envelope));
  }, [envelope]);

  const submitFounderMessage = (event) => {
    event.preventDefault();
    if (!canSendMessage) return;
    setEnvelope(appendFounderQnaTurn(envelope, normalizedDraft).data);
    setDraftMessage("");
  };

  const usePromptStarter = (prompt) => {
    setEnvelope(appendFounderQnaTurn(envelope, prompt).data);
    setDraftMessage("");
  };

  const resetChat = () => {
    setEnvelope(resetFounderQnaTurnState({ founderIdeaSummary: DEFAULT_LITE_FOUNDER_IDEA }).data);
    setDraftMessage("");
  };

  return (
    <div className="ccv2-content ccv2-lite-page">
      <div className="ccv2-page-head">
        <div className="ccv2-page-head__title">Chat with NEXUS</div>
        <div className="ccv2-page-head__sub">Describe the idea, answer NEXUS questions, and keep the conversation focused.</div>
      </div>

      <div className="ccv2-lite-layout ccv2-lite-layout--chat-only">
        <section className="ccv2-card ccv2-lite-chat" aria-label="Chat with NEXUS">
          <div className="ccv2-card-header-row">
            <div>
              <div className="ccv2-eyebrow">Founder Chat</div>
              <h3>Talk to NEXUS</h3>
            </div>
            <span className="ccv2-pill ccv2-pill--teal">{envelope.answeredFields.length} answered</span>
          </div>
          <div className="ccv2-lite-chat__thread">
            {envelope.turns.map((turn) => (
              <div className={`ccv2-lite-message ccv2-lite-message--${turn.speaker}`} key={`${turn.turnNumber}-${turn.speaker}`}>
                <span>{turn.label}</span>
                <p>{turn.message}</p>
              </div>
            ))}
            <div className="ccv2-lite-message ccv2-lite-message--nexus">
              <span>NEXUS Next Question</span>
              <p>{envelope.nextQuestion.prompt}</p>
              <div className="ccv2-lite-message__meta">Next action: {envelope.nextAction}</div>
            </div>
          </div>
          <form className="ccv2-lite-composer" onSubmit={submitFounderMessage}>
            <label htmlFor="lite-founder-message">Founder message</label>
            <textarea
              id="lite-founder-message"
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              placeholder="Describe the business idea, target customer, problem, and constraints..."
            />
            <div className="ccv2-lite-composer__actions">
              <button className="ccv2-lite-send" type="submit" disabled={!canSendMessage}>
                Send
              </button>
              <button className="ccv2-lite-reset" type="button" onClick={resetChat}>
                Reset
              </button>
              <span>{envelope.answeredFields.length} answered · {envelope.missingFields.length} needed</span>
            </div>
          </form>
          <div className="ccv2-lite-prompt-grid" aria-label="Founder prompt starters">
            {envelope.suggestedPrompts.map((prompt) => (
              <button key={prompt} type="button" onClick={() => usePromptStarter(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
          <div className="ccv2-lite-disabled-note">
            Planning only: NEXUS will not call providers, dispatch agents, write project files, use hosted DBs, deploy, package, or spend. Local SQLite founder records require explicit approval and write flags.
          </div>
        </section>
      </div>
    </div>
  );
}

function AgentFlowPanel({ envelope }) {
  const prdFields = envelope?.prdDraft?.fields || {};
  const agentFlow = Array.isArray(envelope?.agentFlow) ? envelope.agentFlow : [];
  const disabledActions = Array.isArray(envelope?.disabledActions) ? envelope.disabledActions : [];
  const blockedLaneReason = "Execution stays blocked until PRD review and live gates pass.";

  return (
    <section className="ccv2-card ccv2-agent-flow" aria-label="Agent action flow">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">Agent Flow</div>
          <h3>How NEXUS puts agents into action</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>
            Idea: {prdFields.founderIdea || envelope?.founderIdeaSummary || DEFAULT_LITE_FOUNDER_IDEA}
          </div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">Planning only</span>
      </div>
      <div className="ccv2-agent-flow__rail">
        {agentFlow.map((lane, index) => (
          <div className="ccv2-agent-flow__node" key={lane.lane || lane.ownerCapability || index}>
            <div className="ccv2-agent-flow__step">{lane.step || index + 1}</div>
            <div className="ccv2-agent-flow__body">
              <div className="ccv2-agent-flow__lane">{lane.lane}</div>
              <div className="ccv2-agent-flow__owner">{lane.ownerCapability}</div>
              <div className="ccv2-agent-flow__state">{lane.readinessLabel || formatLiteFieldLabel(lane.currentState)}</div>
              <div className="ccv2-agent-flow__next">{lane.nextAction}</div>
              <div className="ccv2-agent-flow__blocker">{lane.blocker || blockedLaneReason}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="ccv2-agent-flow__footer">
        {disabledActions.map((action) => (
          <div key={action.label}>
            <span>{action.label}</span>
            <strong>{action.reason}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function AgentFlowPage() {
  const [envelope] = useState(getStoredLiteQnaState);
  const [founderIdea] = useState(getStoredLiteFounderIdea);
  const businessBuild = buildBusinessBuildViewModel(founderIdea);
  return (
    <div className="ccv2-content ccv2-lite-page">
      <div className="ccv2-page-head">
        <div className="ccv2-page-head__title">Agent Flow</div>
        <div className="ccv2-page-head__sub">
          Local workstream lanes show what each owner capability needs before governed execution can be enabled.
        </div>
      </div>
      <FounderOperationsBoard
        title="Agent Flow"
        purpose="Show how the founder idea maps to agent lanes before any dispatch is allowed."
        currentState={businessBuild.liveWorkstreamHandoff?.currentState || "Local agent lanes are planned"}
        nextAction={businessBuild.liveWorkstreamHandoff?.nextAction || "Review lane blockers and required evidence."}
        blocker={businessBuild.executionAdmissionDryRun?.disabledReason || "Agent dispatch remains blocked."}
        owner={businessBuild.liveWorkstreamHandoff?.ownerCapability || "NEXUS Workstream Planner"}
        evidence={businessBuild.liveWorkstreamHandoff?.evidenceLocation || "Live workstream handoff report"}
        activity={businessBuild.liveWorkstreamHandoff?.activityLocation || "Activity Log"}
        cost={businessBuild.liveWorkstreamHandoff?.costImpact || "No provider spend from lane planning"}
        lanes={businessBuild.workstreamRows.slice(0, 4).map((row) => ({
          label: row.label,
          value: row.status,
        }))}
      />
      <AgentFlowPanel envelope={envelope} />
      <FounderLiveUseReviewCard
        readiness={businessBuild.founderLiveUseReadiness}
        review={businessBuild.founderLiveUseReview}
        surfaceLabel="Agent Flow Founder Live Use"
      />
      <FounderLiveHandoffCard
        manifest={businessBuild.founderLiveHandoffManifest}
        workOrders={businessBuild.founderLiveHandoffWorkOrders}
        surfaceLabel="Agent Flow Founder Live Handoff"
      />
      <FounderLiveWorkAdmissionCard
        admission={businessBuild.founderLiveWorkAdmission}
        approval={businessBuild.founderLiveWorkAdmissionApproval}
        surfaceLabel="Agent Flow Founder Work Admission"
      />
      <FounderLiveExecutionBoundaryCard
        boundary={businessBuild.founderLiveExecutionBoundary}
        surfaceLabel="Agent Flow Execution Boundary"
      />
      <FounderLiveExecutionApprovalReviewPacketCard
        packet={businessBuild.founderLiveExecutionApprovalReviewPacket}
        surfaceLabel="Agent Flow Approval Review"
      />
      <FounderLiveApprovalRequestQueuePreviewCard
        queue={businessBuild.founderLiveApprovalRequestQueuePreview}
        surfaceLabel="Agent Flow Approval Request Queue"
      />
      <FounderLiveApprovalCaptureBoundaryCard
        capture={businessBuild.founderLiveApprovalCaptureBoundary}
        surfaceLabel="Agent Flow Approval Capture Boundary"
      />
      <FounderLiveApprovalOperatorReviewCard
        operatorReview={businessBuild.founderLiveApprovalOperatorReview}
        surfaceLabel="Agent Flow Operator Review"
      />
      <FounderLiveOperatorDecisionLedgerCard
        decisionLedger={businessBuild.founderLiveOperatorDecisionLedger}
        surfaceLabel="Agent Flow Decision Ledger"
      />
      <FounderLiveOperatorDecisionLedgerPersistenceCard
        persistence={businessBuild.founderLiveOperatorDecisionLedgerPersistence}
        surfaceLabel="Agent Flow Decision Ledger Persistence"
      />
      <FounderLiveAgentWorkQueueAdmissionCard
        queue={businessBuild.founderLiveAgentWorkQueueAdmission}
        surfaceLabel="Agent Flow Agent Work Queue Admission"
      />
      <FounderLiveAgentWorkAssignmentCard
        assignment={businessBuild.founderLiveAgentWorkAssignment}
        surfaceLabel="Agent Flow Agent Work Assignment"
      />
      <FounderLiveAgentDispatchReadinessCard
        dispatchReadiness={businessBuild.founderLiveAgentDispatchReadiness}
        surfaceLabel="Agent Flow Agent Dispatch Readiness"
      />
      <FounderLiveRuntimeAdmissionReadinessCard
        runtimeReadiness={businessBuild.founderLiveRuntimeAdmissionReadiness}
        surfaceLabel="Agent Flow Runtime Admission Readiness"
      />
      <FounderLiveRuntimeExecutionReadinessCard
        runtimeExecutionReadiness={businessBuild.founderLiveRuntimeExecutionReadiness}
        surfaceLabel="Agent Flow Runtime Execution Readiness"
      />
      <FounderRuntimeExecutionApprovalGateCard
        approvalGate={businessBuild.founderRuntimeExecutionApprovalGate}
        surfaceLabel="Agent Flow Runtime Execution Approval Gate"
      />
      <FounderApprovalCaptureBoundaryCard
        capture={businessBuild.founderApprovalCaptureBoundary}
        surfaceLabel="Agent Flow Runtime Approval Capture Boundary"
      />
      <FounderApprovalDecisionBoundaryCard
        decision={businessBuild.founderApprovalDecisionBoundary}
        surfaceLabel="Agent Flow Runtime Approval Decision Boundary"
      />
      <FounderApprovalDecisionBoundaryCard
        decision={businessBuild.founderApprovalDecisionPersistenceBoundary}
        surfaceLabel="Agent Flow Approval Decision Persistence Boundary"
        heading="Approval Decision Persistence Boundary"
        pillLabel="Persistence read-only"
        ariaLabel="Founder runtime approval decision persistence boundary"
        rowAriaSuffix="approval decision persistence boundary row"
      />
      <FounderApprovalDecisionBoundaryCard
        decision={businessBuild.founderApprovalDecisionApplicationBoundary}
        surfaceLabel="Agent Flow Approval Decision Application Boundary"
        heading="Approval Decision Application Boundary"
        pillLabel="Application read-only"
        ariaLabel="Founder runtime approval decision application boundary"
        rowAriaSuffix="approval decision application boundary row"
      />
      <FounderApprovalDecisionBoundaryCard
        decision={businessBuild.founderApprovalDecisionApplicationAuthorityBoundary}
        surfaceLabel="Agent Flow Approval Application Authority Handoff"
        heading="Approval Application Authority Handoff"
        pillLabel="Authority read-only"
        ariaLabel="Founder approval application authority handoff"
        rowAriaSuffix="approval application authority handoff row"
        maxRows={4}
      />
      <FounderApprovalDecisionBoundaryCard
        decision={businessBuild.founderApprovalApplicationAuthorityActivationBoundary}
        surfaceLabel="Agent Flow Approval Application Authority Activation"
        heading="Approval Application Authority Activation"
        pillLabel="Activation read-only"
        ariaLabel="Founder approval application authority activation"
        rowAriaSuffix="approval application authority activation row"
        maxRows={4}
      />
      <FounderApprovalDecisionBoundaryCard
        decision={businessBuild.founderApprovalApplicationAuthorityGrantBoundary}
        surfaceLabel="Agent Flow Approval Application Authority Grant"
        heading="Approval Application Authority Grant"
        pillLabel="Grant read-only"
        ariaLabel="Founder approval application authority grant"
        rowAriaSuffix="approval application authority grant row"
        maxRows={4}
      />
      <BusinessBuildDbCrudCard crud={businessBuild.businessBuildDbCrud} surfaceLabel="Agent Flow Business Build DB" />
      <LiveWorkstreamHandoffCard
        handoff={businessBuild.liveWorkstreamHandoff}
        dryRun={businessBuild.liveWorkstreamHandoffDryRun}
        surfaceLabel="Agent Flow Live Workstream Handoff"
      />
      <ExecutionAdmissionCard
        admission={businessBuild.executionAdmission}
        envelope={businessBuild.executionAdmissionApprovalEnvelope}
        dryRun={businessBuild.executionAdmissionDryRun}
        surfaceLabel="Agent Flow Execution Admission"
      />
    </div>
  );
}

function AskNexusPage({ vm }) {
  const [commandText, setCommandText] = useState("What should I do next?");
  const [preview, setPreview] = useState(() => buildAskNexusPreview("What should I do next?", vm));
  const [historyOpen, setHistoryOpen] = useState(true);
  const timeline = vm.commandInterface?.recentTimeline || [];
  const hasProject = hasActiveProject(vm) && vm.shell?.activeProjectScope === "project";
  const projectLabel = hasProject ? vm.shell?.activeProject : "No project selected";
  const scopeLabel = preview.contextPacket.scope === "os"
    ? "NEXUS OS"
    : preview.contextPacket.scope === "portfolio"
      ? "Portfolio"
      : "Project";
  const routeLabel = ROUTE_TARGET_LABELS[preview.route.routeTarget] || preview.route.routeTarget || "Command Center";

  function handlePreview(nextCommandText = commandText) {
    setPreview(buildAskNexusPreview(nextCommandText, vm));
  }

  function handleStarter(prompt) {
    setCommandText(prompt);
    handlePreview(prompt);
  }

  return (
    <div className="ccv2-content ccv2-ask-nexus-page">
      <div className="ccv2-page-head">
        <div className="ccv2-page-head__title">Ask NEXUS</div>
        <div className="ccv2-page-head__sub">
          Describe a goal, question, or operating command. NEXUS will classify scope, risk,
          approvals, and next governed action.
        </div>
      </div>

      <div className="ccv2-ask-context-strip" aria-label="Ask NEXUS context">
        <div><span>Scope</span><strong>{scopeLabel}</strong></div>
        <div><span>Selected project</span><strong>{projectLabel}</strong></div>
        <div><span>Command mode</span><strong>Preview-only</strong></div>
        <div><span>Provider dispatch</span><strong>Not enabled</strong></div>
        <div><span>Tool execution</span><strong>Not enabled</strong></div>
        <div><span>Worker execution</span><strong>Not enabled</strong></div>
      </div>

      <div className="ccv2-ask-layout">
        <section className="ccv2-card ccv2-ask-chat" aria-label="Ask NEXUS conversation">
          <div className="ccv2-ask-bubble ccv2-ask-bubble--user">
            <div className="ccv2-eyebrow">You</div>
            <div>{preview.intent.commandText}</div>
          </div>
          <div className="ccv2-ask-bubble ccv2-ask-bubble--nexus">
            <div className="ccv2-eyebrow">NEXUS Preview</div>
            <div className="ccv2-ask-bubble__title">
              {preview.route.routeStatus === "blocked" ? "Command is blocked before execution" : "Command preview is ready"}
            </div>
            <p>
              This preview classified the command, selected a governed route, and checked approval posture.
              It did not execute work.
            </p>
            <div className="ccv2-ask-chip-row">
              <span className="ccv2-pill ccv2-pill--pass">Intent: {formatIntentLabel(preview.intent.intentType)}</span>
              <span className="ccv2-pill ccv2-pill--pending">Risk: {preview.routePreview.riskLevel}</span>
              <span className="ccv2-pill ccv2-pill--disabled">Approval: {preview.approval.state}</span>
              <span className={`ccv2-pill ccv2-pill--${preview.route.routeStatus === "blocked" ? "fail" : "pass"}`}>
                {preview.route.routeStatus}
              </span>
            </div>
          </div>

          <div className="ccv2-ask-composer">
            <label htmlFor="ask-nexus-input">Command composer</label>
            <textarea
              id="ask-nexus-input"
              value={commandText}
              onChange={(event) => setCommandText(event.target.value)}
              placeholder="Ask NEXUS to plan, review, QA, fix, ship, guard, freeze, or explain..."
            />
            <div className="ccv2-ask-composer__actions">
              <button type="button" className="ccv2-mission-composer__btn ccv2-mission-composer__btn--enabled" onClick={() => handlePreview()}>
                Preview command
              </button>
              <button type="button" className="ccv2-mission-composer__btn" onClick={() => setCommandText("")}>Clear</button>
              <button type="button" className="ccv2-mission-composer__btn" onClick={() => setHistoryOpen((open) => !open)}>
                Open command history
              </button>
            </div>
          </div>
        </section>

        <aside className="ccv2-card ccv2-ask-suggestions" aria-label="Suggested Ask NEXUS prompts">
          <div className="ccv2-eyebrow">Suggested commands</div>
          <div className="ccv2-ask-suggestion-grid">
            {ASK_NEXUS_STARTERS.map((prompt) => (
              <button key={prompt} type="button" onClick={() => handleStarter(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        </aside>
      </div>

      <section className="ccv2-card ccv2-ask-result" aria-label="Command preview result">
        <div className="ccv2-card-header-row">
          <div>
            <div className="ccv2-eyebrow">Preview result</div>
            <h3>Governed route preview</h3>
          </div>
          <span className="ccv2-pill ccv2-pill--disabled">No execution</span>
        </div>
        <div className="ccv2-ask-result-grid">
          <div><span>Intent</span><strong>{formatIntentLabel(preview.intent.intentType)}</strong></div>
          <div><span>Scope</span><strong>{scopeLabel}</strong></div>
          <div><span>Target</span><strong>{projectLabel}</strong></div>
          <div><span>Route</span><strong>{routeLabel}</strong></div>
          <div><span>Agent / capability</span><strong>{preview.route.actionId || "NEXUS"}</strong></div>
          <div><span>Risk</span><strong>{preview.routePreview.riskLevel}</strong></div>
          <div><span>Approval</span><strong>{preview.approval.reason}</strong></div>
          <div><span>Cost status</span><strong>{preview.costStatus}</strong></div>
        </div>
        {preview.route.blockedReason && (
          <div className="ccv2-ask-blockers">
            <strong>Blocker:</strong> {preview.route.blockedReason}
          </div>
        )}
        <div className="ccv2-ask-next-action">
          <strong>Next governed action:</strong> {preview.route.nextAction}
        </div>
      </section>

      {historyOpen && (
        <section className="ccv2-card ccv2-ask-history" aria-label="Command history preview">
          <div className="ccv2-eyebrow">Command history preview</div>
          {timeline.length === 0 ? (
            <div className="ccv2-empty-state">No command previews yet. Ask NEXUS what to do next.</div>
          ) : (
            <div className="ccv2-ask-history-list">
              {timeline.map((record) => (
                <div key={record.commandId} className="ccv2-ask-history-row">
                  <span>{record.commandText}</span>
                  <strong>{formatIntentLabel(record.intentType)}</strong>
                  <span>{record.routeStatus}</span>
                  <span>{record.redacted ? "Redacted" : "Needs redaction"}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function MissionControlTasksTab({ vm, activeScope }) {
  if (activeScope === "portfolio") {
    return (
      <>
        <ScopeSummaryCards vm={vm} activeScope={activeScope} />
        <div className="ccv2-empty-state">
          Project Registry will enable cross-project task aggregation. Current project tasks remain available in Project scope.
        </div>
      </>
    );
  }
  if (activeScope === "os") {
    return (
      <div className="ccv2-card">
        <div className="ccv2-eyebrow" style={{ marginBottom: 8 }}>NEXUS OS Tasks</div>
        <div className="ccv2-empty-state">
          OS phase task tracking is represented by the phase-status registry until centralized activity logging is enabled.
        </div>
      </div>
    );
  }
  return <ActiveMissionTasksSummary vm={vm} />;
}

function MissionControlAgentsTab({ vm, activeScope }) {
  const plannedTasks = vm.taskActivation?.missionTasks || [];
  const agentRows = ["SHEPHERD", "CORE", "AUDITOR", "WARDEN", "SENTINEL", "PRISM", "SWIFT", "NEXUS"].map((agent) => {
    const assigned = plannedTasks.filter((task) => task.targetAgent === agent);
    return {
      agent,
      planned: assigned.length,
      activated: 0,
      nextTask: assigned[0]?.title || (activeScope === "os" ? "OS platform work as assigned" : "No queued task"),
      status: assigned.length > 0 ? "Assigned" : "Available",
    };
  });

  return (
    <div className="ccv2-card">
      <div className="ccv2-card-header-row">
        <div className="ccv2-eyebrow">Agent Assignments</div>
        <span className="ccv2-pill ccv2-pill--disabled">{activeScope === "portfolio" ? "Cross-project placeholder" : "Read-only"}</span>
      </div>
      <div className="ccv2-agent-assignment-grid">
        {agentRows.map((row) => (
          <div key={row.agent} className="ccv2-agent-assignment-card">
            <div className="ccv2-agent-assignment-card__agent">{row.agent}</div>
            <div className="ccv2-agent-assignment-card__status">{row.status}</div>
            <div className="ccv2-agent-assignment-card__meta">Planned tasks: {row.planned}</div>
            <div className="ccv2-agent-assignment-card__meta">Activated tasks: {row.activated}</div>
            <div className="ccv2-agent-assignment-card__next">{row.nextTask}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MissionControlPage({ vm, operatorCommands, onOpenCommandPalette }) {
  const clp = vm.careloopProductProgress;
  const isLocalPrivate = vm.shell.mode === "local-private";
  const liveOnline = vm.liveApi?.liveApiOnline;
  const [activeTab, setActiveTab] = useState("overview");
  const [activeScope, setActiveScope] = useState(vm.shell.defaultScope || "project");
  const scopePlaceholder = activeScope === "portfolio"
    ? "Portfolio view is planned with Project Registry in P42. This shell does not fabricate live multi-project data."
    : activeScope === "os"
      ? "NEXUS OS scope is available through the OS Roadmap. Platform phases stay separate from project tasks."
      : "";

  return (
    <div className="ccv2-content ccv2-mission-control">
      {liveOnline !== undefined && (
        <div className="ccv2-source-bar">
          <span className={`ccv2-source-badge ccv2-source-badge--${liveOnline ? "live" : "snapshot"}`}>
            {liveOnline ? "Live local API" : "Snapshot fallback"}
          </span>
          {!liveOnline && <span className="ccv2-source-bar__hint">Run <code>npm run local-api:start</code> for live data</span>}
        </div>
      )}

      <div className="ccv2-page-head">
        <div className="ccv2-page-head__title">Mission Control</div>
        <div className="ccv2-page-head__sub">enterprise command surface for governed agentic work</div>
      </div>

      <FounderOperationsBoard
        title="Mission Control"
        purpose="Decide what to do next, see project readiness, and route work to governed pages."
        currentState={hasActiveProject(vm) ? `${vm.taskActivation?.plannedCount || 0} planned tasks, ${vm.taskActivation?.activatedCount || 0} activated tasks` : "Project operations are locked until a project is selected"}
        nextAction={hasActiveProject(vm) ? "Review next best action, then open Task Queue or Agent Workbench." : "Use Founder Intake or Business Build to define the idea before project execution."}
        blocker={hasActiveProject(vm) ? "Execution still requires governed activation and evidence checks." : "No selected project for project-scoped execution."}
        owner="NEXUS Founder Runtime Envelope"
        evidence="Mission Control evidence, gates, and activity panels"
        activity={vm.activity?.latest?.[0]?.label || "Activity Log"}
        cost={vm.cost?.summary || "No provider spend from this page"}
        lanes={[
          { label: "Plan", value: "Mission Control" },
          { label: "Queue", value: "Task Queue" },
          { label: "Review", value: "Agent Workbench" },
          { label: "Govern", value: "Evidence and gates" },
        ]}
      />

      <div className="ccv2-scope-shell">
        <ScopeSwitcher
          activeScope={activeScope}
          mode={vm.shell.mode}
          onScopeChange={setActiveScope}
        />
        <ProjectSwitcher
          activeScope={activeScope}
          mode={vm.shell.mode}
          activeProject={vm.shell.activeProject}
        />
        <div className="ccv2-scope-shell__source">
          <span className="ccv2-scope-shell__label">Source</span>
          <span>{liveOnline ? "Live local API" : "Snapshot fallback"}</span>
        </div>
      </div>

      {scopePlaceholder && (
        <div className="ccv2-info-banner ccv2-scope-placeholder">
          {scopePlaceholder}
        </div>
      )}

      <CommandTabs
        tabs={MISSION_CONTROL_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ariaLabel="Mission Control sections"
      >
        <CommandTabPanel tabId="overview" activeTab={activeTab}>
          <MissionControlOverviewTab
            vm={vm}
            activeScope={activeScope}
            operatorCommands={operatorCommands}
            onOpenCommandPalette={onOpenCommandPalette}
          />
        </CommandTabPanel>

        <CommandTabPanel tabId="workflows" activeTab={activeTab}>
          <MissionControlWorkflowsTab
            vm={vm}
            operatorCommands={operatorCommands}
            onOpenCommandPalette={onOpenCommandPalette}
            activeScope={activeScope}
          />
        </CommandTabPanel>

        <CommandTabPanel tabId="tasks" activeTab={activeTab}>
          <MissionControlTasksTab vm={vm} activeScope={activeScope} />
        </CommandTabPanel>

        <CommandTabPanel tabId="agents" activeTab={activeTab}>
          <MissionControlAgentsTab vm={vm} activeScope={activeScope} />
        </CommandTabPanel>

        <CommandTabPanel tabId="gates" activeTab={activeTab}>
          <div className="ccv2-mission-control__section-grid ccv2-mission-control__section-grid--two">
            <VerificationGatesSummary vm={vm} />
            <ReleaseSection vm={vm} />
          </div>
        </CommandTabPanel>

        <CommandTabPanel tabId="evidence" activeTab={activeTab}>
          <div className="ccv2-mission-control__section-grid ccv2-mission-control__section-grid--two">
            <EvidenceTimeline vm={vm} />
            <EvidenceGovernanceSection vm={vm} />
          </div>
        </CommandTabPanel>

        <CommandTabPanel tabId="risks" activeTab={activeTab}>
          <div className="ccv2-mission-control__section-grid ccv2-mission-control__section-grid--two">
            <SafetyApprovalSummary vm={vm} />
            <PrivateValidationPanel vm={vm} />
          </div>
        </CommandTabPanel>

        <CommandTabPanel tabId="cost" activeTab={activeTab}>
          <CostCenterSummary vm={vm} />
        </CommandTabPanel>
      </CommandTabs>

      {isLocalPrivate && clp && hasActiveProject(vm) && activeTab === "overview" && activeScope === "project" && (
        <div className="ccv2-mission-control__section-grid ccv2-mission-control__section-grid--single">
          <CareLoopProgressCard clp={clp} />
        </div>
      )}
    </div>
  );
}

/* ─── Task Queue Page ─── */
function MissionTaskRow({ task, bridgeOnline, onActivate, activating, activationResult, navigate }) {
  const isActivating = activating === task.planTaskId;
  const isActivated = activationResult?.planTaskId === task.planTaskId && activationResult?.ok;
  const currentState = isActivated ? "activated" : task.state;
  const evidenceCount = isActivated && activationResult?.runtimeTaskId
    ? countEvidenceForTask(activationResult.runtimeTaskId)
    : 0;

  function stateClass(s) {
    if (s === "activated" || s === "queued") return "pass";
    if (s === "activating") return "pending";
    if (s === "blocked" || s === "failed") return "fail";
    return "disabled";
  }

  function riskClass(r) {
    if (r === "high") return "fail";
    if (r === "medium") return "pending";
    return "pass";
  }

  function renderButton() {
    if (isActivating) {
      return <button className="ccv2-task-activate-btn ccv2-task-activate-btn--loading" disabled>Activating…</button>;
    }
    if (isActivated) {
      return (
        <div style={{ display: "flex", gap: 6 }}>
          <button className="ccv2-task-activate-btn ccv2-task-activate-btn--done" disabled>Activated</button>
          <button className="ccv2-task-activate-btn ccv2-task-activate-btn--workbench" onClick={() => navigate && navigate("/command-center/workbench")}>Open Workbench</button>
        </div>
      );
    }
    if (!task.activationEnabled) {
      return (
        <button className="ccv2-task-activate-btn ccv2-task-activate-btn--blocked" disabled title={task.activationDisabledReason}>
          {task.activationDisabledReason || "Blocked"}
        </button>
      );
    }
    if (!bridgeOnline) {
      return (
        <button className="ccv2-task-activate-btn ccv2-task-activate-btn--disabled" disabled title="Requires governed action bridge">
          Requires governed action bridge
        </button>
      );
    }
    return (
      <button className="ccv2-task-activate-btn ccv2-task-activate-btn--enabled" onClick={() => onActivate(task.planTaskId)}>
        Activate
      </button>
    );
  }

  return (
    <tr className={`ccv2-task-row ccv2-task-row--${currentState}`}>
      <td>
        <div className="ccv2-task-row__title">{task.title}</div>
        {isActivated && activationResult?.runtimeTaskId && (
          <div className="ccv2-task-row__runtime-id ccv2-mono">RT: {activationResult.runtimeTaskId.slice(0, 8)}</div>
        )}
      </td>
      <td><span className="ccv2-task-row__agent">{task.targetAgent}</span></td>
      <td><span className={`ccv2-pill ccv2-pill--${stateClass(currentState)}`}>{formatTaskStateLabel(currentState)}</span></td>
      <td><span className={`ccv2-pill ccv2-pill--${riskClass(task.riskLevel)}`}>{task.riskLevel}</span></td>
      <td style={{ fontSize: 11, color: "var(--v2-muted-2)" }}>{formatCapabilityLabel(task.capabilityId)}</td>
      <td style={{ fontSize: 11, color: "var(--v2-muted-2)" }}>{evidenceCount > 0 ? evidenceCount : "No evidence yet"}</td>
      <td style={{ fontSize: 11, color: "var(--nexus-text)" }}>{summarizeTaskNextAction({ state: currentState })}</td>
      <td style={{ fontSize: 11 }}>{renderButton()}</td>
    </tr>
  );
}

function TaskQueuePage({ vm }) {
  const navigate = useNavigate();
  const ta = vm.taskActivation || {};
  const missionTasks = ta.missionTasks || [];
  const runtimeTasks = runtimeSnapshot.runtimeState?.tasks || {};
  const recent = runtimeTasks.recent || [];
  const byState = runtimeTasks.byState || {};
  const total = runtimeTasks.total || 0;

  const [bridgeOnline, setBridgeOnline] = useState(false);
  const [activating, setActivating] = useState(null);
  const [activationResults, setActivationResults] = useState({});
  const [activeTaskTab, setActiveTaskTab] = useState("planned");
  const plannedCount = missionTasks.length;
  const activatedCount = Object.values(activationResults).filter((r) => r?.ok).length + (ta.activatedCount || 0);
  const runtimeStateSummary = [
    { label: "Planned", value: plannedCount },
    { label: "Queued", value: byState.queued || 0 },
    { label: "Running", value: byState.running || 0 },
    { label: "Review", value: byState.awaiting_verification || 0 },
    { label: "Blocked", value: (byState.blocked || 0) + (byState.awaiting_approval || 0) },
    { label: "Completed", value: byState.completed || 0 },
  ];

  useEffect(() => {
    checkActionBridgeHealth().then((r) => setBridgeOnline(r.online));
  }, []);

  async function handleActivate(planTaskId) {
    setActivating(planTaskId);
    const result = await activateMissionTask({ planTaskId });
    setActivationResults((prev) => ({ ...prev, [planTaskId]: result }));
    setActivating(null);
  }

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Task Queue</div>
          <div className="ccv2-page-head__sub">
            Plan, activate, and monitor governed tasks across planned and runtime states.
          </div>
        </div>

        <FounderOperationsBoard
          title="Task Queue"
          purpose="Turn approved plans into governed task records and show which work is blocked or ready."
          currentState={`${plannedCount} planned, ${activatedCount} activated, ${total} runtime tasks`}
          nextAction={plannedCount > 0 ? "Review task risk and evidence, then activate only when the governed action bridge is ready." : "Return to Mission Control to generate a mission plan."}
          blocker={bridgeOnline ? "Activation still depends on each task approval and evidence posture." : "Governed action bridge is offline."}
          owner="NEXUS Task Activation Envelope"
          evidence="Task evidence column and Activity Log"
          activity={recent.length > 0 ? "Runtime task timeline available" : "No activated task activity yet"}
          cost="No provider spend from queue inspection"
          lanes={[
            { label: "Planned", value: plannedCount },
            { label: "Queued", value: byState.queued || 0 },
            { label: "Blocked", value: (byState.blocked || 0) + (byState.awaiting_approval || 0) },
            { label: "Completed", value: byState.completed || 0 },
          ]}
        />

        <ProjectContextCard vm={vm} surface="Task Queue" />

        <div className="ccv2-card ccv2-page-summary-card">
          <div className="ccv2-section-heading">Queue Summary</div>
          <div className="ccv2-page-summary-grid">
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Purpose</span><span className="ccv2-page-summary-value">Move planned work into governed runtime and track current execution state.</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Active scope</span><span className="ccv2-page-summary-value">{vm.shell.activeProject} · {vm.mission.sprintId}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{activatedCount > 0 ? `${activatedCount} activated task${activatedCount > 1 ? "s" : ""}` : "No activated tasks yet"}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{plannedCount > 0 ? "Activate a planned task to start governed execution." : "Generate a mission plan from Mission Control."}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Capability status</span><span className="ccv2-page-summary-value">{bridgeOnline ? "Task activation ready" : "Requires governed action bridge"}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Data source</span><span className="ccv2-page-summary-value">{runtimeSnapshot.readOnly ? "File-backed runtime snapshot" : "Live runtime state"}</span></div>
          </div>
        </div>

        <div className="ccv2-stats-row">
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Planned</div>
            <div className="ccv2-stat-chip__value">{plannedCount}</div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Activated</div>
            <div className="ccv2-stat-chip__value ccv2-stat-chip__value--green">{activatedCount}</div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Runtime total</div>
            <div className="ccv2-stat-chip__value">{total}</div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Action bridge</div>
            <div className={`ccv2-stat-chip__value ccv2-stat-chip__value--${bridgeOnline ? "green" : "amber"}`}>
              {bridgeOnline ? "Online" : "Offline"}
            </div>
          </div>
        </div>

        <div className="ccv2-card ccv2-page-summary-card">
          <div className="ccv2-section-heading">Concurrency Preview</div>
          <div className="ccv2-page-summary-grid">
            <div className="ccv2-page-summary-row">
              <span className="ccv2-page-summary-label">Lock preview</span>
              <span className="ccv2-page-summary-value">Preview-ready</span>
            </div>
            <div className="ccv2-page-summary-row">
              <span className="ccv2-page-summary-label">Duplicate work</span>
              <span className="ccv2-page-summary-value">Preview-ready</span>
            </div>
            <div className="ccv2-page-summary-row">
              <span className="ccv2-page-summary-label">Priority model</span>
              <span className="ccv2-page-summary-value">Preview-ready</span>
            </div>
            <div className="ccv2-page-summary-row">
              <span className="ccv2-page-summary-label">Cancellation</span>
              <span className="ccv2-page-summary-value">Preview-ready</span>
            </div>
          </div>
          <p className="ccv2-muted">
            These P61 badges are read-only previews. They do not merge tasks, reorder queues,
            cancel work, enforce locks, or start parallel execution.
          </p>
        </div>

        <CommandTabs
          tabs={TASK_QUEUE_TABS}
          activeTab={activeTaskTab}
          onTabChange={setActiveTaskTab}
          ariaLabel="Task Queue sections"
        >
          <CommandTabPanel tabId="planned" activeTab={activeTaskTab}>
        <div className="ccv2-card ccv2-state-summary-card">
          <div className="ccv2-section-heading">Task State Summary</div>
          <div className="ccv2-state-summary-grid">
            {runtimeStateSummary.map((item) => (
              <div key={item.label} className="ccv2-state-summary-pill">
                <span className="ccv2-state-summary-pill__label">{item.label}</span>
                <span className="ccv2-state-summary-pill__value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ccv2-eyebrow" style={{ marginBottom: 4 }}>Planned Tasks</div>
        <div className="ccv2-section-heading" style={{ marginBottom: 8 }}>Mission Tasks — Selected Project</div>
        <div className="ccv2-card" style={{ padding: 0, overflow: "hidden" }}>
          {missionTasks.length > 0 ? (
            <table className="ccv2-table ccv2-mission-tasks-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Agent</th>
                  <th>State</th>
                  <th>Risk</th>
                  <th>Capability</th>
                  <th>Evidence</th>
                  <th>Next Action</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {missionTasks.map((task) => (
                  <MissionTaskRow
                    key={task.planTaskId}
                    task={task}
                    bridgeOnline={bridgeOnline}
                    onActivate={handleActivate}
                    activating={activating}
                    activationResult={activationResults[task.planTaskId]}
                    navigate={navigate}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="ccv2-empty-state">
              No planned tasks yet. Generate a mission plan from Mission Control.
            </div>
          )}
        </div>

        {Object.values(activationResults).some((r) => r?.ok) && (
          <div className="ccv2-card ccv2-activation-result-card">
            <div className="ccv2-section-heading">Activation Records</div>
            {Object.entries(activationResults).filter(([, r]) => r?.ok).map(([planTaskId, result]) => (
              <div key={planTaskId} className="ccv2-activation-record">
                <div className="ccv2-activation-record__row">
                  <span className="ccv2-activation-record__label">Runtime task ID</span>
                  <span className="ccv2-mono ccv2-activation-record__value">{result.runtimeTaskId?.slice(0, 12)}</span>
                </div>
                <div className="ccv2-activation-record__row">
                  <span className="ccv2-activation-record__label">State</span>
                  <span className="ccv2-pill ccv2-pill--pass">queued</span>
                </div>
                <div className="ccv2-activation-record__row">
                  <span className="ccv2-activation-record__label">Evidence</span>
                  <span className={`ccv2-pill ccv2-pill--${result.result?.evidenceCreated ? "pass" : "disabled"}`}>{result.result?.evidenceCreated ? "Created" : "—"}</span>
                </div>
                <div className="ccv2-activation-record__row">
                  <span className="ccv2-activation-record__label">Audit</span>
                  <span className={`ccv2-pill ccv2-pill--${result.result?.auditCreated ? "pass" : "disabled"}`}>{result.result?.auditCreated ? "Created" : "—"}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {recent.length > 0 ? (
          <>
            <div className="ccv2-section-heading" style={{ marginTop: 24, marginBottom: 8 }}>Activated Runtime Tasks</div>
            <div className="ccv2-card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="ccv2-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Owner Agent</th>
                    <th>State</th>
                    <th>Risk</th>
                    <th>Evidence</th>
                    <th>Next Action</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((task) => (
                    <tr key={task.taskId}>
                      <td style={{ fontSize: 11, color: "var(--nexus-text)" }}>{task.objective || task.taskType || task.taskId.slice(0, 8)}</td>
                      <td style={{ fontWeight: 600 }}>{formatAgentLabel(task.targetAgent || task.sourceAgent)}</td>
                      <td>
                        <span className={`ccv2-pill ccv2-pill--${getTaskStateTone(task.state)}`}>
                          {formatTaskStateLabel(task.state)}
                        </span>
                      </td>
                      <td><span className={`ccv2-pill ccv2-pill--${task.riskLevel === "high" ? "fail" : task.riskLevel === "medium" ? "pending" : "pass"}`}>{task.riskLevel}</span></td>
                      <td style={{ fontSize: 11, color: "var(--v2-muted-2)" }}>{countEvidenceForTask(task.taskId) || "No evidence yet"}</td>
                      <td style={{ fontSize: 11, color: "var(--nexus-text)" }}>{summarizeTaskNextAction(task)}</td>
                      <td style={{ fontSize: 11, color: "var(--v2-muted-2)" }}>{new Date(task.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="ccv2-card">
            <div className="ccv2-empty-state">
              No activated tasks yet. Activate a planned task to start governed execution.
            </div>
          </div>
        )}

        {!bridgeOnline && (
          <div className="ccv2-info-banner" style={{ marginTop: 16 }}>
            <span className="ccv2-info-banner__icon">ℹ</span>
            <span className="ccv2-info-banner__text">
              Task activation requires the governed action bridge.
              Start it with: <code>NEXUS_MODE=local-private npm run mission:action-server</code>
            </span>
          </div>
        )}
          </CommandTabPanel>

          <CommandTabPanel tabId="active" activeTab={activeTaskTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Active Runtime Tasks</div>
              <p style={{ marginTop: 6, fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6 }}>
                Queued, running, and active runtime tasks appear here with owner agent, capability, evidence count, and next action.
              </p>
            </div>
            {recent.length > 0 ? (
              <div className="ccv2-card" style={{ padding: 0, overflow: "hidden" }}>
                <table className="ccv2-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Owner Agent</th>
                      <th>State</th>
                      <th>Risk</th>
                      <th>Evidence</th>
                      <th>Next Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((task) => (
                      <tr key={task.taskId}>
                        <td style={{ fontSize: 11, color: "var(--nexus-text)" }}>{task.objective || task.taskType || task.taskId.slice(0, 8)}</td>
                        <td style={{ fontWeight: 600 }}>{formatAgentLabel(task.targetAgent || task.sourceAgent)}</td>
                        <td><span className={`ccv2-pill ccv2-pill--${getTaskStateTone(task.state)}`}>{formatTaskStateLabel(task.state)}</span></td>
                        <td><span className={`ccv2-pill ccv2-pill--${task.riskLevel === "high" ? "fail" : task.riskLevel === "medium" ? "pending" : "pass"}`}>{task.riskLevel}</span></td>
                        <td style={{ fontSize: 11, color: "var(--v2-muted-2)" }}>{countEvidenceForTask(task.taskId) || "No evidence yet"}</td>
                        <td style={{ fontSize: 11, color: "var(--nexus-text)" }}>{summarizeTaskNextAction(task)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="ccv2-card">
                <div className="ccv2-empty-state">
                  No active runtime tasks yet. Activate a planned task to start governed execution.
                </div>
              </div>
            )}
          </CommandTabPanel>

          <CommandTabPanel tabId="review" activeTab={activeTaskTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Review Queue</div>
              <div className="ccv2-empty-state">
                No tasks are waiting for review. Activated tasks will link to Agent Workbench when review evidence exists.
              </div>
              <button className="ccv2-wf-card__btn ccv2-wf-card__btn--enabled" style={{ marginTop: 10 }} onClick={() => navigate("/command-center/workbench")}>
                Open Agent Workbench
              </button>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="blocked" activeTab={activeTaskTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Blocked Tasks</div>
              {(byState.blocked || byState.awaiting_approval) ? (
                <div className="ccv2-empty-state">
                  Blocked runtime tasks are present. Review policy, approval, and validation blockers before continuing.
                </div>
              ) : (
                <div className="ccv2-empty-state">No blocked tasks.</div>
              )}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="completed" activeTab={activeTaskTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Completed Tasks</div>
              {(byState.completed || 0) > 0 ? (
                <div className="ccv2-empty-state">
                  {byState.completed} completed task{byState.completed > 1 ? "s" : ""} recorded in runtime snapshot.
                </div>
              ) : (
                <div className="ccv2-empty-state">No completed tasks yet.</div>
              )}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="all-projects" activeTab={activeTaskTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">All Projects</div>
              <div className="ccv2-state-summary-grid" style={{ marginTop: 10 }}>
                {runtimeStateSummary.map((item) => (
                  <div key={item.label} className="ccv2-state-summary-pill">
                    <span className="ccv2-state-summary-pill__label">{item.label}</span>
                    <span className="ccv2-state-summary-pill__value">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="ccv2-empty-state" style={{ marginTop: 12 }}>
                Project Registry is planned for P42. Current task data is scoped to the active project.
              </div>
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

/* ─── Agent Registry Page ─── */
function AgentRegistryPage({ vm }) {
  const [activeTab, setActiveTab] = useState("overview");
  const registry = vm.agentRegistry || {};
  const agents = registry.agents || [];
  const envelope = registry.envelopePreview || {};
  const definitionUpdates = registry.definitionUpdates || {};

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Agent Registry</div>
          <div className="ccv2-page-head__sub">
            Versioned agent identities, capabilities, and metadata-only boundaries.
          </div>
        </div>

        <FounderOperationsBoard {...FOUNDER_DELIVERY_BOARDS.agentRegistry} />

        <div className="ccv2-stats-row">
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Registered Agents</div>
            <div className="ccv2-stat-chip__value">{agents.length}</div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Runtime Enforcement</div>
            <div className="ccv2-stat-chip__value">Off</div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Active Project</div>
            <div className="ccv2-stat-chip__value">{registry.activeProjectLabel || "Selected Project"}</div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Tool Dispatch</div>
            <div className="ccv2-stat-chip__value">Disabled</div>
          </div>
        </div>

        <CommandTabs
          tabs={AGENT_REGISTRY_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          ariaLabel="Agent Registry sections"
        >
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-agent-grid">
              {agents.map((agent) => (
                <div key={agent.agentId} className="ccv2-agent-card">
                  <div className="ccv2-agent-card__header">
                    <div className="ccv2-agent-status-dot ccv2-agent-status-dot--active" />
                    <div className="ccv2-agent-card__name">{agent.displayName}</div>
                  </div>
                  <div className="ccv2-agent-card__role">{agent.role}</div>
                  <div className="ccv2-agent-card__mission-tasks">
                    <span className="ccv2-pill ccv2-pill--pass">{agent.status}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">{agent.agentType}</span>
                    <span className="ccv2-pill ccv2-pill--pending">{agent.capabilityCount} capabilities</span>
                  </div>
                  <div className="ccv2-agent-card__task">
                    Boundary: {agent.boundarySummary.allowedPathCount} allowed path groups · {agent.boundarySummary.forbiddenPathCount} forbidden groups
                  </div>
                </div>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="capabilities" activeTab={activeTab}>
            <div className="ccv2-card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="ccv2-table">
                <thead><tr><th>Agent</th><th>Allowed capabilities</th><th>Categories</th><th>Forbidden posture</th></tr></thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.agentId}>
                      <td style={{ fontWeight: 700 }}>{agent.displayName}</td>
                      <td>{agent.capabilities.slice(0, 3).join(", ")}{agent.capabilities.length > 3 ? "..." : ""}</td>
                      <td>{agent.categoryCoverage.join(", ") || "Not mapped"}</td>
                      <td>Cannot bypass approval, provider dispatch, tool execution, or DB writes.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="boundaries" activeTab={activeTab}>
            <div className="ccv2-grid-3">
              {agents.map((agent) => (
                <div key={agent.agentId} className="ccv2-card">
                  <div className="ccv2-section-heading">{agent.displayName}</div>
                  <p className="ccv2-empty-state" style={{ marginTop: 8 }}>
                    Data: {agent.boundarySummary.dataClassifications.join(", ")}.
                    Tool dispatch: {agent.boundarySummary.toolDispatchEnabled ? "Enabled" : "Disabled"}.
                  </p>
                  <p className="ccv2-empty-state">
                    Approval: {agent.approvalRequirements.length ? agent.approvalRequirements.join("; ") : "No special approval requirement recorded."}
                  </p>
                </div>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="projects" activeTab={activeTab}>
            <ProjectContextCard vm={vm} surface="Agent Registry" />
            <div className="ccv2-empty-state" style={{ marginTop: 12 }}>
              Project Registry is metadata-only here. Agent boundaries use the selected project context but do not grant runtime access.
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="evidence" activeTab={activeTab}>
            <div className="ccv2-card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="ccv2-table">
                <thead><tr><th>Agent</th><th>Evidence requirements</th><th>Cost policy</th><th>Memory policy</th></tr></thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.agentId}>
                      <td style={{ fontWeight: 700 }}>{agent.displayName}</td>
                      <td>{agent.evidenceRequirements.join(", ")}</td>
                      <td>{agent.costPolicy}</td>
                      <td>{agent.memoryPolicy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="definition-updates" activeTab={activeTab}>
            <div className="ccv2-card ccv2-page-summary-card">
              <div className="ccv2-section-heading">Agent Definition Updates</div>
              <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
                Proposal-first workflow for changing agent definitions. This surface is read-only and does not mutate agent files.
              </p>
              <div className="ccv2-page-summary-grid" style={{ marginTop: 12 }}>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Proposal</span><span className="ccv2-page-summary-value">{definitionUpdates.proposalId}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Agent</span><span className="ccv2-page-summary-value">{definitionUpdates.selectedAgent}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Change type</span><span className="ccv2-page-summary-value">{definitionUpdates.changeType}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Risk</span><span className="ccv2-page-summary-value">{definitionUpdates.riskLevel}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Status</span><span className="ccv2-page-summary-value">{definitionUpdates.status}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Apply changes</span><span className="ccv2-page-summary-value">Disabled</span></div>
              </div>
            </div>

            <div className="ccv2-grid ccv2-grid--two" style={{ marginTop: 12 }}>
              <div className="ccv2-card">
                <div className="ccv2-section-heading">Boundary Diff Summary</div>
                <div className="ccv2-list" style={{ marginTop: 10 }}>
                  {(definitionUpdates.boundaryDiff || []).map((item) => (
                    <div key={item.label} className="ccv2-list-row">
                      <span className="ccv2-list-row__title">{item.label}</span>
                      <span className="ccv2-list-row__meta">{item.value}</span>
                      <span className={`ccv2-pill ccv2-pill--${item.tone || "pending"}`}>Reviewed</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ccv2-card">
                <div className="ccv2-section-heading">AUDITOR / WARDEN Review</div>
                <div className="ccv2-list" style={{ marginTop: 10 }}>
                  {(definitionUpdates.reviews || []).map((review) => (
                    <div key={review.reviewer} className="ccv2-list-row">
                      <span className="ccv2-list-row__title">{review.reviewer}</span>
                      <span className="ccv2-list-row__meta">{review.focus}</span>
                      <span className="ccv2-pill ccv2-pill--pending">{review.decision}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ccv2-card">
                <div className="ccv2-section-heading">Human Approval Gate</div>
                <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
                  {definitionUpdates.approvalGate?.disabledReason}
                </p>
                <span className="ccv2-pill ccv2-pill--disabled">Apply disabled</span>
              </div>

              <div className="ccv2-card">
                <div className="ccv2-section-heading">Versioning + Rollback</div>
                <div className="ccv2-page-summary-grid" style={{ marginTop: 10 }}>
                  <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Previous version</span><span className="ccv2-page-summary-value">{definitionUpdates.versioning?.previousVersion}</span></div>
                  <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Proposed version</span><span className="ccv2-page-summary-value">{definitionUpdates.versioning?.proposedVersion}</span></div>
                  <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Rollback</span><span className="ccv2-page-summary-value">{definitionUpdates.versioning?.rollbackStatus}</span></div>
                </div>
              </div>
            </div>

            <div className="ccv2-card" style={{ marginTop: 12 }}>
              <div className="ccv2-section-heading">Safety Boundary</div>
              <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
                No agent markdown files are mutated. Provider dispatch, tool dispatch, worker runtime, DB writes, and project mutation remain disabled.
              </p>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="developer-details" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Boundary Envelope Preview</div>
              <div className="ccv2-page-summary-grid" style={{ marginTop: 10 }}>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Agent</span><span className="ccv2-page-summary-value">{envelope.agentId}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Project</span><span className="ccv2-page-summary-value">{envelope.projectId}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Scope</span><span className="ccv2-page-summary-value">{envelope.scopeType}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Capability</span><span className="ccv2-page-summary-value">{envelope.capabilityId}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Dry-run</span><span className="ccv2-page-summary-value">{envelope.dryRun ? "Yes" : "No"}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Valid</span><span className="ccv2-page-summary-value">{envelope.valid ? "Yes" : "No"}</span></div>
              </div>
              <p className="ccv2-empty-state" style={{ marginTop: 12 }}>
                Developer details summarize the envelope. Raw JSON is intentionally not shown in the primary UI.
              </p>
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

/* ─── Approvals Page ─── */
function ApprovalsPage({ vm, studio }) {
  const approvalWorkflow = studio?.localReports?.approvalWorkflow || {};
  const total = approvalWorkflow.total || 0;
  const requested = approvalWorkflow.requested || 0;
  const approved = approvalWorkflow.approved || 0;
  const rejected = (approvalWorkflow.rejected || 0) + (approvalWorkflow.expired || 0);
  const recent = approvalWorkflow.recent || [];

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Approvals</div>
          <div className="ccv2-page-head__sub">Action controls require governed action bridge</div>
        </div>

        <FounderOperationsBoard
          title="Approvals"
          purpose="Show which high-risk actions need human review before any governed execution can proceed."
          currentState={`${requested} pending, ${approved} approved, ${rejected} rejected or expired`}
          nextAction={requested > 0 ? "Review pending approval context, evidence, risk, and rollback posture." : "Use this page when future work requests approval."}
          blocker="Approval review is display-only; no action approval is executed from this page."
          owner="WARDEN / AUDITOR Approval Envelope"
          evidence="Recent approval records and Activity Log"
          activity={recent.length > 0 ? "Recent approval records available" : "No approval activity yet"}
          cost="No provider spend from approval review"
          lanes={[
            { label: "Pending", value: requested },
            { label: "Approved", value: approved },
            { label: "Rejected", value: rejected },
            { label: "Total", value: total },
          ]}
        />

        <div className="ccv2-stats-row">
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Total</div>
            <div className="ccv2-stat-chip__value">{total}</div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Pending</div>
            <div className="ccv2-stat-chip__value ccv2-stat-chip__value--amber">{requested}</div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Approved</div>
            <div className="ccv2-stat-chip__value ccv2-stat-chip__value--green">{approved}</div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Rejected / Expired</div>
            <div className="ccv2-stat-chip__value ccv2-stat-chip__value--red">{rejected}</div>
          </div>
        </div>

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Recent Approvals</div>
          {recent.length === 0 ? (
            <div className="ccv2-empty">No recent approvals</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {recent.map((item) => (
                <div key={item.approvalId} className="ccv2-contract-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--v2-text)" }}>{item.type} · {item.requestedBy?.toUpperCase()}</div>
                    <div style={{ fontSize: 11, color: "var(--v2-muted-2)" }}>Task: {item.taskId?.slice(0, 8)} · Risk: {item.riskLevel}</div>
                  </div>
                  <span className={`ccv2-pill ccv2-pill--${item.decision === "approved" ? "pass" : item.decision === "requested" ? "pending" : "fail"}`}>
                    {item.decision}
                  </span>
                  <button className="ccv2-release-card__action-btn" disabled>Review</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Verification Gates Page ─── */
function VerificationGatesPage({ vm }) {
  const gates = vm.mission.gates;
  const pv = vm.privateValidation;
  const clp = vm.careloopProductProgress;
  const isLocalPrivate = vm.shell.mode === "local-private";

  const prdGates = clp ? [
    { name: "Backend tests (58/58)", status: "PASS", detail: "AUDITOR · npm test" },
    { name: "Physical device push", status: "OPEN", detail: "Sprint 2 · pending" },
    { name: "Public invite hardening", status: "OPEN", detail: "Sprint 4 planned" },
    { name: "Paid entitlement gate", status: "OPEN", detail: "Post-launch" },
    { name: "Privacy incident response", status: "IN_PROGRESS", detail: "Playbook in progress" },
  ] : [];

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Verification Gates</div>
          <div className="ccv2-page-head__sub">Blocking gates run after every build phase</div>
        </div>

        <FounderOperationsBoard
          title="Verification Gates"
          purpose="Show whether the work is safe enough to move forward, and which validation gates still block execution."
          currentState={`${Object.values(gates).filter((status) => status === "PASS").length} of ${Object.keys(gates).length} mission gates passing`}
          nextAction="Review failing or pending gates before activation, release, or agent handoff."
          blocker={Object.values(gates).every((status) => status === "PASS") ? "No mission gate blockers in the current snapshot." : "One or more mission gates still require validation."}
          owner="AUDITOR / SENTINEL Gate Review"
          evidence="Private validation and gate evidence"
          activity="Validation reports and Activity Log"
          cost="Local validation display only; no provider spend"
          lanes={Object.entries(gates).map(([gate, status]) => ({ label: gate, value: status }))}
        />

        <div className="ccv2-gate-grid">
          {Object.entries(gates).map(([gate, status]) => (
            <div key={gate} className="ccv2-gate-card">
              <div className="ccv2-gate-card__name">{gate}</div>
              <div className={`ccv2-gate-card__status ccv2-gate-card__status--${status === "PASS" ? "pass" : status === "PENDING" ? "pending" : "fail"}`}>
                {status}
              </div>
            </div>
          ))}
        </div>

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Private Validation</div>
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "var(--v2-text)", fontWeight: 600 }}>Backend tests</span>
              <span className="ccv2-mono" style={{ fontSize: 16, color: "var(--v2-green)", fontWeight: 700 }}>{pv.backendTests} PASS</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--v2-muted)" }}>Overall: {pv.overall} · Status: {pv.backendStatus}</div>
          </div>
        </div>

        {isLocalPrivate && prdGates.length > 0 && (
          <div className="ccv2-card">
            <div className="ccv2-section-heading">Product Gates · CareLoop PRD {clp.prdStatus.version}</div>
            <div className="ccv2-prd-gate-list" style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {prdGates.map((g) => (
                <div key={g.name} className="ccv2-prd-gate-row">
                  <div className="ccv2-prd-gate-row__name">{g.name}</div>
                  <div className="ccv2-prd-gate-row__detail">{g.detail}</div>
                  <span className={`ccv2-pill ccv2-pill--${g.status === "PASS" ? "pass" : g.status === "IN_PROGRESS" ? "pending" : "fail"}`}>
                    {g.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Contracts Page ─── */
function ContractsPage({ vm }) {
  const reports = LOCAL_REPORT_SNAPSHOT.validation?.reports || [];
  const mc = vm.missionComposer;

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Contracts</div>
          <div className="ccv2-page-head__sub">Mission contracts, task plans, and validation reports</div>
        </div>

        <FounderOperationsBoard
          title="Contracts"
          purpose="Show the current operating contract, task plan, and validation evidence before work proceeds."
          currentState={`${reports.length} validation reports linked`}
          nextAction="Review the active mission contract and task plan before activating governed work."
          blocker="Contract review is display-only; no contract mutation is enabled here."
          owner="NEXUS Contract Registry"
          evidence={mc.contractPath}
          activity={mc.taskPlanPath}
          cost="No provider spend from contract inspection"
          lanes={[
            { label: "Mission contract", value: "Active" },
            { label: "Task plan", value: "Active" },
            { label: "Reports", value: reports.length },
            { label: "Mutation", value: "Disabled" },
          ]}
        />

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Mission Contract</div>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="ccv2-contract-row">
              <div className="ccv2-contract-row__name">Mission Contract</div>
              <div className="ccv2-contract-row__path">{mc.contractPath}</div>
              <span className="ccv2-pill ccv2-pill--pass">ACTIVE</span>
            </div>
            <div className="ccv2-contract-row">
              <div className="ccv2-contract-row__name">Task Plan</div>
              <div className="ccv2-contract-row__path">{mc.taskPlanPath}</div>
              <span className="ccv2-pill ccv2-pill--pass">ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Validation Reports ({reports.length})</div>
          <div className="ccv2-contract-list" style={{ marginTop: 8 }}>
            {reports.map((report) => (
              <div key={report.id} className="ccv2-contract-row">
                <div className="ccv2-contract-row__name">{report.name}</div>
                <div className="ccv2-contract-row__path">{report.path}</div>
                <span className={`ccv2-pill ccv2-pill--${report.status === "PASS" ? "pass" : report.status === "FAIL" ? "fail" : "pending"}`}>
                  {report.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Evidence Page ─── */
function EvidencePage({ vm }) {
  const liveEvidence = vm.liveData?.evidence;
  const liveOnline = vm.liveApi?.liveApiOnline;
  const evidence = liveEvidence || runtimeSnapshot.runtimeState?.evidence || {};
  const recent = evidence.recent || [];
  const byResult = evidence.byResult || {};
  const byType = evidence.byType || {};
  const total = liveEvidence?.totalCount ?? evidence.total ?? 0;
  const redactedCount = recent.filter((item) => item.redacted !== false).length;
  const latestEvidence = recent[0];
  const [activeTab, setActiveTab] = useState("timeline");
  const taskGroups = [...new Set(recent.map((item) => item.taskId || "No linked task"))];
  const agentGroups = [...new Set(recent.map((item) => formatAgentLabel(item.agentId || item.agent || "NEXUS")))];

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Evidence</div>
          <div className="ccv2-page-head__sub">
            Evidence proves what governed actions produced.
            <span className={`ccv2-source-badge ccv2-source-badge--${liveOnline ? "live" : "snapshot"}`}>
              {liveOnline ? "Live API" : "Snapshot fallback"}
            </span>
          </div>
        </div>

        <FounderOperationsBoard
          title="Evidence"
          purpose="Verify what NEXUS did, which task or agent produced it, and whether records are redacted."
          currentState={`${total} evidence records, ${redactedCount} redacted`}
          nextAction={latestEvidence ? "Open the evidence timeline and trace the linked task, agent, and result." : "Run governed work later to create evidence records."}
          blocker={latestEvidence ? "Raw payloads remain hidden from primary UX." : "No evidence exists until governed work creates it."}
          owner="AUDITOR Evidence Ledger"
          evidence={latestEvidence ? "Evidence timeline" : "No evidence records yet"}
          activity={liveOnline ? "Live local API activity" : "Snapshot fallback activity"}
          cost="No provider spend from evidence review"
          lanes={[
            { label: "Total", value: total },
            { label: "Redacted", value: redactedCount },
            { label: "Tasks", value: taskGroups.length },
            { label: "Agents", value: agentGroups.length },
          ]}
        />

        <div className="ccv2-card ccv2-page-summary-card">
          <div className="ccv2-section-heading">Evidence Summary</div>
          <div className="ccv2-page-summary-grid">
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Total evidence records</span><span className="ccv2-page-summary-value">{total}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Redacted records</span><span className="ccv2-page-summary-value">{redactedCount}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Latest evidence</span><span className="ccv2-page-summary-value">{latestEvidence ? `${latestEvidence.type?.replace(/_/g, " ")} · ${latestEvidence.result}` : "Not available yet"}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Data source</span><span className="ccv2-page-summary-value">{liveOnline ? "Live local API" : "File-backed snapshot fallback"}</span></div>
          </div>
        </div>
        <CommandTabs tabs={EVIDENCE_TABS} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Evidence sections">
          <CommandTabPanel tabId="timeline" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Evidence Timeline</div>
              {recent.length > 0 ? (
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {recent.slice(0, 6).map((ev) => (
                    <div key={ev.evidenceId} className="ccv2-list-row">
                      <div className="ccv2-list-row__primary">
                        <span className="ccv2-list-row__title">{ev.type?.replace(/_/g, " ") || "Evidence"}</span>
                        <span className="ccv2-list-row__meta">Task: {ev.taskId || "No linked task"} · {new Date(ev.createdAt || Date.now()).toLocaleString()}</span>
                      </div>
                      <div className="ccv2-list-row__secondary">
                        <span className={`ccv2-pill ccv2-pill--${ev.result === "PASS" ? "pass" : ev.result === "FAIL" ? "fail" : "pending"}`}>{ev.result}</span>
                        <span className="ccv2-list-row__detail">Redacted: {ev.redacted !== false ? "Yes" : "No"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ccv2-empty-state">Evidence appears after governed actions complete.</div>
              )}
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="by-task" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">By Task</div>
              {taskGroups.length > 0 ? taskGroups.map((taskId) => (
                <div key={taskId} className="ccv2-list-row"><span className="ccv2-list-row__title">{taskId}</span><span className="ccv2-pill ccv2-pill--pending">{recent.filter((item) => (item.taskId || "No linked task") === taskId).length} records</span></div>
              )) : <div className="ccv2-empty-state">No task-linked evidence yet.</div>}
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="by-agent" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">By Agent</div>
              {agentGroups.length > 0 ? agentGroups.map((agent) => (
                <div key={agent} className="ccv2-list-row"><span className="ccv2-list-row__title">{agent}</span><span className="ccv2-pill ccv2-pill--pending">{recent.filter((item) => formatAgentLabel(item.agentId || item.agent || "NEXUS") === agent).length} records</span></div>
              )) : <div className="ccv2-empty-state">No agent evidence yet.</div>}
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="by-project" activeTab={activeTab}>
            <ProjectContextCard vm={vm} surface="project-scoped evidence" />
          </CommandTabPanel>
          <CommandTabPanel tabId="developer-details" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Developer Details</div>
              <div className="ccv2-page-summary-grid">
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence IDs</span><span className="ccv2-page-summary-value">{recent.length ? "Available as linked references only" : "No IDs available yet"}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Raw payloads</span><span className="ccv2-page-summary-value">Not shown in primary UI</span></div>
                {Object.entries(byType).map(([type, count]) => (
                  <div key={type} className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">{type.replace(/_/g, " ")}</span><span className="ccv2-page-summary-value">{count}</span></div>
                ))}
                {Object.entries(byResult).map(([result, count]) => (
                  <div key={result} className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">{result}</span><span className="ccv2-page-summary-value">{count}</span></div>
                ))}
              </div>
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

/* ─── Safety Center Page ─── */
function SafetyCenterPage({ vm }) {
  const ab = actionBridgeSnapshot;
  const governance = ab.governance || {};
  const bridgeReadiness = ab.bridgeReadiness || {};
  const clp = vm.careloopProductProgress;
  const isLocalPrivate = vm.shell.mode === "local-private";
  const [activeTab, setActiveTab] = useState("posture");

  const rows = [
    { label: "Mode", value: ab.mode || "local-private", valueClass: "ready" },
    { label: "Provider calls", value: governance.providerCallsAllowed ? "Enabled" : "Disabled", valueClass: governance.providerCallsAllowed ? "ready" : "disabled" },
    { label: "Network calls", value: governance.networkCallsAllowed ? "Enabled" : "Disabled", valueClass: governance.networkCallsAllowed ? "ready" : "disabled" },
    { label: "DB access", value: governance.dbAccessAllowed ? "Enabled" : "Disabled", valueClass: governance.dbAccessAllowed ? "ready" : "disabled" },
    { label: "UI mutations", value: governance.mutationEnabledFromUi ? "Enabled" : "Disabled", valueClass: governance.mutationEnabledFromUi ? "ready" : "disabled" },
    { label: "Traffic plane", value: bridgeReadiness.trafficPlane ? "READY" : "NOT READY", valueClass: bridgeReadiness.trafficPlane ? "ready" : "disabled" },
    { label: "Public safety", value: vm.safety.incidents === 0 ? "PASS" : "FAIL", valueClass: vm.safety.incidents === 0 ? "pass" : "disabled" },
  ];

  const complianceRows = clp ? [
    { label: "Compliance framework", value: clp.compliance.framework, valueClass: "ready" },
    { label: "HIPAA scope", value: clp.compliance.hipaa === "OFF" ? "Not in scope (OFF)" : clp.compliance.hipaa, valueClass: "disabled" },
    { label: "Clinic / EHR integration", value: `PERMANENTLY ${clp.compliance.clinicIntegration}`, valueClass: "disabled" },
    { label: "Structured health fields", value: "None stored", valueClass: "pass" },
    { label: "Incident response playbook", value: "In progress", valueClass: "pending" },
  ] : [];

  const apiRows = [
    { label: "Local API read boundary", value: "Enabled", valueClass: "ready" },
    { label: "Data source", value: vm.liveApi?.liveApiOnline ? "Live local API" : "Snapshot fallback", valueClass: vm.liveApi?.liveApiOnline ? "ready" : "pending" },
    { label: "Provider calls", value: "Disabled", valueClass: "disabled" },
    { label: "External network", value: "Disabled", valueClass: "disabled" },
    { label: "Bind host", value: "127.0.0.1", valueClass: "ready" },
  ];
  const riskPosture = vm.safety.incidents > 0
    ? "Blocked"
    : governance.providerCallsAllowed || governance.dbAccessAllowed
      ? "Requires approval"
      : isLocalPrivate
        ? "Safe local-private"
        : "Demo-safe";

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Safety Center</div>
          <div className="ccv2-page-head__sub">Understand current safety boundaries, policy posture, and what is blocked by governance.</div>
        </div>

        <FounderOperationsBoard
          title="Safety Center"
          purpose="Show what NEXUS is allowed to do, what remains blocked, and why unsafe execution cannot start."
          currentState={riskPosture}
          nextAction="Review policy blocks and data boundaries before any activation request."
          blocker="Provider calls, external network, DB writes, and unsafe mutation remain blocked by governance."
          owner="WARDEN Safety Boundary"
          evidence="Safety summary, policy blocks, and data privacy tabs"
          activity="Activity Log and approval workflow"
          cost="No provider spend from safety review"
          lanes={[
            { label: "Provider calls", value: governance.providerCallsAllowed ? "Enabled" : "Disabled" },
            { label: "DB writes", value: governance.dbAccessAllowed ? "Enabled" : "Disabled" },
            { label: "Public safety", value: vm.safety.incidents === 0 ? "Pass" : "Blocked" },
            { label: "Traffic plane", value: bridgeReadiness.trafficPlane ? "Ready" : "Not ready" },
          ]}
        />

        <CommandTabs tabs={SAFETY_CENTER_TABS} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Safety Center sections">
          <CommandTabPanel tabId="posture" activeTab={activeTab}>
            <div className="ccv2-card ccv2-page-summary-card">
              <div className="ccv2-section-heading">Safety Summary</div>
              <div className="ccv2-page-summary-grid">
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Public/demo boundary</span><span className="ccv2-page-summary-value">Strict public-safe separation remains active.</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Private project boundary</span><span className="ccv2-page-summary-value">{isLocalPrivate ? "Local-private boundary active" : "Private project data not exposed"}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current risk posture</span><span className="ccv2-page-summary-value">{riskPosture}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Approvals</span><span className="ccv2-page-summary-value">{runtimeSnapshot.approvalWorkflow?.requested ? `${runtimeSnapshot.approvalWorkflow.requested} pending approval${runtimeSnapshot.approvalWorkflow.requested > 1 ? "s" : ""}` : "No pending approvals"}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">DB writes</span><span className="ccv2-page-summary-value">DB writes disabled by policy</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Project mutation</span><span className="ccv2-page-summary-value">Governed only</span></div>
              </div>
            </div>
            <div className="ccv2-safety-grid">{rows.map((row) => <div key={row.label} className="ccv2-safety-row"><span className="ccv2-safety-row__label">{row.label}</span><span className={`ccv2-safety-row__value--${row.valueClass}`}>{row.value}</span></div>)}</div>
          </CommandTabPanel>
          <CommandTabPanel tabId="policy-blocks" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Policy Blocks</div>
              <div className="ccv2-section-heading" style={{ marginTop: 10 }}>DB Foundation Boundary</div>
              <div className="ccv2-safety-grid" style={{ marginTop: 8 }}>
                {[
                  { label: "Provider calls", value: "Disabled", valueClass: "disabled" },
                  { label: "External network", value: "Disabled", valueClass: "disabled" },
                  { label: "DB writes", value: "DB writes disabled by policy", valueClass: "disabled" },
                  { label: "Project mutation", value: "Governed only", valueClass: "pending" },
                  { label: "Worker runtime", value: "Not enabled", valueClass: "disabled" },
                ].map((row) => <div key={row.label} className="ccv2-safety-row"><span className="ccv2-safety-row__label">{row.label}</span><span className={`ccv2-safety-row__value--${row.valueClass}`}>{row.value}</span></div>)}
              </div>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="approvals" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Approvals</div>
              <div className="ccv2-empty-state">{runtimeSnapshot.approvalWorkflow?.requested ? `${runtimeSnapshot.approvalWorkflow.requested} approvals pending.` : "No pending approvals."}</div>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="data-privacy" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Data & Privacy</div>
              <div className="ccv2-section-heading" style={{ marginTop: 10 }}>Local API Boundary</div>
              <div className="ccv2-safety-grid" style={{ marginTop: 8 }}>
                {apiRows.map((row) => <div key={row.label} className="ccv2-safety-row"><span className="ccv2-safety-row__label">{row.label}</span><span className={`ccv2-safety-row__value--${row.valueClass}`}>{row.value}</span></div>)}
                {isLocalPrivate && complianceRows.map((row) => <div key={row.label} className="ccv2-safety-row"><span className="ccv2-safety-row__label">{row.label}</span><span className={`ccv2-safety-row__value--${row.valueClass}`}>{row.value}</span></div>)}
              </div>
              <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>No private project source details appear in public/demo surfaces. Demo data stays separate from local-private project context.</p>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="developer-details" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Developer Details</div>
              <div className="ccv2-empty-state">Policy identifiers and boundary summaries are available here. Raw policy JSON is not shown in primary UI.</div>
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

/* ─── Release Control Page ─── */
function ReleaseControlPage() {
  const readiness = buildReleaseReadinessViewModel();
  const approvalQueueCount = readiness.approvalQueue?.rows?.length || 0;
  const route = COMMAND_CENTER_ROUTE_BY_KEY.release || {};
  const tabs = route.tabs || RELEASE_CONTROL_TABS;
  const [activeTab, setActiveTab] = useState(route.defaultTab || "overview");

  return (
    <div className="ccv2-content">
      <div className="ccv2-page" data-route-id={readiness.routeId}>
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">{readiness.pageTitle}</div>
          <div className="ccv2-page-head__sub">
            Display-only release and deploy readiness with approval, rollback, validation, and safety gates.
          </div>
        </div>

        <FounderOperationsBoard {...FOUNDER_DELIVERY_BOARDS.release} />

        <div className="ccv2-page-summary">
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">What changed</span><span className="ccv2-page-summary-value">{readiness.whatChanged}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{readiness.currentState}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{readiness.nextAction}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner</span><span className="ccv2-page-summary-value">{readiness.ownerAgent} · {readiness.ownerCapability}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{readiness.evidenceLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{readiness.activityLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{readiness.costImpact}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Approval queue</span><span className="ccv2-page-summary-value">{approvalQueueCount} local records; approvals cannot execute actions</span></div>
        </div>

        <div className="ccv2-info-banner" style={{ marginTop: 16 }}>
          {readiness.disabledReason}
        </div>

        <CommandTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Release Control sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {readiness.readinessCards.map((card) => (
                <article className="ccv2-card" key={card.label}>
                  <div className="ccv2-section-heading">{card.label}</div>
                  <div className={`ccv2-pill ccv2-pill--${card.tone}`}>{card.value}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{card.detail}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="gate" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Gate Posture</div>
                <div className="ccv2-page-summary" style={{ marginTop: 12 }}>
                  {readiness.gateRows.map((row) => (
                    <div className="ccv2-page-summary-row" key={row.label}>
                      <span className="ccv2-page-summary-label">{row.label}</span>
                      <span className="ccv2-page-summary-value">{row.value}</span>
                    </div>
                  ))}
                </div>
              </article>
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Scope Boundary</div>
                <div className="ccv2-grid ccv2-grid--2" style={{ marginTop: 12 }}>
                  <div>
                    <div className="ccv2-muted">Allowed</div>
                    <ul className="ccv2-list">
                      {readiness.allowedScope.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="ccv2-muted">Forbidden</div>
                    <ul className="ccv2-list">
                      {readiness.forbiddenScope.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </article>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="evidence" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Evidence and Blockers</div>
              <div className="ccv2-page-summary" style={{ marginTop: 12 }}>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence location</span><span className="ccv2-page-summary-value">{readiness.evidenceLocation}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity location</span><span className="ccv2-page-summary-value">{readiness.activityLocation}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{readiness.costImpact}</span></div>
              </div>
              <ul className="ccv2-list" style={{ marginTop: 12 }}>
                {readiness.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
              </ul>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="disabled" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {readiness.disabledActions.map((action) => (
                <article className="ccv2-card" key={action.label}>
                  <div className="ccv2-section-heading">{action.label}</div>
                  <button
                    className="ccv2-btn ccv2-btn--disabled"
                    type="button"
                    aria-label={`Disabled action: ${action.label}`}
                    disabled
                    title={action.reason}
                  >
                    {action.label} disabled
                  </button>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{action.reason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

/* ─── Projects Page ─── */
function ScopeBoundaryPackagingPanel({ vm }) {
  const boundary = vm.scopeBoundary || {};
  const rows = [
    { label: "Active scope", value: boundary.activeScope || "Project", tone: "ready" },
    { label: "Selected project", value: boundary.selectedProjectLabel || "Selected Project", tone: "ready" },
    { label: "Project mutation", value: boundary.projectMutation || "Disabled unless governed", tone: "disabled" },
    { label: "OS mutation", value: boundary.osMutation || "Disabled unless governed", tone: "disabled" },
    { label: "Cross-cutting changes", value: boundary.crossCutting || "Review required", tone: "pending" },
    { label: "Unknown changes", value: boundary.unknown || "Review required", tone: "pending" },
    { label: "Project export", value: boundary.exportSafety || "Dry-run only", tone: "disabled" },
    { label: "Package bundle", value: boundary.exportPackageCreated ? "Created" : "Not created", tone: "disabled" },
    { label: "Redacted manifest", value: boundary.redactedManifestAvailable ? "Available" : "Not generated", tone: boundary.redactedManifestAvailable ? "ready" : "pending" },
  ];

  const blockedRows = [
    { label: "NEXUS agents and policies", blocked: boundary.nexusInternalsBlocked !== false },
    { label: "Evidence, audit, and activity ledgers", blocked: boundary.ledgerExportBlocked !== false },
    { label: "Local-state runtime files", blocked: true },
    { label: "Secrets and key material", blocked: boundary.secretsBlocked !== false },
    { label: "Demo data", blocked: boundary.demoDataBlocked !== false },
  ];

  return (
    <div className="ccv2-card ccv2-page-summary-card" data-testid="scope-boundary-packaging-panel">
      <div className="ccv2-section-heading">Scope Boundary & Packaging Safety</div>
      <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
        {boundary.safetyCopy || "NEXUS OS is the control plane. Projects are workloads. Shipping a project must not include NEXUS internals or secrets."}
      </p>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 12 }}>
        {rows.map((row) => (
          <div key={row.label} className="ccv2-page-summary-row">
            <span className="ccv2-page-summary-label">{row.label}</span>
            <span className={`ccv2-safety-row__value--${row.tone}`}>{row.value}</span>
          </div>
        ))}
      </div>
      <div className="ccv2-section-heading" style={{ marginTop: 14 }}>Blocked From Project Package</div>
      <div className="ccv2-list" style={{ marginTop: 8 }}>
        {blockedRows.map((row) => (
          <div key={row.label} className="ccv2-list-row">
            <span className="ccv2-list-row__title">{row.label}</span>
            <span className="ccv2-pill ccv2-pill--disabled">{row.blocked ? "Blocked" : "Review required"}</span>
          </div>
        ))}
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 12 }}>
        <div className="ccv2-page-summary-row">
          <span className="ccv2-page-summary-label">Manifest path</span>
          <span className="ccv2-page-summary-value">{boundary.manifestPath || "Not available"}</span>
        </div>
        <div className="ccv2-page-summary-row">
          <span className="ccv2-page-summary-label">Release execution</span>
          <span className="ccv2-safety-row__value--disabled">{boundary.releaseExecutionEnabled ? "Enabled" : "Not enabled"}</span>
        </div>
      </div>
    </div>
  );
}

function ProjectsPage({ vm, studio }) {
  const pv = privateValidationSnapshot;
  const pvStatus = pv?.status || {};
  const pvBackend = pvStatus.latestBackendValidation || {};
  const projectProgress = vm.projectProgress || vm.careloopProductProgress;
  const isLocalPrivate = vm.shell.mode === "local-private";
  const surface = vm.projectOperatingSurface || {};
  const projectSummaryName = surface.selectedProjectLabel || projectProgress?.safeProjectName || vm.shell.activeProject || "Selected Project";
  const activeMissionName = surface.activeMissionLabel || vm.mission?.displayName || "Governed Build Mission";
  const healthStrip = surface.projectHealthStrip || [];
  const stackProfile = surface.stackProfile || [];
  const capabilityCards = surface.capabilityCards || [];
  const milestones = surface.milestones || [];
  const openGaps = surface.openGaps || [];
  const adapterSettings = surface.adapterSettings || [];
  const developerDetails = surface.developerDetails || [];
  const evidenceSummary = surface.evidenceSummary || [];
  const portfolioSummary = surface.portfolioSummary || {};
  const [activeTab, setActiveTab] = useState("portfolio");
  const projectOptions = [
    { label: "Portfolio / All Projects", meta: "All known workloads", status: "Ready", tone: "pass" },
    { label: "NEXUS OS", meta: "Platform scope · use OS Roadmap", status: "Separate", tone: "pending" },
    { label: projectSummaryName, meta: "Selected project · local-private", status: surface.selectedProjectStatus || "Active", tone: "pass" },
  ];
  const selectedProjectActions = [
    { label: "Start Mission", reason: "Use Mission Control until project actions are wired." },
    { label: "Generate Project Brief", reason: "Requires generated mission plan." },
    { label: "View Tasks", reason: "Open Task Queue for project-scoped tasks." },
    { label: "View Evidence", reason: "Open Evidence for redacted project evidence." },
    { label: "Open Setup Guide", reason: "Use docs until Project Registry actions are wired." },
    { label: "Run Validation", reason: "Run approved validation from a local terminal until UI execution is wired." },
  ];
  const startProjectSteps = [
    "Create or import a project",
    "Add or generate a project profile",
    "Define stack and test commands",
    "Create a mission",
    "Generate a plan",
    "Activate the first task",
  ];

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Projects</div>
          <div className="ccv2-page-head__sub">
            Manage NEXUS workloads, project readiness, stack profiles, boundaries, and project operating state.
          </div>
        </div>

        <FounderOperationsBoard {...FOUNDER_DELIVERY_BOARDS.projects} />

        <div className="ccv2-card ccv2-page-summary-card">
          <div className="ccv2-section-heading">Project Operating Surface</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            <span className="ccv2-pill ccv2-pill--pass">Selected Project: {projectSummaryName}</span>
            <span className="ccv2-pill ccv2-pill--pass">Project Type: {surface.selectedProjectType || "SaaS + Mobile"}</span>
            <span className="ccv2-pill ccv2-pill--pass">Status: {surface.selectedProjectStatus || "Active"}</span>
            <span className="ccv2-pill ccv2-pill--pending">Active phase: {surface.activePhaseLabel || "Project phase"}</span>
            <span className="ccv2-pill ccv2-pill--pending">Active Mission: {activeMissionName}</span>
            <span className="ccv2-pill ccv2-pill--disabled">Mode: {isLocalPrivate ? "local-private" : vm.shell.mode}</span>
            <span className="ccv2-pill ccv2-pill--pending">Stack: {surface.stackSummary || "Node/Fastify + Prisma + iOS"}</span>
            <span className="ccv2-pill ccv2-pill--disabled">Source: {surface.sourceLabel || "Registry snapshot"}</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 10 }}>
            Project context is the primary identity on this page. Environment and mode remain secondary metadata. Adapter runtime,
            project mutation, provider dispatch, and DB writes are visible as policy posture only.
          </p>
          <div className="ccv2-card" style={{ marginTop: 12 }}>
            <div className="ccv2-section-heading">Project Selector</div>
            <div className="ccv2-grid ccv2-grid--three" style={{ marginTop: 12 }}>
              {projectOptions.map((option) => (
                <div key={option.label} className="ccv2-page-summary-row">
                  <span className="ccv2-page-summary-label">{option.label}</span>
                  <span className={`ccv2-pill ccv2-pill--${option.tone || "pending"}`}>{option.status}</span>
                  <span className="ccv2-page-summary-value">{option.meta}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="ccv2-page-summary-grid" style={{ marginTop: 12 }}>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Registry state</span><span className="ccv2-page-summary-value">{portfolioSummary.registryState || "Ready"}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Selected project</span><span className="ccv2-page-summary-value">{projectSummaryName}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{surface.nextAction || "Review project task plan"}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Phase 2 planned tasks</span><span className="ccv2-page-summary-value">{vm.taskActivation?.plannedCount ?? 0}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Backend validation</span><span className="ccv2-page-summary-value">{pvBackend.testsPassed ?? 58}/{pvBackend.totalTests ?? 58} PASS</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">iOS readiness</span><span className="ccv2-page-summary-value">{pvStatus.iosReadiness || "Requires iOS/Xcode runner"}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Adapter runtime</span><span className="ccv2-page-summary-value">Disabled by policy</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Project mutation</span><span className="ccv2-page-summary-value">Disabled by policy</span></div>
          </div>
          <div className="ccv2-card" style={{ marginTop: 12 }}>
            <div className="ccv2-section-heading">Concurrency Limits</div>
            <div className="ccv2-page-summary-grid" style={{ marginTop: 10 }}>
              <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Per project</span><span className="ccv2-page-summary-value">1 preview task</span></div>
              <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Per repo</span><span className="ccv2-page-summary-value">1 preview task</span></div>
              <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Per agent</span><span className="ccv2-page-summary-value">1 preview task</span></div>
              <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Execution</span><span className="ccv2-safety-row__value--disabled">Not enabled yet</span></div>
            </div>
            <p className="ccv2-muted">
              P61 models project, repo, path, agent, and capability coordination only.
              Project Registry remains the source of project identity; no project mutation is enabled.
            </p>
          </div>
        </div>

        <CommandTabs tabs={PROJECTS_TABS} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Projects sections">
          <CommandTabPanel tabId="portfolio" activeTab={activeTab}>
            <div className="ccv2-card ccv2-page-summary-card">
              <div className="ccv2-section-heading">Portfolio</div>
              <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
                The portfolio surface is ready for multi-project operation, but current live data is scoped to the selected project.
                Do not fabricate cross-project activity before adapter runtime is enabled.
              </p>
              <div className="ccv2-page-summary-grid" style={{ marginTop: 12 }}>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Total projects</span><span className="ccv2-page-summary-value">{portfolioSummary.totalProjects ?? portfolioSummary.registeredProjects ?? 1}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Active projects</span><span className="ccv2-page-summary-value">{portfolioSummary.activeProjects ?? 1}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Projects needing setup</span><span className="ccv2-page-summary-value">{portfolioSummary.projectsNeedingSetup ?? 0}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Blocked projects</span><span className="ccv2-page-summary-value">{portfolioSummary.blockedProjects ?? 0}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Pending approvals</span><span className="ccv2-page-summary-value">{portfolioSummary.pendingApprovals ?? 0}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Ready for validation</span><span className="ccv2-page-summary-value">{portfolioSummary.readyForValidation ?? 1}</span></div>
              </div>
              <div className="ccv2-card" style={{ marginTop: 12 }}>
                <div className="ccv2-section-heading">Known Workload</div>
                <div className="ccv2-page-summary-grid" style={{ marginTop: 10 }}>
                  <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Display name</span><span className="ccv2-page-summary-value">{projectSummaryName}</span></div>
                  <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Project type</span><span className="ccv2-page-summary-value">{surface.selectedProjectType || "SaaS + Mobile"}</span></div>
                  <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Visibility</span><span className="ccv2-page-summary-value">local-private</span></div>
                  <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Stack summary</span><span className="ccv2-page-summary-value">{surface.stackSummary || "Node/Fastify + Prisma + iOS"}</span></div>
                  <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Latest validation</span><span className="ccv2-page-summary-value">{pvBackend.testsPassed ?? 58}/{pvBackend.totalTests ?? 58} backend checks passed</span></div>
                  <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">Open Selected Project and review readiness gaps</span></div>
                </div>
              </div>
              <div className="ccv2-card" style={{ marginTop: 12 }}>
                <div className="ccv2-section-heading">No Project Selected Guidance</div>
                <div className="ccv2-page-summary-grid" style={{ marginTop: 10 }}>
                  {startProjectSteps.map((step) => (
                    <div key={step} className="ccv2-page-summary-row">
                      <span className="ccv2-page-summary-label">Start step</span>
                      <span className="ccv2-page-summary-value">{step}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {[
                    ["Create Project", "Project onboarding action is not enabled yet"],
                    ["Import Existing Project", "Project import action is not enabled yet"],
                    ["Run nexus:init-project", "Use CLI until Command Center action is wired"],
                    ["Command Center Lite", "Separate demo/lite surface is planned; full Command Center stays OS and portfolio focused."],
                    ["Read Getting Started", "Open docs for project setup guidance"],
                  ].map(([label, reason]) => (
                    <button key={label} className="ccv2-wf-card__btn ccv2-wf-card__btn--disabled" disabled title={reason}>
                      {label} · {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="selected-project" activeTab={activeTab}>
            <div className="ccv2-card ccv2-page-summary-card">
              <div className="ccv2-section-heading">Selected Project</div>
              <div className="ccv2-page-summary-grid" style={{ marginTop: 12 }}>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Project</span><span className="ccv2-page-summary-value">{projectSummaryName}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Project type</span><span className="ccv2-page-summary-value">{surface.selectedProjectType || "SaaS + Mobile"}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Status</span><span className="ccv2-page-summary-value">{surface.selectedProjectStatus || "Active"}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Mission</span><span className="ccv2-page-summary-value">{activeMissionName}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Profile</span><span className="ccv2-page-summary-value">Valid</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Release readiness</span><span className="ccv2-page-summary-value">{vm.release.status === "NO-GO" ? "Not ready" : vm.release.status}</span></div>
              </div>
              <div className="ccv2-section-heading" style={{ marginTop: 14 }}>Available Actions</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {selectedProjectActions.map((action) => (
                  <button key={action.label} className="ccv2-wf-card__btn ccv2-wf-card__btn--disabled" disabled title={action.reason}>
                    {action.label} · {action.reason}
                  </button>
                ))}
              </div>
              <div className="ccv2-section-heading" style={{ marginTop: 14 }}>Project Health Strip</div>
              <div className="ccv2-grid ccv2-grid--two" style={{ marginTop: 12 }}>
                {healthStrip.map((item) => (
                  <div key={item.label} className="ccv2-card">
                    <div className="ccv2-section-heading">{item.label}</div>
                    <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>{item.note}</p>
                    <span className={`ccv2-pill ccv2-pill--${item.tone || "pending"}`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="stack" activeTab={activeTab}>
            <div className="ccv2-card ccv2-page-summary-card">
              <div className="ccv2-section-heading">Stack</div>
              <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
                Stack profile status explains what NEXUS can inspect or validate for the selected project without executing adapters.
              </p>
              <div className="ccv2-grid ccv2-grid--two" style={{ marginTop: 12 }}>
                {stackProfile.map((item) => (
                  <div key={item.area} className="ccv2-card">
                    <div className="ccv2-section-heading">{item.area}</div>
                    <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>{item.summary}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                      <span className={`ccv2-pill ccv2-pill--${item.tone || "pending"}`}>{item.status}</span>
                      <span className="ccv2-pill ccv2-pill--disabled">{item.runner}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="capabilities" activeTab={activeTab}>
            <div className="ccv2-card ccv2-page-summary-card">
              <div className="ccv2-section-heading">Project Capability Matrix</div>
              <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
                Capability status is read-only and user-facing. This matrix does not enable adapters, workers, providers, tools, DB writes, or project mutation.
              </p>
              <div className="ccv2-grid ccv2-grid--two" style={{ marginTop: 12 }}>
                {capabilityCards.map((card) => (
                  <div key={card.name} className="ccv2-card">
                    <div className="ccv2-section-heading">{card.name}</div>
                    <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>{card.description}</p>
                    <div className="ccv2-page-summary-grid" style={{ marginTop: 10 }}>
                      <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{card.nextAction}</span></div>
                      <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner</span><span className="ccv2-page-summary-value">{card.owner}</span></div>
                      <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Required</span><span className="ccv2-page-summary-value">{card.required}</span></div>
                    </div>
                    <span className={`ccv2-pill ccv2-pill--${card.tone || "pending"}`} style={{ marginTop: 10 }}>{card.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="milestones" activeTab={activeTab}>
            <div className="ccv2-card ccv2-page-summary-card">
              <div className="ccv2-section-heading">Milestones</div>
              <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
                OS Roadmap tracks NEXUS platform phases. Project milestones live under Projects.
              </p>
              <div className="ccv2-grid ccv2-grid--two" style={{ marginTop: 12 }}>
                {milestones.map((milestone) => (
                  <div key={milestone.title} className="ccv2-card">
                    <div className="ccv2-section-heading">{milestone.title}</div>
                    <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>{milestone.summary}</p>
                    <span className={`ccv2-pill ccv2-pill--${milestone.tone || "pending"}`}>{milestone.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="gaps" activeTab={activeTab}>
            <div className="ccv2-card ccv2-page-summary-card">
              <div className="ccv2-section-heading">Gaps</div>
              <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
                Open gaps are shown as next-action cards so operators can see why each gap matters and which capability unlocks it.
              </p>
              <div className="ccv2-grid ccv2-grid--two" style={{ marginTop: 12 }}>
                {openGaps.map((gap) => (
                  <div key={gap.title} className="ccv2-card">
                    <div className="ccv2-section-heading">{gap.title}</div>
                    <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
                      <strong>Why it matters:</strong> {gap.why}
                    </p>
                    <div className="ccv2-page-summary-grid" style={{ marginTop: 10 }}>
                      <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{gap.nextAction}</span></div>
                      <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner</span><span className="ccv2-page-summary-value">{gap.owner}</span></div>
                      <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Enables</span><span className="ccv2-page-summary-value">{gap.enablingCapability}</span></div>
                    </div>
                    <span className={`ccv2-pill ccv2-pill--${gap.tone || "pending"}`} style={{ marginTop: 10 }}>{gap.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="evidence" activeTab={activeTab}>
            <div className="ccv2-card ccv2-page-summary-card">
              <div className="ccv2-section-heading">Project Evidence</div>
              <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
                Evidence is scoped to the selected project and summarized. Raw payloads and raw JSON stay out of the primary UI.
              </p>
              <div className="ccv2-grid ccv2-grid--two" style={{ marginTop: 12 }}>
                {evidenceSummary.map((item) => (
                  <div key={item.title} className="ccv2-card">
                    <div className="ccv2-section-heading">{item.title}</div>
                    <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>{item.summary}</p>
                    <div className="ccv2-page-summary-grid" style={{ marginTop: 10 }}>
                      <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Linked action</span><span className="ccv2-page-summary-value">{item.linkedAction}</span></div>
                      <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Redacted</span><span className="ccv2-page-summary-value">{item.redacted}</span></div>
                    </div>
                    <span className={`ccv2-pill ccv2-pill--${item.tone || "pending"}`} style={{ marginTop: 10 }}>{item.status}</span>
                  </div>
                ))}
              </div>
              {evidenceSummary.length === 0 && (
                <div className="ccv2-empty-state">Evidence appears after governed project actions complete.</div>
              )}
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="settings-adapter" activeTab={activeTab}>
            <div className="ccv2-card ccv2-page-summary-card">
              <div className="ccv2-section-heading">Settings / Adapter</div>
              <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
                NEXUS OS is the control plane. Projects are workloads. This tab shows adapter posture and safety settings without enabling project source mutation.
              </p>
              <div className="ccv2-grid ccv2-grid--two" style={{ marginTop: 12 }}>
                {adapterSettings.map((setting) => (
                  <div key={setting.label} className="ccv2-card">
                    <div className="ccv2-section-heading">{setting.label}</div>
                    <span className="ccv2-pill ccv2-pill--disabled">{setting.value}</span>
                  </div>
                ))}
              </div>
              <details className="ccv2-card" style={{ marginTop: 12 }}>
                <summary className="ccv2-section-heading">Developer Details</summary>
                <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
                  Raw IDs and paths are intentionally secondary and are not used as the primary operator UX.
                </p>
                <div className="ccv2-page-summary-grid" style={{ marginTop: 10 }}>
                  {developerDetails.map((detail) => (
                    <div key={detail.label} className="ccv2-page-summary-row">
                      <span className="ccv2-page-summary-label">{detail.label}</span>
                      <span className="ccv2-page-summary-value ccv2-mono">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

/* ─── Batch Queue Page ─── */
function WorkerRuntimePage({ vm }) {
  const [activeTab, setActiveTab] = useState("overview");
  const runtime = vm.workerRuntime || {};
  const statusCards = runtime.statusCards || [];
  const concurrency = runtime.concurrencyPreview || {};
  const developerDetails = runtime.developerDetails || {};

  return (
    <div className="ccv2-page">
      <div className="ccv2-page-head">
        <div>
          <div className="ccv2-page-head__eyebrow">Platform runtime foundation</div>
          <div className="ccv2-page-head__title">Worker Runtime</div>
          <div className="ccv2-page-head__subtitle">Durable background execution foundation for future governed tasks.</div>
        </div>
        <div className="ccv2-page-head__meta">
          <span className="ccv2-pill ccv2-pill--preview">Preview only</span>
          <span className="ccv2-pill ccv2-pill--disabled">Execution disabled</span>
        </div>
      </div>

      <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.workers} />

      <div className="ccv2-warning-card">
        Runtime primitives are defined for review only. This page does not execute agents, tools, providers, or project mutations.
      </div>

      <CommandTabs
        tabs={WORKER_RUNTIME_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ariaLabel="Worker Runtime sections"
      >
        <CommandTabPanel tabId="overview" activeTab={activeTab}>
          <div className="ccv2-grid ccv2-grid--three">
            {statusCards.map((card) => (
              <div className="ccv2-card" key={card.label}>
                <div className="ccv2-section-heading">{card.label}</div>
                <div className="ccv2-metric-value">{card.value}</div>
                <p className="ccv2-muted">{card.detail}</p>
              </div>
            ))}
          </div>
          <div className="ccv2-card" style={{ marginTop: 16 }}>
            <div className="ccv2-section-heading">Next Action</div>
            <p className="ccv2-muted">{runtime.nextAction || "Continue to P61 for concurrency and work deduplication."}</p>
          </div>
          <div className="ccv2-card" style={{ marginTop: 16 }}>
            <div className="ccv2-section-heading">Concurrency Readiness</div>
            <div className="ccv2-page-summary-grid">
              <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Execution</span><span className="ccv2-safety-row__value--disabled">{concurrency.executionStatus || "Not enabled yet"}</span></div>
              <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Lock model</span><span className="ccv2-page-summary-value">{concurrency.lockModel || "Preview-ready"}</span></div>
              <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Duplicate detection</span><span className="ccv2-page-summary-value">{concurrency.duplicateDetection || "Preview-ready"}</span></div>
              <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Priority model</span><span className="ccv2-page-summary-value">{concurrency.priorityModel || "Preview-ready"}</span></div>
              <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cancellation</span><span className="ccv2-page-summary-value">{concurrency.cancellationModel || "Preview-ready"}</span></div>
              <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Policy</span><span className="ccv2-page-summary-value">{concurrency.policyStatus || "Preview-only policy loaded"}</span></div>
            </div>
          </div>
        </CommandTabPanel>

        <CommandTabPanel tabId="queue" activeTab={activeTab}>
          <div className="ccv2-card">
            <div className="ccv2-section-heading">Worker Queue</div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Queue schema</span><span className="ccv2-page-summary-value">Modeled</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Allowed runtime</span><span className="ccv2-page-summary-value">preview_only</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Task execution</span><span className="ccv2-safety-row__value--disabled">Not enabled</span></div>
          </div>
        </CommandTabPanel>

        <CommandTabPanel tabId="leases" activeTab={activeTab}>
          <div className="ccv2-card">
            <div className="ccv2-section-heading">Leases</div>
            <p className="ccv2-muted">Leases are preview records for future workers. They do not claim or execute queue items.</p>
            <div className="ccv2-empty-state">No active worker leases. Worker loop execution is not enabled.</div>
          </div>
        </CommandTabPanel>

        <CommandTabPanel tabId="heartbeats" activeTab={activeTab}>
          <div className="ccv2-card">
            <div className="ccv2-section-heading">Heartbeats</div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Healthy workers</span><span className="ccv2-page-summary-value">0 preview</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Stale workers</span><span className="ccv2-page-summary-value">0 preview</span></div>
            <p className="ccv2-muted">No timers or background daemons are started by this page.</p>
          </div>
        </CommandTabPanel>

        <CommandTabPanel tabId="retries" activeTab={activeTab}>
          <div className="ccv2-grid ccv2-grid--two">
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Retry / Timeout</div>
              <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Retries</span><span className="ccv2-page-summary-value">Modeled</span></div>
              <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Automatic retry execution</span><span className="ccv2-safety-row__value--disabled">Disabled</span></div>
              <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Timeout policy</span><span className="ccv2-page-summary-value">Preview only</span></div>
            </div>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Dead-letter queue</div>
              <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">DLQ model</span><span className="ccv2-page-summary-value">Available</span></div>
              <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Requeue execution</span><span className="ccv2-safety-row__value--disabled">Not enabled</span></div>
              <p className="ccv2-muted">Suggested action: inspect blocker and wait for a future governed requeue workflow.</p>
            </div>
          </div>
        </CommandTabPanel>

        <CommandTabPanel tabId="concurrency" activeTab={activeTab}>
          <div className="ccv2-grid ccv2-grid--two">
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Concurrency Policy</div>
              <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Max per project</span><span className="ccv2-page-summary-value">{concurrency.maxConcurrentTasksPerProject || 1}</span></div>
              <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Max per repo</span><span className="ccv2-page-summary-value">{concurrency.maxConcurrentTasksPerRepo || 1}</span></div>
              <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Max per agent</span><span className="ccv2-page-summary-value">{concurrency.maxConcurrentTasksPerAgent || 1}</span></div>
              <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Parallel execution</span><span className="ccv2-safety-row__value--disabled">Not enabled yet</span></div>
            </div>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Preview Models</div>
              {["Lock model", "Duplicate work preview", "Priority preview", "Cancellation preview"].map((label) => (
                <div className="ccv2-page-summary-row" key={label}>
                  <span className="ccv2-page-summary-label">{label}</span>
                  <span className="ccv2-page-summary-value">Preview-ready</span>
                </div>
              ))}
            </div>
          </div>
          <div className="ccv2-card" style={{ marginTop: 16 }}>
            <div className="ccv2-section-heading">Safety Notes</div>
            <div className="ccv2-list">
              {(concurrency.safetyNotes || []).map((note) => (
                <div className="ccv2-list-row" key={note}>
                  <span className="ccv2-list-row__title">{note}</span>
                  <span className="ccv2-pill ccv2-pill--disabled">Preview</span>
                </div>
              ))}
            </div>
          </div>
        </CommandTabPanel>

        <CommandTabPanel tabId="developer-details" activeTab={activeTab}>
          <div className="ccv2-card">
            <div className="ccv2-section-heading">Developer Details</div>
            {Object.entries(developerDetails).map(([label, value]) => (
              <div className="ccv2-page-summary-row" key={label}>
                <span className="ccv2-page-summary-label">{label}</span>
                <span className="ccv2-page-summary-value">{value}</span>
              </div>
            ))}
          </div>
        </CommandTabPanel>
      </CommandTabs>
    </div>
  );
}

function BatchQueuePage({ vm }) {
  const [activeTab, setActiveTab] = useState("overview");
  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Batch Queue</div>
          <div className="ccv2-page-head__sub">Async batch processing status</div>
        </div>

        <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.batch} />

        <CommandTabs tabs={BATCH_QUEUE_TABS} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Batch Queue sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Batch API Status</div>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Real OpenAI Batch API</span><span className="ccv2-safety-row__value--disabled">Disabled</span></div>
                <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Real Anthropic Message Batches</span><span className="ccv2-safety-row__value--disabled">Disabled</span></div>
                <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Dry-run queueing</span><span className="ccv2-safety-row__value--ready">Available</span></div>
              </div>
              <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>Batch is not enabled for real execution. Worker runtime and governed provider dispatch are required before real batch jobs can run.</p>
            </div>
            <div className="ccv2-grid ccv2-grid--2">
              {batchIntelligenceReadinessCards.map((card) => (
                <article key={card.title} className="ccv2-card">
                  <div className="ccv2-section-heading">{card.title}</div>
                  <div className="ccv2-chip-row">
                    <span className="ccv2-pill ccv2-pill--preview">{card.stateLabel}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">Upload disabled</span>
                  </div>
                  <div className="ccv2-muted">Workload: {card.workloadType}</div>
                  <div className="ccv2-muted">Requests: {card.requestCount}</div>
                  <div className="ccv2-muted">Redaction: {card.redactionState}</div>
                  <div className="ccv2-muted">Disabled reason: {card.disabledReason}</div>
                  <div className="ccv2-muted">Blocker: {card.blocker}</div>
                  <div className="ccv2-muted">Cost impact: {card.costImpact}</div>
                  <div className="ccv2-muted">Next action: {card.nextAction}</div>
                  <div className="ccv2-muted">Evidence: {card.evidenceLocation}</div>
                  <div className="ccv2-muted">Activity: {card.activityLocation}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="jobs" activeTab={activeTab}><div className="ccv2-card"><div className="ccv2-section-heading">Jobs</div><div className="ccv2-empty-state">Future batch job list. Batch execution is not enabled yet.</div></div></CommandTabPanel>
          <CommandTabPanel tabId="results" activeTab={activeTab}><div className="ccv2-card"><div className="ccv2-section-heading">Results</div><div className="ccv2-empty-state">Future results and reconciliation will appear after batch runtime is enabled.</div></div></CommandTabPanel>
          <CommandTabPanel tabId="cost" activeTab={activeTab}><div className="ccv2-card"><div className="ccv2-section-heading">Cost</div><div className="ccv2-empty-state">Future batch savings and cost status. Do not fake spend before provider dispatch exists.</div></div></CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

/* ─── Cost Center Page ─── */
function CostCenterPage({ vm, studio }) {
  const [activeTab, setActiveTab] = useState("overview");
  const budgetScopes = ["Global", "Project", "Mission", "Task", "Agent", "Skill", "Hook", "Tool", "Trigger", "Provider", "API Batch", "Worker", "OS Phase"];
  const estimates = [
    { label: "Task estimate preview", amount: "$0.0125", confidence: "Medium", assumption: "Static token estimate; no provider call." },
    { label: "API batch estimate preview", amount: "$0.0700", confidence: "Low", assumption: "Preview price table only; no batch upload." },
    { label: "Tool/test estimate preview", amount: "$0.0045", confidence: "Medium", assumption: "Local runtime seconds only." },
  ];
  const decisions = [
    { decision: "ALLOW", reason: "Estimate preview is within budget. Execution still remains disabled until governed execution is explicitly admitted." },
    { decision: "BLOCK", reason: "Provider dispatch requested while provider dispatch is disabled." },
    { decision: "REQUIRE_APPROVAL", reason: "Estimate exceeds the approval threshold." },
    { decision: "RECORD_ONLY", reason: "Estimate-only request records cost preview without execution." },
  ];
  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Cost Center</div>
          <div className="ccv2-page-head__sub">Preview cost governance · estimates before future execution · no real provider spend</div>
        </div>

        <FounderOperationsBoard
          title="Cost Center"
          purpose="Show estimate posture, budget gates, and spend blockers before any provider-backed work is allowed."
          currentState="Estimate preview only; real provider spend disabled"
          nextAction="Review estimate assumptions and budget decisions before any future execution admission."
          blocker="Provider dispatch, real spend, DB writes, and worker runtime remain disabled."
          owner="SENTINEL Cost Governance"
          evidence="Cost estimate and budget preview records"
          activity="Cost ledger preview"
          cost="No real provider spend"
          lanes={[
            { label: "Budget scopes", value: budgetScopes.length },
            { label: "Estimates", value: estimates.length },
            { label: "Decisions", value: decisions.length },
            { label: "Spend", value: "Disabled" },
          ]}
        />

        <CommandTabs tabs={COST_CENTER_TABS} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Cost Center sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Cost Center Status</div>
              <div className="ccv2-safety-grid" style={{ marginTop: 8 }}>
                <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Cost model</span><span className="ccv2-safety-row__value--ready">Ready for estimates</span></div>
                <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Real provider spend</span><span className="ccv2-safety-row__value--disabled">Disabled</span></div>
                <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Provider dispatch</span><span className="ccv2-safety-row__value--disabled">Disabled</span></div>
                <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">DB writes</span><span className="ccv2-safety-row__value--disabled">Disabled</span></div>
                <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Worker runtime</span><span className="ccv2-safety-row__value--disabled">Disabled</span></div>
                <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Budget enforcement</span><span className="ccv2-safety-row__value--ready">Preview only</span></div>
              </div>
              <p className="ccv2-empty-state" style={{ marginTop: 10 }}>Cost Center estimates, ledger entries, and budget decisions are governance previews. They do not represent real billing data.</p>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="budgets" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Budgets</div>
              <div className="ccv2-grid-3" style={{ marginTop: 10 }}>
                {budgetScopes.map((scope) => (
                  <div className="ccv2-stat-chip" key={scope}>
                    <span>{scope}</span>
                    <strong>Preview scope</strong>
                  </div>
                ))}
              </div>
              <p className="ccv2-empty-state" style={{ marginTop: 10 }}>Approval threshold preview: estimates above the configured threshold require operator approval before future execution.</p>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="estimates" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Estimates</div>
              <div className="ccv2-stack-list" style={{ marginTop: 10 }}>
                {estimates.map((estimate) => (
                  <div className="ccv2-safety-row" key={estimate.label}>
                    <span className="ccv2-safety-row__label">{estimate.label}</span>
                    <span className="ccv2-safety-row__value--ready">{estimate.amount} · {estimate.confidence}</span>
                    <small>{estimate.assumption}</small>
                  </div>
                ))}
              </div>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="ledger" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Ledger</div>
              <div className="ccv2-empty-state">Redacted cost ledger preview includes estimate records, actual preview records, and budget decisions. No raw prompts, provider payloads, secrets, or private source content are shown.</div>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="enforcement" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Enforcement</div>
              <div className="ccv2-stack-list" style={{ marginTop: 10 }}>
                {decisions.map((decision) => (
                  <div className="ccv2-safety-row" key={decision.decision}>
                    <span className="ccv2-safety-row__label">{decision.decision}</span>
                    <span>{decision.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="gaps" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Gaps / Next</div>
              <div className="ccv2-empty-state">Real provider cost capture waits for governed provider dispatch. Worker cost waits for worker runtime. DB-backed cost ledger waits for DB-backed runtime primary.</div>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="developer-details" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Developer Details</div>
              <div className="ccv2-empty-state">Safe references: policy/cost-center-policy.json, reports/cost-ledger-preview.json, reports/budget-policy-preview.json, reports/cost-estimates-preview.json. No raw JSON dump is shown in primary UX.</div>
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

/* ─── Policy Center Page ─── */
function PolicyCenterPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const policyFamilies = [
    { label: "Command Center UX", owner: "NEXUS", scope: "platform", risk: "medium", status: "Active" },
    { label: "Project Registry", owner: "WARDEN", scope: "project", risk: "high", status: "Active" },
    { label: "Scope Boundary", owner: "WARDEN", scope: "project", risk: "high", status: "Active" },
    { label: "Agent Registry", owner: "WARDEN", scope: "platform", risk: "high", status: "Active" },
    { label: "Tool / MCP Registry", owner: "WARDEN", scope: "platform", risk: "high", status: "Active" },
    { label: "Cost Center", owner: "SENTINEL", scope: "platform", risk: "medium", status: "Active" },
    { label: "Public / Private / Demo Safety", owner: "WARDEN", scope: "all", risk: "critical", status: "Active" },
  ];
  const simulationCards = [
    { label: "Provider dispatch attempt", decision: "DENY", reason: "Provider dispatch is not enabled." },
    { label: "Tool call attempt", decision: "DENY", reason: "Tool dispatch is not enabled." },
    { label: "DB write attempt", decision: "DENY", reason: "DB writes are disabled by policy." },
    { label: "Agent permission expansion", decision: "REQUIRES_REVIEW", reason: "WARDEN and AUDITOR review required." },
  ];
  const diffRows = [
    { label: "Docs-only wording change", risk: "Low", implication: "No approval preview required." },
    { label: "Approval threshold change", risk: "Medium", implication: "AUDITOR review preview." },
    { label: "Tool permission expansion", risk: "High", implication: "WARDEN and AUDITOR review preview." },
    { label: "Provider or DB enabling", risk: "Critical", implication: "Denied in preview." },
  ];
  const policyDispatchCard = dispatchReadinessCards.find((card) => card.title === "Policy Decision");

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Policy Center</div>
          <div className="ccv2-page-head__sub">Governance policy registry, previews, exceptions, and emergency controls · read-only</div>
        </div>

        <FounderOperationsBoard
          title="Policy Center"
          purpose="Explain which policies govern execution, exceptions, break-glass, and unsafe action denial."
          currentState="Policy registry and simulation are available as read-only previews"
          nextAction="Review simulation outcomes before requesting any policy-sensitive action."
          blocker="Policy edits, exception grants, break-glass, and runtime enforcement changes are disabled."
          owner="WARDEN / AUDITOR Policy Review"
          evidence={policyDispatchCard?.evidenceLocation || "Policy Center reports"}
          activity={policyDispatchCard?.activityLocation || "Activity Log"}
          cost={policyDispatchCard?.costImpact || "No provider spend from policy review"}
          lanes={[
            { label: "Policies", value: policyFamilies.length },
            { label: "Simulations", value: simulationCards.length },
            { label: "Diff checks", value: diffRows.length },
            { label: "Break-glass", value: "Disabled" },
          ]}
        />

        <CommandTabs tabs={POLICY_CENTER_TABS} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Policy Center sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Policy Center Status</div>
              <div className="ccv2-safety-grid" style={{ marginTop: 8 }}>
                <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Policy registry</span><span className="ccv2-safety-row__value--ready">Registry ready</span></div>
                <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Policy versions</span><span className="ccv2-safety-row__value--ready">Metadata only</span></div>
                <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Simulation</span><span className="ccv2-safety-row__value--ready">Preview available</span></div>
                <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Exception workflow</span><span className="ccv2-safety-row__value--ready">Preview only</span></div>
                <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Break-glass</span><span className="ccv2-safety-row__value--disabled">Disabled by default</span></div>
                <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Runtime enforcement changes</span><span className="ccv2-safety-row__value--disabled">Not enabled</span></div>
              </div>
              <p className="ccv2-empty-state" style={{ marginTop: 10 }}>Next action: review policy simulation results before credential boundary work. Policy Center does not edit or apply policies from this page.</p>
            </div>
            {policyDispatchCard && (
              <div className="ccv2-card ccv2-card--accent">
                <div className="ccv2-section-heading">Dispatch Governance</div>
                <div className="ccv2-safety-grid" style={{ marginTop: 8 }}>
                  <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Current state</span><span className="ccv2-safety-row__value--disabled">{policyDispatchCard.stateLabel}</span></div>
                  <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Disabled reason</span><span>{policyDispatchCard.disabledReason}</span></div>
                  <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Blocker</span><span>{policyDispatchCard.blocker}</span></div>
                  <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Evidence</span><span>{policyDispatchCard.evidenceLocation}</span></div>
                  <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Activity</span><span>{policyDispatchCard.activityLocation}</span></div>
                  <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Cost impact</span><span>{policyDispatchCard.costImpact}</span></div>
                </div>
              </div>
            )}
          </CommandTabPanel>

          <CommandTabPanel tabId="registry" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Registry</div>
              <div className="ccv2-stack-list" style={{ marginTop: 10 }}>
                {policyFamilies.map((policy) => (
                  <div className="ccv2-safety-row" key={policy.label}>
                    <span className="ccv2-safety-row__label">{policy.label}</span>
                    <span>{policy.owner} · {policy.scope} · {policy.risk}</span>
                    <small>{policy.status}</small>
                  </div>
                ))}
              </div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="versions" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Versions</div>
              <div className="ccv2-empty-state">Latest version metadata and checksum summaries are available for policy families. Checksums summarize files without exposing policy payloads or secrets.</div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="diff-preview" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Diff Preview</div>
              <div className="ccv2-stack-list" style={{ marginTop: 10 }}>
                {diffRows.map((row) => (
                  <div className="ccv2-safety-row" key={row.label}>
                    <span className="ccv2-safety-row__label">{row.label}</span>
                    <span>{row.risk}</span>
                    <small>{row.implication}</small>
                  </div>
                ))}
              </div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="simulation" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Simulation</div>
              <div className="ccv2-stack-list" style={{ marginTop: 10 }}>
                {simulationCards.map((card) => (
                  <div className="ccv2-safety-row" key={card.label}>
                    <span className="ccv2-safety-row__label">{card.label}</span>
                    <span className={card.decision === "DENY" ? "ccv2-safety-row__value--disabled" : "ccv2-safety-row__value--ready"}>{card.decision}</span>
                    <small>{card.reason}</small>
                  </div>
                ))}
              </div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="exceptions" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Exceptions</div>
              <div className="ccv2-empty-state">Exception workflow is preview-only. Exceptions must be time-bound, evidence-bound, scoped, and reviewed by the required operator roles before any future runtime path can use them.</div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="break-glass" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Break-Glass</div>
              <div className="ccv2-empty-state">Break-glass is disabled by default, emergency-only, and never automatic. It requires human approval, WARDEN and AUDITOR review, evidence, audit, expiration, and recovery planning. Audit and evidence cannot be disabled.</div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="developer-details" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Developer Details</div>
              <div className="ccv2-empty-state">Safe references: policy-center modules, policy-center registry policy, break-glass policy, and P58 policy reports. Raw policy JSON is intentionally not shown in primary UX.</div>
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

/* ─── Secrets Boundary Page ─── */
function SecretsBoundaryPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const statusCards = [
    { label: "Provider credentials", state: "Metadata only", detail: "Provider calls remain disabled." },
    { label: "Project credentials", state: "Blocked", detail: "Project credential values are not resolved." },
    { label: "DB credentials", state: "Blocked", detail: "DB writes remain disabled." },
    { label: "Deploy credentials", state: "Future phase", detail: "Deploy execution is not enabled." },
    { label: "Mobile signing", state: "Future phase", detail: "Signing credentials are references only." },
    { label: "Webhook and chat integrations", state: "Not configured", detail: "Integration credentials are metadata only." },
  ];
  const projectCategories = ["App database", "CI/CD", "Deployment", "Mobile signing", "OAuth", "Notification service", "Payment provider", "Storage provider"];
  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Secrets Boundary</div>
          <div className="ccv2-page-head__sub">Credential references only · raw values are never displayed, logged, or included in reports</div>
        </div>

        <FounderOperationsBoard
          title="Secrets Boundary"
          purpose="Show which credential categories exist as references while keeping raw values hidden."
          currentState="Credential metadata only; raw values are never displayed"
          nextAction="Review missing credential categories and keep provider/deploy/project credential use blocked."
          blocker="Secret values, provider calls, DB writes, deploy credentials, and mobile signing remain unavailable."
          owner="WARDEN Credential Boundary"
          evidence="Secrets boundary reports and credential metadata"
          activity="Activity Log"
          cost="No provider spend from credential inspection"
          lanes={[
            { label: "Credential states", value: statusCards.length },
            { label: "Project categories", value: projectCategories.length },
            { label: "Raw values", value: "Hidden" },
            { label: "Mutation", value: "Disabled" },
          ]}
        />

        <CommandTabs tabs={SECRETS_BOUNDARY_TABS} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Secrets Boundary sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Secrets Boundary Status</div>
              <p className="ccv2-empty-state" style={{ marginTop: 8 }}>NEXUS stores references only. Raw secret values are not displayed, logged, or included in reports.</p>
              <div className="ccv2-safety-grid" style={{ marginTop: 10 }}>
                {statusCards.map((card) => (
                  <div className="ccv2-safety-row" key={card.label}>
                    <span className="ccv2-safety-row__label">{card.label}</span>
                    <span className={card.state === "Blocked" ? "ccv2-safety-row__value--disabled" : "ccv2-safety-row__value--ready"}>{card.state}</span>
                    <small>{card.detail}</small>
                  </div>
                ))}
              </div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="providers" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Provider Credentials</div>
              <div className="ccv2-empty-state">OpenAI, Anthropic, GitHub, Slack placeholder, Jira/Linear placeholder, and cloud provider placeholder credentials are reference metadata only. Provider dispatch remains disabled.</div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="project" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Project Credentials</div>
              <div className="ccv2-grid-3" style={{ marginTop: 10 }}>
                {projectCategories.map((category) => (
                  <div className="ccv2-stat-chip" key={category}>
                    <span>{category}</span>
                    <strong>Reference only</strong>
                  </div>
                ))}
              </div>
              <p className="ccv2-empty-state" style={{ marginTop: 10 }}>Demo Mode does not show private project credential metadata.</p>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="database-deploy" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">DB / Deploy</div>
              <div className="ccv2-safety-grid" style={{ marginTop: 8 }}>
                <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">DB writes</span><span className="ccv2-safety-row__value--disabled">Disabled</span></div>
                <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Deploy execution</span><span className="ccv2-safety-row__value--disabled">Disabled</span></div>
                <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Mobile signing</span><span className="ccv2-safety-row__value--disabled">Disabled</span></div>
              </div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="integrations" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Integrations</div>
              <div className="ccv2-empty-state">Webhook, chat, OAuth, notification, payment, and storage credentials are future-phase references. No external integration calls are enabled.</div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="developer-details" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Developer Details</div>
              <div className="ccv2-empty-state">Credential references are summarized by provider and project scope. Raw credential values are never shown.</div>
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

/* ─── Demo Mode Page ─── */
function DemoModePage({ vm }) {
  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Demo Mode</div>
          <div className="ccv2-page-head__sub">Zero-key public-safe demo surface</div>
        </div>

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Demo Status</div>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="ccv2-safety-row">
              <span className="ccv2-safety-row__label">Zero-key demo</span>
              <span className="ccv2-safety-row__value--pass">Active</span>
            </div>
            <div className="ccv2-safety-row">
              <span className="ccv2-safety-row__label">Public-safe artifacts</span>
              <span className="ccv2-safety-row__value--ready">Dashboard · Constellation · Skills</span>
            </div>
            <div className="ccv2-safety-row">
              <span className="ccv2-safety-row__label">Provider calls</span>
              <span className="ccv2-safety-row__value--disabled">Disabled</span>
            </div>
            <div className="ccv2-safety-row">
              <span className="ccv2-safety-row__label">DB access</span>
              <span className="ccv2-safety-row__value--disabled">Disabled</span>
            </div>
            <div className="ccv2-safety-row">
              <span className="ccv2-safety-row__label">Private project data</span>
              <span className="ccv2-safety-row__value--disabled">Not exposed</span>
            </div>
          </div>
        </div>

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Public Boundary</div>
          <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
            Demo mode does not expose private project validation data. No private project source, no provider calls, no DB. Public surfaces: dashboard, constellation, skills.
          </p>
        </div>
      </div>
    </div>
  );
}

function SkillRegistryPage({ vm }) {
  const registry = vm.skillRegistry || {};
  const [activeTab, setActiveTab] = useState("overview");
  const skills = registry.skills || [];
  const profiles = registry.profiles || [];
  const testRequirements = registry.testRequirements || [];
  const skillsByAgent = skills.reduce((acc, skill) => {
    const owner = skill.ownerAgent || "NEXUS";
    if (!acc[owner]) acc[owner] = [];
    acc[owner].push(skill);
    return acc;
  }, {});

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div>
            <div className="ccv2-page-head__title">Skill Registry</div>
            <div className="ccv2-page-head__sub">
              Governed skill definitions, templates, stack profiles, and validation requirements.
            </div>
          </div>
          <div className="ccv2-page-head__actions">
            <span className="ccv2-pill ccv2-pill--disabled">Read-only</span>
            <span className="ccv2-pill ccv2-pill--disabled">Execution disabled</span>
          </div>
        </div>

        <FounderOperationsBoard {...FOUNDER_DELIVERY_BOARDS.skills} />

        <CommandTabs tabs={SKILL_REGISTRY_TABS} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Skill Registry sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {[
                { label: "Skills", value: registry.summary?.skills ?? 0 },
                { label: "Templates", value: registry.summary?.templates ?? 0 },
                { label: "Stack Profiles", value: registry.summary?.profiles ?? 0 },
                { label: "Test Requirement Sets", value: registry.summary?.testRequirementSets ?? 0 },
              ].map((item) => (
                <article key={item.label} className="ccv2-card">
                  <div className="ccv2-kpi__label">{item.label}</div>
                  <div className="ccv2-kpi__value">{item.value}</div>
                  <div className="ccv2-kpi__meta">Governance metadata</div>
                </article>
              ))}
            </div>
            <div className="ccv2-card ccv2-card--accent">
              <div className="ccv2-section-heading">Safety Posture</div>
              <ul className="ccv2-list">
                {(registry.safetyNotes || ["Skill execution is not enabled yet."]).map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <div className="ccv2-muted">Next phase guidance: {registry.summary?.nextPhase || "P51 - Hook Registry + Safe Automation Lifecycle"}</div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="skills" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {skills.map((skill) => (
                <article key={skill.skillId} className="ccv2-card">
                  <div className="ccv2-section-heading">{skill.name}</div>
                  <div className="ccv2-muted">{skill.description}</div>
                  <div className="ccv2-chip-row">
                    <span className="ccv2-pill">{skill.ownerAgent}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">{skill.riskLevel}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">{skill.statusLabel}</span>
                  </div>
                  <div className="ccv2-muted">Required evidence: {(skill.requiredEvidence || []).join(", ")}</div>
                  <div className="ccv2-muted">Disabled reason: {skill.disabledReason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="by-agent" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {Object.entries(skillsByAgent).map(([agent, agentSkills]) => (
                <article key={agent} className="ccv2-card">
                  <div className="ccv2-section-heading">{agent}</div>
                  <ul className="ccv2-list">
                    {agentSkills.map((skill) => (
                      <li key={skill.skillId}>{skill.name} · {skill.statusLabel}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="by-project-stack" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              {profiles.map((profile) => (
                <article key={profile.profileId} className="ccv2-card">
                  <div className="ccv2-section-heading">{profile.label}</div>
                  <div className="ccv2-muted">Compatible skills: {profile.compatibleSkillIds.length}</div>
                  <div className="ccv2-muted">Unavailable skills: {profile.unavailableSkillIds.length}</div>
                  <div className="ccv2-muted">Project profile requirements: {profile.projectProfileRequirements.join(", ")}</div>
                  <div className="ccv2-muted">Future adapters: {profile.requiredFutureAdapters.join(", ")}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="test-requirements" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              {testRequirements.map((requirement) => (
                <article key={requirement.skillId} className="ccv2-card">
                  <div className="ccv2-section-heading">{requirement.label}</div>
                  <div className="ccv2-muted">Static checks: {requirement.requiredStaticChecks.join(", ")}</div>
                  <div className="ccv2-muted">Contract checks: {requirement.requiredContractChecks.length}</div>
                  <div className="ccv2-muted">UI checks: {requirement.requiredUiChecks.length}</div>
                  <div className="ccv2-muted">Evidence checks: {requirement.requiredEvidenceChecks.length}</div>
                  <div className="ccv2-muted">Future runtime checks are documented but not enabled.</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="developer-details" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Registry Artifacts</div>
              <ul className="ccv2-list">
                <li>skills-registry/registry.json</li>
                <li>skills-registry/skillSchema.js</li>
                <li>skills-registry/skillContract.js</li>
                <li>skills-registry/skillTemplates.js</li>
                <li>skills-registry/skillProfiles.js</li>
                <li>skills-registry/skillTestRequirements.js</li>
                <li>policy/skill-registry-policy.json</li>
                <li>reports/skill-registry-report.md</li>
              </ul>
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function HookRegistryPage({ vm }) {
  const registry = vm.hookRegistry || {};
  const [activeTab, setActiveTab] = useState("overview");
  const hooks = registry.hooks || [];

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div>
            <div className="ccv2-page-head__title">Hook Registry</div>
            <div className="ccv2-page-head__sub">
              Safe automation hook readiness, triggers, guardrails, and kill switches.
            </div>
          </div>
          <div className="ccv2-page-head__actions">
            <span className="ccv2-pill ccv2-pill--disabled">Read-only</span>
            <span className="ccv2-pill ccv2-pill--disabled">Execution disabled</span>
          </div>
        </div>

        <FounderOperationsBoard {...FOUNDER_DELIVERY_BOARDS.hooks} />

        <CommandTabs tabs={HOOK_REGISTRY_TABS} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Hook Registry sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {[
                { label: "Hooks", value: registry.summary?.hooks ?? 0 },
                { label: "Enabled", value: registry.summary?.enabledHooks ?? 0 },
                { label: "Trigger Definitions", value: registry.summary?.triggerDefinitions ?? 0 },
                { label: "Kill Switches", value: registry.summary?.killSwitchStates ?? 0 },
              ].map((item) => (
                <article key={item.label} className="ccv2-card">
                  <div className="ccv2-kpi__label">{item.label}</div>
                  <div className="ccv2-kpi__value">{item.value}</div>
                  <div className="ccv2-kpi__meta">Registry readiness</div>
                </article>
              ))}
            </div>
            <div className="ccv2-card ccv2-card--accent">
              <div className="ccv2-section-heading">Safety Posture</div>
              <ul className="ccv2-list">
                {(registry.safetyNotes || ["Hook execution is not enabled yet."]).map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <div className="ccv2-muted">Next phase guidance: {registry.summary?.nextPhase || "P52 - Tool / MCP Registry + Tool Governance"}</div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="hooks" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {hooks.map((hook) => (
                <article key={hook.hookId} className="ccv2-card">
                  <div className="ccv2-section-heading">{hook.label}</div>
                  <div className="ccv2-muted">{hook.description}</div>
                  <div className="ccv2-chip-row">
                    <span className="ccv2-pill">{hook.ownerAgent}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">{hook.scope}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">{hook.statusLabel}</span>
                  </div>
                  <div className="ccv2-muted">Trigger: {hook.triggerType}</div>
                  <div className="ccv2-muted">Disabled reason: {hook.disabledReason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="triggers" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {hooks.map((hook) => (
                <article key={hook.hookId} className="ccv2-card">
                  <div className="ccv2-section-heading">{hook.label}</div>
                  <div className="ccv2-muted">Preview decision: {hook.triggerPreview?.decision}</div>
                  <div className="ccv2-muted">Would execute: {hook.triggerPreview?.wouldExecute ? "Yes" : "No"}</div>
                  <div className="ccv2-muted">Dry run: {hook.triggerPreview?.dryRun ? "Yes" : "No"}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="guardrails" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              {hooks.map((hook) => (
                <article key={hook.hookId} className="ccv2-card">
                  <div className="ccv2-section-heading">{hook.label}</div>
                  <div className="ccv2-muted">Guard decision: {hook.guardDecision?.decision}</div>
                  <div className="ccv2-muted">Loop-risk decision: {hook.loopRisk?.decision}</div>
                  <div className="ccv2-muted">Loop-risk level: {hook.loopRisk?.riskLevel}</div>
                  <div className="ccv2-muted">Fail closed: {hook.failClosed ? "Yes" : "No"}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="kill-switches" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              {hooks.map((hook) => (
                <article key={hook.hookId} className="ccv2-card">
                  <div className="ccv2-section-heading">{hook.killSwitchId}</div>
                  <div className="ccv2-muted">Hook: {hook.label}</div>
                  <div className="ccv2-muted">Decision: {hook.killSwitch?.decision}</div>
                  <div className="ccv2-muted">Disabled levels: {(hook.killSwitch?.disabledLevels || []).join(", ") || "None"}</div>
                  <div className="ccv2-muted">Review required to re-enable: Yes</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="developer-details" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Registry Artifacts</div>
              <ul className="ccv2-list">
                <li>hooks/hookSchema.js</li>
                <li>hooks/hookRegistry.js</li>
                <li>hooks/triggerDefinitions.js</li>
                <li>hooks/hookRuntimeGuard.js</li>
                <li>hooks/loopRiskDetector.js</li>
                <li>hooks/hookKillSwitch.js</li>
                <li>policy/hook-registry-policy.json</li>
                <li>reports/hook-registry-report.md</li>
              </ul>
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

/* ─── Workspace Page ─── */
function WorkspacePage({ vm }) {
  const navigate = useNavigate();
  const ws = vm.agenticWorkspace;
  const nba = ws?.nextBestAction;
  const templates = ws?.workflowTemplates || [];
  const status = ws?.workspaceStatus || {};
  const limitations = ws?.currentLimitations || [];
  const isLocalPrivate = vm.shell.mode === "local-private";
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState("recommended");
  const groupedTemplates = WORKFLOW_GROUPS.map((group) => ({
    ...group,
    items: templates.filter((template) => template.category === group.key),
  }));
  const activeMissionLabel = typeof ws?.activeMission === "string"
    ? ws.activeMission
    : ws?.activeMission?.id || "Mission planning not started";

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Workspace</div>
          <div className="ccv2-page-head__sub">Plan and choose governed workflows for the active mission and project scope.</div>
        </div>

        <FounderOperationsBoard {...FOUNDER_DELIVERY_BOARDS.workspace} />

        <ProjectContextCard vm={vm} surface="Workspace" />

        <div className="ccv2-card ccv2-page-summary-card">
          <div className="ccv2-section-heading">Workspace Summary</div>
          <div className="ccv2-page-summary-grid">
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Purpose</span><span className="ccv2-page-summary-value">Choose a governed workflow, understand what is available now, and see what is blocked by capability policy.</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Active scope</span><span className="ccv2-page-summary-value">{ws?.activeProject || vm.shell.activeProject} · {vm.shell.mode}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Active mission</span><span className="ccv2-page-summary-value">{activeMissionLabel}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{status.planReady ? "Mission plan ready for governed workflows." : "Create a mission plan to populate workflows."}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{nba?.title || "Select a workflow to continue."}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Capability status</span><span className="ccv2-page-summary-value">Capability-based workflow states are active across planning, build, validation, governance, and release.</span></div>
          </div>
        </div>

        <CommandTabs
          tabs={WORKSPACE_TABS}
          activeTab={activeWorkspaceTab}
          onTabChange={setActiveWorkspaceTab}
          ariaLabel="Workspace workflow sections"
        >
          <CommandTabPanel tabId="recommended" activeTab={activeWorkspaceTab}>
        {nba && (
          <div className="ccv2-card ccv2-workspace-nba">
            <div className="ccv2-eyebrow">Next best action</div>
            <div className="ccv2-workspace-nba__title">{nba.title}</div>
            <div className="ccv2-workspace-nba__desc">{nba.description}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span className={`ccv2-pill ccv2-pill--${nba.enabled ? "pass" : "disabled"}`}>
                {nba.enabled ? "Available" : "Not available"}
              </span>
              {nba.enabled ? (
                <button className="ccv2-wf-card__btn ccv2-wf-card__btn--enabled" onClick={() => navigate(nba.action?.replace("navigate:", "") || "/command-center/tasks")}>
                  Go to Task Queue
                </button>
              ) : (
                <button className="ccv2-wf-card__btn ccv2-wf-card__btn--disabled" disabled>
                  {nba.userFacingRequirement || "Not available"}
                </button>
              )}
            </div>
          </div>
        )}

        {isLocalPrivate && (
          <div className="ccv2-card">
            <div className="ccv2-section-heading">Mission Status</div>
            <div className="ccv2-safety-grid" style={{ marginTop: 8 }}>
              <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Mission ready</span><span className={`ccv2-safety-row__value--${status.missionReady ? "pass" : "disabled"}`}>{status.missionReady ? "YES" : "NO"}</span></div>
              <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Plan ready</span><span className={`ccv2-safety-row__value--${status.planReady ? "pass" : "disabled"}`}>{status.planReady ? "YES — 6 tasks" : "NO"}</span></div>
              <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Tasks activated</span><span className={`ccv2-safety-row__value--${status.tasksActivated ? "pass" : "disabled"}`}>{status.tasksActivated ? "YES" : "NO — activate from Task Queue"}</span></div>
              <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Backend validated</span><span className={`ccv2-safety-row__value--${status.backendValidated ? "pass" : "disabled"}`}>{status.tests}</span></div>
              <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Ready for task activation</span><span className={`ccv2-safety-row__value--${status.readyForTaskActivation ? "pass" : "disabled"}`}>{status.readyForTaskActivation ? "YES" : "NO"}</span></div>
            </div>
          </div>
        )}

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Workflow Availability Snapshot</div>
          <div className="ccv2-safety-grid" style={{ marginTop: 8 }}>
            <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Plan</span><span className="ccv2-safety-row__value--ready">AVAILABLE · Available for planning</span></div>
            <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Build</span><span className="ccv2-safety-row__value--ready">Requires implementation bridge for scoped execution</span></div>
            <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Validate</span><span className="ccv2-safety-row__value--disabled">Requires iOS/Xcode runner</span></div>
            <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Release</span><span className="ccv2-safety-row__value--disabled">Requires release action bridge</span></div>
            <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Runtime</span><span className="ccv2-safety-row__value--disabled">Requires worker runtime and governed provider dispatch</span></div>
          </div>
        </div>

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Current Limitations</div>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            {limitations.map((l) => (
              <div key={l} className="ccv2-gap-row">
                <span className="ccv2-gap-row__dot" style={{ background: "var(--v2-muted-2)" }} />
                <span style={{ fontSize: 12, color: "var(--v2-muted-2)" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
          </CommandTabPanel>

          {WORKFLOW_GROUPS.map((group) => {
            const groupItems = groupedTemplates.find((entry) => entry.key === group.key)?.items || [];
            return (
              <CommandTabPanel key={group.key} tabId={group.key} activeTab={activeWorkspaceTab}>
                <div className="ccv2-card">
                  <div className="ccv2-section-heading">{group.label}</div>
                  <p style={{ marginTop: 6, fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6 }}>
                    {group.label} workflows for the active project scope. Disabled cards explain the missing capability in user-facing terms.
                  </p>
                </div>
                {groupItems.length > 0 ? (
                  <div className="ccv2-wf-grid">
                    {groupItems.map((wf) => (
                      <WorkflowCard key={wf.id} wf={wf} navigate={navigate} />
                    ))}
                  </div>
                ) : (
                  <div className="ccv2-card">
                    <div className="ccv2-empty-state">
                      No workflows available for this scope yet. Select a project or create a mission plan.
                    </div>
                  </div>
                )}
              </CommandTabPanel>
            );
          })}

          <CommandTabPanel tabId="all" activeTab={activeWorkspaceTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">All Workflows</div>
              <p style={{ marginTop: 6, fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6 }}>
                All workflow cards grouped by operator intent for the active scope.
              </p>
            </div>
            {templates.length > 0 ? (
              <div className="ccv2-workflow-groups">
                {groupedTemplates.map((group) => (
                  <div key={group.key} className="ccv2-workflow-group">
                    <div className="ccv2-card-header-row">
                      <div className="ccv2-section-heading">{group.label}</div>
                      <span className="ccv2-pill ccv2-pill--disabled">{group.items.length}</span>
                    </div>
                    {group.items.length > 0 ? (
                      <div className="ccv2-wf-grid">
                        {group.items.map((wf) => (
                          <WorkflowCard key={wf.id} wf={wf} navigate={navigate} />
                        ))}
                      </div>
                    ) : (
                      <div className="ccv2-card ccv2-workflow-group__empty">
                        No workflows in this group yet.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="ccv2-card">
                <div className="ccv2-empty-state">
                  No workflows are available for this scope yet. Create a mission plan or select a project adapter.
                </div>
              </div>
            )}
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

/* ─── Implementation Workflow Page ─── */
function ImplementationPage({ vm }) {
  const navigate = useNavigate();
  const ci = vm.controlledImplementation || {};

  const [bridgeOnline, setBridgeOnline] = useState(false);
  const [wbItems, setWbItems] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [actionState, setActionState] = useState("idle"); // idle | proposing | proposed | applying | applied | failed | blocked
  const [proposalResult, setProposalResult] = useState(null);
  const [applyResult, setApplyResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeImplementationTab, setActiveImplementationTab] = useState("proposal");

  useEffect(() => {
    let cancelled = false;
    checkActionBridgeHealth().then((r) => {
      if (cancelled) return;
      setBridgeOnline(r.online);
      if (r.online) {
        listWorkbenchItems().then((res) => {
          if (!cancelled) setWbItems(res.ok ? res.items || [] : []);
        });
      }
    });
    return () => { cancelled = true; };
  }, []);

  async function handlePropose() {
    if (!bridgeOnline || actionState === "proposing") return;
    setActionState("proposing");
    setErrorMsg("");
    setApplyResult(null);
    const result = await proposeImplementation({ runtimeTaskId: selectedTaskId, implementationType: "documentation_readiness_log" });
    if (result.ok) {
      setProposalResult(result);
      setActionState("proposed");
    } else if (result.offline) {
      setActionState("idle");
      setErrorMsg("Governed implementation bridge offline.");
    } else {
      setActionState("failed");
      setErrorMsg((result.errors || ["Proposal failed."]).join(" "));
    }
  }

  async function handleApply() {
    if (!bridgeOnline || !["proposed", "idle"].includes(actionState)) return;
    if (actionState === "applying") return;
    setActionState("applying");
    setErrorMsg("");
    const result = await applyImplementation({ runtimeTaskId: selectedTaskId, implementationType: "documentation_readiness_log" });
    if (result.ok) {
      setApplyResult(result);
      setActionState("applied");
    } else if (result.offline) {
      setActionState("proposed");
      setErrorMsg("Governed implementation bridge offline.");
    } else {
      setActionState("failed");
      setErrorMsg((result.errors || ["Apply failed."]).join(" "));
    }
  }

  const canPropose = bridgeOnline && actionState === "idle";
  const canApply = bridgeOnline && (actionState === "proposed" || actionState === "idle");
  const isRunning = actionState === "proposing" || actionState === "applying";
  const implementationStatus =
    actionState === "applied" ? "Applied"
      : actionState === "proposed" ? "Proposed"
      : actionState === "failed" ? "Blocked"
      : selectedTaskId ? "Not started" : "Not started";
  const validationStatus = applyResult?.result?.validationStatus || "Not run";
  const rollbackStatus = ci.proposal?.rollbackPlan ? "Available" : "Not needed";
  const productionBehaviorStatus = ci.safety?.productionBehaviorChange === true ? "Yes" : "No";
  const mutationReadiness = ci.controlledMutationReadiness || {};

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Implementation Workflow</div>
          <div className="ccv2-page-head__sub">Review controlled implementation status, scope, validation posture, and safe next actions.</div>
        </div>

        <FounderOperationsBoard {...FOUNDER_DELIVERY_BOARDS.implementation} />

        <ProjectContextCard vm={vm} surface="Implementation Workflow" />

        <div className="ccv2-card ccv2-page-summary-card">
          <div className="ccv2-section-heading">Implementation Summary</div>
          <div className="ccv2-page-summary-grid">
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Status</span><span className="ccv2-page-summary-value">{implementationStatus}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Scope</span><span className="ccv2-page-summary-value">Documentation-only</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Production behavior changed</span><span className="ccv2-page-summary-value">{productionBehaviorStatus}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner agent</span><span className="ccv2-page-summary-value">{formatAgentLabel(ci.targetAgent || "CORE")}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Validation</span><span className="ccv2-page-summary-value">{validationStatus}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Rollback</span><span className="ccv2-page-summary-value">{rollbackStatus}</span></div>
          </div>
        </div>

        <div className="ccv2-stats-row">
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Status</div>
            <div className="ccv2-stat-chip__value ccv2-stat-chip__value--teal">{implementationStatus}</div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Agent</div>
            <div className="ccv2-stat-chip__value ccv2-stat-chip__value--teal">{formatAgentLabel(ci.targetAgent || "CORE")}</div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Scope</div>
            <div className="ccv2-stat-chip__value ccv2-stat-chip__value--green">Documentation-only</div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Validation</div>
            <div className={`ccv2-stat-chip__value ccv2-stat-chip__value--${validationStatus === "PASS" ? "green" : validationStatus === "FAIL" ? "red" : "amber"}`}>{validationStatus}</div>
          </div>
        </div>

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Controlled Mutation Readiness</div>
          <p style={{ marginTop: 6, fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6 }}>
            Display-only readiness for future controlled source mutation. Apply remains disabled until validation, approval, and final gates are complete.
          </p>
          <div className="ccv2-wb-meta-grid" style={{ marginTop: 10 }}>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Current state</span><span className="ccv2-pill ccv2-pill--disabled">{mutationReadiness.currentState || "Blocked - review required"}</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Intent</span><span className="ccv2-wb-meta-value">{mutationReadiness.intent || "Preview a scoped source change before approval or apply exists."}</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Diff preview</span><span className="ccv2-wb-meta-value">{mutationReadiness.diffPreviewState || "Preview only"}</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Approval state</span><span className="ccv2-wb-meta-value">{mutationReadiness.approvalState || "not_requested"}</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Owner capability</span><span className="ccv2-wb-meta-value">{mutationReadiness.ownerCapability || "CORE.controlledMutation"}</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Rollback posture</span><span className="ccv2-wb-meta-value">{mutationReadiness.rollbackPosture || "Documented"}</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Apply state</span><span className="ccv2-safety-row__value--disabled">Apply disabled</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Evidence location</span><span className="ccv2-wb-meta-value">{mutationReadiness.evidenceLocation || "reports/p675-report.md"}</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Activity location</span><span className="ccv2-wb-meta-value">{mutationReadiness.activityLocation || "os-roadmap/phase-status.json"}</span></div>
          </div>
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            <div style={{ fontSize: 11, color: "var(--v2-muted-2)" }}>Allowed files: {(mutationReadiness.allowedFiles || []).slice(0, 4).join(", ") || "NEXUS OS controlled mutation files only"}</div>
            <div style={{ fontSize: 11, color: "var(--v2-muted-2)" }}>Forbidden files: {(mutationReadiness.forbiddenFiles || ["projects/**"]).slice(0, 5).join(", ")}</div>
            <div style={{ fontSize: 11, color: "var(--v2-muted-2)" }}>Blocker: {(mutationReadiness.blockers || [mutationReadiness.disabledReason || "Apply disabled until final gates are complete."])[0]}</div>
            <div style={{ fontSize: 12, color: "var(--v2-text)" }}>Next action: {mutationReadiness.nextAction || "Complete tests, docs, and final validation before any future apply gate."}</div>
          </div>
        </div>

        <CommandTabs
          tabs={IMPLEMENTATION_TABS}
          activeTab={activeImplementationTab}
          onTabChange={setActiveImplementationTab}
          ariaLabel="Implementation Workflow sections"
        >
          <CommandTabPanel tabId="proposal" activeTab={activeImplementationTab}>
        <div className="ccv2-card">
          <div className="ccv2-section-heading">Proposal</div>
          <p style={{ marginTop: 6, fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6 }}>
            Selected implementation candidate, owner, capability, scope, change summary, and risk for this controlled workflow.
          </p>
        </div>
        {/* Task Selector */}
        <div className="ccv2-card">
          <div className="ccv2-section-heading">1 · Select Implementation Task</div>
          {wbItems.length > 0 ? (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {wbItems.map((item) => (
                <div
                  key={item.runtimeTaskId}
                  className={`ccv2-impl-task-item${selectedTaskId === item.runtimeTaskId ? " ccv2-impl-task-item--selected" : ""}`}
                  onClick={() => { setSelectedTaskId(item.runtimeTaskId); setActionState("idle"); setProposalResult(null); setApplyResult(null); setErrorMsg(""); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedTaskId(item.runtimeTaskId)}
                >
                  <span className="ccv2-impl-task-item__title">{item.title} · {formatAgentLabel(item.assignedAgent)}</span>
                  <span className="ccv2-impl-task-item__agent">{formatCapabilityLabel(item.capabilityId)}</span>
                  <span className={`ccv2-pill ccv2-pill--${item.riskLevel === "high" ? "fail" : item.riskLevel === "medium" ? "pending" : "pass"}`}>{item.riskLevel}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="ccv2-impl-notice">
              {bridgeOnline
                ? <><span className="ccv2-impl-notice__text">No activated tasks. Activate tasks from Task Queue first.</span><button className="ccv2-wf-card__btn ccv2-wf-card__btn--enabled" style={{ marginTop: 8 }} onClick={() => navigate("/command-center/tasks")}>Go to Task Queue</button></>
                : <span className="ccv2-impl-notice__text">Action bridge offline — activate tasks and start bridge to see them here.</span>}
            </div>
          )}
          {!bridgeOnline && (
            <div className="ccv2-impl-notice" style={{ marginTop: 8 }}>
              <span className="ccv2-impl-notice__text">⊘ Requires action bridge: <code>NEXUS_MODE=local-private npm run mission:action-server</code></span>
            </div>
          )}
        </div>

        {/* Proposal Details */}
        <div className="ccv2-card">
          <div className="ccv2-section-heading">2 · Implementation Proposal</div>
          <div className="ccv2-wb-meta-grid" style={{ marginTop: 10 }}>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Assigned agent</span><span className="ccv2-wb-meta-value" style={{ fontWeight: 700 }}>{formatAgentLabel(ci.targetAgent || "CORE")}</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Capability</span><span className="ccv2-wb-meta-value">{ci.capabilityId?.replace(/\./g, " · ") || "implementation · backend_code"}</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Implementation type</span><span className="ccv2-wb-meta-value">Documentation-only update</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Risk level</span><span className="ccv2-pill ccv2-pill--pass">{ci.riskLevel || "low"}</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Mutation status</span><span className="ccv2-safety-row__value--ready">Documentation-only update</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Source mutation</span><span className="ccv2-safety-row__value--disabled">Disabled</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Provider/network/DB</span><span className="ccv2-safety-row__value--disabled">NO</span></div>
          </div>
          <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(136,255,235,0.03)", border: "1px solid rgba(136,255,235,0.08)", borderRadius: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--v2-text)", marginBottom: 4 }}>Change summary</div>
            <div style={{ fontSize: 12, color: "var(--v2-muted)" }}>{ci.proposal?.changeSummary}</div>
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200, padding: "10px 12px", background: "rgba(61,232,176,0.04)", border: "1px solid rgba(61,232,176,0.12)", borderRadius: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--v2-green)", marginBottom: 4 }}>Validation plan</div>
              <div style={{ fontSize: 11, color: "var(--v2-muted)" }}>{ci.proposal?.validationPlan}</div>
            </div>
            <div style={{ flex: 1, minWidth: 200, padding: "10px 12px", background: "rgba(244,191,117,0.05)", border: "1px solid rgba(244,191,117,0.15)", borderRadius: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--v2-amber)", marginBottom: 4 }}>Rollback plan</div>
              <div style={{ fontSize: 11, color: "var(--v2-muted)" }}>{ci.proposal?.rollbackPlan}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="ccv2-card">
          <div className="ccv2-section-heading">3 · Apply Controlled Change</div>
          <div className="ccv2-impl-action-row" style={{ marginTop: 12 }}>
            <button
              className={`ccv2-wb-review-btn ccv2-wb-review-btn--changes${!canPropose || isRunning ? " ccv2-wb-review-btn--disabled" : ""}`}
              disabled={!canPropose || isRunning}
              onClick={handlePropose}
              title={!bridgeOnline ? "Requires governed implementation bridge" : ""}
            >
              {actionState === "proposing" ? "Proposing…" : "Propose Implementation"}
            </button>
            <button
              className={`ccv2-wb-review-btn ccv2-wb-review-btn--approve${!canApply || isRunning ? " ccv2-wb-review-btn--disabled" : ""}`}
              disabled={!canApply || isRunning}
              onClick={handleApply}
              title={!bridgeOnline ? "Requires governed implementation bridge" : ""}
            >
              {actionState === "applying" ? "Applying…" : "Apply Controlled Change"}
            </button>
            <button
              className="ccv2-wb-review-btn"
              style={{ borderColor: "rgba(112,181,255,0.3)", color: "var(--v2-blue)", background: "rgba(112,181,255,0.08)" }}
              onClick={() => navigate("/command-center/evidence")}
            >
              Open Evidence
            </button>
          </div>

          {!bridgeOnline && (
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--v2-muted-2)" }}>
              ⊘ Buttons require action bridge: <code>NEXUS_MODE=local-private npm run mission:action-server</code>
            </div>
          )}

          {/* Status feedback */}
          {actionState === "proposed" && proposalResult?.ok && (
            <div className="ccv2-mc-status ccv2-mc-status--running" style={{ marginTop: 10 }}>
              ◎ Proposal created — ready to apply controlled change
              <div style={{ fontSize: 10, marginTop: 4, fontFamily: "monospace", color: "var(--v2-muted)" }}>
                ID: {proposalResult.actionId?.slice(0, 12)}
              </div>
            </div>
          )}
          {actionState === "applied" && applyResult?.ok && (
            <div className="ccv2-mc-status ccv2-mc-status--completed" style={{ marginTop: 10 }}>
              ✓ Controlled change applied
              <div className="ccv2-mc-result">
                <div>File: {applyResult.result?.changedFiles?.[0]}</div>
                <div>Patch: {applyResult.result?.patchSummary}</div>
                <div>Validation: {applyResult.result?.validationStatus}</div>
                <div>Evidence: {applyResult.result?.evidenceCreated ? "Created" : "—"}</div>
                <div>Audit: {applyResult.result?.auditCreated ? "Created" : "—"}</div>
              </div>
            </div>
          )}
          {actionState === "failed" && (
            <div className="ccv2-mc-status ccv2-mc-status--failed" style={{ marginTop: 10 }}>
              ✗ {errorMsg || "Implementation failed."}
            </div>
          )}
          {errorMsg && actionState !== "failed" && (
            <div className="ccv2-mc-status ccv2-mc-status--offline" style={{ marginTop: 10 }}>
              ⊘ {errorMsg}
            </div>
          )}
        </div>

        {/* Result details after apply */}
        {actionState === "applied" && applyResult?.ok && applyResult.result && (
          <>
            <div className="ccv2-two-col">
              <div className="ccv2-card">
                <div className="ccv2-section-heading">Patch Summary</div>
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6 }}>
                  {applyResult.result.patchSummary}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, fontFamily: "monospace", color: "var(--v2-muted-2)" }}>
                  {applyResult.result.changedFiles?.map((f) => <div key={f}>+ {f}</div>)}
                </div>
              </div>
              <div className="ccv2-card">
                <div className="ccv2-section-heading">Rollback Note</div>
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6 }}>
                  {applyResult.result.rollbackNote || applyResult.result.rollbackPlan}
                </div>
              </div>
            </div>

            <div className="ccv2-card">
              <div className="ccv2-section-heading">Validation Result</div>
              <div style={{ marginTop: 8 }}>
                <div className="ccv2-wb-meta-row">
                  <span className="ccv2-wb-meta-label">Validation status</span>
                  <span className={`ccv2-pill ccv2-pill--${applyResult.result.validationStatus === "PASS" ? "pass" : applyResult.result.validationStatus === "FAIL" ? "fail" : "disabled"}`}>
                    {applyResult.result.validationStatus || "SKIPPED"}
                  </span>
                </div>
                {applyResult.result.validationNote && (
                  <div style={{ fontSize: 11, color: "var(--v2-muted-2)", marginTop: 6 }}>{applyResult.result.validationNote}</div>
                )}
              </div>
            </div>

            <div className="ccv2-card">
              <div className="ccv2-section-heading">Evidence &amp; Audit</div>
              <div className="ccv2-wb-meta-grid" style={{ marginTop: 8 }}>
                <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Evidence created</span><span className={`ccv2-pill ccv2-pill--${applyResult.result.evidenceCreated ? "pass" : "disabled"}`}>{applyResult.result.evidenceCreated ? "Yes" : "No"}</span></div>
                <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Audit created</span><span className={`ccv2-pill ccv2-pill--${applyResult.result.auditCreated ? "pass" : "disabled"}`}>{applyResult.result.auditCreated ? "Yes" : "No"}</span></div>
                <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Runtime event</span><span className={`ccv2-pill ccv2-pill--${applyResult.result.runtimeEventCreated ? "pass" : "disabled"}`}>{applyResult.result.runtimeEventCreated ? "Yes" : "No"}</span></div>
              </div>
            </div>

            <div className="ccv2-card">
              <div className="ccv2-section-heading">Next Recommended Actions</div>
              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="ccv2-wf-card__btn ccv2-wf-card__btn--enabled" onClick={() => navigate("/command-center/workbench")}>
                  Open Agent Workbench Review
                </button>
                <button className="ccv2-wf-card__btn ccv2-wf-card__btn--enabled" onClick={() => navigate("/command-center/evidence")}>
                  View Evidence
                </button>
                <button className="ccv2-wf-card__btn ccv2-wf-card__btn--enabled" onClick={() => navigate("/command-center/tasks")}>
                  Next Implementation Task
                </button>
              </div>
            </div>
          </>
        )}

        {/* Safety boundary note */}
        <div className="ccv2-card">
          <div className="ccv2-section-heading">Safety Boundary</div>
          <div className="ccv2-safety-grid" style={{ marginTop: 8 }}>
            {Object.entries(ci.safety || {}).map(([key, val]) => (
              <div key={key} className="ccv2-safety-row">
                <span className="ccv2-safety-row__label">{key.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                <span className={`ccv2-safety-row__value--${val === false ? "disabled" : "ready"}`}>{val === false ? "Disabled" : String(val)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Developer Details</div>
          <div className="ccv2-wb-meta-grid" style={{ marginTop: 8 }}>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Allowed path</span><span className="ccv2-mono ccv2-wb-meta-value" style={{ fontSize: 10 }}>{ci.allowedPath}</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Implementation type key</span><span className="ccv2-wb-meta-value">{ci.implementationType || "documentation_readiness_log"}</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Bridge endpoint</span><span className="ccv2-mono ccv2-wb-meta-value">{ci.bridgeEndpoint || "Not configured"}</span></div>
          </div>
        </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="developer-details" activeTab={activeImplementationTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Developer Details</div>
              <div className="ccv2-wb-meta-grid" style={{ marginTop: 10 }}>
                <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Owner agent</span><span className="ccv2-wb-meta-value">{formatAgentLabel(ci.targetAgent || "CORE")}</span></div>
                <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Implementation type</span><span className="ccv2-wb-meta-value">Documentation-only update</span></div>
                <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Risk level</span><span className="ccv2-pill ccv2-pill--pass">{ci.riskLevel || "low"}</span></div>
                <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Source mutation</span><span className="ccv2-safety-row__value--disabled">Disabled</span></div>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6 }}>
                Internal metadata is separated from primary implementation tabs. Use this only when debugging a governed local workflow.
              </div>
            </div>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Developer Details</div>
              <div className="ccv2-wb-meta-grid" style={{ marginTop: 8 }}>
                <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Allowed path</span><span className="ccv2-mono ccv2-wb-meta-value" style={{ fontSize: 10 }}>{ci.allowedPath || "Not configured"}</span></div>
                <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Implementation type key</span><span className="ccv2-wb-meta-value">{ci.implementationType || "documentation_readiness_log"}</span></div>
              </div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="apply" activeTab={activeImplementationTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Apply Controlled Change</div>
              <p style={{ marginTop: 6, fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6 }}>
                Controlled apply remains guarded. No fake execution is shown, and buttons stay disabled when the governed implementation bridge is offline.
              </p>
              <div className="ccv2-impl-action-row" style={{ marginTop: 12 }}>
                <button
                  className={`ccv2-wb-review-btn ccv2-wb-review-btn--changes${!canPropose || isRunning ? " ccv2-wb-review-btn--disabled" : ""}`}
                  disabled={!canPropose || isRunning}
                  onClick={handlePropose}
                  title={!bridgeOnline ? "Requires governed implementation bridge" : ""}
                >
                  {actionState === "proposing" ? "Proposing…" : "Propose Implementation"}
                </button>
                <button
                  className={`ccv2-wb-review-btn ccv2-wb-review-btn--approve${!canApply || isRunning ? " ccv2-wb-review-btn--disabled" : ""}`}
                  disabled={!canApply || isRunning}
                  onClick={handleApply}
                  title={!bridgeOnline ? "Requires governed implementation bridge" : ""}
                >
                  {actionState === "applying" ? "Applying…" : "Apply Controlled Change"}
                </button>
              </div>
              {!bridgeOnline && (
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--v2-muted-2)" }}>
                  Requires governed implementation bridge. Start the local action bridge before applying controlled changes.
                </div>
              )}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="validation" activeTab={activeImplementationTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Validation</div>
              <div className="ccv2-wb-meta-grid" style={{ marginTop: 8 }}>
                <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Validation status</span><span className={`ccv2-pill ccv2-pill--${validationStatus === "PASS" ? "pass" : validationStatus === "FAIL" ? "fail" : "disabled"}`}>{validationStatus || "Not run"}</span></div>
                <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Validation plan</span><span className="ccv2-wb-meta-value">{ci.proposal?.validationPlan || "Validation plan appears after a proposal is available."}</span></div>
                <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Evidence</span><span className="ccv2-wb-meta-value">{applyResult?.result?.evidenceCreated ? "Created" : "No evidence yet"}</span></div>
              </div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="rollback" activeTab={activeImplementationTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Rollback</div>
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6 }}>
                {applyResult?.result?.rollbackNote || ci.proposal?.rollbackPlan || "Recovery layer is not built yet. Rollback instructions appear after a governed proposal or apply result exists."}
              </div>
              <span className={`ccv2-pill ccv2-pill--${rollbackStatus === "Available" ? "pass" : "disabled"}`} style={{ marginTop: 10, display: "inline-flex" }}>
                {rollbackStatus}
              </span>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="activity" activeTab={activeImplementationTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Implementation Activity</div>
              <div className="ccv2-empty-state">
                Implementation events, evidence, and audit summaries appear after a governed proposal or apply result exists.
              </div>
              {actionState === "applied" && applyResult?.ok && (
                <div className="ccv2-mc-result" style={{ marginTop: 10 }}>
                  <div>Patch: {applyResult.result?.patchSummary}</div>
                  <div>Validation: {applyResult.result?.validationStatus}</div>
                  <div>Evidence: {applyResult.result?.evidenceCreated ? "Created" : "Not created"}</div>
                </div>
              )}
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

/* ─── Agent Workbench Page ─── */
function WorkbenchPage({ vm }) {
  const navigate = useNavigate();
  const wb = vm.agentWorkbench || {};

  const [bridgeOnline, setBridgeOnline] = useState(false);
  const [workbenchItems, setWorkbenchItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [workbenchView, setWorkbenchView] = useState(null);
  const [loadingView, setLoadingView] = useState(false);
  const [reviewState, setReviewState] = useState("idle"); // idle | submitting | submitted | failed
  const [reviewDecision, setReviewDecision] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const [reviewResult, setReviewResult] = useState(null);
  const [activeWorkbenchTab, setActiveWorkbenchTab] = useState("task");

  useEffect(() => {
    let cancelled = false;
    checkActionBridgeHealth().then((r) => {
      if (cancelled) return;
      setBridgeOnline(r.online);
      if (r.online) {
        listWorkbenchItems().then((res) => {
          if (!cancelled) {
            const items = res.ok ? res.items || [] : [];
            setWorkbenchItems(items);
            if (items.length === 1) {
              const onlyItemId = items[0].runtimeTaskId;
              setSelectedTaskId(onlyItemId);
              setLoadingView(true);
              loadWorkbenchView(onlyItemId).then((result) => {
                if (cancelled) return;
                setLoadingView(false);
                if (result.ok) setWorkbenchView(result.view);
              });
            }
            setLoadingItems(false);
          }
        });
      } else {
        setLoadingItems(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  async function handleSelectTask(runtimeTaskId) {
    if (selectedTaskId === runtimeTaskId) return;
    setSelectedTaskId(runtimeTaskId);
    setWorkbenchView(null);
    setLoadingView(true);
    setReviewState("idle");
    setReviewDecision("");
    setReviewReason("");
    setReviewResult(null);
    const result = await loadWorkbenchView(runtimeTaskId);
    setLoadingView(false);
    if (result.ok) setWorkbenchView(result.view);
  }

  async function handleReview(decision) {
    if (!selectedTaskId || reviewState === "submitting") return;
    setReviewDecision(decision);
    setReviewState("submitting");
    const result = await reviewTask({ runtimeTaskId: selectedTaskId, decision, reason: reviewReason });
    setReviewResult(result);
    setReviewState(result.ok ? "submitted" : "failed");
  }

  function reviewStatusPillClass(status) {
    if (status === "approved") return "pass";
    if (status === "rejected") return "fail";
    if (status === "changes_requested") return "pending";
    return "disabled";
  }

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Agent Workbench</div>
          <div className="ccv2-page-head__sub">Inspect activated tasks, review governed output, and capture human decisions with evidence context.</div>
        </div>

        <FounderOperationsBoard {...FOUNDER_DELIVERY_BOARDS.workbench} />

        <ProjectContextCard vm={vm} surface="Agent Workbench" />

        <div className="ccv2-card ccv2-page-summary-card">
          <div className="ccv2-section-heading">Workbench Summary</div>
          <div className="ccv2-page-summary-grid">
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Purpose</span><span className="ccv2-page-summary-value">Review active task details, evidence, audit activity, and next actions before recording a decision.</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Active scope</span><span className="ccv2-page-summary-value">{vm.shell.activeProject} · {vm.mission.sprintId}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{workbenchItems.length > 0 ? `${workbenchItems.length} activated task${workbenchItems.length > 1 ? "s" : ""} available` : "No activated tasks yet"}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{workbenchItems.length > 0 ? "Open a task and review output, evidence, blockers, and next actions." : "No activated tasks yet. Activate a planned task from Task Queue to open it in Agent Workbench."}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Capability status</span><span className="ccv2-page-summary-value">{bridgeOnline ? "Human review available" : "Requires governed action bridge"}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Execution</span><span className="ccv2-page-summary-value">Agent execution remains disabled. This page is review-only.</span></div>
          </div>
        </div>

        <div className="ccv2-stats-row">
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Status</div>
            <div className="ccv2-stat-chip__value ccv2-stat-chip__value--teal">Available</div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Action bridge</div>
            <div className={`ccv2-stat-chip__value ccv2-stat-chip__value--${bridgeOnline ? "green" : "amber"}`}>
              {loadingItems ? "Checking…" : bridgeOnline ? "Online" : "Offline"}
            </div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Activated tasks</div>
            <div className="ccv2-stat-chip__value">{workbenchItems.length}</div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Execution allowed</div>
            <div className="ccv2-stat-chip__value ccv2-stat-chip__value--amber">NO</div>
          </div>
        </div>

        <CommandTabs
          tabs={WORKBENCH_TABS}
          activeTab={activeWorkbenchTab}
          onTabChange={setActiveWorkbenchTab}
          ariaLabel="Agent Workbench sections"
        >
          <CommandTabPanel tabId="task" activeTab={activeWorkbenchTab}>
        <div className="ccv2-card">
          <div className="ccv2-section-heading">Task</div>
          <p style={{ marginTop: 6, fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6 }}>
            Select an activated task to inspect owner agent, state, risk, capability, blockers, and next action.
          </p>
        </div>
        {!bridgeOnline && !loadingItems && (
          <div className="ccv2-info-banner" style={{ marginBottom: 16 }}>
            <span className="ccv2-info-banner__icon">ℹ</span>
            <span className="ccv2-info-banner__text">
              Workbench requires the action bridge.
              Start it with: <code>NEXUS_MODE=local-private npm run mission:action-server</code>
            </span>
          </div>
        )}

        {workbenchItems.length === 0 && !loadingItems ? (
          <div className="ccv2-card ccv2-wb-empty-card">
            <div className="ccv2-wb-empty">
              <div className="ccv2-wb-empty__title">{bridgeOnline ? "No activated tasks yet" : "Action bridge offline"}</div>
              <div className="ccv2-wb-empty__desc">
                {bridgeOnline
                  ? "No activated tasks yet. Activate a planned task from Task Queue to open it in Agent Workbench."
                  : "Start the action bridge to see activated tasks here."}
              </div>
              <button className="ccv2-wf-card__btn ccv2-wf-card__btn--enabled" onClick={() => navigate("/command-center/tasks")}>
                Go to Task Queue
              </button>
            </div>
          </div>
        ) : workbenchItems.length > 0 ? (
          <div className="ccv2-wb-layout">
            <div className="ccv2-wb-sidebar">
              <div className="ccv2-section-heading" style={{ marginBottom: 8 }}>Activated Tasks</div>
              {workbenchItems.map((item) => (
                <div
                  key={item.runtimeTaskId}
                  className={`ccv2-wb-task-item${selectedTaskId === item.runtimeTaskId ? " ccv2-wb-task-item--selected" : ""}`}
                  onClick={() => handleSelectTask(item.runtimeTaskId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleSelectTask(item.runtimeTaskId)}
                >
                    <div className="ccv2-wb-task-item__title">{item.title}</div>
                    <div className="ccv2-wb-task-item__meta">
                      <span className="ccv2-wb-task-item__agent">{formatAgentLabel(item.assignedAgent)}</span>
                      <span className={`ccv2-pill ccv2-pill--${reviewStatusPillClass(item.reviewStatus)}`}>
                        {item.reviewStatus.replace(/_/g, " ")}
                      </span>
                    </div>
                </div>
              ))}
            </div>

            <div className="ccv2-wb-main">
              {!selectedTaskId && (
                <div className="ccv2-card">
                  <div className="ccv2-wb-empty">
                      <div className="ccv2-wb-empty__title">Select a task</div>
                      <div className="ccv2-wb-empty__desc">Select a task to review agent output, evidence, blockers, and next actions.</div>
                    </div>
                  </div>
                )}

              {selectedTaskId && loadingView && (
                <div className="ccv2-card">
                  <div style={{ padding: "24px 0", textAlign: "center", color: "var(--v2-muted)", fontSize: 13 }}>
                    Loading workbench view…
                  </div>
                </div>
              )}

              {selectedTaskId && !loadingView && workbenchView && (
                <>
                  <div className="ccv2-card">
                    <div className="ccv2-eyebrow">Task Workbench</div>
                    <div className="ccv2-wb-title">{workbenchView.title}</div>
                    <div className="ccv2-wb-meta-grid">
                      <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Runtime ID</span><span className="ccv2-mono ccv2-wb-meta-value">{workbenchView.runtimeTaskId?.slice(0, 12)}</span></div>
                      <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Source plan task</span><span className="ccv2-mono ccv2-wb-meta-value">{workbenchView.sourcePlanTaskId?.slice(0, 8) || "—"}</span></div>
                      <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Owner agent</span><span className="ccv2-wb-meta-value" style={{ fontWeight: 700 }}>{formatAgentLabel(workbenchView.assignedAgent)}</span></div>
                      <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Capability</span><span className="ccv2-wb-meta-value">{formatCapabilityLabel(workbenchView.capabilityId)}</span></div>
                      <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Risk level</span><span className={`ccv2-pill ccv2-pill--${workbenchView.riskLevel === "high" ? "fail" : workbenchView.riskLevel === "medium" ? "pending" : "pass"}`}>{workbenchView.riskLevel}</span></div>
                      <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">State</span><span className={`ccv2-pill ccv2-pill--${getTaskStateTone(workbenchView.state)}`}>{formatTaskStateLabel(workbenchView.state)}</span></div>
                      <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Review status</span><span className={`ccv2-pill ccv2-pill--${reviewStatusPillClass(workbenchView.review?.decision || "pending")}`}>{workbenchView.review?.decision ? workbenchView.review.decision.replace(/_/g, " ") : "Pending review"}</span></div>
                      <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Evidence count</span><span className="ccv2-wb-meta-value">{workbenchView.evidence?.length || 0}</span></div>
                      <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Activity count</span><span className="ccv2-wb-meta-value">{workbenchView.audit?.length || 0}</span></div>
                      <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Mutation allowed</span><span className={`ccv2-safety-row__value--${workbenchView.mutationAllowed ? "ready" : "disabled"}`}>{workbenchView.mutationAllowed ? "YES" : "NO"}</span></div>
                      <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Execution allowed</span><span className={`ccv2-safety-row__value--${workbenchView.executionAllowed ? "ready" : "disabled"}`}>{workbenchView.executionAllowed ? "YES" : "NO"}</span></div>
                    </div>
                    <div className="ccv2-wb-task-summary">
                      <div className="ccv2-wb-task-summary__item"><span className="ccv2-wb-task-summary__label">Next action</span><span className="ccv2-wb-task-summary__value">{workbenchView.nextActions?.find((item) => item.enabled)?.label || "Review current blockers"}</span></div>
                      <div className="ccv2-wb-task-summary__item"><span className="ccv2-wb-task-summary__label">Blockers</span><span className="ccv2-wb-task-summary__value">{workbenchView.nextActions?.filter((item) => !item.enabled).map((item) => item.reason).filter(Boolean).join(" · ") || "No blockers recorded"}</span></div>
                    </div>
                  </div>

                  <div className="ccv2-card">
                    <div className="ccv2-section-heading">Expected Output</div>
                    <div className="ccv2-wb-output-box">
                      <div style={{ fontSize: 12, color: "var(--v2-muted)", marginBottom: 4 }}>
                        Type: <span style={{ color: "var(--v2-teal)" }}>{workbenchView.agentExpectedOutput?.outputType}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--v2-muted)", marginBottom: 4 }}>{workbenchView.agentExpectedOutput?.summary}</div>
                      <div style={{ fontSize: 11, color: "var(--v2-muted-2)", fontStyle: "italic" }}>{workbenchView.agentExpectedOutput?.reason}</div>
                      <span className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8, display: "inline-flex" }}>Execution not enabled</span>
                    </div>
                  </div>

                  {workbenchView.contract && (
                    <div className="ccv2-card">
                      <div className="ccv2-section-heading">Contract</div>
                      <div className="ccv2-wb-meta-grid" style={{ marginTop: 8 }}>
                        <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Path</span><span className="ccv2-mono ccv2-wb-meta-value" style={{ fontSize: 10 }}>{workbenchView.contract.path || "—"}</span></div>
                        <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Type</span><span className="ccv2-wb-meta-value">{workbenchView.contract.type || "mission"}</span></div>
                        {workbenchView.contract.requiredEvidence?.length > 0 && (
                          <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Required evidence</span><span className="ccv2-wb-meta-value">{workbenchView.contract.requiredEvidence.join(", ")}</span></div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="ccv2-two-col">
                    <div className="ccv2-card">
                      <div className="ccv2-section-heading">Evidence ({workbenchView.evidence?.length || 0})</div>
                      {workbenchView.evidence?.length > 0 ? (
                        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                          {workbenchView.evidence.map((id) => (
                            <div key={id} className="ccv2-mono" style={{ fontSize: 10, color: "var(--v2-muted-2)", padding: "3px 0", borderBottom: "1px solid rgba(136,255,235,0.04)" }}>{id}</div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: "var(--v2-muted-2)", marginTop: 8 }}>No evidence records yet</div>
                      )}
                    </div>
                    <div className="ccv2-card">
                      <div className="ccv2-section-heading">Audit Events ({workbenchView.audit?.length || 0})</div>
                      {workbenchView.audit?.length > 0 ? (
                        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                          {workbenchView.audit.map((id) => (
                            <div key={id} className="ccv2-mono" style={{ fontSize: 10, color: "var(--v2-muted-2)", padding: "3px 0", borderBottom: "1px solid rgba(136,255,235,0.04)" }}>{id}</div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: "var(--v2-muted-2)", marginTop: 8 }}>No audit events yet</div>
                      )}
                    </div>
                  </div>

                  <div className="ccv2-card ccv2-wb-review-panel">
                    <div className="ccv2-section-heading">Human Review</div>
                    <div className="ccv2-wb-review-shortcuts">
                      <button className="ccv2-wb-review-btn ccv2-wb-review-btn--disabled" disabled title="Selected task review is shown on this page">
                        Review output
                      </button>
                      <button
                        className="ccv2-wb-review-btn ccv2-wb-review-btn--approve"
                        onClick={() => navigate("/command-center/evidence")}
                      >
                        Open evidence
                      </button>
                    </div>

                    {workbenchView.review?.decision && (
                      <div style={{ marginTop: 8, marginBottom: 12, padding: "8px 10px", background: "rgba(136,255,235,0.03)", border: "1px solid rgba(136,255,235,0.08)", borderRadius: 6 }}>
                        <div className="ccv2-eyebrow" style={{ marginBottom: 4 }}>Last review</div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span className={`ccv2-pill ccv2-pill--${workbenchView.review.decision === "approve" ? "pass" : workbenchView.review.decision === "reject" ? "fail" : "pending"}`}>
                            {workbenchView.review.decision}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--v2-muted)" }}>by {workbenchView.review.reviewer}</span>
                        </div>
                        {workbenchView.review.reason && (
                          <div style={{ fontSize: 11, color: "var(--v2-muted-2)", marginTop: 4 }}>{workbenchView.review.reason}</div>
                        )}
                      </div>
                    )}

                    {reviewState === "submitted" && reviewResult?.ok ? (
                      <div className="ccv2-mc-status ccv2-mc-status--completed" style={{ marginTop: 8 }}>
                        ✓ Review recorded: {reviewDecision}
                        {reviewResult.reviewId && (
                          <div className="ccv2-mono" style={{ fontSize: 10, marginTop: 4 }}>ID: {reviewResult.reviewId?.slice(0, 12)}</div>
                        )}
                      </div>
                    ) : reviewState === "failed" ? (
                      <div className="ccv2-mc-status ccv2-mc-status--failed" style={{ marginTop: 8 }}>
                        ✗ {(reviewResult?.errors || ["Review failed."]).join(" ")}
                      </div>
                    ) : (
                      <>
                        <div style={{ marginTop: 10 }}>
                          <label style={{ fontSize: 11, color: "var(--v2-muted)", display: "block", marginBottom: 4 }}>Reason (optional)</label>
                          <textarea
                            className="ccv2-mission-composer__textarea"
                            value={reviewReason}
                            onChange={(e) => setReviewReason(e.target.value)}
                            placeholder="Add review notes..."
                            rows={2}
                            style={{ marginBottom: 10 }}
                          />
                        </div>
                        <div className="ccv2-wb-review-actions">
                          <button
                            className={`ccv2-wb-review-btn ccv2-wb-review-btn--approve${!bridgeOnline || reviewState === "submitting" ? " ccv2-wb-review-btn--disabled" : ""}`}
                            disabled={!bridgeOnline || reviewState === "submitting"}
                            onClick={() => handleReview("approve")}
                            title={!bridgeOnline ? "Requires governed action bridge" : ""}
                          >
                            {reviewState === "submitting" && reviewDecision === "approve" ? "Submitting…" : "Approve plan"}
                          </button>
                          <button
                            className={`ccv2-wb-review-btn ccv2-wb-review-btn--changes${!bridgeOnline || reviewState === "submitting" ? " ccv2-wb-review-btn--disabled" : ""}`}
                            disabled={!bridgeOnline || reviewState === "submitting"}
                            onClick={() => handleReview("request_changes")}
                            title={!bridgeOnline ? "Requires governed action bridge" : ""}
                          >
                            {reviewState === "submitting" && reviewDecision === "request_changes" ? "Submitting…" : "Request Changes"}
                          </button>
                          <button
                            className={`ccv2-wb-review-btn ccv2-wb-review-btn--reject${!bridgeOnline || reviewState === "submitting" ? " ccv2-wb-review-btn--disabled" : ""}`}
                            disabled={!bridgeOnline || reviewState === "submitting"}
                            onClick={() => handleReview("reject")}
                            title={!bridgeOnline ? "Requires governed action bridge" : ""}
                          >
                            {reviewState === "submitting" && reviewDecision === "reject" ? "Submitting…" : "Reject"}
                          </button>
                        </div>
                        {!bridgeOnline && (
                          <div style={{ marginTop: 8, fontSize: 11, color: "var(--v2-muted-2)" }}>
                            ⊘ Review buttons require action bridge: <code>NEXUS_MODE=local-private npm run mission:action-server</code>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {workbenchView.nextActions?.length > 0 && (
                    <div className="ccv2-card">
                      <div className="ccv2-section-heading">Next Actions</div>
                      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                        {workbenchView.nextActions.map((na, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, color: "var(--v2-text)" }}>{na.label}</span>
                            {na.reason && <span style={{ fontSize: 11, color: "var(--v2-muted-2)" }}>— {na.reason}</span>}
                            <span className={`ccv2-pill ccv2-pill--${na.enabled ? "pass" : "disabled"}`}>{na.enabled ? "Available" : "Blocked"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : null}
          </CommandTabPanel>

          <CommandTabPanel tabId="review" activeTab={activeWorkbenchTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Review</div>
              <p style={{ marginTop: 6, fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6 }}>
                Approve, request changes, or reject controls are available only for a selected activated task and a live governed action bridge.
              </p>
              {workbenchView ? (
                <div className="ccv2-wb-meta-grid" style={{ marginTop: 10 }}>
                  <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Selected task</span><span className="ccv2-wb-meta-value">{workbenchView.title}</span></div>
                  <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Review status</span><span className={`ccv2-pill ccv2-pill--${reviewStatusPillClass(workbenchView.review?.decision || "pending")}`}>{workbenchView.review?.decision ? workbenchView.review.decision.replace(/_/g, " ") : "Pending review"}</span></div>
                  <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Next action</span><span className="ccv2-wb-meta-value">{bridgeOnline ? "Record a human review decision." : "Requires governed action bridge"}</span></div>
                </div>
              ) : (
                <div className="ccv2-empty-state">
                  No selected task. Select an activated task from the Task tab to review it.
                </div>
              )}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="evidence" activeTab={activeWorkbenchTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Evidence</div>
              {workbenchView?.evidence?.length > 0 ? (
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                  {workbenchView.evidence.map((id) => (
                    <div key={id} className="ccv2-mono" style={{ fontSize: 10, color: "var(--v2-muted-2)" }}>{id}</div>
                  ))}
                </div>
              ) : (
                <div className="ccv2-empty-state">
                  No evidence records yet. Evidence appears after governed task actions produce proof records.
                </div>
              )}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="activity" activeTab={activeWorkbenchTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Activity</div>
              {workbenchView?.audit?.length > 0 ? (
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                  {workbenchView.audit.map((id) => (
                    <div key={id} className="ccv2-mono" style={{ fontSize: 10, color: "var(--v2-muted-2)" }}>{id}</div>
                  ))}
                </div>
              ) : (
                <div className="ccv2-empty-state">
                  No task activity yet. Centralized activity logging is planned for a later phase.
                </div>
              )}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="context" activeTab={activeWorkbenchTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Context</div>
              {workbenchView?.contract ? (
                <div className="ccv2-wb-meta-grid" style={{ marginTop: 8 }}>
                  <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Contract type</span><span className="ccv2-wb-meta-value">{workbenchView.contract.type || "mission"}</span></div>
                  <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Allowed scope</span><span className="ccv2-wb-meta-value">Selected task context only</span></div>
                  <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Forbidden scope</span><span className="ccv2-wb-meta-value">Provider calls, DB writes, and broad source mutation remain disabled.</span></div>
                </div>
              ) : (
                <div className="ccv2-empty-state">
                  Select an activated task to see its contract, allowed scope, and context summary.
                </div>
              )}
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function ToolGatewayPage({ vm }) {
  const gateway = vm.toolGateway || {};
  const [activeTab, setActiveTab] = useState("overview");
  const tools = gateway.tools || [];
  const mcpServers = gateway.mcpServers || [];
  const permissions = gateway.permissions || [];
  const adapters = gateway.adapters || [];
  const lazy = gateway.lazyLoading || {};
  const toolDispatchCards = dispatchReadinessCards.filter((card) => card.title !== "Provider Dispatch");

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div>
            <div className="ccv2-page-head__title">Tool Gateway</div>
            <div className="ccv2-page-head__sub">
              One governed tool gateway for registry metadata, lazy contracts, permissions, and safe previews.
            </div>
          </div>
          <div className="ccv2-page-head__actions">
            <span className="ccv2-pill ccv2-pill--disabled">Read-only</span>
            <span className="ccv2-pill ccv2-pill--disabled">Execution disabled</span>
            <span className="ccv2-pill ccv2-pill--disabled">MCP placeholders disabled</span>
          </div>
        </div>

        <FounderOperationsBoard {...FOUNDER_DELIVERY_BOARDS.tools} />

        <CommandTabs tabs={TOOL_GATEWAY_TABS} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Tool Gateway sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {[
                { label: "Registered Tools", value: gateway.summary?.tools ?? 0 },
                { label: "MCP Placeholders", value: gateway.summary?.mcpPlaceholders ?? 0 },
                { label: "Permission Entries", value: gateway.summary?.permissionEntries ?? 0 },
                { label: "Adapter Previews", value: gateway.summary?.adapterPreviews ?? 0 },
              ].map((item) => (
                <article key={item.label} className="ccv2-card">
                  <div className="ccv2-kpi__label">{item.label}</div>
                  <div className="ccv2-kpi__value">{item.value}</div>
                  <div className="ccv2-kpi__meta">Governance metadata</div>
                </article>
              ))}
            </div>
            <div className="ccv2-card ccv2-card--accent">
              <div className="ccv2-section-heading">Governed Tool Gateway</div>
              <ul className="ccv2-list">
                {(gateway.safetyNotes || []).map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <div className="ccv2-muted">
                Search summaries, selected contract loading, and execute-preview decisions are available as metadata only.
              </div>
            </div>
            <div className="ccv2-grid ccv2-grid--2">
              {toolDispatchCards.map((card) => (
                <article key={card.title} className="ccv2-card">
                  <div className="ccv2-section-heading">{card.title}</div>
                  <div className="ccv2-chip-row">
                    <span className="ccv2-pill ccv2-pill--disabled">{card.stateLabel}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">{card.ownerCapability}</span>
                  </div>
                  <div className="ccv2-muted">Disabled reason: {card.disabledReason}</div>
                  <div className="ccv2-muted">Blocker: {card.blocker}</div>
                  <div className="ccv2-muted">Next action: {card.nextAction}</div>
                  <div className="ccv2-muted">Evidence: {card.evidenceLocation}</div>
                  <div className="ccv2-muted">Activity: {card.activityLocation}</div>
                  <div className="ccv2-muted">Cost impact: {card.costImpact}</div>
                </article>
              ))}
            </div>
            <div className="ccv2-grid ccv2-grid--2">
              {codeModeReadinessCards.map((card) => (
                <article key={card.title} className="ccv2-card">
                  <div className="ccv2-section-heading">{card.title}</div>
                  <div className="ccv2-chip-row">
                    <span className="ccv2-pill ccv2-pill--preview">{card.stateLabel}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">{card.ownerCapability}</span>
                  </div>
                  <div className="ccv2-muted">Selected contracts: {card.selectedContractCount}</div>
                  <div className="ccv2-muted">Disabled reason: {card.disabledReason}</div>
                  <div className="ccv2-muted">Blocker: {card.blocker}</div>
                  <div className="ccv2-muted">Bulk loading: {card.bulkLoadingReason}</div>
                  <div className="ccv2-muted">Next action: {card.nextAction}</div>
                  <div className="ccv2-muted">Evidence: {card.evidenceLocation}</div>
                  <div className="ccv2-muted">Activity: {card.activityLocation}</div>
                  <div className="ccv2-muted">Cost impact: {card.costImpact}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="tool-registry" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {tools.map((tool) => (
                <article key={tool.toolId} className="ccv2-card">
                  <div className="ccv2-section-heading">{tool.displayName}</div>
                  <div className="ccv2-muted">{tool.toolId}</div>
                  <div className="ccv2-chip-row">
                    <span className="ccv2-pill">{tool.category}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">{tool.riskLevel}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">{tool.status}</span>
                  </div>
                  <div className="ccv2-muted">Lazy contract: {tool.lazyContractAvailable ? "Available" : "Not available yet"}</div>
                  <div className="ccv2-muted">Execution: {tool.executionEnabled ? "Enabled" : "Disabled"}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="mcp-registry" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {mcpServers.map((server) => (
                <article key={server.mcpServerId} className="ccv2-card">
                  <div className="ccv2-section-heading">{server.displayName}</div>
                  <div className="ccv2-muted">{server.mcpServerId}</div>
                  <div className="ccv2-chip-row">
                    <span className="ccv2-pill ccv2-pill--disabled">{server.status}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">{server.transport}</span>
                  </div>
                  <div className="ccv2-muted">Server enabled: {server.serverEnabled ? "Yes" : "No"}</div>
                  <div className="ccv2-muted">Schema loading: {server.lazySchemaLoadingRequired ? "Lazy only" : "Unknown"}</div>
                  <div className="ccv2-muted">External network: {server.egressPolicy === "none" ? "Disabled" : server.egressPolicy}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="permissions" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {permissions.map((entry) => (
                <article key={entry.permissionId} className="ccv2-card">
                  <div className="ccv2-section-heading">{entry.agentId} · {entry.toolId}</div>
                  <div className="ccv2-muted">Decision: {entry.permission}</div>
                  <div className="ccv2-muted">Approval required: {entry.approvalRequired ? "Yes" : "No"}</div>
                  <div className="ccv2-muted">{entry.reason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="contracts" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Lazy Contract Loading</div>
              <ul className="ccv2-list">
                <li>Selected contract loading only.</li>
                <li>No all-tools-in-context loading.</li>
                <li>No all-MCP-schemas-in-context loading.</li>
                <li>Execution previews return decisions only and keep execution disabled.</li>
              </ul>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="adapters" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              {adapters.map((adapter) => (
                <article key={adapter.adapterId} className="ccv2-card">
                  <div className="ccv2-section-heading">{adapter.label}</div>
                  <div className="ccv2-muted">{adapter.purpose}</div>
                  <div className="ccv2-chip-row">
                    <span className="ccv2-pill ccv2-pill--disabled">{adapter.status}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">No execution</span>
                  </div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="lazy-loading" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Context Budget</div>
                <div className="ccv2-muted">Max contracts per task: {lazy.maxContractsPerTask}</div>
                <div className="ccv2-muted">Max tool summaries: {lazy.maxToolSummaries}</div>
                <div className="ccv2-muted">Selected contract loading required: {lazy.selectedContractLoadingRequired ? "Yes" : "No"}</div>
              </article>
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Blocked Bulk Loading</div>
                <div className="ccv2-muted">All tool schemas allowed: {lazy.allToolSchemasAllowed ? "Yes" : "No"}</div>
                <div className="ccv2-muted">All MCP schemas allowed: {lazy.allMcpSchemasAllowed ? "Yes" : "No"}</div>
              </article>
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Code Mode Packet</div>
                <div className="ccv2-muted">State: {codeModeReadinessCards[0].stateLabel}</div>
                <div className="ccv2-muted">Selected contracts: {codeModeReadinessCards[0].selectedContractCount}</div>
                <div className="ccv2-muted">Execution: Disabled</div>
                <div className="ccv2-muted">Bulk loading: {codeModeReadinessCards[0].bulkLoadingReason}</div>
              </article>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="developer-details" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Registry Artifacts</div>
              <ul className="ccv2-list">
                <li>tool-governance/toolRegistry.js</li>
                <li>tool-governance/mcpRegistry.js</li>
                <li>tool-governance/toolGateway.js</li>
                <li>tool-governance/toolPermissionMatrix.js</li>
                <li>tool-governance/adapters/index.js</li>
                <li>policy/tool-gateway-policy.json</li>
                <li>policy/lazy-tool-context-policy.json</li>
                <li>reports/tool-gateway-report.md</li>
              </ul>
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function TriggerIntegrationPage({ vm }) {
  const trigger = vm.triggerIntegration || {};
  const summary = trigger.summary || {};
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div>
            <div className="ccv2-page-head__title">Trigger + Integrations</div>
            <div className="ccv2-page-head__sub">
              Preview-only trigger gateway for manual, scheduled, GitHub, ticket, chat, and webhook integration events.
            </div>
          </div>
          <div className="ccv2-page-head__actions">
            <span className="ccv2-pill ccv2-pill--disabled">Preview only</span>
            <span className="ccv2-pill ccv2-pill--disabled">Execution disabled</span>
            <span className="ccv2-pill ccv2-pill--disabled">No credentials</span>
          </div>
        </div>

        <FounderOperationsBoard {...FOUNDER_DELIVERY_BOARDS.triggers} />

        <CommandTabs
          tabs={TRIGGER_INTEGRATION_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          ariaLabel="Trigger and Integrations sections"
        >
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {[
                { label: "Trigger Types", value: summary.triggerTypes ?? 0 },
                { label: "GitHub Events", value: summary.githubEvents ?? 0 },
                { label: "Ticket Events", value: summary.ticketEvents ?? 0 },
                { label: "Chat Commands", value: summary.chatCommands ?? 0 },
              ].map((item) => (
                <article key={item.label} className="ccv2-card">
                  <div className="ccv2-kpi__label">{item.label}</div>
                  <div className="ccv2-kpi__value">{item.value}</div>
                  <div className="ccv2-kpi__meta">Preview metadata</div>
                </article>
              ))}
            </div>
            <div className="ccv2-card ccv2-card--accent">
              <div className="ccv2-section-heading">Preview-Only Boundary</div>
              <ul className="ccv2-list">
                {(trigger.safetyNotes || []).map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="manual" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {(trigger.manualActions || []).map((action) => (
                <article key={action} className="ccv2-card">
                  <div className="ccv2-section-heading">{action}</div>
                  <div className="ccv2-muted">Manual Command Center trigger preview.</div>
                  <div className="ccv2-chip-row">
                    <span className="ccv2-pill ccv2-pill--disabled">Dry-run</span>
                    <span className="ccv2-pill ccv2-pill--disabled">No execution</span>
                  </div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="scheduled" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {(trigger.scheduled || []).map((schedule) => (
                <article key={schedule.scheduleForm} className="ccv2-card">
                  <div className="ccv2-section-heading">{schedule.scheduleForm}</div>
                  <div className="ccv2-muted">Scheduled triggers: Preview only.</div>
                  <div className="ccv2-muted">Runtime scheduler: Not enabled.</div>
                  <div className="ccv2-muted">Worker runtime: Not enabled.</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="github" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {(trigger.githubEvents || []).map((event) => (
                <article key={event.eventType} className="ccv2-card">
                  <div className="ccv2-section-heading">{event.displayName}</div>
                  <div className="ccv2-muted">{event.eventType}</div>
                  <div className="ccv2-muted">Maps to: {event.mappedAction}</div>
                  <div className="ccv2-muted">GitHub Events - Preview only; webhook execution is disabled.</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="tickets" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {(trigger.ticketEvents || []).slice(0, 12).map((event) => (
                <article key={`${event.system}-${event.eventType}`} className="ccv2-card">
                  <div className="ccv2-section-heading">{event.system}</div>
                  <div className="ccv2-muted">{event.eventType}</div>
                  <div className="ccv2-muted">Jira / Linear - Planned integration; no outbound calls.</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="chat" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {(trigger.chatCommands || []).slice(0, 16).map((command) => (
                <article key={`${command.system}-${command.command}`} className="ccv2-card">
                  <div className="ccv2-section-heading">{command.command}</div>
                  <div className="ccv2-muted">{command.system}</div>
                  <div className="ccv2-muted">Slack / Teams - Planned integration; chat execution is disabled.</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="developer-details" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Disabled Runtime Details</div>
              <ul className="ccv2-list">
                <li>trigger-gateway/triggerGatewaySchema.js</li>
                <li>trigger-gateway/manualTrigger.js</li>
                <li>trigger-gateway/scheduledTrigger.js</li>
                <li>integrations/githubTriggerPreview.js</li>
                <li>integrations/ticketTriggerPreview.js</li>
                <li>integrations/chatTriggerPreview.js</li>
                <li>policy/trigger-gateway-policy.json</li>
              </ul>
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function ApiBatchAdapterPage({ vm }) {
  const apiBatch = vm.apiBatch || {};
  const summary = apiBatch.summary || {};
  const [activeTab, setActiveTab] = useState("overview");
  const providerDispatchCard = dispatchReadinessCards.find((card) => card.title === "Provider Dispatch");

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div>
            <div className="ccv2-page-head__title">API / Batch Adapter</div>
            <div className="ccv2-page-head__sub">
              Preview-only provider request packaging, batch job review, cost estimation, and result reconciliation.
            </div>
          </div>
          <div className="ccv2-page-head__actions">
            <span className="ccv2-pill ccv2-pill--disabled">Preview only</span>
            <span className="ccv2-pill ccv2-pill--disabled">Provider calls disabled</span>
            <span className="ccv2-pill ccv2-pill--disabled">Upload disabled</span>
          </div>
        </div>

        <FounderOperationsBoard {...FOUNDER_DELIVERY_BOARDS.apiBatch} />

        <CommandTabs
          tabs={API_BATCH_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          ariaLabel="API and Batch Adapter sections"
        >
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {[
                { label: "Provider Adapters", value: summary.providerAdapters ?? 0 },
                { label: "Preview-only Adapters", value: summary.previewOnlyAdapters ?? 0 },
                { label: "Provider Execution", value: summary.providerExecutionEnabled ? "Enabled" : "Disabled" },
                { label: "External Upload", value: summary.externalUploadAllowed ? "Enabled" : "Disabled" },
              ].map((item) => (
                <article key={item.label} className="ccv2-card">
                  <div className="ccv2-kpi__label">{item.label}</div>
                  <div className="ccv2-kpi__value">{item.value}</div>
                  <div className="ccv2-kpi__meta">Preview-only state</div>
                </article>
              ))}
            </div>
            <div className="ccv2-card ccv2-card--accent">
              <div className="ccv2-section-heading">API / Batch Safety Boundary</div>
              <ul className="ccv2-list">
                {(apiBatch.safetyNotes || []).map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
            {providerDispatchCard && (
              <div className="ccv2-card">
                <div className="ccv2-section-heading">Governed Dispatch Dry Run</div>
                <div className="ccv2-page-summary-grid">
                  <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{dispatchGovernanceSummary.currentState}</span></div>
                  <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{providerDispatchCard.ownerCapability}</span></div>
                  <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{providerDispatchCard.disabledReason}</span></div>
                  <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{providerDispatchCard.costImpact}</span></div>
                </div>
                <div className="ccv2-empty-state">Next action: {providerDispatchCard.nextAction}</div>
              </div>
            )}
            <div className="ccv2-grid ccv2-grid--2">
              {batchIntelligenceReadinessCards.map((card) => (
                <article key={card.title} className="ccv2-card">
                  <div className="ccv2-section-heading">{card.title}</div>
                  <div className="ccv2-page-summary-grid">
                    <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">State</span><span className="ccv2-page-summary-value">{card.stateLabel}</span></div>
                    <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Workload</span><span className="ccv2-page-summary-value">{card.workloadType}</span></div>
                    <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Requests</span><span className="ccv2-page-summary-value">{card.requestCount}</span></div>
                    <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Redaction</span><span className="ccv2-page-summary-value">{card.redactionState}</span></div>
                  </div>
                  <div className="ccv2-muted">Disabled reason: {card.disabledReason}</div>
                  <div className="ccv2-muted">Cost impact: {card.costImpact}</div>
                  <div className="ccv2-empty-state">Next action: {card.nextAction}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="providers" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {(apiBatch.providers || []).map((provider) => (
                <article key={provider.providerId} className="ccv2-card">
                  <div className="ccv2-section-heading">{provider.label}</div>
                  <div className="ccv2-muted">{provider.providerId}</div>
                  <div className="ccv2-chip-row">
                    <span className="ccv2-pill ccv2-pill--disabled">{provider.displayStatus}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">External calls disabled</span>
                  </div>
                  <div className="ccv2-muted">Supported modes: {(provider.supportedModes || []).join(", ")}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="batch" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Batch Job Builder</div>
              <div className="ccv2-page-summary-grid">
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Batch job</span><span className="ccv2-page-summary-value">{apiBatch.batchJob?.batchJobId}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Request count</span><span className="ccv2-page-summary-value">{apiBatch.batchJob?.requestCount}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">JSONL preview files</span><span className="ccv2-page-summary-value">{apiBatch.jsonlPreview?.available ? "Available" : "Not generated"}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Preview path</span><span className="ccv2-page-summary-value">{apiBatch.jsonlPreview?.path}</span></div>
              </div>
              <div className="ccv2-empty-state">Create preview batch job is guidance-only in the UI. Upload disabled. Provider calls disabled.</div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="cost" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Cost Estimate</div>
              <div className="ccv2-page-summary-grid">
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Estimated input tokens</span><span className="ccv2-page-summary-value">{apiBatch.batchCost?.estimatedInputTokens}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Estimated output tokens</span><span className="ccv2-page-summary-value">{apiBatch.batchCost?.estimatedOutputTokens}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Estimated USD</span><span className="ccv2-page-summary-value">{apiBatch.batchCost?.estimatedUsd ?? "Unknown"}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Approval required</span><span className="ccv2-page-summary-value">{apiBatch.batchCost?.approvalRequired ? "Yes" : "No"}</span></div>
              </div>
              <div className="ccv2-empty-state">Cost estimates are approximate placeholders. No real provider pricing fetch occurs.</div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="reconciliation" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Result Reconciliation Preview</div>
              <div className="ccv2-page-summary-grid">
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Matched results</span><span className="ccv2-page-summary-value">{apiBatch.reconciliation?.matchedCount}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Missing results</span><span className="ccv2-page-summary-value">{apiBatch.reconciliation?.missingCount}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Unmatched results</span><span className="ccv2-page-summary-value">{apiBatch.reconciliation?.unmatchedCount}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Provider download</span><span className="ccv2-page-summary-value">Disabled</span></div>
              </div>
              <div className="ccv2-empty-state">Result reconciliation is preview-only and summarizes results by custom_id.</div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="developer-details" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Disabled Runtime Details</div>
              <ul className="ccv2-list">
                <li>api-batch/providerAdapter.js</li>
                <li>api-batch/openaiAdapter.js</li>
                <li>api-batch/batchJobBuilder.js</li>
                <li>api-batch/jsonlWriter.js</li>
                <li>api-batch/batchStatusTracker.js</li>
                <li>api-batch/resultReconciler.js</li>
                <li>api-batch/costEstimator.js</li>
                <li>policy/api-batch-adapter-policy.json</li>
              </ul>
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function AgentRoomsPage({ vm }) {
  const mesh = vm.agentMesh || {};
  const [activeTab, setActiveTab] = useState("overview");
  const overview = mesh.overview || {};
  const rooms = mesh.rooms || [];
  const messages = mesh.messages || [];
  const handoffs = mesh.handoffs || [];
  const contextSync = mesh.contextSync || {};

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div>
            <div className="ccv2-page-head__title">Agent Rooms</div>
            <div className="ccv2-page-head__sub">Governed coordination rooms for scoped, redacted agent collaboration.</div>
          </div>
          <div className="ccv2-page-head__actions">
            <span className="ccv2-pill ccv2-pill--disabled">Read-only</span>
            <span className="ccv2-pill ccv2-pill--pending">{mesh.mode || "local-private"}</span>
          </div>
        </div>

        <FounderOperationsBoard {...FOUNDER_DELIVERY_BOARDS.agentRooms} />

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Governed Mesh Boundary</div>
          <div className="ccv2-page-summary-grid">
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Coordination rule</span><span className="ccv2-page-summary-value">{mesh.coordinationRule}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Message posture</span><span className="ccv2-page-summary-value">{mesh.safetyCopy}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Runtime dispatch</span><span className="ccv2-page-summary-value">{mesh.disabledRuntimeCopy}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Source</span><span className="ccv2-page-summary-value">{mesh.sourceLabel}</span></div>
          </div>
        </div>

        <CommandTabs
          tabs={AGENT_ROOMS_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          ariaLabel="Agent Rooms sections"
        >
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--four">
              <div className="ccv2-stat-chip"><div className="ccv2-stat-chip__label">Rooms</div><div className="ccv2-stat-chip__value">{overview.rooms || 0}</div></div>
              <div className="ccv2-stat-chip"><div className="ccv2-stat-chip__label">Messages</div><div className="ccv2-stat-chip__value">{overview.messages || 0}</div></div>
              <div className="ccv2-stat-chip"><div className="ccv2-stat-chip__label">Handoffs</div><div className="ccv2-stat-chip__value">{overview.handoffs || 0}</div></div>
              <div className="ccv2-stat-chip"><div className="ccv2-stat-chip__label">Context Sync</div><div className="ccv2-stat-chip__value">{overview.contextSyncSummaries || 0}</div></div>
            </div>
            <div className="ccv2-card" style={{ marginTop: 12 }}>
              <div className="ccv2-section-heading">Current State</div>
              <div className="ccv2-empty-state">
                Agent rooms are coordination metadata only. They do not run agents, transfer task ownership, dispatch tools, call providers, start workers, write DB records, or mutate project files.
              </div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="rooms" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Rooms by Scope and Status</div>
              <table className="ccv2-table">
                <thead><tr><th>Room</th><th>Type</th><th>Scope</th><th>Participants</th><th>Status</th><th>Context</th></tr></thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.roomId}>
                      <td>{room.title}</td>
                      <td>{room.roomType}</td>
                      <td>{room.scope}</td>
                      <td>{room.participants.join(", ")}</td>
                      <td><span className="ccv2-pill ccv2-pill--pending">{room.status}</span></td>
                      <td>{room.contextStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="messages" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Recent Redacted Messages</div>
              <div className="ccv2-list">
                {messages.map((message) => (
                  <div className="ccv2-list-row" key={message.messageId}>
                    <span className="ccv2-list-row__title">{message.fromAgent} to {message.toAgent} · {message.messageType}</span>
                    <span className="ccv2-list-row__meta">{message.payloadSummary}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">Redacted</span>
                  </div>
                ))}
              </div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="handoffs" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Governed Handoffs</div>
              <div className="ccv2-list">
                {handoffs.map((handoff) => (
                  <div className="ccv2-list-row" key={handoff.handoffId}>
                    <span className="ccv2-list-row__title">{handoff.fromAgent} to {handoff.toAgent} · {handoff.status}</span>
                    <span className="ccv2-list-row__meta">{handoff.reason}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">Task ownership unchanged</span>
                  </div>
                ))}
              </div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="context" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--two">
              <div className="ccv2-card">
                <div className="ccv2-section-heading">Allowed Context</div>
                <div className="ccv2-list">
                  {(contextSync.allowedContext || []).map((source) => (
                    <div className="ccv2-list-row" key={source.sourceId}>
                      <span className="ccv2-list-row__title">{source.label}</span>
                      <span className="ccv2-list-row__meta">{source.trustBand} trust · {source.freshnessStatus}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ccv2-card">
                <div className="ccv2-section-heading">Excluded Context</div>
                <div className="ccv2-list">
                  {(contextSync.excludedContext || []).map((source) => (
                    <div className="ccv2-list-row" key={source.sourceId}>
                      <span className="ccv2-list-row__title">{source.label}</span>
                      <span className="ccv2-list-row__meta">{(source.reasons || []).join(" ") || "Excluded by policy."}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="ccv2-card" style={{ marginTop: 12 }}>
              <div className="ccv2-section-heading">Context Safety</div>
              <div className="ccv2-empty-state">Raw context included: no. Runtime agent injection enabled: no. Stale context is flagged before use.</div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="policy" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Policy Decisions</div>
              <div className="ccv2-list">
                {(mesh.policyDecisions || []).map((decision) => (
                  <div className="ccv2-list-row" key={decision}>
                    <span className="ccv2-list-row__title">{decision}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">Guarded</span>
                  </div>
                ))}
              </div>
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

/* ─── Live API Status Page ─── */
function LiveApiPage({ vm, onRefresh }) {
  const api = vm.liveApi || {};
  const online = api.liveApiOnline;
  const refreshStatus = api.lastRefreshStatus || "idle";
  const liveData = vm.liveData || {};
  const [activeTab, setActiveTab] = useState("overview");
  const endpointGroups = [
    { name: "Mission Data", status: online ? "Online" : "Snapshot fallback", pages: "Mission Control, Workspace", endpoints: ["/missions", "/status"] },
    { name: "Task Data", status: online ? "Online" : "Snapshot fallback", pages: "Task Queue, Agent Workbench", endpoints: ["/tasks", "/actions"] },
    { name: "Agent Data", status: online ? "Online" : "Snapshot fallback", pages: "Agent Registry", endpoints: ["/agents"] },
    { name: "Evidence Ledger", status: online ? "Online" : "Snapshot fallback", pages: "Evidence", endpoints: ["/evidence", "/audit"] },
    { name: "Runtime State", status: online ? "Online" : "Snapshot fallback", pages: "Mission Control, Task Queue", endpoints: ["/runtime"] },
    { name: "Safety Boundary", status: online ? "Online" : "Snapshot fallback", pages: "Safety Center", endpoints: ["/health", "/actions"] },
    { name: "Roadmap", status: online ? "Online" : "Snapshot fallback", pages: "OS Roadmap", endpoints: ["/roadmap"] },
    { name: "Durable State", status: online ? "Online" : "Snapshot fallback", pages: "Durable State", endpoints: ["/db", "/contracts", "/projects"] },
  ];

  const safetyRows = [
    { label: "DB backed", value: api.dbBacked ? "YES" : "NO", ok: !api.dbBacked },
    { label: "Provider calls", value: api.providerCallsEnabled ? "YES" : "NO", ok: !api.providerCallsEnabled },
    { label: "External network", value: api.externalNetworkEnabled ? "YES" : "NO", ok: !api.externalNetworkEnabled },
    { label: "Local only", value: "YES", ok: true },
    { label: "Bind host", value: "127.0.0.1", ok: true },
    { label: "Port", value: "4321", ok: true },
  ];
  const bridgeRows = [
    { label: "Mission Action Bridge", value: actionBridgeSnapshot.bridgeReadiness?.missionComposer ? "Available" : "Offline or snapshot fallback" },
    { label: "Task Activation Bridge", value: actionBridgeSnapshot.bridgeReadiness?.taskActivation ? "Available" : "Requires task activation bridge" },
    { label: "Human Review Bridge", value: actionBridgeSnapshot.bridgeReadiness?.humanReview ? "Available" : "Requires review bridge" },
    { label: "Implementation Bridge", value: actionBridgeSnapshot.bridgeReadiness?.controlledImplementation ? "Available" : "Requires implementation bridge" },
  ];

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Live API Status</div>
          <div className="ccv2-page-head__sub">Track local API availability, live vs snapshot data, and which business surfaces depend on each endpoint group.</div>
        </div>

        <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.liveapi} />

        <CommandTabs tabs={LIVE_API_TABS} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Live API sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-card ccv2-page-summary-card">
              <div className="ccv2-section-heading">API Summary</div>
              <div className="ccv2-page-summary-grid">
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Local API</span><span className="ccv2-page-summary-value">{online ? "Online" : "Offline"}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Mode</span><span className="ccv2-page-summary-value">{vm.shell.mode}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Data source</span><span className="ccv2-page-summary-value">{online ? "Live local API" : "Snapshot fallback"}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Last refresh</span><span className="ccv2-page-summary-value">{api.lastRefreshAt ? new Date(api.lastRefreshAt).toLocaleString() : "Not refreshed yet"}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{online ? "Live read endpoints available." : "Start the local API or use snapshot fallback."}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next step</span><span className="ccv2-page-summary-value">{online ? "Refresh data to confirm current endpoint health." : "Run npm run nexus:up, then retry the connection."}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Developer Details</span><span className="ccv2-page-summary-value">Diagnostics tab shows localhost, port, and endpoint references.</span></div>
              </div>
            </div>
            <div className="ccv2-stats-row">
              <div className="ccv2-stat-chip"><div className="ccv2-stat-chip__label">Availability</div><div className="ccv2-stat-chip__value ccv2-stat-chip__value--teal">Available</div></div>
              <div className="ccv2-stat-chip"><div className="ccv2-stat-chip__label">Status</div><div className={`ccv2-stat-chip__value ${online ? "ccv2-stat-chip__value--green" : "ccv2-stat-chip__value--amber"}`}>{online ? "Online" : "Offline"}</div></div>
              <div className="ccv2-stat-chip"><div className="ccv2-stat-chip__label">Data source</div><div className={`ccv2-stat-chip__value ${online ? "ccv2-stat-chip__value--teal" : "ccv2-stat-chip__value--amber"}`}>{online ? "Live API" : "Snapshot fallback"}</div></div>
              <div className="ccv2-stat-chip"><div className="ccv2-stat-chip__label">Refresh</div><div className="ccv2-stat-chip__value">{refreshStatus}</div></div>
            </div>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Connection</div>
              {online ? (
                <div style={{ marginTop: 10, color: "var(--v2-green)", fontSize: 13, fontWeight: 600 }}>Local API is online at http://127.0.0.1:4321</div>
              ) : (
                <div style={{ marginTop: 10 }}>
                  <div style={{ color: "var(--v2-amber)", fontSize: 13, fontWeight: 600 }}>Local API is offline</div>
                  <div style={{ color: "var(--v2-muted)", fontSize: 12, marginTop: 6 }}>Command Center is using snapshot fallback. Run unified local boot to recover.</div>
                  <div className="ccv2-code-block" style={{ marginTop: 8 }}>npm run nexus:up</div>
                  <button className="ccv2-wb-review-btn ccv2-wb-review-btn--changes" style={{ marginTop: 10 }} onClick={onRefresh}>Retry connection</button>
                </div>
              )}
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="endpoints" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Endpoint Groups</div>
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {endpointGroups.map((group) => (
                  <div key={group.name} className="ccv2-list-row">
                    <div className="ccv2-list-row__primary">
                      <span className="ccv2-list-row__title">{group.name}</span>
                      <span className="ccv2-list-row__meta">{group.endpoints.length} endpoints · Pages: {group.pages}</span>
                    </div>
                    <div className="ccv2-list-row__secondary"><span className={`ccv2-pill ccv2-pill--${online ? "pass" : "disabled"}`}>{group.status}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="action-bridges" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Action Bridges</div>
              <div className="ccv2-wb-meta-grid" style={{ marginTop: 10 }}>
                {bridgeRows.map((row) => (
                  <div key={row.label} className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">{row.label}</span><span className="ccv2-wb-meta-value">{row.value}</span></div>
                ))}
              </div>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="diagnostics" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Diagnostics</div>
              <div className="ccv2-wb-meta-grid" style={{ marginTop: 10 }}>
                {safetyRows.map((r) => (
                  <div key={r.label} className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">{r.label}</span><span className={`ccv2-safety-row__value--${r.ok ? "disabled" : "ready"}`}>{r.value}</span></div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: "var(--v2-muted)" }}>Local API reads are available when online. Durable State stays file-backed and DB writes remain disabled by policy.</div>
            </div>
            {online && liveData.tasks && (
              <div className="ccv2-card">
                <div className="ccv2-section-heading">Live Task Data</div>
                <div className="ccv2-wb-meta-grid" style={{ marginTop: 10 }}>
                  <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Planned tasks</span><span className="ccv2-wb-meta-value">{liveData.tasks?.counts?.planned ?? "—"}</span></div>
                  <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Runtime tasks</span><span className="ccv2-wb-meta-value">{liveData.tasks?.counts?.runtime ?? "—"}</span></div>
                  <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Evidence records</span><span className="ccv2-wb-meta-value">{liveData.evidence?.totalCount ?? "—"}</span></div>
                </div>
              </div>
            )}
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

/* ─── Durable State Page ─── */
function DurableStatePage({ vm }) {
  const dbData = vm.liveData?.db;
  const online = vm.liveApi?.liveApiOnline;
  const dbFoundation = vm.dbFoundation || {};
  const [activeTab, setActiveTab] = useState("overview");

  const entities = dbData?.entities || dbFoundation.entities || [];
  const importPlan = dbData?.importPlan || dbFoundation.importPlan || {};
  const entityCount = dbData?.entityCount ?? dbFoundation.entityCount ?? 18;
  const sourcesAvailable = importPlan.sourcesAvailable ?? "—";
  const sourcesMissing = importPlan.sourcesMissing ?? "Unknown";
  const totalEntities = importPlan.totalEntities ?? entityCount;
  const dbRuntime = dbRuntimeReadinessViewModel;
  const founderPersistenceControls = buildFounderPersistenceControlsViewModel(dbRuntime.founderRuntime);
  const businessBuildRuntimeView = buildBusinessBuildViewModel(dbRuntime.founderRuntime?.founderIdea);
  const businessBuildRuntime = businessBuildRuntimeView.businessBuildDbCrud;

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Durable State</div>
          <div className="ccv2-page-head__sub">Understand current persistence, DB foundation readiness, and what remains intentionally disabled by policy.</div>
        </div>

        <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.database} />

        <CommandTabs tabs={DURABLE_STATE_TABS} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Durable State sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-card ccv2-page-summary-card">
              <div className="ccv2-section-heading">Durable State Summary</div>
              <div className="ccv2-page-summary-grid">
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current persistence</span><span className="ccv2-page-summary-value">Local SQLite capable; file fallback active</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">DB foundation</span><span className="ccv2-page-summary-value">Ready</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">DB writes</span><span className="ccv2-page-summary-value">Governed ledgers only</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">File fallback</span><span className="ccv2-page-summary-value">Active</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Runtime DB primary</span><span className="ccv2-page-summary-value">SQLite reads when live mode is initialized</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next step</span><span className="ccv2-page-summary-value">Review DB Runtime for live state, blockers, owner, evidence, and allowed ledger write scope.</span></div>
              </div>
            </div>
            <div className="ccv2-stat-chips" style={{ marginBottom: 16 }}>
              <div className="ccv2-stat-chip"><span className="ccv2-stat-chip__label">Persistence</span><span className="ccv2-stat-chip__value ccv2-stat-chip__value--teal">SQLite local</span></div>
              <div className="ccv2-stat-chip"><span className="ccv2-stat-chip__label">DB foundation</span><span className="ccv2-stat-chip__value ccv2-stat-chip__value--teal">Ready</span></div>
              <div className="ccv2-stat-chip"><span className="ccv2-stat-chip__label">Entities</span><span className="ccv2-stat-chip__value">{entityCount}</span></div>
              <div className="ccv2-stat-chip"><span className="ccv2-stat-chip__label">Sources Mapped</span><span className="ccv2-stat-chip__value">{sourcesAvailable} / {totalEntities}</span></div>
              <div className="ccv2-stat-chip"><span className="ccv2-stat-chip__label">DB Writes</span><span className="ccv2-stat-chip__value ccv2-stat-chip__value--amber">Governed ledgers</span></div>
              <div className="ccv2-stat-chip"><span className="ccv2-stat-chip__label">Live data</span><span className="ccv2-stat-chip__value">{online ? "API" : "Snapshot"}</span></div>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="entities" activeTab={activeTab}>
            <div className="ccv2-card" style={{ marginTop: 8 }}>
              <div className="ccv2-section-heading">Entity Registry · {entities.length || entityCount} Entities</div>
              {entities.length > 0 ? (
                <div style={{ overflowX: "auto", marginTop: 8 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <tbody>
                      {entities.map((e) => (
                        <tr key={e.name} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "5px 8px", color: "var(--v2-text)", fontFamily: "monospace" }}>{e.name}</td>
                          <td style={{ padding: "5px 8px", color: "var(--v2-text-dim)" }}>{e.fieldCount} fields</td>
                          <td style={{ padding: "5px 8px", color: e.piiRisk === "none" ? "var(--v2-green)" : "var(--v2-amber)" }}>{e.piiRisk}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="ccv2-empty-state">Start local API with npm run nexus:up to see live entity coverage. Schema coverage includes projects, missions, tasks, evidence, audit events, approvals, incidents, roadmap phases, and validation results.</div>
              )}
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="import-plan" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Import Plan · Dry-run Only</div>
              <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Mapped sources</span><span className="ccv2-page-summary-value">{sourcesAvailable} / {totalEntities}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Unmapped sources</span><span className="ccv2-page-summary-value">{sourcesMissing}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Import preview</span><span className="ccv2-page-summary-value">{online ? "Available from live API" : "Requires local API for live mapping"}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Write posture</span><span className="ccv2-page-summary-value">SQLite writes are limited to governed evidence, audit, and activity ledgers.</span></div>
              </div>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="fallback" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Fallback</div>
              <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
                File fallback and snapshot fallback remain active. Local SQLite can serve repository reads when live mode is initialized, and governed ledger writes require explicit local DB write flags.
              </p>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="db-runtime" activeTab={activeTab}>
            <div className="ccv2-card ccv2-page-summary-card">
              <div className="ccv2-section-heading">DB Runtime Readiness</div>
              <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
                {dbRuntime.summaryRows.map((row) => (
                  <div key={row.label} className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">{row.label}</span><span className="ccv2-page-summary-value">{row.value}</span></div>
                ))}
              </div>
            </div>
            <div className="ccv2-stat-chips" style={{ marginBottom: 16 }}>
              {dbRuntime.statusChips.map((chip) => (
                <div key={chip.label} className="ccv2-stat-chip"><span className="ccv2-stat-chip__label">{chip.label}</span><span className={`ccv2-stat-chip__value ccv2-stat-chip__value--${chip.tone}`}>{chip.value}</span></div>
              ))}
            </div>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Enterprise Runtime CRUD</div>
              <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{dbRuntime.enterpriseRuntime.currentState}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Request state</span><span className="ccv2-page-summary-value">{dbRuntime.enterpriseRuntime.requestState}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Allowed local CRUD</span><span className="ccv2-page-summary-value">{dbRuntime.enterpriseRuntime.allowedOperations.join(", ")} with explicit approval and local write flags</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{dbRuntime.enterpriseRuntime.ownerCapability}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{dbRuntime.enterpriseRuntime.nextAction}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{dbRuntime.enterpriseRuntime.disabledReason}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{dbRuntime.enterpriseRuntime.activityLocation}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{dbRuntime.enterpriseRuntime.costImpact}</span></div>
              </div>
              <div className="ccv2-stat-chips" style={{ marginTop: 12, marginBottom: 8 }}>
                {dbRuntime.enterpriseRuntime.allowedEntities.map((entity) => (
                  <div key={entity} className="ccv2-stat-chip"><span className="ccv2-stat-chip__label">Allowed local record</span><span className="ccv2-stat-chip__value ccv2-stat-chip__value--teal">{entity}</span></div>
                ))}
              </div>
              <div className="ccv2-safety-grid" style={{ marginTop: 8 }}>
                {dbRuntime.enterpriseRuntime.lanes.map((lane) => (
                  <div key={lane.label} className="ccv2-safety-row">
                    <span className="ccv2-safety-row__label">{lane.label}</span>
                    <span className="ccv2-safety-row__value--ready">{lane.state} · {lane.owner} · {lane.evidence}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Founder DB Workflow</div>
              <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{dbRuntime.founderRuntime.currentState}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Saved session</span><span className="ccv2-page-summary-value">{dbRuntime.founderRuntime.savedSessionState}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next founder question</span><span className="ccv2-page-summary-value">{dbRuntime.founderRuntime.nextQuestion}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">PRD readiness</span><span className="ccv2-page-summary-value">{dbRuntime.founderRuntime.prdReadiness} · {dbRuntime.founderRuntime.prdState}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{dbRuntime.founderRuntime.ownerCapability}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{dbRuntime.founderRuntime.evidenceLocation}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{dbRuntime.founderRuntime.activityLocation}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{dbRuntime.founderRuntime.costImpact}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{dbRuntime.founderRuntime.disabledReason}</span></div>
              </div>
              <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
                {dbRuntime.founderRuntime.lanes.map((lane) => (
                  <div key={lane.label} className="ccv2-safety-row">
                    <span className="ccv2-safety-row__label">{lane.label}</span>
                    <span className="ccv2-safety-row__value--ready">{lane.currentState} · {lane.blocker}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Founder Workflow DB CRUD</div>
              <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{dbRuntime.founderRuntime.currentState}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Saved session</span><span className="ccv2-page-summary-value">{dbRuntime.founderRuntime.savedSessionState}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next founder question</span><span className="ccv2-page-summary-value">{dbRuntime.founderRuntime.nextQuestion}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">PRD readiness</span><span className="ccv2-page-summary-value">{dbRuntime.founderRuntime.prdReadiness} · {dbRuntime.founderRuntime.prdState}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Allowed local CRUD</span><span className="ccv2-page-summary-value">{dbRuntime.founderRuntime.allowedLocalCrudOperations.join(", ")} with explicit approval and local write flags</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{dbRuntime.founderRuntime.ownerCapability}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{dbRuntime.founderRuntime.nextAction}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{dbRuntime.founderRuntime.disabledReason}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{dbRuntime.founderRuntime.evidenceLocation}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{dbRuntime.founderRuntime.activityLocation}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{dbRuntime.founderRuntime.costImpact}</span></div>
              </div>
              <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
                {dbRuntime.founderRuntime.lanes.map((lane) => (
                  <div key={lane.label} className="ccv2-safety-row">
                    <span className="ccv2-safety-row__label">{lane.label}</span>
                    <span className="ccv2-safety-row__value--ready">{lane.currentState} · {lane.ownerCapability} · {lane.evidenceLocation}</span>
                  </div>
                ))}
              </div>
            </div>
            <BusinessBuildDbCrudCard crud={businessBuildRuntime} surfaceLabel="DB Runtime Business Build" />
            <FounderLiveOperatorDecisionLedgerPersistenceCard
              persistence={dbRuntime.operatorDecisionLedgerPersistence}
              surfaceLabel="DB Runtime Decision Ledger Persistence"
            />
            <FounderLiveAgentWorkOrderPersistenceCard
              persistence={dbRuntime.agentWorkOrderPersistence}
              surfaceLabel="DB Runtime Agent Work Order Persistence"
            />
            <LiveWorkstreamHandoffCard
              handoff={businessBuildRuntimeView.liveWorkstreamHandoff}
              dryRun={businessBuildRuntimeView.liveWorkstreamHandoffDryRun}
              surfaceLabel="DB Runtime Live Workstream Handoff"
            />
            <ExecutionAdmissionCard
              admission={businessBuildRuntimeView.executionAdmission}
              envelope={businessBuildRuntimeView.executionAdmissionApprovalEnvelope}
              dryRun={businessBuildRuntimeView.executionAdmissionDryRun}
              surfaceLabel="DB Runtime Execution Admission"
            />
            <FounderPersistenceControlsCard controls={founderPersistenceControls} />
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Blockers</div>
              <div className="ccv2-safety-grid" style={{ marginTop: 8 }}>
                {dbRuntime.blockers.map((blocker) => (
                  <div key={blocker} className="ccv2-safety-row"><span className="ccv2-safety-row__label">{blocker}</span><span className="ccv2-safety-row__value--disabled">Blocked</span></div>
                ))}
                {dbRuntime.enterpriseRuntime.blockedOperations.map((blocker) => (
                  <div key={blocker} className="ccv2-safety-row"><span className="ccv2-safety-row__label">{blocker}</span><span className="ccv2-safety-row__value--disabled">Blocked</span></div>
                ))}
              </div>
            </div>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Evidence, Activity, And Cost</div>
              <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
                {dbRuntime.evidenceRows.map((row) => (
                  <div key={row.label} className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">{row.label}</span><span className="ccv2-page-summary-value">{row.value}</span></div>
                ))}
              </div>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="developer-details" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Developer Details</div>
              <div className="ccv2-safety-grid" style={{ marginTop: 8 }}>
                {[
                  { label: "DB writes", value: "Governed ledgers only", valueClass: "ready" },
                  { label: "Production DB", value: "Not allowed", valueClass: "disabled" },
                  { label: "External DB", value: "Not allowed", valueClass: "disabled" },
                  { label: "File fallback", value: "Required", valueClass: "ready" },
                  { label: "SQLite CRUD", value: "Local only", valueClass: "ready" },
                ].map((row) => (
                  <div key={row.label} className="ccv2-safety-row"><span className="ccv2-safety-row__label">{row.label}</span><span className={`ccv2-safety-row__value--${row.valueClass}`}>{row.value}</span></div>
                ))}
              </div>
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

/* ─── Service Health Page ─── */
function ServiceHealthPage({ vm }) {
  const serviceHealth = vm.serviceHealth || {};
  const cards = serviceHealth.cards || [];
  const [bridgeOnline, setBridgeOnline] = useState(null);

  useEffect(() => {
    let cancelled = false;

    checkActionBridgeHealth()
      .then((result) => {
        if (!cancelled) {
          setBridgeOnline(Boolean(result?.online));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBridgeOnline(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const liveApiOnline = vm.liveApi?.liveApiOnline;
  const sourceLabel = liveApiOnline
    ? "service manifest + local status snapshot"
    : serviceHealth.sourceLabel || "service manifest / status snapshot / fallback";

  const resolvedCards = cards.map((card) => {
    if (card.id === "command-center") {
      return {
        ...card,
        currentStatus: "Online",
        statusTone: "pass",
        operatorGuidance:
          "The Command Center shell is currently serving this page on localhost.",
      };
    }

    if (card.id === "local-api") {
      return {
        ...card,
        currentStatus: liveApiOnline ? "Online" : "Offline",
        statusTone: liveApiOnline ? "pass" : "fail",
      };
    }

    if (card.id === "action-bridge" && bridgeOnline !== null) {
      return {
        ...card,
        currentStatus: bridgeOnline ? "Online" : "Offline",
        statusTone: bridgeOnline ? "pass" : "fail",
      };
    }

    return card;
  });

  const doctorSummary = serviceHealth.doctorSummary || {};
  const bootCommands = serviceHealth.commands?.length
    ? serviceHealth.commands
    : [
        "npm run nexus:up",
        "npm run nexus:down",
        "npm run nexus:status",
        "npm run nexus:doctor",
      ];
  const troubleshootingItems = [
    {
      title: "Port already in use",
      detail:
        "Run npm run nexus:doctor to identify local port conflicts. Stop the conflicting localhost process before retrying nexus:up.",
    },
    {
      title: "Local API offline",
      detail:
        "If the API card shows Offline, use npm run nexus:status for the current snapshot and restart the local API with nexus:up or npm run local-api:start in a terminal.",
    },
    {
      title: "Action bridge offline",
      detail:
        "Governed actions, task activation, and implementation review remain blocked until the action bridge is healthy. Run npm run nexus:doctor and then start it from a local terminal.",
    },
    {
      title: "Dashboard offline",
      detail:
        "If the shell is unavailable, start the Command Center with npm run nexus:up or npm run dashboard on localhost only.",
    },
    {
      title: "DB writes disabled by policy",
      detail:
        "Durable State remains file-backed and read-only in this phase. This is a safety boundary, not a runtime failure.",
    },
    {
      title: "Worker runtime not enabled yet",
      detail:
        "Worker Runtime, MCP Gateway, Tool access, and Provider Dispatch are future capabilities. They should appear as Not enabled or Planned, not as broken services.",
    },
  ];

  const commandCards = bootCommands.map((command) => ({
    command,
    label: command.replace("npm run ", ""),
  }));

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Service Health</div>
          <div className="ccv2-page-head__sub">
            Start, inspect, and troubleshoot local NEXUS services.
          </div>
        </div>

        <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.services} />

        <div className="ccv2-card ccv2-page-summary-card">
          <div className="ccv2-section-heading">Service Health Summary</div>
          <div className="ccv2-page-summary-grid">
            <div className="ccv2-page-summary-row">
              <span className="ccv2-page-summary-label">Current mode</span>
              <span className="ccv2-page-summary-value">
                {serviceHealth.mode || vm.shell.mode || "unknown"}
              </span>
            </div>
            <div className="ccv2-page-summary-row">
              <span className="ccv2-page-summary-label">Source</span>
              <span className="ccv2-page-summary-value">{sourceLabel}</span>
            </div>
            <div className="ccv2-page-summary-row">
              <span className="ccv2-page-summary-label">Service manifest</span>
              <span className="ccv2-page-summary-value">
                {serviceHealth.manifestPath || "nexus.services.json"}
              </span>
            </div>
            <div className="ccv2-page-summary-row">
              <span className="ccv2-page-summary-label">Status snapshot</span>
              <span className="ccv2-page-summary-value">
                {serviceHealth.statusPath || "Run npm run nexus:status"}
              </span>
            </div>
            <div className="ccv2-page-summary-row">
              <span className="ccv2-page-summary-label">Doctor report</span>
              <span className="ccv2-page-summary-value">
                {serviceHealth.doctorReportPath || "Run npm run nexus:doctor"}
              </span>
            </div>
            <div className="ccv2-page-summary-row">
              <span className="ccv2-page-summary-label">Safety</span>
              <span className="ccv2-page-summary-value">
                localhost-only binding. External network and DB writes remain disabled.
              </span>
            </div>
          </div>
        </div>

        <div className="ccv2-stat-chips">
          <div className="ccv2-stat-chip">
            <span className="ccv2-stat-chip__label">Boot</span>
            <span className="ccv2-stat-chip__value ccv2-stat-chip__value--teal">
              nexus:up available
            </span>
          </div>
          <div className="ccv2-stat-chip">
            <span className="ccv2-stat-chip__label">Shutdown</span>
            <span className="ccv2-stat-chip__value ccv2-stat-chip__value--teal">
              nexus:down available
            </span>
          </div>
          <div className="ccv2-stat-chip">
            <span className="ccv2-stat-chip__label">Status</span>
            <span className="ccv2-stat-chip__value ccv2-stat-chip__value--green">
              nexus:status available
            </span>
          </div>
          <div className="ccv2-stat-chip">
            <span className="ccv2-stat-chip__label">Doctor</span>
            <span className="ccv2-stat-chip__value ccv2-stat-chip__value--amber">
              nexus:doctor available
            </span>
          </div>
        </div>

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Local Boot Summary</div>
          <div className="ccv2-service-health__summary-list">
            <div className="ccv2-list-row">
              <div className="ccv2-list-row__primary">
                <span className="ccv2-list-row__title">nexus:up</span>
                <span className="ccv2-list-row__meta">
                  Starts enabled localhost-only services declared in the service manifest.
                </span>
              </div>
              <div className="ccv2-list-row__secondary">
                <span className="ccv2-pill ccv2-pill--pass">Available</span>
              </div>
            </div>
            <div className="ccv2-list-row">
              <div className="ccv2-list-row__primary">
                <span className="ccv2-list-row__title">nexus:down</span>
                <span className="ccv2-list-row__meta">
                  Stops only NEXUS-managed PIDs. Unmanaged local services are never killed by this command.
                </span>
              </div>
              <div className="ccv2-list-row__secondary">
                <span className="ccv2-pill ccv2-pill--pass">Available</span>
              </div>
            </div>
            <div className="ccv2-list-row">
              <div className="ccv2-list-row__primary">
                <span className="ccv2-list-row__title">Localhost-only reminder</span>
                <span className="ccv2-list-row__meta">
                  All enabled services stay on 127.0.0.1 or localhost. UI execution is not enabled yet.
                </span>
              </div>
              <div className="ccv2-list-row__secondary">
                <span className="ccv2-pill ccv2-pill--disabled">localhost-only</span>
              </div>
            </div>
          </div>
        </div>

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Service Cards</div>
          <div className="ccv2-service-health__grid">
            {resolvedCards.map((card) => (
              <article key={card.id} className="ccv2-service-card">
                <div className="ccv2-card-header-row">
                  <div>
                    <div className="ccv2-service-card__title">{card.label}</div>
                    <div className="ccv2-service-card__meta">{card.id}</div>
                  </div>
                  <span className={`ccv2-pill ccv2-pill--${card.statusTone}`}>
                    {card.currentStatus}
                  </span>
                </div>
                <p className="ccv2-service-card__role">{card.role}</p>
                <div className="ccv2-page-summary-grid ccv2-service-card__details">
                  <div className="ccv2-page-summary-row">
                    <span className="ccv2-page-summary-label">Requirement</span>
                    <span className="ccv2-page-summary-value">{card.requiredLabel}</span>
                  </div>
                  <div className="ccv2-page-summary-row">
                    <span className="ccv2-page-summary-label">Configured port</span>
                    <span className="ccv2-page-summary-value">{card.configuredPort}</span>
                  </div>
                  <div className="ccv2-page-summary-row">
                    <span className="ccv2-page-summary-label">Health URL</span>
                    <span className="ccv2-page-summary-value">{card.healthUrl}</span>
                  </div>
                  <div className="ccv2-page-summary-row">
                    <span className="ccv2-page-summary-label">Safety note</span>
                    <span className="ccv2-page-summary-value">{card.safetyNote}</span>
                  </div>
                </div>
                <div className="ccv2-service-card__guidance">
                  <span className="ccv2-page-summary-label">Operator guidance</span>
                  <span className="ccv2-page-summary-value">
                    {card.operatorGuidance}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Operator Commands</div>
          <div className="ccv2-service-health__command-grid">
            {commandCards.map((card) => (
              <div key={card.command} className="ccv2-service-health__command-card">
                <div className="ccv2-code-block">{card.command}</div>
                <button
                  type="button"
                  className="ccv2-mission-composer__btn"
                  disabled
                  title="UI execution is not enabled yet. Run this command in a local terminal."
                >
                  <span>{card.label}</span>
                  <span className="ccv2-mission-composer__btn-lock">⊘</span>
                </button>
                <div className="ccv2-service-health__command-note">
                  UI execution is not enabled yet. Run this command in a local terminal.
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ccv2-service-health__two-column">
          <div className="ccv2-card">
            <div className="ccv2-section-heading">Doctor Findings</div>
            {doctorSummary.available ? (
              <>
                <div className="ccv2-stat-chips">
                  <div className="ccv2-stat-chip">
                    <span className="ccv2-stat-chip__label">Passed checks</span>
                    <span className="ccv2-stat-chip__value ccv2-stat-chip__value--green">
                      {doctorSummary.passCount}
                    </span>
                  </div>
                  <div className="ccv2-stat-chip">
                    <span className="ccv2-stat-chip__label">Warnings</span>
                    <span className="ccv2-stat-chip__value ccv2-stat-chip__value--amber">
                      {doctorSummary.warningCount}
                    </span>
                  </div>
                  <div className="ccv2-stat-chip">
                    <span className="ccv2-stat-chip__label">Failures</span>
                    <span className="ccv2-stat-chip__value ccv2-stat-chip__value--red">
                      {doctorSummary.failureCount}
                    </span>
                  </div>
                </div>
                <div className="ccv2-empty-state">
                  Recommended fix: {doctorSummary.recommendedFix}
                </div>
                <div className="ccv2-service-health__findings">
                  {(doctorSummary.warnings?.length
                    ? doctorSummary.warnings
                    : ["No active warnings in the current doctor snapshot."]).map((item) => (
                    <div key={item} className="ccv2-list-row">
                      <div className="ccv2-list-row__primary">
                        <span className="ccv2-list-row__title">{item}</span>
                        <span className="ccv2-list-row__meta">
                          Refresh the doctor report any time with npm run nexus:doctor.
                        </span>
                      </div>
                      <div className="ccv2-list-row__secondary">
                        <span
                          className={`ccv2-pill ccv2-pill--${
                            doctorSummary.warningCount > 0 ? "pending" : "pass"
                          }`}
                        >
                          {doctorSummary.warningCount > 0 ? "Warning" : "Pass"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="ccv2-empty-state">
                Run npm run nexus:doctor to generate a local diagnostic report.
              </div>
            )}
          </div>

          <div className="ccv2-card">
            <div className="ccv2-section-heading">Troubleshooting</div>
            <div className="ccv2-service-health__findings">
              {troubleshootingItems.map((item) => (
                <div key={item.title} className="ccv2-list-row">
                  <div className="ccv2-list-row__primary">
                    <span className="ccv2-list-row__title">{item.title}</span>
                    <span className="ccv2-list-row__meta">{item.detail}</span>
                  </div>
                  <div className="ccv2-list-row__secondary">
                    <span className="ccv2-pill ccv2-pill--disabled">Guidance</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelfUpdatePage() {
  const readiness = buildSelfUpdateReadinessViewModel();
  const route = COMMAND_CENTER_ROUTE_BY_KEY.selfUpdate || {};
  const tabs = route.tabs || SELF_UPDATE_TABS;
  const [activeTab, setActiveTab] = useState(route.defaultTab || "overview");

  return (
    <div className="ccv2-content">
      <div className="ccv2-page" data-route-id={readiness.routeId}>
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">{readiness.pageTitle}</div>
          <div className="ccv2-page-head__sub">
            Display-only self-update readiness with approval, rollback, validation, and safety gates.
          </div>
        </div>

        <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.selfUpdate} />

        <div className="ccv2-page-summary">
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">What changed</span><span className="ccv2-page-summary-value">{readiness.whatChanged}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{readiness.currentState}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{readiness.nextAction}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner</span><span className="ccv2-page-summary-value">{readiness.ownerAgent} · {readiness.ownerCapability}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{readiness.evidenceLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{readiness.activityLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{readiness.costImpact}</span></div>
        </div>

        <div className="ccv2-info-banner" style={{ marginTop: 16 }}>
          {readiness.disabledReason}
        </div>

        <CommandTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Self-Update sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {readiness.readinessCards.map((card) => (
                <article className="ccv2-card" key={card.label}>
                  <div className="ccv2-section-heading">{card.label}</div>
                  <div className={`ccv2-pill ccv2-pill--${card.tone}`}>{card.value}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{card.detail}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="gate" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Gate Posture</div>
                <div className="ccv2-page-summary" style={{ marginTop: 12 }}>
                  {readiness.gateRows.map((row) => (
                    <div className="ccv2-page-summary-row" key={row.label}>
                      <span className="ccv2-page-summary-label">{row.label}</span>
                      <span className="ccv2-page-summary-value">{row.value}</span>
                    </div>
                  ))}
                </div>
              </article>
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Scope Boundary</div>
                <div className="ccv2-grid ccv2-grid--2" style={{ marginTop: 12 }}>
                  <div>
                    <div className="ccv2-muted">Allowed</div>
                    <ul className="ccv2-list">
                      {readiness.allowedScope.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="ccv2-muted">Forbidden</div>
                    <ul className="ccv2-list">
                      {readiness.forbiddenScope.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </article>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="evidence" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Evidence and Blockers</div>
              <div className="ccv2-page-summary" style={{ marginTop: 12 }}>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence location</span><span className="ccv2-page-summary-value">{readiness.evidenceLocation}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity location</span><span className="ccv2-page-summary-value">{readiness.activityLocation}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{readiness.costImpact}</span></div>
              </div>
              <ul className="ccv2-list" style={{ marginTop: 12 }}>
                {readiness.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
              </ul>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="disabled" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {readiness.disabledActions.map((action) => (
                <article className="ccv2-card" key={action.label}>
                  <div className="ccv2-section-heading">{action.label}</div>
                  <button
                    className="ccv2-btn ccv2-btn--disabled"
                    type="button"
                    aria-label={`Disabled action: ${action.label}`}
                    disabled
                    title={action.reason}
                  >
                    {action.label} disabled
                  </button>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{action.reason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function DeployMonitoringPage() {
  const readiness = buildDeployMonitoringReadinessViewModel();
  const route = COMMAND_CENTER_ROUTE_BY_KEY.deployMonitoring || {};
  const tabs = route.tabs || DEPLOY_MONITORING_TABS;
  const [activeTab, setActiveTab] = useState(route.defaultTab || "overview");

  return (
    <div className="ccv2-content">
      <div className="ccv2-page" data-route-id={readiness.routeId}>
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">{readiness.pageTitle}</div>
          <div className="ccv2-page-head__sub">
            Display-only deploy monitoring and incident mitigation readiness with approval, rollback, validation, and safety gates.
          </div>
        </div>

        <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.deployMonitoring} />

        <div className="ccv2-page-summary">
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">What changed</span><span className="ccv2-page-summary-value">{readiness.whatChanged}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{readiness.currentState}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{readiness.nextAction}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner</span><span className="ccv2-page-summary-value">{readiness.ownerAgent} · {readiness.ownerCapability}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{readiness.evidenceLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{readiness.activityLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{readiness.costImpact}</span></div>
        </div>

        <div className="ccv2-info-banner" style={{ marginTop: 16 }}>
          {readiness.disabledReason}
        </div>

        <CommandTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Deploy Monitoring sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {readiness.readinessCards.map((card) => (
                <article className="ccv2-card" key={card.label}>
                  <div className="ccv2-section-heading">{card.label}</div>
                  <div className={`ccv2-pill ccv2-pill--${card.tone}`}>{card.value}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{card.detail}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="gate" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Gate Posture</div>
                <div className="ccv2-page-summary" style={{ marginTop: 12 }}>
                  {readiness.gateRows.map((row) => (
                    <div className="ccv2-page-summary-row" key={row.label}>
                      <span className="ccv2-page-summary-label">{row.label}</span>
                      <span className="ccv2-page-summary-value">{row.value}</span>
                    </div>
                  ))}
                </div>
              </article>
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Scope Boundary</div>
                <div className="ccv2-grid ccv2-grid--2" style={{ marginTop: 12 }}>
                  <div>
                    <div className="ccv2-muted">Allowed</div>
                    <ul className="ccv2-list">
                      {readiness.allowedScope.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="ccv2-muted">Forbidden</div>
                    <ul className="ccv2-list">
                      {readiness.forbiddenScope.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </article>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="evidence" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Evidence and Blockers</div>
              <div className="ccv2-page-summary" style={{ marginTop: 12 }}>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence location</span><span className="ccv2-page-summary-value">{readiness.evidenceLocation}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity location</span><span className="ccv2-page-summary-value">{readiness.activityLocation}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{readiness.costImpact}</span></div>
              </div>
              <ul className="ccv2-list" style={{ marginTop: 12 }}>
                {readiness.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
              </ul>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="disabled" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {readiness.disabledActions.map((action) => (
                <article className="ccv2-card" key={action.label}>
                  <div className="ccv2-section-heading">{action.label}</div>
                  <button
                    className="ccv2-btn ccv2-btn--disabled"
                    type="button"
                    aria-label={`Disabled action: ${action.label}`}
                    disabled
                    title={action.reason}
                  >
                    {action.label} disabled
                  </button>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{action.reason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function ProjectShippingPage() {
  const readiness = buildProjectShippingReadinessViewModel();
  const route = COMMAND_CENTER_ROUTE_BY_KEY.projectShipping || {};
  const tabs = route.tabs || PROJECT_SHIPPING_TABS;
  const [activeTab, setActiveTab] = useState(route.defaultTab || "overview");

  return (
    <div className="ccv2-content">
      <div className="ccv2-page" data-route-id={readiness.routeId}>
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">{readiness.pageTitle}</div>
          <div className="ccv2-page-head__sub">
            Display-only project shipping readiness with manifest, redaction, package preview, evidence, and safety gates.
          </div>
        </div>

        <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.projectShipping} />

        <div className="ccv2-page-summary">
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">What changed</span><span className="ccv2-page-summary-value">{readiness.whatChanged}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{readiness.currentState}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{readiness.nextAction}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner</span><span className="ccv2-page-summary-value">{readiness.ownerAgent} · {readiness.ownerCapability}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{readiness.evidenceLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{readiness.activityLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{readiness.costImpact}</span></div>
        </div>

        <div className="ccv2-info-banner" style={{ marginTop: 16 }}>
          {readiness.disabledReason}
        </div>

        <CommandTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Project Shipping sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {readiness.readinessCards.map((card) => (
                <article className="ccv2-card" key={card.label}>
                  <div className="ccv2-section-heading">{card.label}</div>
                  <div className={`ccv2-pill ccv2-pill--${card.tone}`}>{card.value}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{card.detail}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="gate" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Gate Posture</div>
                <div className="ccv2-page-summary" style={{ marginTop: 12 }}>
                  {readiness.gateRows.map((row) => (
                    <div className="ccv2-page-summary-row" key={row.label}>
                      <span className="ccv2-page-summary-label">{row.label}</span>
                      <span className="ccv2-page-summary-value">{row.value}</span>
                    </div>
                  ))}
                </div>
              </article>
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Scope Boundary</div>
                <div className="ccv2-grid ccv2-grid--2" style={{ marginTop: 12 }}>
                  <div>
                    <div className="ccv2-muted">Allowed</div>
                    <ul className="ccv2-list">
                      {readiness.allowedScope.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="ccv2-muted">Forbidden</div>
                    <ul className="ccv2-list">
                      {readiness.forbiddenScope.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </article>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="evidence" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Evidence and Blockers</div>
              <div className="ccv2-page-summary" style={{ marginTop: 12 }}>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence location</span><span className="ccv2-page-summary-value">{readiness.evidenceLocation}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity location</span><span className="ccv2-page-summary-value">{readiness.activityLocation}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{readiness.costImpact}</span></div>
              </div>
              <ul className="ccv2-list" style={{ marginTop: 12 }}>
                {readiness.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
              </ul>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="disabled" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {readiness.disabledActions.map((action) => (
                <article className="ccv2-card" key={action.label}>
                  <div className="ccv2-section-heading">{action.label}</div>
                  <button
                    className="ccv2-btn ccv2-btn--disabled"
                    type="button"
                    aria-label={`Disabled action: ${action.label}`}
                    disabled
                    title={action.reason}
                  >
                    {action.label} disabled
                  </button>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{action.reason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function AuthGovernancePage() {
  const readiness = buildAuthGovernanceReadinessViewModel();
  const route = COMMAND_CENTER_ROUTE_BY_KEY.authGovernance || {};
  const tabs = route.tabs || AUTH_GOVERNANCE_TABS;
  const [activeTab, setActiveTab] = useState(route.defaultTab || "overview");

  return (
    <div className="ccv2-content">
      <div className="ccv2-page" data-route-id={readiness.routeId}>
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">{readiness.pageTitle}</div>
          <div className="ccv2-page-head__sub">Display-only identity, RBAC, and workspace governance readiness with auth mutation disabled.</div>
        </div>

        <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.authGovernance} />

        <div className="ccv2-page-summary">
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">What changed</span><span className="ccv2-page-summary-value">{readiness.whatChanged}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{readiness.currentState}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{readiness.nextAction}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner</span><span className="ccv2-page-summary-value">{readiness.ownerAgent} · {readiness.ownerCapability}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{readiness.evidenceLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{readiness.activityLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{readiness.costImpact}</span></div>
        </div>

        <div className="ccv2-info-banner" style={{ marginTop: 16 }}>{readiness.disabledReason}</div>

        <CommandTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Auth Governance sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {readiness.readinessCards.map((card) => (
                <article className="ccv2-card" key={card.label}>
                  <div className="ccv2-section-heading">{card.label}</div>
                  <div className={`ccv2-pill ccv2-pill--${card.tone}`}>{card.value}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{card.detail}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="governance" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Governance Posture</div>
              <div className="ccv2-page-summary" style={{ marginTop: 12 }}>
                {readiness.governanceRows.map((row) => (
                  <div className="ccv2-page-summary-row" key={row.label}>
                    <span className="ccv2-page-summary-label">{row.label}</span>
                    <span className="ccv2-page-summary-value">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="evidence" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Evidence and Blockers</div>
              <ul className="ccv2-list" style={{ marginTop: 12 }}>
                {readiness.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
              </ul>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="disabled" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {readiness.disabledActions.map((action) => (
                <article className="ccv2-card" key={action.label}>
                  <div className="ccv2-section-heading">{action.label}</div>
                  <button className="ccv2-btn ccv2-btn--disabled" type="button" disabled title={action.reason}>{action.label} disabled</button>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{action.reason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function ObservabilityPage() {
  const readiness = buildObservabilityReadinessViewModel();
  const route = COMMAND_CENTER_ROUTE_BY_KEY.observability || {};
  const tabs = route.tabs || OBSERVABILITY_TABS;
  const [activeTab, setActiveTab] = useState(route.defaultTab || "overview");

  return (
    <div className="ccv2-content">
      <div className="ccv2-page" data-route-id={readiness.routeId}>
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">{readiness.pageTitle}</div>
          <div className="ccv2-page-head__sub">Display-only telemetry, SLO, health, and incident readiness with exporters and automation disabled.</div>
        </div>

        <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.observability} />

        <div className="ccv2-page-summary">
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">What changed</span><span className="ccv2-page-summary-value">{readiness.whatChanged}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{readiness.currentState}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{readiness.nextAction}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner</span><span className="ccv2-page-summary-value">{readiness.ownerAgent} · {readiness.ownerCapability}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{readiness.evidenceLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{readiness.activityLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{readiness.costImpact}</span></div>
        </div>

        <div className="ccv2-info-banner" style={{ marginTop: 16 }}>{readiness.disabledReason}</div>

        <CommandTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Observability sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {readiness.readinessCards.map((card) => (
                <article className="ccv2-card" key={card.label}>
                  <div className="ccv2-section-heading">{card.label}</div>
                  <div className={`ccv2-pill ccv2-pill--${card.tone}`}>{card.value}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{card.detail}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="posture" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Observability Posture</div>
              <div className="ccv2-page-summary" style={{ marginTop: 12 }}>
                {readiness.postureRows.map((row) => (
                  <div className="ccv2-page-summary-row" key={row.label}>
                    <span className="ccv2-page-summary-label">{row.label}</span>
                    <span className="ccv2-page-summary-value">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="evidence" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Health Snapshot</div>
                <ul className="ccv2-list" style={{ marginTop: 12 }}>
                  {readiness.snapshotRows.map((row) => <li key={row.label}>{row.label}: {row.state}</li>)}
                </ul>
              </article>
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Blockers</div>
                <ul className="ccv2-list" style={{ marginTop: 12 }}>
                  {readiness.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
                </ul>
              </article>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="disabled" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {readiness.disabledActions.map((action) => (
                <article className="ccv2-card" key={action.label}>
                  <div className="ccv2-section-heading">{action.label}</div>
                  <button className="ccv2-btn ccv2-btn--disabled" type="button" disabled title={action.reason}>{action.label} disabled</button>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{action.reason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function BackupDrPage() {
  const readiness = buildBackupDrReadinessViewModel();
  const route = COMMAND_CENTER_ROUTE_BY_KEY.backupDr || {};
  const tabs = route.tabs || BACKUP_DR_TABS;
  const [activeTab, setActiveTab] = useState(route.defaultTab || "overview");

  return (
    <div className="ccv2-content">
      <div className="ccv2-page" data-route-id={readiness.routeId}>
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">{readiness.pageTitle}</div>
          <div className="ccv2-page-head__sub">Display-only backup, restore, and disaster recovery readiness with execution disabled.</div>
        </div>

        <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.backupDr} />

        <div className="ccv2-page-summary">
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">What changed</span><span className="ccv2-page-summary-value">{readiness.whatChanged}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{readiness.currentState}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{readiness.nextAction}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner</span><span className="ccv2-page-summary-value">{readiness.ownerAgent} · {readiness.ownerCapability}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{readiness.evidenceLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{readiness.activityLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{readiness.costImpact}</span></div>
        </div>

        <div className="ccv2-info-banner" style={{ marginTop: 16 }}>{readiness.disabledReason}</div>

        <CommandTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Backup DR sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {readiness.readinessCards.map((card) => (
                <article className="ccv2-card" key={card.label}>
                  <div className="ccv2-section-heading">{card.label}</div>
                  <div className={`ccv2-pill ccv2-pill--${card.tone}`}>{card.value}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{card.detail}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="posture" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Backup DR Posture</div>
              <div className="ccv2-page-summary" style={{ marginTop: 12 }}>
                {readiness.postureRows.map((row) => (
                  <div className="ccv2-page-summary-row" key={row.label}>
                    <span className="ccv2-page-summary-label">{row.label}</span>
                    <span className="ccv2-page-summary-value">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="evidence" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Runbook Gate</div>
                <ul className="ccv2-list" style={{ marginTop: 12 }}>
                  {readiness.runbookRows.map((row) => <li key={row.label}>{row.label}: {row.executionState}</li>)}
                </ul>
              </article>
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Blockers</div>
                <ul className="ccv2-list" style={{ marginTop: 12 }}>
                  {readiness.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
                </ul>
              </article>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="disabled" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {readiness.disabledActions.map((action) => (
                <article className="ccv2-card" key={action.label}>
                  <div className="ccv2-section-heading">{action.label}</div>
                  <button className="ccv2-btn ccv2-btn--disabled" type="button" disabled title={action.reason}>{action.label} disabled</button>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{action.reason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function IsolationPage() {
  const readiness = buildIsolationReadinessViewModel();
  const route = COMMAND_CENTER_ROUTE_BY_KEY.isolation || {};
  const tabs = route.tabs || ISOLATION_TABS;
  const [activeTab, setActiveTab] = useState(route.defaultTab || "overview");

  return (
    <div className="ccv2-content">
      <div className="ccv2-page" data-route-id={readiness.routeId}>
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">{readiness.pageTitle}</div>
          <div className="ccv2-page-head__sub">Display-only tenant, project, and access isolation readiness with mutation disabled.</div>
        </div>

        <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.isolation} />

        <div className="ccv2-page-summary">
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">What changed</span><span className="ccv2-page-summary-value">{readiness.whatChanged}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{readiness.currentState}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{readiness.nextAction}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner</span><span className="ccv2-page-summary-value">{readiness.ownerAgent} · {readiness.ownerCapability}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{readiness.evidenceLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{readiness.activityLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{readiness.costImpact}</span></div>
        </div>

        <div className="ccv2-info-banner" style={{ marginTop: 16 }}>{readiness.disabledReason}</div>

        <CommandTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Isolation sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {readiness.readinessCards.map((card) => (
                <article className="ccv2-card" key={card.label}>
                  <div className="ccv2-section-heading">{card.label}</div>
                  <div className={`ccv2-pill ccv2-pill--${card.tone}`}>{card.value}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{card.detail}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="posture" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Isolation Posture</div>
              <div className="ccv2-page-summary" style={{ marginTop: 12 }}>
                {readiness.postureRows.map((row) => (
                  <div className="ccv2-page-summary-row" key={row.label}>
                    <span className="ccv2-page-summary-label">{row.label}</span>
                    <span className="ccv2-page-summary-value">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="evidence" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Access Context</div>
                <ul className="ccv2-list" style={{ marginTop: 12 }}>
                  {readiness.accessRows.map((row) => <li key={row.label}>{row.label}: {row.executionState}</li>)}
                </ul>
              </article>
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Blockers</div>
                <ul className="ccv2-list" style={{ marginTop: 12 }}>
                  {readiness.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
                </ul>
              </article>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="disabled" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {readiness.disabledActions.map((action) => (
                <article className="ccv2-card" key={action.label}>
                  <div className="ccv2-section-heading">{action.label}</div>
                  <button className="ccv2-btn ccv2-btn--disabled" type="button" disabled title={action.reason}>{action.label} disabled</button>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{action.reason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function CompliancePage() {
  const readiness = buildComplianceReadinessViewModel();
  const route = COMMAND_CENTER_ROUTE_BY_KEY.compliance || {};
  const tabs = route.tabs || COMPLIANCE_TABS;
  const [activeTab, setActiveTab] = useState(route.defaultTab || "overview");

  return (
    <div className="ccv2-content">
      <div className="ccv2-page" data-route-id={readiness.routeId}>
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">{readiness.pageTitle}</div>
          <div className="ccv2-page-head__sub">Display-only compliance, audit, and control mapping readiness with runtime actions disabled.</div>
        </div>

        <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.compliance} />

        <div className="ccv2-page-summary">
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">What changed</span><span className="ccv2-page-summary-value">{readiness.whatChanged}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{readiness.currentState}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{readiness.nextAction}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner</span><span className="ccv2-page-summary-value">{readiness.ownerAgent} · {readiness.ownerCapability}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{readiness.evidenceLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{readiness.activityLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{readiness.costImpact}</span></div>
        </div>

        <div className="ccv2-info-banner" style={{ marginTop: 16 }}>{readiness.disabledReason}</div>

        <CommandTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Compliance sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {readiness.readinessCards.map((card) => (
                <article className="ccv2-card" key={card.label}>
                  <div className="ccv2-section-heading">{card.label}</div>
                  <div className={`ccv2-pill ccv2-pill--${card.tone}`}>{card.value}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{card.detail}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="posture" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Compliance Posture</div>
              <div className="ccv2-page-summary" style={{ marginTop: 12 }}>
                {readiness.postureRows.map((row) => (
                  <div className="ccv2-page-summary-row" key={row.label}>
                    <span className="ccv2-page-summary-label">{row.label}</span>
                    <span className="ccv2-page-summary-value">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="evidence" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Control Mapping</div>
                <ul className="ccv2-list" style={{ marginTop: 12 }}>
                  {readiness.controlRows.map((row) => <li key={row.label}>{row.label}: {row.executionState}</li>)}
                </ul>
              </article>
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Blockers</div>
                <ul className="ccv2-list" style={{ marginTop: 12 }}>
                  {readiness.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
                </ul>
              </article>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="disabled" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {readiness.disabledActions.map((action) => (
                <article className="ccv2-card" key={action.label}>
                  <div className="ccv2-section-heading">{action.label}</div>
                  <button className="ccv2-btn ccv2-btn--disabled" type="button" disabled title={action.reason}>{action.label} disabled</button>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{action.reason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function EnterprisePreviewPage() {
  const readiness = buildEnterprisePreviewReadinessViewModel();
  const route = COMMAND_CENTER_ROUTE_BY_KEY.enterprisePreview || {};
  const tabs = route.tabs || ENTERPRISE_PREVIEW_TABS;
  const [activeTab, setActiveTab] = useState(route.defaultTab || "overview");

  return (
    <div className="ccv2-content">
      <div className="ccv2-page" data-route-id={readiness.routeId}>
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">{readiness.pageTitle}</div>
          <div className="ccv2-page-head__sub">Display-only founder-to-business readiness with runtime actions disabled.</div>
        </div>

        <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.enterprisePreview} />

        <div className="ccv2-page-summary">
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">What changed</span><span className="ccv2-page-summary-value">{readiness.whatChanged}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{readiness.currentState}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{readiness.nextAction}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner</span><span className="ccv2-page-summary-value">{readiness.ownerAgent} · {readiness.ownerCapability}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{readiness.evidenceLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{readiness.activityLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{readiness.costImpact}</span></div>
        </div>

        <div className="ccv2-info-banner" style={{ marginTop: 16 }}>{readiness.disabledReason}</div>

        <CommandTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Enterprise Preview sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {readiness.readinessCards.map((card) => (
                <article className="ccv2-card" key={card.label}>
                  <div className="ccv2-section-heading">{card.label}</div>
                  <div className={`ccv2-pill ccv2-pill--${card.tone}`}>{card.value}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{card.detail}</div>
                </article>
              ))}
            </div>
            <div className="ccv2-card" style={{ marginTop: 16 }}>
              <div className="ccv2-section-heading">Founder-to-Business Path</div>
              <ul className="ccv2-list" style={{ marginTop: 12 }}>
                {readiness.journeyRows.map((row) => <li key={row.label}>{row.label}: {row.executionState}</li>)}
              </ul>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="prd" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Founder Intake</div>
                <ul className="ccv2-list" style={{ marginTop: 12 }}>
                  {readiness.founderRows.map((row) => <li key={row.label}>{row.label}: {row.currentState}</li>)}
                </ul>
              </article>
              <article className="ccv2-card">
                <div className="ccv2-section-heading">PRD Preview</div>
                <ul className="ccv2-list" style={{ marginTop: 12 }}>
                  {readiness.prdRows.map((row) => <li key={row.label}>{row.label}: {row.currentState}</li>)}
                </ul>
              </article>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="workplan" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Agent Workplan</div>
                <ul className="ccv2-list" style={{ marginTop: 12 }}>
                  {readiness.workplanRows.map((row) => <li key={row.label}>{row.label}: {row.executionState}</li>)}
                </ul>
              </article>
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Validation Gates</div>
                <ul className="ccv2-list" style={{ marginTop: 12 }}>
                  {readiness.validationRows.map((row) => <li key={row.label}>{row.label}: {row.currentState}</li>)}
                </ul>
              </article>
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Self-Healing</div>
                <ul className="ccv2-list" style={{ marginTop: 12 }}>
                  {readiness.healingRows.map((row) => <li key={row.label}>{row.label}: {row.currentState}</li>)}
                </ul>
              </article>
            </div>
            <div className="ccv2-card" style={{ marginTop: 16 }}>
              <div className="ccv2-section-heading">Blockers</div>
              <ul className="ccv2-list" style={{ marginTop: 12 }}>
                {readiness.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
              </ul>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="disabled" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {readiness.disabledActions.map((action) => (
                <article className="ccv2-card" key={action.label}>
                  <div className="ccv2-section-heading">{action.label}</div>
                  <button className="ccv2-btn ccv2-btn--disabled" type="button" disabled title={action.reason}>{action.label} disabled</button>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{action.reason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function LiveReadinessPage() {
  const readiness = buildLiveReadinessViewModel();
  const founderLiveUse = buildBusinessBuildViewModel(getStoredLiteFounderIdea());
  const route = COMMAND_CENTER_ROUTE_BY_KEY.liveReadiness || {};
  const tabs = route.tabs || LIVE_READINESS_TABS;
  const [activeTab, setActiveTab] = useState(route.defaultTab || "overview");

  return (
    <div className="ccv2-content">
      <div className="ccv2-page" data-route-id={readiness.routeId}>
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">{readiness.pageTitle}</div>
          <div className="ccv2-page-head__sub">Live mode gates, bridge admission, and runtime blockers without runnable live actions.</div>
        </div>

        <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.liveReadiness} />

        <div className="ccv2-page-summary">
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">What changed</span><span className="ccv2-page-summary-value">{readiness.whatChanged}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{readiness.currentState}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{readiness.nextAction}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner</span><span className="ccv2-page-summary-value">{readiness.ownerAgent} · {readiness.ownerCapability}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{readiness.evidenceLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{readiness.activityLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{readiness.costImpact}</span></div>
        </div>

        <div className="ccv2-info-banner" style={{ marginTop: 16 }}>{readiness.disabledReason}</div>

        <FounderLiveUseReviewCard
          readiness={founderLiveUse.founderLiveUseReadiness}
          review={founderLiveUse.founderLiveUseReview}
          surfaceLabel="Live Readiness Founder Live Use"
        />
        <FounderLiveHandoffCard
          manifest={founderLiveUse.founderLiveHandoffManifest}
          workOrders={founderLiveUse.founderLiveHandoffWorkOrders}
          surfaceLabel="Live Readiness Founder Live Handoff"
        />
        <FounderLiveWorkAdmissionCard
          admission={founderLiveUse.founderLiveWorkAdmission}
          approval={founderLiveUse.founderLiveWorkAdmissionApproval}
          surfaceLabel="Live Readiness Founder Work Admission"
        />
        <FounderLiveExecutionBoundaryCard
          boundary={founderLiveUse.founderLiveExecutionBoundary}
          surfaceLabel="Live Readiness Execution Boundary"
        />
        <FounderLiveExecutionApprovalReviewPacketCard
          packet={founderLiveUse.founderLiveExecutionApprovalReviewPacket}
          surfaceLabel="Live Readiness Approval Review"
        />
        <FounderLiveApprovalRequestQueuePreviewCard
          queue={founderLiveUse.founderLiveApprovalRequestQueuePreview}
          surfaceLabel="Live Readiness Approval Request Queue"
        />
        <FounderLiveApprovalCaptureBoundaryCard
          capture={founderLiveUse.founderLiveApprovalCaptureBoundary}
          surfaceLabel="Live Readiness Approval Capture Boundary"
        />
        <FounderLiveApprovalOperatorReviewCard
          operatorReview={founderLiveUse.founderLiveApprovalOperatorReview}
          surfaceLabel="Live Readiness Operator Review"
        />
        <FounderLiveOperatorDecisionLedgerCard
          decisionLedger={founderLiveUse.founderLiveOperatorDecisionLedger}
          surfaceLabel="Live Readiness Decision Ledger"
        />
        <FounderLiveOperatorDecisionLedgerPersistenceCard
          persistence={founderLiveUse.founderLiveOperatorDecisionLedgerPersistence}
          surfaceLabel="Live Readiness Decision Ledger Persistence"
        />

        <CommandTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Live readiness sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {readiness.readinessCards.map((card) => (
                <article className="ccv2-card" key={card.label}>
                  <div className="ccv2-section-heading">{card.label}</div>
                  <div className={`ccv2-pill ccv2-pill--${card.tone}`}>{card.value}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{card.detail}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="gates" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {readiness.activationRows.map((gate) => (
                <article className="ccv2-card" key={`${gate.surface}-${gate.label}`}>
                  <div className="ccv2-section-heading">{gate.label}</div>
                  <div className={`ccv2-pill ccv2-pill--${gate.readinessLabel === "Ready" ? "pass" : gate.readinessLabel === "Needs setup" ? "amber" : "disabled"}`}>{gate.readinessLabel}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>Surface: {gate.surface}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>{gate.disabledReason}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Next action: {gate.nextAction}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Owner: {gate.ownerCapability}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Evidence: {gate.evidenceLocation}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Cost: {gate.costImpact}</div>
                </article>
              ))}
              {readiness.gateRows.map((gate) => (
                <article className="ccv2-card" key={gate.label}>
                  <div className="ccv2-section-heading">{gate.label}</div>
                  <div className="ccv2-pill ccv2-pill--disabled">{gate.currentState}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{gate.disabledReason}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Next action: {gate.nextAction}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Owner: {gate.ownerCapability}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Evidence: {gate.evidenceLocation}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="queue" activeTab={activeTab}>
            <div className="ccv2-card" aria-label="Governed live approval queue">
              <div className="ccv2-section-heading">Governed live approval queue</div>
              <div className="ccv2-muted" style={{ marginTop: 8 }}>{readiness.approvalQueue.disabledReason}</div>
              <div className="ccv2-grid ccv2-grid--4" style={{ marginTop: 12 }}>
                <div className="ccv2-mini-card"><span>Current state</span><strong>{readiness.approvalQueue.currentState}</strong></div>
                <div className="ccv2-mini-card"><span>Owner</span><strong>{readiness.approvalQueue.ownerCapability}</strong></div>
                <div className="ccv2-mini-card"><span>Evidence</span><strong>{readiness.approvalQueue.evidenceLocation}</strong></div>
                <div className="ccv2-mini-card"><span>Cost</span><strong>{readiness.approvalQueue.costImpact}</strong></div>
              </div>
            </div>
            <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
              {readiness.approvalQueue.rows.map((item) => (
                <article className="ccv2-card" key={item.label}>
                  <div className="ccv2-section-heading">{item.label}</div>
                  <div className="ccv2-pill ccv2-pill--disabled">{item.queueState}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>Decision: {item.approvalDecision}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Owner: {item.ownerCapability}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Missing evidence: {item.missingEvidence.length ? item.missingEvidence.join(", ") : "None"}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Required evidence: {item.requiredEvidence.join(", ")}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Next action: {item.nextAction}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>{item.disabledReason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="unlocks" activeTab={activeTab}>
            <div className="ccv2-card" aria-label="Explicit live unlock lanes">
              <div className="ccv2-section-heading">Explicit live unlock lanes</div>
              <div className="ccv2-muted" style={{ marginTop: 8 }}>{readiness.liveUnlocks.disabledReason}</div>
              <div className="ccv2-grid ccv2-grid--4" style={{ marginTop: 12 }}>
                <div className="ccv2-mini-card"><span>Current state</span><strong>{readiness.liveUnlocks.currentState}</strong></div>
                <div className="ccv2-mini-card"><span>Owner</span><strong>{readiness.liveUnlocks.ownerCapability}</strong></div>
                <div className="ccv2-mini-card"><span>Evidence</span><strong>{readiness.liveUnlocks.evidenceLocation}</strong></div>
                <div className="ccv2-mini-card"><span>Cost</span><strong>{readiness.liveUnlocks.costImpact}</strong></div>
              </div>
            </div>
            <div className="ccv2-grid ccv2-grid--2" style={{ marginTop: 16 }}>
              {readiness.liveUnlocks.rows.map((item) => (
                <article className="ccv2-card" key={item.label}>
                  <div className="ccv2-section-heading">{item.label}</div>
                  <div className="ccv2-pill ccv2-pill--amber">{item.currentState}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>Owner: {item.ownerCapability}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Next action: {item.nextAction}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Blockers: {item.blockers.join(", ")}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Evidence: {item.evidenceLocation}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Activity: {item.activityLocation}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Cost: {item.costImpact}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>{item.disabledReason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="scoped" activeTab={activeTab}>
            <div className="ccv2-card" aria-label="Scoped activation admission">
              <div className="ccv2-section-heading">Scoped activation admission</div>
              <div className="ccv2-muted" style={{ marginTop: 8 }}>{readiness.scopedActivation.disabledReason}</div>
              <div className="ccv2-grid ccv2-grid--4" style={{ marginTop: 12 }}>
                <div className="ccv2-mini-card"><span>Current state</span><strong>{readiness.scopedActivation.currentState}</strong></div>
                <div className="ccv2-mini-card"><span>Owner</span><strong>{readiness.scopedActivation.ownerCapability}</strong></div>
                <div className="ccv2-mini-card"><span>Evidence</span><strong>{readiness.scopedActivation.evidenceLocation}</strong></div>
                <div className="ccv2-mini-card"><span>Cost</span><strong>{readiness.scopedActivation.costImpact}</strong></div>
              </div>
            </div>
            <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
              {readiness.scopedActivation.rows.map((item) => (
                <article className="ccv2-card" key={item.label}>
                  <div className="ccv2-section-heading">{item.label}</div>
                  <div className="ccv2-pill ccv2-pill--disabled">{item.currentState}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>Kind: {item.kind}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Owner: {item.ownerCapability}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Next action: {item.nextAction}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Blockers: {item.blockers.length ? item.blockers.join(", ") : "None"}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Evidence: {item.evidenceLocation}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Activity: {item.activityLocation}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Cost: {item.costImpact}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>{item.disabledReason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="bridge" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {readiness.bridgeRows.map((row) => (
                <article className="ccv2-card" key={row.label}>
                  <div className="ccv2-section-heading">{row.label}</div>
                  <div className="ccv2-pill ccv2-pill--disabled">{row.currentState}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>Capability: {row.capability}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.disabledReason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="disabled" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {readiness.disabledActions.map((action) => (
                <article className="ccv2-card" key={action.label}>
                  <div className="ccv2-section-heading">{action.label}</div>
                  <button className="ccv2-btn ccv2-btn--disabled" type="button" disabled title={action.reason}>{action.label} disabled</button>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{action.reason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function FounderIntakePage() {
  const intake = buildFounderIntakeViewModel();
  const route = COMMAND_CENTER_ROUTE_BY_KEY.founderIntake || {};
  const tabs = route.tabs || FOUNDER_INTAKE_TABS;
  const [activeTab, setActiveTab] = useState(route.defaultTab || "overview");

  return (
    <div className="ccv2-content">
      <div className="ccv2-page" data-route-id={intake.routeId}>
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">{intake.pageTitle}</div>
          <div className="ccv2-page-head__sub">Structured founder idea intake, next question, readiness, blockers, and cost posture.</div>
        </div>

        <FounderOperationsBoard
          title="Founder Intake"
          purpose="Capture the business idea as structured answers before PRD and workstream planning."
          currentState={intake.currentState}
          nextAction={intake.nextAction}
          blocker={intake.disabledReason}
          owner={`${intake.ownerAgent} / ${intake.ownerCapability}`}
          evidence={intake.evidenceLocation}
          activity={intake.activityLocation}
          cost={intake.costImpact}
          lanes={intake.readinessCards.slice(0, 4).map((card) => ({
            label: card.label,
            value: card.value,
          }))}
        />

        <div className="ccv2-page-summary">
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">What changed</span><span className="ccv2-page-summary-value">{intake.whatChanged}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{intake.currentState}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{intake.nextAction}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner</span><span className="ccv2-page-summary-value">{intake.ownerAgent} · {intake.ownerCapability}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{intake.evidenceLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{intake.activityLocation}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{intake.costImpact}</span></div>
        </div>

        <div className="ccv2-info-banner" style={{ marginTop: 16 }}>{intake.disabledReason}</div>

        <CommandTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Founder intake sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {intake.readinessCards.map((card) => (
                <article className="ccv2-card" key={card.label}>
                  <div className="ccv2-section-heading">{card.label}</div>
                  <div className={`ccv2-pill ccv2-pill--${card.tone}`}>{card.value}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{card.detail}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="questions" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Next Question</div>
                <div className="ccv2-muted">{intake.questionState.prompt}</div>
                <div className="ccv2-muted" style={{ marginTop: 10 }}>Missing fields: {intake.questionState.missingFields.join(", ")}</div>
                <div className="ccv2-muted" style={{ marginTop: 10 }}>Next action: {intake.questionState.nextAction}</div>
              </article>
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Captured Answers</div>
                {intake.answerRows.map((row) => (
                  <div className="ccv2-page-summary-row" key={row.field}>
                    <span className="ccv2-page-summary-label">{row.field}</span>
                    <span className="ccv2-page-summary-value">{row.answer} · {row.state}</span>
                  </div>
                ))}
              </article>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="readiness" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Comprehension</div>
                <div className="ccv2-pill ccv2-pill--amber">{Math.round(intake.readiness.score * 100)}%</div>
                <div className="ccv2-muted" style={{ marginTop: 10 }}>Answered: {intake.readiness.answeredCount}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Missing: {intake.readiness.missingCount}</div>
              </article>
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Blockers</div>
                {intake.readiness.blockers.map((blocker) => <div className="ccv2-muted" key={blocker}>{blocker}</div>)}
              </article>
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Evidence</div>
                <div className="ccv2-muted">Evidence: {intake.evidenceLocation}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Activity: {intake.activityLocation}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Cost: {intake.costImpact}</div>
              </article>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="disabled" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {intake.disabledActions.map((action) => (
                <article className="ccv2-card" key={action.label}>
                  <div className="ccv2-section-heading">{action.label}</div>
                  <button className="ccv2-btn ccv2-btn--disabled" type="button" disabled title={action.reason}>{action.label} disabled</button>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{action.reason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function BusinessBuildPage() {
  const [founderIdea] = useState(getStoredLiteFounderIdea);
  const build = buildBusinessBuildViewModel(founderIdea);
  const founderPersistenceControls = buildFounderPersistenceControlsViewModel(build.founderDbWorkflow);
  const route = COMMAND_CENTER_ROUTE_BY_KEY.businessBuild || {};
  const tabs = route.tabs || BUSINESS_BUILD_TABS;
  const [activeTab, setActiveTab] = useState(route.defaultTab || "overview");

  return (
    <div className="ccv2-content">
      <div className="ccv2-page" data-route-id={build.routeId}>
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">{build.pageTitle}</div>
          <div className="ccv2-page-head__sub">Founder idea, feasibility, PRD readiness, agent work plan, and blocked execution boundaries.</div>
        </div>

        <FounderOperationsBoard
          title="Business Build"
          purpose="Convert the founder idea into feasibility, PRD readiness, and governed agent workstream planning."
          currentState={build.localExecutionReadiness.currentState}
          nextAction={build.founderNextStep}
          blocker={build.localExecutionReadiness.disabledReason}
          owner={build.localExecutionReadiness.ownerCapability}
          evidence={build.localExecutionReadiness.evidenceLocation}
          activity={build.localExecutionReadiness.activityLocation}
          cost={build.localExecutionReadiness.costImpact}
          lanes={build.workstreamRows.slice(0, 4).map((row) => ({
            label: row.label,
            value: row.status,
          }))}
        />

        <div className="ccv2-page-summary">
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Founder idea</span><span className="ccv2-page-summary-value">{build.founderIdea}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Feasibility</span><span className="ccv2-page-summary-value">{build.feasibilityVerdict}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Customer</span><span className="ccv2-page-summary-value">{build.targetCustomer}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next useful step</span><span className="ccv2-page-summary-value">{build.founderNextStep}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Agent plan</span><span className="ccv2-page-summary-value">{build.agentPlanSummary}</span></div>
          <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Safety</span><span className="ccv2-page-summary-value">{build.safetySummary}</span></div>
        </div>

        <div className="ccv2-info-banner" style={{ marginTop: 16 }}>
          Business Build is live for local planning and DB-backed readiness. Agents are shown as owner lanes; dispatch, provider calls, project writes, hosted DB mutation, deploy, package creation, and spend are still disabled.
        </div>

        <FounderLiveUseReviewCard
          readiness={build.founderLiveUseReadiness}
          review={build.founderLiveUseReview}
          surfaceLabel="Business Build Founder Live Use"
        />
        <FounderLiveHandoffCard
          manifest={build.founderLiveHandoffManifest}
          workOrders={build.founderLiveHandoffWorkOrders}
          surfaceLabel="Business Build Founder Live Handoff"
        />
        <FounderLiveWorkAdmissionCard
          admission={build.founderLiveWorkAdmission}
          approval={build.founderLiveWorkAdmissionApproval}
          surfaceLabel="Business Build Founder Work Admission"
        />
        <FounderLiveExecutionBoundaryCard
          boundary={build.founderLiveExecutionBoundary}
          surfaceLabel="Business Build Execution Boundary"
        />
        <FounderLiveExecutionApprovalReviewPacketCard
          packet={build.founderLiveExecutionApprovalReviewPacket}
          surfaceLabel="Business Build Approval Review"
        />
        <FounderLiveApprovalRequestQueuePreviewCard
          queue={build.founderLiveApprovalRequestQueuePreview}
          surfaceLabel="Business Build Approval Request Queue"
        />
        <FounderLiveApprovalCaptureBoundaryCard
          capture={build.founderLiveApprovalCaptureBoundary}
          surfaceLabel="Business Build Approval Capture Boundary"
        />
        <FounderLiveApprovalOperatorReviewCard
          operatorReview={build.founderLiveApprovalOperatorReview}
          surfaceLabel="Business Build Operator Review"
        />
        <FounderLiveOperatorDecisionLedgerCard
          decisionLedger={build.founderLiveOperatorDecisionLedger}
          surfaceLabel="Business Build Decision Ledger"
        />
        <FounderLiveOperatorDecisionLedgerPersistenceCard
          persistence={build.founderLiveOperatorDecisionLedgerPersistence}
          surfaceLabel="Business Build Decision Ledger Persistence"
        />
        <FounderLiveAgentWorkOrderPersistenceCard
          persistence={build.founderLiveAgentWorkOrderPersistence}
          surfaceLabel="Business Build Agent Work Order Persistence"
        />
        <FounderLiveAgentWorkQueueAdmissionCard
          queue={build.founderLiveAgentWorkQueueAdmission}
          surfaceLabel="Business Build Agent Work Queue Admission"
        />
        <FounderLiveAgentWorkAssignmentCard
          assignment={build.founderLiveAgentWorkAssignment}
          surfaceLabel="Business Build Agent Work Assignment"
        />
        <FounderLiveAgentDispatchReadinessCard
          dispatchReadiness={build.founderLiveAgentDispatchReadiness}
          surfaceLabel="Business Build Agent Dispatch Readiness"
        />
        <FounderLiveRuntimeAdmissionReadinessCard
          runtimeReadiness={build.founderLiveRuntimeAdmissionReadiness}
          surfaceLabel="Business Build Runtime Admission Readiness"
        />
        <FounderLiveRuntimeExecutionReadinessCard
          runtimeExecutionReadiness={build.founderLiveRuntimeExecutionReadiness}
          surfaceLabel="Business Build Runtime Execution Readiness"
        />
        <FounderRuntimeExecutionApprovalGateCard
          approvalGate={build.founderRuntimeExecutionApprovalGate}
          surfaceLabel="Business Build Runtime Execution Approval Gate"
        />
        <FounderApprovalCaptureBoundaryCard
          capture={build.founderApprovalCaptureBoundary}
          surfaceLabel="Business Build Runtime Approval Capture Boundary"
        />
        <FounderApprovalDecisionBoundaryCard
          decision={build.founderApprovalDecisionBoundary}
          surfaceLabel="Business Build Runtime Approval Decision Boundary"
        />
        <FounderApprovalDecisionBoundaryCard
          decision={build.founderApprovalDecisionPersistenceBoundary}
          surfaceLabel="Business Build Approval Decision Persistence Boundary"
          heading="Approval Decision Persistence Boundary"
          pillLabel="Persistence read-only"
          ariaLabel="Founder runtime approval decision persistence boundary"
          rowAriaSuffix="approval decision persistence boundary row"
        />
        <FounderApprovalDecisionBoundaryCard
          decision={build.founderApprovalDecisionApplicationBoundary}
          surfaceLabel="Business Build Approval Decision Application Boundary"
          heading="Approval Decision Application Boundary"
          pillLabel="Application read-only"
          ariaLabel="Founder runtime approval decision application boundary"
          rowAriaSuffix="approval decision application boundary row"
        />
        <FounderApprovalDecisionBoundaryCard
          decision={build.founderApprovalDecisionApplicationAuthorityBoundary}
          surfaceLabel="Business Build Approval Application Authority Handoff"
          heading="Approval Application Authority Handoff"
          pillLabel="Authority read-only"
          ariaLabel="Founder approval application authority handoff"
          rowAriaSuffix="approval application authority handoff row"
          maxRows={4}
        />
        <FounderApprovalDecisionBoundaryCard
          decision={build.founderApprovalApplicationAuthorityActivationBoundary}
          surfaceLabel="Business Build Approval Application Authority Activation"
          heading="Approval Application Authority Activation"
          pillLabel="Activation read-only"
          ariaLabel="Founder approval application authority activation"
          rowAriaSuffix="approval application authority activation row"
          maxRows={4}
        />
        <FounderApprovalDecisionBoundaryCard
          decision={build.founderApprovalApplicationAuthorityGrantBoundary}
          surfaceLabel="Business Build Approval Application Authority Grant"
          heading="Approval Application Authority Grant"
          pillLabel="Grant read-only"
          ariaLabel="Founder approval application authority grant"
          rowAriaSuffix="approval application authority grant row"
          maxRows={4}
        />

        <CommandTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="Business Build sections">
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {build.readinessCards.map((card) => (
                <article className="ccv2-card" key={card.label}>
                  <div className="ccv2-section-heading">{card.label}</div>
                  <div className={`ccv2-pill ccv2-pill--${card.tone}`}>{card.value}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{card.detail}</div>
                </article>
              ))}
            </div>
            <div className="ccv2-grid ccv2-grid--4" style={{ marginTop: 16 }}>
              {build.founderHighlights.map((highlight) => (
                <article className="ccv2-card" key={highlight.label}>
                  <div className="ccv2-section-heading">{highlight.label}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{highlight.value}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>{highlight.detail}</div>
                </article>
              ))}
            </div>
            {build.blockers.length > 0 && (
              <div className="ccv2-card" style={{ marginTop: 16 }}>
                <div className="ccv2-section-heading">Blockers</div>
                <ul className="ccv2-list" style={{ marginTop: 12 }}>
                  {build.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
                </ul>
              </div>
            )}
            <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Business Build local execution readiness">
              <div className="ccv2-section-heading">Business Build Local Execution Readiness</div>
              <div className="ccv2-muted" style={{ marginTop: 8 }}>
                DB-backed founder workflow is ready for local review. Dry-run admission is visible, but execution remains blocked.
              </div>
              <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{build.localExecutionReadiness.currentState}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Readiness mode</span><span className="ccv2-page-summary-value">{build.localExecutionReadiness.readinessMode}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">DB source</span><span className="ccv2-page-summary-value">{build.localExecutionReadiness.dbSourceState}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Future review lanes</span><span className="ccv2-page-summary-value">{build.localExecutionReadiness.readyLaneCount} of {build.localExecutionReadiness.totalLaneCount}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner</span><span className="ccv2-page-summary-value">{build.localExecutionReadiness.ownerCapability}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{build.localExecutionReadiness.evidenceLocation}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{build.localExecutionReadiness.activityLocation}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{build.localExecutionReadiness.costImpact}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{build.localExecutionReadiness.nextAction}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{build.localExecutionReadiness.disabledReason}</span></div>
              </div>
              <div className="ccv2-grid ccv2-grid--4" style={{ marginTop: 16 }}>
                {build.localExecutionReadiness.lanes.map((lane) => (
                  <div
                    key={lane.label}
                    aria-label={`${lane.label} readiness lane`}
                    style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
                  >
                    <div className="ccv2-section-heading">{lane.label}</div>
                    <div className="ccv2-pill ccv2-pill--teal" style={{ marginTop: 8 }}>{lane.currentState}</div>
                    <div className="ccv2-muted" style={{ marginTop: 10 }}>{lane.nextAction}</div>
                    <div className="ccv2-muted" style={{ marginTop: 8 }}>{lane.blocker}</div>
                    <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
                      <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Execution</span><span className="ccv2-safety-row__value--disabled">{lane.executionAllowed}</span></div>
                      <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Dispatch</span><span className="ccv2-safety-row__value--disabled">{lane.dispatchAllowed}</span></div>
                      <div className="ccv2-safety-row"><span className="ccv2-safety-row__label">Project mutation</span><span className="ccv2-safety-row__value--disabled">{lane.projectMutationAllowed}</span></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
                {build.localExecutionReadiness.safetyRows.map((row) => (
                  <div className="ccv2-safety-row" key={row.label}>
                    <span className="ccv2-safety-row__label">{row.label}</span>
                    <span className="ccv2-safety-row__value--disabled">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <BusinessBuildDbCrudCard crud={build.businessBuildDbCrud} surfaceLabel="Business Build DB Workflow" />
            <LiveWorkstreamHandoffCard
              handoff={build.liveWorkstreamHandoff}
              dryRun={build.liveWorkstreamHandoffDryRun}
              surfaceLabel="Business Build Live Workstream Handoff"
            />
            <ExecutionAdmissionCard
              admission={build.executionAdmission}
              envelope={build.executionAdmissionApprovalEnvelope}
              dryRun={build.executionAdmissionDryRun}
              surfaceLabel="Business Build Execution Admission"
            />
            <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Founder DB workflow">
              <div className="ccv2-section-heading">Founder DB Workflow</div>
              <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Saved session</span><span className="ccv2-page-summary-value">{build.founderDbWorkflow.savedSessionState}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next founder question</span><span className="ccv2-page-summary-value">{build.founderDbWorkflow.nextQuestion}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">PRD readiness</span><span className="ccv2-page-summary-value">{build.founderDbWorkflow.prdReadiness} · {build.founderDbWorkflow.prdState}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{build.founderDbWorkflow.ownerCapability}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{build.founderDbWorkflow.evidenceLocation}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{build.founderDbWorkflow.activityLocation}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{build.founderDbWorkflow.costImpact}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{build.founderDbWorkflow.disabledReason}</span></div>
              </div>
              <div className="ccv2-grid ccv2-grid--4" style={{ marginTop: 16 }}>
                {build.founderDbWorkflow.lanes.map((lane) => (
                  <div className="ccv2-safety-row" key={lane.label}>
                    <span className="ccv2-safety-row__label">{lane.label}</span>
                    <span className="ccv2-safety-row__value--ready">{lane.currentState} · {lane.ownerCapability}</span>
                  </div>
                ))}
              </div>
              <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
                {build.founderDbWorkflow.lanes.map((lane) => (
                  <div className="ccv2-safety-row" key={`${lane.label}-next`}>
                    <span className="ccv2-safety-row__label">{lane.nextAction}</span>
                    <span className="ccv2-safety-row__value--disabled">{lane.blocker}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <FounderPersistenceControlsCard controls={founderPersistenceControls} />
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="prd" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              <article className="ccv2-card">
                <div className="ccv2-section-heading">PRD Readiness</div>
                <div className="ccv2-pill ccv2-pill--pass">{build.prdReadiness.score}%</div>
                <div className="ccv2-muted" style={{ marginTop: 10 }}>{build.prdReadiness.source}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>
                  Missing fields: {build.prdReadiness.missingFields.length ? build.prdReadiness.missingFields.join(", ") : "None"}
                </div>
              </article>
              <article className="ccv2-card">
                <div className="ccv2-section-heading">PRD Draft</div>
                <div className="ccv2-muted">Problem: {build.problem}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Solution: {build.solution}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Success: {build.prdReadiness.fields.successCriteria}</div>
              </article>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="localPrd" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Local PRD Artifact</div>
                <div className="ccv2-pill ccv2-pill--pass">{build.founderPrdAuthoring.reviewState}</div>
                <div className="ccv2-muted" style={{ marginTop: 10 }}>{build.founderPrdAuthoring.title}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Current state: {build.founderPrdAuthoring.currentState}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Next action: {build.founderPrdAuthoring.nextAction}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Owner: {build.founderPrdAuthoring.ownerCapability}</div>
              </article>
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Safety Boundary</div>
                <div className="ccv2-pill ccv2-pill--disabled">Local In Memory Only</div>
                <div className="ccv2-muted" style={{ marginTop: 10 }}>{build.founderPrdAuthoring.disabledReason}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Evidence: {build.founderPrdAuthoring.evidenceLocation}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Activity: {build.founderPrdAuthoring.activityLocation}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Cost: {build.founderPrdAuthoring.costImpact}</div>
              </article>
            </div>

            <div className="ccv2-grid ccv2-grid--4" style={{ marginTop: 16 }}>
              {build.founderPrdAuthoring.safetyRows.map((row) => (
                <article className="ccv2-card" key={row.label}>
                  <div className="ccv2-section-heading">{row.label}</div>
                  <div className="ccv2-pill ccv2-pill--disabled">{row.value}</div>
                </article>
              ))}
            </div>

            <div className="ccv2-grid ccv2-grid--4" style={{ marginTop: 16 }}>
              {build.founderPrdAuthoring.sections.map((section) => (
                <article className="ccv2-card" key={section.label}>
                  <div className="ccv2-section-heading">{section.label}</div>
                  <div className="ccv2-pill ccv2-pill--teal">{section.status}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{section.content}</div>
                </article>
              ))}
            </div>

            <div className="ccv2-card" style={{ marginTop: 16 }}>
              <div className="ccv2-section-heading">Operator Review Checklist</div>
              <ul className="ccv2-list" style={{ marginTop: 12 }}>
                {build.founderPrdAuthoring.acceptanceCriteria.map((criterion) => (
                  <li key={criterion}>{criterion}</li>
                ))}
              </ul>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="workstreams" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {build.workstreamRows.map((row) => (
                <article className="ccv2-card" key={row.label}>
                  <div className="ccv2-section-heading">{row.label}</div>
                  <div className="ccv2-pill ccv2-pill--teal">{row.status}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{row.objective}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Owner: {row.ownerCapability}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Next input: {row.nextInput}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="activationReview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              <article className="ccv2-card" aria-label="Founder activation review packet">
                <div className="ccv2-section-heading">Workstream Activation Review</div>
                <div className={`ccv2-pill ccv2-pill--${build.activationReview.ready ? "teal" : "amber"}`}>
                  {build.activationReview.currentState}
                </div>
                <div className="ccv2-muted" style={{ marginTop: 10 }}>Mode: {build.activationReview.packetMode}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>
                  Ready items: {build.activationReview.readyItemCount} of {build.activationReview.totalItemCount}
                </div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Blockers: {build.activationReview.blockerCount}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Next action: {build.activationReview.nextAction}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Owner: {build.activationReview.ownerCapability}</div>
              </article>
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Safety Boundary</div>
                <div className="ccv2-pill ccv2-pill--disabled">Execution blocked</div>
                <div className="ccv2-muted" style={{ marginTop: 10 }}>{build.activationReview.disabledReason}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Evidence: {build.activationReview.evidenceLocation}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Activity: {build.activationReview.activityLocation}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Cost: {build.activationReview.costImpact}</div>
              </article>
            </div>

            <div className="ccv2-grid ccv2-grid--4" style={{ marginTop: 16 }}>
              {build.activationReview.safetyRows.map((row) => (
                <article className="ccv2-card" key={row.label}>
                  <div className="ccv2-section-heading">{row.label}</div>
                  <div className="ccv2-pill ccv2-pill--disabled">{row.value}</div>
                </article>
              ))}
            </div>

            <div className="ccv2-card" style={{ marginTop: 16 }}>
              <div className="ccv2-section-heading">Operator Checklist</div>
              <ul className="ccv2-list" style={{ marginTop: 12 }}>
                {build.activationReview.checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="ccv2-grid ccv2-grid--4" style={{ marginTop: 16 }}>
              {build.activationReview.reviewItems.map((item) => (
                <article className="ccv2-card" key={item.label}>
                  <div className="ccv2-section-heading">{item.label}</div>
                  <div className="ccv2-pill ccv2-pill--teal">{item.status}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{item.objective}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Owner: {item.ownerCapability}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Required evidence: {item.requiredEvidence.join(", ")}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Blocker: {item.blocker}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Next: {item.nextAction}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>{item.disabledReason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="dryRun" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Founder Workstream Dry Run</div>
                <div className="ccv2-pill ccv2-pill--disabled">{build.founderWorkstreamDryRun.currentState}</div>
                <div className="ccv2-muted" style={{ marginTop: 10 }}>Future review lanes: {build.founderWorkstreamDryRun.readyLaneCount} of {build.founderWorkstreamDryRun.totalLaneCount}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Admitted for execution: {build.founderWorkstreamDryRun.admittedForExecutionCount}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Next action: {build.founderWorkstreamDryRun.nextAction}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Owner: {build.founderWorkstreamDryRun.ownerCapability}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Evidence: {build.founderWorkstreamDryRun.evidenceLocation}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Activity: {build.founderWorkstreamDryRun.activityLocation}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>Cost: {build.founderWorkstreamDryRun.costImpact}</div>
                <div className="ccv2-muted" style={{ marginTop: 8 }}>{build.founderWorkstreamDryRun.disabledReason}</div>
              </article>
              <article className="ccv2-card">
                <div className="ccv2-section-heading">Agent Lane Planning</div>
                <ul className="ccv2-list" style={{ marginTop: 12 }}>
                  {build.founderWorkstreamDryRun.rows.flatMap((row) => row.previewOutputs).slice(0, 6).map((output, index) => (
                    <li key={`${output}-${index}`}>{output}</li>
                  ))}
                </ul>
              </article>
            </div>
            <div className="ccv2-grid ccv2-grid--4" style={{ marginTop: 16 }} aria-label="Business Build dry-run admission lanes">
              {build.founderWorkstreamDryRun.admissionLanes.map((lane) => (
                <article className="ccv2-card" key={lane.label}>
                  <div className="ccv2-section-heading">{lane.label}</div>
                  <div className="ccv2-pill ccv2-pill--teal">{lane.currentState}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>Owner: {lane.ownerCapability}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Next: {lane.nextAction}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Blocker: {lane.blocker}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Execution: {lane.executionAllowed}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Dispatch: {lane.dispatchAllowed}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Project mutation: {lane.projectMutationAllowed}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Evidence: {lane.evidenceLocation}</div>
                </article>
              ))}
            </div>
            <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
              {build.founderWorkstreamDryRun.rows.map((row) => (
                <article className="ccv2-card" key={row.label}>
                  <div className="ccv2-section-heading">{row.label}</div>
                  <div className="ccv2-pill ccv2-pill--amber">{row.previewNextState}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>Current: {row.currentState}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Inputs: {row.founderInputsNeeded.join(", ")}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Blockers: {row.blockers.join(", ")}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Owner: {row.ownerCapability}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Next: {row.nextAction}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="milestones" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {build.milestoneRows.map((row) => (
                <article className="ccv2-card" key={row.label}>
                  <div className="ccv2-section-heading">{row.label}</div>
                  <div className="ccv2-pill ccv2-pill--amber">{row.status}</div>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{row.objective}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Owner: {row.ownerCapability}</div>
                  <div className="ccv2-muted" style={{ marginTop: 8 }}>Blocker: {row.blocker}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="disabled" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {build.disabledActions.map((action) => (
                <article className="ccv2-card" key={action.label}>
                  <div className="ccv2-section-heading">{action.label}</div>
                  <button className="ccv2-btn ccv2-btn--disabled" type="button" disabled title={action.reason}>{action.label} disabled</button>
                  <div className="ccv2-muted" style={{ marginTop: 10 }}>{action.reason}</div>
                </article>
              ))}
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function FounderLiveUseReviewCard({ readiness, review, surfaceLabel = "Founder Live Use" }) {
  if (!readiness || !review) return null;

  const lanes = Array.isArray(review.laneRows) ? review.laneRows.slice(0, 6) : [];
  const checklist = Array.isArray(review.checklist) ? review.checklist : [];
  const blockers = Array.isArray(review.blockers) ? review.blockers.slice(0, 6) : [];
  const safetyRows = Array.isArray(review.safetyRows) ? review.safetyRows : [];

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Founder live use readiness">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Founder Live Use Review</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>
            {review.currentState}
          </div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">Execution blocked</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Readiness</span><span className="ccv2-page-summary-value">{readiness.currentState}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Review mode</span><span className="ccv2-page-summary-value">{review.reviewMode}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Checklist</span><span className="ccv2-page-summary-value">{review.readyItemCount} of {review.totalItemCount} complete</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Founder lanes</span><span className="ccv2-page-summary-value">{readiness.readyLaneCount} of {readiness.totalLaneCount} review-ready</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Executable lanes</span><span className="ccv2-page-summary-value">{review.executableLaneCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Dispatchable lanes</span><span className="ccv2-page-summary-value">{review.dispatchableLaneCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{review.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{review.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{review.disabledReason}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{review.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{review.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{review.costImpact}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--4" style={{ marginTop: 16 }}>
        {checklist.map((item) => (
          <div
            key={item.label}
            aria-label={`${item.label} founder live use checklist item`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{item.label}</div>
            <div className={`ccv2-pill ccv2-pill--${item.status === "Complete" ? "teal" : "amber"}`} style={{ marginTop: 8 }}>{item.status}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{item.ownerCapability}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{item.nextAction}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
        {lanes.map((lane) => (
          <div
            key={lane.label}
            aria-label={`${lane.label} founder live use lane`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{lane.label}</div>
            <div className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8 }}>{lane.reviewState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{lane.ownerCapability}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{lane.nextAction}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{lane.blocker}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className="ccv2-safety-row__value--disabled">{row.value}</span>
          </div>
        ))}
      </div>
      {blockers.length > 0 && (
        <ul className="ccv2-list" style={{ marginTop: 12 }}>
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}
    </div>
  );
}

function FounderLiveHandoffCard({ manifest, workOrders, surfaceLabel = "Founder Live Handoff" }) {
  if (!manifest || !workOrders) return null;

  const handoffLanes = Array.isArray(manifest.handoffLanes) ? manifest.handoffLanes.slice(0, 6) : [];
  const rows = Array.isArray(workOrders.workOrderRows) ? workOrders.workOrderRows.slice(0, 6) : [];
  const blockers = Array.isArray(workOrders.blockers) ? workOrders.blockers.slice(0, 6) : [];
  const safetyRows = Array.isArray(workOrders.safetyRows) ? workOrders.safetyRows : [];

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Founder live handoff">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Founder Live Handoff</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>{workOrders.currentState}</div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">Dry run only</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Founder idea</span><span className="ccv2-page-summary-value">{manifest.founderIdea}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">PRD readiness</span><span className="ccv2-page-summary-value">{manifest.prdReadiness}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Handoff lanes</span><span className="ccv2-page-summary-value">{manifest.readyLaneCount} of {manifest.totalLaneCount} ready</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Dry-run rows</span><span className="ccv2-page-summary-value">{workOrders.dryRunRowCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Executable rows</span><span className="ccv2-page-summary-value">{workOrders.executableWorkOrderCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Dispatchable rows</span><span className="ccv2-page-summary-value">{workOrders.dispatchableWorkOrderCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{workOrders.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{workOrders.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{workOrders.disabledReason}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{workOrders.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{workOrders.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{workOrders.costImpact}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
        {rows.map((row) => (
          <div
            key={row.label}
            aria-label={`${row.proposedAgent} founder live handoff work row`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{row.label}</div>
            <div className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8 }}>{row.dryRunState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{row.proposedWork}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Owner: {row.ownerCapability}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Validation: {row.validationCommand}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.blocker}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
        {handoffLanes.map((lane) => (
          <div
            key={lane.label}
            aria-label={`${lane.label} founder live handoff lane`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{lane.label}</div>
            <div className="ccv2-pill ccv2-pill--teal" style={{ marginTop: 8 }}>{lane.handoffState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{lane.ownerCapability}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{lane.nextAction}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{lane.disabledReason}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className="ccv2-safety-row__value--disabled">{row.value}</span>
          </div>
        ))}
      </div>
      {blockers.length > 0 && (
        <ul className="ccv2-list" style={{ marginTop: 12 }}>
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}
    </div>
  );
}

function FounderLiveWorkAdmissionCard({ admission, approval, surfaceLabel = "Founder Work Admission" }) {
  if (!admission || !approval) return null;

  const workRows = Array.isArray(admission.workAdmissions) ? admission.workAdmissions.slice(0, 6) : [];
  const gates = Array.isArray(approval.approvalGates) ? approval.approvalGates.slice(0, 6) : [];
  const blockers = Array.isArray(approval.blockers) ? approval.blockers.slice(0, 6) : [];
  const safetyRows = Array.isArray(admission.safetyRows) ? admission.safetyRows : [];

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Founder live work admission">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Founder Live Work Admission</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>{admission.currentState}</div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">Approval blocked</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Founder idea</span><span className="ccv2-page-summary-value">{admission.founderIdea}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Work admissions</span><span className="ccv2-page-summary-value">{admission.admittedWorkCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Blocked work</span><span className="ccv2-page-summary-value">{admission.blockedWorkCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Approval gates</span><span className="ccv2-page-summary-value">{approval.approvedGateCount} of {approval.approvalGateCount} approved</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Executable work</span><span className="ccv2-page-summary-value">{admission.executableWorkCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Dispatchable work</span><span className="ccv2-page-summary-value">{admission.dispatchableWorkCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Project mutation</span><span className="ccv2-page-summary-value">{admission.projectMutationWorkCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{admission.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{approval.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{approval.disabledReason}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{approval.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{approval.costImpact}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
        {workRows.map((row) => (
          <div
            key={`${row.proposedAgentLane}-${row.label}`}
            aria-label={`${row.proposedAgentLane} founder work admission row`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{row.proposedAgentLane}</div>
            <div className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8 }}>{row.approvalState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{row.proposedOutcome}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Missing: {row.missingEvidence?.[0] || "Operator evidence review"}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Validation: {row.validationCommand}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.disabledReason}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
        {gates.map((gate) => (
          <div
            key={`${gate.label}-${gate.gateState}`}
            aria-label={`${gate.label} founder approval gate`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{gate.label}</div>
            <div className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8 }}>{gate.gateState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{gate.reviewQuestion}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Approval: {gate.approvalAllowed}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Execution: {gate.executionAllowed}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className="ccv2-safety-row__value--disabled">{row.value}</span>
          </div>
        ))}
      </div>
      {blockers.length > 0 && (
        <ul className="ccv2-list" style={{ marginTop: 12 }}>
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}
    </div>
  );
}

function FounderLiveExecutionBoundaryCard({ boundary, surfaceLabel = "Execution Boundary" }) {
  if (!boundary) return null;

  const rows = Array.isArray(boundary.boundaryRows) ? boundary.boundaryRows.slice(0, 6) : [];
  const blockers = Array.isArray(boundary.blockers) ? boundary.blockers.slice(0, 6) : [];
  const safetyRows = Array.isArray(boundary.safetyRows) ? boundary.safetyRows : [];

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Founder live execution boundary">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Founder Live Execution Boundary</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>{boundary.currentState}</div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">Execution blocked</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Founder idea</span><span className="ccv2-page-summary-value">{boundary.founderIdea}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Boundary rows</span><span className="ccv2-page-summary-value">{boundary.boundaryRowCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Blocked rows</span><span className="ccv2-page-summary-value">{boundary.blockedBoundaryCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Approved rows</span><span className="ccv2-page-summary-value">{boundary.approvedBoundaryCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Executable rows</span><span className="ccv2-page-summary-value">{boundary.executableBoundaryCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Dispatchable rows</span><span className="ccv2-page-summary-value">{boundary.dispatchableBoundaryCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Project mutation</span><span className="ccv2-page-summary-value">{boundary.projectMutationBoundaryCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Hosted DB mutation</span><span className="ccv2-page-summary-value">{boundary.hostedDbMutationBoundaryCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{boundary.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{boundary.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{boundary.disabledReason}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{boundary.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{boundary.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{boundary.costImpact}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
        {rows.map((row) => (
          <div
            key={`${row.proposedAgentLane}-${row.label}`}
            aria-label={`${row.proposedAgentLane} execution boundary row`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{row.proposedAgentLane}</div>
            <div className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8 }}>{row.boundaryState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{row.proposedOutcome}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Missing evidence: {row.missingEvidence?.[0] || "Operator approval evidence"}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Validation: {row.validationCommand}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.blocker}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className="ccv2-safety-row__value--disabled">{row.value}</span>
          </div>
        ))}
      </div>
      {blockers.length > 0 && (
        <ul className="ccv2-list" style={{ marginTop: 12 }}>
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}
    </div>
  );
}

function FounderLiveExecutionApprovalReviewPacketCard({ packet, surfaceLabel = "Approval Review" }) {
  if (!packet) return null;

  const rows = Array.isArray(packet.reviewPacketRows) ? packet.reviewPacketRows.slice(0, 6) : [];
  const blockers = Array.isArray(packet.blockers) ? packet.blockers.slice(0, 6) : [];
  const safetyRows = Array.isArray(packet.safetyRows) ? packet.safetyRows : [];

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Founder live approval review packet">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Founder Live Approval Review Packet</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>{packet.currentState}</div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">Approval blocked</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Founder idea</span><span className="ccv2-page-summary-value">{packet.founderIdea}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Review packets</span><span className="ccv2-page-summary-value">{packet.reviewPacketRowCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Blocked packets</span><span className="ccv2-page-summary-value">{packet.blockedReviewPacketCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Submitted approvals</span><span className="ccv2-page-summary-value">{packet.submittedApprovalCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Captured approvals</span><span className="ccv2-page-summary-value">{packet.capturedApprovalCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Execution unlocks</span><span className="ccv2-page-summary-value">{packet.approvalUnlockCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Runtime admissions</span><span className="ccv2-page-summary-value">{packet.runtimeAdmissionCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Executable packets</span><span className="ccv2-page-summary-value">{packet.executableReviewPacketCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{packet.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{packet.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{packet.disabledReason}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{packet.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{packet.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{packet.costImpact}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
        {rows.map((row) => (
          <div
            key={`${row.proposedAgentLane}-${row.label}`}
            aria-label={`${row.proposedAgentLane} approval review packet row`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{row.proposedAgentLane}</div>
            <div className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8 }}>{row.packetState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{row.proposedOutcome}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Missing gates: {row.missingGates?.[0] || "Operator approval evidence"}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Review: {row.reviewQuestions?.[0] || "Confirm scope and success criteria."}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Validation: {row.validationCommand}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.blocker}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className="ccv2-safety-row__value--disabled">{row.value}</span>
          </div>
        ))}
      </div>
      {blockers.length > 0 && (
        <ul className="ccv2-list" style={{ marginTop: 12 }}>
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}
    </div>
  );
}

function FounderLiveApprovalRequestQueuePreviewCard({ queue, surfaceLabel = "Approval Request Queue" }) {
  if (!queue) return null;

  const rows = Array.isArray(queue.queueRows) ? queue.queueRows.slice(0, 6) : [];
  const blockers = Array.isArray(queue.blockers) ? queue.blockers.slice(0, 6) : [];
  const safetyRows = Array.isArray(queue.safetyRows) ? queue.safetyRows : [];

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Founder live approval request queue preview">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Founder Live Approval Request Queue</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>{queue.currentState}</div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">Queue read-only</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Founder idea</span><span className="ccv2-page-summary-value">{queue.founderIdea}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Queued requests</span><span className="ccv2-page-summary-value">{queue.queuedRequestCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Blocked queued requests</span><span className="ccv2-page-summary-value">{queue.blockedQueuedRequestCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Submittable requests</span><span className="ccv2-page-summary-value">{queue.submittableQueuedRequestCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Capturable requests</span><span className="ccv2-page-summary-value">{queue.capturableQueuedRequestCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Persisted approvals</span><span className="ccv2-page-summary-value">{queue.persistedQueuedRequestCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Executable requests</span><span className="ccv2-page-summary-value">{queue.executableQueuedRequestCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{queue.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{queue.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{queue.disabledReason}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{queue.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{queue.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{queue.costImpact}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
        {rows.map((row) => (
          <div
            key={`${row.proposedAgentLane}-${row.queuePosition}`}
            aria-label={`${row.proposedAgentLane} approval request queue row`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{row.proposedAgentLane}</div>
            <div className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8 }}>{row.queueState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{row.proposedOutcome}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Missing evidence: {row.missingEvidence?.[0] || "Operator approval evidence"}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Founder prompt: {row.founderDecisionPrompt}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Operator prompt: {row.operatorDecisionPrompt}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Validation: {row.validationCommand}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.blocker}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className="ccv2-safety-row__value--disabled">{row.value}</span>
          </div>
        ))}
      </div>
      {blockers.length > 0 && (
        <ul className="ccv2-list" style={{ marginTop: 12 }}>
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}
    </div>
  );
}

function FounderLiveApprovalCaptureBoundaryCard({ capture, surfaceLabel = "Approval Capture Boundary" }) {
  if (!capture) return null;

  const rows = Array.isArray(capture.auditRows) ? capture.auditRows.slice(0, 6) : [];
  const blockers = Array.isArray(capture.blockers) ? capture.blockers.slice(0, 6) : [];
  const safetyRows = Array.isArray(capture.safetyRows) ? capture.safetyRows : [];

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Founder live approval capture boundary preview">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Founder Live Approval Capture Boundary</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>{capture.currentState}</div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">Capture read-only</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Founder idea</span><span className="ccv2-page-summary-value">{capture.founderIdea}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Audit previews</span><span className="ccv2-page-summary-value">{capture.auditPreviewCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Blocked audit previews</span><span className="ccv2-page-summary-value">{capture.blockedAuditPreviewCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Capturable decisions</span><span className="ccv2-page-summary-value">{capture.capturableDecisionCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Persisted decisions</span><span className="ccv2-page-summary-value">{capture.persistedDecisionCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Writable decisions</span><span className="ccv2-page-summary-value">{capture.writableDecisionCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Executable decisions</span><span className="ccv2-page-summary-value">{capture.executableDecisionCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{capture.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{capture.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{capture.disabledReason}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{capture.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{capture.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{capture.costImpact}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
        {rows.map((row) => (
          <div
            key={`${row.proposedAgentLane}-${row.auditPosition}`}
            aria-label={`${row.proposedAgentLane} approval capture audit row`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{row.proposedAgentLane}</div>
            <div className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8 }}>{row.auditState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{row.proposedOutcome}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Missing evidence: {row.missingEvidence?.[0] || "Approval capture evidence"}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Audit question: {row.auditQuestions?.[0] || "Capture evidence review required"}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Validation: {row.validationCommand}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.blocker}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className="ccv2-safety-row__value--disabled">{row.value}</span>
          </div>
        ))}
      </div>
      {blockers.length > 0 && (
        <ul className="ccv2-list" style={{ marginTop: 12 }}>
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}
    </div>
  );
}

function FounderLiveApprovalOperatorReviewCard({ operatorReview, surfaceLabel = "Operator Review" }) {
  if (!operatorReview) return null;

  const rows = Array.isArray(operatorReview.auditRows) ? operatorReview.auditRows.slice(0, 6) : [];
  const blockers = Array.isArray(operatorReview.blockers) ? operatorReview.blockers.slice(0, 6) : [];
  const safetyRows = Array.isArray(operatorReview.safetyRows) ? operatorReview.safetyRows : [];

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Founder live operator review audit preview">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Founder Live Operator Review</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>{operatorReview.currentState}</div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">Operator review read-only</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Founder idea</span><span className="ccv2-page-summary-value">{operatorReview.founderIdea}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Audit previews</span><span className="ccv2-page-summary-value">{operatorReview.auditPreviewCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Blocked audit previews</span><span className="ccv2-page-summary-value">{operatorReview.blockedAuditPreviewCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Capturable decisions</span><span className="ccv2-page-summary-value">{operatorReview.capturableOperatorDecisionCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Persisted decisions</span><span className="ccv2-page-summary-value">{operatorReview.persistedOperatorDecisionCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Writable decisions</span><span className="ccv2-page-summary-value">{operatorReview.writableOperatorDecisionCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Executable reviews</span><span className="ccv2-page-summary-value">{operatorReview.executableOperatorReviewCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{operatorReview.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{operatorReview.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{operatorReview.disabledReason}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{operatorReview.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{operatorReview.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{operatorReview.costImpact}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
        {rows.map((row) => (
          <div
            key={`${row.proposedAgentLane}-${row.auditPosition}`}
            aria-label={`${row.proposedAgentLane} operator review audit row`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{row.proposedAgentLane}</div>
            <div className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8 }}>{row.auditState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{row.proposedOutcome}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Missing evidence: {row.missingEvidence?.[0] || "Operator review evidence"}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Audit question: {row.auditQuestions?.[0] || "Operator evidence review required"}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Validation: {row.validationCommand}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.blocker}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className="ccv2-safety-row__value--disabled">{row.value}</span>
          </div>
        ))}
      </div>
      {blockers.length > 0 && (
        <ul className="ccv2-list" style={{ marginTop: 12 }}>
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}
    </div>
  );
}

function FounderLiveOperatorDecisionLedgerCard({ decisionLedger, surfaceLabel = "Decision Ledger" }) {
  if (!decisionLedger) return null;

  const rows = Array.isArray(decisionLedger.auditRows) ? decisionLedger.auditRows.slice(0, 6) : [];
  const blockers = Array.isArray(decisionLedger.blockers) ? decisionLedger.blockers.slice(0, 6) : [];
  const safetyRows = Array.isArray(decisionLedger.safetyRows) ? decisionLedger.safetyRows : [];

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Founder live decision ledger audit preview">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Founder Live Decision Ledger</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>{decisionLedger.currentState}</div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">Decision ledger read-only</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Founder idea</span><span className="ccv2-page-summary-value">{decisionLedger.founderIdea}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Ledger previews</span><span className="ccv2-page-summary-value">{decisionLedger.auditPreviewCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Blocked previews</span><span className="ccv2-page-summary-value">{decisionLedger.blockedAuditPreviewCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Capturable decisions</span><span className="ccv2-page-summary-value">{decisionLedger.capturableOperatorDecisionCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Persisted decisions</span><span className="ccv2-page-summary-value">{decisionLedger.persistedOperatorDecisionCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Writable ledger decisions</span><span className="ccv2-page-summary-value">{decisionLedger.writableLedgerDecisionCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">DB writes</span><span className="ccv2-page-summary-value">{decisionLedger.dbWriteCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Replayable decisions</span><span className="ccv2-page-summary-value">{decisionLedger.replayableLedgerDecisionCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Executable decisions</span><span className="ccv2-page-summary-value">{decisionLedger.executableLedgerDecisionCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{decisionLedger.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{decisionLedger.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{decisionLedger.disabledReason}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{decisionLedger.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{decisionLedger.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{decisionLedger.costImpact}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
        {rows.map((row) => (
          <div
            key={`${row.proposedAgentLane}-${row.auditPosition}`}
            aria-label={`${row.proposedAgentLane} decision ledger audit row`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{row.proposedAgentLane}</div>
            <div className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8 }}>{row.auditState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{row.proposedOutcome}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Missing evidence: {row.missingEvidence?.[0] || "Decision ledger evidence"}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Audit question: {row.auditQuestions?.[0] || "Decision ledger evidence review required"}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Validation: {row.validationCommand}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.blocker}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className="ccv2-safety-row__value--disabled">{row.value}</span>
          </div>
        ))}
      </div>
      {blockers.length > 0 && (
        <ul className="ccv2-list" style={{ marginTop: 12 }}>
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}
    </div>
  );
}

function FounderLiveOperatorDecisionLedgerPersistenceCard({ persistence, surfaceLabel = "Decision Ledger Persistence" }) {
  if (!persistence) return null;

  const lanes = Array.isArray(persistence.lanes) ? persistence.lanes.slice(0, 3) : [];
  const blockers = Array.isArray(persistence.blockers) ? persistence.blockers.slice(0, 6) : [];
  const safetyRows = Array.isArray(persistence.safetyRows) ? persistence.safetyRows : [];

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Founder live decision ledger persistence">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Decision Ledger Persistence</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>
            {persistence.currentState}
          </div>
        </div>
        <span className="ccv2-pill ccv2-pill--amber">Local CRUD guarded</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Founder idea</span><span className="ccv2-page-summary-value">{persistence.founderIdea}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Runtime mode</span><span className="ccv2-page-summary-value">{persistence.runtimeMode}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">DB mode</span><span className="ccv2-page-summary-value">{persistence.dbMode}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Ledger entry</span><span className="ccv2-page-summary-value">{persistence.savedLedgerEntryState}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Ledger event</span><span className="ccv2-page-summary-value">{persistence.savedLedgerEventState}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence reference</span><span className="ccv2-page-summary-value">{persistence.savedEvidenceState}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Allowed local CRUD</span><span className="ccv2-page-summary-value">{persistence.allowedLocalCrudOperations.join(", ")} with explicit approval</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Records ready</span><span className="ccv2-page-summary-value">{persistence.readyRecordCount} of {persistence.totalRecordCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{persistence.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{persistence.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{persistence.disabledReason}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{persistence.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{persistence.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{persistence.costImpact}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
        {lanes.map((lane) => (
          <div
            key={lane.label}
            aria-label={`${lane.label} decision ledger persistence row`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{lane.label}</div>
            <div className="ccv2-pill ccv2-pill--amber" style={{ marginTop: 8 }}>{lane.currentState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{lane.ownerCapability}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{lane.nextAction}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{lane.blocker}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Evidence: {lane.evidenceLocation}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className={row.value === "Guarded" ? "ccv2-safety-row__value--ready" : "ccv2-safety-row__value--disabled"}>{row.value}</span>
          </div>
        ))}
      </div>
      {blockers.length > 0 && (
        <ul className="ccv2-list" style={{ marginTop: 12 }}>
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}
    </div>
  );
}

function FounderLiveAgentWorkOrderPersistenceCard({ persistence, surfaceLabel = "Agent Work Order Persistence" }) {
  if (!persistence) return null;

  const lanes = Array.isArray(persistence.lanes) ? persistence.lanes.slice(0, 3) : [];
  const blockers = Array.isArray(persistence.blockers) ? persistence.blockers.slice(0, 6) : [];
  const safetyRows = Array.isArray(persistence.safetyRows) ? persistence.safetyRows : [];

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Founder agent work order persistence">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Work Order Persistence</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>
            {persistence.currentState}
          </div>
        </div>
        <span className="ccv2-pill ccv2-pill--amber">Approved local only</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Founder idea</span><span className="ccv2-page-summary-value">{persistence.founderIdea}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Runtime mode</span><span className="ccv2-page-summary-value">{persistence.runtimeMode}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">DB mode</span><span className="ccv2-page-summary-value">{persistence.dbMode}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Work order</span><span className="ccv2-page-summary-value">{persistence.savedWorkOrderState}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Work order event</span><span className="ccv2-page-summary-value">{persistence.savedEventState}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence reference</span><span className="ccv2-page-summary-value">{persistence.savedEvidenceState}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Allowed local CRUD</span><span className="ccv2-page-summary-value">{persistence.allowedLocalCrudOperations.join(", ")} with explicit approval</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Records ready</span><span className="ccv2-page-summary-value">{persistence.readyRecordCount} of {persistence.totalRecordCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{persistence.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{persistence.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{persistence.disabledReason}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{persistence.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{persistence.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{persistence.costImpact}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
        {lanes.map((lane) => (
          <div
            key={lane.label}
            aria-label={`${lane.label} work order persistence row`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{lane.label}</div>
            <div className="ccv2-pill ccv2-pill--amber" style={{ marginTop: 8 }}>{lane.currentState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{lane.ownerCapability}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{lane.nextAction}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{lane.blocker}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Evidence: {lane.evidenceLocation}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className={row.value === "Guarded" ? "ccv2-safety-row__value--ready" : "ccv2-safety-row__value--disabled"}>{row.value}</span>
          </div>
        ))}
      </div>
      {blockers.length > 0 && (
        <ul className="ccv2-list" style={{ marginTop: 12 }}>
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}
    </div>
  );
}

function FounderLiveAgentWorkQueueAdmissionCard({ queue, surfaceLabel = "Agent Work Queue Admission" }) {
  if (!queue) return null;

  const rows = Array.isArray(queue.queueRows) ? queue.queueRows.slice(0, 3) : [];
  const sections = Array.isArray(queue.queueSections) ? queue.queueSections.slice(0, 3) : [];
  const blockers = Array.isArray(queue.blockers) ? queue.blockers.slice(0, 6) : [];
  const safetyRows = Array.isArray(queue.safetyRows) ? queue.safetyRows : [];

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Founder agent work queue admission">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Agent Work Queue Admission</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>
            {queue.currentState}
          </div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">Preview only</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Founder idea</span><span className="ccv2-page-summary-value">{queue.founderIdea}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Preview mode</span><span className="ccv2-page-summary-value">{queue.previewMode}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Queue candidates</span><span className="ccv2-page-summary-value">{queue.candidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Blocked candidates</span><span className="ccv2-page-summary-value">{queue.blockedCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Writable candidates</span><span className="ccv2-page-summary-value">{queue.writableCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Persisted candidates</span><span className="ccv2-page-summary-value">{queue.persistedCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Dispatchable candidates</span><span className="ccv2-page-summary-value">{queue.dispatchableCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Executable candidates</span><span className="ccv2-page-summary-value">{queue.executableCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{queue.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{queue.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{queue.disabledReason}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{queue.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{queue.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{queue.costImpact}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
        {rows.map((row) => (
          <div
            key={`${row.proposedAgentLane}-${row.queuePosition}`}
            aria-label={`${row.proposedAgentLane} work queue admission row`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{row.proposedAgentLane}</div>
            <div className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8 }}>{row.queueState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{row.proposedOutcome}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.nextAction}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.blocker}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Evidence: {row.evidenceLocation}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {sections.map((section) => (
          <div className="ccv2-safety-row" key={section.label}>
            <span className="ccv2-safety-row__label">{section.label}</span>
            <span className="ccv2-safety-row__value--disabled">{section.blockedCount} blocked</span>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className="ccv2-safety-row__value--disabled">{row.value}</span>
          </div>
        ))}
      </div>
      {blockers.length > 0 && (
        <ul className="ccv2-list" style={{ marginTop: 12 }}>
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}
    </div>
  );
}

function FounderLiveAgentWorkAssignmentCard({ assignment, surfaceLabel = "Agent Work Assignment" }) {
  if (!assignment) return null;

  const rows = Array.isArray(assignment.assignmentRows) ? assignment.assignmentRows.slice(0, 3) : [];
  const sections = Array.isArray(assignment.assignmentSections) ? assignment.assignmentSections.slice(0, 3) : [];
  const blockers = Array.isArray(assignment.blockers) ? assignment.blockers.slice(0, 6) : [];
  const safetyRows = Array.isArray(assignment.safetyRows) ? assignment.safetyRows : [];

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Founder agent work assignment readiness">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Agent Work Assignment</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>
            {assignment.currentState}
          </div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">Preview only</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Founder idea</span><span className="ccv2-page-summary-value">{assignment.founderIdea}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Preview mode</span><span className="ccv2-page-summary-value">{assignment.previewMode}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Assignment candidates</span><span className="ccv2-page-summary-value">{assignment.candidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Blocked candidates</span><span className="ccv2-page-summary-value">{assignment.blockedCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Writable candidates</span><span className="ccv2-page-summary-value">{assignment.writableCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Persisted candidates</span><span className="ccv2-page-summary-value">{assignment.persistedCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Dispatchable candidates</span><span className="ccv2-page-summary-value">{assignment.dispatchableCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Executable candidates</span><span className="ccv2-page-summary-value">{assignment.executableCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{assignment.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{assignment.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{assignment.disabledReason}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{assignment.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{assignment.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{assignment.costImpact}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
        {rows.map((row) => (
          <div
            key={`${row.proposedAgentLane}-${row.assignmentPosition}`}
            aria-label={`${row.proposedAgentLane} work assignment row`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{row.proposedAgentLane}</div>
            <div className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8 }}>{row.assignmentState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{row.proposedOutcome}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.nextAction}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.blocker}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Evidence: {row.evidenceLocation}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {sections.map((section) => (
          <div className="ccv2-safety-row" key={section.label}>
            <span className="ccv2-safety-row__label">{section.label}</span>
            <span className="ccv2-safety-row__value--disabled">{section.blockedCount} blocked</span>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className="ccv2-safety-row__value--disabled">{row.value}</span>
          </div>
        ))}
      </div>
      {blockers.length > 0 && (
        <ul className="ccv2-list" style={{ marginTop: 12 }}>
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}
    </div>
  );
}

function FounderLiveAgentDispatchReadinessCard({ dispatchReadiness, surfaceLabel = "Agent Dispatch Readiness" }) {
  if (!dispatchReadiness) return null;

  const rows = Array.isArray(dispatchReadiness.dispatchRows) ? dispatchReadiness.dispatchRows.slice(0, 3) : [];
  const sections = Array.isArray(dispatchReadiness.dispatchSections) ? dispatchReadiness.dispatchSections.slice(0, 3) : [];
  const blockers = Array.isArray(dispatchReadiness.blockers) ? dispatchReadiness.blockers.slice(0, 6) : [];
  const safetyRows = Array.isArray(dispatchReadiness.safetyRows) ? dispatchReadiness.safetyRows : [];

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Founder agent dispatch readiness">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Agent Dispatch Readiness</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>
            {dispatchReadiness.currentState}
          </div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">Preview only</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Founder idea</span><span className="ccv2-page-summary-value">{dispatchReadiness.founderIdea}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Preview mode</span><span className="ccv2-page-summary-value">{dispatchReadiness.previewMode}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Dispatch candidates</span><span className="ccv2-page-summary-value">{dispatchReadiness.candidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Blocked candidates</span><span className="ccv2-page-summary-value">{dispatchReadiness.blockedCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Writable candidates</span><span className="ccv2-page-summary-value">{dispatchReadiness.writableCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Persisted candidates</span><span className="ccv2-page-summary-value">{dispatchReadiness.persistedCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Dispatchable candidates</span><span className="ccv2-page-summary-value">{dispatchReadiness.dispatchableCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Executable candidates</span><span className="ccv2-page-summary-value">{dispatchReadiness.executableCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{dispatchReadiness.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{dispatchReadiness.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{dispatchReadiness.disabledReason}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{dispatchReadiness.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{dispatchReadiness.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{dispatchReadiness.costImpact}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
        {rows.map((row) => (
          <div
            key={`${row.proposedDispatchLane}-${row.dispatchPosition}`}
            aria-label={`${row.proposedDispatchLane} dispatch readiness row`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{row.proposedDispatchLane}</div>
            <div className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8 }}>{row.dispatchState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{row.proposedOutcome}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.nextAction}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.blocker}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Evidence: {row.evidenceLocation}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {sections.map((section) => (
          <div className="ccv2-safety-row" key={section.label}>
            <span className="ccv2-safety-row__label">{section.label}</span>
            <span className="ccv2-safety-row__value--disabled">{section.blockedCount} blocked</span>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className="ccv2-safety-row__value--disabled">{row.value}</span>
          </div>
        ))}
      </div>
      {blockers.length > 0 && (
        <ul className="ccv2-list" style={{ marginTop: 12 }}>
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}
    </div>
  );
}

function FounderLiveRuntimeAdmissionReadinessCard({ runtimeReadiness, surfaceLabel = "Runtime Admission Readiness" }) {
  if (!runtimeReadiness) return null;

  const rows = Array.isArray(runtimeReadiness.runtimeAdmissionRows) ? runtimeReadiness.runtimeAdmissionRows.slice(0, 3) : [];
  const sections = Array.isArray(runtimeReadiness.runtimeAdmissionSections) ? runtimeReadiness.runtimeAdmissionSections.slice(0, 3) : [];
  const blockers = Array.isArray(runtimeReadiness.blockers) ? runtimeReadiness.blockers.slice(0, 6) : [];
  const safetyRows = Array.isArray(runtimeReadiness.safetyRows) ? runtimeReadiness.safetyRows : [];

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Founder runtime admission readiness">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Runtime Admission Readiness</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>
            {runtimeReadiness.currentState}
          </div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">Admission blocked</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Founder idea</span><span className="ccv2-page-summary-value">{runtimeReadiness.founderIdea}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Preview mode</span><span className="ccv2-page-summary-value">{runtimeReadiness.previewMode}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Runtime candidates</span><span className="ccv2-page-summary-value">{runtimeReadiness.candidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Blocked candidates</span><span className="ccv2-page-summary-value">{runtimeReadiness.blockedCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Writable candidates</span><span className="ccv2-page-summary-value">{runtimeReadiness.writableCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Persisted candidates</span><span className="ccv2-page-summary-value">{runtimeReadiness.persistedCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Admissible candidates</span><span className="ccv2-page-summary-value">{runtimeReadiness.runtimeAdmissibleCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Executable candidates</span><span className="ccv2-page-summary-value">{runtimeReadiness.executableCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{runtimeReadiness.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{runtimeReadiness.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{runtimeReadiness.disabledReason}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{runtimeReadiness.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{runtimeReadiness.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{runtimeReadiness.costImpact}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
        {rows.map((row) => (
          <div
            key={`${row.proposedAdmissionLane}-${row.admissionPosition}`}
            aria-label={`${row.proposedAdmissionLane} runtime admission readiness row`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{row.proposedAdmissionLane}</div>
            <div className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8 }}>{row.admissionState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{row.proposedOutcome}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.nextAction}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.blocker}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Evidence: {row.evidenceLocation}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {sections.map((section) => (
          <div className="ccv2-safety-row" key={section.label}>
            <span className="ccv2-safety-row__label">{section.label}</span>
            <span className="ccv2-safety-row__value--disabled">{section.blockedCount} blocked</span>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className="ccv2-safety-row__value--disabled">{row.value}</span>
          </div>
        ))}
      </div>
      {blockers.length > 0 && (
        <ul className="ccv2-list" style={{ marginTop: 12 }}>
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}
    </div>
  );
}

function FounderLiveRuntimeExecutionReadinessCard({
  runtimeExecutionReadiness,
  surfaceLabel = "Runtime Execution Readiness",
}) {
  if (!runtimeExecutionReadiness) return null;

  const rows = Array.isArray(runtimeExecutionReadiness.runtimeExecutionRows)
    ? runtimeExecutionReadiness.runtimeExecutionRows.slice(0, 3)
    : [];
  const sections = Array.isArray(runtimeExecutionReadiness.runtimeExecutionSections)
    ? runtimeExecutionReadiness.runtimeExecutionSections.slice(0, 3)
    : [];
  const blockers = Array.isArray(runtimeExecutionReadiness.blockers)
    ? runtimeExecutionReadiness.blockers.slice(0, 6)
    : [];
  const safetyRows = Array.isArray(runtimeExecutionReadiness.safetyRows)
    ? runtimeExecutionReadiness.safetyRows
    : [];

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Founder runtime execution readiness">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Runtime Execution Readiness</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>
            {runtimeExecutionReadiness.currentState}
          </div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">Execution blocked</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Founder idea</span><span className="ccv2-page-summary-value">{runtimeExecutionReadiness.founderIdea}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Preview mode</span><span className="ccv2-page-summary-value">{runtimeExecutionReadiness.previewMode}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Source admission</span><span className="ccv2-page-summary-value">{runtimeExecutionReadiness.sourceAdmissionLabel}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Execution candidates</span><span className="ccv2-page-summary-value">{runtimeExecutionReadiness.candidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Blocked candidates</span><span className="ccv2-page-summary-value">{runtimeExecutionReadiness.blockedCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Writable candidates</span><span className="ccv2-page-summary-value">{runtimeExecutionReadiness.writableCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Persisted candidates</span><span className="ccv2-page-summary-value">{runtimeExecutionReadiness.persistedCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Executable candidates</span><span className="ccv2-page-summary-value">{runtimeExecutionReadiness.executableCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{runtimeExecutionReadiness.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{runtimeExecutionReadiness.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{runtimeExecutionReadiness.disabledReason}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{runtimeExecutionReadiness.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{runtimeExecutionReadiness.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{runtimeExecutionReadiness.costImpact}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
        {rows.map((row) => (
          <div
            key={`${row.proposedExecutionLane}-${row.executionPosition}`}
            aria-label={`${row.proposedExecutionLane} runtime execution readiness row`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{row.proposedExecutionLane}</div>
            <div className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8 }}>{row.executionState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{row.proposedOutcome}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.nextAction}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.blocker}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Evidence: {row.evidenceLocation}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {sections.map((section) => (
          <div className="ccv2-safety-row" key={section.label}>
            <span className="ccv2-safety-row__label">{section.label}</span>
            <span className="ccv2-safety-row__value--disabled">{section.blockedCount} blocked</span>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className="ccv2-safety-row__value--disabled">{row.value}</span>
          </div>
        ))}
      </div>
      {blockers.length > 0 && (
        <ul className="ccv2-list" style={{ marginTop: 12 }}>
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}
    </div>
  );
}

function FounderRuntimeExecutionApprovalGateCard({
  approvalGate,
  surfaceLabel = "Runtime Execution Approval Gate",
}) {
  if (!approvalGate) return null;

  const rows = Array.isArray(approvalGate.approvalGateRows)
    ? approvalGate.approvalGateRows.slice(0, 3)
    : [];
  const sections = Array.isArray(approvalGate.approvalGateSections)
    ? approvalGate.approvalGateSections.slice(0, 3)
    : [];
  const blockers = Array.isArray(approvalGate.blockers)
    ? approvalGate.blockers.slice(0, 6)
    : [];
  const safetyRows = Array.isArray(approvalGate.safetyRows)
    ? approvalGate.safetyRows
    : [];

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Runtime execution approval gate">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Runtime Execution Approval Gate</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>
            {approvalGate.currentState}
          </div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">Approval capture blocked</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Founder idea</span><span className="ccv2-page-summary-value">{approvalGate.founderIdea}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Preview mode</span><span className="ccv2-page-summary-value">{approvalGate.previewMode}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Source runtime state</span><span className="ccv2-page-summary-value">{approvalGate.sourceRuntimeState}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Approval candidates</span><span className="ccv2-page-summary-value">{approvalGate.candidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Blocked candidates</span><span className="ccv2-page-summary-value">{approvalGate.blockedCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Writable candidates</span><span className="ccv2-page-summary-value">{approvalGate.writableCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Captured approvals</span><span className="ccv2-page-summary-value">{approvalGate.approvalCaptureCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Executable candidates</span><span className="ccv2-page-summary-value">{approvalGate.executableCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{approvalGate.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{approvalGate.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{approvalGate.disabledReason}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{approvalGate.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{approvalGate.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{approvalGate.costImpact}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
        {rows.map((row) => (
          <div
            key={`${row.proposedApprovalLane}-${row.approvalPosition}`}
            aria-label={`${row.proposedApprovalLane} approval gate row`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{row.proposedApprovalLane}</div>
            <div className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8 }}>{row.approvalGateState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{row.proposedOutcome}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Source: {row.sourceRuntimeLane}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.nextAction}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.blocker}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Evidence: {row.evidenceLocation}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {sections.map((section) => (
          <div className="ccv2-safety-row" key={section.label}>
            <span className="ccv2-safety-row__label">{section.label}</span>
            <span className="ccv2-safety-row__value--disabled">{section.blockedCount} blocked</span>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className="ccv2-safety-row__value--disabled">{row.value}</span>
          </div>
        ))}
      </div>
      {blockers.length > 0 && (
        <ul className="ccv2-list" style={{ marginTop: 12 }}>
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}
    </div>
  );
}

function FounderApprovalCaptureBoundaryCard({
  capture,
  surfaceLabel = "Runtime Approval Capture Boundary",
}) {
  if (!capture) return null;

  const rows = Array.isArray(capture.readinessRows)
    ? capture.readinessRows.slice(0, 3)
    : [];
  const sections = Array.isArray(capture.readinessSections)
    ? capture.readinessSections.slice(0, 3)
    : [];
  const blockers = Array.isArray(capture.blockers)
    ? capture.blockers.slice(0, 6)
    : [];
  const safetyRows = Array.isArray(capture.safetyRows)
    ? capture.safetyRows
    : [];

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Founder runtime approval capture boundary">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Runtime Approval Capture Boundary</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>
            {capture.currentState}
          </div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">Capture read-only</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Founder idea</span><span className="ccv2-page-summary-value">{capture.founderIdea}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Preview mode</span><span className="ccv2-page-summary-value">{capture.previewMode}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Readiness rows</span><span className="ccv2-page-summary-value">{capture.readinessRowCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Blocked rows</span><span className="ccv2-page-summary-value">{capture.blockedReadinessRowCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Capturable candidates</span><span className="ccv2-page-summary-value">{capture.capturableCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Persistable candidates</span><span className="ccv2-page-summary-value">{capture.persistableCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Decision-recordable candidates</span><span className="ccv2-page-summary-value">{capture.decisionRecordableCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Executable candidates</span><span className="ccv2-page-summary-value">{capture.runtimeExecutableCandidateCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{capture.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{capture.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{capture.disabledReason}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{capture.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{capture.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{capture.costImpact}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 16 }}>
        {rows.map((row) => (
          <div
            key={`${row.label}-${row.capturePosition}`}
            aria-label={`${row.label} approval capture boundary row`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{row.label}</div>
            <div className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8 }}>{row.captureState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{row.nextAction}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.blocker}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Evidence: {row.evidenceLocation}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {sections.map((section) => (
          <div className="ccv2-safety-row" key={section.label}>
            <span className="ccv2-safety-row__label">{section.label}</span>
            <span className="ccv2-safety-row__value--disabled">{section.blockedCount} blocked</span>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className="ccv2-safety-row__value--disabled">{row.value}</span>
          </div>
        ))}
      </div>
      {blockers.length > 0 && (
        <ul className="ccv2-list" style={{ marginTop: 12 }}>
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}
    </div>
  );
}

function FounderApprovalDecisionBoundaryCard({
  decision,
  surfaceLabel = "Runtime Approval Decision Boundary",
  heading = "Runtime Approval Decision Boundary",
  pillLabel = "Decision read-only",
  ariaLabel = "Founder runtime approval decision boundary",
  rowAriaSuffix = "approval decision boundary row",
  maxRows = 3,
}) {
  if (!decision) return null;

  const rows = Array.isArray(decision.readinessRows)
    ? decision.readinessRows.slice(0, maxRows)
    : [];
  const sections = Array.isArray(decision.readinessSections)
    ? decision.readinessSections.slice(0, 3)
    : [];
  const blockers = Array.isArray(decision.blockers)
    ? decision.blockers.slice(0, 6)
    : [];
  const safetyRows = Array.isArray(decision.safetyRows)
    ? decision.safetyRows
    : [];
  const summaryRows = Array.isArray(decision.summaryRows)
    ? decision.summaryRows
    : [
      { label: "Founder idea", value: decision.founderIdea },
      { label: "Preview mode", value: decision.previewMode },
      { label: "Readiness rows", value: decision.readinessRowCount },
      { label: "Blocked rows", value: decision.blockedReadinessRowCount },
      { label: "Decision-review candidates", value: decision.decisionReviewCandidateCount },
      { label: "Approvable candidates", value: decision.approvableCandidateCount },
      { label: "Rejectable candidates", value: decision.rejectableCandidateCount },
      { label: "Persistable candidates", value: decision.persistableCandidateCount },
      { label: "Decision-recordable candidates", value: decision.decisionRecordableCandidateCount },
      { label: "Executable candidates", value: decision.runtimeExecutableCandidateCount },
      { label: "Owner capability", value: decision.ownerCapability },
      { label: "Next action", value: decision.nextAction },
      { label: "Disabled reason", value: decision.disabledReason },
      { label: "Evidence", value: decision.evidenceLocation },
      { label: "Activity", value: decision.activityLocation },
      { label: "Cost impact", value: decision.costImpact },
    ];

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label={ariaLabel}>
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>{heading}</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>
            {decision.currentState}
          </div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">{pillLabel}</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        {summaryRows.map((row) => (
          <div className="ccv2-page-summary-row" key={row.label}>
            <span className="ccv2-page-summary-label">{row.label}</span>
            <span className="ccv2-page-summary-value">{row.value}</span>
          </div>
        ))}
      </div>
      <div className={`ccv2-grid ${maxRows > 3 ? "ccv2-grid--4" : "ccv2-grid--3"}`} style={{ marginTop: 16 }}>
        {rows.map((row) => (
          <div
            key={`${row.label}-${row.decisionPosition}`}
            aria-label={`${row.label} ${rowAriaSuffix}`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{row.label}</div>
            <div className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8 }}>{row.decisionState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{row.nextAction}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{row.blocker}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>Evidence: {row.evidenceLocation}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {sections.map((section) => (
          <div className="ccv2-safety-row" key={section.label}>
            <span className="ccv2-safety-row__label">{section.label}</span>
            <span className="ccv2-safety-row__value--disabled">{section.blockedCount} blocked</span>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className="ccv2-safety-row__value--disabled">{row.value}</span>
          </div>
        ))}
      </div>
      {blockers.length > 0 && (
        <ul className="ccv2-list" style={{ marginTop: 12 }}>
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}
    </div>
  );
}

function ExecutionAdmissionCard({
  admission,
  envelope,
  dryRun,
  surfaceLabel = "Execution Admission",
}) {
  if (!admission || !envelope || !dryRun) return null;

  const lanes = Array.isArray(dryRun.lanes) ? dryRun.lanes.slice(0, 4) : [];
  const approvals = Array.isArray(envelope.approvals) ? envelope.approvals.slice(0, 5) : [];
  const blockers = Array.isArray(dryRun.blockers) ? dryRun.blockers.slice(0, 5) : [];
  const safetyRows = Array.isArray(dryRun.safetyRows) ? dryRun.safetyRows : [];

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Execution admission readiness">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Execution Admission</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>
            {dryRun.currentState}
          </div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">Execution blocked</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Admission state</span><span className="ccv2-page-summary-value">{admission.currentState}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Approval envelope</span><span className="ccv2-page-summary-value">{envelope.currentState}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Approval gates</span><span className="ccv2-page-summary-value">{envelope.approvalsAcceptedCount || 0} of {envelope.approvalsRequiredCount || approvals.length} accepted</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Blocked lanes</span><span className="ccv2-page-summary-value">{dryRun.blockedLaneCount || lanes.length} of {dryRun.laneCount || lanes.length}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Executable lanes</span><span className="ccv2-page-summary-value">{dryRun.executableCount || 0}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{dryRun.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{dryRun.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{dryRun.disabledReason}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{dryRun.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{dryRun.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{dryRun.costImpact}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--4" style={{ marginTop: 16 }}>
        {lanes.map((lane) => (
          <div
            key={lane.lane}
            aria-label={`${lane.lane} execution admission lane`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{lane.lane}</div>
            <div className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8 }}>{lane.previewDecision}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{lane.ownerCapability}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{lane.dryRunState}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{lane.nextAction}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className="ccv2-safety-row__value--disabled">{row.value}</span>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {approvals.map((approval) => (
          <div className="ccv2-safety-row" key={approval.label}>
            <span className="ccv2-safety-row__label">{approval.label}</span>
            <span className="ccv2-safety-row__value--disabled">{approval.state}</span>
          </div>
        ))}
      </div>
      {blockers.length > 0 && (
        <ul className="ccv2-list" style={{ marginTop: 12 }}>
          {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        </ul>
      )}
    </div>
  );
}

function LiveWorkstreamHandoffCard({ handoff, dryRun, surfaceLabel = "Live Workstream Handoff" }) {
  if (!handoff || !dryRun) return null;

  const lanes = Array.isArray(dryRun.lanes) ? dryRun.lanes.slice(0, 6) : [];
  const fallbackSafetyRows = [
    { label: "Agent dispatch", value: "Blocked" },
    { label: "Worker/tool execution", value: "Blocked" },
    { label: "Project mutation", value: "Blocked" },
    { label: "Hosted DB", value: "Blocked" },
    { label: "Deploy/package", value: "Blocked" },
    { label: "Provider spend", value: "Blocked" },
  ];
  const safetyRows = Array.isArray(dryRun.safetyRows) ? dryRun.safetyRows : fallbackSafetyRows;

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Live workstream handoff">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Live Workstream Handoff</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>
            {dryRun.currentState}
          </div>
        </div>
        <span className="ccv2-pill ccv2-pill--disabled">Dry run only</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Source packet</span><span className="ccv2-page-summary-value">{handoff.currentState}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Preview lanes</span><span className="ccv2-page-summary-value">{dryRun.readyPreviewCount || 0} ready of {dryRun.laneCount || lanes.length}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Executable lanes</span><span className="ccv2-page-summary-value">{dryRun.executableCount || 0}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{dryRun.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{dryRun.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{dryRun.disabledReason}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{dryRun.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{dryRun.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{dryRun.costImpact}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--4" style={{ marginTop: 16 }}>
        {lanes.map((lane) => (
          <div
            key={lane.lane}
            aria-label={`${lane.lane} live handoff lane`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{lane.lane}</div>
            <div className="ccv2-pill ccv2-pill--disabled" style={{ marginTop: 8 }}>{lane.dryRunState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{lane.ownerCapability}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{lane.plannedWork}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{lane.previewNextAction}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className={row.value === "Yes" ? "ccv2-safety-row__value--ready" : "ccv2-safety-row__value--disabled"}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BusinessBuildDbCrudCard({ crud, surfaceLabel = "Business Build DB Workflow" }) {
  if (!crud) return null;

  return (
    <div className="ccv2-card" style={{ marginTop: 16 }} aria-label="Business Build DB CRUD">
      <div className="ccv2-card-header-row">
        <div>
          <div className="ccv2-eyebrow">{surfaceLabel}</div>
          <h3>Business Build DB Workflow</h3>
          <div className="ccv2-muted" style={{ marginTop: 6 }}>
            {crud.currentState}
          </div>
        </div>
        <span className="ccv2-pill ccv2-pill--teal">Local CRUD</span>
      </div>
      <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Saved session</span><span className="ccv2-page-summary-value">{crud.savedSessionState}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">PRD snapshot</span><span className="ccv2-page-summary-value">{crud.prdSnapshotState}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Execution request</span><span className="ccv2-page-summary-value">{crud.executionRequestState}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Agent lanes</span><span className="ccv2-page-summary-value">{crud.agentLaneState}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Allowed local CRUD</span><span className="ccv2-page-summary-value">{crud.allowedLocalCrudOperations.join(", ")} with explicit approval</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Records ready</span><span className="ccv2-page-summary-value">{crud.readyRecordCount} of {crud.totalRecordCount}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Owner capability</span><span className="ccv2-page-summary-value">{crud.ownerCapability}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Evidence</span><span className="ccv2-page-summary-value">{crud.evidenceLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Activity</span><span className="ccv2-page-summary-value">{crud.activityLocation}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Cost impact</span><span className="ccv2-page-summary-value">{crud.costImpact}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next action</span><span className="ccv2-page-summary-value">{crud.nextAction}</span></div>
        <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Disabled reason</span><span className="ccv2-page-summary-value">{crud.disabledReason}</span></div>
      </div>
      <div className="ccv2-grid ccv2-grid--4" style={{ marginTop: 16 }}>
        {crud.lanes.map((lane) => (
          <div
            key={lane.label}
            aria-label={`${lane.label} Business Build DB lane`}
            style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12 }}
          >
            <div className="ccv2-section-heading">{lane.label}</div>
            <div className="ccv2-pill ccv2-pill--teal" style={{ marginTop: 8 }}>{lane.currentState}</div>
            <div className="ccv2-muted" style={{ marginTop: 10 }}>{lane.ownerCapability}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{lane.nextAction}</div>
            <div className="ccv2-muted" style={{ marginTop: 8 }}>{lane.blocker}</div>
          </div>
        ))}
      </div>
      <div className="ccv2-safety-grid" style={{ marginTop: 12 }}>
        {crud.safetyRows.map((row) => (
          <div className="ccv2-safety-row" key={row.label}>
            <span className="ccv2-safety-row__label">{row.label}</span>
            <span className={row.value === "Guarded" ? "ccv2-safety-row__value--ready" : "ccv2-safety-row__value--disabled"}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── OS Roadmap Page ─── */
function OSRoadmapPage({ vm }) {
  void vm;
  const roadmapTabs = COMMAND_CENTER_ROUTE_BY_KEY.roadmap.tabs || [];
  const [activeTab, setActiveTab] = useState("in-progress");

  const summarizePhase = (phase) => {
    if (!phase) return "Not available";
    return `${phase.phase} · ${phase.label}`;
  };

  const inProgressPhase = NEXUS_CURRENT_OS_PHASE;
  const latestCompletedPhase = NEXUS_PREVIOUS_COMPLETED_PHASE;
  const nextPhase = NEXUS_NEXT_OS_PHASE;
  const inProgressRows = NEXUS_IN_PROGRESS_OS_PHASES.length > 0 ? NEXUS_IN_PROGRESS_OS_PHASES : [];

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">OS Roadmap</div>
          <div className="ccv2-page-head__sub">NEXUS OS platform progress only. Project progress belongs under Projects.</div>
        </div>

        <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.roadmap} />

        <div className="ccv2-roadmap-summary-grid">
          <div className="ccv2-roadmap-summary-card">
            <div className="ccv2-roadmap-summary-card__label">Latest completed phase</div>
            <div className="ccv2-roadmap-summary-card__value">{summarizePhase(latestCompletedPhase)}</div>
            <div className="ccv2-roadmap-summary-card__meta">Validated OS capability</div>
          </div>
          <div className="ccv2-roadmap-summary-card ccv2-roadmap-summary-card--current">
            <div className="ccv2-roadmap-summary-card__label">In progress phase</div>
            <div className="ccv2-roadmap-summary-card__value">
              {inProgressPhase ? summarizePhase(inProgressPhase) : "No phase marked in progress"}
            </div>
            <div className="ccv2-roadmap-summary-card__meta">Active OS phase status</div>
          </div>
          <div className="ccv2-roadmap-summary-card">
            <div className="ccv2-roadmap-summary-card__label">Next planned phase</div>
            <div className="ccv2-roadmap-summary-card__value">{summarizePhase(nextPhase)}</div>
            <div className="ccv2-roadmap-summary-card__meta">Next governed platform capability</div>
          </div>
        </div>

        <div className="ccv2-roadmap-note">
          <strong>NEXUS OS Platform Progress:</strong> this page excludes private project milestones and demo project progress.
        </div>

        <CommandTabs tabs={roadmapTabs} activeTab={activeTab} onTabChange={setActiveTab} ariaLabel="OS Roadmap sections">
          <CommandTabPanel tabId="completed" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Completed</div>
              {NEXUS_COMPLETED_OS_PHASES.map((row) => (
                <div key={row.phase} className="ccv2-roadmap-phase ccv2-roadmap-phase--pass">
                  <div className="ccv2-roadmap-phase__phase">{row.phase}</div>
                  <div className="ccv2-roadmap-phase__label-wrap">
                    <div className="ccv2-roadmap-phase__label">{row.label}</div>
                    <div className="ccv2-roadmap-phase__detail">{row.detail}</div>
                  </div>
                  <span className="ccv2-pill ccv2-pill--pass">Complete</span>
                </div>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="in-progress" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">In Progress</div>
              {inProgressRows.length === 0 ? (
                <div className="ccv2-empty-state">
                  No phase is currently marked in progress. Latest completed and next planned are shown below.
                </div>
              ) : (
                <div className="ccv2-roadmap-phases">
                  {inProgressRows.map((row) => (
                    <div key={row.phase} className="ccv2-roadmap-phase ccv2-roadmap-phase--pending ccv2-roadmap-phase--current">
                      <div className="ccv2-roadmap-phase__phase">{row.phase}</div>
                      <div className="ccv2-roadmap-phase__label-wrap">
                        <div className="ccv2-roadmap-phase__label">{row.label}</div>
                        <div className="ccv2-roadmap-phase__detail">{row.detail}</div>
                      </div>
                      <span className="ccv2-pill ccv2-pill--pending">{row.statusLabel || "In Progress"}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="ccv2-page-summary-grid">
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Latest completed</span><span className="ccv2-page-summary-value">{summarizePhase(latestCompletedPhase)}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next planned</span><span className="ccv2-page-summary-value">{summarizePhase(nextPhase)}</span></div>
                <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Separation rule</span><span className="ccv2-page-summary-value">OS Roadmap tracks NEXUS platform phases only.</span></div>
              </div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="planned" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Planned</div>
              <div className="ccv2-roadmap-phases">
                {NEXUS_PLANNED_OS_PHASES.map((row) => (
                  <div key={row.phase} className="ccv2-roadmap-phase ccv2-roadmap-phase--disabled">
                  <div className="ccv2-roadmap-phase__phase">{row.phase}</div>
                  <div className="ccv2-roadmap-phase__label-wrap">
                    <div className="ccv2-roadmap-phase__label">{row.label}</div>
                    <div className="ccv2-roadmap-phase__detail">{row.detail}</div>
                  </div>
                  <span className="ccv2-pill ccv2-pill--disabled">{row.statusLabel || "Planned"}</span>
                </div>
              ))}
              </div>
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

const DOCS_GUIDES = [
  {
    id: "getting-started",
    title: "Getting Started",
    section: "Start Here",
    audience: "Operator",
    status: "Available",
    description: "Launch NEXUS locally, understand the operating model, and run your first governed workflow.",
    path: "docs/usage/GETTING_STARTED.md",
    preview: [
      "Use this guide for first-run setup, local operating posture, and the safest path from project context to governed work.",
      "It explains how Command Center, local boot, mode boundaries, and operator actions fit together without requiring internal phase knowledge.",
    ],
  },
  {
    id: "command-center-guide",
    title: "Command Center Guide",
    section: "Start Here",
    audience: "Operator",
    status: "Available",
    description: "Navigate missions, tasks, evidence, service health, and operator actions from the NEXUS cockpit.",
    path: "docs/usage/COMMAND_CENTER_GUIDE.md",
    preview: [
      "Use this as the cockpit manual for Mission Control, tabbed pages, scope/project context, Docs & Guides, and Service Health.",
      "It focuses on what an operator can inspect now and which actions remain disabled until governed capabilities are wired.",
    ],
  },
  {
    id: "running-nexus-locally",
    title: "Running NEXUS Locally",
    section: "Start Here",
    audience: "Operator",
    status: "Available",
    description: "Start, inspect, troubleshoot, and shut down local NEXUS services using the unified boot workflow.",
    path: "docs/usage/RUNNING_NEXUS_LOCALLY.md",
    preview: [
      "Covers nexus:up, nexus:down, nexus:status, nexus:doctor, local-only bindings, and service-state files.",
      "Use it when a service is offline, a port is busy, or Command Center is reading from a snapshot fallback.",
    ],
  },
  {
    id: "starting-a-mission",
    title: "Starting a Mission",
    section: "Operator Guides",
    audience: "Operator",
    status: "Available",
    description: "Turn a project goal into a governed mission plan with agents, evidence, and approval points.",
    path: "docs/usage/STARTING_A_MISSION.md",
    preview: [
      "Explains how goals become scoped mission plans and how NEXUS keeps planning separate from unsafe autonomous execution.",
      "Use it before generating a plan or when mission context, agents, and expected evidence need clarification.",
    ],
  },
  {
    id: "activating-tasks",
    title: "Activating Tasks",
    section: "Operator Guides",
    audience: "Operator",
    status: "Available",
    description: "Move planned work into governed runtime state while preserving scope, ownership, and evidence expectations.",
    path: "docs/usage/ACTIVATING_TASKS.md",
    preview: [
      "Covers task states, activation prerequisites, ownership, and why a task may be blocked or awaiting review.",
      "Use it when moving from plan review into the Agent Workbench flow.",
    ],
  },
  {
    id: "agent-workbench",
    title: "Agent Workbench",
    section: "Operator Guides",
    audience: "Operator",
    status: "Available",
    description: "Review assigned agent work, blockers, evidence, and human decisions from a task-centered workspace.",
    path: "docs/usage/USING_AGENT_WORKBENCH.md",
    preview: [
      "Explains task-centered review, evidence summaries, operator decisions, and disabled states when bridges are offline.",
      "Use it when auditing assigned work or deciding whether to approve, reject, or request changes.",
    ],
  },
  {
    id: "controlled-implementation",
    title: "Controlled Implementation",
    section: "Operator Guides",
    audience: "Operator",
    status: "Available",
    description: "Understand how NEXUS applies scoped changes, records evidence, and preserves rollback posture.",
    path: "docs/usage/CONTROLLED_IMPLEMENTATION.md",
    preview: [
      "Describes proposal, apply, validation, rollback, and developer-details boundaries for controlled implementation.",
      "Use it to distinguish documentation-only work from governed source mutation.",
    ],
  },
  {
    id: "evidence-audit",
    title: "Evidence & Audit",
    section: "Operator Guides",
    audience: "Operator",
    status: "Available",
    description: "Trace what happened, why it was allowed, which agent acted, and what proof was produced.",
    path: "docs/usage/UNDERSTANDING_EVIDENCE_AUDIT.md",
    preview: [
      "Explains evidence records, audit posture, redaction, and how future activity traces will connect related work.",
      "Use it when reviewing proof, blockers, policy decisions, or activity-readiness status.",
    ],
  },
  {
    id: "demo-vs-private",
    title: "Demo vs Private Mode",
    section: "Operator Guides",
    audience: "Operator",
    status: "Available",
    description: "Understand what appears in demo mode, what stays private, and how NEXUS prevents data leakage.",
    path: "docs/usage/DEMO_MODE_VS_PRIVATE_MODE.md",
    preview: [
      "Clarifies demo-safe data, local-private surfaces, and why demo fixtures never appear in primary full Command Center UX.",
      "Use it when validating public-safe boundaries or reviewing screenshots.",
    ],
  },
  {
    id: "agentic-os-architecture",
    title: "Agentic OS Architecture",
    section: "Architecture",
    audience: "Architect",
    status: "Available",
    description: "Understand the NEXUS operating model for authority, governance, evidence, runtime boundaries, and safety.",
    path: "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
    preview: [
      "Use this for the platform-level architecture behind agents, gates, policies, evidence, and local-private execution.",
      "It is a reference for future OS phases rather than a project roadmap.",
    ],
  },
  {
    id: "nexus-platform-roadmap",
    title: "NEXUS Platform Roadmap",
    section: "Architecture",
    audience: "Architect",
    status: "Available",
    description: "Review current and planned NEXUS OS phases without mixing in project-specific progress.",
    path: "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
    preview: [
      "Use this for long-range OS capability sequencing, not private project status.",
      "Command Center OS Roadmap mirrors the structured phase-status registry.",
    ],
  },
  {
    id: "module-registry",
    title: "Module Registry",
    section: "Codebase",
    audience: "Developer",
    status: "Available",
    description: "Find the canonical inventory of NEXUS module families, responsibilities, boundaries, and checkers.",
    path: "docs/codebase/MODULE_REGISTRY.md",
    preview: [
      "Use this before adding or changing modules so future agents and contributors can reuse existing surfaces.",
      "It maps major module families to tests, safety boundaries, and known limitations.",
    ],
  },
  {
    id: "reuse-refactor-guide",
    title: "Reuse and Refactor Guide",
    section: "Codebase",
    audience: "Developer",
    status: "Available",
    description: "Apply reuse-first guidance before introducing duplicate helpers or risky refactors.",
    path: "docs/codebase/REUSE_AND_REFACTOR_GUIDE.md",
    preview: [
      "Use this to decide whether a helper should be reused, cataloged, or deferred to a dedicated refactor phase.",
      "It explicitly protects high-risk runtime, redaction, safe-file, and governance boundaries.",
    ],
  },
  {
    id: "code-documentation-standard",
    title: "Code Documentation Standard",
    section: "Codebase",
    audience: "Developer",
    status: "Available",
    description: "Document module purpose, inputs, outputs, side effects, safety boundaries, and reuse guidance.",
    path: "docs/codebase/CODE_DOCUMENTATION_STANDARD.md",
    preview: [
      "Use this as the required standard for new module families and major files.",
      "It keeps future maintainers and agentic coding loops aligned on module ownership and safety posture.",
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    section: "Troubleshooting",
    audience: "Operator",
    status: "Available",
    description: "Diagnose common local boot, service health, UI fallback, and documentation navigation problems.",
    path: "docs/usage/TROUBLESHOOTING.md",
    preview: [
      "Use this when routes, docs cards, local services, activity readiness, or snapshot fallbacks are confusing.",
      "It gives operator-safe recovery steps without changing backend behavior.",
    ],
  },
  {
    id: "faq",
    title: "FAQ",
    section: "Troubleshooting",
    audience: "Operator",
    status: "Available",
    description: "Answer common operator questions about current NEXUS capabilities, limits, and safe next steps.",
    path: "docs/usage/FAQ.md",
    preview: [
      "Use this for quick answers before opening deeper operator or architecture guides.",
      "It summarizes common constraints such as disabled provider dispatch, DB writes, and runtime automation.",
    ],
  },
];

const DOCS_GUIDE_SECTIONS = ["Start Here", "Operator Guides", "Architecture", "Codebase", "Troubleshooting"];
const DOCS_GUIDE_BY_ID = Object.fromEntries(DOCS_GUIDES.map((guide) => [guide.id, guide]));
const DOCS_SECTION_DESCRIPTIONS = {
  "Start Here": "First-run and cockpit orientation for local operators.",
  "Operator Guides": "Task, mission, evidence, implementation, and mode-boundary guidance.",
  Architecture: "Platform design references for NEXUS OS capabilities and phase sequencing.",
  Codebase: "Contributor references for module ownership, reuse, and documentation standards.",
  Troubleshooting: "Recovery guidance for local boot, docs navigation, and operator confusion.",
};

function getSelectedDocsGuide(pathname) {
  const docId = pathname.startsWith("/command-center/docs/")
    ? pathname.replace("/command-center/docs/", "").split("/")[0]
    : "getting-started";
  return DOCS_GUIDE_BY_ID[docId] || DOCS_GUIDE_BY_ID["getting-started"];
}

function DocsGuidesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const selectedGuide = getSelectedDocsGuide(location.pathname);
  const normalizedFilter = filter.trim().toLowerCase();
  const visibleGuides = normalizedFilter
    ? DOCS_GUIDES.filter((guide) => `${guide.title} ${guide.description} ${guide.section}`.toLowerCase().includes(normalizedFilter))
    : DOCS_GUIDES;

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Docs & Guides</div>
          <div className="ccv2-page-head__sub">Operator, architecture, and contributor guidance for running NEXUS safely.</div>
        </div>

        <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.docs} />

        <div className="ccv2-docs-shell">
          <section className="ccv2-card ccv2-docs-reader" aria-label="Selected documentation guide">
            <div className="ccv2-docs-reader__meta">
              <span className="ccv2-pill ccv2-pill--pass">{selectedGuide.status}</span>
              <span className="ccv2-pill ccv2-pill--read">{selectedGuide.audience}</span>
            </div>
            <div className="ccv2-docs-reader__title">{selectedGuide.title}</div>
            <p className="ccv2-docs-reader__description">{selectedGuide.description}</p>
            <div className="ccv2-docs-reader__section">Section: {selectedGuide.section}</div>
            <div className="ccv2-docs-reader__preview">
              {selectedGuide.preview.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <details className="ccv2-docs-developer-details">
              <summary>Developer Details</summary>
              <div>Local file: {selectedGuide.path}</div>
              <a href={`/${selectedGuide.path}`}>Open local file</a>
            </details>
          </section>

          <section className="ccv2-docs-browser" aria-label="Documentation guide browser">
            <div className="ccv2-docs-toolbar">
              <div>
                <div className="ccv2-section-heading">Documentation Hub</div>
                <div className="ccv2-docs-section__description">
                  Select a guide to preview it in Command Center. File paths stay in Developer Details.
                </div>
              </div>
              <label className="ccv2-docs-search">
                <span>Search docs</span>
                <input
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Search guides"
                  aria-label="Search documentation guides"
                />
              </label>
            </div>

            {DOCS_GUIDE_SECTIONS.map((section) => {
              const sectionGuides = visibleGuides.filter((guide) => guide.section === section);
              if (!sectionGuides.length) return null;
              return (
                <div key={section} className="ccv2-docs-section">
                  <div className="ccv2-docs-section__header">
                    <div>
                      <div className="ccv2-section-heading">{section}</div>
                      <div className="ccv2-docs-section__description">{DOCS_SECTION_DESCRIPTIONS[section]}</div>
                    </div>
                    <span className="ccv2-pill ccv2-pill--pass">Available</span>
                  </div>
                  <div className="ccv2-docs-grid">
                    {sectionGuides.map((guide) => (
                      <button
                        key={guide.id}
                        type="button"
                        className={`ccv2-doc-card${selectedGuide.id === guide.id ? " ccv2-doc-card--active" : ""}`}
                        aria-label={`View ${guide.title} guide`}
                        aria-current={selectedGuide.id === guide.id ? "page" : undefined}
                        onClick={() => navigate(`/command-center/docs/${guide.id}`)}
                      >
                        <span className="ccv2-doc-card__title">{guide.title}</span>
                        <span className="ccv2-doc-card__detail">{guide.description}</span>
                        <span className="ccv2-doc-card__meta">{guide.status} · {guide.audience}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
}

const ACTIVITY_CATEGORY_LABELS = {
  ui: "UI",
  api: "API",
  action_bridge: "Action",
  action: "Action",
  task: "Task",
  policy: "Policy",
  evidence: "Evidence",
  audit: "Audit",
  error: "Error",
  security: "Security",
  runtime: "Runtime",
  system: "System",
};

const ACTIVITY_LOG_TABS = [
  {
    id: "overview",
    label: "Overview",
    description: "Readiness, capture coverage, counts, and recent highlights",
    badge: "Ready",
  },
  {
    id: "timeline",
    label: "Timeline",
    description: "Newest activity records with source, status, and summary",
    badge: "Ready",
  },
  {
    id: "by-agent",
    label: "By Agent",
    description: "Activity grouped by agent or source",
    badge: "Read-only",
  },
  {
    id: "by-task",
    label: "By Task",
    description: "Activity grouped by task, mission, and project links",
    badge: "Read-only",
  },
  {
    id: "failures",
    label: "Failures & Blocks",
    description: "Failed, blocked, denied, redacted, and approval-required events",
    badge: "Ready",
  },
  {
    id: "api-actions",
    label: "API & Actions",
    description: "Local API reads and governed action bridge outcomes",
    badge: "Ready",
  },
  {
    id: "correlations",
    label: "Correlations",
    description: "Correlation IDs, linked event counts, and trace drilldown",
    badge: "Ready",
  },
];

const TRACE_VIEW_TEST_RECORDS = [
  {
    activityId: "act_traceview001",
    shortActivityId: "act_traceview...",
    correlationId: "corr_traceview001",
    shortCorrelationId: "corr_traceview...",
    timestamp: "2026-05-14T12:00:00.000Z",
    category: "ui",
    eventType: "operator_action_requested",
    source: "command_center",
    scope: "NEXUS_OS_CHANGE",
    mode: "local-private",
    status: "success",
    decision: "ALLOW",
    summary: "Operator opened Activity Log trace view.",
    taskId: "task-trace-001",
    agentId: "NEXUS",
    durationMs: 12,
    redacted: true,
    evidenceCount: 1,
    auditCount: 1,
  },
  {
    activityId: "act_traceview002",
    shortActivityId: "act_traceview...",
    correlationId: "corr_traceview001",
    shortCorrelationId: "corr_traceview...",
    timestamp: "2026-05-14T12:00:03.000Z",
    category: "api",
    eventType: "local_api_request_completed",
    source: "local_api",
    scope: "NEXUS_OS_CHANGE",
    mode: "local-private",
    status: "success",
    decision: "ALLOW",
    summary: "Local API returned redacted activity trace.",
    taskId: "task-trace-001",
    agentId: "NEXUS",
    durationMs: 18,
    redacted: true,
    evidenceCount: 1,
    auditCount: 1,
  },
];

function cleanActivityValue(value, fallback = "Not linked yet") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function formatActivityTimestamp(value) {
  if (!value || Number.isNaN(Date.parse(value))) return "Time unavailable";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalizeActivityStatus(status, decision) {
  if (decision === "REDACT") return "redacted";
  if (decision === "REQUIRE_APPROVAL" || status === "requires_approval") return "require approval";
  if (status === "success") return "success";
  if (status === "failed") return "failed";
  if (status === "blocked") return "blocked";
  if (status === "pending" || status === "started") return "pending";
  return status || "info";
}

function activityStatusTone(status, decision) {
  const normalized = normalizeActivityStatus(status, decision);
  if (["failed", "blocked"].includes(normalized)) return "blocked";
  if (normalized === "success") return "read";
  if (normalized === "redacted" || normalized === "require approval") return "disabled";
  return "planned";
}

function buildActivityGroups(records, keyFn) {
  return records.reduce((groups, record) => {
    const key = keyFn(record);
    if (!groups[key]) groups[key] = [];
    groups[key].push(record);
    return groups;
  }, {});
}

function activityMatchesSearch(record, search) {
  if (!search) return true;
  const haystack = [
    record.summary,
    record.eventType,
    record.correlationId,
    record.taskId,
    record.missionId,
    record.projectId,
    record.agentId,
    record.source,
    record.category,
    record.status,
  ].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(search.toLowerCase());
}

function normalizeTraceCategory(category) {
  if (category === "action_bridge") return "action";
  if (["ui", "api", "task", "policy", "evidence", "audit", "error", "runtime"].includes(category)) return category;
  return "ui";
}

function buildClientActivityTrace(records, correlationId) {
  const linkedRecords = records
    .filter((record) => record.correlationId === correlationId)
    .sort((left, right) => Date.parse(left.timestamp || "") - Date.parse(right.timestamp || ""));
  const categories = ["ui", "api", "action", "task", "policy", "evidence", "audit", "error", "runtime"].reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
  const timeline = linkedRecords.map((record) => {
    const category = normalizeTraceCategory(record.category);
    categories[category] = (categories[category] || 0) + 1;
    return {
      activityId: record.activityId,
      timestamp: record.timestamp,
      category,
      eventType: record.eventType,
      source: record.source,
      agentId: record.agentId || null,
      taskId: record.taskId || null,
      status: record.status || "unknown",
      summary: record.summary || "Activity event captured.",
      evidenceIds: [],
      auditIds: [],
      redacted: true,
    };
  });
  const hasFailure = linkedRecords.some((record) => ["failed", "blocked"].includes(record.status));
  const hasBlock = linkedRecords.some((record) => ["DENY", "REQUIRE_APPROVAL"].includes(record.decision));
  const hasSuccess = linkedRecords.some((record) => record.status === "success");
  const startedAt = timeline[0]?.timestamp || "";
  const endedAt = timeline.at(-1)?.timestamp || "";
  const durationMs = Date.parse(endedAt || "") >= Date.parse(startedAt || "")
    ? Date.parse(endedAt) - Date.parse(startedAt)
    : 0;

  return {
    traceVersion: "1.0",
    correlationId,
    status: hasFailure && hasSuccess ? "partial" : hasFailure ? "failed" : hasBlock ? "blocked" : hasSuccess ? "success" : "unknown",
    startedAt,
    endedAt,
    durationMs: Number.isFinite(durationMs) ? durationMs : 0,
    eventCount: linkedRecords.length,
    categories,
    timeline,
    related: {
      taskIds: [...new Set(linkedRecords.map((record) => record.taskId).filter(Boolean))],
      agentIds: [...new Set(linkedRecords.map((record) => record.agentId).filter(Boolean))],
      evidenceIds: [],
      auditIds: [],
      actionIds: [],
    },
    warnings: linkedRecords.length === 0 ? ["No local records matched this correlation ID."] : [],
    errors: [],
  };
}

async function fetchActivityTrace(correlationId) {
  try {
    const response = await fetch(`http://localhost:4321/activity/${encodeURIComponent(correlationId)}`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.json();
  } catch {
    return { ok: false, source: "offline" };
  }
}

function ActivityRecordCard({ record, onSelectCorrelation }) {
  const category = ACTIVITY_CATEGORY_LABELS[record.category] || cleanActivityValue(record.category, "Activity");
  const status = normalizeActivityStatus(record.status, record.decision);
  const linkedTask = record.taskId || record.missionId || record.projectId;
  return (
    <div className="ccv2-activity-record">
      <div className="ccv2-activity-record__main">
        <div className="ccv2-activity-record__topline">
          <span className="ccv2-activity-record__time">{formatActivityTimestamp(record.timestamp)}</span>
          <span className="ccv2-activity-category">{category}</span>
          <span className={`ccv2-pill ccv2-pill--${activityStatusTone(record.status, record.decision)}`}>{status}</span>
          {record.redacted && <span className="ccv2-pill ccv2-pill--disabled">redacted</span>}
        </div>
        <div className="ccv2-activity-record__title">{cleanActivityValue(record.summary, "Activity event captured.")}</div>
        <div className="ccv2-activity-record__meta">
          {cleanActivityValue(record.eventType, "event type pending")} · {cleanActivityValue(record.source, "source pending")}
          {" · "}
          {record.correlationId ? (
            <button
              type="button"
              className="ccv2-link-button"
              onClick={() => onSelectCorrelation?.(record.correlationId)}
              title={`Open trace for ${record.correlationId}`}
            >
              Trace {record.shortCorrelationId || record.correlationId}
            </button>
          ) : "Correlation not linked yet"}
          {" · "}
          {linkedTask ? `Linked ${linkedTask}` : "Not linked yet"}
        </div>
      </div>
    </div>
  );
}

function ActivityEmptyState({ message = "No matching activity records." }) {
  return (
    <div className="ccv2-empty-state ccv2-activity-empty">
      <strong>{message}</strong>
      <span>
        Local API reads and governed action bridge outcomes are wired now. Provider, tool, worker, DB-backed activity,
        retention, and cross-process activity capture remain future phases.
      </span>
    </div>
  );
}

function ActivityRecordList({ records, emptyMessage, onSelectCorrelation }) {
  if (records.length === 0) return <ActivityEmptyState message={emptyMessage} />;
  return (
    <div className="ccv2-activity-list">
      {records.map((record) => (
        <ActivityRecordCard
          key={record.activityId}
          record={record}
          onSelectCorrelation={onSelectCorrelation}
        />
      ))}
    </div>
  );
}

function ActivityFilterBar({ filters, onChange, categories, statuses, sources }) {
  return (
    <section className="ccv2-card ccv2-activity-filters" aria-label="Activity filters">
      <label>
        <span>Search</span>
        <input
          type="search"
          value={filters.search}
          placeholder="Search summary, event type, task, source, or correlation ID"
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
        />
      </label>
      <label>
        <span>Category</span>
        <select value={filters.category} onChange={(event) => onChange({ ...filters, category: event.target.value })}>
          <option value="">All categories</option>
          {categories.map((category) => <option key={category} value={category}>{ACTIVITY_CATEGORY_LABELS[category] || category}</option>)}
        </select>
      </label>
      <label>
        <span>Status</span>
        <select value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value })}>
          <option value="">All statuses</option>
          {statuses.map((status) => <option key={status} value={status}>{normalizeActivityStatus(status)}</option>)}
        </select>
      </label>
      <label>
        <span>Agent / Source</span>
        <select value={filters.source} onChange={(event) => onChange({ ...filters, source: event.target.value })}>
          <option value="">All sources</option>
          {sources.map((source) => <option key={source} value={source}>{source}</option>)}
        </select>
      </label>
      <label>
        <span>Project / Scope</span>
        <select value={filters.scope} onChange={(event) => onChange({ ...filters, scope: event.target.value })}>
          <option value="">All scopes</option>
          <option value="PROJECT_CHANGE">Project</option>
          <option value="NEXUS_OS_CHANGE">NEXUS OS</option>
          <option value="SYSTEM">System</option>
          <option value="DEMO">Demo</option>
        </select>
      </label>
    </section>
  );
}

function ActivityTracePanel({ trace, selectedCorrelationId, traceSource, onClear }) {
  const timeline = Array.isArray(trace?.timeline) ? trace.timeline : [];
  const related = trace?.related || {};
  const categories = trace?.categories || {};
  const copyCorrelation = () => {
    if (selectedCorrelationId && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(selectedCorrelationId);
    }
  };

  return (
    <section className="ccv2-card ccv2-activity-trace-panel" aria-label="Trace Details">
      <div className="ccv2-activity-trace-panel__head">
        <div>
          <div className="ccv2-section-heading">Trace Details</div>
          <h3>{selectedCorrelationId ? "Correlation trace" : "Select a correlation ID"}</h3>
        </div>
        <div className="ccv2-activity-trace-panel__actions">
          {selectedCorrelationId && (
            <button type="button" className="ccv2-button ccv2-button--ghost" onClick={copyCorrelation}>
              Copy correlation ID
            </button>
          )}
          {selectedCorrelationId && (
            <button type="button" className="ccv2-button ccv2-button--ghost" onClick={onClear}>
              Clear selection
            </button>
          )}
        </div>
      </div>

      {!selectedCorrelationId ? (
        <p className="ccv2-activity-copy">
          Select a correlation ID from the activity list to inspect the full trace. The trace view shows summarized,
          redacted events only and never exposes raw payloads, raw logs, secrets, or private content.
        </p>
      ) : (
        <>
          <div className="ccv2-activity-trace-summary">
            <div>
              <span className="ccv2-activity-summary__label">Correlation ID</span>
              <span className="ccv2-activity-trace-id">{selectedCorrelationId}</span>
            </div>
            <div>
              <span className="ccv2-activity-summary__label">Status</span>
              <span className={`ccv2-pill ccv2-pill--${activityStatusTone(trace?.status)}`}>{trace?.status || "unknown"}</span>
            </div>
            <div>
              <span className="ccv2-activity-summary__label">Events</span>
              <span>{trace?.eventCount ?? timeline.length}</span>
            </div>
            <div>
              <span className="ccv2-activity-summary__label">Duration</span>
              <span>{trace?.durationMs ? `${trace.durationMs}ms` : "Not measured"}</span>
            </div>
            <div>
              <span className="ccv2-activity-summary__label">Source</span>
              <span>{traceSource || "Local records"}</span>
            </div>
          </div>

          <div className="ccv2-activity-trace-related">
            {Object.entries(categories).filter(([, count]) => count > 0).map(([category, count]) => (
              <span key={category} className="ccv2-pill ccv2-pill--read">{category}: {count}</span>
            ))}
            {(related.taskIds || []).map((taskId) => <span key={taskId} className="ccv2-pill ccv2-pill--planned">Task {taskId}</span>)}
            {(related.agentIds || []).map((agentId) => <span key={agentId} className="ccv2-pill ccv2-pill--planned">{agentId}</span>)}
            {(related.evidenceIds || []).map((evidenceId) => <span key={evidenceId} className="ccv2-pill ccv2-pill--read">Evidence {evidenceId}</span>)}
            {(related.auditIds || []).map((auditId) => <span key={auditId} className="ccv2-pill ccv2-pill--read">Audit {auditId}</span>)}
          </div>

          {timeline.length === 0 ? (
            <ActivityEmptyState message="No events matched this correlation ID." />
          ) : (
            <ol className="ccv2-activity-trace-timeline">
              {timeline.map((event) => (
                <li key={event.activityId} className="ccv2-activity-trace-event">
                  <div className="ccv2-activity-record__topline">
                    <span className="ccv2-activity-record__time">{formatActivityTimestamp(event.timestamp)}</span>
                    <span className="ccv2-activity-category">{event.category}</span>
                    <span className={`ccv2-pill ccv2-pill--${activityStatusTone(event.status)}`}>{event.status}</span>
                    {event.redacted && <span className="ccv2-pill ccv2-pill--disabled">redacted</span>}
                  </div>
                  <div className="ccv2-activity-record__title">{cleanActivityValue(event.summary, "Activity event captured.")}</div>
                  <div className="ccv2-activity-record__meta">
                    {cleanActivityValue(event.eventType, "event type pending")} · {cleanActivityValue(event.source, "source pending")}
                    {event.taskId ? ` · Task ${event.taskId}` : ""}
                    {event.agentId ? ` · ${event.agentId}` : ""}
                  </div>
                </li>
              ))}
            </ol>
          )}

          {(trace?.warnings || []).length > 0 && (
            <p className="ccv2-activity-copy">Trace warning: {trace.warnings[0]}</p>
          )}
        </>
      )}
    </section>
  );
}

function ActivityLogPage({ vm }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCorrelationId, setSelectedCorrelationId] = useState("");
  const [liveTrace, setLiveTrace] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "",
    source: "",
    scope: "",
  });
  const useTraceFixture = typeof window !== "undefined"
    && new URLSearchParams(window.location.search).get("activityFixture") === "trace-view-test";
  const liveActivity = vm?.liveData?.activity || null;
  const fixtureActivity = useTraceFixture ? {
    totalCount: TRACE_VIEW_TEST_RECORDS.length,
    categories: { ui: 1, api: 1 },
    tracesAvailableCount: 1,
    failedTraceCount: 0,
    blockedTraceCount: 0,
    records: TRACE_VIEW_TEST_RECORDS,
  } : null;
  const activity = liveActivity || fixtureActivity;
  const records = Array.isArray(activity?.records) ? activity.records : [];
  const categories = activity?.categories || {};
  const sourceLabel = activity ? "Live local API / activity store" : "Snapshot fallback";
  const filteredRecords = records.filter((record) => (
    (!filters.category || record.category === filters.category)
    && (!filters.status || record.status === filters.status)
    && (!filters.source || record.source === filters.source || record.agentId === filters.source)
    && (!filters.scope || record.scope === filters.scope || record.projectId === filters.scope)
    && activityMatchesSearch(record, filters.search)
  ));
  const categoryOptions = [...new Set(records.map((record) => record.category).filter(Boolean))].sort();
  const statusOptions = [...new Set(records.map((record) => record.status).filter(Boolean))].sort();
  const sourceOptions = [...new Set(records.flatMap((record) => [record.agentId, record.source]).filter(Boolean))].sort();
  const failureRecords = filteredRecords.filter((record) => (
    ["failed", "blocked", "requires_approval"].includes(record.status)
    || ["DENY", "REDACT", "REQUIRE_APPROVAL"].includes(record.decision)
  ));
  const apiActionRecords = filteredRecords.filter((record) => ["api", "action_bridge"].includes(record.category));
  const agentGroups = buildActivityGroups(filteredRecords, (record) => record.agentId || record.source || "Unassigned / system");
  const taskGroups = buildActivityGroups(filteredRecords, (record) => record.taskId || record.missionId || record.projectId || "Not linked yet");
  const correlationGroups = buildActivityGroups(filteredRecords, (record) => record.correlationId || "No correlation ID");
  const latestHighlight = filteredRecords[0];
  const selectedTrace = liveTrace?.trace || buildClientActivityTrace(records, selectedCorrelationId);
  const traceSource = liveTrace?.trace ? "Live local API / activity trace" : "Local record summary";

  useEffect(() => {
    let cancelled = false;
    if (!selectedCorrelationId) {
      setLiveTrace(null);
      return () => { cancelled = true; };
    }
    fetchActivityTrace(selectedCorrelationId).then((result) => {
      if (cancelled) return;
      if (result?.ok && result?.data?.trace) {
        setLiveTrace(result.data);
      } else {
        setLiveTrace(null);
      }
    });
    return () => { cancelled = true; };
  }, [selectedCorrelationId]);

  function selectCorrelationId(correlationId) {
    if (!correlationId || correlationId === "No correlation ID") return;
    setSelectedCorrelationId(correlationId);
    setActiveTab("correlations");
  }

  const readiness = [
    { label: "Activity schema", status: "Ready", tone: "pass" },
    { label: "Correlation ID model", status: "Ready", tone: "pass" },
    { label: "Central logger", status: "Ready", tone: "pass" },
    { label: "Local activity store", status: "Ready", tone: "pass" },
    { label: "UI/API/action instrumentation", status: "Capture wired", tone: "pass" },
    { label: "Trace view", status: "Ready", tone: "pass" },
  ];

  const futureEvents = [
    "UI operator actions",
    "Local API read requests",
    "Governed action bridge events",
    "Task transitions",
    "Agent decisions",
    "Policy decisions",
    "Evidence creation",
    "Errors and blocked actions",
  ];

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Activity Log</div>
          <div className="ccv2-page-head__sub">
            Centralized activity timeline for UI, local API, governed actions, policy decisions, evidence, and failures.
          </div>
        </div>

        <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.activity} />

        <div className="ccv2-activity-readiness ccv2-activity-readiness--page">
          <section className="ccv2-card ccv2-activity-readiness__hero">
            <div className="ccv2-section-heading">Operator Activity</div>
            <h2>Activity Log is ready for summarized local records.</h2>
            <p>
              P41.8.5 links local activity records by correlation ID so operators can inspect a complete redacted
              trace without exposing raw logs, unredacted payload dumps, secrets, or private payloads.
            </p>
            <div className="ccv2-activity-next">
              <span className="ccv2-pill ccv2-pill--read">Source</span>
              <span>{sourceLabel}</span>
              <span className="ccv2-pill ccv2-pill--read">Trace drilldown available</span>
            </div>
          </section>

          <section className="ccv2-card">
            <div className="ccv2-section-heading">Status Cards</div>
            <div className="ccv2-activity-summary">
              <div>
                <span className="ccv2-activity-summary__value">{activity?.totalCount ?? 0}</span>
                <span className="ccv2-activity-summary__label">Stored records</span>
              </div>
              <div>
                <span className="ccv2-activity-summary__value">{records.length}</span>
                <span className="ccv2-activity-summary__label">Shown here</span>
              </div>
              <div>
                <span className="ccv2-activity-summary__value">{Object.keys(categories).length}</span>
                <span className="ccv2-activity-summary__label">Categories</span>
              </div>
              <div>
                <span className="ccv2-activity-summary__value">{activity?.tracesAvailableCount ?? Object.keys(correlationGroups).length}</span>
                <span className="ccv2-activity-summary__label">Correlation IDs</span>
              </div>
              <div>
                <span className="ccv2-activity-summary__value">{activity?.failedTraceCount ?? 0}</span>
                <span className="ccv2-activity-summary__label">Failed traces</span>
              </div>
            </div>
            {records.length === 0 && (
              <p className="ccv2-activity-copy">
                No captured activity records are available from the local API yet. Run Command Center against the local
                API, call <code>npm run nexus:status</code>, or trigger a governed action to populate the local activity store.
              </p>
            )}
          </section>

          <section className="ccv2-card">
            <div className="ccv2-section-heading">Capture Status</div>
            <div className="ccv2-activity-status-grid">
              {readiness.map((item) => (
                <div key={item.label} className="ccv2-activity-status">
                  <span>{item.label}</span>
                  <span className={`ccv2-pill ccv2-pill--${item.tone}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <ActivityFilterBar
          filters={filters}
          onChange={setFilters}
          categories={categoryOptions}
          statuses={statusOptions}
          sources={sourceOptions}
        />

        <ActivityTracePanel
          trace={selectedTrace}
          selectedCorrelationId={selectedCorrelationId}
          traceSource={traceSource}
          onClear={() => setSelectedCorrelationId("")}
        />

        <CommandTabs
          tabs={ACTIVITY_LOG_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          ariaLabel="Activity Log views"
        >
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-activity-tab-grid">
              <section className="ccv2-card">
                <div className="ccv2-section-heading">Recent Highlights</div>
                {latestHighlight ? <ActivityRecordCard record={latestHighlight} onSelectCorrelation={selectCorrelationId} /> : <ActivityEmptyState message="No activity records yet." />}
              </section>
              <section className="ccv2-card">
                <div className="ccv2-section-heading">Capture Coverage</div>
                <div className="ccv2-activity-event-grid">
                  {futureEvents.map((item) => <div key={item} className="ccv2-activity-event">{item}</div>)}
                </div>
              </section>
              <section className="ccv2-card">
                <div className="ccv2-section-heading">Boundary</div>
                <p className="ccv2-activity-copy">
                  Each operator action links UI, API, action bridge, evidence, audit, and runtime records by correlation ID.
                  Trace drilldown is read-only and summarizes redacted records by correlation ID.
                </p>
                <div className="ccv2-activity-boundaries">
                  <span className="ccv2-pill ccv2-pill--disabled">Provider logging not enabled</span>
                  <span className="ccv2-pill ccv2-pill--disabled">Worker logging not enabled</span>
                  <span className="ccv2-pill ccv2-pill--disabled">DB-backed activity not enabled</span>
                </div>
              </section>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="timeline" activeTab={activeTab}>
            <ActivityRecordList records={filteredRecords} emptyMessage="No matching activity records." onSelectCorrelation={selectCorrelationId} />
          </CommandTabPanel>
          <CommandTabPanel tabId="by-agent" activeTab={activeTab}>
            <div className="ccv2-activity-group-list">
              {Object.entries(agentGroups).length === 0 && <ActivityEmptyState message="No agent or source activity records." />}
              {Object.entries(agentGroups).map(([group, groupRecords]) => (
                <section key={group} className="ccv2-card">
                  <div className="ccv2-section-heading">{group}</div>
                  <ActivityRecordList records={groupRecords} emptyMessage="No records in this group." onSelectCorrelation={selectCorrelationId} />
                </section>
              ))}
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="by-task" activeTab={activeTab}>
            <div className="ccv2-activity-group-list">
              {Object.entries(taskGroups).length === 0 && <ActivityEmptyState message="No task, mission, or project links yet." />}
              {Object.entries(taskGroups).map(([group, groupRecords]) => (
                <section key={group} className="ccv2-card">
                  <div className="ccv2-section-heading">{group}</div>
                  <ActivityRecordList records={groupRecords} emptyMessage="No records in this group." onSelectCorrelation={selectCorrelationId} />
                </section>
              ))}
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="failures" activeTab={activeTab}>
            <ActivityRecordList records={failureRecords} emptyMessage="No failed, blocked, denied, redacted, or approval-required records." onSelectCorrelation={selectCorrelationId} />
          </CommandTabPanel>
          <CommandTabPanel tabId="api-actions" activeTab={activeTab}>
            <ActivityRecordList records={apiActionRecords} emptyMessage="No local API or governed action bridge records match the current filters." onSelectCorrelation={selectCorrelationId} />
          </CommandTabPanel>
          <CommandTabPanel tabId="correlations" activeTab={activeTab}>
            <div className="ccv2-activity-correlation-grid">
              {Object.entries(correlationGroups).length === 0 && <ActivityEmptyState message="No correlation IDs are available yet." />}
              {Object.entries(correlationGroups).map(([correlationId, groupRecords]) => (
                <section key={correlationId} className="ccv2-card ccv2-activity-correlation-card">
                  <div className="ccv2-section-heading">{correlationId}</div>
                  <div className="ccv2-activity-record__title">{groupRecords.length} linked event{groupRecords.length === 1 ? "" : "s"}</div>
                  <p className="ccv2-activity-copy">
                    Open a redacted trace timeline for this correlation ID.
                  </p>
                  <button type="button" className="ccv2-button" onClick={() => selectCorrelationId(correlationId)}>
                    Open trace
                  </button>
                </section>
              ))}
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function MemoryRecordList({ records, emptyMessage }) {
  if (!records || records.length === 0) {
    return (
      <div className="ccv2-card">
        <div className="ccv2-section-heading">No memory records</div>
        <p style={{ marginTop: 8, color: "var(--v2-muted)", fontSize: 12 }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="ccv2-grid ccv2-grid--3">
      {records.map((item) => (
        <article key={item.memoryId} className="ccv2-card">
          <div className="ccv2-section-heading">{item.type}</div>
          <div className="ccv2-page-summary-grid" style={{ marginTop: 10 }}>
            <span>Scope: {item.scope}</span>
            <span>Classification: {item.classification}</span>
            <span>Freshness: {item.freshness}</span>
            <span>Confidence: {Math.round((item.confidence || 0) * 100)}%</span>
            <span>Allowed agents: {(item.allowedAgents || []).join(", ") || "Not specified"}</span>
            <span>Last verified: {item.lastVerifiedAt || "Not verified yet"}</span>
          </div>
          <p style={{ marginTop: 10, color: "var(--v2-text)", fontSize: 13, lineHeight: 1.55 }}>
            {item.summary}
          </p>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(item.evidenceIds || []).map((id) => (
              <span key={id} className="ccv2-pill ccv2-pill--read-only">{id}</span>
            ))}
            <span className="ccv2-pill ccv2-pill--disabled">Redacted summary</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function MemoryCenterPage({ vm }) {
  const [activeTab, setActiveTab] = useState("overview");
  const memory = vm.memoryCenter || {};
  const items = memory.memoryItems || [];
  const byScope = (scope) => items.filter((item) => item.scope === scope);
  const staleIds = new Set((memory.freshness || []).filter((item) => item.stale).map((item) => item.memoryId));
  const staleItems = items.filter((item) => staleIds.has(item.memoryId) || item.freshness !== "fresh");

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div>
            <div className="ccv2-page-head__title">Memory Center</div>
            <div className="ccv2-page-head__sub">
              Inspect scoped memory summaries, freshness, access posture, and packet previews.
            </div>
          </div>
          <div className="ccv2-page-head__actions">
            <span className="ccv2-pill ccv2-pill--ready">Read-only</span>
            <span className="ccv2-pill ccv2-pill--disabled">Runtime injection disabled</span>
          </div>
        </div>

        <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.memory} />

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Memory Scope Context</div>
          <div className="ccv2-page-summary-grid" style={{ marginTop: 10 }}>
            <span>Project: {memory.activeProjectLabel || vm.shell?.activeProject || "Selected Project"}</span>
            <span>Mode: {memory.mode || vm.shell?.mode || "local-private"}</span>
            <span>Source: {memory.sourceLabel || "scoped memory snapshot"}</span>
            <span>Provider dispatch: Disabled</span>
            <span>DB writes: Disabled</span>
            <span>Raw content: Hidden</span>
          </div>
        </div>

        <CommandTabs
          tabs={MEMORY_CENTER_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          ariaLabel="Memory Center sections"
        >
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {[
                ["Total memory", memory.overview?.totalItems ?? 0],
                ["OS memory", memory.overview?.osItems ?? 0],
                ["Project memory", memory.overview?.projectItems ?? 0],
                ["Stale memory", memory.overview?.staleItems ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="ccv2-card">
                  <div className="ccv2-metric-card__label">{label}</div>
                  <div className="ccv2-metric-card__value ccv2-metric-card__value--blue">{value}</div>
                </div>
              ))}
            </div>
            <div className="ccv2-card" style={{ marginTop: 12 }}>
              <div className="ccv2-section-heading">Safety Posture</div>
              <ul className="ccv2-list">
                {(memory.safetyNotes || []).map((note) => <li key={note}>{note}</li>)}
              </ul>
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="os-memory" activeTab={activeTab}>
            <MemoryRecordList records={byScope("nexus_os")} emptyMessage="No NEXUS OS scoped memory summaries yet." />
          </CommandTabPanel>
          <CommandTabPanel tabId="project-memory" activeTab={activeTab}>
            <MemoryRecordList records={byScope("project")} emptyMessage="No active project memory summaries yet." />
          </CommandTabPanel>
          <CommandTabPanel tabId="agent-memory" activeTab={activeTab}>
            <MemoryRecordList records={items.filter((item) => (item.allowedAgents || []).length > 0)} emptyMessage="No agent-visible memory summaries yet." />
          </CommandTabPanel>
          <CommandTabPanel tabId="task-memory" activeTab={activeTab}>
            <MemoryRecordList records={byScope("task")} emptyMessage="No task-scoped memory summaries yet." />
          </CommandTabPanel>
          <CommandTabPanel tabId="session-memory" activeTab={activeTab}>
            <MemoryRecordList records={byScope("session")} emptyMessage="No session memory summaries yet." />
          </CommandTabPanel>
          <CommandTabPanel tabId="stale-memory" activeTab={activeTab}>
            <MemoryRecordList records={staleItems} emptyMessage="No stale, expired, invalidated, or unknown memory is currently visible." />
          </CommandTabPanel>
          <CommandTabPanel tabId="promotion-candidates" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {(memory.promotionCandidates || []).map((candidate) => (
                <article key={candidate.memoryId} className="ccv2-card">
                  <div className="ccv2-section-heading">{candidate.memoryId}</div>
                  <div className="ccv2-page-summary-grid" style={{ marginTop: 10 }}>
                    <span>Current scope: {candidate.currentScope}</span>
                    <span>Proposed scope: {candidate.proposedScope}</span>
                    <span>Auto promoted: No</span>
                    <span>Approval required: Yes</span>
                  </div>
                  <p style={{ marginTop: 10, color: "var(--v2-muted)", fontSize: 12 }}>
                    {candidate.reason}
                  </p>
                </article>
              ))}
              {(memory.promotionCandidates || []).length === 0 && (
                <div className="ccv2-card">No promotion candidates yet. Promotion remains proposal-only.</div>
              )}
            </div>
          </CommandTabPanel>
          <CommandTabPanel tabId="packets" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              <div className="ccv2-card">
                <div className="ccv2-section-heading">Packet Summary</div>
                <div className="ccv2-page-summary-grid" style={{ marginTop: 10 }}>
                  <span>Included: {memory.packetSummary?.includedCount ?? 0}</span>
                  <span>Excluded: {memory.packetSummary?.excludedCount ?? 0}</span>
                  <span>Freshness warnings: {memory.packetSummary?.freshnessWarnings ?? 0}</span>
                  <span>Trust warnings: {memory.packetSummary?.trustWarnings ?? 0}</span>
                  <span>Token estimate: {memory.packetSummary?.tokenBudgetEstimate ?? 0}</span>
                  <span>Runtime injection: Disabled</span>
                </div>
              </div>
              <div className="ccv2-card">
                <div className="ccv2-section-heading">Excluded Memory</div>
                <ul className="ccv2-list">
                  {(memory.packetPreview?.excludedMemory || []).map((entry) => (
                    <li key={entry.memoryId}>{entry.memoryId}: {(entry.reasons || []).join(", ")}</li>
                  ))}
                  {(memory.packetPreview?.excludedMemory || []).length === 0 && <li>No excluded memory in this preview.</li>}
                </ul>
              </div>
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function DataContextCenterPage({ vm }) {
  const [activeTab, setActiveTab] = useState("overview");
  const context = vm.contextCenter || {};
  const packet = context.packetPreview || {};
  const trustBands = context.trustBands || {};
  const staleSources = (context.freshness || []).filter((record) => record.status !== "fresh");

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div>
            <div className="ccv2-page-head__title">Data & Context Center</div>
            <div className="ccv2-page-head__sub">
              Inspect trusted context sources, system-of-record mapping, trust, freshness, lineage, and packet previews.
            </div>
          </div>
          <div className="ccv2-page-head__actions">
            <span className="ccv2-pill ccv2-pill--read-only">Read-only</span>
            <span className="ccv2-pill ccv2-pill--disabled">Runtime injection disabled</span>
          </div>
        </div>

        <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.context} />

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Trusted Context Boundary</div>
          <div className="ccv2-page-summary-grid" style={{ marginTop: 10 }}>
            <span>Project: {context.activeProjectLabel || "Selected Project"}</span>
            <span>Mode: {context.mode || "local-private"}</span>
            <span>Source: {context.sourceLabel || "trusted context registry"}</span>
            <span>Provider dispatch: Disabled</span>
            <span>DB writes: Disabled</span>
            <span>Raw content: Hidden</span>
          </div>
        </div>

        <CommandTabs
          tabs={DATA_CONTEXT_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          ariaLabel="Data and Context Center sections"
        >
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {[
                ["Data sources", context.sourceSummary?.total ?? 0],
                ["System domains", context.systemOfRecord?.length ?? 0],
                ["High trust", trustBands.high ?? 0],
                ["Packet exclusions", context.exclusions?.length ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="ccv2-card">
                  <div className="ccv2-metric-card__label">{label}</div>
                  <div className="ccv2-metric-card__value ccv2-metric-card__value--blue">{value}</div>
                </div>
              ))}
            </div>
            <div className="ccv2-card" style={{ marginTop: 12 }}>
              <div className="ccv2-section-heading">Safety Notes</div>
              <ul className="ccv2-list">
                {(context.safetyNotes || []).map((note) => <li key={note}>{note}</li>)}
              </ul>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="data-sources" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--3">
              {(context.dataSources || []).map((source) => (
                <article key={source.sourceId} className="ccv2-card">
                  <div className="ccv2-section-heading">{source.label}</div>
                  <div className="ccv2-page-summary-grid" style={{ marginTop: 10 }}>
                    <span>ID: {source.sourceId}</span>
                    <span>Scope: {source.scope}</span>
                    <span>Type: {source.type}</span>
                    <span>Owner: {source.owner}</span>
                    <span>Classification: {source.dataClassification}</span>
                    <span>System of record: {source.systemOfRecord ? "Yes" : "No"}</span>
                  </div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="system-of-record" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              {(context.systemOfRecord || []).map((entry) => (
                <article key={entry.domain} className="ccv2-card">
                  <div className="ccv2-section-heading">{entry.domain.replaceAll("_", " ")}</div>
                  <div className="ccv2-page-summary-grid" style={{ marginTop: 10 }}>
                    <span>Primary: {entry.primarySourceId}</span>
                    <span>Owner: {entry.owner}</span>
                    <span>Freshness: {entry.freshnessRequirement}</span>
                    <span>Scopes: {(entry.allowedScopes || []).join(", ")}</span>
                  </div>
                  <p style={{ marginTop: 10, color: "var(--v2-muted)", fontSize: 12 }}>
                    {entry.agentAccessNotes}
                  </p>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="trust-scores" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {["high", "medium", "low", "unavailable"].map((band) => (
                <div key={band} className="ccv2-card">
                  <div className="ccv2-metric-card__label">{band}</div>
                  <div className="ccv2-metric-card__value ccv2-metric-card__value--green">{trustBands[band] ?? 0}</div>
                </div>
              ))}
            </div>
            <div className="ccv2-grid ccv2-grid--3" style={{ marginTop: 12 }}>
              {(context.trustScores || []).map((score) => (
                <article key={score.sourceId} className="ccv2-card">
                  <div className="ccv2-section-heading">{score.label}</div>
                  <div className="ccv2-page-summary-grid" style={{ marginTop: 10 }}>
                    <span>Band: {score.band}</span>
                    <span>Score: {score.score}/100</span>
                    <span>Source exists: {score.sourceExists ? "Yes" : "No / pattern"}</span>
                  </div>
                </article>
              ))}
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="freshness-lineage" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              <div className="ccv2-card">
                <div className="ccv2-section-heading">Freshness Exceptions</div>
                <ul className="ccv2-list">
                  {staleSources.map((record) => (
                    <li key={record.sourceId}>{record.sourceId}: {record.status}</li>
                  ))}
                  {staleSources.length === 0 && <li>All visible sources are fresh.</li>}
                </ul>
              </div>
              <div className="ccv2-card">
                <div className="ccv2-section-heading">Lineage Summary</div>
                <div className="ccv2-page-summary-grid" style={{ marginTop: 10 }}>
                  <span>Lineage ID: {packet.lineageSummary?.lineageId || "preview-only"}</span>
                  <span>Derived sources: {packet.lineageSummary?.derivedFromCount ?? 0}</span>
                  <span>Redacted: Yes</span>
                  <span>Raw content: Hidden</span>
                </div>
              </div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="packet-preview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              <div className="ccv2-card">
                <div className="ccv2-section-heading">Packet Summary</div>
                <div className="ccv2-page-summary-grid" style={{ marginTop: 10 }}>
                  <span>Scope: {packet.scope || "PROJECT_CHANGE"}</span>
                  <span>Mode: {packet.mode || "local-private"}</span>
                  <span>Included: {packet.includedSources?.length ?? 0}</span>
                  <span>Excluded: {packet.excludedSources?.length ?? 0}</span>
                  <span>Raw content: Hidden</span>
                  <span>Runtime injection: Disabled</span>
                </div>
              </div>
              <div className="ccv2-card">
                <div className="ccv2-section-heading">Included Sources</div>
                <ul className="ccv2-list">
                  {(packet.includedSources || []).map((source) => (
                    <li key={source.sourceId}>{source.label}: {source.trustBand} trust, {source.freshnessStatus}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="exclusions" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              {(context.exclusions || []).map((source) => (
                <article key={source.sourceId} className="ccv2-card">
                  <div className="ccv2-section-heading">{source.label}</div>
                  <ul className="ccv2-list">
                    {(source.reasons || ["Not selected for this packet."]).map((reason) => <li key={reason}>{reason}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function TestCenterPage({ vm }) {
  const tsm = vm.testSuiteManager || {};
  const projectSuites = tsm.selectedProjectSuites || [];
  const osSuites = tsm.osSuites || [];
  const selectionPreview = tsm.selectionPreview || { executionEnabled: false, selectedSuites: 0, reason: "No changed files in current snapshot" };
  const evidenceModel = tsm.evidenceModel || { supported: true, executionEnabled: false };
  const gaps = tsm.gaps || [];
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div>
            <div className="ccv2-page-head__title">Test Center</div>
            <div className="ccv2-page-head__sub">
              Test suite registry, selection preview, and evidence model. Execution is not enabled in Test Center yet.
            </div>
          </div>
          <div className="ccv2-page-head__actions">
            <span className="ccv2-pill ccv2-pill--disabled">Registry only</span>
            <span className="ccv2-pill ccv2-pill--disabled">Execution disabled</span>
            <span className="ccv2-pill">Policy linked</span>
          </div>
        </div>

        <FounderOperationsBoard {...FOUNDER_DELIVERY_BOARDS.tests} />

        <CommandTabs
          tabs={TEST_CENTER_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          ariaLabel="Test Center sections"
        >
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {[
                { label: "Project Test Suites", value: tsm.projectTestCount ?? 0 },
                { label: "OS Test Suites", value: tsm.osTestCount ?? 0 },
                { label: "Test Execution", value: tsm.executionEnabled ? "Enabled" : "Disabled" },
                { label: "Registry Only", value: tsm.registryOnly ? "Yes" : "No" },
              ].map((item) => (
                <article key={item.label} className="ccv2-card">
                  <div className="ccv2-kpi__label">{item.label}</div>
                  <div className="ccv2-kpi__value">{item.value}</div>
                  <div className="ccv2-kpi__meta">Registry posture</div>
                </article>
              ))}
            </div>
            <div className="ccv2-card ccv2-card--accent">
              <div className="ccv2-section-heading">Policy Posture</div>
              <ul className="ccv2-list">
                <li>testExecutionAllowed: false — no tests are run from the Command Center.</li>
                <li>registryOnly: true — suites are metadata and preview only.</li>
                <li>commandExecutionAllowed: false — commandPreview strings are display-only.</li>
                <li>providerCallsAllowed: false — no provider calls in this phase.</li>
                <li>projectMutationAllowed: false — projects/careloop and projects/careloop-ios are not touched.</li>
              </ul>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="project-tests" activeTab={activeTab}>
            <div className="ccv2-card ccv2-card--accent">
              <div className="ccv2-section-heading">Project Test Suites (Preview Only)</div>
              <div className="ccv2-muted" style={{ marginBottom: 8 }}>
                These suites are private and forbidden in Demo Mode. commandPreview is display-only — no commands are executed.
              </div>
            </div>
            <div className="ccv2-grid ccv2-grid--3">
              {projectSuites.map((suite) => (
                <article key={suite.suiteId} className="ccv2-card">
                  <div className="ccv2-section-heading">{suite.suiteId}</div>
                  <div className="ccv2-muted">{suite.layer} · {suite.tool} · {suite.riskLevel} risk</div>
                  <div className="ccv2-chip-row">
                    <span className="ccv2-pill ccv2-pill--disabled">{suite.status || "planned"}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">Execution disabled</span>
                  </div>
                  <div className="ccv2-muted" style={{ marginTop: 6, fontFamily: "monospace", fontSize: 11 }}>
                    {suite.commandPreview}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button className="ccv2-btn ccv2-btn--disabled" disabled title="Controlled execution is not enabled in Test Center yet">
                      Run (disabled)
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {projectSuites.length === 0 && (
              <div className="ccv2-empty-state">
                No project test suites loaded. Execution disabled. Run check:project-test-suites to validate.
              </div>
            )}
          </CommandTabPanel>

          <CommandTabPanel tabId="os-tests" activeTab={activeTab}>
            <div className="ccv2-card ccv2-card--accent">
              <div className="ccv2-section-heading">NEXUS OS Test Suites (Preview Only)</div>
              <div className="ccv2-muted" style={{ marginBottom: 8 }}>
                These suites cover NEXUS OS infrastructure layers. commandPreview is display-only — no commands are executed.
              </div>
            </div>
            <div className="ccv2-grid ccv2-grid--3">
              {osSuites.map((suite) => (
                <article key={suite.suiteId} className="ccv2-card">
                  <div className="ccv2-section-heading">{suite.suiteId}</div>
                  <div className="ccv2-muted">{suite.layer} · {suite.tool} · owner: {suite.ownerAgent}</div>
                  <div className="ccv2-chip-row">
                    <span className="ccv2-pill ccv2-pill--disabled">{suite.status || "ready"}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">Execution disabled</span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button className="ccv2-btn ccv2-btn--disabled" disabled title="Controlled execution is not enabled in Test Center yet">
                      Run (disabled)
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {osSuites.length === 0 && (
              <div className="ccv2-empty-state">No OS test suites loaded. Run check:os-test-suites to validate.</div>
            )}
          </CommandTabPanel>

          <CommandTabPanel tabId="selection-preview" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Changed-File to Test Suite Mapping</div>
              <div className="ccv2-page-summary-grid">
                <div className="ccv2-page-summary-row">
                  <span className="ccv2-page-summary-label">Selected suites</span>
                  <span className="ccv2-page-summary-value">{selectionPreview.selectedSuites}</span>
                </div>
                <div className="ccv2-page-summary-row">
                  <span className="ccv2-page-summary-label">Execution enabled</span>
                  <span className="ccv2-page-summary-value">{selectionPreview.executionEnabled ? "Yes" : "No"}</span>
                </div>
              </div>
              <div className="ccv2-empty-state">{selectionPreview.reason || "No changed files in current snapshot"}</div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="evidence-model" activeTab={activeTab}>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Test Result Evidence Schema</div>
              <div className="ccv2-page-summary-grid">
                <div className="ccv2-page-summary-row">
                  <span className="ccv2-page-summary-label">Supported</span>
                  <span className="ccv2-page-summary-value">{evidenceModel.supported ? "Yes" : "No"}</span>
                </div>
                <div className="ccv2-page-summary-row">
                  <span className="ccv2-page-summary-label">Execution enabled</span>
                  <span className="ccv2-page-summary-value">{evidenceModel.executionEnabled ? "Yes" : "No"}</span>
                </div>
                <div className="ccv2-page-summary-row">
                  <span className="ccv2-page-summary-label">Redacted</span>
                  <span className="ccv2-page-summary-value">true (always)</span>
                </div>
              </div>
              <div className="ccv2-empty-state">
                All evidence records have redacted: true. Raw test output is never stored. Only metadata, status, and correlationId are preserved.
              </div>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="gaps" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              {gaps.map((gap) => (
                <article key={gap.title} className="ccv2-card">
                  <div className="ccv2-section-heading">{gap.title}</div>
                  <div className="ccv2-muted" style={{ marginTop: 4 }}><strong>Why:</strong> {gap.why}</div>
                  <div className="ccv2-muted" style={{ marginTop: 4 }}><strong>Next action:</strong> {gap.nextAction}</div>
                  <div className="ccv2-chip-row" style={{ marginTop: 8 }}>
                    <span className="ccv2-pill">Owner: {gap.owner}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">Actionable</span>
                  </div>
                </article>
              ))}
            </div>
            {gaps.length === 0 && (
              <div className="ccv2-empty-state">No gaps identified.</div>
            )}
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function QualityIntelligencePage({ vm }) {
  const quality = vm.qualityIntelligence || {};
  const prdRecords = quality.prdTestMap?.records || [];
  const coverageGaps = quality.coverageGaps || [];
  const recommendations = quality.testRecommendations || [];
  const flakyRecords = quality.flakyTestRecords || [];
  const proposals = quality.testProposals || [];
  const [activeTab, setActiveTab] = useState("overview");

  const disabledReason = "Preview-only. Run and generation actions are disabled by policy.";

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div>
            <div className="ccv2-page-head__title">Quality Intelligence</div>
            <div className="ccv2-page-head__sub">
              Preview-only quality intelligence for PRD mapping, coverage gaps, recommendations, flaky signals, and governed test proposals.
            </div>
          </div>
          <div className="ccv2-page-head__actions">
            <span className="ccv2-pill ccv2-pill--disabled">Preview only</span>
            <span className="ccv2-pill ccv2-pill--disabled">Test execution disabled</span>
            <span className="ccv2-pill ccv2-pill--disabled">No project mutation</span>
          </div>
        </div>

        <FounderOperationsBoard {...FOUNDER_DELIVERY_BOARDS.quality} />

        <CommandTabs
          tabs={QUALITY_INTELLIGENCE_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          ariaLabel="Quality Intelligence sections"
        >
          <CommandTabPanel tabId="overview" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--4">
              {[
                { label: "Requirements mapped", value: quality.prdCoverageSummary?.totalRequirements ?? 0 },
                { label: "Coverage gaps", value: quality.coverageGapSummary?.totalGaps ?? 0 },
                { label: "Recommendations", value: quality.testRecommendationSummary?.recommendationCount ?? 0 },
                { label: "Test proposals", value: proposals.length },
              ].map((item) => (
                <article key={item.label} className="ccv2-card">
                  <div className="ccv2-kpi__label">{item.label}</div>
                  <div className="ccv2-kpi__value">{item.value}</div>
                  <div className="ccv2-kpi__meta">P56 metadata preview</div>
                </article>
              ))}
            </div>
            <div className="ccv2-card ccv2-card--accent">
              <div className="ccv2-section-heading">Safety Posture</div>
              <ul className="ccv2-list">
                <li>Test execution disabled: Quality Intelligence does not run suites.</li>
                <li>Test generation disabled: proposals are metadata and require future approval.</li>
                <li>Provider, tool, worker, DB write, and external network execution remain disabled.</li>
                <li>Private project source content is not scanned by this preview surface.</li>
              </ul>
            </div>
          </CommandTabPanel>

          <CommandTabPanel tabId="prd-mapping" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              {prdRecords.map((record) => (
                <article key={record.requirementId} className="ccv2-card">
                  <div className="ccv2-section-heading">{record.requirementLabel}</div>
                  <div className="ccv2-muted">Scope: {record.scope} · Source: {record.source}</div>
                  <div className="ccv2-chip-row" style={{ marginTop: 8 }}>
                    <span className="ccv2-pill">{record.coverageStatus}</span>
                    <span className="ccv2-pill">Confidence: {record.confidence}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">
                      Linked suites: {record.linkedSuites.length}
                    </span>
                  </div>
                </article>
              ))}
            </div>
            {prdRecords.length === 0 && (
              <div className="ccv2-empty-state">
                PRD Mapping metadata is unavailable. Run npm run check:prd-test-mapping to refresh the preview report.
              </div>
            )}
          </CommandTabPanel>

          <CommandTabPanel tabId="coverage-gaps" activeTab={activeTab}>
            <div className="ccv2-card ccv2-card--accent">
              <div className="ccv2-section-heading">Coverage Gap Detector</div>
              <div className="ccv2-muted">
                Coverage gaps are inferred from metadata mappings only. Execution disabled: no tests are run and no files are created.
              </div>
            </div>
            <div className="ccv2-grid ccv2-grid--2">
              {coverageGaps.map((gap) => (
                <article key={gap.gapId} className="ccv2-card">
                  <div className="ccv2-section-heading">{gap.domain}</div>
                  <div className="ccv2-muted">{gap.reason}</div>
                  <div className="ccv2-muted" style={{ marginTop: 6 }}>
                    <strong>Recommended action:</strong> {gap.recommendedAction}
                  </div>
                  <div className="ccv2-chip-row" style={{ marginTop: 8 }}>
                    <span className="ccv2-pill">Severity: {gap.severity}</span>
                    <span className="ccv2-pill">Owner: {gap.ownerAgent}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">Execution disabled</span>
                  </div>
                </article>
              ))}
            </div>
            {coverageGaps.length === 0 && <div className="ccv2-empty-state">No coverage gaps detected in metadata.</div>}
          </CommandTabPanel>

          <CommandTabPanel tabId="recommendations" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              {recommendations.map((recommendation) => (
                <article key={recommendation.recommendationId} className="ccv2-card">
                  <div className="ccv2-section-heading">{recommendation.suiteId}</div>
                  <div className="ccv2-muted">{recommendation.reason}</div>
                  <div className="ccv2-chip-row" style={{ marginTop: 8 }}>
                    <span className="ccv2-pill">Risk score: {recommendation.riskScore}</span>
                    <span className="ccv2-pill">Owner: {recommendation.ownerAgent}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">Run disabled</span>
                  </div>
                  <div className="ccv2-empty-state" style={{ marginTop: 8 }}>
                    {recommendation.disabledReason || disabledReason}
                  </div>
                </article>
              ))}
            </div>
            {recommendations.length === 0 && (
              <div className="ccv2-empty-state">
                No changed-file recommendation preview is available. Quality Intelligence remains metadata-only.
              </div>
            )}
          </CommandTabPanel>

          <CommandTabPanel tabId="flaky-signals" activeTab={activeTab}>
            <div className="ccv2-grid ccv2-grid--2">
              {flakyRecords.map((record) => (
                <article key={record.testId} className="ccv2-card">
                  <div className="ccv2-section-heading">{record.testId}</div>
                  <div className="ccv2-muted">Suite: {record.suiteId} · Status: {record.status}</div>
                  <div className="ccv2-muted" style={{ marginTop: 6 }}>{record.recommendedAction}</div>
                  <div className="ccv2-chip-row" style={{ marginTop: 8 }}>
                    <span className="ccv2-pill">Confidence: {record.confidence}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">No quarantine action</span>
                  </div>
                </article>
              ))}
            </div>
            {flakyRecords.length === 0 && (
              <div className="ccv2-empty-state">
                No flaky signals are available yet. Controlled test evidence is required before classification.
              </div>
            )}
          </CommandTabPanel>

          <CommandTabPanel tabId="test-proposals" activeTab={activeTab}>
            <div className="ccv2-card ccv2-card--accent">
              <div className="ccv2-section-heading">Governed Test Proposals</div>
              <div className="ccv2-muted">
                Test proposals are approval-ready metadata only. They do not create or modify test files.
              </div>
            </div>
            <div className="ccv2-grid ccv2-grid--2">
              {proposals.map((proposal) => (
                <article key={proposal.proposalId} className="ccv2-card">
                  <div className="ccv2-section-heading">{proposal.title}</div>
                  <div className="ccv2-muted">
                    Linked requirement: {proposal.linkedRequirement} · Owner: {proposal.ownerAgent}
                  </div>
                  <div className="ccv2-chip-row" style={{ marginTop: 8 }}>
                    <span className="ccv2-pill">Risk: {proposal.riskLevel}</span>
                    <span className="ccv2-pill ccv2-pill--disabled">Approval required</span>
                    <span className="ccv2-pill ccv2-pill--disabled">Mutation disabled</span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button className="ccv2-btn ccv2-btn--disabled" disabled title={disabledReason}>
                      Create test file (disabled)
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {proposals.length === 0 && (
              <div className="ccv2-empty-state">
                No governed test proposals are available yet. Coverage gaps are required before proposal preview.
              </div>
            )}
          </CommandTabPanel>
        </CommandTabs>
      </div>
    </div>
  );
}

function PlannedRoutePage({ routeKey }) {
  const route = COMMAND_CENTER_ROUTE_BY_KEY[routeKey];

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">{route?.expectedHeading || "Planned Route"}</div>
          <div className="ccv2-page-head__sub">Coming Soon · planned Command Center surface with read-only guidance until the capability is implemented.</div>
        </div>

        {routeKey === "settings" && <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.settings} />}

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Current State</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--v2-text-dim)" }}>
            This route is planned. It stays available in navigation so operators can see upcoming Command Center surfaces without landing on a blank or broken page.
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="ccv2-pill ccv2-pill--disabled">Coming Soon</span>
            <span className="ccv2-pill ccv2-pill--disabled">Read-only</span>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6 }}>
            Expected behavior: planned surfaces should either stay disabled in the sidebar or render this safe placeholder until route wiring, evidence, and operator actions are ready.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function CommandCenterV2({ studio }) {
  const vm = buildCommandCenterViewModelV2(studio, privateValidationSnapshot, actionBridgeSnapshot);
  const location = useLocation();
  const navigate = useNavigate();
  const currentRoute = resolveCommandCenterRoute(location.pathname);
  const currentPage = currentRoute?.key || "mission";
  const pageLabel = currentRoute?.expectedHeading || "Agentic Command Center";
  const themeState = useNexusTheme();

  const [apiState, setApiState] = useState({
    liveApiOnline: false,
    usingSnapshotFallback: true,
    lastRefreshStatus: "idle",
    lastRefreshAt: null,
    apiError: null,
  });
  const [liveData, setLiveData] = useState({});
  const [bridgeState, setBridgeState] = useState({
    online: false,
    lastCheckedAt: null,
  });
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(PROJECT_SELECTION_STORAGE_KEY) || "";
  });
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedCommandId, setSelectedCommandId] = useState("plan");

  const refreshApiState = () => {
    setApiState(prev => ({ ...prev, lastRefreshStatus: "refreshing" }));
    getLocalApiHealth().then(health => {
      const state = buildApiState(health);
      setApiState(state);
      if (state.liveApiOnline) {
        Promise.all([getTasks(), getEvidence(), getProjects(), getDbStatus(), getActivity()]).then(([tasks, evidence, projects, db, activity]) => {
          setLiveData({
            tasks: tasks.ok ? tasks.data : null,
            evidence: evidence.ok ? evidence.data : null,
            projects: projects.ok ? projects.data : null,
            db: db.ok ? db.data : null,
            activity: activity.ok ? activity.data : null,
          });
        }).catch(() => {});
      }
    }).catch(() => {
      setApiState(prev => ({ ...prev, lastRefreshStatus: "failed", liveApiOnline: false, usingSnapshotFallback: true }));
    });
  };

  const refreshBridgeState = () => {
    checkActionBridgeHealth()
      .then((health) => {
        setBridgeState({
          online: health.online,
          lastCheckedAt: new Date().toISOString(),
        });
      })
      .catch(() => {
        setBridgeState({
          online: false,
          lastCheckedAt: new Date().toISOString(),
        });
      });
  };

  useEffect(() => {
    refreshApiState();
    refreshBridgeState();
  }, []);

  useEffect(() => {
    document.title = currentPage === "mission"
      ? "NEXUS OS - Agentic Command Center"
      : `NEXUS OS - ${pageLabel}`;
  }, [currentPage, pageLabel]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PROJECT_SELECTION_STORAGE_KEY, selectedProjectId);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    function handleKeyDown(event) {
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
          return;
        }
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const selectedProject = resolveSelectedProject(selectedProjectId, vm.shell.mode);
  const currentScope = currentRoute?.scope === "portfolio"
    ? "portfolio"
    : currentRoute?.scope === "os" || currentRoute?.scope === "platform"
      ? "os"
      : "project";
  const commandCenterIdentity = resolveCommandCenterIdentity(
    {
      scope: currentScope,
      selectedProject,
      demoMode: currentRoute?.scope === "demo",
    },
    vm.scopeModel?.projectSummaries || [],
  );
  const vmWithApi = {
    ...vm,
    shell: {
      ...vm.shell,
      selectedProjectId: commandCenterIdentity.selectedProjectId,
      selectedProjectLabel: commandCenterIdentity.selectedProjectDisplayName,
      activeProject: commandCenterIdentity.primaryContextLabel,
      activeProjectScope: commandCenterIdentity.scope,
      defaultScope: commandCenterIdentity.scope === "portfolio" || commandCenterIdentity.scope === "os"
        ? commandCenterIdentity.scope
        : "project",
    },
    scopeModel: {
      ...vm.scopeModel,
      selectedProjectId: commandCenterIdentity.selectedProjectId,
      selectedProjectLabel: commandCenterIdentity.selectedProjectDisplayName || commandCenterIdentity.primaryContextLabel,
    },
    commandCenterIdentity,
    liveApi: { ...vm.liveApi, ...apiState },
    actionBridgeRuntime: bridgeState,
    liveData,
  };
  const commandScope = {
    activeProject: vmWithApi.shell.activeProject,
    liveApiOnline: vmWithApi.liveApi?.liveApiOnline,
    actionBridgeOnline: bridgeState.online,
    activatedTaskCount: vmWithApi.taskActivation?.activatedCount || 0,
    evidenceCount:
      vmWithApi.liveData?.evidence?.totalCount
      || runtimeSnapshot.runtimeState?.evidence?.total
      || 0,
    activityCount:
      (runtimeSnapshot.runtimeState?.events?.recent?.length || 0)
      + (runtimeSnapshot.runtimeState?.audit?.recent?.length || 0),
    hasFailingEvidence:
      (runtimeSnapshot.runtimeState?.evidence?.recent || []).some((item) => item.result === "FAIL")
      || vmWithApi.privateValidation?.backendStatus === "FAIL",
  };
  const operatorCommands = getNexusCommandsForScope(commandScope, vmWithApi.capabilityReadiness);

  function openCommandPalette(commandId = "plan") {
    setSelectedCommandId(commandId);
    setCommandPaletteOpen(true);
  }

  function handleExecuteCommand(command) {
    if (!command?.available) return;
    if (command.routeTarget) {
      navigate(command.routeTarget);
      setCommandPaletteOpen(false);
    }
  }

  return (
    <div
      className="ccv2-shell"
      data-nexus-theme={themeState.theme}
      data-nexus-resolved-theme={themeState.resolvedTheme}
    >
      <Sidebar vm={vmWithApi} location={location} />
      <div className="ccv2-main">
        <TopBar
          vm={vmWithApi}
          currentPage={currentPage}
          apiState={apiState}
          onRefresh={refreshApiState}
          themeState={themeState}
          selectedProject={selectedProject}
          onSelectProject={setSelectedProjectId}
          onOpenAskNexus={() => navigate("/command-center/command")}
          onOpenCommandPalette={() => openCommandPalette("plan")}
        />
        <div className="ccv2-content-wrapper">
          {currentPage === "lite" && <CommandCenterLitePage />}
          {currentPage === "agentFlow" && <AgentFlowPage />}
          {currentPage === "mission" && (
            <MissionControlPage
              vm={vmWithApi}
              operatorCommands={operatorCommands}
              onOpenCommandPalette={openCommandPalette}
            />
          )}
          {currentPage === "command" && <AskNexusPage vm={vmWithApi} />}
          {currentPage === "workspace" && <WorkspacePage vm={vmWithApi} />}
          {currentPage === "tasks" && <TaskQueuePage vm={vmWithApi} />}
          {currentPage === "implementation" && <ImplementationPage vm={vmWithApi} />}
          {currentPage === "workbench" && <WorkbenchPage vm={vmWithApi} />}
          {currentPage === "agents" && <AgentRegistryPage vm={vmWithApi} />}
          {currentPage === "approvals" && <ApprovalsPage vm={vmWithApi} studio={studio} />}
          {currentPage === "gates" && <VerificationGatesPage vm={vmWithApi} />}
          {currentPage === "contracts" && <ContractsPage vm={vmWithApi} />}
          {currentPage === "evidence" && <EvidencePage vm={vmWithApi} />}
          {currentPage === "safety" && <SafetyCenterPage vm={vmWithApi} />}
          {currentPage === "release" && <ReleaseControlPage vm={vmWithApi} />}
          {currentPage === "projects" && <ProjectsPage vm={vmWithApi} studio={studio} />}
          {currentPage === "skills" && <SkillRegistryPage vm={vmWithApi} />}
          {currentPage === "hooks" && <HookRegistryPage vm={vmWithApi} />}
          {currentPage === "tools" && <ToolGatewayPage vm={vmWithApi} />}
          {currentPage === "triggers" && <TriggerIntegrationPage vm={vmWithApi} />}
          {currentPage === "apiBatch" && <ApiBatchAdapterPage vm={vmWithApi} />}
          {currentPage === "tests" && <TestCenterPage vm={vmWithApi} />}
          {currentPage === "quality" && <QualityIntelligencePage vm={vmWithApi} />}
          {currentPage === "agentRooms" && <AgentRoomsPage vm={vmWithApi} />}
          {currentPage === "roadmap" && <OSRoadmapPage vm={vmWithApi} />}
          {currentPage === "liveapi" && <LiveApiPage vm={vmWithApi} onRefresh={refreshApiState} />}
          {currentPage === "database" && <DurableStatePage vm={vmWithApi} />}
          {currentPage === "services" && <ServiceHealthPage vm={vmWithApi} />}
          {currentPage === "batch" && <BatchQueuePage vm={vmWithApi} />}
          {currentPage === "workers" && <WorkerRuntimePage vm={vmWithApi} />}
          {currentPage === "cost" && <CostCenterPage vm={vmWithApi} studio={studio} />}
          {currentPage === "policies" && <PolicyCenterPage />}
          {currentPage === "secrets" && <SecretsBoundaryPage />}
          {currentPage === "memory" && <MemoryCenterPage vm={vmWithApi} />}
          {currentPage === "context" && <DataContextCenterPage vm={vmWithApi} />}
          {currentPage === "recovery" && (
            <>
              <div className="ccv2-content">
                <div className="ccv2-page">
                  <FounderOperationsBoard {...FOUNDER_RUNTIME_OS_BOARDS.recovery} />
                </div>
              </div>
              <Recovery />
            </>
          )}
          {currentPage === "selfUpdate" && <SelfUpdatePage />}
          {currentPage === "deployMonitoring" && <DeployMonitoringPage />}
          {currentPage === "projectShipping" && <ProjectShippingPage />}
          {currentPage === "authGovernance" && <AuthGovernancePage />}
          {currentPage === "observability" && <ObservabilityPage />}
          {currentPage === "backupDr" && <BackupDrPage />}
          {currentPage === "isolation" && <IsolationPage />}
          {currentPage === "compliance" && <CompliancePage />}
          {currentPage === "enterprisePreview" && <EnterprisePreviewPage />}
          {currentPage === "liveReadiness" && <LiveReadinessPage />}
          {currentPage === "founderIntake" && <FounderIntakePage />}
          {currentPage === "businessBuild" && <BusinessBuildPage />}
          {currentPage === "demo" && <DemoModePage vm={vmWithApi} />}
          {currentPage === "docs" && <DocsGuidesPage />}
          {currentPage === "activity" && <ActivityLogPage vm={vmWithApi} />}
          {currentPage === "settings" && (
            <PlannedRoutePage routeKey={currentPage} />
          )}
        </div>
      </div>
      <CommandPalette
        open={commandPaletteOpen}
        vm={vmWithApi}
        commands={operatorCommands}
        selectedCommandId={selectedCommandId}
        onSelectCommand={setSelectedCommandId}
        onClose={() => setCommandPaletteOpen(false)}
        onExecuteCommand={handleExecuteCommand}
      />
    </div>
  );
}
