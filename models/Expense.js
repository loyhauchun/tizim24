const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: [
        "dastafka",
        "abet",
        "arenda",
        "kommunal",
        "ishchi",
        "transport",
        "boshqa"
      ],
      default: "boshqa"
    },
    amount: {
      type: Number,
      required: true,
      default: 0
    },
    note: {
      type: String,
      default: "",
      trim: true
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

module.exports = mongoose.model("Expense", expenseSchema);