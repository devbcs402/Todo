const crypto = require('crypto');
const mongoose = require('mongoose');
const Todo = require('../models/Todo');

// Server-side store for pending destructive actions (e.g., deletions)
// Key: token (string) -> { taskId: string, taskTitle: string, expiresAt: number }
const pendingDeletions = new Map();

// Periodic cleanup of expired deletion tokens (runs every 60 seconds)
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of pendingDeletions.entries()) {
    if (data.expiresAt < now) {
      pendingDeletions.delete(token);
    }
  }
}, 60 * 1000).unref();

/**
 * Resolves a task reference from user input (ID, index, or title)
 * @param {string|number} reference - Task ID, #index (1-based), or title substring
 * @param {Array} currentTasks - List of current tasks for reference resolution
 * @returns {Object} { task: Object|null, ambiguous: boolean, candidates: Array }
 */
const resolveTask = (reference, currentTasks) => {
  if (!reference) {
    return { task: null, ambiguous: false, candidates: [] };
  }

  const strRef = String(reference).trim();

  // 1. Direct MongoDB ObjectId match
  if (mongoose.Types.ObjectId.isValid(strRef)) {
    const directMatch = currentTasks.find((t) => String(t._id) === strRef);
    if (directMatch) {
      return { task: directMatch, ambiguous: false, candidates: [] };
    }
  }

  // 2. Index match (e.g. "task 1", "#2", "1", "first task")
  const indexMatch = strRef.match(/^(?:task\s*#?|#)?(\d+)$/i);
  if (indexMatch) {
    const idx = parseInt(indexMatch[1], 10) - 1; // 1-based index
    if (idx >= 0 && idx < currentTasks.length) {
      return { task: currentTasks[idx], ambiguous: false, candidates: [] };
    }
  }

  // 3. Exact title match (case-insensitive)
  const lowerRef = strRef.toLowerCase();
  const exactMatches = currentTasks.filter(
    (t) => t.title && t.title.trim().toLowerCase() === lowerRef
  );
  if (exactMatches.length === 1) {
    return { task: exactMatches[0], ambiguous: false, candidates: [] };
  }
  if (exactMatches.length > 1) {
    return { task: null, ambiguous: true, candidates: exactMatches };
  }

  // 4. Substring title match
  const partialMatches = currentTasks.filter(
    (t) => t.title && t.title.toLowerCase().includes(lowerRef)
  );
  if (partialMatches.length === 1) {
    return { task: partialMatches[0], ambiguous: false, candidates: [] };
  }
  if (partialMatches.length > 1) {
    return { task: null, ambiguous: true, candidates: partialMatches };
  }

  return { task: null, ambiguous: false, candidates: [] };
};

/**
 * Lists tasks matching filter criteria
 */
const listTasks = async ({ status, search, sort = 'desc' } = {}, userId) => {
  const filter = { userId };
  const statusStr = String(status || '').toLowerCase().trim();
  if (['completed', 'done', 'finished', 'complete'].includes(statusStr)) {
    // MongoDB field: completed (boolean)
    filter.completed = true;
  } else if (['active', 'pending', 'todo', 'incomplete', 'undone', 'not_completed'].includes(statusStr)) {
    // MongoDB field: completed (boolean)
    filter.completed = false;
  }

  if (search && typeof search === 'string' && search.trim()) {
    const sanitizedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: sanitizedSearch, $options: 'i' } },
      { description: { $regex: sanitizedSearch, $options: 'i' } },
    ];
  }

  const sortOrder = sort === 'asc' ? 1 : -1;
  const tasks = await Todo.find(filter).sort({ createdAt: sortOrder });
  return tasks;
};

/**
 * Creates a new task with strict field validation
 */
const createTask = async ({ title, description }, userId) => {
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('Task title is required and cannot be empty.');
  }

  const trimmedTitle = title.trim().slice(0, 200);
  const trimmedDesc = typeof description === 'string' ? description.trim().slice(0, 1000) : '';

  const todo = new Todo({
    title: trimmedTitle,
    description: trimmedDesc,
    completed: false,
    userId,
  });

  return await todo.save();
};

/**
 * Updates an existing task's title or description
 */
const updateTask = async (taskId, updates, userId) => {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new Error(`Invalid task ID: ${taskId}`);
  }

  const safeUpdates = {};
  if (updates.title !== undefined) {
    if (typeof updates.title !== 'string' || updates.title.trim().length === 0) {
      throw new Error('Title must be a non-empty string.');
    }
    safeUpdates.title = updates.title.trim().slice(0, 200);
  }

  if (updates.description !== undefined) {
    safeUpdates.description = typeof updates.description === 'string' ? updates.description.trim().slice(0, 1000) : '';
  }

  if (updates.completed !== undefined) {
    safeUpdates.completed = Boolean(updates.completed);
  }

  const updated = await Todo.findOneAndUpdate(
    { _id: taskId, userId },
    { $set: safeUpdates },
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw new Error(`Task not found with ID: ${taskId}`);
  }

  return updated;
};

/**
 * Toggles or sets task completion status
 */
const completeTask = async (taskId, completed = true, userId) => {
  return await updateTask(taskId, { completed: Boolean(completed) }, userId);
};

/**
 * Requests task deletion - creates a pending confirmation token
 */
const requestDeleteTask = (task) => {
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute TTL

  pendingDeletions.set(token, {
    taskId: String(task._id),
    taskTitle: task.title,
    userId: String(task.userId),
    expiresAt,
  });

  return {
    confirmationRequired: true,
    confirmationToken: token,
    task: {
      id: String(task._id),
      title: task.title,
    },
    message: `Are you sure you want to delete "${task.title}"? This cannot be undone.`,
  };
};

/**
 * Confirms and executes task deletion using a valid confirmation token
 */
const confirmDeleteTask = async (token, userId) => {
  if (!token || typeof token !== 'string') {
    throw new Error('A valid confirmation token is required to delete a task.');
  }

  const pending = pendingDeletions.get(token);
  if (!pending) {
    throw new Error('Confirmation token is invalid, expired, or has already been used.');
  }

  if (pending.userId !== String(userId)) {
    throw new Error('Confirmation token is invalid, expired, or has already been used.');
  }

  if (Date.now() > pending.expiresAt) {
    pendingDeletions.delete(token);
    throw new Error('Confirmation token has expired. Please initiate deletion again.');
  }

  // Critical safety: Delete only by the verified specific ID
  const deleted = await Todo.findOneAndDelete({ _id: pending.taskId, userId });
  pendingDeletions.delete(token); // Ensure single-use

  if (!deleted) {
    throw new Error(`Task with ID '${pending.taskId}' was already deleted or not found.`);
  }

  return {
    success: true,
    deletedTask: {
      id: String(deleted._id),
      title: deleted.title,
    },
    message: `Task "${deleted.title}" has been permanently deleted.`,
  };
};

const cancelDeleteTask = (token, userId) => {
  const pending = pendingDeletions.get(token);
  if (!pending || pending.userId !== String(userId)) {
    throw new Error('Confirmation token is invalid, expired, or has already been used.');
  }
  pendingDeletions.delete(token);
};

module.exports = {
  resolveTask,
  listTasks,
  createTask,
  updateTask,
  completeTask,
  requestDeleteTask,
  confirmDeleteTask,
  cancelDeleteTask,
  pendingDeletions,
};
