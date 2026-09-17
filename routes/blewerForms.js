const express = require('express');
const multer = require('multer');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const auth = require('./authMiddleware');

const mongoose = require('mongoose');
const blewerFormSchema = new mongoose.Schema({
  title: String,
  url: String,
  publicId: String,
  createdAt: { type: Date, default: Date.now },
});
const BlewerForm = mongoose.model('BlewerForm', blewerFormSchema);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'blewer-forms',
    resource_type: 'auto',
    public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`,
  }),
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/', async (req, res) => {
  try {
    const forms = await BlewerForm.find().sort({ createdAt: -1 });
    res.json(forms);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, upload.single('form'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { title } = req.body;
  try {
    const form = await BlewerForm.create({
      title: title || req.file.originalname,
      url: req.file.path,
      publicId: req.file.filename,
    });
    res.status(201).json(form);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const form = await BlewerForm.findById(req.params.id);
    if (!form) return res.status(404).json({ error: 'Not found' });
    if (form.publicId) {
      await cloudinary.uploader.destroy(form.publicId, { resource_type: 'auto' }).catch(() => {});
    }
    await BlewerForm.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
