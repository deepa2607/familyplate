// ══════════════════════════════════════════════════════════════════════════
//  routes/householdRoutes.js  —  HomeHub Smart Kitchen  (FULLY FIXED)
//  C:\projects\familyplate\server\routes\householdRoutes.js
//
//  BUGS FIXED:
//  1. Added POST /create  — SetupHousehold.jsx was calling this, got 404
//  2. Added POST /join    — JoinHousehold.jsx was calling this, got 404
//  3. Added GET /members/:hhId — Members.jsx calls this format
//  4. Added PUT /:id      — Settings page needs this to update budget/mode
//  5. Kept ALL original routes intact
// ══════════════════════════════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');

const Household = require('../models/Household');
const User      = require('../models/User');
const auth      = require('../middleware/authMiddleware');

// ── Helper: generate a unique 6-char invite code ─────────────────────────
async function generateUniqueCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code, exists;
  do {
    const prefix = 'FP';
    const suffix = Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
    code   = `${prefix}-${suffix}`;
    exists = await Household.findOne({ inviteCode: code });
  } while (exists);
  return code;
}

// ══════════════════════════════════════════════════════════════════════════
//  GET /api/household/myhousehold
//  Returns the household of the currently logged-in user
// ══════════════════════════════════════════════════════════════════════════
router.get('/myhousehold', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.household) return res.status(404).json({ message: 'No household found.' });
    const hh = await Household.findById(user.household)
      .populate('members', 'name email role phone avatar status');
    res.json(hh);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
