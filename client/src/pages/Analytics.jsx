import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

/* ─── SVG Line Chart ───────────────────────────────────────────────────────── */
function LineChart({ data, color="#ff6b2b", height=140, label="" }) {
  if (!data || data.length === 0) return null;
  const W = 500, H = height;
  const pad = { top:20, right:16, bottom:30, left:48 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const maxV = Math.max(...data.map(d=>d.value), 1);
  const pts = data.map((d,i) => ({
    x: pad.left + (i / Math.max(data.length-1,1)) * innerW,
    y: pad.top + innerH - (d.value / maxV) * innerH,
    ...d,
  }));
  const polyline = pts.map(p=>`${p.x},${p.y}`).join(" ");
  const area = [
    `${pts[0].x},${pad.top+innerH}`,
    ...pts.map(p=>`${p.x},${p.y}`),
    `${pts[pts.length-1].x},${pad.top+innerH}`,
  ].join(" ");
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    v: Math.round(f * maxV),
    y: pad.top + innerH - f * innerH,
  }));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:`${H}px`,overflow:"visible"}}>
      <defs>
        <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {yTicks.map((t,i) => (
        <g key={i}>
          <line x1={pad.left} y1={t.y} x2={W-pad.right} y2={t.y} stroke="#f0ebe5" strokeWidth="1"/>
          <text x={pad.left-6} y={t.y+4} textAnchor="end" fontSize="9" fill="#b0a090">{t.v>=1000?`${(t.v/1000).toFixed(1)}k`:t.v}</text>
        </g>
      ))}
      {/* Area fill */}
      <polygon points={area} fill={`url(#grad-${label})`}/>
      {/* Line */}
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Dots + labels */}
      {pts.map((p,i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={p.value>0?4:2} fill={p.value>0?color:"#e8e0d8"} stroke="white" strokeWidth="2"/>
          <text x={p.x} y={H-4} textAnchor="middle" fontSize="9" fill="#9c8672" fontWeight="600">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

/* ─── SVG Donut Chart ──────────────────────────────────────────────────────── */
function DonutChart({ segments, size=180 }) {
  if (!segments || segments.length === 0) return null;
  const total = segments.reduce((s,seg)=>s+seg.value,0);
  if (total === 0) return null;
  const cx = size/2, cy = size/2, r = size*0.38, inner = size*0.23;
  let cumAngle = -Math.PI/2;
  const paths = segments.map(seg => {
    const angle = (seg.value/total) * 2 * Math.PI;
    const x1 = cx + r*Math.cos(cumAngle);
    const y1 = cy + r*Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r*Math.cos(cumAngle);
    const y2 = cy + r*Math.sin(cumAngle);
    const ix1 = cx + inner*Math.cos(cumAngle-angle);
    const iy1 = cy + inner*Math.sin(cumAngle-angle);
    const ix2 = cx + inner*Math.cos(cumAngle);
    const iy2 = cy + inner*Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    const d = `M${ix1},${iy1} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${ix2},${iy2} A${inner},${inner} 0 ${large},0 ${ix1},${iy1} Z`;
    return { ...seg, d, pct: Math.round(seg.value/total*100) };
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{width:`${size}px`,height:`${size}px`,flexShrink:0}}>
      {paths.map((p,i)=>(
        <path key={i} d={p.d} fill={p.color} stroke="white" strokeWidth="2">
          <title>{p.label}: {p.pct}%</title>
        </path>
      ))}
    </svg>
  );
}

/* ─── SVG Bar Chart ────────────────────────────────────────────────────────── */
function BarChart({ bars, height=120, color="#ff6b2b" }) {
  if (!bars || bars.length === 0) return null;
  const W = 500, H = height;
  const pad = { top:20, right:8, bottom:28, left:44 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const maxV = Math.max(...bars.map(b=>b.value), 1);
  const bw = Math.max(4, (innerW/bars.length)*0.6);
  const gap = innerW/bars.length;
  const yTicks = [0,0.5,1].map(f=>({v:Math.round(f*maxV),y:pad.top+innerH-f*innerH}));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:`${H}px`}}>
      {yTicks.map((t,i)=>(
        <g key={i}>
          <line x1={pad.left} y1={t.y} x2={W-pad.right} y2={t.y} stroke="#f0ebe5" strokeWidth="1"/>
          <text x={pad.left-6} y={t.y+4} textAnchor="end" fontSize="9" fill="#b0a090">{t.v>=1000?`${(t.v/1000).toFixed(0)}k`:t.v}</text>
        </g>
      ))}
      {bars.map((b,i)=>{
        const x = pad.left + i*gap + gap/2 - bw/2;
        const bh = Math.max(2, (b.value/maxV)*innerH);
        const y = pad.top + innerH - bh;
        const c = b.color || color;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} rx="4" fill={c} opacity="0.9"/>
            {b.value>0&&<text x={x+bw/2} y={y-4} textAnchor="middle" fontSize="8" fill="#9c8672" fontWeight="700">{b.value>=1000?`${(b.value/1000).toFixed(0)}k`:b.value}</text>}
            <text x={x+bw/2} y={H-4} textAnchor="middle" fontSize="9" fill="#9c8672" fontWeight="600">{b.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

const INR = n => `₹${(n||0).toLocaleString("en-IN")}`;
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CAT_META = {
  Grocery:      { icon:"🛒", color:"#2d7a4f" },
  Food:         { icon:"🍛", color:"#d32f2f" },
  Bills:        { icon:"💡", color:"#1565c0" },
  Entertainment:{ icon:"🎬", color:"#7c3aed" },
  Travel:       { icon:"✈️", color:"#e67e22" },
  Other:        { icon:"📦", color:"#5c4a35" },
};
const CATS = Object.keys(CAT_META);

function MiniBar({ value, max, color, height = 8 }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ background: "rgba(0,0,0,0.06)", borderRadius: "99px", height: `${height}px`, overflow: "hidden", flex: 1 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color || "#ff6b2b", borderRadius: "99px", transition: "width 0.7s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function Stat({ icon, label, value, sub, accent = "#ff6b2b" }) {
  return (
    <div style={{background: "white", borderRadius: "18px", padding: "20px 22px",boxShadow: "0 2px 14px rgba(139,94,60,0.07)", borderTop: `3px solid ${accent}`,}}>
      <div style={{ fontSize: "22px", marginBottom: "8px" }}>{icon}</div>
      <div style={{ fontSize: "11px", fontWeight: "700", color: "#9c8672", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "24px", fontWeight: "900", color: "#1a1410", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: "11px", color: "#c8b8a8", marginTop: "4px" }}>{sub}</div>}
    </div>
  );
}

export default function Analytics() {
  const [loading, setLoading]   = useState(true);
  const [household, setHH]      = useState(null);
  const [members, setMembers]   = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [filter, setFilter]     = useState("all"); // all | month | category
  const [selCat, setSelCat]     = useState("All");
  const [selMonth, setSelMonth] = useState(-1);    // -1 = all
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const now = new Date();

  useEffect(() => {
    (async () => {
      try {
        const hhRes = await axios.get(`${API}/household/myhousehold`, { headers });
        const hh = hhRes.data;
        setHH(hh);
        const [mRes, pRes] = await Promise.all([
          axios.get(`${API}/household/members/${hh._id}`, { headers }),
          axios.get(`${API}/purchase/${hh._id}`, { headers }),
        ]);
        setMembers(mRes.data || []);
        setPurchases((pRes.data || []).sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt)));
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  // ── Filtered purchases ──────────────────────────────────────────────────
  let fp = [...purchases];
  if (selMonth >= 0) {
    fp = fp.filter(p => {
      const d = new Date(p.date || p.createdAt);
      return d.getMonth() === selMonth && d.getFullYear() === now.getFullYear();
    });
  }
  if (selCat !== "All") fp = fp.filter(p => p.category === selCat);

  const total        = fp.reduce((s, p) => s + (p.totalAmount || p.amount || 0), 0);
  const allTotal     = purchases.reduce((s, p) => s + (p.totalAmount || p.amount || 0), 0);
  const monthPurchases = purchases.filter(p => {
    const d = new Date(p.date || p.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTotal   = monthPurchases.reduce((s, p) => s + (p.totalAmount || p.amount || 0), 0);
  const budget       = household?.monthlyBudget || household?.budget || 0;
  const budgetUsed   = budget > 0 ? Math.min(100, Math.round((monthTotal / budget) * 100)) : 0;
  const unsettled    = purchases.filter(p => !p.settled).reduce((s, p) => s + (p.totalAmount || p.amount || 0), 0);

  // ── Category breakdown (filtered) ──────────────────────────────────────
  const byCat = CATS.map(cat => ({
    cat,
    ...CAT_META[cat],
    total: fp.filter(p => p.category === cat).reduce((s, p) => s + (p.totalAmount || p.amount || 0), 0),
    count: fp.filter(p => p.category === cat).length,
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  const catMax = byCat[0]?.total || 1;

  // ── Monthly trend — full year ───────────────────────────────────────────
  const monthly = MONTHS_SHORT.map((label, i) => ({
    label,
    month: i,
    total: purchases.filter(p => {
      const d = new Date(p.date || p.createdAt);
      return d.getMonth() === i && d.getFullYear() === now.getFullYear();
    }).reduce((s, p) => s + (p.totalAmount || p.amount || 0), 0),
    count: purchases.filter(p => {
      const d = new Date(p.date || p.createdAt);
      return d.getMonth() === i && d.getFullYear() === now.getFullYear();
    }).length,
  }));
  const monthMax = Math.max(...monthly.map(m => m.total), 1);

  // ── Member spending ─────────────────────────────────────────────────────
  const memberSpend = members.map(m => ({
    ...m,
    total: fp.filter(p => (p.paidBy?._id || p.paidBy) === m._id).reduce((s, p) => s + (p.totalAmount || p.amount || 0), 0),
    count: fp.filter(p => (p.paidBy?._id || p.paidBy) === m._id).length,
  })).sort((a, b) => b.total - a.total);
  const memberMax = memberSpend[0]?.total || 1;

  // ── Extra derived stats ──────────────────────────────────────────────────
  const daysInMonth  = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const daysPassed   = now.getDate();
  const avgPerDay    = daysPassed > 0 ? Math.round(monthTotal / daysPassed) : 0;
  const projected    = Math.round(avgPerDay * daysInMonth);
  const savings      = budget > 0 ? Math.max(0, budget - monthTotal) : 0;
  const settledAmt   = purchases.filter(p=>p.settled).reduce((s,p)=>s+(p.totalAmount||p.amount||0),0);
  const settlePct    = allTotal > 0 ? Math.round(settledAmt/allTotal*100) : 0;
  const avgPurchase  = purchases.length > 0 ? Math.round(allTotal / purchases.length) : 0;

  // ── Recent transactions ─────────────────────────────────────────────────
  const recent = [...fp].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)).slice(0, 10);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"80vh", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:"48px", marginBottom:"14px" }}>📊</div>
        <p style={{ color:"#9c8672", fontWeight:"600" }}>Loading analytics…</p>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      {/* HERO */}
      <div style={s.hero}>
        <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1400&q=80" alt="" style={s.heroBg} />
        <div style={s.heroOvl} />
        <div style={s.heroContent}>
          <div>
            <h1 style={s.heroTitle}>Analytics</h1>
            <p style={s.heroSub}>{household?.name} · Full purchase history · {purchases.length} transactions</p>
          </div>
          <div style={s.heroStats}>
            <div style={s.hStat}><span style={s.hNum}>{INR(allTotal)}</span><span style={s.hLab}>All Time</span></div>
            <div style={s.hStat}><span style={{ ...s.hNum, color: "#c9a96e" }}>{INR(monthTotal)}</span><span style={s.hLab}>This Month</span></div>
            <div style={s.hStat}><span style={{ ...s.hNum, color: unsettled > 0 ? "#ef9a9a" : "#a5d6a7" }}>{INR(unsettled)}</span><span style={s.hLab}>Unsettled</span></div>
          </div>
        </div>
      </div>

      <div style={s.body}>
        {/* FILTERS */}
        <div style={s.filterRow}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", flex:1, flexWrap:"wrap" }}>
            <span style={{ fontSize:"11px", fontWeight:"700", color:"#9c8672", textTransform:"uppercase", letterSpacing:"0.05em" }}>Filter:</span>
            <select value={selCat} onChange={e => setSelCat(e.target.value)} style={s.sel}>
              <option value="All">All Categories</option>
              {CATS.map(c => <option key={c} value={c}>{CAT_META[c].icon} {c}</option>)}
            </select>
            <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))} style={s.sel}>
              <option value={-1}>All Months ({now.getFullYear()})</option>
              {MONTHS_SHORT.map((m, i) => <option key={i} value={i}>{m} {now.getFullYear()}</option>)}
            </select>
            {(selCat !== "All" || selMonth >= 0) && (
              <button onClick={() => { setSelCat("All"); setSelMonth(-1); }} style={s.clearBtn}>✕ Clear</button>
            )}
          </div>
          <div style={{ fontSize:"12px", color:"#9c8672" }}>Showing <b style={{ color:"#ff6b2b" }}>{fp.length}</b> of {purchases.length} purchases · {INR(total)}</div>
        </div>

        {/* SUMMARY CARDS */}
        <div style={s.grid4}>
          <Stat icon="💰" label="Total Spend" value={INR(allTotal)} sub={`${purchases.length} purchases`} accent="#ff6b2b" />
          <Stat icon="📅" label="This Month" value={INR(monthTotal)} sub={`${monthPurchases.length} purchases`} accent="#2d7a4f" />
          <Stat icon="📊" label="Budget Used" value={budget > 0 ? `${budgetUsed}%` : "—"} sub={budget > 0 ? `of ${INR(budget)}` : "No budget set"} accent={budgetUsed >= 100 ? "#d32f2f" : budgetUsed >= 80 ? "#e67e22" : "#1565c0"} />
          <Stat icon="🔴" label="Unsettled" value={INR(unsettled)} sub={`${purchases.filter(p=>!p.settled).length} pending`} accent="#d32f2f" />
          <Stat icon="📈" label="Avg / Day" value={INR(avgPerDay)} sub={`Projected ${INR(projected)} this month`} accent="#7c3aed" />
          <Stat icon="🏦" label="Avg Purchase" value={INR(avgPurchase)} sub={`${settlePct}% of spend settled`} accent="#1565c0" />
          <Stat icon="💚" label="Savings Left" value={budget>0?INR(savings):"—"} sub={budget>0?`${Math.max(0,100-budgetUsed)}% of budget`:"Set a budget"} accent="#059669" />
        </div>

        {/* BUDGET PROGRESS */}
        {budget > 0 && (
          <div style={s.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
              <div>
                <h3 style={s.cardTitle}>📊 Monthly Budget</h3>
                <p style={{ fontSize:"12px", color:"#9c8672", margin:"3px 0 0" }}>{INR(monthTotal)} spent of {INR(budget)} budget</p>
              </div>
              <span style={{padding:"4px 12px", borderRadius:"50px", fontSize:"12px", fontWeight:"700",background: budgetUsed >= 100 ? "rgba(211,47,47,0.1)" : budgetUsed >= 80 ? "rgba(230,126,34,0.1)" : "rgba(45,122,79,0.1)",color: budgetUsed >= 100 ? "#d32f2f" : budgetUsed >= 80 ? "#e67e22" : "#2d7a4f",}}>
                {budgetUsed >= 100 ? "⚠️ Over budget" : budgetUsed >= 80 ? "🔶 Near limit" : "✅ On track"}
              </span>
            </div>
            <div style={{ background:"rgba(0,0,0,0.06)", borderRadius:"99px", height:"12px", overflow:"hidden" }}>
              <div style={{width: `${budgetUsed}%`, height:"100%", borderRadius:"99px", transition:"width 0.7s ease",background: budgetUsed >= 100 ? "linear-gradient(90deg,#d32f2f,#ef5350)" : budgetUsed >= 80 ? "linear-gradient(90deg,#e67e22,#ffa726)" : "linear-gradient(90deg,#ff6b2b,#ff8c54)",}} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:"8px" }}>
              <span style={{ fontSize:"11px", color:"#9c8672" }}>Remaining: <b style={{ color: budget - monthTotal >= 0 ? "#2d7a4f" : "#d32f2f" }}>{INR(Math.abs(budget - monthTotal))} {budget - monthTotal < 0 ? "over" : "left"}</b></span>
              <span style={{ fontSize:"11px", color:"#9c8672" }}>{budgetUsed}% used</span>
            </div>
          </div>
        )}

        {/* ── LINE CHART: Monthly Trend ── */}
        <div style={s.card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div>
              <h3 style={{...s.cardTitle,marginBottom:2}}>📈 Monthly Spending Trend — {now.getFullYear()}</h3>
              <p style={{fontSize:12,color:"#9c8672",margin:0}}>Click a month to filter the view below</p>
            </div>
            <div style={{display:"flex",gap:6}}>
              {selMonth>=0 && (
                <button onClick={()=>setSelMonth(-1)} style={{padding:"5px 12px",borderRadius:8,border:"1px solid rgba(255,107,43,0.2)",background:"rgba(255,107,43,0.06)",color:"#ff6b2b",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                  ✕ Clear filter
                </button>
              )}
            </div>
          </div>
          <LineChart
            label="monthly"
            height={150}
            color="#ff6b2b"
            data={monthly.map(m=>({
              label:m.label,
              value:m.total,
              active:m.month===selMonth,
            }))}
          />
          <div style={{display:"flex",gap:5,marginTop:12}}>
            {monthly.map(m=>(
              <button key={m.month} onClick={()=>setSelMonth(selMonth===m.month?-1:m.month)}
                style={{flex:1,padding:"5px 2px",borderRadius:6,border:"none",cursor:"pointer",fontSize:9,fontWeight:700,background:selMonth===m.month?"#ff6b2b":m.month===now.getMonth()?"rgba(255,107,43,0.12)":"rgba(0,0,0,0.04)",color:selMonth===m.month?"white":m.month===now.getMonth()?"#ff6b2b":"#9c8672",}}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div style={s.grid2}>
          {/* CATEGORY DONUT + BARS */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>🏷️ Spending by Category</h3>
            {byCat.length === 0
              ? <p style={{color:"#9c8672",fontSize:13,marginTop:14}}>No data for selected filter</p>
              : (<>
                  <div style={{display:"flex",alignItems:"center",gap:20,margin:"16px 0 14px"}}>
                    <DonutChart
                      size={150}
                      segments={byCat.map(c=>({label:`${c.icon} ${c.cat}`,value:c.total,color:c.color}))}
                    />
                    <div style={{flex:1,display:"flex",flexDirection:"column",gap:7}}>
                      {byCat.map(c=>{
                        const pct = allTotal>0?Math.round(c.total/allTotal*100):0;
                        return (
                          <div key={c.cat} style={{cursor:"pointer"}} onClick={()=>setSelCat(selCat===c.cat?"All":c.cat)}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                              <span style={{fontSize:12,fontWeight:700,color:selCat===c.cat?c.color:"#5c4a35"}}>{c.icon} {c.cat}</span>
                              <span style={{fontSize:12,fontWeight:800,color:c.color}}>{pct}%</span>
                            </div>
                            <div style={{height:5,background:"rgba(0,0,0,0.05)",borderRadius:3,overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${pct}%`,background:c.color,borderRadius:3,transition:"width 0.6s ease"}}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <p style={{fontSize:10,color:"#c8b8a8",margin:0}}>Click a category to filter transactions below</p>
                </>)
            }
          </div>

          {/* WHO SPENT BAR CHART */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>👥 Member Spending</h3>
            {memberSpend.filter(m=>m.total>0).length===0
              ? <p style={{color:"#9c8672",fontSize:13,marginTop:14}}>No data yet</p>
              : (<>
                  <BarChart
                    height={140}
                    bars={memberSpend.filter(m=>m.total>0).map((m,i)=>({
                      label:(m.name||"?").split(" ")[0],
                      value:Math.round(m.total),
                      color:["#ff6b2b","#2d7a4f","#1565c0","#7c3aed","#e67e22"][i%5],
                    }))}
                  />
                  <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:12}}>
                    {memberSpend.filter(m=>m.total>0).map((m,i)=>(
                      <div key={m._id} style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${["#ff6b2b","#2d7a4f","#1565c0","#7c3aed","#e67e22"][i%5]},${["#ff8c54","#43a564","#1976d2","#9c27b0","#ffa726"][i%5]})`,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:12}}>
                          {(m.name||"?")[0].toUpperCase()}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                            <span style={{fontSize:12,fontWeight:700,color:"#1a1410"}}>{m.name}</span>
                            <span style={{fontSize:12,fontWeight:800,color:["#ff6b2b","#2d7a4f","#1565c0","#7c3aed","#e67e22"][i%5]}}>{INR(m.total)}</span>
                          </div>
                          <MiniBar value={m.total} max={memberMax} color={["#ff6b2b","#2d7a4f","#1565c0","#7c3aed","#e67e22"][i%5]} height={5}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </>)
            }
          </div>
        </div>

        {/* MEMBER SPENDING */}
        {memberSpend.filter(m => m.total > 0).length > 0 && (
          <div style={s.card}>
            <h3 style={s.cardTitle}>👥 Who Spent What</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:"12px", marginTop:"14px" }}>
              {memberSpend.map((m, i) => (
                <div key={m._id} style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                  <div style={{ width:"34px", height:"34px", borderRadius:"50%", background:`linear-gradient(135deg,${["#ff6b2b","#2d7a4f","#1565c0","#7c3aed","#e67e22"][i % 5]},${["#ff8c54","#43a564","#1976d2","#9c27b0","#ffa726"][i % 5]})`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:"800", fontSize:"14px", flexShrink:0 }}>
                    {(m.name || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                      <span style={{ fontSize:"13px", fontWeight:"700", color:"#1a1410" }}>{m.name}</span>
                      <div>
                        <span style={{ fontSize:"13px", fontWeight:"800", color:"#ff6b2b" }}>{INR(m.total)}</span>
                        <span style={{ fontSize:"10px", color:"#9c8672", marginLeft:"6px" }}>{m.count} payments</span>
                      </div>
                    </div>
                    <MiniBar value={m.total} max={memberMax} color={["#ff6b2b","#2d7a4f","#1565c0","#7c3aed","#e67e22"][i % 5]} height={7} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RECENT TRANSACTIONS */}
        <div style={s.card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <h3 style={s.cardTitle}>🕐 Recent Transactions</h3>
            <span style={{ fontSize:"12px", color:"#9c8672" }}>{fp.length} total</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginTop:"14px" }}>
            {recent.map(p => {
              const amt = p.totalAmount || p.amount || 0;
              const date = new Date(p.date || p.createdAt);
              const payer = members.find(m => m._id === (p.paidBy?._id || p.paidBy))?.name || p.paidBy?.name || "Unknown";
              const meta = CAT_META[p.category] || CAT_META.Other;
              return (
                <div key={p._id} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 14px", background:"#fdf8f3", borderRadius:"12px" }}>
                  <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:`${meta.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0 }}>
                    {meta.icon}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:"13px", fontWeight:"700", color:"#1a1410", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {p.description || p.category}
                    </div>
                    <div style={{ fontSize:"11px", color:"#9c8672" }}>
                      {payer} · {date.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                    </div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:"14px", fontWeight:"800", color: p.settled ? "#9c8672" : "#ff6b2b" }}>{INR(amt)}</div>
                    <div style={{ fontSize:"10px", fontWeight:"700", color: p.settled ? "#2d7a4f" : "#d32f2f" }}>
                      {p.settled ? "✅" : "🔴"}
                    </div>
                  </div>
                </div>
              );
            })}
            {recent.length === 0 && (
              <div style={{ textAlign:"center", padding:"30px", color:"#9c8672" }}>
                <span style={{ fontSize:"36px", display:"block", marginBottom:"8px" }}>📊</span>
                No transactions match the current filter.
              </div>
            )}
          </div>
        </div>

        {/* INSIGHTS */}
        {purchases.length > 0 && (
          <div style={s.card}>
            <h3 style={s.cardTitle}>💡 Insights</h3>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"12px", marginTop:"14px" }}>
              {[
                {
                  icon:"🏆",
                  label:"Top Category",
                  value: byCat[0] ? `${byCat[0].icon} ${byCat[0].cat}` : "—",
                  sub: byCat[0] ? INR(byCat[0].total) : "",
                  accent: byCat[0]?.color || "#ff6b2b",
                },
                {
                  icon:"💳",
                  label:"Top Spender",
                  value: memberSpend[0]?.name || "—",
                  sub: memberSpend[0] ? INR(memberSpend[0].total) : "",
                  accent:"#7c3aed",
                },
                {
                  icon:"📈",
                  label:"Best Month",
                  value: MONTHS_SHORT[monthly.reduce((best, m) => m.total > monthly[best].total ? monthly.indexOf(m) : best, 0)] || "—",
                  sub: INR(Math.max(...monthly.map(m => m.total))),
                  accent:"#2d7a4f",
                },
                {
                  icon:"📊",
                  label:"Avg Per Month",
                  value: INR(Math.round(allTotal / Math.max(1, monthly.filter(m => m.total > 0).length))),
                  sub: `${purchases.length} total purchases`,
                  accent:"#1565c0",
                },
              ].map(ins => (
                <div key={ins.label} style={{ background:"#fdf8f3", borderRadius:"14px", padding:"16px", borderLeft:`3px solid ${ins.accent}` }}>
                  <div style={{ fontSize:"20px", marginBottom:"6px" }}>{ins.icon}</div>
                  <div style={{ fontSize:"10px", fontWeight:"700", color:"#9c8672", textTransform:"uppercase", letterSpacing:"0.05em" }}>{ins.label}</div>
                  <div style={{ fontSize:"15px", fontWeight:"800", color:"#1a1410", marginTop:"3px" }}>{ins.value}</div>
                  {ins.sub && <div style={{ fontSize:"11px", color:"#9c8672", marginTop:"2px" }}>{ins.sub}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        select:focus { outline: none; border-color: #ff6b2b !important; }
      `}</style>
    </div>
  );
}

const s = {
  page: { fontFamily:"'Plus Jakarta Sans',sans-serif", background:"#f7f3ee", minHeight:"100vh" },
  hero: { position:"relative", height:"200px", overflow:"hidden" },
  heroBg: { position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" },
  heroOvl: { position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(26,20,16,0.92),rgba(45,30,16,0.78))" },
  heroContent: { position:"relative", zIndex:2, height:"100%", padding:"28px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" },
  heroTitle: { fontFamily:"'Playfair Display',serif", fontSize:"clamp(24px,3vw,36px)", fontWeight:"800", color:"white", margin:"0 0 6px" },
  heroSub: { fontSize:"13px", color:"rgba(255,255,255,0.55)", margin:0, fontWeight:"500" },
  heroStats: { display:"flex", gap:"24px" },
  hStat: { display:"flex", flexDirection:"column", gap:"2px", alignItems:"center" },
  hNum: { fontSize:"18px", fontWeight:"900", color:"white" },
  hLab: { fontSize:"9px", color:"rgba(255,255,255,0.45)", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.05em" },
  body: { padding:"20px", display:"flex", flexDirection:"column", gap:"16px", maxWidth:"960px", margin:"0 auto" },
  filterRow: { display:"flex", justifyContent:"space-between", alignItems:"center", gap:"12px", background:"white", borderRadius:"16px", padding:"14px 18px", boxShadow:"0 2px 12px rgba(139,94,60,0.07)", flexWrap:"wrap" },
  sel: { padding:"7px 12px", border:"1.5px solid rgba(139,94,60,0.14)", borderRadius:"10px", fontSize:"12px", color:"#5c4a35", background:"#fdf8f3", fontFamily:"inherit", cursor:"pointer" },
  clearBtn: { padding:"7px 12px", background:"rgba(220,53,69,0.08)", border:"1px solid rgba(220,53,69,0.15)", borderRadius:"10px", color:"#d32f2f", fontSize:"11px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" },
  grid4: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:"12px" },
  grid2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" },
  card: { background:"white", borderRadius:"18px", padding:"22px 24px", boxShadow:"0 2px 14px rgba(139,94,60,0.07)" },
  cardTitle: { fontSize:"14px", fontWeight:"800", color:"#1a1410", margin:0 },
};