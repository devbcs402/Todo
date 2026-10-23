const mongoose = require('mongoose');

const validateId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format: '${id}'. Must be a valid 24-character hexadecimal ObjectId.`,
    });
  }
  next();
};

module.exports = validateId;
