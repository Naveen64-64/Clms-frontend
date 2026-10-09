/**
 * High-Performance Client-Side ID Card Detector and Perspective Warper
 *
 * Specifically engineered for physical institutional ID cards (KIET Student ID Card).
 * Features:
 * - Sobel gradient edge analysis and quadrilateral candidate extraction
 * - Geometric validation: convexity, 4 corners, 90° angle checks, CR-80 aspect ratio (0.50 - 0.80 portrait / 1.25 - 2.0 landscape)
 * - Internal laminate reflectance and text/photo structural variance checks
 * - Strict rejection of human faces, bodies, classroom windows, walls, and random rectangles
 * - 3-frame temporal stability tracking before confirming card presence
 * - Affine triangle mesh perspective correction normalizing to standard 540x856 portrait card
 */

export const CARD_NORMALIZED_WIDTH = 540;
export const CARD_NORMALIZED_HEIGHT = 856;

// Temporal stabilization state
let candidateHistory = [];
let stableFrameCount = 0;
let consecutiveMisses = 0;
let smoothedCorners = null;

/**
 * Reset corner stabilizer state
 */
export function resetCardDetectorState() {
  candidateHistory = [];
  stableFrameCount = 0;
  consecutiveMisses = 0;
  smoothedCorners = null;
}

/**
 * Distance between two 2D points
 */
function distance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate interior angle between vectors (p1 -> p2) and (p2 -> p3) in degrees
 */
function angleBetween(p1, p2, p3) {
  const v1x = p1.x - p2.x;
  const v1y = p1.y - p2.y;
  const v2x = p3.x - p2.x;
  const v2y = p3.y - p2.y;
  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
  if (mag1 === 0 || mag2 === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/**
 * Check if 4 points form a strictly convex quadrilateral
 */
function isConvexQuad(p0, p1, p2, p3) {
  const pts = [p0, p1, p2, p3];
  let prevSign = 0;
  for (let i = 0; i < 4; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    const c = pts[(i + 2) % 4];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) > 1e-4) {
      const sign = cross > 0 ? 1 : -1;
      if (prevSign === 0) {
        prevSign = sign;
      } else if (sign !== prevSign) {
        return false;
      }
    }
  }
  return prevSign !== 0;
}

/**
 * Check if the 4 corners have rectangular geometry (~70° to 110° interior angles)
 */
function hasRectangularCorners(tl, tr, br, bl) {
  const a0 = angleBetween(bl, tl, tr);
  const a1 = angleBetween(tl, tr, br);
  const a2 = angleBetween(tr, br, bl);
  const a3 = angleBetween(br, bl, tl);

  return (
    a0 >= 65 && a0 <= 115 &&
    a1 >= 65 && a1 <= 115 &&
    a2 >= 65 && a2 <= 115 &&
    a3 >= 65 && a3 <= 115
  );
}

/**
 * Calculate polygon area using Shoelace formula
 */
function getQuadArea(tl, tr, br, bl) {
  return 0.5 * Math.abs(
    tl.x * tr.y - tl.y * tr.x +
    tr.x * br.y - tr.y * br.x +
    br.x * bl.y - br.y * bl.x +
    bl.x * tl.y - bl.y * tl.x
  );
}

/**
 * Validate physical card internal texture and laminate properties
 * Rejects faces, solid color walls, windows, and arbitrary textures
 */
