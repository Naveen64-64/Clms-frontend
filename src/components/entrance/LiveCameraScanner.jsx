import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MotionDetector } from '../../lib/motionDetector';
import { captureBestFrame } from '../../lib/frameCapture';
import {
  detectCardContour,
  warpCardToCanvas,
  resetCardDetectorState,
  CARD_NORMALIZED_WIDTH,
  CARD_NORMALIZED_HEIGHT
} from '../../lib/cardDetector';
import {
  extractRollNumberCandidate,
  isValidRollNumberPattern,
  getCardRoiSlices,
  preprocessCanvas
} from '../../lib/rollNumberOcr';
import {
  initOcrEngine,
  isOcrReady,
  recognizeCanvas,
  onOcrEngineStateChange
} from '../../lib/ocrEngine';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Camera,
  CameraOff,
  Zap,
  ZapOff,
  RotateCcw,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  SwitchCamera,
  Terminal,
  ChevronDown,
  ChevronUp,
  Flame,
  LogOut
} from 'lucide-react';

/**
 * Play tactile audio chime on verified scan
 */
function playSuccessChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch (e) {}
}

/**
 * LiveCameraScanner Component (Motion-Triggered Snapshot OCR System)
 *
 * Architecture:
 * 1. Continuous camera preview (never restarted per scan, natural orientation, zero scrollbar)
 * 2. Ultra-lightweight frame-differencing motion detector (~100ms cadence, <1% CPU)
 * 3. On motion detection -> burst capture 3 candidate frames -> select sharpest frame
 * 4. Analyze frozen snapshot -> detect complete physical KIET ID card
 * 5. Perspective-warp card to normalized 540x856 canvas
 * 6. Extract printed roll-number ROI strip (beneath photo)
 * 7. Optical preprocessing + single-pass snapshot OCR on preloaded Web Worker
 * 8. Database verification & immediate large in-terminal feedback card (IN / OUT / ERROR)
 * 9. Auto-dismiss after 2-3s cooldown -> automatically return to waiting for ID card
 */
