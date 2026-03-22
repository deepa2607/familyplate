export default function HomeHubLogo({ size = 36, showText = false }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
      <svg
        width={size} height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#6366f1" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#818cf8" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background rounded square */}
        <rect width="48" height="48" rx="13" fill="url(#grad1)" />

        {/* House roof */}
        <path
          d="M24 9L8 22H13V38H35V22H40L24 9Z"
          fill="white"
          opacity="0.95"
          filter="url(#glow)"
        />

        {/* Door */}
        <rect x="19" y="27" width="10" height="11" rx="5" fill="url(#grad1)" />

        {/* Window left */}
        <rect x="13" y="24" width="5" height="5" rx="1.5" fill="url(#grad2)" opacity="0.9" />

        {/* Window right */}
        <rect x="30" y="24" width="5" height="5" rx="1.5" fill="url(#grad2)" opacity="0.9" />

        {/* Chimney */}
        <rect x="30" y="11" width="4" height="8" rx="1.5" fill="white" opacity="0.7" />

        {/* Smoke dot */}
        <circle cx="32" cy="9" r="2" fill="white" opacity="0.4" />
      </svg>

      {showText && (
        <div>
          <div style={{
            fontSize: size * 0.42,
            fontWeight: "800",
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg,#818cf8,#f97316)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1.1,
          }}>HomeHub</div>
          <div style={{
            fontSize: size * 0.22,
            color: "#374151",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>Household Manager</div>
        </div>
      )}
    </div>
  );
}
