import { useState } from "react";

const T = {
  bg:"#0f1117", surface:"#171b25", surfaceAlt:"#1c2130",
  border:"#252b3b", borderAlt:"#2e3547",
  text:"#e2e6f0", textMuted:"#6b7585", textDim:"#3d4557",
  blue:"#4f8ef7", green:"#3ecf8e", amber:"#f59e0b", red:"#ef4444",
};

const CATALOG = [
  {
    agent:"auditor", name:"AUDITOR", role:"Code Review Gate", color:"#C49A2A",
    desc:"Runs before every build phase. Blocks SENTINEL until all checks pass.",
    skills:[
      { id:"code.diff_review",     label:"Diff Review",     desc:"Scan git diff — flag auth, schema, .env changes" },
      { id:"code.lint",            label:"Lint",            desc:"ESLint on Node backend + SwiftLint on iOS" },
      { id:"code.static_analysis", label:"Static Analysis", desc:"Grep for TODO/HACK/eval/hardcoded localhost" },
      { id:"code.test_coverage",   label:"Test Coverage",   desc:"Count test files and test functions in both repos" },
    ],
  },
  {
    agent:"sentinel", name:"SENTINEL", role:"QA Gate", color:"#A84848",
    desc:"Runs after AUDITOR passes. Blocks WARDEN until all QA checks clear.",
    skills:[
      { id:"qa.security.scan",  label:"Security Scan",  desc:"Grep for API_KEY, sk-, APNS_KEY leaks in source" },
      { id:"qa.simulator.run",  label:"Simulator Boot", desc:"List devices, boot preferred iPhone simulator" },
      { id:"qa.tests.execute",  label:"Run Tests",      desc:"xcodebuild test — CareLoop scheme on available simulator" },
      { id:"qa.logs.analyze",   label:"Log Stream",     desc:"Capture 8s of simulator error/crash logs" },
    ],
  },
  {
    agent:"warden", name:"WARDEN", role:"Compliance Gate", color:"#7B6DB0",
    desc:"Final gate before sign-off. Privacy, permissions, App Store metadata.",
    skills:[
      { id:"compliance.privacy.check",        label:"Privacy Check",    desc:"Verify privacy.html has all FTC-required sections" },
      { id:"compliance.permissions.validate", label:"Permissions Audit", desc:"Match Info.plist NSXxx keys to actual API usage" },
      { id:"compliance.appstore.check",       label:"App Store Check",  desc:"Char limits + no HIPAA/FDA forbidden claims" },
    ],
  },
  {
    agent:"nexus", name:"NEXUS", role:"Decision Engine", color:"#4A8FBF",
    desc:"Read system state, rank tasks, make GO/NO-GO release decisions.",
    skills:[
      { id:"read.system_state", label:"System State",    desc:"Full snapshot: all agents, queue stats, portfolio" },
      { id:"decide.release",    label:"Release Decision", desc:"GO / NO-GO from all gate statuses" },
      { id:"decide.priority",   label:"Priority Rank",   desc:"Rank pending tasks by project priority" },
    ],
  },
  {
    agent:"orchestrator", name:"ORCHESTRATOR", role:"Flow Control", color:"#3EA89A",
    desc:"Monitor queue state, plan sprint phases, aggregate results.",
    skills:[
      { id:"flow.monitor",    label:"Queue Monitor",    desc:"Real-time pending / running / completed counts" },
      { id:"flow.plan",       label:"Sprint Plan",      desc:"Structured phase plan for next sprint" },
      { id:"flow.aggregate",  label:"Phase Aggregate",  desc:"Summarize all results from a completed phase" },
    ],
  },
];

async function callSkill(agent, skillId, input = {}) {
  const res = await fetch("/api/skill", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent, skill: skillId, input }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.summary || `Server error ${res.status}`);
  return data;
}

