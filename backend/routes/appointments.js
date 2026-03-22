
const router      = require("express").Router();
const auth        = require("../middleware/auth");
const Appointment = require("../models/Appointment");
const Doctor      = require("../models/Doctor");

/* ─────────────────────────────────────────────────────────────────
   POST /api/appointments/request
   Body: { doctorName, specialty, type, date, time, location }
───────────────────────────────────────────────────────────────── */
router.post("/request", auth, async (req, res) => {
  try {
    const { doctorName, type, date, time } = req.body;

    // Find the doctor by name
    const doctor = await Doctor.findOne({ name: doctorName });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const appointment = await Appointment.create({
      userId:   req.user.id,
      doctorId: doctor._id,
      type,
      date:     date || "",
      time:     time || "",
      status:   type === "online" ? "waiting" : "scheduled",
    });

    const populated = await appointment.populate([
      { path: "doctorId", select: "name specialty location" },
      { path: "userId",   select: "name email" },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/appointments/my
   User — get their own appointments
───────────────────────────────────────────────────────────────── */
router.get("/my", auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user.id })
      .populate("doctorId", "name specialty location")
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   PATCH /api/appointments/:id
   Update status
   Body: { status }
───────────────────────────────────────────────────────────────── */
router.patch("/:id", auth, async (req, res) => {
  try {
    const apt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!apt) return res.status(404).json({ message: "Appointment not found" });
    res.json(apt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;