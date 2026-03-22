const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  specialty: { type: String, required: true },
  location:  { type: String, default: "" },
  phone:     { type: String, default: "" },
  rating:    { type: Number, default: 4.5 },
  reviews:   { type: Number, default: 0 },
  status:    { type: String, enum: ["active", "inactive"], default: "active" },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Doctor", doctorSchema);