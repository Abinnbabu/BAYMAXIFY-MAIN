const router         = require("express").Router();
const mongoose       = require("mongoose");
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
    const userId = String(req.user.id);

    if (!message || !message.trim())
      return res.status(400).json({ message: "Message cannot be empty" });

    /* Load or create session */
    let session = null;
    if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
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
    console.error("Chat error:", err);
    const raw = String(err?.message || err || "");
    let msg = "Chat failed. Please try again.";
    if (raw.includes("GEMINI_API_KEY") || /GEMINI_API_KEY is not set/i.test(raw)) {
      msg = "Chat service is not configured (missing GEMINI_API_KEY in backend/.env).";
    } else if (err?.status === 429 || /\b429\b|quota exceeded|exceeded your current quota/i.test(raw)) {
      msg =
        "Gemini free tier hit its rate or daily limit (429). Wait a few minutes and retry, try GEMINI_MODEL=gemini-2.5-flash or gemini-1.5-flash in backend/.env, or enable billing in Google AI Studio. Details: https://ai.google.dev/gemini-api/docs/rate-limits";
    } else if (/leaked|reported as leaked/i.test(raw)) {
      msg =
        "Google disabled this API key (it was exposed publicly). Create a new key at https://aistudio.google.com/apikey , set GEMINI_API_KEY in backend/.env, restart the server, and never commit or share that key.";
    } else if (err?.status === 403 || /\b403\b.*[Aa][Pp][Ii] key|Forbidden/i.test(raw)) {
      msg =
        "Gemini API rejected the key (403). Check GEMINI_API_KEY in backend/.env or create a new key in Google AI Studio.";
    } else if (/Requested entity was not found|is not supported for generateContent|No such model/i.test(raw)) {
      msg = "Chat model unavailable. Set GEMINI_MODEL in backend/.env or check API access.";
    }
    res.status(500).json({ message: msg });
  }
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/chat/sessions
   Returns past sessions for the logged-in user
───────────────────────────────────────────────────────────────── */
router.get("/sessions", auth, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: String(req.user.id) })
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
      userId: String(req.user.id),
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
    await ChatSession.findOneAndDelete({
      _id: req.params.sessionId,
      userId: String(req.user.id),
    });
    res.json({ message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;