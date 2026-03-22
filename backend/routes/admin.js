const router = require("express").Router();
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const Doctor = require("../models/Doctor");
const Medicine = require("../models/Medicine");
const User = require("../models/User");

function adminOnly(req, res, next) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  next();
}

/* ═══ Doctors ═══════════════════════════════════════════════════ */

router.get("/doctors", auth, adminOnly, async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ name: 1 });
    res.json(doctors);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/doctors", auth, adminOnly, async (req, res) => {
  try {
    const { name, specialty, status, location, phone, rating } = req.body;
    if (!name?.trim() || !location?.trim())
      return res.status(400).json({ message: "Name and location are required" });
    const doc = await Doctor.create({
      name: name.trim(),
      specialty: specialty?.trim() || "General",
      status: status === "inactive" ? "inactive" : "active",
      location: location.trim(),
      phone: (phone || "").trim(),
      rating: parseFloat(rating) || 4.5,
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put("/doctors/:id", auth, adminOnly, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "Invalid id" });
    const { name, specialty, status, location, phone, rating } = req.body;
    const updates = {};
    if (name != null) updates.name = String(name).trim();
    if (specialty != null) updates.specialty = String(specialty).trim();
    if (status != null && ["active", "inactive"].includes(status)) updates.status = status;
    if (location != null) updates.location = String(location).trim();
    if (phone != null) updates.phone = String(phone).trim();
    if (rating != null) updates.rating = parseFloat(rating) || 0;
    const doc = await Doctor.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ message: "Doctor not found" });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.patch("/doctors/:id/status", auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status))
      return res.status(400).json({ message: "Invalid status" });
    const doc = await Doctor.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Doctor not found" });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete("/doctors/:id", auth, adminOnly, async (req, res) => {
  try {
    const r = await Doctor.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: "Doctor not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ═══ Medicines ═════════════════════════════════════════════════ */

router.get("/medicines", auth, adminOnly, async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ name: 1 });
    res.json(medicines);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/medicines", auth, adminOnly, async (req, res) => {
  try {
    const { name, category, price, stock, status, isPrescribed } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Medicine name is required" });
    const stockNum = parseInt(stock, 10);
    const stockSafe = Number.isFinite(stockNum) ? stockNum : 0;
    let st = status;
    if (!["available", "low_stock", "out_of_stock"].includes(st)) {
      if (stockSafe <= 0) st = "out_of_stock";
      else if (stockSafe < 10) st = "low_stock";
      else st = "available";
    }
    const m = await Medicine.create({
      name: name.trim(),
      category: category?.trim() || "General",
      price: parseFloat(price) || 0,
      stock: stockSafe,
      status: st,
      isPrescribed: Boolean(isPrescribed),
    });
    res.status(201).json(m);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put("/medicines/:id", auth, adminOnly, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "Invalid id" });
    const { name, category, price, stock, status, isPrescribed } = req.body;
    const updates = {};
    if (name != null) updates.name = String(name).trim();
    if (category != null) updates.category = String(category).trim();
    if (price != null) updates.price = parseFloat(price) || 0;
    if (stock != null) {
      const sn = parseInt(stock, 10);
      updates.stock = Number.isFinite(sn) ? sn : 0;
    }
    if (status != null && ["available", "low_stock", "out_of_stock"].includes(status))
      updates.status = status;
    if (isPrescribed != null) updates.isPrescribed = Boolean(isPrescribed);

    const m = await Medicine.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!m) return res.status(404).json({ message: "Medicine not found" });
    res.json(m);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete("/medicines/:id", auth, adminOnly, async (req, res) => {
  try {
    const r = await Medicine.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: "Medicine not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ═══ Users ═════════════════════════════════════════════════════ */

router.get("/users", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.patch("/users/:id/role", auth, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "doctor", "admin"].includes(role))
      return res.status(400).json({ message: "Invalid role" });
    const u = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select(
      "-password"
    );
    if (!u) return res.status(404).json({ message: "User not found" });
    res.json(u);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
