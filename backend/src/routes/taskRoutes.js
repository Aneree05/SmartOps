import express from "express";
import {
  createTask,
  getTasks,
  moveTask,
} from "../controllers/taskController.js";

const router = express.Router();

router.post("/", createTask);
router.get("/", getTasks);
router.put("/:id/move", moveTask);

export default router;