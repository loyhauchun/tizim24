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

    if (!username || !password) {
      return res.render("auth/login", { error: "Login va parolni kiriting" });
    }

    const user = await User.findOne({
      username: String(username).trim(),
      isActive: true
    });

    if (!user) {
      return res.render("auth/login", { error: "Login yoki parol xato" });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);

    if (!isMatch) {
      return res.render("auth/login", { error: "Login yoki parol xato" });
    }

    req.session.user = {
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      role: user.role
    };

    req.session.save((err) => {
      if (err) {
        console.error("Session saqlashda xato:", err);
        return res.render("auth/login", { error: "Tizimga kirishda xatolik yuz berdi" });
      }

      if (user.role === "admin") return res.redirect("/admin/dashboard");
      if (user.role === "seller") return res.redirect("/seller/dashboard");
      if (user.role === "worker") return res.redirect("/worker/dashboard");
      if (user.role === "investor") return res.redirect("/investor/dashboard");

      return res.redirect("/auth/login");
    });
  } catch (error) {
    console.error("Login xatosi:", error);
    return res.render("auth/login", { error: "Serverda xatolik yuz berdi" });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/auth/login");
  });
});

module.exports = router;
