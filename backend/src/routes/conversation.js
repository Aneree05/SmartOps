// routes/conversation.js
import express from "express";
import Conversation from "../models/Conversation.js";

const router = express.Router();

// create team chat
router.post("/", async (req, res) => {
  try {
    const { members, name } = req.body;

    const convo = new Conversation({ members, name });
    await convo.save();

    res.status(201).json(convo);
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;