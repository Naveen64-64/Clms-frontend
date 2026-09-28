import React, { useState, useEffect, useRef } from 'react';
import { userApi } from '../../api/userApi';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Search, Users, Eye, GraduationCap, Briefcase, UserPlus, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const UserDirectory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isBaseAdmin = location.pathname.startsWith('/admin');
  const detailsBasePath = isBaseAdmin ? '/admin/users/details' : '/librarian/users/details';
  const registerPath = isBaseAdmin ? '/admin/users/register' : '/librarian/users/register';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type') || params.get('tab') || (location.pathname.endsWith('/students') ? 'STUDENT' : null);
    if (typeParam && ['ALL', 'STUDENT', 'FACULTY'].includes(typeParam.toUpperCase())) {
      return typeParam.toUpperCase();
    }
    return 'ALL';
  }); // 'ALL', 'STUDENT', 'FACULTY'
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type') || params.get('tab') || (location.pathname.endsWith('/students') ? 'STUDENT' : null);
    if (typeParam && ['ALL', 'STUDENT', 'FACULTY'].includes(typeParam.toUpperCase())) {
      setActiveTab(typeParam.toUpperCase());
    }
  }, [location.search, location.pathname]);

  const sentinelRef = useRef(null);
  const isFetchingRef = useRef(false);

  const fetchInitialUsers = async () => {
    setLoading(true);
    setError(null);
    setPage(1);
    try {
      const res = await userApi.getUsers({
        userType: activeTab,
        search: searchQuery.trim() || undefined,
        page: 1,
        limit: 20,
      });
      if (res?.data) {
        const userList = res.data.users || [];
        const pag = res.data.pagination || {};
        setUsers(userList);
        setTotalCount(pag.total || 0);
        setHasMore(pag.page < pag.totalPages);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch user directory');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreUsers = async () => {
    if (isFetchingRef.current || loading || loadingMore || !hasMore) return;

    isFetchingRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const res = await userApi.getUsers({
        userType: activeTab,
        search: searchQuery.trim() || undefined,
        page: nextPage,
        limit: 20,
      });
      if (res?.data) {
        const newUsers = res.data.users || [];
        const pag = res.data.pagination || {};
        setUsers((prev) => {
          const seen = new Set(prev.map((u) => String(u.id)));
          const fresh = newUsers.filter((u) => !seen.has(String(u.id)));
          return [...prev, ...fresh];
        });
        setPage(nextPage);
        setTotalCount(pag.total || totalCount);
        setHasMore(nextPage < pag.totalPages);
      }
    } catch (err) {
      console.error('[UserDirectory load more error]:', err);
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchInitialUsers();
  }, [activeTab]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreUsers();
        }
      },
      { root: null, rootMargin: '200px', threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, activeTab, searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInitialUsers();
  };


  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8DBC5] dark:border-[rgba(255,244,233,0.1)] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-[#8D6B94] dark:text-[#B185A7]" />
            <h1 className="text-2xl font-extrabold text-[#2B232E] dark:text-[#FFF4E9] tracking-tight">USER DIRECTORY</h1>
          </div>
          <p className="text-xs text-[#7A697E] dark:text-[#D1C2D4] mt-0.5">
            Search and manage registered students and faculty across all library systems.
          </p>
        </div>

        <Button
          onClick={() => navigate(registerPath)}
          className="text-xs font-bold gap-1.5 shadow-sm rounded-xl"
        >
          <UserPlus className="w-4 h-4" />
          Register New User
        </Button>
      </div>

      {/* Main Card */}
      <Card className="shadow-md border-[#E8DBC5] dark:border-[rgba(255,244,233,0.1)] bg-white dark:bg-[#251E27] rounded-2xl overflow-hidden">
        <CardHeader className="bg-[#FFF4E9]/60 dark:bg-[#302731] border-b border-[#E8DBC5] dark:border-[rgba(255,244,233,0.1)] pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 bg-[#E8DBC5]/40 dark:bg-[#2A222B] p-1 rounded-xl border border-[#E8DBC5]/60 dark:border-[rgba(255,244,233,0.08)]">
              <button
                onClick={() => {
                  setActiveTab('ALL');
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'ALL'
                    ? 'bg-[#8D6B94] text-[#FFF4E9] shadow-xs'
                    : 'text-[#7A697E] dark:text-[#D1C2D4] hover:text-[#2B232E] dark:hover:text-white'
                }`}
              >
                All Users
              </button>

              <button
                onClick={() => {
                  setActiveTab('STUDENT');
                  setPage(1);
                }}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'STUDENT'
                    ? 'bg-[#8D6B94] text-[#FFF4E9] shadow-xs'
                    : 'text-[#7A697E] dark:text-[#D1C2D4] hover:text-[#2B232E] dark:hover:text-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Students</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('FACULTY');
                  setPage(1);
                }}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'FACULTY'
                    ? 'bg-[#8D6B94] text-[#FFF4E9] shadow-xs'
                    : 'text-[#7A697E] dark:text-[#D1C2D4] hover:text-[#2B232E] dark:hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Faculty</span>
              </button>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7A697E] dark:text-[#D1C2D4]" />
                <Input
                  type="text"
                  placeholder="Roll No, Faculty ID, Name, Email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs w-64 bg-white dark:bg-[#251E27] border-[#E8DBC5] dark:border-[rgba(255,244,233,0.15)] text-[#2B232E] dark:text-[#FFF4E9] rounded-xl"
                />
              </div>
              <Button type="submit" size="sm" variant="secondary" className="rounded-xl font-bold text-xs">
                Search
              </Button>
            </form>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <div className="p-4 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-[#7A697E] dark:text-[#D1C2D4] text-xs font-semibold">
              Loading user directory...
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-[#7A697E] dark:text-[#D1C2D4] text-xs font-semibold">
              No users found matching the search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8DBC5] dark:border-[rgba(255,244,233,0.1)] bg-[#FFF4E9]/40 dark:bg-[#2A222B] text-[11px] font-extrabold uppercase text-[#7A697E] dark:text-[#D1C2D4]">
                    <th className="py-3 px-4">TYPE</th>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">NAME</th>
                    <th className="py-3 px-4">DEPARTMENT / ROLE</th>
                    <th className="py-3 px-4">EMAIL</th>
                    <th className="py-3 px-4">PHONE</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DBC5]/60 dark:divide-[rgba(255,244,233,0.08)] text-xs">
                  {users.map((u) => (
                    <tr
                      key={`${u.userType}-${u.id}`}
                      className="hover:bg-[#FFF4E9]/60 dark:hover:bg-[#302731]/60 transition-colors"
                    >
                      {/* TYPE INDICATORS (ONE SINGLE CIRCLE) */}
                      <td className="py-3 px-4">
                        {u.userType === 'STUDENT' ? (
                          <Badge variant="default" className="gap-1.5 px-3 py-1 font-bold text-xs">
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span>Student</span>
                          </Badge>
                        ) : (
                          <Badge variant="selected" className="gap-1.5 px-3 py-1 font-bold text-xs">
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>Faculty</span>
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-[#2B232E] dark:text-[#FFF4E9] uppercase">
                        {u.id}
                      </td>

                      <td className="py-3 px-4 font-semibold text-[#2B232E] dark:text-[#FFF4E9]">
                        {u.name}
                      </td>

                      <td className="py-3 px-4 text-[#7A697E] dark:text-[#D1C2D4]">
                        {u.department}
                      </td>

                      <td className="py-3 px-4 text-[#7A697E] dark:text-[#D1C2D4]">
                        {u.email || '—'}
                      </td>

                      <td className="py-3 px-4 text-[#7A697E] dark:text-[#D1C2D4]">
                        {u.phone || '—'}
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'}>
                          {u.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`${detailsBasePath}/${u.id}?type=${u.userType}`)}
                          className="h-8 text-xs font-semibold rounded-xl"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Infinite Scroll Sentinel and Status Indicators */}
          <div ref={sentinelRef} className="h-6" />

          {loadingMore && (
            <div className="py-4 flex items-center justify-center space-x-2 text-xs text-[#8D6B94] dark:text-[#B185A7] font-semibold">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading more users...</span>
            </div>
          )}

          {!hasMore && users.length > 0 && !loading && (
            <div className="py-4 text-center text-xs text-[#7A697E] dark:text-[#D1C2D4] border-t border-[#E8DBC5]/40 font-medium">
              All results loaded ({users.length} of {totalCount} users)
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

