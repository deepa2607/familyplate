// NotificationSystem.jsx
// FIX 1: Clear button wipes ALL notifications
// FIX 2: NotificationBell is named export
// FIX 3: useExpiryNotification + useLowStockNotification exported
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const API         = "http://localhost:5000/api";
const STORAGE_KEY = "homehub_notifications";
const MAX_NOTIFS  = 50;

const ICONS = {
  checkout:"🛒", lowStock:"⚠️", expiry:"📅",
  purchase:"💰", settle:"✅",  member:"👥",
  meal:"🍽️",    info:"ℹ️",    success:"✅",
  warning:"⚠️",  error:"❌",
};

const NotificationContext = createContext(null);
export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFS))); }
    catch {}
  }, [notifications]);

  const push = useCallback((title, body = "", type = "info", householdId = null) => {
    const notif = {
      id: Date.now() + Math.random(),
      title, body, type, householdId,
      read: false, createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [notif, ...prev].slice(0, MAX_NOTIFS));
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try { new Notification(`HomeHub · ${title}`, { body, icon: "/icon-192.png" }); } catch {}
    }
    return notif.id;
  }, []);

  const markRead    = useCallback(id   => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)), []);
  const markAllRead = useCallback(hhId => setNotifications(prev => prev.map(n =>
    (!hhId || n.householdId === hhId || !n.householdId) ? { ...n, read: true } : n
  )), []);

  // FIX: clear() always wipes everything and clears localStorage
  const clear = useCallback(() => {
    setNotifications([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const getForHousehold = useCallback(hhId =>
    notifications.filter(n => !n.householdId || n.householdId === hhId),
    [notifications]
  );

  const unreadCount = useCallback(hhId => {
    const r = hhId ? getForHousehold(hhId) : notifications;
    return r.filter(n => !n.read).length;
  }, [notifications, getForHousehold]);

  return (
    <NotificationContext.Provider value={{ notifications, push, markRead, markAllRead, clear, getForHousehold, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useLowStockChecker(household, pantryItems) {
  const { push } = useNotifications();
  const alerted  = useRef(new Set());
  const checkStock = useCallback((items, hhId, hhName) => {
    if (!Array.isArray(items) || !hhId) return;
    items.forEach(item => {
      const qty    = Number(item.quantity || item.qty || 0);
      const minQty = Number(item.minQuantity || item.minQty || item.threshold || 2);
      const key    = `${hhId}_${item._id || item.name}`;
      if (qty <= minQty && !alerted.current.has(key)) {
        alerted.current.add(key);
        push(`${item.name}`, `Only ${qty} ${item.unit || "units"} left in ${hhName || "your household"}.`, "lowStock", hhId);
      }
      if (qty > minQty && alerted.current.has(key)) alerted.current.delete(key);
    });
  }, [push]);
  useEffect(() => {
    if (household?._id && pantryItems?.length > 0) checkStock(pantryItems, household._id, household.name);
  }, [pantryItems, household, checkStock]);
  return { checkStock };
}

export function useLowStockNotification() {
  const { push } = useNotifications();
  const alerted  = useRef(new Set());
  return useCallback((items) => {
    if (!Array.isArray(items)) return;
    items.forEach(item => {
      const qty    = Number(item.quantity || item.qty || 0);
      const minQty = Number(item.minQuantity || item.minQty || item.threshold || 2);
      const key    = `ls_${item._id || item.name}`;
      if (qty <= minQty && !alerted.current.has(key)) {
        alerted.current.add(key);
        push(`Low Stock: ${item.name}`, `Only ${qty} ${item.unit || "units"} left. Add to grocery list!`, "lowStock");
      }
      if (qty > minQty && alerted.current.has(key)) alerted.current.delete(key);
    });
  }, [push]);
}

export function useExpiryNotification() {
  const { push } = useNotifications();
  const alerted  = useRef(new Set());
  return useCallback((items) => {
    if (!Array.isArray(items)) return;
    const now = new Date();
    items.forEach(item => {
      if (!item.expiryDate) return;
      const expiry   = new Date(item.expiryDate);
      const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      const key      = `exp_${item._id || item.name}`;
      if (daysLeft <= 0 && !alerted.current.has(key + "_expired")) {
        alerted.current.add(key + "_expired");
        push(`Expired: ${item.name}`, `${item.name} expired. Remove from pantry.`, "expiry");
      } else if (daysLeft > 0 && daysLeft <= 3 && !alerted.current.has(key + "_soon")) {
        alerted.current.add(key + "_soon");
        push(`Expiring: ${item.name}`, `Expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`, "expiry");
      }
    });
  }, [push]);
}

// ══════════════════════════════════════════════════════════════════════
//  NOTIFICATION BELL
// ══════════════════════════════════════════════════════════════════════
export function NotificationBell() {
  const { getForHousehold, markAllRead, markRead, clear, push } = useNotifications();
  const [open,      setOpen]      = useState(false);
  const [household, setHousehold] = useState(null);
  const [permReq,   setPermReq]   = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.get(`${API}/household/myhousehold`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setHousehold(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const h = e => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const householdNotifs = household?._id ? getForHousehold(household._id) : [];
  const unread          = householdNotifs.filter(n => !n.read).length;

  const requestPush = async () => {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPermReq(true);
    if (p === "granted") push("Notifications enabled!", "You'll receive alerts for low stock and expiry.", "success", household?._id);
  };

  const fmt = iso => {
    const d = Date.now() - new Date(iso).getTime();
    if (d < 60000)    return "just now";
    if (d < 3600000)  return `${Math.floor(d / 60000)}m ago`;
    if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div style={{ position: "relative" }} ref={panelRef}>
      <button onClick={() => setOpen(v => !v)} title="Notifications" style={{
        position: "relative", width: 38, height: 38, borderRadius: "50%",
        background: open ? "rgba(255,107,43,0.12)" : "transparent",
        border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, transition: "all .2s",
      }}>
        🔔
        {unread > 0 && (
          <span style={{
            position: "absolute", top: 2, right: 2,
            minWidth: 17, height: 17, borderRadius: 50,
            background: "#ef4444", color: "white",
            fontSize: 9, fontWeight: 900,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 3px", border: "2px solid white",
            animation: "notifPulse 2s infinite",
          }}>{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)",
          width: 360, maxHeight: 500,
          background: "white", borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(139,94,60,0.08)",
          zIndex: 9999, display: "flex", flexDirection: "column", overflow: "hidden",
          animation: "notifDropIn 0.2s ease",
          fontFamily: "'Plus Jakarta Sans',sans-serif",
        }}>
          <div style={{
            padding: "14px 18px", borderBottom: "1px solid rgba(139,94,60,0.08)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "linear-gradient(135deg,#fffaf5,white)",
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#1a1410" }}>🔔 Notifications</div>
              <div style={{ fontSize: 11, color: "#9c8672", marginTop: 2 }}>
                {household?.name || "Your household"} · {unread > 0 ? `${unread} unread` : "All caught up!"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {unread > 0 && (
                <button onClick={() => markAllRead(household?._id)} style={bs.btn}>Mark all read</button>
              )}
              {householdNotifs.length > 0 && (
                <button onClick={() => { clear(); setOpen(false); }} style={{
                  ...bs.btn, color: "#dc2626",
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.12)",
                }}>Clear All</button>
              )}
            </div>
          </div>

          {typeof Notification !== "undefined" && Notification.permission === "default" && !permReq && (
            <div style={{ padding: "10px 18px", background: "rgba(59,130,246,0.05)", borderBottom: "1px solid rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "#1d4ed8", fontWeight: 600 }}>Enable push notifications?</span>
              <button onClick={requestPush} style={{ padding: "4px 10px", borderRadius: 8, background: "#3b82f6", border: "none", color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Enable</button>
            </div>
          )}

          <div style={{ overflowY: "auto", flex: 1 }}>
            {householdNotifs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🔕</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1410", marginBottom: 4 }}>No notifications</div>
                <div style={{ fontSize: 12, color: "#9c8672" }}>You're all caught up!</div>
              </div>
            ) : (
              householdNotifs.map(n => (
                <div key={n.id} onClick={() => markRead(n.id)} style={{
                  display: "flex", gap: 12, padding: "13px 18px",
                  borderBottom: "1px solid rgba(139,94,60,0.06)",
                  background: n.read ? "transparent" : "rgba(255,107,43,0.03)",
                  cursor: "pointer", transition: "background .15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(139,94,60,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : "rgba(255,107,43,0.03)"}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background:
                      n.type === "lowStock" ? "rgba(239,68,68,0.1)" :
                      n.type === "expiry"   ? "rgba(245,158,11,0.1)" :
                      n.type === "settle"   ? "rgba(34,197,94,0.1)" :
                      "rgba(139,94,60,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  }}>
                    {ICONS[n.type] || ICONS.info}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: n.read ? 600 : 800, fontSize: 13, color: "#1a1410", marginBottom: 2 }}>{n.title}</div>
                    {n.body && (
                      <div style={{ fontSize: 11, color: "#9c8672", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {n.body}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: "#b0a090", marginTop: 3 }}>{fmt(n.createdAt)}</div>
                  </div>
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff6b2b", flexShrink: 0, marginTop: 4 }} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes notifPulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.8;transform:scale(1.1)} }
        @keyframes notifDropIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
      `}</style>
    </div>
  );
}

const bs = {
  btn: {
    padding: "4px 10px", borderRadius: 8,
    background: "rgba(255,107,43,0.08)", border: "1px solid rgba(255,107,43,0.15)",
    color: "#ff6b2b", fontSize: 11, fontWeight: 700, cursor: "pointer",
  },
};

export default NotificationBell;