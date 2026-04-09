import mongoose from "mongoose";

const taskHistorySchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
  },
  fromStage: String,
  toStage: String,
}, { timestamps: true });

export default mongoose.model("TaskHistory", taskHistorySchema);