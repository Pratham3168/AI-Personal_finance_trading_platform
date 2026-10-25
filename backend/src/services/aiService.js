// Gemini version of the AI service. Same exports as before, so the controller does not change.
const { GoogleGenAI } = require('@google/genai');

const httpError = (status, message) => Object.assign(new Error(message), { status });

let client = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) throw httpError(500, 'GEMINI_API_KEY is not set in .env');
  if (!client) {
    client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { timeout: 60000 },
    });
  }
  return client;
}

const SYSTEM_PROMPT = `You are a careful, supportive personal finance coach inside a budgeting app.
You receive one user's monthly figures as JSON. All calculations were already done by the app.

Rules:
- Use ONLY the numbers provided. Never invent figures and never recalculate totals.
- Mention amounts with the currency given in the data.
- Be specific: refer to real categories and amounts from the data.
- If "previousMonth" is present, compare with it. If it is null, do not mention any comparison.
- Do not recommend specific stocks, funds or securities. Give general budgeting and saving guidance only.
- Be non-judgmental and practical.
- Respond with ONE JSON object and nothing else, in exactly this shape:
{
  "overview": "2-3 sentence summary of the month",
  "financialHealth": { "rating": "excellent | good | fair | needs_attention", "reason": "one sentence" },
  "keyInsights": ["3-5 short insights based on the data"],
  "overspendingAreas": [{ "category": "name", "observation": "why it stands out" }],
  "suggestions": ["3-5 specific, actionable suggestions for next month"],
  "savingsTip": "one concrete tip to improve the savings rate"
}`;

// Removes ```json fences if the model adds them
const stripFences = (t) => t.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Temporary Google-side problems: worth retrying
const isTransient = (err) => [500, 502, 503, 504].includes(err.status);

// Tries one model up to 3 times (waits 1s, then 2s between tries) when Google is overloaded
async function callModel(model, payload) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await getClient().models.generateContent({
        model,
        contents: JSON.stringify(payload),
        config: { systemInstruction: SYSTEM_PROMPT, responseMimeType: 'application/json' },
      });
    } catch (err) {
      lastErr = err;
      console.error(`Gemini error (${model}, attempt ${attempt}):`, err.status, String(err.message).slice(0, 120));
      if (!isTransient(err) || attempt === 3) break;
      await sleep(attempt * 1000);
    }
  }
  throw lastErr;
}

exports.analyseSpending = async (payload) => {
  const primary = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const fallback = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite';

  let response;
  let usedModel = primary;
  try {
    try {
      response = await callModel(primary, payload);
    } catch (err) {
      // Busy, quota or missing model: try the fallback model once before giving up
      const canFallback = fallback && fallback !== primary && (isTransient(err) || err.status === 429 || err.status === 404);
      if (!canFallback) throw err;
      console.log(`Primary model failed, trying fallback model: ${fallback}`);
      try {
        response = await callModel(fallback, payload);
        usedModel = fallback;
      } catch (fbErr) {
        // If the backup model itself is unavailable, report the ORIGINAL problem, not the backup's
        console.error(`Fallback model ${fallback} also failed:`, fbErr.status);
        throw fbErr.status === 404 ? err : fbErr;
      }
    }
  } catch (err) {
    const detail = process.env.NODE_ENV === 'production' ? '' : ` (${err.message})`;
    const msg = String(err.message || '').toLowerCase();
    if (err.status === 401 || err.status === 403 || (err.status === 400 && msg.includes('api key'))) {
      throw httpError(502, `AI service rejected the API key${detail}`);
    }
    if (err.status === 404) throw httpError(502, `AI model not available. Change GEMINI_MODEL in .env${detail}`);
    if (err.status === 429) throw httpError(503, `AI free-tier quota exceeded. Wait a minute and try again${detail}`);
    if (isTransient(err)) throw httpError(503, `The AI service is overloaded right now. Please try again in a minute${detail}`);
    throw httpError(502, `AI analysis failed${detail}`);
  }

  const text = response.text || '';
  if (!text) throw httpError(502, 'AI returned an empty response (it may have been blocked). Try again.');

  let analysis;
  try {
    analysis = JSON.parse(stripFences(text));
  } catch {
    analysis = { raw: text }; // fall back to plain text if the model did not return valid JSON
  }
  return { analysis, model: usedModel, usage: response.usageMetadata || null };
};
