import React, { useState, useEffect } from 'react';
import { reportApi } from '../../api/reportApi';
import { StatCard } from '../../components/common/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { ComparisonBarChart } from '../../components/charts/LibraryCharts';
import {
  Building2,
  Users,
  DollarSign,
  Settings,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, compRes] = await Promise.allSettled([
        reportApi.getDashboard(),
        reportApi.getLibraryComparison(),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value) {
        const raw = dashRes.value.data || dashRes.value;
        setSummary(raw.summary || raw);
      }
      if (compRes.status === 'fulfilled' && compRes.value) {
        const raw = compRes.value.data || compRes.value;
        setComparison(raw.libraries || raw.comparison || (Array.isArray(raw) ? raw : []));
      }
    } catch (e) {
      console.error('[AdminDashboard error]:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Administration Dashboard</h1>
            <Badge variant="danger" className="text-xs px-2.5 py-0.5">
              SUPERUSER ADMIN
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Centralized system oversight, multi-library comparison, and global operations</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/librarians">
            <Button size="sm" variant="default" className="gap-1.5 bg-[#8D6B94] hover:bg-[#795B80] cursor-pointer">
              <UserCheck className="w-4 h-4" />
              Manage Staff
            </Button>
          </Link>
          <Link to="/admin/settings">
            <Button size="sm" variant="outline" className="gap-1.5 cursor-pointer">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Operational Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Libraries"
          value={loading ? '...' : summary?.totalLibraries ?? 3}
          icon={Building2}
          description="KIET Main, KIET 2, KIET Women"
          color="indigo"
          to="/admin/libraries"
          actionHint="Manage Libraries"
        />
        <StatCard
          title="Registered Students"
          value={loading ? '...' : summary?.totalStudents ?? 0}
          icon={Users}
          description="Active student profiles"
          color="sky"
          to="/admin/users?type=STUDENT"
          actionHint="User Directory → Students"
        />
        <StatCard
          title="Fines Collected"
          value={loading ? '...' : `₹${summary?.totalFinesCollected ?? 0}`}
          icon={DollarSign}
          description="Total collected fine"
          color="amber"
          to="/admin/fines?tab=history"
          actionHint="Fine records / reports"
        />
      </div>

      {/* Multi-Library Overview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Multi-Library Holdings & Occupancy Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-72 w-full rounded-lg" />
          ) : Array.isArray(comparison) && comparison.length > 0 ? (
            <ComparisonBarChart
              data={comparison}
              xKey="code"
              bars={[
                { key: 'totalCopies', name: 'Total Copies', color: '#4f46e5' },
                { key: 'availableCopies', name: 'Available Copies', color: '#10b981' },
                { key: 'currentOccupancy', name: 'Active Occupancy', color: '#f59e0b' },
              ]}
            />
          ) : (
            <div className="h-72 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
              No multi-library comparison data available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
