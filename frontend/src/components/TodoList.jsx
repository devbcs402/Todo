import React from 'react';
import TodoItem from './TodoItem';

const TodoList = ({
  todos,
  isLoading,
  error,
  onRetry,
  filterStatus,
  onFilterChange,
  searchQuery,
  onSearchChange,
  sortOrder,
  onSortChange,
  onToggleComplete,
  onEdit,
  onDeleteRequest,
  actionLoadingId,
}) => {
  return (
    <section className="glass-panel" id="todo-list-panel" aria-label="Tasks list section">
      {/* Toolbar with filter tabs, search and sorting */}
      <div className="toolbar-container">
        <div className="filter-tabs" role="tablist" aria-label="Filter tasks">
          <button
            type="button"
            role="tab"
            aria-selected={filterStatus === 'all'}
            className={`tab-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => onFilterChange('all')}
            id="tab-filter-all"
          >
            All Tasks
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterStatus === 'active'}
            className={`tab-btn ${filterStatus === 'active' ? 'active' : ''}`}
            onClick={() => onFilterChange('active')}
            id="tab-filter-active"
          >
            ⏳ Pending
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterStatus === 'completed'}
            className={`tab-btn ${filterStatus === 'completed' ? 'active' : ''}`}
            onClick={() => onFilterChange('completed')}
            id="tab-filter-completed"
          >
            ✅ Done
          </button>
        </div>

        <div className="search-box">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            id="todo-search-input"
            aria-label="Search tasks by title or description"
          />
        </div>

        <select
          className="sort-select"
          value={sortOrder}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label="Sort tasks by creation date"
          id="todo-sort-select"
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        {/* Loading state */}
        {isLoading && (
          <div className="todo-list-wrapper" aria-busy="true">
            <div className="skeleton-item" />
            <div className="skeleton-item" />
            <div className="skeleton-item" />
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="error-state" role="alert">
            <div className="error-icon" aria-hidden="true">⚠️</div>
            <h3>Unable to Load Todos</h3>
            <p>{error}</p>
            <button type="button" className="btn btn-secondary" onClick={onRetry} id="retry-load-btn">
              🔄 Retry Connection
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && todos.length === 0 && (
          <div className="empty-state">
            <div className="empty-graphic" aria-hidden="true">
              {searchQuery ? '🔎' : filterStatus === 'completed' ? '🎯' : '📝'}
            </div>
            <h3>
              {searchQuery
                ? `No tasks matching "${searchQuery}"`
                : filterStatus === 'completed'
                ? 'No completed tasks yet'
                : filterStatus === 'active'
                ? 'No pending tasks left!'
                : 'No tasks found'}
            </h3>
            <p>
              {searchQuery
                ? 'Try a different search query or clear the search field.'
                : filterStatus === 'completed'
                ? 'Complete some of your tasks to see them archived here.'
                : 'Add a new task using the form above to start organizing your workflow!'}
            </p>
          </div>
        )}

        {/* Todos list */}
        {!isLoading && !error && todos.length > 0 && (
          <div className="todo-list-wrapper" id="todo-cards-container">
            {todos.map((todo) => (
              <TodoItem
                key={todo._id}
                todo={todo}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDeleteRequest={onDeleteRequest}
                isToggling={actionLoadingId === `toggle-${todo._id}`}
                isDeleting={actionLoadingId === `delete-${todo._id}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TodoList;
