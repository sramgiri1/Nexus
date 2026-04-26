import { useEffect, useState } from "react";
import { readMemory } from "../utils/memory.js";

const T = {
  bg: "#07111d",
  panel: "rgba(9,18,31,0.86)",
  panelAlt: "rgba(11,23,39,0.92)",
  line: "rgba(119, 163, 220, 0.12)",
  text: "#e5eefc",
  muted: "#8b9db8",
  dim: "#51637f",
  sun: "#ffd36f",
  blue: "#6aa5ff",
  green: "#44d6a3",
  amber: "#f3b354",
  red: "#ff6f6f",
};

const PROJECT_STAGES = {
  discovery:  { label: "DISCOVERY", color: "#7B6DB0" },
  incubation: { label: "INCUBATION", color: "#C49A2A" },
  sprint:     { label: "IN SPRINT", color: "#4A8FBF" },
  testflight: { label: "TESTFLIGHT", color: "#3EA89A" },
  live:       { label: "LIVE", color: "#3A8F5A" },
  paused:     { label: "PAUSED", color: "#B87040" },
  killed:     { label: "KILLED", color: "#A84848" },
};

const FALLBACK_PROJECTS = [
  { id: "careloop", name: "CareLoop", color: "#00FFB3", stage: "sprint", gate: "G1", score: 44, tam: "$479M", notes: "Active project. Sprint 2 in progress.", agents: ["atlas", "shepherd", "core", "swift", "forge", "sentinel", "warden"] },
  { id: "shiftpay", name: "ShiftPay", color: "#00D9FF", stage: "on-hold", gate: "G1", score: 44, tam: "$144M", notes: "On hold until CareLoop Gate 2.", agents: ["radar", "meridian"] },
  { id: "homelog", name: "HomeLog", color: "#FF6B35", stage: "on-hold", gate: "—", score: 41, tam: "$599M", notes: "Backlog opportunity.", agents: ["radar", "meridian"] },
];

const TEAM_PLANES = [
  { id: "observability", name: "OBSERVABILITY", color: "#3EA89A", glyph: "◈", rx: 214, ry: 128, rot: -8, angle: -156, moonR: 34 },
  { id: "strategy", name: "STRATEGY", color: "#4A8FBF", glyph: "△", rx: 242, ry: 146, rot: 0, angle: -90, moonR: 72 },
  { id: "product", name: "PRODUCT", color: "#7B6DB0", glyph: "◌", rx: 246, ry: 148, rot: 8, angle: -24, moonR: 78 },
  { id: "platform", name: "PLATFORM", color: "#B87040", glyph: "◇", rx: 246, ry: 148, rot: 8, angle: 32, moonR: 72 },
  { id: "growth", name: "GROWTH", color: "#C49A2A", glyph: "✦", rx: 246, ry: 148, rot: -8, angle: 156, moonR: 70 },
  { id: "verification", name: "VERIFICATION", color: "#A84848", glyph: "⬣", rx: 214, ry: 128, rot: 0, angle: 96, moonR: 72 },
];

