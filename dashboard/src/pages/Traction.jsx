import { useState, useEffect, useRef } from "react";

// ─── Persistent storage ────────────────────────────────────────────────────
const KEY = "nexus-traction-v1";
async function load() { try { const v = localStorage.getItem(KEY); return v ? JSON.parse(v) : null; } catch { return null; } }
async function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} }

// ─── Default data ──────────────────────────────────────────────────────────
const DEFAULT = {
  activeApp: "shiftpay",
  apps: {
    shiftpay: {
      name: "ShiftPay", color: "#00D9FF", stage: "incubation",
      traction: {
        interviews:        { value: 5,   target: 5,   label: "User Interviews",     unit: "",     icon: "◎", done: true  },
        waitlist:          { value: 0,   target: 200, label: "Waitlist Signups",    unit: "",     icon: "◈", done: false },
        testflight:        { value: 0,   target: 25,  label: "TestFlight Testers",  unit: "",     icon: "⬡", done: false },
        wau:               { value: 0,   target: 10,  label: "Weekly Active Users", unit: "",     icon: "◉", done: false },
        calculations_done: { value: 0,   target: 100, label: "Calculations Run",    unit: "",     icon: "◆", done: false },
        crash_free:        { value: 0,   target: 99,  label: "Crash-Free Rate",     unit: "%",    icon: "◎", done: false },
        pmf_signal:        { value: 60,  target: 60,  label: "PMF Signal",          unit: "%",    icon: "◈", done: false },
        nps:               { value: 0,   target: 40,  label: "NPS Score",           unit: "",     icon: "◉", done: false },
      },
      economics: {
        price_mo:    4.99,
        price_yr:    49,
        free_to_paid: 8,
        avg_tenure:  18,
        cac_organic: 0,
        cac_paid:    8,
        support_cost_mo: 0.5,
        infra_cost_per_user: 0.2,
        gross_margin: 85,
      },
      projection: {
        launch_month: 3,
        monthly_downloads: [0, 0, 200, 600, 1000, 1400, 1800, 2200, 2600, 3000, 3400, 3800],
        conversion_rate: 8,
        churn_rate: 5,
      },
      comparables: [
        { name: "Homebase", outcome: "Acquired for $500M", relevance: "Employer scheduling — proves market" },
        { name: "When I Work", outcome: "Raised $300M Series D", relevance: "Same target industry (shift workers)" },
        { name: "DailyPay", outcome: "Valued at $1.75B", relevance: "Earned wage access for hourly workers" },
      ],
      interviews_insight: "22 of 27 shift workers couldn't estimate their paycheck within $20. 4 of 5 would pay $4.99/mo. Top pain: 'I don't know if a shift is worth picking up until payday.'",
    },
    careloop: {
      name: "CareLoop", color: "#00FFB3", stage: "incubation",
      traction: {
        interviews:        { value: 5,   target: 5,   label: "User Interviews",     unit: "",     icon: "◎", done: true  },
        waitlist:          { value: 0,   target: 200, label: "Waitlist Signups",    unit: "",     icon: "◈", done: false },
        testflight:        { value: 0,   target: 25,  label: "TestFlight Testers",  unit: "",     icon: "⬡", done: false },
        wau:               { value: 0,   target: 10,  label: "Weekly Active Users", unit: "",     icon: "◉", done: false },
        logs_per_day:      { value: 0,   target: 5,   label: "Care Logs / Day / Family", unit: "", icon: "◆", done: false },
        crash_free:        { value: 0,   target: 99,  label: "Crash-Free Rate",     unit: "%",    icon: "◎", done: false },
        pmf_signal:        { value: 60,  target: 60,  label: "PMF Signal",          unit: "%",    icon: "◈", done: false },
        nps:               { value: 0,   target: 50,  label: "NPS Score",           unit: "",     icon: "◉", done: false },
      },
      economics: {
        price_mo:    9.99,
        price_yr:    99,
        free_to_paid: 10,
        avg_tenure:  30,
        cac_organic: 0,
        cac_paid:    12,
        support_cost_mo: 0.8,
        infra_cost_per_user: 0.3,
        gross_margin: 88,
      },
      projection: {
        launch_month: 4,
        monthly_downloads: [0, 0, 0, 150, 400, 700, 1000, 1300, 1600, 2000, 2400, 2800],
        conversion_rate: 10,
        churn_rate: 3,
      },
      comparables: [
        { name: "CaringBridge", outcome: "AARP invested, 30M users", relevance: "Caregiver coordination — same market" },
        { name: "Honor / A Place for Mom", outcome: "$1.25B acquisition", relevance: "Senior care platform exit comp" },
        { name: "Lotsa Helping Hands", outcome: "Acquired by Caregiver Action Network", relevance: "Direct feature competitor" },
      ],
      interviews_insight: "All 5 families use group texts for care coordination. 3 had medication errors in the past year due to miscommunication. 4 of 5 would pay $9.99/mo. Top pain: 'I have no idea what happened to my dad between my visits.'",
    },
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function calcRevProjection(app) {
  const { monthly_downloads, conversion_rate, churn_rate, launch_month } = app.projection;
  const price = app.economics.price_mo;
  const churn = churn_rate / 100;
  let paying = 0, mrr = 0;
  return monthly_downloads.map((dl, i) => {
    const newPaying = Math.round(dl * (conversion_rate / 100));
    paying = Math.round(paying * (1 - churn) + newPaying);
    mrr = paying * price;
    return { month: i + 1, downloads: dl, newPaying, paying, mrr: Math.round(mrr) };
  });
}

function calcUnitEcon(econ) {
  const ltv_mo  = econ.price_mo * econ.avg_tenure;
  const ltv_yr  = econ.price_yr;
  const ltv     = Math.max(ltv_mo, ltv_yr * (econ.avg_tenure / 12));
  const cac     = econ.cac_organic > 0 ? (econ.cac_organic + econ.cac_paid) / 2 : econ.cac_paid;
  const ltv_cac = cac > 0 ? ltv / cac : ltv;
  const payback = cac > 0 ? Math.round(cac / (econ.price_mo * (econ.gross_margin / 100))) : 0;
  const cost_per_user = econ.support_cost_mo + econ.infra_cost_per_user;
  const gross_mo = econ.price_mo - cost_per_user;
  const gross_margin_real = (gross_mo / econ.price_mo) * 100;
  return { ltv: Math.round(ltv), cac, ltv_cac: parseFloat(ltv_cac.toFixed(1)), payback, gross_margin: Math.round(gross_margin_real) };
}

function tractionScore(traction) {
  const entries = Object.values(traction);
  const done = entries.filter(t => t.done || t.value >= t.target).length;
  return Math.round((done / entries.length) * 100);
}

// ─── Sub-components ────────────────────────────────────────────────────────
function CornerBrackets({ col = "#00D9FF", sz = 10 }) {
  const s = pos => ({ position: "absolute", width: sz, height: sz, ...pos });
  return (<>
    <div style={{ ...s({ top: 0, left: 0 }), borderTop: `1px solid ${col}`, borderLeft: `1px solid ${col}` }} />
    <div style={{ ...s({ top: 0, right: 0 }), borderTop: `1px solid ${col}`, borderRight: `1px solid ${col}` }} />
    <div style={{ ...s({ bottom: 0, left: 0 }), borderBottom: `1px solid ${col}`, borderLeft: `1px solid ${col}` }} />
    <div style={{ ...s({ bottom: 0, right: 0 }), borderBottom: `1px solid ${col}`, borderRight: `1px solid ${col}` }} />
  </>);
}

function Bar({ value, max, color, height = 4, animate = true }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div style={{ height, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,${color}60,${color})`, borderRadius: 2, transition: animate ? "width 1s ease" : "none", boxShadow: `0 0 6px ${color}50` }} />
    </div>
  );
}

function NumInput({ value, onChange, min = 0, max = 9999, step = 1, prefix = "", suffix = "" }) {
  const inp = { background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,217,255,0.15)", borderRadius: 5, padding: "5px 8px", color: "#c8e8f0", fontSize: 11, fontFamily: "'Courier New',monospace", width: "100%", outline: "none" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {prefix && <span style={{ fontSize: 10, color: "rgba(0,217,255,0.4)", fontFamily: "'Courier New',monospace" }}>{prefix}</span>}
      <input type="number" value={value} min={min} max={max} step={step} onChange={e => onChange(+e.target.value)} style={inp} />
      {suffix && <span style={{ fontSize: 10, color: "rgba(0,217,255,0.4)", fontFamily: "'Courier New',monospace" }}>{suffix}</span>}
    </div>
  );
}

function GaugeRing({ value, max, color, size = 80, label, sublabel }) {
  const pct = Math.min(1, value / Math.max(1, max));
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const grade = pct >= 0.8 ? "A" : pct >= 0.6 ? "B" : pct >= 0.4 ? "C" : "D";
  const gradeColor = pct >= 0.8 ? "#00FFB3" : pct >= 0.6 ? "#FFD700" : pct >= 0.4 ? "#FF6B35" : "#FF3B5C";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: size, height: size, margin: "0 auto 6px" }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: "stroke-dasharray 1.2s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: gradeColor, fontFamily: "'Courier New',monospace", lineHeight: 1 }}>{grade}</div>
          <div style={{ fontSize: 8, color: "rgba(0,217,255,0.4)", fontFamily: "'Courier New',monospace" }}>{Math.round(pct * 100)}%</div>
        </div>
      </div>
      <div style={{ fontSize: 8, color, fontFamily: "'Courier New',monospace", fontWeight: 700, letterSpacing: "0.08em" }}>{label}</div>
      {sublabel && <div style={{ fontSize: 7, color: "rgba(0,217,255,0.3)", fontFamily: "'Courier New',monospace" }}>{sublabel}</div>}
    </div>
  );
}

function StatBox({ label, value, sub, color = "#00D9FF", glow = false, grade }) {
  const gradeColor = grade === "A" ? "#00FFB3" : grade === "B" ? "#FFD700" : grade === "C" ? "#FF6B35" : grade === "D" ? "#FF3B5C" : null;
  return (
    <div style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${color}20`, borderLeft: `3px solid ${color}`, borderRadius: 7, padding: "10px 12px", position: "relative", boxShadow: glow ? `0 0 16px ${color}15` : "none" }}>
      <CornerBrackets col={`${color}30`} sz={7} />
      <div style={{ fontSize: 6.5, color: `${color}60`, fontFamily: "'Courier New',monospace", letterSpacing: "0.15em", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Courier New',monospace", color, lineHeight: 1, textShadow: `0 0 10px ${color}60` }}>{value}</div>
        {grade && <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Courier New',monospace", color: gradeColor }}>{grade}</div>}
      </div>
      {sub && <div style={{ fontSize: 8, color: "rgba(0,217,255,0.3)", fontFamily: "'Courier New',monospace", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function NexusTraction() {
  const [data,       setData]       = useState(null);
  const [loaded,     setLoaded]     = useState(false);
  const [activeTab,  setActiveTab]  = useState("traction"); // traction | economics | projection | evidence
  const [systemTime, setSystemTime] = useState(new Date());
  const [editMode,   setEditMode]   = useState(false);
  const [pulse,      setPulse]      = useState(0);

  useEffect(() => { load().then(d => { setData(d || DEFAULT); setLoaded(true); }); }, []);
  useEffect(() => { if (loaded && data) save(data); }, [data, loaded]);
  useEffect(() => { const t = setInterval(() => setSystemTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(() => setPulse(p => p + 1), 50); return () => clearInterval(t); }, []);

  if (!data) return (
    <div style={{ minHeight: "100vh", background: "#020508", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 9, color: "#00D9FF", fontFamily: "'Courier New',monospace", letterSpacing: "0.3em" }}>NEXUS LOADING TRACTION MODULE...</div>
    </div>
  );

  const app      = data.apps[data.activeApp];
  const appColor = app.color;
  const econ     = calcUnitEcon(app.economics);
  const proj     = calcRevProjection(app);
  const score    = tractionScore(app.traction);
  const year1arr = proj[11]?.mrr * 12 || 0;
  const year1mrr = proj[11]?.mrr || 0;
  const peakMonth = proj.reduce((m, p) => p.mrr > (m?.mrr || 0) ? p : m, proj[0]);
  const ltv_cac_grade = econ.ltv_cac >= 5 ? "A" : econ.ltv_cac >= 3 ? "B" : econ.ltv_cac >= 1.5 ? "C" : "D";

  const updateTraction = (key, field, val) => setData(d => ({ ...d, apps: { ...d.apps, [d.activeApp]: { ...d.apps[d.activeApp], traction: { ...d.apps[d.activeApp].traction, [key]: { ...d.apps[d.activeApp].traction[key], [field]: val } } } } }));
  const updateEcon = (key, val) => setData(d => ({ ...d, apps: { ...d.apps, [d.activeApp]: { ...d.apps[d.activeApp], economics: { ...d.apps[d.activeApp].economics, [key]: val } } } }));
  const updateProj = (key, val) => setData(d => ({ ...d, apps: { ...d.apps, [d.activeApp]: { ...d.apps[d.activeApp], projection: { ...d.apps[d.activeApp].projection, [key]: val } } } }));
  const updateInsight = (val) => setData(d => ({ ...d, apps: { ...d.apps, [d.activeApp]: { ...d.apps[d.activeApp], interviews_insight: val } } }));

  const tabs = [
    { id: "traction",   label: "TRACTION",       sub: `${score}% SCORE` },
    { id: "economics",  label: "UNIT ECONOMICS",  sub: `LTV:CAC ${econ.ltv_cac}:1` },
    { id: "projection", label: "REVENUE MODEL",   sub: `Y1 ARR $${(year1arr/1000).toFixed(0)}K` },
    { id: "evidence",   label: "EVIDENCE WALL",   sub: "INVESTOR READY" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#020508", color: "#c8e8f0", display: "flex", flexDirection: "column", fontFamily: "'Courier New',monospace", overflow: "hidden" }}>
      <style>{`
        @keyframes glow { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scan { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar{width:2px;} ::-webkit-scrollbar-thumb{background:rgba(0,217,255,0.2);}
        input,textarea,select{outline:none;}
        .hov:hover{background:rgba(0,217,255,0.08)!important;border-color:rgba(0,217,255,0.3)!important;}
        .tab-btn:hover{color:#00D9FF!important;}
      `}</style>

      {/* Scanline */}
      <div style={{ position:"fixed",inset:0,zIndex:1,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,217,255,0.005) 3px,rgba(0,217,255,0.005) 4px)" }}/>
      <div style={{ position:"fixed",left:0,right:0,height:2,background:"linear-gradient(transparent,rgba(0,217,255,0.05),transparent)",animation:"scan 8s linear infinite",zIndex:1,pointerEvents:"none" }}/>

      {/* ── TOP BAR ── */}
      <div style={{ position:"relative",zIndex:10,height:52,borderBottom:"1px solid rgba(0,217,255,0.1)",background:"rgba(2,5,8,0.97)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",padding:"0 20px",gap:16,flexShrink:0 }}>
        {/* Logo */}
        <div style={{ display:"flex",alignItems:"center",gap:8,paddingRight:16,borderRight:"1px solid rgba(0,217,255,0.1)" }}>
          <div style={{ width:26,height:26,clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",background:"rgba(0,217,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 12px rgba(0,217,255,0.3)" }}>
            <span style={{ fontSize:11,color:"#00D9FF" }}>⬡</span>
          </div>
          <div>
            <div style={{ fontSize:12,fontWeight:700,color:"#00D9FF",letterSpacing:"0.25em",textShadow:"0 0 10px rgba(0,217,255,0.5)" }}>NEXUS</div>
            <div style={{ fontSize:5.5,color:"rgba(0,217,255,0.3)",letterSpacing:"0.3em" }}>TRACTION + ECONOMICS</div>
          </div>
        </div>

        {/* App selector */}
        <div style={{ display:"flex",gap:6 }}>
          {Object.values(data.apps).map(a => {
            const sc = tractionScore(a.traction);
            const isActive = data.activeApp === Object.keys(data.apps).find(k => data.apps[k] === a);
            const key = Object.keys(data.apps).find(k => data.apps[k] === a);
            return (
              <button key={key} onClick={() => setData(d => ({ ...d, activeApp: key }))} style={{ background: isActive ? `${a.color}12` : "rgba(0,0,0,0.3)", border: `1px solid ${isActive ? a.color : "rgba(0,217,255,0.1)"}`, borderLeft: `3px solid ${a.color}`, color: isActive ? a.color : "rgba(0,217,255,0.3)", borderRadius: 6, padding: "5px 12px", fontSize: 10, cursor: "pointer", fontWeight: 700, letterSpacing: "0.08em", transition: "all 0.2s" }}>
                {a.name}
                <span style={{ marginLeft: 6, fontSize: 7, opacity: 0.7, color: sc >= 60 ? "#00FFB3" : "#FFD700" }}>{sc}%</span>
              </button>
            );
          })}
        </div>

        {/* Live score */}
        <div style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 14px",background:`${appColor}08`,border:`1px solid ${appColor}25`,borderRadius:8 }}>
          <div style={{ width:6,height:6,borderRadius:"50%",background:appColor,boxShadow:`0 0 8px ${appColor}`,animation:"glow 2s infinite" }}/>
          <span style={{ fontSize:8,color:appColor,fontWeight:700,letterSpacing:"0.1em" }}>TRACTION SCORE: {score}%</span>
        </div>

        {/* Edit toggle */}
        <div style={{ marginLeft:"auto",display:"flex",gap:8,alignItems:"center" }}>
          <button onClick={() => setEditMode(e => !e)} style={{ background:editMode?"rgba(255,215,0,0.12)":"rgba(0,0,0,0.3)",border:`1px solid ${editMode?"#FFD700":"rgba(0,217,255,0.12)"}`,color:editMode?"#FFD700":"rgba(0,217,255,0.3)",borderRadius:6,padding:"5px 12px",fontSize:8,cursor:"pointer",fontWeight:700,letterSpacing:"0.1em" }}>
            {editMode ? "◉ EDIT MODE" : "○ VIEW MODE"}
          </button>
          <div style={{ fontSize:10,color:"#00D9FF",letterSpacing:"0.1em" }}>{systemTime.toLocaleTimeString("en-US",{hour12:false})}</div>
        </div>
      </div>

      {/* ── SUB TABS ── */}
      <div style={{ position:"relative",zIndex:9,borderBottom:"1px solid rgba(0,217,255,0.08)",background:"rgba(2,5,8,0.9)",display:"flex" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className="tab-btn" style={{ flex:1,background:activeTab===t.id?"rgba(0,217,255,0.05)":"transparent",border:"none",borderBottom:`2px solid ${activeTab===t.id?appColor:"transparent"}`,color:activeTab===t.id?appColor:"rgba(0,217,255,0.25)",padding:"10px 4px",cursor:"pointer",fontFamily:"'Courier New',monospace",transition:"all 0.2s" }}>
            <div style={{ fontSize:8,fontWeight:700,letterSpacing:"0.12em" }}>{t.label}</div>
            <div style={{ fontSize:6.5,color:activeTab===t.id?`${appColor}70`:"rgba(0,217,255,0.15)",marginTop:1 }}>{t.sub}</div>
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex:1,overflowY:"auto",padding:"20px 24px" }}>

        {/* ════════════════════════════════════════════════
            TRACTION TAB
        ════════════════════════════════════════════════ */}
        {activeTab === "traction" && (
          <div style={{ animation:"fadeUp 0.3s ease" }}>
            {/* Summary gauges */}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
              <GaugeRing value={score} max={100} color={appColor} size={90} label="TRACTION" sublabel="OVERALL SCORE" />
              <GaugeRing value={app.traction.interviews.value} max={app.traction.interviews.target} color="#00FFB3" size={90} label="INTERVIEWS" sublabel={`${app.traction.interviews.value}/${app.traction.interviews.target} DONE`} />
              <GaugeRing value={app.traction.pmf_signal.value} max={100} color="#FFD700" size={90} label="PMF SIGNAL" sublabel="% WOULD PAY" />
              <GaugeRing value={app.traction.waitlist.value} max={app.traction.waitlist.target} color="#B06AFF" size={90} label="WAITLIST" sublabel={`${app.traction.waitlist.value}/${app.traction.waitlist.target} TARGET`} />
            </div>

            {/* Signal cards */}
            <div style={{ fontSize:7,color:"rgba(0,217,255,0.35)",letterSpacing:"0.2em",marginBottom:10 }}>TRACTION SIGNALS — {Object.values(app.traction).filter(t=>t.done||t.value>=t.target).length}/{Object.keys(app.traction).length} CONFIRMED</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:20 }}>
              {Object.entries(app.traction).map(([key, signal]) => {
                const isDone = signal.done || signal.value >= signal.target;
                const pct = Math.min(100, Math.round((signal.value / Math.max(1, signal.target)) * 100));
                const col = isDone ? "#00FFB3" : pct > 50 ? "#FFD700" : appColor;
                return (
                  <div key={key} style={{ background:isDone?"rgba(0,255,179,0.04)":"rgba(0,0,0,0.35)",border:`1px solid ${isDone?"rgba(0,255,179,0.2)":pct>0?`${appColor}20`:"rgba(0,217,255,0.07)"}`,borderRadius:8,padding:"12px 14px",position:"relative",transition:"all 0.3s" }}>
                    <CornerBrackets col={isDone?"rgba(0,255,179,0.25)":`${appColor}15`} sz={8}/>
                    <div style={{ display:"flex",alignItems:"flex-start",gap:10,marginBottom:8 }}>
                      <span style={{ fontSize:14,color:col,filter:`drop-shadow(0 0 4px ${col})` }}>{signal.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:9,fontWeight:700,color:isDone?"#00FFB3":appColor,letterSpacing:"0.08em",marginBottom:2 }}>{signal.label}</div>
                        <div style={{ display:"flex",alignItems:"baseline",gap:4 }}>
                          <span style={{ fontSize:20,fontWeight:700,color:col,fontFamily:"'Courier New',monospace",lineHeight:1 }}>{signal.value}{signal.unit}</span>
                          <span style={{ fontSize:8,color:"rgba(0,217,255,0.25)" }}>/ {signal.target}{signal.unit}</span>
                        </div>
                      </div>
                      <div style={{ width:22,height:22,borderRadius:4,background:isDone?"rgba(0,255,179,0.15)":"rgba(0,0,0,0.3)",border:`1px solid ${isDone?"#00FFB3":"rgba(0,217,255,0.15)"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }} onClick={() => updateTraction(key, "done", !signal.done)}>
                        <span style={{ fontSize:10,color:isDone?"#00FFB3":"rgba(0,217,255,0.2)" }}>{isDone?"✓":"○"}</span>
                      </div>
                    </div>
                    <Bar value={signal.value} max={signal.target} color={col} height={3}/>
                    {editMode && (
                      <div style={{ marginTop:8 }}>
                        <NumInput value={signal.value} onChange={v => updateTraction(key, "value", v)} min={0} max={signal.target * 10} />
                      </div>
                    )}
                    {isDone && <div style={{ position:"absolute",top:8,right:32,fontSize:7,color:"#00FFB3",fontWeight:700,letterSpacing:"0.1em" }}>CONFIRMED</div>}
                  </div>
                );
              })}
            </div>

            {/* Interview insight */}
            <div style={{ background:"rgba(0,217,255,0.03)",border:"1px solid rgba(0,217,255,0.12)",borderRadius:8,padding:"14px 16px",position:"relative" }}>
              <CornerBrackets col="rgba(0,217,255,0.2)" sz={8}/>
              <div style={{ fontSize:7,color:"rgba(0,217,255,0.4)",letterSpacing:"0.2em",marginBottom:8 }}>◎ KEY INTERVIEW INSIGHT — {app.traction.interviews.value}/{app.traction.interviews.target} INTERVIEWS COMPLETE</div>
              {editMode ? (
                <textarea value={app.interviews_insight} onChange={e => updateInsight(e.target.value)}
                  style={{ width:"100%",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(0,217,255,0.15)",borderRadius:5,padding:"8px 10px",color:"#c8e8f0",fontSize:11,fontFamily:"'Courier New',monospace",resize:"vertical",minHeight:60,lineHeight:1.7,outline:"none" }}/>
              ) : (
                <p style={{ margin:0,fontSize:12,color:"rgba(200,232,240,0.75)",lineHeight:1.75,fontStyle:"italic" }}>"{app.interviews_insight}"</p>
              )}
              <div style={{ marginTop:10,display:"flex",gap:6 }}>
                {[{l:"5/5 DONE",c:"#00FFB3",done:true},{l:"GATE 0 ✓",c:"#00FFB3",done:true},{l:"GO DECISION",c:"#00FFB3",done:true}].map(b=>(
                  <span key={b.l} style={{ fontSize:7,fontWeight:700,color:b.c,background:`${b.c}12`,border:`1px solid ${b.c}30`,borderRadius:4,padding:"3px 8px",letterSpacing:"0.08em" }}>{b.l}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            UNIT ECONOMICS TAB
        ════════════════════════════════════════════════ */}
        {activeTab === "economics" && (
          <div style={{ animation:"fadeUp 0.3s ease" }}>
            {/* Key metrics */}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
              <StatBox label="LIFETIME VALUE" value={`$${econ.ltv}`} sub={`${app.economics.avg_tenure} mo avg tenure`} color="#00D9FF" glow />
              <StatBox label="CAC (BLENDED)" value={`$${econ.cac}`} sub="Customer acq cost" color="#FF6B35" />
              <StatBox label="LTV:CAC RATIO" value={`${econ.ltv_cac}:1`} sub="Target ≥ 3:1" color={econ.ltv_cac >= 3 ? "#00FFB3" : "#FF3B5C"} grade={ltv_cac_grade} glow={econ.ltv_cac >= 3} />
              <StatBox label="PAYBACK PERIOD" value={`${econ.payback}mo`} sub="Months to recover CAC" color={econ.payback <= 12 ? "#00FFB3" : "#FFD700"} />
            </div>

            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
              {/* Inputs */}
              <div>
                <div style={{ fontSize:7,color:"rgba(0,217,255,0.35)",letterSpacing:"0.2em",marginBottom:10 }}>PRICING & MONETIZATION</div>
                <div style={{ background:"rgba(0,0,0,0.35)",border:"1px solid rgba(0,217,255,0.1)",borderRadius:8,padding:14,position:"relative",marginBottom:12 }}>
                  <CornerBrackets col="rgba(0,217,255,0.15)" sz={8}/>
                  {[
                    { key:"price_mo",    label:"Monthly Price",          prefix:"$", suffix:"/mo",   min:0.99,  step:0.01 },
                    { key:"price_yr",    label:"Annual Price",           prefix:"$", suffix:"/yr",   min:0,     step:1 },
                    { key:"free_to_paid",label:"Free→Paid Conv. Rate",  prefix:"",  suffix:"%",     min:0,     max:100 },
                    { key:"avg_tenure",  label:"Avg Subscriber Tenure",  prefix:"",  suffix:"months",min:1,     step:1 },
                  ].map(f => (
                    <div key={f.key} style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,alignItems:"center",marginBottom:8 }}>
                      <span style={{ fontSize:8,color:"rgba(0,217,255,0.4)",letterSpacing:"0.06em" }}>{f.label}</span>
                      {editMode ? <NumInput value={app.economics[f.key]} onChange={v=>updateEcon(f.key,v)} prefix={f.prefix} suffix={f.suffix} min={f.min||0} max={f.max||9999} step={f.step||1}/>
                      : <span style={{ fontSize:11,fontWeight:700,color:appColor,fontFamily:"'Courier New',monospace" }}>{f.prefix}{app.economics[f.key]}{f.suffix}</span>}
                    </div>
                  ))}
                </div>

                <div style={{ fontSize:7,color:"rgba(0,217,255,0.35)",letterSpacing:"0.2em",marginBottom:10 }}>COST STRUCTURE</div>
                <div style={{ background:"rgba(0,0,0,0.35)",border:"1px solid rgba(0,217,255,0.1)",borderRadius:8,padding:14,position:"relative" }}>
                  <CornerBrackets col="rgba(0,217,255,0.15)" sz={8}/>
                  {[
                    { key:"cac_organic", label:"Organic CAC",        prefix:"$", suffix:"", min:0 },
                    { key:"cac_paid",    label:"Paid CAC",           prefix:"$", suffix:"", min:0 },
                    { key:"support_cost_mo", label:"Support Cost/User/Mo", prefix:"$", suffix:"", min:0, step:0.1 },
                    { key:"infra_cost_per_user", label:"Infra Cost/User/Mo", prefix:"$", suffix:"", min:0, step:0.01 },
                    { key:"gross_margin", label:"Target Gross Margin", prefix:"",  suffix:"%", min:0, max:100 },
                  ].map(f => (
                    <div key={f.key} style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,alignItems:"center",marginBottom:8 }}>
                      <span style={{ fontSize:8,color:"rgba(0,217,255,0.4)",letterSpacing:"0.06em" }}>{f.label}</span>
                      {editMode ? <NumInput value={app.economics[f.key]} onChange={v=>updateEcon(f.key,v)} prefix={f.prefix} suffix={f.suffix} min={f.min||0} max={f.max||9999} step={f.step||1}/>
                      : <span style={{ fontSize:11,fontWeight:700,color:f.key.includes("cost")?"#FF6B35":appColor,fontFamily:"'Courier New',monospace" }}>{f.prefix}{app.economics[f.key]}{f.suffix}</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculated results */}
              <div>
                <div style={{ fontSize:7,color:"rgba(0,217,255,0.35)",letterSpacing:"0.2em",marginBottom:10 }}>CALCULATED ECONOMICS</div>

                {/* LTV waterfall */}
                <div style={{ background:"rgba(0,0,0,0.35)",border:`1px solid ${appColor}20`,borderRadius:8,padding:14,marginBottom:12,position:"relative" }}>
                  <CornerBrackets col={`${appColor}20`} sz={8}/>
                  <div style={{ fontSize:7,color:`${appColor}60`,letterSpacing:"0.15em",marginBottom:10 }}>LTV CALCULATION</div>
                  {[
                    { label:"Monthly price",     value:`$${app.economics.price_mo}`, color:"rgba(0,217,255,0.5)" },
                    { label:"× Avg tenure",       value:`× ${app.economics.avg_tenure} months`, color:"rgba(0,217,255,0.5)" },
                    { label:"= Gross LTV",         value:`$${Math.round(app.economics.price_mo * app.economics.avg_tenure)}`, color:appColor, bold:true },
                    { label:"– Infra + support",   value:`– $${Math.round((app.economics.support_cost_mo + app.economics.infra_cost_per_user) * app.economics.avg_tenure)}`, color:"#FF6B35" },
                    { label:"= Net LTV",           value:`$${econ.ltv}`, color:"#00FFB3", bold:true, large:true },
                  ].map((row, i) => (
                    <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid rgba(0,217,255,0.05)" }}>
                      <span style={{ fontSize:8.5,color:"rgba(0,217,255,0.35)" }}>{row.label}</span>
                      <span style={{ fontSize:row.large?14:10,fontWeight:row.bold?700:400,color:row.color,fontFamily:"'Courier New',monospace" }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Benchmark comparison */}
                <div style={{ background:"rgba(0,0,0,0.35)",border:"1px solid rgba(0,217,255,0.1)",borderRadius:8,padding:14,marginBottom:12,position:"relative" }}>
                  <CornerBrackets col="rgba(0,217,255,0.15)" sz={8}/>
                  <div style={{ fontSize:7,color:"rgba(0,217,255,0.35)",letterSpacing:"0.15em",marginBottom:10 }}>INVESTOR BENCHMARKS</div>
                  {[
                    { metric:"LTV:CAC Ratio",  yours:econ.ltv_cac,  good:"≥ 3:1",  great:"≥ 5:1",  unit:":1" },
                    { metric:"Gross Margin",    yours:econ.gross_margin, good:"≥ 70%", great:"≥ 85%",  unit:"%" },
                    { metric:"Payback Period",  yours:econ.payback,  good:"≤ 18mo", great:"≤ 12mo", unit:"mo" },
                  ].map(b => {
                    const val = b.yours;
                    const isGreat = b.metric === "Payback Period" ? val <= 12 && val > 0 : val >= parseFloat(b.great);
                    const isGood  = b.metric === "Payback Period" ? val <= 18 && val > 0 : val >= parseFloat(b.good);
                    const color   = isGreat ? "#00FFB3" : isGood ? "#FFD700" : val > 0 ? "#FF3B5C" : "rgba(0,217,255,0.3)";
                    const badge   = isGreat ? "GREAT" : isGood ? "GOOD" : val > 0 ? "WEAK" : "—";
                    return (
                      <div key={b.metric} style={{ display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"1px solid rgba(0,217,255,0.05)" }}>
                        <span style={{ fontSize:8,color:"rgba(0,217,255,0.4)",flex:1 }}>{b.metric}</span>
                        <span style={{ fontSize:11,fontWeight:700,color,fontFamily:"'Courier New',monospace" }}>{val}{b.unit}</span>
                        <span style={{ fontSize:6.5,fontWeight:700,color,background:`${color}12`,border:`1px solid ${color}25`,borderRadius:3,padding:"1px 5px",letterSpacing:"0.08em" }}>{badge}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Margin breakdown */}
                <div style={{ background:"rgba(0,0,0,0.35)",border:"1px solid rgba(0,217,255,0.1)",borderRadius:8,padding:14,position:"relative" }}>
                  <CornerBrackets col="rgba(0,217,255,0.15)" sz={8}/>
                  <div style={{ fontSize:7,color:"rgba(0,217,255,0.35)",letterSpacing:"0.15em",marginBottom:8 }}>PER USER ECONOMICS (MONTHLY)</div>
                  {[
                    { label:"Revenue",         val:`$${app.economics.price_mo}`,   color:"#00D9FF" },
                    { label:"– Infrastructure",val:`– $${app.economics.infra_cost_per_user}`, color:"#FF6B35" },
                    { label:"– Support",       val:`– $${app.economics.support_cost_mo}`,     color:"#FF6B35" },
                    { label:"= Gross Profit",  val:`$${(app.economics.price_mo - app.economics.infra_cost_per_user - app.economics.support_cost_mo).toFixed(2)}`, color:"#00FFB3", bold:true },
                    { label:"Gross Margin",    val:`${econ.gross_margin}%`,         color:"#00FFB3", bold:true },
                  ].map((row,i)=>(
                    <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:i<4?"1px solid rgba(0,217,255,0.04)":"none" }}>
                      <span style={{ fontSize:8,color:"rgba(0,217,255,0.35)" }}>{row.label}</span>
                      <span style={{ fontSize:row.bold?11:9,fontWeight:row.bold?700:400,color:row.color,fontFamily:"'Courier New',monospace" }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            REVENUE PROJECTION TAB
        ════════════════════════════════════════════════ */}
        {activeTab === "projection" && (
          <div style={{ animation:"fadeUp 0.3s ease" }}>
            {/* Controls */}
            {editMode && (
              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(0,217,255,0.1)",borderRadius:8,padding:12 }}>
                {[
                  { key:"conversion_rate", label:"Conv. Rate",   suffix:"%",   min:0, max:50 },
                  { key:"churn_rate",      label:"Churn Rate",   suffix:"%/mo",min:0, max:20 },
                  { key:"launch_month",    label:"Launch Month", suffix:"",    min:1, max:12 },
                ].map(f=>(
                  <div key={f.key}>
                    <div style={{ fontSize:7,color:"rgba(0,217,255,0.35)",marginBottom:4 }}>{f.label}</div>
                    <NumInput value={app.projection[f.key]} onChange={v=>updateProj(f.key,v)} suffix={f.suffix} min={f.min} max={f.max}/>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
              <StatBox label="YEAR 1 ARR" value={`$${year1arr>=1000?(year1arr/1000).toFixed(0)+"K":year1arr}`} sub="End of Month 12" color="#00D9FF" glow />
              <StatBox label="PEAK MRR (MO 12)" value={`$${year1mrr>=1000?(year1mrr/1000).toFixed(0)+"K":year1mrr}`} sub={`${proj[11]?.paying||0} paying users`} color={appColor} />
              <StatBox label="TOTAL PAYING USERS" value={proj[11]?.paying||0} sub="Month 12 estimate" color="#00FFB3" />
              <StatBox label="CONVERSION RATE" value={`${app.projection.conversion_rate}%`} sub={`${app.projection.churn_rate}% monthly churn`} color="#FFD700" />
            </div>

            {/* Waterfall chart */}
            <div style={{ background:"rgba(0,0,0,0.35)",border:`1px solid ${appColor}15`,borderRadius:10,padding:16,marginBottom:16,position:"relative" }}>
              <CornerBrackets col={`${appColor}20`} sz={10}/>
              <div style={{ fontSize:7,color:`${appColor}50`,letterSpacing:"0.2em",marginBottom:14 }}>MRR PROJECTION — MONTH 1 TO 12</div>
              <div style={{ display:"flex",alignItems:"flex-end",gap:6,height:140,paddingBottom:24,position:"relative" }}>
                {/* Y axis label */}
                <div style={{ position:"absolute",left:0,top:0,fontSize:6,color:"rgba(0,217,255,0.2)",letterSpacing:"0.1em",writingMode:"vertical-lr",transform:"rotate(180deg)" }}>MRR ($)</div>
                {proj.map((row, i) => {
                  const maxMrr = Math.max(...proj.map(r=>r.mrr), 1);
                  const h = Math.max(2, (row.mrr / maxMrr) * 100);
                  const isLaunch = i + 1 === app.projection.launch_month;
                  const col = row.mrr > 0 ? appColor : "rgba(0,217,255,0.1)";
                  return (
                    <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,position:"relative" }}>
                      {isLaunch && <div style={{ position:"absolute",top:-18,fontSize:6,color:"#FFD700",fontFamily:"'Courier New',monospace",whiteSpace:"nowrap",letterSpacing:"0.06em" }}>LAUNCH</div>}
                      {row.mrr > 0 && <div style={{ position:"absolute",bottom:22,fontSize:7,color:appColor,fontFamily:"'Courier New',monospace",fontWeight:700,whiteSpace:"nowrap" }}>${row.mrr>=1000?(row.mrr/1000).toFixed(1)+"K":row.mrr}</div>}
                      <div style={{ marginTop:"auto",width:"100%",height:`${h}%`,background:`linear-gradient(180deg,${col},${col}60)`,borderRadius:"3px 3px 0 0",boxShadow:row.mrr>0?`0 0 8px ${col}40`:"none",minHeight:2,transition:"height 0.8s ease",border:isLaunch?`1px solid #FFD700`:"none" }}/>
                      <div style={{ fontSize:6.5,color:isLaunch?"#FFD700":"rgba(0,217,255,0.25)",fontFamily:"'Courier New',monospace",position:"absolute",bottom:0 }}>M{i+1}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div style={{ background:"rgba(0,0,0,0.3)",border:"1px solid rgba(0,217,255,0.08)",borderRadius:8,overflow:"hidden" }}>
              <div style={{ display:"grid",gridTemplateColumns:"60px 1fr 1fr 1fr 1fr",background:"rgba(0,217,255,0.06)",borderBottom:"1px solid rgba(0,217,255,0.1)" }}>
                {["MONTH","DOWNLOADS","NEW PAYING","TOTAL PAYING","MRR"].map(h=>(
                  <div key={h} style={{ padding:"7px 10px",fontSize:6.5,color:"rgba(0,217,255,0.4)",fontFamily:"'Courier New',monospace",letterSpacing:"0.1em",fontWeight:700 }}>{h}</div>
                ))}
              </div>
              {proj.map((row, i) => {
                const isLaunch = i + 1 === app.projection.launch_month;
                const bg = i % 2 === 0 ? "rgba(0,0,0,0.2)" : "transparent";
                return (
                  <div key={i} style={{ display:"grid",gridTemplateColumns:"60px 1fr 1fr 1fr 1fr",background:isLaunch?"rgba(255,215,0,0.04)":bg,borderBottom:"1px solid rgba(0,217,255,0.04)",borderLeft:isLaunch?"3px solid #FFD700":"none" }}>
                    <div style={{ padding:"6px 10px",fontSize:9,color:isLaunch?"#FFD700":appColor,fontFamily:"'Courier New',monospace",fontWeight:isLaunch?700:400 }}>M{row.month}</div>
                    <div style={{ padding:"6px 10px",fontSize:9,color:"rgba(0,217,255,0.5)",fontFamily:"'Courier New',monospace" }}>{row.downloads.toLocaleString()}</div>
                    <div style={{ padding:"6px 10px",fontSize:9,color:row.newPaying>0?"#00D9FF":"rgba(0,217,255,0.2)",fontFamily:"'Courier New',monospace" }}>+{row.newPaying}</div>
                    <div style={{ padding:"6px 10px",fontSize:9,color:row.paying>0?appColor:"rgba(0,217,255,0.2)",fontFamily:"'Courier New',monospace",fontWeight:row.paying>0?700:400 }}>{row.paying}</div>
                    <div style={{ padding:"6px 10px",fontSize:9,color:row.mrr>0?"#00FFB3":"rgba(0,217,255,0.2)",fontFamily:"'Courier New',monospace",fontWeight:row.mrr>0?700:400 }}>{row.mrr>0?`$${row.mrr.toLocaleString()}`:"—"}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            EVIDENCE WALL TAB
        ════════════════════════════════════════════════ */}
        {activeTab === "evidence" && (
          <div style={{ animation:"fadeUp 0.3s ease" }}>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>

              {/* Left column */}
              <div style={{ display:"flex",flexDirection:"column",gap:14 }}>

                {/* Investor-ready signals */}
                <div style={{ background:"rgba(0,0,0,0.35)",border:"1px solid rgba(0,217,255,0.1)",borderRadius:10,padding:14,position:"relative" }}>
                  <CornerBrackets col="rgba(0,217,255,0.2)" sz={9}/>
                  <div style={{ fontSize:7,color:"rgba(0,217,255,0.4)",letterSpacing:"0.2em",marginBottom:12 }}>INVESTOR-READY CHECKLIST</div>
                  {[
                    { label:"5 User Interviews Complete",          done: app.traction.interviews.value >= app.traction.interviews.target, priority:"P0" },
                    { label:"GO Decision Documented",              done: app.traction.interviews.value >= app.traction.interviews.target, priority:"P0" },
                    { label:"Waitlist Page Live",                  done: app.traction.waitlist.value > 0, priority:"P0" },
                    { label:"Working Product Demo",                done: false,  priority:"P0" },
                    { label:"Unit Economics Calculated",           done: econ.ltv > 0, priority:"P1" },
                    { label:"Revenue Projection Built",            done: true,   priority:"P1" },
                    { label:"Comparable Exits Documented",        done: true,   priority:"P1" },
                    { label:"First Real Users (not friends/family)", done: app.traction.wau?.value > 0, priority:"P1" },
                    { label:"Retention Signal (D7 > 20%)",        done: false,  priority:"P2" },
                    { label:"App Store or TestFlight Live",        done: app.traction.testflight?.value > 0, priority:"P2" },
                  ].map((item, i) => (
                    <div key={i} style={{ display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"1px solid rgba(0,217,255,0.05)" }}>
                      <div style={{ width:14,height:14,borderRadius:3,background:item.done?"rgba(0,255,179,0.15)":"rgba(0,0,0,0.4)",border:`1.5px solid ${item.done?"#00FFB3":item.priority==="P0"?"rgba(255,59,92,0.4)":"rgba(0,217,255,0.15)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                        {item.done && <span style={{ fontSize:8,color:"#00FFB3",fontWeight:900 }}>✓</span>}
                      </div>
                      <span style={{ flex:1,fontSize:9,color:item.done?"rgba(200,232,240,0.6)":"rgba(200,232,240,0.9)",textDecoration:item.done?"line-through":"none" }}>{item.label}</span>
                      <span style={{ fontSize:6.5,color:item.priority==="P0"?"#FF3B5C":item.priority==="P1"?"#FFD700":"rgba(0,217,255,0.3)",fontWeight:700 }}>{item.priority}</span>
                    </div>
                  ))}
                </div>

                {/* Interview insight card */}
                <div style={{ background:"rgba(0,217,255,0.03)",border:`1px solid ${appColor}25`,borderRadius:10,padding:14,position:"relative" }}>
                  <CornerBrackets col={`${appColor}25`} sz={9}/>
                  <div style={{ fontSize:7,color:`${appColor}60`,letterSpacing:"0.2em",marginBottom:8 }}>INTERVIEW SIGNAL — USE IN PITCH DECK SLIDE 1</div>
                  <p style={{ margin:"0 0 10px",fontSize:13,color:"rgba(200,232,240,0.85)",lineHeight:1.75,fontStyle:"italic" }}>"{app.interviews_insight}"</p>
                  <div style={{ display:"flex",gap:6 }}>
                    {["5/5 INTERVIEWS","GATE 0 ✓","GO DECISION"].map(b=>(
                      <span key={b} style={{ fontSize:7,fontWeight:700,color:"#00FFB3",background:"rgba(0,255,179,0.1)",border:"1px solid rgba(0,255,179,0.3)",borderRadius:4,padding:"3px 8px",letterSpacing:"0.08em" }}>{b}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div style={{ display:"flex",flexDirection:"column",gap:14 }}>

                {/* Comparable exits */}
                <div style={{ background:"rgba(0,0,0,0.35)",border:"1px solid rgba(255,215,0,0.15)",borderRadius:10,padding:14,position:"relative" }}>
                  <CornerBrackets col="rgba(255,215,0,0.2)" sz={9}/>
                  <div style={{ fontSize:7,color:"rgba(255,215,0,0.5)",letterSpacing:"0.2em",marginBottom:12 }}>COMPARABLE EXITS — BUYER ECOSYSTEM EXISTS</div>
                  {app.comparables.map((comp, i) => (
                    <div key={i} style={{ padding:"10px 0",borderBottom:"1px solid rgba(0,217,255,0.05)" }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4 }}>
                        <span style={{ fontSize:11,fontWeight:700,color:"#FFD700",fontFamily:"'Courier New',monospace" }}>{comp.name}</span>
                        <span style={{ fontSize:8.5,fontWeight:700,color:"#00FFB3",fontFamily:"'Courier New',monospace" }}>{comp.outcome}</span>
                      </div>
                      <div style={{ fontSize:8,color:"rgba(0,217,255,0.4)",lineHeight:1.5 }}>{comp.relevance}</div>
                    </div>
                  ))}
                </div>

                {/* The NEXUS advantage */}
                <div style={{ background:"rgba(0,217,255,0.03)",border:"1px solid rgba(0,217,255,0.15)",borderRadius:10,padding:14,position:"relative" }}>
                  <CornerBrackets col="rgba(0,217,255,0.2)" sz={9}/>
                  <div style={{ fontSize:7,color:"rgba(0,217,255,0.4)",letterSpacing:"0.2em",marginBottom:12 }}>THE NEXUS UNFAIR ADVANTAGE</div>
                  {[
                    { label:"Traditional Startup",    val:"1 app, hire designers ($120K/yr), 18mo to MVP",    col:"#FF3B5C" },
                    { label:"NEXUS Model",             val:"3 apps in parallel, 15 agents, 10-day sprints",    col:"#00FFB3" },
                    { label:"Build Cost",             val:"< $500/mo infrastructure vs $500K seed to staff",  col:"#00FFB3" },
                    { label:"Kill + Redeploy",        val:"Fail fast, redeploy agents immediately to next idea",col:"#00D9FF" },
                    { label:"Moat",                  val:"Operational velocity — not technology",              col:"#FFD700" },
                  ].map((row, i) => (
                    <div key={i} style={{ display:"flex",gap:10,padding:"5px 0",borderBottom:"1px solid rgba(0,217,255,0.05)" }}>
                      <span style={{ fontSize:8,color:"rgba(0,217,255,0.35)",minWidth:110,flexShrink:0 }}>{row.label}</span>
                      <span style={{ fontSize:8.5,color:row.col,lineHeight:1.5 }}>{row.val}</span>
                    </div>
                  ))}
                </div>

                {/* Pitch deck structure */}
                <div style={{ background:"rgba(176,106,255,0.04)",border:"1px solid rgba(176,106,255,0.15)",borderRadius:10,padding:14,position:"relative" }}>
                  <CornerBrackets col="rgba(176,106,255,0.2)" sz={9}/>
                  <div style={{ fontSize:7,color:"rgba(176,106,255,0.5)",letterSpacing:"0.2em",marginBottom:12 }}>9-SLIDE PITCH DECK STRUCTURE</div>
                  {[
                    "1. THE PROBLEM — Interview insight + pain data",
                    "2. MARKET SIZE — TAM per app + combined",
                    "3. THE PRODUCT — Live demo (30 sec)",
                    "4. THE NEXUS MODEL — This is your moat slide",
                    "5. TRACTION — Interviews + waitlist + any usage",
                    "6. UNIT ECONOMICS — LTV:CAC + payback period",
                    "7. REVENUE PROJECTION — Month 1–12 waterfall",
                    "8. COMPARABLES — Who bought apps in this space",
                    "9. THE ASK — Amount, use of funds, 18mo milestone",
                  ].map((slide, i) => (
                    <div key={i} style={{ display:"flex",gap:8,padding:"4px 0",borderBottom:"1px solid rgba(176,106,255,0.06)" }}>
                      <span style={{ fontSize:8.5,color:"rgba(200,232,240,0.7)",lineHeight:1.5 }}>{slide}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
