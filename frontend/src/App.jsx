import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthPage from './components/AuthPage';
import Header from './components/Header';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import ConfirmModal from './components/ConfirmModal';
import Toast from './components/Toast';
import AiChatModal from './components/AiChatModal';
import {
  fetchTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  fetchCurrentUser,
  logout,
} from './api/todoService';

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then((result) => {
        if (active) setUser(result.user);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
    if (!user && !isAuthPage) navigate('/login', { replace: true });
    if (user && isAuthPage) navigate('/', { replace: true });
  }, [authLoading, location.pathname, navigate, user]);

  // Data state
  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Server health state
  const [isConnected, setIsConnected] = useState(false);
  const [serverChecking, setServerChecking] = useState(true);

  // Form & Action state
  const [editingTodo, setEditingTodo] = useState(null);
  const [deletingTodo, setDeletingTodo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filter, Search, and Sort state
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  // Notifications
  const [toasts, setToasts] = useState([]);

  // Toast dispatch helper
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch todos from MongoDB backend
  const loadTodos = useCallback(async (isInitial = false) => {
    if (!user) return;
    if (isInitial) setIsLoading(true);
    setError(null);
    try {
      setServerChecking(true);
      const res = await fetchTodos({
        status: filterStatus,
        search: searchQuery,
        sort: sortOrder,
      });

      if (res && Array.isArray(res.data)) {
        setTodos(res.data);
        setIsConnected(true);
      } else {
        throw new Error('Invalid data format returned by server');
      }
    } catch (err) {
      console.error('Failed to load todos:', err);
      if (err.status === 401) setUser(null);
      setError(err.message || 'Unable to connect to the backend database');
      setIsConnected(false);
      if (!isInitial) {
        showToast(err.message || 'Error syncing with database', 'error');
      }
    } finally {
      setIsLoading(false);
      setServerChecking(false);
    }
  }, [filterStatus, searchQuery, sortOrder, showToast, user]);

  // Initial load
  useEffect(() => {
    loadTodos(true);
  }, [loadTodos]);

  // Seamless auto-retry when server connection is lost
  useEffect(() => {
    if (!isConnected && !serverChecking) {
      const timer = setTimeout(() => {
        loadTodos(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, serverChecking, loadTodos]);

  // Computed summary metrics
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [todos]);

  // Handle Create or Update submission
  const handleFormSubmit = async ({ title, description }) => {
    setIsSubmitting(true);
    try {
      if (editingTodo) {
        // Update existing todo
        const res = await updateTodo(editingTodo._id, { title, description });
        if (res && res.data) {
          setTodos((prev) =>
            prev.map((item) => (item._id === editingTodo._id ? res.data : item))
          );
          showToast(`Task "${res.data.title}" updated successfully!`, 'success');
          setEditingTodo(null);
        }
      } else {
        // Create new todo
        const res = await createTodo({ title, description });
        if (res && res.data) {
          // If sorting by newest, prepend; otherwise append
          if (sortOrder === 'desc') {
            setTodos((prev) => [res.data, ...prev]);
          } else {
            setTodos((prev) => [...prev, res.data]);
          }
          showToast(`Task "${res.data.title}" created successfully!`, 'success');
        }
      }
    } catch (err) {
      console.error('Error saving todo:', err);
      showToast(err.message || 'Failed to save todo', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle completion status
  const handleToggleComplete = async (todo) => {
    const newStatus = !todo.completed;
    const actionKey = `toggle-${todo._id}`;
    setActionLoadingId(actionKey);

    // Optimistic UI update
    setTodos((prev) =>
      prev.map((item) => (item._id === todo._id ? { ...item, completed: newStatus } : item))
    );

    try {
      const res = await updateTodo(todo._id, { completed: newStatus });
      if (res && res.data) {
        setTodos((prev) =>
          prev.map((item) => (item._id === todo._id ? res.data : item))
        );
        showToast(
          newStatus
            ? `Marked "${todo.title}" as completed! 🎉`
            : `Reopened "${todo.title}" as pending.`,
          'info'
        );
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      // Revert optimistic update on failure
      setTodos((prev) =>
        prev.map((item) => (item._id === todo._id ? { ...item, completed: !newStatus } : item))
      );
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Trigger Edit Mode
  const handleEditRequest = (todo) => {
    setEditingTodo(todo);
    // Scroll smoothly to form
    const formElement = document.getElementById('todo-form-panel');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Cancel Edit Mode
  const handleCancelEdit = () => {
    setEditingTodo(null);
  };

  // Trigger Delete Confirmation Modal
  const handleDeleteRequest = (todo) => {
    setDeletingTodo(todo);
  };

  // Perform Delete after confirmation
  const handleConfirmDelete = async () => {
    if (!deletingTodo) return;

    setIsDeleting(true);
    setActionLoadingId(`delete-${deletingTodo._id}`);

    try {
      await deleteTodo(deletingTodo._id);
      setTodos((prev) => prev.filter((item) => item._id !== deletingTodo._id));
      showToast(`Deleted "${deletingTodo.title}" successfully.`, 'success');
      setDeletingTodo(null);
    } catch (err) {
      console.error('Error deleting todo:', err);
      showToast(err.message || 'Failed to delete task', 'error');
    } finally {
      setIsDeleting(false);
      setActionLoadingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setTodos([]);
      navigate('/login', { replace: true });
    } catch (err) {
      showToast(err.message || 'Unable to log out. Please try again.', 'error');
    }
  };

  if (authLoading) {
    return <main className="auth-loading" aria-live="polite">Checking your session...</main>;
  }

  if (!user) {
    const mode = location.pathname === '/register' ? 'register' : 'login';
    return <AuthPage mode={mode} onAuthenticated={(authenticatedUser) => {
      setUser(authenticatedUser);
      navigate('/', { replace: true });
    }} />;
  }

  if (location.pathname === '/login' || location.pathname === '/register') return null;

  return (
    <div className="app-container" id="app-root">
      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Header and Live Metrics */}
      <Header
        stats={stats}
        isConnected={isConnected}
        serverChecking={serverChecking}
        user={user}
        onLogout={handleLogout}
      />

      <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Create / Edit Form */}
        <TodoForm
          onSubmit={handleFormSubmit}
          onCancel={handleCancelEdit}
          editingTodo={editingTodo}
          isSubmitting={isSubmitting}
        />

        {/* Task List with Search, Filter & Sort */}
        <TodoList
          todos={todos}
          isLoading={isLoading}
          error={error}
          onRetry={() => loadTodos(true)}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          onToggleComplete={handleToggleComplete}
          onEdit={handleEditRequest}
          onDeleteRequest={handleDeleteRequest}
          actionLoadingId={actionLoadingId}
        />
      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingTodo)}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action will permanently remove it from MongoDB."
        itemName={deletingTodo?.title}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingTodo(null)}
        isProcessing={isDeleting}
      />

      {/* Floating AI Chat Assistant */}
      <AiChatModal onTasksUpdated={() => loadTodos(false)} />
    </div>
  );
};

export default App;
