const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const _ = require("lodash");

// AUTH HELPERS - START
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
// AUTH HELPERS - END

// TXN HELPERS - START
const areTxnBudgetsEqual = (budgets1 = [], budgets2 = []) =>
  _.isEqual(_.sortBy(budgets1), _.sortBy(budgets2));

const getDifference = (array1 = [], array2 = []) =>
  array1.filter((ele) => !array2.includes(ele));
const getSame = (array1 = [], array2 = []) =>
  array1.filter((ele) => array2.includes(ele));
// TXN HELPERS - END

module.exports = {
  encryptData,
  decryptData,
  generateToken,

  areTxnBudgetsEqual,
  getDifference,
  getSame,
};
