const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Todo title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      validate: {
        validator: function (v) {
          return typeof v === 'string' && v.trim().length > 0;
        },
        message: 'Title cannot be blank or contain only whitespace',
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    // Explicitly configure a dedicated collection name to prevent conflicts
    collection: 'todos',
    versionKey: false,
  }
);

// Indexes for common query patterns: sorting by creation date and filtering by status
todoSchema.index({ completed: 1, createdAt: -1 });

const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;
