const express = require("express");
const Sale = require("../models/Sale");
const Debt = require("../models/Debt");
const Expense = require("../models/Expense");
const Supplier = require("../models/Supplier");
const StockEntry = require("../models/StockEntry");
const SupplierPayment = require("../models/SupplierPayment");
const Product = require("../models/Product");

const router = express.Router();

router.get("/dashboard", async (req, res) => {
  try {
    const saleCount = await Sale.countDocuments();
    const saleAgg = await Sale.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);
    const totalSales = saleAgg.length ? saleAgg[0].total : 0;

    const expenseCount = await Expense.countDocuments();
    const expenseAgg = await Expense.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);
    const totalExpenses = expenseAgg.length ? expenseAgg[0].total : 0;

    const stockEntryCount = await StockEntry.countDocuments();
    const stockEntryAgg = await StockEntry.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);
    const totalStockEntries = stockEntryAgg.length ? stockEntryAgg[0].total : 0;

    const debtCount = await Debt.countDocuments({ status: "open" });
    const debtAgg = await Debt.aggregate([
      { $match: { status: "open" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$remainingAmount" }
        }
      }
    ]);
    const totalCustomerDebt = debtAgg.length ? debtAgg[0].total : 0;

    const supplierCount = await Supplier.countDocuments();
    const supplierDebtAgg = await Supplier.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalDebt" }
        }
      }
    ]);
    const totalSupplierDebt = supplierDebtAgg.length ? supplierDebtAgg[0].total : 0;

    const supplierPaymentAgg = await SupplierPayment.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);
    const totalSupplierPayments = supplierPaymentAgg.length
      ? supplierPaymentAgg[0].total
      : 0;

    const productCount = await Product.countDocuments({ isActive: true });

    const estimatedBalance =
      Number(totalSales || 0) -
      Number(totalExpenses || 0) -
      Number(totalSupplierPayments || 0);

    res.render("investor/dashboard", {
      saleCount,
      totalSales,
      expenseCount,
      totalExpenses,
      stockEntryCount,
      totalStockEntries,
      debtCount,
      totalCustomerDebt,
      supplierCount,
      totalSupplierDebt,
      totalSupplierPayments,
      productCount,
      estimatedBalance
    });
  } catch (error) {
    console.error("Investor dashboard xatosi:", error);
    res.status(500).send("Investor panelida xatolik");
  }
});

module.exports = router;