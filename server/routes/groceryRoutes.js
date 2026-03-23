// routes/groceryRoutes.js
const express     = require("express");
const router      = express.Router();
const GroceryList = require("../models/GroceryList"); // ✅ make sure this model file exists
const auth        = require("../middleware/authMiddleware");

// ══════════════════════════════════════
//  GET /api/grocery/:householdId  — Get active grocery list
// ══════════════════════════════════════
router.get("/:householdId", auth, async (req, res) => {
  try {
    let list = await GroceryList.findOne({
      householdId: req.params.householdId,
      isActive:    true,
    }).populate("items.addedBy", "name");

    if (!list) {
      list = await GroceryList.create({
        householdId: req.params.householdId,
        name:        "Weekly List",
        items:       [],
        createdBy:   req.user.id,
      });
    }

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  POST /api/grocery/:householdId/item  — Add item
// ══════════════════════════════════════
router.post("/:householdId/item", auth, async (req, res) => {
  try {
    const { name, quantity, unit, category, price } = req.body;
    if (!name) return res.status(400).json({ message: "Item name required" });

    let list = await GroceryList.findOne({ householdId: req.params.householdId, isActive: true });
    if (!list) {
      list = await GroceryList.create({
        householdId: req.params.householdId,
        name:        "Weekly List",
        items:       [],
        createdBy:   req.user.id,
      });
    }

    list.items.push({
      name:     name.trim(),
      quantity: Number(quantity) || 1,
      unit:     unit || "pcs",
      category: category || "Grocery",
      price:    Number(price) || 0,
      checked:  false,
      addedBy:  req.user.id,
    });

    await list.save();
    const populated = await GroceryList.findById(list._id).populate("items.addedBy", "name");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  PATCH /api/grocery/:householdId/item/:itemId/check
// ══════════════════════════════════════
router.patch("/:householdId/item/:itemId/check", auth, async (req, res) => {
  try {
    const list = await GroceryList.findOne({ householdId: req.params.householdId, isActive: true });
    if (!list) return res.status(404).json({ message: "List not found" });

    const item = list.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.checked = !item.checked;
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  DELETE /api/grocery/:householdId/item/:itemId
// ══════════════════════════════════════
router.delete("/:householdId/item/:itemId", auth, async (req, res) => {
  try {
    const list = await GroceryList.findOne({ householdId: req.params.householdId, isActive: true });
    if (!list) return res.status(404).json({ message: "List not found" });

    list.items = list.items.filter(i => i._id.toString() !== req.params.itemId);
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  DELETE /api/grocery/:householdId/checked
// ══════════════════════════════════════
router.delete("/:householdId/checked", auth, async (req, res) => {
  try {
    const list = await GroceryList.findOne({ householdId: req.params.householdId, isActive: true });
    if (!list) return res.status(404).json({ message: "List not found" });

    list.items = list.items.filter(i => !i.checked);
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  POST /api/grocery/:householdId/clear
// ══════════════════════════════════════
router.post("/:householdId/clear", auth, async (req, res) => {
  try {
    const list = await GroceryList.findOne({ householdId: req.params.householdId, isActive: true });
    if (!list) return res.status(404).json({ message: "List not found" });

    list.items = [];
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════
//  GET /api/grocery/suggestions/all
// ══════════════════════════════════════
router.get("/suggestions/all", auth, (req, res) => {
  res.json([
    { name:"Onions",    unit:"kg",   category:"Vegetables", avgPrice:40  },
    { name:"Tomatoes",  unit:"kg",   category:"Vegetables", avgPrice:30  },
    { name:"Potatoes",  unit:"kg",   category:"Vegetables", avgPrice:25  },
    { name:"Spinach",   unit:"bunch",category:"Vegetables", avgPrice:15  },
    { name:"Milk",      unit:"L",    category:"Dairy",      avgPrice:60  },
    { name:"Eggs",      unit:"pcs",  category:"Dairy",      avgPrice:7   },
    { name:"Paneer",    unit:"g",    category:"Dairy",      avgPrice:480 },
    { name:"Curd",      unit:"g",    category:"Dairy",      avgPrice:60  },
    { name:"Rice",      unit:"kg",   category:"Staples",    avgPrice:80  },
    { name:"Atta",      unit:"kg",   category:"Staples",    avgPrice:50  },
    { name:"Toor Dal",  unit:"kg",   category:"Staples",    avgPrice:140 },
    { name:"Moong Dal", unit:"kg",   category:"Staples",    avgPrice:160 },
    { name:"Chicken",   unit:"g",    category:"Meat",       avgPrice:320 },
    { name:"Bread",     unit:"pack", category:"Bakery",     avgPrice:40  },
    { name:"Bananas",   unit:"dozen",category:"Fruits",     avgPrice:40  },
    { name:"Apples",    unit:"kg",   category:"Fruits",     avgPrice:120 },
    { name:"Salt",      unit:"kg",   category:"Spices",     avgPrice:20  },
    { name:"Oil",       unit:"L",    category:"Staples",    avgPrice:140 },
    { name:"Ghee",      unit:"g",    category:"Dairy",      avgPrice:600 },
  ]);
});

module.exports = router;