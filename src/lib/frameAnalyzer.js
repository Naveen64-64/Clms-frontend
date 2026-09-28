/**
 * frameAnalyzer.js
 *
 * Canvas-based frame analysis for the automatic ID card scanner kiosk.
 * Provides card-presence detection (edge density), positioning guidance
 * (distance, centering, lighting, sharpness), and frame stability tracking.
 */

const DEV = import.meta.env.DEV;
const log = (...args) => DEV && console.log('[FrameAnalyzer]', ...args);

// ── Thresholds (optimized for fast auto-capture & positioning guidance) ──

/** Minimum average brightness (0-255) for the ROI to be considered well-lit */
const MIN_BRIGHTNESS = 35;
/** Maximum average brightness — too bright means glare */
const MAX_BRIGHTNESS = 245;
/** Minimum edge density ratio to consider "card-like object present" */
const MIN_EDGE_DENSITY = 0.022;
/** Optimal edge density range indicating card is at the right distance */
const OPTIMAL_EDGE_MIN = 0.035;
/** Minimum sharpness (Laplacian variance) for a usable OCR frame */
const MIN_SHARPNESS = 7.5;
/** Maximum pixel-difference ratio between consecutive frames for "stable" */
const MAX_FRAME_DIFF = 0.050;
/** Fast capture: only 2 consecutive stable frames needed */
const STABLE_FRAME_COUNT = 2;

// ── Internal state for stability tracking ──────────────────────────────

let previousFrameData = null;
let consecutiveStableFrames = 0;
let lastMotionTimestamp = Date.now();

/**
 * Reset the stability tracker (call when scanner starts/restarts).
 */
export function resetStabilityTracker() {
  previousFrameData = null;
  consecutiveStableFrames = 0;
  lastMotionTimestamp = Date.now();
}

/**
 * Compute the ROI rectangle (where the card should be placed) given the
 * full video dimensions. The ROI is centered and occupies ~72% width, ~58% height.
 *
 * @param {number} videoWidth
 * @param {number} videoHeight
 * @returns {{ x: number, y: number, w: number, h: number }}
 */
export function computeROI(videoWidth, videoHeight) {
  const roiW = Math.round(videoWidth * 0.72);
  const roiH = Math.round(videoHeight * 0.58);
  const roiX = Math.round((videoWidth - roiW) / 2);
  const roiY = Math.round((videoHeight - roiH) / 2);
  return { x: roiX, y: roiY, w: roiW, h: roiH };
}

/**
 * Extract the ROI ImageData from a canvas that already has the video frame drawn.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number, w: number, h: number }} roi
 * @returns {ImageData}
 */
function getROIData(ctx, roi) {
  return ctx.getImageData(roi.x, roi.y, roi.w, roi.h);
}

/**
 * Compute average brightness of an ImageData (grayscale luminance).
 *
 * @param {ImageData} imageData
 * @returns {number} 0–255
 */
function computeBrightness(imageData) {
  const data = imageData.data;
  let sum = 0;
  const pixelCount = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return sum / pixelCount;
}

/**
 * Compute edge density using a simplified Sobel operator.
 * Returns the fraction of pixels that are "edge pixels" (gradient > threshold).
 *
 * @param {ImageData} imageData
 * @returns {number} 0–1 ratio
 */
