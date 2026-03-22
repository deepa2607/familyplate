// ══════════════════════════════════════════════════════════════
//  ADD THESE 3 ROUTES TO YOUR server/routes/authRoutes.js
//  And update the User model to store securityQuestions
// ══════════════════════════════════════════════════════════════

// ── 1. Add to User model (server/models/User.js) ──
// Inside the userSchema, add this field:
/*
securityQuestions: [{
  question: { type: String },
  answer:   { type: String }, // store as lowercase hash or plain lowercase
}],
*/

// ── 2. Update register route to save security questions ──
// In your existing POST /register route, after creating user, add:
/*
if (req.body.securityQuestions) {
  user.securityQuestions = req.body.securityQuestions;
  await user.save();
}
*/

// ── 3. Add these 3 new routes to authRoutes.js ──

const express = require("express");
const router  = express.Router();
const User    = require("../models/User");
const bcrypt  = require("bcryptjs");
const crypto  = require("crypto");

// Temporary reset tokens store (in production use Redis or DB)
const resetTokens = {};

// GET security questions for an email
router.post("/forgot-password/questions", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "No account found with this email address." });
    if (!user.securityQuestions || user.securityQuestions.length < 2) {
      return res.status(400).json({ message: "This account has no security questions set up. Please contact support." });
    }
    // Return only the questions, NOT the answers
    res.json({ questions: user.securityQuestions.map(q => q.question) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Verify security question answers
router.post("/forgot-password/verify", async (req, res) => {
  try {
    const { email, answers } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found." });

    // Check both answers (case-insensitive)
    const correct = user.securityQuestions.every((q, i) =>
      answers[i] && q.answer.toLowerCase().trim() === answers[i].toLowerCase().trim()
    );

    if (!correct) return res.status(400).json({ message: "Incorrect answers. Please try again carefully." });

    // Generate a short-lived reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    resetTokens[email] = { token: resetToken, expires: Date.now() + 15 * 60 * 1000 }; // 15 min

    res.json({ resetToken, message: "Identity verified successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Reset password with token
router.post("/forgot-password/reset", async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    // Validate token
    const stored = resetTokens[email];
    if (!stored || stored.token !== resetToken || Date.now() > stored.expires) {
      return res.status(400).json({ message: "Reset session expired. Please start over." });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    // Hash new password and save
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    await User.findOneAndUpdate({ email: email.toLowerCase() }, { password: hashed });

    // Clean up token
    delete resetTokens[email];

    res.json({ message: "Password reset successfully! You can now log in." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

// ══════════════════════════════════════════════════════════════
//  ALSO: Add /forgot-password route to App.jsx:
//
//  import ForgotPassword from "./pages/ForgotPassword";
//  <Route path="/forgot-password" element={<ForgotPassword />} />
// ══════════════════════════════════════════════════════════════