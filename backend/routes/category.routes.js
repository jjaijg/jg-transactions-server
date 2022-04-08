const express = require("express");
const router = express.Router();

const categoryController = require("../controllers/category.controller");
const { protect } = require("../middlewares/auth.middleware");

router
  .route("/")
  .get(protect, categoryController.getCategories)
  .post(protect, categoryController.addCategory);
router
  .route("/:id")
  .put(protect, categoryController.updateCategory)
  .delete(protect, categoryController.deleteCategory);

module.exports = router;
