const Counter = require("../../models/counter.model");

const generateNextSequence = async (seq_id) => {
  const counter = await Counter.findByIdAndUpdate(
    seq_id,
    {
      $inc: { seq_value: 1 },
    },
    { new: true }
  );

  return counter.seq_value;
};

module.exports = { generateNextSequence };
