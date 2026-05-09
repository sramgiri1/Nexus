import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { buildCommandCenterViewModelV2 } from "../data/commandCenterViewModel.js";
import { privateValidationSnapshot } from "../data/privateValidationSnapshot.js";
import { actionBridgeSnapshot } from "../data/actionBridgeSnapshot.js";
import { runtimeSnapshot } from "../data/runtimeSnapshot.js";
import { LOCAL_REPORT_SNAPSHOT } from "../data/localReports.js";
import { checkActionBridgeHealth, composeMissionFromCommandCenter } from "../api/missionActions.js";
import { activateMissionTask } from "../api/taskActions.js";
import { loadWorkbenchView, reviewTask, listWorkbenchItems } from "../api/workbenchActions.js";
import "../styles-command-center-v2.css";

/* ─── Page label map ─── */
const PAGE_LABELS = {
  mission: "Mission Control",
  workspace: "Workspace",
  tasks: "Task Queue",
  agents: "Agent Fleet",
  approvals: "Approvals",
  gates: "Verification Gates",
  contracts: "Contracts",
  evidence: "Evidence",
  safety: "Safety Center",
  release: "Release Control",
  projects: "Projects",
  workbench: "Agent Workbench",
  roadmap: "OS Roadmap",
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
      { label: "Workspace", icon: "⊹", path: "/command-center/workspace" },
      { label: "Task Queue", icon: "≡", count: "47", path: "/command-center/tasks" },
      { label: "Agent Workbench", icon: "⬡", badge: "P38", path: "/command-center/workbench" },
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
      { label: "OS Roadmap", icon: "◈", path: "/command-center/roadmap" },
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
  const statusLabel = wf.enabledNow ? "Available" : wf.nextPhase === "P36" ? "Coming soon" : `Requires ${wf.nextPhase}`;
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
          <button className="ccv2-wf-card__btn ccv2-wf-card__btn--disabled" disabled title={wf.disabledReason}>
            {wf.disabledReason || "Not available"}
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
                {nba.disabledReason}
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

  return (
    <div className="ccv2-content">
      <div className="ccv2-first-fold">
        <MissionComposerCard vm={vm} />
        <MissionHeroCard vm={vm} />
        <SprintProgressCard vm={vm} />
        <ReleaseReadinessCard vm={vm} />
      </div>

      {isLocalPrivate && clp && <CareLoopProgressCard clp={clp} />}

      <WorkspaceBand vm={vm} />

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
                {nba.enabled ? "P37 Available" : `Requires ${nba.targetPhase}`}
              </span>
              {nba.enabled ? (
                <button className="ccv2-wf-card__btn ccv2-wf-card__btn--enabled" onClick={() => navigate(nba.action?.replace("navigate:", "") || "/command-center/tasks")}>
                  Go to Task Queue
                </button>
              ) : (
                <button className="ccv2-wf-card__btn ccv2-wf-card__btn--disabled" disabled>
                  {nba.disabledReason}
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
            <div className="ccv2-stat-chip__label">Phase</div>
            <div className="ccv2-stat-chip__value">{wb.policyPhase || "P38-LOCAL"}</div>
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
                    <div className="ccv2-wb-empty__desc">Click a task on the left to open its workbench view.</div>
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
                    <div className="ccv2-eyebrow">Task Workbench · {wb.policyPhase}</div>
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

/* ─── OS Roadmap Page ─── */
function OSRoadmapPage({ vm }) {
  const clp = vm.careloopProductProgress;
  const isLocalPrivate = vm.shell.mode === "local-private";

  const nexusTrack = [
    { phase: "P26–P30", label: "Agentic OS foundation", status: "COMPLETE", detail: "Skills, hooks, governor, sprint orchestration" },
    { phase: "P31–P33", label: "Command Center V1", status: "COMPLETE", detail: "Studio shell, constellation, traction surfaces" },
    { phase: "P34–P35", label: "Command Center V2 + Mission Action Bridge", status: "COMPLETE", detail: "Full-screen shell, sidebar routing, mission composer, PRD awareness" },
    { phase: "P36", label: "Agentic Workspace Home + Workflow Templates", status: "COMPLETE", detail: "Workflow cards, next-best action, workspace page, roadmap update" },
    { phase: "P37", label: "Task Activation + Agent Assignment from UI", status: "COMPLETE", detail: "Select task → activate → runtime queue → evidence" },
    { phase: "P38", label: "Agent Workbench + Human Review Loop", status: "IN_PROGRESS", detail: "Agent workbench, human review loop, approve/reject/request_changes" },
    { phase: "P39", label: "First Controlled Implementation Workflow from UI", status: "PLANNED", detail: "Governed end-to-end build workflow through Command Center" },
    { phase: "P40", label: "Live Local API Backend for Command Center", status: "PLANNED", detail: "Real-time data via local API — no more snapshots" },
    { phase: "P41", label: "DB Foundation + Durable State", status: "PLANNED", detail: "Persistent task, evidence, audit storage" },
    { phase: "P42", label: "DB-backed Command Center + Live Refresh", status: "PLANNED", detail: "Command Center reads from live DB" },
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
          {currentPage === "workspace" && <WorkspacePage vm={vm} />}
          {currentPage === "tasks" && <TaskQueuePage vm={vm} />}
          {currentPage === "workbench" && <WorkbenchPage vm={vm} />}
          {currentPage === "agents" && <AgentFleetPage vm={vm} studio={studio} />}
          {currentPage === "approvals" && <ApprovalsPage vm={vm} studio={studio} />}
          {currentPage === "gates" && <VerificationGatesPage vm={vm} />}
          {currentPage === "contracts" && <ContractsPage vm={vm} />}
          {currentPage === "evidence" && <EvidencePage vm={vm} />}
          {currentPage === "safety" && <SafetyCenterPage vm={vm} />}
          {currentPage === "release" && <ReleaseControlPage vm={vm} />}
          {currentPage === "projects" && <ProjectsPage vm={vm} studio={studio} />}
          {currentPage === "roadmap" && <OSRoadmapPage vm={vm} />}
          {currentPage === "batch" && <BatchQueuePage vm={vm} />}
          {currentPage === "cost" && <CostCenterPage vm={vm} studio={studio} />}
          {currentPage === "demo" && <DemoModePage vm={vm} />}
        </div>
      </div>
    </div>
  );
}
