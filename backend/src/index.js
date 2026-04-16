import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";

import taskRoutes from "./routes/taskRoutes.js";
import conversationRoutes from "./routes/conversation.js";
import messageRoutes from "./routes/message.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// connect DB
connectDB();

// routes
app.use("/tasks", taskRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

// health check
app.get("/", (req, res) => {
  res.send("SmartOps Backend Running");
});

const PORT = 5000;

// IMPORTANT: create server first
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// THEN attach socket.io
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
  });

  socket.on("sendMessage", (data) => {
    io.to(data.conversationId).emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});