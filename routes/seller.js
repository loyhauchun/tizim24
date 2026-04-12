const express = require("express");
const Product = require("../models/Product");
const Sale = require("../models/Sale");
const Customer = require("../models/Customer");
const Debt = require("../models/Debt");
const PendingOrder = require("../models/PendingOrder");
const Expense = require("../models/Expense");
const Supplier = require("../models/Supplier");
const StockEntry = require("../models/StockEntry");
const SupplierPayment = require("../models/SupplierPayment");
const Return = require("../models/Return");
const SupplierReturn = require("../models/SupplierReturn");

const router = express.Router();

router.get("/dashboard", async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    const customers = await Customer.find({ isActive: true }).sort({ fullName: 1 }).lean();
    const pendingOrders = await PendingOrder.find({ status: "pending" }).sort({ createdAt: -1 }).lean();

    const expenseCount = await Expense.countDocuments();
    const expenseAgg = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalExpenses = expenseAgg.length ? expenseAgg[0].total : 0;

    const supplierCount = await Supplier.countDocuments();
    const stockEntryAgg = await StockEntry.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalStockEntries = stockEntryAgg.length ? stockEntryAgg[0].total : 0;

    const supplierPaymentAgg = await SupplierPayment.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalSupplierPayments = supplierPaymentAgg.length
      ? supplierPaymentAgg[0].total
      : 0;

    res.render("seller/dashboard", {
      products,
      customers,
      pendingOrders,
      expenseCount,
      totalExpenses,
      supplierCount,
      totalStockEntries,
      totalSupplierPayments
    });
  } catch (error) {
    console.error("Seller dashboard xatosi:", error);
    res.status(500).send("Sotuvchi panelida xatolik");
  }
});

router.post("/checkout", async (req, res) => {
  try {
    const items = req.body.items || [];
    const paymentType = req.body.paymentType || "cash";
    const note = req.body.note || "";
    const customerId = req.body.customerId || "";
    const newCustomer = req.body.newCustomer || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Savat bo‘sh" });
    }

    let totalAmount = 0;
    const saleItems = [];

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

      if (Number(product.stock) < qty) {
        return res.status(400).json({
          success: false,
          message: `${product.name} uchun qoldiq yetarli emas`
        });
      }

      const lineTotal = qty * price;
      totalAmount += lineTotal;

      saleItems.push({
        product: product._id,
        productName: product.name,
        unit: product.unit,
        qty,
        price,
        lineTotal
      });
    }

    for (const item of items) {
      const product = await Product.findById(item.productId);
      product.stock = Number(product.stock) - Number(item.qty);
      await product.save();
    }

    if (paymentType === "debt") {
      let customer = null;

      if (customerId) {
        customer = await Customer.findById(customerId);
      } else if (newCustomer.fullName && newCustomer.phone) {
        customer = await Customer.findOne({
          phone: String(newCustomer.phone).trim()
        });

        if (!customer) {
          customer = new Customer({
            fullName: String(newCustomer.fullName).trim(),
            phone: String(newCustomer.phone).trim(),
            address: String(newCustomer.address || "").trim(),
            note: String(newCustomer.note || "").trim()
          });
          await customer.save();
        }
      }

      if (!customer) {
        return res.status(400).json({
          success: false,
          message: "Nasiyaga savdo uchun mijoz tanlang yoki yangi mijoz kiriting"
        });
      }

      const debt = new Debt({
        customer: customer._id,
        customerName: customer.fullName,
        customerPhone: customer.phone,
        items: saleItems,
        totalAmount,
        paidAmount: 0,
        remainingAmount: totalAmount,
        seller: req.session?.user?.id || null,
        sellerName: req.session?.user?.fullName || "",
        note,
        status: "open"
      });

      await debt.save();

      return res.json({
        success: true,
        message: "Nasiya savdo saqlandi",
        totalAmount
      });
    }

    const sale = new Sale({
      items: saleItems,
      totalAmount,
      paymentType,
      seller: req.session?.user?.id || null,
      sellerName: req.session?.user?.fullName || "",
      note
    });

    await sale.save();

    return res.json({
      success: true,
      message: "Savdo saqlandi",
      totalAmount
    });
  } catch (error) {
    console.error("CHECKOUT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Savdoni saqlashda xatolik"
    });
  }
});