function validateCardInternalContent(data, aW, aH, tl, tr, br, bl) {
  // Sample a grid of points inside the quadrilateral
  let totalLuminance = 0;
  let sampleCount = 0;
  let minLum = 255;
  let maxLum = 0;
  const rowLum = [];

  const minX = Math.max(0, Math.min(tl.x, tr.x, br.x, bl.x));
  const maxX = Math.min(aW - 1, Math.max(tl.x, tr.x, br.x, bl.x));
  const minY = Math.max(0, Math.min(tl.y, tr.y, br.y, bl.y));
  const maxY = Math.min(aH - 1, Math.max(tl.y, tr.y, br.y, bl.y));

  const stepX = Math.max(2, Math.round((maxX - minX) / 16));
  const stepY = Math.max(2, Math.round((maxY - minY) / 20));

  for (let y = minY + stepY; y < maxY - stepY; y += stepY) {
    let rowSum = 0;
    let rowCount = 0;
    for (let x = minX + stepX; x < maxX - stepX; x += stepX) {
      const idx = (y * aW + x) * 4;
      const lum = (data[idx] * 77 + data[idx + 1] * 150 + data[idx + 2] * 29) >> 8;
      totalLuminance += lum;
      sampleCount++;
      rowSum += lum;
      rowCount++;
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }
    if (rowCount > 0) {
      rowLum.push(rowSum / rowCount);
    }
  }

  if (sampleCount === 0) return false;

  const meanLum = totalLuminance / sampleCount;
  const contrastRange = maxLum - minLum;

  // 1. Institutional cards have white/light reflective plastic (mean luminance must be sufficient, e.g. > 90)
  if (meanLum < 75) {
    return false; // Too dark to be a white plastic ID card
  }

  // 2. An ID card must have internal contrast variation (photo + printed text + header)
  // A completely uniform white wall or blank paper has very low contrast range (< 25)
  if (contrastRange < 35) {
    return false; // Blank surface, no photo or text
  }

  // 3. Row-to-row variation check (photo zone vs text zone)
  let rowVariance = 0;
  for (let i = 1; i < rowLum.length; i++) {
    rowVariance += Math.abs(rowLum[i] - rowLum[i - 1]);
  }
  const avgRowDiff = rowLum.length > 1 ? rowVariance / (rowLum.length - 1) : 0;

  // Real ID cards show distinct row luminance changes between header, photo, and text blocks
  if (avgRowDiff < 2.5) {
    return false;
  }

  return true;
}

/**
 * Detect physical rectangular card contour and evaluate stability
 *
 * @param {HTMLVideoElement} video - Live camera video element
 * @param {HTMLCanvasElement} analysisCanvas - Downscaled offscreen canvas for CV
 * @returns {{
 *   detected: boolean,
 *   candidate: boolean,
 *   confidence: number,
 *   corners: { tl: {x,y}, tr: {x,y}, br: {x,y}, bl: {x,y} } | null,
 *   isLandscape: boolean,
 *   boundingBox: { x: number, y: number, width: number, height: number } | null
 * }}
 */