const AGENTS = [
  { id: "nexus", name: "NEXUS", role: "CEO / Orchestrator", team: "core", color: "#6aa5ff" },
  { id: "shepherd", name: "SHEPHERD", role: "Program Manager", team: "strategy", color: "#6aa5ff" },
  { id: "atlas", name: "ATLAS", role: "Product Lead", team: "strategy", color: "#6aa5ff" },
  { id: "radar", name: "RADAR", role: "Market Gap", team: "strategy", color: "#44d6a3" },
  { id: "meridian", name: "MERIDIAN", role: "Business Validation", team: "strategy", color: "#f3b354" },
  { id: "prism", name: "PRISM", role: "Design System", team: "product", color: "#7B6DB0" },
  { id: "core", name: "CORE", role: "Backend", team: "product", color: "#44d6a3" },
  { id: "swift", name: "SWIFT", role: "iOS", team: "product", color: "#6aa5ff" },
  { id: "pixel", name: "PIXEL", role: "Dashboard UI", team: "product", color: "#7B6DB0" },
  { id: "canvas", name: "CANVAS", role: "Static Surfaces", team: "product", color: "#B87040" },
  { id: "forge", name: "FORGE", role: "Infrastructure", team: "platform", color: "#B87040" },
  { id: "stream", name: "STREAM", role: "Data Pipelines", team: "platform", color: "#6aa5ff" },
  { id: "synapse", name: "SYNAPSE", role: "AI Layer", team: "platform", color: "#B87040" },
  { id: "beacon", name: "BEACON", role: "Marketing", team: "growth", color: "#f3b354" },
  { id: "compass", name: "COMPASS", role: "ASO / SEO", team: "growth", color: "#6aa5ff" },
  { id: "oracle", name: "ORACLE", role: "Analytics", team: "growth", color: "#7B6DB0" },
  { id: "auditor", name: "AUDITOR", role: "Code Gate", team: "verification", color: "#f3b354" },
  { id: "sentinel", name: "SENTINEL", role: "QA Gate", team: "verification", color: "#ff6f6f" },
  { id: "warden", name: "WARDEN", role: "Compliance Gate", team: "verification", color: "#ff6f6f" },
  { id: "relay", name: "RELAY", role: "Feedback Intel", team: "observability", color: "#44d6a3" },
];

const AGENT_LINKS = [
  ["radar", "meridian", "feeds", "Opportunity scores"],
  ["radar", "atlas", "feeds", "Market context"],
  ["meridian", "atlas", "feeds", "Monetization input"],
  ["meridian", "nexus", "feeds", "GO / NO-GO"],
  ["shepherd", "atlas", "blocks", "Sprint scope"],
  ["atlas", "core", "blocks", "API contracts"],
  ["atlas", "swift", "blocks", "Feature spec"],
  ["atlas", "prism", "blocks", "Design requirements"],
  ["atlas", "sentinel", "feeds", "Acceptance criteria"],
  ["atlas", "warden", "feeds", "Data-scope review"],
  ["prism", "swift", "blocks", "Design system"],
  ["core", "swift", "blocks", "API surface"],
  ["core", "forge", "supports", "Server deploy"],
  ["core", "sentinel", "supports", "API under test"],
  ["swift", "sentinel", "supports", "UI under test"],
  ["swift", "forge", "supports", "Build distribution"],
  ["forge", "sentinel", "supports", "QA environment"],
  ["forge", "warden", "supports", "Infra controls"],
  ["warden", "canvas", "blocks", "Privacy content"],
  ["warden", "beacon", "blocks", "Privacy language"],
  ["canvas", "forge", "supports", "Static asset deploy"],
  ["oracle", "core", "feeds", "Event schema"],
  ["oracle", "atlas", "feeds", "North-star metrics"],
  ["oracle", "nexus", "feeds", "Investor metrics"],
  ["beacon", "compass", "supports", "Keyword brief"],
  ["compass", "beacon", "feeds", "ASO keywords"],
  ["beacon", "canvas", "feeds", "Copy + messaging"],
  ["compass", "canvas", "feeds", "Web SEO"],
  ["stream", "core", "feeds", "Normalized data"],
  ["stream", "oracle", "feeds", "Pipeline telemetry"],
  ["stream", "nexus", "feeds", "Pipeline status"],
  ["synapse", "pixel", "supports", "AI UI hooks"],
  ["canvas", "pixel", "feeds", "Static surfaces"],
  ["core", "pixel", "feeds", "Dashboard APIs"],
  ["core", "auditor", "blocks", "Code review gate"],
  ["swift", "auditor", "blocks", "Code review gate"],
  ["auditor", "sentinel", "blocks", "QA entry gate"],
  ["sentinel", "shepherd", "blocks", "Sprint sign-off"],
  ["warden", "shepherd", "blocks", "Compliance sign-off"],
  ["relay", "sentinel", "feeds", "Bug reproductions"],
  ["relay", "atlas", "feeds", "Feedback clusters"],
  ["relay", "beacon", "feeds", "Recruitment messaging"],
  ["relay", "nexus", "feeds", "Escalated blockers"],
  ["nexus", "atlas", "supports", "Orchestrates"],
  ["nexus", "forge", "supports", "Orchestrates"],
  ["nexus", "shepherd", "supports", "Orchestrates"],
  ["nexus", "radar", "supports", "Orchestrates"],
  ["nexus", "meridian", "supports", "Orchestrates"],
  ["nexus", "oracle", "supports", "Orchestrates"],
  ["nexus", "pixel", "supports", "Reads live memory"],
];

