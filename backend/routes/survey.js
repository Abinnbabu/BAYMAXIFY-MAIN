const router        = require("express").Router();
const auth          = require("../middleware/auth");
const SurveyCheckIn = require("../models/SurveyCheckIn");
const Doctor        = require("../models/Doctor");
const analyzeSurvey = require("../utils/analyzeSurvey");

/* ─────────────────────────────────────────────────────────────────
   POST /api/survey/checkin
   Body: { emotions, trigger, intensity, impact, notes }
───────────────────────────────────────────────────────────────── */
router.post("/checkin", auth, async (req, res) => {
  try {
    const { emotions, trigger, intensity, impact, notes } = req.body;

    /* 1 — AI analysis via Gemini */
    const analysis = await analyzeSurvey({ emotions, trigger, intensity, impact, notes });

    /* 2 — Find matching doctors from DB */
    const doctors = await Doctor.find({
      specialty: { $in: analysis.recommendedSpecialties || [] },
      status:    "active",
    }).limit(3);

    /* 3 — Save check-in to database */
    const checkIn = await SurveyCheckIn.create({
      userId:     req.user.id,
      emotions,
      trigger,
      intensity,
      impact,
      notes,
      severity:   analysis.severity,
      aiSummary:  analysis.summary,
      consultType: analysis.consultType,
      urgency:    analysis.urgency,
      doctorRecommendations: doctors.map((d) => ({
        name:      d.name,
        specialty: d.specialty,
        mode:      analysis.consultType,
      })),
    });

    res.json({
      severity:    analysis.severity,
      summary:     analysis.summary,
      consultType: analysis.consultType,
      urgency:     analysis.urgency,
      doctors,
      checkInId:   checkIn._id,
    });
  } catch (err) {
    console.error("Survey error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/survey/history
   Returns last 10 check-ins for the user (for wellness dashboard)
───────────────────────────────────────────────────────────────── */
router.get("/history", auth, async (req, res) => {
  try {
    const history = await SurveyCheckIn.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;