const analyticsRoutes = require("./routes/analytics");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const teamRoutes = require("./routes/teams");
const messageRoutes = require("./routes/messages");
const Message = require("./models/Message");
const TeamMessage = require("./models/TeamMessage");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join DM room using userId provided in query
  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined DM room ${userId}`);
  }

  // Join Project room
  socket.on("joinProject", (projectId) => {
    socket.join(projectId);
    console.log(`Socket ${socket.id} joined project room ${projectId}`);
  });

  // Handle sending DMs via socket
  socket.on("sendDM", async ({ receiverId, content, projectId }) => {
    try {
      if (!userId) return; // Sender ID must be present
      
      const newMessage = new Message({
        sender: userId,
        receiver: receiverId,
        projectId,
        content
      });
      const savedMessage = await newMessage.save();
      const populatedMessage = await savedMessage.populate('sender', 'name email');
      
      // Emit to receiver's room and back to sender
      io.to(receiverId).emit("receiveDM", populatedMessage);
      socket.emit("receiveDM", populatedMessage);
    } catch (err) {
      console.error("Error saving/sending DM:", err);
    }
  });

  // Handle sending broadcasts via socket
  socket.on("sendBroadcast", async ({ projectId, content }) => {
    try {
      if (!userId) return;

      const newTeamMessage = new TeamMessage({
        sender: userId,
        projectId,
        content
      });
      const savedMessage = await newTeamMessage.save();
      const populatedMessage = await savedMessage.populate('sender', 'name email');
      
      // Emit to project room
      io.to(projectId).emit("receiveBroadcast", populatedMessage);
    } catch (err) {
      console.error("Error saving/sending broadcast:", err);
    }
  });

  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

app.use(cors());
app.use(express.json());

// Log requests for debugging
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/messages", messageRoutes);

// Catch 404 and forward to error handler (always JSON)
app.use((req, res, next) => {
  res.status(404).json({ message: 'API route not found' });
});

// Global error handler ensuring JSON response instead of HTML
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Connect DB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`),
    );
  })
  .catch((err) => console.log(err));
