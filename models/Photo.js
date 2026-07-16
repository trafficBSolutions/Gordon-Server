const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  filename: String,
  url: String,
  caption: String,
});

module.exports = mongoose.model('Photo', photoSchema);
