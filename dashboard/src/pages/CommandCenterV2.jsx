import { useEffect, useState } from "react";
import { buildCommandCenterViewModelV2 } from "../data/commandCenterViewModel.js";
import { privateValidationSnapshot } from "../data/privateValidationSnapshot.js";
import { actionBridgeSnapshot } from "../data/actionBridgeSnapshot.js";
import "../styles-command-center-v2.css";

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

/* ─── Sidebar ─── */
const NAV_GROUPS_V2 = [
  {
    group: "OPERATIONS",
    items: [
      { label: "Mission Control", icon: "⬡", badge: "LIVE", active: true },
      { label: "Task Queue", icon: "≡", count: "47" },
      { label: "Agent Fleet", icon: "◈", count: "20" },
      { label: "Approvals", icon: "✓", count: "3", countTone: "red" },
    ],
  },
  {
    group: "GOVERNANCE",
    items: [
      { label: "Verification Gates", icon: "⬛" },
      { label: "Contracts", icon: "◻" },
      { label: "Evidence", icon: "◇", count: "1.2k" },
      { label: "Safety Center", icon: "⚑" },
    ],
  },
  {
    group: "DELIVERY",
    items: [
      { label: "Release Control", icon: "⬆" },
      { label: "Projects", icon: "⬤", count: "4" },
    ],
  },
  {
    group: "OPERATIONS · COMPUTE",
    items: [
      { label: "Batch Queue", icon: "⊞" },
      { label: "Cost Center", icon: "$" },
    ],
  },
  {
    group: "SHOWCASE",
    items: [
      { label: "Demo Mode", icon: "▶" },
    ],
  },
];

function Sidebar({ vm }) {
  return (
    <aside className="ccv2-sidebar">
      <div className="ccv2-sidebar__brand">
        <div className="ccv2-sidebar__brand-mark">N</div>
        <div className="ccv2-sidebar__brand-name">{vm.shell.productName}</div>
        <div className="ccv2-sidebar__brand-ver">v4.7</div>
      </div>

      <nav className="ccv2-nav-groups">
        {NAV_GROUPS_V2.map((group) => (
          <div key={group.group} className="ccv2-nav-group">
            <div className="ccv2-nav-group__label">{group.group}</div>
            {group.items.map((item) => (
              <a
                key={item.label}
                role="link"
                href="#"
                className={`ccv2-nav-item${item.active ? " ccv2-nav-item--active" : ""}`}
                onClick={(e) => e.preventDefault()}
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
              </a>
            ))}
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
function TopBar({ vm }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  return (
    <header className="ccv2-topbar">
      <div className="ccv2-topbar__breadcrumb">
        <span>NEXUS</span>
        <span className="ccv2-topbar__breadcrumb-sep">/</span>
        <span>Operations</span>
        <span className="ccv2-topbar__breadcrumb-sep">/</span>
        <span className="ccv2-topbar__breadcrumb-current">Mission Control</span>
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

/* ─── Command Center V2 Shell ─── */
export default function CommandCenterV2({ studio }) {
  const vm = buildCommandCenterViewModelV2(studio, privateValidationSnapshot, actionBridgeSnapshot);

  return (
    <div className="ccv2-shell">
      <Sidebar vm={vm} />
      <div className="ccv2-main">
        <TopBar vm={vm} />
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
      </div>
    </div>
  );
}
