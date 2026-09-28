/**
 * imagePreprocessor.js
 *
 * Canvas-based image preprocessing for OCR. Provides multiple preprocessing
 * pipelines of increasing aggressiveness so the scanner can retry with
 * different settings if the initial OCR attempt fails.
 */

const DEV = import.meta.env.DEV;
const log = (...args) => DEV && console.log('[ImagePreprocessor]', ...args);

/**
 * Crop the ROI from the full-frame canvas and return a new canvas containing
 * only the cropped region, optionally upscaled for better OCR accuracy.
 *
 * @param {HTMLCanvasElement} sourceCanvas - Full video frame canvas
 * @param {{ x: number, y: number, w: number, h: number }} roi
 * @param {number} [scale=2] - Upscale factor for the cropped region
 * @returns {HTMLCanvasElement}
 */
export function cropROI(sourceCanvas, roi, scale = 2) {
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = roi.w * scale;
  cropCanvas.height = roi.h * scale;
  const ctx = cropCanvas.getContext('2d');

  // Disable image smoothing for sharper upscale
  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(
    sourceCanvas,
    roi.x, roi.y, roi.w, roi.h,         // source rect
    0, 0, cropCanvas.width, cropCanvas.height  // destination rect (upscaled)
  );

  log(`Cropped ROI ${roi.w}x${roi.h} → ${cropCanvas.width}x${cropCanvas.height} (${scale}x)`);
  return cropCanvas;
}

/**
 * Convert a canvas to grayscale in-place.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {HTMLCanvasElement} same canvas, modified
 */
export function toGrayscale(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Apply contrast enhancement in-place.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {number} [factor=1.5] - Contrast multiplier (>1 = more contrast)
 * @returns {HTMLCanvasElement}
 */
export function enhanceContrast(canvas, factor = 1.5) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, ((data[i] - 128) * factor) + 128));
    data[i + 1] = Math.max(0, Math.min(255, ((data[i + 1] - 128) * factor) + 128));
    data[i + 2] = Math.max(0, Math.min(255, ((data[i + 2] - 128) * factor) + 128));
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Apply binary thresholding in-place using Otsu's method approximation.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {number|null} [threshold=null] - Fixed threshold (0-255), or null for auto (Otsu)
 * @returns {HTMLCanvasElement}
 */
export function applyThreshold(canvas, threshold = null) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Auto-threshold using Otsu's method if no threshold given
  if (threshold === null) {
    threshold = computeOtsuThreshold(data);
  }

  for (let i = 0; i < data.length; i += 4) {
    const val = data[i] >= threshold ? 255 : 0;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }

  ctx.putImageData(imageData, 0, 0);
  log(`Threshold applied at ${threshold}`);
  return canvas;
}

/**
 * Compute Otsu's threshold for grayscale image data.
 *
 * @param {Uint8ClampedArray} data - RGBA pixel data (assumed grayscale R=G=B)
 * @returns {number} Optimal threshold 0–255
 */
function computeOtsuThreshold(data) {
  const histogram = new Array(256).fill(0);
  const totalPixels = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    histogram[data[i]]++;
  }

  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];

  let sumB = 0;
  let wB = 0;
  let maxVariance = 0;
  let bestThreshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    const wF = totalPixels - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];
    const meanB = sumB / wB;
    const meanF = (sum - sumB) / wF;

    const variance = wB * wF * (meanB - meanF) * (meanB - meanF);
    if (variance > maxVariance) {
      maxVariance = variance;
      bestThreshold = t;
    }
  }

  return bestThreshold;
}

/**
 * Apply unsharp mask sharpening in-place.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {number} [amount=0.5] - Sharpening amount
 * @returns {HTMLCanvasElement}
 */
export function sharpen(canvas, amount = 0.5) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const idx = (y * width + x) * 4 + c;
        const center = data[idx];
        const neighbors =
          data[((y - 1) * width + x) * 4 + c] +
          data[((y + 1) * width + x) * 4 + c] +
          data[(y * width + (x - 1)) * 4 + c] +
          data[(y * width + (x + 1)) * 4 + c];
        const blur = neighbors / 4;
        const sharpened = center + amount * (center - blur);
        output[idx] = Math.max(0, Math.min(255, Math.round(sharpened)));
      }
    }
  }

  const outImageData = new ImageData(output, width, height);
  ctx.putImageData(outImageData, 0, 0);
  return canvas;
}

/**
 * Clone a canvas.
 *
 * @param {HTMLCanvasElement} source
 * @returns {HTMLCanvasElement}
 */
function cloneCanvas(source) {
  const clone = document.createElement('canvas');
  clone.width = source.width;
  clone.height = source.height;
  clone.getContext('2d').drawImage(source, 0, 0);
  return clone;
}

/**
 * Preprocessing pipeline definitions. Each pipeline is progressively more
 * aggressive. The scanner tries them in order, stopping at the first one
 * that yields a valid roll number.
 */
const PIPELINES = [
  {
    name: 'standard',
    description: 'Grayscale + contrast',
    process: (sourceCanvas, roi) => {
      let canvas = cropROI(sourceCanvas, roi, 2);
      canvas = toGrayscale(canvas);
      canvas = enhanceContrast(canvas, 1.5);
      return canvas;
    }
  },
  {
    name: 'high-contrast',
    description: 'Grayscale + strong contrast + sharpen',
    process: (sourceCanvas, roi) => {
      let canvas = cropROI(sourceCanvas, roi, 3);
      canvas = toGrayscale(canvas);
      canvas = enhanceContrast(canvas, 2.0);
      canvas = sharpen(canvas, 0.6);
      return canvas;
    }
  },
  {
    name: 'thresholded',
    description: 'Grayscale + Otsu threshold',
    process: (sourceCanvas, roi) => {
      let canvas = cropROI(sourceCanvas, roi, 3);
      canvas = toGrayscale(canvas);
      canvas = enhanceContrast(canvas, 1.8);
      canvas = applyThreshold(canvas);
      return canvas;
    }
  }
];

/**
 * Get the ordered list of preprocessing pipelines.
 *
 * @returns {Array<{ name: string, description: string, process: Function }>}
 */
export function getPreprocessingPipelines() {
  return PIPELINES;
}
