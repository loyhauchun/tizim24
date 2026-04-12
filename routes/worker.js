const express = require("express");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const PendingOrder = require("../models/PendingOrder");

const router = express.Router();

router.get("/dashboard", async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    const customers = await Customer.find({ isActive: true }).sort({ fullName: 1 }).lean();

    res.render("worker/dashboard", {
      products,
      customers
    });
  } catch (error) {
    console.error("Worker dashboard xatosi:", error);
    res.status(500).send("Worker panelida xatolik");
  }
});

router.post("/send-order", async (req, res) => {
  try {
    const items = req.body.items || [];
    const paymentType = req.body.paymentType || "cash";
    const note = req.body.note || "";
    const customerId = req.body.customerId || "";
    const newCustomer = req.body.newCustomer || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Savat bo‘sh"
      });
    }

    let totalAmount = 0;
    const pendingItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Mahsulot topilmadi: ${item.name || ""}`
        });
      }

      const qty = Number(item.qty);
      const price = Number(item.price);

      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: `${product.name} uchun miqdor noto‘g‘ri`
        });
      }

      if (isNaN(price) || price <= 0) {
        return res.status(400).json({
          success: false,
          message: `${product.name} uchun narx noto‘g‘ri`
        });
      }

      const lineTotal = qty * price;
      totalAmount += lineTotal;

      pendingItems.push({
        product: product._id,
        productName: product.name,
        unit: product.unit,
        qty,
        price,
        lineTotal
      });
    }

    let customerName = "";
    let customerPhone = "";
    let customerAddress = "";
    let customerNote = "";

    if (paymentType === "debt") {
      if (customerId) {
        const customer = await Customer.findById(customerId);

        if (!customer) {
          return res.status(404).json({
            success: false,
            message: "Mijoz topilmadi"
          });
        }

        customerName = customer.fullName;
        customerPhone = customer.phone;
        customerAddress = customer.address || "";
        customerNote = customer.note || "";
      } else if (newCustomer.fullName && newCustomer.phone) {
        customerName = String(newCustomer.fullName).trim();
        customerPhone = String(newCustomer.phone).trim();
        customerAddress = String(newCustomer.address || "").trim();
        customerNote = String(newCustomer.note || "").trim();
      } else {
        return res.status(400).json({
          success: false,
          message: "Nasiyaga yuborish uchun mijoz tanlang yoki yangi mijoz kiriting"
        });
      }
    }

    const pendingOrder = new PendingOrder({
      items: pendingItems,
      totalAmount,
      paymentType,
      customerId: customerId || null,
      customerName,
      customerPhone,
      customerAddress,
      customerNote,
      note,
      worker: req.session?.user?.id || null,
      workerName: req.session?.user?.fullName || "",
      status: "pending"
    });

    await pendingOrder.save();

    return res.json({
      success: true,
      message: "Buyurtma kassaga yuborildi"
    });
  } catch (error) {
    console.error("Worker send-order xatosi:", error);
    return res.status(500).json({
      success: false,
      message: "Buyurtmani yuborishda xatolik"
    });
  }
});

module.exports = router;