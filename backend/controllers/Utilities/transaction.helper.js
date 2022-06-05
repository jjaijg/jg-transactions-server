const Transaction = require("../../models/transaction.model");
const Budget = require("../../models/budget.model");
const BudgetCategory = require("../../models/budgetCategory.model");
// const { createBudgetCategory } = require("./budgetCaterogy.helper");
const moment = require("moment");

const updateTxn = async ({
  id,
  amount,
  type,
  description,
  user,
  category,
  budgets,
  date,
}) => {
  try {
    const updatedTxn = await Transaction.findOneAndUpdate(
      { _id: id, user },
      {
        amount,
        type,
        description,
        category,
        budgets,
        date: moment(new Date(date)).format("YYYY-MM-DD"),
      },
      {
        new: true,
      }
    );
    console.log("updated txn : ", updatedTxn);
    return updatedTxn;
  } catch (error) {
    console.error(`Error while updating transaction : ${error}`);
  }
};

const addTxnToBudgets = async (txn) => {
  console.log("Obtained txn : ", txn);
  const { id, user, budgets, category, amount } = txn;
  let updCount = 0;
  let addCount = 0;
  try {
    // using loop
    budgets.forEach(async (budget) => {
      // check budgetCat exists
      const upsertResult = await BudgetCategory.updateOne(
        { user, budget, category },
        {
          budget,
          category,
          user,
          $inc: { actual: amount },
          $addToSet: { transactions: id },
        },
        { upsert: true, new: true }
      );
      console.log(upsertResult.upsertedId, id);
      if (upsertResult.upsertedId) {
        await Budget.findByIdAndUpdate(
          budget,
          {
            $push: { categories: upsertResult.upsertedId },
          },
          { new: true }
        );
        addCount++;
      } else updCount++;
      
    });
    return { updCount, addCount };
  } catch (error) {
    console.error(`Error while adding transaction to budget : ${error}`);
    throw error;
  }
};

const removeTxnFromBudgets = async ({
  id,
  amount,
  user,
  category,
  budgets,
}) => {
  try {
    return await BudgetCategory.updateMany(
      {
        user,
        category,
        budget: budgets,
      },
      {
        $pull: { transactions: id },
        $inc: { actual: -amount },
      }
    );
  } catch (error) {
    console.error(`Error while unlinking transaction from budget : ${error}`);
    throw error;
  }
};

module.exports = {
  updateTxn,
  addTxnToBudgets,
  removeTxnFromBudgets,
};
