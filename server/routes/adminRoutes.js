// ══════════════════════════════════════════════════════════════════════════
//  routes/adminRoutes.js
// ══════════════════════════════════════════════════════════════════════════
const express   = require("express");
const router    = express.Router();
const User      = require("../models/User");
const Household = require("../models/Household");
const Purchase  = require("../models/Purchase");
const auth      = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

// ══════════════════════════════════════
//  GET /api/admin/households
// ══════════════════════════════════════
router.get("/households", auth, adminOnly, async (req, res) => {
  try {
    const households = await Household.find({})
      .populate("members", "name email role")
      .sort({ createdAt: -1 });
    res.json(households);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  GET /api/admin/users
// ══════════════════════════════════════
router.get("/users", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password -securityQuestions")
      .populate("household", "name inviteCode")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  GET /api/admin/purchases
// ══════════════════════════════════════
router.get("/purchases", auth, adminOnly, async (req, res) => {
  try {
    const purchases = await Purchase.find({})
      .populate("paidBy", "name email")
      .populate("householdId", "name")
      .sort({ createdAt: -1 });
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  POST /api/admin/make-admin/:userId
//  Make a user admin (no demote — admin is permanent)
// ══════════════════════════════════════
router.post("/make-admin/:userId", auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role: "admin" },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: `${user.name} is now an admin`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  DELETE /api/admin/user/:userId
// ══════════════════════════════════════
router.delete("/user/:userId", auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Remove from household
    if (user.household) {
      await Household.findByIdAndUpdate(user.household, {
        $pull: { members: user._id },
      });
    }
    await User.findByIdAndDelete(req.params.userId);
    res.json({ message: `${user.name} deleted` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  DELETE /api/admin/household/:id
// ══════════════════════════════════════
router.delete("/household/:id", auth, adminOnly, async (req, res) => {
  try {
    const hh = await Household.findById(req.params.id);
    if (!hh) return res.status(404).json({ message: "Household not found" });

    // Remove household reference from all members
    await User.updateMany({ household: req.params.id }, { $unset: { household: 1 } });
    // Delete all purchases
    await Purchase.deleteMany({ householdId: req.params.id });
    // Delete household
    await Household.findByIdAndDelete(req.params.id);

    res.json({ message: `Household "${hh.name}" and all its data deleted` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  PUT /api/admin/household/:id  — Update household settings
// ══════════════════════════════════════
router.put("/household/:id", auth, adminOnly, async (req, res) => {
  try {
    const { monthlyBudget, mode, foodPreference, name } = req.body;
    const hh = await Household.findByIdAndUpdate(
      req.params.id,
      { monthlyBudget, mode, foodPreference, name },
      { new: true }
    ).populate("members", "name email role");
    if (!hh) return res.status(404).json({ message: "Household not found" });
    res.json(hh);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  DELETE /api/admin/purchase/:id
// ══════════════════════════════════════
router.delete("/purchase/:id", auth, adminOnly, async (req, res) => {
  try {
    const p = await Purchase.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ message: "Purchase not found" });
    res.json({ message: "Purchase deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;