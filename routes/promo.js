const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const Promo = require('../models/Promo');
const auth = require('./authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, `promo-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files are allowed'));
  },
});

// Public: get promo
router.get('/', async (req, res) => {
  try {
    let promo = await Promo.findOne();
    if (!promo) promo = { title: '', url: '', type: 'youtube' };
    res.json(promo);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: upload a video file from computer
router.post('/upload', auth, upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No video file uploaded' });
  try {
    let promo = await Promo.findOne();

    // Delete old uploaded file if it exists
    if (promo && promo.filename) {
      const oldPath = path.join(__dirname, '..', 'uploads', promo.filename);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const url = `/uploads/${req.file.filename}`;
    if (!promo) {
      promo = await Promo.create({ title: req.body.title || '', url, filename: req.file.filename, type: 'upload' });
    } else {
      promo.title = req.body.title || promo.title;
      promo.url = url;
      promo.filename = req.file.filename;
      promo.type = 'upload';
      await promo.save();
    }
    res.json(promo);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: set a YouTube/Vimeo URL instead
router.put('/', auth, async (req, res) => {
  try {
    const { title, url } = req.body;
    let promo = await Promo.findOne();
    if (!promo) {
      promo = await Promo.create({ title: title || '', url: url || '', type: 'youtube' });
    } else {
      if (title !== undefined) promo.title = title;
      if (url !== undefined) promo.url = url;
      promo.type = 'youtube';
      promo.filename = '';
      await promo.save();
    }
    res.json(promo);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
