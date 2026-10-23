import React from 'react';

const TodoItem = ({
  todo,
  onToggleComplete,
  onEdit,
  onDeleteRequest,
  isToggling,
  isDeleting,
}) => {
  const { _id, title, description, completed, createdAt, updatedAt } = todo;

  // Format timestamps nicely
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const isActionDisabled = isToggling || isDeleting;

  return (
    <article
      className={`todo-item ${completed ? 'is-completed' : ''}`}
      id={`todo-card-${_id}`}
    >
      <div
        className="checkbox-container"
        onClick={() => !isActionDisabled && onToggleComplete(todo)}
        role="checkbox"
        aria-checked={completed}
        aria-label={`Mark "${title}" as ${completed ? 'pending' : 'completed'}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !isActionDisabled) {
            e.preventDefault();
            onToggleComplete(todo);
          }
        }}
      >
        <div className="checkbox-custom" id={`todo-checkbox-${_id}`}>
          {isToggling ? (
            <span className="spinner" style={{ width: '12px', height: '12px' }} />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>

      <div className="todo-content">
        <h3 className="todo-title" id={`todo-title-${_id}`}>{title}</h3>
        {description && (
          <p className="todo-description" id={`todo-desc-${_id}`}>
            {description}
          </p>
        )}
        <div className="todo-meta">
          <span className="todo-meta-tag" title="Created date">
            🕒 Created: {formatDate(createdAt)}
          </span>
          {updatedAt && updatedAt !== createdAt && (
            <span className="todo-meta-tag" title="Last updated">
              ✏️ Edited: {formatDate(updatedAt)}
            </span>
          )}
        </div>
      </div>

      <div className="todo-actions">
        <button
          type="button"
          className="btn btn-icon-only edit-btn"
          onClick={() => onEdit(todo)}
          disabled={isActionDisabled}
          title="Edit todo"
          aria-label={`Edit ${title}`}
          id={`todo-edit-btn-${_id}`}
        >
          ✏️
        </button>
        <button
          type="button"
          className="btn btn-icon-only delete-btn"
          onClick={() => onDeleteRequest(todo)}
          disabled={isActionDisabled}
          title="Delete todo"
          aria-label={`Delete ${title}`}
          id={`todo-delete-btn-${_id}`}
        >
          🗑️
        </button>
      </div>
    </article>
  );
};

export default TodoItem;
