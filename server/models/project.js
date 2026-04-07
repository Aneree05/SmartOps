// models/Project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  owner:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['manager', 'member'] }
  }],
  stages:    { type: [String], default: ['To Do', 'Development', 'Testing', 'Review', 'Done'] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', projectSchema);