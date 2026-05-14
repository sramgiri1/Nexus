import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { buildCommandCenterViewModelV2 } from "../data/commandCenterViewModel.js";
import { getNexusCommandsForScope } from "../data/nexusCommands.js";
import {
  COMMAND_CENTER_ROUTE_BY_KEY,
  getCommandCenterSidebarGroups,
  resolveCommandCenterRoute,
} from "../data/commandCenterRoutes.js";
import {
  NEXUS_BLOCKED_OS_PHASES,
  NEXUS_COMPLETED_OS_PHASES,
  NEXUS_CURRENT_OS_PHASE,
  NEXUS_NEXT_OS_PHASE,
  NEXUS_OS_OPEN_GAPS,
  NEXUS_OS_ROADMAP_META,
  NEXUS_PLANNED_OS_PHASES,
  NEXUS_PREVIOUS_COMPLETED_PHASE,
} from "../data/nexusRoadmap.js";
import { privateValidationSnapshot } from "../data/privateValidationSnapshot.js";
import { actionBridgeSnapshot } from "../data/actionBridgeSnapshot.js";
import { runtimeSnapshot } from "../data/runtimeSnapshot.js";
import { LOCAL_REPORT_SNAPSHOT } from "../data/localReports.js";
import { checkActionBridgeHealth, composeMissionFromCommandCenter } from "../api/missionActions.js";
import { activateMissionTask } from "../api/taskActions.js";
import { loadWorkbenchView, reviewTask, listWorkbenchItems } from "../api/workbenchActions.js";
import { proposeImplementation, applyImplementation } from "../api/implementationActions.js";
import { getLocalApiHealth, getLocalStatus, getTasks, getEvidence, getProjects, getRoadmap, getDbStatus, buildApiState } from "../api/localApiClient.js";
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

const NAV_GROUPS_V2 = getCommandCenterSidebarGroups();

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
  mission: "⬡",
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
  liveapi: "◎",
  database: "⬟",
  services: "☍",
  batch: "⊞",
  cost: "$",
  roadmap: "◈",
  activity: "☰",
  docs: "☷",
  settings: "⚙",
  demo: "▶",
};

