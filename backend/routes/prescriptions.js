const router = require("express").Router();
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const Prescription = require("../models/Prescription");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const generatePrescriptionPDF = require("../utils/generatePDF");

function userObjectId(req) {
  const id = req.user.id;
  if (!id || id === "admin" || !mongoose.Types.ObjectId.isValid(id)) return null;
  return id;
}

/* ── GET /api/prescriptions/my (patient) ─────────────────────────── */
router.get("/my", auth, async (req, res) => {
  try {
    const uid = userObjectId(req);
    if (!uid) return res.json([]);
    const list = await Prescription.find({ userId: uid })
      .sort({ createdAt: -1 })
      .populate("doctorId", "name specialty location phone");
    res.json(list);
  } catch (e) {
    console.error("prescriptions/my:", e);
    res.status(500).json({ message: e.message });
  }
});

/* ── GET /api/prescriptions/doctor/my-patients ───────────────────── */
router.get("/doctor/my-patients", auth, async (req, res) => {
  try {
    if (req.user.role !== "doctor")
      return res.status(403).json({ message: "Doctors only" });
    const doc = await Doctor.findOne({ userId: req.user.id });
    if (!doc) return res.json([]);
    const list = await Prescription.find({ doctorId: doc._id })
      .sort({ createdAt: -1 })
      .populate("userId", "name email");
    res.json(list);
  } catch (e) {
    console.error("prescriptions/doctor/my-patients:", e);
    res.status(500).json({ message: e.message });
  }
});

/* ── POST /api/prescriptions (doctor writes Rx) ────────────────── */
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "doctor")
      return res.status(403).json({ message: "Doctors only" });
    const { patientId, diagnosis, medicines, remark } = req.body;
    if (!patientId || !Array.isArray(medicines) || medicines.length === 0)
      return res.status(400).json({ message: "patientId and medicines required" });
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) return res.status(400).json({ message: "Doctor profile not found" });
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "user")
      return res.status(400).json({ message: "Invalid patient" });

    const rx = await Prescription.create({
      userId: patientId,
      doctorId: doctor._id,
      diagnosis: diagnosis || "",
      medicines,
      remark: remark || "",
    });
    const populated = await Prescription.findById(rx._id)
      .populate("doctorId", "name specialty location phone")
      .populate("userId", "name email");
    res.status(201).json(populated);
  } catch (e) {
    console.error("prescriptions POST:", e);
    res.status(500).json({ message: e.message });
  }
});

/* ── GET /api/prescriptions/:id/pdf ────────────────────────────── */
router.get("/:id/pdf", auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "Invalid id" });
    const rx = await Prescription.findById(req.params.id)
      .populate("doctorId", "name specialty location phone")
      .populate("userId", "name email");
    if (!rx) return res.status(404).json({ message: "Not found" });

    const uid = userObjectId(req);
    const patientIdStr = rx.userId?._id?.toString() || rx.userId?.toString();
    const isOwner = uid && patientIdStr === uid.toString();
    let isDoctor = false;
    if (req.user.role === "doctor") {
      const doc = await Doctor.findOne({ userId: req.user.id });
      if (doc && rx.doctorId?._id?.equals(doc._id)) isDoctor = true;
    }
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isDoctor && !isAdmin)
      return res.status(403).json({ message: "Forbidden" });

    generatePrescriptionPDF(res, rx);
  } catch (e) {
    console.error("prescriptions pdf:", e);
    res.status(500).json({ message: e.message });
  }
});

/* ── GET /api/prescriptions/:id ────────────────────────────────── */
router.get("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "Invalid id" });
    const rx = await Prescription.findById(req.params.id)
      .populate("doctorId", "name specialty location phone")
      .populate("userId", "name email");
    if (!rx) return res.status(404).json({ message: "Not found" });

    const uid = userObjectId(req);
    const patientIdStr = rx.userId?._id?.toString() || rx.userId?.toString();
    const isOwner = uid && patientIdStr === uid.toString();
    let isDoctor = false;
    if (req.user.role === "doctor") {
      const doc = await Doctor.findOne({ userId: req.user.id });
      if (doc && rx.doctorId?._id?.equals(doc._id)) isDoctor = true;
    }
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isDoctor && !isAdmin)
      return res.status(403).json({ message: "Forbidden" });

    res.json(rx);
  } catch (e) {
    console.error("prescriptions/:id:", e);
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