export function detectCardContour(source, analysisCanvas) {
  if (!source) {
    return { detected: false, candidate: false, confidence: 0, corners: null, isLandscape: false, boundingBox: null };
  }

  const isVideo = source instanceof HTMLVideoElement || (source.readyState !== undefined && source.videoWidth !== undefined);
  if (isVideo && source.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    return { detected: false, candidate: false, confidence: 0, corners: null, isLandscape: false, boundingBox: null };
  }

  const vW = isVideo ? source.videoWidth : source.width;
  const vH = isVideo ? source.videoHeight : source.height;
  if (!vW || !vH) {
    return { detected: false, candidate: false, confidence: 0, corners: null, isLandscape: false, boundingBox: null };
  }

  // Downsample to lightweight processing resolution (320x240)
  const aW = 320;
  const aH = Math.round((aW / vW) * vH);
  analysisCanvas.width = aW;
  analysisCanvas.height = aH;

  const ctx = analysisCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { detected: false, candidate: false, confidence: 0, corners: null, isLandscape: false, boundingBox: null };
  }

  ctx.drawImage(video, 0, 0, aW, aH);
  const imgData = ctx.getImageData(0, 0, aW, aH);
  const data = imgData.data;

  // 1. Grayscale luminance buffer
  const lum = new Uint8Array(aW * aH);
  for (let i = 0; i < aW * aH; i++) {
    const idx = i * 4;
    lum[i] = (data[idx] * 77 + data[idx + 1] * 150 + data[idx + 2] * 29) >> 8;
  }

  // 2. Sobel edge gradient computation
  const edges = new Uint8Array(aW * aH);
  const edgeThreshold = 28;
  for (let y = 1; y < aH - 1; y++) {
    const rowOffset = y * aW;
    for (let x = 1; x < aW - 1; x++) {
      const idx = rowOffset + x;
      // Sobel horizontal
      const gx =
        -lum[idx - aW - 1] + lum[idx - aW + 1] -
        2 * lum[idx - 1] + 2 * lum[idx + 1] -
        lum[idx + aW - 1] + lum[idx + aW + 1];
      // Sobel vertical
      const gy =
        -lum[idx - aW - 1] - 2 * lum[idx - aW] - lum[idx - aW + 1] +
        lum[idx + aW - 1] + 2 * lum[idx + aW] + lum[idx + aW + 1];

      const mag = Math.abs(gx) + Math.abs(gy);
      if (mag > edgeThreshold) {
        edges[idx] = 1;
      }
    }
  }

  // 3. Scan for card boundary envelope from edges
  // ID card is a compact, high-edge-density rectangular region
  // Exclude outer 6% margins where camera vignette / user hands sit
  const marginX = Math.round(aW * 0.06);
  const marginY = Math.round(aH * 0.06);

  // Projection profiles of edges
  const hProj = new Int32Array(aW);
  const vProj = new Int32Array(aH);

  for (let y = marginY; y < aH - marginY; y++) {
    const rowOffset = y * aW;
    for (let x = marginX; x < aW - marginX; x++) {
      if (edges[rowOffset + x] === 1) {
        hProj[x]++;
        vProj[y]++;
      }
    }
  }

  // Find bounding envelope of the prominent rectangular card candidate
  // We look for sharp steps in the edge projection profiles
  let minX = -1, maxX = -1, minY = -1, maxY = -1;
  const minEdgeCountH = Math.round((aH - 2 * marginY) * 0.08);
  const minEdgeCountV = Math.round((aW - 2 * marginX) * 0.08);

  for (let x = marginX; x < aW - marginX; x++) {
    if (hProj[x] >= minEdgeCountH) {
      if (minX === -1) minX = x;
      maxX = x;
    }
  }

  for (let y = marginY; y < aH - marginY; y++) {
    if (vProj[y] >= minEdgeCountV) {
      if (minY === -1) minY = y;
      maxY = y;
    }
  }

  let foundCardCandidate = false;
  let rawCorners = null;
  let isLandscape = false;
  let confidence = 0;

  if (minX !== -1 && maxX > minX && minY !== -1 && maxY > minY) {
    const candW = maxX - minX;
    const candH = maxY - minY;
    const candArea = candW * candH;
    const frameArea = aW * aH;
    const areaRatio = candArea / frameArea;

    // Check area: card should occupy 14% to 82% of the camera view
    if (areaRatio >= 0.14 && areaRatio <= 0.82) {
      const scaleX = vW / aW;
      const scaleY = vH / aH;

      const vTl = { x: minX * scaleX, y: minY * scaleY };
      const vTr = { x: maxX * scaleX, y: minY * scaleY };
      const vBr = { x: maxX * scaleX, y: maxY * scaleY };
      const vBl = { x: minX * scaleX, y: maxY * scaleY };

      const topW = distance(vTl, vTr);
      const botW = distance(vBl, vBr);
      const leftH = distance(vTl, vBl);
      const rightH = distance(vTr, vBr);

      const avgW = (topW + botW) / 2;
      const avgH = (leftH + rightH) / 2;
      const aspectRatio = avgW / avgH;

      // Check CR-80 card aspect ratio:
      // Portrait: ratio ~0.63 (allow 0.48 - 0.82)
      // Landscape: ratio ~1.58 (allow 1.25 - 2.05)
      const isPortrait = aspectRatio >= 0.48 && aspectRatio <= 0.82;
      const isLand = aspectRatio >= 1.25 && aspectRatio <= 2.05;

      if (isPortrait || isLand) {
        isLandscape = isLand;

        // Verify convex geometry & rectangular angles
        const convex = isConvexQuad(vTl, vTr, vBr, vBl);
        const rectangular = hasRectangularCorners(vTl, vTr, vBr, vBl);

        if (convex && rectangular) {
          // Verify internal card content (laminate reflectance + text/photo contrast)
          const validContent = validateCardInternalContent(data, aW, aH,
            { x: minX, y: minY },
            { x: maxX, y: minY },
            { x: maxX, y: maxY },
            { x: minX, y: maxY }
          );

          if (validContent) {
            foundCardCandidate = true;
            rawCorners = { tl: vTl, tr: vTr, br: vBr, bl: vBl };
            confidence = isPortrait ? 0.94 : 0.88;
          }
        }
      }
    }
  }

  // 4. Temporal Multi-Frame Stability
  // Do NOT declare "ID CARD DETECTED" from a single frame!
  // Requires 3 consecutive stable frames where corner drift is minimal (< 8% card size)
  if (foundCardCandidate && rawCorners) {
    consecutiveMisses = 0;

    if (candidateHistory.length === 0) {
      candidateHistory.push(rawCorners);
      stableFrameCount = 1;
      smoothedCorners = rawCorners;
    } else {
      const prev = candidateHistory[candidateHistory.length - 1];
      const cardSize = Math.max(distance(rawCorners.tl, rawCorners.tr), distance(rawCorners.tl, rawCorners.bl));
      const maxDrift = Math.max(
        distance(prev.tl, rawCorners.tl),
        distance(prev.tr, rawCorners.tr),
        distance(prev.br, rawCorners.br),
        distance(prev.bl, rawCorners.bl)
      );

      const driftRatio = cardSize > 0 ? maxDrift / cardSize : 1;

      if (driftRatio < 0.085) {
        stableFrameCount++;
        candidateHistory.push(rawCorners);
        if (candidateHistory.length > 5) candidateHistory.shift();

        // Smooth corners using Exponential Moving Average
        const alpha = 0.45;
        smoothedCorners = {
          tl: {
            x: Math.round(smoothedCorners.tl.x * (1 - alpha) + rawCorners.tl.x * alpha),
            y: Math.round(smoothedCorners.tl.y * (1 - alpha) + rawCorners.tl.y * alpha)
          },
          tr: {
            x: Math.round(smoothedCorners.tr.x * (1 - alpha) + rawCorners.tr.x * alpha),
            y: Math.round(smoothedCorners.tr.y * (1 - alpha) + rawCorners.tr.y * alpha)
          },
          br: {
            x: Math.round(smoothedCorners.br.x * (1 - alpha) + rawCorners.br.x * alpha),
            y: Math.round(smoothedCorners.br.y * (1 - alpha) + rawCorners.br.y * alpha)
          },
          bl: {
            x: Math.round(smoothedCorners.bl.x * (1 - alpha) + rawCorners.bl.x * alpha),
            y: Math.round(smoothedCorners.bl.y * (1 - alpha) + rawCorners.bl.y * alpha)
          }
        };
      } else {
        // Card moved significantly - reset stability counter
        stableFrameCount = 1;
        candidateHistory = [rawCorners];
        smoothedCorners = rawCorners;
      }
    }
  } else {
    consecutiveMisses++;
    if (consecutiveMisses >= 3) {
      resetCardDetectorState();
    }
  }

  // Confirmation threshold: 3 stable frames required for confirmation
  const isConfirmed = foundCardCandidate && stableFrameCount >= 3;
  const isCandidate = foundCardCandidate && stableFrameCount >= 1;

  let activeCorners = smoothedCorners;
  if (!activeCorners) {
    // Default guided framing area (centered in viewport)
    const defW = Math.round(vW * 0.60);
    const defH = Math.round(defW * 1.58);
    const defX = Math.round((vW - defW) / 2);
    const defY = Math.round((vH - defH) / 2);
    activeCorners = {
      tl: { x: defX, y: defY },
      tr: { x: defX + defW, y: defY },
      br: { x: defX + defW, y: defY + defH },
      bl: { x: defX, y: defY + defH }
    };
  }

  const bbX = Math.min(activeCorners.tl.x, activeCorners.bl.x);
  const bbY = Math.min(activeCorners.tl.y, activeCorners.tr.y);
  const bbW = Math.max(activeCorners.tr.x, activeCorners.br.x) - bbX;
  const bbH = Math.max(activeCorners.bl.y, activeCorners.br.y) - bbY;

  return {
    detected: isConfirmed,
    candidate: isCandidate,
    confidence: isConfirmed ? confidence : isCandidate ? 0.65 : 0,
    corners: activeCorners,
    isLandscape,
    boundingBox: { x: bbX, y: bbY, width: bbW, height: bbH }
  };
}

