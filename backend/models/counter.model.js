const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const counterSchema = Schema(
  {
    _id: {
      type: String,
      required: [true, "Please enter counter id"],
      // unique: true,
    },
    seq_value: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Counter", counterSchema);
