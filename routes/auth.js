const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

router.get("/login", (req, res) => {
  res.render("auth/login", { error: null });
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username, isActive: true });

    if (!user) {
      return res.render("auth/login", { error: "Login yoki parol xato" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("auth/login", { error: "Login yoki parol xato" });
    }

    req.session.user = {
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      role: user.role
    };

    if (user.role === "admin") {
      return res.redirect("/admin/dashboard");
    }

    if (user.role === "seller") {
      return res.redirect("/seller/dashboard");
    }

    if (user.role === "worker") {
      return res.redirect("/worker/dashboard");
    }

    if (user.role === "investor") {
      return res.redirect("/investor/dashboard");
    }

    return res.redirect("/auth/login");
  } catch (error) {
    console.error(error);
    return res.render("auth/login", { error: "Serverda xatolik yuz berdi" });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/auth/login");
  });
});

module.exports = router;