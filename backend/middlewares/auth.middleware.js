const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const User = require("../models/user.model");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      decode = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decode.id).select("-password");

      if (user) {
        req.user = user;
        next();
      } else {
        res.status(401);
        throw new Error("Invalid token sent!");
      }
    } catch (error) {
      console.log(error);
      res.status(401);
      throw new Error("Not authorized!");
    }
  }
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, not token found!");
  }
});

module.exports = {
  protect,
};
