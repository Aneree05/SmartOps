// routes/message.js
import express from "express";
import Message from "../models/Message.js";

const router = express.Router();

// send message
router.post("/", async (req, res) => {
  try {
    const message = new Message(req.body);
    await message.save();

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get messages
router.get("/:conversationId", async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;