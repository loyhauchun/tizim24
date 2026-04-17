const mongoose = require("mongoose");

const debtItemSchema = new mongoose.Schema(
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

const paymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true
    },
    note: {
      type: String,
      default: ""
    },
    paidAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const debtSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },

    customerName: {
      type: String,
      required: true
    },

    customerPhone: {
      type: String,
      default: ""
    },

    items: {
      type: [debtItemSchema],
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

    paidAmount: {
      type: Number,
      default: 0
    },

    remainingAmount: {
      type: Number,
      required: true,
      default: 0
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
    },

    payments: {
      type: [paymentSchema],
      default: []
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Debt", debtSchema);
