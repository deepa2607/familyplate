import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../components/Toast";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";


const DIET_OPTIONS = [
  { value:"veg",     label:"🥦 Vegetarian",    desc:"No meat or fish",    img:"https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&q=80" },
  { value:"non-veg", label:"🍗 Non-Vegetarian", desc:"All foods",          img:"https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=300&q=80" },
  { value:"vegan",   label:"🌱 Vegan",          desc:"No animal products", img:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80" },
  { value:"jain",    label:"🙏 Jain",           desc:"No root vegetables", img:"https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=80" },
];

const MODE_OPTIONS = [
  { value:"family", label:"🏠 Family Mode", desc:"Track expenses together without splitting", img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80" },
  { value:"split",  label:"💰 Split Mode",  desc:"Split bills & track who owes what",        img:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80" },
];

const STEPS = ["🏠 Household", "🍛 Diet", "💰 Mode", "✅ Done!"];

export default function SetupHousehold() {
  const toast    = useToast();
  const navigate = useNavigate();
  const [step,    setStep]    = useState(0);
  const [form,    setForm]    = useState({ name:"", inviteCode:"", diet:"veg", mode:"family", budget:"5000" });
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ── FIX 1: POST to /create, send all fields in one call ──────────────
  const createHousehold = async () => {
    if (!form.name.trim()) { toast("Enter a household name", "warning"); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/household/create`, {
        name:           form.name.trim(),
        mode:           form.mode,
        foodPreference: form.diet,
        monthlyBudget:  parseFloat(form.budget) || 5000,
      }, { headers });

      toast("Household created! Welcome to HomeHub 🎉", "success");
      navigate("/dashboard");
    } catch (err) {
      toast(err.response?.data?.message || "Error creating household", "error");
    }
    setLoading(false);
  };

  // ── FIX 2: Send { code } not { inviteCode } ───────────────────────────
  const joinHousehold = async () => {
    if (!form.inviteCode.trim()) { toast("Enter invite code", "warning"); return; }
    setJoining(true);
    try {
      await axios.post(`${API}/household/join`, { code: form.inviteCode.trim() }, { headers });
      toast("Joined household successfully!", "success");
      navigate("/dashboard");
    } catch (err) {
      toast(err.response?.data?.message || "Invalid invite code", "error");
    }
    setJoining(false);
  };

  return (
    <div style={s.page}>
      {/* Background */}
      <img
        src="https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=1400&q=80"
        alt=""
        style={s.pageBg}
      />
      <div style={s.pageOverlay} />

      <div style={s.container}>
        {/* Brand */}
        <div style={s.brand}>
          <span style={s.brandEmoji}>🍽️</span>
          <span style={s.brandName}>HomeHub</span>
        </div>

        {/* Step Bar */}
        <div style={s.stepBar}>
          {STEPS.map((st, i) => (
            <div key={st} style={s.stepItem}>
              <div style={{
                ...s.stepDot,
                background:  i <= step ? "linear-gradient(135deg,#ff6b2b,#ff8c54)" : "rgba(255,255,255,0.15)",
                boxShadow:   i === step ? "0 4px 14px rgba(255,107,43,0.4)" : "none",
              }}>
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  ...s.stepLine,
                  background: i < step ? "#ff6b2b" : "rgba(255,255,255,0.1)",
                }} />
              )}
            </div>
          ))}
        </div>
        <p style={s.stepLabel}>{STEPS[step]}</p>

        <div style={s.card}>

          {/* ── Step 0: Name + Budget ─────────────────────────────────── */}
          {step === 0 && (
            <div style={s.stepContent}>
              <h2 style={s.cardTitle}>Name your household</h2>
              <p style={s.cardSub}>This is how your household will appear in the app</p>

              <div style={s.field}>
                <label style={s.label}>Household Name</label>
                <div style={s.iWrap}>
                  <span style={s.iIcon}>🏠</span>
                  <input
                    placeholder="e.g. The Sharma Family"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && form.name.trim() && setStep(1)}
                    style={s.input}
                  />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Monthly Budget (₹)</label>
                <div style={s.iWrap}>
                  <span style={s.iIcon}>💰</span>
                  <input
                    type="number"
                    placeholder="5000"
                    value={form.budget}
                    onChange={e => setForm({ ...form, budget: e.target.value })}
                    style={s.input}
                  />
                </div>
              </div>

              <button
                onClick={() => form.name.trim() && setStep(1)}
                style={{ ...s.nextBtn, opacity: form.name.trim() ? 1 : 0.5 }}
              >
                Next: Diet Preference →
              </button>

              {/* Join Section */}
              <div style={s.joinSection}>
                <p style={s.joinLabel}>Have an invite code?</p>
                <div style={s.joinRow}>
                  <div style={s.iWrap}>
                    <span style={s.iIcon}>🔑</span>
                    <input
                      placeholder="Enter invite code e.g. FP-AB12"
                      value={form.inviteCode}
                      onChange={e => setForm({ ...form, inviteCode: e.target.value })}
                      style={{ ...s.input, background: "rgba(255,255,255,0.07)" }}
                    />
                  </div>
                  <button onClick={joinHousehold} disabled={joining} style={s.joinBtn}>
                    {joining ? "Joining..." : "Join"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Diet ──────────────────────────────────────────── */}
          {step === 1 && (
            <div style={s.stepContent}>
              <h2 style={s.cardTitle}>What does your household eat?</h2>
              <p style={s.cardSub}>This helps us suggest the right recipes & meal plans</p>

              <div style={s.optionGrid}>
                {DIET_OPTIONS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setForm({ ...form, diet: d.value })}
                    style={{
                      ...s.optionCard,
                      border:    form.diet === d.value ? "2px solid #ff6b2b" : "2px solid transparent",
                      transform: form.diet === d.value ? "scale(1.03)" : "scale(1)",
                    }}
                  >
                    <img src={d.img} alt={d.label} style={s.optionImg} />
                    <div style={s.optionOverlay} />
                    <div style={s.optionContent}>
                      <span style={s.optionLabel}>{d.label}</span>
                      <span style={s.optionDesc}>{d.desc}</span>
                    </div>
                    {form.diet === d.value && <div style={s.optionCheck}>✓</div>}
                  </button>
                ))}
              </div>

              <div style={s.navBtns}>
                <button onClick={() => setStep(0)} style={s.backBtn}>← Back</button>
                <button onClick={() => setStep(2)} style={s.nextBtn}>Next: Mode →</button>
              </div>
            </div>
          )}

          {/* ── Step 2: Mode ──────────────────────────────────────────── */}
          {step === 2 && (
            <div style={s.stepContent}>
              <h2 style={s.cardTitle}>How do you manage expenses?</h2>
              <p style={s.cardSub}>You can always change this later in Settings</p>

              <div style={s.modeGrid}>
                {MODE_OPTIONS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setForm({ ...form, mode: m.value })}
                    style={{
                      ...s.modeCard,
                      border: form.mode === m.value ? "2px solid #ff6b2b" : "2px solid transparent",
                    }}
                  >
                    <img src={m.img} alt={m.label} style={s.modeImg} />
                    <div style={s.modeOverlay} />
                    <div style={s.modeContent}>
                      <span style={s.modeLabel}>{m.label}</span>
                      <span style={s.modeDesc}>{m.desc}</span>
                    </div>
                    {form.mode === m.value && <div style={s.optionCheck}>✓</div>}
                  </button>
                ))}
              </div>

              <div style={s.navBtns}>
                <button onClick={() => setStep(1)} style={s.backBtn}>← Back</button>
                <button onClick={createHousehold} disabled={loading} style={s.nextBtn}>
                  {loading ? "Creating..." : "🎉 Create HomeHub!"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { outline: none !important; border-color: rgba(255,107,43,0.6) !important; }
        a { text-decoration: none; }
      `}</style>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────
const s = {
  page:         { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", padding:"40px 20px", fontFamily:"'Plus Jakarta Sans', sans-serif" },
  pageBg:       { position:"fixed", inset:0, width:"100%", height:"100%", objectFit:"cover", zIndex:0 },
  pageOverlay:  { position:"fixed", inset:0, background:"rgba(26,20,16,0.85)", backdropFilter:"blur(2px)", zIndex:1 },
  container:    { position:"relative", zIndex:2, width:"100%", maxWidth:"580px" },

  brand:        { display:"flex", alignItems:"center", gap:"12px", justifyContent:"center", marginBottom:"28px" },
  brandEmoji:   { fontSize:"28px" },
  brandName:    { fontSize:"24px", fontWeight:"800", fontFamily:"'Playfair Display', serif", color:"white" },

  stepBar:      { display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"8px" },
  stepItem:     { display:"flex", alignItems:"center" },
  stepDot:      { width:"36px", height:"36px", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", fontWeight:"800", color:"white", flexShrink:0, transition:"all 0.3s" },
  stepLine:     { width:"40px", height:"2px", transition:"background 0.3s" },
  stepLabel:    { textAlign:"center", fontSize:"14px", color:"rgba(255,255,255,0.5)", fontWeight:"600", marginBottom:"20px" },

  card:         { background:"rgba(255,255,255,0.08)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"24px", padding:"32px", boxShadow:"0 32px 80px rgba(0,0,0,0.3)" },
  stepContent:  { display:"flex", flexDirection:"column", gap:"20px" },
  cardTitle:    { fontFamily:"'Playfair Display', serif", fontSize:"26px", fontWeight:"800", color:"white", margin:0 },
  cardSub:      { fontSize:"14px", color:"rgba(255,255,255,0.55)", marginTop:"-12px" },

  field:        { display:"flex", flexDirection:"column", gap:"6px" },
  label:        { fontSize:"11px", fontWeight:"700", color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.04em" },
  iWrap:        { position:"relative", display:"flex", alignItems:"center" },
  iIcon:        { position:"absolute", left:"13px", fontSize:"16px", zIndex:1 },
  input:        { width:"100%", padding:"14px 14px 14px 42px", border:"1.5px solid rgba(255,255,255,0.15)", borderRadius:"12px", fontSize:"15px", background:"rgba(255,255,255,0.08)", color:"white", transition:"all 0.2s" },

  nextBtn:      { padding:"15px", background:"linear-gradient(135deg,#ff6b2b,#ff8c54)", color:"white", border:"none", borderRadius:"14px", fontSize:"15px", fontWeight:"700", cursor:"pointer", boxShadow:"0 6px 20px rgba(255,107,43,0.35)", transition:"all 0.2s" },
  backBtn:      { padding:"15px 20px", background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.7)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"14px", fontSize:"14px", fontWeight:"600", cursor:"pointer" },
  navBtns:      { display:"flex", gap:"12px" },

  joinSection:  { borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:"16px" },
  joinLabel:    { fontSize:"12px", color:"rgba(255,255,255,0.4)", fontWeight:"600", marginBottom:"10px" },
  joinRow:      { display:"flex", gap:"10px" },
  joinBtn:      { padding:"14px 18px", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", color:"white", borderRadius:"12px", fontSize:"13px", fontWeight:"700", cursor:"pointer", whiteSpace:"nowrap" },

  optionGrid:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" },
  optionCard:   { position:"relative", borderRadius:"14px", overflow:"hidden", height:"120px", cursor:"pointer", padding:0, transition:"all 0.2s" },
  optionImg:    { position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" },
  optionOverlay:{ position:"absolute", inset:0, background:"rgba(26,20,16,0.55)" },
  optionContent:{ position:"absolute", bottom:0, left:0, right:0, padding:"12px" },
  optionLabel:  { display:"block", fontSize:"13px", fontWeight:"800", color:"white" },
  optionDesc:   { display:"block", fontSize:"10px", color:"rgba(255,255,255,0.6)" },
  optionCheck:  { position:"absolute", top:"8px", right:"8px", width:"22px", height:"22px", borderRadius:"50%", background:"#ff6b2b", color:"white", fontSize:"11px", fontWeight:"800", display:"flex", alignItems:"center", justifyContent:"center" },

  modeGrid:     { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" },
  modeCard:     { position:"relative", borderRadius:"14px", overflow:"hidden", height:"140px", cursor:"pointer", padding:0, transition:"all 0.2s" },
  modeImg:      { position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" },
  modeOverlay:  { position:"absolute", inset:0, background:"rgba(26,20,16,0.6)" },
  modeContent:  { position:"absolute", bottom:0, left:0, right:0, padding:"14px" },
  modeLabel:    { display:"block", fontSize:"14px", fontWeight:"800", color:"white", marginBottom:"3px" },
  modeDesc:     { display:"block", fontSize:"11px", color:"rgba(255,255,255,0.6)" },
};
