const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

async function seedSeller() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB ulandi");

    const existingSeller = await User.findOne({ username: "seller" });

    if (existingSeller) {
      console.log("Sotuvchi allaqachon mavjud");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("123456", 10);

    const seller = new User({
      fullName: "Test Sotuvchi",
      username: "seller",
      password: hashedPassword,
      role: "seller",
      phone: "+998900000001",
      isActive: true
    });

    await seller.save();

    console.log("Sotuvchi yaratildi");
    console.log("Login: seller");
    console.log("Parol: 123456");

    process.exit();
  } catch (error) {
    console.error("Xato:", error);
    process.exit(1);
  }
}

seedSeller();