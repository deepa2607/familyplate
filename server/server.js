// ══════════════════════════════════════════════════════════════════════════
//  server.js  —  HomeHub Smart Kitchen · Express Server  (FIXED)
//  C:\projects\familyplate\server\server.js
// ══════════════════════════════════════════════════════════════════════════
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const dotenv   = require("dotenv");

dotenv.config();

const app = express();

// ── CORS — function-based so wildcards actually work ───────────────────
// NOTE: passing an array with "https://familyplate-*.vercel.app" does NOTHING
// The cors package ignores glob patterns. Must use a function.
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://familyplate-git-main-deepa2607s-projects.vercel.app",
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (Render health checks, Postman, mobile apps)
    if (!origin) return callback(null, true);

    // Allow ANY *.vercel.app subdomain (covers all preview + production deployments)
    if (origin.endsWith(".vercel.app")) return callback(null, true);

    // Allow explicitly listed origins
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);

    // Allow CLIENT_URL set in Render environment variables
    if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return callback(null, true);

    // Block everything else
    console.warn(`CORS blocked: ${origin}`);
    callback(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Handle preflight OPTIONS for all routes
app.options("*", cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Request logger ─────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ── Routes ─────────────────────────────────────────────────────────────
app.use("/api/auth",      require("./routes/authRoutes"));
app.use("/api/household", require("./routes/householdRoutes"));
app.use("/api/purchase",  require("./routes/purchaseRoutes"));
app.use("/api/pantry",    require("./routes/pantryRoutes"));
app.use("/api/admin",     require("./routes/adminRoutes"));
app.use("/api/chat",      require("./routes/chatRoutes"));
app.use("/api/grocery",   require("./routes/groceryRoutes"));
app.use("/api/recipe",    require("./routes/recipeRoutes"));
app.use("/api/nutrition", require("./routes/nutritionRoutes"));

// ── Health check ───────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status:    "ok",
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV || "development",
    db:        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ── 404 handler ────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ── Global error handler ───────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Server error:", err.message);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

// ── Connect MongoDB then start server ──────────────────────────────────
const PORT      = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI;

if (!MONGO_URL) {
  console.error("❌  MONGO_URL is missing in .env — please add it!");
  process.exit(1);
}

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("✅  MongoDB connected");
    app.listen(PORT, () => {
      console.log(`✅  Server running on port ${PORT}`);
      console.log(`    Health → http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1);
  });

module.exports = app;