const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const analyticsRoutes = require("./routes/analytics");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"]
  },
});
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  // Optional: Join a project room
  socket.on("join_project", (projectId) => {
    socket.join(projectId);
  });
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/analytics", analyticsRoutes);

// Connect DB and start server
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/smartops")
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => console.log(err));
