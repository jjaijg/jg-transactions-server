const Budget = require("../../models/budget.model");
const BudgetCategory = require("../../models/budgetCategory.model");

const createBudgetCategory = async ({
  budget,
  category,
  user,
  planned = 0,
  actual = 0,
  transactions = [],
}) => {
  try {
    const budgCategory = await BudgetCategory.create({
      budget,
      category,
      user,
      planned,
      actual,
      transactions,
    });
    await Budget.findByIdAndUpdate(
      budget,
      {
        $push: { categories: budgCategory._id },
      },
      { new: true }
    );
    return budgCategory;
  } catch (error) {
    console.error(`Error while creating budget category : ${error}`);
    throw error;
  }
};

module.exports = {
  createBudgetCategory,
};
