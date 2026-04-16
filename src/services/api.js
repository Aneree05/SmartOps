const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Something went wrong');
  }

  return data;
}

export const login = async (email, password) => {
  return fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

export const register = async (name, email, password, role) => {
  return fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  });
};

export const getProjects = async () => {
  return fetchAPI('/projects', { method: 'GET' });
};

export const createProject = async (name, stages) => {
  return fetchAPI('/projects', {
    method: 'POST',
    body: JSON.stringify({ name, stages }),
  });
};

export const addMember = async (projectId, userId, role) => {
  return fetchAPI(`/projects/${projectId}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId, role }),
  });
};

// Task APIs
export const getTasks = async (projectId) => {
  const query = projectId ? `?projectId=${projectId}` : '';
  return fetchAPI(`/tasks${query}`, { method: 'GET' });
};

export const createTask = async (data) => {
  return fetchAPI('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const moveTask = async (taskId, newStageId) => {
  return fetchAPI(`/tasks/${taskId}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ stage_id: newStageId }),
  });
};

export const deleteTask = async (taskId) => {
  return fetchAPI(`/tasks/${taskId}`, { method: 'DELETE' });
};

// Analytics APIs
export const getAnalyticsSummary = async (projectId) => {
  const pid = projectId || 'all';
  return fetchAPI(`/analytics/summary/${pid}`, { method: 'GET' });
};

// Export aliases to avoid breaking any other old components temporarily
export const getTasksByProject = getTasks;
export const updateTaskStage = moveTask;
