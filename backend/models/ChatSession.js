const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role:      { type: String, enum: ["user", "assistant"], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const chatSessionSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  messages:   [messageSchema],
  startedAt:  { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
});

chatSessionSchema.index({ userId: 1, lastActive: -1 });

module.exports = mongoose.model("ChatSession", chatSessionSchema);