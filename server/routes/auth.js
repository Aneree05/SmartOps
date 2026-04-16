// routes/auth.js
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const Project  = require('../models/project');
const router   = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  const hashed  = await bcrypt.hash(password, 10);
  const user    = await User.create({ name, email, password: hashed, role });
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, role: user.role, name: user.name, userId: user._id, teamId: null });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user  = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: 'Wrong password' });
  
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  let teamId = null;
  if (user.role === 'team_leader') {
    const project = await Project.findOne({ owner: user._id });
    if (project) teamId = project.teamId;
  }
  
  res.json({ token, role: user.role, name: user.name, userId: user._id, teamId });
});

module.exports = router;