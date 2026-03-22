// ══════════════════════════════════════════════════════════════════════════
//  routes/purchaseRoutes.js
// ══════════════════════════════════════════════════════════════════════════
const express  = require("express");
const router   = express.Router();
const Purchase = require("../models/Purchase");
const User     = require("../models/User");
const auth     = require("../middleware/authMiddleware");

// ══════════════════════════════════════
//  GET /api/purchase/household/:householdId
// ══════════════════════════════════════
router.get("/household/:householdId", auth, async (req, res) => {
  try {
    const purchases = await Purchase.find({ householdId: req.params.householdId })
      .populate("paidBy", "name email")
      .populate("sharedBy", "name")
      .sort({ createdAt: -1 });
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  POST /api/purchase  —  Create purchase
// ══════════════════════════════════════
router.post("/", auth, async (req, res) => {
  try {
    const {
      householdId, description, category, paidBy,
      splitType, amount, totalAmount, items,
      sharedBy, date, paymentMethod, razorpayPaymentId,
    } = req.body;

    if (!householdId) return res.status(400).json({ message: "householdId is required" });
    if (!paidBy)      return res.status(400).json({ message: "paidBy is required" });

    const finalAmount = Number(totalAmount || amount || 0);
    if (finalAmount <= 0) return res.status(400).json({ message: "Amount must be greater than 0" });

    const purchase = await Purchase.create({
      householdId,
      description:       description || category || "Purchase",
      category:          category || "Grocery",
      paidBy,
      splitType:         splitType || "shared",
      amount:            finalAmount,
      totalAmount:       finalAmount,
      items:             items || [],
      sharedBy:          sharedBy || [],
      date:              date ? new Date(date) : new Date(),
      paymentMethod:     paymentMethod || "cash",
      razorpayPaymentId: razorpayPaymentId || null,
      settled:           false,
    });

    const populated = await Purchase.findById(purchase._id)
      .populate("paidBy", "name email")
      .populate("sharedBy", "name");

    res.status(201).json(populated);
  } catch (err) {
    console.error("Create purchase error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  PATCH /api/purchase/settle-one/:id  — Settle single purchase
// ══════════════════════════════════════
router.patch("/settle-one/:id", auth, async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });

    purchase.settled   = true;
    purchase.settledAt = new Date();
    await purchase.save();

    const populated = await Purchase.findById(purchase._id)
      .populate("paidBy", "name email")
      .populate("sharedBy", "name");

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  POST /api/purchase/settle/:householdId  — Settle all for household
//  Only settles SHARED purchases (not personal)
// ══════════════════════════════════════
router.post("/settle/:householdId", auth, async (req, res) => {
  try {
    const result = await Purchase.updateMany(
      {
        householdId: req.params.householdId,
        settled:     false,
        splitType:   { $ne: "individual" }, // ← never auto-settle personal
      },
      {
        $set: { settled: true, settledAt: new Date() },
      }
    );
    res.json({ message: "All shared purchases settled", modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  DELETE /api/purchase/:id
// ══════════════════════════════════════
router.delete("/:id", auth, async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndDelete(req.params.id);
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });
    res.json({ message: "Purchase deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  GET /api/purchase/balance/:householdId
//  Returns who owes whom (only shared, unsettled)
// ══════════════════════════════════════
router.get("/balance/:householdId", auth, async (req, res) => {
  try {
    // Only shared purchases matter for balance
    const purchases = await Purchase.find({
      householdId: req.params.householdId,
      settled:     false,
      splitType:   { $ne: "individual" }, // ← personal never affects balance
    }).populate("paidBy", "name").populate("sharedBy", "name");

    const balances = {};
    purchases.forEach(p => {
      const payerName = p.paidBy?.name;
      if (!payerName) return;
      const amt   = p.totalAmount || p.amount || 0;
      const share = amt / (p.sharedBy?.length || 1);
      p.sharedBy?.forEach(m => {
        if (m.name !== payerName) {
          const key = `${m.name}→${payerName}`;
          balances[key] = (balances[key] || 0) + share;
        }
      });
    });

    res.json(balances);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;