router.get("/sales", async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 }).limit(50).lean();
    res.render("seller/sales", { sales });
  } catch (error) {
    console.error("Sales list error:", error);
    res.status(500).send("Savdolar ro‘yxatida xatolik");
  }
});

router.get("/debts", async (req, res) => {
  try {
    const debts = await Debt.find().sort({ createdAt: -1 }).lean();
    res.render("seller/debts", { debts });
  } catch (error) {
    console.error("Debt list error:", error);
    res.status(500).send("Qarzlar ro‘yxatida xatolik");
  }
});

router.post("/debts/pay/:id", async (req, res) => {
  try {
    const amount = Number(req.body.amount || 0);
    const note = req.body.note || "";

    if (!amount || amount <= 0) {
      return res.status(400).send("To‘lov summasi noto‘g‘ri");
    }

    const debt = await Debt.findById(req.params.id);

    if (!debt) {
      return res.status(404).send("Qarz topilmadi");
    }

    debt.paidAmount = Number(debt.paidAmount) + amount;
    debt.remainingAmount = Number(debt.totalAmount) - Number(debt.paidAmount);

    debt.payments.push({ amount, note });

    if (debt.remainingAmount <= 0) {
      debt.remainingAmount = 0;
      debt.status = "closed";
    }

    await debt.save();

    res.redirect("/seller/debts");
  } catch (error) {
    console.error("Debt payment error:", error);
    res.status(500).send("To‘lovni saqlashda xatolik");
  }
});

router.post("/pending-orders/:id/approve", async (req, res) => {
  try {
    const pendingOrder = await PendingOrder.findById(req.params.id);

    if (!pendingOrder) {
      return res.status(404).send("Pending order topilmadi");
    }

    if (pendingOrder.status !== "pending") {
      return res.redirect("/seller/dashboard");
    }

    for (const item of pendingOrder.items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).send(`Mahsulot topilmadi: ${item.productName}`);
      }

      const currentStock = Number(product.stock || 0);
      const qty = Number(item.qty || 0);

      if (currentStock < qty) {
        return res.status(400).send(`${item.productName} uchun qoldiq yetarli emas`);
      }
    }

    for (const item of pendingOrder.items) {
      const product = await Product.findById(item.product);
      const currentStock = Number(product.stock || 0);
      const qty = Number(item.qty || 0);

      product.stock = currentStock - qty;
      await product.save();
    }

    if (pendingOrder.paymentType === "debt") {
      let customer = null;

      if (pendingOrder.customerId) {
        customer = await Customer.findById(pendingOrder.customerId);
      }

      if (!customer && pendingOrder.customerPhone) {
        customer = await Customer.findOne({
          phone: String(pendingOrder.customerPhone).trim()
        });
      }

      if (!customer && pendingOrder.customerName && pendingOrder.customerPhone) {
        customer = new Customer({
          fullName: pendingOrder.customerName,
          phone: pendingOrder.customerPhone,
          address: pendingOrder.customerAddress || "",
          note: pendingOrder.customerNote || ""
        });

        await customer.save();
      }

      if (!customer) {
        return res.status(400).send("Mijoz ma’lumoti topilmadi");
      }

      const debt = new Debt({
        customer: customer._id,
        customerName: customer.fullName,
        customerPhone: customer.phone,
        items: pendingOrder.items,
        totalAmount: pendingOrder.totalAmount,
        paidAmount: 0,
        remainingAmount: pendingOrder.totalAmount,
        seller: req.session?.user?.id || null,
        sellerName: req.session?.user?.fullName || "",
        note: pendingOrder.note || "",
        status: "open"
      });

      await debt.save();
    } else {
      const sale = new Sale({
        items: pendingOrder.items,
        totalAmount: pendingOrder.totalAmount,
        paymentType: pendingOrder.paymentType,
        seller: req.session?.user?.id || null,
        sellerName: req.session?.user?.fullName || "",
        note: pendingOrder.note || ""
      });

      await sale.save();
    }

    pendingOrder.status = "approved";
    await pendingOrder.save();

    res.redirect("/seller/dashboard");
  } catch (error) {
    console.error("Pending approve error:", error);
    res.status(500).send("Pending orderni tasdiqlashda xatolik");
  }
});

