import { useEffect, useState } from "react";
import { readMemory } from "../utils/memory.js";

// ─── palette ────────────────────────────────────────────────────────────────
const C = {
  bg:     "#04090f",
  card:   "rgba(4,9,18,0.97)",
  border: "rgba(60,110,175,0.14)",
  sun:    "#ffd36f",
  text:   "#c8dff5",
  muted:  "#567090",
  dim:    "#233347",
  green:  "#28c278",
  blue:   "#4488ee",
  red:    "#e04040",
  amber:  "#d88c18",
};

// ─── team definitions (hexagonal ring, top = -90°) ──────────────────────────
const TEAMS = [
  { id: "strategy",      name: "STRATEGY",  glyph: "△", color: "#4488ee", angle: -90,  orbit: 224, moonR: 78 },
  { id: "product",       name: "PRODUCT",   glyph: "○", color: "#8855cc", angle: -30,  orbit: 224, moonR: 76 },
  { id: "platform",      name: "PLATFORM",  glyph: "◇", color: "#c06020", angle:  30,  orbit: 224, moonR: 76 },
  { id: "verification",  name: "VERIFY",    glyph: "⬡", color: "#c03030", angle:  90,  orbit: 206, moonR: 72 },
  { id: "growth",        name: "GROWTH",    glyph: "✦", color: "#a87c00", angle: 150,  orbit: 224, moonR: 72 },
  { id: "observability", name: "OBSERVE",   glyph: "◈", color: "#189080", angle: 210,  orbit: 206, moonR: 60 },
];

// ─── agents ─────────────────────────────────────────────────────────────────
const AGENTS = [
  { id: "nexus",    name: "NEXUS",    role: "CEO · Orchestrator",   team: "core",          color: "#ffd36f" },
  { id: "shepherd", name: "SHEPHERD", role: "Program Manager",      team: "strategy",      color: "#4488ee" },
  { id: "atlas",    name: "ATLAS",    role: "Product Lead",         team: "strategy",      color: "#4488ee" },
  { id: "radar",    name: "RADAR",    role: "Market Research",      team: "strategy",      color: "#28c278" },
  { id: "meridian", name: "MERIDIAN", role: "Business Validation",  team: "strategy",      color: "#d88c18" },
  { id: "prism",    name: "PRISM",    role: "Design System",        team: "product",       color: "#8855cc" },
  { id: "core",     name: "CORE",     role: "Backend",              team: "product",       color: "#28c278" },
  { id: "swift",    name: "SWIFT",    role: "iOS",                  team: "product",       color: "#4488ee" },
  { id: "pixel",    name: "PIXEL",    role: "Dashboard UI",         team: "product",       color: "#8855cc" },
  { id: "canvas",   name: "CANVAS",   role: "Static Surfaces",      team: "product",       color: "#c06020" },
  { id: "forge",    name: "FORGE",    role: "Infrastructure",       team: "platform",      color: "#c06020" },
  { id: "stream",   name: "STREAM",   role: "Data Pipelines",       team: "platform",      color: "#4488ee" },
  { id: "synapse",  name: "SYNAPSE",  role: "AI Layer",             team: "platform",      color: "#8855cc" },
  { id: "auditor",  name: "AUDITOR",  role: "Code Gate",            team: "verification",  color: "#d88c18" },
  { id: "sentinel", name: "SENTINEL", role: "QA Gate",              team: "verification",  color: "#e04040" },
  { id: "warden",   name: "WARDEN",   role: "Compliance Gate",      team: "verification",  color: "#e04040" },
  { id: "beacon",   name: "BEACON",   role: "Marketing",            team: "growth",        color: "#d88c18" },
  { id: "compass",  name: "COMPASS",  role: "ASO / SEO",            team: "growth",        color: "#4488ee" },
  { id: "oracle",   name: "ORACLE",   role: "Analytics",            team: "growth",        color: "#8855cc" },
  { id: "relay",    name: "RELAY",    role: "Feedback Intel",       team: "observability", color: "#28c278" },
];

