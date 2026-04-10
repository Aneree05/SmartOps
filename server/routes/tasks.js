const express = require('express');
const Task = require('../models/Task');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all tasks for a project
router.get('/', protect, async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ message: 'Missing projectId query parameter' });
    }
    const tasks = await Task.find({ project: projectId });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create task
router.post('/', protect, async (req, res) => {
  try {
    const { title, assignee, priority, stage, projectId } = req.body;
    const task = await Task.create({
      title,
      assignee,
      priority,
      stage,
      project: projectId
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update task stage
router.patch('/:id/stage', protect, async (req, res) => {
  try {
    const { stage } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id, 
      { stage }, 
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Step 9: Emit to socket
    const io = req.app.get('io');
    if (io) {
      io.emit('task:moved', { taskId: task._id, stage: task.stage });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
