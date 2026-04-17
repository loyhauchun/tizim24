const mongoose = require("mongoose");

const stockEntryItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    qty: {
      type: Number,
      required: true
    },
    purchasePrice: {
      type: Number,
      required: true
    },
    lineTotal: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

const stockEntrySchema = new mongoose.Schema(
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

    items: {
      type: [stockEntryItemSchema],
      default: []
    },

    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },

    paymentStatus: {
      type: String,
      enum: ["paid", "debt"],
      default: "paid"
    },

    paidAmount: {
      type: Number,
      default: 0
    },

    remainingAmount: {
      type: Number,
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

module.exports = mongoose.model("StockEntry", stockEntrySchema);
