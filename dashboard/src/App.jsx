import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import CommandCenter  from "./pages/CommandCenter.jsx";
import Constellation  from "./pages/Constellation.jsx";
import Traction       from "./pages/Traction.jsx";
import Skills         from "./pages/Skills.jsx";
import { readMemory } from "./utils/memory.js";

const NAV = [
  { path:"/",              icon:"⬡", label:"NEXUS",    sub:"Command Center"  },
  { path:"/constellation", icon:"◎", label:"STAR MAP", sub:"Agent Network"   },
  { path:"/skills",        icon:"▶", label:"SKILLS",   sub:"Run Skills"      },
  { path:"/traction",      icon:"◈", label:"TRACTION", sub:"Investor Module" },
];

export default function App() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [time,    setTime]    = useState(new Date());
  const [pending, setPending] = useState(0);
  const [blocked, setBlocked] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Poll agent status for sidebar indicators
  useEffect(() => {
    const poll = async () => {
      const [status, actions] = await Promise.all([
        readMemory("agent-status"),
        readMemory("founder-actions"),
      ]);
      if (status?.agents) {
        setBlocked(Object.values(status.agents).filter(a => a.status === "blocked").length);
      }
      if (actions?.actions) {
        setPending(actions.actions.filter(a => !a.done).length);
      }
    };
    poll();
    const iv = setInterval(poll, 5000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"#020508" }}>
      {/* ── Sidebar ── */}
      <div style={{
        width:64, flexShrink:0,
        borderRight:"1px solid rgba(0,217,255,0.08)",
        background:"rgba(2,5,8,0.98)",
        display:"flex", flexDirection:"column",
        alignItems:"center", padding:"12px 0 8px",
        zIndex:50, gap:2,
      }}>
        {/* Logo hex */}
        <div style={{ marginBottom:14 }}>
          <div style={{ width:32, height:32, clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)", background:"rgba(0,217,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 14px rgba(0,217,255,0.3)" }}>
            <span style={{ fontSize:13, color:"#00D9FF" }}>⬡</span>
          </div>
        </div>

        {/* Nav items */}
        {NAV.map(item => {
          const active = location.pathname === item.path;
          return (
            <button key={item.path} onClick={() => navigate(item.path)} title={`${item.label} — ${item.sub}`}
              style={{ width:52, padding:"9px 4px", background:active?"rgba(0,217,255,0.1)":"transparent", border:"none", borderLeft:`2px solid ${active?"#00D9FF":"transparent"}`, color:active?"#00D9FF":"rgba(0,217,255,0.22)", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, transition:"all 0.2s", borderRadius:"0 5px 5px 0" }}>
              <span style={{ fontSize:15, filter:active?"drop-shadow(0 0 5px rgba(0,217,255,0.7))":"none" }}>{item.icon}</span>
              <span style={{ fontSize:5.5, letterSpacing:"0.08em", lineHeight:1.3, textAlign:"center", fontFamily:"'Courier New',monospace" }}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Bottom indicators */}
        <div style={{ marginTop:"auto", width:"100%", display:"flex", flexDirection:"column", alignItems:"center", gap:6, paddingBottom:4 }}>
          {blocked > 0 && (
            <div title={`${blocked} agents blocked`} style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#FF3B5C", fontFamily:"'Courier New',monospace", lineHeight:1 }}>{blocked}</div>
              <div style={{ fontSize:5, color:"rgba(255,59,92,0.5)", letterSpacing:"0.08em" }}>BLOCKED</div>
            </div>
          )}
          {pending > 0 && (
            <div title={`${pending} founder actions pending`} style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#FF6B35", fontFamily:"'Courier New',monospace", lineHeight:1 }}>{pending}</div>
              <div style={{ fontSize:5, color:"rgba(255,107,53,0.5)", letterSpacing:"0.08em" }}>ACTIONS</div>
            </div>
          )}
          {/* Clock */}
          <div style={{ fontSize:7, color:"rgba(0,217,255,0.25)", fontFamily:"'Courier New',monospace", writingMode:"vertical-rl", transform:"rotate(180deg)", letterSpacing:"0.08em" }}>
            {time.toLocaleTimeString("en-US", { hour12:false })}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex:1, minWidth:0, minHeight:0, overflow:"auto" }}>
        <Routes>
          <Route path="/"              element={<CommandCenter />} />
          <Route path="/constellation" element={<Constellation />} />
          <Route path="/skills"        element={<Skills />} />
          <Route path="/traction"      element={<Traction />} />
        </Routes>
      </div>
    </div>
  );
}
