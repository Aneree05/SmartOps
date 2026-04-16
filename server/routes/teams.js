const express = require('express');
const router = express.Router();
const Project = require('../models/project');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/teams/create
// @desc    Create a team (project) and auto-generate teamId
// @access  Private
router.post('/create', protect, async (req, res) => {
  try {
    if (req.user.role !== 'team_leader') {
      return res.status(403).json({ message: 'Only team leaders can create teams' });
    }

    const { name, stages } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name is required' });

    const generateTeamId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    
    const teamId = generateTeamId();
    
    const project = new Project({ 
      name, 
      teamId,
      owner: req.user.id, 
      stages,
      members: [{ user: req.user.id, role: 'manager' }]
    });
    
    await project.save();

    res.status(201).json({ message: 'Team created', teamId, project: project });
  } catch (err) {
    console.error('Error creating team:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/teams/join
// @desc    Join a team via unique project ID
// @access  Private
router.post('/join', protect, async (req, res) => {
  try {
    const { teamId } = req.body;

    if (!teamId) {
      return res.status(400).json({ message: 'Team ID is required' });
    }

    const project = await Project.findOne({ teamId });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is already a member
    const isMember = project.members.some(
      (member) => member.user.toString() === req.user.id
    );

    if (isMember) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    // Add user to project members
    project.members.push({ user: req.user.id, role: 'member' });
    await project.save();

    // Populate members data if needed before returning, assuming default is just OK
    res.status(200).json({ message: 'Successfully joined team', project });
  } catch (err) {
    console.error('Error joining team:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
