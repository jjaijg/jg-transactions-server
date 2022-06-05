const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const moment = require("moment");

const Schema = mongoose.Schema;

const transactionSchema = Schema(
  {
    amount: {
      type: Number,
      required: [true, "Please enter transaction amount"],
      min: [1, "minimum amount should be 1rs"],
    },
    type: {
      type: String,
      required: [true, "Please enter transaction type"],
      enum: ["income", "expense"],
    },
    description: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "user details required!"],
      ref: "User",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Category is required"],
      ref: "Category",
    },
    budgets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Budget",
      },
    ],
    date: {
      type: Date,
      default: moment(new Date()),
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("Transaction", transactionSchema);
