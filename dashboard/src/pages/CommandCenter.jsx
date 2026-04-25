import { useState, useEffect, useRef } from "react";
import { readMemory } from "../utils/memory.js";
import { askNexus }   from "../utils/api.js";
import { buildNexusPrompt } from "../utils/nexusPrompt.js";

const T = {
  bg:"#0f1117",surface:"#171b25",surfaceAlt:"#1c2130",
  border:"#252b3b",borderAlt:"#2e3547",
  text:"#e2e6f0",textMuted:"#6b7585",textDim:"#3d4557",
  blue:"#4f8ef7",green:"#3ecf8e",amber:"#f59e0b",red:"#ef4444",purple:"#a78bfa",
};

const STATUS = {
  active: {color:T.blue,  bg:"#4f8ef714",label:"Active"},
  working:{color:T.amber, bg:"#f59e0b14",label:"Working"},
  blocked:{color:T.red,   bg:"#ef444414",label:"Blocked"},
  done:   {color:T.green, bg:"#3ecf8e14",label:"Done"},
  idle:   {color:T.textDim,bg:"transparent",label:"Idle"},
};

const PRIORITY = {
  CRITICAL:{color:T.red,label:"Critical"},
  HIGH:    {color:T.amber,label:"High"},
  MEDIUM:  {color:T.blue,label:"Medium"},
  LOW:     {color:T.textMuted,label:"Low"},
};

const QUICK = [
  "Full portfolio status report",
  "What's blocking Sprint 1?",
  "What should I do today?",
  "Investor briefing — 5 bullets",
  "Which agents need unblocking?",
  "ShiftPay vs CareLoop priority",
];

function Dot({color,pulse=false}){
  return <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:color,flexShrink:0,animation:pulse?"dotpulse 2s ease-in-out infinite":"none"}}/>;
}

function Badge({label,color,bg}){
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:600,color,background:bg,borderRadius:4,padding:"2px 7px",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.02em"}}>{label}</span>;
}

