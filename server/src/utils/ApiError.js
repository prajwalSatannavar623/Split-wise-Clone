class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong", //default message
    errors = [],
    stack = "",
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null; //
    this.message = message;
    this.success = false; //
    this.errors = errors;

    if (stack.length > 0) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.contructor);
    }
  }
}

export { ApiError };
