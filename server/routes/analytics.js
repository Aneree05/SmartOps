const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const TaskHistory = require("../models/TaskHistory");
const { protect } = require("../middleware/authMiddleware");
const {
  calcAvgTimePerStage,
  detectBottlenecks,
  calcWorkloadPerUser,
  detectStuckTasks,
  generateInsights
} = require("../analytics/analyticsEngine");
const { getDefaultProject } = require('../utils/projectHelper');

const mongoose = require("mongoose");

// Helper function to map DB to expected schemas, filter by default project, or mock
async function getData(req) {
  if (req.query.mock === "true") {
    return { mockFlag: true };
  }

  const defaultProject = await getDefaultProject();
  const matchFilter = { project_id: defaultProject._id };

  const dbTasks = await Task.find(matchFilter).lean();
  
  // Use filter in TaskHistory.aggregate() by looking up the task
  const historyAggregatePipeline = [
    {
      $lookup: {
        from: "tasks", // MongoDB collection name for Task
        localField: "task_id",
        foreignField: "_id",
        as: "taskInfo"
      }
    },
    { $unwind: "$taskInfo" }
  ];

  historyAggregatePipeline.push({ $match: { "taskInfo.project_id": matchFilter.project_id } });

  const dbHistory = await TaskHistory.aggregate(historyAggregatePipeline);

  return { tasks: dbTasks, history: dbHistory, mockFlag: false };
}

// Error handling middleware helper for routes
const handleAnalytics = async (req, res, processor) => {
  try {
    const data = await getData(req);
    if (data.mockFlag) return processor(res, data, true);
    processor(res, data, false);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

router.get("/stages/:projectId", protect, (req, res) => {
  handleAnalytics(req, res, (res, data, isMock) => {
    if (isMock) return res.json({ "To Do": 2, "In Development": 24, "In Testing": 48, "Done": 1 });
    res.json(calcAvgTimePerStage(data.history));
  });
});

router.get("/bottlenecks/:projectId", protect, (req, res) => {
  handleAnalytics(req, res, (res, data, isMock) => {
    if (isMock) return res.json([{ stageId: "In Testing", avgHours: 48, delayPercent: "42.1" }]);
    res.json(detectBottlenecks(calcAvgTimePerStage(data.history), 24));
  });
});

router.get("/workload/:projectId", protect, (req, res) => {
  handleAnalytics(req, res, (res, data, isMock) => {
    if (isMock) return res.json({ "Sarah": { count: 6, overloaded: true } });
    res.json(calcWorkloadPerUser(data.tasks));
  });
});

router.get("/stuck/:projectId", protect, (req, res) => {
  handleAnalytics(req, res, (res, data, isMock) => {
    if (isMock) return res.json([{ task_id: "x", title: "Fix bug", stage_id: "In Testing", hoursStuck: 72 }]);
    const avgTimes = calcAvgTimePerStage(data.history);
    res.json(detectStuckTasks(data.tasks, avgTimes, 48));
  });
});

router.get("/summary/:projectId", protect, (req, res) => {
  handleAnalytics(req, res, (res, data, isMock) => {
    if (isMock) {
      return res.json({
        avgTimes: { "To Do": 2, "In Development": 24, "In Testing": 48, "Done": 1 },
        bottlenecks: [{ stageId: "In Testing", avgHours: 48, delayPercent: "42.1" }],
        workload: { "Sarah": { count: 6, overloaded: true }, "John": { count: 3, overloaded: false } },
        stuckTasks: [{ task_id: "x", title: "Fix bug", stage_id: "In Testing", hoursStuck: 72 }],
        insights: ["In Testing stage causes 42% of total delay", "Sarah is overloaded with 6 active tasks"]
      });
    }

    const avgTimes = calcAvgTimePerStage(data.history);
    const bottlenecks = detectBottlenecks(avgTimes, 24);
    const workload = calcWorkloadPerUser(data.tasks);
    const stuckTasks = detectStuckTasks(data.tasks, avgTimes, 48); 
    const insights = generateInsights(avgTimes, bottlenecks, workload, stuckTasks);

    res.json({ avgTimes, bottlenecks, workload, stuckTasks, insights });
  });
});

module.exports = router;
