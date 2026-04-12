const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

async function seedWorker() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB ulandi");

    const existingWorker = await User.findOne({ username: "worker" });

    if (existingWorker) {
      console.log("Worker allaqachon mavjud");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("123456", 10);

    const worker = new User({
      fullName: "Test Worker",
      username: "worker",
      password: hashedPassword,
      role: "worker",
      phone: "+998900000002",
      isActive: true
    });

    await worker.save();

    console.log("Worker yaratildi");
    console.log("Login: worker");
    console.log("Parol: 123456");

    process.exit();
  } catch (error) {
    console.error("Xato:", error);
    process.exit(1);
  }
}

seedWorker();