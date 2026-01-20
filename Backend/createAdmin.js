require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI);

async function createAdmin() {
  const password = "admin123";
  const hash = await bcrypt.hash(password, 10);

  await User.create({
    name: "Admin",
    email: "admin@hostel.com",
    password: hash,
    role: "Admin",
    isActive: true,
    isEmailVerified: true,
    createdByAdmin: true
  });

  console.log("✅ Admin created correctly");
  process.exit();
}

createAdmin();
