const express = require("express");
const router = express.Router();

// Models (already in your project)
const Task = require("../models/Task");
const TaskHistory = require("../models/TaskHistory");

// Your analytics logic
const {
  calcAvgTimePerStage,
  detectBottlenecks,
  calcWorkload,
  detectStuckTasks,
  generateInsights,
} = require("../analytics/analyticsEngine");

// GET /api/analytics/summary
router.get("/summary", async (req, res) => {
  try {
    console.log("🔥 Analytics API called");

    // Get data from DB
    const tasks = await Task.find();
    const history = await TaskHistory.find();

    console.log("Tasks:", tasks.length);
    console.log("History:", history.length);

    // Run analytics
    const avgTimes = calcAvgTimePerStage(history);
    const bottlenecks = detectBottlenecks(avgTimes);
    const workload = calcWorkload(tasks);
    const stuckTasks = detectStuckTasks(tasks);
    const insights = generateInsights(
      avgTimes,
      bottlenecks,
      workload,
      stuckTasks,
    );

    // Send response
    res.json({
      avgTimes,
      bottlenecks,
      workload,
      stuckTasks,
      insights,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analytics failed" });
  }
});

module.exports = router;
