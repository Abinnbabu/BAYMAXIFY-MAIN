const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Tried in order until one works. Google AI Studio keys often only expose a subset.
 * Override with GEMINI_MODEL in .env to force a specific model.
 */
function modelCandidates() {
  const fromEnv = process.env.GEMINI_MODEL?.trim();
  /* Order: try 2.5 before 2.0 — free-tier quotas are per-model; one may be exhausted while another works */
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

/** True when trying another model id might help (not auth, quota, or bad request body) */
function isLikelyWrongModelError(err) {
  const m = errText(err);
  return /404|Requested entity was not found|No such model|is not supported for generateContent|model[\s`']+[\w.-]+[\s`']*(is not|not found|invalid)/i.test(
    m
  );
}

/** Key invalid, leaked, or forbidden — retrying other model names will not help */
function isAuthOrKeyError(err) {
  const m = errText(err);
  if (err?.status === 403 || err?.status === 401) return true;
  return /\b403\b|\b401\b|Forbidden|PERMISSION_DENIED|API key|leaked|invalid.*key|API_KEY_INVALID/i.test(m);
}

/** Free tier / RPM limits are often per model — try the next candidate */
function isQuotaOrRateLimitError(err) {
  if (err?.status === 429) return true;
  const m = errText(err);
  return /\b429\b|Too Many Requests|quota exceeded|exceeded your current quota|RESOURCE_EXHAUSTED|rate.?limit/i.test(m);
}

const SYSTEM_PROMPT = `You are Baymax, a warm, empathetic mental health support companion 
built into the Baymaxify app. Your role is to:

- Listen actively and respond with genuine empathy
- Ask gentle follow-up questions to understand the user better
- Offer calm, supportive, evidence-based coping strategies
- Suggest breathing exercises, grounding techniques, or journaling when relevant
- NEVER diagnose or prescribe medication
- If the user expresses thoughts of self-harm or suicide, ALWAYS respond with:
  "I hear you, and I'm deeply concerned. Please call iCall at 9152987821 right now — you matter."
- Keep responses concise — 2 to 4 sentences unless the user needs more
- Use warm, simple language. No medical jargon.
- Always end with a gentle open-ended question to keep the conversation going
- You are a supportive companion, not a replacement for professional help`;

function extractReplyText(result) {
  try {
    const t = result.response.text();
    if (t && String(t).trim()) return String(t).trim();
  } catch (_) {
    /* fall through to candidates / safety */
  }
  const c = result.response?.candidates?.[0];
  const parts = c?.content?.parts;
  if (parts?.length) {
    const joined = parts.map((p) => p.text || "").join("").trim();
    if (joined) return joined;
  }
  const block = result.response?.promptFeedback?.blockReason;
  if (block) {
    return "I'm sorry — I couldn't respond to that. Could you try rephrasing in a different way?";
  }
  throw new Error("Model returned no text (blocked or empty response)");
}

/**
 * @param {Array} history  - [{ role: "user"|"model", parts: [{ text }] }]
 * @param {string} userMessage
 * @returns {string} reply text
 */
async function chatWithGemini(history, userMessage) {
  const genAI = getGenAI();
  const candidates = modelCandidates();
  let lastErr;

  for (const modelName of candidates) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT,
      });

      const chat = model.startChat({
        history,
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.75,
          topP: 0.9,
        },
      });

      const result = await chat.sendMessage(userMessage);
      return extractReplyText(result);
    } catch (err) {
      lastErr = err;
      if (isAuthOrKeyError(err)) throw err;
      const idx = candidates.indexOf(modelName);
      const hasNext = idx < candidates.length - 1;
      if (hasNext && (isLikelyWrongModelError(err) || isQuotaOrRateLimitError(err))) {
        console.warn(
          `[geminiChat] Model "${modelName}" failed (${err?.status || "?"}): ${errText(err).slice(0, 200)}… trying next model`
        );
        continue;
      }
      throw err;
    }
  }

  throw lastErr || new Error("No Gemini model could be reached");
}

module.exports = chatWithGemini;
