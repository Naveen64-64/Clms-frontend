/**
 * rollNumberExtractor.js
 *
 * Extracts and validates KIET student Roll Numbers from raw OCR text.
 * Handles common OCR misreads and normalizes candidates against the
 * backend's strict format: /^\d{2}(B2|6Q|JN)\d[A-Z]\d{4}$/
 */

const DEV = import.meta.env.DEV;
const log = (...args) => DEV && console.log('[RollNumberExtractor]', ...args);

/**
 * Backend-aligned strict regex for a complete roll number.
 * Format: YY + CampusCode(B2|6Q|JN) + Digit + Letter + 4Digits
 * Example: 24B21A4419, 23JN5A0312, 226Q1A0501
 */
const STRICT_REGEX = /^\d{2}(B2|6Q|JN)\d[A-Z]\d{4}$/;

/**
 * Flexible search regex that finds roll-number-shaped substrings in OCR text.
 * Uses word-boundary-like assertions and is case-insensitive.
 */
const SEARCH_REGEX = /\d{2}(?:B2|6Q|JN)\d[A-Z]\d{4}/gi;

/**
 * Map of common OCR character confusions in DIGIT positions.
 * Applied only where a digit is expected by the roll number format.
 */
const DIGIT_SUBSTITUTIONS = {
  'O': '0', 'o': '0',
  'I': '1', 'i': '1', 'l': '1', '|': '1',
  'Z': '2', 'z': '2',
  'S': '5', 's': '5',
  'G': '6', 'g': '6',
  'T': '7',
  'B': '8',  // Note: B is also a valid campus code char — handled contextually
};

/**
 * Map of common OCR confusions in LETTER positions.
 */
const LETTER_SUBSTITUTIONS = {
  '0': 'O',
  '1': 'I',
  '5': 'S',
  '8': 'B',
  '6': 'G',
};

/**
 * Normalize a single character that should be a digit.
 * @param {string} ch
 * @returns {string}
 */
function normalizeDigit(ch) {
  if (/\d/.test(ch)) return ch;
  return DIGIT_SUBSTITUTIONS[ch] || ch;
}

/**
 * Normalize a single character that should be a letter.
 * @param {string} ch
 * @returns {string}
 */
function normalizeLetter(ch) {
  if (/[A-Z]/i.test(ch)) return ch.toUpperCase();
  return LETTER_SUBSTITUTIONS[ch] || ch.toUpperCase();
}

/**
 * Attempt to normalize a 10-character candidate string into the strict
 * roll number format by applying position-aware character corrections.
 *
 * Format positions: DD CC D L DDDD
 *   [0-1]  = digits (year)
 *   [2-3]  = campus code chars (B2, 6Q, JN) — mixed type
 *   [4]    = digit
 *   [5]    = letter (branch code)
 *   [6-9]  = digits (student number)
 *
 * @param {string} candidate - 10-character string
 * @returns {string|null} Normalized roll number or null if unfixable
 */
function normalizeCandidate(candidate) {
  if (candidate.length !== 10) return null;

  const chars = candidate.split('');

  // Positions 0-1: must be digits (year like 24, 23, 22)
  chars[0] = normalizeDigit(chars[0]);
  chars[1] = normalizeDigit(chars[1]);

  // Positions 2-3: campus code — one of B2, 6Q, JN
  let c2 = chars[2].toUpperCase();
  let c3 = chars[3].toUpperCase();

  // Normalize common OCR confusions for campus codes:
  // B2 confusions: '82', 'BZ', '8Z', 'b2'
  if ((c2 === '8' || c2 === 'B') && (c3 === '2' || c3 === 'Z')) {
    c2 = 'B';
    c3 = '2';
  }
  // 6Q confusions: 'GQ', '60', '6O', 'bQ'
  else if ((c2 === '6' || c2 === 'G' || c2 === 'B') && (c3 === 'Q' || c3 === '0' || c3 === 'O' || c3 === 'D')) {
    c2 = '6';
    c3 = 'Q';
  }
  // JN confusions: '1N', 'IN', 'LN'
  else if ((c2 === 'J' || c2 === 'I' || c2 === '1' || c2 === 'L') && (c3 === 'N' || c3 === 'M')) {
    c2 = 'J';
    c3 = 'N';
  }

  chars[2] = c2;
  chars[3] = c3;

  // Position 4: digit
  chars[4] = normalizeDigit(chars[4]);

  // Position 5: letter (branch code like A, B, C, D, etc.)
  chars[5] = normalizeLetter(chars[5]);

  // Positions 6-9: digits (student number)
  chars[6] = normalizeDigit(chars[6]);
  chars[7] = normalizeDigit(chars[7]);
  chars[8] = normalizeDigit(chars[8]);
  chars[9] = normalizeDigit(chars[9]);

  const normalized = chars.join('');

  if (STRICT_REGEX.test(normalized)) {
    return normalized;
  }

  return null;
}

/**
 * Clean raw OCR text: remove noise, normalize whitespace.
 * @param {string} text
 * @returns {string}
 */
function cleanOcrText(text) {
  return text
    .replace(/[\r\n]+/g, ' ')    // newlines → spaces
    .replace(/[^A-Za-z0-9\s]/g, '') // remove special chars except alphanumeric
    .replace(/\s+/g, ' ')        // collapse whitespace
    .trim()
    .toUpperCase();
}

/**
 * Extract all valid roll number candidates from OCR text.
 *
 * Strategy:
 * 1. Direct regex match on cleaned text
 * 2. Sliding-window normalization over the cleaned text
 * 3. Deduplicate and return
 *
 * @param {string} rawOcrText
 * @returns {string[]} Array of valid roll numbers (uppercase), empty if none found
 */
export function extractRollNumbers(rawOcrText) {
  if (!rawOcrText || rawOcrText.trim().length === 0) return [];

  const cleaned = cleanOcrText(rawOcrText);
  const candidates = new Set();

  // Strategy 1: Direct regex search
  const directMatches = cleaned.match(SEARCH_REGEX) || [];
  for (const match of directMatches) {
    const upper = match.toUpperCase();
    if (STRICT_REGEX.test(upper)) {
      candidates.add(upper);
    }
  }

  // Strategy 2: Sliding window — take every 10-char substring and try normalizing
  const noSpaces = cleaned.replace(/\s/g, '');
  for (let i = 0; i <= noSpaces.length - 10; i++) {
    const window = noSpaces.substring(i, i + 10);
    const normalized = normalizeCandidate(window);
    if (normalized) {
      candidates.add(normalized);
    }
  }

  const results = [...candidates];
  if (results.length > 0) {
    log(`Extracted roll numbers:`, results, `from OCR text: "${rawOcrText.substring(0, 100)}..."`);
  }
  return results;
}

/**
 * Validate a roll number string against the strict backend format.
 *
 * @param {string} rollNumber
 * @returns {boolean}
 */
export function isValidRollNumber(rollNumber) {
  return STRICT_REGEX.test(rollNumber?.toUpperCase());
}
