require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const existing = await Admin.findOne({ username: 'ams@hopegordon.com' });
  if (existing) {
    console.log('Admin user already exists.');
  } else {
    await Admin.create({ username: 'ams@hopegordon.com', password: 'MGCdaddy889197!' });
    console.log('Admin user created.');
  }
  await mongoose.disconnect();
};

seed().catch(err => { console.error(err); process.exit(1); });
