import Task from "../models/Task.js";
import TaskHistory from "../models/TaskHistory.js";

// Allowed stages (important for consistency)
const STAGES = ["todo", "in_progress", "done"];

/**
 * CREATE TASK
 */
export const createTask = async (req, res) => {
  try {
    const { title, description } = req.body;

    const task = await Task.create({ title, description });

    await TaskHistory.create({
      taskId: task._id,
      fromStage: "none",
      toStage: "todo",
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to create task" });
  }
};

/**
 * GET TASKS
 */
export const getTasks = async (req, res) => {
  try {
    const { stage } = req.query;

    const tasks = await Task.find(stage ? { stage } : {})
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

/**
 * MOVE TASK (CRITICAL LOGIC)
 */
export const moveTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStage } = req.body;

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const oldStage = task.stage;

    task.stage = newStage;
    await task.save();

    await TaskHistory.create({
      taskId: id,
      fromStage: oldStage,
      toStage: newStage,
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to move task" });
  }
};