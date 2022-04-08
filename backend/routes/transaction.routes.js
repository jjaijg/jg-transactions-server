const express = require("express");
const router = express.Router();

const txnController = require("../controllers/transaction.controller");
const { protect } = require("../middlewares/auth.middleware");

router.get("/total", protect, txnController.getTransactionAmount);
router.get("/filter", protect, txnController.getFilteredTransactions);
router
  .route("/")
  .get(protect, txnController.getTransactions)
  .post(protect, txnController.addTransaction);
router
  .route("/:id")
  .put(protect, txnController.updateTransaction)
  .delete(protect, txnController.deleteTransaction);

module.exports = router;
