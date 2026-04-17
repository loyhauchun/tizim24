const mongoose = require("mongoose");

const supplierReturnItemSchema = new mongoose.Schema(
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

const supplierReturnSchema = new mongoose.Schema(
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

    returnType: {
      type: String,
      enum: ["refund", "exchange"],
      default: "refund"
    },

    items: {
      type: [supplierReturnItemSchema],
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

    creditToSupplier: {
      type: Boolean,
      default: false
    },

    note: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "completed"
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

module.exports = mongoose.model("SupplierReturn", supplierReturnSchema);
