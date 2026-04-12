const mongoose = require("mongoose");

const returnItemSchema = new mongoose.Schema(
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

const returnSchema = new mongoose.Schema(
  {
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
      required: true
    },
    saleDate: {
      type: Date,
      default: null
    },
    returnType: {
      type: String,
      enum: ["refund", "exchange"],
      default: "refund"
    },
    items: {
      type: [returnItemSchema],
      default: []
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },
    reason: {
      type: String,
      default: ""
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

module.exports = mongoose.model("Return", returnSchema);