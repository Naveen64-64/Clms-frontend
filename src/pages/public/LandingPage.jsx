import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/common/Navbar';
import { PieChart, Pie, Cell } from 'recharts';
import { libraryApi } from '../../api/libraryApi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  BookOpen,
  Clock,
  ShieldCheck,
  Search,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const HERO_PHRASES = [
  "Centralized Campus Network",
  "Academic Resource Hub",
  "Real-Time Seat Occupancy",
  "Institutional Gate Security"
];

const HeroTypingText = ({ className = "text-[#E8DBC5]", cursorClassName = "bg-[#E8DBC5]" }) => {
  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setText(HERO_PHRASES[0]);
      return;
    }

    const currentPhrase = HERO_PHRASES[phraseIndex];
    let timer;

    if (!isDeleting && text === currentPhrase) {
      timer = setTimeout(() => setIsDeleting(true), 2400);
    } else if (isDeleting && text === '') {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % HERO_PHRASES.length);
    } else {
      const speed = isDeleting ? 45 : 85;
      timer = setTimeout(() => {
        setText(
          isDeleting
            ? currentPhrase.substring(0, text.length - 1)
            : currentPhrase.substring(0, text.length + 1)
        );
      }, speed);
    }

    return () => clearTimeout(timer);
  }, [text, phraseIndex, isDeleting]);

  return (
    <span className={`inline break-words ${className}`}>
      <span>{text}</span>
      <span
        className={`ml-1 inline-block w-[2.5px] sm:w-[3px] h-[0.8em] rounded-full animate-pulse align-baseline ${cursorClassName}`}
        aria-hidden="true"
      />
    </span>
  );
};

const STORY_PANELS = [
  {
    id: 'books',
    number: '01',
    tag: 'BRANCH REPOSITORY',
    title: '50+ Academic Books & 200+ Copies',
    subtitle: 'Categorized across B.Tech academic branches (AIDS, CSM, CSD, CSC, CAI) with real-time physical copy availability tracking.',
    icon: BookOpen,
    image: '/awareness-books.jpg',
    badgeText: 'Live Inventory Sync',
    highlights: [
      'Multi-copy physical tracking',
      'Instant search across all 5 B.Tech branches',
      'Automated catalog availability check'
    ]
  },
  {
    id: 'gate',
    number: '02',
    tag: 'SMART ACCESS CONTROL',
    title: 'Institutional Entrance Gate Control',
    subtitle: 'Roll Number check-IN and check-OUT verified at dedicated entrance terminals with dynamic seat capacity tracking and gender access rules.',
    icon: CheckCircle2,
    image: '/awareness-gate.jpg',
    badgeText: 'Instant Validation',
    highlights: [
      'Roll Number check-IN and check-OUT logs',
      'Dedicated campus entrance kiosk terminals',
      'Gender-segregated access policy verification'
    ]
  },
  {
    id: 'security',
    number: '03',
    tag: 'ZERO-TRUST ARCHITECTURE',
    title: 'Zero-Trust Security & Isolation',
    subtitle: 'Role-Based Access Control (RBAC) guaranteeing strict data boundaries between Students, Librarians, Entrance Terminals, and System Admins.',
    icon: ShieldCheck,
    image: '/awareness-security.jpg',
    badgeText: 'RBAC Enforced',
    highlights: [
      'Role-based granular session security',
      'Strict API data isolation between roles',
      'Real-time automated audit log logging'
    ]
  }
];

