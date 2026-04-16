// routes/projects.js
const express    = require('express');
const Project    = require('../models/project');
const { protect, allowRoles } = require('../middleware/authMiddleware');
const router     = express.Router();

// Create project — only managers and admins
router.post('/', protect, allowRoles('admin', 'manager'), async (req, res) => {
  const { name, stages } = req.body;
  const project = await Project.create({ name, owner: req.user.id, stages });
  res.json(project);
});

// Get all projects for logged-in user
router.get('/', protect, async (req, res) => {
  const projects = await Project.find({ 'members.user': req.user.id })
    .populate('members.user', 'name email');
  res.json(projects);
});

// Add a member to project
router.post('/:id/members', protect, allowRoles('admin', 'manager'), async (req, res) => {
  const { userId, role } = req.body;
  await Project.findByIdAndUpdate(req.params.id, {
    $push: { members: { user: userId, role } }
  });
  res.json({ message: 'Member added' });
});

module.exports = router;