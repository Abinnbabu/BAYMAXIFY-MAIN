const router         = require("express").Router();
const auth           = require("../middleware/auth");
const ChatSession    = require("../models/ChatSession");
const chatWithGemini = require("../utils/geminiChat");

/* ─────────────────────────────────────────────────────────────────
   POST /api/chat/message
   Body: { message, sessionId? }
───────────────────────────────────────────────────────────────── */
router.post("/message", auth, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim())
      return res.status(400).json({ message: "Message cannot be empty" });

    /* Load or create session */
    let session = null;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, userId });
    }
    if (!session) {
      session = await ChatSession.create({ userId, messages: [] });
    }

    /* Build Gemini-format history */
    const geminiHistory = session.messages.map((m) => ({
      role:  m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    /* Call Gemini */
    const reply = await chatWithGemini(geminiHistory, message.trim());

    /* Save both messages */
    session.messages.push(
      { role: "user",      content: message.trim(), timestamp: new Date() },
      { role: "assistant", content: reply,           timestamp: new Date() }
    );
    session.lastActive = new Date();
    await session.save();

    res.json({ reply, sessionId: session._id });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ message: "Chat failed. Please try again." });
  }
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/chat/sessions
   Returns past sessions for the logged-in user
───────────────────────────────────────────────────────────────── */
router.get("/sessions", auth, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user.id })
      .sort({ lastActive: -1 })
      .limit(20)
      .select("_id startedAt lastActive messages");

    const previews = sessions.map((s) => ({
      id:           s._id,
      startedAt:    s.startedAt,
      lastActive:   s.lastActive,
      preview:      s.messages[0]?.content?.substring(0, 60) || "New conversation",
      messageCount: s.messages.length,
    }));

    res.json(previews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/chat/sessions/:sessionId
───────────────────────────────────────────────────────────────── */
router.get("/sessions/:sessionId", auth, async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      _id:    req.params.sessionId,
      userId: req.user.id,
    });
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   DELETE /api/chat/sessions/:sessionId
───────────────────────────────────────────────────────────────── */
router.delete("/sessions/:sessionId", auth, async (req, res) => {
  try {
    await ChatSession.findOneAndDelete({ _id: req.params.sessionId, userId: req.user.id });
    res.json({ message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;