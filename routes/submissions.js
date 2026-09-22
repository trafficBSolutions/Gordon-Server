const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const BlewerIntake = require('../models/BlewerIntake');
const auth = require('./authMiddleware');

// --- Contact submissions ---
router.get('/contacts', auth, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ submittedAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/contacts/:id/read', auth, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/contacts/:id', auth, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Blewer intake submissions ---
router.get('/blewer-intakes', auth, async (req, res) => {
  try {
    const intakes = await BlewerIntake.find().sort({ submittedAt: -1 });
    res.json(intakes);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/blewer-intakes/:id/read', auth, async (req, res) => {
  try {
    const intake = await BlewerIntake.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(intake);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/blewer-intakes/:id', auth, async (req, res) => {
  try {
    await BlewerIntake.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
