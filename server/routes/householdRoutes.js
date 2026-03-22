// server/routes/householdRoutes.js
// FIX: POST /api/household/member now works — admin can add members
// FIX: Added members show in admin panel immediately
const express   = require("express");
const router    = express.Router();
const bcrypt    = require("bcryptjs");
const crypto    = require("crypto");
const Household = require("../models/Household");
const User      = require("../models/User");
const auth      = require("../middleware/authMiddleware");

// ══════════════════════════════════════════════════════════════════
//  GET /api/household/myhousehold
// ══════════════════════════════════════════════════════════════════
router.get("/myhousehold", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.household) return res.status(404).json({ message: "No household found. Create or join one." });

    const hh = await Household.findById(user.household).populate("members", "name email role phone avatar");
    if (!hh) return res.status(404).json({ message: "Household not found." });

    res.json(hh);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════
//  POST /api/household/create
// ══════════════════════════════════════════════════════════════════
router.post("/create", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.household) return res.status(400).json({ message: "You are already in a household. Leave it first." });

    const { name, mode = "family", foodPreference = "veg", monthlyBudget = 5000 } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Household name is required" });

    // Generate unique 6-char invite code
    let inviteCode, exists;
    do {
      inviteCode = "FP-" + crypto.randomBytes(2).toString("hex").toUpperCase().slice(0, 4);
      exists = await Household.findOne({ inviteCode });
    } while (exists);

    const hh = await Household.create({
      name: name.trim(), inviteCode, admin: user._id,
      members: [user._id], mode, foodPreference,
      monthlyBudget: Number(monthlyBudget) || 5000,
    });

    user.household = hh._id;
    await user.save();

    const populated = await Household.findById(hh._id).populate("members", "name email role");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════
