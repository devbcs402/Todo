const Todo = require('../models/Todo');

/**
 * @route   POST /api/todos
 * @desc    Create a new TODO
 * @access  Authenticated
 */
const createTodo = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    // Validate required title
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title is required and must not be empty.',
      });
    }

    if (title.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Title cannot exceed 200 characters.',
      });
    }

    if (description && typeof description === 'string' && description.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Description cannot exceed 1000 characters.',
      });
    }

    // Explicitly create only allowlisted fields
    const todo = new Todo({
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      completed: false,
      userId: req.user._id,
    });

    const savedTodo = await todo.save();

    return res.status(201).json({
      success: true,
      message: 'Todo created successfully',
      data: savedTodo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/todos
 * @desc    Get all TODOs with optional filtering, search, and sorting
 * @access  Authenticated
 */
const getTodos = async (req, res, next) => {
  try {
    const { status, search, sort = 'desc' } = req.query;
    const filter = { userId: req.user._id };

    // Filter by completed status: 'completed', 'active' / 'pending'
    if (status === 'completed') {
      filter.completed = true;
    } else if (status === 'active' || status === 'pending') {
      filter.completed = false;
    }

    // Optional search across title and description
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const sanitizedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: sanitizedSearch, $options: 'i' } },
        { description: { $regex: sanitizedSearch, $options: 'i' } },
      ];
    }

    const sortOrder = sort === 'asc' ? 1 : -1;
    const todos = await Todo.find(filter).sort({ createdAt: sortOrder });
    const totalCount = await Todo.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: todos.length,
      total: totalCount,
      data: todos,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/todos/:id
 * @desc    Get single TODO by ID
 * @access  Public
 */
const getTodoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const todo = await Todo.findOne({ _id: id, userId: req.user._id });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: `Todo with ID '${id}' not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/todos/:id and PATCH /api/todos/:id
 * @desc    Update a TODO by ID (Allowlisted fields only: title, description, completed)
 * @access  Public
 */
const updateTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;

    const updates = {};

    // Validate and allowlist updates
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Title must be a non-empty string.',
        });
      }
      if (title.trim().length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot exceed 200 characters.',
        });
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Description must be a string.',
        });
      }
      if (description.trim().length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Description cannot exceed 1000 characters.',
        });
      }
      updates.description = description.trim();
    }

    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Completed status must be a boolean (true or false).',
        });
      }
      updates.completed = completed;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid update fields provided. You may update title, description, or completed.',
      });
    }

    // Perform atomic update on single record
    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedTodo) {
      return res.status(404).json({
        success: false,
        message: `Todo with ID '${id}' not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Todo updated successfully',
      data: updatedTodo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/todos/:id
 * @desc    Delete only a single specific TODO record
 * @access  Public
 */
const deleteTodo = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Critical database safety: Delete only by specific ID
    const deletedTodo = await Todo.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!deletedTodo) {
      return res.status(404).json({
        success: false,
        message: `Todo with ID '${id}' not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Todo '${deletedTodo.title}' deleted successfully.`,
      data: { id: deletedTodo._id, title: deletedTodo.title },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTodo,
  getTodos,
  getTodoById,
  updateTodo,
  deleteTodo,
};
