const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const budgetCategorySchema = Schema(
  {
    budget: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Budget is required"],
      ref: "Budget",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Category is required"],
      ref: "Category",
    },
    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],
    planned: {
      type: Number,
      required: [true, "Please enter planned amount"],
      min: [0, "Amount should not be less thaan 0"],
      default: 0,
    },
    actual: {
      type: Number,
      required: [true, "Please enter actual amount"],
      min: [0, "Amount should not be less thaan 0"],
      default: 0,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

budgetCategorySchema.index(
  { budget: 1, category: -1, user: -1 },
  { unique: true }
);

module.exports = mongoose.model("BudgetCategory", budgetCategorySchema);
