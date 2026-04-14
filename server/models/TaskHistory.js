const mongoose = require("mongoose");

const taskHistorySchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    fromStage: {
      type: String,
    },
    toStage: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // creates createdAt & updatedAt automatically
  },
);

module.exports = mongoose.model("TaskHistory", taskHistorySchema);
