import React, { useState, useEffect, useRef, useCallback } from 'react';
import { reportApi } from '../../api/reportApi';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { TrendLineChart } from '../../components/charts/LibraryCharts';
import { BarChart3, TrendingUp, Users, Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

// ── Time-range options ──────────────────────────────────────────────────────
const RANGE_OPTIONS = [
  { label: 'Last 7 days',   days: 7   },
  { label: 'Last 30 days',  days: 30  },
  { label: 'Last 6 months', days: 183 },
  { label: 'This year',     days: 365 },
];

// ── Pill-style range selector ───────────────────────────────────────────────
const RangePills = ({ value, onChange }) => (
  <div className="flex flex-wrap gap-1.5">
    {RANGE_OPTIONS.map((opt) => (
      <button
        key={opt.days}
        type="button"
        onClick={() => onChange(opt.days)}
        className={cn(
          'px-3 py-1 rounded-full text-[11px] font-semibold transition-colors border cursor-pointer',
          value === opt.days
            ? 'bg-[#8D6B94] text-[#FFF4E9] border-[#8D6B94] shadow-sm'
            : 'bg-transparent text-[#7A697E] dark:text-[#D1C2D4] border-[#E8DBC5] dark:border-[rgba(255,244,233,0.15)] hover:border-[#8D6B94] hover:text-[#8D6B94] dark:hover:text-[#B185A7]'
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

// ── Empty state for charts with no data ────────────────────────────────────
const EmptyChart = ({ message }) => (
  <div className="w-full h-64 flex flex-col items-center justify-center gap-3 text-[#7A697E] dark:text-[#B8A6BD]">
    <Inbox className="w-10 h-10 opacity-25" />
    <p className="text-xs font-medium text-center max-w-[200px] leading-relaxed opacity-70">
      {message}
    </p>
  </div>
);

// VISITOR_POLL_INTERVAL_MS – auto-refresh visitor data so entrance scans appear
const VISITOR_POLL_MS = 60_000;

// ── Main page component ────────────────────────────────────────────────────
export const LibrarianReportsPage = () => {
  const [trendDays,   setTrendDays]   = useState(30);
  const [visitorDays, setVisitorDays] = useState(30);

  const [trends,   setTrends]   = useState([]);
  // visitors: array of { date, visitors } – zero-filled range from backend
  const [visitors, setVisitors] = useState([]);
  // rangeGenerated: true means backend returned a proper date range (even if all 0s)
  // false/null means the API genuinely failed or returned nothing
  const [visitorRangeGenerated, setVisitorRangeGenerated] = useState(null);

  const [trendLoading,   setTrendLoading]   = useState(true);
  const [visitorLoading, setVisitorLoading] = useState(true);

  // Ref to track current visitorDays in the poll interval without stale closure
  const visitorDaysRef = useRef(visitorDays);
  useEffect(() => { visitorDaysRef.current = visitorDays; }, [visitorDays]);

  const fetchTrends = useCallback(async (days) => {
    setTrendLoading(true);
    try {
      const res = await reportApi.getBorrowingTrends({ days });
      const raw = res?.data;
      setTrends(Array.isArray(raw?.trends) ? raw.trends : []);
    } catch {
      setTrends([]);
    } finally {
      setTrendLoading(false);
    }
  }, []);

  // silent=true skips the loading skeleton (used by background poll)
  const fetchVisitors = useCallback(async (days, silent = false) => {
    if (!silent) setVisitorLoading(true);
    try {
      const res = await reportApi.getVisitorAnalytics({ days });
      const raw = res?.data;
      const arr = Array.isArray(raw?.dailyVisitors) ? raw.dailyVisitors : [];
      setVisitors(arr);
      // rangeGenerated = true means backend zero-filled the range → show chart
      setVisitorRangeGenerated(raw?.rangeGenerated === true ? true : arr.length > 0 ? true : false);
    } catch {
      setVisitors([]);
      setVisitorRangeGenerated(false);
    } finally {
      if (!silent) setVisitorLoading(false);
    }
  }, []);

  // Initial + range-change fetch
  useEffect(() => { fetchTrends(trendDays); }, [trendDays, fetchTrends]);
  useEffect(() => {
    setVisitorRangeGenerated(null); // reset while loading
    fetchVisitors(visitorDays);
  }, [visitorDays, fetchVisitors]);

  // Auto-refresh visitor data every 60 s so entrance scans reflect promptly
  useEffect(() => {
    const interval = setInterval(() => {
      fetchVisitors(visitorDaysRef.current, true /* silent */);
    }, VISITOR_POLL_MS);
    return () => clearInterval(interval);
  }, [fetchVisitors]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-[#8D6B94] dark:text-[#B185A7]" />
          <h1 className="text-2xl font-extrabold text-[#2B232E] dark:text-[#FFF4E9] tracking-tight">
            Library Reports
          </h1>
        </div>
        <p className="text-xs text-[#7A697E] dark:text-[#D1C2D4] mt-1 font-medium">
          Operational analytics restricted to your assigned library.
        </p>
      </div>

      {/* Two-chart grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Borrowing Trends */}
        <Card className="bg-white dark:bg-[#302731] border-[#E8DBC5] dark:border-[rgba(255,244,233,0.1)] flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7] shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9] leading-tight">
                    Borrowing Trends
                  </h3>
                  <p className="text-[11px] text-[#7A697E] dark:text-[#B8A6BD] mt-0.5">
                    Daily book issues in your library
                  </p>
                </div>
              </div>
              <RangePills value={trendDays} onChange={setTrendDays} />
            </div>
          </CardHeader>
          <CardContent className="pt-0 flex-1">
            {trendLoading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : trends.length === 0 ? (
              <EmptyChart message="No borrowing activity recorded for this period." />
            ) : (
              <TrendLineChart data={trends} xKey="date" yKey="issues" />
            )}
          </CardContent>
        </Card>

        {/* Daily Visitors */}
        <Card className="bg-white dark:bg-[#302731] border-[#E8DBC5] dark:border-[rgba(255,244,233,0.1)] flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7] shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9] leading-tight">
                    Daily Visitors
                  </h3>
                  <p className="text-[11px] text-[#7A697E] dark:text-[#B8A6BD] mt-0.5">
                    Library entrance activity (Students &amp; Faculty)
                  </p>
                </div>
              </div>
              <RangePills value={visitorDays} onChange={setVisitorDays} />
            </div>
          </CardHeader>
          <CardContent className="pt-0 flex-1">
            {visitorLoading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : visitorRangeGenerated === false ? (
              // Genuine empty: API failed or returned nothing at all
              <EmptyChart message="No visitor activity recorded for this period." />
            ) : (
              // rangeGenerated=true → render chart (zero-filled days show 0 on axis)
              <TrendLineChart data={visitors} xKey="date" yKey="visitors" />
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
