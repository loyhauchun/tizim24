const mongoose = require("mongoose");
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

    const seller = new User({
      fullName: "Test Sotuvchi",
      username: "seller",
      password: "123456",
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
