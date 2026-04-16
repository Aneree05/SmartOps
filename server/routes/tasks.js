const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const TaskHistory = require("../models/TaskHistory");
const { protect } = require("../middleware/authMiddleware");

const { getDefaultProject } = require('../utils/projectHelper');

// Helper function to get socket.io instance
const getIo = (req) => req.app.get("io");

// GET /api/tasks
router.get("/", protect, async (req, res) => {
  try {
    const defaultProject = await getDefaultProject();
    const filter = { project_id: defaultProject._id };
    
    const tasks = await Task.find(filter).lean();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks
router.post("/", protect, async (req, res) => {
  try {
    const { title, assigned_to, stage_id, priority, estimated_days } = req.body;
    
    const defaultProject = await getDefaultProject();
    const initialStage = stage_id || "To Do";

    const task = new Task({
      title,
      assigned_to,
      stage_id: initialStage,
      priority: priority || "medium",
      estimated_days: estimated_days || 1,
      project_id: defaultProject._id,
      stage_entered_at: new Date()
    });
    
    await task.save();

    // Create initial TaskHistory
    const history = new TaskHistory({
      task_id: task._id,
      stage_id: initialStage,
      user_id: assigned_to || req.user?.id || "System", 
      start_time: new Date(),
      end_time: null
    });
    
    await history.save();

    const io = getIo(req);
    if (io) {
      io.emit("task:created", task);
    }

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id/move
router.patch("/:id/move", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { stage_id } = req.body;
    
    if (!stage_id) {
      return res.status(400).json({ error: "stage_id is required" });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // If no change, return directly
    if (task.stage_id === stage_id) {
      return res.json(task);
    }

    const now = new Date();

    // Close previous TaskHistory entry
    await TaskHistory.updateMany(
      { task_id: id, end_time: null },
      { $set: { end_time: now } }
    );

    // Update Task
    task.stage_id = stage_id;
    task.stage_entered_at = now;
    if (stage_id === "Done" || stage_id.toLowerCase().includes("done")) {
       task.status = "complete";
    } else {
       task.status = "active";
    }
    await task.save();

    // Create new TaskHistory entry
    const newHistory = new TaskHistory({
      task_id: task._id,
      stage_id,
      user_id: req.user?.id || task.assigned_to || "System",
      start_time: now,
      end_time: null
    });
    await newHistory.save();

    const io = getIo(req);
    if (io) {
      io.emit("task:moved", { taskId: task._id, newStage: stage_id });
    }

    res.json(task);
  } catch (err) {
    console.error("PATCH /tasks/:id/move ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    
    await TaskHistory.deleteMany({ task_id: req.params.id });

    const io = getIo(req);
    if (io) {
      io.emit("task:deleted", req.params.id);
    }

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
