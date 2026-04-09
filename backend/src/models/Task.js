import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  stage: {
    type: String,
    enum: ["todo", "in-progress", "done"],
    default: "todo",
  },
}, { timestamps: true });

export default mongoose.model("Task", taskSchema);