const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Household = require('../models/Household');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

// GET /api/household/myhousehold
router.get('/myhousehold', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.household) return res.status(404).json({ message: 'No household found.' });
    const hh = await Household.findById(user.household).populate('members', 'name email role phone avatar status');
    res.json(hh);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/household/:hhId/members - NEW: Fixes empty list
router.get('/:hhId/members', auth, async (req, res) => {
  try {
    const hh = await Household.findById(req.params.hhId).populate('members', 'name email role phone avatar status');
    res.json(hh.members || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/household/member - FIXED: Full populate + details
router.post('/member', auth, async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser?.household) return res.status(400).json({ message: 'No household.' });
    
    const hh = await Household.findById(requestingUser.household).populate('members');
    const { name } = req.body;
    
    if (!name?.trim()) return res.status(400).json({ message: 'Name required.' });
    if (hh.members.length >= 10) return res.status(400).json({ message: 'Max 10 members.' });
    if (hh.members.find(m => m.name.toLowerCase() === name.trim().toLowerCase())) {
      return res.status(409).json({ message: 'Member exists.' });
    }

    const slug = name.trim().toLowerCase().replace(/\s+/g, '.');
    const email = `${slug}.${Date.now().toString(36)}@familyplate.app`;
    const password = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&size=128`;

    const memberUser = await User.create({
      name: name.trim(),
      email, phone: '+91-XXXXXXXXXX', avatar, password,
      household: hh._id, role: 'member', status: 'pending'
    });

    hh.members.push(memberUser._id);
    await hh.save();

    const populated = await Household.findById(hh._id).populate('members', 'name email role phone avatar status');
    res.status(201).json(populated);
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ message: 'Failed to add.' });
  }
});

// POST /api/household/add-member (your alias)
router.post('/add-member', auth, (req, res) => {
  req.url = '/member';
  router(req, res);
});

// GET /api/household/invite-link/:code - Public preview
router.get('/invite-link/:code', async (req, res) => {
  try {
    const hh = await Household.findOne({ inviteCode: req.params.code.toUpperCase() })
      .select('name mode inviteCode members');
    res.json({
      name: hh?.name || 'Household',
      memberCount: hh?.members?.length || 0,
      inviteCode: hh?.inviteCode
    });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// DELETE /api/household/member/:memberId
router.delete('/member/:memberId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const hh = await Household.findById(user.household);
    
    if (hh.admin.toString() !== req.user.id) return res.status(403).json({ message: 'Admin only.' });
    if (req.params.memberId === hh.admin.toString()) return res.status(400).json({ message: 'Cannot remove admin.' });
    
    hh.members = hh.members.filter(m => m.toString() !== req.params.memberId);
    await hh.save();
    await User.findByIdAndUpdate(req.params.memberId, { household: null });
    
    const populated = await Household.findById(hh._id).populate('members');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
