/**
 * Lightweight Frame-Differencing Motion Detector
 *
 * Runs at low resolution (160x120) to detect when a card or hand enters the scanning area.
 * Prevents expensive continuous computer vision or OCR passes when the camera is idle.
 */

export class MotionDetector {
  /**
   * @param {Object} [options]
   * @param {number} [options.width=160] - Analysis width
   * @param {number} [options.height=120] - Analysis height
   * @param {number} [options.threshold=20] - Luminance difference threshold per pixel (0-255)
   * @param {number} [options.minMotionRatio=0.06] - Percentage of pixels that must change (6%)
   * @param {number} [options.cooldownMs=800] - Minimum time between motion triggers
   */
  constructor(options = {}) {
    this.width = options.width || 160;
    this.height = options.height || 120;
    this.threshold = options.threshold || 20;
    this.minMotionRatio = options.minMotionRatio || 0.06;
    this.cooldownMs = options.cooldownMs || 800;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    this.prevFrame = null;
    this.lastTriggerTime = 0;
    this.isPaused = false;
  }

  /**
   * Reset motion history
   */
  reset() {
    this.prevFrame = null;
    this.lastTriggerTime = 0;
  }

  /**
   * Pause motion detection (e.g. while snapshot processing or in cooldown)
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resume motion detection
   */
  resume() {
    this.isPaused = false;
    this.prevFrame = null; // Discard stale frame on resume
  }

  /**
   * Check video element for significant motion
   *
   * @param {HTMLVideoElement} video
   * @returns {{ hasMotion: boolean, score: number, changedPixels: number }}
   */
  checkMotion(video) {
    if (this.isPaused || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return { hasMotion: false, score: 0, changedPixels: 0 };
    }

    const now = Date.now();
    if (now - this.lastTriggerTime < this.cooldownMs) {
      return { hasMotion: false, score: 0, changedPixels: 0 };
    }

    this.ctx.drawImage(video, 0, 0, this.width, this.height);
    const imgData = this.ctx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;
    const totalPixels = this.width * this.height;
    const currentGray = new Uint8Array(totalPixels);

    // Compute grayscale
    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      currentGray[i] = (data[idx] * 77 + data[idx + 1] * 150 + data[idx + 2] * 29) >> 8;
    }

    if (!this.prevFrame) {
      this.prevFrame = currentGray;
      return { hasMotion: false, score: 0, changedPixels: 0 };
    }

    // Step by 2 pixels for extreme CPU efficiency
    let changed = 0;
    let sampled = 0;
    for (let i = 0; i < totalPixels; i += 2) {
      sampled++;
      const diff = Math.abs(currentGray[i] - this.prevFrame[i]);
      if (diff > this.threshold) {
        changed++;
      }
    }

    this.prevFrame = currentGray;
    const score = changed / sampled;
    const hasMotion = score >= this.minMotionRatio;

    if (hasMotion) {
      this.lastTriggerTime = now;
    }

    return {
      hasMotion,
      score: Math.round(score * 100),
      changedPixels: changed
    };
  }
}
