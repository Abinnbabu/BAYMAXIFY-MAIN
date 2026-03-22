const mongoose = require("mongoose");

const cartOrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
      name:       String,
      price:      Number,
      qty:        Number,
    },
  ],
  total:     { type: Number, default: 0 },
  status:    { type: String, enum: ["pending", "confirmed", "delivered"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("CartOrder", cartOrderSchema);