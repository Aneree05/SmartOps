// testSocket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.emit("joinConversation", "69e0c630c7a4ce41af53e374");

socket.on("receiveMessage", (data) => {
  console.log("Received:", data);
});