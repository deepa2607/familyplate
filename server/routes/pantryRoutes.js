// ══════════════════════════════════════════════════════════════════════════
//  routes/pantryRoutes.js  —  Pantry management + per-household stock alerts
// ══════════════════════════════════════════════════════════════════════════
const express   = require("express");
const router    = express.Router();
const Pantry    = require("../models/Pantry");
const Household = require("../models/Household");
const User      = require("../models/User");
const auth      = require("../middleware/authMiddleware");

// ══════════════════════════════════════
//  GET /api/pantry/:householdId
// ══════════════════════════════════════
router.get("/:householdId", auth, async (req, res) => {
  try {
    const items = await Pantry.find({ householdId: req.params.householdId }).sort({ name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  POST /api/pantry  —  Add item to pantry
// ══════════════════════════════════════
router.post("/", auth, async (req, res) => {
  try {
    const { householdId, name, quantity, unit, category, minQuantity, expiryDate, price } = req.body;
    if (!householdId || !name) return res.status(400).json({ message: "householdId and name are required" });

    const item = await Pantry.create({
      householdId,
      name:        name.trim(),
      quantity:    Number(quantity) || 0,
      unit:        unit || "pcs",
      category:    category || "Other",
      minQuantity: Number(minQuantity) || 2,
      expiryDate:  expiryDate ? new Date(expiryDate) : null,
      price:       Number(price) || 0,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  PUT /api/pantry/:id  —  Update pantry item
// ══════════════════════════════════════
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, quantity, unit, category, minQuantity, expiryDate, price } = req.body;
    const item = await Pantry.findByIdAndUpdate(
      req.params.id,
      { name, quantity: Number(quantity), unit, category, minQuantity: Number(minQuantity), expiryDate, price: Number(price) },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  DELETE /api/pantry/:id
// ══════════════════════════════════════
router.delete("/:id", auth, async (req, res) => {
  try {
    const item = await Pantry.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  GET /api/pantry/low-stock/:householdId
//  Returns low-stock items FOR THIS HOUSEHOLD ONLY
// ══════════════════════════════════════
router.get("/low-stock/:householdId", auth, async (req, res) => {
  try {
    const items = await Pantry.find({ householdId: req.params.householdId });
    const lowItems = items.filter(item => {
      const qty    = Number(item.quantity || 0);
      const minQty = Number(item.minQuantity || 2);
      return qty <= minQty;
    });
    res.json(lowItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  POST /api/pantry/check-all-low-stock
//  Admin: Check ALL households for low stock (per-household alerts)
// ══════════════════════════════════════
router.post("/check-all-low-stock", auth, async (req, res) => {
  try {
    const households = await Household.find({});
    const alerts = [];

    for (const hh of households) {
      const items = await Pantry.find({ householdId: hh._id });
      const lowItems = items.filter(item => {
        const qty    = Number(item.quantity || 0);
        const minQty = Number(item.minQuantity || 2);
        return qty <= minQty;
      });

      if (lowItems.length > 0) {
        alerts.push({
          householdId:   hh._id,
          householdName: hh.name,
          lowItems:      lowItems.map(i => ({
            name:     i.name,
            quantity: i.quantity,
            unit:     i.unit,
            minQty:   i.minQuantity,
          })),
          message: `⚠️ Low stock in ${hh.name}: ${lowItems.map(i => `${i.name} (${i.quantity} ${i.unit||"units"} left)`).join(", ")}`,
        });
      }
    }

    res.json({ alerts, total: alerts.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;