const EDGE_STYLE = {
  blocks:   { color: "#ff6f6f", dash: "0", width: 2.2 },
  feeds:    { color: "#44d6a3", dash: "7 9", width: 1.8 },
  supports: { color: "#6aa5ff", dash: "3 12", width: 1.4 },
};

const STATUS_STYLE = {
  active:  { color: "#6aa5ff", label: "Active" },
  working: { color: "#f3b354", label: "Working" },
  blocked: { color: "#ff6f6f", label: "Blocked" },
  done:    { color: "#44d6a3", label: "Done" },
  idle:    { color: "#51637f", label: "Idle" },
};

const MAP_W = 920;
const MAP_H = 720;
const SUN = { x: MAP_W / 2, y: MAP_H / 2 };

function clampText(text, max = 54) {
  if (!text) return "No active task";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function ellipsePoint(cx, cy, rx, ry, rotationDeg, angleDeg) {
  const rot = (rotationDeg * Math.PI) / 180;
  const angle = (angleDeg * Math.PI) / 180;
  const x = cx + Math.cos(rot) * rx * Math.cos(angle) - Math.sin(rot) * ry * Math.sin(angle);
  const y = cy + Math.sin(rot) * rx * Math.cos(angle) + Math.cos(rot) * ry * Math.sin(angle);
  return { x, y };
}

function planePath(team) {
  return `M ${SUN.x - team.rx} ${SUN.y}
    a ${team.rx} ${team.ry} ${team.rot} 1 0 ${team.rx * 2} 0
    a ${team.rx} ${team.ry} ${team.rot} 1 0 ${-team.rx * 2} 0`;
}

function teamHub(team) {
  return ellipsePoint(SUN.x, SUN.y, team.rx, team.ry, team.rot, team.angle);
}

function moonPosition(team, index, total) {
  const hub = teamHub(team);
  const step = 360 / Math.max(total, 1);
  const angle = -90 + index * step;
  const x = hub.x + Math.cos((angle * Math.PI) / 180) * team.moonR;
  const y = hub.y + Math.sin((angle * Math.PI) / 180) * team.moonR * 0.82;
  return { x, y };
}

function curveBetween(a, b, arc = 0.18) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
  const nx = -dy / len;
  const ny = dx / len;
  const c1 = { x: mx + nx * len * arc, y: my + ny * len * arc };
  return `M ${a.x} ${a.y} Q ${c1.x} ${c1.y} ${b.x} ${b.y}`;
}

function edgeKey(edge) {
  return `${edge[0]}-${edge[1]}-${edge[2]}-${edge[3]}`;
}

function teamForAgent(agentId) {
  return AGENTS.find((agent) => agent.id === agentId)?.team || "core";
}

function aggregateTeamLinks() {
  const map = new Map();
  for (const edge of AGENT_LINKS) {
    const fromTeam = teamForAgent(edge[0]);
    const toTeam = teamForAgent(edge[1]);
    if (fromTeam === toTeam) continue;
    const key = `${fromTeam}-${toTeam}-${edge[2]}`;
    const current = map.get(key) || { fromTeam, toTeam, type: edge[2], count: 0, labels: [] };
    current.count += 1;
    current.labels.push(edge[3]);
    map.set(key, current);
  }
  return Array.from(map.values());
}

function groupedTeamAgents(teamId) {
  return AGENTS.filter((agent) => agent.team === teamId);
}

function countByStatus(agentsMap) {
  const counts = { active: 0, working: 0, blocked: 0, done: 0, idle: 0 };
  for (const agent of AGENTS) {
    const status = agentsMap[agent.id]?.status || "idle";
    counts[status] = (counts[status] || 0) + 1;
  }
  return counts;
}

