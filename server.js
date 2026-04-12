const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const sellerRoutes = require("./routes/seller");
const workerRoutes = require("./routes/worker");
const investorRoutes = require("./routes/investor");
require("dotenv").config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24
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
  res.send("Tizim24 ishlayapti");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server ${PORT} portda ishga tushdi`);
});