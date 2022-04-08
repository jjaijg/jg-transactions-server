const asyncHandler = require("express-async-handler");
const moment = require("moment");
const mongoose = require("mongoose");
const Transaction = require("../models/transaction.model");
const Category = require("../models/category.model");

const LIMIT = process.env.DOC_LIMIT || 5;

const getTransactionAmount = asyncHandler(async (req, res, next) => {
  //PAGINATION -- set the options for pagination
  let aggregate_options = [];
  const options = {
    page: 1,
    limit: req.query.limit || LIMIT,
    // collation: { locale: "en" },
    customLabels: {
      totalDocs: "totalResults",
      docs: "transactions",
    },
  };

  aggregate_options.push({
    $match: {
      user: mongoose.Types.ObjectId(req.user._id),
    },
  });

  //LOOKUP/JOIN -- SECOND STAGE
  //FIRST JOIN  -- Category ===================================
  // Here we use $lookup(aggregation) to get the relationship from event to categories (one to many).
  aggregate_options.push({
    $lookup: {
      from: "categories",
      localField: "category",
      foreignField: "_id",
      as: "category",
    },
  });
  //deconstruct the $purchases array using $unwind(aggregation).
  aggregate_options.push({
    $unwind: { path: "$category", preserveNullAndEmptyArrays: true },
  });

  // Filter by date
  //FILTER BY DATE -- FOURTH STAGE
  if (req.query.start) {
    let start = moment(req.query.start).startOf("day");
    let end = req.query.end ? new Date(req.query.end) : new Date(); // add 1 day

    aggregate_options.push({
      $match: { date: { $gte: new Date(start), $lte: end } },
    });
  } else if (req.query.end) {
    aggregate_options.push({
      $match: { date: { $lte: new Date(req.query.end) } },
    });
  }

  //if category group by category
  let group = req.query.group;
  if (group && group.toLowerCase() === "category") {
    aggregate_options.push({
      $group: {
        _id: { category: "$category._id", category_name: "$category.name" },
        income: {
          $sum: {
            $cond: {
              if: { $eq: ["$type", "income"] },
              then: "$amount",
              else: 0,
            },
          },
        },
        expense: {
          $sum: {
            $cond: {
              if: { $eq: ["$type", "expense"] },
              then: "$amount",
              else: 0,
            },
          },
        },
        count: { $sum: 1 },
      },
    });
  } else if (group && group.toLowerCase() === "date") {
    aggregate_options.push({
      $group: {
        _id: {
          $dateToString: {
            format: "%d-%m-%Y",
            date: "$date",
            timezone: "Asia/Kolkata",
          },
        },
        income: {
          $sum: {
            $cond: {
              if: { $eq: ["$type", "income"] },
              then: "$amount",
              else: 0,
            },
          },
        },
        expense: {
          $sum: {
            $cond: {
              if: { $eq: ["$type", "expense"] },
              then: "$amount",
              else: 0,
            },
          },
        },
        count: { $sum: 1 },
      },
    });
  } else if (group && group.toLowerCase() === "month") {
    aggregate_options.push({
      $group: {
        _id: {
          $dateToString: {
            format: "%m-%Y",
            date: "$date",
            timezone: "Asia/Kolkata",
          },
        },
        income: {
          $sum: {
            $cond: {
              if: { $eq: ["$type", "income"] },
              then: "$amount",
              else: 0,
            },
          },
        },
        expense: {
          $sum: {
            $cond: {
              if: { $eq: ["$type", "expense"] },
              then: "$amount",
              else: 0,
            },
          },
        },
        count: { $sum: 1 },
      },
    });
  } else if (group && group.toLowerCase() === "year") {
    aggregate_options.push({
      $group: {
        _id: {
          $dateToString: {
            format: "%Y",
            date: "$date",
            timezone: "Asia/Kolkata",
          },
        },
        income: {
          $sum: {
            $cond: {
              if: { $eq: ["$type", "income"] },
              then: "$amount",
              else: 0,
            },
          },
        },
        expense: {
          $sum: {
            $cond: {
              if: { $eq: ["$type", "expense"] },
              then: "$amount",
              else: 0,
            },
          },
        },
        count: { $sum: 1 },
      },
    });
  } else {
    aggregate_options.push({
      $group: {
        _id: "$type",
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    });
  }

  //SORTING -- FIFTH STAGE
  let sort_order =
    req.query.sort_order && req.query.sort_order === "asc" ? 1 : -1;
  let sort_by = req.query.sort_by || "date";
  aggregate_options.push({
    $sort: {
      [sort_by]: sort_order,
      // _id: -1,
    },
  });

  // Set up the aggregation
  const myAggregate = Transaction.aggregate(aggregate_options);
  const result = await Transaction.aggregatePaginate(myAggregate, options);

  // const categories = await Category.find({ user: req.user._id });
  // result["categories"] = categories;
  // result["popular"] = await getPopularTransactions();
  result["grouped"] = group;
  // res.status(200).json(result);

  res.json({ message: "Got transactions amount", data: result });
});

const getPopularTransactions = asyncHandler(async (userId) => {
  let aggregate_options = [];

  //PAGINATION -- set the options for pagination
  const options = {
    page: 1,
    collation: { locale: "en" },
    customLabels: {
      totalDocs: "totalResults",
      docs: "transactions",
    },
  };

  aggregate_options.push({
    $match: {
      user: mongoose.Types.ObjectId(userId),
    },
  });

  //LOOKUP/JOIN -- SECOND STAGE
  //FIRST JOIN  -- Category ===================================
  // Here we use $lookup(aggregation) to get the relationship from event to categories (one to many).
  aggregate_options.push({
    $lookup: {
      from: "categories",
      localField: "category",
      foreignField: "_id",
      as: "category",
    },
  });
  //deconstruct the $purchases array using $unwind(aggregation).
  aggregate_options.push({
    $unwind: { path: "$category", preserveNullAndEmptyArrays: true },
  });

  //FILTER BY DATE -- FOURTH STAGE
  aggregate_options.push({
    $match: { date: { $lte: new Date() } },
  });

  //SORTING -- FIFTH STAGE - SORT BY DATE
  aggregate_options.push({
    $sort: { date: -1, _id: -1 },
  });

  //SELECT FIELDS
  aggregate_options.push({
    $project: {
      _id: 1,
      user: 1,
      amount: 1,
      type: 1,
      date: 1,
      description: 1,
      category: { $ifNull: ["$category._id", null] },
      category_name: { $ifNull: ["$category.name", null] },
      createdAt: 1,
    },
  });

  aggregate_options.push({
    $sample: { size: 5 },
  });

  // Set up the aggregation
  const myAggregate = Transaction.aggregate(aggregate_options);
  const result = await Transaction.aggregatePaginate(myAggregate, options);

  return result.transactions;
});

// @desc    Get transactions
// @route   GET /transactions/filter
// @access  Private
const getFilteredTransactions = asyncHandler(async (req, res, next) => {
  let aggregate_options = [];
  let group = req.query.group;
  let search = !!req.query.q;
  let match_regex = { $regex: req.query.q, $options: "i" }; //use $regex in mongodb - add the 'i' flag if you want the search to be case insensitive.

  //PAGINATION -- set the options for pagination
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || LIMIT,
    collation: { locale: "en" },
    customLabels: {
      totalDocs: "totalResults",
      docs: "transactions",
    },
  };

  //1
  //FILTERING AND PARTIAL TEXT SEARCH -- FIRST STAGE
  if (search) {
    console.log("searching : ", search);
    aggregate_options.push({ $match: { description: match_regex } });
  }

  //2
  //LOOKUP/JOIN -- SECOND STAGE
  //FIRST JOIN  -- Category ===================================
  // Here we use $lookup(aggregation) to get the relationship from event to categories (one to many).
  aggregate_options.push({
    $lookup: {
      from: "categories",
      localField: "category",
      foreignField: "_id",
      as: "categories",
    },
  });
  //deconstruct the $purchases array using $unwind(aggregation).
  aggregate_options.push({
    $unwind: { path: "$categories", preserveNullAndEmptyArrays: true },
  });

  //3a
  //FILTER BY USERID -- SECOND STAGE - use mongoose.Types.ObjectId() to recreate the moogoses object id
  aggregate_options.push({
    $match: {
      user: mongoose.Types.ObjectId(req.user._id),
    },
  });

  //3b
  //FILTER BY Category -- THIRD STAGE - use mongoose.Types.ObjectId() to recreate the moogoses object id
  if (req.query.category) {
    aggregate_options.push({
      $match: {
        category: mongoose.Types.ObjectId(req.query.category),
      },
    });
  }

  //3c
  //FILTER BY EventID -- THIRD STAGE - use mongoose.Types.ObjectId() to recreate the moogoses object id
  if (req.query.id) {
    aggregate_options.push({
      $match: {
        _id: mongoose.Types.ObjectId(req.query.id),
      },
    });
  }

  //3d
  //FILTER BY Type -- THIRD STAGE -
  if (req.query.type) {
    aggregate_options.push({
      $match: {
        type: req.query.type,
      },
    });
  }

  //4
  //FILTER BY DATE -- FOURTH STAGE
  if (req.query.start) {
    let start = moment(req.query.start).startOf("day");
    let end = req.query.end ? new Date(req.query.end) : new Date(); // add 1 day

    aggregate_options.push({
      $match: { date: { $gte: new Date(start), $lte: end } },
    });
  } else if (req.query.end) {
    aggregate_options.push({
      $match: { date: { $lte: new Date(req.query.end) } },
    });
  } else if (!search) {
    aggregate_options.push({
      $match: { date: { $lte: new Date() } },
    });
  }

  //4
  //FILTER BY AMOUNT -- FOURTH STAGE
  let samount = req.query.samount ? parseFloat(req.query.samount) : 0;
  let eamount = req.query.eamount ? parseFloat(req.query.eamount) : 0;

  if (samount && eamount) {
    aggregate_options.push({
      $match: { amount: { $gte: samount, $lte: eamount } },
    });
  } else if (samount) {
    aggregate_options.push({
      $match: { amount: { $gte: samount } },
    });
  } else if (eamount) {
    aggregate_options.push({
      $match: { amount: { $lte: eamount } },
    });
  }

  //6
  //SORTING -- FIFTH STAGE
  let sort_order =
    req.query.sort_order && req.query.sort_order === "asc" ? 1 : -1;
  let sort_by = req.query.sort_by || "date";
  aggregate_options.push({
    $sort: {
      [sort_by]: sort_order,
      _id: -1,
    },
  });

  //SELECT FIELDS
  aggregate_options.push({
    $project: {
      _id: 1,
      user: 1,
      amount: 1,
      type: 1,
      date: 1,
      description: 1,
      category: { $ifNull: ["$categories._id", null] },
      category_name: { $ifNull: ["$categories.name", null] },
      createdAt: 1,
    },
  });

  //6
  //GROUPING -- LAST STAGE
  if (group) {
    console.log("Grouped : ", group);
    aggregate_options.push({
      $group: {
        _id: {
          $dateToString: {
            format:
              group === "month"
                ? "%m-%Y"
                : group === "year"
                ? "%Y"
                : "%d-%m-%Y",
            date: "$date",
            timezone: "Asia/Kolkata",
          },
        },
        data: { $push: "$$ROOT" },
      },
    });
    aggregate_options.push({
      $sort: {
        "data.date":
          req.query.sort_order && req.query.sort_order === "asc" ? 1 : -1,
      },
    });
  }

  // Set up the aggregation
  const myAggregate = Transaction.aggregate(aggregate_options);
  const result = await Transaction.aggregatePaginate(myAggregate, options);

  const categories = await Category.find({ user: req.user._id });
  result["categories"] = categories;
  result["popular"] = await getPopularTransactions(req.user._id);
  result["grouped"] = group;
  // res.status(200).json(result);

  res.json({ message: "Got filtered transactions", data: result });
});

