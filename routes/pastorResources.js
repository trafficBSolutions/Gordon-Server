const express = require('express');
const multer = require('multer');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const PastorResource = require('../models/PastorResource');
const auth = require('./authMiddleware');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

const uploadToCloudinary = (buffer, mimetype, originalname, folder) => new Promise((resolve, reject) => {
  const isPDF = mimetype === 'application/pdf' || originalname.toLowerCase().endsWith('.pdf');
  const isVideo = mimetype.startsWith('video/');
  const resource_type = isPDF ? 'raw' : isVideo ? 'video' : 'auto';
  const cleanName = originalname.replace(/\s+/g, '_').replace(/\.pdf\.pdf$/i, '.pdf');
  const public_id = `${Date.now()}-${cleanName}`;
  const stream = cloudinary.uploader.upload_stream(
    { folder, resource_type, type: 'upload', public_id },
    (err, result) => { if (err) reject(err); else resolve(result); }
  );
  stream.end(buffer);
});

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
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, req.file.originalname, 'pastor-resources');
    const resource = await PastorResource.create({
      title,
      url: result.secure_url,
      description: description || '',
      type: 'file',
    });
    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
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
