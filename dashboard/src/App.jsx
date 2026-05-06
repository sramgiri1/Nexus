import { useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { NAV_ITEMS } from "./data/studio.js";
import { useStudioData } from "./hooks/useStudioData.js";
import CommandCenter from "./pages/CommandCenter.jsx";
import Constellation from "./pages/Constellation.jsx";
import Skills from "./pages/Skills.jsx";
import Traction from "./pages/Traction.jsx";
import {
  EmptyState,
  Panel,
  ProgressBar,
  StatusPill,
  formatRelative,
  formatTimestamp,
} from "./components/StudioPrimitives.jsx";

function ShellRightRail({ studio }) {
  const { activeProject, currentLoad, openActions, openFailures, queueDepth, resolvedFailures, lastUpdated, gateProgress } = studio;

  return (
    <div className="shell-rail-stack">
      <Panel
        eyebrow="System Signal"
        title={activeProject ? activeProject.name : "Operating System"}
        subtitle={activeProject?.tagline || "Live memory-backed venture control surface."}
        meta={<StatusPill status={openFailures.length ? "blocked" : "active"}>{openFailures.length ? "Attention required" : "Live"}</StatusPill>}
      >
        <div className="shell-signal">
          <div className="shell-signal__row">
            <span className="shell-signal__label">Stage</span>
            <span className="shell-signal__value mono">{activeProject?.stage || "—"}</span>
          </div>
          <div className="shell-signal__row">
            <span className="shell-signal__label">Gate</span>
            <span className="shell-signal__value mono">{activeProject?.gate || "—"}</span>
          </div>
          <ProgressBar value={gateProgress} max={100} tone="green" label="Gate readiness" />
          <div className="shell-signal__row">
            <span className="shell-signal__label">Queue depth</span>
            <span className="shell-signal__value mono">{queueDepth}</span>
          </div>
          <div className="shell-signal__row">
            <span className="shell-signal__label">Last refresh</span>
            <span className="shell-signal__value mono">{formatRelative(lastUpdated)}</span>
          </div>
        </div>
      </Panel>

      <Panel eyebrow="Founder Queue" title="Immediate Directives" subtitle="These are the live founder-level actions still open in memory.">
        {openActions.length ? (
          <div className="data-list">
            {openActions.slice(0, 4).map((action) => (
              <div key={action.id} className="data-row">
                <div className="data-row__top">
                  <StatusPill status="active">{action.priority}</StatusPill>
                  <span className="muted mono">{action.id}</span>
                </div>
                <div className="data-row__meta" style={{ color: "var(--text-soft)" }}>
                  {action.text}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No founder directives open" body="The founder action queue is clear." />
        )}
      </Panel>

      <Panel eyebrow="Live Agents" title="Current Load" subtitle="The highest-signal agents currently active, working, or blocked.">
        {currentLoad.length ? (
          <div className="agent-list">
            {currentLoad.map((agent) => (
              <div key={agent.id} className="agent-chip">
                <div className="agent-dot" style={{ background: `var(--${agent.status === "blocked" ? "red" : agent.status === "working" ? "amber" : "blue"})` }} />
                <div>
                  <div className="agent-chip__title">
                    {agent.name} <span className="muted">· {agent.role}</span>
                  </div>
                  <div className="agent-chip__task">{agent.task || "No active task."}</div>
                </div>
                <div className="agent-chip__progress">{agent.progress || 0}%</div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No active load" body="The agent network is currently idle." />
        )}
      </Panel>

      <Panel eyebrow="Failure State" title="Recovery Ledger" subtitle="Open failures stay visible; recovered failures remain attributable.">
        <div className="data-list">
          <div className="data-row">
            <div className="data-row__top">
              <div className="data-row__title">Open failures</div>
              <StatusPill status={openFailures.length ? "blocked" : "done"}>{openFailures.length}</StatusPill>
            </div>
            <div className="data-row__meta">
              {openFailures.length ? openFailures[0].task || openFailures[0].skill || "Recovery required" : "No unresolved failures in the current queue."}
            </div>
          </div>
          <div className="data-row">
            <div className="data-row__top">
              <div className="data-row__title">Resolved failures</div>
              <StatusPill status="done">{resolvedFailures.length}</StatusPill>
            </div>
            <div className="data-row__meta">
              {resolvedFailures.length
                ? `Most recent: ${resolvedFailures[0].agentId?.toUpperCase() || "SYSTEM"} · ${formatTimestamp(resolvedFailures[0].finishedAt)}`
                : "No resolved recoveries recorded yet."}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export default function App() {
  const studio = useStudioData();
  const location = useLocation();
  const [now, setNow] = useState(new Date());
  const isHomeView = location.pathname === "/";
  const isVerseView = location.pathname === "/constellation";

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const activeNav = useMemo(
    () => NAV_ITEMS.find((item) => item.path === location.pathname) || NAV_ITEMS[0],
    [location.pathname]
  );

  return (
    <div className="studio-app">
      <aside className="nav-rail">
        <div className="nav-rail__brand-wrap">
          <div className="nav-rail__brand">⬡</div>
          <div className="nav-rail__caption">Venture OS</div>
        </div>

        <nav className="nav-links">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`}
            >
              <span className="nav-link__glyph">{item.icon}</span>
              <span className="nav-link__short">{item.short}</span>
            </NavLink>
          ))}
        </nav>

        <div className="nav-rail__footer">
          <div className="nav-signal">
            <div className="nav-signal__value" style={{ color: "var(--blue)" }}>
              {studio.statusCounts.active + studio.statusCounts.working}
            </div>
            <div className="nav-signal__label">Engaged</div>
          </div>
          <div className="nav-signal">
            <div className="nav-signal__value" style={{ color: studio.statusCounts.blocked ? "var(--red)" : "var(--green)" }}>
              {studio.statusCounts.blocked}
            </div>
            <div className="nav-signal__label">Blocked</div>
          </div>
          <div className="nav-signal">
            <div className="nav-signal__value mono" style={{ color: "var(--text-soft)", fontSize: 14 }}>
              {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
            </div>
            <div className="nav-signal__label">Local</div>
          </div>
        </div>
      </aside>

      <div className="studio-shell">
        <header
          className={`shell-topbar${
            isVerseView ? " shell-topbar--compact shell-topbar--verse" : isHomeView ? " shell-topbar--command-lite" : ""
          }`}
        >
          {isVerseView ? (
            <div className="shell-topbar__verse-title" aria-label={activeNav.label}>
              <span className="shell-topbar__verse-mark" aria-hidden="true">
                //
              </span>
              <span className="shell-topbar__verse-ai">AI</span>
              <span className="shell-topbar__verse-name">Verse</span>
              <span className="shell-topbar__verse-mark" aria-hidden="true">
                //
              </span>
            </div>
          ) : isHomeView ? (
            <>
              <div className="shell-topbar__prototype">
                <div className="shell-topbar__prototype-title">
                  <div className="eyebrow">Operator Platform Prototype</div>
                  <h1 className="shell-topbar__prototype-heading">NEXUS Command Center</h1>
                  <p className="shell-topbar__prototype-copy">
                    Evidence-first mission control for governed execution, verification gates, approvals, and release posture.
                  </p>
                </div>

                <div className="shell-topbar__prototype-meta">
                  <div className="shell-chip-row">
                    <StatusPill status="active">Active project · {studio.activeProject?.name || "DemoApp"}</StatusPill>
                    <StatusPill status="working">Current phase · Phase 13</StatusPill>
                    <StatusPill status="done">Environment · Prototype</StatusPill>
                    <StatusPill status={studio.statusCounts.blocked ? "blocked" : "done"}>
                      Global status · {studio.statusCounts.blocked ? "Attention required" : "Stable"}
                    </StatusPill>
                  </div>

                  <div className="shell-topbar__prototype-search" aria-label="Search or command placeholder">
                    Search or issue a governed command…
                  </div>
                </div>

                <div className="shell-topbar__prototype-signal">
                  <div>
                    <div className="eyebrow">System time</div>
                    <div className="mono shell-topbar__command-value">
                      {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                    </div>
                  </div>
                  <div>
                    <div className="eyebrow">Snapshot age</div>
                    <div className="mono shell-topbar__command-value">{formatRelative(studio.lastUpdated)}</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="shell-topbar__left">
                <div>
                  <div className="eyebrow">Nexus Venture Studio</div>
                  <h1 className="shell-title">{activeNav.label}</h1>
                  <p className="shell-subtitle">Live memory-backed operating system for ventures, agents, and execution gates.</p>
                </div>
              </div>

              <div className="shell-topbar__center">
                <div className="shell-chip-row">
                  <StatusPill status="active">
                    {studio.activeProject ? `${studio.activeProject.name} active` : "No active project"}
                  </StatusPill>
                  <StatusPill status={studio.statusCounts.blocked ? "blocked" : "done"}>
                    {studio.statusCounts.blocked ? `${studio.statusCounts.blocked} agents blocked` : "No active blockers"}
                  </StatusPill>
                  <StatusPill status="working">{studio.openDirectiveCount} founder directives</StatusPill>
                  <StatusPill status="done">{studio.queueDepth} queue depth</StatusPill>
                </div>
              </div>

              <div className="shell-topbar__right">
                <div>
                  <div className="eyebrow">System time</div>
                  <div className="mono" style={{ fontSize: 18, color: "var(--text-soft)" }}>
                    {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                  </div>
                </div>
                <div>
                  <div className="eyebrow">Last memory sync</div>
                  <div className="mono" style={{ fontSize: 18, color: "var(--text-soft)" }}>
                    {formatRelative(studio.lastUpdated)}
                  </div>
                </div>
              </div>
            </>
          )}
        </header>

        <div className={`shell-main${isVerseView || isHomeView ? " shell-main--full" : ""}`}>
          <main className={`shell-content${isVerseView ? " shell-content--verse" : ""}`}>
            <Routes>
              <Route path="/" element={<CommandCenter studio={studio} />} />
              <Route path="/constellation" element={<Constellation studio={studio} />} />
              <Route path="/skills" element={<Skills studio={studio} />} />
              <Route path="/traction" element={<Traction studio={studio} />} />
            </Routes>
          </main>

          {!isVerseView && !isHomeView && (
            <aside className="shell-sidebar">
              <ShellRightRail studio={studio} />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
