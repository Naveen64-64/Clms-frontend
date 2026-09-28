import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
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
import { UserCheck, UserPlus, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const LibrarianManagement = () => {
  const [librarians, setLibrarians] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Staff Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [assignedLibraryId, setAssignedLibraryId] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [libnRes, libsRes] = await Promise.allSettled([
        adminApi.getLibrarians(),
        libraryApi.getAllLibraries(),
      ]);

      if (libnRes.status === 'fulfilled' && libnRes.value?.data) setLibrarians(libnRes.value.data);
      if (libsRes.status === 'fulfilled') {
        const rawLibs = libsRes.value?.data;
        const libList = Array.isArray(rawLibs) ? rawLibs : rawLibs?.data || [];
        setLibraries(libList);
        if (libList.length > 0 && !assignedLibraryId) {
          const firstId = libList[0]._id || libList[0].id || libList[0].code;
          setAssignedLibraryId(firstId);
        }
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setName('');
    setEmail('');
    setPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !assignedLibraryId) {
      setErrorMsg('All fields (Name, Email, Password, Assigned Library) are required');
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);

    try {
      await adminApi.createLibrarian({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        assignedLibraryId,
      });

      setSuccessMsg(`Librarian ${name} created successfully!`);
      setName('');
      setEmail('');
      setPassword('');
      fetchData();
      setIsModalOpen(false);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create librarian account');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Librarian Staff Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Create staff user accounts and assign mandatory library isolation scope</p>
        </div>
        <Button onClick={openCreateModal} className="bg-[#8D6B94] hover:bg-[#795B80]">
          <UserPlus className="w-4 h-4 mr-1.5" /> Register Librarian Account
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Active Staff Accounts ({librarians.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Email Login</TableHead>
                  <TableHead>Assigned Library</TableHead>
                  <TableHead>Library Code</TableHead>
                  <TableHead>Account Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {librarians.map((item) => (
                  <TableRow key={item.profileId || item._id}>
                    <TableCell className="font-bold text-slate-900 dark:text-white">{item.name}</TableCell>
                    <TableCell className="font-mono text-xs">{item.email}</TableCell>
                    <TableCell className="font-semibold text-slate-800 dark:text-slate-200">{item.assignedLibrary?.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-bold text-[#8D6B94] dark:text-[#B185A7]">
                        {item.assignedLibrary?.code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'success' : 'danger'}>
                        {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register Librarian Staff</DialogTitle>
            <DialogDescription className="text-xs">
              Every librarian user MUST be assigned to exactly one target library for mandatory service isolation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {errorMsg && <Alert variant="destructive">{errorMsg}</Alert>}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Full Name *</label>
              <Input placeholder="e.g. Ramesh Kumar" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Email Login *</label>
              <Input
                type="email"
                placeholder="e.g. lib_main@kiet.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Assigned Target Library *</label>
              <Select value={assignedLibraryId} onChange={(e) => setAssignedLibraryId(e.target.value)} required>
                {libraries.map((lib) => {
                  const val = lib._id || lib.id || lib.code;
                  return (
                    <option key={val} value={val}>
                      {lib.name} ({lib.code})
                    </option>
                  );
                })}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Account Password *</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={actionLoading}>
                Create Staff Account
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
