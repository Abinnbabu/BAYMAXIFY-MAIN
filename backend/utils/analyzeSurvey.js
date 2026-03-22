const { GoogleGenerativeAI } = require("@google/generative-ai");

function modelCandidates() {
  const fromEnv = process.env.GEMINI_MODEL?.trim();
  const defaults = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-flash-latest",
  ];
  const list = fromEnv ? [fromEnv, ...defaults.filter((m) => m !== fromEnv)] : defaults;
  return [...new Set(list)];
}

function getGenAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !key.trim()) {
    throw new Error("GEMINI_API_KEY is not set in the backend environment");
  }
  return new GoogleGenerativeAI(key);
}

function errText(err) {
  if (!err) return "";
  if (typeof err === "string") return err;
  return [err.message, err.statusText, err.status, err.code].filter(Boolean).join(" ");
}

function isAuthOrKeyError(err) {
  const m = errText(err);
  if (err?.status === 403 || err?.status === 401) return true;
  return /\b403\b|\b401\b|Forbidden|PERMISSION_DENIED|leaked|invalid.*key/i.test(m);
}

function isQuotaOrRateLimitError(err) {
  if (err?.status === 429) return true;
  return /\b429\b|Too Many Requests|quota exceeded|exceeded your current quota/i.test(errText(err));
}

function isLikelyWrongModelError(err) {
  const m = errText(err);
  return /404|Requested entity was not found|No such model|is not supported for generateContent/i.test(m);
}

/**
 * Analyse a wellness survey response and return severity + recommendations.
 * @param {{ emotions, trigger, intensity, impact, notes }} data
 * @returns {{ severity, summary, consultType, urgency, recommendedSpecialties }}
 */
async function analyzeSurvey({ emotions, trigger, intensity, impact, notes }) {
  const emotionList = Array.isArray(emotions) ? emotions : [];
  const intensityNum = Number(intensity);
  const safeIntensity = Number.isFinite(intensityNum) ? intensityNum : 5;

  const prompt = `You are a mental health triage assistant. Analyze this wellness check-in 
and respond ONLY with a valid JSON object — no markdown, no explanation, no backticks.

Survey data:
- Emotions felt: ${emotionList.join(", ") || "None selected"}
- Primary trigger: ${trigger ?? "Not specified"}
- Intensity (1-10): ${safeIntensity}
- Impact on user: ${impact ?? "Not specified"}
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

  const genAI = getGenAI();
  const candidates = modelCandidates();
  let lastErr;

  for (const modelName of candidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      let raw;
      try {
        raw = result.response.text().trim();
      } catch (e) {
        const parts = result.response?.candidates?.[0]?.content?.parts;
        raw = parts?.map((p) => p.text || "").join("").trim() || "";
      }
      if (!raw) {
        throw new Error("Empty response from model");
      }

      const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

      try {
        return JSON.parse(cleaned);
      } catch {
        return {
          severity:               "mild",
          summary:                "We noticed some emotional strain in your responses. Consider speaking with a professional.",
          consultType:            "online",
          urgency:                "When convenient",
          recommendedSpecialties: ["Anxiety Specialist", "Behavioral Therapy"],
        };
      }
    } catch (err) {
      lastErr = err;
      if (isAuthOrKeyError(err)) throw err;
      const idx = candidates.indexOf(modelName);
      const hasNext = idx < candidates.length - 1;
      if (hasNext && (isLikelyWrongModelError(err) || isQuotaOrRateLimitError(err))) {
        console.warn(`[analyzeSurvey] Model "${modelName}" failed (${err?.status || "?"}), trying next…`);
        continue;
      }
      throw err;
    }
  }

  throw lastErr || new Error("No Gemini model could analyze the survey");
}

module.exports = analyzeSurvey;
