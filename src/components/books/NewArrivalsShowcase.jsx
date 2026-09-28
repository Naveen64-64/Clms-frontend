import React, { useState, useEffect, useRef, useMemo } from 'react';
import { bookApi } from '../../api/bookApi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Eye,
  AlertCircle,
} from 'lucide-react';

/**
 * Dynamically resolves and loads the ORIGINAL book cover for a book.
 * Sources (in priority):
 * 1. book.imageUrl (if provided by database/API)
 * 2. Open Library Covers API (using cleaned ISBN)
 * 3. "Cover unavailable" placeholder if no real cover exists
 */
const OriginalBookCover = ({ book, isCenter }) => {
  const getInitialUrl = (b) => {
    if (b?.imageUrl && typeof b.imageUrl === 'string' && b.imageUrl.trim() !== '') {
      return b.imageUrl.trim();
    }
    if (b?.isbn && typeof b.isbn === 'string' && b.isbn.trim() !== '') {
      const clean = b.isbn.replace(/[^0-9X]/gi, '');
      if (clean) {
        // Open Library Cover API (returns 404 if no cover exists, avoiding generic placeholders)
        return `https://covers.openlibrary.org/b/isbn/${clean}-M.jpg?default=false`;
      }
    }
    return null;
  };

  const [imgUrl, setImgUrl] = useState(() => getInitialUrl(book));
  const [hasError, setHasError] = useState(!getInitialUrl(book));
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initial = getInitialUrl(book);
    setImgUrl(initial);
    setHasError(!initial);
    setIsLoaded(false);
  }, [book?.id, book?._id, book?.isbn, book?.imageUrl]);

  const handleImageError = () => {
    setHasError(true);
  };

  const handleImageLoad = (e) => {
    const img = e.target;
    // Discard 1x1 or blank placeholder images from external cover services
    if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
      setHasError(true);
      return;
    }
    setIsLoaded(true);
  };

  // If no cover is found or image loading fails: Display simple "Cover unavailable" placeholder
  if (hasError || !imgUrl) {
    return (
      <div className="w-full h-full flex flex-col justify-between p-2 sm:p-4 text-center bg-[#FFF4E9]/85 dark:bg-[#231C26] border border-[#E8DBC5] dark:border-[#3B3142] rounded-2xl select-none shadow-sm transition-all duration-300">
        <div className="flex items-center justify-between gap-1 text-[8px] sm:text-[10px] font-mono text-[#8D6B94] dark:text-[#B185A7] uppercase tracking-wider">
          <span className="font-bold truncate max-w-[75%]">{book.branch || 'GENERAL'}</span>
          <span>KDL</span>
        </div>

        <div className="my-auto py-0.5 sm:py-2 space-y-0.5 sm:space-y-1.5">
          <BookOpen className="w-5 h-5 sm:w-8 sm:h-8 text-[#8D6B94] dark:text-[#B185A7] mx-auto opacity-70 stroke-[1.5]" />
          <span className="text-[8px] sm:text-xs font-bold text-[#8D6B94] dark:text-[#B185A7] uppercase tracking-wider block leading-tight">
            Cover unavailable
          </span>
          <h4 className="text-[9px] sm:text-xs md:text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9] line-clamp-2 leading-tight px-0.5">
            {book.title}
          </h4>
        </div>

        <div className="pt-1 sm:pt-1.5 border-t border-[#E8DBC5]/80 dark:border-[#3B3142] text-[8px] sm:text-[10px] text-[#7A697E] dark:text-[#B8A6BD] truncate">
          {book.author || 'Academic Collection'}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#231C26] border border-[#E8DBC5]/80 dark:border-[#3B3142] shadow-sm">
      <img
        src={imgUrl}
        alt={book.title || 'Book cover'}
        loading="lazy"
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`w-full h-full object-cover object-center transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Loading Skeleton while original cover is fetching */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-[#FFF4E9]/50 dark:bg-[#231C26] animate-pulse flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-[#8D6B94]/40" />
        </div>
      )}

      {/* Subtle bottom title pill for quick identification on orbiting cards */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 sm:p-2.5 pt-5 pointer-events-none">
        <p className="text-[9px] sm:text-[11px] font-bold text-white truncate leading-tight">
          {book.title}
        </p>
      </div>
    </div>
  );
};

export const NewArrivalsShowcase = ({ onViewDetails }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rotationStep, setRotationStep] = useState(0);
  const [screenTier, setScreenTier] = useState('desktop');
  const [isHovered, setIsHovered] = useState(false);

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Responsive Screen Tier Detection (Desktop / Tablet / Mobile)
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w >= 1024) {
        setScreenTier('desktop');
      } else if (w >= 640) {
        setScreenTier('tablet');
      } else {
        setScreenTier('mobile');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch real newest arrivals from backend API (limit = 5: EXACTLY 5 books)
  useEffect(() => {
    setLoading(true);
    setError(null);
    bookApi
      .getNewArrivals({ limit: 5 })
      .then((res) => {
        const raw = res?.data?.books || res?.data || [];
        if (Array.isArray(raw) && raw.length > 0) {
          // Display EXACTLY 5 book covers from real database
          setBooks(raw.slice(0, 5));
        } else {
          setBooks([]);
        }
      })
      .catch(() => {
        setError('Unable to load new arrivals at this time.');
      })
      .finally(() => setLoading(false));
  }, []);

  const total = books.length;

  // Active book index derived from rotational step
  const activeIndex = total > 0 ? ((rotationStep % total) + total) % total : 0;
  const activeBook = books[activeIndex];

  const nextBook = () => {
    if (total <= 1) return;
    setRotationStep((prev) => prev + 1);
  };

  const prevBook = () => {
    if (total <= 1) return;
    setRotationStep((prev) => prev - 1);
  };

  // Rotate smoothly to any selected book via the shortest orbital route
  const selectBook = (targetIndex) => {
    if (total <= 1) return;
    const currentActive = ((rotationStep % total) + total) % total;
    let diff = targetIndex - currentActive;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    setRotationStep((prev) => prev + diff);
  };

  // Requirement 6: Exact 2.5 seconds auto-rotation interval with clean hover pause & automatic resume
  useEffect(() => {
    if (total <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setRotationStep((prev) => prev + 1);
    }, 2500);

    return () => {
      clearInterval(timer);
    };
  }, [total, isHovered]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    setIsHovered(true);
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsHovered(false);
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 30) {
      nextBook();
    } else if (distance < -30) {
      prevBook();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Requirement 2 & 3: True Circular Orbit Parameters for EXACTLY 5 Books (Equal Radius in X & Y)
  // Active book is 18% larger (~186px x 262px), surrounding books ~158px x 222px
  const orbitConfig = useMemo(() => {
    if (screenTier === 'desktop') {
      return {
        radius: 225, // Equal radius: orbit width (450px) == orbit height (450px)
        cardWidth: 158,
        cardHeight: 222,
        stageHeight: 720,
        topOffset: 100, // Moves the entire orbit upward closer to heading
      };
    }
    if (screenTier === 'tablet') {
      return {
        radius: 180,
        cardWidth: 130,
        cardHeight: 185,
        stageHeight: 590,
        topOffset: 85,
      };
    }
    // Mobile: compact true circular orbit fitting cleanly within 360-390px screens
    return {
      radius: 96,
      cardWidth: 70,
      cardHeight: 100,
      stageHeight: 342,
      topOffset: 55,
    };
  }, [screenTier]);

  if (loading) {
    return (
      <div className="space-y-4 my-6">
        <div className="text-center space-y-1">
          <Skeleton className="h-6 w-44 mx-auto rounded-lg" />
          <Skeleton className="h-4 w-72 mx-auto rounded-lg" />
        </div>
        <div className="h-[420px] flex items-center justify-center">
          <div className="w-[360px] h-[360px] rounded-full border border-dashed border-[#8D6B94]/30 flex items-center justify-center">
            <Skeleton className="h-[210px] w-[150px] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center rounded-2xl border border-[#E8DBC5] dark:border-[#3B3142] bg-white/60 dark:bg-[#251E27]/60 my-6">
        <AlertCircle className="w-8 h-8 text-[#8D6B94] mx-auto mb-2" />
        <h4 className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9]">Notice</h4>
        <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] mt-1">{error}</p>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl border border-[#E8DBC5] dark:border-[#3B3142] bg-white/60 dark:bg-[#251E27]/60 my-6">
        <BookOpen className="w-8 h-8 text-[#8D6B94] mx-auto mb-2" />
        <h4 className="text-sm font-bold text-[#2B232E] dark:text-[#FFF4E9]">No new arrivals available</h4>
        <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] mt-1">Check back soon for freshly cataloged titles.</p>
      </div>
    );
  }

  const { radius, cardWidth, cardHeight, stageHeight, topOffset } = orbitConfig;

  return (
    <section
      className="space-y-4 select-none my-4 relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Section Title & Required Supporting Text */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#8D6B94]/15 text-[#8D6B94] dark:text-[#B185A7] text-[10px] font-black uppercase tracking-widest">
          <Sparkles className="w-3 h-3 fill-current" />
          <span>Catalog Showcase</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-[#2B232E] dark:text-[#FFF4E9] tracking-tight uppercase">
          NEW ARRIVALS
        </h3>
        <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] font-medium max-w-md mx-auto">
          Discover the latest additions to the KDL collection.
        </p>
      </div>

      {/* 2. TRUE CIRCULAR "O" ORBIT STAGE (5 EQUIDISTANT 72° POSITIONS) */}
      <div
        className="relative w-full flex justify-center px-2 sm:px-6 select-none"
        style={{
          height: `${stageHeight}px`,
          minHeight: `${stageHeight}px`,
          perspective: '1000px',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Orbit Deck Container: Shifted upward via topOffset to sit comfortably close to heading */}
        <div
          className="relative w-full max-w-[800px] flex items-center justify-center pointer-events-none"
          style={{
            height: `${radius * 2}px`,
            marginTop: `${topOffset}px`,
          }}
        >
          {/* Invisible Orbital Path Guide (True Circle: width == height == radius * 2) */}
          <div
            className="absolute rounded-full border border-dashed border-[#8D6B94]/25 dark:border-[#B185A7]/20 pointer-events-none"
            style={{
              width: `${radius * 2}px`,
              height: `${radius * 2}px`,
            }}
          />

          {/* Navigation Chevron: Previous */}
          {total > 1 && (
            <button
              type="button"
              onClick={prevBook}
              className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 z-40 p-1.5 sm:p-2.5 rounded-full bg-white dark:bg-[#251E27] text-[#2B232E] dark:text-[#FFF4E9] hover:bg-[#8D6B94] hover:text-white border border-[#E8DBC5] dark:border-[#3B3142] shadow-md transition-all active:scale-95 cursor-pointer pointer-events-auto"
              aria-label="Previous Book"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Navigation Chevron: Next */}
          {total > 1 && (
            <button
              type="button"
              onClick={nextBook}
              className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 z-40 p-1.5 sm:p-2.5 rounded-full bg-white dark:bg-[#251E27] text-[#2B232E] dark:text-[#FFF4E9] hover:bg-[#8D6B94] hover:text-white border border-[#E8DBC5] dark:border-[#3B3142] shadow-md transition-all active:scale-95 cursor-pointer pointer-events-auto"
              aria-label="Next Book"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Orbiting Book Deck: Angle-Based Positioning (X = radius*cos(θ), Y = radius*sin(θ)) */}
          {books.map((book, idx) => {
            // Angle computation: θ = π/2 + (idx - rotationStep) * (2π / 5)
            // Equal 72° angular spacing around a true circle of radius R
            const angle = Math.PI / 2 + (idx - rotationStep) * ((2 * Math.PI) / total);

            // Equal distance from orbit center: X = R * cos(θ), Y = R * sin(θ)
            const posX = radius * Math.cos(angle);
            const posY = radius * Math.sin(angle);

            // Depth calculation: sin(angle) ranges from -1 (top/back) to +1 (bottom/front)
            // Normalized depth: t in [0, 1]
            const depthFactor = (Math.sin(angle) + 1) / 2;

            const isCenter = idx === activeIndex;

            // Requirement: Active/main book is ~18% larger (~186px x 262px) compared with surrounding books (~155-158px x 218-222px)
            const scale = isCenter ? 1.18 : 0.98 + 0.02 * depthFactor;

            // Z-Index: 15 at back, up to 50 at active front
            const zIndex = isCenter ? 50 : Math.round(15 + 25 * depthFactor);

            // Opacity: 0.88 at back to 1.00 at front (all cards fully visible)
            const opacity = isCenter ? 1.0 : 0.88 + 0.1 * depthFactor;

            // Subtle brightness depth
            const brightness = isCenter ? 1.0 : 0.92 + 0.06 * depthFactor;

            const cardStyle = {
              transform: `translate3d(${posX.toFixed(1)}px, ${posY.toFixed(1)}px, 0px) scale(${scale.toFixed(3)})`,
              zIndex,
              opacity,
              filter: `brightness(${brightness.toFixed(2)})`,
              transition:
                'transform 650ms cubic-bezier(0.25, 1, 0.5, 1), opacity 550ms ease, filter 550ms ease, z-index 650ms ease, box-shadow 650ms ease',
              pointerEvents: 'auto',
              width: `${cardWidth}px`,
              height: `${cardHeight}px`,
              boxShadow: isCenter
                ? '0 24px 38px -8px rgba(43, 35, 46, 0.42), 0 12px 20px -4px rgba(141, 107, 148, 0.32)'
                : '0 8px 18px -4px rgba(43, 35, 46, 0.16)',
            };

            return (
              <div
                key={book.id || book._id || idx}
                onClick={() => {
                  if (!isCenter) {
                    selectBook(idx);
                  } else if (onViewDetails) {
                    onViewDetails(book);
                  }
                }}
                style={cardStyle}
                className={`absolute cursor-pointer transition-all rounded-2xl ${
                  isCenter
                    ? 'ring-2 ring-[#8D6B94] dark:ring-[#B185A7] ring-offset-2 ring-offset-[#FFF4E9]/60 dark:ring-offset-[#211C26]'
                    : 'hover:opacity-100'
                }`}
                title={isCenter ? 'Click to inspect book holdings' : `Bring "${book.title}" to front`}
              >
                <OriginalBookCover book={book} isCenter={isCenter} />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. ACTIVE BOOK INFORMATION & ACTION BAR */}
      {activeBook && (
        <div className="max-w-lg mx-auto p-4 rounded-2xl bg-white/95 dark:bg-[#251E27]/95 border border-[#E8DBC5] dark:border-[#3B3142] shadow-sm text-center space-y-2.5 mt-6 sm:mt-8 relative z-30">
          {/* Active Book Badges */}
          <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
            <Badge
              variant="sand"
              className="font-bold text-[10px] uppercase tracking-wider bg-[#8D6B94]/15 text-[#8D6B94] dark:text-[#B185A7]"
            >
              {activeBook.category || 'Academic Literature'}
            </Badge>

            <span className="text-[#7A697E] dark:text-[#B8A6BD]">•</span>

            <span className="font-semibold text-xs text-[#2B232E] dark:text-[#FFF4E9]">
              Branch: <strong className="font-bold">{activeBook.branch || 'GENERAL'}</strong>
            </span>

            {activeBook.isbn && (
              <>
                <span className="text-[#7A697E] dark:text-[#B8A6BD]">•</span>
                <span className="font-mono text-[11px] text-[#7A697E] dark:text-[#B8A6BD]">
                  ISBN: {activeBook.isbn}
                </span>
              </>
            )}

            {activeBook.availability && (
              <>
                <span className="text-[#7A697E] dark:text-[#B8A6BD]">•</span>
                <span
                  className={`font-bold text-[11px] ${
                    activeBook.availability === 'AVAILABLE'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-[#C3A29E]'
                  }`}
                >
                  {activeBook.availability === 'AVAILABLE' ? 'Available' : 'Circulating'}
                </span>
              </>
            )}
          </div>

          {/* Active Book Title & Author */}
          <div className="space-y-0.5 px-2">
            <h4 className="text-sm sm:text-base font-black text-[#2B232E] dark:text-[#FFF4E9] line-clamp-1 leading-snug">
              {activeBook.title}
            </h4>
            <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] font-medium truncate">
              By <span className="font-semibold text-[#2B232E] dark:text-[#FFF4E9]">{activeBook.author}</span>
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-center pt-1">
            <Button
              size="sm"
              onClick={() => onViewDetails && onViewDetails(activeBook)}
              className="h-8 px-4 text-xs font-bold bg-[#8D6B94] hover:bg-[#795B80] text-[#FFF4E9] rounded-xl shadow-xs cursor-pointer gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              Inspect Book Holdings
            </Button>
          </div>
        </div>
      )}

      {/* 4. Orbital Position Indicator Dots (Exactly 5 Dots) */}
      <div className="flex items-center justify-center gap-1.5 pt-0.5">
        {books.map((_, i) => (
          <button
            key={i}
            onClick={() => selectBook(i)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              i === activeIndex
                ? 'w-5 bg-[#8D6B94] dark:bg-[#B185A7]'
                : 'w-1.5 bg-[#C3A29E]/50 dark:bg-[#3B3142] hover:bg-[#8D6B94]/60'
            }`}
            aria-label={`Select book ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
