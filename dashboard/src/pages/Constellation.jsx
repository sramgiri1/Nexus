import { useState, useEffect, useRef, useCallback } from "react";

// ─── Project Registry ──────────────────────────────────────────────────────
const PROJECT_STAGES = {
  discovery:   { label:"DISCOVERY",   color:"#7B6DB0", desc:"Being researched by RADAR + MERIDIAN" },
  incubation:  { label:"INCUBATION",  color:"#C49A2A", desc:"Gates 0–7 in progress. Not yet in sprint." },
  sprint:      { label:"IN SPRINT",   color:"#4A8FBF", desc:"Actively being built by agent team." },
  testflight:  { label:"TESTFLIGHT",  color:"#3EA89A", desc:"Build live. Internal testing 48hrs." },
  live:        { label:"LIVE",        color:"#3A8F5A", desc:"Published to App Store." },
  paused:      { label:"PAUSED",      color:"#B87040", desc:"Sprint halted. Awaiting signal." },
  killed:      { label:"KILLED",      color:"#A84848", desc:"Idea abandoned. Learnings archived." },
};

const DEFAULT_PROJECTS = [
  { id:"shiftpay",  name:"ShiftPay",   color:"#4A8FBF", stage:"incubation", gate:"G0",  score:44, tam:"$144M", sprintDay:0, sprintTotal:10, agents:["atlas","forge","core","beacon","oracle"], mrr:0, interviews:0, interviewTarget:5, notes:"Shift worker take-home calculator. No data dependency. Lowest compliance overhead." },
  { id:"careloop",  name:"CareLoop",   color:"#3EA89A", stage:"incubation", gate:"G0",  score:44, tam:"$479M", sprintDay:0, sprintTotal:10, agents:["atlas","prism","core","swift","beacon","canvas"], mrr:0, interviews:0, interviewTarget:5, notes:"Family care coordination. FTC compliance required. Paused pending ShiftPay G0." },
  { id:"homelog",   name:"HomeLog",    color:"#B87040", stage:"discovery",  gate:"—",   score:41, tam:"$599M", sprintDay:0, sprintTotal:10, agents:["radar","meridian"], mrr:0, interviews:0, interviewTarget:5, notes:"Home maintenance record. Strong market. Backlog — queued after ShiftPay." },
  { id:"shiftpay2", name:"ShelfAlert", color:"#7B6DB0", stage:"discovery",  gate:"—",   score:43, tam:"$95M",  sprintDay:0, sprintTotal:10, agents:["radar"], mrr:0, interviews:0, interviewTarget:5, notes:"Grocery price drop alerts. Sprint 2 idea. Depends on ShiftPay infrastructure." },
];

// ─── Agent Registry ────────────────────────────────────────────────────────
const FINAL_AGENTS = [
  { id:"nexus",    name:"NEXUS",    role:"Orchestrator", color:"#4A8FBF", size:36, ring:0, angle:0,   ringR:0   },
  { id:"atlas",    name:"ATLAS",    role:"Product",      color:"#4A8FBF", size:23, ring:1, angle:90,  ringR:148 },
  { id:"forge",    name:"FORGE",    role:"DevOps",       color:"#B87040", size:23, ring:1, angle:162, ringR:148 },
  { id:"meridian", name:"MERIDIAN", role:"Business",     color:"#C49A2A", size:21, ring:1, angle:234, ringR:148 },
  { id:"radar",    name:"RADAR",    role:"Market Gap",   color:"#3EA89A", size:21, ring:1, angle:306, ringR:148 },
  { id:"oracle",   name:"ORACLE",   role:"Analytics",    color:"#7B6DB0", size:21, ring:1, angle:18,  ringR:148 },
  { id:"prism",    name:"PRISM",    role:"Design",       color:"#7B6DB0", size:19, ring:2, angle:60,  ringR:248 },
  { id:"core",     name:"CORE",     role:"Backend",      color:"#3EA89A", size:19, ring:2, angle:120, ringR:248 },
  { id:"beacon",   name:"BEACON",   role:"Marketing",    color:"#C49A2A", size:17, ring:2, angle:180, ringR:248 },
  { id:"canvas",   name:"CANVAS",   role:"Web Builder",  color:"#B87040", size:17, ring:2, angle:240, ringR:248 },
  { id:"stream",   name:"STREAM",   role:"Data",         color:"#4A8FBF", size:17, ring:2, angle:300, ringR:248 },
  { id:"synapse",  name:"SYNAPSE",  role:"AI Layer",     color:"#B87040", size:17, ring:2, angle:0,   ringR:248 },
  { id:"swift",    name:"SWIFT",    role:"iOS Dev",      color:"#4A8FBF", size:15, ring:3, angle:45,  ringR:345 },
  { id:"sentinel", name:"SENTINEL", role:"Quality",      color:"#A84848", size:15, ring:3, angle:105, ringR:345 },
  { id:"compass",  name:"COMPASS",  role:"SEO",          color:"#4A8FBF", size:14, ring:3, angle:165, ringR:345 },
  { id:"pixel",    name:"PIXEL",    role:"Frontend",     color:"#7B6DB0", size:14, ring:3, angle:225, ringR:345 },
];

const EDGES = [
  ["forge","atlas","blocks","ENV_MANIFEST"],["forge","core","blocks","DB Credentials"],
  ["forge","prism","blocks","ENV_MANIFEST"],["forge","beacon","blocks","ENV_MANIFEST"],
  ["forge","canvas","blocks","ENV_MANIFEST"],["atlas","prism","blocks","Approved PRD"],
  ["atlas","beacon","blocks","Brand Kit"],["atlas","compass","blocks","App Name"],
  ["atlas","oracle","blocks","North Star"],["atlas","synapse","blocks","AI Spec"],
  ["atlas","stream","blocks","Data Spec"],["prism","swift","blocks","Design System"],
  ["core","swift","blocks","Staging API"],["core","sentinel","blocks","Live Endpoints"],
  ["swift","sentinel","blocks","TestFlight Build"],["radar","meridian","feeds","Opportunity Scan"],
  ["meridian","atlas","feeds","Validated Idea"],["oracle","canvas","feeds","Event Spec"],
  ["oracle","beacon","feeds","Analytics Spec"],["beacon","canvas","feeds","Copy + Assets"],
  ["nexus","atlas","supports","Orchestrates"],["nexus","forge","supports","Orchestrates"],
  ["nexus","radar","supports","Orchestrates"],["nexus","meridian","supports","Orchestrates"],
];

const EDGE_COLORS = { blocks:"#A84848", feeds:"#3EA89A", supports:"rgba(74,143,191,0.5)" };
const DEFAULT_STATUS = { nexus:"active",atlas:"idle",prism:"blocked",forge:"idle",core:"active",swift:"blocked",sentinel:"idle",beacon:"idle",compass:"idle",oracle:"idle",canvas:"idle",stream:"idle",synapse:"idle",radar:"done",meridian:"done",pixel:"idle" };
const STATUS_COLORS  = { active:"#4A8FBF",blocked:"#A84848",done:"#3EA89A",working:"#C49A2A",idle:"rgba(74,143,191,0.2)" };

function hexPts(r){return Array.from({length:6},(_,i)=>{const a=(i*60-30)*Math.PI/180;return`${(r*Math.cos(a)).toFixed(2)},${(r*Math.sin(a)).toFixed(2)}`;}).join(" ");}
function hexToRgb(h){const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return`${r},${g},${b}`;}

// ─── Subcomponents ─────────────────────────────────────────────────────────
function CornerBracket({sz=12,col="#4A8FBF"}){
  const s={position:"absolute",width:sz,height:sz};
  return(<>
    <div style={{...s,top:0,left:0,borderTop:`1px solid ${col}`,borderLeft:`1px solid ${col}`}}/>
    <div style={{...s,top:0,right:0,borderTop:`1px solid ${col}`,borderRight:`1px solid ${col}`}}/>
    <div style={{...s,bottom:0,left:0,borderBottom:`1px solid ${col}`,borderLeft:`1px solid ${col}`}}/>
    <div style={{...s,bottom:0,right:0,borderBottom:`1px solid ${col}`,borderRight:`1px solid ${col}`}}/>
  </>);
}

