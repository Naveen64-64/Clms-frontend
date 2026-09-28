import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import {
  Camera,
  CameraOff,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  LogOut,
  Maximize2,
  Sparkles,
  SwitchCamera
} from 'lucide-react';
import { analyzeFrame, computeROI, resetStabilityTracker } from '../../lib/frameAnalyzer';
import { getPreprocessingPipelines } from '../../lib/imagePreprocessor';
import { extractRollNumbers } from '../../lib/rollNumberExtractor';

// ── Dev logging ────────────────────────────────────────────────────────
const DEV = import.meta.env.DEV;
const log = (...args) => DEV && console.log('[ScannerKiosk]', ...args);

// ── Scanner State Machine ──────────────────────────────────────────────
const STATE = {
  IDLE: 'IDLE',
  CAMERA_STARTING: 'CAMERA_STARTING',
  SCANNING: 'SCANNING',
  CAPTURING: 'CAPTURING',
  OCR_PROCESSING: 'OCR_PROCESSING',
  SUCCESS_POPUP: 'SUCCESS_POPUP',
  CAMERA_ERROR: 'CAMERA_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
};

// ── Constants ──────────────────────────────────────────────────────────
const ANALYSIS_INTERVAL_MS = 100;    // ~10 FPS for frame analysis
const STANDBY_TIMEOUT_MS = 4500;     // Enter standby after 4.5s of no card/motion
const POPUP_DURATION_MS = 1500;      // User details popup stays for exactly 1.5s
const COOLDOWN_SAME_USER_MS = 4000;  // Ignore same roll number for 4s after scan

