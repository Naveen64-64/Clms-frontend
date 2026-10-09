/**
 * Roll Number OCR, Multi-Slice ROI Extraction, and Image Preprocessing Utilities
 * Specially engineered for KIET physical student ID cards (red printed text on light laminate).
 */

// Strict pattern for KIET student roll numbers (e.g. 23B21A4541, 23B21A4595, 256Q1A4202, 22JN1A0501)
export const KIET_ROLL_STRICT_REGEX = /^[0-9]{2}(?:B2|6Q|JN)[15]A[A-Z0-9]{4}$/i;
// Broad pattern for any JNTUK 10-char roll number
export const JNTUK_ROLL_BROAD_REGEX = /^[0-9]{2}[A-Z0-9]{2}[0-9][A-Z0-9][A-Z0-9]{4}$/i;

/**
 * Validates whether a candidate string matches a valid KIET / JNTUK roll number structure.
 * @param {string} str
 * @returns {boolean}
 */
export function isValidRollNumberPattern(str) {
  if (!str || typeof str !== 'string') return false;
  const clean = str.trim().toUpperCase();
  return KIET_ROLL_STRICT_REGEX.test(clean) || JNTUK_ROLL_BROAD_REGEX.test(clean);
}

/**
 * Normalizes characters that OCR commonly confuses in printed text.
 * Strictly applies substitutions based on expected character position in the 10-char roll number.
 *
 * Positions:
 * 0..1 : Year of admission (digits, e.g. 21..26)
 * 2..3 : Campus code (B2, 6Q, JN)
 * 4    : Entry code (1: Regular, 5: Lateral Entry)
 * 5    : Degree code ('A' for B.Tech)
 * 6..7 : Branch code (e.g. 45, 42, 05, 44, 04, 02)
 * 8..9 : Serial number (alphanumeric digits or chars)
 *
 * @param {string} raw10 - 10-character candidate string
 * @returns {string} Normalized 10-character string
 */
export function normalizeOcrCandidate(raw10) {
  if (!raw10 || raw10.length !== 10) return raw10;

  let [c0, c1, c2, c3, c4, c5, c6, c7, c8, c9] = raw10.toUpperCase().split('');

  // Position 0: First digit of year (almost always '2')
  if (c0 === 'Z' || c0 === '?' || c0 === '/' || c0 === '(' || c0 === '{') c0 = '2';

  // Position 1: Second digit of year (0..6)
  if (c1 === 'O' || c1 === 'Q' || c1 === 'D' || c1 === 'U' || c1 === 'C') c1 = '0';
  if (c1 === 'I' || c1 === 'L' || c1 === '|' || c1 === '!' || c1 === 'T' || c1 === ']') c1 = '1';
  if (c1 === 'Z') c1 = '2';
  if (c1 === 'E') c1 = '3';
  if (c1 === 'A' || c1 === 'H') c1 = '4';
  if (c1 === 'S') c1 = '5';
  if (c1 === 'B') c1 = '8';

  // Position 2 & 3: Campus code (B2, 6Q, JN)
  // Check for 'B2' (KIET Main Campus - OCR often sees 82, BZ, 8Z, 9R, BR, 8R, 92, etc.)
  if ((c2 === '8' || c2 === 'B' || c2 === '9' || c2 === 'R') && (c3 === '2' || c3 === 'Z' || c3 === 'R' || c3 === 'E')) {
    c2 = 'B';
    c3 = '2';
  } else if (c2 === 'B' && (c3 === '2' || c3 === 'Z' || c3 === 'R')) {
    c3 = '2';
  } else if ((c2 === '6' || c2 === 'b' || c2 === 'G') && (c3 === '0' || c3 === 'O' || c3 === 'D' || c3 === 'Q')) {
    // Check for '6Q' (KIET 2)
    c2 = '6';
    c3 = 'Q';
  } else if ((c2 === 'J' || c2 === 'I' || c2 === '1' || c2 === 'L') && (c3 === 'N' || c3 === 'M')) {
    // Check for 'JN' (KIET Women)
    c2 = 'J';
    c3 = 'N';
  }

  // Position 4: Entry degree (1 for Regular, 5 for Lateral)
  if (c4 === 'I' || c4 === 'L' || c4 === '|' || c4 === '!' || c4 === 'T' || c4 === '/' || c4 === ']') c4 = '1';
  if (c4 === 'S') c4 = '5';

  // Position 5: Degree type ('A' for B.Tech)
  if (c5 === '4' || c5 === 'R' || c5 === 'H' || c5 === '@' || c5 === '8') c5 = 'A';

  // Positions 6..7: Branch code digits (e.g. 42 for CSM, 45 for AIDS, 44 for CSD, 05 for CSE, 04 for ECE, 02 for EEE)
  if (c6 === 'A' || c6 === 'H') c6 = '4';
  if (c6 === 'O' || c6 === 'D') c6 = '0';
  if (c6 === 'I' || c6 === 'L') c6 = '1';
  if (c6 === 'Z') c6 = '2';
  if (c6 === 'S') c6 = '5';

  if (c7 === 'O' || c7 === 'D') c7 = '0';
  if (c7 === 'I' || c7 === 'L') c7 = '1';
  if (c7 === 'Z') c7 = '2';
  if (c7 === 'E') c7 = '3';
  if (c7 === 'A') c7 = '4';
  if (c7 === 'S') c7 = '5';
  if (c7 === 'G' || c7 === 'b') c7 = '6';
  if (c7 === 'B') c7 = '8';

  // Positions 8..9: Serial number (alphanumerics)
  if (c8 === 'O' || c8 === 'D') c8 = '0';
  if (c8 === 'I' || c8 === 'L' || c8 === '|' || c8 === '/') c8 = '1';
  if (c8 === 'Z') c8 = '2';
  if (c8 === 'S') c8 = '5';
  if (c8 === 'B') c8 = '8';

  if (c9 === 'O' || c9 === 'D') c9 = '0';
  if (c9 === 'I' || c9 === 'L' || c9 === '|' || c9 === '/') c9 = '1';
  if (c9 === 'Z') c9 = '2';
  if (c9 === 'S') c9 = '5';
  if (c9 === 'B') c9 = '8';

  return c0 + c1 + c2 + c3 + c4 + c5 + c6 + c7 + c8 + c9;
}