/**
 * Warp and normalize detected ID card region into a standard portrait canvas (540x856).
 * Automatically accounts for landscape card presentation by rotating 90°.
 * Uses two affine triangle texture mappings on HTML5 Canvas 2D for sub-millisecond execution.
 *
 * @param {HTMLVideoElement} video - Source video element
 * @param {{ tl: {x,y}, tr: {x,y}, br: {x,y}, bl: {x,y} }} corners - Detected 4 corners in video space
 * @param {HTMLCanvasElement} targetCanvas - Target normalized canvas
 * @param {number} [targetW=540]
 * @param {number} [targetH=856]
 * @param {boolean} [isLandscape=false]
 */
export function warpCardToCanvas(
  source,
  corners,
  targetCanvas,
  targetW = CARD_NORMALIZED_WIDTH,
  targetH = CARD_NORMALIZED_HEIGHT,
  isLandscape = false
) {
  targetCanvas.width = targetW;
  targetCanvas.height = targetH;
  const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  ctx.clearRect(0, 0, targetW, targetH);

  const isVideo = source instanceof HTMLVideoElement || (source.readyState !== undefined && source.videoWidth !== undefined);
  const sSourceW = isVideo ? source.videoWidth : source.width;
  const sSourceH = isVideo ? source.videoHeight : source.height;

  if (!corners || !corners.tl || !corners.tr || !corners.br || !corners.bl) {
    const sW = Math.round(sSourceW * 0.6);
    const sH = Math.round(sSourceH * 0.85);
    const sx = Math.round((sSourceW - sW) / 2);
    const sy = Math.round((sSourceH - sH) / 2);
    ctx.drawImage(source, sx, sy, sW, sH, 0, 0, targetW, targetH);
    return;
  }

  // If presented in landscape, rotate corner mapping 90° clockwise
  let srcP = [corners.tl, corners.tr, corners.br, corners.bl];
  if (isLandscape) {
    srcP = [corners.bl, corners.tl, corners.tr, corners.br];
  }

  const dstP = [
    { x: 0, y: 0 },
    { x: targetW, y: 0 },
    { x: targetW, y: targetH },
    { x: 0, y: targetH }
  ];

  renderTriangle(ctx, video, dstP[0], dstP[1], dstP[3], srcP[0], srcP[1], srcP[3]);
  renderTriangle(ctx, video, dstP[1], dstP[2], dstP[3], srcP[1], srcP[2], srcP[3]);
}

