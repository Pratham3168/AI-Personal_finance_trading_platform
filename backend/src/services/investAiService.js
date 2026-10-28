// Gemini explanation for fit checks. Explains numbers only; never advises.
const { GoogleGenAI } = require('@google/genai');

const httpError = (status, message) => Object.assign(new Error(message), { status });
let client = null;
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) throw httpError(500, 'GEMINI_API_KEY is not set in .env');
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { timeout: 60000 } });
  return client;
};

const SYSTEM_PROMPT = `You explain the results of a personal-finance "fit check" to a retail user in India. The app already did all calculations.

Rules:
- Use ONLY the numbers and facts in the JSON. Never invent figures, prices, news or ratios. Do not recalculate.
- Do NOT say or imply buy, sell, hold, apply, avoid, "good", "bad", "worth it" or "suitable". Do not predict prices, give probabilities, or mention grey market premium.
- Describe which checks are "within" and "outside" the user's OWN settings, in plain language, using the amounts given.
- For "unknown" checks, say the data was not available.
- Mention that fees and tax are not included, that data has an "as of" date, and that prices can move either way.
- If the data source says MOCK/sample, say clearly this is sample data.
- Neutral, calm, short sentences.
Respond with ONE JSON object only, exactly in this shape:
{
  "summary": "2-3 sentences describing the situation",
  "withinYourLimits": ["short points"],
  "outsideYourLimits": ["short points"],
  "factsToKnow": ["short points from the facts given, e.g. recent move versus sector, dates, subscription"],
  "thingsToConsider": ["3-4 neutral questions the user may want to think about, e.g. holding period, spreading across companies"],
  "dataCaveats": ["short points"]
}`;

const ADVICE_RE = /(you should (buy|sell|invest|avoid|apply|hold)|i recommend|we recommend|buy now|sell now|good (buy|investment|choice)|bad (buy|investment|choice)|worth (buying|investing)|strong buy|guaranteed|will (rise|fall|go up|go down)|likely to (rise|fall|increase|decrease))/i;

const stripFences = (t) => t.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isTransient = (e) => [500, 502, 503, 504].includes(e.status);

async function callModel(model, payload) {
  let last;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await getClient().models.generateContent({
        model, contents: JSON.stringify(payload),
        config: { systemInstruction: SYSTEM_PROMPT, responseMimeType: 'application/json' },
      });
    } catch (err) {
      last = err;
      console.error(`Gemini error (${model}, attempt ${attempt}):`, err.status, String(err.message).slice(0, 120));
      if (!isTransient(err) || attempt === 3) break;
      await sleep(attempt * 1000);
    }
  }
  throw last;
}

exports.explainCheck = async (payload) => {
  const primary = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const fallback = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite';
  let response, used = primary;
  try {
    try {
      response = await callModel(primary, payload);
    } catch (err) {
      if (!(fallback && fallback !== primary && (isTransient(err) || err.status === 429 || err.status === 404))) throw err;
      try { response = await callModel(fallback, payload); used = fallback; }
      catch (fb) { throw fb.status === 404 ? err : fb; }
    }
  } catch (err) {
    const detail = process.env.NODE_ENV === 'production' ? '' : ` (${err.message})`;
    if (err.status === 401 || err.status === 403 || (err.status === 400 && /api key/i.test(err.message))) throw httpError(502, `AI service rejected the API key${detail}`);
    if (err.status === 429) throw httpError(503, `AI quota exceeded. Try again shortly${detail}`);
    if (isTransient(err)) throw httpError(503, `AI service is overloaded. Try again in a minute${detail}`);
    throw httpError(502, `AI explanation failed${detail}`);
  }

  const text = response.text || '';
  if (!text) throw httpError(502, 'AI returned an empty response');
  let analysis;
  try { analysis = JSON.parse(stripFences(text)); } catch { analysis = { raw: text }; }

  // Guardrail: withhold the text if it drifted into advice or prediction wording
  if (ADVICE_RE.test(JSON.stringify(analysis))) {
    console.warn('AI explanation withheld: advice-style wording detected');
    analysis = { summary: 'The AI explanation was withheld because it used advice-style wording. The numbers and checks above are unaffected.' };
  }
  return { analysis, model: used };
};
