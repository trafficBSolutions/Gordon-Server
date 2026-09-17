const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const PastorResource = require('../models/PastorResource');
const auth = require('./authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB limit

router.get('/', async (req, res) => {
  try {
    const resources = await PastorResource.find().sort({ createdAt: -1 });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add via URL
router.post('/', auth, async (req, res) => {
  const { title, url, description } = req.body;
  if (!title || !url) return res.status(400).json({ error: 'Title and URL required' });
  try {
    const resource = await PastorResource.create({ title, url, description: description || '', type: 'url' });
    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add via file upload
router.post('/upload', auth, upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  try {
    const resource = await PastorResource.create({
      title,
      url: `/uploads/${req.file.filename}`,
      description: description || '',
      type: 'file',
    });
    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const resource = await PastorResource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Not found' });
    if (resource.type === 'file') {
      const filePath = path.join(__dirname, '..', 'uploads', path.basename(resource.url));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await PastorResource.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