function computeEdgeDensity(imageData) {
  const { data, width, height } = imageData;
  const edgeThreshold = 38;
  let edgeCount = 0;
  const totalPixels = (width - 2) * (height - 2);

  for (let y = 1; y < height - 1; y += 2) { // sampled every 2nd row for speed
    for (let x = 1; x < width - 1; x += 2) {
      const idx = (y * width + x) * 4;
      const leftIdx = (y * width + (x - 1)) * 4;
      const rightIdx = (y * width + (x + 1)) * 4;
      const topIdx = ((y - 1) * width + x) * 4;
      const bottomIdx = ((y + 1) * width + x) * 4;

      const grayLeft = 0.299 * data[leftIdx] + 0.587 * data[leftIdx + 1] + 0.114 * data[leftIdx + 2];
      const grayRight = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
      const grayTop = 0.299 * data[topIdx] + 0.587 * data[topIdx + 1] + 0.114 * data[topIdx + 2];
      const grayBottom = 0.299 * data[bottomIdx] + 0.587 * data[bottomIdx + 1] + 0.114 * data[bottomIdx + 2];

      const gx = Math.abs(grayRight - grayLeft);
      const gy = Math.abs(grayBottom - grayTop);

      if (gx + gy > edgeThreshold) {
        edgeCount++;
      }
    }
  }

  const sampledTotal = Math.floor(totalPixels / 4);
  return sampledTotal > 0 ? edgeCount / sampledTotal : 0;
}

/**
 * Compute sharpness using Laplacian variance.
 * Higher values = sharper image.
 *
 * @param {ImageData} imageData
 * @returns {number}
 */
function computeSharpness(imageData) {
  const { data, width, height } = imageData;
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 2; y < height - 2; y += 2) {
    for (let x = 2; x < width - 2; x += 2) {
      const idx = (y * width + x) * 4;
      const center = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const top = 0.299 * data[((y - 1) * width + x) * 4] + 0.587 * data[((y - 1) * width + x) * 4 + 1] + 0.114 * data[((y - 1) * width + x) * 4 + 2];
      const bottom = 0.299 * data[((y + 1) * width + x) * 4] + 0.587 * data[((y + 1) * width + x) * 4 + 1] + 0.114 * data[((y + 1) * width + x) * 4 + 2];
      const left = 0.299 * data[(y * width + (x - 1)) * 4] + 0.587 * data[(y * width + (x - 1)) * 4 + 1] + 0.114 * data[(y * width + (x - 1)) * 4 + 2];
      const right = 0.299 * data[(y * width + (x + 1)) * 4] + 0.587 * data[(y * width + (x + 1)) * 4 + 1] + 0.114 * data[(y * width + (x + 1)) * 4 + 2];

      const laplacian = top + bottom + left + right - 4 * center;
      sum += laplacian;
      sumSq += laplacian * laplacian;
      count++;
    }
  }

  if (count === 0) return 0;
  const mean = sum / count;
  return (sumSq / count) - (mean * mean);
}

/**
 * Compute frame-to-frame pixel difference ratio using downsampled grayscale.
 *
 * @param {ImageData} currentData
 * @returns {number} 0–1 ratio of changed pixels
 */
function computeFrameDiff(currentData) {
  const { data, width, height } = currentData;
  const step = 4;
  const sampledWidth = Math.floor(width / step);
  const sampledHeight = Math.floor(height / step);
  const currentSampled = new Uint8Array(sampledWidth * sampledHeight);

  let idx = 0;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const pIdx = (y * width + x) * 4;
      currentSampled[idx++] = Math.round(
        0.299 * data[pIdx] + 0.587 * data[pIdx + 1] + 0.114 * data[pIdx + 2]
      );
    }
  }

  if (!previousFrameData || previousFrameData.length !== currentSampled.length) {
    previousFrameData = currentSampled;
    return 0;
  }

  let diffPixels = 0;
  const diffThreshold = 18;
  for (let i = 0; i < currentSampled.length; i++) {
    if (Math.abs(currentSampled[i] - previousFrameData[i]) > diffThreshold) {
      diffPixels++;
    }
  }

  previousFrameData = currentSampled;
  return currentSampled.length > 0 ? diffPixels / currentSampled.length : 1;
}