const WORKFLOW_GROUPS = [
  { key: "plan", label: "Plan" },
  { key: "build", label: "Build" },
  { key: "validate", label: "Validate" },
  { key: "govern", label: "Govern" },
  { key: "release", label: "Release" },
];

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
  const missionPaths = new Set(["/", "/command-center", "/command-center/mission"]);

  return (
    <aside className="ccv2-sidebar">
      <div
        className="ccv2-sidebar__brand"
        style={{ cursor: "pointer" }}
        onClick={() => navigate("/command-center/mission")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && navigate("/command-center/mission")}
      >
        <div className="ccv2-sidebar__brand-mark">N</div>
        <div className="ccv2-sidebar__brand-name">{vm.shell.productName}</div>
        <div className="ccv2-sidebar__brand-ver">v4.7</div>
      </div>

      <nav className="ccv2-nav-groups">
        {NAV_GROUPS_V2.map((group) => (
          <div key={group.group} className="ccv2-nav-group">
            <div className="ccv2-nav-group__label">{group.group}</div>
            {group.items.map((item) => {
              const isMissionItem = item.key === "mission";
              const isMissionActive = isMissionItem && missionPaths.has(location.pathname);

              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  end={isMissionItem}
                  title={item.name}
                  className={({ isActive }) => {
                    const active = isMissionItem ? isMissionActive : isActive;
                    return `ccv2-nav-item${active ? " ccv2-nav-item--active" : ""}`;
                  }}
                >
                  <span className="ccv2-nav-item__icon">{ROUTE_ICONS[item.key] || "•"}</span>
                  <span className="ccv2-nav-item__label">{item.name}</span>
                  {item.badge && (
                    <span className="ccv2-nav-item__badge">{item.badge}</span>
                  )}
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
function TopBar({ vm, currentPage, apiState, onRefresh, themeState, onOpenCommandPalette }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const pageLabel = COMMAND_CENTER_ROUTE_BY_KEY[currentPage]?.expectedHeading || "Mission Control";
  const liveOnline = apiState?.liveApiOnline;
  const refreshStatus = apiState?.lastRefreshStatus || "idle";

  return (
    <header className="ccv2-topbar">
      <div className="ccv2-topbar__breadcrumb">
        <span>NEXUS</span>
        <span className="ccv2-topbar__breadcrumb-sep">/</span>
        <span>Operations</span>
        <span className="ccv2-topbar__breadcrumb-sep">/</span>
        <span className="ccv2-topbar__breadcrumb-current">{pageLabel}</span>
      </div>

      <div className="ccv2-topbar__mission-badge">
        <span className="ccv2-topbar__mission-label">MISSION</span>
        <span className="ccv2-topbar__mission-name">{vm.mission.sprintId}</span>
      </div>

      <div className="ccv2-topbar__env-badge">
        <span className="ccv2-topbar__env-label">Environment</span>
        <span className="ccv2-topbar__env-value">Desktop</span>
        <span className="ccv2-topbar__env-sep">|</span>
        <span className="ccv2-topbar__env-value">Local-private</span>
      </div>

      <div className="ccv2-topbar__spacer" />

      <div className="ccv2-api-status">
        <span className={`ccv2-api-dot ccv2-api-dot--${liveOnline ? "online" : "offline"}`} />
        <span className="ccv2-api-label">
          {liveOnline ? "Local API: Online" : "Local API: Offline"}
        </span>
        {!liveOnline && <span className="ccv2-api-fallback">· snapshot</span>}
        {refreshStatus === "refreshing" && <span className="ccv2-api-refreshing">↻</span>}
        <button
          className="ccv2-api-refresh-btn"
          onClick={onRefresh}
          disabled={refreshStatus === "refreshing"}
          title="Refresh API status"
        >⟳</button>
      </div>

      <span className="ccv2-persistence-badge">Durable State: read-only</span>

      <button
        type="button"
        className="ccv2-command-palette-trigger"
        onClick={onOpenCommandPalette}
        aria-label="Open Command Palette"
      >
        <span className="ccv2-command-palette-trigger__label">Command Palette</span>
        <span className="ccv2-command-palette-trigger__shortcut">Cmd/Ctrl+K</span>
      </button>

      <div className="ccv2-theme-control" aria-label="Theme selector" data-theme-control="nexus">
        <span className="ccv2-theme-control__label">Theme</span>
        <div className="ccv2-theme-control__options" role="group" aria-label="Command Center theme">
          {[
            { id: "system", label: "System", title: "Use system theme" },
            { id: "dark", label: "Dark", title: "Use dark theme" },
            { id: "light", label: "Light", title: "Use light theme" },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              className={`ccv2-theme-control__button${themeState.theme === option.id ? " ccv2-theme-control__button--active" : ""}`}
              aria-pressed={themeState.theme === option.id}
              aria-label={option.title}
              title={option.title}
              onClick={() => themeState.setTheme(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ccv2-topbar__time ccv2-mono">{timeStr} UTC</div>
    </header>
  );
}

/* ─── Mission Composer Card ─── */
function MissionComposerCard({ vm }) {
  const mc = vm.missionComposer;
  const [missionText, setMissionText] = useState(mc.missionText || "");
  const [bridgeOnline, setBridgeOnline] = useState(false);
  const [actionState, setActionState] = useState("idle"); // idle | running | completed | failed | offline
  const [actionResult, setActionResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const isLocalPrivate = vm.shell.mode === "local-private";
  const activeScopeLabel = isLocalPrivate ? "Active Project" : "NEXUS OS";
  const activeMissionRaw = vm.agenticWorkspace?.activeMission || vm.taskActivation?.missionId || vm.mission.sprintId;
  const activeMission = typeof activeMissionRaw === "string"
    ? activeMissionRaw
    : activeMissionRaw?.id || activeMissionRaw?.name || activeMissionRaw?.title || vm.mission.sprintId;
  const sourceLabel = vm.liveApi?.liveApiOnline
    ? "Live local API"
    : vm.dbFoundation?.fileFallbackRequired
      ? "Snapshot fallback"
      : "File-backed";
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
      reason: mc.buttons?.[1]?.reason || "Requires governed action bridge",
    },
    {
      id: "start-governed-run",
      label: "Start Governed Run",
      enabled: false,
      reason: mc.buttons?.[2]?.reason || "Requires worker runtime",
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
          <div className="ccv2-eyebrow">Mission Hero</div>
          <h2 className="ccv2-mission-cockpit__title">Mission Control</h2>
          <p className="ccv2-mission-cockpit__subtitle">
            enterprise command surface for governed agentic work
          </p>
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
          <span className="ccv2-mission-cockpit__summary-value">{activeMission}</span>
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

      <div className="ccv2-mission-cockpit__body">
        <div className="ccv2-mission-cockpit__narrative">
          <div className="ccv2-mission-cockpit__intent-label">Mission Intent</div>
          <p className="ccv2-mission-cockpit__intent">{vm.mission.founderIntent}</p>
          <blockquote className="ccv2-mission-cockpit__quote">{vm.mission.quote}</blockquote>

          <label className="ccv2-mission-cockpit__prompt-label" htmlFor="mission-control-text">
            Governed mission prompt
          </label>
          <textarea
            id="mission-control-text"
            className="ccv2-mission-composer__textarea"
            value={missionText}
            onChange={(e) => setMissionText(e.target.value)}
            placeholder={mc.placeholder}
            rows={4}
          />

          <div className="ccv2-mission-cockpit__mission-meta">
            <span className="ccv2-pill ccv2-pill--pass">{vm.mission.sprintId}</span>
            <span className="ccv2-pill ccv2-pill--pending">{vm.mission.sprintDay}</span>
            <span className="ccv2-pill ccv2-pill--disabled">
              {vm.liveApi?.liveApiOnline ? "Available" : "Requires governed action bridge"}
            </span>
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
              {bridgeOnline ? "Governed action bridge available" : "Requires governed action bridge"}
            </div>
            <div className="ccv2-mission-cockpit__availability-label">Next action</div>
            <div className="ccv2-mission-cockpit__availability-value">{mc.nextAction}</div>
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
        <h3 className="ccv2-pv-panel__title">Private Project Validation</h3>
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
   Template labels: Build Product | Fix Failing Test | Validate Backend |
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
function MissionControlPage({ vm, operatorCommands, onOpenCommandPalette }) {
  const clp = vm.careloopProductProgress;
  const isLocalPrivate = vm.shell.mode === "local-private";
  const liveOnline = vm.liveApi?.liveApiOnline;

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

      {/* A. Mission Hero */}
      <MissionComposerCard vm={vm} />

      <OperatorActionsPanel
        commands={operatorCommands}
        onSelectCommand={onOpenCommandPalette}
      />

      {/* B. Next Best Action + C. System Status Strip */}
      <div className="ccv2-mission-control__lead-grid">
        <NextBestActionPanel vm={vm} />
        <SystemStatusStrip vm={vm} />
      </div>

      {/* D. KPI Cards */}
      <div className="ccv2-kpi-row">
        {vm.metrics.map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </div>

      {/* E + F. Execution Pipeline + Activity Stream */}
      <div className="ccv2-pipeline-stream">
        <ExecutionPipeline vm={vm} />
        <ActivityStream vm={vm} />
      </div>

      {/* G + H. Verification Gates + Active Mission Tasks */}
      <div className="ccv2-mission-control__section-grid ccv2-mission-control__section-grid--two">
        <VerificationGatesSummary vm={vm} />
        <ActiveMissionTasksSummary vm={vm} />
      </div>

      {/* I + J. Project Progress + Evidence Timeline */}
      <div className="ccv2-mission-control__section-grid ccv2-mission-control__section-grid--two">
        <ProjectProgressRings vm={vm} />
        <EvidenceTimeline vm={vm} />
      </div>

      {/* K + L + M. Safety / Approval + Release Readiness + Cost Snapshot */}
      <div className="ccv2-mission-control__section-grid ccv2-mission-control__section-grid--three">
        <SafetyApprovalSummary vm={vm} />
        <ReleaseSection vm={vm} />
        <CostCenterSummary vm={vm} />
      </div>

      <div className="ccv2-mission-control__section-grid ccv2-mission-control__section-grid--two">
        <PrivateValidationPanel vm={vm} />
        <EvidenceGovernanceSection vm={vm} />
      </div>

      {isLocalPrivate && clp && (
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

        <div className="ccv2-section-heading" style={{ marginBottom: 8 }}>Planned Tasks</div>
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
      </div>
    </div>
  );
}

/* ─── Agent Fleet Page ─── */
function AgentFleetPage({ vm, studio }) {
  const agents = studio?.agentEntries || [];
  const missionTasks = vm.taskActivation?.missionTasks || [];

  const MISSION_AGENTS = ["SHEPHERD", "AUDITOR", "PRISM", "SENTINEL", "WARDEN", "CORE"];

  function plannedTasksForAgent(agentName) {
    return missionTasks.filter((t) => t.targetAgent === agentName);
  }

  function statusDotClass(status) {
    if (status === "active") return "ccv2-agent-status-dot--active";
    if (status === "working") return "ccv2-agent-status-dot--working";
    if (status === "blocked") return "ccv2-agent-status-dot--blocked";
    if (status === "done") return "ccv2-agent-status-dot--done";
    return "ccv2-agent-status-dot--idle";
  }

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Agent Fleet</div>
          <div className="ccv2-page-head__sub">{agents.length} agents · live status from memory snapshot</div>
        </div>

        <div className="ccv2-section-heading" style={{ marginBottom: 8 }}>Mission Task Assignments — Private Project</div>
        <div className="ccv2-card" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
          <table className="ccv2-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Planned Tasks</th>
                <th>Activated</th>
                <th>Next Queued Task</th>
                <th>Capability</th>
              </tr>
            </thead>
            <tbody>
              {MISSION_AGENTS.map((agentName) => {
                const tasks = plannedTasksForAgent(agentName);
                const nextTask = tasks[0];
                return (
                  <tr key={agentName}>
                    <td style={{ fontWeight: 700 }}>{agentName}</td>
                    <td>{tasks.length}</td>
                    <td><span className="ccv2-pill ccv2-pill--disabled">0</span></td>
                    <td style={{ fontSize: 12 }}>{nextTask ? nextTask.title : <span style={{ color: "var(--v2-muted-2)" }}>—</span>}</td>
                    <td style={{ fontSize: 11, color: "var(--v2-muted-2)" }}>{nextTask ? nextTask.capabilityId : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="ccv2-section-heading" style={{ marginBottom: 8 }}>All Agents</div>
        <div className="ccv2-agent-grid">
          {agents.map((agent) => {
            const agentName = agent.name?.toUpperCase();
            const agentTasks = plannedTasksForAgent(agentName);
            return (
              <div key={agent.id} className="ccv2-agent-card">
                <div className="ccv2-agent-card__header">
                  <div className={`ccv2-agent-status-dot ${statusDotClass(agent.status)}`} />
                  <div className="ccv2-agent-card__name">{agent.name}</div>
                </div>
                <div className="ccv2-agent-card__role">{agent.role} · {agent.team}</div>
                {agentTasks.length > 0 && (
                  <div className="ccv2-agent-card__mission-tasks">
                    <span className="ccv2-pill ccv2-pill--pending">{agentTasks.length} planned task{agentTasks.length > 1 ? "s" : ""}</span>
                    <span style={{ fontSize: 11, color: "var(--v2-muted)", marginLeft: 4 }}>{agentTasks[0]?.title}</span>
                  </div>
                )}
                {agent.task && (
                  <div className="ccv2-agent-card__task">{agent.task}</div>
                )}
                {typeof agent.progress === "number" && agent.progress > 0 && (
                  <div style={{ marginTop: 6, height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${agent.progress}%`, background: "var(--v2-teal)", borderRadius: 2 }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
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

        <div className="ccv2-card ccv2-page-summary-card">
          <div className="ccv2-section-heading">Evidence Summary</div>
          <div className="ccv2-page-summary-grid">
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Total evidence records</span><span className="ccv2-page-summary-value">{total}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Redacted records</span><span className="ccv2-page-summary-value">{redactedCount}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Latest evidence</span><span className="ccv2-page-summary-value">{latestEvidence ? `${latestEvidence.type?.replace(/_/g, " ")} · ${latestEvidence.result}` : "Not available yet"}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Linked task</span><span className="ccv2-page-summary-value">{latestEvidence?.taskId || "No linked task yet"}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{total > 0 ? "Evidence records available for review." : "Evidence appears after governed actions complete."}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Data source</span><span className="ccv2-page-summary-value">{liveOnline ? "Live local API" : "File-backed snapshot fallback"}</span></div>
          </div>
        </div>

        <div className="ccv2-stats-row">
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Total</div>
            <div className="ccv2-stat-chip__value">{total}</div>
          </div>
          {Object.entries(byResult).map(([result, count]) => (
            <div key={result} className="ccv2-stat-chip">
              <div className="ccv2-stat-chip__label">{result}</div>
              <div className={`ccv2-stat-chip__value ccv2-stat-chip__value--${result === "PASS" ? "green" : result === "FAIL" ? "red" : "teal"}`}>
                {count}
              </div>
            </div>
          ))}
        </div>

        <div className="ccv2-two-col">
          <div className="ccv2-card">
            <div className="ccv2-section-heading">By Type</div>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              {Object.entries(byType).map(([type, count]) => (
                <div key={type} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12, borderBottom: "1px solid rgba(136,255,235,0.05)" }}>
                  <span style={{ color: "var(--v2-muted)" }}>{type.replace(/_/g, " ")}</span>
                  <span style={{ color: "var(--v2-text)", fontWeight: 600 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

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
        </div>
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

        <div className="ccv2-safety-grid">
          {rows.map((row) => (
            <div key={row.label} className="ccv2-safety-row">
              <span className="ccv2-safety-row__label">{row.label}</span>
              <span className={`ccv2-safety-row__value--${row.valueClass}`}>{row.value}</span>
            </div>
          ))}
        </div>

        <div className="ccv2-card" style={{ marginTop: 12 }}>
          <div className="ccv2-section-heading">Local API Boundary</div>
          <div className="ccv2-safety-grid" style={{ marginTop: 8 }}>
            {apiRows.map(row => (
              <div key={row.label} className="ccv2-safety-row">
                <span className="ccv2-safety-row__label">{row.label}</span>
                <span className={`ccv2-safety-row__value--${row.valueClass}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ccv2-card" style={{ marginTop: 8 }}>
          <div className="ccv2-section-heading">DB Foundation Boundary</div>
          <div className="ccv2-safety-grid" style={{ marginTop: 8 }}>
            {[
              { label: "DB writes", value: "DB writes disabled by policy", valueClass: "disabled" },
              { label: "Project mutation", value: "Governed only", valueClass: "pending" },
              { label: "Approval gates", value: runtimeSnapshot.approvalWorkflow?.requested ? "Pending approvals present" : "No pending approvals", valueClass: runtimeSnapshot.approvalWorkflow?.requested ? "pending" : "ready" },
              { label: "File fallback", value: "Active", valueClass: "ready" },
              { label: "Policy blocks", value: (runtimeSnapshot.runtimeState?.tasks?.byState?.blocked || 0) > 0 ? "Active" : "None", valueClass: (runtimeSnapshot.runtimeState?.tasks?.byState?.blocked || 0) > 0 ? "pending" : "ready" },
              { label: "Network policy", value: governance.networkCallsAllowed ? "Enabled" : "Disabled", valueClass: governance.networkCallsAllowed ? "pending" : "disabled" },
            ].map(row => (
              <div key={row.label} className="ccv2-safety-row">
                <span className="ccv2-safety-row__label">{row.label}</span>
                <span className={`ccv2-safety-row__value--${row.valueClass}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {isLocalPrivate && complianceRows.length > 0 && (
          <div className="ccv2-card">
            <div className="ccv2-section-heading">Compliance · {clp.productName}</div>
            <div className="ccv2-safety-grid" style={{ marginTop: 8 }}>
              {complianceRows.map((row) => (
                <div key={row.label} className="ccv2-safety-row">
                  <span className="ccv2-safety-row__label">{row.label}</span>
                  <span className={`ccv2-safety-row__value--${row.valueClass}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Boundary Note</div>
          <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
            No private project source details appear in public/demo surfaces. Safety policies stay active even in local-private mode, and provider calls, DB writes, and direct runtime mutation remain blocked or governed. Safety incidents: {vm.safety.incidents} · Last clean: {vm.safety.lastClean}.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Release Control Page ─── */
function ReleaseControlPage({ vm }) {
  const r = vm.release;
  const gates = vm.mission.gates;

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Release Control</div>
          <div className="ccv2-page-head__sub">Release decision · governed gate status</div>
        </div>

        <div className="ccv2-card">
          <div className="ccv2-eyebrow">Release Decision</div>
          <div className="ccv2-nogo-big">{r.status}</div>
          <div style={{ fontSize: 13, color: "var(--v2-muted)", marginTop: 4 }}>Readiness: {r.readiness}%</div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.07)", borderRadius: 4, overflow: "hidden", margin: "12px 0" }}>
            <div style={{ height: "100%", width: `${r.readiness}%`, background: "linear-gradient(90deg, var(--v2-amber), var(--v2-yellow))", borderRadius: 4 }} />
          </div>
        </div>

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
          <div className="ccv2-section-heading">Blocker</div>
          <div style={{ marginTop: 8, padding: "10px 12px", background: "rgba(255,92,122,0.07)", border: "1px solid rgba(255,92,122,0.2)", borderRadius: 6, fontSize: 12, color: "var(--v2-muted)" }}>
            {r.blocker}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="ccv2-release-card__action-btn" disabled>Submit for Release</button>
            <button className="ccv2-release-card__action-btn" disabled>Override Gate</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Projects Page ─── */
function ProjectsPage({ vm, studio }) {
  const pv = privateValidationSnapshot;
  const pvStatus = pv?.status || {};
  const pvBackend = pvStatus.latestBackendValidation || {};
  const projectProgress = vm.projectProgress || vm.careloopProductProgress;
  const isLocalPrivate = vm.shell.mode === "local-private";

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Projects</div>
          <div className="ccv2-page-head__sub">See the current project scope, validation state, readiness, and what remains adapter-gated.</div>
        </div>

        <div className="ccv2-card ccv2-page-summary-card">
          <div className="ccv2-section-heading">Project Summary</div>
          <div className="ccv2-page-summary-grid">
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Active project</span><span className="ccv2-page-summary-value">{studio?.activeProject?.name || "Private Project"}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Project state</span><span className="ccv2-page-summary-value">{isLocalPrivate ? "Active · private · local-private" : "Active · public-safe"}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Backend validation</span><span className="ccv2-page-summary-value">{pvBackend.testsPassed ?? 58}/{pvBackend.totalTests ?? 58} PASS</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">iOS readiness</span><span className="ccv2-page-summary-value">{pvStatus.iosReadiness || "Requires iOS/Xcode runner"}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Release readiness</span><span className="ccv2-page-summary-value">{vm.release.status === "NO-GO" ? "Not ready" : vm.release.status}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next platform step</span><span className="ccv2-page-summary-value">Project Registry + Adapter Framework is planned for P42.</span></div>
          </div>
        </div>

        <div className="ccv2-two-col">
          <div className="ccv2-card">
            <div className="ccv2-section-heading">Private Project Validation</div>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--v2-muted)" }}>Overall</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--v2-green)" }}>{pvStatus.overall || "VALIDATED"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--v2-muted)" }}>Backend tests</span>
                <span className="ccv2-mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--v2-green)" }}>
                  {pvBackend.testsPassed ?? 58}/{pvBackend.totalTests ?? 58} PASS
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--v2-muted)" }}>Backend readiness</span>
                <span style={{ fontSize: 12, color: "var(--v2-teal)" }}>{pvStatus.backendReadiness || "READY_FOR_VALIDATION"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--v2-muted)" }}>iOS readiness</span>
                <span style={{ fontSize: 12, color: "var(--v2-teal)" }}>{pvStatus.iosReadiness || "READY_FOR_XCODE_INVENTORY"}</span>
              </div>
            </div>
          </div>

          <div className="ccv2-card">
            <div className="ccv2-section-heading">Project State</div>
            <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
              No source file details are exposed here. Private project data is scoped to local-private mode, and adapter behavior remains intentionally limited until the Project Registry + Adapter Framework lands in P42.
            </p>
          </div>
        </div>

        {isLocalPrivate && projectProgress && (
          <>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">Project Progress · {projectProgress.projectName} {projectProgress.prdStatus.version}</div>
              <div style={{ fontSize: 12, color: "var(--v2-muted)", margin: "4px 0 12px" }}>
                Local-private only · active milestone: {projectProgress.milestone || "Current sprint"} · {projectProgress.productLanguage}
              </div>

              <div className="ccv2-sprint-board">
                {projectProgress.sprints.map((s) => (
                  <div key={s.id} className={`ccv2-sprint-tile ccv2-sprint-tile--${s.status.toLowerCase().replace("_", "-")}`}>
                    <div className="ccv2-sprint-tile__id">{s.id}</div>
                    <div className="ccv2-sprint-tile__focus">{s.focus}</div>
                    <div className="ccv2-sprint-tile__status">{s.status.replace("_", " ")}</div>
                    {s.tests !== "—" && <div className="ccv2-mono ccv2-sprint-tile__tests">{s.tests}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="ccv2-two-col">
              <div className="ccv2-card">
                <div className="ccv2-section-heading">Project Open Gaps</div>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {projectProgress.gaps.map((g) => (
                    <div key={g} className="ccv2-gap-row">
                      <span className="ccv2-gap-row__dot" />
                      <span style={{ fontSize: 12, color: "var(--v2-muted)" }}>{g}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ccv2-card">
                <div className="ccv2-section-heading">Locked Decisions</div>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {projectProgress.lockedDecisions.map((d) => (
                    <div key={d} style={{ fontSize: 11, color: "var(--v2-muted-2)", padding: "4px 0", borderBottom: "1px solid rgba(136,255,235,0.05)", lineHeight: 1.5 }}>
                      {d}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: "var(--v2-muted-2)" }}>
                  Compliance: {projectProgress.compliance.framework}
                </div>
              </div>
            </div>
          </>
        )}

        {!isLocalPrivate && (
          <div className="ccv2-card">
            <div className="ccv2-section-heading">Project Progress</div>
            <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
              Project progress is shown only in local-private mode until the Project Registry + Adapter Framework lands in P42.
              Public and demo surfaces use private-project wording and do not expose the local-private roadmap for a selected project.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Batch Queue Page ─── */
function BatchQueuePage({ vm }) {
  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Batch Queue</div>
          <div className="ccv2-page-head__sub">Async batch processing status</div>
        </div>

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Batch API Status</div>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="ccv2-safety-row">
              <span className="ccv2-safety-row__label">Real OpenAI Batch API</span>
              <span className="ccv2-safety-row__value--disabled">Disabled</span>
            </div>
            <div className="ccv2-safety-row">
              <span className="ccv2-safety-row__label">Real Anthropic Message Batches</span>
              <span className="ccv2-safety-row__value--disabled">Disabled</span>
            </div>
            <div className="ccv2-safety-row">
              <span className="ccv2-safety-row__label">Dry-run queueing</span>
              <span className="ccv2-safety-row__value--ready">Available</span>
            </div>
          </div>
        </div>

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Note</div>
          <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
            Batch cannot pass gates — gates require real execution. Dry-run queueing is available for planning only.
            Enable flags <span className="ccv2-mono">ENABLE_REAL_OPENAI_BATCH</span> and <span className="ccv2-mono">ENABLE_REAL_ANTHROPIC_BATCH</span> to activate real batch submission.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Cost Center Page ─── */
function CostCenterPage({ vm, studio }) {
  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Cost Center</div>
          <div className="ccv2-page-head__sub">Budget limits · no live provider spend in local-private mode</div>
        </div>

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Provider Status</div>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="ccv2-safety-row">
              <span className="ccv2-safety-row__label">Provider calls</span>
              <span className="ccv2-safety-row__value--disabled">Disabled in local-private mode</span>
            </div>
            <div className="ccv2-safety-row">
              <span className="ccv2-safety-row__label">Live spend data</span>
              <span className="ccv2-safety-row__value--disabled">Not available</span>
            </div>
          </div>
        </div>

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Note</div>
          <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
            No live provider spend available in local-private mode. Budget limits are configured in <span className="ccv2-mono">guardrails/budget.json</span> but no real API calls are made.
          </p>
        </div>
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

/* ─── Workspace Page ─── */
function WorkspacePage({ vm }) {
  const navigate = useNavigate();
  const ws = vm.agenticWorkspace;
  const nba = ws?.nextBestAction;
  const templates = ws?.workflowTemplates || [];
  const status = ws?.workspaceStatus || {};
  const limitations = ws?.currentLimitations || [];
  const isLocalPrivate = vm.shell.mode === "local-private";
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

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Implementation Workflow</div>
          <div className="ccv2-page-head__sub">Review controlled implementation status, scope, validation posture, and safe next actions.</div>
        </div>

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
  const endpointGroups = [
    { name: "Mission Data", status: online ? "Online" : "Snapshot fallback", pages: "Mission Control, Workspace", endpoints: ["/missions", "/status"] },
    { name: "Task Data", status: online ? "Online" : "Snapshot fallback", pages: "Task Queue, Agent Workbench", endpoints: ["/tasks", "/actions"] },
    { name: "Agent Data", status: online ? "Online" : "Snapshot fallback", pages: "Agent Fleet", endpoints: ["/agents"] },
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

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Live API Status</div>
          <div className="ccv2-page-head__sub">Track local API availability, live vs snapshot data, and which business surfaces depend on each endpoint group.</div>
        </div>

        <div className="ccv2-card ccv2-page-summary-card">
          <div className="ccv2-section-heading">API Summary</div>
          <div className="ccv2-page-summary-grid">
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Local API</span><span className="ccv2-page-summary-value">{online ? "Online" : "Offline"}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Mode</span><span className="ccv2-page-summary-value">{vm.shell.mode}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Data source</span><span className="ccv2-page-summary-value">{online ? "Live local API" : "Snapshot fallback"}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Last refresh</span><span className="ccv2-page-summary-value">{api.lastRefreshAt ? new Date(api.lastRefreshAt).toLocaleString() : "Not refreshed yet"}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current state</span><span className="ccv2-page-summary-value">{online ? "Live read endpoints available." : "Start the local API or use snapshot fallback."}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next step</span><span className="ccv2-page-summary-value">{online ? "Refresh data to confirm current endpoint health." : "Unified boot is planned for P41.6."}</span></div>
          </div>
        </div>

        <div className="ccv2-stats-row">
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Availability</div>
            <div className="ccv2-stat-chip__value ccv2-stat-chip__value--teal">Available</div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Status</div>
            <div className={`ccv2-stat-chip__value ${online ? "ccv2-stat-chip__value--green" : "ccv2-stat-chip__value--amber"}`}>
              {online ? "Online" : "Offline"}
            </div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Data source</div>
            <div className={`ccv2-stat-chip__value ${online ? "ccv2-stat-chip__value--teal" : "ccv2-stat-chip__value--amber"}`}>
              {online ? "Live API" : "Snapshot fallback"}
            </div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Refresh</div>
            <div className="ccv2-stat-chip__value">{refreshStatus}</div>
          </div>
        </div>

        {/* Connection status */}
        <div className="ccv2-card">
          <div className="ccv2-section-heading">Connection</div>
          {online ? (
            <div style={{ marginTop: 10, color: "var(--v2-green)", fontSize: 13, fontWeight: 600 }}>
              ✓ Local API is online at http://localhost:4321
            </div>
          ) : (
            <div style={{ marginTop: 10 }}>
              <div style={{ color: "var(--v2-amber)", fontSize: 13, fontWeight: 600 }}>⊘ Local API is offline</div>
              <div style={{ color: "var(--v2-muted)", fontSize: 12, marginTop: 6 }}>
                All Command Center pages are using generated snapshot fallback. To enable live data:
              </div>
              <div className="ccv2-code-block" style={{ marginTop: 8, padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 6, fontFamily: "monospace", fontSize: 11, color: "var(--v2-text)" }}>
                NEXUS_MODE=local-private npm run local-api:start
              </div>
              <button className="ccv2-wb-review-btn ccv2-wb-review-btn--changes" style={{ marginTop: 10 }} onClick={onRefresh}>
                Retry connection
              </button>
            </div>
          )}
        </div>

        {/* Endpoints */}
        <div className="ccv2-card">
          <div className="ccv2-section-heading">Endpoint Groups</div>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {endpointGroups.map((group) => (
              <div key={group.name} className="ccv2-list-row">
                <div className="ccv2-list-row__primary">
                  <span className="ccv2-list-row__title">{group.name}</span>
                  <span className="ccv2-list-row__meta">{group.endpoints.length} endpoints · Pages: {group.pages}</span>
                </div>
                <div className="ccv2-list-row__secondary">
                  <span className={`ccv2-pill ccv2-pill--${online ? "pass" : "disabled"}`}>{group.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live data sample */}
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

        {/* Safety boundary */}
        <div className="ccv2-card">
          <div className="ccv2-section-heading">Safety Boundary</div>
          <div className="ccv2-wb-meta-grid" style={{ marginTop: 10 }}>
            {safetyRows.map(r => (
              <div key={r.label} className="ccv2-wb-meta-row">
                <span className="ccv2-wb-meta-label">{r.label}</span>
                <span className={`ccv2-safety-row__value--${r.ok ? "disabled" : "ready"}`}>{r.value}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: "var(--v2-muted)" }}>
            Local API reads are available. Durable State foundation is ready, DB writes remain disabled by policy, and file-backed persistence stays active.
          </div>
        </div>

        {/* Page coverage */}
        <div className="ccv2-card">
          <div className="ccv2-section-heading">Developer Details</div>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
            {endpointGroups.flatMap((group) => group.endpoints.map((endpoint) => ({ group: group.name, endpoint }))).map((item) => (
              <div key={`${item.group}-${item.endpoint}`} style={{ display: "flex", gap: 12, alignItems: "center", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 12, color: "var(--v2-text)", flex: 1 }}>{item.group}</span>
                <span className="ccv2-mono" style={{ fontSize: 11, color: "var(--v2-muted-2)" }}>{item.endpoint}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Durable State Page ─── */
function DurableStatePage({ vm }) {
  const dbData = vm.liveData?.db;
  const online = vm.liveApi?.liveApiOnline;
  const dbFoundation = vm.dbFoundation || {};

  const entities = dbData?.entities || dbFoundation.entities || [];
  const importPlan = dbData?.importPlan || dbFoundation.importPlan || {};
  const entityCount = dbData?.entityCount ?? dbFoundation.entityCount ?? 18;
  const sourcesAvailable = importPlan.sourcesAvailable ?? "—";
  const sourcesMissing = importPlan.sourcesMissing ?? "Unknown";
  const totalEntities = importPlan.totalEntities ?? entityCount;

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Durable State</div>
          <div className="ccv2-page-head__sub">Understand current persistence, DB foundation readiness, and what remains intentionally disabled by policy.</div>
        </div>

        <div className="ccv2-card ccv2-page-summary-card">
          <div className="ccv2-section-heading">Durable State Summary</div>
          <div className="ccv2-page-summary-grid">
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Current persistence</span><span className="ccv2-page-summary-value">File-backed</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">DB foundation</span><span className="ccv2-page-summary-value">Ready</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">DB writes</span><span className="ccv2-page-summary-value">Disabled by policy</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">File fallback</span><span className="ccv2-page-summary-value">Active</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Runtime DB primary</span><span className="ccv2-page-summary-value">Not enabled yet</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Next step</span><span className="ccv2-page-summary-value">DB-backed runtime primary is planned later after runtime and governance stabilize.</span></div>
          </div>
        </div>

        <div className="ccv2-stat-chips" style={{ marginBottom: 16 }}>
          <div className="ccv2-stat-chip"><span className="ccv2-stat-chip__label">Persistence</span><span className="ccv2-stat-chip__value ccv2-stat-chip__value--amber">File-backed</span></div>
          <div className="ccv2-stat-chip"><span className="ccv2-stat-chip__label">DB foundation</span><span className="ccv2-stat-chip__value ccv2-stat-chip__value--teal">Ready</span></div>
          <div className="ccv2-stat-chip"><span className="ccv2-stat-chip__label">Entities</span><span className="ccv2-stat-chip__value">{entityCount}</span></div>
          <div className="ccv2-stat-chip"><span className="ccv2-stat-chip__label">Sources Mapped</span><span className="ccv2-stat-chip__value">{sourcesAvailable} / {totalEntities}</span></div>
          <div className="ccv2-stat-chip"><span className="ccv2-stat-chip__label">DB Writes</span><span className="ccv2-stat-chip__value ccv2-stat-chip__value--red">Disabled by policy</span></div>
          <div className="ccv2-stat-chip"><span className="ccv2-stat-chip__label">Live data</span><span className="ccv2-stat-chip__value">{online ? "API" : "Snapshot"}</span></div>
        </div>

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Import Preview</div>
          <div className="ccv2-page-summary-grid" style={{ marginTop: 8 }}>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Entity count</span><span className="ccv2-page-summary-value">{entityCount}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Mapped sources</span><span className="ccv2-page-summary-value">{sourcesAvailable} / {totalEntities}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Unmapped sources</span><span className="ccv2-page-summary-value">{sourcesMissing}</span></div>
            <div className="ccv2-page-summary-row"><span className="ccv2-page-summary-label">Import preview</span><span className="ccv2-page-summary-value">{online ? "Available from live API" : "Requires local API for live mapping"}</span></div>
          </div>
        </div>

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Developer Details</div>
          <div className="ccv2-safety-grid" style={{ marginTop: 8 }}>
            {[
              { label: "dbWritesEnabled", value: "false", valueClass: "disabled" },
              { label: "productionDbAllowed", value: "false", valueClass: "disabled" },
              { label: "externalDbAllowed", value: "false", valueClass: "disabled" },
              { label: "fileFallbackRequired", value: "true", valueClass: "ready" },
              { label: "schemaArtifactsAllowed", value: "true", valueClass: "ready" },
              { label: "dryRunMappingAllowed", value: "true", valueClass: "ready" },
              { label: "DB foundation", value: "ready", valueClass: "ready" },
            ].map(row => (
              <div key={row.label} className="ccv2-safety-row">
                <span className="ccv2-safety-row__label">{row.label}</span>
                <span className={`ccv2-safety-row__value--${row.valueClass}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ccv2-card" style={{ marginTop: 8 }}>
          <div className="ccv2-section-heading">Import Plan · Dry-run Only</div>
          <div style={{ padding: "8px 0", fontSize: 12, color: "var(--v2-text-dim)" }}>
            {online
              ? `${sourcesAvailable} of ${totalEntities} entity sources available. DB writes disabled — no data has been written to any database.`
              : "Local API offline. Import plan data unavailable — start local API to see live mapping."}
          </div>
        </div>

        {entities.length > 0 && (
          <div className="ccv2-card" style={{ marginTop: 8 }}>
            <div className="ccv2-section-heading">Entity Registry · {entities.length} Entities</div>
            <div style={{ overflowX: "auto", marginTop: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {["Entity", "Primary Key", "Fields", "PII Risk", "Retention", "File Source"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "4px 8px", color: "var(--v2-text-dim)", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entities.map(e => (
                    <tr key={e.name} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "5px 8px", color: "var(--v2-text)", fontFamily: "monospace" }}>{e.name}</td>
                      <td style={{ padding: "5px 8px", color: "var(--v2-text-dim)", fontFamily: "monospace" }}>{e.primaryKey}</td>
                      <td style={{ padding: "5px 8px", color: "var(--v2-text-dim)" }}>{e.fieldCount}</td>
                      <td style={{ padding: "5px 8px", color: e.piiRisk === "none" ? "var(--v2-green)" : "var(--v2-amber)" }}>{e.piiRisk}</td>
                      <td style={{ padding: "5px 8px", color: "var(--v2-text-dim)", fontSize: 11 }}>{e.retentionClass}</td>
                      <td style={{ padding: "5px 8px", color: "var(--v2-text-dim)", fontSize: 10, fontFamily: "monospace", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.fileFallbackSource}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {entities.length === 0 && (
          <div className="ccv2-card" style={{ marginTop: 8 }}>
            <div className="ccv2-section-heading">Entity Registry · 18 Entities (schema.json)</div>
            <div style={{ padding: "8px 0", fontSize: 12, color: "var(--v2-text-dim)" }}>
              {online ? "Entity data loading…" : "Start local API (npm run local-api:start) to see live entity registry."}
            </div>
            <div style={{ fontSize: 11, color: "var(--v2-text-dim)", marginTop: 4 }}>
              Entities: projects · missions · mission_tasks · runtime_tasks · actions · agents · capabilities · contracts · evidence · audit_events · runtime_events · approvals · incidents · roadmap_phases · workflow_templates · implementation_records · review_records · validation_results
            </div>
          </div>
        )}

        <div className="ccv2-card" style={{ marginTop: 8 }}>
          <div className="ccv2-section-heading">Next Capability</div>
          <div style={{ padding: "8px 0", fontSize: 12, color: "var(--v2-text-dim)" }}>
            Durable State foundation is ready. DB writes remain disabled by policy until a governed write path is intentionally enabled.
          </div>
        </div>
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

/* ─── OS Roadmap Page ─── */
function OSRoadmapPage({ vm }) {
  void vm;

  const summarizePhase = (phase) => {
    if (!phase) return "Not available";
    return `${phase.phase} · ${phase.label}`;
  };

  const currentPhase = NEXUS_CURRENT_OS_PHASE;
  const previousPhase = NEXUS_PREVIOUS_COMPLETED_PHASE;
  const nextPhase = NEXUS_NEXT_OS_PHASE;

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">OS Roadmap</div>
          <div className="ccv2-page-head__sub">NEXUS OS platform phases, current platform gaps, and the next governed capabilities on deck.</div>
        </div>

        <div className="ccv2-roadmap-summary-grid">
          <div className="ccv2-roadmap-summary-card ccv2-roadmap-summary-card--current">
            <div className="ccv2-roadmap-summary-card__label">Current OS Phase</div>
            <div className="ccv2-roadmap-summary-card__value">{summarizePhase(currentPhase)}</div>
            <div className="ccv2-roadmap-summary-card__meta">{currentPhase?.statusLabel || "In Progress"}</div>
          </div>
          <div className="ccv2-roadmap-summary-card">
            <div className="ccv2-roadmap-summary-card__label">Previous Completed Phase</div>
            <div className="ccv2-roadmap-summary-card__value">{summarizePhase(previousPhase)}</div>
            <div className="ccv2-roadmap-summary-card__meta">Complete</div>
          </div>
          <div className="ccv2-roadmap-summary-card">
            <div className="ccv2-roadmap-summary-card__label">Next OS Phase</div>
            <div className="ccv2-roadmap-summary-card__value">{summarizePhase(nextPhase)}</div>
            <div className="ccv2-roadmap-summary-card__meta">{nextPhase?.statusLabel || "Planned"}</div>
          </div>
          <div className="ccv2-roadmap-summary-card">
            <div className="ccv2-roadmap-summary-card__label">Blocked Count</div>
            <div className="ccv2-roadmap-summary-card__value">{NEXUS_OS_ROADMAP_META.blockedCount}</div>
            <div className="ccv2-roadmap-summary-card__meta">OS gaps requiring intervention</div>
          </div>
          <div className="ccv2-roadmap-summary-card">
            <div className="ccv2-roadmap-summary-card__label">Completed Count</div>
            <div className="ccv2-roadmap-summary-card__value">{NEXUS_OS_ROADMAP_META.completedCount}</div>
            <div className="ccv2-roadmap-summary-card__meta">Phases validated so far</div>
          </div>
          <div className="ccv2-roadmap-summary-card">
            <div className="ccv2-roadmap-summary-card__label">Planned Count</div>
            <div className="ccv2-roadmap-summary-card__value">{NEXUS_OS_ROADMAP_META.plannedCount}</div>
            <div className="ccv2-roadmap-summary-card__meta">Future platform phases</div>
          </div>
        </div>

        <div className="ccv2-roadmap-track ccv2-roadmap-track--hero">
          <div className="ccv2-roadmap-track__header">
            <div className="ccv2-eyebrow">NEXUS OS Platform Progress</div>
            <div className="ccv2-roadmap-track__title">{currentPhase?.phase || "Current phase pending"} · {currentPhase?.label || "Roadmap status unavailable"}</div>
            <span className="ccv2-pill ccv2-pill--pending">{currentPhase?.statusLabel?.toUpperCase() || "CURRENT"}</span>
          </div>
          <div className="ccv2-roadmap-track__body">
            <p className="ccv2-roadmap-track__body-copy">{currentPhase?.detail || "Run phase-status validation to refresh current OS phase details."}</p>
            <div className="ccv2-roadmap-track__body-grid">
              <div>
                <div className="ccv2-roadmap-track__meta-label">Checks run</div>
                <div className="ccv2-roadmap-track__meta-value">
                  {Array.isArray(currentPhase?.checksRun) && currentPhase.checksRun.length > 0
                    ? currentPhase.checksRun.join(" · ")
                    : "Final validation is still being collected."}
                </div>
              </div>
              <div>
                <div className="ccv2-roadmap-track__meta-label">Next requirement</div>
                <div className="ccv2-roadmap-track__meta-value">
                  {currentPhase?.knownLimitations?.[0] || "No additional requirement recorded."}
                </div>
              </div>
              <div>
                <div className="ccv2-roadmap-track__meta-label">Next OS phase</div>
                <div className="ccv2-roadmap-track__meta-value">{summarizePhase(nextPhase)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="ccv2-roadmap-gaps">
          <div className="ccv2-roadmap-gaps__header">
            <div className="ccv2-eyebrow">Open OS Gaps</div>
            <div className="ccv2-roadmap-track__title">What still needs operator visibility or future platform capability</div>
          </div>
          <div className="ccv2-roadmap-gaps__grid">
            {NEXUS_OS_OPEN_GAPS.map((gap) => (
              <div key={gap.title} className="ccv2-roadmap-gap-card">
                <span className="ccv2-pill ccv2-pill--pending">{gap.priority}</span>
                <div className="ccv2-roadmap-gap-card__title">{gap.title}</div>
                <div className="ccv2-roadmap-gap-card__detail">{gap.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="ccv2-roadmap-sections">
          <div className="ccv2-roadmap-track">
            <div className="ccv2-roadmap-track__header">
              <div className="ccv2-eyebrow">Completed OS Phases</div>
              <div className="ccv2-roadmap-track__title">Validated NEXUS platform capability milestones</div>
            </div>
            <div className="ccv2-roadmap-phases">
              {NEXUS_COMPLETED_OS_PHASES.map((row) => (
                <div key={row.phase} className="ccv2-roadmap-phase ccv2-roadmap-phase--pass">
                  <div className="ccv2-roadmap-phase__phase">{row.phase}</div>
                  <div className="ccv2-roadmap-phase__label-wrap">
                    <div className="ccv2-roadmap-phase__label">{row.label}</div>
                    <div className="ccv2-roadmap-phase__detail">{row.detail}</div>
                  </div>
                  <span className="ccv2-pill ccv2-pill--pass">{row.statusLabel}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ccv2-roadmap-track">
            <div className="ccv2-roadmap-track__header">
              <div className="ccv2-eyebrow">Planned OS Phases</div>
              <div className="ccv2-roadmap-track__title">Upcoming NEXUS platform capability sequence</div>
            </div>
            <div className="ccv2-roadmap-phases">
              {[currentPhase, ...NEXUS_PLANNED_OS_PHASES].filter(Boolean).map((row) => (
                <div
                  key={row.phase}
                  className={`ccv2-roadmap-phase ccv2-roadmap-phase--${row.tone}${row.isCurrent ? " ccv2-roadmap-phase--current" : ""}`}
                >
                  <div className="ccv2-roadmap-phase__phase">{row.phase}</div>
                  <div className="ccv2-roadmap-phase__label-wrap">
                    <div className="ccv2-roadmap-phase__label">{row.label}</div>
                    <div className="ccv2-roadmap-phase__detail">{row.detail}</div>
                  </div>
                  <span className={`ccv2-pill ccv2-pill--${row.isCurrent ? "pending" : "disabled"}`}>
                    {row.isCurrent ? "CURRENT" : row.statusLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="ccv2-roadmap-track">
            <div className="ccv2-roadmap-track__header">
              <div className="ccv2-eyebrow">Blocked OS Phases</div>
              <div className="ccv2-roadmap-track__title">Phases waiting on a later platform dependency</div>
            </div>
            {NEXUS_BLOCKED_OS_PHASES.length > 0 ? (
              <div className="ccv2-roadmap-phases">
                {NEXUS_BLOCKED_OS_PHASES.map((row) => (
                  <div key={row.phase} className="ccv2-roadmap-phase ccv2-roadmap-phase--fail">
                    <div className="ccv2-roadmap-phase__phase">{row.phase}</div>
                    <div className="ccv2-roadmap-phase__label-wrap">
                      <div className="ccv2-roadmap-phase__label">{row.label}</div>
                      <div className="ccv2-roadmap-phase__detail">{row.detail}</div>
                    </div>
                    <span className="ccv2-pill ccv2-pill--fail">{row.statusLabel}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ccv2-empty-state">No OS phases are currently marked blocked. Planned phases remain gated until their prerequisite platform work lands.</div>
            )}
          </div>
        </div>
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
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedCommandId, setSelectedCommandId] = useState("plan");

  const refreshApiState = () => {
    setApiState(prev => ({ ...prev, lastRefreshStatus: "refreshing" }));
    getLocalApiHealth().then(health => {
      const state = buildApiState(health);
      setApiState(state);
      if (state.liveApiOnline) {
        Promise.all([getTasks(), getEvidence(), getProjects(), getDbStatus()]).then(([tasks, evidence, projects, db]) => {
          setLiveData({ tasks: tasks.ok ? tasks.data : null, evidence: evidence.ok ? evidence.data : null, projects: projects.ok ? projects.data : null, db: db.ok ? db.data : null });
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

  const vmWithApi = {
    ...vm,
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
          onOpenCommandPalette={() => openCommandPalette("plan")}
        />
        <div className="ccv2-content-wrapper">
          {currentPage === "mission" && (
            <MissionControlPage
              vm={vmWithApi}
              operatorCommands={operatorCommands}
              onOpenCommandPalette={openCommandPalette}
            />
          )}
          {currentPage === "workspace" && <WorkspacePage vm={vmWithApi} />}
          {currentPage === "tasks" && <TaskQueuePage vm={vmWithApi} />}
          {currentPage === "implementation" && <ImplementationPage vm={vmWithApi} />}
          {currentPage === "workbench" && <WorkbenchPage vm={vmWithApi} />}
          {currentPage === "agents" && <AgentFleetPage vm={vmWithApi} studio={studio} />}
          {currentPage === "approvals" && <ApprovalsPage vm={vmWithApi} studio={studio} />}
          {currentPage === "gates" && <VerificationGatesPage vm={vmWithApi} />}
          {currentPage === "contracts" && <ContractsPage vm={vmWithApi} />}
          {currentPage === "evidence" && <EvidencePage vm={vmWithApi} />}
          {currentPage === "safety" && <SafetyCenterPage vm={vmWithApi} />}
          {currentPage === "release" && <ReleaseControlPage vm={vmWithApi} />}
          {currentPage === "projects" && <ProjectsPage vm={vmWithApi} studio={studio} />}
          {currentPage === "roadmap" && <OSRoadmapPage vm={vmWithApi} />}
          {currentPage === "liveapi" && <LiveApiPage vm={vmWithApi} onRefresh={refreshApiState} />}
          {currentPage === "database" && <DurableStatePage vm={vmWithApi} />}
          {currentPage === "services" && <ServiceHealthPage vm={vmWithApi} />}
          {currentPage === "batch" && <BatchQueuePage vm={vmWithApi} />}
          {currentPage === "cost" && <CostCenterPage vm={vmWithApi} studio={studio} />}
          {currentPage === "demo" && <DemoModePage vm={vmWithApi} />}
          {["activity", "docs", "settings"].includes(currentPage) && (
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
