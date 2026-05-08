import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { buildCommandCenterViewModelV2 } from "../data/commandCenterViewModel.js";
import { privateValidationSnapshot } from "../data/privateValidationSnapshot.js";
import { actionBridgeSnapshot } from "../data/actionBridgeSnapshot.js";
import { runtimeSnapshot } from "../data/runtimeSnapshot.js";
import { LOCAL_REPORT_SNAPSHOT } from "../data/localReports.js";
import "../styles-command-center-v2.css";

/* ─── Page label map ─── */
const PAGE_LABELS = {
  mission: "Mission Control",
  tasks: "Task Queue",
  agents: "Agent Fleet",
  approvals: "Approvals",
  gates: "Verification Gates",
  contracts: "Contracts",
  evidence: "Evidence",
  safety: "Safety Center",
  release: "Release Control",
  projects: "Projects",
  batch: "Batch Queue",
  cost: "Cost Center",
  demo: "Demo Mode",
};

/* ─── Route resolver ─── */
function resolveV2Page(pathname) {
  if (["/", "/command-center", "/command-center/mission"].includes(pathname)) return "mission";
  const m = pathname.match(/^\/command-center\/([a-z-]+)/);
  return m ? m[1] : "mission";
}

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

/* ─── Nav Groups ─── */
const NAV_GROUPS_V2 = [
  {
    group: "OPERATIONS",
    items: [
      { label: "Mission Control", icon: "⬡", badge: "LIVE", path: "/command-center/mission" },
      { label: "Task Queue", icon: "≡", count: "47", path: "/command-center/tasks" },
      { label: "Agent Fleet", icon: "◈", count: "20", path: "/command-center/agents" },
      { label: "Approvals", icon: "✓", count: "3", countTone: "red", path: "/command-center/approvals" },
    ],
  },
  {
    group: "GOVERNANCE",
    items: [
      { label: "Verification Gates", icon: "⬛", path: "/command-center/gates" },
      { label: "Contracts", icon: "◻", path: "/command-center/contracts" },
      { label: "Evidence", icon: "◇", count: "1.2k", path: "/command-center/evidence" },
      { label: "Safety Center", icon: "⚑", path: "/command-center/safety" },
    ],
  },
  {
    group: "DELIVERY",
    items: [
      { label: "Release Control", icon: "⬆", path: "/command-center/release" },
      { label: "Projects", icon: "⬤", count: "4", path: "/command-center/projects" },
    ],
  },
  {
    group: "OPERATIONS · COMPUTE",
    items: [
      { label: "Batch Queue", icon: "⊞", path: "/command-center/batch" },
      { label: "Cost Center", icon: "$", path: "/command-center/cost" },
    ],
  },
  {
    group: "SHOWCASE",
    items: [
      { label: "Demo Mode", icon: "▶", path: "/command-center/demo" },
    ],
  },
];

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
              const isMissionItem = item.label === "Mission Control";
              const isMissionActive = isMissionItem && missionPaths.has(location.pathname);

              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  end={isMissionItem}
                  className={({ isActive }) => {
                    const active = isMissionItem ? isMissionActive : isActive;
                    return `ccv2-nav-item${active ? " ccv2-nav-item--active" : ""}`;
                  }}
                >
                  <span className="ccv2-nav-item__icon">{item.icon}</span>
                  <span className="ccv2-nav-item__label">{item.label}</span>
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
function TopBar({ vm, currentPage }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const pageLabel = PAGE_LABELS[currentPage] || "Mission Control";

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

      <div className="ccv2-topbar__spacer" />

      <div className="ccv2-topbar__modes">
        <span className="ccv2-mode-pill ccv2-mode-pill--active">Desktop</span>
        <span className="ccv2-mode-pill">Demo</span>
        <span className="ccv2-mode-pill">Investor</span>
      </div>

      <div className="ccv2-topbar__time ccv2-mono">{timeStr} UTC</div>
    </header>
  );
}

