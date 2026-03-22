const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User",   required: true },
  doctorId:  { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  diagnosis: { type: String, default: "" },
  medicines: [
    {
      name:      String,
      days:      Number,
      frequency: String,
    },
  ],
  remark:    { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Prescription", prescriptionSchema);