/**
 * Extracts and normalizes roll number candidates from OCR raw text output.
 * Returns an array of prioritized candidates along with the primary candidate.
 *
 * @param {string} rawText - Raw output string from Tesseract
 * @returns {{ primary: string | null, candidates: string[] }}
 */
export function extractRollNumberCandidate(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { primary: null, candidates: [] };
  }

  const foundSet = new Set();
  const orderedList = [];

  const addCandidate = (cand) => {
    if (!cand) return;
    const clean = cand.trim().toUpperCase();
    if (clean.length === 10 && !foundSet.has(clean)) {
      foundSet.add(clean);
      orderedList.push(clean);
    }
  };

  // 1. Direct Regex scan for exact pattern (strict match first)
  const strictMatches = rawText.match(/\b([12][0-9](?:B2|6Q|JN)[15]A[A-Z0-9]{4})\b/gi);
  if (strictMatches) {
    for (const m of strictMatches) {
      addCandidate(m);
    }
  }

  // 2. Scan line by line and evaluate sliding 10-char windows with normalization
  const lines = rawText.split('\n');
  for (const line of lines) {
    const cleaned = line.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (cleaned.length < 10) continue;

    for (let i = 0; i <= cleaned.length - 10; i++) {
      const window10 = cleaned.substring(i, i + 10);
      const normalized = normalizeOcrCandidate(window10);
      if (isValidRollNumberPattern(normalized)) {
        addCandidate(normalized);
      }
    }
  }

  // 3. Fallback: Compact full text sliding scan
  const compactText = rawText.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (compactText.length >= 10) {
    for (let i = 0; i <= compactText.length - 10; i++) {
      const window10 = compactText.substring(i, i + 10);
      const normalized = normalizeOcrCandidate(window10);
      if (isValidRollNumberPattern(normalized)) {
        addCandidate(normalized);
      }
    }
  }

  // 4. Generate controlled candidate confusion variants (O/0, I/1, L/1, S/5, B/8, Z/2)
  const baseCandidates = [...orderedList];
  for (const base of baseCandidates) {
    const variants = generatePositionalVariations(base);
    for (const v of variants) {
      addCandidate(v);
    }
  }

  return {
    primary: orderedList.length > 0 ? orderedList[0] : null,
    candidates: orderedList.slice(0, 8)
  };
}

/**
 * Generate controlled confusion candidate variations
 */
export function generatePositionalVariations(roll10) {
  if (!roll10 || roll10.length !== 10) return [roll10];
  const variations = new Set([roll10]);

  // Positional substitution check for confusions
  for (const pos of [2, 3, 6, 7, 8, 9]) {
    const ch = roll10[pos];
    const alts = [];
    if (ch === 'B') alts.push('8');
    else if (ch === '8') alts.push('B');
    if (ch === 'O' || ch === 'D') alts.push('0');
    else if (ch === '0') alts.push('O');
    if (ch === 'I' || ch === 'L') alts.push('1');
    else if (ch === '1') alts.push('I');
    if (ch === 'S') alts.push('5');
    else if (ch === '5') alts.push('S');
    if (ch === 'Z') alts.push('2');
    else if (ch === '2') alts.push('Z');
    if (ch === '6') alts.push('G', 'b');
    else if (ch === 'G') alts.push('6');

    for (const alt of alts) {
      const variant = roll10.substring(0, pos) + alt + roll10.substring(pos + 1);
      variations.add(variant);
    }
  }

  return Array.from(variations).slice(0, 6);
}

/**
 * Extract multiple candidate ROI slices from a normalized ID card canvas (540x856).
 * Roll Number in standard KIET ID card layout sits right beneath the student photograph.
 *
 * @param {HTMLCanvasElement} cardCanvas - Canvas containing the normalized card (540x856)
 * @returns {Array<{ name: string, sx: number, sy: number, sw: number, sh: number }>}
 */
