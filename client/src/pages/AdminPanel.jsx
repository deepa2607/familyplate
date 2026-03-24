// ══════════════════════════════════════════════════════════════════════════
//  AdminPanel.jsx  (FIXED: removed 2s pulse that caused rapid re-renders)
//  familyplate/client/src/pages/AdminPanel.jsx
// ══════════════════════════════════════════════════════════════════════════
import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";

const C = {
  bg:"#0B0E1A", panel:"#111827", card:"#141B2D", border:"rgba(255,255,255,0.06)",
  text:"#F8FAFF", muted:"rgba(248,250,255,0.45)", dim:"rgba(248,250,255,0.18)",
  orange:"#F97316", orangeL:"#FB923C", teal:"#06B6D4", violet:"#8B5CF6",
  green:"#10B981", red:"#EF4444", gold:"#F59E0B", pink:"#EC4899",
};
const GRAD = {
  orange:"linear-gradient(135deg,#F97316,#FB923C)",
  teal:"linear-gradient(135deg,#0891B2,#06B6D4)",
  violet:"linear-gradient(135deg,#7C3AED,#8B5CF6)",
  green:"linear-gradient(135deg,#059669,#10B981)",
  red:"linear-gradient(135deg,#DC2626,#EF4444)",
  gold:"linear-gradient(135deg,#D97706,#F59E0B)",
};
const INR = n => `₹${(Number(n)||0).toLocaleString("en-IN")}`;
const fmt = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";

// ── Animated Counter ──────────────────────────────────────────────────────
function Counter({ value, duration=1200 }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    const end = Number(String(value).replace(/[^\d.]/g,"")) || 0;
    const start = performance.now();
    const animate = now => {
      const p = Math.min((now-start)/duration,1);
      const ease = 1-Math.pow(1-p,3);
      setDisplay(Math.round(ease*end));
      if(p<1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  },[value,duration]);
  const f = display>=100000?`${(display/100000).toFixed(1)}L`:display>=1000?`${(display/1000).toFixed(1)}k`:display.toLocaleString("en-IN");
  return <span>{f}</span>;
}

