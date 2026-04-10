const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  assignee:    { type: String },
  priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  stage:       { type: String, default: 'To Do' },
  project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  daysInStage: { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);
