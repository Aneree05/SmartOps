export const dashboardStats = {
  activeProjects: 14,
  tasksInProgress: 82,
  avgCompletionTime: '3.2 Days',
  teamEfficiencyScore: 88,
  bottleneckAlert: {
    stage: 'Testing',
    delayPercent: 42,
    project: 'Project Alpha - Backend Refactor',
  }
};

export const stageDelays = [
  { stage: 'Planning', delay: 10, expected: 5 },
  { stage: 'Design', delay: 15, expected: 10 },
  { stage: 'In Dev', delay: 35, expected: 25 },
  { stage: 'Code Review', delay: 20, expected: 15 },
  { stage: 'Testing', delay: 85, expected: 30 },
];

export const teamWorkloads = [
  { subject: 'Frontend', A: 120, fullMark: 150 },
  { subject: 'Backend', A: 98, fullMark: 150 },
  { subject: 'QA/Testing', A: 145, fullMark: 150 },
  { subject: 'Design', A: 60, fullMark: 150 },
  { subject: 'DevOps', A: 85, fullMark: 150 },
];

export const kanbanColumns = {
  todo: {
    id: 'todo',
    title: 'To Do',
    taskIds: ['task-1', 'task-2', 'task-3', 'task-4'],
  },
  inDev: {
    id: 'inDev',
    title: 'In Dev',
    taskIds: ['task-5', 'task-6'],
  },
  inTesting: {
    id: 'inTesting',
    title: 'In Testing',
    taskIds: ['task-7', 'task-8', 'task-9'],
  },
  done: {
    id: 'done',
    title: 'Done',
    taskIds: ['task-10'],
  },
};

export const kanbanTasks = {
  'task-1': { id: 'task-1', content: 'Design System Update', assignee: 'JD', priority: 'low', daysInStage: 1 },
  'task-2': { id: 'task-2', content: 'User Authentication Flow', assignee: 'Sarah', priority: 'high', daysInStage: 2 },
  'task-3': { id: 'task-3', content: 'Database Schema Migration', assignee: 'MK', priority: 'high', daysInStage: 5 },
  'task-4': { id: 'task-4', content: 'Payment Gateway Integration', assignee: 'Alan', priority: 'medium', daysInStage: 1 },
  'task-5': { id: 'task-5', content: 'WebSocket Realtime Sync', assignee: 'Sarah', priority: 'high', daysInStage: 4 },
  'task-6': { id: 'task-6', content: 'Dashboard Chart Components', assignee: 'JD', priority: 'medium', daysInStage: 2 },
  'task-7': { id: 'task-7', content: 'E2E Testing for Checkout', assignee: 'RL', priority: 'high', daysInStage: 8 }, // Bottleneck
  'task-8': { id: 'task-8', content: 'OAuth Provider Updates', assignee: 'MK', priority: 'medium', daysInStage: 6 }, // Bottleneck
  'task-9': { id: 'task-9', content: 'Redis Cache Implementation', assignee: 'Alan', priority: 'low', daysInStage: 5 }, // Bottleneck
  'task-10': { id: 'task-10', content: 'Initial Repository Setup', assignee: 'Admin', priority: 'low', daysInStage: 1 },
};

export const workflowVelocity = [
  { name: 'Mon', completed: 12, added: 10 },
  { name: 'Tue', completed: 15, added: 14 },
  { name: 'Wed', completed: 8, added: 22 }, // Spike in tasks added
  { name: 'Thu', completed: 25, added: 5 }, // Caught up
  { name: 'Fri', completed: 18, added: 12 },
  { name: 'Sat', completed: 2, added: 0 },
  { name: 'Sun', completed: 5, added: 2 },
];

export const teamMembers = [
  { id: 1, name: 'Aneree Patel', role: 'Full Stack Engineer & Project Lead', initials: 'AP', currentTask: 'Backend Auth System', workload: 85, isOverloaded: false },
  { id: 2, name: 'Shriya Choksi', role: 'Frontend Engineer', initials: 'SC', currentTask: 'Dashboard & Kanban UI', workload: 92, isOverloaded: true },
  { id: 3, name: 'Yug Thakkar', role: 'Backend Developer', initials: 'YT', currentTask: 'API Gateway Integration', workload: 110, isOverloaded: true },
  { id: 4, name: 'Mihir Aadki', role: 'Analytics & Systems', initials: 'MA', currentTask: 'Bottleneck Detection Engine', workload: 65, isOverloaded: false },
];
