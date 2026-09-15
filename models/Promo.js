const mongoose = require('mongoose');

const promoSchema = new mongoose.Schema({
  title: String,
  url: String,
  filename: String,
  type: { type: String, enum: ['upload', 'youtube'], default: 'youtube' },
});

module.exports = mongoose.model('Promo', promoSchema);
