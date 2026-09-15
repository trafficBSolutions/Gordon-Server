const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const router = express.Router();
const Promo = require('../models/Promo');
const auth = require('./authMiddleware');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'gordon-promo',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
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

// Admin: upload a video file to Cloudinary
router.post('/upload', auth, upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No video file uploaded' });
  try {
    let promo = await Promo.findOne();

    // Delete old Cloudinary video if it exists
    if (promo && promo.cloudinaryId) {
      await cloudinary.uploader.destroy(promo.cloudinaryId, { resource_type: 'video' });
    }

    const url = req.file.path; // Cloudinary URL
    const cloudinaryId = req.file.filename; // Cloudinary public_id

    if (!promo) {
      promo = await Promo.create({ title: req.body.title || '', url, cloudinaryId, type: 'upload' });
    } else {
      promo.title = req.body.title || promo.title;
      promo.url = url;
      promo.cloudinaryId = cloudinaryId;
      promo.filename = '';
      promo.type = 'upload';
      await promo.save();
    }
    res.json(promo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: set a YouTube URL instead
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
      promo.cloudinaryId = '';
      await promo.save();
    }
    res.json(promo);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
