const errorHandler = (err, req, res, next) => {
  // Log server-side for diagnostics
  console.error(`[Error] ${err.name || 'Error'}: ${err.message}`);

  // Bad JSON in body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload provided in request body.',
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
    });
  }

  // Mongoose bad ObjectId cast error
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Resource not found with invalid field format: ${err.path}`,
    });
  }

  // Generic internal server error
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? 'Internal server error occurred' : (err.message || 'Request failed'),
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};

module.exports = errorHandler;
