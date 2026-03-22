// JoinHousehold.jsx — handles homehub.app/join?code=XXXX links
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "axios";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";


export default function JoinHousehold() {
  const [params]            = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading|needLogin|joining|success|error
  const [msg, setMsg]       = useState("");
  const [hh, setHh]         = useState(null);
  const [code, setCode]     = useState("");
  const navigate            = useNavigate();

  const inviteCode = params.get("code") || "";

  useEffect(() => {
    if (!inviteCode) { setStatus("error"); setMsg("No invite code in link."); return; }
    setCode(inviteCode);
    const token = localStorage.getItem("token");
    if (!token) { setStatus("needLogin"); return; }
    doJoin(inviteCode, token);
  }, [inviteCode]);

  const doJoin = async (invCode, token) => {
    setStatus("joining");
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // ── FIX 1: Correct preview endpoint ─────────────────────────────
      const preview = await axios
        .get(`${API}/household/invite-link/${invCode}`)   // no auth needed
        .catch(() => null);
      if (preview?.data) setHh(preview.data);

      // ── FIX 2: Send { code } not { inviteCode } ──────────────────────
      await axios.post(`${API}/household/join`, { code: invCode }, { headers });

      setStatus("success");
      setTimeout(() => navigate("/dashboard"), 2200);
    } catch (err) {
      setStatus("error");
      setMsg(err.response?.data?.message || "Invalid or expired invite code.");
    }
  };

  const handleLoginThenJoin = () => {
    localStorage.setItem("pendingInviteCode", code);
    navigate(`/?redirect=/join?code=${code}`);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#1a1410", padding: 20,
      fontFamily: "'Plus Jakarta Sans',sans-serif", position: "relative"
    }}>
      <img
        src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&q=70"
        alt=""
        style={{ position:"fixed", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.15 }}
      />

      <div style={{
        position: "relative", zIndex: 2, width: "100%", maxWidth: 460,
        background: "white", borderRadius: 28, padding: "44px 40px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.35)", textAlign: "center"
      }}>

        {/* ── Loading ───────────────────────────────────────────────── */}
        {status === "loading" && (
          <>
            <div style={{ fontSize:48, marginBottom:16 }}>🏠</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:800, margin:"0 0 8px" }}>
              Loading invite…
            </h2>
            <p style={{ color:"#9c8672", fontSize:14 }}>
              Checking invite code <strong>{inviteCode}</strong>
            </p>
            <div style={spinner("#ff6b2b")} />
          </>
        )}

        {/* ── Need Login ────────────────────────────────────────────── */}
        {status === "needLogin" && (
          <>
            <div style={{ fontSize:48, marginBottom:16 }}>🔑</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:800, margin:"0 0 8px", color:"#1a1410" }}>
              You're invited!
            </h2>
            <p style={{ color:"#9c8672", fontSize:14, marginBottom:8 }}>
              Invite code:{" "}
              <strong style={{ color:"#ff6b2b", fontFamily:"monospace", fontSize:18, letterSpacing:2 }}>
                {inviteCode}
              </strong>
            </p>
            <p style={{ color:"#9c8672", fontSize:13, marginBottom:28 }}>
              Sign in or create an account to join this household.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <button onClick={handleLoginThenJoin} style={btnPrimary}>
                Sign In to Join →
              </button>
              <Link
                to={`/register?invite=${inviteCode}`}
                style={btnSecondary}
              >
                Create Account & Join 🎉
              </Link>
            </div>
          </>
        )}

        {/* ── Joining ───────────────────────────────────────────────── */}
        {status === "joining" && (
          <>
            <div style={{ fontSize:48, marginBottom:16 }}>🏠</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:800, margin:"0 0 8px" }}>
              Joining household…
            </h2>
            {hh && (
              <p style={{ color:"#ff6b2b", fontSize:16, fontWeight:700, marginBottom:4 }}>
                🏡 {hh.name}
              </p>
            )}
            <div style={spinner("#ff6b2b")} />
          </>
        )}

        {/* ── Success ───────────────────────────────────────────────── */}
        {status === "success" && (
          <>
            <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:800, margin:"0 0 8px", color:"#1a1410" }}>
              You're in!
            </h2>
            {hh && (
              <p style={{ color:"#ff6b2b", fontSize:16, fontWeight:700, marginBottom:4 }}>
                Welcome to <strong>{hh.name}</strong>
              </p>
            )}
            <p style={{ color:"#9c8672", fontSize:13, marginBottom:24 }}>
              Taking you to your dashboard…
            </p>
            <div style={spinner("#22c55e")} />
          </>
        )}

        {/* ── Error ─────────────────────────────────────────────────── */}
        {status === "error" && (
          <>
            <div style={{ fontSize:48, marginBottom:16 }}>😕</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:800, margin:"0 0 8px", color:"#1a1410" }}>
              Invite not found
            </h2>
            <p style={{ color:"#9c8672", fontSize:14, marginBottom:24 }}>
              {msg || "This invite link is invalid or has expired."}
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <button
                onClick={() => navigate("/setup")}
                style={btnPrimary}
              >
                Enter Code Manually
              </button>
              <Link to="/dashboard" style={btnSecondary}>
                Go to Dashboard
              </Link>
            </div>
          </>
        )}

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────
const spinner = (color) => ({
  width: 40, height: 40,
  border: `3px solid ${color}33`,
  borderTopColor: color,
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
  margin: "20px auto 0",
});

const btnPrimary = {
  padding: "14px", background: "linear-gradient(135deg,#ff6b2b,#ff8c54)",
  color: "white", border: "none", borderRadius: 14, fontSize: 15,
  fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(255,107,43,0.3)",
  display: "block", textDecoration: "none", width: "100%",
};

const btnSecondary = {
  display: "block", padding: "14px",
  border: "1.5px solid rgba(139,94,60,0.18)", borderRadius: 14,
  fontSize: 14, fontWeight: 700, color: "#5c4a35",
  background: "rgba(255,255,255,0.6)", textDecoration: "none",
};
