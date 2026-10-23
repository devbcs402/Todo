const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');
const validateId = require('../middleware/validateId');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

// Collection routes
router.route('/')
  .post(todoController.createTodo)
  .get(todoController.getTodos);

// Document-specific routes
router.route('/:id')
  .get(validateId, todoController.getTodoById)
  .put(validateId, todoController.updateTodo)
  .patch(validateId, todoController.updateTodo)
  .delete(validateId, todoController.deleteTodo);

module.exports = router;
