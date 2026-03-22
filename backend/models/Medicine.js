const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  category:     { type: String, default: "General" },
  price:        { type: Number, required: true },
  stock:        { type: Number, default: 0 },
  status:       { type: String, enum: ["available", "low_stock", "out_of_stock"], default: "available" },
  isPrescribed: { type: Boolean, default: false },
  createdAt:    { type: Date, default: Date.now },
});

module.exports = mongoose.model("Medicine", medicineSchema);