/**
 * Analyze a video frame to determine card positioning and readiness.
 *
 * @param {CanvasRenderingContext2D} ctx - Context with current video frame
 * @param {{ x: number, y: number, w: number, h: number }} roi
 * @returns {{
 *   brightness: number,
 *   edgeDensity: number,
 *   sharpness: number,
 *   frameDiff: number,
 *   isCardPresent: boolean,
 *   isQualityOk: boolean,
 *   isStable: boolean,
 *   isReadyForCapture: boolean,
 *   consecutiveStable: number,
 *   positionStatus: 'NO_CARD' | 'TOO_FAR' | 'TOO_DARK' | 'TOO_BRIGHT' | 'BLURRY' | 'UNSTABLE' | 'PERFECT',
 *   guidance: string,
 *   guidanceType: 'idle' | 'warning' | 'good' | 'capture',
 *   hasMotion: boolean,
 *   lastMotionTime: number
 * }}
 */
export function analyzeFrame(ctx, roi) {
  const roiData = getROIData(ctx, roi);

  const brightness = computeBrightness(roiData);
  const edgeDensity = computeEdgeDensity(roiData);
  const sharpness = computeSharpness(roiData);
  const frameDiff = computeFrameDiff(roiData);

  const isCardPresent = edgeDensity >= MIN_EDGE_DENSITY;
  const isBrightnessOk = brightness >= MIN_BRIGHTNESS && brightness <= MAX_BRIGHTNESS;
  const isSharp = sharpness >= MIN_SHARPNESS;
  const isFrameStable = frameDiff < MAX_FRAME_DIFF;
  const isCloseEnough = edgeDensity >= OPTIMAL_EDGE_MIN;

  const hasMotion = frameDiff > 0.02 || isCardPresent;
  if (hasMotion) {
    lastMotionTimestamp = Date.now();
  }

  // Quality check combines illumination and sharpness
  const isQualityOk = isBrightnessOk && isSharp;

  // Stability accumulation
  if (isCardPresent && isQualityOk && isFrameStable) {
    consecutiveStableFrames++;
  } else {
    consecutiveStableFrames = Math.max(0, consecutiveStableFrames - 1);
  }

  const isReadyForCapture = isCardPresent && isQualityOk && consecutiveStableFrames >= STABLE_FRAME_COUNT;

  // Determine granular position status and explicit user guidance
  let positionStatus = 'PERFECT';
  let guidance = '';
  let guidanceType = 'good';

  if (!isCardPresent) {
    positionStatus = 'NO_CARD';
    guidance = 'Place your KIET ID card inside the frame';
    guidanceType = 'idle';
  } else if (!isCloseEnough) {
    positionStatus = 'TOO_FAR';
    guidance = 'Move card closer to the camera';
    guidanceType = 'warning';
  } else if (brightness < MIN_BRIGHTNESS) {
    positionStatus = 'TOO_DARK';
    guidance = 'Too dark — point card towards light';
    guidanceType = 'warning';
  } else if (brightness > MAX_BRIGHTNESS) {
    positionStatus = 'TOO_BRIGHT';
    guidance = 'Glare detected — tilt card slightly';
    guidanceType = 'warning';
  } else if (!isSharp) {
    positionStatus = 'BLURRY';
    guidance = 'Hold card steady — camera focusing';
    guidanceType = 'warning';
  } else if (!isFrameStable) {
    positionStatus = 'UNSTABLE';
    guidance = 'Hold still...';
    guidanceType = 'warning';
  } else if (isReadyForCapture) {
    positionStatus = 'PERFECT';
    guidance = 'Reading ID Card...';
    guidanceType = 'capture';
  } else {
    positionStatus = 'PERFECT';
    guidance = 'Well positioned! Scanning...';
    guidanceType = 'good';
  }

  return {
    brightness,
    edgeDensity,
    sharpness,
    frameDiff,
    isCardPresent,
    isQualityOk,
    isStable: isFrameStable,
    isReadyForCapture,
    consecutiveStable: consecutiveStableFrames,
    positionStatus,
    guidance,
    guidanceType,
    hasMotion,
    lastMotionTime: lastMotionTimestamp
  };
}