// ─── links ──────────────────────────────────────────────────────────────────
const LINKS = [
  ["meridian", "nexus",    "feeds",    "GO / NO-GO"],
  ["oracle",   "nexus",    "feeds",    "Investor metrics"],
  ["stream",   "nexus",    "feeds",    "Pipeline status"],
  ["relay",    "nexus",    "feeds",    "Escalated blockers"],
  ["atlas",    "core",     "blocks",   "API contracts"],
  ["atlas",    "swift",    "blocks",   "Feature spec"],
  ["prism",    "swift",    "blocks",   "Design tokens"],
  ["core",     "swift",    "blocks",   "API surface"],
  ["core",     "forge",    "supports", "Server deploy"],
  ["forge",    "sentinel", "supports", "QA environment"],
  ["warden",   "canvas",   "blocks",   "Privacy content"],
  ["auditor",  "sentinel", "blocks",   "QA entry gate"],
  ["sentinel", "shepherd", "blocks",   "Sprint sign-off"],
  ["warden",   "shepherd", "blocks",   "Compliance sign-off"],
  ["oracle",   "atlas",    "feeds",    "North-star metrics"],
  ["relay",    "atlas",    "feeds",    "Feedback clusters"],
  ["stream",   "oracle",   "feeds",    "Pipeline telemetry"],
  ["nexus",    "atlas",    "supports", "Orchestrates"],
  ["nexus",    "shepherd", "supports", "Orchestrates"],
  ["nexus",    "forge",    "supports", "Orchestrates"],
];

const EDGE = {
  blocks:   { color: "#e04040", dash: null,  label: "Blocks" },
  feeds:    { color: "#28c278", dash: "6 8", label: "Feeds" },
  supports: { color: "#4488ee", dash: "3 9", label: "Supports" },
};

const STATUS_META = {
  active:  { color: "#4488ee", label: "Active" },
  working: { color: "#d88c18", label: "Working" },
  blocked: { color: "#e04040", label: "Blocked" },
  done:    { color: "#28c278", label: "Done" },
  idle:    { color: "#233347", label: "Idle" },
};

const FALLBACK_PORTFOLIO = {
  projects: [{ id: "careloop", name: "CareLoop", stage: "sprint", notes: "Sprint 2 in progress. Gate 1 closed." }],
};

// ─── geometry helpers ────────────────────────────────────────────────────────
const rad = (deg) => (deg * Math.PI) / 180;

function teamPos(team) {
  return {
    x: Math.cos(rad(team.angle)) * team.orbit,
    y: Math.sin(rad(team.angle)) * team.orbit,
  };
}

function agentNodePos(team, idx, total) {
  const hub = teamPos(team);
  const span = Math.min(68, (total - 1) * 19);
  const startA = rad(team.angle - span / 2);
  const step = total > 1 ? rad(span) / (total - 1) : 0;
  const a = startA + idx * step;
  return {
    x: hub.x + Math.cos(a) * team.moonR,
    y: hub.y + Math.sin(a) * team.moonR,
  };
}

function curvePath(ax, ay, bx, by, bend = 0.2) {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const cx = mx + (-dy / len) * len * bend;
  const cy = my + (dx / len) * len * bend;
  return `M ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`;
}

function getTeamAgents(teamId) {
  return AGENTS.filter((a) => a.team === teamId);
}

function agentById(id) {
  return AGENTS.find((a) => a.id === id);
}

function clamp(text, n = 60) {
  if (!text) return "—";
  return text.length > n ? text.slice(0, n - 1) + "…" : text;
}

