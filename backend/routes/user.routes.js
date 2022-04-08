const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const { protect } = require("../middlewares/auth.middleware");

router.post("/", userController.registerUser);
router.get("/me", protect, userController.getMe);
router.post("/login", userController.loginUser);
// router
//   .route("/:id")
//   .put(userController.updateCategory)
//   .delete(userController.deleteCategory);

module.exports = router;