/* ─── Mission Composer Card ─── */
function MissionComposerCard({ vm }) {
  const mc = vm.missionComposer;
  return (
    <div className="ccv2-card ccv2-card--strong">
      <div className="ccv2-mission-composer">
        <div>
          <div className="ccv2-eyebrow">Founder · {new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</div>
          <h2 className="ccv2-mission-composer__title">{mc.title}</h2>
          <p className="ccv2-mission-composer__subtitle">{mc.subtitle}</p>
        </div>

        <div className="ccv2-mission-composer__textarea">
          <div className="ccv2-mission-composer__placeholder">{mc.placeholder}</div>
          <div style={{ fontSize: 12, color: "var(--v2-muted)", marginTop: 6, lineHeight: 1.6 }}>
            {mc.missionText}
          </div>
        </div>

        <div className="ccv2-badge ccv2-badge--teal" style={{ display: "inline-flex", alignSelf: "flex-start" }}>
          ACTIVE PROJECT · {vm.shell.activeProject.toUpperCase()}
        </div>

        <div className="ccv2-mission-composer__actions">
          {mc.buttons.map((btn) => (
            <button key={btn.label} className="ccv2-mission-composer__btn" disabled>
              <span>{btn.label}</span>
              <span className="ccv2-mission-composer__btn-lock">⊘</span>
            </button>
          ))}
        </div>

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

/* ─── Mission Control Page ─── */
function MissionControlPage({ vm }) {
  return (
    <div className="ccv2-content">
      <div className="ccv2-first-fold">
        <MissionComposerCard vm={vm} />
        <MissionHeroCard vm={vm} />
        <SprintProgressCard vm={vm} />
        <ReleaseReadinessCard vm={vm} />
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

      <PrivateValidationPanel vm={vm} />
      <EvidenceGovernanceSection vm={vm} />
      <ReleaseSection vm={vm} />
    </div>
  );
}

/* ─── Task Queue Page ─── */
function TaskQueuePage({ vm }) {
  const tasks = runtimeSnapshot.runtimeState?.tasks || {};
  const recent = tasks.recent || [];
  const byState = tasks.byState || {};
  const total = tasks.total || 0;

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Task Queue</div>
          <div className="ccv2-page-head__sub">Real-time task state from runtime snapshot</div>
        </div>

        <div className="ccv2-stats-row">
          <div className="ccv2-stat-chip">
            <div className="ccv2-stat-chip__label">Total</div>
            <div className="ccv2-stat-chip__value">{total}</div>
          </div>
          {Object.entries(byState).map(([state, count]) => (
            <div key={state} className="ccv2-stat-chip">
              <div className="ccv2-stat-chip__label">{state.replace(/_/g, " ")}</div>
              <div className={`ccv2-stat-chip__value ccv2-stat-chip__value--${state === "awaiting_approval" ? "amber" : state === "blocked" ? "red" : "green"}`}>
                {count}
              </div>
            </div>
          ))}
        </div>

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
                    <span className={`ccv2-pill ccv2-pill--${task.state === "implementation_done" ? "pass" : task.state === "awaiting_approval" ? "pending" : "fail"}`}>
                      {task.state.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td>
                    <span className={`ccv2-pill ccv2-pill--${task.riskLevel === "critical" ? "fail" : task.riskLevel === "medium" ? "pending" : "pass"}`}>
                      {task.riskLevel}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: "var(--v2-muted-2)" }}>{task.capabilityId}</td>
                  <td style={{ fontSize: 11, color: "var(--v2-muted-2)" }}>{new Date(task.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Agent Fleet Page ─── */
function AgentFleetPage({ vm, studio }) {
  const agents = studio?.agentEntries || [];

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

        <div className="ccv2-agent-grid">
          {agents.map((agent) => (
            <div key={agent.id} className="ccv2-agent-card">
              <div className="ccv2-agent-card__header">
                <div className={`ccv2-agent-status-dot ${statusDotClass(agent.status)}`} />
                <div className="ccv2-agent-card__name">{agent.name}</div>
              </div>
              <div className="ccv2-agent-card__role">{agent.role} · {agent.team}</div>
              {agent.task && (
                <div className="ccv2-agent-card__task">{agent.task}</div>
              )}
              {typeof agent.progress === "number" && agent.progress > 0 && (
                <div style={{ marginTop: 6, height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${agent.progress}%`, background: "var(--v2-teal)", borderRadius: 2 }} />
                </div>
              )}
            </div>
          ))}
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
  const evidence = runtimeSnapshot.runtimeState?.evidence || {};
  const recent = evidence.recent || [];
  const byResult = evidence.byResult || {};
  const byType = evidence.byType || {};
  const total = evidence.total || 0;

  return (
    <div className="ccv2-content">
      <div className="ccv2-page">
        <div className="ccv2-page-head">
          <div className="ccv2-page-head__title">Evidence Ledger</div>
          <div className="ccv2-page-head__sub">Immutable evidence records from governed execution</div>
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

  const rows = [
    { label: "Mode", value: ab.mode || "local-private", valueClass: "ready" },
    { label: "Provider calls", value: governance.providerCallsAllowed ? "Enabled" : "Disabled", valueClass: governance.providerCallsAllowed ? "ready" : "disabled" },
    { label: "Network calls", value: governance.networkCallsAllowed ? "Enabled" : "Disabled", valueClass: governance.networkCallsAllowed ? "ready" : "disabled" },
    { label: "DB access", value: governance.dbAccessAllowed ? "Enabled" : "Disabled", valueClass: governance.dbAccessAllowed ? "ready" : "disabled" },
    { label: "UI mutations", value: governance.mutationEnabledFromUi ? "Enabled" : "Disabled", valueClass: governance.mutationEnabledFromUi ? "ready" : "disabled" },
    { label: "Traffic plane", value: bridgeReadiness.trafficPlane ? "READY" : "NOT READY", valueClass: bridgeReadiness.trafficPlane ? "ready" : "disabled" },
    { label: "Public safety", value: vm.safety.incidents === 0 ? "PASS" : "FAIL", valueClass: vm.safety.incidents === 0 ? "pass" : "disabled" },
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
            {studio?.activeProject?.name || "DemoApp"}
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

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function CommandCenterV2({ studio }) {
  const vm = buildCommandCenterViewModelV2(studio, privateValidationSnapshot, actionBridgeSnapshot);
  const location = useLocation();
  const currentPage = resolveV2Page(location.pathname);

  return (
    <div className="ccv2-shell">
      <Sidebar vm={vm} location={location} />
      <div className="ccv2-main">
        <TopBar vm={vm} currentPage={currentPage} />
        <div className="ccv2-content-wrapper">
          {currentPage === "mission" && <MissionControlPage vm={vm} />}
          {currentPage === "tasks" && <TaskQueuePage vm={vm} />}
          {currentPage === "agents" && <AgentFleetPage vm={vm} studio={studio} />}
          {currentPage === "approvals" && <ApprovalsPage vm={vm} studio={studio} />}
          {currentPage === "gates" && <VerificationGatesPage vm={vm} />}
          {currentPage === "contracts" && <ContractsPage vm={vm} />}
          {currentPage === "evidence" && <EvidencePage vm={vm} />}
          {currentPage === "safety" && <SafetyCenterPage vm={vm} />}
          {currentPage === "release" && <ReleaseControlPage vm={vm} />}
          {currentPage === "projects" && <ProjectsPage vm={vm} studio={studio} />}
          {currentPage === "batch" && <BatchQueuePage vm={vm} />}
          {currentPage === "cost" && <CostCenterPage vm={vm} studio={studio} />}
          {currentPage === "demo" && <DemoModePage vm={vm} />}
        </div>
      </div>
    </div>
  );
}
