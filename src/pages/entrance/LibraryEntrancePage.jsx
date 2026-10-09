import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { entryExitApi } from '../../api/entryExitApi';
import { libraryApi } from '../../api/libraryApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { LibrarySelect } from '../../components/common/LibrarySelect';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import {
  BookOpen,
  LogOut,
  CheckCircle2,
  Clock,
  UserCheck,
  Building2,
  ShieldAlert,
  Keyboard,
  Camera,
  AlertCircle
} from 'lucide-react';
import { ThemeSwitcher } from '../../components/common/ThemeSwitcher';
import { Footer } from '../../components/common/Footer';
import { LiveCameraScanner } from '../../components/entrance/LiveCameraScanner';
import { LibraryOccupancyPanel } from '../../components/entrance/LibraryOccupancyPanel';
import { LiveGateActivityLog } from '../../components/entrance/LiveGateActivityLog';
import { ManualEntryModal } from '../../components/entrance/ManualEntryModal';
import {
  GATE_SCAN_COOLDOWN_MS,
  MIN_VISIT_DURATION_SECONDS,
  MIN_VISIT_DURATION_MS
} from '../../constants/gateConstants';

const LIBRARIES_LIST = [
  { code: 'KIET_MAIN', name: 'KIET Library' },
  { code: 'KIET_2', name: 'KIET 2 Library' },
  { code: 'KIET_WOMEN', name: "KIET Women's Library" }
];