router.post("/pending-orders/:id/reject", async (req, res) => {
  try {
    const pendingOrder = await PendingOrder.findById(req.params.id);

    if (!pendingOrder) {
      return res.status(404).send("Pending order topilmadi");
    }

    pendingOrder.status = "rejected";
    await pendingOrder.save();

    res.redirect("/seller/dashboard");
  } catch (error) {
    console.error("Pending reject error:", error);
    res.status(500).send("Pending orderni rad etishda xatolik");
  }
});

router.get("/expenses", async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 }).lean();
    res.render("seller/expenses", { expenses });
  } catch (error) {
    console.error("Expense list error:", error);
    res.status(500).send("Chiqimlar ro‘yxatida xatolik");
  }
});

router.get("/expenses/new", (req, res) => {
  res.render("seller/new-expense", { error: null });
});

router.post("/expenses/new", async (req, res) => {
  try {
    const { title, category, amount, note } = req.body;

    const expense = new Expense({
      title,
      category,
      amount: Number(amount) || 0,
      note,
      createdBy: req.session?.user?.id || null,
      createdByName: req.session?.user?.fullName || ""
    });

    await expense.save();

    res.redirect("/seller/expenses");
  } catch (error) {
    console.error("Expense create error:", error);
    res.render("seller/new-expense", {
      error: "Chiqimni saqlashda xatolik"
    });
  }
});

router.get("/suppliers", async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 }).lean();
    res.render("seller/suppliers", { suppliers });
  } catch (error) {
    console.error("Supplier list error:", error);
    res.status(500).send("Firmalar ro‘yxatida xatolik");
  }
});

router.get("/suppliers/new", (req, res) => {
  res.render("seller/new-supplier", { error: null });
});

router.post("/suppliers/new", async (req, res) => {
  try {
    const { name, phone, address, note } = req.body;

    const supplier = new Supplier({
      name,
      phone,
      address,
      note
    });

    await supplier.save();

    res.redirect("/seller/suppliers");
  } catch (error) {
    console.error("Supplier create error:", error);
    res.render("seller/new-supplier", {
      error: "Firmani saqlashda xatolik"
    });
  }
});

router.get("/stock-entries", async (req, res) => {
  try {
    const stockEntries = await StockEntry.find().sort({ createdAt: -1 }).lean();
    res.render("seller/stock-entries", { stockEntries });
  } catch (error) {
    console.error("Stock entry list error:", error);
    res.status(500).send("Kirimlar ro‘yxatida xatolik");
  }
});

router.get("/stock-entries/new", async (req, res) => {
  try {
    const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
    const products = await Product.find({ isActive: true }).sort({ name: 1 }).lean();

    res.render("seller/new-stock-entry", {
      suppliers,
      products,
      error: null
    });
  } catch (error) {
    console.error("Stock entry new page error:", error);
    res.status(500).send("Kirim oynasida xatolik");
  }
});

