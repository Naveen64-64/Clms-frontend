import React, { useState, useEffect, useRef } from 'react';
import { bookApi } from '../../api/bookApi';
import { useAuth } from '../../context/AuthContext';
import { useAcademicBranches } from '../../hooks/useAcademicBranches';
import { useDebounce } from '../../hooks/useDebounce';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/Skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/Dialog';
import { EmptyState } from '../../components/common/EmptyState';
import { BookOpen, Plus, Search, ShieldAlert, CheckCircle2, RotateCcw, AlertTriangle, RefreshCw, Layers, MapPin } from 'lucide-react';

export const LibrarianInventory = () => {
  const { librarianProfile } = useAuth();
  const assignedLibrary = librarianProfile?.assignedLibrary;
  const libraryCode = assignedLibrary?.code || '';

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filterOptions, setFilterOptions] = useState({ categories: [], branches: [] });

  // Data & Infinite Scroll States
  const [copies, setCopies] = useState([]);
  const [inventoryStats, setInventoryStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const sentinelRef = useRef(null);
  const isFetchingRef = useRef(false);

  const debouncedSearch = useDebounce(searchTerm, 350);
  const { allowedBranches } = useAcademicBranches(assignedLibrary || libraryCode);

  // Add Copy Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [booksList, setBooksList] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [barcode, setBarcode] = useState('');
  const [rackLocation, setRackLocation] = useState('General Rack');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Fetch filter options on mount
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

  // Fetch initial chunk on filter changes
  const fetchInitialInventory = async () => {
    setLoading(true);
    setPage(1);
    try {
      const params = {
        search: debouncedSearch.trim() || undefined,
        branch: branchFilter || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        page: 1,
        limit: 20
      };
      const res = await bookApi.getLibrarianInventory(params);
      if (res?.data) {
        const fetchedCopies = res.data.copies || [];
        const pag = res.data.pagination || {};
        setCopies(fetchedCopies);
        setInventoryStats(res.data.inventoryStats || {});
        setTotalCount(pag.total || 0);
        setHasMore(pag.hasMore ?? (pag.page < pag.totalPages));
      }
    } catch (e) {
      console.error('[LibrarianInventory initial fetch error]:', e);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Load next chunk on infinite scroll
  const loadMoreInventory = async () => {
    if (isFetchingRef.current || loading || loadingMore || !hasMore) return;

    isFetchingRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const params = {
        search: debouncedSearch.trim() || undefined,
        branch: branchFilter || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        page: nextPage,
        limit: 20
      };
      const res = await bookApi.getLibrarianInventory(params);
      if (res?.data) {
        const newCopies = res.data.copies || [];
        const pag = res.data.pagination || {};
        setCopies((prev) => {
          const seen = new Set(prev.map((c) => String(c._id)));
          const fresh = newCopies.filter((c) => !seen.has(String(c._id)));
          return [...prev, ...fresh];
        });
        setPage(nextPage);
        setTotalCount(pag.total || totalCount);
        setHasMore(pag.hasMore ?? (nextPage < pag.totalPages));
      }
    } catch (e) {
      console.error('[LibrarianInventory load more error]:', e);
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchInitialInventory();
  }, [debouncedSearch, branchFilter, categoryFilter, statusFilter]);

  // Infinite Scroll Sentinel Observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreInventory();
        }
      },
      { root: null, rootMargin: '200px', threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, debouncedSearch, branchFilter, categoryFilter, statusFilter]);

  const openAddCopyModal = async () => {
    setIsAddModalOpen(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await bookApi.searchBooks({ limit: 100 });
      if (res?.data?.books) {
        setBooksList(res.data.books);
        if (res.data.books.length > 0) setSelectedBookId(res.data.books[0].id || res.data.books[0]._id);
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleAddCopySubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookId || !barcode.trim()) {
      setErrorMsg('Master book selection and Barcode are required');
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await bookApi.addBookCopy({
        bookId: selectedBookId,
        barcode: barcode.trim().toUpperCase(),
        rackLocation: rackLocation.trim() || 'General Rack',
      });

      if (res?.data) {
        setSuccessMsg(`Physical book copy barcode ${res.data.barcode} registered successfully!`);
        setBarcode('');
        fetchInitialInventory();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add physical copy');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetireCopy = async (copyId, currentBarcode) => {
    const reason = window.prompt(`Enter retirement reason for physical copy ${currentBarcode}:`, 'Worn out / Damaged copy retired');
    if (!reason) return;

    try {
      await bookApi.retireBookCopy(copyId, reason);
      fetchInitialInventory();
    } catch (err) {
      alert(err.message || 'Failed to retire book copy');
    }
  };

  const stats = inventoryStats || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2B232E] dark:text-[#FFF4E9] tracking-tight">Physical Book Copy Inventory</h1>
          <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD]">Manage physical copies, rack locations, and retirement in assigned library</p>
        </div>
        <Button onClick={openAddCopyModal} className="bg-[#8D6B94] hover:bg-[#B185A7] text-[#FFF4E9] font-bold">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Physical Book Copy
        </Button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-[#211C26] p-3 rounded-xl border border-[#E8DBC5] dark:border-[#3B3142] text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#7A697E] dark:text-[#B8A6BD] block">Total Copies</span>
          <strong className="text-lg font-extrabold text-[#2B232E] dark:text-[#FFF4E9]">{stats.totalCopies || 0}</strong>
        </div>
        <div className="bg-white dark:bg-[#211C26] p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Available</span>
          <strong className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">{stats.available || 0}</strong>
        </div>
        <div className="bg-white dark:bg-[#211C26] p-3 rounded-xl border border-[#8D6B94]/30 text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#8D6B94] dark:text-[#B185A7] block">Issued</span>
          <strong className="text-lg font-extrabold text-[#8D6B94] dark:text-[#B185A7]">{stats.issued || 0}</strong>
        </div>
        <div className="bg-white dark:bg-[#211C26] p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Damaged</span>
          <strong className="text-lg font-extrabold text-amber-700 dark:text-amber-300">{stats.damaged || 0}</strong>
        </div>
        <div className="bg-white dark:bg-[#211C26] p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">Lost</span>
          <strong className="text-lg font-extrabold text-rose-700 dark:text-rose-300">{stats.lost || 0}</strong>
        </div>
        <div className="bg-white dark:bg-[#211C26] p-3 rounded-xl border border-[#E8DBC5] dark:border-[#3B3142] text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#7A697E] dark:text-[#B8A6BD] block">Retired</span>
          <strong className="text-lg font-extrabold text-[#7A697E] dark:text-[#B8A6BD]">{stats.retired || 0}</strong>
        </div>
      </div>

      {/* Filter Bar with all 4 Discovery Filters (Part 9) */}
      <Card className="p-4 border-[#E8DBC5] dark:border-[#3B3142] bg-white dark:bg-[#211C26]">
        <div className="space-y-3">
          {/* Search by Book ID, Title, Author, ISBN */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8D6B94]" />
            <Input
              placeholder="Search by Book ID, Title, Author, ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-xs sm:text-sm rounded-xl border-[#E8DBC5] dark:border-[#3B3142]"
            />
          </div>

          {/* Academic Branches, Categories, Copy Statuses */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="text-xs rounded-xl"
            >
              <option value="">All Academic Branches</option>
              {allowedBranches.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </Select>

            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs rounded-xl"
            >
              <option value="">All Categories</option>
              {filterOptions.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-xl"
            >
              <option value="">All Copy Statuses</option>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="ISSUED">ISSUED</option>
              <option value="DAMAGED">DAMAGED</option>
              <option value="LOST">LOST</option>
              <option value="RETIRED">RETIRED</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card className="border-[#E8DBC5] dark:border-[#3B3142] bg-white dark:bg-[#211C26]">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-bold text-[#2B232E] dark:text-[#FFF4E9]">
            Physical Copies Directory ({copies.length} of {totalCount})
          </CardTitle>
          <span className="text-xs text-[#7A697E] dark:text-[#B8A6BD]">
            Continuous Infinite Scroll
          </span>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : copies.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No Copies Found"
              description="No physical copies match the specified search query or filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#E8DBC5] dark:border-[#3B3142]">
                    <TableHead className="font-bold text-[#8D6B94] dark:text-[#B185A7] text-xs">Book ID</TableHead>
                    <TableHead className="font-bold text-[#8D6B94] dark:text-[#B185A7] text-xs">Copy ID / Number</TableHead>
                    <TableHead className="font-bold text-[#8D6B94] dark:text-[#B185A7] text-xs">Book Title</TableHead>
                    <TableHead className="font-bold text-[#8D6B94] dark:text-[#B185A7] text-xs">Author</TableHead>
                    <TableHead className="font-bold text-[#8D6B94] dark:text-[#B185A7] text-xs">Library</TableHead>
                    <TableHead className="font-bold text-[#8D6B94] dark:text-[#B185A7] text-xs">Rack Location</TableHead>
                    <TableHead className="font-bold text-[#8D6B94] dark:text-[#B185A7] text-xs">Status</TableHead>
                    <TableHead className="font-bold text-[#8D6B94] dark:text-[#B185A7] text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-[#E8DBC5]/60 dark:divide-[#3B3142]">
                  {copies.map((copy) => (
                    <TableRow key={copy._id} className="hover:bg-[#FFF4E9]/50 dark:hover:bg-[#2D2534] transition-colors">
                      <TableCell className="font-mono font-bold text-xs text-[#8D6B94] dark:text-[#B185A7]">
                        <span className="truncate block max-w-[120px]" title={copy.book?._id || copy.book?.id || ''}>
                          {copy.book?._id || copy.book?.id || 'N/A'}
                        </span>
                        {copy.book?.callNo && (
                          <span className="text-[10px] text-[#7A697E] dark:text-[#B8A6BD] font-normal block">
                            Call No: {copy.book.callNo}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                          {copy.barcode}
                        </span>
                        {copy.copyNumber && (
                          <span className="text-[10px] text-[#7A697E] dark:text-[#B8A6BD] block font-mono">
                            Copy #{copy.copyNumber}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-xs text-[#2B232E] dark:text-[#FFF4E9]">
                          {copy.book?.title || 'Master Book'}
                        </div>
                        <div className="text-[10px] text-[#7A697E] dark:text-[#B8A6BD]">
                          {copy.book?.category || 'General'} • {copy.book?.branch || 'GENERAL'}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-[#2B232E] dark:text-[#FFF4E9]">
                        {copy.book?.author || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-[#7A697E] dark:text-[#B8A6BD]">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-[#8D6B94] dark:text-[#B185A7] shrink-0" />
                          <span>{copy.library?.name || copy.library?.code || 'KIET Library'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-[#7A697E] dark:text-[#B8A6BD]">
                        {copy.rackLocation || 'General Rack'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            copy.status === 'AVAILABLE'
                              ? 'success'
                              : copy.status === 'ISSUED'
                              ? 'info'
                              : copy.isRetired || copy.status === 'RETIRED'
                              ? 'secondary'
                              : 'danger'
                          }
                          className="text-[10px] font-bold"
                        >
                          {copy.isRetired ? 'RETIRED' : copy.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {!copy.isRetired && copy.status !== 'ISSUED' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRetireCopy(copy._id, copy.barcode)}
                            className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs h-7 px-2"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Retire
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Infinite Scroll Sentinel and Status Indicators */}
          <div ref={sentinelRef} className="h-6" />

          {loadingMore && (
            <div className="py-4 flex items-center justify-center space-x-2 text-xs text-[#8D6B94] dark:text-[#B185A7] font-semibold">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading more physical copies...</span>
            </div>
          )}

          {!hasMore && copies.length > 0 && !loading && (
            <div className="py-4 text-center text-xs text-[#7A697E] dark:text-[#B8A6BD] border-t border-[#E8DBC5]/40 font-medium">
              All results loaded ({copies.length} of {totalCount} copies)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Copy Dialog Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register New Physical Copy</DialogTitle>
            <DialogDescription className="text-xs">
              Assign a unique barcode tag to add a new physical copy to your assigned library.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddCopySubmit} className="space-y-4 pt-2">
            {errorMsg && (
              <Alert variant="destructive" className="text-xs">
                {errorMsg}
              </Alert>
            )}

            {successMsg && (
              <Alert variant="success" className="text-xs">
                {successMsg}
              </Alert>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Master Book Catalog *</label>
              <Select value={selectedBookId} onChange={(e) => setSelectedBookId(e.target.value)} required>
                {booksList.map((b) => (
                  <option key={b.id || b._id} value={b.id || b._id}>
                    {b.title} [ID: {b.id || b._id}] (ISBN: {b.isbn || 'N/A'})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unique Barcode / Accession Tag *</label>
              <Input
                placeholder="e.g. KM-AIML-01-4"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="font-mono uppercase font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rack Location</label>
              <Input
                placeholder="e.g. AIML-RACK-1"
                value={rackLocation}
                onChange={(e) => setRackLocation(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Done / Close
              </Button>
              <Button type="submit" isLoading={actionLoading} className="bg-[#8D6B94] hover:bg-[#B185A7] text-[#FFF4E9] font-bold">
                <Plus className="w-4 h-4 mr-1" /> Add Copy
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
