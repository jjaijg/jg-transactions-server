const asyncHandler = require("express-async-handler");
const Budget = require("../models/budget.model");
const BudgetCategory = require("../models/budgetCategory.model");
const Transaction = require("../models/transaction.model");
const { createBudgetCategory } = require("./Utilities/budgetCaterogy.helper");

// @desc    create Budget category
// @route   POST /budget-categories
// @access  Private
const addBudgetCategory = asyncHandler(async (req, res, next) => {
  try {
    const { category, budget } = req.body;
    isCatExist = await BudgetCategory.findOne({
      budget,
      category,
      user: req.user._id,
    });

    if (isCatExist) {
      res.status(400);
      throw new Error(
        "Budget category already exists, please choose different category!"
      );
    }
    const budgetCat = await createBudgetCategory({
      ...req.body,
      user: req.user._id,
    });
    res.status(201).json({
      message: `Added new Budget Category`,
      data: budgetCat,
    });
  } catch (error) {
    console.log(error);
    res.status(400);
    throw error;
  }
});

// @desc    get all Budget categories related to user
// @route   GET /budget-categories
// @access  Private
const getAllBudgetCategories = asyncHandler(async (req, res, next) => {
  const budgetCategories = await BudgetCategory.find({
    user: req.user._id,
  });

  res.status(201).json({
    message: `Fetched Budget Categories`,
    data: budgetCategories,
  });
});

// @desc    get all Budget categories related to user
// @route   GET /budget-categories
// @access  Private
const getBudgetCategoriesByBudget = asyncHandler(async (req, res, next) => {
  const { budget } = req.params;
  const budgetCategories = await BudgetCategory.find({
    user: req.user._id,
    budget,
  });

  res.status(201).json({
    message: `Fetched Budget Categories`,
    data: budgetCategories,
  });
});

// @desc    update actual amount when a transaction added/removed to Budget
// @route   PUT /budget-categories/update/:id/:type(actual/planned)
// @access  Private
const updateAmount = asyncHandler(async (req, res, next) => {
  const { amount } = req.body;
  const { id, type = "planned" } = req.params;
  let updOp = {};
  if (type === "actual") {
    Object.assign(updOp, {
      $inc: { actual: amount },
    });
  } else if (type === "planned") {
    Object.assign(updOp, {
      planned: amount,
    });
  } else {
    return next();
  }

  const updBudCat = await BudgetCategory.findByIdAndUpdate(id, updOp, {
    new: true,
  });

  if (!updBudCat)
    throw new Error("Error while updating budget category amount!");

  return res.status(200).json({
    data: updBudCat,
    message: `${type} amount updated`,
  });
});

// @desc    delete budget category and remove it's link with budget
// @route   DELETE /budget-categories/:id
// @access  Private
const delBudCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const delBudCat = await BudgetCategory.findOneAndDelete({
    _id: id,
    user: req.user._id,
  });
  if (!delBudCat) {
    res.status(400);
    throw new Error("unable delete selected category, please try again!");
  }
  console.log("deleted bud cat : ", delBudCat);
  await Budget.findByIdAndUpdate(delBudCat.budget, {
    $pull: {
      categories: id,
    },
  });
  await Transaction.updateMany(
    {
      _id: delBudCat.transactions,
      user: req.user._id,
    },
    {
      $pull: {
        budgets: delBudCat.budget,
      },
    }
  );

  return res.status(200).json({
    data: id,
    message: "Budget category deleted successfully!",
  });
});

module.exports = {
  getAllBudgetCategories,
  getBudgetCategoriesByBudget,
  addBudgetCategory,
  updateAmount,
  delBudCategory,
};