router.post("/stock-entries/new", async (req, res) => {
  try {
    const { supplierId, paymentStatus, paidAmount, note, itemsJson } = req.body;

    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
      const products = await Product.find({ isActive: true }).sort({ name: 1 }).lean();

      return res.render("seller/new-stock-entry", {
        suppliers,
        products,
        error: "Firma topilmadi"
      });
    }

    let items = [];
    try {
      items = JSON.parse(itemsJson || "[]");
    } catch (e) {
      items = [];
    }

    if (!Array.isArray(items) || items.length === 0) {
      const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
      const products = await Product.find({ isActive: true }).sort({ name: 1 }).lean();

      return res.render("seller/new-stock-entry", {
        suppliers,
        products,
        error: "Kirim savati bo‘sh"
      });
    }

    let totalAmount = 0;
    const entryItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
        const products = await Product.find({ isActive: true }).sort({ name: 1 }).lean();

        return res.render("seller/new-stock-entry", {
          suppliers,
          products,
          error: "Mahsulotlardan biri topilmadi"
        });
      }

      const qty = Number(item.qty);
      const purchasePrice = Number(item.purchasePrice);

      if (!qty || qty <= 0 || !purchasePrice || purchasePrice <= 0) {
        const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
        const products = await Product.find({ isActive: true }).sort({ name: 1 }).lean();

        return res.render("seller/new-stock-entry", {
          suppliers,
          products,
          error: `${product.name} uchun miqdor yoki kirim narxi noto‘g‘ri`
        });
      }

      const lineTotal = qty * purchasePrice;
      totalAmount += lineTotal;

      entryItems.push({
        product: product._id,
        productName: product.name,
        qty,
        purchasePrice,
        lineTotal
      });

      product.stock = Number(product.stock || 0) + qty;
      product.purchasePrice = purchasePrice;
      await product.save();
    }

    const paid = Number(paidAmount || 0);
    const remainingAmount =
      paymentStatus === "debt"
        ? Math.max(totalAmount - paid, 0)
        : 0;

    const stockEntry = new StockEntry({
      supplier: supplier._id,
      supplierName: supplier.name,
      items: entryItems,
      totalAmount,
      paymentStatus,
      paidAmount: paymentStatus === "debt" ? paid : totalAmount,
      remainingAmount,
      note,
      createdBy: req.session?.user?.id || null,
      createdByName: req.session?.user?.fullName || ""
    });

    await stockEntry.save();

    if (paymentStatus === "debt") {
      supplier.totalDebt = Number(supplier.totalDebt || 0) + remainingAmount;
      await supplier.save();
    }

    res.redirect("/seller/stock-entries");
  } catch (error) {
    console.error("Stock entry create error:", error);

    const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
    const products = await Product.find({ isActive: true }).sort({ name: 1 }).lean();

    res.render("seller/new-stock-entry", {
      suppliers,
      products,
      error: "Kirimni saqlashda xatolik"
    });
  }
});

router.get("/supplier-payments", async (req, res) => {
  try {
    const payments = await SupplierPayment.find().sort({ createdAt: -1 }).lean();
    res.render("seller/supplier-payments", { payments });
  } catch (error) {
    console.error("Supplier payment list error:", error);
    res.status(500).send("Firma to‘lovlari ro‘yxatida xatolik");
  }
});

router.get("/supplier-payments/new", async (req, res) => {
  try {
    const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();

    res.render("seller/new-supplier-payment", {
      suppliers,
      error: null
    });
  } catch (error) {
    console.error("Supplier payment new page error:", error);
    res.status(500).send("Firma to‘lovi oynasida xatolik");
  }
});

router.post("/supplier-payments/new", async (req, res) => {
  try {
    const { supplierId, amount, note } = req.body;

    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
      return res.render("seller/new-supplier-payment", {
        suppliers,
        error: "Firma topilmadi"
      });
    }

    const payAmount = Number(amount || 0);

    if (!payAmount || payAmount <= 0) {
      const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
      return res.render("seller/new-supplier-payment", {
        suppliers,
        error: "To‘lov summasi noto‘g‘ri"
      });
    }

    const payment = new SupplierPayment({
      supplier: supplier._id,
      supplierName: supplier.name,
      amount: payAmount,
      note,
      createdBy: req.session?.user?.id || null,
      createdByName: req.session?.user?.fullName || ""
    });

    await payment.save();

    supplier.totalDebt = Math.max(Number(supplier.totalDebt || 0) - payAmount, 0);
    await supplier.save();

    res.redirect("/seller/supplier-payments");
  } catch (error) {
    console.error("Supplier payment create error:", error);

    const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
    res.render("seller/new-supplier-payment", {
      suppliers,
      error: "Firma to‘lovini saqlashda xatolik"
    });
  }
});

