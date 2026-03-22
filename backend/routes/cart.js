const router = require("express").Router();
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const CartOrder = require("../models/CartOrder");
const Medicine = require("../models/Medicine");

function patientUserId(req) {
  const id = req.user.id;
  if (!id || id === "admin" || !mongoose.Types.ObjectId.isValid(id)) return null;
  return id;
}

router.post("/add", auth, async (req, res) => {
  try {
    const uid = patientUserId(req);
    if (!uid) return res.status(400).json({ message: "Cart requires a patient account" });
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "items array required" });

    const lineItems = [];
    let total = 0;
    for (const row of items) {
      const medicineId = row.medicineId;
      const qty = Math.max(1, parseInt(row.qty, 10) || 0);
      if (!mongoose.Types.ObjectId.isValid(medicineId)) continue;
      const med = await Medicine.findById(medicineId);
      if (!med || med.status === "out_of_stock") continue;
      lineItems.push({
        medicineId: med._id,
        name: med.name,
        price: med.price,
        qty,
      });
      total += med.price * qty;
    }
    if (!lineItems.length)
      return res.status(400).json({ message: "No valid medicines in cart" });

    const order = await CartOrder.create({ userId: uid, items: lineItems, total });
    res.status(201).json(order);
  } catch (e) {
    console.error("cart/add:", e);
    res.status(500).json({ message: e.message });
  }
});

router.get("/my-orders", auth, async (req, res) => {
  try {
    const uid = patientUserId(req);
    if (!uid) return res.json([]);
    const orders = await CartOrder.find({ userId: uid })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(orders);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
