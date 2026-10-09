/**
 * Preloaded Tesseract OCR Engine Singleton
 *
 * Ensures Tesseract.js WebAssembly core and English LSTM model are downloaded and cached
 * as soon as the Library Entrance Kiosk opens. Eliminates the multi-second startup delay
 * during the user's first ID card scan.
 */

import { createWorker } from 'tesseract.js';

let workerInstance = null;
let initPromise = null;
let engineStatus = 'UNINITIALIZED'; // 'UNINITIALIZED' | 'INITIALIZING' | 'READY' | 'ERROR'
let initError = null;

const listeners = new Set();

function notifyListeners() {
  for (const listener of listeners) {
    try {
      listener(engineStatus, initError);
    } catch (e) {}
  }
}

/**
 * Subscribe to OCR engine readiness state updates
 * @param {Function} callback - (status, error) => void
 * @returns {Function} Unsubscribe function
 */
export function onOcrEngineStateChange(callback) {
  listeners.add(callback);
  callback(engineStatus, initError);
  return () => listeners.delete(callback);
}

/**
 * Preload and initialize OCR engine singleton
 * @returns {Promise<Worker>}
 */
export async function initOcrEngine() {
  if (workerInstance && engineStatus === 'READY') {
    return workerInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  engineStatus = 'INITIALIZING';
  notifyListeners();

  initPromise = (async () => {
    try {
      // Initialize Tesseract English worker
      const worker = await createWorker('eng');

      // Configure whitelist for uppercase student roll numbers and single line mode (PSM 7)
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        tessedit_pageseg_mode: '7' // Single uniform text line mode
      });

      workerInstance = worker;
      engineStatus = 'READY';
      initError = null;
      notifyListeners();
      return worker;
    } catch (err) {
      console.error('[OCR Engine] Preload failed:', err);
      engineStatus = 'ERROR';
      initError = err.message || 'Failed to initialize OCR Engine';
      notifyListeners();
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

/**
 * Returns current OCR engine status
 * @returns {'UNINITIALIZED' | 'INITIALIZING' | 'READY' | 'ERROR'}
 */
export function getOcrStatus() {
  return engineStatus;
}

/**
 * Check if the OCR engine is ready for recognition
 * @returns {boolean}
 */
export function isOcrReady() {
  return engineStatus === 'READY' && Boolean(workerInstance);
}

/**
 * Recognize text from a canvas using the preloaded worker
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Object} [options]
 * @returns {Promise<{ text: string, confidence: number }>}
 */
export async function recognizeCanvas(canvas, options = {}) {
  const worker = await initOcrEngine();
  if (!worker) {
    throw new Error('OCR Worker unavailable');
  }

  const result = await worker.recognize(canvas, options);
  return {
    text: result?.data?.text || '',
    confidence: result?.data?.confidence || 0
  };
}

/**
 * Terminate worker and free WebAssembly resources
 */
export async function terminateOcrEngine() {
  if (workerInstance) {
    try {
      await workerInstance.terminate();
    } catch (e) {}
    workerInstance = null;
  }
  initPromise = null;
  engineStatus = 'UNINITIALIZED';
  notifyListeners();
}