router.get("/returns", async (req, res) => {
  try {
    const returns = await Return.find().sort({ createdAt: -1 }).lean();
    res.render("seller/returns", { returns });
  } catch (error) {
    console.error("Return list error:", error);
    res.status(500).send("Qaytimlar ro‘yxatida xatolik");
  }
});

router.get("/sales/:id/return", async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).lean();

    if (!sale) {
      return res.status(404).send("Savdo topilmadi");
    }

    res.render("seller/new-return", {
      sale,
      error: null
    });
  } catch (error) {
    console.error("Return page error:", error);
    res.status(500).send("Qaytim oynasida xatolik");
  }
});

router.post("/supplier-payments/new", async (req, res) => {
  try {
    const { supplierId, amount, note } = req.body;

    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
      return res.render("seller/new-supplier-payment", {
        suppliers,
        error: "Firma topilmadi"
      });
    }

    const payAmount = Number(amount || 0);
    const currentDebt = Number(supplier.totalDebt || 0);

    if (!payAmount || payAmount <= 0) {
      const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
      return res.render("seller/new-supplier-payment", {
        suppliers,
        error: "To‘lov summasi noto‘g‘ri"
      });
    }

    if (currentDebt <= 0) {
      const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
      return res.render("seller/new-supplier-payment", {
        suppliers,
        error: "Bu firmada hozir qarz yo‘q"
      });
    }

    if (payAmount > currentDebt) {
      const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
      return res.render("seller/new-supplier-payment", {
        suppliers,
        error: `To‘lov summasi firma qarzidan katta bo‘lishi mumkin emas. Maksimal: ${currentDebt.toLocaleString("uz-UZ")}`
      });
    }

    const payment = new SupplierPayment({
      supplier: supplier._id,
      supplierName: supplier.name,
      amount: payAmount,
      note,
      createdBy: req.session?.user?.id || null,
      createdByName: req.session?.user?.fullName || ""
    });

    await payment.save();

    supplier.totalDebt = currentDebt - payAmount;
    await supplier.save();

    res.redirect("/seller/supplier-payments");
  } catch (error) {
    console.error("Supplier payment create error:", error);

    const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
    res.render("seller/new-supplier-payment", {
      suppliers,
      error: "Firma to‘lovini saqlashda xatolik"
    });
  }
});

router.get("/suppliers/:id", async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id).lean();

    if (!supplier) {
      return res.status(404).send("Firma topilmadi");
    }

    const stockEntries = await StockEntry.find({ supplier: supplier._id })
      .sort({ createdAt: -1 })
      .lean();

    const payments = await SupplierPayment.find({ supplier: supplier._id })
      .sort({ createdAt: -1 })
      .lean();

    const totalEntryAmount = stockEntries.reduce(
      (sum, entry) => sum + Number(entry.totalAmount || 0),
      0
    );

    const totalPaidAmount = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    res.render("seller/supplier-detail", {
      supplier,
      stockEntries,
      payments,
      totalEntryAmount,
      totalPaidAmount
    });
  } catch (error) {
    console.error("Supplier detail error:", error);
    res.status(500).send("Firma tarixi sahifasida xatolik");
  }
});

router.get("/customers/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();

    if (!customer) {
      return res.status(404).send("Mijoz topilmadi");
    }

    const debts = await Debt.find({ customer: customer._id })
      .sort({ createdAt: -1 })
      .lean();

    const totalDebtAmount = debts.reduce(
      (sum, debt) => sum + Number(debt.totalAmount || 0),
      0
    );

    const totalPaidAmount = debts.reduce(
      (sum, debt) => sum + Number(debt.paidAmount || 0),
      0
    );

    const totalRemainingAmount = debts.reduce(
      (sum, debt) => sum + Number(debt.remainingAmount || 0),
      0
    );

    const openDebtCount = debts.filter(
      debt => debt.status === "open"
    ).length;

    const paymentHistory = [];
    debts.forEach(debt => {
      (debt.payments || []).forEach(payment => {
        paymentHistory.push({
          debtId: debt._id,
          customerName: debt.customerName,
          amount: payment.amount,
          note: payment.note,
          paidAt: payment.paidAt
        });
      });
    });

    paymentHistory.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));

    res.render("seller/customer-detail", {
      customer,
      debts,
      totalDebtAmount,
      totalPaidAmount,
      totalRemainingAmount,
      openDebtCount,
      paymentHistory
    });
  } catch (error) {
    console.error("Customer detail error:", error);
    res.status(500).send("Mijoz tarixi sahifasida xatolik");
  }
});

