const mongoose = require('mongoose');

const promoSchema = new mongoose.Schema({
  title: String,
  url: String,
});

module.exports = mongoose.model('Promo', promoSchema);
