import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";


export default function ForgotPassword() {
  const nav = useNavigate();
  const [step, setStep]       = useState(1); // 1=email, 2=security questions, 3=new password
  const [email, setEmail]     = useState("");
  const [questions, setQuestions] = useState([]); // from server
  const [answers, setAnswers] = useState(["", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Step 1: Look up email, get security questions
  const lookupEmail = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/forgot-password/questions`, { email });
      setQuestions(res.data.questions || []);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Email not found in our system.");
    }
    setLoading(false);
  };

  // Step 2: Verify security answers
  const verifyAnswers = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/forgot-password/verify`, {
        email,
        answers: answers.map(a => a.toLowerCase().trim()),
      });
      setResetToken(res.data.resetToken);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Incorrect answers. Please try again.");
    }
    setLoading(false);
  };

  // Step 3: Set new password
  const resetPassword = async (e) => {
    e.preventDefault();
    if (newPass !== confirm) { setError("Passwords don't match"); return; }
    if (newPass.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError(""); setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password/reset`, {
        email,
        resetToken,
        newPassword: newPass,
      });
      setSuccess("Password reset successfully! Redirecting to login…");
      setTimeout(() => nav("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. Please start over.");
    }
    setLoading(false);
  };

  const STEP_LABELS = ["Find Account", "Verify Identity", "New Password"];

  return (
    <div style={styles.root}>
      <div style={styles.blob1}/>
      <div style={styles.blob2}/>

      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerIcon}>
            {step===1 ? "🔍" : step===2 ? "🔐" : "🔑"}
          </div>
          <div>
            <h1 style={styles.title}>Reset Password</h1>
            <p style={styles.subtitle}>Step {step} of 3 — {STEP_LABELS[step-1]}</p>
          </div>
        </div>

        {/* Progress */}
        <div style={styles.progressWrap}>
          {[1,2,3].map(s=>(
            <div key={s} style={{display:"flex",alignItems:"center",flex:s<3?1:0}}>
              <div style={{
                width:28,height:28,borderRadius:"50%",
                background: s<=step ? "linear-gradient(135deg,#e46033,#f07848)" : "rgba(255,255,255,0.06)",
                border: s<=step ? "none" : "1px solid rgba(255,255,255,0.1)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:12,fontWeight:800,color: s<=step ? "white" : "rgba(255,255,255,0.3)",
                flexShrink:0,transition:"all 0.3s",
              }}>{s<step?"✓":s}</div>
              {s<3 && <div style={{flex:1,height:2,background: s<step?"#e46033":"rgba(255,255,255,0.06)",margin:"0 6px",transition:"all 0.3s"}}/>}
            </div>
          ))}
        </div>

        {error && <div style={styles.errorBox}><span>⚠️</span> {error}</div>}
        {success && <div style={styles.successBox}><span>✅</span> {success}</div>}

        {/* STEP 1 — Email */}
        {step===1 && (
          <form onSubmit={lookupEmail} style={styles.form}>
            <p style={styles.desc}>Enter your registered email address and we'll ask you your security questions.</p>
            <div style={styles.field}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>✉️</span>
                <input
                  type="email" value={email}
                  onChange={e=>setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  style={styles.input}
                  onFocus={e=>e.target.style.borderColor="#e46033"}
                  onBlur={e=>e.target.style.borderColor="rgba(228,96,51,0.2)"}
                />
              </div>
            </div>
            <button type="submit" disabled={loading} style={{...styles.btn,opacity:loading?0.7:1}}>
              {loading ? "Looking up…" : "Find My Account →"}
            </button>
          </form>
        )}

        {/* STEP 2 — Security Questions */}
        {step===2 && (
          <form onSubmit={verifyAnswers} style={styles.form}>
            <p style={styles.desc}>Answer your security questions to verify your identity.</p>
            {questions.map((q,i)=>(
              <div key={i} style={styles.questionCard}>
                <div style={styles.questionText}>❓ {q}</div>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}>💬</span>
                  <input
                    type="text" value={answers[i]}
                    onChange={e=>{const a=[...answers];a[i]=e.target.value;setAnswers(a);}}
                    placeholder="Your answer…" required
                    style={styles.input}
                    onFocus={e=>e.target.style.borderColor="#e46033"}
                    onBlur={e=>e.target.style.borderColor="rgba(228,96,51,0.2)"}
                  />
                </div>
              </div>
            ))}
            <div style={{display:"flex",gap:10}}>
              <button type="button" onClick={()=>setStep(1)} style={styles.backBtn}>← Back</button>
              <button type="submit" disabled={loading} style={{...styles.btn,flex:1,opacity:loading?0.7:1}}>
                {loading?"Verifying…":"Verify Identity →"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3 — New Password */}
        {step===3 && (
          <form onSubmit={resetPassword} style={styles.form}>
            <p style={styles.desc}>Identity verified! Set your new password.</p>
            {[
              {key:"newPass",  label:"New Password",     val:newPass,  set:setNewPass,  placeholder:"At least 6 characters"},
              {key:"confirm",  label:"Confirm Password", val:confirm,  set:setConfirm,  placeholder:"Re-enter new password"},
            ].map(({key,label,val,set,placeholder})=>(
              <div key={key} style={styles.field}>
                <label style={styles.label}>{label}</label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}>🔒</span>
                  <input
                    type={showPass?"text":"password"} value={val}
                    onChange={e=>set(e.target.value)}
                    placeholder={placeholder} required
                    style={styles.input}
                    onFocus={e=>e.target.style.borderColor="#e46033"}
                    onBlur={e=>e.target.style.borderColor="rgba(228,96,51,0.2)"}
                  />
                </div>
              </div>
            ))}
            <button type="button" onClick={()=>setShowPass(!showPass)} style={styles.showPassBtn}>
              {showPass?"🙈 Hide":"👁️ Show"} passwords
            </button>
            {/* Password strength */}
            {newPass && (
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{flex:1,height:3,background:"rgba(255,255,255,0.06)",borderRadius:2}}>
                  <div style={{height:"100%",borderRadius:2,transition:"all 0.3s",
                    width: newPass.length<6?"30%":newPass.length<10?"60%":"100%",
                    background: newPass.length<6?"#ef4444":newPass.length<10?"#f97316":"#22c55e"
                  }}/>
                </div>
                <span style={{fontSize:11,color:newPass.length<6?"#ef4444":newPass.length<10?"#f97316":"#22c55e",fontWeight:600}}>
                  {newPass.length<6?"Weak":newPass.length<10?"Fair":"Strong"}
                </span>
              </div>
            )}
            <button type="submit" disabled={loading} style={{...styles.btn,opacity:loading?0.7:1}}>
              {loading?"Resetting…":"Reset Password 🎉"}
            </button>
          </form>
        )}

        <p style={styles.backToLogin}>
          Remember it? <Link to="/login" style={styles.link}>Back to Login</Link>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes blob { 0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%} 50%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:focus { outline: none !important; }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight:"100vh", background:"#0d0d14", display:"flex", alignItems:"center",
    justifyContent:"center", fontFamily:"'DM Sans',sans-serif", position:"relative",
    overflow:"hidden", padding:"20px",
  },
  blob1: {
    position:"absolute", width:500, height:500,
    background:"radial-gradient(circle,rgba(228,96,51,0.12),transparent 70%)",
    top:"-150px", left:"-150px", animation:"blob 8s ease-in-out infinite",
    borderRadius:"60% 40% 30% 70%/60% 30% 70% 40%",
  },
  blob2: {
    position:"absolute", width:400, height:400,
    background:"radial-gradient(circle,rgba(228,96,51,0.08),transparent 70%)",
    bottom:"-100px", right:"-100px", animation:"blob 10s ease-in-out infinite reverse",
    borderRadius:"40% 60% 70% 30%",
  },
  card: {
    width:"100%", maxWidth:460, background:"linear-gradient(145deg,#1a1a24,#14141e)",
    border:"2px solid rgba(228,96,51,0.3)", borderRadius:24,
    boxShadow:"0 0 60px rgba(228,96,51,0.15)",
    padding:"36px", position:"relative", zIndex:1,
    animation:"fadeSlideUp 0.6s ease forwards",
  },
  header: { display:"flex", alignItems:"center", gap:14, marginBottom:24 },
  headerIcon: {
    width:48, height:48, borderRadius:14,
    background:"linear-gradient(135deg,#e46033,#b83e1a)",
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:22, flexShrink:0, boxShadow:"0 4px 20px rgba(228,96,51,0.4)",
  },
  title: { fontSize:22, fontWeight:800, color:"white", fontFamily:"'Syne',sans-serif", marginBottom:2 },
  subtitle: { fontSize:12, color:"rgba(255,255,255,0.4)" },
  progressWrap: { display:"flex", alignItems:"center", marginBottom:24, padding:"0 4px" },
  errorBox: {
    background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)",
    borderRadius:10, padding:"10px 14px", fontSize:13, color:"#fca5a5",
    marginBottom:16, display:"flex", alignItems:"center", gap:8,
  },
  successBox: {
    background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)",
    borderRadius:10, padding:"10px 14px", fontSize:13, color:"#86efac",
    marginBottom:16, display:"flex", alignItems:"center", gap:8,
  },
  form: { display:"flex", flexDirection:"column", gap:14 },
  desc: { fontSize:13, color:"rgba(255,255,255,0.45)", lineHeight:1.6 },
  field: { display:"flex", flexDirection:"column", gap:6 },
  label: { fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.8px" },
  inputWrap: { position:"relative", display:"flex", alignItems:"center" },
  inputIcon: { position:"absolute", left:12, fontSize:13, pointerEvents:"none", zIndex:1 },
  input: {
    width:"100%", height:46, background:"rgba(255,255,255,0.04)",
    border:"1px solid rgba(228,96,51,0.2)", borderRadius:10,
    paddingLeft:38, paddingRight:12, color:"white", fontSize:14,
    fontFamily:"'DM Sans',sans-serif", transition:"border-color 0.2s",
  },
  questionCard: {
    background:"rgba(228,96,51,0.06)", border:"1px solid rgba(228,96,51,0.15)",
    borderRadius:12, padding:"14px", display:"flex", flexDirection:"column", gap:10,
  },
  questionText: { fontSize:13, color:"rgba(255,255,255,0.7)", fontWeight:600, lineHeight:1.4 },
  btn: {
    height:48, background:"linear-gradient(135deg,#e46033,#f07848)", border:"none",
    borderRadius:10, color:"white", fontSize:14, fontWeight:700, cursor:"pointer",
    fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 20px rgba(228,96,51,0.35)",
    transition:"all 0.2s",
  },
  backBtn: {
    height:48, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
    borderRadius:10, color:"rgba(255,255,255,0.5)", fontSize:14, cursor:"pointer",
    fontFamily:"'DM Sans',sans-serif", padding:"0 18px",
  },
  showPassBtn: {
    background:"none", border:"none", color:"rgba(255,255,255,0.35)",
    fontSize:12, cursor:"pointer", textAlign:"left", padding:0, fontFamily:"inherit",
  },
  backToLogin: { marginTop:20, fontSize:13, color:"rgba(255,255,255,0.3)", textAlign:"center" },
  link: { color:"#e46033", fontWeight:700, textDecoration:"none" },
};