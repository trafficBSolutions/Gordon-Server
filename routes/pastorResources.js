const express = require('express');
const multer = require('multer');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const PastorResource = require('../models/PastorResource');
const auth = require('./authMiddleware');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'pastor-resources',
    resource_type: 'auto',
    public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`,
  }),
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

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
      url: req.file.path,
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
    if (resource.type === 'file' && resource.url) {
      const publicId = resource.url.split('/').slice(-2).join('/').replace(/\.[^/.]+$/, '');
      await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' }).catch(() => {});
    }
    await PastorResource.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
