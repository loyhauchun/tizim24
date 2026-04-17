const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      default: "",
      trim: true
    },

    unit: {
      type: String,
      enum: ["dona", "kg", "metr", "m2", "m3"],
      required: true
    },

    purchasePrice: {
      type: Number,
      default: 0
    },

    salePrice: {
      type: Number,
      required: true,
      default: 0
    },

    minPrice: {
      type: Number,
      default: 0
    },

    stock: {
      type: Number,
      default: 0
    },

    sku: {
      type: String,
      default: "",
      trim: true
    },

    barcode: {
    type: String,
    default: "",
    trim: true
    },

    allowDebt: {
      type: Boolean,
      default: true
    },

    description: {
      type: String,
      default: "",
      trim: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
