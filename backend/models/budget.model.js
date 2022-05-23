const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const moment = require("moment");

const Schema = mongoose.Schema;

const budgetSchema = Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter budget name"],
    },
    description: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "user details required!"],
      ref: "User",
    },
    categories: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Category is required"],
      ref: "Category",
    },
    date: {
      type: Date,
      default: moment(new Date()).format("YYYY-MM-DD"),
    },
  },
  {
    timestamps: true,
  }
);

budgetSchema.plugin(aggregatePaginate);
budgetSchema.index({ name: 1, user: -1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);
