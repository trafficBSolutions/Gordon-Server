const express = require('express');
const router = express.Router();
const Promo = require('../models/Promo');
const auth = require('./authMiddleware');

router.get('/', async (req, res) => {
  try {
    let promo = await Promo.findOne();
    if (!promo) promo = { title: '', url: '' };
    res.json(promo);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/', auth, async (req, res) => {
  try {
    const { title, url } = req.body;
    let promo = await Promo.findOne();
    if (!promo) {
      promo = await Promo.create({ title: title || '', url: url || '' });
    } else {
      if (title !== undefined) promo.title = title;
      if (url !== undefined) promo.url = url;
      await promo.save();
    }
    res.json(promo);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
