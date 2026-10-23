const Todo = require('../models/Todo');
const taskTools = require('../services/taskTools');
const aiService = require('../services/aiService');

/**
 * @route   POST /api/ai/chat
 * @desc    Process natural language instruction and execute safe task CRUD operation
 * @access  Public
 */
const handleChat = async (req, res, next) => {
  try {
    const { message, conversationHistory = [], confirmationToken, confirm } = req.body;

    // Handle explicit deletion confirmation flow
    if (confirmationToken) {
      if (confirm === false) {
        taskTools.cancelDeleteTask(confirmationToken, req.user._id);
        return res.status(200).json({
          success: true,
          message: 'Task deletion was cancelled. No changes were made.',
          action: 'cancelDelete',
        });
      }

      const deleteResult = await taskTools.confirmDeleteTask(confirmationToken, req.user._id);
      return res.status(200).json({
        success: true,
        message: deleteResult.message,
        action: 'deleteTask',
        task: deleteResult.deletedTask,
      });
    }

    // Validate input message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A non-empty message string is required.',
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 1000 characters.',
      });
    }

    // Fetch current tasks from MongoDB for fresh context
    const currentTasks = await Todo.find({ userId: req.user._id }).sort({ createdAt: -1 });

    // Call OpenRouter AI
    const aiPlan = await aiService.callAiAssistant({
      message: message.trim(),
      conversationHistory,
      currentTasks,
    });

    let action = aiPlan.action || 'reply';
    const params = aiPlan.parameters || {};

    // Robust natural language list intent detection
    const normalizedMsg = message.trim().toLowerCase();
    const isCompletedQuery = /(?:show|list|get|display|view|find).*(?:done|completed|finished)\s+tasks?|(?:show|list).*(?:tasks?).*(?:done|completed)|all\s+(?:done|completed)\s+tasks?|completed\s+tasks?/i.test(normalizedMsg);
    const isPendingQuery = /(?:show|list|get|display|view|find).*(?:pending|active|todo|incomplete|undone)\s+tasks?|(?:show|list).*(?:tasks?).*(?:pending|active)|all\s+(?:pending|active)\s+tasks?|pending\s+tasks?/i.test(normalizedMsg);
    const isAllTasksQuery = /(?:show|list|get|display|view)\s+(?:me\s+)?all\s+(?:my\s+)?tasks?|^(?:show|list|display)\s+(?:all\s+)?(?:my\s+)?tasks?$/i.test(normalizedMsg);

    if (action === 'reply' || action === 'listTasks') {
      if (isCompletedQuery) {
        action = 'listTasks';
        params.status = 'completed';
      } else if (isPendingQuery) {
        action = 'listTasks';
        params.status = 'pending';
      } else if (isAllTasksQuery) {
        action = 'listTasks';
        params.status = 'all';
      }
    }

    // 1. Create Task
    if (action === 'createTask') {
      const taskTitle = params.title || message.trim();
      const savedTask = await taskTools.createTask({
        title: taskTitle,
        description: params.description || '',
      }, req.user._id);

      return res.status(200).json({
        success: true,
        message: aiPlan.message || `Created new task: "${savedTask.title}"`,
        action: 'createTask',
        task: savedTask,
      });
    }

    // 2. Complete / Reopen Task
    if (action === 'completeTask') {
      const { task, ambiguous, candidates } = taskTools.resolveTask(params.target, currentTasks);

      if (ambiguous) {
        return res.status(200).json({
          success: true,
          action: 'clarify',
          message: `Multiple tasks matched "${params.target}". Which one did you mean?`,
          candidateTasks: candidates.map((t) => ({ id: t._id, title: t.title, completed: t.completed })),
        });
      }

      if (!task) {
        return res.status(200).json({
          success: false,
          action: 'error',
          message: `Could not find any task matching "${params.target || 'specified target'}". Please verify the task title or number.`,
        });
      }

      const shouldComplete = params.completed !== false;
      const updatedTask = await taskTools.completeTask(task._id, shouldComplete, req.user._id);

      return res.status(200).json({
        success: true,
        message: aiPlan.message || `Marked "${updatedTask.title}" as ${shouldComplete ? 'completed' : 'pending'}.`,
        action: 'completeTask',
        task: updatedTask,
      });
    }

    // 3. Update Task
    if (action === 'updateTask') {
      const { task, ambiguous, candidates } = taskTools.resolveTask(params.target, currentTasks);

      if (ambiguous) {
        return res.status(200).json({
          success: true,
          action: 'clarify',
          message: `Multiple tasks matched "${params.target}". Which one would you like to update?`,
          candidateTasks: candidates.map((t) => ({ id: t._id, title: t.title })),
        });
      }

      if (!task) {
        return res.status(200).json({
          success: false,
          action: 'error',
          message: `Could not find any task matching "${params.target || 'specified target'}".`,
        });
      }

      const updates = {};
      if (params.title) updates.title = params.title;
      if (params.description !== undefined) updates.description = params.description;

      const updatedTask = await taskTools.updateTask(task._id, updates, req.user._id);

      return res.status(200).json({
        success: true,
        message: aiPlan.message || `Updated task "${updatedTask.title}".`,
        action: 'updateTask',
        task: updatedTask,
      });
    }

    // 4. Delete Task (Destructive Action Safety Enforcement)
    if (action === 'deleteTask') {
      const { task, ambiguous, candidates } = taskTools.resolveTask(params.target, currentTasks);

      if (ambiguous) {
        return res.status(200).json({
          success: true,
          action: 'clarify',
          message: `Multiple tasks matched "${params.target}". Which one would you like to delete?`,
          candidateTasks: candidates.map((t) => ({ id: t._id, title: t.title })),
        });
      }

      if (!task) {
        return res.status(200).json({
          success: false,
          action: 'error',
          message: `Could not find any task matching "${params.target || 'specified target'}".`,
        });
      }

      // Safe confirmation generation - never delete immediately without user confirmation
      const confirmationData = taskTools.requestDeleteTask(task);

      return res.status(200).json({
        success: true,
        action: 'requestDelete',
        confirmationRequired: true,
        confirmationToken: confirmationData.confirmationToken,
        task: confirmationData.task,
        message: `⚠️ Are you sure you want to delete "${task.title}"? This cannot be undone.`,
      });
    }

    // 5. List Tasks
    if (action === 'listTasks') {
      const matchingTasks = await taskTools.listTasks(params, req.user._id);
      let responseMessage = '';

      if (matchingTasks.length === 0) {
        if (params.status === 'completed' || params.status === 'done') {
          responseMessage = "You don't have any completed tasks yet.";
        } else if (params.status === 'pending' || params.status === 'active') {
          responseMessage = "You don't have any pending tasks.";
        } else {
          responseMessage = "You don't have any tasks yet. Create your first task!";
        }
      } else {
        const countStr = matchingTasks.length === 1 ? '1 task' : `${matchingTasks.length} tasks`;
        if (params.status === 'completed' || params.status === 'done') {
          responseMessage = `Here are your completed tasks (${countStr}):`;
        } else if (params.status === 'pending' || params.status === 'active') {
          responseMessage = `Here are your pending tasks (${countStr}):`;
        } else {
          responseMessage = `Here are all your tasks (${countStr}):`;
        }
      }

      return res.status(200).json({
        success: true,
        message: responseMessage,
        action: 'listTasks',
        filterStatus: params.status || 'all',
        count: matchingTasks.length,
        tasks: matchingTasks,
      });
    }

    // 6. Conversational Reply / Advice
    return res.status(200).json({
      success: true,
      message: aiPlan.message || 'How can I assist you with your tasks today?',
      action: 'reply',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleChat,
};