function missionFlow() {
  return [
    { title: "Discover", text: "RADAR and MERIDIAN validate the opportunity and hand the signal to strategy." },
    { title: "Define", text: "SHEPHERD and ATLAS lock sprint scope, contracts, and product intent." },
    { title: "Build", text: "PRISM, CORE, SWIFT, and FORGE move the feature set through execution." },
    { title: "Verify", text: "AUDITOR, SENTINEL, and WARDEN gate quality, QA, and compliance sign-off." },
  ];
}

function activeProject(projects) {
  return projects.find((project) => project.id === "careloop") || projects.find((project) => project.stage === "sprint") || projects[0];
}

export default function Constellation() {
  const [portfolio, setPortfolio] = useState(null);
  const [agentStatus, setAgentStatus] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState("nexus");
  const [selectedTeamId, setSelectedTeamId] = useState("strategy");
  const [zoom, setZoom] = useState(0.88);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [portfolioData, agentData] = await Promise.all([readMemory("portfolio"), readMemory("agent-status")]);
      if (!active) return;
      if (portfolioData) setPortfolio(portfolioData);
      if (agentData) setAgentStatus(agentData);
    };
    load();
    const interval = setInterval(load, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const projects = portfolio?.projects || FALLBACK_PROJECTS;
  const currentProject = activeProject(projects);

  const liveAgents = {};
  for (const [id, data] of Object.entries(agentStatus?.agents || {})) {
    liveAgents[id] = {
      status: data.status || "idle",
      task: data.task || "No active task",
      progress: data.progress || 0,
      project: data.project || null,
    };
  }

  const counts = countByStatus(liveAgents);
  const selectedAgent = AGENTS.find((agent) => agent.id === selectedAgentId) || AGENTS[0];
  const selectedTeam = TEAM_PLANES.find((team) => team.id === (selectedAgent.team === "core" ? selectedTeamId : selectedAgent.team)) || TEAM_PLANES[0];
  const aggregatedLinks = aggregateTeamLinks();

  const focusedEdges = AGENT_LINKS.filter((edge) => {
    if (selectedAgentId === "nexus") return edge[0] === "nexus" || edge[1] === "nexus";
    return edge[0] === selectedAgentId || edge[1] === selectedAgentId;
  });

  const visibleTeamLinks = selectedAgentId === "nexus"
    ? aggregatedLinks.filter((edge) => edge.type === "blocks")
    : aggregatedLinks.filter((edge) => edge.fromTeam === selectedTeam.id || edge.toTeam === selectedTeam.id);

  const revealMoons = selectedAgentId !== "nexus";

  const nodePositions = {
    nexus: { x: SUN.x, y: SUN.y },
  };

  for (const team of TEAM_PLANES) {
    const teamAgents = groupedTeamAgents(team.id);
    nodePositions[`team:${team.id}`] = teamHub(team);
    teamAgents.forEach((agent, index) => {
      nodePositions[agent.id] = moonPosition(team, index, teamAgents.length);
    });
  }

  const activeAgents = AGENTS.filter((agent) => {
    const status = liveAgents[agent.id]?.status || "idle";
    return status === "active" || status === "working";
  }).slice(0, 5);

  return (
    <div style={{ height: "100%", minHeight: "100vh", background: "radial-gradient(circle at top, #10223a 0%, #07111d 45%, #040a12 100%)", color: T.text, padding: 18, overflow: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes pulseSun {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes pulseMoon {
          0%, 100% { opacity: 0.32; transform: scale(1); }
          50% { opacity: 0.78; transform: scale(1.14); }
        }
        @keyframes flowLine {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -24; }
        }
        @keyframes drift {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .panel {
          background: ${T.panel};
          border: 1px solid ${T.line};
          backdrop-filter: blur(18px);
          box-shadow: 0 18px 80px rgba(0,0,0,0.28);
        }
        .metricCard {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(119, 163, 220, 0.08);
          border-radius: 14px;
          padding: 12px 14px;
        }
        .projectCard:hover,
        .agentCard:hover,
        .teamCard:hover {
          border-color: rgba(119, 163, 220, 0.28) !important;
          transform: translateY(-1px);
        }
      `}</style>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.85fr) minmax(360px, 0.85fr)", gap: 16, alignItems: "start", minHeight: "calc(100vh - 36px)" }}>
        <div className="panel" style={{ borderRadius: 28, padding: 18, display: "flex", flexDirection: "column", height: "calc(100vh - 36px)", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "end", gap: 16, marginBottom: 14, flexShrink: 0 }}>
            <div style={{ textAlign: "center", justifySelf: "center", maxWidth: 560 }}>
              <div style={{ fontSize: 12, letterSpacing: "0.22em", color: T.dim }}>INVESTOR VIEW</div>
              <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.02 }}>AI Verse</div>
              <div style={{ fontSize: 14, color: T.muted, marginTop: 8, lineHeight: 1.6 }}>
                One founder. One command sun. Six team planes. Visible work, visible gates, visible flow.
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: T.dim }}>Live Status</div>
              <div style={{ fontSize: 14, color: T.green }}>{counts.done} done · {counts.blocked} blocked</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexShrink: 0 }}>
            <div style={{ fontSize: 12, letterSpacing: "0.18em", color: T.dim }}>FOCUS: {selectedAgentId === "nexus" ? "TEAM PLANES" : `${selectedAgent.name} NETWORK`}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setZoom((z) => Math.max(0.62, +(z - 0.08).toFixed(2)))} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.line}`, background: "rgba(255,255,255,0.03)", color: T.text, cursor: "pointer" }}>−</button>
              <div style={{ minWidth: 48, textAlign: "center", fontSize: 12, color: T.muted }}>{Math.round(zoom * 100)}%</div>
              <button onClick={() => setZoom((z) => Math.min(1.22, +(z + 0.08).toFixed(2)))} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.line}`, background: "rgba(255,255,255,0.03)", color: T.text, cursor: "pointer" }}>+</button>
              <button onClick={() => { setSelectedAgentId("nexus"); setZoom(0.88); }} style={{ height: 30, borderRadius: 8, border: `1px solid ${T.line}`, background: "rgba(255,255,255,0.03)", color: T.text, cursor: "pointer", padding: "0 10px", fontSize: 12 }}>Reset</button>
            </div>
          </div>

          <div style={{ position: "relative", flex: 1, overflow: "hidden", borderRadius: 22, background: "radial-gradient(circle at center, rgba(255,211,111,0.08) 0%, rgba(14,26,44,0.38) 34%, rgba(5,10,18,0.84) 100%)", border: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "relative", width: MAP_W, height: MAP_H, transform: `scale(${zoom})`, transformOrigin: "center center", flexShrink: 0 }}>
            <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", zIndex: 1 }}>
              <defs>
                <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(255,211,111,0.98)" />
                  <stop offset="35%" stopColor="rgba(255,211,111,0.32)" />
                  <stop offset="100%" stopColor="rgba(255,211,111,0)" />
                </radialGradient>
                <filter id="softGlow">
                  <feGaussianBlur stdDeviation="10" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <circle cx={SUN.x} cy={SUN.y} r="200" fill="url(#sunGlow)" opacity="0.7" />

              {TEAM_PLANES.map((team) => {
                const hub = teamHub(team);
                const teamAgents = groupedTeamAgents(team.id);
                const activeCount = teamAgents.filter((agent) => {
                  const status = liveAgents[agent.id]?.status || "idle";
                  return status === "active" || status === "working";
                }).length;
                const isFocused = selectedTeam.id === team.id || selectedAgent.team === team.id;
                return (
                  <g key={team.id}>
                    <path
                      d={planePath(team)}
                      fill="none"
                      stroke={team.color}
                      strokeOpacity={isFocused ? 0.34 : 0.12}
                      strokeWidth={isFocused ? 2 : 1.2}
                      strokeDasharray="2 10"
                    />
                    <circle cx={hub.x} cy={hub.y} r={activeCount > 0 ? 34 : 28} fill={`${team.color}18`} stroke={`${team.color}AA`} strokeWidth="1.6" filter="url(#softGlow)" />
                    <circle cx={hub.x} cy={hub.y} r={activeCount > 0 ? 44 : 38} fill="none" stroke={`${team.color}44`} strokeWidth="1.1" />
                    <text x={hub.x} y={hub.y - 4} textAnchor="middle" fontSize="11" fill={team.color} fontWeight="700">{team.glyph}</text>
                    <text x={hub.x} y={hub.y + 16} textAnchor="middle" fontSize="10" fill={T.text} letterSpacing="1.5">{team.name}</text>
                    <text x={hub.x} y={hub.y + 30} textAnchor="middle" fontSize="9" fill={T.dim}>{teamAgents.length} moons</text>
                  </g>
                );
              })}

              {visibleTeamLinks.map((link, index) => {
                const from = nodePositions[`team:${link.fromTeam}`];
                const to = nodePositions[`team:${link.toTeam}`];
                const style = EDGE_STYLE[link.type];
                if (!from || !to) return null;
                return (
                  <g key={`${link.fromTeam}-${link.toTeam}-${link.type}-${index}`}>
                    <path
                      d={curveBetween(from, to, link.type === "supports" ? 0.1 : 0.16)}
                      fill="none"
                      stroke={style.color}
                      strokeWidth={style.width}
                      strokeOpacity={selectedAgentId === "nexus" ? 0.18 : 0.16}
                      strokeDasharray={style.dash}
                      style={style.dash !== "0" ? { animation: "flowLine 5s linear infinite" } : undefined}
                    />
                  </g>
                );
              })}

              {focusedEdges.map((edge) => {
                const from = nodePositions[edge[0]];
                const to = nodePositions[edge[1]];
                const style = EDGE_STYLE[edge[2]];
                if (!from || !to) return null;
                return (
                  <g key={edgeKey(edge)}>
                    <path
                      d={curveBetween(from, to, edge[2] === "supports" ? 0.12 : 0.2)}
                      fill="none"
                      stroke={style.color}
                      strokeWidth={style.width + 0.6}
                      strokeOpacity="0.92"
                      strokeDasharray={style.dash}
                      style={style.dash !== "0" ? { animation: "flowLine 3.5s linear infinite" } : undefined}
                    />
                  </g>
                );
              })}

              <text x={MAP_W / 2} y="32" textAnchor="middle" fontSize="12" letterSpacing="2.5" fill={T.dim}>
                SUN = CEO · PLANES = TEAMS · SELECT A PLANE OR MOON TO DRILL IN
              </text>
            </svg>

            <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
              <div
                style={{
                  position: "absolute",
                  left: `${(SUN.x / MAP_W) * 100}%`,
                  top: `${(SUN.y / MAP_H) * 100}%`,
                  transform: "translate(-50%, -50%)",
                  width: 170,
                  height: 170,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255,211,111,0.3) 0%, rgba(255,211,111,0.18) 35%, rgba(255,211,111,0.03) 72%, rgba(255,211,111,0) 100%)",
                  border: "2px solid rgba(255,211,111,0.88)",
                  boxShadow: "0 0 42px rgba(255,211,111,0.28)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  animation: "pulseSun 3.4s ease-in-out infinite",
                  padding: 18,
                }}
              >
                <div>
                  <div style={{ fontSize: 30, fontWeight: 700, color: T.sun, letterSpacing: "0.08em" }}>NEXUS</div>
                  <div style={{ fontSize: 12, color: T.text, marginTop: 4 }}>CEO / Command Sun</div>
                  <div style={{ fontSize: 10, color: T.dim, marginTop: 6, lineHeight: 1.45 }}>Routes, gates, and load-balances the verse</div>
                </div>
              </div>

              {TEAM_PLANES.map((team) => {
                const hub = nodePositions[`team:${team.id}`];
                const teamAgents = groupedTeamAgents(team.id);
                const activeCount = teamAgents.filter((agent) => {
                  const status = liveAgents[agent.id]?.status || "idle";
                  return status === "active" || status === "working";
                }).length;
                const isFocused = selectedTeam.id === team.id || selectedAgent.team === team.id;
                return (
                  <div key={`hub-${team.id}`}>
                    <button
                      onClick={() => { setSelectedTeamId(team.id); setSelectedAgentId(groupedTeamAgents(team.id)[0]?.id || "nexus"); }}
                      style={{
                        position: "absolute",
                        left: `${(hub.x / MAP_W) * 100}%`,
                        top: `${(hub.y / MAP_H) * 100}%`,
                        transform: "translate(-50%, -50%)",
                        width: activeCount > 0 ? 76 : 66,
                        height: activeCount > 0 ? 76 : 66,
                        borderRadius: "50%",
                        background: `${team.color}1c`,
                        border: `1.5px solid ${isFocused ? `${team.color}` : `${team.color}88`}`,
                        boxShadow: isFocused ? `0 0 18px ${team.color}40` : "none",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        padding: 8,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 12, color: team.color, fontWeight: 700 }}>{team.glyph}</div>
                      <div style={{ fontSize: 10, color: T.text, fontWeight: 700, letterSpacing: "0.08em" }}>{team.name}</div>
                      <div style={{ fontSize: 9, color: T.dim }}>{activeCount} active</div>
                    </button>

                    {revealMoons && selectedTeam.id === team.id && teamAgents.map((agent, index) => {
                      const pos = nodePositions[agent.id];
                      const status = liveAgents[agent.id]?.status || "idle";
                      const statusMeta = STATUS_STYLE[status] || STATUS_STYLE.idle;
                      const isSelected = selectedAgentId === agent.id;
                      const isActive = status === "active" || status === "working";
                      return (
                        <button
                          key={agent.id}
                          onClick={() => { setSelectedAgentId(agent.id); setSelectedTeamId(team.id); }}
                          style={{
                            position: "absolute",
                            left: `${(pos.x / MAP_W) * 100}%`,
                            top: `${(pos.y / MAP_H) * 100}%`,
                            transform: "translate(-50%, -50%)",
                            width: isSelected ? 84 : 70,
                            minHeight: isSelected ? 52 : 44,
                            borderRadius: 14,
                            background: "rgba(7,17,29,0.96)",
                            border: `1.6px solid ${isSelected ? statusMeta.color : `${agent.color}aa`}`,
                            color: T.text,
                            padding: "8px 10px",
                            textAlign: "left",
                            boxShadow: isSelected ? `0 0 18px ${statusMeta.color}35` : "0 8px 18px rgba(0,0,0,0.18)",
                            cursor: "pointer",
                            zIndex: isSelected ? 5 : 3,
                          }}
                        >
                          {isActive && (
                            <div
                              style={{
                                position: "absolute",
                                inset: -6,
                                borderRadius: 18,
                                border: `1px solid ${statusMeta.color}`,
                                opacity: 0.72,
                                animation: "pulseMoon 2.1s ease-in-out infinite",
                                pointerEvents: "none",
                              }}
                            />
                          )}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: agent.color, letterSpacing: "0.07em" }}>{agent.name}</div>
                            <div style={{ width: 8, height: 8, borderRadius: 999, background: statusMeta.color, flexShrink: 0 }} />
                          </div>
                          {isSelected && <div style={{ fontSize: 9, color: T.dim, marginTop: 4, lineHeight: 1.35 }}>{agent.role}</div>}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0, minHeight: 0, maxHeight: "calc(100vh - 36px)", overflowY: "auto", paddingRight: 4 }}>
          <div className="panel" style={{ borderRadius: 22, padding: 18, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: "0.22em", color: T.dim }}>FOCUS NODE</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: selectedAgent.id === "nexus" ? T.sun : selectedAgent.color }}>{selectedAgent.name}</div>
              </div>
              <div style={{ padding: "6px 10px", borderRadius: 999, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.line}`, color: STATUS_STYLE[liveAgents[selectedAgent.id]?.status || "active"]?.color || T.blue, fontSize: 12 }}>
                {STATUS_STYLE[liveAgents[selectedAgent.id]?.status || "active"]?.label || "Active"}
              </div>
            </div>

            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.65, marginBottom: 14 }}>
              {selectedAgent.role}. {selectedAgent.id === "nexus" ? "Central command sun for the entire operating system." : `Moon on the ${selectedTeam.name.toLowerCase()} plane.`}
            </div>

            <div className="metricCard" style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.14em", color: T.dim, marginBottom: 6 }}>CURRENT LOAD</div>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>{clampText(liveAgents[selectedAgent.id]?.task || "No active task", 88)}</div>
            </div>

            <div style={{ fontSize: 12, letterSpacing: "0.2em", color: T.dim, marginBottom: 8 }}>DIRECT COMMUNICATIONS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {focusedEdges.length === 0 && (
                <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                  Select a team plane or moon to inspect exact `blocks`, `feeds`, and `supports` contracts.
                </div>
              )}
              {focusedEdges.slice(0, 4).map((edge) => {
                const peerId = edge[0] === selectedAgent.id ? edge[1] : edge[0];
                const peer = AGENTS.find((agent) => agent.id === peerId);
                const style = EDGE_STYLE[edge[2]];
                return (
                  <div key={edgeKey(edge)} className="agentCard" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${style.color}35`, borderRadius: 14, padding: 12, transition: "all 160ms ease" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: peer?.color || T.text }}>{peer?.name || peerId}</div>
                      <div style={{ fontSize: 11, color: style.color, letterSpacing: "0.14em" }}>{edge[2].toUpperCase()}</div>
                    </div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 6, lineHeight: 1.6 }}>{edge[3]}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel" style={{ borderRadius: 22, padding: 18, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 12, letterSpacing: "0.22em", color: T.dim }}>WORKLOAD SIGNAL</div>
              <div style={{ fontSize: 12, color: T.muted }}>{activeAgents.length} visibly moving</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
              {activeAgents.map((agent) => {
                const status = liveAgents[agent.id]?.status || "idle";
                const statusMeta = STATUS_STYLE[status] || STATUS_STYLE.idle;
                return (
                  <button
                    key={agent.id}
                    className="agentCard"
                    onClick={() => { setSelectedAgentId(agent.id); setSelectedTeamId(agent.team === "core" ? "strategy" : agent.team); }}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${statusMeta.color}33`,
                      borderRadius: 14,
                      padding: 12,
                      color: T.text,
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 160ms ease",
                      animation: "drift 3.6s ease-in-out infinite",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: agent.color }}>{agent.name}</div>
                        <div style={{ fontSize: 12, color: T.muted }}>{agent.role}</div>
                      </div>
                      <div style={{ color: statusMeta.color, fontSize: 11, letterSpacing: "0.14em" }}>{statusMeta.label}</div>
                    </div>
                    <div style={{ fontSize: 12, color: T.dim, marginTop: 7, lineHeight: 1.55 }}>{clampText(liveAgents[agent.id]?.task || "No active task", 62)}</div>
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: 12, letterSpacing: "0.22em", color: T.dim, marginBottom: 10 }}>LINK LEGEND</div>
            <div style={{ display: "grid", gap: 8 }}>
              {Object.entries(EDGE_STYLE).map(([type, style]) => (
                <div key={type} className="teamCard" style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 10, padding: 10, borderRadius: 14, border: `1px solid ${style.color}28`, background: "rgba(255,255,255,0.03)", transition: "all 160ms ease" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="54" height="12">
                      <line x1="0" y1="6" x2="54" y2="6" stroke={style.color} strokeWidth={style.width} strokeDasharray={style.dash} />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: style.color }}>{type.toUpperCase()}</div>
                    <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
                      {type === "blocks" && "Hard gate. Downstream work waits here."}
                      {type === "feeds" && "Information or intelligence flowing into another agent."}
                      {type === "supports" && "Operational support, orchestration, or enablement."}
                    </div>
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
