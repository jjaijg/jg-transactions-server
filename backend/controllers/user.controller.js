const asyncHandler = require("express-async-handler");

const User = require("../models/user.model");
// const Category = require("../models/category.model");
const { encryptData, decryptData, generateToken } = require("../utils");

// @desc    Get User
// @route   GET /users/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  // const user = await User.find({}).select("-password");
  res.json({ message: "Got user", data: req.user });
});

// @desc    Register User
// @route   POST /users
// @access  Public
const registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!password) {
    res.status(400);
    throw new Error("Please fill password");
  }

  const hashPassword = await encryptData(password);

  const user = await User.create({ name, email, password: hashPassword });

  if (user) {
    const { _id, name, email, createdAt, updatedAt } = user;
    res.json({
      message: `Added new user : ${user.name}`,
      data: {
        _id,
        name,
        email,
        createdAt,
        updatedAt,
        token: generateToken({ id: _id }),
      },
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data!");
  }
});

// @desc    Login User
// @route   POST /users/login
// @access  Public
const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please fill all required fields");
  }

  const user = await User.findOne({ email });

  if (user && (await decryptData(user.password, password))) {
    const { _id, name, email, createdAt, updatedAt } = user;

    res.json({
      message: `Welcome back ${user.name}`,
      data: {
        _id,
        name,
        email,
        createdAt,
        updatedAt,
        token: generateToken({ id: _id }),
      },
    });
  } else {
    res.status(400);
    throw new Error("Invalid user credentials!");
  }
});

module.exports = {
  getMe,
  registerUser,
  loginUser,
};
