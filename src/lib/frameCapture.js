/**
 * Burst Frame Capture & Sharpness Selector
 *
 * When motion is detected, captures a short burst of candidate frames (e.g. 2-3 frames),
 * measures image sharpness and contrast, and selects the optimal snapshot frame for OCR.
 * Prevents processing blurry initial motion frames when a student's hand is still moving.
 */

/**
 * Measure image sharpness using Laplacian variance / edge gradient energy
 * Higher score = sharper, less motion-blurred image.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @returns {number} Sharpness score
 */
export function calculateImageSharpness(ctx, width, height) {
  // Downsample to 240px width for fast sharpness evaluation (~2ms)
  const evalW = 240;
  const evalH = Math.round((evalW / width) * height);

  const evalCanvas = document.createElement('canvas');
  evalCanvas.width = evalW;
  evalCanvas.height = evalH;
  const evalCtx = evalCanvas.getContext('2d', { willReadFrequently: true });
  evalCtx.drawImage(ctx.canvas, 0, 0, evalW, evalH);

  const imgData = evalCtx.getImageData(0, 0, evalW, evalH);
  const data = imgData.data;
  const total = evalW * evalH;
  const lum = new Uint8Array(total);

  for (let i = 0; i < total; i++) {
    const idx = i * 4;
    lum[i] = (data[idx] * 77 + data[idx + 1] * 150 + data[idx + 2] * 29) >> 8;
  }

  // Compute Laplacian variance: L = 4*p - (top + bottom + left + right)
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < evalH - 1; y += 2) {
    const rowOffset = y * evalW;
    for (let x = 1; x < evalW - 1; x += 2) {
      const idx = rowOffset + x;
      const center = lum[idx];
      const laplacian =
        4 * center -
        lum[idx - evalW] -
        lum[idx + evalW] -
        lum[idx - 1] -
        lum[idx + 1];

      sum += laplacian;
      sumSq += laplacian * laplacian;
      count++;
    }
  }

  if (count === 0) return 0;
  const mean = sum / count;
  const variance = (sumSq / count) - (mean * mean);
  return Math.max(0, variance);
}

/**
 * Capture a short burst of frames from a live video element
 * and return the sharpest/clearest frame canvas.
 *
 * @param {HTMLVideoElement} video - Live video stream
 * @param {Object} [options]
 * @param {number} [options.frameCount=3] - Number of candidate frames in burst
 * @param {number} [options.intervalMs=70] - Delay between candidate frames (ms)
 * @returns {Promise<{ bestCanvas: HTMLCanvasElement, sharpnessScore: number, frameIndex: number }>}
 */
export async function captureBestFrame(video, options = {}) {
  const frameCount = options.frameCount || 3;
  const intervalMs = options.intervalMs || 70;

  const vW = video.videoWidth || 1280;
  const vH = video.videoHeight || 720;

  const candidates = [];

  for (let i = 0; i < frameCount; i++) {
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      continue;
    }

    const canvas = document.createElement('canvas');
    canvas.width = vW;
    canvas.height = vH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, vW, vH);

    const sharpness = calculateImageSharpness(ctx, vW, vH);
    candidates.push({ canvas, sharpness, index: i });
  }

  if (candidates.length === 0) {
    // Fallback: single frame
    const canvas = document.createElement('canvas');
    canvas.width = vW;
    canvas.height = vH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, vW, vH);
    return { bestCanvas: canvas, sharpnessScore: 50, frameIndex: 0 };
  }

  // Sort candidates by sharpness score descending
  candidates.sort((a, b) => b.sharpness - a.sharpness);
  const best = candidates[0];

  return {
    bestCanvas: best.canvas,
    sharpnessScore: Math.round(best.sharpness),
    frameIndex: best.index
  };
}
