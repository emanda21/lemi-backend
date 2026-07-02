/**
 * aiService.js
 * All network communication with the LEMI AI FastAPI backend.
 *
 * Base URL is read from the NEXT_PUBLIC_API_URL env var so you can
 * swap between dev / staging / prod without touching this file:
 *
 *   # .env.local
 *   NEXT_PUBLIC_API_URL=http://localhost:8000
 *
 * Falls back to http://localhost:8000 when the env var is absent.
 */

// ─── No external imports needed ───────────────────────────────────────────────
// crypto.randomUUID() is available as a browser global (no import required).
// FormData, fetch, AbortController are all native browser APIs.

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

/** Maximum wait before aborting the request (120 s covers Render cold starts) */
const TIMEOUT_MS = 120_000;

/**
 * After this many ms with no response, we tell the user the AI is "waking up".
 * Render free-tier cold-start typically takes 30–90 s.
 */
const SLOW_MS = 10_000;

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Wraps fetch with an AbortController timeout.
 * Optionally fires `onSlow()` after SLOW_MS to let the UI show a warm-up message.
 *
 * @param {string}      url
 * @param {RequestInit} options
 * @param {Function}    [onSlow]  - Called after SLOW_MS if still waiting
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, onSlow) {
  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const slowTimer  = onSlow ? setTimeout(onSlow, SLOW_MS) : null;
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(abortTimer);
    if (slowTimer) clearTimeout(slowTimer);
  }
}

/**
 * Parses the FastAPI error response into a human-readable message.
 * @param {Response} response
 * @returns {Promise<string>}
 */
async function parseError(response) {
  try {
    const body = await response.json();
    return body?.detail ?? body?.message ?? `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status} – ${response.statusText}`;
  }
}

// ─── Oromo translation dictionary for the 4 known disease classes ─────────────
const OR_TRANSLATIONS = {
  Blight: {
    nameOr:      'Baalaan Gogsuu',
    treatmentOr: 'Saffisa duratti Mancozeb 2.5g/L faffaci. Propiconazole-based fungicide fayyadami. Baalaa dhibeeffate guubi.',
  },
  Common_Rust: {
    nameOr:      'Xurrii Baalaa',
    treatmentOr: 'Fungicide (Triazole-based) hatattamaan faffaci. Saffisa duratti ittisuu ni caala. Yeroo yeroon hordofi.',
  },
  Gray_Leaf_Spot: {
    nameOr:      'Dhibee Garaa Baalaa',
    treatmentOr: 'Azoxystrobin fungicide fayyadami. Midhaan naannessi. Hafaatota manca\'i. Sirna qilleensa banaa hordofi.',
  },
  Healthy: {
    nameOr:      'Baala Fayyaa',
    treatmentOr: 'Biqiltuun fayyaadha. Yaaliin hin barbaachisu. Hordoffii yeroo yeroon itti fufi.',
  },
};

// Fallback for any class the dictionary doesn't recognise
function getOrTranslation(classNameEn) {
  // Try exact match first, then partial match
  const key = Object.keys(OR_TRANSLATIONS).find(
    (k) => k === classNameEn || classNameEn?.includes(k.replace('_', ' '))
  );
  return OR_TRANSLATIONS[key] ?? { nameOr: classNameEn ?? 'Hin beekamu', treatmentOr: 'Yaaliin beekkamaa hin jiru.' };
}


