const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyse a wellness survey response and return severity + recommendations.
 * @param {{ emotions, trigger, intensity, impact, notes }} data
 * @returns {{ severity, summary, consultType, urgency, recommendedSpecialties }}
 */
async function analyzeSurvey({ emotions, trigger, intensity, impact, notes }) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are a mental health triage assistant. Analyze this wellness check-in 
and respond ONLY with a valid JSON object — no markdown, no explanation, no backticks.

Survey data:
- Emotions felt: ${emotions.join(", ") || "None selected"}
- Primary trigger: ${trigger}
- Intensity (1-10): ${intensity}
- Impact on user: ${impact}
- User's own note: "${notes || "None"}"

Return this exact JSON structure:
{
  "severity": "stable|mild|moderate|critical",
  "summary": "2-3 sentence plain English assessment of the person's mental state",
  "consultType": "online|offline|immediate",
  "urgency": "short urgency label like: When convenient / Within 1-2 weeks / This week / Today",
  "recommendedSpecialties": ["specialty1", "specialty2"]
}

Rules:
- severity=critical if intensity >= 8 or user mentions self-harm/hopelessness
- severity=moderate if intensity >= 6 or 2+ negative emotions
- severity=mild if intensity >= 4 or 1 negative emotion  
- severity=stable otherwise
- consultType=immediate for critical, offline for moderate, online for mild/stable`;

  const result = await model.generateContent(prompt);
  const raw    = result.response.text().trim();

  // Strip markdown fences if model accidentally includes them
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Fallback if JSON parse fails
    return {
      severity:               "mild",
      summary:                "We noticed some emotional strain in your responses. Consider speaking with a professional.",
      consultType:            "online",
      urgency:                "When convenient",
      recommendedSpecialties: ["Anxiety Specialist", "Behavioral Therapy"],
    };
  }
}

module.exports = analyzeSurvey;