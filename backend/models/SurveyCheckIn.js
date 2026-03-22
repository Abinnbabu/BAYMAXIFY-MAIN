const mongoose = require("mongoose");

const surveySchema = new mongoose.Schema({
  /* String: supports Mongo user ids and admin JWT id "admin" */
  userId:    { type: String, required: true, index: true },
  emotions:  [String],
  trigger:   String,
  intensity: Number,
  impact:    String,
  notes:     String,
  severity:  { type: String, enum: ["stable", "mild", "moderate", "critical"] },
  aiSummary: String,
  consultType: String,
  urgency:   String,
  doctorRecommendations: [
    {
      name:      String,
      specialty: String,
      mode:      String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SurveyCheckIn", surveySchema);