function NexusBar({value,color="#4A8FBF",h=3}){
  return(
    <div style={{height:h,background:"rgba(255,255,255,0.05)",borderRadius:2,overflow:"hidden"}}>
      <div style={{width:`${Math.min(100,value)}%`,height:"100%",background:`linear-gradient(90deg,${color}60,${color})`,borderRadius:2,transition:"width 0.8s ease",boxShadow:`0 0 6px ${color}50`}}/>
    </div>
  );
}

function ProjectCard({proj,isActive,onSelect,onUpdate}){
  const stage=PROJECT_STAGES[proj.stage]||PROJECT_STAGES.discovery;
  const pct=Math.round((proj.score/50)*100);
  const interviewPct=proj.interviewTarget>0?Math.round((proj.interviews/proj.interviewTarget)*100):0;
  const sprintPct=proj.sprintTotal>0?Math.round((proj.sprintDay/proj.sprintTotal)*100):0;

  return(
    <div onClick={onSelect} style={{
      background:isActive?`${proj.color}08`:"rgba(0,0,0,0.3)",
      border:`1px solid ${isActive?`${proj.color}35`:"rgba(74,143,191,0.08)"}`,
      borderLeft:`3px solid ${stage.color}`,
      borderRadius:8,padding:"12px 14px",cursor:"pointer",position:"relative",
      transition:"all 0.2s",marginBottom:8,
    }}>
      <CornerBracket sz={8} col={isActive?proj.color:"rgba(74,143,191,0.15)"}/>

      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
            <span style={{fontSize:18,fontWeight:700,color:proj.color,letterSpacing:"0.12em",fontFamily:"'Courier New',monospace"}}>{proj.name}</span>
            <span style={{fontSize:12,fontWeight:700,color:stage.color,background:`${stage.color}15`,border:`1px solid ${stage.color}30`,borderRadius:10,padding:"2px 7px",letterSpacing:"0.1em"}}>{stage.label}</span>
          </div>
          <p style={{margin:0,fontSize:14,color:"rgba(74,143,191,0.35)",lineHeight:1.5,fontFamily:"'Courier New',monospace"}}>{proj.notes}</p>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:26,fontWeight:700,color:proj.color,fontFamily:"'Courier New',monospace",lineHeight:1}}>{proj.score}</div>
          <div style={{fontSize:11,color:"rgba(74,143,191,0.25)",fontFamily:"'Courier New',monospace"}}>/50</div>
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:10}}>
        {[
          {label:"GATE",value:proj.gate,color:proj.color},
          {label:"TAM",value:proj.tam,color:"#C49A2A"},
          {label:"MRR",value:proj.mrr>0?`$${proj.mrr.toLocaleString()}`:"—",color:"#3EA89A"},
        ].map(m=>(
          <div key={m.label} style={{background:"rgba(0,0,0,0.3)",borderRadius:4,padding:"5px 7px"}}>
            <div style={{fontSize:11,color:"rgba(74,143,191,0.25)",letterSpacing:"0.12em",marginBottom:2}}>{m.label}</div>
            <div style={{fontSize:16,fontWeight:700,color:m.color,fontFamily:"'Courier New',monospace"}}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Progress bars */}
      <div style={{display:"grid",gap:6}}>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <span style={{fontSize:12,color:"rgba(74,143,191,0.3)",letterSpacing:"0.1em"}}>INTERVIEWS</span>
            <span style={{fontSize:12,color:interviewPct>=100?"#3EA89A":"#C49A2A",fontWeight:700}}>{proj.interviews}/{proj.interviewTarget}</span>
          </div>
          <NexusBar value={interviewPct} color={interviewPct>=100?"#3EA89A":"#C49A2A"} h={2}/>
        </div>
        {proj.stage==="sprint"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:12,color:"rgba(74,143,191,0.3)",letterSpacing:"0.1em"}}>SPRINT DAY</span>
              <span style={{fontSize:12,color:"#4A8FBF",fontWeight:700}}>{proj.sprintDay}/{proj.sprintTotal}</span>
            </div>
            <NexusBar value={sprintPct} color="#4A8FBF" h={2}/>
          </div>
        )}
        <div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <span style={{fontSize:12,color:"rgba(74,143,191,0.3)",letterSpacing:"0.1em"}}>SCORE</span>
            <span style={{fontSize:12,color:proj.color,fontWeight:700}}>{pct}%</span>
          </div>
          <NexusBar value={pct} color={proj.color} h={2}/>
        </div>
      </div>

      {/* Agents */}
      <div style={{marginTop:8,display:"flex",gap:3,flexWrap:"wrap"}}>
        {proj.agents.map(aid=>{
          const a=FINAL_AGENTS.find(x=>x.id===aid);
          if(!a)return null;
          return(
            <span key={aid} style={{fontSize:11,color:a.color,background:`${a.color}10`,border:`1px solid ${a.color}25`,borderRadius:3,padding:"1px 5px",fontFamily:"'Courier New',monospace",letterSpacing:"0.05em"}}>{a.name}</span>
          );
        })}
      </div>

      {/* Stage controls */}
      <div style={{marginTop:8,display:"flex",gap:3,flexWrap:"wrap"}}>
        {Object.entries(PROJECT_STAGES).map(([s,cfg])=>(
          <button key={s} onClick={e=>{e.stopPropagation();onUpdate({...proj,stage:s});}} style={{
            background:proj.stage===s?`${cfg.color}18`:"rgba(0,0,0,0.3)",
            border:`1px solid ${proj.stage===s?cfg.color:"rgba(74,143,191,0.08)"}`,
            color:proj.stage===s?cfg.color:"rgba(74,143,191,0.2)",
            borderRadius:3,padding:"2px 6px",fontSize:11,cursor:"pointer",
            fontFamily:"'Courier New',monospace",fontWeight:700,letterSpacing:"0.06em",
          }}>{cfg.label}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function NexusConstellation() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const stateRef  = useRef({
    rotX:0,rotY:0,rotZ:0,targetRotX:0,targetRotY:0,targetRotZ:0,
    zoom:1,targetZoom:1,twist:0,targetTwist:0,
    autoRotate:true,autoTwist:false,
    isDragging:false,dragStart:null,lastMouse:{x:0,y:0},
    particles:[],starField:[],time:0,pulsePhase:0,
    selected:null,hovered:null,
  });

  const [projects,    setProjects]    = useState(DEFAULT_PROJECTS);
  const [statuses,    setStatuses]    = useState(DEFAULT_STATUS);
  const [selected,    setSelected]    = useState(null);
  const [hovered,     setHovered]     = useState(null);
  const [filterEdge,  setFilterEdge]  = useState("all");
  const [autoRotate,  setAutoRotate]  = useState(true);
  const [autoTwist,   setAutoTwist]   = useState(false);
  const [activeView,  setActiveView]  = useState("portfolio"); // portfolio | agents | network
  const [systemTime,  setSystemTime]  = useState(new Date());
  const [activeProj,  setActiveProj]  = useState("shiftpay");
  const [addingProj,  setAddingProj]  = useState(false);
  const [newProj,     setNewProj]     = useState({name:"",tam:"",score:40,stage:"discovery",notes:""});

  const statusesRef = useRef(statuses);
  const filterRef   = useRef(filterEdge);
  const selectedRef = useRef(selected);
  const hoveredRef  = useRef(hovered);
  const projectsRef = useRef(projects);

  useEffect(()=>{statusesRef.current=statuses;},[statuses]);
  useEffect(()=>{filterRef.current=filterEdge;},[filterEdge]);
  useEffect(()=>{selectedRef.current=selected;},[selected]);
  useEffect(()=>{hoveredRef.current=hovered;},[hovered]);
  useEffect(()=>{projectsRef.current=projects;},[projects]);
  useEffect(()=>{const t=setInterval(()=>setSystemTime(new Date()),1000);return()=>clearInterval(t);},[]);

  // Init
  useEffect(()=>{
    const s=stateRef.current;
    s.starField=Array.from({length:200},()=>({x:(Math.random()-0.5)*1800,y:(Math.random()-0.5)*1400,z:Math.random()*900-450,r:Math.random()*1.4+0.3,twinkle:Math.random()*Math.PI*2,twinkleSpeed:Math.random()*0.02+0.005,brightness:Math.random()*0.55+0.25}));
    s.particles=EDGES.map(e=>({from:e[0],to:e[1],type:e[2],label:e[3],progress:Math.random(),speed:0.0018+Math.random()*0.002,size:e[2]==="blocks"?3:2}));
  },[]);

  const project3D=useCallback((x,y,z,s)=>{
    const{rotX,rotY,rotZ,twist,zoom}=s;
    const cx=Math.cos(rotX),sx=Math.sin(rotX),cy=Math.cos(rotY),sy=Math.sin(rotY);
    const cz=Math.cos(rotZ),sz=Math.sin(rotZ),ct=Math.cos(twist),st=Math.sin(twist);
    let nx=x*cy+z*sy,nz=-x*sy+z*cy,ny=y;
    let ny2=ny*cx-nz*sx,nz2=ny*sx+nz*cx;
    let nx3=nx*cz-ny2*sz,ny3=nx*sz+ny2*cz;
    let nx4=nx3*ct-ny3*st,ny4=nx3*st+ny3*ct;
    const fov=720,depth=fov+nz2*0.3,scale=zoom*fov/depth;
    return{x:nx4*scale,y:ny4*scale,scale,depth};
  },[]);

  const getPos3D=useCallback((agent,s)=>{
    if(agent.ring===0)return{x:0,y:0,z:0};
    const ro=agent.ring*0.3;
    const tilt=Math.sin(s.time*0.0003+ro)*0.3;
    const base=(agent.angle+s.time*(agent.ring===1?0.2:agent.ring===2?-0.15:0.1))*Math.PI/180;
    const r=agent.ringR;
    return{x:r*Math.cos(base),y:r*Math.sin(base)*Math.sin(tilt),z:r*Math.sin(base)*Math.cos(tilt)*0.4};
  },[]);

  const draw=useCallback(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext("2d");
    const W=canvas.width,H=canvas.height,CX=W/2,CY=H/2;
    const s=stateRef.current;
    s.time++;s.pulsePhase+=0.02;
    const ease=0.04;
    if(s.autoRotate){s.targetRotY+=0.0018;s.targetRotZ+=0.0004;}
    if(s.autoTwist){s.targetTwist+=0.0025;}
    s.rotX+=(s.targetRotX-s.rotX)*ease;s.rotY+=(s.targetRotY-s.rotY)*ease;
    s.rotZ+=(s.targetRotZ-s.rotZ)*ease;s.twist+=(s.targetTwist-s.twist)*ease;
    s.zoom+=(s.targetZoom-s.zoom)*ease;

    ctx.fillStyle="#0B1621";ctx.fillRect(0,0,W,H);

    // Stars
    s.starField.forEach(star=>{
      star.twinkle+=star.twinkleSpeed;
      const b=star.brightness*(0.7+0.3*Math.sin(star.twinkle));
      const p=project3D(star.x,star.y,star.z,s);
      const sx=CX+p.x,sy=CY+p.y;
      if(sx<0||sx>W||sy<0||sy>H)return;
      ctx.save();ctx.globalAlpha=b*Math.min(1,p.scale);
      ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(sx,sy,Math.max(0.3,star.r*p.scale*0.5),0,Math.PI*2);ctx.fill();
      ctx.restore();
    });

    // Nebula
    [{x:-300,y:-180,z:50,r:260,c:"rgba(123,109,176,0.028)"},{x:250,y:180,z:-80,r:210,c:"rgba(62,168,154,0.022)"},{x:-80,y:280,z:110,r:170,c:"rgba(184,112,64,0.02)"}].forEach(n=>{
      const p=project3D(n.x,n.y,n.z,s);
      const grd=ctx.createRadialGradient(CX+p.x,CY+p.y,0,CX+p.x,CY+p.y,n.r*p.scale);
      grd.addColorStop(0,n.c);grd.addColorStop(1,"transparent");
      ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
    });

    // Agent positions
    const apos={};
    FINAL_AGENTS.forEach(a=>{
      const p3=getPos3D(a,s),p=project3D(p3.x,p3.y,p3.z,s);
      apos[a.id]={sx:CX+p.x,sy:CY+p.y,scale:p.scale,depth:p.depth};
    });

    // Project zone rings — draw a glow ring for each project's agents
    const projs=projectsRef.current;
    projs.forEach((proj,pi)=>{
      if(proj.stage==="killed")return;
      const stageInfo=PROJECT_STAGES[proj.stage];
      proj.agents.forEach(aid=>{
        const ap=apos[aid];if(!ap)return;
        const r=14*ap.scale+Math.sin(s.pulsePhase+pi*1.2)*2;
        ctx.save();
        ctx.globalAlpha=0.12;
        ctx.strokeStyle=proj.color;
        ctx.lineWidth=0.8;
        ctx.setLineDash([2,4]);
        ctx.beginPath();ctx.arc(ap.sx,ap.sy,r+8,0,Math.PI*2);ctx.stroke();
        ctx.restore();
      });
    });

    // Orbital rings
    [1,2,3].forEach(ring=>{
      const ra=FINAL_AGENTS.filter(a=>a.ring===ring);if(!ra.length)return;
      const pts=[];
      for(let a=0;a<360;a+=3){
        const tilt=Math.sin(s.time*0.0003+ring*0.3)*0.3;
        const rad=(a+s.time*(ring===1?0.2:ring===2?-0.15:0.1))*Math.PI/180;
        const r=ra[0].ringR;
        const x3=r*Math.cos(rad),y3=r*Math.sin(rad)*Math.sin(tilt),z3=r*Math.sin(rad)*Math.cos(tilt)*0.4;
        const p=project3D(x3,y3,z3,s);
        pts.push({sx:CX+p.x,sy:CY+p.y});
      }
      ctx.save();ctx.globalAlpha=0.055;
      ctx.strokeStyle=ring===1?"#4A8FBF":ring===2?"#7B6DB0":"#3EA89A";
      ctx.lineWidth=0.8;ctx.setLineDash([2,8]);
      ctx.beginPath();pts.forEach((pt,i)=>i===0?ctx.moveTo(pt.sx,pt.sy):ctx.lineTo(pt.sx,pt.sy));
      ctx.closePath();ctx.stroke();ctx.restore();
    });

    // Edges
    const filteredEdges=filterRef.current==="all"?EDGES:EDGES.filter(e=>e[2]===filterRef.current);
    const sel=selectedRef.current;
    const connIds=sel?new Set(EDGES.filter(e=>e[0]===sel||e[1]===sel).flatMap(e=>[e[0],e[1]])):null;

    filteredEdges.forEach(edge=>{
      const fp=apos[edge[0]],tp=apos[edge[1]];if(!fp||!tp)return;
      const isConn=sel?(connIds.has(edge[0])&&connIds.has(edge[1])):true;
      const alpha=sel?(isConn?0.9:0.03):0.3;
      const ec=EDGE_COLORS[edge[2]];
      ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=ec;
      ctx.lineWidth=isConn?1.6:0.5;
      if(edge[2]==="blocks")ctx.setLineDash([5,4]);
      else if(edge[2]==="feeds")ctx.setLineDash([3,6]);
      else ctx.setLineDash([1,8]);
      if(isConn&&sel){ctx.shadowColor=ec;ctx.shadowBlur=10;}
      ctx.beginPath();ctx.moveTo(fp.sx,fp.sy);ctx.lineTo(tp.sx,tp.sy);ctx.stroke();
      if(isConn||!sel){
        const dx=tp.sx-fp.sx,dy=tp.sy-fp.sy,len=Math.sqrt(dx*dx+dy*dy);
        const ux=dx/len,uy=dy/len,ax=tp.sx-ux*17,ay=tp.sy-uy*17;
        ctx.globalAlpha=alpha*0.85;ctx.setLineDash([]);ctx.fillStyle=ec;
        ctx.beginPath();ctx.moveTo(ax+ux*6,ay+uy*6);ctx.lineTo(ax-uy*3,ay+ux*3);ctx.lineTo(ax+uy*3,ay-ux*3);ctx.closePath();ctx.fill();
      }
      if(isConn&&sel&&edge[3]){
        const mx=(fp.sx+tp.sx)/2,my=(fp.sy+tp.sy)/2;
        ctx.save();ctx.globalAlpha=0.95;ctx.shadowColor=ec;ctx.shadowBlur=5;
        ctx.fillStyle="#0A1520";
        const tw=ctx.measureText(edge[3]).width+10;
        ctx.fillRect(mx-tw/2,my-8,tw,14);
        ctx.fillStyle=ec;ctx.font="bold 8px 'Courier New'";ctx.textAlign="center";ctx.textBaseline="middle";
        ctx.fillText(edge[3],mx,my);ctx.restore();
      }
      ctx.restore();
    });

    // Particles
    s.particles.forEach(p=>{
      const filtOk=filterRef.current==="all"||p.type===filterRef.current;if(!filtOk)return;
      const fp=apos[p.from],tp=apos[p.to];if(!fp||!tp)return;
      const isConn=sel?(connIds?.has(p.from)&&connIds?.has(p.to)):true;
      if(!isConn&&sel)return;
      p.progress+=p.speed*(isConn?1.6:0.6);if(p.progress>1)p.progress=0;
      const t=p.progress;
      const px=fp.sx+(tp.sx-fp.sx)*t,py=fp.sy+(tp.sy-fp.sy)*t;
      const col=EDGE_COLORS[p.type];
      ctx.save();
      ctx.globalAlpha=(0.65+Math.sin(s.pulsePhase)*0.25)*(isConn?1:0.25);
      ctx.shadowColor=col;ctx.shadowBlur=10;ctx.fillStyle=col;
      ctx.beginPath();ctx.arc(px,py,p.size*Math.min(fp.scale,tp.scale)*0.7,0,Math.PI*2);ctx.fill();
      for(let tr=1;tr<=3;tr++){
        const tt=t-tr*0.035;if(tt<0)continue;
        const tx2=fp.sx+(tp.sx-fp.sx)*tt,ty2=fp.sy+(tp.sy-fp.sy)*tt;
        ctx.globalAlpha=(0.12/tr)*(isConn?1:0.15);
        ctx.beginPath();ctx.arc(tx2,ty2,(p.size-0.5)*Math.min(fp.scale,tp.scale)*0.6,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    });

    // Nodes
    const sorted=[...FINAL_AGENTS].sort((a,b)=>(apos[b.id]?.depth||0)-(apos[a.id]?.depth||0));
    sorted.forEach(agent=>{
      const pos=apos[agent.id];if(!pos)return;
      const{sx,sy,scale}=pos;
      const status=statusesRef.current[agent.id]||"idle";
      const sColor=STATUS_COLORS[status];
      const isNexus=agent.id==="nexus";
      const isSel=selectedRef.current===agent.id;
      const isHov=hoveredRef.current===agent.id;
      const isConn=sel?connIds?.has(agent.id):true;
      const isDimmed=sel&&!isConn&&!isNexus;

      // Project tint
      const assignedProj=projectsRef.current.find(p=>p.agents.includes(agent.id)&&p.stage!=="killed");
      const projColor=assignedProj?.color||agent.color;

      ctx.save();ctx.globalAlpha=isDimmed?0.1:1;ctx.translate(sx,sy);

      if(isNexus){
        // Nexus outer rings
        for(let ri=0;ri<2;ri++){
          const rScale=ri===0?1:-0.6;
          ctx.save();ctx.rotate(s.time*0.008*rScale);
          ctx.strokeStyle="#4A8FBF";ctx.lineWidth=0.7;
          ctx.globalAlpha=ri===0?0.22:0.12;
          ctx.setLineDash(ri===0?[4,8]:[2,12]);
          const rr=agent.size*scale+(ri===0?10:18)+Math.sin(s.pulsePhase)*3;
          ctx.beginPath();
          for(let i=0;i<6;i++){const a=(i*60-30)*Math.PI/180;i===0?ctx.moveTo(rr*Math.cos(a),rr*Math.sin(a)):ctx.lineTo(rr*Math.cos(a),rr*Math.sin(a));}
          ctx.closePath();ctx.stroke();ctx.restore();
        }
      }

      if(isSel||isHov){
        ctx.save();ctx.rotate(s.time*(isSel?0.014:0.007));
        ctx.strokeStyle=projColor;ctx.lineWidth=isSel?1.4:0.7;ctx.globalAlpha=isSel?0.75:0.35;ctx.setLineDash([3,6]);
        const sr=agent.size*scale+(isSel?12:8);
        ctx.beginPath();for(let i=0;i<6;i++){const a=(i*60-30)*Math.PI/180;i===0?ctx.moveTo(sr*Math.cos(a),sr*Math.sin(a)):ctx.lineTo(sr*Math.cos(a),sr*Math.sin(a));}
        ctx.closePath();ctx.stroke();ctx.restore();
      }

      if(status==="active"||status==="working"||isNexus){
        const gr=agent.size*scale+Math.sin(s.pulsePhase)*4;
        const grd=ctx.createRadialGradient(0,0,0,0,0,gr+12);
        grd.addColorStop(0,`${isNexus?"#4A8FBF":sColor}28`);grd.addColorStop(1,"transparent");
        ctx.fillStyle=grd;ctx.fillRect(-gr-14,-gr-14,(gr+14)*2,(gr+14)*2);
      }

      // Project color ring on assigned agents
      if(assignedProj&&!isNexus){
        const pr=agent.size*scale+5+Math.sin(s.pulsePhase+assignedProj.id.length)*2;
        ctx.save();ctx.globalAlpha=0.2;ctx.strokeStyle=projColor;ctx.lineWidth=1;ctx.setLineDash([]);
        ctx.beginPath();for(let i=0;i<6;i++){const a=(i*60-30)*Math.PI/180;i===0?ctx.moveTo(pr*Math.cos(a),pr*Math.sin(a)):ctx.lineTo(pr*Math.cos(a),pr*Math.sin(a));}
        ctx.closePath();ctx.stroke();ctx.restore();
      }

      const r=agent.size*scale;
      ctx.shadowColor=isNexus?"#4A8FBF":projColor;
      ctx.shadowBlur=isDimmed?0:isSel||isNexus?18:status==="idle"?3:10;
      ctx.strokeStyle=isNexus?"#4A8FBF":projColor;
      ctx.lineWidth=isSel||isNexus?1.8:1;
      const fa=isNexus?0.18:isSel?0.2:status==="idle"?0.05:0.13;
      ctx.fillStyle=`rgba(${hexToRgb(isNexus?"#4A8FBF":projColor)},${fa})`;
      ctx.globalAlpha*=status==="idle"&&!isNexus?0.5:1;
      ctx.beginPath();
      for(let i=0;i<6;i++){const a=(i*60-30)*Math.PI/180;i===0?ctx.moveTo(r*Math.cos(a),r*Math.sin(a)):ctx.lineTo(r*Math.cos(a),r*Math.sin(a));}
      ctx.closePath();ctx.fill();ctx.stroke();
      ctx.shadowBlur=0;

      ctx.fillStyle=isNexus?"#4A8FBF":projColor;
      ctx.font=`bold ${Math.max(5,Math.round(isNexus?9:7)*scale)}px 'Courier New'`;
      ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillText(agent.name,0,isNexus?2:1);

      if((isSel||isHov||isNexus)&&!isDimmed){
        ctx.globalAlpha*=0.55;ctx.fillStyle=isNexus?"#4A8FBF":projColor;
        ctx.font=`${Math.max(7,Math.round(8)*scale)}px 'Courier New'`;
        ctx.fillText(agent.role,0,isNexus?10:r+10);
      }

      if(status!=="idle"){
        const dc=STATUS_COLORS[status];
        ctx.globalAlpha=1;ctx.shadowColor=dc;ctx.shadowBlur=6;ctx.fillStyle=dc;
        ctx.beginPath();const dr=Math.max(2,3*scale);
        ctx.arc(r-3,-(r-3),dr*(status==="active"||status==="working"?1+Math.sin(s.pulsePhase)*0.3:1),0,Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Crosshair
    ctx.save();ctx.globalAlpha=0.05;ctx.strokeStyle="#4A8FBF";ctx.lineWidth=0.5;ctx.setLineDash([2,20]);
    ctx.beginPath();ctx.moveTo(CX-360,CY);ctx.lineTo(CX+360,CY);ctx.stroke();
    ctx.beginPath();ctx.moveTo(CX,CY-280);ctx.lineTo(CX,CY+280);ctx.stroke();
    ctx.restore();

    animRef.current=requestAnimationFrame(draw);
  },[project3D,getPos3D]);

  useEffect(()=>{animRef.current=requestAnimationFrame(draw);return()=>cancelAnimationFrame(animRef.current);},[draw]);
  useEffect(()=>{stateRef.current.autoRotate=autoRotate;},[autoRotate]);
  useEffect(()=>{stateRef.current.autoTwist=autoTwist;},[autoTwist]);

  useEffect(()=>{
    const resize=()=>{const c=canvasRef.current;if(!c)return;c.width=c.offsetWidth;c.height=c.offsetHeight;};
    resize();const ro=new ResizeObserver(resize);
    if(canvasRef.current)ro.observe(canvasRef.current.parentElement);
    return()=>ro.disconnect();
  },[]);

  const getHovered=useCallback((mx,my)=>{
    const canvas=canvasRef.current;if(!canvas)return null;
    const CX=canvas.width/2,CY=canvas.height/2,s=stateRef.current;
    let closest=null,closestDist=32;
    FINAL_AGENTS.forEach(agent=>{
      const p3=getPos3D(agent,s),p=project3D(p3.x,p3.y,p3.z,s);
      const sx=CX+p.x,sy=CY+p.y;
      const dist=Math.sqrt((mx-sx)**2+(my-sy)**2);
      const hit=agent.size*p.scale+10;
      if(dist<hit&&dist<closestDist){closest=agent.id;closestDist=dist;}
    });
    return closest;
  },[project3D,getPos3D]);

  const handleMouseMove=useCallback(e=>{
    const c=canvasRef.current;if(!c)return;
    const rect=c.getBoundingClientRect(),mx=e.clientX-rect.left,my=e.clientY-rect.top;
    const s=stateRef.current;
    if(s.isDragging&&s.dragStart){
      const dx=(mx-s.lastMouse.x)*0.006,dy=(my-s.lastMouse.y)*0.006;
      s.targetRotY+=dx;s.targetRotX+=dy;s.autoRotate=false;setAutoRotate(false);
    }
    s.lastMouse={x:mx,y:my};
    const h=getHovered(mx,my);hoveredRef.current=h;setHovered(h);
    c.style.cursor=h?"pointer":"grab";
  },[getHovered]);

  const handleMouseDown=useCallback(e=>{
    const c=canvasRef.current;if(!c)return;
    const rect=c.getBoundingClientRect();
    stateRef.current.isDragging=true;
    stateRef.current.dragStart={x:e.clientX-rect.left,y:e.clientY-rect.top};
    stateRef.current.lastMouse={x:e.clientX-rect.left,y:e.clientY-rect.top};
    c.style.cursor="grabbing";
  },[]);

  const handleMouseUp=useCallback(e=>{
    const s=stateRef.current,c=canvasRef.current;if(!c)return;
    const rect=c.getBoundingClientRect(),mx=e.clientX-rect.left,my=e.clientY-rect.top;
    if(s.isDragging&&s.dragStart&&Math.abs(mx-s.dragStart.x)<5&&Math.abs(my-s.dragStart.y)<5){
      const h=getHovered(mx,my);const ns=h===selectedRef.current?null:h;
      selectedRef.current=ns;setSelected(ns);
    }
    s.isDragging=false;s.dragStart=null;c.style.cursor="grab";
  },[getHovered]);

  const handleWheel=useCallback(e=>{e.preventDefault();stateRef.current.targetZoom=Math.max(0.35,Math.min(2.8,stateRef.current.targetZoom-e.deltaY*0.001));},[]);
  useEffect(()=>{const c=canvasRef.current;if(!c)return;c.addEventListener("wheel",handleWheel,{passive:false});return()=>c.removeEventListener("wheel",handleWheel);},[handleWheel]);

  const doZoomIn  =()=>{stateRef.current.targetZoom=Math.min(2.8,stateRef.current.targetZoom+0.3);};
  const doZoomOut =()=>{stateRef.current.targetZoom=Math.max(0.35,stateRef.current.targetZoom-0.3);};
  const doReset   =()=>{const s=stateRef.current;s.targetRotX=0;s.targetRotY=0;s.targetRotZ=0;s.targetTwist=0;s.targetZoom=1;setAutoRotate(true);s.autoRotate=true;};
  const doSpin    =()=>{stateRef.current.targetRotZ+=Math.PI*2;};
  const doFlip    =()=>{stateRef.current.targetRotX+=Math.PI;};
  const doDive    =()=>{stateRef.current.targetRotX+=Math.PI*0.5;};
  const doTwist   =()=>{stateRef.current.targetTwist+=Math.PI/4;};
  const cycleAgentStatus=(id)=>{const o=["idle","active","working","blocked","done"];setStatuses(p=>({...p,[id]:o[(o.indexOf(p[id]||"idle")+1)%o.length]}));};

  const addProject=()=>{
    if(!newProj.name.trim())return;
    const colors=["#4A8FBF","#3EA89A","#C49A2A","#7B6DB0","#B87040","#A84848"];
    const proj={id:newProj.name.toLowerCase().replace(/\s+/g,"-")+"-"+Date.now(),name:newProj.name,color:colors[projects.length%colors.length],stage:newProj.stage,gate:"—",score:newProj.score,tam:newProj.tam||"—",sprintDay:0,sprintTotal:10,agents:["radar"],mrr:0,interviews:0,interviewTarget:5,notes:newProj.notes};
    setProjects(p=>[...p,proj]);setNewProj({name:"",tam:"",score:40,stage:"discovery",notes:""});setAddingProj(false);
  };

  // Portfolio stats
  const stageCounts = Object.fromEntries(Object.keys(PROJECT_STAGES).map(s=>[s,projects.filter(p=>p.stage===s).length]));
  const parallelActive = projects.filter(p=>p.stage==="sprint").length;
  const incubating = projects.filter(p=>p.stage==="incubation").length;
  const discovering = projects.filter(p=>p.stage==="discovery").length;
  const totalTAM = "$1.3B+";

  const selAgent=selected?FINAL_AGENTS.find(a=>a.id===selected):null;
  const connIds2=selected?new Set(EDGES.filter(e=>e[0]===selected||e[1]===selected).flatMap(e=>[e[0],e[1]])):null;

  const inp={background:"rgba(0,0,0,0.4)",border:"1px solid rgba(74,143,191,0.15)",borderRadius:5,padding:"7px 10px",color:"#9BBCCC",fontSize:15,fontFamily:"'Courier New',monospace",width:"100%",outline:"none"};

  return(
    <div style={{height:"100vh",background:"linear-gradient(160deg,#0D1B2E 0%,#0A1520 55%,#0D1A2A 100%)",color:"#9BBCCC",display:"flex",flexDirection:"column",fontFamily:"'Courier New',monospace",overflow:"hidden"}}>
      <style>{`
        @keyframes pulse3{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:rgba(0,0,0,0.2);}::-webkit-scrollbar-thumb{background:rgba(74,143,191,0.35);border-radius:3px;}::-webkit-scrollbar-thumb:hover{background:rgba(74,143,191,0.6);}
        .hbtn:hover{background:rgba(74,143,191,0.12)!important;border-color:rgba(74,143,191,0.35)!important;color:#4A8FBF!important;}
        .hbtn:active{transform:scale(0.96);}
        .card-hover:hover{background:rgba(74,143,191,0.04)!important;}
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{position:"relative",zIndex:10,height:52,borderBottom:"1px solid rgba(74,143,191,0.1)",background:"rgba(10,18,28,0.97)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",padding:"0 18px",gap:14,flexShrink:0}}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:8,paddingRight:14,borderRight:"1px solid rgba(74,143,191,0.1)"}}>
          <div style={{width:26,height:26,clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",background:"rgba(74,143,191,0.15)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 12px rgba(74,143,191,0.3)"}}>
            <span style={{fontSize:16,color:"#4A8FBF"}}>⬡</span>
          </div>
          <div>
            <div style={{fontSize:17,fontWeight:700,color:"#4A8FBF",letterSpacing:"0.25em",textShadow:"0 0 10px rgba(74,143,191,0.5)"}}>NEXUS</div>
            <div style={{fontSize:11,color:"rgba(74,143,191,0.3)",letterSpacing:"0.3em"}}>VENTURE CONSTELLATION</div>
          </div>
        </div>

        {/* Portfolio overview strip */}
        <div style={{display:"flex",gap:1}}>
          {[
            {label:"IN SPRINT",val:parallelActive,c:"#4A8FBF",tip:"Active parallel sprints"},
            {label:"INCUBATING",val:incubating,c:"#C49A2A",tip:"Gates in progress"},
            {label:"DISCOVERY",val:discovering,c:"#7B6DB0",tip:"Being researched"},
            {label:"LIVE",val:stageCounts.live||0,c:"#3A8F5A",tip:"Published to App Store"},
            {label:"PAUSED",val:stageCounts.paused||0,c:"#B87040",tip:"Temporarily halted"},
            {label:"TOTAL",val:projects.length,c:"rgba(74,143,191,0.5)",tip:"All ventures"},
          ].map(m=>(
            <div key={m.label} title={m.tip} style={{textAlign:"center",padding:"0 10px",borderRight:"1px solid rgba(74,143,191,0.06)"}}>
              <div style={{fontSize:22,fontWeight:700,color:m.val>0&&m.label!=="TOTAL"?m.c:m.c,textShadow:m.val>0?`0 0 8px ${m.c}60`:"none",lineHeight:1}}>{m.val}</div>
              <div style={{fontSize:11,color:"rgba(74,143,191,0.2)",letterSpacing:"0.1em"}}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Edge filter */}
        <div style={{display:"flex",gap:4,alignItems:"center",marginLeft:"auto"}}>
          <span style={{fontSize:12,color:"rgba(74,143,191,0.25)",letterSpacing:"0.1em"}}>LINKS:</span>
          {["all","blocks","feeds","supports"].map(t=>{
            const tc=t==="blocks"?"#A84848":t==="feeds"?"#3EA89A":"#4A8FBF";
            return<button key={t} onClick={()=>setFilterEdge(t)} className="hbtn" style={{background:filterEdge===t?`${tc}12`:"rgba(0,0,0,0.3)",border:`1px solid ${filterEdge===t?tc:"rgba(74,143,191,0.1)"}`,color:filterEdge===t?tc:"rgba(74,143,191,0.25)",borderRadius:4,padding:"4px 9px",fontSize:12,cursor:"pointer",letterSpacing:"0.07em",fontFamily:"'Courier New',monospace",fontWeight:700,transition:"all 0.15s"}}>{t.toUpperCase()}</button>;
          })}
        </div>

        {/* Clock */}
        <div style={{paddingLeft:12,borderLeft:"1px solid rgba(74,143,191,0.08)",fontSize:15,color:"#4A8FBF",letterSpacing:"0.1em"}}>{systemTime.toLocaleTimeString("en-US",{hour12:false})}</div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{flex:1,display:"flex",overflow:"hidden",position:"relative",zIndex:5}}>

        {/* ── LEFT: Portfolio Panel ── */}
        <div style={{width:310,flexShrink:0,borderRight:"1px solid rgba(74,143,191,0.08)",background:"rgba(10,18,28,0.96)",backdropFilter:"blur(20px)",display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* Sub tabs */}
          <div style={{display:"flex",borderBottom:"1px solid rgba(74,143,191,0.08)"}}>
            {[["portfolio","PORTFOLIO"],["agents","AGENTS"],["network","ANALYSIS"]].map(([id,label])=>(
              <button key={id} onClick={()=>setActiveView(id)} style={{flex:1,background:activeView===id?"rgba(74,143,191,0.06)":"transparent",border:"none",borderBottom:`2px solid ${activeView===id?"#4A8FBF":"transparent"}`,color:activeView===id?"#4A8FBF":"rgba(74,143,191,0.2)",padding:"9px 4px",fontSize:12,cursor:"pointer",letterSpacing:"0.1em",fontWeight:700,transition:"all 0.2s"}}>{label}</button>
            ))}
          </div>

          <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>

            {/* ── PORTFOLIO VIEW ── */}
            {activeView==="portfolio"&&(
              <div>
                {/* Stage summary */}
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:12,color:"rgba(74,143,191,0.35)",letterSpacing:"0.18em",marginBottom:8}}>PIPELINE OVERVIEW</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                    {Object.entries(PROJECT_STAGES).map(([s,cfg])=>{
                      const count=projects.filter(p=>p.stage===s).length;
                      return(
                        <div key={s} style={{background:count>0?`${cfg.color}08`:"rgba(0,0,0,0.2)",border:`1px solid ${count>0?`${cfg.color}25`:"rgba(74,143,191,0.06)"}`,borderRadius:5,padding:"6px 8px",display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:3,height:28,background:cfg.color,borderRadius:2,opacity:count>0?1:0.2}}/>
                          <div>
                            <div style={{fontSize:20,fontWeight:700,color:count>0?cfg.color:"rgba(74,143,191,0.15)",fontFamily:"'Courier New',monospace",lineHeight:1}}>{count}</div>
                            <div style={{fontSize:11,color:count>0?`${cfg.color}70`:"rgba(74,143,191,0.15)",letterSpacing:"0.08em"}}>{cfg.label}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Investor metrics */}
                <div style={{background:"rgba(196,154,42,0.04)",border:"1px solid rgba(196,154,42,0.15)",borderRadius:7,padding:"10px 12px",marginBottom:14,position:"relative"}}>
                  <CornerBracket sz={7} col="rgba(196,154,42,0.3)"/>
                  <div style={{fontSize:12,color:"#C49A2A",letterSpacing:"0.18em",marginBottom:8}}>INVESTOR SNAPSHOT</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                    {[{l:"COMBINED TAM",v:totalTAM,c:"#C49A2A"},{l:"PARALLEL SPRINTS",v:`${parallelActive} / 3 cap`,c:"#4A8FBF"},{l:"AGENTS DEPLOYED",v:"15",c:"#3EA89A"},{l:"IDEAS IN PIPELINE",v:projects.length,c:"#7B6DB0"}].map(m=>(
                      <div key={m.l} style={{background:"rgba(0,0,0,0.3)",borderRadius:4,padding:"6px 8px"}}>
                        <div style={{fontSize:11,color:"rgba(74,143,191,0.25)",letterSpacing:"0.1em",marginBottom:2}}>{m.l}</div>
                        <div style={{fontSize:18,fontWeight:700,color:m.c,fontFamily:"'Courier New',monospace"}}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:8,fontSize:13,color:"rgba(196,154,42,0.45)",lineHeight:1.6}}>
                    One founder. 15 specialist agents. Up to 3 sprints in parallel. This is the NEXUS venture model.
                  </div>
                </div>

                {/* Project cards */}
                <div style={{fontSize:12,color:"rgba(74,143,191,0.35)",letterSpacing:"0.18em",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span>ALL VENTURES ({projects.length})</span>
                  <button onClick={()=>setAddingProj(true)} style={{background:"rgba(74,143,191,0.08)",border:"1px solid rgba(74,143,191,0.2)",color:"#4A8FBF",borderRadius:4,padding:"3px 8px",fontSize:12,cursor:"pointer",fontWeight:700,letterSpacing:"0.07em"}}>+ ADD</button>
                </div>

                {/* Add project form */}
                {addingProj&&(
                  <div style={{background:"rgba(74,143,191,0.04)",border:"1px solid rgba(74,143,191,0.15)",borderRadius:7,padding:12,marginBottom:10,animation:"slideIn 0.2s ease"}}>
                    <div style={{fontSize:12,color:"#4A8FBF",letterSpacing:"0.15em",marginBottom:8}}>NEW VENTURE</div>
                    <div style={{display:"grid",gap:6}}>
                      <input style={inp} placeholder="App name *" value={newProj.name} onChange={e=>setNewProj(p=>({...p,name:e.target.value}))}/>
                      <input style={inp} placeholder="TAM estimate (e.g. $200M)" value={newProj.tam} onChange={e=>setNewProj(p=>({...p,tam:e.target.value}))}/>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                        <input style={inp} type="number" min={0} max={50} placeholder="Score /50" value={newProj.score} onChange={e=>setNewProj(p=>({...p,score:+e.target.value}))}/>
                        <select style={{...inp}} value={newProj.stage} onChange={e=>setNewProj(p=>({...p,stage:e.target.value}))}>
                          {Object.entries(PROJECT_STAGES).map(([s,c])=><option key={s} value={s}>{c.label}</option>)}
                        </select>
                      </div>
                      <textarea style={{...inp,resize:"none",minHeight:50}} placeholder="Notes..." value={newProj.notes} onChange={e=>setNewProj(p=>({...p,notes:e.target.value}))}/>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={addProject} style={{flex:1,background:"rgba(74,143,191,0.15)",border:"1px solid rgba(74,143,191,0.4)",color:"#4A8FBF",borderRadius:5,padding:"7px",fontSize:13,cursor:"pointer",fontWeight:700,letterSpacing:"0.08em"}}>ADD VENTURE</button>
                        <button onClick={()=>setAddingProj(false)} style={{background:"rgba(0,0,0,0.3)",border:"1px solid rgba(74,143,191,0.1)",color:"rgba(74,143,191,0.3)",borderRadius:5,padding:"7px 10px",fontSize:13,cursor:"pointer"}}>✕</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Group by stage */}
                {Object.entries(PROJECT_STAGES).map(([stage,stageInfo])=>{
                  const stageProjs=projects.filter(p=>p.stage===stage);
                  if(!stageProjs.length)return null;
                  return(
                    <div key={stage} style={{marginBottom:10}}>
                      <div style={{fontSize:12,color:stageInfo.color,letterSpacing:"0.15em",marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
                        <div style={{flex:1,height:1,background:`${stageInfo.color}20`}}/>
                        {stageInfo.label} · {stageProjs.length}
                        <div style={{flex:1,height:1,background:`${stageInfo.color}20`}}/>
                      </div>
                      {stageProjs.map(proj=>(
                        <ProjectCard key={proj.id} proj={proj} isActive={activeProj===proj.id}
                          onSelect={()=>setActiveProj(proj.id)}
                          onUpdate={updated=>setProjects(p=>p.map(x=>x.id===proj.id?updated:x))}/>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── AGENTS VIEW ── */}
            {activeView==="agents"&&(
              <div>
                <div style={{fontSize:12,color:"rgba(74,143,191,0.35)",letterSpacing:"0.18em",marginBottom:10}}>AGENT NETWORK — {FINAL_AGENTS.length-1} SPECIALISTS</div>
                {selAgent?(
                  <div style={{animation:"fadeUp 0.2s ease"}}>
                    <div style={{background:`${selAgent.color}08`,border:`1px solid ${selAgent.color}25`,borderRadius:7,padding:12,marginBottom:10,position:"relative"}}>
                      <CornerBracket sz={7} col={selAgent.color}/>
                      <div style={{fontSize:20,fontWeight:700,color:selAgent.color,letterSpacing:"0.15em",marginBottom:2}}>{selAgent.name}</div>
                      <div style={{fontSize:12,color:"rgba(74,143,191,0.3)",marginBottom:10}}>{selAgent.role} · Ring {selAgent.ring}</div>
                      <div style={{fontSize:12,color:"rgba(74,143,191,0.25)",marginBottom:6}}>STATUS:</div>
                      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                        {["idle","active","working","blocked","done"].map(s=>{const c=STATUS_COLORS[s];const cur=statuses[selAgent.id]===s;return<button key={s} onClick={()=>cycleAgentStatus(selAgent.id)} style={{background:cur?`${c}18`:"rgba(0,0,0,0.4)",border:`1px solid ${cur?c:"rgba(74,143,191,0.1)"}`,color:cur?c:"rgba(74,143,191,0.25)",borderRadius:3,padding:"3px 7px",fontSize:12,cursor:"pointer",fontWeight:700,letterSpacing:"0.06em"}}>{s.toUpperCase()}</button>;})}
                      </div>
                    </div>
                    {[{dir:"BLOCKED BY",incoming:true},{dir:"UNBLOCKS",incoming:false}].map(({dir,incoming})=>{
                      const edges=EDGES.filter(e=>incoming?e[1]===selAgent.id:e[0]===selAgent.id);
                      if(!edges.length)return null;
                      return(<div key={dir} style={{marginBottom:10}}>
                        <div style={{fontSize:12,color:"rgba(74,143,191,0.3)",letterSpacing:"0.12em",marginBottom:5}}>{dir}</div>
                        {edges.map((edge,i)=>{
                          const pid=incoming?edge[0]:edge[1],peer=FINAL_AGENTS.find(a=>a.id===pid),ec=EDGE_COLORS[edge[2]];
                          return<div key={i} onClick={()=>{selectedRef.current=pid;setSelected(pid);}} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",background:"rgba(0,0,0,0.3)",border:`1px solid ${ec}18`,borderRadius:4,marginBottom:3,cursor:"pointer"}}>
                            <div style={{width:5,height:5,borderRadius:"50%",background:ec,boxShadow:`0 0 5px ${ec}`}}/>
                            <div style={{flex:1}}>
                              <div style={{fontSize:14,fontWeight:700,color:peer?.color}}>{peer?.name}</div>
                              <div style={{fontSize:11,color:"rgba(74,143,191,0.25)"}}>{edge[3]}</div>
                            </div>
                            <span style={{fontSize:11,color:ec,fontWeight:700}}>{edge[2].toUpperCase()}</span>
                          </div>;
                        })}
                      </div>);
                    })}
                    <button onClick={()=>{setSelected(null);selectedRef.current=null;}} style={{width:"100%",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(74,143,191,0.1)",color:"rgba(74,143,191,0.3)",borderRadius:5,padding:"6px",fontSize:12,cursor:"pointer",letterSpacing:"0.1em"}}>DESELECT</button>
                  </div>
                ):(
                  <div style={{display:"grid",gap:4}}>
                    {FINAL_AGENTS.filter(a=>a.id!=="nexus").map(agent=>{
                      const status=statuses[agent.id]||"idle";const sc=STATUS_COLORS[status];
                      const assignedProj=projects.find(p=>p.agents.includes(agent.id)&&p.stage!=="killed");
                      return(
                        <div key={agent.id} onClick={()=>{selectedRef.current=agent.id;setSelected(agent.id);}} className="card-hover"
                          style={{display:"flex",alignItems:"center",gap:8,padding:"6px 9px",background:"rgba(0,0,0,0.25)",border:`1px solid ${agent.color}15`,borderLeft:`2px solid ${agent.color}`,borderRadius:5,cursor:"pointer",transition:"all 0.15s"}}>
                          <div style={{width:7,height:7,borderRadius:1,background:sc,boxShadow:`0 0 5px ${sc}`,flexShrink:0}}/>
                          <div style={{flex:1}}>
                            <div style={{fontSize:14,fontWeight:700,color:agent.color,letterSpacing:"0.08em"}}>{agent.name}</div>
                            <div style={{fontSize:12,color:"rgba(74,143,191,0.25)"}}>{agent.role}</div>
                          </div>
                          {assignedProj&&<span style={{fontSize:11,color:assignedProj.color,background:`${assignedProj.color}12`,border:`1px solid ${assignedProj.color}25`,borderRadius:3,padding:"1px 5px"}}>{assignedProj.name}</span>}
                          <span style={{fontSize:11,color:sc,fontWeight:700,letterSpacing:"0.06em"}}>{status.toUpperCase()}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── ANALYSIS VIEW ── */}
            {activeView==="network"&&(
              <div>
                <div style={{fontSize:12,color:"rgba(74,143,191,0.35)",letterSpacing:"0.18em",marginBottom:10}}>DEPENDENCY ANALYSIS</div>
                {[{type:"blocks",c:"#A84848",d:"6,4",desc:"Hard gates — nothing moves downstream until resolved"},{type:"feeds",c:"#3EA89A",d:"3,6",desc:"Data flow — enriches downstream agents"},{type:"supports",c:"rgba(74,143,191,0.6)",d:"1,8",desc:"NEXUS orchestration — continuous oversight"}].map(e=>(
                  <div key={e.type} style={{padding:"8px 10px",background:`${e.c}08`,border:`1px solid ${e.c}18`,borderRadius:5,marginBottom:6}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
                      <svg width={28} height={6}><line x1={0} y1={3} x2={28} y2={3} stroke={e.c} strokeWidth={1.5} strokeDasharray={e.d}/></svg>
                      <span style={{fontSize:13,color:e.c,fontWeight:700,letterSpacing:"0.07em"}}>{e.type.toUpperCase()} — {EDGES.filter(x=>x[2]===e.type).length} links</span>
                    </div>
                    <div style={{fontSize:12,color:"rgba(74,143,191,0.25)",lineHeight:1.5}}>{e.desc}</div>
                  </div>
                ))}

                <div style={{fontSize:12,color:"rgba(74,143,191,0.35)",letterSpacing:"0.18em",marginBottom:8,marginTop:12}}>CRITICAL PATH TO TESTFLIGHT</div>
                {["RADAR → MERIDIAN","MERIDIAN → ATLAS","ATLAS → FORGE","FORGE → CORE + PRISM","PRISM → SWIFT","CORE → SWIFT","SWIFT → SENTINEL","SENTINEL → SIGN_OFF"].map((step,i)=>(
                  <div key={step} style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
                    <span style={{fontSize:12,color:"rgba(62,168,154,0.3)",minWidth:14,fontFamily:"'Courier New',monospace"}}>{i+1}</span>
                    <div style={{flex:1,padding:"4px 8px",background:"rgba(62,168,154,0.04)",border:"1px solid rgba(62,168,154,0.12)",borderRadius:3}}>
                      <span style={{fontSize:13,color:"#3EA89A",fontWeight:700,letterSpacing:"0.07em"}}>{step}</span>
                    </div>
                  </div>
                ))}

                <div style={{fontSize:12,color:"rgba(74,143,191,0.35)",letterSpacing:"0.18em",marginBottom:8,marginTop:12}}>BOTTLENECK AGENTS</div>
                {[{id:"forge",reason:"Gates 5 downstream agents. MUST go first."},{id:"atlas",reason:"Gates design, marketing, analytics, data, AI."},{id:"prism",reason:"Gates iOS Dev. Blocks 3 downstream."},{id:"core",reason:"Gates iOS Dev + QA. Blocks 2 downstream."}].map(b=>{
                  const a=FINAL_AGENTS.find(x=>x.id===b.id);
                  return<div key={b.id} style={{display:"flex",gap:8,padding:"7px 9px",background:"rgba(168,72,72,0.05)",border:"1px solid rgba(168,72,72,0.15)",borderRadius:5,marginBottom:5}}>
                    <div style={{width:4,background:"#A84848",borderRadius:2,flexShrink:0}}/>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:a?.color,letterSpacing:"0.08em"}}>{a?.name}</div>
                      <div style={{fontSize:12,color:"rgba(74,143,191,0.3)",lineHeight:1.5}}>{b.reason}</div>
                    </div>
                  </div>;
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── CANVAS ── */}
        <div style={{flex:1,position:"relative",overflow:"hidden"}}>
          <canvas ref={canvasRef} onMouseMove={handleMouseMove} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseLeave={()=>{stateRef.current.isDragging=false;}} style={{width:"100%",height:"100%",display:"block",cursor:"grab"}}/>

          {/* Controls */}
          <div style={{position:"absolute",bottom:18,left:"50%",transform:"translateX(-50%)",display:"flex",gap:5,background:"rgba(7,16,28,0.9)",border:"1px solid rgba(74,143,191,0.12)",borderRadius:12,padding:"7px 11px",backdropFilter:"blur(16px)"}}>
            {[{l:"◉",t:"Zoom In",f:doZoomIn},{l:"○",t:"Zoom Out",f:doZoomOut},{l:"↻",t:"Full Spin",f:doSpin},{l:"↕",t:"Flip",f:doFlip},{l:"⟳",t:"Dive",f:doDive},{l:"⟆",t:"Twist +45°",f:doTwist},{l:"⌂",t:"Reset",f:doReset}].map(b=>(
              <button key={b.t} onClick={b.f} title={b.t} className="hbtn" style={{background:"rgba(74,143,191,0.05)",border:"1px solid rgba(74,143,191,0.14)",color:"rgba(74,143,191,0.55)",borderRadius:7,width:32,height:32,cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>{b.l}</button>
            ))}
            <div style={{width:1,background:"rgba(74,143,191,0.1)",margin:"0 3px"}}/>
            <button onClick={()=>{const v=!autoRotate;setAutoRotate(v);stateRef.current.autoRotate=v;}} className="hbtn" style={{background:autoRotate?"rgba(74,143,191,0.16)":"rgba(74,143,191,0.04)",border:`1px solid ${autoRotate?"rgba(74,143,191,0.45)":"rgba(74,143,191,0.12)"}`,color:autoRotate?"#4A8FBF":"rgba(74,143,191,0.35)",borderRadius:7,padding:"0 9px",height:32,cursor:"pointer",fontSize:12,letterSpacing:"0.1em",fontWeight:700,transition:"all 0.15s"}}>AUTO</button>
            <button onClick={()=>{const v=!autoTwist;setAutoTwist(v);stateRef.current.autoTwist=v;}} className="hbtn" style={{background:autoTwist?"rgba(123,109,176,0.16)":"rgba(74,143,191,0.04)",border:`1px solid ${autoTwist?"rgba(123,109,176,0.45)":"rgba(74,143,191,0.12)"}`,color:autoTwist?"#7B6DB0":"rgba(74,143,191,0.35)",borderRadius:7,padding:"0 9px",height:32,cursor:"pointer",fontSize:12,letterSpacing:"0.1em",fontWeight:700,transition:"all 0.15s"}}>TWIST</button>
          </div>

          {/* Top hint */}
          <div style={{position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",fontSize:12,color:"rgba(74,143,191,0.18)",letterSpacing:"0.15em",pointerEvents:"none",whiteSpace:"nowrap"}}>
            DRAG TO ROTATE · SCROLL TO ZOOM · CLICK NODE TO TRACE DEPENDENCIES · COLORED HEX RINGS = PROJECT ASSIGNMENT
          </div>

          {/* Hover tooltip */}
          {hovered&&hovered!==selected&&(()=>{
            const ha=FINAL_AGENTS.find(a=>a.id===hovered);
            const ap=projects.find(p=>p.agents.includes(hovered));
            return<div style={{position:"absolute",top:36,left:"50%",transform:"translateX(-50%)",background:"rgba(7,16,28,0.92)",border:`1px solid ${ha?.color||"#4A8FBF"}30`,borderRadius:6,padding:"5px 12px",fontSize:13,color:"#4A8FBF",letterSpacing:"0.08em",animation:"fadeUp 0.15s ease",pointerEvents:"none",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontWeight:700,color:ha?.color}}>{ha?.name}</span>
              <span style={{color:"rgba(74,143,191,0.4)"}}>·</span>
              <span style={{color:"rgba(74,143,191,0.5)"}}>{ha?.role}</span>
              {ap&&<><span style={{color:"rgba(74,143,191,0.4)"}}>·</span><span style={{color:ap.color,fontWeight:700}}>{ap.name}</span></>}
              <span style={{color:"rgba(74,143,191,0.4)"}}>·</span>
              <span style={{color:STATUS_COLORS[statuses[hovered]||"idle"],fontWeight:700}}>{(statuses[hovered]||"idle").toUpperCase()}</span>
            </div>;
          })()}
        </div>
      </div>
    </div>
  );
}
