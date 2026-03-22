import { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "../components/Toast";

const API = "http://localhost:5000/api";

const DIET_OPTIONS = [
  { value:"veg",    label:"🥦 Vegetarian",    desc:"No meat or fish",    img:"https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&q=80" },
  { value:"non-veg",label:"🍗 Non-Vegetarian", desc:"All foods included",  img:"https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=300&q=80" },
  { value:"vegan",  label:"🌱 Vegan",          desc:"No animal products", img:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80" },
  { value:"jain",   label:"🙏 Jain",           desc:"No root vegetables", img:"https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=80" },
];

const HEALTH_OPTIONS = [
  { value:"normal",      label:"😊 Normal",     desc:"Balanced diet",        color:"#ff6b2b" },
  { value:"gym",         label:"💪 Gym/Fitness", desc:"High protein",         color:"#d32f2f" },
  { value:"diabetic",    label:"🩺 Diabetic",    desc:"Low sugar, low GI",    color:"#1565c0" },
  { value:"thyroid",     label:"🦋 Thyroid",     desc:"Thyroid-friendly",     color:"#7c3aed" },
  { value:"weight-loss", label:"⚖️ Weight Loss", desc:"Low calorie",          color:"#2d7a4f" },
];

const MODE_OPTIONS = [
  { value:"family", icon:"🏠", label:"Family Mode", desc:"Track together without splitting" },
  { value:"split",  icon:"💰", label:"Split Mode",  desc:"Split & settle between members" },
];

export default function Settings() {
  const toast = useToast();
  const [household, setHousehold] = useState(null);
  const [copied, setCopied] = useState(false);
  const [diet, setDiet] = useState("veg");
  const [health, setHealth] = useState("normal");
  const [mode, setMode] = useState("family");
  const [budget, setBudget] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("token");
  const headers = { Authorization:`Bearer ${token}` };

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const res = await axios.get(`${API}/household/myhousehold`, { headers });
      if (res.data) {
        setHousehold(res.data);
        const dMap={"veg":"veg","nonveg":"non-veg","vegan":"vegan","jain":"jain"}; const hMap={"normal":"normal","gym":"gym","diabetic":"diabetic","thyroid":"thyroid","weightloss":"weight-loss"}; setDiet(dMap[res.data.foodPreference]||"veg");
        setHealth(hMap[res.data.healthMode]||"normal");
        setMode(res.data.mode || "family");
        setBudget(res.data.monthlyBudget || "5000");
        setHouseholdName(res.data.name || "");
      }
    } catch {}
  };

  // Map frontend values → backend schema enum values
  const dietMap = { "veg":"veg", "non-veg":"nonveg", "vegan":"vegan", "jain":"jain" };
  const healthMap = { "normal":"normal", "gym":"gym", "diabetic":"diabetic", "thyroid":"thyroid", "weight-loss":"weightloss" };

  const save = async () => {
    setSaving(true);
    try {
      await axios.patch(`${API}/household/${household._id}`, {
        dietPreference: dietMap[diet] || diet,
        healthMode: healthMap[health] || health,
        mode,
        monthlyBudget: parseFloat(budget) || 5000,
      }, { headers });
      // Name update — separate call if name changed (backend doesn't handle it in patch)
      if (householdName && householdName !== household.name) {
        await axios.patch(`${API}/household/${household._id}`, { name: householdName }, { headers });
      }
      toast("Settings saved successfully!", "success");
    } catch (err) {
      console.error("Save error:", err.response?.data || err.message);
      toast(err.response?.data?.message || err.response?.data?.error || "Error saving", "error");
    }
    setSaving(false);
  };

    const baseUrl = window.location.origin; // works in both dev and prod
  const joinLink = `${baseUrl}/join?code=${household?.inviteCode || ""}`;
  const shareMsg = `🏠 Join my household on HomeHub!\n\nUse invite code: *${household?.inviteCode}*\nOr tap this link to join directly:\n${joinLink}`;

  const copyCode = () => {
    navigator.clipboard.writeText(household?.inviteCode || "").then(() => {
      setCopied(true);
      toast("Invite code copied! ✅", "success");
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(joinLink).then(() => {
      toast("Join link copied! ✅", "success");
    });
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg)}`, "_blank");
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(`Join my HomeHub household — ${household?.name || ""}`);
    const body = encodeURIComponent(
      `Hi!\n\nI'd like you to join my household on HomeHub.\n\nInvite Code: ${household?.inviteCode}\n\nJoin directly: ${joinLink}\n\nSee you inside! 🏠`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  };

  const shareSMS = () => {
    window.open(`sms:?body=${encodeURIComponent(shareMsg)}`, "_self");
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join my HomeHub household", text: shareMsg, url: joinLink });
      } catch {}
    } else {
      copyLink();
    }
  };

