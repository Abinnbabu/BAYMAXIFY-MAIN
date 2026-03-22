const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
require("dotenv").config();

const app = express();

/* ─── Middleware ─────────────────────────────────────────────────────────────── */
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
}));
app.use(express.json());

/* ─── Routes ─────────────────────────────────────────────────────────────────── */
app.use("/api/auth",          require("./routes/auth"));
app.use("/api/chat",          require("./routes/chat"));
app.use("/api/survey",        require("./routes/survey"));
app.use("/api/doctors",       require("./routes/doctors"));
app.use("/api/appointments",  require("./routes/appointments"));
app.use("/api/prescriptions", require("./routes/prescriptions"));
app.use("/api/medicines",     require("./routes/medicines"));
app.use("/api/cart",          require("./routes/cart"));
app.use("/api/admin",         require("./routes/admin"));
app.use("/api/profile",       require("./routes/profile"));

/* ─── Health check ───────────────────────────────────────────────────────────── */
app.get("/api/health", (req, res) => res.json({ status: "ok", message: "Baymaxify backend running" }));

/* ─── MongoDB + Start ────────────────────────────────────────────────────────── */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅  MongoDB connected");
    app.listen(process.env.PORT || 5000, () =>
      console.log(`🚀  Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => {
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1);
  });