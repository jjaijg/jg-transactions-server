const express = require("express");
const colors = require("colors");
const dotenv = require("dotenv").config();
const cors = require("cors");

const connectDB = require("./config/db");
const { errorHandler } = require("./middlewares/error.middleware");

const PORT = process.env.PORT || 3100;

const app = express();
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.get("api/v1", (req, res) => {
  return res.json({message: "Budget tracker api!"})
})

app.use("/api/v1/users", require("./routes/user.routes"));
app.use("/api/v1/budgets", require("./routes/budget.routes"));
app.use("/api/v1/categories", require("./routes/category.routes"));
app.use("/api/v1/budget-categories", require("./routes/budgetCategory.routes"));
app.use("/api/v1/transactions", require("./routes/transaction.routes"));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port : ${PORT}`.underline);
});
