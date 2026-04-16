const API_BASE = 'http://localhost:5000/api';

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

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    console.error('Failed to parse JSON response. Raw text:', text);
    throw new Error('Server returned an invalid JSON response');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
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
  return fetchAPI('/projects', {
    method: 'GET',
  });
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

// Task APIs (For Step 7 onwards)

export const getTasksByProject = async (projectId) => {
  return fetchAPI(`/tasks?projectId=${projectId}`, {
    method: 'GET',
  });
};

export const createTask = async (data) => {
  return fetchAPI('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateTaskStage = async (taskId, stage) => {
  return fetchAPI(`/tasks/${taskId}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stage }),
  });
};

// Teams & Messages APIs

export const joinTeam = async (teamId) => {
  return fetchAPI('/teams/join', {
    method: 'POST',
    body: JSON.stringify({ teamId }),
  });
};

export const createTeamInstance = async (name) => {
  return fetchAPI('/teams/create', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
};

export const getDMs = async (userId) => {
  return fetchAPI(`/messages/dm/${userId}`, {
    method: 'GET',
  });
};

export const sendDM = async (receiverId, projectId, content) => {
  return fetchAPI('/messages/dm', {
    method: 'POST',
    body: JSON.stringify({ receiverId, projectId, content }),
  });
};

export const getBroadcasts = async (projectId) => {
  return fetchAPI(`/messages/broadcast/${projectId}`, {
    method: 'GET',
  });
};

export const sendBroadcast = async (projectId, content) => {
  return fetchAPI('/messages/broadcast', {
    method: 'POST',
    body: JSON.stringify({ projectId, content }),
  });
};
