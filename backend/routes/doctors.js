const router    = require("express").Router();
const auth      = require("../middleware/auth");
const doctorOnly = require("../middleware/doctorOnly");
const Doctor    = require("../models/Doctor");
const Appointment = require("../models/Appointment");

/* ─────────────────────────────────────────────────────────────────
   GET /api/doctors
   Public — list all active doctors
───────────────────────────────────────────────────────────────── */
router.get("/", async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: "active" });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/doctors/me
   Doctor views their own profile
───────────────────────────────────────────────────────────────── */
router.get("/me", auth, doctorOnly, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/doctors/appointments/online
   Doctor — get their online (waiting/in-session) appointments
───────────────────────────────────────────────────────────────── */
router.get("/appointments/online", auth, doctorOnly, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

    const appointments = await Appointment.find({
      doctorId: doctor._id,
      type:     "online",
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/doctors/appointments/offline
   Doctor — get their offline scheduled appointments
───────────────────────────────────────────────────────────────── */
router.get("/appointments/offline", auth, doctorOnly, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

    const appointments = await Appointment.find({
      doctorId: doctor._id,
      type:     "offline",
    })
      .populate("userId", "name email")
      .sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   PATCH /api/doctors/appointments/:id/status
   Doctor — mark appointment as completed / update status
   Body: { status }
───────────────────────────────────────────────────────────────── */
router.patch("/appointments/:id/status", auth, doctorOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const apt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("userId", "name email");

    if (!apt) return res.status(404).json({ message: "Appointment not found" });
    res.json(apt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;