const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB ulandi");

    const existingAdmin = await User.findOne({ username: "admin" });

    if (existingAdmin) {
      console.log("Admin allaqachon mavjud");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("123456", 10);

    const admin = new User({
      fullName: "Bosh Admin",
      username: "admin",
      password: hashedPassword,
      role: "admin",
      phone: "+998900000000",
      isActive: true
    });

    await admin.save();

    console.log("Admin yaratildi");
    console.log("Login: admin");
    console.log("Parol: 123456");

    process.exit();
  } catch (error) {
    console.error("Xato:", error);
    process.exit(1);
  }
}

seedAdmin();