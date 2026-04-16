// models/Conversation.js
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  name: { type: String },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isGroup: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Conversation", conversationSchema);