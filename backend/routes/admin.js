const router = require("express").Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const auth = require("../middleware/auth");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Medicine = require("../models/Medicine");
const Prescription = require("../models/Prescription");
const Appointment = require("../models/Appointment");

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

function doctorToJSON(doc) {
  const o = doc.toObject ? doc.toObject() : { ...doc };
  o.loginEmail = o.userId?.email || "";
  return o;
}

router.use(auth);
router.use(requireAdmin);

/* ══════════════════════════════════════════════════════════════════
   DOCTORS
══════════════════════════════════════════════════════════════════ */

router.get("/doctors", async (req, res) => {
  try {
    const list = await Doctor.find()
      .sort({ createdAt: -1 })
      .populate("userId", "email name role");
    res.json(list.map((d) => doctorToJSON(d)));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * Create doctor profile + User account (email/password) for login → /doctorpage
 */
router.post("/doctors", async (req, res) => {
  try {
    const {
      name,
      specialty,
      location,
      phone,
      rating,
      status,
      email,
      password,
    } = req.body;

    if (!name?.trim() || !specialty?.trim()) {
      return res.status(400).json({ message: "Name and specialty are required" });
    }
    if (!email?.trim() || !password || password.length < 6) {
      return res.status(400).json({
        message: "Doctor login email and password (min 6 characters) are required",
      });
    }

    const em = email.toLowerCase().trim();
    if (await User.findOne({ email: em })) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: em,
      password: hashed,
      role: "doctor",
    });

    const doc = await Doctor.create({
      name: name.trim(),
      specialty: specialty.trim(),
      location: (location || "").trim(),
      phone: (phone || "").trim(),
      rating: Number(rating) || 4.5,
      reviews: 0,
      status: status === "inactive" ? "inactive" : "active",
      userId: user._id,
    });

    const populated = await Doctor.findById(doc._id).populate(
      "userId",
      "email name role"
    );
    res.status(201).json(doctorToJSON(populated));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put("/doctors/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid doctor id" });
    }
    const doc = await Doctor.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Doctor not found" });

    const {
      name,
      specialty,
      location,
      phone,
      rating,
      status,
      email,
      password,
    } = req.body;

    if (name !== undefined) doc.name = String(name).trim();
    if (specialty !== undefined) doc.specialty = String(specialty).trim();
    if (location !== undefined) doc.location = String(location || "").trim();
    if (phone !== undefined) doc.phone = String(phone || "").trim();
    if (rating !== undefined) doc.rating = Number(rating) || doc.rating;
    if (status === "active" || status === "inactive") doc.status = status;

    /* Legacy doctor row with no login — create User when email + password supplied */
    if (!doc.userId && email?.trim() && password && String(password).length >= 6) {
      const em = String(email).toLowerCase().trim();
      if (await User.findOne({ email: em })) {
        return res.status(400).json({ message: "Email already registered" });
      }
      const hashed = await bcrypt.hash(String(password), 10);
      const user = await User.create({
        name: doc.name,
        email: em,
        password: hashed,
        role: "doctor",
      });
      doc.userId = user._id;
    }

    await doc.save();

    if (doc.userId) {
      const user = await User.findById(doc.userId);
      if (user && user.role === "doctor") {
        if (name !== undefined) user.name = doc.name;
        if (email !== undefined && String(email).trim()) {
          const em = String(email).toLowerCase().trim();
          const taken = await User.findOne({
            email: em,
            _id: { $ne: user._id },
          });
          if (taken) {
            return res.status(400).json({ message: "Email already in use" });
          }
          user.email = em;
        }
        if (password && String(password).length >= 6) {
          user.password = await bcrypt.hash(String(password), 10);
        }
        await user.save();
      }
    }

    const populated = await Doctor.findById(doc._id).populate(
      "userId",
      "email name role"
    );
    res.json(doctorToJSON(populated));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.patch("/doctors/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const doc = await Doctor.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("userId", "email name role");
    if (!doc) return res.status(404).json({ message: "Doctor not found" });
    res.json(doctorToJSON(doc));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete("/doctors/:id", async (req, res) => {
  try {
    const doc = await Doctor.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Doctor not found" });

    await Prescription.deleteMany({ doctorId: doc._id });
    await Appointment.deleteMany({ doctorId: doc._id });

    const uid = doc.userId;
    await Doctor.deleteOne({ _id: doc._id });

    if (uid) {
      const u = await User.findById(uid);
      if (u && u.role === "doctor") await User.deleteOne({ _id: uid });
    }

    res.json({ message: "Doctor removed" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/* ══════════════════════════════════════════════════════════════════
   MEDICINES
══════════════════════════════════════════════════════════════════ */

router.get("/medicines", async (req, res) => {
  try {
    const list = await Medicine.find().sort({ name: 1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/medicines", async (req, res) => {
  try {
    const { name, category, price, stock, status, isPrescribed, color, shape } =
      req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Name required" });

    const m = await Medicine.create({
      name: name.trim(),
      category: category || "General",
      price: Number(price) || 0,
      stock: parseInt(stock, 10) || 0,
      status: ["available", "low_stock", "out_of_stock"].includes(status)
        ? status
        : "available",
      isPrescribed: Boolean(isPrescribed),
      color: color?.trim() || "#6366F1",
      shape: ["tablet", "capsule", "softgel"].includes(shape) ? shape : "tablet",
    });
    res.status(201).json(m);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put("/medicines/:id", async (req, res) => {
  try {
    const m = await Medicine.findById(req.params.id);
    if (!m) return res.status(404).json({ message: "Medicine not found" });

    const { name, category, price, stock, status, isPrescribed, color, shape } =
      req.body;

    if (name !== undefined) m.name = String(name).trim();
    if (category !== undefined) m.category = String(category || "General");
    if (price !== undefined) m.price = Number(price) || 0;
    if (stock !== undefined) m.stock = parseInt(stock, 10) || 0;
    if (["available", "low_stock", "out_of_stock"].includes(status)) {
      m.status = status;
    }
    if (isPrescribed !== undefined) m.isPrescribed = Boolean(isPrescribed);
    if (color !== undefined) m.color = String(color).trim() || m.color;
    if (shape !== undefined && ["tablet", "capsule", "softgel"].includes(shape)) {
      m.shape = shape;
    }
    await m.save();
    res.json(m);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete("/medicines/:id", async (req, res) => {
  try {
    const r = await Medicine.deleteOne({ _id: req.params.id });
    if (r.deletedCount === 0) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Medicine removed" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
