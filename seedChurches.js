require('dotenv').config();
const mongoose = require('mongoose');
const Church = require('./models/Church');
const churches = require('./data/db.json').churches;

const seedChurches = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const count = await Church.countDocuments();
  if (count > 0) {
    console.log(`Churches already seeded (${count} found).`);
  } else {
    const cleaned = churches.map(({ id, ...rest }) => rest);
    await Church.insertMany(cleaned);
    console.log(`${cleaned.length} churches seeded.`);
  }
  await mongoose.disconnect();
};

seedChurches().catch(err => { console.error(err); process.exit(1); });
