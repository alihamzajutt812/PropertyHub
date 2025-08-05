// print-users.js

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({});
    console.log('\n🧾 All Users in the Database:\n');
    users.forEach(user => {
      console.log({
        name: user.name,
        email: user.email,
        role: user.role
      });
    });
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fetching users:', err.message);
    process.exit(1);
  }
}

listUsers();
