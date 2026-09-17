const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const auth = require('./authMiddleware');

const mongoose = require('mongoose');
const blewerFormSchema = new mongoose.Schema({
  title: String,
  filename: String,
  url: String,
  createdAt: { type: Date, default: Date.now },
});
const BlewerForm = mongoose.model('BlewerForm', blewerFormSchema);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

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
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`,
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
    const filePath = path.join(__dirname, '..', 'uploads', form.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await BlewerForm.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
