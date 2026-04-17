const express = require("express");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Sale = require("../models/Sale");

const router = express.Router();

router.get("/dashboard", async (req, res) => {
  try {
    const products = await Product.find().sort({ stock: 1, createdAt: -1 }).lean();

    const salesAgg = await Sale.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          soldQty: { $sum: "$items.qty" },
          lastSoldAt: { $max: "$createdAt" }
        }
      }
    ]);

    const salesMap = new Map();
    salesAgg.forEach(item => {
      if (item && item._id) {
        salesMap.set(String(item._id), {
          soldQty: Number(item.soldQty || 0),
          lastSoldAt: item.lastSoldAt || null
        });
      }
    });

    const lowStockThreshold = 10;
    const staleDays = 30;
    const staleBorderDate = new Date();
    staleBorderDate.setDate(staleBorderDate.getDate() - staleDays);

    const inventoryProducts = products.map(product => {
      const stock = Number(product.stock || 0);
      const purchasePrice = Number(product.purchasePrice || 0);
      const salePrice = Number(product.salePrice || 0);

      const saleInfo = salesMap.get(String(product._id)) || {
        soldQty: 0,
        lastSoldAt: null
      };

      const inventoryCost = stock * purchasePrice;
      const inventoryRetail = stock * salePrice;

      const isLowStock = stock <= lowStockThreshold;
      const isNeverSold = !saleInfo.lastSoldAt;
      const isStale = isNeverSold || new Date(saleInfo.lastSoldAt) < staleBorderDate;

      return {
        ...product,
        stock,
        purchasePrice,
        salePrice,
        soldQty: Number(saleInfo.soldQty || 0),
        lastSoldAt: saleInfo.lastSoldAt,
        inventoryCost,
        inventoryRetail,
        isLowStock,
        isNeverSold,
        isStale
      };
    });

    const productCount = inventoryProducts.length;
    const totalStockQty = inventoryProducts.reduce((sum, p) => sum + Number(p.stock || 0), 0);
    const totalPurchaseValue = inventoryProducts.reduce((sum, p) => sum + Number(p.inventoryCost || 0), 0);
    const totalRetailValue = inventoryProducts.reduce((sum, p) => sum + Number(p.inventoryRetail || 0), 0);

    const lowStockProducts = inventoryProducts
      .filter(p => p.isLowStock)
      .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));

    const staleProducts = inventoryProducts
      .filter(p => p.isStale)
      .sort((a, b) => {
        if (a.isNeverSold && !b.isNeverSold) return -1;
        if (!a.isNeverSold && b.isNeverSold) return 1;
        return Number(b.stock || 0) - Number(a.stock || 0);
      });

    const lowStockCount = lowStockProducts.length;
    const staleCount = staleProducts.length;

    res.render("admin/dashboard", {
      productCount,
      totalStockQty,
      totalPurchaseValue,
      totalRetailValue,
      lowStockCount,
      staleCount,
      lowStockProducts,
      staleProducts,
      inventoryProducts
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
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
      barcode,
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
      barcode: String(barcode || "").trim(),
      allowDebt: allowDebt === "on",
      description
    });

    await newProduct.save();

    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.render("admin/new-product", {
      error: "Mahsulotni saqlashda xatolik bo‘ldi"
    });
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
      barcode,
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
      barcode: String(barcode || "").trim(),
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
