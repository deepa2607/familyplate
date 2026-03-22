// ══════════════════════════════════════════════════════════════════════════
//  server.js  —  HomeHub Smart Kitchen · Express Server
//  C:\projects\familyplate\server\server.js
// ══════════════════════════════════════════════════════════════════════════
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const dotenv   = require("dotenv");

dotenv.config();

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────
app.use(cors({
  origin:      ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));
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
    db:        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ── 404 ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Route " + req.method + " " + req.originalUrl + " not found" });
});

// ── Global error handler ───────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Server error:", err.message);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

// ── Connect DB then start ──────────────────────────────────────────────
const PORT      = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI;

if (!MONGO_URL) {
  console.error("MONGO_URL missing in .env file!");
  process.exit(1);
}

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log("Server running on http://localhost:" + PORT);
      console.log("Health check: http://localhost:" + PORT + "/api/health");
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

module.exports = app;