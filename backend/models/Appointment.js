const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User",   required: true },
  doctorId:  { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  type:      { type: String, enum: ["online", "offline"], required: true },
  date:      { type: String, default: "" },
  time:      { type: String, default: "" },
  status:    { type: String, enum: ["waiting", "scheduled", "completed", "cancelled"], default: "scheduled" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Appointment", appointmentSchema);