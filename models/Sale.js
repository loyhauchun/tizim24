const mongoose = require("mongoose");

const saleItemSchema = new mongoose.Schema(
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

const saleSchema = new mongoose.Schema(
  {
    items: {
      type: [saleItemSchema],
      default: []
    },

    subtotalAmount: {
      type: Number,
      required: true,
      default: 0
    },

    discountAmount: {
      type: Number,
      default: 0
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

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    sellerName: {
      type: String,
      default: ""
    },

    note: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sale", saleSchema);
