const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const TeamMessage = require('../models/TeamMessage');
const Project = require('../models/project');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/messages/dm
// @desc    Send a direct message
// @access  Private
router.post('/dm', protect, async (req, res) => {
  try {
    const { receiverId, projectId, content } = req.body;
    
    if (!receiverId || !projectId || !content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newMessage = new Message({
      sender: req.user.id,
      receiver: receiverId,
      projectId,
      content,
    });

    const savedMessage = await newMessage.save();

    // The actual socket emission happens in the generalized socket flow, or we can handle it directly if io is passed.
    // The user's requested architecture indicates the server saves to DB then emits to receiver's room. 
    // Usually, the socket event itself (socket.on('sendDM')) handles both saving and emitting.
    // But since these are REST endpoints requested, we just save here. Socket events will be separate in index.js.
    // However, if the user calls the REST endpoint, we should also emit. Let's get io instance.
    const io = req.app.get('io');
    if (io) {
      // populate sender info if we want before emit
      const populatedMessage = await savedMessage.populate('sender', 'name email');
      io.to(receiverId).emit('receiveDM', populatedMessage);
    }

    res.status(201).json(savedMessage);
  } catch (err) {
    console.error('Error sending DM:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/dm/:userId
// @desc    Get all DMs between logged in user and another user
// @access  Private
router.get('/dm/:userId', protect, async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: loggedInUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: loggedInUserId },
      ]
    }).sort({ createdAt: 1 }).populate('sender', 'name email');

    res.status(200).json(messages);
  } catch (err) {
    console.error('Error fetching DMs:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages/broadcast
// @desc    Send a broadcast message to a project
// @access  Private
router.post('/broadcast', protect, async (req, res) => {
  try {
    const { projectId, content } = req.body;

    if (!projectId || !content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newTeamMessage = new TeamMessage({
      sender: req.user.id,
      projectId,
      content,
    });

    const savedMessage = await newTeamMessage.save();

    const io = req.app.get('io');
    if (io) {
      const populatedMessage = await savedMessage.populate('sender', 'name email');
      io.to(projectId).emit('receiveBroadcast', populatedMessage);
    }

    res.status(201).json(savedMessage);
  } catch (err) {
    console.error('Error sending broadcast:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/broadcast/:projectId
// @desc    Get all broadcast messages for a project
// @access  Private
router.get('/broadcast/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;

    const messages = await TeamMessage.find({ projectId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email');

    res.status(200).json(messages);
  } catch (err) {
    console.error('Error fetching broadcast messages:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