// @desc    Get transactions
// @route   GET /transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res, next) => {
  const transactions = await Transaction.find({ user: req.user._id });
  res.json({ message: "Got all transactions", data: transactions });
});

// @desc    create Transaction
// @route   POST /transactions
// @access  Private
const addTransaction = asyncHandler(async (req, res, next) => {
  // if (!req.body.amount || !req.body.category || !req.body.type) {
  //   res.status(400);
  //   throw new Error("Please fill required fields!");
  // }

  const transaction = await Transaction.create({
    ...req.body,
    user: req.user._id,
  });

  console.log(req.body.date);
  console.log(new Date(req.body.date).toLocaleDateString());

  res.status(201).json({
    message: `Added new Transaction`,
    data: transaction,
  });
});

// @desc    Update a Transaction
// @route   PUT /transactions/:id
// @access  Private
const updateTransaction = asyncHandler(async (req, res, next) => {
  const transactionId = req.params.id;
  const transaction = await Transaction.findById(transactionId);

  // if (!req.body.amount || !req.body.category || !req.body.type) {
  //   res.status(400);
  //   throw new Error("Please fill required fields!");
  // }

  if (!transaction) {
    res.status(400);
    throw new Error(`Transaction with id : ${transactionId} not found!`);
  }

  if (transaction.user.toString() !== req.user._id.toString()) {
    res.status(400);
    throw new Error(`Not authorized to access this transaction`);
  }

  const updatedTransaction = await Transaction.findByIdAndUpdate(
    transactionId,
    req.body,
    {
      new: true,
    }
  );
  res.json({
    message: "update transaction successfuly",
    data: updatedTransaction,
  });
});

// @desc    Delete a Transaction
// @route   DELETE /transactions/:id
// @access  Private
const deleteTransaction = asyncHandler(async (req, res, next) => {
  const transactionId = req.params.id;
  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    res.status(400);
    throw new Error(`Transaction with id : ${transactionId} not found!`);
  }
  if (transaction.user.toString() !== req.user._id.toString()) {
    res.status(400);
    throw new Error(`Not authorized to access this Transaction`);
  }

  await transaction.remove();
  res.json({
    message: "Deleted the transaction successfully!",
    data: transactionId,
  });
});

module.exports = {
  getTransactionAmount,
  getFilteredTransactions,
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
};
