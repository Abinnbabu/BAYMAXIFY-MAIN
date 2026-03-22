const router = require("express").Router();
const Medicine = require("../models/Medicine");

/* GET /api/medicines — public catalogue for medicine store */
router.get("/", async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ name: 1 });
    res.json(medicines);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
