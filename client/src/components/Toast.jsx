import { useState, createContext, useContext, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const configs = {
    success: { bg: "#f0faf5", border: "#b8e0c8", color: "#2d7a4f", icon: "✓" },
    error:   { bg: "#fff5f5", border: "#ffc8c8", color: "#c0392b", icon: "✕" },
    info:    { bg: "#f0f7ff", border: "#c8dcff", color: "#1565c0", icon: "i" },
    warning: { bg: "#fffbf0", border: "#ffdda0", color: "#d68910", icon: "!" },
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={s.container}>
        {toasts.map(toast => {
          const c = configs[toast.type] || configs.success;
          return (
            <div key={toast.id} style={{ ...s.toast, background: c.bg, border: `1px solid ${c.border}` }}>
              <span style={{ ...s.icon, background: `${c.color}18`, color: c.color }}>{c.icon}</span>
              <span style={{ ...s.msg, color: "#1a1410" }}>{toast.message}</span>
              <button style={{ ...s.close, color: c.color }} onClick={() => remove(toast.id)}>×</button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toastSlide {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const s = {
  container: {
    position: "fixed", bottom: "24px", right: "24px",
    display: "flex", flexDirection: "column", gap: "10px",
    zIndex: 9999, maxWidth: "360px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  toast: {
    display: "flex", alignItems: "center", gap: "12px",
    padding: "13px 16px", borderRadius: "14px",
    fontSize: "14px", fontWeight: "500",
    animation: "toastSlide 0.25s ease both",
    boxShadow: "0 8px 28px rgba(139,94,60,0.12)",
  },
  icon: {
    width: "26px", height: "26px", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "13px", fontWeight: "800", flexShrink: 0,
  },
  msg: { flex: 1, lineHeight: "1.4" },
  close: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: "20px", opacity: 0.5, padding: "0 2px", lineHeight: 1,
  },
};