export const IDCardScanner = ({ onRollNumberDetected, disabled = false }) => {
  const [scannerState, setScannerState] = useState(STATE.CAMERA_STARTING);
  const [errorMessage, setErrorMessage] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);

  // Real-time guidance from frame analyzer
  const [guidance, setGuidance] = useState('Place your KIET ID card inside the frame');
  const [guidanceType, setGuidanceType] = useState('idle'); // 'idle' | 'warning' | 'good' | 'capture'

  // Standby mode (dims when no card is in front of webcam)
  const [isStandby, setIsStandby] = useState(false);

  // 1.5s Center Popup state
  const [popupData, setPopupData] = useState(null);

  // Camera & stream state
  const [mediaStream, setMediaStream] = useState(null);
  const [videoAspect, setVideoAspect] = useState(16 / 9);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isFlashActive, setIsFlashActive] = useState(false);

  // Refs for mutable state across animation loops
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const workerRef = useRef(null);
  const barcodeDetectorRef = useRef(null);
  const animFrameRef = useRef(null);
  const isMountedRef = useRef(true);
  const stateRef = useRef(STATE.CAMERA_STARTING);
  const isProcessingOCRRef = useRef(false);
  const roiRef = useRef(null);
  const lastMotionOrCardRef = useRef(Date.now());
  const recentScansCooldownRef = useRef(new Map());
  const lastBarcodeCheckTimeRef = useRef(0);

  // Sync stateRef
  const updateState = useCallback((newState) => {
    stateRef.current = newState;
    setScannerState(newState);
  }, []);

  // ── Camera Cleanup ───────────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) { /* ignore */ }
      });
      streamRef.current = null;
    }
    setMediaStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const stopAnalysisLoop = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const terminateWorker = useCallback(async () => {
    if (workerRef.current) {
      try { await workerRef.current.terminate(); } catch (e) { /* ignore */ }
      workerRef.current = null;
    }
  }, []);

  const fullCleanup = useCallback(() => {
    stopAnalysisLoop();
    stopCamera();
    terminateWorker();
    resetStabilityTracker();
  }, [stopAnalysisLoop, stopCamera, terminateWorker]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      fullCleanup();
    };
  }, [fullCleanup]);

  // ── Video Stream Binding ─────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (mediaStream) {
      video.srcObject = mediaStream;

      const handleLoadedMetadata = () => {
        if (video.videoWidth && video.videoHeight) {
          setVideoAspect(video.videoWidth / video.videoHeight);
        }
        video.play().catch(err => {
          log('video.play() notice on loadedmetadata:', err);
        });
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.play().catch(err => {
        log('Immediate play notice:', err);
      });

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    } else {
      video.srcObject = null;
    }
  }, [mediaStream]);

  // ── Tesseract Worker Management ──────────────────────────────────────

  const ensureWorker = useCallback(async () => {
    if (workerRef.current) return workerRef.current;

    log('Initializing fast Tesseract worker...');
    const worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && isMountedRef.current) {
          setOcrProgress(Math.round(m.progress * 100));
        }
      }
    });

    if (!isMountedRef.current) {
      await worker.terminate();
      return null;
    }

    workerRef.current = worker;
    log('Tesseract worker ready');
    return worker;
  }, []);

  // ── Native Barcode/QR Code Fast-Path ─────────────────────────────────

  const checkBarcodeFastPath = useCallback(async (video) => {
    if (typeof window === 'undefined' || !('BarcodeDetector' in window)) return null;
    try {
      if (!barcodeDetectorRef.current) {
        barcodeDetectorRef.current = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39']
        });
      }
      const barcodes = await barcodeDetectorRef.current.detect(video);
      if (barcodes && barcodes.length > 0) {
        for (const item of barcodes) {
          const raw = item.rawValue || '';
          const rollNumbers = extractRollNumbers(raw);
          if (rollNumbers.length > 0) {
            log('⚡ Fast QR code detection hit:', rollNumbers[0]);
            return rollNumbers[0];
          }
        }
      }
    } catch (e) {
      // BarcodeDetector failed or format unsupported
    }
    return null;
  }, []);

  // ── OCR Pipeline ─────────────────────────────────────────────────────

  const runOCRPipeline = useCallback(async (frameCanvas, roi) => {
    const worker = await ensureWorker();
    if (!worker || !isMountedRef.current) return null;

    const pipelines = getPreprocessingPipelines();
    const maxAttempts = Math.min(2, pipelines.length); // 2 fast attempts

    for (let i = 0; i < maxAttempts; i++) {
      if (!isMountedRef.current) return null;

      const pipeline = pipelines[i];
      setOcrProgress(0);

      try {
        const processedCanvas = pipeline.process(frameCanvas, roi);
        const imageDataUrl = processedCanvas.toDataURL('image/png');

        const { data: { text } } = await worker.recognize(imageDataUrl);

        if (!isMountedRef.current) return null;

        const rollNumbers = extractRollNumbers(text);
        if (rollNumbers.length > 0) {
          log(`✅ OCR Match: ${rollNumbers[0]} (${pipeline.name})`);
          return rollNumbers[0];
        }
      } catch (err) {
        log(`OCR attempt ${i + 1} note:`, err);
      }
    }

    return null;
  }, [ensureWorker]);

  // ── Overlay Drawing with Dynamic Guidance ────────────────────────────

  const drawOverlay = useCallback((roi, videoW, videoH, currentGuidanceType) => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;

    if (overlayCanvas.width !== videoW) overlayCanvas.width = videoW;
    if (overlayCanvas.height !== videoH) overlayCanvas.height = videoH;

    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, videoW, videoH);

    // Dim the area outside the ROI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
    ctx.fillRect(0, 0, videoW, videoH);

    // Clear ROI area
    ctx.clearRect(roi.x, roi.y, roi.w, roi.h);

    // Dynamic border color based on user positioning
    let borderColor = 'rgba(255, 255, 255, 0.4)';
    let cornerColor = '#8D6B94';

    if (currentGuidanceType === 'warning') {
      borderColor = 'rgba(245, 158, 11, 0.65)';
      cornerColor = '#F59E0B'; // Amber alert
    } else if (currentGuidanceType === 'good' || currentGuidanceType === 'capture') {
      borderColor = 'rgba(16, 185, 129, 0.85)';
      cornerColor = '#10B981'; // Vibrant emerald
    }

    // Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(roi.x, roi.y, roi.w, roi.h);

    // Dynamic Corner Markers
    const cornerLen = Math.min(32, roi.w * 0.09);
    ctx.strokeStyle = cornerColor;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';

    // Top-left
    ctx.beginPath();
    ctx.moveTo(roi.x, roi.y + cornerLen);
    ctx.lineTo(roi.x, roi.y);
    ctx.lineTo(roi.x + cornerLen, roi.y);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(roi.x + roi.w - cornerLen, roi.y);
    ctx.lineTo(roi.x + roi.w, roi.y);
    ctx.lineTo(roi.x + roi.w, roi.y + cornerLen);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(roi.x, roi.y + roi.h - cornerLen);
    ctx.lineTo(roi.x, roi.y + roi.h);
    ctx.lineTo(roi.x + cornerLen, roi.y + roi.h);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(roi.x + roi.w - cornerLen, roi.y + roi.h);
    ctx.lineTo(roi.x + roi.w, roi.y + roi.h);
    ctx.lineTo(roi.x + roi.w, roi.y + roi.h - cornerLen);
    ctx.stroke();

    // Active Scanning Line Animation
    if (currentGuidanceType === 'good' || currentGuidanceType === 'capture') {
      const t = (Date.now() % 1800) / 1800;
      const lineY = roi.y + roi.h * (0.15 + 0.7 * Math.sin(t * Math.PI));
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.4 + 0.4 * Math.sin(t * Math.PI * 2)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(roi.x + 8, lineY);
      ctx.lineTo(roi.x + roi.w - 8, lineY);
      ctx.stroke();
    }
  }, []);

  // ── Successful Identification Handler (1.5s Popup + Next User) ─────

  const handleIdentificationSuccess = useCallback(async (rollNumber) => {
    // Check cooldown for the exact same student (e.g. 4 seconds)
    const cooldownUntil = recentScansCooldownRef.current.get(rollNumber);
    if (cooldownUntil && Date.now() < cooldownUntil) {
      log(`Ignoring repeated scan for ${rollNumber} during cooldown`);
      return;
    }

    log(`🚀 Extracted Roll Number: ${rollNumber} — Submitting to gate...`);
    updateState(STATE.SUCCESS_POPUP);
    setIsFlashActive(true);
    setTimeout(() => { if (isMountedRef.current) setIsFlashActive(false); }, 250);

    // Call backend gate entry/exit API via parent
    let gateResult = null;
    if (onRollNumberDetected) {
      try {
        gateResult = await onRollNumberDetected(rollNumber);
      } catch (err) {
        log('Gate API error:', err);
      }
    }

    if (!isMountedRef.current) return;

    // Build popup data from backend response
    const data = gateResult?.data;
    const isSuccess = gateResult?.success !== false;

    if (isSuccess && data) {
      setPopupData({
        type: 'success',
        action: data.action || data.status || 'IN',
        name: data.userName || data.name || data.studentName || 'Student',
        rollNumber: data.rollNumber || data.userId || rollNumber,
        library: data.library?.name || 'KIET Library',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        occupancy: data.occupancy
      });
    } else {
      // Error popup
      setPopupData({
        type: 'error',
        action: 'DENIED',
        name: 'Access Notice',
        rollNumber: rollNumber,
        library: 'KIET Library',
        message: gateResult?.error?.message || 'Check-in/out rejected',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    // Set cooldown for this roll number
    recentScansCooldownRef.current.set(rollNumber, Date.now() + COOLDOWN_SAME_USER_MS);

    // EXACTLY 1.5 SECONDS POPUP — then auto-reset for next user!
    setTimeout(() => {
      if (!isMountedRef.current) return;
      setPopupData(null);
      resetStabilityTracker();
      isProcessingOCRRef.current = false;
      updateState(STATE.SCANNING);
      log('✨ Ready for next student!');
    }, POPUP_DURATION_MS);

  }, [onRollNumberDetected, updateState]);

  // ── Auto-Capture Trigger ─────────────────────────────────────────────

  const triggerCapture = useCallback(async (frameCanvas, roi) => {
    if (isProcessingOCRRef.current || !isMountedRef.current) return;

    isProcessingOCRRef.current = true;
    updateState(STATE.CAPTURING);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState >= 2) {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
    }

    updateState(STATE.OCR_PROCESSING);

    try {
      const rollNumber = await runOCRPipeline(frameCanvas, roi);

      if (!isMountedRef.current) {
        isProcessingOCRRef.current = false;
        return;
      }

      if (rollNumber) {
        await handleIdentificationSuccess(rollNumber);
      } else {
        // Did not match — resume scanning immediately
        resetStabilityTracker();
        isProcessingOCRRef.current = false;
        updateState(STATE.SCANNING);
      }
    } catch (err) {
      log('OCR capture error:', err);
      if (isMountedRef.current) {
        resetStabilityTracker();
        isProcessingOCRRef.current = false;
        updateState(STATE.SCANNING);
      }
    }
  }, [runOCRPipeline, handleIdentificationSuccess, updateState]);

  // ── Main Continuous Autonomous Scanning Loop ────────────────────────

  const startAnalysisLoop = useCallback(() => {
    let lastAnalysisTime = 0;

    const loop = async (timestamp) => {
      if (!isMountedRef.current) return;

      const currentState = stateRef.current;

      // Only run during active scanning state
      if (currentState !== STATE.SCANNING) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      // Throttle when in standby to save power, otherwise ~10 FPS
      const interval = isStandby ? 350 : ANALYSIS_INTERVAL_MS;
      if (timestamp - lastAnalysisTime < interval) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }
      lastAnalysisTime = timestamp;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      // Draw current video frame to processing canvas
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Compute ROI
      const roi = computeROI(video.videoWidth, video.videoHeight);
      roiRef.current = roi;

      // Analyze frame quality & position
      const analysis = analyzeFrame(ctx, roi);

      if (!isMountedRef.current) return;

      // Standby Power-Save Logic:
      // If motion/card detected, wake up and reset idle timer.
      if (analysis.hasMotion || analysis.isCardPresent) {
        lastMotionOrCardRef.current = Date.now();
        if (isStandby) {
          setIsStandby(false);
        }
      } else if (Date.now() - lastMotionOrCardRef.current > STANDBY_TIMEOUT_MS) {
        if (!isStandby) {
          setIsStandby(true);
        }
      }

      // Update real-time guidance
      setGuidance(analysis.guidance);
      setGuidanceType(analysis.guidanceType);

      // Draw overlay brackets and scanlines
      drawOverlay(roi, video.videoWidth, video.videoHeight, analysis.guidanceType);

      // Fast-path: Check Barcode/QR Code on card every 300ms
      if (!isProcessingOCRRef.current && (Date.now() - lastBarcodeCheckTimeRef.current > 300)) {
        lastBarcodeCheckTimeRef.current = Date.now();
        const qrRollNumber = await checkBarcodeFastPath(video);
        if (qrRollNumber) {
          await handleIdentificationSuccess(qrRollNumber);
          animFrameRef.current = requestAnimationFrame(loop);
          return;
        }
      }

      // If card is positioned and stable, trigger OCR capture automatically
      if (analysis.isReadyForCapture && !isProcessingOCRRef.current) {
        triggerCapture(canvas, roi);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, [isStandby, drawOverlay, checkBarcodeFastPath, handleIdentificationSuccess, triggerCapture]);

  // ── Camera Error Handler ───────────────────────────────────────────

  const handleCameraError = useCallback((err) => {
    stopCamera();
    stopAnalysisLoop();

    const errName = err?.name || '';
    const errMsg = err?.message || '';

    if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
      updateState(STATE.PERMISSION_DENIED);
      setErrorMessage('Camera access was denied. Please allow camera permissions in your browser bar.');
    } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
      updateState(STATE.CAMERA_ERROR);
      setErrorMessage('No camera found. Please connect a webcam to continue.');
    } else {
      updateState(STATE.CAMERA_ERROR);
      setErrorMessage(`Camera error: ${errMsg || 'Unable to open camera.'}`);
    }
  }, [stopCamera, stopAnalysisLoop, updateState]);

  // ── Camera Startup (Fully Automatic) ────────────────────────────────

  const startCamera = useCallback(async (targetDeviceId = null) => {
    try {
      updateState(STATE.CAMERA_STARTING);
      setErrorMessage('');
      setPopupData(null);
      resetStabilityTracker();
      isProcessingOCRRef.current = false;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setMediaStream(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        throw { name: 'NotSupportedError', message: 'BROWSER_NOT_SUPPORTED' };
      }

      const constraintsList = [];
      if (targetDeviceId) {
        constraintsList.push({
          video: { deviceId: { exact: targetDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
      }
      constraintsList.push({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      constraintsList.push({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      constraintsList.push({ video: true });

      let stream = null;
      let lastErr = null;

      for (const constraints of constraintsList) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream && stream.getVideoTracks().length > 0) break;
        } catch (err) {
          lastErr = err;
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') throw err;
        }
      }

      if (!stream) throw lastErr || new Error('Could not access camera');

      if (!isMountedRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      streamRef.current = stream;
      setMediaStream(stream);

      // Check available cameras
      try {
        if (navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter(d => d.kind === 'videoinput');
          setAvailableCameras(videoInputs);
          if (targetDeviceId) {
            const idx = videoInputs.findIndex(d => d.deviceId === targetDeviceId);
            if (idx !== -1) setCurrentCameraIndex(idx);
          }
        }
      } catch (e) { /* ignore */ }

      // Pre-warm Tesseract worker
      ensureWorker().catch(console.warn);

      updateState(STATE.SCANNING);
      startAnalysisLoop();

    } catch (err) {
      if (!isMountedRef.current) return;
      handleCameraError(err);
    }
  }, [updateState, ensureWorker, startAnalysisLoop, handleCameraError]);

  // AUTO-START ON MOUNT: No user button click needed!
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  const handleSwitchCamera = useCallback(() => {
    if (availableCameras.length <= 1) return;
    const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
    setCurrentCameraIndex(nextIndex);
    const nextDevice = availableCameras[nextIndex];
    if (nextDevice?.deviceId) {
      startCamera(nextDevice.deviceId);
    }
  }, [availableCameras, currentCameraIndex, startCamera]);

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Scanner Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#8D6B94]/15 dark:bg-[#B185A7]/15 rounded-lg">
            <ScanLine className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9] uppercase tracking-wider flex items-center gap-1.5">
              ID-Vision
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h3>
            <p className="text-[10px] text-[#7A697E] dark:text-[#B8A6BD] font-medium">
              Touch-free • Auto-detects KIET Student ID & logs entry/exit
            </p>
          </div>
        </div>

        {availableCameras.length > 1 && (
          <button
            type="button"
            onClick={handleSwitchCamera}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-[#2D2534] border border-[#E8DBC5] dark:border-[#3B3142] text-[11px] font-semibold text-[#7A697E] dark:text-[#B8A6BD] hover:bg-[#E8DBC5]/20 cursor-pointer shadow-2xs"
            title="Switch webcam"
          >
            <SwitchCamera className="w-3.5 h-3.5 mr-0.5" />
            Switch Camera
          </button>
        )}
      </div>

      {/* ── CAMERA / KIOSK FRAME ───────────────────────────────────── */}
      <div
        className={`relative rounded-2xl overflow-hidden bg-black border-2 transition-all duration-300 shadow-lg ${
          isFlashActive
            ? 'border-emerald-400 ring-4 ring-emerald-400/40'
            : 'border-[#E8DBC5] dark:border-[#3B3142]'
        }`}
        style={{
          aspectRatio: videoAspect ? `${videoAspect}` : '16/9',
          maxHeight: '460px'
        }}
      >
        {/* Live video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-contain bg-black transition-opacity duration-500 ${
            isStandby ? 'opacity-35' : 'opacity-100'
          }`}
        />

        {/* Canvas overlay for scanning rectangle + corner markers */}
        <canvas
          ref={overlayCanvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${
            isStandby ? 'opacity-20' : 'opacity-100'
          }`}
        />

        {/* ── REAL-TIME POSITIONING GUIDANCE HUD (Top Center) ────── */}
        {!isStandby && scannerState === STATE.SCANNING && (
          <div className="absolute top-3 left-0 right-0 flex justify-center pointer-events-none z-10 px-4">
            <div
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide backdrop-blur-md shadow-md transition-all duration-200 flex items-center gap-2 border ${
                guidanceType === 'warning'
                  ? 'bg-amber-500/90 text-amber-950 border-amber-300 animate-bounce'
                  : guidanceType === 'good' || guidanceType === 'capture'
                  ? 'bg-emerald-500/90 text-white border-emerald-300 shadow-emerald-500/30 ring-2 ring-emerald-400/50'
                  : 'bg-black/65 text-white/90 border-white/20'
              }`}
            >
              {guidanceType === 'warning' && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
              {guidanceType === 'good' && <Sparkles className="w-3.5 h-3.5 shrink-0 animate-spin" />}
              {guidanceType === 'idle' && <ScanLine className="w-3.5 h-3.5 shrink-0 text-[#B185A7]" />}
              <span>{guidance}</span>
            </div>
          </div>
        )}

        {/* ── STANDBY / POWER-SAVE OVERLAY ─────────────────────────── */}
        {isStandby && scannerState === STATE.SCANNING && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center z-15 transition-all duration-500">
            <div className="w-14 h-14 rounded-full bg-[#8D6B94]/20 border border-[#8D6B94]/40 flex items-center justify-center mb-3 animate-pulse">
              <ScanLine className="w-7 h-7 text-[#B185A7]" />
            </div>
            <h4 className="text-base font-bold text-white tracking-wide">
              Kiosk Standby
            </h4>
            <p className="text-xs text-[#E8DBC5]/80 mt-1 max-w-xs leading-relaxed">
              Show your KIET ID card in front of the camera to wake and scan automatically
            </p>
            <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[10px] text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Sensor Active
            </div>
          </div>
        )}

        {/* ── CAMERA STARTING OVERLAY ──────────────────────────────── */}
        {scannerState === STATE.CAMERA_STARTING && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center z-20">
            <Loader2 className="w-10 h-10 text-[#B185A7] animate-spin mb-3" />
            <p className="text-sm font-bold text-white">Starting Auto-Scanner...</p>
            <p className="text-xs text-[#B8A6BD] mt-1">
              Initializing camera kiosk. Please allow camera permissions if prompted.
            </p>
          </div>
        )}

        {/* ── OCR PROCESSING OVERLAY ───────────────────────────────── */}
        {scannerState === STATE.OCR_PROCESSING && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-20">
            <div className="bg-black/90 rounded-2xl px-6 py-5 text-center shadow-2xl border border-white/15 max-w-xs">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-2.5" />
              <p className="text-sm text-white font-bold">Reading ID Card...</p>
              <p className="text-[11px] text-emerald-300 mt-1">Extracting Roll Number</p>
              {ocrProgress > 0 && (
                <div className="w-36 bg-white/20 rounded-full h-1.5 mt-3 mx-auto overflow-hidden">
                  <div
                    className="bg-emerald-400 h-1.5 rounded-full transition-all duration-150"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 1.5-SECOND CENTER SUCCESS POPUP WITH USER DETAILS ────── */}
        {popupData && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-30 animate-in fade-in duration-200">
            <div
              className={`w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl border-2 transition-all ${
                popupData.type === 'success'
                  ? popupData.action === 'IN'
                    ? 'bg-[#12231A]/95 border-emerald-500 shadow-emerald-500/25 ring-2 ring-emerald-500/30'
                    : 'bg-[#1E1624]/95 border-[#B185A7] shadow-[#B185A7]/25 ring-2 ring-[#B185A7]/30'
                  : 'bg-rose-950/95 border-rose-500 shadow-rose-500/25'
              }`}
            >
              {/* Header Action Badge */}
              <div className="flex justify-center mb-3">
                {popupData.type === 'success' ? (
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase shadow-sm ${
                      popupData.action === 'IN'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#8D6B94] text-white'
                    }`}
                  >
                    {popupData.action === 'IN' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                    <span>{popupData.action === 'IN' ? 'CHECKED IN (ENTRY)' : 'CHECKED OUT (EXIT)'}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase bg-rose-600 text-white">
                    <AlertCircle className="w-4 h-4" />
                    <span>{popupData.action}</span>
                  </div>
                )}
              </div>

              {/* Student Name */}
              <h2 className="text-lg sm:text-xl font-black text-white tracking-wide truncate">
                {popupData.name}
              </h2>

              {/* Roll Number in bold monospace */}
              <div className="my-2.5 inline-block px-4 py-1.5 rounded-lg bg-white/10 border border-white/20">
                <span className="font-mono text-base font-extrabold text-emerald-300 tracking-wider">
                  {popupData.rollNumber}
                </span>
              </div>

              {/* Meta information row */}
              <p className="text-xs text-white/70">
                {popupData.message || `${popupData.library} • ${popupData.time}`}
              </p>

              {/* Animated 1.5-second countdown bar */}
              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="w-full bg-white/15 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{
                      animation: 'kioskCountdown 1.5s linear forwards'
                    }}
                  />
                </div>
                <p className="text-[10px] text-white/50 mt-1 font-medium tracking-wide">
                  Ready for next user in 1.5s...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── PERMISSION DENIED ALERT ─────────────────────────────────── */}
      {scannerState === STATE.PERMISSION_DENIED && (
        <Alert variant="destructive" className="border-amber-300 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-2.5">
            <CameraOff className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-2 w-full">
              <p className="text-sm font-bold">Camera Permission Required</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">{errorMessage}</p>
              <button
                type="button"
                onClick={() => startCamera()}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
              >
                Grant & Retry
              </button>
            </div>
          </div>
        </Alert>
      )}

      {/* ── CAMERA ERROR ALERT ──────────────────────────────────────── */}
      {scannerState === STATE.CAMERA_ERROR && (
        <Alert variant="destructive" className="border-rose-300 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-2 w-full">
              <p className="text-sm font-bold">Webcam Error</p>
              <p className="text-xs text-rose-700 dark:text-rose-300">{errorMessage}</p>
              <button
                type="button"
                onClick={() => startCamera()}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Retry Camera
              </button>
            </div>
          </div>
        </Alert>
      )}

      {/* Injected countdown bar keyframes */}
      <style>{`
        @keyframes kioskCountdown {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default IDCardScanner;
