const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const categorySchema = Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter category name"],
      // unique: true,
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

categorySchema.index({ name: 1, user: -1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);
