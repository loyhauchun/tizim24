const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const sellerRoutes = require("./routes/seller");
const workerRoutes = require("./routes/worker");
const investorRoutes = require("./routes/investor");
require("dotenv").config();

const app = express();

app.set("trust proxy", 1);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "tizim24_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  })
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB ulandi");
  })
  .catch((err) => {
    console.error("MongoDB ulanish xatosi:", err.message);
  });

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/seller", sellerRoutes);
app.use("/worker", workerRoutes);
app.use("/investor", investorRoutes);

app.get("/", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/auth/login");
  }

  if (req.session.user.role === "admin") return res.redirect("/admin/dashboard");
  if (req.session.user.role === "seller") return res.redirect("/seller/dashboard");
  if (req.session.user.role === "worker") return res.redirect("/worker/dashboard");
  if (req.session.user.role === "investor") return res.redirect("/investor/dashboard");

  return res.redirect("/auth/login");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server ${PORT} portda ishga tushdi`);
});