export function getCardRoiSlices(cardCanvas) {
  const w = cardCanvas.width;
  const h = cardCanvas.height;

  return [
    // Primary: Roll Number primary text row (~56% to 68% height, 10% to 90% width)
    {
      name: 'PRIMARY_ROLL_ROW',
      sx: Math.round(w * 0.10),
      sy: Math.round(h * 0.56),
      sw: Math.round(w * 0.80),
      sh: Math.round(h * 0.12)
    },
    // Upper-variance: in case card header/photo is slightly compact (~52% to 64% height)
    {
      name: 'UPPER_ROLL_ROW',
      sx: Math.round(w * 0.10),
      sy: Math.round(h * 0.52),
      sw: Math.round(w * 0.80),
      sh: Math.round(h * 0.12)
    },
    // Lower-variance: in case student photo is taller (~62% to 74% height)
    {
      name: 'LOWER_ROLL_ROW',
      sx: Math.round(w * 0.10),
      sy: Math.round(h * 0.62),
      sw: Math.round(w * 0.80),
      sh: Math.round(h * 0.12)
    },
    // Broader window: captures entire middle profile block (~50% to 76% height)
    {
      name: 'BROAD_PROFILE_ZONE',
      sx: Math.round(w * 0.08),
      sy: Math.round(h * 0.50),
      sw: Math.round(w * 0.84),
      sh: Math.round(h * 0.26)
    }
  ];
}

/**
 * Preprocesses a canvas containing a cropped roll number ROI.
 * Tailored for red printed ink on reflective white plastic laminate.
 *
 * Modes:
 * 1: Optical Green Channel Separation + Dynamic Contrast Stretching
 * 2: Adaptive Otsu Binarization (High Contrast Black & White)
 * 3: 3x3 Laplace / Sharpen Kernel (combats slight camera motion blur)
 * 4: High-Pass Contrast with Highlight Suppression
 *
 * @param {HTMLCanvasElement} canvas - Target canvas to preprocess
 * @param {number} [attempt=1] - Mode index (1..4)
 */
export function preprocessCanvas(canvas, attempt = 1) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  if (!width || !height) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const totalPixels = width * height;

  // 1. Color Channel Separation (Green weight for red ink on white laminate)
  const grayBuffer = new Float32Array(totalPixels);
  let minVal = 255;
  let maxVal = 0;
  let sumVal = 0;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    // High green weight: red ink absorbs green (low value), white plastic reflects green (high value)
    const gray = 0.15 * r + 0.70 * g + 0.15 * b;
    grayBuffer[i] = gray;
    if (gray < minVal) minVal = gray;
    if (gray > maxVal) maxVal = gray;
    sumVal += gray;
  }

  const range = maxVal - minVal || 1;
  const meanVal = sumVal / totalPixels;

  if (attempt === 1) {
    // Mode 1: Dynamic Contrast Stretching with sigmoidal text curve
    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      let val = ((grayBuffer[i] - minVal) / range) * 255;
      val = ((val - 128) * 1.6) + 128;
      val = Math.max(0, Math.min(255, val));

      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
    }
    ctx.putImageData(imgData, 0, 0);
  } else if (attempt === 2) {
    // Mode 2: Adaptive Otsu Binarization (Crisp Black/White threshold)
    const threshold = (minVal + meanVal) / 2;
    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      const val = grayBuffer[i] < threshold ? 0 : 255;
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
    }
    ctx.putImageData(imgData, 0, 0);
  } else if (attempt === 3) {
    // Mode 3: 3x3 Laplace Sharpen Kernel to deblur slight motion
    const contrastBuffer = new Float32Array(totalPixels);
    for (let i = 0; i < totalPixels; i++) {
      let val = ((grayBuffer[i] - minVal) / range) * 255;
      val = ((val - 128) * 1.5) + 128;
      contrastBuffer[i] = Math.max(0, Math.min(255, val));
    }

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const centerIdx = y * width + x;
        const top = (y - 1) * width + x;
        const bottom = (y + 1) * width + x;
        const left = y * width + (x - 1);
        const right = y * width + (x + 1);

        let sharpVal = 5 * contrastBuffer[centerIdx]
          - contrastBuffer[top]
          - contrastBuffer[bottom]
          - contrastBuffer[left]
          - contrastBuffer[right];

        sharpVal = Math.max(0, Math.min(255, sharpVal));
        const outIdx = centerIdx * 4;
        data[outIdx] = sharpVal;
        data[outIdx + 1] = sharpVal;
        data[outIdx + 2] = sharpVal;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } else {
    // Mode 4: Inverted / Gloss suppression for reflections
    const threshold = meanVal * 0.95;
    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      let val = ((grayBuffer[i] - minVal) / range) * 255;
      // Suppress hot reflection spots
      if (val > 230) val = 255;
      else if (val < threshold) val = 0;
      else val = ((val - 128) * 1.8) + 128;
      val = Math.max(0, Math.min(255, val));

      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
    }
    ctx.putImageData(imgData, 0, 0);
  }
}