function SectionHeader({label,count,right}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 12px",marginBottom:4}}>
      <span style={{fontSize:10,fontWeight:700,color:T.textDim,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.08em",textTransform:"uppercase"}}>
        {label} {count!==undefined&&<span style={{color:T.textDim,fontWeight:400}}>({count})</span>}
      </span>
      {right}
    </div>
  );
}

function useTypewriter(text,speed=6){
  const [out,setOut]=useState("");
  useEffect(()=>{
    setOut("");if(!text)return;
    let i=0;
    const iv=setInterval(()=>{i++;setOut(text.slice(0,i));if(i>=text.length)clearInterval(iv);},speed);
    return()=>clearInterval(iv);
  },[text]);
  return out;
}

function Message({msg,isLatest}){
  const isUser=msg.role==="user";
  const typed=useTypewriter(isLatest&&!isUser?msg.content:null,6);
  const content=isLatest&&!isUser?typed:msg.content;
  if(isUser){
    return(
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:20}}>
        <div style={{maxWidth:"68%"}}>
          <div style={{textAlign:"right",fontSize:10,color:T.textMuted,fontFamily:"'IBM Plex Mono',monospace",marginBottom:5}}>You · {msg.time}</div>
          <div style={{background:T.blue,borderRadius:"12px 12px 2px 12px",padding:"10px 14px"}}>
            <p style={{margin:0,fontSize:13,color:"#fff",lineHeight:1.65}}>{content}</p>
          </div>
        </div>
      </div>
    );
  }
  return(
    <div style={{display:"flex",gap:10,marginBottom:20}}>
      <div style={{width:30,height:30,borderRadius:8,flexShrink:0,background:T.surfaceAlt,border:`1px solid ${T.borderAlt}`,display:"flex",alignItems:"center",justifyContent:"center",marginTop:2}}>
        <span style={{fontSize:11,color:T.blue,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>N</span>
      </div>
      <div style={{flex:1,maxWidth:"calc(100% - 40px)"}}>
        <div style={{fontSize:10,color:T.textMuted,fontFamily:"'IBM Plex Mono',monospace",marginBottom:5}}>NEXUS · {msg.time}</div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"2px 12px 12px 12px",padding:"12px 16px"}}>
          <p style={{margin:0,fontSize:13.5,color:T.text,lineHeight:1.8,fontFamily:"Georgia,'Times New Roman',serif",whiteSpace:"pre-wrap"}}>
            {content}
            {isLatest&&!isUser&&content!==msg.content&&<span style={{color:T.blue,animation:"blink 1s step-end infinite"}}>|</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

function AgentRow({id,agent}){
  const st=STATUS[agent.status]||STATUS.idle;
  const [hov,setHov]=useState(false);
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:"grid",gridTemplateColumns:"88px 1fr auto",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:6,background:hov?T.surfaceAlt:"transparent",transition:"background 0.15s"}}>
      <div style={{display:"flex",alignItems:"center",gap:7}}>
        <Dot color={st.color} pulse={agent.status==="active"||agent.status==="working"}/>
        <span style={{fontSize:11,fontWeight:700,color:st.color,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.03em"}}>{id.toUpperCase()}</span>
      </div>
      <span style={{fontSize:11,color:T.textMuted,fontFamily:"'IBM Plex Mono',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{agent.task}</span>
      {agent.project&&<span style={{fontSize:10,color:T.textDim,fontFamily:"'IBM Plex Mono',monospace",flexShrink:0}}>{agent.project}</span>}
    </div>
  );
}

function ActionRow({action,onToggle}){
  const p=PRIORITY[action.priority]||PRIORITY.LOW;
  const [hov,setHov]=useState(false);
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={onToggle}
      style={{display:"flex",gap:10,alignItems:"flex-start",padding:"9px 12px",borderRadius:6,cursor:"pointer",background:hov?T.surfaceAlt:"transparent",transition:"background 0.15s"}}>
      <div style={{width:16,height:16,borderRadius:4,flexShrink:0,marginTop:1,border:`1.5px solid ${action.done?T.green:T.borderAlt}`,background:action.done?T.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
        {action.done&&(
          <svg width={9} height={7} viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div style={{flex:1}}>
        <p style={{margin:0,fontSize:12,lineHeight:1.55,color:action.done?T.textDim:T.text,textDecoration:action.done?"line-through":"none",fontFamily:"'IBM Plex Mono',monospace"}}>{action.text}</p>
        <span style={{fontSize:10,color:p.color,fontFamily:"'IBM Plex Mono',monospace",fontWeight:600}}>{p.label}</span>
      </div>
    </div>
  );
}

function QueueRow({task}){
  const p=PRIORITY[(task.priority||"normal").toUpperCase()]||PRIORITY.LOW;
  return(
    <div style={{padding:"9px 12px",borderRadius:6,border:`1px solid ${T.border}`,background:T.surfaceAlt,marginBottom:6}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
        <span style={{fontSize:10,color:p.color,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>{p.label}</span>
        <span style={{fontSize:10,color:T.blue,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>→ {(task.agentId||"").toUpperCase()}</span>
        {task.projectId&&<span style={{marginLeft:"auto",fontSize:10,color:T.textDim,fontFamily:"'IBM Plex Mono',monospace"}}>{task.projectId}</span>}
      </div>
      <p style={{margin:0,fontSize:11.5,color:T.textMuted,fontFamily:"'IBM Plex Mono',monospace",lineHeight:1.5}}>{task.task}</p>
    </div>
  );
}

function StatChip({label,value,color}){
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
      <span style={{fontSize:18,fontWeight:700,color:color||T.textMuted,fontFamily:"'IBM Plex Mono',monospace",lineHeight:1}}>{value}</span>
      <span style={{fontSize:9,color:T.textDim,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.06em",textTransform:"uppercase"}}>{label}</span>
    </div>
  );
}

function getTimeOfDay(){
  const h=new Date().getHours();
  return h<12?"morning":h<17?"afternoon":"evening";
}

export default function CommandCenter(){
  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [leftTab,    setLeftTab]    = useState("agents");
  const [portfolio,  setPortfolio]  = useState(null);
  const [agentStatus,setAgentStatus]= useState(null);
  const [founderActs,setFounderActs]= useState(null);
  const [taskQueue,  setTaskQueue]  = useState(null);
  const [clock,      setClock]      = useState(new Date());
  const chatRef=useRef(null);
  const inputRef=useRef(null);

  useEffect(()=>{const t=setInterval(()=>setClock(new Date()),1000);return()=>clearInterval(t);},[]);

  useEffect(()=>{
    const poll=async()=>{
      const[p,a,f,q]=await Promise.all([readMemory("portfolio"),readMemory("agent-status"),readMemory("founder-actions"),readMemory("task-queue")]);
      if(p)setPortfolio(p);if(a)setAgentStatus(a);if(f)setFounderActs(f);if(q)setTaskQueue(q);
    };
    poll();const iv=setInterval(poll,4000);return()=>clearInterval(iv);
  },[]);

  useEffect(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[messages,loading]);

  const send=async(text)=>{
    const msg=text||input.trim();if(!msg||loading)return;
    setInput("");
    const t=clock.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
    const uMsg={role:"user",content:msg,time:t};
    setMessages(prev=>[...prev,uMsg]);setLoading(true);
    try{
      const sp=buildNexusPrompt(portfolio,agentStatus,founderActs);
      const reply=await askNexus([...messages,uMsg],sp);
      setMessages(prev=>[...prev,{role:"assistant",content:reply,time:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}]);
    }catch(e){
      setMessages(prev=>[...prev,{role:"assistant",content:`Unable to reach NEXUS.\n\n${e.message}\n\nCheck that VITE_ANTHROPIC_API_KEY is set in dashboard/.env`,time:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}]);
    }finally{setLoading(false);inputRef.current?.focus();}
  };

  const toggleAction=(id)=>setFounderActs(prev=>({...prev,actions:prev.actions.map(a=>a.id===id?{...a,done:!a.done}:a)}));

  const agents   = agentStatus?.agents||{};
  const projects = portfolio?.projects||[];
  const actions  = founderActs?.actions||[];
  const pending  = taskQueue?.queue?.filter(t=>t.status==="pending")||[];
  const ae       = Object.entries(agents);
  const activeCount  = ae.filter(([,a])=>a.status==="active"||a.status==="working").length;
  const blockedCount = ae.filter(([,a])=>a.status==="blocked").length;
  const doneCount    = ae.filter(([,a])=>a.status==="done").length;
  const pendingActs  = actions.filter(a=>!a.done).length;

  const TABS=[
    {id:"agents",  label:"Agents",     count:ae.length},
    {id:"actions", label:"Directives", count:pendingActs},
    {id:"queue",   label:"Queue",      count:pending.length},
  ];

  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:T.bg,color:T.text,fontFamily:"'IBM Plex Mono',monospace"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes dotpulse{0%,100%{box-shadow:0 0 0 2px rgba(79,142,247,0.3)}50%{box-shadow:0 0 0 4px rgba(79,142,247,0.08)}}
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{opacity:0.3}50%{opacity:0.8}100%{opacity:0.3}}
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:${T.borderAlt};border-radius:2px;}
        textarea,input{outline:none;} button{cursor:pointer;}
        ::placeholder{color:${T.textDim};}
      `}</style>

      {/* ── Header ── */}
      <header style={{height:52,flexShrink:0,display:"flex",alignItems:"center",padding:"0 20px",gap:20,borderBottom:`1px solid ${T.border}`,background:T.surface}}>
        <div style={{display:"flex",alignItems:"baseline",gap:10,paddingRight:20,borderRight:`1px solid ${T.border}`}}>
          <span style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:20,color:T.text,letterSpacing:"-0.01em"}}>Nexus</span>
          <span style={{fontSize:10,color:T.textDim,letterSpacing:"0.1em",fontWeight:600}}>COMMAND</span>
        </div>
        <div style={{display:"flex",gap:6}}>
          <Badge label={`${activeCount} Active`}  color={T.blue}  bg="#4f8ef712"/>
          {blockedCount>0&&<Badge label={`${blockedCount} Blocked`} color={T.red} bg="#ef444412"/>}
          <Badge label={`${doneCount} Done`}    color={T.green} bg="#3ecf8e12"/>
          {pending.length>0&&<Badge label={`${pending.length} Queued`} color={T.amber} bg="#f59e0b12"/>}
        </div>
        <div style={{display:"flex",gap:4,marginLeft:"auto"}}>
          {projects.map(p=>(
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 11px",background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:6}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:p.color||T.blue}}/>
              <span style={{fontSize:11,fontWeight:600,color:T.text,letterSpacing:"0.02em"}}>{p.name}</span>
              <span style={{fontSize:9,color:T.textDim,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.06em"}}>{p.gate||p.stage}</span>
            </div>
          ))}
        </div>
        <div style={{paddingLeft:16,borderLeft:`1px solid ${T.border}`,fontSize:12,color:T.textMuted,fontWeight:500,fontVariantNumeric:"tabular-nums"}}>
          {clock.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false})}
        </div>
      </header>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* ── Left panel ── */}
        <aside style={{width:296,flexShrink:0,borderRight:`1px solid ${T.border}`,background:T.surface,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* Tabs */}
          <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,padding:"0 4px"}}>
            {TABS.map(tab=>(
              <button key={tab.id} onClick={()=>setLeftTab(tab.id)} style={{flex:1,padding:"11px 4px",background:"transparent",border:"none",borderBottom:`2px solid ${leftTab===tab.id?T.blue:"transparent"}`,color:leftTab===tab.id?T.text:T.textMuted,fontSize:11,fontWeight:leftTab===tab.id?600:400,fontFamily:"'IBM Plex Mono',monospace",transition:"all 0.15s"}}>
                {tab.label}
                {tab.count>0&&<span style={{marginLeft:5,fontSize:9,fontWeight:700,color:tab.id==="actions"&&tab.count>0?T.amber:tab.id==="queue"&&tab.count>0?T.blue:T.textDim}}>{tab.count}</span>}
              </button>
            ))}
          </div>

          <div style={{flex:1,overflowY:"auto",padding:"12px 0"}}>

            {leftTab==="agents"&&(
              <>
                {/* Summary */}
                <div style={{display:"flex",justifyContent:"space-around",padding:"8px 12px 16px",borderBottom:`1px solid ${T.border}`,marginBottom:12}}>
                  <StatChip label="Active"  value={activeCount}  color={T.blue}/>
                  <StatChip label="Blocked" value={blockedCount} color={blockedCount>0?T.red:T.textDim}/>
                  <StatChip label="Done"    value={doneCount}    color={T.green}/>
                  <StatChip label="Idle"    value={ae.length-activeCount-blockedCount-doneCount} color={T.textDim}/>
                </div>
                {["active","working","blocked","idle","done"].map(status=>{
                  const group=ae.filter(([,a])=>a.status===status);
                  if(!group.length)return null;
                  const st=STATUS[status];
                  return(
                    <div key={status} style={{marginBottom:10}}>
                      <SectionHeader label={st.label} count={group.length} right={<Dot color={st.color} pulse={status==="active"||status==="working"}/>}/>
                      {group.map(([id,agent])=><AgentRow key={id} id={id} agent={agent}/>)}
                    </div>
                  );
                })}
                {ae.length===0&&(
                  <div style={{padding:"32px 20px",textAlign:"center"}}>
                    <p style={{fontSize:11,color:T.textDim,lineHeight:1.8}}>No agent data.<br/>Start the orchestrator:<br/><code style={{color:T.blue}}>npm run orchestrator</code></p>
                  </div>
                )}
              </>
            )}

            {leftTab==="actions"&&(
              <>
                <SectionHeader label="Founder Directives" count={`${pendingActs} pending`}/>
                <div style={{marginTop:8}}>
                  {actions.filter(a=>!a.done).map(a=><ActionRow key={a.id} action={a} onToggle={()=>toggleAction(a.id)}/>)}
                  {actions.filter(a=>!a.done).length>0&&actions.filter(a=>a.done).length>0&&<div style={{height:1,background:T.border,margin:"8px 12px"}}/>}
                  {actions.filter(a=>a.done).map(a=><ActionRow key={a.id} action={a} onToggle={()=>toggleAction(a.id)}/>)}
                </div>
              </>
            )}

            {leftTab==="queue"&&(
              <>
                <SectionHeader label="Task Queue" count={pending.length}/>
                <div style={{padding:"8px 12px 0"}}>
                  {pending.length===0?(
                    <div style={{padding:"24px 0",textAlign:"center"}}>
                      <p style={{fontSize:11,color:T.textDim,lineHeight:1.9}}>Queue is empty.<br/><code style={{color:T.blue,fontSize:10}}>npm run task &lt;agent&gt; "&lt;task&gt;"</code></p>
                    </div>
                  ):pending.map(t=><QueueRow key={t.id} task={t}/>)}
                </div>
                {(taskQueue?.completed?.length>0||taskQueue?.failed?.length>0)&&(
                  <>
                    <div style={{height:1,background:T.border,margin:"12px 0"}}/>
                    <SectionHeader label="History"/>
                    <div style={{padding:"8px 12px",display:"flex",gap:20}}>
                      <div><div style={{fontSize:18,fontWeight:700,color:T.green,fontFamily:"'IBM Plex Mono',monospace"}}>{taskQueue?.completed?.length||0}</div><div style={{fontSize:10,color:T.textDim}}>Completed</div></div>
                      <div><div style={{fontSize:18,fontWeight:700,color:(taskQueue?.failed?.length||0)>0?T.red:T.textDim,fontFamily:"'IBM Plex Mono',monospace"}}>{taskQueue?.failed?.length||0}</div><div style={{fontSize:10,color:T.textDim}}>Failed</div></div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{padding:"10px 14px",borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:8}}>
            <Dot color={T.green} pulse/>
            <span style={{fontSize:10,color:T.textDim}}>Live · memory/*.json · 4s poll</span>
          </div>
        </aside>

        {/* ── Chat ── */}
        <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:T.bg}}>

          {/* Chat header */}
          <div style={{height:48,flexShrink:0,borderBottom:`1px solid ${T.border}`,padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:28,height:28,borderRadius:7,background:T.surfaceAlt,border:`1px solid ${T.borderAlt}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:11,color:T.blue,fontWeight:700}}>N</span>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:T.text}}>NEXUS</div>
                <div style={{fontSize:10,color:T.green,display:"flex",alignItems:"center",gap:5}}>
                  <Dot color={T.green} pulse/> Online — context from live memory files
                </div>
              </div>
            </div>
            <span style={{fontSize:10,color:T.textDim}}>{messages.length>0?`${messages.length} messages`:"No conversation yet"}</span>
          </div>

          {/* Messages */}
          <div ref={chatRef} style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>
            {messages.length===0&&(
              <div style={{maxWidth:560,margin:"40px auto 0",animation:"fadein 0.5s ease"}}>
                {/* Greeting */}
                <div style={{marginBottom:32}}>
                  <div style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:30,color:T.text,marginBottom:10,lineHeight:1.15}}>
                    Good {getTimeOfDay()},<br/>Founder.
                  </div>
                  <p style={{fontSize:13,color:T.textMuted,lineHeight:1.75,margin:0}}>
                    NEXUS is online. Context is loaded from your memory files.
                    Both ShiftPay and CareLoop have completed Gate 0 interviews.
                    What would you like to know?
                  </p>
                </div>

                {/* Portfolio table */}
                {portfolio?.projects?.length>0&&(
                  <div style={{marginBottom:28}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.textDim,letterSpacing:"0.1em",marginBottom:10,textTransform:"uppercase"}}>Portfolio</div>
                    <div style={{border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden"}}>
                      {portfolio.projects.map((p,i)=>(
                        <div key={p.id} style={{display:"grid",gridTemplateColumns:"8px 1fr auto auto auto",alignItems:"center",gap:12,padding:"11px 14px",background:i%2===0?T.surface:T.surfaceAlt,borderBottom:i<portfolio.projects.length-1?`1px solid ${T.border}`:"none"}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:p.color||T.blue}}/>
                          <span style={{fontSize:12,fontWeight:600,color:T.text}}>{p.name}</span>
                          <span style={{fontSize:10,color:T.textDim}}>{p.stage}</span>
                          <span style={{fontSize:10,color:T.textMuted}}>Gate {p.gate}</span>
                          <span style={{fontSize:10,color:T.textDim}}>{p.tam}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick commands */}
                <div style={{fontSize:10,fontWeight:700,color:T.textDim,letterSpacing:"0.1em",marginBottom:10,textTransform:"uppercase"}}>Suggested</div>
                <div style={{display:"flex",flexDirection:"column",gap:2}}>
                  {QUICK.map(q=>(
                    <button key={q} onClick={()=>send(q)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",textAlign:"left",background:T.surface,border:`1px solid ${T.border}`,borderRadius:7,color:T.textMuted,fontSize:12,fontFamily:"'IBM Plex Mono',monospace",transition:"all 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.background=T.surfaceAlt;e.currentTarget.style.color=T.text;e.currentTarget.style.borderColor=T.borderAlt;}}
                    onMouseLeave={e=>{e.currentTarget.style.background=T.surface;e.currentTarget.style.color=T.textMuted;e.currentTarget.style.borderColor=T.border;}}>
                      <span style={{color:T.textDim,fontSize:10}}>→</span>{q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg,i)=>(
              <Message key={i} msg={msg} isLatest={i===messages.length-1}/>
            ))}

            {loading&&(
              <div style={{display:"flex",gap:10,marginBottom:20,animation:"fadein 0.2s ease"}}>
                <div style={{width:30,height:30,borderRadius:8,flexShrink:0,background:T.surfaceAlt,border:`1px solid ${T.borderAlt}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:11,color:T.blue,fontWeight:700}}>N</span>
                </div>
                <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"2px 12px 12px 12px",padding:"14px 16px",display:"flex",gap:6,alignItems:"center"}}>
                  {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:T.textDim,animation:"shimmer 1.2s ease-in-out infinite",animationDelay:`${i*0.2}s`}}/>)}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{flexShrink:0,padding:"16px 24px",borderTop:`1px solid ${T.border}`,background:T.surface}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-end",background:T.bg,border:`1px solid ${T.borderAlt}`,borderRadius:10,padding:"10px 14px",transition:"border-color 0.15s"}}
              onFocusCapture={e=>e.currentTarget.style.borderColor=T.blue}
              onBlurCapture={e=>e.currentTarget.style.borderColor=T.borderAlt}>
              <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
                placeholder="Message NEXUS... (↵ send, ⇧↵ new line)" disabled={loading} rows={1}
                style={{flex:1,background:"none",border:"none",color:T.text,fontSize:13,resize:"none",lineHeight:1.6,minHeight:22,maxHeight:120,overflow:"auto",fontFamily:"Georgia,serif"}}/>
              <button onClick={()=>send()} disabled={loading||!input.trim()} style={{width:32,height:32,borderRadius:7,flexShrink:0,background:!loading&&input.trim()?T.blue:T.surfaceAlt,border:"none",color:!loading&&input.trim()?"#fff":T.textDim,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",cursor:loading||!input.trim()?"not-allowed":"pointer"}}>
                <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                  <path d="M12 7L7 2M12 7L7 12M12 7H2" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div style={{display:"flex",gap:5,marginTop:8,flexWrap:"wrap"}}>
              {QUICK.slice(0,4).map(q=>(
                <button key={q} onClick={()=>send(q)} style={{padding:"4px 10px",background:"transparent",border:`1px solid ${T.border}`,borderRadius:5,color:T.textDim,fontSize:10,fontFamily:"'IBM Plex Mono',monospace",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color=T.text;e.currentTarget.style.borderColor=T.borderAlt;}}
                  onMouseLeave={e=>{e.currentTarget.style.color=T.textDim;e.currentTarget.style.borderColor=T.border;}}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
