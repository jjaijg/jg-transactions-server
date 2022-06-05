const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Budget = require("../models/budget.model");
const Category = require("../models/category.model");
const BudgetCategory = require("../models/budgetCategory.model");
const Transaction = require("../models/transaction.model");
const { generateNextSequence } = require("./Utilities/counter.helper");
const { createBudgetCategory } = require("./Utilities/budgetCaterogy.helper");

const LIMIT = 20;
const generateRgx = (key, value) => {
  const rgx = new RegExp(value, "gmi");
  return { [key]: { $regex: rgx } };
};
const pushFilteroptions = (query) => {
  const { name, description, budgetId } = query;
  const filterArray = [];
  if (budgetId) {
    filterArray.push({
      $match: generateRgx("budgetId", budgetId),
    });
  }

  if (name) {
    filterArray.push({
      $match: generateRgx("name", name),
    });
  }

  if (description) {
    filterArray.push({
      $match: generateRgx("description", description),
    });
  }
  return filterArray;
};

// @desc    Get budgets
// @route   GET /budgets/filter
// @access  Private
const getFilteredBudgets = asyncHandler(async (req, res, next) => {
  let aggregate_options = [];
  let group = req.query.group;

  // SET DEFAULT PAGINATION OPTIONS
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || LIMIT,
    collation: { locale: "en" },
    customLabels: {
      totalDocs: "totalResults",
      docs: "budgets",
    },
  };

  //FILTER BY USERID -- SECOND STAGE - use mongoose.Types.ObjectId() to recreate the moogoses object id
  aggregate_options.push({
    $match: {
      user: mongoose.Types.ObjectId(req.user._id),
    },
  });

  // FILTERING STARTS
  console.log("query : ", req.query);
  const filterArray = pushFilteroptions(req.query);
  console.log("filter options : ", filterArray);
  aggregate_options.push(...filterArray);

  // FILTERING ENDS

  // LOOKUP/JOIN - STARTS
  // Join BudgetCategories
  aggregate_options.push({
    $unwind: { path: "$categories", preserveNullAndEmptyArrays: true },
  });
  aggregate_options.push({
    $lookup: {
      from: BudgetCategory.collection.name,
      let: { cat_id: "$categories" },
      pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$cat_id"] } } }],
      as: "budgetCat",
    },
  });

  // Join Categories
  aggregate_options.push({
    $unwind: { path: "$budgetCat", preserveNullAndEmptyArrays: true },
  });
  aggregate_options.push({
    $lookup: {
      from: Category.collection.name,
      let: { cat_id: "$budgetCat.category" },
      pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$cat_id"] } } }],
      as: "budgetCat.category",
    },
  });
  aggregate_options.push({
    $unwind: { path: "$budgetCat.category", preserveNullAndEmptyArrays: true },
  });

  // LOOKUP/JOIN - ENDS

  // GROUPING STARTS
  // SELECT FIELDS STARTS
  aggregate_options.push({
    $group: {
      _id: "$_id",
      planned: { $sum: "$budgetCat.planned" },
      actual: { $sum: "$budgetCat.actual" },
      budgetCategories: {
        $push: {
          _id: "$budgetCat._id",
          category: "$budgetCat.category._id",
          category_name: "$budgetCat.category.name",
          planned: "$budgetCat.planned",
          actual: "$budgetCat.actual",
          transactions: "$budgetCat.transactions",
          createdAt: "$budgetCat.createdAt",
          updatedAt: "$budgetCat.updatedAt",
        },
      },
      user: { $first: "$user" },
      name: { $first: "$name" },
      budgetId: { $first: "$budgetId" },
      description: { $first: "$description" },
      // planned: { first: "$budgetCat.planned" },
      createdAt: { $first: "$createdAt" },
      updatedAt: { $first: "$updatedAt" },
    },
  });
  // SELECT FIELDS ENDS
  // GROUPING ENDS

  // SORTING STARTS
  aggregate_options.push({
    $sort: {
      budgetId: 1,
      _id: -1,
    },
  });
  // SORTING ENDS

  // AGGREGATE SETUP STARTS
  const budgetAggregate = Budget.aggregate(aggregate_options);
  const result = await Budget.aggregatePaginate(budgetAggregate, options);
  result["grouped"] = group;
  // AGGREGATE SETUP ENDS

  res.json({
    message: "Got filtered budgets",
    data: {
      ...result,
      budgets: result.budgets.map((budget) => {
        const budgetCategories = budget.budgetCategories.filter(
          (budCat) => Object.keys(budCat).length > 0
        );
        return {
          ...budget,
          budgetCategories,
        };
      }),
    },
  });
});

// @desc    create Budget
// @route   POST /budgets
// @access  Private
const addBudget = asyncHandler(async (req, res, next) => {
  const { categories = [], ...newBudget } = req.body;
  const budget_seq_no = await generateNextSequence("budgetId");
  const budget_seq_id = `B${String(budget_seq_no).padStart(6, "0")}`;
  const user = req.user._id;

  const budget = await Budget.create({
    ...newBudget,
    user,
    budgetId: budget_seq_id,
  });

  if (categories && categories.length) {
    categories.forEach(async (cat) => {
      await createBudgetCategory({
        budget: budget._id,
        user,
        ...cat,
      });
    });
  }
  res.status(201).json({
    message: `Added new Budget`,
    data: budget,
  });
});

// @desc    update Budget (name, description)
// @route   PUT /budgets/:id
// @access  Private
const updateBudget = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const updBudget = await Budget.findByIdAndUpdate(
    id,
    {
      name,
      description,
    },
    { new: true }
  );

  res.status(200).json({
    message: `updated Budget`,
    data: updBudget,
  });
});

// @desc    delete Budget
// @route   DELETE /budgets/:id
// @access  Private
const delBudget = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const delBudget = await Budget.findOneAndDelete({
    _id: id,
    user: req.user._id,
  });

  if (delBudget && delBudget.categories.length > 0) {
    const transDelResult = await Transaction.updateMany(
      {
        // _id: transUniqArray,
        user: req.user._id,
        budgets: { $in: [id] },
      },
      {
        $pull: {
          budgets: id,
        },
      }
    );
    console.log("del trans result : ", transDelResult);
    // }
    const bCatDelResult = await BudgetCategory.deleteMany({
      user: req.user._id,
      _id: delBudget.categories,
    });
    console.log("del cat result : ", bCatDelResult);
  }

  res.status(200).json({
    data: id,
    message: `deleted Budget`,
  });
});

module.exports = {
  getFilteredBudgets,
  addBudget,
  updateBudget,
  delBudget,
};
