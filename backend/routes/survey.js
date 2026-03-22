const router        = require("express").Router();
const auth          = require("../middleware/auth");
const SurveyCheckIn = require("../models/SurveyCheckIn");
const Doctor        = require("../models/Doctor");
const analyzeSurvey = require("../utils/analyzeSurvey");

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Active doctors whose specialty matches AI recommendations (exact, then substring / case-insensitive). */
async function findDoctorsMatchingSpecialties(recommendedSpecialties) {
  const specs = (recommendedSpecialties || [])
    .map((s) => String(s).trim())
    .filter(Boolean);
  if (!specs.length) return [];

  let doctors = await Doctor.find({
    specialty: { $in: specs },
    status:    "active",
  })
    .sort({ rating: -1 })
    .limit(12);

  if (!doctors.length) {
    doctors = await Doctor.find({
      $and: [
        { status: "active" },
        {
          $or: specs.map((s) => ({
            specialty: { $regex: escapeRegExp(s), $options: "i" },
          })),
        },
      ],
    })
      .sort({ rating: -1 })
      .limit(12);
  }

  return doctors;
}

/* ─────────────────────────────────────────────────────────────────
   POST /api/survey/checkin
   Body: { emotions, trigger, intensity, impact, notes }
───────────────────────────────────────────────────────────────── */
router.post("/checkin", auth, async (req, res) => {
  try {
    const { emotions, trigger, intensity, impact, notes } = req.body;
    const userId = String(req.user.id);

    /* 1 — AI analysis via Gemini */
    const analysis = await analyzeSurvey({ emotions, trigger, intensity, impact, notes });

    /* 2 — Active doctors in DB matching recommended specialties */
    const doctors = await findDoctorsMatchingSpecialties(analysis.recommendedSpecialties);

    /* 3 — Save check-in to database */
    const checkIn = await SurveyCheckIn.create({
      userId,
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
    console.error("Survey error:", err);
    res.status(500).json({ message: err.message || "Check-in failed" });
  }
});

/* ─────────────────────────────────────────────────────────────────
   GET /api/survey/history
   Returns last 10 check-ins for the user (for wellness dashboard)
───────────────────────────────────────────────────────────────── */
router.get("/history", auth, async (req, res) => {
  try {
    const history = await SurveyCheckIn.find({ userId: String(req.user.id) })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;