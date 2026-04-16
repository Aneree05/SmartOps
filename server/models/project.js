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
  createdAt: { type: Date, default: Date.now },
  description: { type: String },
  isDefault: { type: Boolean, default: false }
});

module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema);