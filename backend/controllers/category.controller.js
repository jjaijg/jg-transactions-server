const asyncHandler = require("express-async-handler");

const Category = require("../models/category.model");
const Transaction = require("../models/transaction.model");

// @desc    Get Categories
// @route   GET /categories
// @access  Private
const getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find({ user: req.user._id });
  res.json({ message: "Got all Categories", data: categories });
});

// @desc    create Category
// @route   POST /categories
// @access  Private
const addCategory = asyncHandler(async (req, res, next) => {
  if (!req.body.name) {
    res.status(400);
    throw new Error("Catergory name is required");
  }
  const isCategory = await Category.findOne({
    name: req.body.name,
    user: req.user._id,
  });
  if (isCategory) {
    res.status(400);
    throw new Error("Category already exists!");
  }
  const category = await Category.create({
    name: req.body.name,
    user: req.user._id,
  });

  res.status(201).json({
    message: `Added new category : ${category.name}`,
    data: category,
  });
});

// @desc    Update a Category
// @route   PUT /categories/:id
// @access  Private
const updateCategory = asyncHandler(async (req, res, next) => {
  const categoryId = req.params.id;
  const { name } = req.body;
  if (!name) {
    res.status(400);
    throw new Error(`Category name should be provided`);
  }
  const category = await Category.findById(categoryId);

  if (!category) {
    res.status(400);
    throw new Error(`Category with id : ${categoryId} not found!`);
  }
  if (category.user.toString() !== req.user._id.toString()) {
    res.status(400);
    throw new Error(`Not authorized to access this category`);
  }

  if (category.name === req.body.name) {
    res.status(400);
    throw new Error("Category already exists!");
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    categoryId,
    req.body,
    {
      new: true,
    }
  );
  res.json({
    message: "update category successfuly",
    data: updatedCategory,
  });
});

// @desc    Delete a Category
// @route   DELETE /categories/:id
// @access  Private
const deleteCategory = asyncHandler(async (req, res, next) => {
  const categoryId = req.params.id;
  const category = await Category.findById(categoryId);

  if (!category) {
    res.status(400);
    throw new Error(`Category with id : ${categoryId} not found!`);
  }
  if (category.user.toString() !== req.user._id.toString()) {
    res.status(400);
    throw new Error(`Not authorized to access this category`);
  }

  const deletedTxnsData = await Transaction.deleteMany({
    category: categoryId,
  });
  await category.remove();

  res.json({
    message: "Deleted the Category successfully!",
    data: {
      category: categoryId,
      transactionDelCount: deletedTxnsData.deletedCount,
    },
  });
});

module.exports = {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
};
