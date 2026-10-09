import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import {
  extractRollNumberCandidate,
  isValidRollNumberPattern,
  preprocessCanvas
} from '../../lib/rollNumberOcr';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Camera,
  CameraOff,
  X,
  Zap,
  ZapOff,
  RotateCcw,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Keyboard,
  Loader2,
  Upload
} from 'lucide-react';

/**
 * Play a gentle tactile success chime on successful OCR detection
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
  } catch (e) {
    // AudioContext might be blocked or unsupported; silent fallback
  }
}

/**
 * IdCardOcrScanner Component
 *
 * Dedicated camera scanner for KIET Physical ID Cards.
 * Features:
 * - Local client-side OCR via Tesseract.js (no frames uploaded to backend)
 * - Targets ONLY the printed Roll Number section (does NOT OCR entire camera frame)
 * - Optical green-channel preprocessing tailored for red printed text on ID laminate
 * - Immediate scan lock upon valid roll number detection to prevent duplicate entries
 * - Immediate camera track shutdown on exit, unmount, or scan completion
 * - Manual entry fallback
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the scanner modal is active
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onScanSuccess - Callback receiving ({ type: 'STUDENT', identifier: string })
 * @param {string} props.selectedLibraryName - Name of currently active library
 */
export const IdCardOcrScanner = ({
  isOpen,
  onClose,
  onScanSuccess,
  selectedLibraryName = 'KIET Library'
}) => {
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanStatus, setScanStatus] = useState('Align Roll Number inside the box');
  const [detectedId, setDetectedId] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayBoxRef = useRef(null);
  const streamRef = useRef(null);
  const workerRef = useRef(null);
  const isLockedRef = useRef(false);
  const isProcessingRef = useRef(false);
  const attemptCountRef = useRef(0);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync refs with state
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  /**
   * Process an uploaded physical ID card image file (for testing or camera fallback)
   */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setScanStatus('Analyzing ID Card image...');

    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      let candidate = null;
      if (workerRef.current) {
        const imgW = img.naturalWidth || img.width;
        const imgH = img.naturalHeight || img.height;

        // Candidate slices based on KIET ID card layout (printed roll number located at ~60-70% height)
        const slices = [
          { left: Math.round(imgW * 0.18), top: Math.round(imgH * 0.63), width: Math.round(imgW * 0.35), height: Math.round(imgH * 0.06) },
          { left: Math.round(imgW * 0.14), top: Math.round(imgH * 0.60), width: Math.round(imgW * 0.40), height: Math.round(imgH * 0.08) },
          { left: Math.round(imgW * 0.10), top: Math.round(imgH * 0.55), width: Math.round(imgW * 0.50), height: Math.round(imgH * 0.15) }
        ];

        for (const s of slices) {
          const ret = await workerRef.current.recognize(img, { rectangle: s });
          const cand = extractRollNumberCandidate(ret?.data?.text || '');
          if (cand && isValidRollNumberPattern(cand)) {
            candidate = cand;
            break;
          }
        }

        // Fallback: Full image recognition if slices did not yield candidate
        if (!candidate) {
          const fullRet = await workerRef.current.recognize(img);
          candidate = extractRollNumberCandidate(fullRet?.data?.text || '');
        }
      }

      URL.revokeObjectURL(objectUrl);

      if (candidate && isValidRollNumberPattern(candidate)) {
        isLockedRef.current = true;
        setIsLocked(true);
        setDetectedId(candidate);
        setScanStatus(`Roll Number Detected: ${candidate}`);

        stopCamera();
        playSuccessChime();
        if (typeof navigator.vibrate === 'function') {
          navigator.vibrate([40, 60, 40]);
        }

        setTimeout(() => {
          onScanSuccess({
            type: 'STUDENT',
            identifier: candidate
          });
          onClose();
        }, 450);
      } else {
        setScanStatus('Could not detect a valid Roll Number in image. Please try again.');
      }
    } catch (err) {
      console.error('File upload OCR failed:', err);
      setScanStatus('Failed to process image file.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /**
   * Stop all camera tracks and clean up resources
   */
  const stopCamera = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
    setHasTorch(false);
    setCameraReady(false);
  }, []);

  /**
   * Toggle camera flashlight/torch if supported by hardware
   */
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextTorch = !torchOn;
      await track.applyConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch toggle not supported:', e);
    }
  };

  /**
   * Initialize Tesseract Worker once on mount
   */
  useEffect(() => {
    let isMounted = true;

    async function initWorker() {
      try {
        const worker = await createWorker('eng');
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          tessedit_pageseg_mode: '7' // Single uniform text line mode (optimal for cropped ID roll number)
        });
        if (isMounted) {
          workerRef.current = worker;
        } else {
          await worker.terminate();
        }
      } catch (err) {
        console.error('Failed to initialize Tesseract worker:', err);
      }
    }

    if (isOpen) {
      initWorker();
    }

    return () => {
      isMounted = false;
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [isOpen]);

  /**
   * Start Camera stream
   */
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setScanStatus('Initializing camera...');
    setIsLocked(false);
    isLockedRef.current = false;
    setDetectedId(null);
    setAttemptCount(0);
    attemptCountRef.current = 0;

    try {
      // Prefer rear environment camera on mobile devices
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();

        // Check if torch/flash is available
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
          if (capabilities.torch) {
            setHasTorch(true);
          }
        }

        setCameraReady(true);
        setScanStatus('Place the Roll Number inside the scan area');
      }
    } catch (err) {
      console.error('Camera initialization failed:', err);
      let errMsg = 'Unable to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Camera permission was denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No camera device found on this system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errMsg = 'Camera is already in use by another application.';
      }
      setCameraError(errMsg);
      setCameraReady(false);
    }
  }, []);

  /**
   * Process a single video frame:
   * 1. Calculate overlay alignment box coordinates relative to video
   * 2. Crop ONLY the roll number section onto an offscreen canvas
   * 3. Apply optical preprocessing
   * 4. Perform OCR
   * 5. Extract and validate candidate
   */
  const processFrame = useCallback(async () => {
    if (
      isLockedRef.current ||
      isProcessingRef.current ||
      !workerRef.current ||
      !videoRef.current ||
      !canvasRef.current ||
      !overlayBoxRef.current
    ) {
      return;
    }

    const video = videoRef.current;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    if (!videoWidth || !videoHeight) return;

    // Get rendered dimensions and overlay box coordinates
    const videoRect = video.getBoundingClientRect();
    const overlayRect = overlayBoxRef.current.getBoundingClientRect();

    if (!videoRect.width || !videoRect.height) return;

    // Compute coordinate mapping from CSS space to source video pixel space
    const scaleX = videoWidth / videoRect.width;
    const scaleY = videoHeight / videoRect.height;

    // Source crop coordinates with safety margin
    let sx = (overlayRect.left - videoRect.left) * scaleX;
    let sy = (overlayRect.top - videoRect.top) * scaleY;
    let sWidth = overlayRect.width * scaleX;
    let sHeight = overlayRect.height * scaleY;

    // Add 10% horizontal and vertical breathing margin around the box
    const marginX = sWidth * 0.1;
    const marginY = sHeight * 0.1;
    sx = Math.max(0, sx - marginX);
    sy = Math.max(0, sy - marginY);
    sWidth = Math.min(videoWidth - sx, sWidth + marginX * 2);
    sHeight = Math.min(videoHeight - sy, sHeight + marginY * 2);

    if (sWidth <= 10 || sHeight <= 10) return;

    // Prepare offscreen canvas
    const canvas = canvasRef.current;
    canvas.width = Math.min(500, Math.round(sWidth));
    canvas.height = Math.round((canvas.width / sWidth) * sHeight);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Draw the cropped Roll Number region only
    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

    // Multi-pass attempt cycling (1: High-Contrast Green Separation, 2: Sharpening, 3: Adaptive Binarization)
    attemptCountRef.current += 1;
    const currentAttempt = ((attemptCountRef.current - 1) % 3) + 1;
    setAttemptCount(attemptCountRef.current);

    // Run optical image preprocessing
    preprocessCanvas(canvas, currentAttempt);

    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      const ocrResult = await workerRef.current.recognize(canvas);
      const rawText = ocrResult?.data?.text || '';
      const confidence = ocrResult?.data?.confidence || 0;

      // Extract roll number candidate using strict rules and positional normalization
      const candidate = extractRollNumberCandidate(rawText);

      if (candidate && isValidRollNumberPattern(candidate)) {
        // Valid roll number successfully detected!
        // Immediately LOCK further scanning to prevent duplicate triggers
        isLockedRef.current = true;
        setIsLocked(true);
        setDetectedId(candidate);
        setScanStatus(`Roll Number Detected: ${candidate}`);

        // Stop camera tracks immediately
        stopCamera();

        // Audio and haptic feedback
        playSuccessChime();
        if (typeof navigator.vibrate === 'function') {
          navigator.vibrate([40, 60, 40]);
        }

        // Allow user to see the success state for 400ms then trigger entrance handler
        setTimeout(() => {
          onScanSuccess({
            type: 'STUDENT',
            identifier: candidate
          });
          onClose();
        }, 450);
        return;
      } else {
        // Update user guidance dynamically based on attempt count
        if (attemptCountRef.current >= 4) {
          setScanStatus('Hold card steady. Avoid glare and ensure Roll Number is in the box.');
        } else {
          setScanStatus('Scanning... Keep Roll Number aligned');
        }
      }
    } catch (ocrErr) {
      console.warn('OCR recognition pass failed:', ocrErr);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [onScanSuccess, onClose, stopCamera]);

  /**
   * Continuous throttled scan loop
   * Runs at a measured cadence (~350ms) to conserve CPU and ensure smooth UI
   */
  useEffect(() => {
    let isActive = true;

    const runLoop = async () => {
      if (!isActive || isLockedRef.current || !cameraReady) return;

      if (!isProcessingRef.current) {
        await processFrame();
      }

      if (isActive && !isLockedRef.current) {
        timerRef.current = setTimeout(runLoop, 350);
      }
    };

    if (cameraReady && !isLocked) {
      timerRef.current = setTimeout(runLoop, 400);
    }

    return () => {
      isActive = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [cameraReady, isLocked, processFrame]);

  /**
   * Initialize camera when modal opens; clean up when modal closes
   */
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#211C26] text-[#FFF4E9] rounded-2xl shadow-2xl border border-[#3B3142] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#3B3142] flex items-center justify-between bg-[#1A151E]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#8D6B94] rounded-lg text-white">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                SCAN KIET ID CARD
                {isProcessing && (
                  <Loader2 className="w-3.5 h-3.5 text-[#B185A7] animate-spin" />
                )}
              </h3>
              <p className="text-[11px] text-[#B8A6BD] font-medium">{selectedLibraryName}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                aria-label="Toggle flashlight"
                className={`p-2 rounded-lg border transition-colors ${
                  torchOn
                    ? 'bg-amber-400 text-black border-amber-300'
                    : 'bg-[#2D2534] text-[#FFF4E9] border-[#3B3142] hover:bg-[#3B3142]'
                }`}
              >
                {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            {/* Hidden file input for card photo testing/fallback */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload ID Card photo"
              aria-label="Upload ID Card photo"
              className="p-2 text-[#B8A6BD] hover:text-white hover:bg-[#2D2534] rounded-lg transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              aria-label="Close scanner"
              className="p-2 text-[#B8A6BD] hover:text-white hover:bg-[#2D2534] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="relative bg-black aspect-4/3 sm:aspect-16/10 flex items-center justify-center overflow-hidden">
          {/* Live Video Feed */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Offscreen Canvas for cropping and preprocessing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanning Overlay (Active when camera is running) */}
          {cameraReady && !cameraError && !detectedId && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Semi-transparent Darkened Mask around Target Box */}
              <div className="absolute inset-0 bg-black/45" />

              {/* Cutout Alignment Box for Roll Number */}
              <div
                ref={overlayBoxRef}
                className="relative z-10 w-[82%] max-w-[380px] h-[92px] rounded-xl border-2 border-[#8D6B94] shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] flex flex-col items-center justify-between p-2.5 transition-all bg-black/10"
              >
                {/* 4 Corner Markers */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br-sm" />

                {/* Laser animation bar */}
                <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse shadow-[0_0_8px_#34d399]" />

                {/* Target Label */}
                <div className="w-full text-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-black/70 text-emerald-300 border border-emerald-400/40">
                    ALIGN ROLL NUMBER HERE
                  </span>
                </div>

                <div className="text-[9px] text-[#E8DBC5]/80 font-mono tracking-tight bg-black/60 px-2 py-0.5 rounded">
                  Printed text under student photo
                </div>
              </div>

              {/* Guidance Badge under the alignment box */}
              <div className="relative z-10 mt-5">
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-black/80 text-white border border-[#3B3142] shadow-lg flex items-center gap-1.5">
                  <ScanLine className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  {scanStatus}
                </span>
              </div>
            </div>
          )}

          {/* Success Overlay Lock */}
          {detectedId && (
            <div className="absolute inset-0 z-20 bg-[#211C26]/95 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
              <div className="p-3 bg-emerald-500 rounded-full text-white shadow-lg mb-3">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <Badge className="bg-emerald-600 text-white font-mono text-sm px-3 py-1 uppercase tracking-wider mb-2">
                ROLL NUMBER DETECTED
              </Badge>
              <h4 className="text-2xl font-black font-mono text-white tracking-widest">
                {detectedId}
              </h4>
              <p className="text-xs text-[#B8A6BD] mt-2">
                Stopping camera and verifying with gate records...
              </p>
            </div>
          )}

          {/* Error Overlay */}
          {cameraError && (
            <div className="absolute inset-0 z-20 bg-[#211C26]/95 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-full">
                <CameraOff className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-base font-bold text-white">Camera Access Required</h4>
                <p className="text-xs text-[#B8A6BD]">{cameraError}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={startCamera}
                  className="bg-[#8D6B94] hover:bg-[#795B80] text-white font-bold"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Retry Camera
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="border-[#3B3142] text-white hover:bg-[#2D2534]"
                >
                  Enter Manually
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Guidance Controls */}
        <div className="p-4 bg-[#1A151E] border-t border-[#3B3142] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#B8A6BD]">
            <AlertCircle className="w-4 h-4 text-[#8D6B94] shrink-0" />
            <span>Printed Roll Number is used. The QR code is bypassed.</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-full sm:w-auto border-[#3B3142] text-[#FFF4E9] hover:bg-[#2D2534] font-semibold"
          >
            <Keyboard className="w-3.5 h-3.5 mr-1.5" />
            Enter Roll Number Manually
          </Button>
        </div>
      </div>
    </div>
  );
};