const AwarenessAutoMarqueeSection = () => {
  const marqueePanels = [...STORY_PANELS, ...STORY_PANELS];

  return (
    <section className="relative py-4 my-2">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3 px-2">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#8D6B94] bg-[#E8DBC5]/40 px-3 py-1 rounded-full border border-[#E8DBC5] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Core Capabilities</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2B232E] tracking-tight">
            Institutional Resource & Gate Security
          </h2>
          <p className="text-xs sm:text-sm text-[#7A697E] mt-1">
            Automated continuous view of unified library operations, entrance validation, and system security.
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center text-xs font-semibold text-[#8D6B94] bg-white/80 px-3 py-1.5 rounded-full border border-[#E8DBC5] shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#8D6B94] animate-pulse mr-2" />
          Live Auto Marquee
        </span>
      </div>

      <div className="relative w-full overflow-hidden rounded-3xl border border-[#E8DBC5] bg-gradient-to-r from-[#FFF4E9] via-white to-[#FFF4E9] shadow-lg py-6">
        <div className="absolute left-0 top-0 bottom-0 w-6 sm:w-16 bg-gradient-to-r from-[#FFF4E9] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-6 sm:w-16 bg-gradient-to-l from-[#FFF4E9] to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee gap-4 sm:gap-6 px-4 py-2">
          {marqueePanels.map((panel, idx) => {
            const PanelIcon = panel.icon;
            return (
              <div
                key={`${panel.id}-${idx}`}
                className="w-[280px] xs:w-[330px] sm:w-[400px] lg:w-[440px] shrink-0"
              >
                <div className="h-full bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-[#E8DBC5] shadow-md hover:shadow-xl hover:scale-[1.04] transition-all duration-300 ease-out flex flex-col justify-between space-y-4 group">
                  <div className="relative rounded-xl overflow-hidden border border-[#E8DBC5] bg-[#FFF4E9] h-[190px]">
                    <img
                      src={panel.image}
                      alt={panel.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2B232E]/30 via-transparent to-transparent opacity-60 pointer-events-none" />

                    <div className="absolute top-3 left-3 flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[#8D6B94] text-[10px] font-bold border border-[#E8DBC5] shadow-2xs">
                        {panel.tag}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-3 right-3 p-2 rounded-lg bg-white/85 backdrop-blur-md border border-[#E8DBC5] flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded bg-[#8D6B94] text-white">
                          <PanelIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-[#2B232E] truncate max-w-[190px]">
                          {panel.title}
                        </span>
                      </div>
                      <Badge variant="selected" className="text-[9px] font-bold bg-[#E8DBC5]/60 text-[#8D6B94]">
                        {panel.badgeText}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg lg:text-xl font-extrabold text-[#2B232E] tracking-tight leading-snug">
                      {panel.title}
                    </h3>
                    <p className="text-xs text-[#7A697E] leading-relaxed">
                      {panel.subtitle}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-[#E8DBC5]/60">
                    {panel.highlights.map((highlight, hIdx) => (
                      <div key={hIdx} className="flex items-center text-xs text-[#2B232E]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#8D6B94] mr-2 flex-shrink-0" />
                        <span className="truncate">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const OccupancyDonutChart = ({ activeCount, capacity, size = 112 }) => {
  const cap = Math.max(1, capacity || 0);
  const active = Math.max(0, activeCount || 0);
  const available = Math.max(0, cap - active);
  const occupancyPct = cap > 0 ? Math.min(100, Math.round((active / cap) * 100)) : 0;

  const chartData = [
    { name: 'Occupied', value: active > 0 ? active : 0.0001 },
    { name: 'Available', value: available }
  ];

  const outerRadius = Math.round(size * 0.40);
  const innerRadius = Math.round(size * 0.29);

  return (
    <div className="relative w-full flex items-center justify-center my-0.5" style={{ height: `${size}px` }}>
      <PieChart width={size} height={size}>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
          stroke="none"
        >
          <Cell fill="#8D6B94" />
          <Cell fill="#E8DBC5" />
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-lg font-black text-[#2B232E] dark:text-[#FFF4E9] tracking-tight leading-none">{occupancyPct}%</span>
        <span className="text-[9px] font-bold text-[#7A697E] dark:text-[#B8A6BD] uppercase tracking-wider mt-0.5">Occupied</span>
      </div>
    </div>
  );
};

const MobileSeatDeck = ({ libraries }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const autoPlayRef = useRef(null);

  const total = libraries ? libraries.length : 0;

  const nextSlide = () => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const prevSlide = () => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  // Automatic Continuous Card Rotation Timer (Rotates every 4 seconds)
  useEffect(() => {
    if (total <= 1) return;
    autoPlayRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 4000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [total]);

  if (!libraries || libraries.length === 0) return null;

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 35) {
      nextSlide();
    } else if (distance < -35) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div className="md:hidden space-y-3 select-none py-1 overflow-hidden w-full max-w-full">
      {/* Horizontal 3-Card Library Deck Container */}
      <div
        className="relative w-full h-[345px] flex items-center justify-center overflow-hidden px-1 sm:px-2"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrow Left */}
        {total > 1 && (
          <button
            onClick={prevSlide}
            className="absolute left-1 z-40 p-2 rounded-full bg-white dark:bg-[#251E27] text-[#2B232E] dark:text-[#FFF4E9] hover:bg-[#8D6B94] hover:text-white border border-[#E8DBC5] dark:border-[#3B3142] shadow-md transition-all active:scale-95 cursor-pointer"
            aria-label="Previous Library"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Navigation Arrow Right */}
        {total > 1 && (
          <button
            onClick={nextSlide}
            className="absolute right-1 z-40 p-2 rounded-full bg-white dark:bg-[#251E27] text-[#2B232E] dark:text-[#FFF4E9] hover:bg-[#8D6B94] hover:text-white border border-[#E8DBC5] dark:border-[#3B3142] shadow-md transition-all active:scale-95 cursor-pointer"
            aria-label="Next Library"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        <div className="relative w-full max-w-[340px] h-[325px] flex items-center justify-center">
          {libraries.map((lib, idx) => {
            const activeCount = lib.activeVisits || 0;
            const capacity = lib.capacity || 0;

            // Calculate relative cyclic position from activeIndex: -1 (left), 0 (center/active), 1 (right)
            let diff = idx - activeIndex;
            if (diff > total / 2) diff -= total;
            if (diff < -total / 2) diff += total;

            const cardStyle = {
              transition: 'transform 550ms cubic-bezier(0.34, 1.25, 0.64, 1), opacity 450ms ease, box-shadow 450ms ease, filter 450ms ease',
            };

            if (diff === 0) {
              // ACTIVE / CENTER FRONT CARD (Solid Opaque, Elevated)
              cardStyle.transform = 'translate3d(0, 0, 0) scale(1)';
              cardStyle.zIndex = 30;
              cardStyle.opacity = 1;
              cardStyle.filter = 'none';
              cardStyle.pointerEvents = 'auto';
              cardStyle.boxShadow = '0 16px 25px -5px rgba(43, 35, 46, 0.22), 0 8px 10px -6px rgba(141, 107, 148, 0.16)';
            } else if (diff === -1) {
              // LEFT SIDE CARD (Recessed, Partially Hidden Behind Solid Center Card)
              cardStyle.transform = 'translate3d(-40%, 0, -30px) scale(0.85)';
              cardStyle.zIndex = 10;
              cardStyle.opacity = 0.65;
              cardStyle.filter = 'brightness(0.94)';
              cardStyle.pointerEvents = 'auto';
              cardStyle.boxShadow = '0 6px 14px -3px rgba(43, 35, 46, 0.1)';
            } else if (diff === 1) {
              // RIGHT SIDE CARD (Recessed, Partially Hidden Behind Solid Center Card)
              cardStyle.transform = 'translate3d(40%, 0, -30px) scale(0.85)';
              cardStyle.zIndex = 10;
              cardStyle.opacity = 0.65;
              cardStyle.filter = 'brightness(0.94)';
              cardStyle.pointerEvents = 'auto';
              cardStyle.boxShadow = '0 6px 14px -3px rgba(43, 35, 46, 0.1)';
            } else {
              // HIDDEN CARDS IF MORE THAN 3
              cardStyle.transform = `translate3d(${diff < 0 ? '-80%' : '80%'}, 0, -100px) scale(0.7)`;
              cardStyle.zIndex = 0;
              cardStyle.opacity = 0;
              cardStyle.pointerEvents = 'none';
            }

            return (
              <div
                key={lib._id || lib.id || lib.code || idx}
                onClick={() => diff !== 0 && setActiveIndex(idx)}
                style={cardStyle}
                className="absolute inset-x-0 mx-auto w-[calc(100vw-5rem)] max-w-[260px] h-[305px] cursor-pointer"
              >
                {/* Opaque solid card background with explicit border and rounded corners */}
                <Card className={`h-full relative overflow-hidden border border-[#E8DBC5] dark:border-[#3B3142] bg-white dark:bg-[#251E27] rounded-2xl flex flex-col justify-between transition-all duration-300 ${diff === 0 ? 'ring-2 ring-[#8D6B94]' : ''}`}>
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#8D6B94]" />

                  <CardHeader className="pb-1.5 pt-2.5 px-3.5 border-b border-[#E8DBC5]/60 dark:border-[#3B3142]">
                    <div className="flex justify-between items-start gap-1.5">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <div className="p-1.5 rounded-lg bg-[#8D6B94]/15 text-[#8D6B94] shrink-0">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-xs font-bold text-[#2B232E] dark:text-[#FFF4E9] truncate">{lib.name}</CardTitle>
                          <CardDescription className="text-[10px] text-[#7A697E] dark:text-[#B8A6BD] truncate">
                            {lib.code} {lib.location ? `• ${lib.location}` : ''}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="normal" className="text-[9px] px-1.5 py-0.5 shrink-0">
                        {lib.isWomenOnly ? "Women's" : 'Co-Ed'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="px-3.5 py-2 space-y-2 flex-1 flex flex-col justify-between">
                    {/* Compact, High-Legibility Donut Chart */}
                    <OccupancyDonutChart activeCount={activeCount} capacity={capacity} size={112} />

                    {/* Occupied & Available Counts Pill */}
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#2B232E] dark:text-[#FFF4E9] px-2 py-1 bg-[#FFF4E9]/70 dark:bg-[#302731] rounded-lg border border-[#E8DBC5]/50 dark:border-[#3B3142]/60">
                      <span className="flex items-center truncate mr-1">
                        <span className="w-2 h-2 rounded-full bg-[#8D6B94] mr-1.5 shrink-0" />
                        Occupied: {activeCount}
                      </span>
                      <span className="flex items-center truncate">
                        <span className="w-2 h-2 rounded-full bg-[#E8DBC5] border border-[#C3A29E]/60 mr-1.5 shrink-0" />
                        Available: {Math.max(0, capacity - activeCount)}
                      </span>
                    </div>

                    {/* Operating Hours & Active Visitors Row */}
                    <div className="text-[10px] text-[#7A697E] dark:text-[#B8A6BD] flex items-center justify-between border-t border-[#E8DBC5]/60 dark:border-[#3B3142] pt-1.5 px-0.5">
                      <span className="flex items-center truncate mr-1">
                        <Clock className="h-3 w-3 text-[#8D6B94] mr-1 shrink-0" />
                        {lib.openingTime || '08:00 AM'} - {lib.closingTime || '08:00 PM'}
                      </span>
                      <span className="font-semibold text-[#8D6B94] dark:text-[#B185A7] shrink-0">{activeCount} active</span>
                    </div>

                    {/* View Details Action Button */}
                    <div className="pt-0.5">
                      <Link to="/catalog" onClick={(e) => diff !== 0 && e.preventDefault()}>
                        <Button size="sm" variant="normal" className="w-full text-[11px] h-7.5 font-bold bg-[#8D6B94] hover:bg-[#B185A7] text-[#FFF4E9] rounded-xl shadow-xs">
                          View Details &rarr;
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Dot Controls */}
      <div className="flex items-center justify-center space-x-2 pt-1 pb-1">
        {libraries.map((_, dotIdx) => (
          <button
            key={dotIdx}
            onClick={() => setActiveIndex(dotIdx)}
            className={`transition-all duration-300 rounded-full ${dotIdx === activeIndex
              ? 'w-6 h-2 bg-[#8D6B94]'
              : 'w-2 h-2 bg-[#E8DBC5] hover:bg-[#8D6B94]/50'
              }`}
            aria-label={`Go to library ${dotIdx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export const LandingPage = () => {
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await libraryApi.getAllLibraries();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : res?.data?.data || [];
      setLibraries(list);
    } catch (e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    let eventSource = null;
    try {
      eventSource = new EventSource('/api/v1/libraries/occupancy-stream');
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'OCCUPANCY_UPDATE') {
            fetchStatus();
          }
        } catch (err) { }
      };
    } catch (err) { }

    const interval = setInterval(fetchStatus, 4000);
    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full">
      {/* Full-Viewport Hero Section with KIET Campus Photo Background */}
      <section className="relative w-full min-h-screen flex flex-col justify-center overflow-hidden">
        {/* Background Image: KIET Campus Photograph covering full viewport behind navbar */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/kiet-campus.jpg')`, backgroundPosition: 'center 40%' }}
        />

        {/* Continuous Directional Overlay: Dark plum gradient on left fading towards right, keeping the campus building prominent */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E1922]/95 via-[#1E1922]/75 to-[#1E1922]/45 sm:bg-gradient-to-r sm:from-[#1E1922]/95 sm:via-[#1E1922]/70 sm:to-[#1E1922]/15 pointer-events-none" />

        {/* Top Vignette behind Header for crisp navigation readability */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#1E1922]/85 via-[#1E1922]/35 to-transparent pointer-events-none" />

        {/* Soft Ambient Mesh for Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(232,219,197,0.15)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* Subtle Bottom Transition into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-gradient-to-t from-[#FFF4E9] dark:from-[#1E1922] to-transparent pointer-events-none" />

        {/* Hero Content (Positioned over full-screen photo, padded down to clear floating Navbar) */}
        <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-28 sm:pb-16 flex-1 flex flex-col justify-center">
          <div className="max-w-xl sm:max-w-2xl lg:max-w-3xl space-y-4 sm:space-y-6 text-left">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-white/15 dark:bg-white/10 backdrop-blur-md border border-white/20 text-[#FFF4E9] text-[11px] sm:text-xs font-semibold shadow-sm max-w-full truncate">
              <span className="w-2 h-2 rounded-full bg-[#B185A7] mr-2 shrink-0 animate-pulse" />
              <span className="truncate">KDL - KIET Digital Library</span>
            </div>

            {/* Editorial Title with Hero Typing Text */}
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[46px] font-extrabold text-white tracking-tight leading-[1.2] max-w-full drop-shadow-sm">
              <span className="block">Modern Library Operations &amp;</span>
              <span className="block mt-1 sm:mt-1.5 text-[#E8DBC5] font-serif italic font-normal min-h-[1.35em] w-full">
                <HeroTypingText className="text-[#E8DBC5]" cursorClassName="bg-[#E8DBC5]" />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-white/90 text-sm sm:text-base leading-relaxed font-normal max-w-lg drop-shadow-xs">
              Real-time seat occupancy tracking, academic branch book repository, institutional entrance gate management, and seamless library services across 3 campuses.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
              <Link to="/catalog" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="default"
                  className="w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-7 text-xs sm:text-sm rounded-full font-bold bg-[#8D6B94] hover:bg-[#A37B9F] text-[#FFF4E9] shadow-lg shadow-[#8D6B94]/35 transition-all hover:scale-[1.02] flex items-center justify-center border border-[#B185A7]/30 cursor-pointer"
                >
                  <Search className="w-4 h-4 mr-2 shrink-0" />
                  <span>Explore Book Catalog &rarr;</span>
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-7 text-xs sm:text-sm rounded-full font-bold border-white/60 text-white hover:bg-white/15 hover:border-white transition-all flex items-center justify-center backdrop-blur-xs cursor-pointer"
                >
                  <span>Sign In to Portal &rarr;</span>
                </Button>
              </Link>
            </div>

          </div>
        </div>

        {/* Bottom Anchor to balance viewport distribution */}
        <div className="h-4 sm:h-8 pointer-events-none" />
      </section>

      {/* Main Content Area: Seat Availability & Highlights */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12 sm:space-y-16">
        {/* Real-time Library Seat Availability */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-[#2B232E] tracking-tight">
                Live Library Seat Occupancy
              </h2>
              <p className="text-xs text-[#7A697E] mt-0.5">Real-time seat availability across all 3 institution libraries</p>
            </div>
            <span className="flex items-center text-xs font-semibold text-[#8D6B94] bg-[#E8DBC5]/50 px-3.5 py-1.5 rounded-full border border-[#E8DBC5] w-fit shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-[#8D6B94] animate-ping mr-2" />
              Live Auto-Sync
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          ) : (
            <>
              {/* Mobile Deck View */}
              <MobileSeatDeck libraries={libraries} />

              {/* Desktop & Tablet Grid View */}
              <div className="hidden md:grid md:grid-cols-3 gap-6">
                {libraries.map((lib) => {
                  const activeCount = lib.activeVisits || 0;
                  const capacity = lib.capacity || 0;

                  return (
                    <Card key={lib._id || lib.id || lib.code} className="hover:shadow-xl transition-all duration-300 relative overflow-hidden border-[#E8DBC5]/80 bg-white/90 backdrop-blur-md rounded-2xl flex flex-col justify-between">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-[#8D6B94]" />

                      <CardHeader className="pb-3 border-b border-[#E8DBC5]/60">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-3">
                            <div className="p-2.5 rounded-xl bg-[#8D6B94]/15 text-[#8D6B94]">
                              <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-base font-bold text-[#2B232E]">{lib.name}</CardTitle>
                              <CardDescription className="text-xs text-[#7A697E]">{lib.code} • {lib.location || 'Main Campus Building'}</CardDescription>
                            </div>
                          </div>
                          <Badge variant="normal" className="text-[10px]">
                            {lib.isWomenOnly ? "Women's Only" : 'Co-Ed Access'}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4 pt-3 flex-1 flex flex-col justify-between">
                        <OccupancyDonutChart activeCount={activeCount} capacity={capacity} size={136} />

                        <div className="flex items-center justify-between text-xs font-semibold text-[#2B232E] px-1 py-1">
                          <span className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-[#8D6B94] mr-1.5 shrink-0" />
                            Occupied: {activeCount}
                          </span>
                          <span className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-[#E8DBC5] border border-[#C3A29E]/60 mr-1.5 shrink-0" />
                            Available: {Math.max(0, capacity - activeCount)}
                          </span>
                        </div>

                        <div className="text-xs text-[#7A697E] flex items-center justify-between border-t border-[#E8DBC5]/60 pt-3">
                          <span className="flex items-center">
                            <Clock className="h-3.5 w-3.5 text-[#8D6B94] mr-1.5" />
                            {lib.openingTime || '08:00 AM'} - {lib.closingTime || '08:00 PM'}
                          </span>
                          <span className="font-semibold text-[#8D6B94]">{activeCount} active</span>
                        </div>

                        <div className="pt-1">
                          <Link to="/catalog">
                            <Button variant="default" className="w-full h-9 font-bold text-xs bg-[#8D6B94] hover:bg-[#B185A7] text-[#FFF4E9] rounded-xl shadow-xs">
                              View Details &rarr;
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* Feature Highlights: Automatic Continuous Horizontal Marquee Section */}
        <AwarenessAutoMarqueeSection />
      </div>
    </div>
  );
};
