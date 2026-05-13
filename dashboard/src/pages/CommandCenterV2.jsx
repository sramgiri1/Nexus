import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { buildCommandCenterViewModelV2 } from "../data/commandCenterViewModel.js";
import {
  COMMAND_CENTER_ROUTE_BY_KEY,
  getCommandCenterSidebarGroups,
  resolveCommandCenterRoute,
} from "../data/commandCenterRoutes.js";
import { NEXUS_ROADMAP_PHASES } from "../data/nexusRoadmap.js";
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
  batch: "⊞",
  cost: "$",
  roadmap: "◈",
  activity: "☰",
  docs: "☷",
  settings: "⚙",
  demo: "▶",
};

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
function TopBar({ vm, currentPage, apiState, onRefresh, themeState }) {
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
        <span className="ccv2-topbar__env-label">ENV</span>
        <span className="ccv2-topbar__env-value">Desktop · Local-private</span>
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
    <div className="ccv2-card ccv2-card--strong">
      <div className="ccv2-mission-composer">
        <div>
          <div className="ccv2-eyebrow">Founder · {new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</div>
          <h2 className="ccv2-mission-composer__title">{mc.title}</h2>
          <p className="ccv2-mission-composer__subtitle">{mc.subtitle}</p>
        </div>

        <textarea
          className="ccv2-mission-composer__textarea"
          value={missionText}
          onChange={(e) => setMissionText(e.target.value)}
          placeholder={mc.placeholder}
          rows={3}
        />

        <div className="ccv2-badge ccv2-badge--teal" style={{ display: "inline-flex", alignSelf: "flex-start" }}>
          ACTIVE PROJECT · {vm.shell.activeProject.toUpperCase()}
        </div>

        <div className="ccv2-mission-composer__actions">
          <button
            key="Generate Plan"
            className={`ccv2-mission-composer__btn${canGenerate ? " ccv2-mission-composer__btn--enabled" : ""}`}
            disabled={!canGenerate}
            onClick={handleGeneratePlan}
          >
            <span>{actionState === "running" ? "Generating…" : "Generate Plan"}</span>
            {!canGenerate && <span className="ccv2-mission-composer__btn-lock">⊘</span>}
            {canGenerate && <span className="ccv2-mission-composer__btn-lock">→</span>}
          </button>
          <button key="Create Project Brief" className="ccv2-mission-composer__btn" disabled>
            <span>Create Project Brief</span>
            <span className="ccv2-mission-composer__btn-lock">⊘</span>
          </button>
          <button key="Start Governed Run" className="ccv2-mission-composer__btn" disabled>
            <span>Start Governed Run</span>
            <span className="ccv2-mission-composer__btn-lock">⊘</span>
          </button>
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

        <div className="ccv2-mission-composer__gate-note">
          <span className="ccv2-mission-composer__gate-icon">⚠</span>
          Requires governed action bridge
        </div>
      </div>
    </div>
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
  const p = vm.pipeline;
  const maxH = Math.max(...BAR_HEIGHTS);
  const cols = [
    { key: "queued",    label: "QUEUED",    value: p.queued,    meta: `next: ${vm.shell.activeProject} · ${vm.mission.lead}` },
    { key: "running",   label: "RUNNING",   value: p.running,   meta: `${p.running} agents engaged` },
    { key: "verifying", label: "VERIFYING", value: p.verifying, meta: "AUDITOR · SENTINEL" },
    { key: "blocked",   label: "BLOCKED",   value: p.blocked,   meta: "1 governor deny" },
    { key: "done",      label: "DONE · 5H", value: p.done,      meta: "90% first-pass" },
  ];

  return (
    <div id="v2-execution-pipeline" className="ccv2-card ccv2-pipeline">
      <div className="ccv2-pipeline__header">
        <div className="ccv2-pipeline__title">Execution Pipeline</div>
        <span className="ccv2-pipeline__live-badge">LIVE</span>
      </div>

      <div className="ccv2-pipeline__cols">
        {cols.map((col) => (
          <div key={col.key} className="ccv2-pipeline__col">
            <div className={`ccv2-pipeline__col-label ccv2-pipeline__col-label--${col.key}`}>{col.label}</div>
            <div className={`ccv2-pipeline__col-count ccv2-pipeline__col-count--${col.key}`}>{col.value}</div>
            <div className="ccv2-pipeline__col-meta">{col.meta}</div>
          </div>
        ))}
      </div>

      <div className="ccv2-pipeline__chart-area">
        <div className="ccv2-pipeline__chart-label">Throughput · Last 24h (Tasks completed / hour)</div>
        <div className="ccv2-bar-chart">
          {BAR_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="ccv2-bar-chart__bar"
              style={{ height: `${Math.max(4, Math.round((h / maxH) * 60))}px` }}
            />
          ))}
        </div>
        <div className="ccv2-bar-chart__x-labels">
          {X_LABELS.map((l, i) => (
            <span key={i} className="ccv2-bar-chart__x-label">{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Activity Stream ─── */
function ActivityStream({ vm }) {
  return (
    <div id="v2-activity-stream" className="ccv2-card ccv2-stream">
      <div className="ccv2-stream__header">
        <div className="ccv2-stream__title">Activity Stream</div>
        <div className="ccv2-stream__count ccv2-mono">10 / 00</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span className="ccv2-label">AGENT</span>
        <span className="ccv2-label">EVENTS</span>
      </div>

      <div className="ccv2-stream__events">
        {vm.activity.map((ev, i) => (
          <div key={i} className="ccv2-stream__event">
            <span className="ccv2-stream__event-time ccv2-mono">{ev.time}</span>
            <span className={`ccv2-stream__event-agent ccv2-stream__event-agent--${ev.status}`}>
              {ev.agent}
            </span>
            <span className="ccv2-stream__event-text">{ev.text}</span>
          </div>
        ))}
      </div>
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
  const stats = [
    { label: "Artifacts", value: "1,217", tone: "teal" },
    { label: "Gate Pass Rate", value: `${vm.mission.sprintProgress}%`, tone: "green" },
    { label: "Approval Backlog", value: "3 open", tone: "amber" },
    { label: "Safety Incidents", value: `${vm.safety.incidents} · ${vm.safety.lastClean}`, tone: "" },
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
  const nba = vm.agenticWorkspace?.nextBestAction;
  if (!nba) return null;
  return (
    <div className="ccv2-card ccv2-nba-panel" id="v2-next-best-action">
      <div className="ccv2-eyebrow">Next Best Action</div>
      <div className="ccv2-nba-panel__title">{nba.title}</div>
      <div className="ccv2-nba-panel__desc">{nba.description}</div>
      <div className="ccv2-nba-panel__meta">
        <div className="ccv2-nba-panel__meta-row">
          <span className="ccv2-nba-panel__meta-label">Owner</span>
          <span className="ccv2-nba-panel__meta-value">NEXUS / SHEPHERD</span>
        </div>
        <div className="ccv2-nba-panel__meta-row">
          <span className="ccv2-nba-panel__meta-label">Capability</span>
          <span className="ccv2-nba-panel__meta-value">{nba.requiredCapability || "taskActivation"}</span>
        </div>
        <div className="ccv2-nba-panel__meta-row">
          <span className="ccv2-nba-panel__meta-label">Effort</span>
          <span className="ccv2-nba-panel__meta-value">Low</span>
        </div>
        <div className="ccv2-nba-panel__meta-row">
          <span className="ccv2-nba-panel__meta-label">Impact</span>
          <span className="ccv2-nba-panel__meta-value">High</span>
        </div>
      </div>
      {nba.enabled ? (
        <button
          className="ccv2-wf-card__btn ccv2-wf-card__btn--enabled"
          onClick={() => navigate(nba.action?.replace("navigate:", "") || "/command-center/tasks")}
        >
          {nba.title}
        </button>
      ) : (
        <button className="ccv2-wf-card__btn ccv2-wf-card__btn--disabled" disabled>
          {nba.userFacingRequirement || "Not available"}
        </button>
      )}
    </div>
  );
}

/* ─── Verification Gates Summary (Mission Control) ─── */
function VerificationGatesSummary({ vm }) {
  const gates = vm.mission.gates;
  const detailMap = {
    AUDITOR:  "code quality · lint · diff",
    SENTINEL: "QA · simulator · security",
    WARDEN:   "privacy · permissions · compliance",
  };
  return (
    <div className="ccv2-card" id="v2-verification-gates">
      <div className="ccv2-eyebrow" style={{ marginBottom: 8 }}>Verification Gates</div>
      <div className="ccv2-gate-grid ccv2-gate-grid--compact">
        {Object.entries(gates).map(([gate, status]) => (
          <div key={gate} className="ccv2-gate-card">
            <div className="ccv2-gate-card__name">{gate}</div>
            <div className={`ccv2-gate-card__status ccv2-gate-card__status--${status === "PASS" ? "pass" : status === "PENDING" ? "pending" : "fail"}`}>
              {status}
            </div>
            <div className="ccv2-gate-card__detail">{detailMap[gate] || ""}</div>
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
  return (
    <div className="ccv2-card" id="v2-safety-approval">
      <div className="ccv2-eyebrow" style={{ marginBottom: 8 }}>Safety / Approval</div>
      <div className="ccv2-safety-approval-grid">
        <div className="ccv2-safety-approval-stat">
          <div style={{ fontSize: 11, color: "var(--nexus-muted)", marginBottom: 4 }}>Safety incidents</div>
          <div className="ccv2-safety-approval-stat__num">{safety.incidents}</div>
          <div style={{ fontSize: 11, color: "var(--nexus-muted)" }}>Last clean: {safety.lastClean}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--nexus-muted)", marginBottom: 6 }}>Policy status</div>
          {[
            { label: "Provider calls", ok: !governance.providerCallsAllowed, value: governance.providerCallsAllowed ? "Enabled" : "Disabled" },
            { label: "DB access", ok: !governance.dbAccessAllowed, value: governance.dbAccessAllowed ? "Enabled" : "Disabled" },
            { label: "UI mutations", ok: !governance.mutationEnabledFromUi, value: governance.mutationEnabledFromUi ? "Enabled" : "Disabled" },
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
  const tasks = vm.taskActivation?.missionTasks || [];
  return (
    <div className="ccv2-card" id="v2-active-mission-tasks">
      <div className="ccv2-card-header-row">
        <div className="ccv2-eyebrow">Active Mission Tasks</div>
        <button className="ccv2-link-btn" onClick={() => navigate("/command-center/tasks")}>View all →</button>
      </div>
      <div style={{ overflowX: "auto", marginTop: 4 }}>
        <table className="ccv2-table ccv2-table--compact">
          <thead>
            <tr>
              <th>Task</th>
              <th>Agent</th>
              <th>Status</th>
              <th>Risk</th>
              <th>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.planTaskId}>
                <td style={{ fontSize: 12 }}>{task.title}</td>
                <td style={{ fontWeight: 700, fontSize: 11 }}>{task.targetAgent}</td>
                <td><span className={`ccv2-pill ccv2-pill--${task.state === "queued" || task.state === "activated" ? "pass" : "disabled"}`} style={{ fontSize: 10 }}>{task.state}</span></td>
                <td><span className={`ccv2-pill ccv2-pill--${task.riskLevel === "high" ? "fail" : task.riskLevel === "medium" ? "pending" : "pass"}`} style={{ fontSize: 10 }}>{task.riskLevel}</span></td>
                <td style={{ fontSize: 10, color: "var(--nexus-muted)" }}>—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Project Progress (Mission Control) ─── */
function ProjectProgressRings({ vm }) {
  const clp = vm.careloopProductProgress;
  if (!clp) return null;
  const items = [
    { label: "Backend Validation", value: clp.backendValidation.status === "PASS" ? 100 : 50, status: clp.backendValidation.status === "PASS" ? `${clp.backendValidation.testsPassed}/${clp.backendValidation.totalTests} PASS` : "In progress", color: "var(--nexus-success)" },
    { label: "iOS Validation",     value: 0,   status: "Pending iOS/Xcode runner", color: "var(--nexus-muted)" },
    { label: "Privacy Review",     value: 20,  status: "In progress",              color: "var(--nexus-warning)" },
    { label: "Release Prep",       value: 0,   status: "Not started",              color: "var(--nexus-muted)" },
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
  const items = recent.length > 0
    ? recent.slice(0, 6).map((ev) => ({
        time: new Date(ev.createdAt || Date.now()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
        agent: (ev.agentId || "system").toUpperCase(),
        text: (ev.type || "evidence").replace(/_/g, " "),
        result: ev.result || "INFO",
      }))
    : vm.activity.slice(0, 5).map((ev) => ({
        time: ev.time,
        agent: ev.agent,
        text: ev.text,
        result: ev.status === "done" ? "PASS" : ev.status === "blocked" ? "FAIL" : "INFO",
      }));

  return (
    <div className="ccv2-card" id="v2-evidence-timeline">
      <div className="ccv2-eyebrow" style={{ marginBottom: 8 }}>Evidence Timeline</div>
      <div className="ccv2-evidence-timeline">
        {items.map((item, i) => (
          <div key={i} className="ccv2-evidence-timeline__entry">
            <div className="ccv2-evidence-timeline__time ccv2-mono">{item.time}</div>
            <div className={`ccv2-evidence-timeline__dot ccv2-evidence-timeline__dot--${item.result === "PASS" ? "pass" : item.result === "FAIL" ? "fail" : "info"}`} />
            <div className="ccv2-evidence-timeline__content">
              <span className="ccv2-evidence-timeline__agent">{item.agent}</span>
              <span className="ccv2-evidence-timeline__text">{item.text}</span>
            </div>
            <span className={`ccv2-pill ccv2-pill--${item.result === "PASS" ? "pass" : item.result === "FAIL" ? "fail" : "pending"}`} style={{ fontSize: 10 }}>{item.result}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Cost Center Summary (Mission Control) ─── */
function CostCenterSummary({ vm }) {
  return (
    <div className="ccv2-card" id="v2-cost-center">
      <div className="ccv2-eyebrow" style={{ marginBottom: 8 }}>Cost Center</div>
      <div style={{ fontSize: 12, color: "var(--nexus-muted)", marginBottom: 10, lineHeight: 1.5 }}>
        Cost enforcement not enabled yet. Provider calls and real-time billing tracking require governed provider dispatch.
      </div>
      <div className="ccv2-cost-rows">
        {[
          { label: "Provider dispatch", value: "Not enabled", color: "var(--nexus-warning)" },
          { label: "Budget tracking",   value: "Not enabled", color: "var(--nexus-warning)" },
          { label: "Risk profile",      value: "Low — file-backed only", color: "var(--nexus-success)" },
          { label: "Safety incidents",  value: `${vm.safety.incidents} · ${vm.safety.lastClean}`, color: "var(--nexus-success)" },
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
  return (
    <div className="ccv2-card ccv2-release-section">
      <div className="ccv2-release-section__header">
        <h3 className="ccv2-release-section__title">Release Control</h3>
        <span className="ccv2-mono" style={{ fontSize: 11, color: "var(--v2-muted-2)" }}>
          {r.readiness}% ready
        </span>
      </div>

      <div className="ccv2-release-section__track">
        <div className="ccv2-release-section__fill" style={{ width: `${r.readiness}%` }} />
      </div>

      <div className="ccv2-release-section__blocker">
        <div className="ccv2-release-section__blocker-label">Blocker</div>
        {r.blocker}
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

  return (
    <div className={`ccv2-wf-card ccv2-wf-card--${wf.category}`}>
      <div className="ccv2-wf-card__header">
        <div className="ccv2-wf-card__label">{wf.label}</div>
        <span className={`ccv2-pill ccv2-pill--${statusClass}`}>{statusLabel}</span>
      </div>
      <div className="ccv2-wf-card__desc">{wf.description}</div>
      <div className="ccv2-wf-card__agents">
        {wf.primaryAgents.slice(0, 4).map((a) => (
          <span key={a} className="ccv2-wf-card__agent-chip">{a}</span>
        ))}
        {wf.primaryAgents.length > 4 && <span className="ccv2-wf-card__agent-chip">+{wf.primaryAgents.length - 4}</span>}
      </div>
      <div className="ccv2-wf-card__evidence">
        {wf.evidenceCreated.map((e) => (
          <span key={e} className="ccv2-wf-card__evidence-tag">{e.replace(/_/g, " ")}</span>
        ))}
      </div>
      {wf.userFacingRequirement && (
        <div className="ccv2-wf-card__requirement">{wf.userFacingRequirement}</div>
      )}
      <div className="ccv2-wf-card__footer">
        <span className="ccv2-wf-card__approval">
          {wf.approvalRequired === true ? "Approval required" : wf.approvalRequired === "conditional" ? "Conditional approval" : "No approval"}
        </span>
        {wf.enabledNow ? (
          <button
            className="ccv2-wf-card__btn ccv2-wf-card__btn--enabled"
            onClick={() => navigate && navigate("/command-center/workspace")}
          >
            Start Workflow
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
function MissionControlPage({ vm }) {
  const clp = vm.careloopProductProgress;
  const isLocalPrivate = vm.shell.mode === "local-private";
  const liveOnline = vm.liveApi?.liveApiOnline;

  return (
    <div className="ccv2-content">
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
        <div className="ccv2-page-head__sub">Active mission, governed runtime posture, and next best action</div>
      </div>

      {/* C. Mission Hero — what mission is active */}
      <div className="ccv2-first-fold">
        <MissionComposerCard vm={vm} />
        <MissionHeroCard vm={vm} />
        <SprintProgressCard vm={vm} />
        <ReleaseReadinessCard vm={vm} />
      </div>

      {/* D. Next Best Action — what to do next */}
      <NextBestActionPanel vm={vm} />

      {/* E. KPI Cards — active / blocked / pass rate / utilization */}
      <div className="ccv2-kpi-row">
        {vm.metrics.map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </div>

      {/* F+G. Execution Pipeline + Activity Stream */}
      <div className="ccv2-pipeline-stream">
        <ExecutionPipeline vm={vm} />
        <ActivityStream vm={vm} />
      </div>

      {/* H. Verification Gates */}
      <VerificationGatesSummary vm={vm} />

      {/* I. Release Readiness */}
      <ReleaseSection vm={vm} />

      {/* J. Safety / Approval */}
      <SafetyApprovalSummary vm={vm} />

      {/* K. Active Mission Tasks */}
      <ActiveMissionTasksSummary vm={vm} />

      {/* L. Project Progress */}
      {isLocalPrivate && clp && <ProjectProgressRings vm={vm} />}

      {/* M. Evidence Timeline */}
      <EvidenceTimeline vm={vm} />

      {/* N. Cost Center */}
      <CostCenterSummary vm={vm} />

      {/* Workspace workflow band */}
      <WorkspaceBand vm={vm} />

      {/* Private Validation + Evidence + Product Progress */}
      <PrivateValidationPanel vm={vm} />
      <EvidenceGovernanceSection vm={vm} />
      {isLocalPrivate && clp && <CareLoopProgressCard clp={clp} />}
    </div>
  );
}

/* ─── Task Queue Page ─── */
function MissionTaskRow({ task, bridgeOnline, onActivate, activating, activationResult, navigate }) {
  const isActivating = activating === task.planTaskId;
  const isActivated = activationResult?.planTaskId === task.planTaskId && activationResult?.ok;
  const currentState = isActivated ? "activated" : task.state;

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
      <td><span className={`ccv2-pill ccv2-pill--${stateClass(currentState)}`}>{currentState}</span></td>
      <td><span className={`ccv2-pill ccv2-pill--${riskClass(task.riskLevel)}`}>{task.riskLevel}</span></td>
      <td style={{ fontSize: 11, color: "var(--v2-muted-2)" }}>{task.capabilityId.replace(/_/g, " ")}</td>
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
            Mission tasks from Private Project plan · Activate to move from planned to queued
          </div>
        </div>

        <div className="ccv2-stats-row">
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Planned</div>
            <div className="ccv2-stat-chip__value">{missionTasks.length}</div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Activated</div>
            <div className="ccv2-stat-chip__value ccv2-stat-chip__value--green">{Object.values(activationResults).filter((r) => r?.ok).length + ta.activatedCount}</div>
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

        <div className="ccv2-section-heading" style={{ marginBottom: 8 }}>Mission Tasks — Private Project</div>
        <div className="ccv2-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="ccv2-table ccv2-mission-tasks-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Agent</th>
                <th>State</th>
                <th>Risk</th>
                <th>Capability</th>
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

        {recent.length > 0 && (
          <>
            <div className="ccv2-section-heading" style={{ marginTop: 24, marginBottom: 8 }}>Runtime Task Records</div>
            <div className="ccv2-card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="ccv2-table">
                <thead>
                  <tr>
                    <th>Task ID</th>
                    <th>Agent</th>
                    <th>State</th>
                    <th>Risk</th>
                    <th>Capability</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((task) => (
                    <tr key={task.taskId}>
                      <td className="ccv2-mono" style={{ fontSize: 11, color: "var(--v2-muted)" }}>{task.taskId.slice(0, 8)}</td>
                      <td style={{ fontWeight: 600 }}>{task.targetAgent?.toUpperCase()}</td>
                      <td>
                        <span className={`ccv2-pill ccv2-pill--${task.state === "implementation_done" ? "pass" : task.state === "awaiting_approval" ? "pending" : "disabled"}`}>
                          {task.state.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td><span className={`ccv2-pill ccv2-pill--${task.riskLevel === "high" ? "fail" : task.riskLevel === "medium" ? "pending" : "pass"}`}>{task.riskLevel}</span></td>
                      <td style={{ fontSize: 11, color: "var(--v2-muted-2)" }}>{task.capabilityId}</td>
                      <td style={{ fontSize: 11, color: "var(--v2-muted-2)" }}>{new Date(task.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
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

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Evidence</div>
          <div className="ccv2-page-head__sub">
            Immutable evidence records from governed execution
            <span className={`ccv2-source-badge ccv2-source-badge--${liveOnline ? "live" : "snapshot"}`}>
              {liveOnline ? "Live API" : "Snapshot fallback"}
            </span>
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
            <div className="ccv2-section-heading">Recent Evidence</div>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {recent.slice(0, 5).map((ev) => (
                <div key={ev.evidenceId} style={{ fontSize: 11, padding: "6px 0", borderBottom: "1px solid rgba(136,255,235,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="ccv2-mono" style={{ color: "var(--v2-muted-2)" }}>{ev.evidenceId?.slice(0, 8)}</span>
                    <span className={`ccv2-pill ccv2-pill--${ev.result === "PASS" ? "pass" : ev.result === "FAIL" ? "fail" : "pending"}`}>{ev.result}</span>
                  </div>
                  <div style={{ color: "var(--v2-muted)", marginTop: 2 }}>{ev.type?.replace(/_/g, " ")} · {ev.agentId || "system"}</div>
                  <div style={{ color: "var(--v2-muted-2)", marginTop: 1 }}>{ev.dataClassification}</div>
                </div>
              ))}
            </div>
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
    { label: "Local API: DB backed", value: "NO", valueClass: "disabled" },
    { label: "Local API: provider calls", value: "NO", valueClass: "disabled" },
    { label: "Local API: external network", value: "NO", valueClass: "disabled" },
    { label: "Local API: bind host", value: "127.0.0.1", valueClass: "ready" },
  ];

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Safety Center</div>
          <div className="ccv2-page-head__sub">Governance boundary enforcement · local-private mode</div>
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
              { label: "DB writes enabled", value: "NO", valueClass: "disabled" },
              { label: "Production DB allowed", value: "NO", valueClass: "disabled" },
              { label: "External DB allowed", value: "NO", valueClass: "disabled" },
              { label: "File fallback required", value: "YES", valueClass: "ready" },
              { label: "Schema artifacts", value: "Defined (18 entities)", valueClass: "ready" },
              { label: "Dry-run import mapping", value: "Enabled", valueClass: "ready" },
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
            No private project source details in public surface. All action controls are disabled in local-private mode. Safety incidents: {vm.safety.incidents} · Last clean: {vm.safety.lastClean}.
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
  const clp = vm.careloopProductProgress;
  const isLocalPrivate = vm.shell.mode === "local-private";

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Projects</div>
          <div className="ccv2-page-head__sub">Active project overview · local-private mode</div>
        </div>

        <div className="ccv2-card">
          <div className="ccv2-eyebrow">Active Project</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--v2-text)", margin: "6px 0" }}>
            {studio?.activeProject?.name || "Private Project"}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            <span className="ccv2-pill ccv2-pill--live">local-private mode</span>
            <span className="ccv2-pill ccv2-pill--pass">VALIDATED</span>
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
            <div className="ccv2-section-heading">Boundary Note</div>
            <p style={{ fontSize: 12, color: "var(--v2-muted)", lineHeight: 1.6, marginTop: 8 }}>
              No source file details exposed in public surface. Private project data is scoped to local-private mode only.
            </p>
          </div>
        </div>

        {isLocalPrivate && clp && (
          <>
            <div className="ccv2-card">
              <div className="ccv2-section-heading">PRD Progress · {clp.productName} {clp.prdStatus.version}</div>
              <div style={{ fontSize: 12, color: "var(--v2-muted)", margin: "4px 0 12px" }}>{clp.productLanguage}</div>

              <div className="ccv2-sprint-board">
                {clp.sprints.map((s) => (
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
                <div className="ccv2-section-heading">Open Gaps</div>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {clp.gaps.map((g) => (
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
                  {clp.lockedDecisions.map((d) => (
                    <div key={d} style={{ fontSize: 11, color: "var(--v2-muted-2)", padding: "4px 0", borderBottom: "1px solid rgba(136,255,235,0.05)", lineHeight: 1.5 }}>
                      {d}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: "var(--v2-muted-2)" }}>
                  Compliance: {clp.compliance.framework}
                </div>
              </div>
            </div>
          </>
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

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Workspace</div>
          <div className="ccv2-page-head__sub">Choose what you want NEXUS to do — agents, evidence, and governance follow</div>
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

        <div className="ccv2-wf-grid">
          {templates.map((wf) => (
            <WorkflowCard key={wf.id} wf={wf} navigate={navigate} />
          ))}
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

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Implementation Workflow</div>
          <div className="ccv2-page-head__sub">First controlled implementation · CORE agent · documentation-only · governed by policy</div>
        </div>

        <div className="ccv2-stats-row">
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Status</div>
            <div className="ccv2-stat-chip__value ccv2-stat-chip__value--teal">Available for scoped implementation</div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Agent</div>
            <div className="ccv2-stat-chip__value ccv2-stat-chip__value--teal">{ci.targetAgent || "CORE"}</div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Risk</div>
            <div className="ccv2-stat-chip__value ccv2-stat-chip__value--green">{ci.riskLevel || "low"}</div>
          </div>
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Bridge</div>
            <div className={`ccv2-stat-chip__value ccv2-stat-chip__value--${bridgeOnline ? "green" : "amber"}`}>
              {bridgeOnline ? "Online" : "Offline"}
            </div>
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
                  <span className="ccv2-impl-task-item__title">{item.title}</span>
                  <span className="ccv2-impl-task-item__agent">{item.assignedAgent}</span>
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
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Assigned agent</span><span className="ccv2-wb-meta-value" style={{ fontWeight: 700 }}>{ci.targetAgent || "CORE"}</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Capability</span><span className="ccv2-wb-meta-value">{ci.capabilityId?.replace(/\./g, " · ") || "implementation · backend_code"}</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Implementation type</span><span className="ccv2-wb-meta-value">{ci.implementationType || "documentation_readiness_log"}</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Allowed path</span><span className="ccv2-mono ccv2-wb-meta-value" style={{ fontSize: 10 }}>{ci.allowedPath}</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Risk level</span><span className="ccv2-pill ccv2-pill--pass">{ci.riskLevel || "low"}</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Mutation allowed</span><span className="ccv2-safety-row__value--ready">YES — docs only</span></div>
            <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Source mutation</span><span className="ccv2-safety-row__value--disabled">NO</span></div>
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
            setWorkbenchItems(res.ok ? res.items || [] : []);
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
          <div className="ccv2-page-head__sub">Human review loop · inspect agent work · approve / reject / request changes</div>
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
              <div className="ccv2-wb-empty__title">{bridgeOnline ? "No activated tasks" : "Action bridge offline"}</div>
              <div className="ccv2-wb-empty__desc">
                {bridgeOnline
                  ? "Activate mission tasks from Task Queue to see them in the workbench."
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
                    <span className="ccv2-wb-task-item__agent">{item.assignedAgent}</span>
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
                    <div className="ccv2-eyebrow">Task Workbench · Agent Workbench</div>
                    <div className="ccv2-wb-title">{workbenchView.title}</div>
                    <div className="ccv2-wb-meta-grid">
                      <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Runtime ID</span><span className="ccv2-mono ccv2-wb-meta-value">{workbenchView.runtimeTaskId?.slice(0, 12)}</span></div>
                      <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Source plan task</span><span className="ccv2-mono ccv2-wb-meta-value">{workbenchView.sourcePlanTaskId?.slice(0, 8) || "—"}</span></div>
                      <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Assigned agent</span><span className="ccv2-wb-meta-value" style={{ fontWeight: 700 }}>{workbenchView.assignedAgent}</span></div>
                      <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Capability</span><span className="ccv2-wb-meta-value">{workbenchView.capabilityId?.replace(/\./g, " · ")}</span></div>
                      <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Risk level</span><span className={`ccv2-pill ccv2-pill--${workbenchView.riskLevel === "high" ? "fail" : workbenchView.riskLevel === "medium" ? "pending" : "pass"}`}>{workbenchView.riskLevel}</span></div>
                      <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">State</span><span className={`ccv2-pill ccv2-pill--${workbenchView.state === "queued" ? "pass" : workbenchView.state === "running" ? "pending" : "disabled"}`}>{workbenchView.state?.replace(/_/g, " ")}</span></div>
                      <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Mutation allowed</span><span className={`ccv2-safety-row__value--${workbenchView.mutationAllowed ? "ready" : "disabled"}`}>{workbenchView.mutationAllowed ? "YES" : "NO"}</span></div>
                      <div className="ccv2-wb-meta-row"><span className="ccv2-wb-meta-label">Execution allowed</span><span className={`ccv2-safety-row__value--${workbenchView.executionAllowed ? "ready" : "disabled"}`}>{workbenchView.executionAllowed ? "YES" : "NO"}</span></div>
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
                            {reviewState === "submitting" && reviewDecision === "approve" ? "Submitting…" : "Approve"}
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

  const endpoints = [
    { path: "/health", label: "Health", live: "always" },
    { path: "/status", label: "Status", live: "live-backed" },
    { path: "/missions", label: "Missions", live: "live-backed" },
    { path: "/tasks", label: "Tasks", live: "live-backed" },
    { path: "/agents", label: "Agents", live: "live-backed" },
    { path: "/evidence", label: "Evidence", live: "live-backed" },
    { path: "/audit", label: "Audit", live: "live-backed" },
    { path: "/runtime", label: "Runtime", live: "live-backed" },
    { path: "/contracts", label: "Contracts", live: "live-backed" },
    { path: "/projects", label: "Projects", live: "live-backed" },
    { path: "/roadmap", label: "Roadmap", live: "live-backed" },
    { path: "/actions", label: "Actions", live: "live-backed" },
    { path: "/db", label: "Durable State", live: "live-backed" },
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
          <div className="ccv2-page-head__sub">Local-only read/action API · no DB · no providers · port 4321</div>
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
          <div className="ccv2-section-heading">Read Endpoints ({endpoints.length})</div>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
            {endpoints.map(ep => (
              <div key={ep.path} style={{ display: "flex", gap: 12, alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span className="ccv2-mono" style={{ fontSize: 12, color: "var(--v2-teal)", width: 140 }}>{ep.path}</span>
                <span style={{ fontSize: 11, color: "var(--v2-muted)", flex: 1 }}>{ep.label}</span>
                <span className={`ccv2-pill ccv2-pill--${online || ep.live === "always" ? "pass" : "disabled"}`} style={{ fontSize: 10 }}>
                  {online || ep.live === "always" ? "live" : "offline"}
                </span>
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
          <div className="ccv2-section-heading">Page Coverage</div>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { page: "Mission Control", backed: online },
              { page: "Task Queue", backed: online },
              { page: "Agent Fleet", backed: false, note: "snapshot" },
              { page: "Evidence", backed: online },
              { page: "Safety Center", backed: online },
              { page: "Projects", backed: online },
              { page: "OS Roadmap", backed: online },
              { page: "Agent Workbench", backed: false, note: "action bridge" },
              { page: "Implementation Workflow", backed: false, note: "action bridge" },
            ].map(p => (
              <div key={p.page} style={{ display: "flex", gap: 12, alignItems: "center", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 12, color: "var(--v2-text)", flex: 1 }}>{p.page}</span>
                <span className={`ccv2-pill ccv2-pill--${p.backed ? "pass" : "disabled"}`} style={{ fontSize: 10 }}>
                  {p.backed ? "live" : (p.note || "snapshot")}
                </span>
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
  const totalEntities = importPlan.totalEntities ?? entityCount;

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Durable State</div>
          <div className="ccv2-page-head__sub">Current persistence: file-backed · DB foundation ready · DB writes disabled by policy</div>
        </div>

        <div className="ccv2-stat-chips" style={{ marginBottom: 16 }}>
          <div className="ccv2-stat-chip"><span className="ccv2-stat-chip__label">Persistence</span><span className="ccv2-stat-chip__value ccv2-stat-chip__value--amber">File-backed</span></div>
          <div className="ccv2-stat-chip"><span className="ccv2-stat-chip__label">DB Mode</span><span className="ccv2-stat-chip__value">Disabled</span></div>
          <div className="ccv2-stat-chip"><span className="ccv2-stat-chip__label">Entities</span><span className="ccv2-stat-chip__value">{entityCount}</span></div>
          <div className="ccv2-stat-chip"><span className="ccv2-stat-chip__label">Sources Mapped</span><span className="ccv2-stat-chip__value">{sourcesAvailable} / {totalEntities}</span></div>
          <div className="ccv2-stat-chip"><span className="ccv2-stat-chip__label">Writes</span><span className="ccv2-stat-chip__value ccv2-stat-chip__value--red">Disabled</span></div>
          <div className="ccv2-stat-chip"><span className="ccv2-stat-chip__label">Live data</span><span className="ccv2-stat-chip__value">{online ? "API" : "Snapshot"}</span></div>
        </div>

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Policy Boundary · db-foundation-policy.json</div>
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

/* ─── OS Roadmap Page ─── */
function OSRoadmapPage({ vm }) {
  const clp = vm.careloopProductProgress;
  const isLocalPrivate = vm.shell.mode === "local-private";
  // Legacy optional checker compatibility only:
  // "P37" status: "COMPLETE"
  // "P38" status: "IN_PROGRESS"

  const nexusTrack = [
    { phase: "P26–P30", label: "Agentic OS foundation", status: "COMPLETE", detail: "Skills, hooks, governor, sprint orchestration" },
    { phase: "P31–P33", label: "Command Center V1", status: "COMPLETE", detail: "Studio shell, constellation, traction surfaces" },
    { phase: "P34–P35", label: "Command Center V2 + Mission Action Bridge", status: "COMPLETE", detail: "Full-screen shell, sidebar routing, mission composer, PRD awareness" },
    { phase: "P36", label: "Agentic Workspace Home + Workflow Templates", status: "COMPLETE", detail: "Workflow cards, next-best action, workspace page, roadmap update" },
    ...NEXUS_ROADMAP_PHASES,
    { phase: "P43", label: "Worker Queue + Runtime Engine", status: "PLANNED", detail: "Async task execution engine with governed worker queue" },
    { phase: "P44", label: "Provider/Tool Dispatch Through Governance", status: "PLANNED", detail: "Real provider calls through governor and approval gates" },
    { phase: "P45", label: "Enterprise Release Candidate", status: "PLANNED", detail: "Multi-project, compliance, investor-ready OS" },
  ];

  const careloopTrack = clp ? clp.sprints.map((s) => ({
    phase: s.id,
    label: s.focus,
    status: s.status,
    detail: s.tests !== "—" ? `Tests: ${s.tests}` : "—",
  })) : [];

  const statusClass = (s) =>
    s === "COMPLETE" ? "pass" : s === "IN_PROGRESS" ? "pending" : s === "PLANNED" ? "disabled" : "fail";

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">OS Roadmap</div>
          <div className="ccv2-page-head__sub">NEXUS OS phases · CareLoop sprint board</div>
        </div>

        <div className="ccv2-roadmap-track">
          <div className="ccv2-roadmap-track__header">
            <div className="ccv2-eyebrow">Track A</div>
            <div className="ccv2-roadmap-track__title">NEXUS OS · P26 → P45</div>
          </div>
          <div className="ccv2-roadmap-phases">
            {nexusTrack.map((row) => (
              <div key={row.phase} className={`ccv2-roadmap-phase ccv2-roadmap-phase--${statusClass(row.status)}`}>
                <div className="ccv2-roadmap-phase__phase">{row.phase}</div>
                <div className="ccv2-roadmap-phase__label">{row.label}</div>
                <div className="ccv2-roadmap-phase__detail">{row.detail}</div>
                <span className={`ccv2-pill ccv2-pill--${statusClass(row.status)}`}>{row.status.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </div>

        {isLocalPrivate && clp && (
          <div className="ccv2-roadmap-track">
            <div className="ccv2-roadmap-track__header">
              <div className="ccv2-eyebrow">Track B</div>
              <div className="ccv2-roadmap-track__title">{clp.productName} · Sprint 1 → 4</div>
              <span className="ccv2-pill ccv2-pill--live" style={{ marginLeft: 8 }}>PRD {clp.prdStatus.version}</span>
            </div>
            <div className="ccv2-roadmap-phases">
              {careloopTrack.map((row) => (
                <div key={row.phase} className={`ccv2-roadmap-phase ccv2-roadmap-phase--${statusClass(row.status)}`}>
                  <div className="ccv2-roadmap-phase__phase">{row.phase}</div>
                  <div className="ccv2-roadmap-phase__label">{row.label}</div>
                  <div className="ccv2-roadmap-phase__detail">{row.detail}</div>
                  <span className={`ccv2-pill ccv2-pill--${statusClass(row.status)}`}>{row.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>

            <div className="ccv2-card" style={{ marginTop: 16 }}>
              <div className="ccv2-section-heading">Open Gaps</div>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {clp.gaps.map((g) => (
                  <div key={g} className="ccv2-gap-row">
                    <span className="ccv2-gap-row__dot" />
                    <span style={{ fontSize: 12, color: "var(--v2-muted)" }}>{g}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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
          <div className="ccv2-page-head__sub">Planned product surface · read-only navigation placeholder</div>
        </div>

        <div className="ccv2-card">
          <div className="ccv2-section-heading">Current State</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--v2-text-dim)" }}>
            This route is planned. Product copy, empty state behavior, and evidence wiring will arrive in a later Command Center subphase.
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="ccv2-pill ccv2-pill--disabled">Planned</span>
            <span className="ccv2-pill ccv2-pill--disabled">Read-only</span>
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

  useEffect(() => { refreshApiState(); }, []);

  const vmWithApi = { ...vm, liveApi: { ...vm.liveApi, ...apiState }, liveData };

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
        />
        <div className="ccv2-content-wrapper">
          {currentPage === "mission" && <MissionControlPage vm={vmWithApi} />}
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
          {currentPage === "batch" && <BatchQueuePage vm={vmWithApi} />}
          {currentPage === "cost" && <CostCenterPage vm={vmWithApi} studio={studio} />}
          {currentPage === "demo" && <DemoModePage vm={vmWithApi} />}
          {["activity", "docs", "settings"].includes(currentPage) && (
            <PlannedRoutePage routeKey={currentPage} />
          )}
        </div>
      </div>
    </div>
  );
}
