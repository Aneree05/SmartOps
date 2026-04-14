// 1. Average time per stage
function calcAvgTimePerStage(history) {
  const map = {};

  history.forEach((h) => {
    if (!h.updatedAt || !h.createdAt) return;

    const duration = (new Date(h.updatedAt) - new Date(h.createdAt)) / 3600000;

    if (!map[h.toStage]) {
      map[h.toStage] = { total: 0, count: 0 };
    }

    map[h.toStage].total += duration;
    map[h.toStage].count++;
  });

  const result = {};
  for (let stage in map) {
    result[stage] = +(map[stage].total / map[stage].count).toFixed(2);
  }

  return result;
}

// 2. Bottleneck detection
function detectBottlenecks(avgTimes, threshold = 24) {
  return Object.entries(avgTimes)
    .filter(([_, time]) => time > threshold)
    .map(([stage, time]) => ({
      stage,
      avgHours: time,
    }));
}

// 3. Workload per user
function calcWorkload(tasks) {
  const map = {};

  tasks.forEach((task) => {
    if (!map[task.assigned_to]) map[task.assigned_to] = 0;
    map[task.assigned_to]++;
  });

  return map;
}

// 4. Stuck tasks (based on stage_entered_at)
function detectStuckTasks(tasks, limit = 48) {
  const now = new Date();

  return tasks.filter((task) => {
    if (!task.stage_entered_at) return false;

    const hours = (now - new Date(task.stage_entered_at)) / 3600000;

    return hours > limit && task.status === "active";
  });
}

// 5. Generate insights (VERY IMPORTANT FOR MARKS)
function generateInsights(avgTimes, bottlenecks, workload, stuckTasks) {
  const insights = [];

  // Bottleneck insights
  bottlenecks.forEach((b) => {
    insights.push(`${b.stage} stage is slow (avg ${b.avgHours} hrs)`);
  });

  // Workload insights
  Object.entries(workload).forEach(([user, count]) => {
    if (count >= 3) {
      insights.push(`${user} is overloaded (${count} tasks)`);
    }
  });

  // Stuck tasks insights
  if (stuckTasks.length > 0) {
    insights.push(`${stuckTasks.length} tasks are stuck for too long`);
  }

  return insights;
}

module.exports = {
  calcAvgTimePerStage,
  detectBottlenecks,
  calcWorkload,
  detectStuckTasks,
  generateInsights,
};
