const express = require("express");
const router = express.Router();

const budgetCtrl = require("../controllers/budget.controller");
const { protect } = require("../middlewares/auth.middleware");

router.get("/filter", protect, budgetCtrl.getFilteredBudgets);
router.route("/").post(protect, budgetCtrl.addBudget);
router
  .route("/:id")
  .put(protect, budgetCtrl.updateBudget)
  .delete(protect, budgetCtrl.delBudget);

module.exports = router;