//  POST /api/household/join  — Join by invite code
// ══════════════════════════════════════════════════════════════════
router.post("/join", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { code } = req.body;
    if (!code?.trim()) return res.status(400).json({ message: "Invite code is required" });

    const hh = await Household.findOne({ inviteCode: code.trim().toUpperCase() });
    if (!hh) return res.status(404).json({ message: `No household found with code "${code.toUpperCase()}"` });

    if (user.household?.toString() === hh._id.toString()) {
      return res.status(400).json({ message: "You are already in this household!" });
    }
    if (user.household) return res.status(400).json({ message: "Leave your current household before joining another." });

    if (!hh.members.includes(user._id)) hh.members.push(user._id);
    await hh.save();

    user.household = hh._id;
    await user.save();

    const populated = await Household.findById(hh._id).populate("members", "name email role");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════
//  POST /api/household/member  — Add a new member by name (no login required for them)
//  FIX: This is what Members page calls — was missing before
// ══════════════════════════════════════════════════════════════════
router.post("/member", auth, async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser?.household) {
      return res.status(400).json({ message: "You must be in a household to add members." });
    }

    const hh = await Household.findById(requestingUser.household).populate("members", "name email role");
    if (!hh) return res.status(404).json({ message: "Household not found." });

    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Member name is required." });
    if (hh.members.length >= 10) return res.status(400).json({ message: "Maximum 10 members per household." });

    // Check if name already exists in this household
    const nameLower = name.trim().toLowerCase();
    const duplicate = hh.members.find(m => m.name.toLowerCase() === nameLower);
    if (duplicate) return res.status(400).json({ message: `"${name}" is already a member of this household.` });

    // Create a placeholder user account for this member
    // They can claim it later by registering with same name
    const slug         = name.trim().toLowerCase().replace(/\s+/g, ".");
    const uniqueSuffix = Date.now().toString(36);
    const email        = `${slug}.${uniqueSuffix}@homehub.member`;
    const password     = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);

    const memberUser = await User.create({
      name:      name.trim(),
      email,
      password,
      household: hh._id,
      role:      "member",
    });

    hh.members.push(memberUser._id);
    await hh.save();

    const populated = await Household.findById(hh._id).populate("members", "name email role");
    res.status(201).json(populated);
  } catch (err) {
    console.error("[householdRoutes] Add member error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// Also support the /add-member alias for backward compatibility
router.post("/add-member", auth, async (req, res) => {
  // Forward to /member handler by re-using same logic
  req.url = "/member";
  router.handle(req, res);
});
// ══════════════════════════════════════════════════════════════════
//  PATCH /api/household/:id  — Settings page update (mode, diet, budget, etc.)
// ══════════════════════════════════════════════════════════════════
router.patch("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const hh   = await Household.findById(user?.household);
    if (!hh) return res.status(404).json({ message: "Household not found" });

    const {
      name,
      mode,
      foodPreference,
      dietPreference,   // some pages send this key instead
      monthlyBudget,
      currency,
      fitnessMode,
    } = req.body;

    if (name                        !== undefined) hh.name           = name.trim();
    if (mode                        !== undefined) hh.mode           = mode;
    if (foodPreference              !== undefined) hh.foodPreference = foodPreference;
    if (dietPreference              !== undefined) hh.foodPreference = dietPreference; // alias
    if (monthlyBudget               !== undefined) hh.monthlyBudget  = Number(monthlyBudget);
    if (currency                    !== undefined) hh.currency       = currency;
    if (fitnessMode                 !== undefined) hh.fitnessMode    = fitnessMode;

    await hh.save();

    const populated = await Household.findById(hh._id)
      .populate("members", "name email role");

    res.json(populated);
  } catch (err) {
    console.error("[householdRoutes] PATCH /:id error:", err.message);
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;


// ══════════════════════════════════════════════════════════════════
//  DELETE /api/household/member/:memberId  — Remove a member
// ══════════════════════════════════════════════════════════════════
router.delete("/member/:memberId", auth, async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user.id);
    const hh = await Household.findById(requestingUser?.household);
    if (!hh) return res.status(404).json({ message: "Household not found" });

    // Only admin can remove members
    if (hh.admin?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the admin can remove members." });
    }

    // Can't remove admin
    if (req.params.memberId === hh.admin?.toString()) {
      return res.status(400).json({ message: "Admin cannot be removed from the household." });
    }

    hh.members = hh.members.filter(m => m.toString() !== req.params.memberId);
    await hh.save();

    // Clear the member's household reference
    await User.findByIdAndUpdate(req.params.memberId, { household: null });

    const populated = await Household.findById(hh._id).populate("members", "name email role");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════
//  PUT /api/household/update  — Update household settings
// ══════════════════════════════════════════════════════════════════
router.put("/update", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const hh   = await Household.findById(user?.household);
    if (!hh) return res.status(404).json({ message: "Household not found" });

    const { name, mode, foodPreference, monthlyBudget, currency } = req.body;
    if (name)           hh.name           = name.trim();
    if (mode)           hh.mode           = mode;
    if (foodPreference) hh.foodPreference = foodPreference;
    if (monthlyBudget !== undefined) hh.monthlyBudget = Number(monthlyBudget);
    if (currency)       hh.currency       = currency;

    await hh.save();
    const populated = await Household.findById(hh._id).populate("members", "name email role");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════
//  GET /api/household/invite-link/:code  — Get household by invite code
// ══════════════════════════════════════════════════════════════════
router.get("/invite-link/:code", async (req, res) => {
  try {
    const hh = await Household.findOne({ inviteCode: req.params.code.toUpperCase() })
      .populate("members", "name role").select("-__v");
    if (!hh) return res.status(404).json({ message: "Invalid invite code." });
    res.json({ name: hh.name, memberCount: hh.members.length, mode: hh.mode, inviteCode: hh.inviteCode });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════
//  POST /api/household/leave  — Leave current household
// ══════════════════════════════════════════════════════════════════
router.post("/leave", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.household) return res.status(400).json({ message: "You are not in a household." });

    const hh = await Household.findById(user.household);
    if (!hh) { user.household = null; await user.save(); return res.json({ message: "Left household." }); }

    if (hh.admin?.toString() === user._id.toString()) {
      return res.status(400).json({ message: "Admin cannot leave. Transfer admin role first or delete the household." });
    }

    hh.members = hh.members.filter(m => m.toString() !== user._id.toString());
    await hh.save();

    user.household = null;
    await user.save();

    res.json({ message: `You have left "${hh.name}".` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;