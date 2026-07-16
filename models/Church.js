const mongoose = require('mongoose');

const churchSchema = new mongoose.Schema({
  name: String,
  pastor: String,
  address: String,
  phone: String,
  website: String,
  lat: Number,
  lng: Number,
});

module.exports = mongoose.model('Church', churchSchema);
