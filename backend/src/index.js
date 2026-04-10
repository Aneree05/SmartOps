import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import taskRoutes from "./routes/taskRoutes.js";
import { connectDB } from "./config/db.js";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

//connect DB
connectDB();

// Routes
app.use("/tasks", taskRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("SmartOps Backend Running");
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});