/**
 * uploadLeafImage()
 * Sends a plant-leaf image to the FastAPI /predict endpoint and returns a
 * normalised scan result ready to be stored in AppContext.
 *
 * FastAPI expected request:
 *   POST /predict
 *   Content-Type: multipart/form-data
 *   Body field: "file" → image file (jpeg / png / webp)
 *
 * FastAPI expected response shape:
 * {
 *   prediction_id: string,
 *   name_am      : string,
 *   name_en      : string,
 *   status       : string,
 *   treatment_am : string,
 *   confidence   : number,
 *   inference_ms : number,
 *   demo_mode    : boolean
 * }
 *
 * @param {File} file - The image File object from an <input type="file"> or camera.
 * @returns {Promise<ScanResult>} Normalised result ready for AppContext.addScan()
 * @throws {Error} With a user-facing message on network or API failure.
 *
 * @example
 * import { uploadLeafImage } from '@/services/aiService';
 *
 * const handleScan = async (file) => {
 *   setLoading(true);
 *   try {
 *     const result = await uploadLeafImage(file);
 *     addScan(result);
 *   } catch (err) {
 *     setError(err.message);
 *   }
 * };
 */
/**
 * @param {File}     file
 * @param {Function} [onSlow]  Optional callback fired after 10 s if still waiting.
 *                             Use it to show a "backend waking up" message in the UI.
 */
export async function uploadLeafImage(file, onSlow) {
  if (!file) throw new Error('No file provided for scan.');

  // Build multipart form data
  const formData = new FormData();
  formData.append('file', file);

  let response;
  try {
    response = await fetchWithTimeout(
      `${BASE_URL}/predict`,
      {
        method: 'POST',
        body: formData,
        // Do NOT set Content-Type manually — the browser sets it
        // automatically with the correct multipart boundary.
      },
      onSlow,  // fires after SLOW_MS (10 s) if still waiting
    );
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(
        'ምርመራው ጊዜ አለፈ (2 ደቂቃ)። ድጋሚ ይሞክሩ። / AI request timed out after 2 minutes. Please try again.'
      );
    }
    throw new Error('ከ AI ሞዴሉ ጋር ግንኙነት አልተቻለም። / Cannot reach the AI backend. Check your connection.');
  }

  if (!response.ok) {
    const msg = await parseError(response);
    throw new Error(`AI ሞዴሉ ስህተት ገጠመው፦ ${msg}`);
  }

  const raw = await response.json();

  // Convert the uploaded image to a persistent base64 data URL.
  // URL.createObjectURL() creates a temporary blob URL that becomes invalid
  // after page reload, breaking history thumbnails hydrated from localStorage.
  const imageUrl = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });

  const orTrans = getOrTranslation(raw.name_en);

  // Normalise the FastAPI response into our internal ScanResult shape
  const result = {
    id:           raw.prediction_id ?? crypto.randomUUID?.() ?? `scan-${Date.now()}`,
    timestamp:    new Date().toISOString(),
    plantName:    'በቆሎ (Corn)',
    plantNameOr:  'Boqqolloo (Corn)',
    diseaseName:  raw.name_en    ?? 'Unknown',
    className:    raw.name_en    ?? 'Unknown',
    amharic:      raw.name_am   ?? '',
    nameOr:       orTrans.nameOr,
    confidence:   raw.confidence ?? 0,
    riskLevel:    raw.status === 'ጤናማ' ? 'Low' : 'High',
    status:       raw.status === 'ጤናማ' ? 'healthy' : 'diseased',
    inferenceMs:  raw.inference_ms ?? 0,
    imageUrl,
    treatmentAm:  raw.treatment_am ?? '',
    treatmentOr:  orTrans.treatmentOr,
    rawResponse:  raw,
  };

  return result;
}

/**
 * checkBackendHealth()
 * Pings the FastAPI /health endpoint to confirm the backend is reachable.
 * Useful for the "Offline Mode" indicator in the sidebar.
 *
 * FastAPI expected response: { status: "ok" }
 *
 * @returns {Promise<boolean>} true if backend is reachable and healthy.
 */
export async function checkBackendHealth() {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/health`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!response.ok) return false;
    const body = await response.json();
    return body?.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * getScanHistory()
 * Fetches past scans stored server-side (optional — only if your FastAPI
 * backend exposes a /history endpoint).
 *
 * @returns {Promise<ScanResult[]>}
 */
export async function getScanHistory() {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/history`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}
