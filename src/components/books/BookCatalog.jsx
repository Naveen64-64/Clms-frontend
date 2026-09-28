import React, { useState, useEffect, useCallback, useRef } from 'react';
import { bookApi } from '../../api/bookApi';
import { libraryApi } from '../../api/libraryApi';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { SearchInput } from '../ui/SearchInput';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { NewArrivalsShowcase } from './NewArrivalsShowcase';
import { BookResultCard } from './BookResultCard';
import { BookDetailsDialog } from './BookDetailsDialog';
import { useAcademicBranches } from '../../hooks/useAcademicBranches';
import { LibrarySelect } from '../common/LibrarySelect';
import { RotateCcw, BookOpen } from 'lucide-react';

export const BookCatalog = ({ mode = 'public', title, description }) => {
  const { user, studentProfile } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [branch, setBranch] = useState('');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [libraryId, setLibraryId] = useState('');
  const [page, setPage] = useState(1);
  const [filterOptions, setFilterOptions] = useState({ categories: [], branches: [], departments: [] });

  // Fetch dynamic categories and branches from DB
  useEffect(() => {
    bookApi
      .getFilterOptions()
      .then((res) => {
        if (res?.data) {
          setFilterOptions(res.data);
        }
      })
      .catch((err) => console.error('Failed to load filter options', err));
  }, []);

  const { allowedBranches, isValidBranch } = useAcademicBranches(libraryId, filterOptions.branches);

  // Requirement 9: Reset invalid branch selection when library changes
  useEffect(() => {
    if (branch && !isValidBranch(branch)) {
      setBranch('');
      setPage(1);
    }
  }, [libraryId, branch, isValidBranch]);

  const [hasSearched, setHasSearched] = useState(false);
  const [libraries, setLibraries] = useState([]);
  const [booksData, setBooksData] = useState({
    books: [],
    pagination: { page: 1, totalPages: 1, total: 0, limit: 20 },
  });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const sentinelRef = useRef(null);
  const isFetchingRef = useRef(false);

  const [selectedBook, setSelectedBook] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 350);

  // Student gender detection
  const studentGender = user?.studentProfile?.gender || studentProfile?.gender || user?.gender;

  // Fetch libraries on mount
  useEffect(() => {
    libraryApi
      .getAllLibraries()
      .then((res) => {
        if (res?.data && Array.isArray(res.data)) {
          let list = res.data;
          // For male students in student mode, filter out women-only libraries
          if (mode === 'student' && studentGender === 'MALE') {
            list = list.filter(
              (lib) => !lib.isWomenOnly && lib.code !== 'KIET_WOMEN' && !lib.name?.toLowerCase().includes('women')
            );
          }
          setLibraries(list);
        }
      })
      .catch((err) => {
        console.error('Failed to load libraries:', err);
      });
  }, [mode, studentGender]);

  // Execute catalog fetch
  const fetchCatalog = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      try {
        const params = {
          search: debouncedSearch.trim() || undefined,
          branch: branch || undefined,
          category: category || undefined,
          libraryId: libraryId || undefined,
          availability: availability || undefined,
          page: targetPage,
          limit: 20,
        };
        const res = await bookApi.searchBooks(params);
        if (res?.data) {
          const rawBooks = res.data.books || [];
          const pag = res.data.pagination || { page: targetPage, totalPages: 1, total: rawBooks.length, limit: 20 };
          setBooksData({
            books: rawBooks,
            pagination: pag,
          });
          setPage(targetPage);
          setHasMore(pag.hasMore ?? (targetPage < pag.totalPages));
        }
      } catch (err) {
        console.error('Failed to search catalog:', err);
        setBooksData({ books: [], pagination: { page: 1, totalPages: 1, total: 0, limit: 20 } });
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, branch, category, libraryId, availability]
  );

  // Load next chunk on scroll
  const loadMoreBooks = async () => {
    if (isFetchingRef.current || loading || loadingMore || !hasMore) return;
    isFetchingRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const params = {
        search: debouncedSearch.trim() || undefined,
        branch: branch || undefined,
        category: category || undefined,
        libraryId: libraryId || undefined,
        availability: availability || undefined,
        page: nextPage,
        limit: 20,
      };
      const res = await bookApi.searchBooks(params);
      if (res?.data) {
        const newBooks = res.data.books || [];
        const pag = res.data.pagination || {};
        setBooksData((prev) => {
          const seen = new Set(prev.books.map((b) => String(b.id || b._id)));
          const fresh = newBooks.filter((b) => !seen.has(String(b.id || b._id)));
          return {
            books: [...prev.books, ...fresh],
            pagination: pag,
          };
        });
        setPage(nextPage);
        setHasMore(pag.hasMore ?? (nextPage < pag.totalPages));
      }
    } catch (err) {
      console.error('Failed to load more books:', err);
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreBooks();
        }
      },
      { root: null, rootMargin: '200px', threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, debouncedSearch, branch, category, libraryId, availability]);

  // Trigger search when query or filters change
  useEffect(() => {
    const isParamActive = Boolean(
      debouncedSearch.trim() || branch || category || libraryId || availability
    );

    if (isParamActive) {
      if (!hasSearched) setHasSearched(true);
      fetchCatalog(1);
    } else if (hasSearched) {
      fetchCatalog(1);
    }
  }, [debouncedSearch, branch, category, libraryId, availability]);

  // Handle Manual Submit / Enter
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!hasSearched) setHasSearched(true);
    setPage(1);
    fetchCatalog(1);
  };

  // Handle Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setBranch('');
    setCategory('');
    setAvailability('');
    setLibraryId('');
    setPage(1);
    setHasSearched(false);
    setBooksData({ books: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  };

  // Handle Clear Search Input
  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(1);
    const hasOtherFilters = Boolean(branch || category || libraryId || availability);
    if (!hasOtherFilters) {
      setHasSearched(false);
      setBooksData({ books: [], pagination: { page: 1, totalPages: 1, total: 0 } });
    }
  };

  const handleViewDetails = (book) => {
    setSelectedBook(book);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {title || (mode === 'student' ? 'Student Book Search' : 'Book Catalog Search')}
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
          {description ||
            (mode === 'student'
              ? 'Search course materials, check live copy availability, and view physical library holdings.'
              : 'Search academic repository, physical copy inventory, and library availability.')}
        </p>
      </div>

      {/* Search & Filter Bar Container */}
      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            {/* Search Input */}
            <div className="lg:col-span-3 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Search Catalog</span>
              <SearchInput
                placeholder="Search by Book ID, Title, Author, ISBN..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                onClear={handleClearSearch}
              />
            </div>

            {/* Category Filter */}
            <div className="lg:col-span-2 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Category</span>
              <Select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Categories</option>
                {filterOptions.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>

            {/* Branch Filter */}
            <div className="lg:col-span-2 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Branch</span>
              <Select
                value={branch}
                onChange={(e) => {
                  setBranch(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Branches</option>
                {allowedBranches.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Availability Filter */}
            <div className="lg:col-span-2 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Availability</span>
              <Select
                value={availability}
                onChange={(e) => {
                  setAvailability(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Titles</option>
                <option value="AVAILABLE">Available Now</option>
                <option value="ISSUED">Currently Issued</option>
              </Select>
            </div>

            {/* Library Filter */}
            <div className="lg:col-span-2 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Library Location</span>
              <LibrarySelect
                value={libraryId}
                mode={mode}
                studentGender={studentGender}
                libraries={libraries}
                onChange={(e) => {
                  setLibraryId(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Reset Button */}
            <div className="lg:col-span-1 flex items-center justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilters}
                className="w-full text-xs font-semibold h-[42px] px-2 gap-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60 border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
                title="Reset all search filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Reset</span>
                <span className="inline lg:hidden">Reset Filters</span>
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Main Content Area */}
      {!hasSearched ? (
        <NewArrivalsShowcase onViewDetails={handleViewDetails} />
      ) : loading ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-medium">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between space-x-4">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ) : booksData.books.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
            <BookOpen className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Matching Books Found</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              No books matched your active search query or filter parameters. Try broadening your keywords or reset
              filters.
            </p>
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs font-semibold gap-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1 font-medium">
            <span>
              Showing <strong className="text-slate-900 dark:text-white">{booksData.books.length}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white">{booksData.pagination.total || booksData.books.length}</strong> books
            </span>
          </div>

            {/* Desktop Table Header & Results Container */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              {/* Desktop Table Header */}
              <div className="hidden md:grid md:grid-cols-12 md:gap-4 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <div className="col-span-4">Book Title & Author</div>
                <div className="col-span-2">Category & Branch</div>
                <div className="col-span-2">Library Holdings</div>
                <div className="col-span-2">Status & Availability</div>
                <div className="col-span-2 text-right">Book ID & Action</div>
              </div>

              {/* Results Rows */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {booksData.books.map((book) => (
                  <BookResultCard key={book.id || book._id} book={book} onViewDetails={handleViewDetails} />
                ))}
              </div>
            </div>

            {/* Infinite Scroll Sentinel & Chunk Loading Indicator */}
            <div ref={sentinelRef} className="py-6 flex flex-col items-center justify-center">
              {loadingMore && (
                <div className="flex items-center space-x-2 text-xs font-semibold text-[#8D6B94] dark:text-[#B185A7]">
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Loading more books...</span>
                </div>
              )}
              {!hasMore && booksData.books.length > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  All {booksData.pagination.total || booksData.books.length} matching books loaded
                </p>
              )}
            </div>
          </div>
        )}

      {/* Book Details Dialog */}
      <BookDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        book={selectedBook}
        mode={mode}
      />
    </div>
  );
};
