const mongoose = require("mongoose");

const pendingOrderItemSchema = new mongoose.Schema(
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
    unit: {
      type: String,
      required: true
    },
    qty: {
      type: Number,
      required: true
    },
    price: {
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

const pendingOrderSchema = new mongoose.Schema(
  {
    items: {
      type: [pendingOrderItemSchema],
      default: []
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },
    paymentType: {
      type: String,
      enum: ["cash", "card", "transfer", "debt"],
      default: "cash"
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null
    },
    customerName: {
      type: String,
      default: ""
    },
    customerPhone: {
      type: String,
      default: ""
    },
    customerAddress: {
      type: String,
      default: ""
    },
    customerNote: {
      type: String,
      default: ""
    },
    note: {
      type: String,
      default: ""
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    workerName: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PendingOrder", pendingOrderSchema);