// ─── main component ─────────────────────────────────────────────────────────
export default function Constellation() {
  const [portfolio, setPortfolio] = useState(null);
  const [agentStatus, setAgentStatus] = useState(null);
  const [selected, setSelected] = useState("nexus");

  useEffect(() => {
    let live = true;
    const load = async () => {
      const [p, a] = await Promise.all([readMemory("portfolio"), readMemory("agent-status")]);
      if (!live) return;
      if (p) setPortfolio(p);
      if (a) setAgentStatus(a);
    };
    load();
    const iv = setInterval(load, 5000);
    return () => { live = false; clearInterval(iv); };
  }, []);

  // live agent data
  const live = {};
  for (const [id, d] of Object.entries(agentStatus?.agents || {})) {
    live[id] = { status: d.status || "idle", task: d.task || "", progress: d.progress || 0 };
  }

  const projects = (portfolio || FALLBACK_PORTFOLIO).projects || [];
  const activeProject = projects.find((p) => p.stage === "sprint") || projects[0];

  // selection state
  const isNexus = selected === "nexus";
  const selTeam = TEAMS.find((t) => t.id === selected);
  const selAgent = !isNexus && !selTeam ? AGENTS.find((a) => a.id === selected) : null;

  // build node positions for edge rendering (SVG space, origin at center)
  const nodePos = { nexus: { x: 0, y: 0 } };
  for (const team of TEAMS) {
    nodePos[`t:${team.id}`] = teamPos(team);
    getTeamAgents(team.id).forEach((ag, i, arr) => {
      nodePos[ag.id] = agentNodePos(team, i, arr.length);
    });
  }

  // focused edges based on selection
  const focusedLinks = (() => {
    if (isNexus) return LINKS.filter((l) => l[0] === "nexus" || l[1] === "nexus");
    if (selTeam) {
      const ids = new Set(getTeamAgents(selTeam.id).map((a) => a.id));
      return LINKS.filter((l) => ids.has(l[0]) || ids.has(l[1]));
    }
    if (selAgent) return LINKS.filter((l) => l[0] === selected || l[1] === selected);
    return [];
  })();

  // status counts
  const counts = AGENTS.reduce((acc, ag) => {
    const st = live[ag.id]?.status || "idle";
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, { active: 0, working: 0, blocked: 0, done: 0, idle: 0 });

  const selTeamForAgent = selAgent ? TEAMS.find((t) => t.id === selAgent.team) : null;

  return (
    <div style={{
      height: "100vh",
      background: C.bg,
      color: C.text,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      fontFamily: "'SF Mono','Fira Code','Courier New',monospace",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes sunPulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        @keyframes ringDrift {
          to { stroke-dashoffset: -40; }
        }
        @keyframes edgeFlow {
          to { stroke-dashoffset: -22; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        .node-btn { cursor: pointer; }
        .node-btn:hover circle { opacity: 0.9; }
        .panel-btn { transition: border-color 150ms ease, background 150ms ease; }
        .panel-btn:hover { border-color: rgba(100,160,220,0.35) !important; background: rgba(255,255,255,0.04) !important; }
      `}</style>

      {/* ── header strip ─────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: 54,
        borderBottom: `1px solid ${C.border}`,
        background: "rgba(4,9,18,0.98)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", color: C.muted }}>INVESTOR VIEW</div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.08em", color: C.text, lineHeight: 1.1 }}>AI VERSE</div>
          </div>
          <div style={{ width: 1, height: 30, background: C.border }} />
          <div style={{ fontSize: 12, color: C.muted, maxWidth: 340, lineHeight: 1.55 }}>
            One founder · one command sun · six team planes · visible flow
          </div>
        </div>

        <div style={{ display: "flex", gap: 28 }}>
          {[
            { n: counts.active + counts.working, label: "ACTIVE",  col: C.blue  },
            { n: counts.done,                    label: "DONE",    col: C.green },
            { n: counts.blocked,                 label: "BLOCKED", col: C.red   },
          ].map(({ n, label, col }) => (
            <div key={label} style={{ textAlign: "center", minWidth: 40 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: col, lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 8, letterSpacing: "0.22em", color: C.dim, marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── main area ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 340px", overflow: "hidden" }}>

        {/* ── star map ─────────────────────────────────────────────── */}
        <div style={{ position: "relative", overflow: "hidden" }}>
          <svg
            viewBox="-450 -340 900 680"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            <defs>
              <radialGradient id="nexusHalo" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor={C.sun} stopOpacity="0.18" />
                <stop offset="55%"  stopColor={C.sun} stopOpacity="0.04" />
                <stop offset="100%" stopColor={C.sun} stopOpacity="0"    />
              </radialGradient>
              <radialGradient id="nexusBody" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="rgba(255,211,111,0.16)" />
                <stop offset="100%" stopColor="rgba(4,9,18,0.96)"      />
              </radialGradient>
              <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="rgba(255,211,111,0.05)" />
                <stop offset="100%" stopColor="rgba(4,9,18,0)"         />
              </radialGradient>
              <filter id="blur6">
                <feGaussianBlur stdDeviation="6" />
              </filter>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="softglow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <pattern id="grid" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="0.9" fill={C.dim} opacity="0.4" />
              </pattern>
            </defs>

            {/* dot grid */}
            <rect x="-450" y="-340" width="900" height="680" fill="url(#grid)" />

            {/* ambient center glow */}
            <circle cx="0" cy="0" r="280" fill="url(#centerGlow)" />

            {/* orbit guide rings */}
            {[105, 224, 315].map((r, i) => (
              <circle key={r} cx="0" cy="0" r={r}
                fill="none"
                stroke={C.border}
                strokeWidth={i === 1 ? 1.2 : 0.8}
                strokeDasharray={i === 1 ? "3 12" : "1 16"}
                style={i === 1 ? { animation: "ringDrift 20s linear infinite" } : undefined}
              />
            ))}

            {/* spoke lines: NEXUS → each team hub */}
            {TEAMS.map((team) => {
              const hub = teamPos(team);
              const isFocused = selTeam?.id === team.id || selAgent?.team === team.id;
              return (
                <line key={`sp-${team.id}`}
                  x1="0" y1="0" x2={hub.x} y2={hub.y}
                  stroke={team.color}
                  strokeWidth={isFocused ? 1.4 : 0.7}
                  strokeOpacity={isFocused ? 0.5 : 0.14}
                />
              );
            })}

            {/* focused edge arcs */}
            {focusedLinks.map((link, i) => {
              const from = nodePos[link[0]];
              const to   = nodePos[link[1]];
              if (!from || !to) return null;
              const style = EDGE[link[2]];
              return (
                <path key={`e-${i}`}
                  d={curvePath(from.x, from.y, to.x, to.y)}
                  fill="none"
                  stroke={style.color}
                  strokeWidth="1.8"
                  strokeOpacity="0.82"
                  strokeDasharray={style.dash || undefined}
                  style={style.dash ? { animation: "edgeFlow 3s linear infinite" } : undefined}
                />
              );
            })}

            {/* team hubs */}
            {TEAMS.map((team) => {
              const hub      = teamPos(team);
              const agents   = getTeamAgents(team.id);
              const liveN    = agents.filter((a) => ["active","working"].includes(live[a.id]?.status)).length;
              const isSel    = selTeam?.id === team.id || selAgent?.team === team.id;

              return (
                <g key={team.id} className="node-btn" onClick={() => setSelected(team.id)}>
                  {/* active pulse ring */}
                  {liveN > 0 && (
                    <circle cx={hub.x} cy={hub.y} r="56"
                      fill="none"
                      stroke={team.color}
                      strokeWidth="1"
                      strokeOpacity="0.22"
                      style={{ animation: "sunPulse 2.6s ease-in-out infinite" }}
                    />
                  )}
                  {/* outer glow ring */}
                  <circle cx={hub.x} cy={hub.y} r={isSel ? 46 : 40}
                    fill={`${team.color}12`}
                    stroke={team.color}
                    strokeWidth={isSel ? 2 : 1.3}
                    strokeOpacity={isSel ? 0.95 : 0.48}
                    filter="url(#softglow)"
                  />
                  {/* glyph */}
                  <text x={hub.x} y={hub.y - 5} textAnchor="middle"
                    fontSize={isSel ? 15 : 13} fill={team.color} fontWeight="700"
                  >{team.glyph}</text>
                  {/* name */}
                  <text x={hub.x} y={hub.y + 12} textAnchor="middle"
                    fontSize="9.5" fill={C.text} letterSpacing="1.4" fontWeight="600"
                  >{team.name}</text>
                  {/* count */}
                  <text x={hub.x} y={hub.y + 26} textAnchor="middle"
                    fontSize="8.5" fill={C.muted}
                  >{agents.length} agents{liveN > 0 ? ` · ${liveN} live` : ""}</text>

                  {/* agent moon nodes — revealed when team or its agent is selected */}
                  {isSel && agents.map((ag, idx) => {
                    const pos    = agentNodePos(team, idx, agents.length);
                    const st     = live[ag.id]?.status || "idle";
                    const stMeta = STATUS_META[st] || STATUS_META.idle;
                    const isAgSel = selected === ag.id;

                    return (
                      <g key={ag.id} className="node-btn"
                        onClick={(e) => { e.stopPropagation(); setSelected(ag.id); }}
                        style={{ animation: "fadeIn 220ms ease forwards" }}
                      >
                        {/* connector line hub→moon */}
                        <line
                          x1={hub.x} y1={hub.y} x2={pos.x} y2={pos.y}
                          stroke={team.color} strokeWidth="0.6" strokeOpacity="0.28"
                        />
                        {/* moon body */}
                        <circle cx={pos.x} cy={pos.y} r={isAgSel ? 17 : 13}
                          fill={C.card}
                          stroke={isAgSel ? stMeta.color : `${ag.color}88`}
                          strokeWidth={isAgSel ? 2.2 : 1.6}
                          filter="url(#softglow)"
                        />
                        {/* status indicator */}
                        <circle cx={pos.x + (isAgSel ? 12 : 9)} cy={pos.y - (isAgSel ? 12 : 9)} r="3.5"
                          fill={stMeta.color}
                        />
                        {/* agent name */}
                        <text x={pos.x} y={pos.y + (isAgSel ? 5 : 4)} textAnchor="middle"
                          fontSize={isAgSel ? 8 : 7} fill={isAgSel ? C.text : C.muted}
                          fontWeight={isAgSel ? "700" : "500"}
                        >{ag.name}</text>
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* ── NEXUS command sun ─────────────────── */}
            <g className="node-btn" onClick={() => setSelected("nexus")}>
              {/* outer halo */}
              <circle cx="0" cy="0" r="112"
                fill="url(#nexusHalo)"
                style={{ animation: "sunPulse 3.8s ease-in-out infinite" }}
              />
              {/* drift ring */}
              <circle cx="0" cy="0" r="80"
                fill="none"
                stroke={C.sun}
                strokeWidth="0.9"
                strokeOpacity={isNexus ? 0.32 : 0.12}
                strokeDasharray="4 8"
                style={{ animation: "ringDrift 14s linear infinite" }}
              />
              {/* body glow (blurred) */}
              <circle cx="0" cy="0" r="62"
                fill={C.sun}
                opacity="0.1"
                filter="url(#blur6)"
              />
              {/* main body */}
              <circle cx="0" cy="0" r="58"
                fill="url(#nexusBody)"
                stroke={C.sun}
                strokeWidth={isNexus ? 2.6 : 1.8}
                strokeOpacity={isNexus ? 1 : 0.7}
                filter="url(#glow)"
              />
              {/* label */}
              <text x="0" y="-9" textAnchor="middle"
                fontSize="17" fontWeight="700" fill={C.sun} letterSpacing="0.14em"
              >NEXUS</text>
              <text x="0" y="9" textAnchor="middle"
                fontSize="8.8" fill={C.muted} letterSpacing="0.07em"
              >CEO · Command Sun</text>
              <text x="0" y="24" textAnchor="middle"
                fontSize="7.8" fill={C.dim}
              >Routes · Gates · Balances</text>
            </g>

            {/* ── corner caption ─────────────────────── */}
            <text x="-434" y="-320" fontSize="8.5" fill={C.dim} letterSpacing="1.4">
              AI VERSE · AGENTIC OS · {AGENTS.length} AGENTS · 6 PLANES
            </text>
          </svg>
        </div>

        {/* ── right detail panel ───────────────────────────────────── */}
        <div style={{
          borderLeft: `1px solid ${C.border}`,
          background: C.card,
          overflowY: "auto",
          padding: "22px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}>

          {/* ── NEXUS overview ── */}
          {isNexus && (
            <>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.28em", color: C.muted, marginBottom: 8 }}>FOCUS NODE</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: C.sun, letterSpacing: "0.1em" }}>NEXUS</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>CEO · Central command sun</div>
              </div>

              <div style={{ height: 1, background: C.border }} />

              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.26em", color: C.dim, marginBottom: 10 }}>ACTIVE FRONT</div>
                {activeProject ? (
                  <div style={{
                    padding: "14px 16px", borderRadius: 12,
                    background: "rgba(40,194,120,0.06)",
                    border: `1px solid rgba(40,194,120,0.2)`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{activeProject.name}</div>
                      <div style={{ marginLeft: "auto", fontSize: 9, color: C.green, letterSpacing: "0.14em" }}>
                        {(activeProject.stage || "sprint").toUpperCase()}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.65 }}>
                      {activeProject.notes || "Active development sprint."}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: C.muted }}>No active project</div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.26em", color: C.dim, marginBottom: 10 }}>TEAM PLANES</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {TEAMS.map((team) => {
                    const agents = getTeamAgents(team.id);
                    const liveN  = agents.filter((a) => ["active","working"].includes(live[a.id]?.status)).length;
                    return (
                      <button key={team.id} className="panel-btn"
                        onClick={() => setSelected(team.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "9px 12px", borderRadius: 10,
                          background: "rgba(255,255,255,0.02)",
                          border: `1px solid ${C.border}`,
                          color: C.text, cursor: "pointer", textAlign: "left",
                        }}
                      >
                        <span style={{ fontSize: 13, color: team.color }}>{team.glyph}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: team.color, flex: 1 }}>{team.name}</span>
                        <span style={{ fontSize: 10, color: C.muted }}>{agents.length}</span>
                        {liveN > 0 && (
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.blue, flexShrink: 0 }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.26em", color: C.dim, marginBottom: 12 }}>MISSION FLOW</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {[
                    { n: 1, step: "DISCOVER", desc: "RADAR + MERIDIAN validate the signal",   col: C.green },
                    { n: 2, step: "DEFINE",   desc: "SHEPHERD + ATLAS lock sprint scope",       col: C.blue  },
                    { n: 3, step: "BUILD",    desc: "CORE + SWIFT + FORGE execute in parallel", col: C.amber },
                    { n: 4, step: "VERIFY",   desc: "AUDITOR → SENTINEL → WARDEN gate",        col: C.red   },
                  ].map(({ n, step, desc, col }, i, arr) => (
                    <div key={step} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: "50%",
                          background: `${col}14`, border: `1.5px solid ${col}55`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 9, color: col, fontWeight: "700",
                        }}>{n}</div>
                        {i < arr.length - 1 && (
                          <div style={{ width: 1, height: 16, background: C.border }} />
                        )}
                      </div>
                      <div style={{ paddingTop: 5, paddingBottom: i < arr.length - 1 ? 16 : 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: col, letterSpacing: "0.1em" }}>{step}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 3, lineHeight: 1.55 }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Team detail ── */}
          {selTeam && (
            <>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.28em", color: C.muted, marginBottom: 8 }}>FOCUS NODE</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: selTeam.color, letterSpacing: "0.06em" }}>
                  {selTeam.glyph}  {selTeam.name}
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                  Team plane · {getTeamAgents(selTeam.id).length} agents
                </div>
              </div>

              <div style={{ height: 1, background: C.border }} />

              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.26em", color: C.dim, marginBottom: 10 }}>AGENTS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {getTeamAgents(selTeam.id).map((ag) => {
                    const st     = live[ag.id]?.status || "idle";
                    const stMeta = STATUS_META[st] || STATUS_META.idle;
                    return (
                      <button key={ag.id} className="panel-btn"
                        onClick={() => setSelected(ag.id)}
                        style={{
                          padding: "10px 12px", borderRadius: 10,
                          background: "rgba(255,255,255,0.02)",
                          border: `1px solid ${ag.color}22`,
                          color: C.text, cursor: "pointer", textAlign: "left",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: ag.color }}>{ag.name}</span>
                          <span style={{ fontSize: 9, color: stMeta.color, letterSpacing: "0.12em" }}>{stMeta.label}</span>
                        </div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{ag.role}</div>
                        {live[ag.id]?.task && (
                          <div style={{ fontSize: 10, color: C.dim, marginTop: 6, lineHeight: 1.5 }}>
                            {clamp(live[ag.id].task, 54)}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.26em", color: C.dim, marginBottom: 10 }}>CROSS-TEAM LINKS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(() => {
                    const ids = new Set(getTeamAgents(selTeam.id).map((a) => a.id));
                    return LINKS
                      .filter((l) => {
                        if (!ids.has(l[0]) && !ids.has(l[1])) return false;
                        const fromAg = agentById(l[0]);
                        const toAg   = agentById(l[1]);
                        return fromAg?.team !== toAg?.team;
                      })
                      .slice(0, 6)
                      .map((link, i) => {
                        const style  = EDGE[link[2]];
                        const fromAg = agentById(link[0]);
                        const toAg   = agentById(link[1]);
                        const isFrom = ids.has(link[0]);
                        const peer   = isFrom ? toAg : fromAg;
                        return (
                          <div key={i} style={{
                            padding: "8px 12px", borderRadius: 8,
                            background: "rgba(255,255,255,0.018)",
                            border: `1px solid ${style.color}22`,
                            display: "flex", alignItems: "center", gap: 9,
                          }}>
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: style.color, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: peer?.color || C.text }}>{peer?.name || "—"}</span>
                              <span style={{ fontSize: 10, color: C.dim, marginLeft: 6 }}>{link[2]}</span>
                            </div>
                            <div style={{ fontSize: 10, color: C.muted }}>{link[3]}</div>
                          </div>
                        );
                      });
                  })()}
                </div>
              </div>

              <button className="panel-btn"
                onClick={() => setSelected("nexus")}
                style={{
                  padding: "9px 14px", borderRadius: 10, marginTop: "auto",
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${C.border}`,
                  color: C.muted, cursor: "pointer", fontSize: 11,
                  textAlign: "left",
                }}
              >← Overview</button>
            </>
          )}

          {/* ── Agent detail ── */}
          {selAgent && (
            <>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.28em", color: C.muted, marginBottom: 8 }}>FOCUS NODE</div>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: selAgent.color, letterSpacing: "0.06em" }}>{selAgent.name}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{selAgent.role}</div>
                  </div>
                  <div style={{
                    padding: "5px 10px", borderRadius: 999, flexShrink: 0, marginTop: 4,
                    background: `${(STATUS_META[live[selAgent.id]?.status] || STATUS_META.idle).color}14`,
                    border: `1px solid ${(STATUS_META[live[selAgent.id]?.status] || STATUS_META.idle).color}44`,
                    color: (STATUS_META[live[selAgent.id]?.status] || STATUS_META.idle).color,
                    fontSize: 10, letterSpacing: "0.14em",
                  }}>
                    {(STATUS_META[live[selAgent.id]?.status] || STATUS_META.idle).label}
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: C.border }} />

              <div style={{
                padding: "14px 16px", borderRadius: 12,
                background: "rgba(255,255,255,0.025)",
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 9, letterSpacing: "0.18em", color: C.dim, marginBottom: 8 }}>CURRENT TASK</div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.65 }}>
                  {clamp(live[selAgent.id]?.task || "No active task", 100)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.26em", color: C.dim, marginBottom: 10 }}>COMMUNICATIONS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {LINKS
                    .filter((l) => l[0] === selected || l[1] === selected)
                    .map((link, i) => {
                      const peerId = link[0] === selected ? link[1] : link[0];
                      const peer   = agentById(peerId);
                      const style  = EDGE[link[2]];
                      const dir    = link[0] === selected ? "→" : "←";
                      return (
                        <button key={i} className="panel-btn"
                          onClick={() => setSelected(peerId)}
                          style={{
                            padding: "10px 12px", borderRadius: 8,
                            background: "rgba(255,255,255,0.018)",
                            border: `1px solid ${style.color}22`,
                            color: C.text, cursor: "pointer", textAlign: "left",
                            display: "flex", alignItems: "center", gap: 10,
                          }}
                        >
                          <span style={{ fontSize: 10, color: style.color, fontWeight: 700 }}>{dir}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: peer?.color || C.text, flex: 1 }}>{peer?.name || peerId}</span>
                          <span style={{ fontSize: 9, color: style.color, letterSpacing: "0.12em" }}>{link[2]}</span>
                        </button>
                      );
                    })}
                </div>
              </div>

              <button className="panel-btn"
                onClick={() => setSelected(selTeamForAgent ? selTeamForAgent.id : "nexus")}
                style={{
                  padding: "9px 14px", borderRadius: 10, marginTop: "auto",
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${C.border}`,
                  color: C.muted, cursor: "pointer", fontSize: 11,
                  textAlign: "left",
                }}
              >← {selTeamForAgent ? selTeamForAgent.name : "Overview"}</button>
            </>
          )}

          {/* ── link legend (always visible at bottom) ── */}
          <div style={{ marginTop: "auto", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, letterSpacing: "0.26em", color: C.dim, marginBottom: 10 }}>LINK TYPES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(EDGE).map(([type, style]) => (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="36" height="10">
                    <line x1="0" y1="5" x2="36" y2="5"
                      stroke={style.color}
                      strokeWidth="2"
                      strokeDasharray={style.dash || undefined}
                    />
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 700, color: style.color }}>{style.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
