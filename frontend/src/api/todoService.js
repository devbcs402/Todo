const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Resilient fetch wrapper with automatic proxy fallback
 */
const safeFetch = async (url, options = {}) => {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (err && (err.name === 'TypeError' || err.message?.includes('fetch'))) {
      // If direct absolute URL failed, try the local dev proxy /api
      if (typeof url === 'string' && url.startsWith('http://localhost:5000/api')) {
        try {
          const proxyUrl = url.replace('http://localhost:5000/api', '/api');
          return await fetch(proxyUrl, options);
        } catch {}
      }
      throw new Error('Unable to connect to the backend server. Please ensure the backend is running on port 5000.');
    }
    throw err;
  }
};

/**
 * Helper to handle fetch responses and parse errors
 */
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    let errorMsg = 'An unexpected server error occurred';
    if (data && (data.error || data.message)) {
      errorMsg = data.error || data.message;
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        errorMsg += `: ${data.errors.join(', ')}`;
      }
    } else {
      errorMsg = `Request failed with status ${response.status} (${response.statusText})`;
    }
    const error = new Error(errorMsg);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
};

/**
 * Fetch list of TODOs with optional filtering, search, and sort order
 */
export const fetchTodos = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') {
    query.set('status', params.status);
  }
  if (params.search && params.search.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.sort) {
    query.set('sort', params.sort);
  }

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const response = await safeFetch(`${BASE_URL}/todos${queryString}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });

  return handleResponse(response);
};

/**
 * Fetch a single TODO by its MongoDB ObjectId
 */
export const fetchTodoById = async (id) => {
  const response = await safeFetch(`${BASE_URL}/todos/${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return handleResponse(response);
};

/**
 * Create a new TODO record
 */
export const createTodo = async ({ title, description }) => {
  const response = await safeFetch(`${BASE_URL}/todos`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      title: title.trim(),
      description: description ? description.trim() : '',
    }),
  });
  return handleResponse(response);
};

/**
 * Update an existing TODO record by ID
 */
export const updateTodo = async (id, updates) => {
  const response = await safeFetch(`${BASE_URL}/todos/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  return handleResponse(response);
};

/**
 * Delete a specific TODO record by ID
 */
export const deleteTodo = async (id) => {
  const response = await safeFetch(`${BASE_URL}/todos/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return handleResponse(response);
};

/**
 * Send natural language message to AI Chat Assistant
 */
export const sendAiChat = async ({ message, conversationHistory = [], confirmationToken, confirm }) => {
  const response = await safeFetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      message,
      conversationHistory,
      confirmationToken,
      confirm,
    }),
  });
  return handleResponse(response);
};

export const fetchCurrentUser = async () => {
  const response = await safeFetch(`${BASE_URL}/auth/me`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return handleResponse(response);
};

export const login = async ({ email, password }) => {
  const response = await safeFetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
};

export const register = async ({ name, email, password }) => {
  const response = await safeFetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse(response);
};

export const logout = async () => {
  const response = await safeFetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  return handleResponse(response);
};