router.get("/supplier-returns", async (req, res) => {
  try {
    const returns = await SupplierReturn.find().sort({ createdAt: -1 }).lean();
    res.render("seller/supplier-returns", { returns });
  } catch (error) {
    console.error("Supplier return list error:", error);
    res.status(500).send("Firma qaytimlari ro‘yxatida xatolik");
  }
});

router.get("/supplier-returns/new", async (req, res) => {
  try {
    const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
    const products = await Product.find({ isActive: true }).sort({ name: 1 }).lean();

    res.render("seller/new-supplier-return", {
      suppliers,
      products,
      error: null
    });
  } catch (error) {
    console.error("Supplier return page error:", error);
    res.status(500).send("Firma qaytimi oynasida xatolik");
  }
});

router.post("/supplier-returns/new", async (req, res) => {
  try {
    const { supplierId, reason, note, creditToSupplier, itemsJson } = req.body;

    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
      const products = await Product.find({ isActive: true }).sort({ name: 1 }).lean();

      return res.render("seller/new-supplier-return", {
        suppliers,
        products,
        error: "Firma topilmadi"
      });
    }

    let items = [];
    try {
      items = JSON.parse(itemsJson || "[]");
    } catch (e) {
      items = [];
    }

    if (!Array.isArray(items) || items.length === 0) {
      const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
      const products = await Product.find({ isActive: true }).sort({ name: 1 }).lean();

      return res.render("seller/new-supplier-return", {
        suppliers,
        products,
        error: "Qaytim savati bo‘sh"
      });
    }

    let totalAmount = 0;
    const returnItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
        const products = await Product.find({ isActive: true }).sort({ name: 1 }).lean();

        return res.render("seller/new-supplier-return", {
          suppliers,
          products,
          error: "Mahsulotlardan biri topilmadi"
        });
      }

      const qty = Number(item.qty || 0);
      const price = Number(item.price || 0);

      if (!qty || qty <= 0 || !price || price <= 0) {
        const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
        const products = await Product.find({ isActive: true }).sort({ name: 1 }).lean();

        return res.render("seller/new-supplier-return", {
          suppliers,
          products,
          error: `${product.name} uchun miqdor yoki narx noto‘g‘ri`
        });
      }

      if (Number(product.stock || 0) < qty) {
        const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
        const products = await Product.find({ isActive: true }).sort({ name: 1 }).lean();

        return res.render("seller/new-supplier-return", {
          suppliers,
          products,
          error: `${product.name} uchun qoldiq yetarli emas`
        });
      }

      product.stock = Number(product.stock || 0) - qty;
      await product.save();

      const lineTotal = qty * price;
      totalAmount += lineTotal;

      returnItems.push({
        product: product._id,
        productName: product.name,
        qty,
        price,
        lineTotal
      });
    }

    const supplierReturn = new SupplierReturn({
      supplier: supplier._id,
      supplierName: supplier.name,
      items: returnItems,
      totalAmount,
      reason,
      creditToSupplier: Boolean(creditToSupplier),
      note,
      createdBy: req.session?.user?.id || null,
      createdByName: req.session?.user?.fullName || ""
    });

    await supplierReturn.save();

    if (creditToSupplier === "on") {
      supplier.totalDebt = Math.max(Number(supplier.totalDebt || 0) - totalAmount, 0);
      await supplier.save();
    }

    res.redirect("/seller/supplier-returns");
  } catch (error) {
    console.error("Supplier return create error:", error);

    const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 }).lean();
    const products = await Product.find({ isActive: true }).sort({ name: 1 }).lean();

    res.render("seller/new-supplier-return", {
      suppliers,
      products,
      error: "Firma qaytimini saqlashda xatolik"
    });
  }
});

module.exports = router;