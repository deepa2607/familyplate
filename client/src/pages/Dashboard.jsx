import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";


// Real Unsplash food images
const FOOD_IMAGES = {
  hero:      "https://images.unsplash.com/photo-1567337710282-00832b415979?w=1200&q=85",
  dal:       "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
  sabzi:     "https://images.unsplash.com/photo-1631292784640-2b24be784d5d?w=400&q=80",
  biryani:   "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80",
  breakfast: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80",
  salad:     "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
  curry:     "https://images.unsplash.com/photo-1631292784640-2b24be784d5d?w=400&q=80",
  kitchen:   "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80",
  market:    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
  spices:    "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=400&q=80",
  thali:     "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&q=80",
  roti:      "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80",
  veggies:   "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80",
  pantry:    "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
  members:   "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80",
  money:     "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80",
};

const CATEGORY_ICONS = { Food:"🍛", Grocery:"🛒", Bills:"💡", Entertainment:"🎬", Travel:"✈️", Other:"📦" };
const CATEGORY_COLORS = { Food:"#d32f2f", Grocery:"#2d7a4f", Bills:"#1565c0", Entertainment:"#7c3aed", Travel:"#e67e22", Other:"#5c4a35" };

// Proper food images for quick actions
const ACTION_IMGS = {
  cart:      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
  recipes:   "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
  planner:   "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80",
  chat:      "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80",
  analytics: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80",
  grocery:   "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80",
};

