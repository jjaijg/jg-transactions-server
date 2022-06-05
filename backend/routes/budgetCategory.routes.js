const express = require("express");
const router = express.Router();

const budgetCatCtrl = require("../controllers/budgetcategory.controller");
const { protect } = require("../middlewares/auth.middleware");

router
  .route("/")
  .post(protect, budgetCatCtrl.addBudgetCategory)
  .get(protect, budgetCatCtrl.getAllBudgetCategories);
router.route("/update/:id/:type").put(protect, budgetCatCtrl.updateAmount);
router.route("/:id").delete(protect, budgetCatCtrl.delBudCategory);

router.all("*", (req, res) => {
  return res.status(404).json({ message: "Resouce not found!" });
});

module.exports = router;