function ResultPanel({ result }) {
  const rc = result.result === "PASS" ? T.green : result.result === "FAIL" ? T.red : T.amber;
  return (
    <div style={{ borderTop:`1px solid ${rc}25`, background:`${rc}05`, padding:"10px 12px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom: result.issues?.length || result.data ? 8 : 0 }}>
        <span style={{ fontSize:9, fontWeight:700, color:rc, background:`${rc}18`, padding:"2px 8px", borderRadius:3, letterSpacing:"0.08em", flexShrink:0 }}>
          {result.result}
        </span>
        <span style={{ fontSize:10, color:T.textMuted, lineHeight:1.5, flex:1 }}>{result.summary}</span>
      </div>
      {result.issues?.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          {result.issues.slice(0, 4).map((issue, i) => (
            <div key={i} style={{ display:"flex", gap:6, alignItems:"flex-start" }}>
              <div style={{ width:2, background: issue.severity==="error"?T.red:T.amber, borderRadius:1, marginTop:3, flexShrink:0, alignSelf:"stretch" }}/>
              <span style={{ fontSize:9, color: issue.severity==="error"?T.red:T.amber, lineHeight:1.55, fontFamily:"'IBM Plex Mono',monospace" }}>{issue.message}</span>
            </div>
          ))}
          {result.issues.length > 4 && (
            <span style={{ fontSize:9, color:T.textDim, paddingLeft:8 }}>+{result.issues.length-4} more</span>
          )}
        </div>
      )}
      {result.data && (
        <div style={{ marginTop:8, background:T.bg, borderRadius:5, border:`1px solid ${T.border}`, padding:"8px 10px", maxHeight:140, overflowY:"auto" }}>
          <pre style={{ margin:0, fontSize:9, color:T.textMuted, lineHeight:1.65, whiteSpace:"pre-wrap", wordBreak:"break-all", fontFamily:"'IBM Plex Mono',monospace" }}>
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function SkillCard({ agentId, skill, color }) {
  const key = `${agentId}.${skill.id}`;
  const [running, setRunning] = useState(false);
  const [result,  setResult]  = useState(null);
  const [ts,      setTs]      = useState(null);

  const run = async () => {
    setRunning(true); setResult(null);
    const start = Date.now();
    try {
      const r = await callSkill(agentId, skill.id);
      setResult(r);
    } catch (e) {
      setResult({ result:"FAIL", summary:e.message, issues:[], data:null });
    } finally {
      setRunning(false);
      setTs(`${((Date.now()-start)/1000).toFixed(1)}s`);
    }
  };

  const rc = result ? (result.result==="PASS"?T.green:result.result==="FAIL"?T.red:T.amber) : null;

  return (
    <div style={{ background:T.surfaceAlt, borderRadius:7, border:`1px solid ${rc?`${rc}30`:T.border}`, overflow:"hidden", transition:"border-color 0.2s" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px" }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.text, marginBottom:2, letterSpacing:"0.02em" }}>{skill.label}</div>
          <div style={{ fontSize:9, color:T.textDim, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{skill.desc}</div>
        </div>
        {ts && result && (
          <span style={{ fontSize:8, color:T.textDim, flexShrink:0 }}>{ts}</span>
        )}
        <button onClick={run} disabled={running}
          style={{ flexShrink:0, width:52, padding:"5px 0", background:running?"transparent":`${color}16`,
            border:`1px solid ${color}45`, borderRadius:5, color:running?T.textDim:color,
            fontSize:10, fontWeight:700, fontFamily:"'IBM Plex Mono',monospace",
            cursor:running?"not-allowed":"pointer", letterSpacing:"0.05em", transition:"all 0.15s",
            display:"flex", alignItems:"center", justifyContent:"center", gap:3 }}>
          {running ? (
            <>
              {[0,1,2].map(i=>(
                <div key={i} style={{ width:3, height:3, borderRadius:"50%", background:T.textDim,
                  animation:"skillpulse 1s ease-in-out infinite", animationDelay:`${i*0.2}s` }}/>
              ))}
            </>
          ) : "▶ RUN"}
        </button>
      </div>
      {result && <ResultPanel result={result}/>}
    </div>
  );
}

function AgentBlock({ group }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderTop:`3px solid ${group.color}`, borderRadius:10, overflow:"hidden" }}>
      {/* Header */}
      <button onClick={()=>setCollapsed(c=>!c)}
        style={{ width:"100%", padding:"14px 16px", background:"transparent", border:"none", borderBottom:`1px solid ${T.border}`, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"flex-start", gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
            <div style={{ width:9, height:9, borderRadius:2, background:group.color, boxShadow:`0 0 10px ${group.color}60`, flexShrink:0 }}/>
            <span style={{ fontSize:13, fontWeight:700, color:group.color, letterSpacing:"0.08em", fontFamily:"'IBM Plex Mono',monospace" }}>{group.name}</span>
            <span style={{ fontSize:9, color:T.textDim, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginLeft:"auto" }}>{group.role}</span>
          </div>
          <p style={{ margin:0, fontSize:10, color:T.textMuted, lineHeight:1.6 }}>{group.desc}</p>
        </div>
        <div style={{ display:"flex", gap:4, alignItems:"center", flexShrink:0, marginTop:2 }}>
          <span style={{ fontSize:9, color:T.textDim }}>{group.skills.length} skills</span>
          <span style={{ fontSize:10, color:T.textDim, transform:collapsed?"rotate(-90deg)":"rotate(0)", transition:"transform 0.2s" }}>▾</span>
        </div>
      </button>
      {/* Skills */}
      {!collapsed && (
        <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 }}>
          {group.skills.map(skill => (
            <SkillCard key={skill.id} agentId={group.agent} skill={skill} color={group.color}/>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Skills() {
  const [runAll, setRunAll] = useState(false);
  const totalSkills = CATALOG.reduce((s,g)=>s+g.skills.length,0);

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:T.bg, color:T.text, fontFamily:"'IBM Plex Mono',monospace", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#2e3547;border-radius:2px;}
        @keyframes skillpulse{0%,100%{opacity:0.3}50%{opacity:1}}
      `}</style>

      {/* ── Header ── */}
      <header style={{ flexShrink:0, height:52, display:"flex", alignItems:"center", padding:"0 24px", gap:16, borderBottom:`1px solid ${T.border}`, background:T.surface }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:10, paddingRight:20, borderRight:`1px solid ${T.border}` }}>
          <span style={{ fontSize:13, fontWeight:700, color:T.text, letterSpacing:"0.06em" }}>SKILLS</span>
          <span style={{ fontSize:9, color:T.textDim, letterSpacing:"0.1em", textTransform:"uppercase" }}>Execution Console</span>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          {CATALOG.map(g=>(
            <div key={g.agent} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:5, height:5, borderRadius:1, background:g.color }}/>
              <span style={{ fontSize:9, color:T.textDim }}>{g.name}</span>
            </div>
          ))}
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:9, color:T.textDim }}>{totalSkills} skills across {CATALOG.length} agents</span>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:5, height:5, borderRadius:"50%", background:T.green, boxShadow:`0 0 6px ${T.green}` }}/>
            <span style={{ fontSize:9, color:T.textDim }}>API ready · POST /api/skill</span>
          </div>
        </div>
      </header>

      {/* ── Skill grid ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>

        {/* Gate pipeline banner */}
        <div style={{ marginBottom:20, padding:"12px 18px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, display:"flex", alignItems:"center", gap:0 }}>
          <span style={{ fontSize:10, color:T.textDim, letterSpacing:"0.08em", marginRight:16 }}>GATE PIPELINE</span>
          {[
            { label:"BUILD",    color:"#4A8FBF", note:"CORE + SWIFT" },
            { label:"AUDITOR",  color:"#C49A2A", note:"4 skills" },
            { label:"SENTINEL", color:"#A84848", note:"4 skills" },
            { label:"WARDEN",   color:"#7B6DB0", note:"3 skills" },
            { label:"SIGN-OFF", color:"#3EA89A", note:"NEXUS decide" },
          ].map((step, i, arr) => (
            <div key={step.label} style={{ display:"flex", alignItems:"center" }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:9, fontWeight:700, color:step.color, letterSpacing:"0.08em" }}>{step.label}</div>
                <div style={{ fontSize:8, color:T.textDim }}>{step.note}</div>
              </div>
              {i < arr.length-1 && (
                <div style={{ width:28, height:1, background:`linear-gradient(90deg,${step.color}60,${arr[i+1].color}60)`, margin:"0 8px", flexShrink:0 }}/>
              )}
            </div>
          ))}
        </div>

        {/* Agent skill blocks */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {/* Row 1: AUDITOR + SENTINEL */}
          <AgentBlock group={CATALOG[0]}/>
          <AgentBlock group={CATALOG[1]}/>
          {/* Row 2: WARDEN + NEXUS */}
          <AgentBlock group={CATALOG[2]}/>
          <AgentBlock group={CATALOG[3]}/>
          {/* Row 3: ORCHESTRATOR full-width */}
          <div style={{ gridColumn:"1 / -1" }}>
            <AgentBlock group={CATALOG[4]}/>
          </div>
        </div>

        {/* CLI reference */}
        <div style={{ marginTop:20, padding:"14px 18px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:8 }}>
          <div style={{ fontSize:10, fontWeight:700, color:T.textDim, letterSpacing:"0.1em", marginBottom:10, textTransform:"uppercase" }}>CLI Equivalents</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
            {CATALOG.flatMap(g=>g.skills.map(s=>(
              <div key={`${g.agent}.${s.id}`} style={{ padding:"5px 8px", background:T.surfaceAlt, borderRadius:4, border:`1px solid ${T.border}` }}>
                <code style={{ fontSize:8.5, color:T.blue, fontFamily:"'IBM Plex Mono',monospace" }}>
                  npm run skill {g.agent} {s.id}
                </code>
              </div>
            )))}
          </div>
        </div>

      </div>
    </div>
  );
}