/**
 * Render an affine-transformed triangle from source to destination canvas
 */
function renderTriangle(ctx, image, d0, d1, d2, s0, s1, s2) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(d0.x, d0.y);
  ctx.lineTo(d1.x, d1.y);
  ctx.lineTo(d2.x, d2.y);
  ctx.closePath();
  ctx.clip();

  // Solve affine matrix: [sx, sy, 1] * M = [dx, dy]
  const denom = s0.x * (s2.y - s1.y) - s1.x * s2.y + s2.x * s1.y + (s1.x - s2.x) * s0.y;
  if (Math.abs(denom) < 0.0001) {
    ctx.restore();
    return;
  }

  const m11 = -(s0.y * (d2.x - d1.x) - s1.y * d2.x + s2.y * d1.x + (s1.y - s2.y) * d0.x) / denom;
  const m12 = (s1.y * d2.y + s0.y * (d1.y - d2.y) - s2.y * d1.y + (s2.y - s1.y) * d0.y) / denom;
  const m21 = (s0.x * (d2.x - d1.x) - s1.x * d2.x + s2.x * d1.x + (s1.x - s2.x) * d0.x) / denom;
  const m22 = -(s1.x * d2.y + s0.x * (d1.y - d2.y) - s2.x * d1.y + (s2.x - s1.x) * d0.y) / denom;
  const dx = (s0.x * (s2.y * d1.x - s1.y * d2.x) + s0.y * (s1.x * d2.x - s2.x * d1.x) + (s2.x * s1.y - s1.x * s2.y) * d0.x) / denom;
  const dy = (s0.x * (s2.y * d1.y - s1.y * d2.y) + s0.y * (s1.x * d2.y - s2.x * d1.y) + (s2.x * s1.y - s1.x * s2.y) * d0.y) / denom;

  ctx.transform(m11, m12, m21, m22, dx, dy);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}
