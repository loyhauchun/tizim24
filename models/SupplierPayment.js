const mongoose = require("mongoose");

const supplierPaymentSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true
    },
    supplierName: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      default: 0
    },
    note: {
      type: String,
      default: ""
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    createdByName: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupplierPayment", supplierPaymentSchema);