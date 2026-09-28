import React, { useState, useEffect } from 'react';
import { bookApi } from '../../api/bookApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '../../components/ui/Dialog';
import { Alert } from '../../components/ui/Alert';
import { Search, Plus, Upload, BookOpen, Layers, Archive, AlertCircle, CheckCircle } from 'lucide-react';

export default function MasterBooksCatalog() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    category: 'Computer Science',
    subcategory: 'General',
    edition: '1st',
    publicationYear: 2024,
    description: ''
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    bookApi
      .getCategories()
      .then((res) => {
        if (res?.data && Array.isArray(res.data)) {
          setCategories(res.data);
        }
      })
      .catch((err) => console.error('Failed to load categories', err));
  }, []);

  useEffect(() => {
    fetchMasterBooks();
  }, [search, category, page]);

  const fetchMasterBooks = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) {
        params.search = search;
        params.q = search;
      }
      if (category) params.category = category;

      const res = await bookApi.searchBooks(params);
      if (res.data?.success) {
        setBooks(res.data.data.books || res.data.data);
        setTotalPages(res.data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch master catalog', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlertMsg(null);
    try {
      const res = await bookApi.createBook(formData);
      if (res.data?.success) {
        setAlertMsg({ type: 'success', text: 'Master book catalog created successfully!' });
        setIsCreateOpen(false);
        setFormData({
          title: '', author: '', isbn: '', publisher: '', category: 'Computer Science',
          subcategory: 'General', edition: '1st', publicationYear: 2024, description: ''
        });
        fetchMasterBooks();
      }
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create master book.' });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async () => {
    setImporting(true);
    setAlertMsg(null);
    try {
      const res = await bookApi.importBooks({});
      if (res.data?.success) {
        setAlertMsg({ type: 'success', text: `Bulk import completed! ${res.data.data?.inserted || 'Books'} records cataloged.` });
        fetchMasterBooks();
      }
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.response?.data?.message || 'Bulk import failed.' });
    } finally {
      setImporting(false);
    }
  };

  const handleRetire = async (bookId) => {
    if (!window.confirm('Are you sure you want to retire this master book?')) return;
    try {
      const res = await bookApi.retireBook(bookId, 'Admin Master Catalog Retirement');
      if (res.data?.success) {
        setAlertMsg({ type: 'success', text: 'Master book retired.' });
        fetchMasterBooks();
      }
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.response?.data?.message || 'Failed to retire book.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Master Books Catalog</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Global catalog of all book titles registered across the institution.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleBulkImport} loading={importing} className="gap-2">
            <Upload className="w-4 h-4" /> Seed / Bulk Import
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-[#8D6B94] text-white">
            <Plus className="w-4 h-4" /> Add Master Book
          </Button>
        </div>
      </div>

      {alertMsg && (
        <Alert variant={alertMsg.type === 'error' ? 'danger' : 'success'}>
          {alertMsg.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <span>{alertMsg.text}</span>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Catalog Titles</CardTitle>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by Book ID, title, author, ISBN..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>

              <Select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="w-44"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book ID</TableHead>
                <TableHead>Book Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>ISBN</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Edition</TableHead>
                <TableHead>Copies</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500 dark:text-slate-400">Loading catalog titles...</TableCell>
                </TableRow>
              ) : books.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500 dark:text-slate-400">No books found in catalog.</TableCell>
                </TableRow>
              ) : (
                books.map((b) => (
                  <TableRow key={b._id}>
                    <TableCell className="font-mono text-xs font-bold text-[#8D6B94] dark:text-[#B185A7] select-all">
                      <span className="truncate block max-w-[110px]" title={b._id}>
                        {b._id}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#8D6B94] dark:text-[#B185A7] shrink-0" />
                        <span>{b.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{b.author}</TableCell>
                    <TableCell className="font-mono text-xs">{b.isbn}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{b.category || 'General'}</Badge>
                    </TableCell>
                    <TableCell>{b.edition || '1st'}</TableCell>
                    <TableCell className="font-semibold">{b.totalCopiesCount || b.copiesCount || 0}</TableCell>
                    <TableCell>
                      {b.isRetired ? (
                        <Badge variant="danger">Retired</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!b.isRetired && (
                        <Button variant="ghost" size="sm" onClick={() => handleRetire(b._id)} className="text-rose-600 dark:text-rose-400 hover:text-rose-700">
                          <Archive className="w-3.5 h-3.5 mr-1" /> Retire
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Master Book Modal */}
      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <DialogHeader>
          <DialogTitle>Add New Master Book Title</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateBook}>
          <DialogContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Book Title *</label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Introduction to Algorithms"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Author *</label>
                <Input
                  required
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="e.g. Thomas H. Cormen"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">ISBN *</label>
                <Input
                  required
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  placeholder="e.g. 9780262033848"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Publisher</label>
                <Input
                  value={formData.publisher}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  placeholder="e.g. MIT Press"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category *</label>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Electronics & Communication">Electronics & Comm.</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Mathematics & Science">Maths & Science</option>
                  <option value="Humanities">Humanities</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Edition</label>
                <Input
                  value={formData.edition}
                  onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                  placeholder="e.g. 3rd Edition"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Publication Year</label>
                <Input
                  type="number"
                  value={formData.publicationYear}
                  onChange={(e) => setFormData({ ...formData, publicationYear: parseInt(e.target.value) || 2024 })}
                  className="mt-1"
                />
              </div>
            </div>
          </DialogContent>

          <DialogFooter>
            <Button variant="ghost" type="button" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={loading} className="bg-cyan-600 text-white">Save Master Book</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
