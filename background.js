const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

const MIN_REQUEST_INTERVAL_MS = 4500;
const RATE_LIMIT_RETRY_MS = 30000;
const MAX_RETRIES = 2;

let lastRequestAt = 0;
let queueTail = Promise.resolve();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openPopup') {
    chrome.action.openPopup();
    sendResponse({ status: 'popup opened' });
    return;
  }

  if (request.action === 'solveQuestion') {
    enqueueGeminiCall(request.q)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message || String(err) }));
    return true;
  }
});

function enqueueGeminiCall(q) {
  const run = queueTail.then(async () => {
    const since = Date.now() - lastRequestAt;
    const wait = Math.max(0, MIN_REQUEST_INTERVAL_MS - since);
    if (wait > 0) await sleep(wait);
    try {
      return await callGeminiWithRetry(q, 0);
    } finally {
      lastRequestAt = Date.now();
    }
  });
  queueTail = run.catch(() => {});
  return run;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callGeminiWithRetry(q, attempt) {
  try {
    return await callGemini(q);
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    const is429 = msg.startsWith('HTTP 429');
    if (is429 && attempt < MAX_RETRIES) {
      console.warn('[Gemini] 429 rate-limited, retrying in', RATE_LIMIT_RETRY_MS, 'ms');
      await sleep(RATE_LIMIT_RETRY_MS);
      return callGeminiWithRetry(q, attempt + 1);
    }
    throw err;
  }
}

function getApiKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['geminiApiKey'], (data) => {
      if (!data.geminiApiKey) {
        reject(new Error('No Gemini API key set'));
      } else {
        resolve(data.geminiApiKey);
      }
    });
  });
}

function buildPrompt(q) {
  const optionsText = q.options
    .map((o) => o.letter + ') ' + o.text)
    .join('\n');
  const expectation =
    q.type === 'multi'
      ? 'There may be ONE OR MORE correct answers. Reply with all correct letters separated by commas (e.g. "a,c"). No explanation.'
      : 'There is exactly ONE correct answer. Reply with only the single letter (e.g. "b"). No explanation.';

  return [
    'You are answering an exam multiple-choice question. Choose the best answer.',
    '',
    'Question:',
    q.text,
    '',
    'Options:',
    optionsText,
    '',
    expectation,
  ].join('\n');
}

async function callGemini(q) {
  const apiKey = await getApiKey();
  const prompt = buildPrompt(q);

  const res = await fetch(GEMINI_ENDPOINT + '?key=' + encodeURIComponent(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 16 },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error('HTTP ' + res.status + ': ' + errBody.slice(0, 200));
  }

  const data = await res.json();
  const text =
    data &&
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    data.candidates[0].content.parts &&
    data.candidates[0].content.parts[0] &&
    data.candidates[0].content.parts[0].text;

  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  const validLetters = new Set(q.options.map((o) => o.letter));
  const found = (text.toLowerCase().match(/[a-z]/g) || []).filter((l) =>
    validLetters.has(l)
  );
  const unique = [...new Set(found)];

  if (unique.length === 0) {
    throw new Error('No valid letter in response: ' + text.slice(0, 80));
  }

  const correct = q.type === 'multi' ? unique : [unique[0]];
  return { correct };
}