//  POST /api/household/create   ← THIS WAS MISSING — caused the 404 error
//  Creates a new household and assigns logged-in user as admin + first member
// ══════════════════════════════════════════════════════════════════════════
router.post('/create', auth, async (req, res) => {
  try {
    const { name, mode, foodPreference, monthlyBudget } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: 'Household name is required.' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Don't allow creating a second household if already in one
    if (user.household) {
      const existing = await Household.findById(user.household);
      if (existing) return res.status(400).json({ message: `You are already in household "${existing.name}". Leave it first in Settings.` });
    }

    const inviteCode = await generateUniqueCode();

    const hh = await Household.create({
      name:           name.trim(),
      admin:          user._id,
      members:        [user._id],
      inviteCode,
      mode:           mode || 'family',
      foodPreference: foodPreference || 'veg',
      monthlyBudget:  parseFloat(monthlyBudget) || 5000,
    });

    // Link household to user
    user.household = hh._id;
    await user.save();

    const populated = await Household.findById(hh._id)
      .populate('members', 'name email role phone avatar status');

    res.status(201).json({
      message:   `Household "${hh.name}" created! Invite code: ${inviteCode}`,
      household: populated,
    });
  } catch (err) {
    console.error('Create household error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
//  POST /api/household/join   ← THIS WAS MISSING — caused the 404 error
//  Joins an existing household using an invite code
// ══════════════════════════════════════════════════════════════════════════
router.post('/join', auth, async (req, res) => {
  try {
    // Accept both 'code' and 'inviteCode' from frontend
    const code = (req.body.code || req.body.inviteCode || '').trim().toUpperCase();

    if (!code) return res.status(400).json({ message: 'Invite code is required.' });

    const hh = await Household.findOne({ inviteCode: code }).populate('members');
    if (!hh) return res.status(404).json({ message: `No household found with code "${code}". Check the code and try again.` });

    if (hh.members.length >= 10) return res.status(400).json({ message: 'This household is full (max 10 members).' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Already a member?
    const alreadyMember = hh.members.some(m => m._id.toString() === user._id.toString());
    if (alreadyMember) {
      user.household = hh._id;
      await user.save();
      return res.json({ message: `You are already a member of "${hh.name}".`, household: hh });
    }

    hh.members.push(user._id);
    await hh.save();

    user.household = hh._id;
    await user.save();

    const populated = await Household.findById(hh._id)
      .populate('members', 'name email role phone avatar status');

    res.json({
      message:   `Joined "${hh.name}" successfully! Welcome 🎉`,
      household: populated,
    });
  } catch (err) {
    console.error('Join household error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
//  GET /api/household/members/:hhId  ← FIXED route order
//  Members.jsx calls /household/members/{id} — this matches correctly now
//  The old route was /:hhId/members which Express couldn't distinguish from /members/:hhId
// ══════════════════════════════════════════════════════════════════════════
router.get('/members/:hhId', auth, async (req, res) => {
  try {
    const hh = await Household.findById(req.params.hhId)
      .populate('members', 'name email role phone avatar status');
    if (!hh) return res.status(404).json({ message: 'Household not found.' });
    res.json(hh.members || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Keep the old route as an alias (/:hhId/members) for backward compatibility
router.get('/:hhId/members', auth, async (req, res) => {
  try {
    const hh = await Household.findById(req.params.hhId)
      .populate('members', 'name email role phone avatar status');
    if (!hh) return res.status(404).json({ message: 'Household not found.' });
    res.json(hh.members || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
//  GET /api/household/invite-link/:code  — Public preview (no auth needed)
//  Used to show household info before the user decides to join
// ══════════════════════════════════════════════════════════════════════════
router.get('/invite-link/:code', async (req, res) => {
  try {
    const hh = await Household.findOne({ inviteCode: req.params.code.toUpperCase() })
      .select('name mode inviteCode members foodPreference');
    if (!hh) return res.status(404).json({ message: 'Household not found.' });
    res.json({
      name:        hh.name,
      memberCount: hh.members?.length || 0,
      inviteCode:  hh.inviteCode,
      mode:        hh.mode,
      diet:        hh.foodPreference,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
//  POST /api/household/member — Add a named member (display-only, no login)
//  Creates a ghost User account for household expense tracking
// ══════════════════════════════════════════════════════════════════════════
router.post('/member', auth, async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser?.household) return res.status(400).json({ message: 'You are not in a household.' });

    const hh = await Household.findById(requestingUser.household).populate('members');
    const { name } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: 'Member name is required.' });
    if (hh.members.length >= 10) return res.status(400).json({ message: 'Household is full (max 10 members).' });
    if (hh.members.find(m => m.name.toLowerCase() === name.trim().toLowerCase())) {
      return res.status(409).json({ message: `A member named "${name.trim()}" already exists.` });
    }

    const slug     = name.trim().toLowerCase().replace(/\s+/g, '.');
    const email    = `${slug}.${Date.now().toString(36)}@familyplate.app`;
    const password = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
    const avatar   = `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&size=128`;

    const memberUser = await User.create({
      name:      name.trim(),
      email,
      phone:     '+91-XXXXXXXXXX',
      avatar,
      password,
      household: hh._id,
      role:      'member',
      status:    'pending',
    });

    hh.members.push(memberUser._id);
    await hh.save();

    const populated = await Household.findById(hh._id)
      .populate('members', 'name email role phone avatar status');

    res.status(201).json(populated);
  } catch (err) {
    console.error('Add member error:', err.message);
    res.status(500).json({ message: 'Failed to add member. Please try again.' });
  }
});

// ══════════════════════════════════════════════════════════════════════════
//  POST /api/household/add-member — Alias for /member
// ══════════════════════════════════════════════════════════════════════════
router.post('/add-member', auth, async (req, res) => {
  // Forward to the /member handler
  req.url = '/member';
  router.handle(req, res, () => {});
});

// ══════════════════════════════════════════════════════════════════════════
//  DELETE /api/household/member/:memberId — Remove a member
// ══════════════════════════════════════════════════════════════════════════
router.delete('/member/:memberId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.household) return res.status(400).json({ message: 'You are not in a household.' });

    const hh = await Household.findById(user.household);
    if (!hh) return res.status(404).json({ message: 'Household not found.' });

    const targetId = req.params.memberId;

    // Block removing the household admin (owner)
    if (hh.admin && hh.admin.toString() === targetId) {
      return res.status(400).json({ message: 'Cannot remove the household admin.' });
    }

    // Allow: admin can remove anyone; any member can remove ghost/pending members
    const isAdmin = (hh.admin?.toString() === req.user.id) || (user.role === 'admin');
    const target  = await User.findById(targetId);
    const isGhost = target && (target.status === 'pending' || target.email?.endsWith('@familyplate.app'));

    if (!isAdmin && !isGhost) {
      return res.status(403).json({ message: 'Only the admin can remove real members.' });
    }

    hh.members = hh.members.filter(m => m.toString() !== targetId);
    await hh.save();

    if (isGhost && target) {
      // Delete ghost users entirely
      await User.findByIdAndDelete(targetId);
    } else {
      await User.findByIdAndUpdate(targetId, { $unset: { household: '' } });
    }

    const populated = await Household.findById(hh._id)
      .populate('members', 'name email role phone avatar status');
    res.json(populated);
  } catch (err) {
    console.error('Delete member error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
//  PUT /api/household/:id — Update household settings
//  Used by Settings page and Admin panel (budget, mode, diet, name)
// ══════════════════════════════════════════════════════════════════════════
router.put('/:id', auth, async (req, res) => {
  try {
    const updates = {};
    if (req.body.name           !== undefined) updates.name           = req.body.name;
    if (req.body.mode           !== undefined) updates.mode           = req.body.mode;
    if (req.body.foodPreference !== undefined) updates.foodPreference = req.body.foodPreference;
    if (req.body.monthlyBudget  !== undefined) updates.monthlyBudget  = parseFloat(req.body.monthlyBudget) || 0;

    const hh = await Household.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('members', 'name email role phone avatar status');
    if (!hh) return res.status(404).json({ message: 'Household not found.' });

    res.json(hh);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
//  DELETE /api/household/:id — Delete entire household (admin only)
// ══════════════════════════════════════════════════════════════════════════
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const hh   = await Household.findById(req.params.id);

    if (!hh) return res.status(404).json({ message: 'Household not found.' });

    // Check admin rights
    const isGlobalAdmin = user.role === 'admin';
    const isHHAdmin     = hh.admin?.toString() === req.user.id;
    if (!isGlobalAdmin && !isHHAdmin) return res.status(403).json({ message: 'Admin only.' });

    // Remove household from all members
    await User.updateMany({ household: hh._id }, { $unset: { household: '' } });
    await Household.findByIdAndDelete(req.params.id);

    res.json({ message: `Household "${hh.name}" deleted.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;