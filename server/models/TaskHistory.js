const mongoose = require('mongoose');

const taskHistorySchema = new mongoose.Schema({
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  stage_id: { type: String, required: true },
  user_id: { type: String, required: true },
  start_time: { type: Date, required: true, default: Date.now },
  end_time: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('TaskHistory', taskHistorySchema);
