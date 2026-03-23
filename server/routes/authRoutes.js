// ══════════════════════════════════════════════════════════════════════════
//  routes/authRoutes.js  —  Register · Login · Forgot Password  (FIXED)
//  C:\projects\familyplate\server\routes\authRoutes.js
//
//  KEY FIX: login now always returns role in the response so
//  AdminRoute in App.jsx can correctly redirect to /admin
// ══════════════════════════════════════════════════════════════════════════
const express  = require("express");
const router   = express.Router();
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const crypto   = require("crypto");
const User     = require("../models/User");
const auth     = require("../middleware/authMiddleware");

const JWT_SECRET = process.env.JWT_SECRET || "homehub_secret_key";

// In-memory reset token store (fine for hobby/prod — resets on server restart)
const resetTokens = {};

// ══════════════════════════════════════
//  POST /api/auth/register
// ══════════════════════════════════════
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, securityQuestions } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password are required" });

    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ message: "Email already registered" });

    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name:              name.trim(),
      email:             email.toLowerCase().trim(),
      password:          hashed,
      role:              "member",
      securityQuestions: securityQuestions || [],
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      token,
      user: {
        _id:   user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,   // always include role
      },
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  POST /api/auth/login
//  FIXED: role is now always in the response
//  This is what makes AdminRoute work correctly in App.jsx
// ══════════════════════════════════════
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(400).json({ message: "No account found with this email" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Incorrect password" });

    console.log(`LOGIN ✓  ${user.email}  |  role: ${user.role}`);

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    // ── CRITICAL: role MUST be in this response ──────────────────────────
    // App.jsx > AdminRoute reads user.role from localStorage("user")
    // If role is missing here, admin login always falls through to /dashboard
    res.json({
      token,
      user: {
        _id:       user._id,
        name:      user.name,
        email:     user.email,
        role:      user.role,        // ← THIS is what fixes the admin redirect
        household: user.household,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  GET /api/auth/me  —  get logged-in user
// ══════════════════════════════════════
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -securityQuestions");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════
//  POST /api/auth/make-me-admin
//  Since you already have admin credentials, use this ONLY if your role
//  somehow got reset. Requires your current JWT token to call it.
// ══════════════════════════════════════════════════════════════════════
router.post("/make-me-admin", auth, async (req, res) => {
  try {
    const ADMIN_SECRET = process.env.ADMIN_SECRET || "homehub_admin_2024";
    const { secret } = req.body;

    if (secret !== ADMIN_SECRET)
      return res.status(403).json({ message: "Wrong secret" });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { role: "admin" },
      { new: true }
    );

    console.log(`ADMIN PROMOTED: ${user.email}`);
    res.json({
      message: `${user.name} is now admin! Log out and log back in.`,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  FORGOT PASSWORD — Step 1: Get security questions
//  POST /api/auth/forgot-password/questions
// ══════════════════════════════════════
router.post("/forgot-password/questions", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    if (!user)
      return res.status(404).json({ message: "No account found with this email address." });

    if (!user.securityQuestions || user.securityQuestions.length < 2)
      return res.status(400).json({
        message: "This account has no security questions set up. Please contact support.",
      });

    res.json({ questions: user.securityQuestions.map(q => q.question) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  FORGOT PASSWORD — Step 2: Verify answers
//  POST /api/auth/forgot-password/verify
// ══════════════════════════════════════
router.post("/forgot-password/verify", async (req, res) => {
  try {
    const { email, answers } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    if (!user)
      return res.status(404).json({ message: "User not found." });

    if (!user.securityQuestions || user.securityQuestions.length === 0)
      return res.status(400).json({ message: "No security questions configured." });

    const allCorrect = user.securityQuestions.every((q, i) => {
      const userAns = (answers?.[i] || "").toLowerCase().trim();
      const stored  = (q.answer || "").toLowerCase().trim();
      return userAns === stored;
    });

    if (!allCorrect)
      return res.status(400).json({
        message: "Incorrect answers. Please check your spelling and try again.",
      });

    const resetToken = crypto.randomBytes(32).toString("hex");
    resetTokens[email.toLowerCase()] = {
      token:   resetToken,
      expires: Date.now() + 15 * 60 * 1000,
    };

    res.json({ resetToken, message: "Identity verified! You can now reset your password." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  FORGOT PASSWORD — Step 3: Set new password
//  POST /api/auth/forgot-password/reset
// ══════════════════════════════════════
router.post("/forgot-password/reset", async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    const key    = email?.toLowerCase();
    const stored = resetTokens[key];

    if (!stored || stored.token !== resetToken)
      return res.status(400).json({ message: "Invalid or expired reset token. Please start over." });

    if (Date.now() > stored.expires)
      return res.status(400).json({ message: "Reset session expired (15 min). Please start over." });

    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters." });

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email: key }, { password: hashed });

    delete resetTokens[key];
    res.json({ message: "Password reset successfully! You can now log in with your new password." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;