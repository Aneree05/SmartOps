import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();


// Allowed stages (important for consistency)
const STAGES = ["todo", "in_progress", "done"];

/**
 * CREATE TASK
 */
export const createTask = async (req, res) => {
  try {
    const { title, description } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        stage: "todo",
      },
    });

    // Create initial history
    await prisma.taskHistory.create({
      data: {
        taskId: task.id,
        fromStage: "none",
        toStage: "todo",
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error("CREATE TASK ERROR:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
};

/**
 * GET TASKS
 */
export const getTasks = async (req, res) => {
  try {
    const { stage } = req.query;

    const tasks = await prisma.task.findMany({
      where: stage ? { stage } : {},
      orderBy: { createdAt: "desc" },
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

/**
 * MOVE TASK (CRITICAL LOGIC)
 */
export const moveTask = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { newStage } = req.body;

    if (!STAGES.includes(newStage)) {
      return res.status(400).json({ error: "Invalid stage" });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const oldStage = task.stage;

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { stage: newStage },
    });

    // Log history
    await prisma.taskHistory.create({
      data: {
        taskId: taskId,
        fromStage: oldStage,
        toStage: newStage,
      },
    });

    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to move task" });
  }
};