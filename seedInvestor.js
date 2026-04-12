const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

async function seedInvestor() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB ulandi");

    const existingInvestor = await User.findOne({ username: "investor" });

    if (existingInvestor) {
      console.log("Investor allaqachon mavjud");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("123456", 10);

    const investor = new User({
      fullName: "Test Investor",
      username: "investor",
      password: hashedPassword,
      role: "investor",
      phone: "+998900000003",
      isActive: true
    });

    await investor.save();

    console.log("Investor yaratildi");
    console.log("Login: investor");
    console.log("Parol: 123456");

    process.exit();
  } catch (error) {
    console.error("Xato:", error);
    process.exit(1);
  }
}

seedInvestor();