export const LibraryEntrancePage = () => {
  const { user, logout } = useAuth();
  const [selectedLibrary, setSelectedLibrary] = useState('KIET_MAIN');
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);
  const [cooldownNotice, setCooldownNotice] = useState(null);
  const [recentVisits, setRecentVisits] = useState([]);
  const [libraryStatus, setLibraryStatus] = useState(null);
  const [allLibraries, setAllLibraries] = useState([]);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isScannerLocked, setIsScannerLocked] = useState(false);
  const [externalTerminalResult, setExternalTerminalResult] = useState(null);

  // Cooldown tracker: map of rollNumber -> unlockTimestamp
  const cooldownMapRef = useRef(new Map());
  // Active session card presence tracker: map of rollNumber -> { inTime, hasBeenRemoved: boolean, lastScanTime }
  const cardPresenceRef = useRef(new Map());
  const errorTimerRef = useRef(null);
  const cooldownNoticeTimerRef = useRef(null);

  const [isOccupancyLoading, setIsOccupancyLoading] = useState(true);
  const [occupancyError, setOccupancyError] = useState(null);
  const [isRecentLogsLoading, setIsRecentLogsLoading] = useState(true);
  const [recentLogsError, setRecentLogsError] = useState(null);

  /**
   * Fetch library detailed status and recent visits (requesting up to 20 chronological events)
   */
  const fetchLibraryData = useCallback(async (libCode) => {
    if (!libCode) return;
    try {
      const [recentRes, statusRes, allLibsRes] = await Promise.allSettled([
        entryExitApi.getRecentVisits(libCode, 20),
        libraryApi.getSeatStatus(libCode),
        libraryApi.getLibraries()
      ]);

      if (recentRes.status === 'fulfilled') {
        const rawRecent = recentRes.value?.data || (Array.isArray(recentRes.value) ? recentRes.value : []);
        setRecentVisits(Array.isArray(rawRecent) ? rawRecent : []);
        setRecentLogsError(null);
      } else {
        setRecentLogsError('Failed to load recent activity');
      }
      setIsRecentLogsLoading(false);

      if (statusRes.status === 'fulfilled') {
        const rawStatus = statusRes.value?.data || statusRes.value;
        if (rawStatus) setLibraryStatus(rawStatus);
      }

      if (allLibsRes.status === 'fulfilled') {
        const rawLibs = allLibsRes.value?.data || (Array.isArray(allLibsRes.value) ? allLibsRes.value : []);
        setAllLibraries(Array.isArray(rawLibs) ? rawLibs : []);
        setOccupancyError(null);
      } else {
        setOccupancyError('Failed to load campus libraries');
      }
      setIsOccupancyLoading(false);
    } catch (e) {
      setIsOccupancyLoading(false);
      setIsRecentLogsLoading(false);
    }
  }, []);

  // Poll library data and listen to live occupancy SSE stream
  useEffect(() => {
    setIsOccupancyLoading(true);
    setIsRecentLogsLoading(true);
    fetchLibraryData(selectedLibrary);

    let eventSource = null;
    try {
      eventSource = new EventSource('/api/v1/libraries/occupancy-stream');
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'OCCUPANCY_UPDATE' || data.libraryCode === selectedLibrary) {
            fetchLibraryData(selectedLibrary);
          }
        } catch (err) {}
      };
    } catch (err) {}

    const pollInterval = setInterval(() => {
      fetchLibraryData(selectedLibrary);
    }, 4000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pollInterval);
    };
  }, [selectedLibrary, fetchLibraryData]);

  /**
   * Clear error after delay
   */
  const displayError = useCallback((errData) => {
    setErrorInfo(errData);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      setErrorInfo(null);
    }, 4500);
  }, []);

  /**
   * Display subtle non-blocking notice (e.g. 60-second minimum duration warning)
   */
  const showCooldownNotice = useCallback((notice) => {
    setCooldownNotice(notice);
    if (cooldownNoticeTimerRef.current) clearTimeout(cooldownNoticeTimerRef.current);
    cooldownNoticeTimerRef.current = setTimeout(() => {
      setCooldownNotice(null);
    }, 4500);
  }, []);

  /**
   * Handle card removed from camera view (resets continuous presence)
   */
  const handleCardWithdrawn = useCallback(() => {
    cardPresenceRef.current.forEach((val) => {
      val.hasBeenRemoved = true;
    });
  }, []);

  /**
   * Authoritative Check-IN / Check-OUT Processor
   * Accepts either single roll number or array of OCR candidates.
   * Returns structured result object to caller.
   */
  const handleProcessEntrance = useCallback(
    async (targetIdentifier, candidates = null) => {
      if (!selectedLibrary) {
        displayError({ title: 'Configuration Error', message: 'Please select an active library.' });
        return {
          success: false,
          errorType: 'CONFIG_ERROR',
          title: 'CONFIG ERROR',
          message: 'Please select an active library.'
        };
      }

      const rollToLock = targetIdentifier ? targetIdentifier.trim().toUpperCase() : null;

      // 1. Check short debounce cooldown (2.5 seconds per roll number)
      const now = Date.now();
      if (rollToLock && cooldownMapRef.current.has(rollToLock)) {
        const unlockTime = cooldownMapRef.current.get(rollToLock);
        if (now < unlockTime) {
          return null;
        }
      }

      // 2. Check continuous card visibility (Acceptance Test 7: Card held continuously in front)
      if (rollToLock && cardPresenceRef.current.has(rollToLock)) {
        const presence = cardPresenceRef.current.get(rollToLock);
        const elapsedSinceIn = now - presence.inTime;

        if (elapsedSinceIn < MIN_VISIT_DURATION_MS) {
          const remainingSec = Math.max(1, Math.ceil((MIN_VISIT_DURATION_MS - elapsedSinceIn) / 1000));
          showCooldownNotice({
            title: 'Entry Recorded — Exit In Cooldown',
            message: `Entry recorded. Exit available after 60 seconds. (Please wait ${remainingSec}s before scanning out)`,
            remainingSeconds: remainingSec,
            userId: rollToLock
          });
          cooldownMapRef.current.set(rollToLock, now + GATE_SCAN_COOLDOWN_MS);
          return {
            success: false,
            errorType: 'EXIT_NOT_AVAILABLE',
            title: 'EXIT NOT AVAILABLE',
            message: 'Please wait before scanning out.',
            subtext: `Exit is available after 1 minute. (${remainingSec}s remaining)`,
            remainingSeconds: remainingSec
          };
        } else if (!presence.hasBeenRemoved) {
          // 60 seconds passed, but card was never removed/re-presented (Acceptance Test 7)
          showCooldownNotice({
            title: 'Card Held Continuously',
            message: 'Please withdraw and re-present your ID card to record exit.',
            remainingSeconds: null,
            userId: rollToLock
          });
          cooldownMapRef.current.set(rollToLock, now + GATE_SCAN_COOLDOWN_MS);
          return {
            success: false,
            errorType: 'EXIT_NOT_AVAILABLE',
            title: 'EXIT NOT AVAILABLE',
            message: 'Please withdraw and re-present your ID card to record exit.',
            subtext: 'Card was held continuously in view.',
            remainingSeconds: null
          };
        }
      }

      setLoading(true);
      setIsScannerLocked(true);
      setErrorInfo(null);

      try {
        let res = null;
        if (candidates && candidates.length > 0) {
          // Candidate resolution API
          res = await entryExitApi.verifyCandidates(candidates, selectedLibrary);
        } else {
          // Direct roll number API
          res = await entryExitApi.scanUserId(rollToLock, selectedLibrary);
        }

        if (res?.data) {
          const verifiedResult = res.data;
          const verifiedRoll = verifiedResult.userId || verifiedResult.rollNumber;

          // Track active session presence for 60s rule and continuous presence
          if (verifiedRoll) {
            const cleanRoll = verifiedRoll.trim().toUpperCase();
            if (verifiedResult.action === 'IN') {
              cardPresenceRef.current.set(cleanRoll, {
                inTime: Date.now(),
                hasBeenRemoved: false,
                lastScanTime: Date.now()
              });
            } else if (verifiedResult.action === 'OUT') {
              cardPresenceRef.current.delete(cleanRoll);
            }
            // Lock this roll number for short debounce cooldown (2.5 seconds)
            cooldownMapRef.current.set(cleanRoll, Date.now() + GATE_SCAN_COOLDOWN_MS);
          }

          // Prepend new activity immediately to Recent Gate Activity
          const newActivityItem = {
            id: `${verifiedResult._id || Date.now()}_${verifiedResult.action}_${Date.now()}`,
            userId: verifiedRoll,
            rollNumber: verifiedRoll,
            name: verifiedResult.userName || verifiedResult.studentName || verifiedResult.name || 'Student',
            userName: verifiedResult.userName || verifiedResult.studentName || verifiedResult.name || 'Student',
            role: verifiedResult.userType || verifiedResult.role || 'STUDENT',
            userType: verifiedResult.userType || verifiedResult.role || 'STUDENT',
            action: verifiedResult.action,
            event: verifiedResult.action,
            library: verifiedResult.libraryCode || verifiedResult.libraryId || selectedLibrary,
            libraryName: verifiedResult.libraryName || 'Library',
            timestamp: verifiedResult.timestamp || new Date().toISOString()
          };

          setRecentVisits((prev) => [newActivityItem, ...(prev || [])]);

          // Immediately reflect updated seat counts
          if (verifiedResult.currentOccupancy !== undefined) {
            setLibraryStatus((prev) => prev ? {
              ...prev,
              activeVisits: verifiedResult.currentOccupancy,
              activeCount: verifiedResult.currentOccupancy,
              availableSeats: verifiedResult.availableSeats
            } : null);

            setAllLibraries((prevLibs) => (prevLibs || []).map((lib) => {
              if (lib.code === selectedLibrary) {
                return {
                  ...lib,
                  activeVisits: verifiedResult.currentOccupancy,
                  availableSeats: verifiedResult.availableSeats
                };
              }
              return lib;
            }));
          }

          fetchLibraryData(selectedLibrary);

          // Unlock scanner after 2.6 seconds
          setTimeout(() => {
            setIsScannerLocked(false);
          }, 2600);

          return {
            success: true,
            action: verifiedResult.action,
            result: verifiedResult,
            rollNumber: verifiedRoll,
            userName: verifiedResult.userName || verifiedResult.studentName || verifiedResult.name || 'Student',
            libraryName: verifiedResult.libraryName || 'KIET Library',
            timestamp: new Date(verifiedResult.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            currentOccupancy: verifiedResult.currentOccupancy,
            capacity: verifiedResult.capacity || 50
          };
        }
      } catch (err) {
        const errResponse = err.response?.data || err;
        const errCode = errResponse?.errorCode || errResponse?.code;
        const status = err.response?.status;
        const remainingSec = errResponse?.remainingSeconds || errResponse?.data?.remainingSeconds;

        if (errCode === 'MINIMUM_VISIT_DURATION') {
          showCooldownNotice({
            title: 'Entry Recorded — Exit In Cooldown',
            message: `Entry recorded. Exit available after 60 seconds. (Please wait ${remainingSec || 60}s before scanning out)`,
            remainingSeconds: remainingSec,
            userId: rollToLock
          });
          if (rollToLock) {
            cooldownMapRef.current.set(rollToLock, Date.now() + GATE_SCAN_COOLDOWN_MS);
            if (!cardPresenceRef.current.has(rollToLock)) {
              cardPresenceRef.current.set(rollToLock, {
                inTime: Date.now() - ((MIN_VISIT_DURATION_SECONDS - (remainingSec || MIN_VISIT_DURATION_SECONDS)) * 1000),
                hasBeenRemoved: false,
                lastScanTime: Date.now()
              });
            }
          }
          setTimeout(() => { setIsScannerLocked(false); }, 2400);
          return {
            success: false,
            errorType: 'EXIT_NOT_AVAILABLE',
            title: 'EXIT NOT AVAILABLE',
            message: 'Please wait before scanning out.',
            subtext: `Exit is available after 1 minute. (${remainingSec || 60}s remaining)`,
            remainingSeconds: remainingSec
          };
        }

        if (status === 404 || errResponse?.message?.includes('USER NOT FOUND') || errResponse?.message?.includes('not found')) {
          displayError({ title: 'USER NOT FOUND', message: 'Roll number not registered in library database.' });
          setTimeout(() => { setIsScannerLocked(false); }, 2400);
          return {
            success: false,
            errorType: 'USER_NOT_FOUND',
            title: 'USER NOT FOUND',
            message: 'Roll number is not registered.',
            subtext: 'No registered student or faculty record found.'
          };
        }

        if (status === 403 || errResponse?.message?.includes('not allowed') || errResponse?.message?.includes('denied') || errResponse?.message?.includes('operating hours')) {
          displayError({ title: 'ACCESS DENIED', message: errResponse?.message || 'Access is not permitted for this library.' });
          setTimeout(() => { setIsScannerLocked(false); }, 2400);
          return {
            success: false,
            errorType: 'ACCESS_DENIED',
            title: 'ACCESS DENIED',
            message: errResponse?.message || 'Access is not permitted for this library.',
            subtext: 'Please check library eligibility or operating hours.'
          };
        }

        displayError({
          title: errResponse?.message || 'Check-IN / Check-OUT Rejected',
          message: errResponse?.errorDetails?.reason || errResponse?.message || err.message || 'Operation failed',
          code: errCode,
          activeLibraryName: errResponse?.errorDetails?.activeLibraryName || errResponse?.activeLibraryName,
          userId: rollToLock
        });
        setTimeout(() => { setIsScannerLocked(false); }, 2400);
        return {
          success: false,
          errorType: 'SCAN_FAILED',
          title: 'SCAN FAILED',
          message: errResponse?.message || 'Verification failed. Please retry.'
        };
      } finally {
        setLoading(false);
      }
    },
    [selectedLibrary, fetchLibraryData, displayError, showCooldownNotice]
  );

  /**
   * Handle candidate detection from live camera scanner (async with return)
   */
  const handleScannerVerifiedCandidate = useCallback(
    async ({ rollNumber, candidates }) => {
      return await handleProcessEntrance(rollNumber, candidates);
    },
    [handleProcessEntrance]
  );

  /**
   * Handle manual fallback submission
   */
  const handleManualSubmit = async (manualId) => {
    setIsManualModalOpen(false);
    const outcome = await handleProcessEntrance(manualId, null);
    if (outcome) {
      setExternalTerminalResult(outcome);
    }
  };

  const selectedLibObj = LIBRARIES_LIST.find((l) => l.code === selectedLibrary);
  const isLibOpen = libraryStatus?.isOpen !== false;

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden bg-[#FFF4E9] dark:bg-[#161219] text-[#2B232E] dark:text-[#FFF4E9] transition-colors flex flex-col font-sans select-none">
      {/* Top Gate Header Bar */}
      <header className="bg-[#211C26] text-white border-b border-[#3B3142] shadow-sm shrink-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-13 sm:h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 sm:p-2 bg-[#8D6B94] rounded-xl text-white shadow-md">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight">KDL ACCESS TERMINAL</h1>
                <Badge className="bg-emerald-600 text-white font-mono text-[9px] px-1.5 py-0 uppercase">
                  OCR LIVE
                </Badge>
              </div>
              <p className="text-[11px] text-[#B185A7] font-medium hidden sm:block">Library Entrance & Exit Gate</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 sm:space-x-4">
            <ThemeSwitcher />
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-[#B8A6BD] uppercase font-semibold">Terminal Staff</p>
              <p className="text-xs font-bold text-[#FFF4E9]">{user?.username || user?.email || 'libraryentrance@gmail.com'}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="text-[#FFF4E9] border-[#3B3142] hover:bg-[#2D2534] cursor-pointer h-7 sm:h-8 text-xs"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Kiosk Area */}
      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto p-2.5 sm:p-3.5 flex flex-col gap-2.5 overflow-hidden">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#E8DBC5] dark:border-[#3B3142] shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#2B232E] dark:text-[#FFF4E9] tracking-tight flex items-center gap-2">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#8D6B94] dark:text-[#B185A7]" />
              Access Control Kiosk
            </h2>
            <p className="text-[10px] sm:text-[11px] text-[#7A697E] dark:text-[#B8A6BD] font-medium hidden sm:block">
              Real-time physical ID card OCR scanner with instant seat occupancy tracking
            </p>
          </div>

          <div className="flex items-center gap-2">
            {libraryStatus && (
              <Badge
                variant={!isLibOpen ? 'destructive' : 'success'}
                className={`text-[9px] sm:text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                  !isLibOpen ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>{!isLibOpen ? 'CLOSED (09:00 AM - 05:00 PM)' : 'OPEN • 09:00 AM - 05:00 PM'}</span>
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsManualModalOpen(true)}
              className="text-xs border-[#E8DBC5] dark:border-[#3B3142] font-semibold hover:bg-[#E8DBC5]/40 dark:hover:bg-[#2D2534] cursor-pointer h-7"
            >
              <Keyboard className="w-3 h-3 mr-1 text-[#8D6B94] dark:text-[#B185A7]" />
              Manual Entry
            </Button>
          </div>
        </div>

        {/* Closed Library Warning Alert */}
        {!isLibOpen && (
          <div className="shrink-0 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2 text-amber-900 dark:text-amber-200 text-xs">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs">Library Operating Hours Enforced</p>
              <p className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-300">
                CLMS libraries operate strictly between <strong>09:00 AM</strong> and <strong>05:00 PM</strong> (Asia/Kolkata).
                Scanning is temporarily paused outside operating hours. All active visits are automatically closed at 5:00 PM.
              </p>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {errorInfo && (
          <Alert variant="destructive" className="shrink-0 border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 p-2.5 rounded-xl animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 w-full text-xs">
                <h4 className="font-black text-xs text-rose-950 dark:text-rose-100 uppercase tracking-wide">
                  {errorInfo.title || 'Check-IN / Check-OUT Rejected'}
                </h4>
                {errorInfo.code === 'ALREADY_INSIDE_OTHER_LIBRARY' ? (
                  <div>
                    <p className="text-rose-900 dark:text-rose-300 font-semibold leading-relaxed text-[11px]">
                      <strong className="font-mono text-rose-950 dark:text-rose-100">{errorInfo.userId}</strong> is currently checked in at{' '}
                      <strong className="font-bold text-rose-950 dark:text-rose-100">{errorInfo.activeLibraryName || 'another library'}</strong>.
                    </p>
                    <p className="text-rose-700 dark:text-rose-400 font-medium text-[11px] mt-0.5">
                      Please check out from <strong className="font-bold">{errorInfo.activeLibraryName}</strong> before entering {selectedLibObj?.name}.
                    </p>
                  </div>
                ) : (
                  <p className="text-rose-700 dark:text-rose-300 font-semibold text-[11px]">{errorInfo.message}</p>
                )}
              </div>
            </div>
          </Alert>
        )}

        {/* Subtle Cooldown Notice Banner (60s rule notice) */}
        {cooldownNotice && (
          <div className="shrink-0 p-2 sm:p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2.5 text-xs animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="p-1 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-md shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-amber-950 dark:text-amber-100">
                  {cooldownNotice.title || 'Entry Recorded — Exit Available After 60s'}
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                  {cooldownNotice.message}
                </p>
              </div>
            </div>
            {cooldownNotice.remainingSeconds && (
              <Badge variant="outline" className="font-mono text-[11px] font-bold border-amber-500/40 text-amber-700 dark:text-amber-300 shrink-0">
                {cooldownNotice.remainingSeconds}s wait
              </Badge>
            )}
          </div>
        )}

        {/* 2-Column Viewport-Fitted Kiosk Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch flex-1 min-h-0 overflow-hidden">
          {/* Left Column: Camera Scanner (NO scrollbar, large in-terminal success/error card inside) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-0 relative rounded-2xl overflow-hidden shadow-xl">
            <LiveCameraScanner
              onVerifiedCandidate={handleScannerVerifiedCandidate}
              onCardWithdrawn={handleCardWithdrawn}
              isLocked={isScannerLocked || !isLibOpen}
              selectedLibraryName={selectedLibObj?.name}
              isLibraryOpen={isLibOpen}
              externalResult={externalTerminalResult}
              onClearExternalResult={() => setExternalTerminalResult(null)}
            />
          </div>

          {/* Right Column: Terminal Controls, Occupancy, & Real-Time Gate Logs (approx 38% width on desktop) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col min-h-0 space-y-2 overflow-hidden">
            {/* 1. Selected Terminal Library (Compact) */}
            <Card className="border-[#E8DBC5] dark:border-[#3B3142] bg-white dark:bg-[#211C26] shadow-xs shrink-0">
              <CardContent className="p-2 sm:p-2.5 flex items-center justify-between gap-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#7A697E] dark:text-[#B8A6BD] shrink-0">
                  Selected Library
                </label>
                <div className="flex-1 min-w-0">
                  <LibrarySelect
                    includeAllOption={false}
                    value={selectedLibrary}
                    onChange={(e) => {
                      setSelectedLibrary(e.target.value);
                      setErrorInfo(null);
                      setCooldownNotice(null);
                    }}
                    className="font-bold text-xs bg-[#FFF4E9]/60 dark:bg-[#1A151E] h-7 py-0.5"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 2 & 3. Active Gate Terminal & Campus Library Occupancy (Compact) */}
            <div className="shrink-0">
              <LibraryOccupancyPanel
                allLibraries={allLibraries}
                selectedLibraryCode={selectedLibrary}
                activeStatus={libraryStatus}
                isLoading={isOccupancyLoading}
                error={occupancyError}
              />
            </div>

            {/* 4. Live Gate Activity Log (~8-10 events visible simultaneously, flex-1, internal scroll) */}
            <div className="flex-1 min-h-[340px] lg:min-h-0 flex flex-col overflow-hidden">
              <LiveGateActivityLog
                visits={recentVisits}
                onRefresh={() => fetchLibraryData(selectedLibrary)}
                isLoading={isRecentLogsLoading}
                error={recentLogsError}
              />
            </div>
          </div>
        </div>

        {/* Fallback Manual Roll Number Modal */}
        <ManualEntryModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          onSubmit={handleManualSubmit}
          isLoading={loading}
          selectedLibraryName={selectedLibObj?.name}
        />
      </main>

      <Footer />
    </div>
  );
};
