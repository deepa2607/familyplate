// ══════════════════════════════════════════════════════════════════════════
//  SetupHousehold.jsx  —  HomeHub Smart Kitchen  (FIXED)
//  C:\projects\familyplate\client\src\pages\SetupHousehold.jsx
//
//  FIXES:
//  1. createHousehold now correctly POSTs to /api/household/create ✅
//  2. After create, saves household to localStorage so Dashboard updates ✅
//  3. joinHousehold saves household to localStorage too ✅
//  4. Improved: added 4th success step with confetti-style animation ✅
//  5. Budget field has sensible default and validation ✅
// ══════════════════════════════════════════════════════════════════════════
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useToast } from "../components/Toast";

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
  const [created, setCreated] = useState(null); // holds the created household data

  // ── Save household to localStorage so all pages update immediately ──────
  const saveHouseholdLocally = (hhData) => {
    try {
      if (hhData) localStorage.setItem("homehub_household", JSON.stringify(hhData));
    } catch {}
  };

  // ── Create new household ─────────────────────────────────────────────────
  const createHousehold = async () => {
    if (!form.name.trim()) { toast("Enter a household name", "warning"); return; }
    setLoading(true);
    try {
      // POST /api/household/create  (route now exists in householdRoutes.js)
      const res = await API.post('/household/create', {
        name:           form.name.trim(),
        mode:           form.mode,
        foodPreference: form.diet,
        monthlyBudget:  parseFloat(form.budget) || 5000,
      });

      // Save household to localStorage so Dashboard loads it immediately
      saveHouseholdLocally(res.data.household || res.data);
      setCreated(res.data.household || res.data);
      setStep(3); // Go to success step
      toast("Household created! Welcome to HomeHub 🎉", "success");
    } catch (err) {
      toast(err.response?.data?.message || "Error creating household. Please try again.", "error");
    }
    setLoading(false);
  };

  // ── Join existing household ──────────────────────────────────────────────
  const joinHousehold = async () => {
    if (!form.inviteCode.trim()) { toast("Enter invite code", "warning"); return; }
    setJoining(true);
    try {
      // POST /api/household/join with { code }
      const res = await API.post('/household/join', {
        code: form.inviteCode.trim().toUpperCase(),
      });

      saveHouseholdLocally(res.data.household || res.data);
      toast(res.data.message || "Joined household! 🎉", "success");
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      toast(err.response?.data?.message || "Invalid invite code. Check it and try again.", "error");
    }
    setJoining(false);
  };

  return (
    <div style={s.page}>
      {/* Background */}
      <img src="https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=1400&q=80" alt="" style={s.pageBg}/>
      <div style={s.pageOverlay}/>

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
                <div style={{ ...s.stepLine, background: i < step ? "#ff6b2b" : "rgba(255,255,255,0.1)" }}/>
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
                <label style={s.label}>Household Name *</label>
                <div style={s.iWrap}>
                  <span style={s.iIcon}>🏠</span>
                  <input
                    placeholder="e.g. The Sharma Family, Squad, Home"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && form.name.trim() && setStep(1)}
                    style={s.input}
                    autoFocus
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
                    min="0"
                  />
                </div>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.35)", margin:"4px 0 0" }}>
                  Used to track spending vs budget on your Dashboard
                </p>
              </div>

              <button
                onClick={() => { if (form.name.trim()) setStep(1); else toast("Enter a household name first","warning"); }}
                style={{ ...s.nextBtn, opacity: form.name.trim() ? 1 : 0.55 }}
              >
                Next: Diet Preference →
              </button>

              {/* ── Join Section ── */}
              <div style={s.joinSection}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                  <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.1)" }}/>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", fontWeight:600 }}>OR JOIN EXISTING</span>
                  <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.1)" }}/>
                </div>
                <p style={s.joinLabel}>Have an invite code? Paste it below:</p>
                <div style={s.joinRow}>
                  <div style={{ ...s.iWrap, flex:1 }}>
                    <span style={s.iIcon}>🔑</span>
                    <input
                      placeholder="e.g. FP-3FB6"
                      value={form.inviteCode}
                      onChange={e => setForm({ ...form, inviteCode: e.target.value.toUpperCase() })}
                      onKeyDown={e => e.key === "Enter" && joinHousehold()}
                      style={{ ...s.input, background:"rgba(255,255,255,0.07)", fontFamily:"monospace", letterSpacing:"0.1em" }}
                    />
                  </div>
                  <button onClick={joinHousehold} disabled={joining || !form.inviteCode.trim()} style={{ ...s.joinBtn, opacity: joining || !form.inviteCode.trim() ? 0.6 : 1 }}>
                    {joining ? "Joining..." : "Join 🚪"}
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
                  <button key={d.value} onClick={() => setForm({ ...form, diet: d.value })} style={{
                    ...s.optionCard,
                    border:    form.diet === d.value ? "2px solid #ff6b2b" : "2px solid rgba(255,255,255,0.08)",
                    transform: form.diet === d.value ? "scale(1.03)" : "scale(1)",
                    boxShadow: form.diet === d.value ? "0 6px 20px rgba(255,107,43,0.3)" : "none",
                  }}>
                    <img src={d.img} alt={d.label} style={s.optionImg}/>
                    <div style={s.optionOverlay}/>
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
                  <button key={m.value} onClick={() => setForm({ ...form, mode: m.value })} style={{
                    ...s.modeCard,
                    border: form.mode === m.value ? "2px solid #ff6b2b" : "2px solid rgba(255,255,255,0.08)",
                    boxShadow: form.mode === m.value ? "0 6px 20px rgba(255,107,43,0.3)" : "none",
                  }}>
                    <img src={m.img} alt={m.label} style={s.modeImg}/>
                    <div style={s.modeOverlay}/>
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
                <button onClick={createHousehold} disabled={loading} style={{ ...s.nextBtn, opacity: loading ? 0.7 : 1 }}>
                  {loading ? (
                    <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                      <span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.3)", borderTop:"2px solid white", borderRadius:"50%", animation:"spin 0.7s linear infinite", display:"inline-block" }}/>
                      Creating...
                    </span>
                  ) : "🎉 Create HomeHub!"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Success ───────────────────────────────────────── */}
          {step === 3 && created && (
            <div style={{ ...s.stepContent, textAlign:"center", alignItems:"center" }}>
              <div style={{ fontSize:64, animation:"bounce 0.6s ease" }}>🎉</div>
              <h2 style={{ ...s.cardTitle, textAlign:"center" }}>Welcome to HomeHub!</h2>
              <p style={{ ...s.cardSub, textAlign:"center" }}>
                Your household <b style={{ color:"#ff8c54" }}>"{created.name}"</b> has been created.
              </p>

              {/* Household details card */}
              <div style={{ background:"rgba(255,107,43,0.1)", border:"1px solid rgba(255,107,43,0.25)", borderRadius:16, padding:"18px 22px", width:"100%", boxSizing:"border-box" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  {[
                    ["🔑 Invite Code", created.inviteCode || "—"],
                    ["💫 Mode",        created.mode === "split" ? "Split Mode" : "Family Mode"],
                    ["🥗 Diet",        created.foodPreference || form.diet],
                    ["💰 Budget",      `₹${(created.monthlyBudget || form.budget || 5000).toLocaleString("en-IN")}/month`],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 3px" }}>{label}</p>
                      <p style={{ fontSize:14, color:"white", fontWeight:700, margin:0 }}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)", margin:"4px 0" }}>
                Share the invite code with family members so they can join!
              </p>

              <button
                onClick={() => navigate("/dashboard")}
                style={{ ...s.nextBtn, width:"100%", fontSize:16 }}
              >
                Go to Dashboard →
              </button>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        input:focus { outline: none !important; border-color: rgba(255,107,43,0.6) !important; box-shadow: 0 0 0 3px rgba(255,107,43,0.1) !important; }
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
      `}</style>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────
const s = {
  page:         { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", padding:"40px 20px", fontFamily:"'Plus Jakarta Sans', sans-serif" },
  pageBg:       { position:"fixed", inset:0, width:"100%", height:"100%", objectFit:"cover", zIndex:0 },
  pageOverlay:  { position:"fixed", inset:0, background:"rgba(26,20,16,0.88)", backdropFilter:"blur(3px)", zIndex:1 },
  container:    { position:"relative", zIndex:2, width:"100%", maxWidth:"580px" },

  brand:        { display:"flex", alignItems:"center", gap:12, justifyContent:"center", marginBottom:28 },
  brandEmoji:   { fontSize:28 },
  brandName:    { fontSize:24, fontWeight:800, fontFamily:"'Playfair Display', serif", color:"white" },

  stepBar:      { display:"flex", alignItems:"center", justifyContent:"center", marginBottom:8 },
  stepItem:     { display:"flex", alignItems:"center" },
  stepDot:      { width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"white", flexShrink:0, transition:"all 0.35s" },
  stepLine:     { width:40, height:2, transition:"background 0.35s" },
  stepLabel:    { textAlign:"center", fontSize:14, color:"rgba(255,255,255,0.5)", fontWeight:600, marginBottom:20 },

  card:         { background:"rgba(255,255,255,0.07)", backdropFilter:"blur(24px)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:24, padding:32, boxShadow:"0 32px 80px rgba(0,0,0,0.35)" },
  stepContent:  { display:"flex", flexDirection:"column", gap:20 },
  cardTitle:    { fontFamily:"'Playfair Display', serif", fontSize:26, fontWeight:800, color:"white", margin:0 },
  cardSub:      { fontSize:14, color:"rgba(255,255,255,0.5)", marginTop:-12 },

  field:        { display:"flex", flexDirection:"column", gap:6 },
  label:        { fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:"0.04em" },
  iWrap:        { position:"relative", display:"flex", alignItems:"center" },
  iIcon:        { position:"absolute", left:13, fontSize:16, zIndex:1, pointerEvents:"none" },
  input:        { width:"100%", padding:"14px 14px 14px 42px", border:"1.5px solid rgba(255,255,255,0.15)", borderRadius:12, fontSize:15, background:"rgba(255,255,255,0.07)", color:"white", transition:"all 0.2s", boxSizing:"border-box" },

  nextBtn:      { padding:"15px", background:"linear-gradient(135deg,#ff6b2b,#ff8c54)", color:"white", border:"none", borderRadius:14, fontSize:15, fontWeight:700, cursor:"pointer", boxShadow:"0 6px 20px rgba(255,107,43,0.35)", transition:"all 0.2s", textAlign:"center" },
  backBtn:      { padding:"15px 20px", background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.7)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:14, fontSize:14, fontWeight:600, cursor:"pointer" },
  navBtns:      { display:"flex", gap:12 },

  joinSection:  { borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:18 },
  joinLabel:    { fontSize:12, color:"rgba(255,255,255,0.4)", fontWeight:600, marginBottom:10 },
  joinRow:      { display:"flex", gap:10 },
  joinBtn:      { padding:"14px 16px", background:"rgba(255,255,255,0.09)", border:"1px solid rgba(255,255,255,0.12)", color:"white", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.2s" },

  optionGrid:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 },
  optionCard:   { position:"relative", borderRadius:14, overflow:"hidden", height:120, cursor:"pointer", padding:0, transition:"all 0.25s" },
  optionImg:    { position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" },
  optionOverlay:{ position:"absolute", inset:0, background:"rgba(26,20,16,0.55)" },
  optionContent:{ position:"absolute", bottom:0, left:0, right:0, padding:12 },
  optionLabel:  { display:"block", fontSize:13, fontWeight:800, color:"white" },
  optionDesc:   { display:"block", fontSize:10, color:"rgba(255,255,255,0.55)" },
  optionCheck:  { position:"absolute", top:8, right:8, width:22, height:22, borderRadius:"50%", background:"#ff6b2b", color:"white", fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center" },

  modeGrid:     { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 },
  modeCard:     { position:"relative", borderRadius:14, overflow:"hidden", height:140, cursor:"pointer", padding:0, transition:"all 0.25s" },
  modeImg:      { position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" },
  modeOverlay:  { position:"absolute", inset:0, background:"rgba(26,20,16,0.62)" },
  modeContent:  { position:"absolute", bottom:0, left:0, right:0, padding:14 },
  modeLabel:    { display:"block", fontSize:14, fontWeight:800, color:"white", marginBottom:3 },
  modeDesc:     { display:"block", fontSize:11, color:"rgba(255,255,255,0.6)" },
};