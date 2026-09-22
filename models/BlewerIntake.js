const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: String, ss4: String, dob: String, relationship: String,
});

const blewerIntakeSchema = new mongoose.Schema({
  name: String, ss4: String, dob: String, date: String,
  spouseName: String, spouseSs4: String, spouseDob: String, phone: String,
  address: String, city: String, state: String, zip: String,
  members: [memberSchema],
  income1: String, income2: String, income3: String,
  churchMembership: String, wantsVisit: String,
  signature: String, signatureDate: String,
  submittedAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

module.exports = mongoose.model('BlewerIntake', blewerIntakeSchema);
