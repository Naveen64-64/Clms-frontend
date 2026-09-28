import React, { useState, useEffect } from 'react';
import { libraryApi } from '../../api/libraryApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/Skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/Dialog';
import { Building2, Plus, Edit, CheckCircle2, ShieldAlert } from 'lucide-react';

export const LibraryManagement = () => {
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editLibrary, setEditLibrary] = useState(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [capacity, setCapacity] = useState('100');
  const [isWomenOnly, setIsWomenOnly] = useState(false);
  const [location, setLocation] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchLibraries = async () => {
    setLoading(true);
    try {
      const res = await libraryApi.getAllLibraries();
      if (res?.data) setLibraries(res.data);
    } catch (e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraries();
  }, []);

  const openCreateModal = () => {
    setEditLibrary(null);
    setName('');
    setCode('');
    setCapacity('100');
    setIsWomenOnly(false);
    setLocation('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (lib) => {
    setEditLibrary(lib);
    setName(lib.name);
    setCode(lib.code);
    setCapacity(lib.capacity.toString());
    setIsWomenOnly(lib.isWomenOnly);
    setLocation(lib.location || '');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !capacity) {
      setErrorMsg('Library Name, Code, and Capacity are required');
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        capacity: parseInt(capacity, 10),
        isWomenOnly,
        location: location.trim() || undefined,
      };

      if (editLibrary) {
        await libraryApi.updateLibrary(editLibrary._id, payload);
        setSuccessMsg(`Library ${payload.name} updated successfully!`);
      } else {
        await libraryApi.createLibrary(payload);
        setSuccessMsg(`Library ${payload.name} created successfully!`);
      }
      fetchLibraries();
      setIsModalOpen(false);
    } catch (err) {
      setErrorMsg(err.message || 'Library operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Institution Libraries</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure library locations, seat capacities, and access rules</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-1.5" /> Create New Library
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Configured Libraries ({libraries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Library Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Current Occupancy</TableHead>
                  <TableHead>Available Seats</TableHead>
                  <TableHead>Access Policy</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {libraries.map((lib) => {
                  const active = lib.activeVisits || 0;
                  const free = Math.max(0, lib.capacity - active);

                  return (
                    <TableRow key={lib._id}>
                      <TableCell className="font-bold text-slate-900 dark:text-white">{lib.name}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-[#8D6B94] dark:text-[#B185A7]">{lib.code}</TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-white">{lib.capacity} Seats</TableCell>
                      <TableCell className="text-slate-700 dark:text-slate-300">{active} Visitors</TableCell>
                      <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">{free} Free</TableCell>
                      <TableCell>
                        <Badge variant={lib.isWomenOnly ? 'danger' : 'default'}>
                          {lib.isWomenOnly ? "Women's Only" : 'Co-Ed Access'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => openEditModal(lib)}>
                          <Edit className="w-4 h-4 mr-1 text-slate-600 dark:text-slate-400" /> Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editLibrary ? 'Update Library Location' : 'Create New Library'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {errorMsg && <Alert variant="destructive">{errorMsg}</Alert>}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Library Name *</label>
              <Input placeholder="e.g. KIET Main Library" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Library Code *</label>
              <Input
                placeholder="e.g. KIET_MAIN"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono uppercase font-bold"
                disabled={!!editLibrary}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Seat Capacity *</label>
              <Input type="number" placeholder="100" value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Access Policy</label>
              <Select value={isWomenOnly ? 'true' : 'false'} onChange={(e) => setIsWomenOnly(e.target.value === 'true')}>
                <option value="false">Co-Ed Access (Male & Female Students)</option>
                <option value="true">Women's Only (Female Students ONLY - Male 403 Blocked)</option>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={actionLoading}>
                Save Library
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