return (
    <div style={s.page}>
      {/* Hero */}
      <div style={s.hero}>
        <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80" alt="" style={s.heroBg}/>
        <div style={s.heroOverlay}/>
        <div style={s.heroContent}>
          <h1 style={s.heroTitle}>Settings</h1>
          <p style={s.heroSub}>Customise your HomeHub experience</p>
        </div>
      </div>

      <div style={s.grid}>
        {/* Left column */}
        <div style={s.leftCol}>
          {/* Household info */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>🏠 Household Info</h3>
            <div style={s.field}>
              <label style={s.label}>Household Name</label>
              <div style={s.iWrap}><span style={s.iIcon}>🏠</span>
                <input value={householdName} onChange={e=>setHouseholdName(e.target.value)} style={s.input} placeholder="Your household name"/>
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Monthly Budget (₹)</label>
              <div style={s.iWrap}><span style={s.iIcon}>💰</span>
                <input type="number" value={budget} onChange={e=>setBudget(e.target.value)} style={s.input} placeholder="5000"/>
              </div>
            </div>
            {household?.inviteCode && (
              <div style={s.inviteCard}>
                <div style={s.inviteLabel}>🔑 Invite Members</div>

                {/* Code display + copy */}
                <div style={{display:"flex",alignItems:"center",gap:10,margin:"8px 0 12px"}}>
                  <div style={{flex:1,background:"white",border:"1.5px solid rgba(255,107,43,0.2)",borderRadius:10,padding:"10px 16px",fontFamily:"monospace",fontSize:26,fontWeight:900,color:"#1a1410",letterSpacing:"0.15em",textAlign:"center"}}>
                    {household.inviteCode}
                  </div>
                  <button onClick={copyCode} style={{padding:"10px 14px",borderRadius:10,border:"none",cursor:"pointer",background:copied?"rgba(45,122,79,0.12)":"rgba(255,107,43,0.1)",color:copied?"#2d7a4f":"#ff6b2b",fontWeight:700,fontSize:13,transition:"all .2s",flexShrink:0,whiteSpace:"nowrap"}}>
                    {copied ? "✓ Copied!" : "📋 Copy"}
                  </button>
                </div>

                {/* Join link row */}
                <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.6)",border:"1px solid rgba(0,0,0,0.06)",borderRadius:9,padding:"8px 12px",marginBottom:14}}>
                  <span style={{fontSize:11,color:"#9c8672",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    🔗 homehub.app/join?code={household.inviteCode}
                  </span>
                  <button onClick={copyLink} style={{flexShrink:0,background:"none",border:"none",cursor:"pointer",fontSize:11,fontWeight:700,color:"#7c3aed",padding:"2px 6px"}}>
                    Copy link
                  </button>
                </div>

                {/* Share buttons */}
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={shareWhatsApp} style={{display:"flex",alignItems:"center",gap:7,flex:1,minWidth:110,padding:"10px 12px",borderRadius:11,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:"#25D366",color:"white",boxShadow:"0 3px 10px rgba(37,211,102,0.35)"}}>
                    <span style={{fontSize:17}}>📱</span> WhatsApp
                  </button>

                  <button onClick={shareEmail} style={{display:"flex",alignItems:"center",gap:7,flex:1,minWidth:110,padding:"10px 12px",borderRadius:11,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:"#EA4335",color:"white",boxShadow:"0 3px 10px rgba(234,67,53,0.3)"}}>
                    <span style={{fontSize:17}}>✉️</span> Email
                  </button>

                  <button onClick={shareSMS} style={{display:"flex",alignItems:"center",gap:7,flex:1,minWidth:110,padding:"10px 12px",borderRadius:11,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:"#1d4ed8",color:"white",boxShadow:"0 3px 10px rgba(29,78,216,0.3)"}}>
                    <span style={{fontSize:17}}>💬</span> SMS
                  </button>

                  <button onClick={shareNative} style={{display:"flex",alignItems:"center",gap:7,flex:1,minWidth:110,padding:"10px 12px",borderRadius:11,border:"1.5px solid rgba(255,107,43,0.25)",cursor:"pointer",fontWeight:700,fontSize:13,background:"rgba(255,107,43,0.08)",color:"#ff6b2b"}}>
                    <span style={{fontSize:17}}>↗️</span> More
                  </button>
                </div>

                <div style={{marginTop:10,fontSize:11,color:"#b0a090",textAlign:"center"}}>
                  Anyone with this code or link can join <b style={{color:"#5c4a35"}}>{household.name}</b>
                </div>
              </div>
            )}
          </div>

          {/* Expense mode */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>💫 Expense Mode</h3>
            <div style={s.modeRow}>
              {MODE_OPTIONS.map(m => (
                <button key={m.value} onClick={() => setMode(m.value)} style={{...s.modeBtn,background: mode===m.value ? "linear-gradient(135deg, #ff6b2b, #ff8c54)" : "rgba(139,94,60,0.06)",color: mode===m.value ? "white" : "#5c4a35",boxShadow: mode===m.value ? "0 6px 20px rgba(255,107,43,0.3)" : "none",border: `1.5px solid ${mode===m.value ? "transparent" : "rgba(139,94,60,0.12)"}`,}}>
                  <span style={s.modeBtnIcon}>{m.icon}</span>
                  <span style={s.modeBtnLabel}>{m.label}</span>
                  <span style={{...s.modeBtnDesc, color: mode===m.value ? "rgba(255,255,255,0.75)" : "#9c8672"}}>{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Health mode */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>💪 Health & Fitness Mode</h3>
            <div style={s.healthGrid}>
              {HEALTH_OPTIONS.map(h => (
                <button key={h.value} onClick={() => setHealth(h.value)} style={{...s.healthBtn,background: health===h.value ? `${h.color}12` : "rgba(139,94,60,0.04)",border: `1.5px solid ${health===h.value ? h.color : "rgba(139,94,60,0.1)"}`,color: health===h.value ? h.color : "#5c4a35",}}>
                  <span style={s.healthBtnLabel}>{h.label}</span>
                  <span style={{...s.healthBtnDesc, color: health===h.value ? `${h.color}99` : "#9c8672"}}>{h.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — diet with photos */}
        <div style={s.rightCol}>
          <div style={s.card}>
            <h3 style={s.cardTitle}>🍛 Diet Preference</h3>
            <p style={s.cardSub}>Used for recipe suggestions & meal planning</p>
            <div style={s.dietGrid}>
              {DIET_OPTIONS.map(d => (
                <button key={d.value} onClick={() => setDiet(d.value)} style={{...s.dietCard,border: diet===d.value ? "2.5px solid #ff6b2b" : "2.5px solid transparent",transform: diet===d.value ? "scale(1.03)" : "scale(1)",}}>
                  <img src={d.img} alt={d.label} style={s.dietImg}/>
                  <div style={s.dietOverlay}/>
                  <div style={s.dietContent}>
                    <span style={s.dietLabel}>{d.label}</span>
                    <span style={s.dietDesc}>{d.desc}</span>
                  </div>
                  {diet===d.value && <div style={s.dietCheck}>✓</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div style={{...s.card, border:"1.5px solid rgba(220,53,69,0.15)"}}>
            <h3 style={{...s.cardTitle, color:"#c0392b"}}>⚠️ Account</h3>
            <p style={s.cardSub}>Manage your account settings</p>
            <div style={s.dangerRow}>
              <div>
                <div style={s.dangerLabel}>Sign out</div>
                <div style={s.dangerDesc}>You'll need to sign in again</div>
              </div>
              <button onClick={() => { localStorage.removeItem("token"); window.location.href="/"; }} style={s.dangerBtn}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div style={s.saveRow}>
        <button onClick={save} disabled={saving} style={{...s.saveBtn, opacity:saving?0.8:1}}>
          {saving ? "Saving..." : "💾 Save All Settings"}
        </button>
      </div>

      <style>{`input:focus, select:focus { outline:none!important; border-color:#ff6b2b!important; box-shadow:0 0 0 3px rgba(255,107,43,0.1)!important; }`}</style>
    </div>
  );
}

const s = {
  page: { display:"flex", flexDirection:"column", gap:"24px", paddingBottom:"32px" },
  hero: { position:"relative", borderRadius:"24px", overflow:"hidden", height:"160px", boxShadow:"0 12px 40px rgba(0,0,0,0.15)" },
  heroBg: { position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" },
  heroOverlay: { position:"absolute", inset:0, background:"linear-gradient(135deg, rgba(26,20,16,0.88), rgba(26,20,16,0.55))" },
  heroContent: { position:"relative", zIndex:2, padding:"40px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"center" },
  heroTitle: { fontFamily:"'Playfair Display', serif", fontSize:"36px", fontWeight:"800", color:"white", margin:"0 0 6px" },
  heroSub: { fontSize:"14px", color:"rgba(255,255,255,0.55)" },
  grid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px", alignItems:"start" },
  leftCol: { display:"flex", flexDirection:"column", gap:"20px" },
  rightCol: { display:"flex", flexDirection:"column", gap:"20px" },
  card: { background:"white", borderRadius:"20px", padding:"24px", boxShadow:"0 4px 20px rgba(139,94,60,0.08)", border:"1px solid rgba(139,94,60,0.06)" },
  cardTitle: { fontSize:"15px", fontWeight:"800", color:"#1a1410", margin:"0 0 16px", fontFamily:"'Playfair Display', serif" },
  cardSub: { fontSize:"12px", color:"#9c8672", margin:"-12px 0 16px" },
  field: { display:"flex", flexDirection:"column", gap:"6px", marginBottom:"14px" },
  label: { fontSize:"11px", fontWeight:"700", color:"#5c4a35", textTransform:"uppercase", letterSpacing:"0.04em" },
  iWrap: { position:"relative", display:"flex", alignItems:"center" },
  iIcon: { position:"absolute", left:"12px", fontSize:"15px", zIndex:1 },
  input: { width:"100%", padding:"12px 12px 12px 40px", border:"1.5px solid rgba(139,94,60,0.14)", borderRadius:"12px", fontSize:"14px", background:"#fdf8f3", color:"#1a1410", transition:"all 0.2s" },
  inviteCard: { background:"linear-gradient(135deg,rgba(255,107,43,0.05),rgba(255,107,43,0.02))", border:"1.5px solid rgba(255,107,43,0.18)", borderRadius:"16px", padding:"18px", marginTop:"10px" },
  inviteLabel: { fontSize:"11px", fontWeight:"700", color:"#ff6b2b", textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:"6px" },
  inviteCode: { fontSize:"24px", fontWeight:"900", color:"#1a1410", letterSpacing:"0.1em", fontFamily:"monospace", marginBottom:"6px" },
  inviteSub: { fontSize:"11px", color:"#9c8672" },
  modeRow: { display:"flex", gap:"12px" },
  modeBtn: { flex:1, padding:"14px 12px", borderRadius:"14px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"flex-start", gap:"4px", transition:"all 0.2s" },
  modeBtnIcon: { fontSize:"22px" },
  modeBtnLabel: { fontSize:"13px", fontWeight:"800" },
  modeBtnDesc: { fontSize:"11px" },
  healthGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" },
  healthBtn: { padding:"12px 14px", borderRadius:"12px", cursor:"pointer", display:"flex", flexDirection:"column", gap:"3px", transition:"all 0.2s", textAlign:"left" },
  healthBtnLabel: { fontSize:"13px", fontWeight:"700" },
  healthBtnDesc: { fontSize:"11px" },
  dietGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" },
  dietCard: { position:"relative", borderRadius:"14px", overflow:"hidden", height:"110px", cursor:"pointer", padding:0, transition:"all 0.2s", background:"white" },
  dietImg: { position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" },
  dietOverlay: { position:"absolute", inset:0, background:"rgba(26,20,16,0.5)" },
  dietContent: { position:"absolute", bottom:0, left:0, right:0, padding:"10px" },
  dietLabel: { display:"block", fontSize:"12px", fontWeight:"800", color:"white" },
  dietDesc: { fontSize:"10px", color:"rgba(255,255,255,0.65)" },
  dietCheck: { position:"absolute", top:"8px", right:"8px", width:"20px", height:"20px", borderRadius:"50%", background:"#ff6b2b", color:"white", fontSize:"10px", fontWeight:"800", display:"flex", alignItems:"center", justifyContent:"center" },
  dangerRow: { display:"flex", justifyContent:"space-between", alignItems:"center" },
  dangerLabel: { fontSize:"14px", fontWeight:"700", color:"#1a1410", marginBottom:"3px" },
  dangerDesc: { fontSize:"12px", color:"#9c8672" },
  dangerBtn: { padding:"10px 20px", background:"rgba(220,53,69,0.08)", border:"1.5px solid rgba(220,53,69,0.2)", color:"#c0392b", borderRadius:"10px", fontSize:"13px", fontWeight:"700", cursor:"pointer" },
  saveRow: { display:"flex", justifyContent:"flex-end" },
  saveBtn: { padding:"16px 36px", background:"linear-gradient(135deg,#ff6b2b,#ff8c54)", color:"white", border:"none", borderRadius:"14px", fontSize:"15px", fontWeight:"800", cursor:"pointer", boxShadow:"0 8px 24px rgba(255,107,43,0.35)", transition:"all 0.2s" },
};