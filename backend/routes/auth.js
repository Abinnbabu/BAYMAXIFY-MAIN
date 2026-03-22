const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const Doctor  = require("../models/Doctor");

const makeToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

/* ─────────────────────────────────────────────────────────────────
   POST /api/auth/register
   Body: { name, email, password }
───────────────────────────────────────────────────────────────── */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({ name, email: email.toLowerCase(), password: hashed });

    const token = makeToken({ id: user._id, name: user.name, role: user.role });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   POST /api/auth/login
   Body: { email, password }
───────────────────────────────────────────────────────────────── */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    /* ── Hardcoded Admin check ── */
    if (
      email    === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = makeToken({ id: "admin", name: "Admin", role: "admin" });
      return res.json({
        token,
        user: { id: "admin", name: "Admin", email: process.env.ADMIN_EMAIL, role: "admin" },
      });
    }

    /* ── Regular user / doctor ── */
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    // If user is a doctor, attach doctorId
    let doctorId = null;
    if (user.role === "doctor") {
      const doc = await Doctor.findOne({ userId: user._id });
      doctorId  = doc?._id || null;
    }

    const token = makeToken({
      id:       user._id,
      name:     user.name,
      role:     user.role,
      doctorId: doctorId,
    });

    res.json({
      token,
      user: {
        id:       user._id,
        name:     user.name,
        email:    user.email,
        role:     user.role,
        doctorId: doctorId,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;