import React, { useState, useEffect, useRef } from 'react';

const TodoForm = ({ onSubmit, onCancel, editingTodo, isSubmitting }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const titleInputRef = useRef(null);

  const isEditMode = Boolean(editingTodo);

  // Sync state when entering or exiting edit mode
  useEffect(() => {
    if (editingTodo) {
      setTitle(editingTodo.title || '');
      setDescription(editingTodo.description || '');
      setError('');
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
    } else {
      setTitle('');
      setDescription('');
      setError('');
    }
  }, [editingTodo]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please provide a todo title.');
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
      return;
    }

    if (trimmedTitle.length > 200) {
      setError('Title cannot exceed 200 characters.');
      return;
    }

    if (description.length > 1000) {
      setError('Description cannot exceed 1000 characters.');
      return;
    }

    setError('');
    onSubmit({
      title: trimmedTitle,
      description: description.trim(),
    });

    if (!isEditMode) {
      setTitle('');
      setDescription('');
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="glass-panel form-card" id="todo-form-panel">
      <div className="form-header">
        <h2 className="form-title">
          <span>{isEditMode ? '✏️ Edit Task' : '✨ Add New Task'}</span>
          <span className="badge-mode">{isEditMode ? 'Editing' : 'Create'}</span>
        </h2>
        {isEditMode && (
          <button
            type="button"
            className="btn btn-secondary btn-icon-only"
            onClick={onCancel}
            title="Cancel editing"
            disabled={isSubmitting}
            aria-label="Cancel editing"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="todo-form" noValidate onKeyDown={handleKeyDown}>
        <div className="form-group">
          <label htmlFor="todo-title-input" className="form-label">
            <span>Title <strong style={{ color: 'var(--accent-rose)' }}>*</strong></span>
            <span className="char-count">{title.length}/200</span>
          </label>
          <input
            id="todo-title-input"
            ref={titleInputRef}
            type="text"
            className={`form-input ${error ? 'input-error' : ''}`}
            placeholder="What needs to be accomplished?"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError('');
            }}
            maxLength={200}
            disabled={isSubmitting}
            required
            autoComplete="off"
          />
          {error && <span className="field-error-msg" id="todo-title-error" role="alert">{error}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="todo-description-input" className="form-label">
            <span>Description <small style={{ color: 'var(--text-dim)' }}>(Optional)</small></span>
            <span className="char-count">{description.length}/1000</span>
          </label>
          <textarea
            id="todo-description-input"
            className="form-textarea"
            placeholder="Add relevant notes, checklist details, or background context..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            disabled={isSubmitting}
            rows={3}
          />
        </div>

        <div className="form-actions">
          {isEditMode && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isSubmitting}
              id="cancel-edit-btn"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !title.trim()}
            id="save-todo-btn"
          >
            {isSubmitting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                <span>{isEditMode ? 'Updating...' : 'Adding...'}</span>
              </>
            ) : (
              <>
                <span>{isEditMode ? '💾 Save Changes' : '➕ Add Todo'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TodoForm;
