const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  assigned_to: { type: String, required: true },
  status: { type: String, enum: ['active', 'complete'], default: 'active' },
  stage_id: { type: String, required: true, default: 'To Do' },
  stage_entered_at: { type: Date, default: Date.now },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  estimated_days: { type: Number, default: 1 },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