const QUICK_ACTIONS = [
  { path:"/cart",      img: ACTION_IMGS.cart,      label:"Smart Cart",   desc:"Shop by category",    color:"#ff6b2b" },
  { path:"/recipes",   img: ACTION_IMGS.recipes,   label:"Recipes",      desc:"Pantry-based picks",  color:"#d32f2f" },
  { path:"/planner",   img: ACTION_IMGS.planner,   label:"Meal Planner", desc:"Plan your week",      color:"#1565c0" },
  { path:"/chat",      img: ACTION_IMGS.chat,      label:"Ask AI",       desc:"Cooking assistant",   color:"#00897b" },
  { path:"/analytics", img: ACTION_IMGS.analytics, label:"Analytics",    desc:"Spending trends",     color:"#7c3aed" },
  { path:"/grocery",   img: ACTION_IMGS.grocery,   label:"Grocery List", desc:"Your shopping list",  color:"#2980b9" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { msg:"Good Morning", emoji:"☀️", img: FOOD_IMAGES.breakfast };
  if (h < 17) return { msg:"Good Afternoon", emoji:"🌤️", img: FOOD_IMAGES.curry };
  if (h < 21) return { msg:"Good Evening", emoji:"🌅", img: FOOD_IMAGES.biryani };
  return { msg:"Good Night", emoji:"🌙", img: FOOD_IMAGES.thali };
}

const INR = (n) => `₹${(n||0).toLocaleString("en-IN")}`;

export default function Dashboard() {
  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [pantry, setPantry] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const g = getGreeting();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const hRes = await axios.get(`${API}/household/myhousehold`, { headers });
      if (hRes.data) {
        setHousehold(hRes.data);
        const id = hRes.data._id;
        const [mRes, pRes, panRes] = await Promise.all([
          axios.get(`${API}/household/members/${id}`, { headers }),
          axios.get(`${API}/purchase/${id}`, { headers }),
          axios.get(`${API}/pantry/${id}`, { headers }),
        ]);
        setMembers(mRes.data || []);
        setPurchases(pRes.data || []);
        setPantry(panRes.data || []);
      }
    } catch {}
    setLoading(false);
  };

  const now = new Date();
  const thisMonth = purchases.filter(p => {
    const d = new Date(p.date || p.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTotal = thisMonth.reduce((s,p) => s+(p.totalAmount||p.amount||0), 0);
  const allTotal = purchases.reduce((s,p) => s+(p.totalAmount||p.amount||0), 0);
  const budget = household?.monthlyBudget || 5000;
  const budgetPct = Math.min(100, Math.round((monthTotal/budget)*100));
  const lowStock = pantry.filter(p => p.quantity <= (p.lowStockThreshold||1));
  const recentPurchases = [...purchases].sort((a,b) => new Date(b.date||b.createdAt)-new Date(a.date||a.createdAt)).slice(0,5);
  const unsettledPurchases = purchases.filter(p => !p.settled);
  const unsettledAmt = unsettledPurchases.reduce((s,p) => s+(p.totalAmount||p.amount||0), 0);

  // Weekly spend for sparkline (last 7 days)
  const weeklyData = Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate() - (6-i));
    const label = d.toLocaleDateString("en-IN",{weekday:"short"});
    const total = purchases.filter(p => {
      const pd = new Date(p.date||p.createdAt);
      return pd.toDateString() === d.toDateString();
    }).reduce((s,p)=>s+(p.totalAmount||p.amount||0),0);
    return { label, total };
  });
  const weekMax = Math.max(1, ...weeklyData.map(d=>d.total));

  // Category spend breakdown
  const catSpend = purchases.reduce((acc,p) => {
    const c = p.category || "Other";
    acc[c] = (acc[c]||0) + (p.totalAmount||p.amount||0);
    return acc;
  }, {});
  const catColors = { Grocery:"#2d7a4f", Food:"#d32f2f", Bills:"#1565c0", Entertainment:"#7c3aed", Travel:"#e67e22", Other:"#9c8672" };
  const topCats = Object.entries(catSpend).sort((a,b)=>b[1]-a[1]).slice(0,4);

  if (loading) return (
    <div style={s.loader}>
      <img src={FOOD_IMAGES.thali} alt="" style={s.loaderImg} />
      <p style={s.loaderText}>Loading your kitchen... 🍽️</p>
    </div>
  );

  return (
    <div style={s.page}>

      {/* ── HERO BANNER with real photo ── */}
      <div style={s.hero}>
        <img src={g.img} alt="food" style={s.heroBg} />
        <div style={s.heroGrad} />
        <div style={s.heroContent}>
          <div style={s.heroBadge}>{g.emoji} {g.msg}</div>
          <h1 style={s.heroTitle}>
            Welcome back,<br />
            <span style={s.heroName}>{household?.name || "Chef"}</span>!
          </h1>
          <div style={s.heroChips}>
            {household?.mode && <span style={s.chip}>💫 {household.mode === "split" ? "Split Mode" : "Family Mode"}</span>}
            {household?.inviteCode && <span style={{...s.chip, background:"rgba(255,255,255,0.15)"}}>🔑 {household.inviteCode}</span>}
            {household?.foodPreference && <span style={{...s.chip, background:"rgba(255,107,43,0.3)"}}>
              {household.foodPreference === "veg" ? "🥦 Veg" : household.foodPreference === "nonveg" ? "🍗 Non-veg" : household.foodPreference === "vegan" ? "🌱 Vegan" : "🙏 Jain"}
            </span>}
          </div>
        </div>
        {/* Budget pill on hero */}
        <div style={s.heroBudget}>
          <span style={s.heroBudgetLabel}>Monthly Budget</span>
          <span style={s.heroBudgetVal}>{INR(monthTotal)} <span style={{opacity:0.6, fontSize:"13px"}}>/ {INR(budget)}</span></span>
          <div style={s.heroBudgetBar}>
            <div style={{...s.heroBudgetFill, width:`${budgetPct}%`,background: budgetPct>90 ? "#ff4444" : budgetPct>70 ? "#ffb300" : "#4caf7d"}}/>
          </div>
          <span style={{...s.heroBudgetPct, color: budgetPct>90?"#ffcccc": budgetPct>70?"#ffe082":"#a5d6a7"}}>{budgetPct}% used</span>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={s.statsRow}>
        {[
          { img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80", label:"Total Spend",  val: INR(allTotal),       sub:"All time",           color:"#ff6b2b" },
          { img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80", label:"This Month",   val: INR(monthTotal),     sub:`${thisMonth.length} purchases`, color:"#d32f2f" },
          { img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80", label:"Members",      val: members.length,      sub:"In household",       color:"#7c3aed" },
          { img: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80", label:"Pantry Items", val: pantry.length,     sub:`${lowStock.length} running low`, color:"#2d7a4f" },
        ].map(c => (
          <div key={c.label} style={s.statCard}>
            <div style={s.statImgWrap}>
              <img src={c.img} alt="" style={s.statImg} />
              <div style={{...s.statImgOverlay, background:`linear-gradient(135deg, ${c.color}33, ${c.color}11)`}} />
            </div>
            <div style={s.statBody}>
              <span style={s.statLabel}>{c.label}</span>
              <span style={{...s.statVal, color:c.color}}>{c.val}</span>
              <span style={s.statSub}>{c.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── BUDGET EXCEEDED ALERT ── */}
      {budgetPct >= 80 && (
        <div style={{background: budgetPct >= 100 ? "linear-gradient(135deg,#d32f2f,#ef5350)" : "linear-gradient(135deg,#e67e22,#ffa726)",borderRadius: "16px",padding: "16px 22px",display: "flex",alignItems: "center",gap: "14px",boxShadow: budgetPct >= 100 ? "0 8px 24px rgba(211,47,47,0.3)" : "0 8px 24px rgba(230,126,34,0.3)",}}>
          <span style={{fontSize:"28px"}}>{budgetPct >= 100 ? "🚨" : "⚠️"}</span>
          <div style={{flex:1}}>
            <p style={{margin:0,fontSize:"15px",fontWeight:"800",color:"white"}}>
              {budgetPct >= 100 ? "Budget Exceeded!" : "Approaching Budget Limit"}
            </p>
            <p style={{margin:0,fontSize:"12px",color:"rgba(255,255,255,0.8)"}}>
              {budgetPct >= 100
                ? `You've spent ${INR(monthTotal)} — ${INR(monthTotal-budget)} over your ${INR(budget)} monthly budget`
                : `${INR(monthTotal)} of ${INR(budget)} used (${budgetPct}%) — ${INR(budget-monthTotal)} remaining`}
            </p>
          </div>
          <Link to="/purchases" style={{padding:"8px 16px",background:"rgba(255,255,255,0.2)",color:"white",borderRadius:"10px",fontSize:"12px",fontWeight:"700",textDecoration:"none"}}>
            View →
          </Link>
        </div>
      )}

      {/* ── UNSETTLED DUES BANNER ── */}
      {unsettledPurchases.length > 0 && (
        <div style={{background:"linear-gradient(135deg,rgba(26,20,16,0.9),rgba(45,30,18,0.95))",borderRadius:"16px", padding:"16px 22px",display:"flex", alignItems:"center", gap:"14px",boxShadow:"0 8px 24px rgba(0,0,0,0.18)",border:"1px solid rgba(255,170,112,0.15)",}}>
          <span style={{fontSize:"28px"}}>💰</span>
          <div style={{flex:1}}>
            <p style={{margin:0,fontSize:"15px",fontWeight:"800",color:"white"}}>
              {unsettledPurchases.length} Unsettled Purchase{unsettledPurchases.length!==1?"s":""}
            </p>
            <p style={{margin:0,fontSize:"12px",color:"rgba(255,255,255,0.6)"}}>
              {INR(unsettledAmt)} pending settlement between members
            </p>
          </div>
          <Link to="/purchases" style={{padding:"10px 18px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",color:"white",borderRadius:"12px",fontSize:"12px",fontWeight:"700",textDecoration:"none",boxShadow:"0 4px 14px rgba(255,107,43,0.3)"}}>
            Settle Now →
          </Link>
        </div>
      )}

      {/* ── QUICK ACTIONS with food photos ── */}
      <div style={s.sectionHead}>
        <h2 style={s.sectionTitle}>⚡ Quick Actions</h2>
        <span style={s.sectionSub}>Everything you need</span>
      </div>
      <div style={s.actionsGrid}>
        {QUICK_ACTIONS.map(a => (
          <Link key={a.path} to={a.path} style={s.actionCard}>
            <div style={s.actionImgWrap}>
              <img src={a.img} alt={a.label} style={s.actionImg} />
              <div style={{...s.actionOverlay, background:`linear-gradient(180deg, transparent 30%, ${a.color}ee 100%)`}} />
              <div style={s.actionText}>
                <span style={s.actionLabel}>{a.label}</span>
                <span style={s.actionDesc}>{a.desc}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── WEEKLY SPEND + CATEGORY BREAKDOWN ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

        {/* Weekly sparkline */}
        <div style={{...s.panel,padding:"20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <span style={s.panelTitle}>📈 This Week's Spending</span>
            <span style={{fontSize:13,fontWeight:800,color:"#ff6b2b"}}>{INR(weeklyData.reduce((s,d)=>s+d.total,0))}</span>
          </div>
          <div style={{display:"flex",alignItems:"flex-end",gap:6,height:80}}>
            {weeklyData.map((d,i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{width:"100%",borderRadius:"4px 4px 0 0",background:d.total>0?"linear-gradient(180deg,#ff6b2b,#ff8c54)":"rgba(139,94,60,0.1)",height:`${Math.max(4, Math.round((d.total/weekMax)*72))}px`,transition:"height 0.5s ease",}}/>
                <span style={{fontSize:9,color:"#9c8672",fontWeight:600}}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div style={{...s.panel,padding:"20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <span style={s.panelTitle}>📊 Spending by Category</span>
          </div>
          {topCats.length === 0 ? (
            <p style={{color:"#c0b0a0",fontSize:13,textAlign:"center",padding:"16px 0"}}>No purchases yet</p>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {topCats.map(([cat,amt])=>{
                const pct = allTotal>0 ? Math.round(amt/allTotal*100) : 0;
                const c = catColors[cat] || "#9c8672";
                return (
                  <div key={cat}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:600,color:"#3d2c1e"}}>{cat}</span>
                      <span style={{fontSize:12,color:c,fontWeight:700}}>{INR(amt)} ({pct}%)</span>
                    </div>
                    <div style={{height:6,background:"#f5ede4",borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:c,borderRadius:3,transition:"width 0.6s ease"}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM ROW ── */}
      <div style={s.bottomRow}>

        {/* Recent Purchases */}
        <div style={s.panel}>
          <div style={s.panelTop}>
            <span style={s.panelTitle}>🛍️ Recent Purchases</span>
            <Link to="/purchases" style={s.panelLink}>See all →</Link>
          </div>
          {recentPurchases.length === 0 ? (
            <div style={s.empty}>
              <img src={FOOD_IMAGES.market} alt="" style={s.emptyImg} />
              <p style={s.emptyText}>No purchases yet</p>
              <Link to="/cart" style={s.emptyBtn}>Add First Purchase</Link>
            </div>
          ) : (
            <div style={s.purchaseList}>
              {recentPurchases.map(p => {
                const payer = members.find(m => m._id===(p.paidBy?._id||p.paidBy))?.name || "Unknown";
                const color = CATEGORY_COLORS[p.category] || "#5c4a35";
                const icon = CATEGORY_ICONS[p.category] || "📦";
                return (
                  <div key={p._id} style={s.purchaseRow}>
                    <div style={{...s.purchaseIcon, background:`${color}15`, color}}>{icon}</div>
                    <div style={s.purchaseInfo}>
                      <span style={s.purchaseName}>{p.description || p.category}</span>
                      <span style={s.purchaseMeta}>{payer} · {new Date(p.date||p.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span>
                    </div>
                    <span style={{...s.purchaseAmt, color}}>{INR(p.totalAmount||p.amount)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={s.rightCol}>

          {/* Low stock alert with image */}
          {lowStock.length > 0 && (
            <div style={s.alertPanel}>
              <img src={FOOD_IMAGES.market} alt="" style={s.alertBg} />
              <div style={s.alertOverlay} />
              <div style={s.alertContent}>
                <span style={s.alertTitle}>⚠️ Low Stock Alert</span>
                <div style={s.alertItems}>
                  {lowStock.slice(0,4).map(i => (
                    <div key={i._id} style={s.alertItem}>
                      <span style={s.alertDot}>🔴</span>
                      <span style={s.alertName}>{i.name}</span>
                      <span style={s.alertQty}>{i.quantity} {i.unit}</span>
                    </div>
                  ))}
                </div>
                <Link to="/pantry" style={s.alertBtn}>View Pantry →</Link>
              </div>
            </div>
          )}

          {/* Today's Meal Suggestion */}
          <div style={s.mealSuggest}>
            <img src={g.img} alt="meal" style={s.mealSuggestBg} />
            <div style={s.mealSuggestOverlay} />
            <div style={s.mealSuggestContent}>
              <span style={s.mealSuggestBadge}>🍽️ Today's Suggestion</span>
              <p style={s.mealSuggestText}>
                {household?.foodPreference === "veg" ? "Dal Tadka with Jeera Rice" :
                 household?.foodPreference === "vegan" ? "Tofu Palak with Roti" :
                 "Chicken Curry with Basmati Rice"}
              </p>
              <Link to="/planner" style={s.mealSuggestBtn}>Plan Full Week →</Link>
            </div>
          </div>

          {/* Members */}
          <div style={s.panel}>
            <div style={s.panelTop}>
              <span style={s.panelTitle}>👥 Members</span>
              <Link to="/members" style={s.panelLink}>Manage →</Link>
            </div>
            {members.length === 0 ? (
              <div style={s.emptySmall}>
                <span style={s.emptySmallText}>No members yet</span>
                <Link to="/members" style={s.panelLink}>+ Add Members</Link>
              </div>
            ) : (
              <div style={s.memberGrid}>
                {members.slice(0,6).map((m,i) => {
                  const colors = ["#ff6b2b","#7c3aed","#2d7a4f","#1565c0","#d32f2f","#00897b"];
                  const c = colors[i%colors.length];
                  return (
                    <div key={m._id} style={s.memberBubble}>
                      <div style={{...s.memberAvatar, background:`linear-gradient(135deg, ${c}, ${c}99)`, boxShadow:`0 4px 12px ${c}40`}}>
                        {m.name[0].toUpperCase()}
                      </div>
                      <span style={s.memberName}>{m.name.split(" ")[0]}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        a { text-decoration: none; }
        .action-card:hover img { transform: scale(1.08); }
      `}</style>
    </div>
  );
}

const s = {
  page: { display:"flex", flexDirection:"column", gap:"24px", paddingBottom:"32px" },

  loader: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"70vh", gap:"20px" },
  loaderImg: { width:"160px", height:"160px", objectFit:"cover", borderRadius:"50%", boxShadow:"0 20px 60px rgba(0,0,0,0.15)" },
  loaderText: { fontSize:"18px", color:"#5c4a35", fontWeight:"600" },

  // Hero
  hero: {
    position:"relative", borderRadius:"24px", overflow:"hidden",
    height:"320px", boxShadow:"0 20px 60px rgba(0,0,0,0.2)",
  },
  heroBg: { position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" },
  heroGrad: {
    position:"absolute", inset:0,
    background:"linear-gradient(135deg, rgba(26,20,16,0.85) 0%, rgba(26,20,16,0.4) 60%, transparent 100%)",
  },
  heroContent: { position:"relative", zIndex:2, padding:"40px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"center" },
  heroBadge: {
    display:"inline-block", background:"rgba(255,107,43,0.25)",
    border:"1px solid rgba(255,107,43,0.4)", color:"#ffaa70",
    borderRadius:"50px", padding:"5px 14px", fontSize:"12px", fontWeight:"700",
    marginBottom:"12px", backdropFilter:"blur(8px)",
  },
  heroTitle: {
    fontFamily:"'Playfair Display', serif",
    fontSize:"clamp(24px,3vw,38px)", fontWeight:"800",
    color:"white", lineHeight:1.2, margin:"0 0 16px",
  },
  heroName: { color:"#ffaa70" },
  heroChips: { display:"flex", gap:"8px", flexWrap:"wrap" },
  chip: {
    background:"rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.9)",
    borderRadius:"50px", padding:"5px 12px", fontSize:"12px", fontWeight:"600",
    backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.15)",
  },
  heroBudget: {
    position:"absolute", right:"32px", bottom:"32px", zIndex:2,
    background:"rgba(255,255,255,0.12)", backdropFilter:"blur(16px)",
    border:"1px solid rgba(255,255,255,0.2)", borderRadius:"16px",
    padding:"16px 20px", minWidth:"220px",
  },
  heroBudgetLabel: { display:"block", fontSize:"11px", color:"rgba(255,255,255,0.6)", fontWeight:"600", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"4px" },
  heroBudgetVal: { display:"block", fontSize:"20px", fontWeight:"800", color:"white", marginBottom:"10px" },
  heroBudgetBar: { height:"6px", background:"rgba(255,255,255,0.15)", borderRadius:"6px", overflow:"hidden", marginBottom:"6px" },
  heroBudgetFill: { height:"100%", borderRadius:"6px", transition:"width 0.8s ease" },
  heroBudgetPct: { fontSize:"12px", fontWeight:"600" },

  // Stat cards
  statsRow: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px,1fr))", gap:"16px" },
  statCard: {
    background:"white", borderRadius:"20px", overflow:"hidden",
    boxShadow:"0 4px 20px rgba(139,94,60,0.1)", border:"1px solid rgba(139,94,60,0.06)",
    transition:"transform 0.25s, box-shadow 0.25s",
    cursor:"default",
  },
  statImgWrap: { position:"relative", height:"100px", overflow:"hidden" },
  statImg: { width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.4s" },
  statImgOverlay: { position:"absolute", inset:0 },
  statBody: { padding:"16px 18px", display:"flex", flexDirection:"column", gap:"3px" },
  statLabel: { fontSize:"11px", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.05em", color:"#9c8672" },
  statVal: { fontSize:"28px", fontWeight:"800", lineHeight:1.1 },
  statSub: { fontSize:"12px", color:"#9c8672" },

  // Quick actions
  sectionHead: { display:"flex", justifyContent:"space-between", alignItems:"center" },
  sectionTitle: { fontSize:"18px", fontWeight:"800", color:"#1a1410", margin:0, fontFamily:"'Playfair Display', serif" },
  sectionSub: { fontSize:"12px", color:"#9c8672" },
  actionsGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px,1fr))", gap:"16px" },
  actionCard: { borderRadius:"20px", overflow:"hidden", boxShadow:"0 8px 28px rgba(0,0,0,0.12)", textDecoration:"none", display:"block" },
  actionImgWrap: { position:"relative", height:"160px", overflow:"hidden" },
  actionImg: { width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.4s ease" },
  actionOverlay: { position:"absolute", inset:0 },
  actionText: { position:"absolute", bottom:0, left:0, right:0, padding:"16px 14px" },
  actionLabel: { display:"block", fontSize:"15px", fontWeight:"800", color:"white", marginBottom:"2px" },
  actionDesc: { display:"block", fontSize:"11px", color:"rgba(255,255,255,0.75)" },

  // Bottom row
  bottomRow: { display:"grid", gridTemplateColumns:"1fr 360px", gap:"20px", alignItems:"start" },
  rightCol: { display:"flex", flexDirection:"column", gap:"16px" },

  // Panel
  panel: {
    background:"white", borderRadius:"20px", padding:"20px",
    boxShadow:"0 4px 20px rgba(139,94,60,0.08)", border:"1px solid rgba(139,94,60,0.06)",
  },
  panelTop: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" },
  panelTitle: { fontSize:"14px", fontWeight:"700", color:"#1a1410" },
  panelLink: { fontSize:"12px", color:"#ff6b2b", fontWeight:"700", textDecoration:"none" },

  empty: { textAlign:"center", padding:"20px 0" },
  emptyImg: { width:"120px", height:"80px", objectFit:"cover", borderRadius:"12px", marginBottom:"12px", opacity:0.6 },
  emptyText: { fontSize:"13px", color:"#9c8672", marginBottom:"12px" },
  emptyBtn: {
    display:"inline-block", padding:"8px 18px",
    background:"linear-gradient(135deg, #ff6b2b, #ff8c54)",
    color:"white", borderRadius:"50px", fontSize:"12px", fontWeight:"700", textDecoration:"none",
  },
  emptySmall: { display:"flex", justifyContent:"space-between", alignItems:"center" },
  emptySmallText: { fontSize:"13px", color:"#9c8672" },

  purchaseList: { display:"flex", flexDirection:"column", gap:"10px" },
  purchaseRow: { display:"flex", alignItems:"center", gap:"12px", padding:"8px 0", borderBottom:"1px solid #fdf8f3" },
  purchaseIcon: { width:"40px", height:"40px", borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 },
  purchaseInfo: { flex:1 },
  purchaseName: { display:"block", fontSize:"13px", fontWeight:"600", color:"#1a1410" },
  purchaseMeta: { fontSize:"11px", color:"#9c8672" },
  purchaseAmt: { fontSize:"14px", fontWeight:"800" },

  // Alert panel with image bg
  alertPanel: {
    position:"relative", borderRadius:"20px", overflow:"hidden",
    height:"180px", boxShadow:"0 8px 24px rgba(0,0,0,0.12)",
  },
  alertBg: { position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" },
  alertOverlay: { position:"absolute", inset:0, background:"linear-gradient(135deg, rgba(180,30,30,0.85), rgba(220,80,30,0.75))" },
  alertContent: { position:"relative", zIndex:2, padding:"18px" },
  alertTitle: { display:"block", fontSize:"13px", fontWeight:"800", color:"white", marginBottom:"10px" },
  alertItems: { display:"flex", flexDirection:"column", gap:"6px", marginBottom:"12px" },
  alertItem: { display:"flex", alignItems:"center", gap:"8px" },
  alertDot: { fontSize:"8px" },
  alertName: { flex:1, fontSize:"12px", color:"rgba(255,255,255,0.9)", fontWeight:"500" },
  alertQty: { fontSize:"11px", color:"rgba(255,255,255,0.6)" },
  alertBtn: {
    display:"inline-block", background:"rgba(255,255,255,0.2)",
    border:"1px solid rgba(255,255,255,0.3)", color:"white",
    borderRadius:"50px", padding:"5px 14px", fontSize:"12px", fontWeight:"700",
    textDecoration:"none", backdropFilter:"blur(8px)",
  },

  // Today's meal suggestion
  mealSuggest: {
    position:"relative", borderRadius:"20px", overflow:"hidden",
    height:"160px", boxShadow:"0 8px 24px rgba(0,0,0,0.12)",
  },
  mealSuggestBg: { position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" },
  mealSuggestOverlay: { position:"absolute", inset:0, background:"linear-gradient(135deg, rgba(26,20,16,0.8), rgba(45,122,79,0.6))" },
  mealSuggestContent: { position:"relative", zIndex:2, padding:"20px" },
  mealSuggestBadge: { display:"block", fontSize:"11px", color:"rgba(255,255,255,0.7)", fontWeight:"600", marginBottom:"8px" },
  mealSuggestText: { fontSize:"16px", fontWeight:"800", color:"white", marginBottom:"12px", fontFamily:"'Playfair Display', serif" },
  mealSuggestBtn: {
    display:"inline-block", background:"rgba(255,255,255,0.2)",
    border:"1px solid rgba(255,255,255,0.3)", color:"white",
    borderRadius:"50px", padding:"5px 14px", fontSize:"12px", fontWeight:"700",
    textDecoration:"none", backdropFilter:"blur(8px)",
  },

  memberGrid: { display:"flex", flexWrap:"wrap", gap:"12px" },
  memberBubble: { display:"flex", flexDirection:"column", alignItems:"center", gap:"6px" },
  memberAvatar: {
    width:"48px", height:"48px", borderRadius:"50%",
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:"18px", fontWeight:"800", color:"white",
  },
  memberName: { fontSize:"11px", color:"#5c4a35", fontWeight:"600" },
};