export const LiveCameraScanner = ({
  onVerifiedCandidate,
  onCardWithdrawn,
  isLocked = false,
  selectedLibraryName = 'KIET Library',
  isLibraryOpen = true,
  externalResult = null,
  onClearExternalResult = null
}) => {
  // State machine:
  // CAMERA_STARTING | READY | CAPTURING | PROCESSING | VERIFYING | SUCCESS_IN | SUCCESS_OUT | SCAN_ERROR | COOLDOWN | CAMERA_ERROR
  const [scannerState, setScannerState] = useState('CAMERA_STARTING');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [ocrEngineStatus, setOcrEngineStatus] = useState('INITIALIZING');
  const [scanStatus, setScanStatus] = useState('Waiting for ID card...');
  const [statusMessageDetail, setStatusMessageDetail] = useState('');
  const [lastLatencyMs, setLastLatencyMs] = useState(null);
  const [fps, setFps] = useState(0);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  // Large In-Terminal Result Overlay State (IN, OUT, or ERROR)
  const [terminalResult, setTerminalResult] = useState(null);

  // Debug Panel States
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugMotionScore, setDebugMotionScore] = useState(0);
  const [debugSharpness, setDebugSharpness] = useState(0);
  const [debugCardStatus, setDebugCardStatus] = useState('IDLE');
  const [debugOcrStatus, setDebugOcrStatus] = useState('IDLE');
  const [debugCandidate, setDebugCandidate] = useState('—');
  const [debugDbStatus, setDebugDbStatus] = useState('NOT CHECKED');
  const [debugApiStatus, setDebugApiStatus] = useState('SUCCESS');

  // Lifecycle Refs
  const videoRef = useRef(null);
  const snapshotCanvasRef = useRef(null);
  const analysisCanvasRef = useRef(null);
  const normalizedCanvasRef = useRef(null);
  const sliceCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const isMountedRef = useRef(true);
  const isInitializingRef = useRef(false);
  const initSessionIdRef = useRef(0);

  // Motion Detector Ref
  const motionDetectorRef = useRef(new MotionDetector({ width: 160, height: 120, threshold: 22, minMotionRatio: 0.07 }));
  const motionIntervalRef = useRef(null);
  const fpsCounterRef = useRef({ frames: 0, lastCheck: Date.now() });
  const isProcessingSnapshotRef = useRef(false);
  const isLockedRef = useRef(isLocked);

  // Keep isLockedRef synced
  useEffect(() => {
    isLockedRef.current = isLocked;
    if (isLocked) {
      motionDetectorRef.current.pause();
      if (!terminalResult) {
        setScannerState('COOLDOWN');
        setScanStatus('Processing / Cooldown...');
      }
    } else if (!terminalResult) {
      motionDetectorRef.current.resume();
      resetCardDetectorState();
      setScannerState('READY');
      setScanStatus('Waiting for ID card...');
      setStatusMessageDetail('');
    }
  }, [isLocked, terminalResult]);

  // Handle external manual entry results (if librarian types roll number into manual entry modal)
  useEffect(() => {
    if (!externalResult) return;

    if (externalResult.success) {
      const isEntry = externalResult.action === 'IN';
      playSuccessChime();
      setScannerState(isEntry ? 'SUCCESS_IN' : 'SUCCESS_OUT');
      setScanStatus(isEntry ? 'ENTRY RECORDED' : 'EXIT RECORDED');
      setStatusMessageDetail(`${externalResult.rollNumber} • ${externalResult.action}`);
      setTerminalResult({
        type: isEntry ? 'SUCCESS_IN' : 'SUCCESS_OUT',
        action: externalResult.action,
        title: isEntry ? '✓ ENTRY RECORDED' : '✓ EXIT RECORDED',
        rollNumber: externalResult.rollNumber,
        userName: externalResult.userName || 'Student',
        libraryName: externalResult.libraryName || selectedLibraryName,
        timestamp: externalResult.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        currentOccupancy: externalResult.currentOccupancy,
        capacity: externalResult.capacity
      });
    } else {
      setScannerState('SCAN_ERROR');
      setScanStatus(externalResult.title || 'SCAN REJECTED');
      setStatusMessageDetail(externalResult.message || '');
      setTerminalResult({
        type: externalResult.errorType || 'SCAN_ERROR',
        title: externalResult.title || 'SCAN REJECTED',
        message: externalResult.message || 'Operation failed',
        subtext: externalResult.subtext,
        remainingSeconds: externalResult.remainingSeconds
      });
    }

    const timer = setTimeout(() => {
      setTerminalResult(null);
      setScannerState('READY');
      setScanStatus('Waiting for ID card...');
      setStatusMessageDetail('');
      if (onClearExternalResult) onClearExternalResult();
    }, 2600);

    return () => clearTimeout(timer);
  }, [externalResult, selectedLibraryName, onClearExternalResult]);

  // Subscribe to preloaded OCR engine status
  useEffect(() => {
    const unsub = onOcrEngineStateChange((status) => {
      setOcrEngineStatus(status);
    });
    initOcrEngine().catch(() => {});
    return () => unsub();
  }, []);

  // Safe camera device enumeration on mount
  useEffect(() => {
    const enumerate = async () => {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        if (isMountedRef.current) {
          setVideoDevices(videoInputs);
        }
      } catch (e) {}
    };
    enumerate();
  }, []);

  /**
   * Stop camera stream and cleanup
   */
  const stopCamera = useCallback(() => {
    if (motionIntervalRef.current) {
      clearInterval(motionIntervalRef.current);
      motionIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch (e) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
    setHasTorch(false);
    setCameraReady(false);
    motionDetectorRef.current.reset();
    resetCardDetectorState();
  }, []);

  /**
   * Start live camera stream safely with AbortError prevention
   */
  const startCamera = useCallback(async () => {
    if (!isMountedRef.current) return;
    if (isInitializingRef.current) return;

    isInitializingRef.current = true;
    const sessionId = ++initSessionIdRef.current;

    setCameraError(null);
    setScannerState('CAMERA_STARTING');
    setScanStatus('Starting live camera feed...');

    // Stop any existing tracks before creating a new stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try { t.stop(); } catch (e) {}
      });
      streamRef.current = null;
    }

    try {
      // Natural webcam constraints (ideal for laptop/terminal webcams)
      const videoConstraints = {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 }
      };

      if (selectedDeviceId) {
        videoConstraints.deviceId = { exact: selectedDeviceId };
      } else {
        videoConstraints.facingMode = { ideal: 'user' }; // Front camera on laptops
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false
      });

      // If component unmounted or newer session started
      if (!isMountedRef.current || initSessionIdRef.current !== sessionId) {
        stream.getTracks().forEach((t) => {
          try { t.stop(); } catch (e) {}
        });
        isInitializingRef.current = false;
        return;
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');

        // Wait for loadedmetadata event before calling play()
        await new Promise((resolve) => {
          if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            resolve();
          } else {
            video.onloadedmetadata = () => resolve();
            setTimeout(resolve, 600); // Safety fallback
          }
        });

        if (!isMountedRef.current || initSessionIdRef.current !== sessionId) {
          isInitializingRef.current = false;
          return;
        }

        try {
          await video.play();
        } catch (playErr) {
          if (playErr.name === 'AbortError') {
            console.warn('Camera play() request interrupted cleanly');
            isInitializingRef.current = false;
            return;
          }
          throw playErr;
        }

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
          if (capabilities.torch) {
            setHasTorch(true);
          }
        }

        if (isMountedRef.current && initSessionIdRef.current === sessionId) {
          setCameraReady(true);
          setScannerState('READY');
          setScanStatus('Waiting for ID card...');
          motionDetectorRef.current.resume();
        }
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      let errMsg = 'Camera unavailable';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Camera permission required';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No camera device detected';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errMsg = 'Camera is already in use by another application';
      }
      if (isMountedRef.current) {
        setCameraError(errMsg);
        setCameraReady(false);
        setScannerState('CAMERA_ERROR');
      }
    } finally {
      isInitializingRef.current = false;
    }
  }, [selectedDeviceId]);

  // Camera start / stop effect
  useEffect(() => {
    isMountedRef.current = true;
    if (isLibraryOpen) {
      startCamera();
    } else {
      stopCamera();
      setScanStatus('Library is Closed');
    }

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [selectedDeviceId, isLibraryOpen, startCamera, stopCamera]);

  /**
   * Process a captured snapshot through the complete access-control pipeline:
   * 1. Detect physical ID card in snapshot
   * 2. Perspective warp to normalized 540x856 canvas
   * 3. Extract roll-number ROI strip (beneath photo)
   * 4. Preprocess (green weighted separation) & single-pass Tesseract OCR
   * 5. Generate controlled normalization candidates
   * 6. Database verification & IN/OUT gate access
   * 7. Display large immediate in-terminal success/error card (2-3s)
   * 8. Auto-reset to "Waiting for ID card..." without page/camera reload
   */
  const processSnapshotPipeline = useCallback(async () => {
    if (isProcessingSnapshotRef.current || isLockedRef.current || !videoRef.current) return;

    isProcessingSnapshotRef.current = true;
    motionDetectorRef.current.pause();

    const video = videoRef.current;
    const startTime = performance.now();

    try {
      // Step 1: Capture short burst of 3 candidate frames and pick the sharpest
      setScannerState('CAPTURING');
      setScanStatus('Capturing clearest frame...');
      setStatusMessageDetail('');

      const { bestCanvas, sharpnessScore } = await captureBestFrame(video, { frameCount: 3, intervalMs: 70 });
      setDebugSharpness(sharpnessScore);

      // Natural snapshot canvas (direct natural orientation, matches live preview)
      const workingCanvas = bestCanvas;

      // Step 2: Detect complete physical ID card in snapshot
      setScannerState('PROCESSING');
      setScanStatus('Detecting ID card...');
      setDebugCardStatus('ANALYZING');

      const analysisCanvas = analysisCanvasRef.current;
      const cardResult = detectCardContour(workingCanvas, analysisCanvas);

      if (!cardResult.detected && !cardResult.candidate) {
        if (onCardWithdrawn) onCardWithdrawn();
        setDebugCardStatus('NOT DETECTED');
        setScannerState('SCAN_ERROR');
        setScanStatus('SCAN FAILED');
        setStatusMessageDetail('Unable to read roll number. Please present the ID card clearly.');

        setTerminalResult({
          type: 'SCAN_FAILED',
          title: 'SCAN FAILED',
          message: 'Unable to read roll number. Please present the ID card clearly.',
          subtext: 'Position complete ID card within the frame'
        });

        // Visible briefly (2s) then return to waiting
        await new Promise((r) => setTimeout(r, 2000));
        return;
      }

      setDebugCardStatus('CARD CONFIRMED');

      // Step 3: Perspective transform card into standard portrait 540x856 canvas
      const normCanvas = normalizedCanvasRef.current;
      warpCardToCanvas(
        workingCanvas,
        cardResult.corners,
        normCanvas,
        CARD_NORMALIZED_WIDTH,
        CARD_NORMALIZED_HEIGHT,
        cardResult.isLandscape
      );

      // Step 4: Extract roll-number ROI strip (located directly beneath photo in standard KIET card layout)
      setScannerState('PROCESSING');
      setScanStatus('READING ROLL NUMBER');
      setDebugOcrStatus('RUNNING');

      const slices = getCardRoiSlices(normCanvas);
      const sliceCanvas = sliceCanvasRef.current;
      const sliceCtx = sliceCanvas.getContext('2d', { willReadFrequently: true });

      let recognizedCandidate = null;
      let allFoundCandidates = [];

      // Test slices (primary first, then variance slices)
      for (let sIdx = 0; sIdx < Math.min(3, slices.length); sIdx++) {
        const slice = slices[sIdx];
        sliceCanvas.width = slice.sw;
        sliceCanvas.height = slice.sh;

        sliceCtx.drawImage(
          normCanvas,
          slice.sx, slice.sy, slice.sw, slice.sh,
          0, 0, slice.sw, slice.sh
        );

        // Preprocess: mode 1 (dynamic contrast), mode 2 (adaptive binarization)
        preprocessCanvas(sliceCanvas, (sIdx % 2) + 1);

        // Fast single snapshot OCR
        const ocrResult = await recognizeCanvas(sliceCanvas);
        const { primary, candidates } = extractRollNumberCandidate(ocrResult.text);

        if (candidates.length > 0) {
          allFoundCandidates = Array.from(new Set([...allFoundCandidates, ...candidates]));
        }

        if (primary && isValidRollNumberPattern(primary)) {
          recognizedCandidate = primary;
          setDebugCandidate(primary);
          break;
        }
      }

      if (!recognizedCandidate && allFoundCandidates.length === 0) {
        setDebugOcrStatus('NO TEXT');
        setScannerState('SCAN_ERROR');
        setScanStatus('SCAN FAILED');
        setStatusMessageDetail('Unable to read roll number. Please present the ID card clearly.');

        setTerminalResult({
          type: 'SCAN_FAILED',
          title: 'SCAN FAILED',
          message: 'Unable to read roll number. Please present the ID card clearly.',
          subtext: 'Ensure printed roll number is clear and well-lit'
        });

        await new Promise((r) => setTimeout(r, 2000));
        return;
      }

      const verifiedRoll = recognizedCandidate || allFoundCandidates[0];
      setDebugOcrStatus('SUCCESS');

      // Step 5: Database verification
      const totalDurationMs = Math.round(performance.now() - startTime);
      setLastLatencyMs(totalDurationMs);
      setDebugDbStatus('VERIFYING');
      setScannerState('VERIFYING');
      setScanStatus(`VERIFYING: ${verifiedRoll}`);
      setStatusMessageDetail('Checking active visits and library eligibility...');

      let verifyOutcome = null;
      if (onVerifiedCandidate) {
        verifyOutcome = await onVerifiedCandidate({
          rollNumber: verifiedRoll,
          candidates: allFoundCandidates.length > 0 ? allFoundCandidates : [verifiedRoll],
          latencyMs: totalDurationMs
        });
      }

      if (verifyOutcome?.success) {
        const isEntry = verifyOutcome.action === 'IN';
        playSuccessChime();
        if (typeof navigator.vibrate === 'function') {
          navigator.vibrate([50, 70, 50]);
        }

        setDebugDbStatus('VERIFIED');
        setScannerState(isEntry ? 'SUCCESS_IN' : 'SUCCESS_OUT');
        setScanStatus(isEntry ? 'ENTRY RECORDED' : 'EXIT RECORDED');
        setStatusMessageDetail(`${verifyOutcome.rollNumber || verifiedRoll} • ${verifyOutcome.action}`);

        setTerminalResult({
          type: isEntry ? 'SUCCESS_IN' : 'SUCCESS_OUT',
          action: verifyOutcome.action,
          title: isEntry ? '✓ ENTRY RECORDED' : '✓ EXIT RECORDED',
          rollNumber: verifyOutcome.rollNumber || verifiedRoll,
          userName: verifyOutcome.userName || 'Student',
          libraryName: verifyOutcome.libraryName || selectedLibraryName,
          timestamp: verifyOutcome.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          currentOccupancy: verifyOutcome.currentOccupancy,
          capacity: verifyOutcome.capacity
        });

        // Visible for ~2.6 seconds (approx 2–3 seconds requirement)
        await new Promise((r) => setTimeout(r, 2600));
      } else if (verifyOutcome) {
        setScannerState('SCAN_ERROR');
        setScanStatus(verifyOutcome.title || 'SCAN REJECTED');
        setStatusMessageDetail(verifyOutcome.message || '');

        setTerminalResult({
          type: verifyOutcome.errorType || 'SCAN_ERROR',
          title: verifyOutcome.title || 'SCAN REJECTED',
          message: verifyOutcome.message || 'Operation failed',
          subtext: verifyOutcome.subtext,
          remainingSeconds: verifyOutcome.remainingSeconds
        });

        await new Promise((r) => setTimeout(r, 2400));
      }
    } catch (err) {
      console.warn('Snapshot pipeline error:', err);
      setDebugOcrStatus('ERROR');
      setScannerState('SCAN_ERROR');
      setScanStatus('SCAN FAILED');
      setStatusMessageDetail(err.message || 'Operation failed');
      setTerminalResult({
        type: 'SCAN_FAILED',
        title: 'SCAN FAILED',
        message: 'Unable to read roll number. Please present the ID card clearly.'
      });
      await new Promise((r) => setTimeout(r, 2000));
    } finally {
      isProcessingSnapshotRef.current = false;
      setTerminalResult(null);
      if (!isLockedRef.current) {
        motionDetectorRef.current.resume();
        resetCardDetectorState();
        setScannerState('READY');
        setScanStatus('Waiting for ID card...');
        setStatusMessageDetail('');
      }
    }
  }, [onVerifiedCandidate, onCardWithdrawn, selectedLibraryName]);

  /**
   * Lightweight Motion Detection Loop (~100ms cadence)
   * Runs in background at 160x120 resolution (<1% CPU).
   * Triggers snapshot capture only when real motion is detected.
   */
  useEffect(() => {
    if (!cameraReady || isLocked || terminalResult) {
      if (motionIntervalRef.current) {
        clearInterval(motionIntervalRef.current);
        motionIntervalRef.current = null;
      }
      return;
    }

    motionIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || isProcessingSnapshotRef.current || isLockedRef.current || terminalResult) return;

      // Count FPS
      fpsCounterRef.current.frames++;
      const now = Date.now();
      if (now - fpsCounterRef.current.lastCheck >= 1000) {
        setFps(fpsCounterRef.current.frames * 10);
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastCheck = now;
      }

      const { hasMotion, score } = motionDetectorRef.current.checkMotion(video);
      setDebugMotionScore(score);

      if (hasMotion) {
        setScannerState('CAPTURING');
        setScanStatus('Card detected, capturing...');
        processSnapshotPipeline();
      }
    }, 100);

    return () => {
      if (motionIntervalRef.current) {
        clearInterval(motionIntervalRef.current);
        motionIntervalRef.current = null;
      }
    };
  }, [cameraReady, isLocked, terminalResult, processSnapshotPipeline]);

  /**
   * Toggle camera flashlight/torch
   */
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: nextTorch }] });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch not supported:', e);
    }
  };

  /**
   * Switch camera devices
   */
  const handleSwitchCamera = () => {
    if (videoDevices.length <= 1) return;
    const currentIndex = videoDevices.findIndex((d) => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % videoDevices.length;
    setSelectedDeviceId(videoDevices[nextIndex].deviceId);
  };

  return (
    <div className="relative w-full h-full min-h-0 bg-[#161219] rounded-2xl overflow-hidden border border-[#3B3142] shadow-2xl flex flex-col select-none">
      {/* Offscreen canvases for analysis, normalization, and OCR ROI slices */}
      <canvas ref={analysisCanvasRef} className="hidden" />
      <canvas ref={normalizedCanvasRef} className="hidden" />
      <canvas ref={sliceCanvasRef} className="hidden" />
      <canvas ref={snapshotCanvasRef} className="hidden" />

      {/* Top Header Bar inside camera terminal */}
      <div className="absolute top-0 inset-x-0 z-20 px-4 py-2.5 bg-gradient-to-b from-black/85 via-black/45 to-transparent flex items-center justify-between pointer-events-auto">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 sm:p-2 bg-[#8D6B94] rounded-xl text-white shadow-lg flex items-center justify-center">
            <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-white tracking-wide uppercase">
                MOTION SNAPSHOT OCR TERMINAL
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-[#E8DBC5]/80 font-medium">{selectedLibraryName}</p>
          </div>
        </div>

        {/* Controls, Orientation & Debug Toggle */}
        <div className="flex items-center space-x-2">
          {lastLatencyMs && (
            <Badge variant="outline" className="hidden sm:inline-flex bg-black/60 text-emerald-400 border-emerald-500/40 text-[10px] font-mono font-bold px-2 py-0.5">
              ⚡ {lastLatencyMs}ms
            </Badge>
          )}

          {/* Natural Orientation Badge */}
          <div className="p-1 px-2 rounded-lg bg-black/60 border border-[#3B3142] text-[10px] font-mono text-[#B8A6BD] hidden sm:flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            <span>Natural</span>
          </div>

          {/* Collapsible Debug Panel Toggle */}
          <button
            type="button"
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            title="Toggle Motion & OCR Debug Overlay"
            className={`p-1.5 px-2.5 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
              showDebugPanel
                ? 'bg-[#8D6B94] text-white border-[#8D6B94]'
                : 'bg-black/60 text-[#B8A6BD] border-[#3B3142] hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>DEBUG</span>
            {showDebugPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              aria-label="Toggle Flashlight"
              className={`p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer ${
                torchOn
                  ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_12px_#fbbf24]'
                  : 'bg-black/60 text-[#FFF4E9] border-[#3B3142] hover:bg-black/80'
              }`}
            >
              {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}

          {videoDevices.length > 1 && (
            <button
              type="button"
              onClick={handleSwitchCamera}
              aria-label="Switch Camera"
              className="p-1.5 sm:p-2 rounded-lg bg-black/60 text-[#FFF4E9] border border-[#3B3142] hover:bg-black/80 transition-all cursor-pointer"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Video Viewport (Natural orientation, NO scrollbar, overflow: hidden) */}
      <div className="relative flex-1 min-h-0 bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Live Physical Card Target Overlay */}
        {cameraReady && !cameraError && !terminalResult && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center overflow-hidden p-2">
            {/* Subtle Vignette */}
            <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_45%,rgba(0,0,0,0.65)_100%]" />

            {/* Dynamic Card Target Box: Focus entire ID card */}
            <div
              className={`relative z-10 w-[64%] max-w-[300px] aspect-[1/1.46] max-h-[calc(100%-80px)] rounded-2xl transition-all duration-300 border-2 ${
                scannerState === 'SUCCESS_IN' || scannerState === 'SUCCESS_OUT'
                  ? 'border-emerald-400/90 shadow-[0_0_32px_rgba(52,211,153,0.45)] bg-emerald-500/10'
                  : scannerState === 'CAPTURING' || scannerState === 'PROCESSING'
                  ? 'border-amber-400/90 shadow-[0_0_24px_rgba(251,191,36,0.35)] bg-amber-500/5'
                  : scannerState === 'SCAN_ERROR'
                  ? 'border-rose-400/80 shadow-[0_0_20px_rgba(244,63,94,0.30)] bg-rose-500/5'
                  : 'border-[#8D6B94]/60 shadow-[0_0_16px_rgba(141,107,148,0.20)] bg-black/5'
              } flex flex-col justify-between p-3.5`}
            >
              {/* 4 Corner Markers */}
              <div className={`absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 rounded-tl-xl transition-colors ${
                scannerState.includes('SUCCESS') ? 'border-emerald-400' : scannerState === 'SCAN_ERROR' ? 'border-rose-400' : scannerState === 'PROCESSING' || scannerState === 'CAPTURING' ? 'border-amber-400' : 'border-[#8D6B94]'
              }`} />
              <div className={`absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 rounded-tr-xl transition-colors ${
                scannerState.includes('SUCCESS') ? 'border-emerald-400' : scannerState === 'SCAN_ERROR' ? 'border-rose-400' : scannerState === 'PROCESSING' || scannerState === 'CAPTURING' ? 'border-amber-400' : 'border-[#8D6B94]'
              }`} />
              <div className={`absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 rounded-bl-xl transition-colors ${
                scannerState.includes('SUCCESS') ? 'border-emerald-400' : scannerState === 'SCAN_ERROR' ? 'border-rose-400' : scannerState.includes('PROCESSING') || scannerState === 'CAPTURING' ? 'border-amber-400' : 'border-[#8D6B94]'
              }`} />
              <div className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 rounded-br-xl transition-colors ${
                scannerState.includes('SUCCESS') ? 'border-emerald-400' : scannerState === 'SCAN_ERROR' ? 'border-rose-400' : scannerState.includes('PROCESSING') || scannerState === 'CAPTURING' ? 'border-amber-400' : 'border-[#8D6B94]'
              }`} />

              {/* Dynamic Laser Guide Line */}
              <div className={`absolute inset-x-4 top-1/2 h-0.5 bg-gradient-to-r from-transparent ${
                scannerState.includes('SUCCESS')
                  ? 'via-emerald-400 shadow-[0_0_10px_#34d399]'
                  : scannerState === 'SCAN_ERROR'
                  ? 'via-rose-400 shadow-[0_0_8px_#f43f5e]'
                  : scannerState === 'PROCESSING' || scannerState === 'CAPTURING'
                  ? 'via-amber-400 shadow-[0_0_10px_#fbbf24]'
                  : 'via-[#8D6B94] shadow-[0_0_6px_#8d6b94]'
              } to-transparent animate-pulse`} />

              {/* Top Target Indicator */}
              <div className="text-center">
                <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border backdrop-blur-md transition-all ${
                  scannerState.includes('SUCCESS')
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 shadow-lg'
                    : scannerState === 'SCAN_ERROR'
                    ? 'bg-rose-950/90 text-rose-300 border-rose-500/60'
                    : scannerState === 'PROCESSING' || scannerState === 'CAPTURING'
                    ? 'bg-amber-950/90 text-amber-300 border-amber-500/60'
                    : 'bg-black/75 text-[#E8DBC5] border-[#3B3142]'
                }`}>
                  {scannerState.includes('SUCCESS')
                    ? 'VERIFIED'
                    : scannerState === 'SCAN_ERROR'
                    ? 'RETRY'
                    : scannerState === 'PROCESSING'
                    ? 'PROCESSING OCR'
                    : scannerState === 'CAPTURING'
                    ? 'CAPTURING SNAPSHOT'
                    : 'PRESENT PHYSICAL ID CARD'}
                </span>
              </div>

              {/* Bottom Guidance Text */}
              <div className="text-center">
                <span className="text-[9px] font-medium text-[#E8DBC5]/70 tracking-wider">
                  Hold card steady in frame
                </span>
              </div>
            </div>

            {/* Dynamic Status Pill */}
            <div className="relative z-10 mt-3 sm:mt-4 flex flex-col items-center gap-1 max-w-sm px-4 text-center shrink-0">
              <span className={`text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-full border backdrop-blur-md shadow-xl flex items-center gap-2 transition-all ${
                isLocked || scannerState === 'COOLDOWN'
                  ? 'bg-amber-950/90 text-amber-300 border-amber-500/50'
                  : scannerState.includes('SUCCESS')
                  ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/60'
                  : scannerState === 'SCAN_ERROR'
                  ? 'bg-rose-950/90 text-rose-200 border-rose-500/60'
                  : scannerState === 'PROCESSING' || scannerState === 'CAPTURING' || scannerState === 'VERIFYING'
                  ? 'bg-amber-950/90 text-amber-200 border-amber-500/60'
                  : 'bg-black/85 text-white border-[#3B3142]'
              }`}>
                {isLocked || scannerState === 'CAPTURING' || scannerState === 'PROCESSING' || scannerState === 'VERIFYING' ? (
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                ) : scannerState.includes('SUCCESS') ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                ) : scannerState === 'SCAN_ERROR' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <ScanLine className="w-3.5 h-3.5 text-[#8D6B94] animate-pulse" />
                )}
                {scanStatus}
              </span>

              {statusMessageDetail && (
                <p className="text-[10px] text-[#E8DBC5]/80 font-medium">
                  {statusMessageDetail}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* IMMEDIATE LARGE TERMINAL RESULT OVERLAY (IN / OUT / ERROR) */}
        {/* ======================================================== */}
        {terminalResult && (
          <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150 pointer-events-none select-none">
            {terminalResult.action === 'IN' ? (
              /* Success IN (Entry Recorded) */
              <div className="relative w-full max-w-sm sm:max-w-md bg-[#211C26]/95 border-2 border-emerald-500 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.35)] p-6 sm:p-7 text-center text-[#FFF4E9] flex flex-col items-center">
                {/* Green check icon */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                  <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400 animate-bounce" />
                </div>

                {/* Status Indicator Title */}
                <h3 className="text-base sm:text-lg font-black tracking-widest text-emerald-400 uppercase">
                  ✓ ENTRY RECORDED
                </h3>

                {/* Large IN Badge */}
                <div className="my-2.5">
                  <span className="inline-block bg-emerald-500 text-white font-black text-xl sm:text-2xl px-8 py-1 rounded-full shadow-lg tracking-wider">
                    IN
                  </span>
                </div>

                {/* Roll Number (Large & Clear Monospace) */}
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-white mt-1">
                  {terminalResult.rollNumber}
                </div>

                {/* User Name */}
                <div className="text-sm sm:text-base font-bold text-[#E8DBC5] mt-1 uppercase tracking-wide truncate max-w-full">
                  {terminalResult.userName}
                </div>

                {/* Divider */}
                <div className="w-full my-3 border-t border-[#3B3142]" />

                {/* Library & Timestamp Details */}
                <div className="w-full flex items-center justify-between text-xs sm:text-sm px-2">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold text-[#B8A6BD] block">Library</span>
                    <span className="font-extrabold text-white">{terminalResult.libraryName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#B8A6BD] block">Time</span>
                    <span className="font-mono font-bold text-emerald-400">{terminalResult.timestamp}</span>
                  </div>
                </div>
              </div>
            ) : terminalResult.action === 'OUT' ? (
              /* Success OUT (Exit Recorded) */
              <div className="relative w-full max-w-sm sm:max-w-md bg-[#211C26]/95 border-2 border-purple-500 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.35)] p-6 sm:p-7 text-center text-[#FFF4E9] flex flex-col items-center">
                {/* Purple logout icon */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center text-purple-400 mb-3 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                  <LogOut className="w-8 h-8 sm:w-9 sm:h-9 text-purple-400 animate-pulse" />
                </div>

                {/* Status Indicator Title */}
                <h3 className="text-base sm:text-lg font-black tracking-widest text-purple-400 uppercase">
                  ✓ EXIT RECORDED
                </h3>

                {/* Large OUT Badge */}
                <div className="my-2.5">
                  <span className="inline-block bg-purple-600 text-white font-black text-xl sm:text-2xl px-8 py-1 rounded-full shadow-lg tracking-wider">
                    OUT
                  </span>
                </div>

                {/* Roll Number (Large & Clear Monospace) */}
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-white mt-1">
                  {terminalResult.rollNumber}
                </div>

                {/* User Name */}
                <div className="text-sm sm:text-base font-bold text-[#E8DBC5] mt-1 uppercase tracking-wide truncate max-w-full">
                  {terminalResult.userName}
                </div>

                {/* Divider */}
                <div className="w-full my-3 border-t border-[#3B3142]" />

                {/* Library & Timestamp Details */}
                <div className="w-full flex items-center justify-between text-xs sm:text-sm px-2">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold text-[#B8A6BD] block">Library</span>
                    <span className="font-extrabold text-white">{terminalResult.libraryName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#B8A6BD] block">Time</span>
                    <span className="font-mono font-bold text-purple-400">{terminalResult.timestamp}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Failed / Rejected Scan Feedback */
              <div className="relative w-full max-w-sm sm:max-w-md bg-[#211C26]/95 border-2 border-rose-500 rounded-3xl shadow-[0_0_50px_rgba(244,63,94,0.35)] p-6 sm:p-7 text-center text-[#FFF4E9] flex flex-col items-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 mb-3 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                  <AlertCircle className="w-8 h-8 sm:w-9 sm:h-9 text-rose-400 animate-pulse" />
                </div>

                <h3 className="text-base sm:text-lg font-black tracking-widest text-rose-400 uppercase">
                  {terminalResult.title}
                </h3>

                <div className="my-2 text-sm sm:text-base font-bold text-white max-w-xs leading-snug">
                  {terminalResult.message}
                </div>

                {terminalResult.subtext && (
                  <div className="text-xs text-[#E8DBC5]/80 mt-1 max-w-xs font-medium">
                    {terminalResult.subtext}
                  </div>
                )}

                {terminalResult.remainingSeconds && (
                  <div className="mt-2.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono text-xs font-bold">
                    {terminalResult.remainingSeconds}s wait remaining
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Collapsible Development Debug Overlay */}
        {showDebugPanel && (
          <div className="absolute top-14 right-3 z-30 w-68 bg-black/92 backdrop-blur-md rounded-xl border border-[#3B3142] p-3 text-[11px] font-mono text-[#FFF4E9] shadow-2xl space-y-1.5 pointer-events-auto animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-[#3B3142] text-[10px] text-[#B8A6BD] font-bold uppercase tracking-wider">
              <span>Terminal Debug Panel</span>
              <span className="text-emerald-400 font-bold">SNAPSHOT MODE</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[#B8A6BD]">Camera:</span>
                <span className={`font-bold ${cameraReady ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {cameraReady ? 'READY' : cameraError ? 'ERROR' : 'STARTING'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#B8A6BD]">State:</span>
                <span className="font-bold text-amber-300">{scannerState}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#B8A6BD]">Orientation:</span>
                <span className="font-bold text-[#FFF4E9]">NATURAL</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#B8A6BD]">Motion Detector:</span>
                <span className="font-bold text-amber-300">
                  {debugMotionScore > 0 ? `${debugMotionScore}% active` : 'IDLE'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#B8A6BD]">Card Detector:</span>
                <span className={`font-bold ${debugCardStatus === 'CARD CONFIRMED' ? 'text-emerald-400' : 'text-[#B8A6BD]'}`}>
                  {debugCardStatus}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#B8A6BD]">OCR Status:</span>
                <span className="font-bold text-[#FFF4E9]">{debugOcrStatus}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#B8A6BD]">OCR Candidate:</span>
                <span className="font-bold text-amber-300 font-mono">{debugCandidate}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#B8A6BD]">Database:</span>
                <span className="font-bold text-[#FFF4E9]">{debugDbStatus}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#B8A6BD]">Scan latency:</span>
                <span className="font-bold text-emerald-400">{lastLatencyMs ? `${lastLatencyMs} ms` : '—'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#B8A6BD]">Sharpness:</span>
                <span className="font-bold text-[#FFF4E9]">{debugSharpness || '—'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#B8A6BD]">API Status:</span>
                <span className="font-bold text-emerald-400">{debugApiStatus}</span>
              </div>
            </div>
          </div>
        )}

        {/* Camera Permission / Device Error */}
        {cameraError && (
          <div className="absolute inset-0 z-30 bg-[#161219]/95 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="p-4 bg-rose-500/20 text-rose-400 rounded-full">
              <CameraOff className="w-10 h-10" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="text-base font-extrabold text-white">Camera Access Required</h4>
              <p className="text-xs text-[#B8A6BD]">{cameraError}</p>
            </div>
            <Button
              size="sm"
              onClick={startCamera}
              className="bg-[#8D6B94] hover:bg-[#795B80] text-white font-bold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Retry Camera
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Bar Info Bar */}
      <div className="px-4 py-2 bg-[#1A151E] border-t border-[#3B3142] flex items-center justify-between text-[11px] text-[#B8A6BD] shrink-0">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${ocrEngineStatus === 'READY' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
          <span>OCR Engine: <strong>{ocrEngineStatus === 'READY' ? 'Active (Preloaded)' : 'Warming up...'}</strong></span>
        </div>

        <div className="hidden sm:flex items-center space-x-3 font-mono text-[10px]">
          <span>Trigger: <strong>MOTION SNAPSHOT</strong></span>
          <span>•</span>
          <span>Orientation: Natural</span>
          <span>•</span>
          <span>FPS: {fps || 30}</span>
        </div>
      </div>
    </div>
  );
};