// ── Sparkline ─────────────────────────────────────────────────────────────
function Sparkline({ data=[], color=C.orange, width=80, height=28 }) {
  if(!data.length) return null;
  const max = Math.max(...data,1);
  const pts = data.map((v,i) => [(i/(data.length-1||1))*width, height-(v/max)*height*0.85-2]);
  const path = pts.map((p,i)=>`${i===0?"M":"L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");
  const area = `M${pts[0][0]},${height} ${pts.map(p=>`L${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ")} L${pts[pts.length-1][0]},${height} Z`;
  return (
    <svg width={width} height={height} style={{overflow:"visible"}}>
      <defs>
        <linearGradient id={`spk${color.replace(/[^a-zA-Z0-9]/g,"")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spk${color.replace(/[^a-zA-Z0-9]/g,"")})`}/>
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Area Chart ────────────────────────────────────────────────────────────
function AreaChart({ data=[], color1=C.orange, color2=C.green }) {
  const [progress, setProgress] = useState(0);
  const [tooltip, setTooltip]   = useState(null);
  const rafRef = useRef(null);
  useEffect(() => {
    setProgress(0);
    const s = performance.now();
    const a = now => { const p=Math.min((now-s)/900,1); setProgress(1-Math.pow(1-p,2)); if(p<1) rafRef.current=requestAnimationFrame(a); };
    rafRef.current = requestAnimationFrame(a);
    return () => cancelAnimationFrame(rafRef.current);
  },[data]);
  if(!data.length) return <div style={{height:180,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:13}}>No data yet</div>;
  const W=580,H=180,pad={t:20,r:16,b:32,l:56};
  const iW=W-pad.l-pad.r, iH=H-pad.t-pad.b;
  const maxV = Math.max(...data.map(d=>d.total||0),1);
  const pts = key => data.map((d,i) => ({x:pad.l+(i/(data.length-1||1))*iW*progress, y:pad.t+iH-((d[key]||0)/maxV)*iH, ...d}));
  const toPath = ps => ps.map((p,i)=>`${i===0?"M":"L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const toArea = ps => { if(!ps.length) return ""; return `M${ps[0].x.toFixed(2)},${(pad.t+iH).toFixed(2)} ${ps.map(p=>`L${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")} L${ps[ps.length-1].x.toFixed(2)},${(pad.t+iH).toFixed(2)} Z`; };
  const tp = pts("total"), sp = pts("settled");
  return (
    <div style={{position:"relative",width:"100%"}}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:H,overflow:"visible"}}>
        <defs>
          <linearGradient id="ao" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color1} stopOpacity="0.35"/><stop offset="100%" stopColor={color1} stopOpacity="0.02"/></linearGradient>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color2} stopOpacity="0.28"/><stop offset="100%" stopColor={color2} stopOpacity="0.02"/></linearGradient>
        </defs>
        {[0,0.25,0.5,0.75,1].map((f,i) => { const y=pad.t+iH-f*iH, v=Math.round(f*maxV); return (<g key={i}><line x1={pad.l} y1={y} x2={W-pad.r} y2={y} stroke={C.border} strokeWidth="1"/><text x={pad.l-8} y={y+4} textAnchor="end" fontSize="9" fill={C.muted}>{v>=100000?`${(v/100000).toFixed(0)}L`:v>=1000?`${(v/1000).toFixed(0)}k`:v}</text></g>); })}
        <path d={toArea(tp)} fill="url(#ao)"/><path d={toArea(sp)} fill="url(#ag)"/>
        <path d={toPath(tp)} fill="none" stroke={color1} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d={toPath(sp)} fill="none" stroke={color2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,3"/>
        {tp.map((p,i) => (<g key={i}><circle cx={p.x} cy={p.y} r={14} fill="transparent" style={{cursor:"pointer"}} onMouseEnter={()=>setTooltip({...p,i})} onMouseLeave={()=>setTooltip(null)}/><circle cx={p.x} cy={p.y} r={p.total>0?4.5:2.5} fill={p.total>0?color1:"rgba(255,255,255,0.1)"} stroke="rgba(11,14,26,0.8)" strokeWidth="2" opacity={progress}/><text x={p.x} y={H-6} textAnchor="middle" fontSize="9" fill={C.muted}>{p.label}</text></g>))}
      </svg>
      {tooltip&&(<div style={{position:"absolute",top:tooltip.y-72,left:Math.max(8,Math.min(tooltip.x-60,480)),background:"rgba(15,18,32,0.98)",border:`1px solid ${color1}44`,borderRadius:12,padding:"10px 14px",pointerEvents:"none",zIndex:10,minWidth:140,backdropFilter:"blur(12px)"}}><div style={{fontSize:11,color:C.muted,marginBottom:4,fontWeight:600}}>{tooltip.label}</div><div style={{fontSize:15,fontWeight:900,color:color1}}>{INR(tooltip.total||0)}</div><div style={{fontSize:11,color:color2,marginTop:2}}>{INR(tooltip.settled||0)} settled</div>{tooltip.count!==undefined&&<div style={{fontSize:10,color:C.dim,marginTop:2}}>{tooltip.count} transactions</div>}</div>)}
    </div>
  );
}

// ── Donut Chart ───────────────────────────────────────────────────────────
function DonutChart({ segments=[], size=160 }) {
  const [hovered, setHovered] = useState(null);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => { setProgress(0); const s=performance.now(); const a=now=>{const p=Math.min((now-s)/800,1);setProgress(1-Math.pow(1-p,2));if(p<1)rafRef.current=requestAnimationFrame(a);}; rafRef.current=requestAnimationFrame(a); return()=>cancelAnimationFrame(rafRef.current); },[segments]);
  const total = segments.reduce((s,sg)=>s+sg.value,0);
  if(!total) return <div style={{width:size,height:size,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:12}}>No data</div>;
  const cx=size/2, cy=size/2, r=size*0.42, inner=size*0.27;
  let cum = -Math.PI/2;
  const paths = segments.map((sg,i) => {
    const ang=(sg.value/total)*2*Math.PI*progress;
    const x1=cx+r*Math.cos(cum),y1=cy+r*Math.sin(cum);
    cum+=(sg.value/total)*2*Math.PI*progress;
    const x2=cx+r*Math.cos(cum),y2=cy+r*Math.sin(cum);
    const ix1=cx+inner*Math.cos(cum-ang),iy1=cy+inner*Math.sin(cum-ang);
    const ix2=cx+inner*Math.cos(cum),iy2=cy+inner*Math.sin(cum);
    const lg=ang>Math.PI?1:0; const midA=cum-ang/2; const isHov=hovered===i;
    const ox=isHov?Math.cos(midA)*5:0, oy=isHov?Math.sin(midA)*5:0;
    const d=`M${ix1+ox},${iy1+oy} L${x1+ox},${y1+oy} A${r},${r} 0 ${lg},1 ${x2+ox},${y2+oy} L${ix2+ox},${iy2+oy} A${inner},${inner} 0 ${lg},0 ${ix1+ox},${iy1+oy} Z`;
    return {...sg,d,pct:Math.round(sg.value/total*100),i};
  });
  const hov = hovered!==null ? segments[hovered] : null;
  return (<div style={{position:"relative",display:"inline-block"}}><svg viewBox={`0 0 ${size} ${size}`} style={{width:size,height:size,overflow:"visible"}}>{paths.map(p=>(<path key={p.i} d={p.d} fill={p.color} stroke="rgba(11,14,26,0.6)" strokeWidth="2" style={{cursor:"pointer",transition:"all .2s",filter:hovered===p.i?`drop-shadow(0 0 6px ${p.color}99)`:""}} onMouseEnter={()=>setHovered(p.i)} onMouseLeave={()=>setHovered(null)}/>))}{hov?(<><text x={cx} y={cy-8} textAnchor="middle" fontSize="9" fill={C.muted}>{hov.label}</text><text x={cx} y={cy+8} textAnchor="middle" fontSize="14" fontWeight="800" fill={hov.color}>{hov.pct}%</text><text x={cx} y={cy+22} textAnchor="middle" fontSize="8" fill={C.muted}>{INR(hov.value)}</text></>):(<><text x={cx} y={cy+4} textAnchor="middle" fontSize="15" fontWeight="900" fill={C.text}>{total}</text><text x={cx} y={cy+18} textAnchor="middle" fontSize="8" fill={C.muted}>total</text></>)}</svg></div>);
}

// ── Racing Bar ─────────────────────────────────────────────────────────────
function RacingBar({ bars=[] }) {
  const [hovIdx, setHovIdx] = useState(null);
  const maxV = Math.max(...bars.map(b=>b.value),1);
  return (<div style={{display:"flex",flexDirection:"column",gap:10}}>{[...bars].sort((a,b)=>b.value-a.value).slice(0,6).map((b,i) => { const pct=Math.max(0,Math.min(100,(b.value/maxV)*100)); const isHov=hovIdx===i; return (<div key={b.label} style={{display:"flex",alignItems:"center",gap:10}} onMouseEnter={()=>setHovIdx(i)} onMouseLeave={()=>setHovIdx(null)}><div style={{width:28,height:28,borderRadius:"50%",background:b.color||GRAD.orange,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:900,fontSize:10,flexShrink:0,boxShadow:isHov?`0 0 12px ${b.color||C.orange}66`:""}}>{(b.label||"?")[0].toUpperCase()}</div><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:11,fontWeight:700,color:isHov?C.text:C.muted,transition:"color .2s"}}>{b.label}</span><span style={{fontSize:11,fontWeight:800,color:b.color||C.orange}}>{INR(b.value)}</span></div><div style={{height:6,background:"rgba(255,255,255,0.05)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:b.color||C.orange,borderRadius:3,transition:"width 0.8s cubic-bezier(0.4,0,0.2,1)",boxShadow:isHov?`0 0 8px ${b.color||C.orange}88`:""}}/></div></div><span style={{fontSize:10,color:C.dim,width:28,textAlign:"right",flexShrink:0}}>#{i+1}</span></div>); })}</div>);
}

// ── Calendar Heatmap ──────────────────────────────────────────────────────
function CalendarHeatmap({ purchases=[] }) {
  const [hovDay, setHovDay] = useState(null);
  const dayMap = {};
  purchases.forEach(p => { const d=new Date(p.date||p.createdAt); const key=d.toISOString().slice(0,10); dayMap[key]=(dayMap[key]||0)+(p.totalAmount||p.amount||0); });
  const maxVal = Math.max(...Object.values(dayMap),1);
  const today = new Date();
  const weeks = [];
  for(let w=12; w>=0; w--) { const days=[]; for(let d=0; d<7; d++) { const dt=new Date(today); dt.setDate(dt.getDate()-w*7-(6-d)); const key=dt.toISOString().slice(0,10); const val=dayMap[key]||0; days.push({key,val,dt}); } weeks.push(days); }
  const intensity = val => { if(!val) return "rgba(255,255,255,0.03)"; const p=val/maxVal; if(p<0.25) return "rgba(249,115,22,0.25)"; if(p<0.5) return "rgba(249,115,22,0.50)"; if(p<0.75) return "rgba(249,115,22,0.75)"; return C.orange; };
  return (<div style={{position:"relative"}}><div style={{display:"flex",gap:3,overflowX:"auto"}}>{weeks.map((week,wi)=>(<div key={wi} style={{display:"flex",flexDirection:"column",gap:3}}>{week.map((day,di)=>(<div key={di} title={`${day.key}: ${INR(day.val)}`} style={{width:14,height:14,borderRadius:3,background:intensity(day.val),cursor:day.val?"pointer":"default",transition:"transform .15s",border:hovDay?.key===day.key?`1px solid ${C.orange}`:"1px solid transparent"}} onMouseEnter={()=>day.val&&setHovDay(day)} onMouseLeave={()=>setHovDay(null)}/>))}</div>))}</div>{hovDay&&(<div style={{position:"absolute",bottom:"calc(100% + 6px)",left:"50%",transform:"translateX(-50%)",background:"rgba(11,14,26,0.98)",border:`1px solid ${C.orange}44`,borderRadius:8,padding:"6px 10px",fontSize:11,color:C.text,pointerEvents:"none",whiteSpace:"nowrap",zIndex:10}}><span style={{color:C.muted}}>{hovDay.key}</span>{" · "}<span style={{color:C.orange,fontWeight:700}}>{INR(hovDay.val)}</span></div>)}<div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,justifyContent:"flex-end"}}><span style={{fontSize:9,color:C.dim}}>Less</span>{[0.03,0.25,0.5,0.75,1].map((p,i)=>(<div key={i} style={{width:10,height:10,borderRadius:2,background:intensity(p*maxVal)}}/>))}<span style={{fontSize:9,color:C.dim}}>More</span></div></div>);
}

// ── Gauge Chart ───────────────────────────────────────────────────────────
function GaugeChart({ value=0, size=120 }) {
  const [animated, setAnimated] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => { const s=performance.now(), target=Math.min(Math.max(value,0),100); const a=now=>{const p=Math.min((now-s)/1000,1);const ease=1-Math.pow(1-p,3);setAnimated(ease*target);if(p<1)rafRef.current=requestAnimationFrame(a);}; rafRef.current=requestAnimationFrame(a); return()=>cancelAnimationFrame(rafRef.current); },[value]);
  const cx=size/2, cy=size*0.7, r=size*0.38, inner=r*0.65;
  const startAng=Math.PI, endAng=0;
  const ang=startAng+(animated/100)*(endAng-startAng);
  const x1=cx+r*Math.cos(startAng),y1=cy+r*Math.sin(startAng);
  const x2=cx+r*Math.cos(endAng),y2=cy+r*Math.sin(endAng);
  const xi=cx+r*Math.cos(ang),yi=cy+r*Math.sin(ang);
  const ix1=cx+inner*Math.cos(startAng),iy1=cy+inner*Math.sin(startAng);
  const ix2=cx+inner*Math.cos(endAng),iy2=cy+inner*Math.sin(endAng);
  const ixi=cx+inner*Math.cos(ang),iyi=cy+inner*Math.sin(ang);
  const color=animated<33?C.red:animated<66?C.gold:C.green;
  return (<svg viewBox={`0 0 ${size} ${size*0.75}`} style={{width:size,height:size*0.75}}><path d={`M${ix1},${iy1} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} L${ix2},${iy2} A${inner},${inner} 0 0,0 ${ix1},${iy1} Z`} fill="rgba(255,255,255,0.04)" stroke="none"/>{animated>0&&<path d={`M${ix1},${iy1} L${x1},${y1} A${r},${r} 0 ${animated>50?1:0},1 ${xi},${yi} L${ixi},${iyi} A${inner},${inner} 0 ${animated>50?1:0},0 ${ix1},${iy1} Z`} fill={color} opacity="0.9"/>}<line x1={cx} y1={cy} x2={cx+r*0.75*Math.cos(ang)} y2={cy+r*0.75*Math.sin(ang)} stroke="white" strokeWidth="2" strokeLinecap="round"/><circle cx={cx} cy={cy} r={5} fill="white"/><text x={cx} y={cy-8} textAnchor="middle" fontSize="16" fontWeight="900" fill={color}>{Math.round(animated)}%</text><text x={cx} y={cy+4} textAnchor="middle" fontSize="8" fill={C.muted}>Settlement Rate</text></svg>);
}

// ── Radar Chart ───────────────────────────────────────────────────────────
function RadarChart({ members=[], purchases=[], size=200 }) {
  const [hov, setHov] = useState(null);
  const axes = ["Spend","Frequency","Avg Txn","Grocery","Personal"];
  const cx=size/2, cy=size/2, r=size*0.36;
  const COLORS = [C.orange,C.teal,C.violet,C.green,C.pink];
  const memberData = members.slice(0,4).map((m,mi) => {
    const mp=purchases.filter(p=>{const pn=p.paidBy?.name||p.paidByName||(typeof p.paidBy==="string"&&p.paidBy.length<24?p.paidBy:"");return pn===m.name;});
    const spend=mp.reduce((s,p)=>s+(p.totalAmount||p.amount||0),0); const freq=mp.length; const avg=freq>0?spend/freq:0;
    const groc=mp.filter(p=>p.category==="Grocery").length; const pers=mp.filter(p=>p.splitType==="individual").length;
    return {name:m.name,color:COLORS[mi],vals:[spend,freq,avg,groc,pers]};
  });
  const maxPerAxis = axes.map((_,ai) => Math.max(...memberData.map(m=>m.vals[ai]),1));
  const pt = (ai,val) => { const pct=Math.max(0,Math.min(1,(val||0)/maxPerAxis[ai])); const ang=(ai/axes.length)*2*Math.PI-Math.PI/2; return {x:cx+r*pct*Math.cos(ang),y:cy+r*pct*Math.sin(ang)}; };
  return (<svg viewBox={`0 0 ${size} ${size}`} style={{width:size,height:size,overflow:"visible"}}>{[0.25,0.5,0.75,1].map((f,ri)=>{const pts=axes.map((_,ai)=>{const ang=(ai/axes.length)*2*Math.PI-Math.PI/2;return `${(cx+r*f*Math.cos(ang)).toFixed(2)},${(cy+r*f*Math.sin(ang)).toFixed(2)}`;}).join(" ");return <polygon key={ri} points={pts} fill="none" stroke={C.border} strokeWidth="1"/>;})}{axes.map((ax,ai)=>{const ang=(ai/axes.length)*2*Math.PI-Math.PI/2;const lx=cx+(r+18)*Math.cos(ang),ly=cy+(r+18)*Math.sin(ang);return(<g key={ai}><line x1={cx} y1={cy} x2={(cx+r*Math.cos(ang)).toFixed(2)} y2={(cy+r*Math.sin(ang)).toFixed(2)} stroke={C.dim} strokeWidth="1"/><text x={lx.toFixed(2)} y={Number(ly.toFixed(2))+3} textAnchor="middle" fontSize="8" fill={C.muted}>{ax}</text></g>);})}{memberData.map((m,mi)=>{const pts=axes.map((_,ai)=>{const p=pt(ai,m.vals[ai]);return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;}).join(" ");const isHov=hov===mi;return(<polygon key={mi} points={pts} fill={m.color} fillOpacity={isHov?0.35:0.15} stroke={m.color} strokeWidth={isHov?2:1.5} style={{cursor:"pointer",transition:"all .2s"}} onMouseEnter={()=>setHov(mi)} onMouseLeave={()=>setHov(null)}/>);})}</svg>);
}

// ══════════════════════════════════════════════════════════════════════════
//  MAIN ADMIN PANEL  (FIXED: no more 2s pulse causing rapid re-renders)
// ══════════════════════════════════════════════════════════════════════════
export default function AdminPanel() {
  const [tab,     setTab]     = useState("overview");
  const [hh,      setHH]      = useState([]);
  const [users,   setUsers]   = useState([]);
  const [purch,   setPurch]   = useState([]);
  const [loading, setLd]      = useState(true);
  const [toast,   setToast]   = useState(null);
  const [q,       setQ]       = useState("");
  const [sideExp, setSideExp] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const token   = localStorage.getItem("token");
  const headers = { Authorization:`Bearer ${token}` };

  // ── FIXED: Load once on mount, then auto-refresh every 60 seconds ──────
  // Previously had setInterval(setPulse, 2000) which caused re-renders every 2s
  useEffect(() => {
    loadAll();
    const interval = setInterval(() => {
      loadAll(true); // silent refresh
    }, 60000); // 60 seconds, not 2 seconds
    return () => clearInterval(interval);
  }, []);

  const notify = (msg,ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3500); };

  const loadAll = useCallback(async (silent=false) => {
    if (!silent) setLd(true);
    try {
      const [h,u,p] = await Promise.allSettled([
        axios.get(`${API}/admin/households`,{headers}),
        axios.get(`${API}/admin/users`,{headers}),
        axios.get(`${API}/admin/purchases`,{headers}),
      ]);
      if(h.status==="fulfilled") setHH(h.value.data||[]);
      if(u.status==="fulfilled") setUsers(u.value.data||[]);
      if(p.status==="fulfilled") setPurch(p.value.data||[]);
      setLastRefresh(new Date());
    } catch {}
    if (!silent) setLd(false);
  }, []);

  // Actions
  const makeAdmin  = async(uid,name)=>{try{await axios.post(`${API}/admin/make-admin/${uid}`,{},{headers});notify(`⚡ ${name} → Admin`);loadAll();}catch{notify("Failed",false);}};
  const deleteUser = async(uid,name)=>{if(!window.confirm(`Delete ${name}?`))return;try{await axios.delete(`${API}/admin/user/${uid}`,{headers});notify(`🗑 ${name} deleted`);loadAll();}catch{notify("Failed",false);}};
  const deleteHH   = async(id,name)=>{if(!window.confirm(`Delete "${name}"?`))return;try{await axios.delete(`${API}/admin/household/${id}`,{headers});notify(`🗑 "${name}" deleted`);loadAll();}catch{notify("Failed",false);}};
  const settleHH   = async(id,name)=>{try{await axios.post(`${API}/purchase/settle/${id}`,{},{headers});notify(`✅ Settled for ${name}`);loadAll();}catch(e){notify(e.response?.data?.message||"Settle failed",false);}};
  const settlePurch= async(id)=>{try{await axios.patch(`${API}/purchase/settle-one/${id}`,{},{headers});notify("✅ Purchase settled");loadAll();}catch(e){notify(e.response?.data?.message||"Settle failed",false);}};
  const deletePurch= async(id)=>{if(!window.confirm("Delete this purchase?"))return;try{await axios.delete(`${API}/admin/purchase/${id}`,{headers});notify("🗑 Purchase deleted");loadAll();}catch{notify("Failed",false);}};
  const setBudget  = async(id,name)=>{const v=window.prompt(`Monthly budget for "${name}" (₹):`,"5000");if(!v||isNaN(Number(v)))return;try{await axios.put(`${API}/admin/household/${id}`,{monthlyBudget:Number(v)},{headers});notify(`💰 Budget → ₹${Number(v).toLocaleString("en-IN")}`);loadAll();}catch{notify("Failed",false);}};
  const settleAll  = async()=>{if(!window.confirm("Settle ALL globally?"))return;for(const h of hh){try{await axios.post(`${API}/purchase/settle/${h._id}`,{},{headers});}catch{}}notify("✅ All globally settled");loadAll();};
  const exportCSV  = ()=>{const rows=[["Description","Category","Amount","Paid By","Date","Settled"]];purch.forEach(p=>rows.push([p.description||p.category||"",p.category||"",p.totalAmount||p.amount||0,p.paidBy?.name||"",fmt(p.date||p.createdAt),p.settled?"Yes":"No"]));const a=document.createElement("a");a.href="data:text/csv,"+encodeURIComponent(rows.map(r=>r.join(",")).join("\n"));a.download="homehub_admin.csv";a.click();notify("📥 CSV downloaded");};

  // Derived data
  const total     = purch.reduce((s,p)=>s+(p.totalAmount||p.amount||0),0);
  const unsettled = purch.filter(p=>!p.settled);
  const settled   = purch.filter(p=>p.settled);
  const now       = new Date();
  const monthly   = purch.filter(p=>{const d=new Date(p.date||p.createdAt);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
  const settlementRate = purch.length?Math.round(settled.length/purch.length*100):0;
  const admins    = users.filter(u=>u.role==="admin").length;

  const resolvePayerName = p => {
    if(p.paidBy?.name) return p.paidBy.name;
    if(p.paidByName) return p.paidByName;
    if(typeof p.paidBy==="string"&&p.paidBy.length<24) return p.paidBy;
    const uid=(p.paidBy?._id?.toString()||(typeof p.paidBy==="string"?p.paidBy:""));
    if(uid){const u=users.find(u=>u._id?.toString()===uid);if(u)return u.name;}
    return null;
  };

  const spenderMap = purch.reduce((a,p)=>{const n=resolvePayerName(p);if(!n)return a;a[n]=(a[n]||0)+(p.totalAmount||p.amount||0);return a;},{});
  const last12 = Array.from({length:12},(_,i)=>{
    const d=new Date();d.setMonth(d.getMonth()-(11-i));
    const mo=d.getMonth(),yr=d.getFullYear();
    const mp=purch.filter(p=>{const pd=new Date(p.date||p.createdAt);return pd.getMonth()===mo&&pd.getFullYear()===yr;});
    const t=mp.reduce((s,p)=>s+(p.totalAmount||p.amount||0),0);
    const s=mp.filter(p=>p.settled).reduce((sv,p)=>sv+(p.totalAmount||p.amount||0),0);
    return {label:d.toLocaleDateString("en-IN",{month:"short"}),total:Math.round(t),settled:Math.round(s),count:mp.length};
  });
  const sparkData  = last12.map(d=>d.total);
  const catSpend   = purch.reduce((a,p)=>{const c=p.category||"Other";a[c]=(a[c]||0)+(p.totalAmount||p.amount||0);return a;},{});
  const CAT_COLORS = [C.orange,C.teal,C.violet,C.green,C.gold,C.pink,C.red];
  const catEntries = Object.entries(catSpend).sort(([,a],[,b])=>b-a);
  const spenders   = Object.entries(spenderMap).sort(([,a],[,b])=>b-a).slice(0,6);
  const lq = q.toLowerCase();
  const fHH    = hh.filter(h=>!lq||(h.name||"").toLowerCase().includes(lq));
  const fUsers = users.filter(u=>!lq||(u.name||"").toLowerCase().includes(lq)||(u.email||"").toLowerCase().includes(lq));
  const fPurch = purch.filter(p=>!lq||(p.description||"").toLowerCase().includes(lq)||(resolvePayerName(p)||"").toLowerCase().includes(lq)||(p.category||"").toLowerCase().includes(lq));

  const TABS = [
    {id:"overview",  icon:"◈", label:"Live Overview",  badge:null},
    {id:"households",icon:"⬡", label:"Households",     badge:hh.length},
    {id:"users",     icon:"◉", label:"Users",          badge:users.length},
    {id:"purchases", icon:"◈", label:"Transactions",   badge:unsettled.length||null},
    {id:"analytics", icon:"◆", label:"Analytics",      badge:null},
    {id:"tools",     icon:"⚙", label:"Tools",          badge:null},
  ];

  const KPICard = ({icon,label,value,sub,color=C.orange,spark,trend,idx=0})=>(
    <div style={{background:C.card,border:`1px solid ${color}18`,borderRadius:20,padding:"20px 22px",flex:1,minWidth:150,position:"relative",overflow:"hidden",transition:"transform .2s,box-shadow .2s",cursor:"default"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 12px 40px ${color}22`;}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}
    >
      <div style={{position:"absolute",top:-30,right:-30,width:80,height:80,borderRadius:"50%",background:`${color}12`,filter:"blur(20px)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${color},transparent)`,opacity:0.5}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div style={{width:36,height:36,borderRadius:10,background:`${color}18`,border:`1px solid ${color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color}}>{icon}</div>
        {trend!==undefined&&<div style={{display:"flex",alignItems:"center",gap:3,fontSize:10,fontWeight:700,color:trend>=0?C.green:C.red,background:trend>=0?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)",padding:"2px 7px",borderRadius:50,border:`1px solid ${trend>=0?C.green:C.red}30`}}>{trend>=0?"↑":"↓"} {Math.abs(trend)}%</div>}
      </div>
      <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.9px",marginBottom:4}}>{label}</div>
      <div style={{fontSize:24,fontWeight:900,color:C.text,letterSpacing:"-0.5px",marginBottom:4,fontFamily:"'DM Mono',monospace"}}>{value}</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
        <span style={{fontSize:11,color:C.dim}}>{sub}</span>
        {spark&&<Sparkline data={spark} color={color}/>}
      </div>
    </div>
  );

  const Btn=({label,onClick,color=C.orange,small=false,icon=""})=>(
    <button onClick={onClick} style={{padding:small?"5px 12px":"9px 16px",borderRadius:10,border:`1px solid ${color}33`,background:`${color}14`,color,cursor:"pointer",fontSize:small?11:12,fontWeight:700,whiteSpace:"nowrap",transition:"all .2s",display:"flex",alignItems:"center",gap:5,fontFamily:"inherit"}}
      onMouseEnter={e=>{e.currentTarget.style.background=`${color}28`;e.currentTarget.style.transform="translateY(-1px)";}}
      onMouseLeave={e=>{e.currentTarget.style.background=`${color}14`;e.currentTarget.style.transform="";}}>
    {icon&&<span>{icon}</span>}{label}</button>
  );

  const Tag=({label,color=C.orange,small=false})=>(<span style={{background:`${color}15`,color,borderRadius:20,padding:small?"2px 8px":"4px 12px",fontSize:small?9:11,fontWeight:700,display:"inline-block",border:`1px solid ${color}28`}}>{label}</span>);
  const Card=({children,style={}})=>(<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,overflow:"hidden",...style}}>{children}</div>);
  const SectionHead=({title,action})=>(<div style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(255,255,255,0.02)"}}><span style={{fontWeight:800,fontSize:13,color:C.text,letterSpacing:"0.3px"}}>{title}</span>{action&&<div>{action}</div>}</div>);

  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"'Plus Jakarta Sans','Segoe UI',sans-serif",background:C.bg,color:C.text}}>

      {/* Toast */}
      {toast&&(<div style={{position:"fixed",top:20,right:20,zIndex:9999,background:toast.ok?"linear-gradient(135deg,#059669,#10B981)":"linear-gradient(135deg,#DC2626,#EF4444)",color:"white",borderRadius:14,padding:"12px 20px",fontWeight:700,fontSize:13,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",animation:"toastIn .3s ease",display:"flex",alignItems:"center",gap:8}}>{toast.msg}</div>)}

      {/* Background mesh */}
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
        <div style={{position:"absolute",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(249,115,22,0.06),transparent 70%)",top:-100,left:-100,filter:"blur(40px)"}}/>
        <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(6,182,212,0.05),transparent 70%)",bottom:-100,right:-100,filter:"blur(40px)"}}/>
      </div>

      {/* Sidebar */}
      <div style={{width:sideExp?240:72,flexShrink:0,position:"relative",zIndex:10,background:C.panel,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",transition:"width 0.3s cubic-bezier(0.4,0,0.2,1)",overflow:"hidden"}}
        onMouseEnter={()=>setSideExp(true)} onMouseLeave={()=>setSideExp(false)}>
        <div style={{padding:"22px 16px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:38,height:38,borderRadius:12,background:GRAD.orange,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,boxShadow:"0 4px 16px rgba(249,115,22,0.45)"}}>⚡</div>
          {sideExp&&(<div style={{animation:"fadeIn .2s ease"}}><div style={{fontWeight:900,fontSize:14,color:C.text,letterSpacing:"-0.3px"}}>Admin Panel</div><div style={{fontSize:10,color:C.muted}}>HomeHub Control</div></div>)}
        </div>
        {sideExp&&(<div style={{padding:"10px 12px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:6,animation:"fadeIn .2s ease"}}>{[{n:hh.length,l:"Homes",c:C.teal},{n:users.length,l:"Users",c:C.violet},{n:purch.length,l:"Txns",c:C.green}].map(({n,l,c})=>(<div key={l} style={{flex:1,textAlign:"center",background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"6px 4px"}}><div style={{fontWeight:900,fontSize:14,color:c,fontFamily:"'DM Mono',monospace"}}>{n}</div><div style={{fontSize:8,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>{l}</div></div>))}</div>)}
        <div style={{padding:"8px",flex:1,overflowY:"auto",overflowX:"hidden"}}>
          {TABS.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 10px",marginBottom:2,cursor:"pointer",background:tab===t.id?"rgba(249,115,22,0.14)":"transparent",border:tab===t.id?`1px solid rgba(249,115,22,0.28)`:"1px solid transparent",borderRadius:12,color:tab===t.id?C.orange:C.muted,fontSize:13,fontWeight:tab===t.id?700:500,textAlign:"left",transition:"all .15s",position:"relative"}}>{tab===t.id&&<div style={{position:"absolute",left:0,top:"20%",bottom:"20%",width:3,borderRadius:"0 3px 3px 0",background:GRAD.orange}}/>}<span style={{fontSize:15,flexShrink:0,width:20,textAlign:"center"}}>{t.icon}</span>{sideExp&&<span style={{flex:1,whiteSpace:"nowrap",overflow:"hidden",animation:"fadeIn .2s ease"}}>{t.label}</span>}{sideExp&&t.badge>0&&<span style={{background:t.id==="purchases"?"#DC2626":C.orange,color:"white",borderRadius:50,fontSize:9,fontWeight:900,padding:"1px 6px",animation:"fadeIn .2s ease",flexShrink:0}}>{t.badge}</span>}</button>))}
        </div>
        {/* Last refresh indicator */}
        {sideExp && lastRefresh && (
          <div style={{padding:"8px 12px",borderTop:`1px solid ${C.border}`,fontSize:9,color:C.dim}}>
            Updated: {lastRefresh.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}
          </div>
        )}
        <div style={{padding:"8px",borderTop:`1px solid ${C.border}`}}>
          <Link to="/dashboard" style={{display:"flex",alignItems:"center",gap:8,padding:"9px 10px",background:"rgba(255,255,255,0.03)",borderRadius:10,color:C.muted,fontSize:12,fontWeight:600,textDecoration:"none",border:`1px solid ${C.border}`,transition:"all .2s"}}>
            <span style={{fontSize:14}}>←</span>
            {sideExp&&<span style={{animation:"fadeIn .2s ease"}}>Back to App</span>}
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div style={{flex:1,overflowY:"auto",padding:"24px 28px",position:"relative",zIndex:1}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
          <div>
            <h1 style={{margin:0,fontSize:22,fontWeight:900,color:C.text,letterSpacing:"-0.5px",fontFamily:"'Syne',sans-serif"}}>{TABS.find(t=>t.id===tab)?.icon} {TABS.find(t=>t.id===tab)?.label}</h1>
            <p style={{margin:"3px 0 0",color:C.muted,fontSize:12}}>
              {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
              {" · "}<span style={{color:C.green,fontWeight:700}}><span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:C.green,marginRight:4}}/>Live</span>
            </p>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{position:"relative"}}>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Search everything…"
                style={{padding:"9px 16px 9px 36px",borderRadius:12,border:`1px solid ${C.border}`,background:"rgba(255,255,255,0.04)",color:C.text,fontSize:12,width:220,outline:"none",fontFamily:"inherit",transition:"border .2s"}}
                onFocus={e=>e.target.style.borderColor=C.orange+"66"} onBlur={e=>e.target.style.borderColor=C.border}/>
              <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:13,pointerEvents:"none",opacity:0.5}}>🔍</span>
            </div>
            <button onClick={()=>loadAll()} style={{padding:"9px 18px",borderRadius:12,background:GRAD.orange,color:"white",border:"none",cursor:"pointer",fontSize:12,fontWeight:700,boxShadow:"0 4px 16px rgba(249,115,22,0.4)",transition:"all .2s",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:14,display:"inline-block",animation:loading?"spin 1s linear infinite":""}}>⟳</span>
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{textAlign:"center",padding:"80px 0",color:C.muted}}>
            <div style={{fontSize:40,animation:"spin 1s linear infinite",marginBottom:12}}>⟳</div>
            Loading data…
          </div>
        ) : (
          <>
            {/* ══ OVERVIEW ══ */}
            {tab==="overview"&&(
              <div style={{display:"flex",flexDirection:"column",gap:20}}>
                <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                  <KPICard idx={0} icon="🏡" label="Households" value={<Counter value={hh.length}/>} sub={`${hh.filter(h=>h.mode==="split").length} in split mode`} color={C.teal} spark={Array.from({length:7},(_,i)=>Math.max(0,hh.length-i)).reverse()}/>
                  <KPICard idx={1} icon="👥" label="Users" value={<Counter value={users.length}/>} sub={`${admins} admin${admins!==1?"s":""}`} color={C.violet} spark={Array.from({length:7},(_,i)=>Math.max(0,users.length-i*2)).reverse()}/>
                  <KPICard idx={2} icon="💰" label="All Time" value={<><span style={{fontSize:14}}>₹</span><Counter value={total}/></>} sub={`${purch.length} transactions`} color={C.orange} spark={sparkData}/>
                  <KPICard idx={3} icon="📅" label="This Month" value={<><span style={{fontSize:14}}>₹</span><Counter value={monthly.reduce((s,p)=>s+(p.totalAmount||p.amount||0),0)}/></>} sub={`${monthly.length} purchases`} color={C.green} trend={5}/>
                  <KPICard idx={4} icon="⏳" label="Unsettled" value={<><span style={{fontSize:14}}>₹</span><Counter value={unsettled.reduce((s,p)=>s+(p.totalAmount||p.amount||0),0)}/></>} sub={`${unsettled.length} pending`} color={C.red}/>
                  <KPICard idx={5} icon="✅" label="Settled" value={<><span style={{fontSize:14}}>₹</span><Counter value={settled.reduce((s,p)=>s+(p.totalAmount||p.amount||0),0)}/></>} sub={`${settled.length} completed`} color={C.green}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:16}}>
                  <Card><SectionHead title="📈 Spend vs Settlement — Last 12 Months" action={<div style={{display:"flex",gap:12,alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.muted}}><div style={{width:20,height:2,background:C.orange,borderRadius:1}}/>Total</div><div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.muted}}><div style={{width:20,height:2,background:C.green,borderRadius:1}}/>Settled</div></div>}/><div style={{padding:"16px 20px 12px"}}><AreaChart data={last12} color1={C.orange} color2={C.green}/></div></Card>
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <Card><SectionHead title="⚡ Settlement Rate"/><div style={{padding:"12px 20px",display:"flex",flexDirection:"column",alignItems:"center"}}><GaugeChart value={settlementRate} size={150}/><div style={{display:"flex",gap:16,marginTop:8}}><div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:900,color:C.green,fontFamily:"'DM Mono',monospace"}}>{settled.length}</div><div style={{fontSize:10,color:C.muted}}>Settled</div></div><div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:900,color:C.red,fontFamily:"'DM Mono',monospace"}}>{unsettled.length}</div><div style={{fontSize:10,color:C.muted}}>Pending</div></div></div></div></Card>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                  <Card><SectionHead title="🏆 Top Spenders"/><div style={{padding:"16px 18px"}}><RacingBar bars={spenders.map(([name,amt],i)=>({label:name,value:Math.round(amt),color:CAT_COLORS[i%CAT_COLORS.length]}))}/>{spenders.length===0&&<p style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>No data yet</p>}</div></Card>
                  <Card><SectionHead title="📊 Spend by Category"/><div style={{padding:"16px 18px",display:"flex",gap:14,alignItems:"center"}}><DonutChart size={130} segments={catEntries.map(([cat,amt],i)=>({label:cat,value:amt,color:CAT_COLORS[i%CAT_COLORS.length]}))}/><div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>{catEntries.slice(0,5).map(([cat,amt],i)=>{const pct=total>0?Math.round(amt/total*100):0;const c=CAT_COLORS[i%CAT_COLORS.length];return(<div key={cat}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:10,fontWeight:600,color:C.text}}>{cat}</span><span style={{fontSize:10,fontWeight:800,color:c}}>{pct}%</span></div><div style={{height:4,background:"rgba(255,255,255,0.05)",borderRadius:2}}><div style={{height:"100%",width:`${Math.max(0,pct)}%`,background:c,borderRadius:2,transition:"width 0.8s ease"}}/></div></div>);})} {catEntries.length===0&&<p style={{color:C.muted,fontSize:12}}>No data</p>}</div></div></Card>
                  <Card><SectionHead title="🗓 Transaction Heatmap"/><div style={{padding:"14px 18px"}}><CalendarHeatmap purchases={purch}/></div></Card>
                </div>
                <Card><SectionHead title="🧾 Recent Transactions"/><div style={{maxHeight:280,overflowY:"auto"}}>{[...purch].sort((a,b)=>new Date(b.date||b.createdAt)-new Date(a.date||a.createdAt)).slice(0,8).map((p,i)=>(<div key={p._id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 20px",borderBottom:`1px solid ${C.border}`,background:i%2?"rgba(255,255,255,0.01)":"transparent",transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(249,115,22,0.04)"} onMouseLeave={e=>e.currentTarget.style.background=i%2?"rgba(255,255,255,0.01)":"transparent"}><div style={{width:36,height:36,borderRadius:10,background:`${C.orange}18`,border:`1px solid ${C.orange}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>🧾</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:13,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.description||p.category}</div><div style={{fontSize:10,color:C.muted}}>by {resolvePayerName(p)||"?"} · {fmt(p.date||p.createdAt)}</div></div><span style={{fontWeight:800,fontSize:13,color:C.orange,fontFamily:"'DM Mono',monospace",flexShrink:0}}>{INR(p.totalAmount||p.amount)}</span><Tag small label={p.settled?"✅ Done":"🔴 Pending"} color={p.settled?C.green:C.red}/></div>))}{purch.length===0&&<p style={{padding:"20px",textAlign:"center",color:C.muted,fontSize:13}}>No purchases yet</p>}</div></Card>
              </div>
            )}

            {/* ══ HOUSEHOLDS ══ */}
            {tab==="households"&&(<div style={{display:"flex",flexDirection:"column",gap:16}}><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>{[{icon:"🏡",label:"Total",value:<Counter value={hh.length}/>,sub:"households",color:C.teal},{icon:"⚖️",label:"Split Mode",value:<Counter value={hh.filter(h=>h.mode==="split").length}/>,sub:"splitting expenses",color:C.orange},{icon:"🤝",label:"Family Mode",value:<Counter value={hh.filter(h=>h.mode!=="split").length}/>,sub:"shared pool",color:C.green}].map((k,i)=><KPICard key={k.label} idx={i} {...k}/>)}</div>{fHH.map(h=>{const hp=purch.filter(p=>(p.householdId?._id||p.householdId)?.toString()===h._id.toString());const hs=hp.reduce((s,p)=>s+(p.totalAmount||p.amount||0),0);const hu=hp.filter(p=>!p.settled).length;const hUsers=users.filter(u=>(u.household?._id||u.household)?.toString()===h._id.toString());return(<Card key={h._id}><div style={{padding:"18px 22px"}}><div style={{display:"flex",alignItems:"flex-start",gap:16}}><div style={{width:46,height:46,borderRadius:14,background:"rgba(6,182,212,0.12)",border:`1px solid ${C.teal}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🏡</div><div style={{flex:1}}><div style={{fontWeight:800,fontSize:15,color:C.text,marginBottom:8}}>{h.name}</div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}><Tag label={`Code: ${h.inviteCode}`} color={C.violet} small/><Tag label={h.mode||"family"} color={h.mode==="split"?C.orange:C.green} small/>{h.monthlyBudget>0&&<Tag label={INR(h.monthlyBudget)+" budget"} color={C.gold} small/>}</div><div style={{display:"flex",gap:10,marginBottom:14}}>{[["Spend",INR(hs),C.orange],["Purchases",hp.length,C.teal],["Unsettled",hu,C.red]].map(([l,v,c])=>(<div key={l} style={{background:`${c}10`,border:`1px solid ${c}20`,borderRadius:10,padding:"8px 14px"}}><div style={{fontSize:9,color:c,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px"}}>{l}</div><div style={{fontSize:16,fontWeight:900,color:c,fontFamily:"'DM Mono',monospace"}}>{v}</div></div>))}</div></div><div style={{display:"flex",gap:8,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}><Btn label="✅ Settle" onClick={()=>settleHH(h._id,h.name)} color={C.green}/><Btn label="💰 Budget" onClick={()=>setBudget(h._id,h.name)} color={C.gold}/><Btn label="🗑 Delete" onClick={()=>deleteHH(h._id,h.name)} color={C.red}/></div></div></div></Card>);})}{fHH.length===0&&<p style={{color:C.muted,textAlign:"center",padding:"40px"}}>No households found</p>}</div>)}

            {/* ══ USERS ══ */}
            {tab==="users"&&(<div style={{display:"flex",flexDirection:"column",gap:16}}><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>{[{icon:"👥",label:"Total Users",value:<Counter value={users.length}/>,sub:"registered",color:C.violet},{icon:"⚡",label:"Admins",value:<Counter value={admins}/>,sub:"permanent",color:C.orange},{icon:"🏡",label:"In Households",value:<Counter value={users.filter(u=>u.household).length}/>,sub:"assigned",color:C.green}].map((k,i)=><KPICard key={k.label} idx={i} {...k}/>)}</div><Card><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{borderBottom:`1px solid ${C.border}`,background:"rgba(255,255,255,0.02)"}}>{["User","Contact","Household","Role","Joined","Actions"].map(h=>(<th key={h} style={{padding:"13px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,letterSpacing:"0.9px",textTransform:"uppercase"}}>{h}</th>))}</tr></thead><tbody>{fUsers.map((u,i)=>{const hn=hh.find(h=>h._id?.toString()===(u.household?._id||u.household)?.toString())?.name||"—";return(<tr key={u._id} style={{borderBottom:`1px solid ${C.border}`,transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(249,115,22,0.04)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><td style={{padding:"12px 16px"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,borderRadius:"50%",background:u.role==="admin"?GRAD.orange:GRAD.violet,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:12,color:"white",flexShrink:0}}>{(u.name||"?")[0].toUpperCase()}</div><span style={{fontWeight:700,fontSize:13,color:C.text}}>{u.name||"—"}</span></div></td><td style={{padding:"12px 16px",color:C.muted,fontSize:12}}>{u.email||u.phone||"—"}</td><td style={{padding:"12px 16px"}}><Tag label={hn} color={C.teal} small/></td><td style={{padding:"12px 16px"}}><Tag label={u.role==="admin"?"⚡ Admin":"👤 Member"} color={u.role==="admin"?C.orange:C.dim} small/></td><td style={{padding:"12px 16px",color:C.muted,fontSize:11}}>{fmt(u.createdAt)}</td><td style={{padding:"12px 16px"}}><div style={{display:"flex",gap:6}}>{u.role!=="admin"&&<Btn small label="⚡ Make Admin" onClick={()=>makeAdmin(u._id,u.name)} color={C.orange}/>}<Btn small label="🗑" onClick={()=>deleteUser(u._id,u.name)} color={C.red}/></div></td></tr>);})} {fUsers.length===0&&<tr><td colSpan={6} style={{padding:24,textAlign:"center",color:C.muted}}>No users found</td></tr>}</tbody></table></div></Card></div>)}

            {/* ══ TRANSACTIONS ══ */}
            {tab==="purchases"&&(<div style={{display:"flex",flexDirection:"column",gap:16}}><div style={{display:"flex",gap:12,flexWrap:"wrap"}}><KPICard idx={0} icon="💳" label="Total" value={<Counter value={purch.length}/>} sub="transactions" color={C.teal}/><KPICard idx={1} icon="🔴" label="Pending" value={<Counter value={unsettled.length}/>} sub={INR(unsettled.reduce((s,p)=>s+(p.totalAmount||p.amount||0),0))} color={C.red}/><KPICard idx={2} icon="✅" label="Settled" value={<Counter value={settled.length}/>} sub={INR(settled.reduce((s,p)=>s+(p.totalAmount||p.amount||0),0))} color={C.green}/><KPICard idx={3} icon="💰" label="All Time" value={<><span style={{fontSize:14}}>₹</span><Counter value={total}/></>} sub="total spend" color={C.orange}/></div><Card><div style={{overflowX:"auto",maxHeight:520,overflowY:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead style={{position:"sticky",top:0,background:C.panel,zIndex:2}}><tr style={{borderBottom:`1px solid ${C.border}`}}>{["Description","Category","Paid By","Amount","Date","Status","Actions"].map(h=>(<th key={h} style={{padding:"13px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,letterSpacing:"0.9px",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>))}</tr></thead><tbody>{[...fPurch].sort((a,b)=>new Date(b.date||b.createdAt)-new Date(a.date||a.createdAt)).map((p,i)=>(<tr key={p._id} style={{borderBottom:`1px solid ${C.border}`,transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(249,115,22,0.04)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><td style={{padding:"11px 14px",maxWidth:180}}><div style={{fontWeight:600,fontSize:12,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.description||p.category}</div>{(p.items?.length||0)>0&&<div style={{fontSize:10,color:C.muted}}>{p.items.length} items</div>}</td><td style={{padding:"11px 14px"}}><Tag small label={p.category||"Other"} color={C.gold}/></td><td style={{padding:"11px 14px",fontSize:12,fontWeight:600,color:C.text}}>{resolvePayerName(p)||<span style={{color:C.red,fontSize:11}}>⚠ No payer</span>}</td><td style={{padding:"11px 14px",fontWeight:800,fontSize:12,color:C.orange,whiteSpace:"nowrap",fontFamily:"'DM Mono',monospace"}}>{INR(p.totalAmount||p.amount)}</td><td style={{padding:"11px 14px",fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{fmt(p.date||p.createdAt)}</td><td style={{padding:"11px 14px"}}><Tag small label={p.settled?"✅ Settled":"🔴 Pending"} color={p.settled?C.green:C.red}/></td><td style={{padding:"11px 14px"}}><div style={{display:"flex",gap:6}}>{!p.settled&&<Btn small label="✅" onClick={()=>settlePurch(p._id)} color={C.green}/>}<Btn small label="🗑" onClick={()=>deletePurch(p._id)} color={C.red}/></div></td></tr>))}{fPurch.length===0&&<tr><td colSpan={7} style={{padding:24,textAlign:"center",color:C.muted}}>No transactions found</td></tr>}</tbody></table></div></Card></div>)}

            {/* ══ ANALYTICS ══ */}
            {tab==="analytics"&&(<div style={{display:"flex",flexDirection:"column",gap:16}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}><Card><SectionHead title="📈 Monthly Spend Trend (12 Months)"/><div style={{padding:"16px 20px 12px"}}><AreaChart data={last12} color1={C.orange} color2={C.green}/></div></Card><Card><SectionHead title="🎯 Member Activity Radar"/><div style={{padding:"16px 20px",display:"flex",flexDirection:"column",alignItems:"center"}}><RadarChart members={users.slice(0,4)} purchases={purch} size={200}/><div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center",marginTop:8}}>{users.slice(0,4).map((u,i)=>(<div key={u._id} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.muted}}><div style={{width:10,height:10,borderRadius:"50%",background:[C.orange,C.teal,C.violet,C.green][i]}}/>{u.name}</div>))}</div></div></Card></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}><Card><SectionHead title="📊 Category Breakdown"/><div style={{padding:"16px 18px",display:"flex",gap:14,alignItems:"center"}}><DonutChart size={140} segments={catEntries.map(([cat,amt],i)=>({label:cat,value:amt,color:CAT_COLORS[i%CAT_COLORS.length]}))}/><div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>{catEntries.slice(0,5).map(([cat,amt],i)=>{const pct=total>0?Math.round(amt/total*100):0;const c=CAT_COLORS[i%CAT_COLORS.length];return(<div key={cat}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:10,fontWeight:600,color:C.text}}>{cat}</span><span style={{fontSize:10,fontWeight:800,color:c}}>{pct}%</span></div><div style={{height:4,background:"rgba(255,255,255,0.05)",borderRadius:2}}><div style={{height:"100%",width:`${Math.max(0,pct)}%`,background:c,borderRadius:2,transition:"width 0.8s ease"}}/></div></div>);})} {catEntries.length===0&&<p style={{color:C.muted,fontSize:12}}>No data</p>}</div></div></Card><Card><SectionHead title="🏆 Top Spenders"/><div style={{padding:"16px 18px"}}><RacingBar bars={spenders.map(([name,amt],i)=>({label:name,value:Math.round(amt),color:CAT_COLORS[i%CAT_COLORS.length]}))}/>{spenders.length===0&&<p style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>No data yet</p>}</div></Card><Card><SectionHead title="🏡 Household Comparison"/><div style={{padding:"16px 18px"}}><RacingBar bars={hh.map((h,i)=>{const hs=purch.filter(p=>(p.householdId?._id||p.householdId)?.toString()===h._id.toString()).reduce((s,p)=>s+(p.totalAmount||p.amount||0),0);return{label:h.name||"HH",value:Math.round(hs),color:CAT_COLORS[i%CAT_COLORS.length]};})} />{hh.length===0&&<p style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>No households</p>}</div></Card></div><Card><SectionHead title="🗓 Transaction Activity Heatmap — 13 Weeks"/><div style={{padding:"16px 22px"}}><CalendarHeatmap purchases={purch}/></div></Card></div>)}

            {/* ══ TOOLS ══ */}
            {tab==="tools"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>{[{icon:"✅",title:"Settle All Globally",desc:"Mark ALL purchases as settled across every household.",btn:"✅ Settle All",color:C.green,action:settleAll},{icon:"📥",title:"Export CSV",desc:"Download all purchase data as a spreadsheet.",btn:"📥 Download CSV",color:C.teal,action:exportCSV},{icon:"🔄",title:"Refresh All Data",desc:"Force reload all households, users and transactions from the server.",btn:"🔄 Reload",color:C.violet,action:()=>loadAll()},{icon:"📊",title:"System Stats",desc:`${hh.length} households · ${users.length} users · ${purch.length} transactions · ${INR(total)} total · ${settlementRate}% settled`}].map(({icon,title,desc,btn,color=C.orange,action})=>(<div key={title} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:28,transition:"all .2s"}} onMouseEnter={e=>{if(btn){e.currentTarget.style.borderColor=`${color}44`;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 32px ${color}18`;}}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}><div style={{width:52,height:52,borderRadius:14,background:`${color||C.orange}18`,border:`1px solid ${color||C.orange}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,marginBottom:16}}>{icon}</div><h3 style={{margin:"0 0 8px",fontWeight:800,fontSize:16,color:C.text}}>{title}</h3><p style={{color:C.muted,fontSize:13,margin:"0 0 22px",lineHeight:1.6}}>{desc}</p>{btn&&(<button onClick={action} style={{padding:"10px 20px",borderRadius:12,border:`1px solid ${color}33`,background:`${color}14`,color,cursor:"pointer",fontSize:13,fontWeight:700,transition:"all .2s",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}} onMouseEnter={e=>e.currentTarget.style.background=`${color}28`} onMouseLeave={e=>e.currentTarget.style.background=`${color}14`}>{btn}</button>)}</div>))}</div>)}
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes toastIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:none}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        input::placeholder{color:rgba(248,250,255,0.2)}
        input:focus{outline:none!important}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:rgba(255,255,255,0.02)}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
        *{box-sizing:border-box}
      `}</style>
    </div>
  );
}