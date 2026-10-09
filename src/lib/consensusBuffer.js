/**
 * Temporal Multi-Frame Consensus Engine for ID Card OCR
 *
 * Prevents random OCR misreads caused by motion blur, hand shake, or lighting glare.
 * Maintains a rolling window of candidate detections across consecutive video frames
 * and determines consensus confidence before triggering database verification.
 */

export class TemporalConsensusBuffer {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxWindowMs=1500] - Window duration in milliseconds
   * @param {number} [options.minOccurrences=2] - Minimum detections required for consensus
   * @param {number} [options.highConfidenceThreshold=85] - Single-frame confidence threshold to bypass multi-frame requirement
   */
  constructor(options = {}) {
    this.maxWindowMs = options.maxWindowMs || 1500;
    this.minOccurrences = options.minOccurrences || 2;
    this.highConfidenceThreshold = options.highConfidenceThreshold || 85;
    this.observations = []; // { candidate: string, confidence: number, timestamp: number }
  }

  /**
   * Reset all observations in buffer
   */
  reset() {
    this.observations = [];
  }

  /**
   * Push a candidate detection into the buffer
   * @param {string} candidate - 10-char roll number
   * @param {number} [confidence=70] - OCR confidence score
   */
  addObservation(candidate, confidence = 70) {
    if (!candidate || typeof candidate !== 'string') return;
    const now = Date.now();
    const clean = candidate.trim().toUpperCase();

    // Clean expired observations
    this.observations = this.observations.filter((obs) => now - obs.timestamp <= this.maxWindowMs);

    this.observations.push({
      candidate: clean,
      confidence,
      timestamp: now
    });
  }

  /**
   * Evaluate whether any candidate in the buffer has achieved consensus
   * @returns {{
   *   hasConsensus: boolean,
   *   acceptedCandidate: string | null,
   *   allCandidates: string[],
   *   count: number,
   *   avgConfidence: number
   * }}
   */
  evaluate() {
    const now = Date.now();
    this.observations = this.observations.filter((obs) => now - obs.timestamp <= this.maxWindowMs);

    if (this.observations.length === 0) {
      return { hasConsensus: false, acceptedCandidate: null, allCandidates: [], count: 0, avgConfidence: 0 };
    }

    // Group by candidate string
    const map = new Map();
    for (const obs of this.observations) {
      const entry = map.get(obs.candidate) || { count: 0, totalConf: 0, lastTime: obs.timestamp };
      entry.count++;
      entry.totalConf += obs.confidence;
      entry.lastTime = obs.timestamp;
      map.set(obs.candidate, entry);
    }

    // Sort by count descending, then confidence
    const ranked = Array.from(map.entries()).map(([candidate, data]) => ({
      candidate,
      count: data.count,
      avgConfidence: data.totalConf / data.count,
      lastTime: data.lastTime
    }));

    ranked.sort((a, b) => b.count - a.count || b.avgConfidence - a.avgConfidence);

    const best = ranked[0];

    // Consensus rule:
    // 1. Candidate detected 2 or more times, OR
    // 2. Candidate has single-frame confidence >= highConfidenceThreshold (e.g. 85%)
    const hasConsensus = best.count >= this.minOccurrences || best.avgConfidence >= this.highConfidenceThreshold;

    return {
      hasConsensus,
      acceptedCandidate: best.candidate,
      allCandidates: ranked.map((r) => r.candidate),
      count: best.count,
      avgConfidence: Math.round(best.avgConfidence)
    };
  }
}
