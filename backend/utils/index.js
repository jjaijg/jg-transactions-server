const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const encryptData = async (data) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(data, salt);
};

const decryptData = async (encrypted, raw) => {
  console.log(encrypted, raw);
  return await bcrypt.compare(raw, encrypted);
};

const generateToken = (data) => {
  return jwt.sign(data, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "1d",
  });
};

module.exports = {
  encryptData,
  decryptData,
  generateToken,
};
