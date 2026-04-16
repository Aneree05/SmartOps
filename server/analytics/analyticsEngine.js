/**
 * @param {Array} taskHistoryRows - [{ task_id, stage_id, user_id, start_time, end_time }]
 * @returns {Object} - { [stage_id]: avgHours }
 */
function calcAvgTimePerStage(taskHistoryRows) {
  const stageTimes = {};
  const stageCounts = {};

  taskHistoryRows.forEach(row => {
    // Only calculate for completed histories
    if (row.start_time && row.end_time) {
      const diffMs = new Date(row.end_time) - new Date(row.start_time);
      const hours = diffMs / (1000 * 60 * 60);

      if (!stageTimes[row.stage_id]) {
        stageTimes[row.stage_id] = 0;
        stageCounts[row.stage_id] = 0;
      }
      stageTimes[row.stage_id] += hours;
      stageCounts[row.stage_id] += 1;
    }
  });

  const avgTimes = {};
  for (const stage in stageTimes) {
    avgTimes[stage] = Number((stageTimes[stage] / stageCounts[stage]).toFixed(2));
  }
  return avgTimes;
}

/**
 * @param {Object} avgTimes - { [stage_id]: avgHours }
 * @param {number} threshold - hour threshold to be considered bottleneck
 * @returns {Array} - [{ stageId, avgHours, delayPercent }]
 */
function detectBottlenecks(avgTimes, threshold = 24) {
  const bottlenecks = [];
  let totalDelay = 0;

  for (const stageId in avgTimes) {
    if (avgTimes[stageId] > threshold) {
      totalDelay += avgTimes[stageId];
    }
  }

  for (const stageId in avgTimes) {
    if (avgTimes[stageId] > threshold) {
      const delayPercent = totalDelay > 0 ? ((avgTimes[stageId] / totalDelay) * 100).toFixed(1) : "0.0";
      bottlenecks.push({ stageId, avgHours: avgTimes[stageId], delayPercent });
    }
  }

  return bottlenecks;
}

/**
 * @param {Array} tasks - [{ title, assigned_to, status, stage_id, stage_entered_at }]
 * @returns {Object} - { [assigned_to]: { count, overloaded } }
 */
function calcWorkloadPerUser(tasks) {
  const workload = {};

  tasks.forEach(task => {
    const user = task.assigned_to;
    if (user && task.status !== "complete" && task.stage_id !== "Done") {
      if (!workload[user]) {
        workload[user] = { count: 0, overloaded: false };
      }
      workload[user].count += 1;
      if (workload[user].count >= 5) {
        workload[user].overloaded = true;
      }
    }
  });

  return workload;
}

/**
 * @param {Array} tasks - [{ task_id, title, stage_id, stage_entered_at }]
 * @param {Object} avgTimes - avg stage times to compute stuck threshold dynamically
 * @param {number} defaultHours fallback if no avg
 * @returns {Array} - [{ task_id, title, stage_id, hoursStuck }]
 */
function detectStuckTasks(tasks, avgTimes, defaultHours = 48) {
  const stuckTasks = [];
  const now = new Date();

  tasks.forEach(task => {
    if (task.stage_entered_at && task.status !== "complete" && task.stage_id !== "Done") {
      const diffMs = now - new Date(task.stage_entered_at);
      const hoursStuck = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
      
      const expectedHours = (avgTimes && avgTimes[task.stage_id]) ? avgTimes[task.stage_id] : defaultHours;

      if (hoursStuck > expectedHours && hoursStuck > 0) { // also must be strictly over avg_time threshold
        stuckTasks.push({
          task_id: task._id || task.task_id,
          title: task.title,
          stage_id: task.stage_id,
          hoursStuck
        });
      }
    }
  });

  return stuckTasks;
}

/**
 * @param {Object} avgTimes
 * @param {Array} bottlenecks
 * @param {Object} workload
 * @param {Array} stuckTasks
 * @returns {Array} of strings
 */
function generateInsights(avgTimes, bottlenecks, workload, stuckTasks) {
  const insights = [];

  bottlenecks.forEach(b => {
    insights.push(`${b.stageId} stage causes ${b.delayPercent}% of total delay`);
  });

  for (const [user, data] of Object.entries(workload)) {
    if (data.overloaded) {
      insights.push(`${user} is overloaded with ${data.count} active tasks`);
    }
  }

  if (stuckTasks.length > 0) {
    insights.push(`${stuckTasks.length} tasks are currently stuck based on average completion times`);
  }

  return insights;
}

module.exports = {
  calcAvgTimePerStage,
  detectBottlenecks,
  calcWorkloadPerUser,
  detectStuckTasks,
  generateInsights
};
