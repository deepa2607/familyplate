// ForgotPassword.jsx — HomeHub Smart Kitchen
// familyplate/client/src/pages/ForgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";

export default function ForgotPassword() {
  const [step,    setStep]    = useState("email"); // email | sent | reset
  const [email,   setEmail]   = useState("");
  const [code,    setCode]    = useState("");
  const [pass,    setPass]    = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [showPass,setShowPass]= useState(false);

  const sendResetEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address"); return; }
    setLoading(true); setError("");
    try {
      await API.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      setStep("sent");
      setSuccess(`Reset instructions sent to ${email}`);
    } catch(err) {
      setError(err.response?.data?.message || "Email not found. Please check and try again.");
    }
    setLoading(false);
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) { setError("Please enter the reset code"); return; }
    setLoading(true); setError("");
    try {
      await API.post("/auth/verify-reset-code", { email, code: code.trim() });
      setStep("reset");
      setError("");
    } catch(err) {
      setError(err.response?.data?.message || "Invalid or expired code. Please try again.");
    }
    setLoading(false);
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (pass.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (pass !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    try {
      await API.post("/auth/reset-password", { email, code, newPassword: pass });
      setStep("done");
      setSuccess("Password reset successfully! You can now sign in.");
    } catch(err) {
      setError(err.response?.data?.message || "Failed to reset password. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"#1A1410", fontFamily:"'Plus Jakarta Sans',sans-serif", padding:20,
      position:"relative", overflow:"hidden",
    }}>
      {/* Background image */}
      <img src="https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=1400&q=80" alt=""
        style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.3}}/>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(26,20,16,0.95),rgba(26,20,16,0.85))"}}/>

      {/* Ambient glow */}
      <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,107,43,0.12),transparent 70%)",top:-100,left:-100,pointerEvents:"none"}}/>
      <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,0.1),transparent 70%)",bottom:-80,right:-80,pointerEvents:"none"}}/>

      <div style={{position:"relative",zIndex:2,width:"100%",maxWidth:440}}>

        {/* Brand */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:36,marginBottom:8}}>🍽️</div>
          <h1 style={{fontSize:24,fontWeight:800,color:"white",margin:"0 0 4px",fontFamily:"'Playfair Display',serif"}}>HomeHub</h1>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.4)",margin:0}}>Smart Kitchen</p>
        </div>

        {/* Card */}
        <div style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:24,padding:32,boxShadow:"0 32px 80px rgba(0,0,0,0.4)"}}>

          {/* Step indicators */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:0,marginBottom:28}}>
            {[{id:"email",n:1,l:"Email"},{id:"sent",n:2,l:"Verify"},{id:"reset",n:3,l:"Reset"}].map((s,i)=>{
              const isDone  = ["email","sent","reset","done"].indexOf(step) > i;
              const isActive = step===s.id || (step==="done"&&s.id==="reset");
              return (
                <div key={s.id} style={{display:"flex",alignItems:"center"}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <div style={{width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,
                      background:isDone||isActive?"linear-gradient(135deg,#ff6b2b,#ff8c54)":"rgba(255,255,255,0.1)",
                      color:"white",transition:"all 0.3s",
                      boxShadow:isActive?"0 4px 14px rgba(255,107,43,0.4)":"none",
                    }}>{isDone?"✓":s.n}</div>
                    <span style={{fontSize:9,fontWeight:600,color:isActive?"#ff8c54":"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.05em"}}>{s.l}</span>
                  </div>
                  {i<2&&<div style={{width:60,height:2,background:isDone?"#ff6b2b":"rgba(255,255,255,0.1)",margin:"0 4px 16px",transition:"background 0.3s"}}/>}
                </div>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:12,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:14}}>⚠️</span>
              <span style={{fontSize:12,color:"#fca5a5",fontWeight:600}}>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && step!=="done" && (
            <div style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:12,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:14}}>✅</span>
              <span style={{fontSize:12,color:"#86efac",fontWeight:600}}>{success}</span>
            </div>
          )}

          {/* ── Step: Email ── */}
          {step==="email" && (
            <form onSubmit={sendResetEmail} style={{display:"flex",flexDirection:"column",gap:16}}>
              <div>
                <h2 style={{fontSize:22,fontWeight:800,color:"white",margin:"0 0 6px",fontFamily:"'Playfair Display',serif"}}>Reset Password</h2>
                <p style={{fontSize:13,color:"rgba(255,255,255,0.45)",margin:0}}>Enter your email and we'll send reset instructions</p>
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:6}}>Email Address</label>
                <div style={{position:"relative",display:"flex",alignItems:"center"}}>
                  <span style={{position:"absolute",left:14,fontSize:16,opacity:0.5}}>📧</span>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required
                    style={{width:"100%",padding:"13px 14px 13px 44px",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:12,fontSize:14,background:"rgba(255,255,255,0.06)",color:"white",outline:"none",boxSizing:"border-box"}}
                    onFocus={e=>e.target.style.borderColor="rgba(255,107,43,0.6)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{padding:"14px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",border:"none",borderRadius:13,color:"white",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 6px 20px rgba(255,107,43,0.35)",opacity:loading?0.7:1,transition:"all 0.2s"}}>
                {loading?"Sending…":"Send Reset Instructions →"}
              </button>
              <Link to="/" style={{textAlign:"center",fontSize:12,color:"rgba(255,255,255,0.4)",textDecoration:"none",display:"block"}}>← Back to Sign In</Link>
            </form>
          )}

          {/* ── Step: Verify Code ── */}
          {step==="sent" && (
            <form onSubmit={verifyCode} style={{display:"flex",flexDirection:"column",gap:16}}>
              <div>
                <h2 style={{fontSize:22,fontWeight:800,color:"white",margin:"0 0 6px",fontFamily:"'Playfair Display',serif"}}>Check Your Email</h2>
                <p style={{fontSize:13,color:"rgba(255,255,255,0.45)",margin:0}}>Enter the 6-digit code sent to <strong style={{color:"#ff8c54"}}>{email}</strong></p>
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:6}}>Reset Code</label>
                <input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="000000" required
                  style={{width:"100%",padding:"13px 14px",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:12,fontSize:22,background:"rgba(255,255,255,0.06)",color:"white",outline:"none",boxSizing:"border-box",letterSpacing:"0.3em",textAlign:"center",fontWeight:800}}
                  onFocus={e=>e.target.style.borderColor="rgba(255,107,43,0.6)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
              </div>
              <button type="submit" disabled={loading||code.length<4} style={{padding:"14px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",border:"none",borderRadius:13,color:"white",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 6px 20px rgba(255,107,43,0.35)",opacity:loading||code.length<4?0.6:1}}>
                {loading?"Verifying…":"Verify Code →"}
              </button>
              <button type="button" onClick={()=>{setStep("email");setError("");setSuccess("");}} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:12,cursor:"pointer"}}>← Change email</button>
            </form>
          )}

          {/* ── Step: New Password ── */}
          {step==="reset" && (
            <form onSubmit={resetPassword} style={{display:"flex",flexDirection:"column",gap:16}}>
              <div>
                <h2 style={{fontSize:22,fontWeight:800,color:"white",margin:"0 0 6px",fontFamily:"'Playfair Display',serif"}}>Set New Password</h2>
                <p style={{fontSize:13,color:"rgba(255,255,255,0.45)",margin:0}}>Choose a strong password for your account</p>
              </div>
              {[{label:"New Password",val:pass,set:setPass,placeholder:"Min. 6 characters"},{label:"Confirm Password",val:confirm,set:setConfirm,placeholder:"Repeat password"}].map(({label,val,set,placeholder})=>(
                <div key={label}>
                  <label style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:6}}>{label}</label>
                  <div style={{position:"relative",display:"flex",alignItems:"center"}}>
                    <span style={{position:"absolute",left:14,fontSize:16,opacity:0.5}}>🔒</span>
                    <input type={showPass?"text":"password"} value={val} onChange={e=>set(e.target.value)} placeholder={placeholder} required
                      style={{width:"100%",padding:"13px 44px 13px 44px",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:12,fontSize:14,background:"rgba(255,255,255,0.06)",color:"white",outline:"none",boxSizing:"border-box"}}
                      onFocus={e=>e.target.style.borderColor="rgba(255,107,43,0.6)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
                    <button type="button" onClick={()=>setShowPass(s=>!s)} style={{position:"absolute",right:12,background:"none",border:"none",cursor:"pointer",fontSize:14,opacity:0.5}}>{showPass?"🙈":"👁️"}</button>
                  </div>
                </div>
              ))}
              <button type="submit" disabled={loading} style={{padding:"14px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",border:"none",borderRadius:13,color:"white",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 6px 20px rgba(255,107,43,0.35)",opacity:loading?0.7:1}}>
                {loading?"Resetting…":"Reset Password →"}
              </button>
            </form>
          )}

          {/* ── Step: Done ── */}
          {step==="done" && (
            <div style={{textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
              <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#16a34a,#22c55e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,boxShadow:"0 8px 28px rgba(22,163,74,0.4)",animation:"popIn 0.4s ease"}}>✅</div>
              <h2 style={{fontSize:22,fontWeight:800,color:"white",margin:0,fontFamily:"'Playfair Display',serif"}}>Password Reset!</h2>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.5)",margin:0}}>Your password has been updated successfully.</p>
              <Link to="/" style={{display:"block",width:"100%",padding:"14px",background:"linear-gradient(135deg,#ff6b2b,#ff8c54)",border:"none",borderRadius:13,color:"white",fontSize:15,fontWeight:700,textDecoration:"none",boxShadow:"0 6px 20px rgba(255,107,43,0.35)",marginTop:4,boxSizing:"border-box",textAlign:"center"}}>
                Sign In Now →
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
        input::placeholder{color:rgba(255,255,255,0.2)}
        input:focus{outline:none!important}
        @keyframes popIn{0%{transform:scale(0)}70%{transform:scale(1.15)}100%{transform:scale(1)}}
      `}</style>
    </div>
  );
}