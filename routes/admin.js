const express = require("express");
const Product = require("../models/Product");
const Customer = require("../models/Customer");

const router = express.Router();

router.get("/dashboard", async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    res.render("admin/dashboard", { productCount });
  } catch (error) {
    console.error(error);
    res.send("Dashboardda xatolik");
  }
});

router.get("/products/new", (req, res) => {
  res.render("admin/new-product", { error: null });
});

router.post("/products/new", async (req, res) => {
  try {
    const {
      name,
      category,
      unit,
      purchasePrice,
      salePrice,
      minPrice,
      stock,
      sku,
      allowDebt,
      description
    } = req.body;

    const newProduct = new Product({
      name,
      category,
      unit,
      purchasePrice: Number(purchasePrice) || 0,
      salePrice: Number(salePrice) || 0,
      minPrice: Number(minPrice) || 0,
      stock: Number(stock) || 0,
      sku,
      allowDebt: allowDebt === "on",
      description
    });

    await newProduct.save();

    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.render("admin/new-product", { error: "Mahsulotni saqlashda xatolik bo‘ldi" });
  }
});

router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.render("admin/products", { products });
  } catch (error) {
    console.error(error);
    res.send("Mahsulotlar ro‘yxatida xatolik");
  }
});

router.get("/products/edit/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.send("Mahsulot topilmadi");
    }

    res.render("admin/edit-product", { product, error: null });
  } catch (error) {
    console.error(error);
    res.send("Tahrirlash oynasida xatolik");
  }
});

router.post("/products/edit/:id", async (req, res) => {
  try {
    const {
      name,
      category,
      unit,
      purchasePrice,
      salePrice,
      minPrice,
      stock,
      sku,
      allowDebt,
      description,
      isActive
    } = req.body;

    await Product.findByIdAndUpdate(req.params.id, {
      name,
      category,
      unit,
      purchasePrice: Number(purchasePrice) || 0,
      salePrice: Number(salePrice) || 0,
      minPrice: Number(minPrice) || 0,
      stock: Number(stock) || 0,
      sku,
      allowDebt: allowDebt === "on",
      description,
      isActive: isActive === "on"
    });

    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);

    const product = await Product.findById(req.params.id);
    res.render("admin/edit-product", {
      product,
      error: "Mahsulotni yangilashda xatolik bo‘ldi"
    });
  }
});

router.post("/products/delete/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.send("Mahsulotni o‘chirishda xatolik");
  }
});

router.get("/customers", async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.render("admin/customers", { customers });
  } catch (error) {
    console.error(error);
    res.send("Mijozlar ro‘yxatida xatolik");
  }
});

router.get("/customers/new", (req, res) => {
  res.render("admin/new-customer", { error: null });
});

router.post("/customers/new", async (req, res) => {
  try {
    const { fullName, phone, address, note } = req.body;

    const customer = new Customer({
      fullName,
      phone,
      address,
      note
    });

    await customer.save();
    res.redirect("/admin/customers");
  } catch (error) {
    console.error(error);
    res.render("admin/new-customer", { error: "Mijozni saqlashda xatolik" });
  }
});

module.exports = router;