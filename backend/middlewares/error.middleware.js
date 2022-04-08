//handle email or usename duplicates
const handleDuplicateKeyError = (err, res) => {
  const dupVal = Object.values(err.keyValue);
  const field = Object.keys(err.keyValue);
  const code = 409;
  const error = `${dupVal} already exists.`;
  res.status(code).send({
    messages: error,
    fields: field,
    stack: process.env.NODE_ENV === "prodcution" ? null : err.stack,
  });
};
//handle field formatting, empty fields, and mismatched passwords
const handleValidationError = (err, res) => {
  let errors = Object.values(err.errors).map((el) => el.message);
  let fields = Object.values(err.errors).map((el) => el.path);
  let code = 400;
  if (errors.length > 1) {
    // const formattedErrors = errors.join(",");
    res.status(code).json({
      messages: errors,
      fields: fields,
      stack: process.env.NODE_ENV === "prodcution" ? null : err.stack,
    });
  } else {
    res.status(code).json({
      messages: errors,
      fields: fields,
      stack: process.env.NODE_ENV === "prodcution" ? null : err.stack,
    });
  }
};
//error controller function
const errorHandler = (err, req, res, next) => {
  console.log("got the error!");
  try {
    if (err.name === "ValidationError") {
      console.log("validation error!");
      return (err = handleValidationError(err, res));
    }
    if (err.code && err.code == 11000) {
      console.log("duplicate error!");

      return (err = handleDuplicateKeyError(err, res));
    } else {
      const statusCode = res.statusCode || 500;
      res.status(statusCode);
      res.json({
        messages: [err.message],
        stack: process.env.NODE_ENV === "prodcution" ? null : err.stack,
      });
    }
  } catch (err) {
    console.log("am I catched");
    res.status(500).json({
      messages: ["An unknown error occurred."],
      stack: process.env.NODE_ENV === "prodcution" ? null : err.stack,
    });
  }
};

// const errorHandler = (err, req, res, next) => {
//   console.log("Got the error");
//   const statusCode = res.statusCode || 500;

//   res.status(statusCode);
//   res.json({
//     message: err.message,
//     stack: process.env.NODE_ENV === "prodcution" ? null : err.stack,
//   });
// };

module.exports = { errorHandler };
