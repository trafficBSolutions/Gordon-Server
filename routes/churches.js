const express = require('express');
const router = express.Router();
const Church = require('../models/Church');
const auth = require('./authMiddleware');

router.get('/', async (req, res) => {
  try {
    const churches = await Church.find().sort({ name: 1 });
    res.json(churches);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { pastor, phone, website } = req.body;
    const update = {};
    if (pastor !== undefined) update.pastor = pastor;
    if (phone !== undefined) update.phone = phone;
    if (website !== undefined) update.website = website;

    const church = await Church.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!church) return res.status(404).json({ error: 'Church not found' });
    res.json(church);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
