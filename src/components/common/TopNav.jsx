import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, Bell, LogOut, CheckCheck, RefreshCw, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../api/notificationApi';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Logo } from './Logo';
import { cn, formatRollNumber } from '../../lib/utils';

export const TopNav = ({ onToggleSidebar, sidebarOpen = false, isSidebarOpen = false }) => {
  const isNavOpen = sidebarOpen || isSidebarOpen;
  const { user, role, librarianProfile, logout, getDashboardRoute } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpenNotif, setIsOpenNotif] = useState(false);
  const [loadingNotif, setLoadingNotif] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      if (res?.data !== undefined) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (e) {
      // Ignore
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotif(true);
    try {
      const res = await notificationApi.getNotifications();
      if (res?.data) {
        setNotifications(res.data);
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoadingNotif(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleNotif = () => {
    const nextState = !isOpenNotif;
    setIsOpenNotif(nextState);
    if (nextState) {
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      // Ignore
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      // Ignore
    }
  };

  const dashboardPath = getDashboardRoute ? getDashboardRoute() : '/';

  return (
    <header className="sticky top-0 z-30 shrink-0 flex h-16 w-full items-center justify-between border-b border-[#E8DBC5] dark:border-[rgba(255,244,233,0.08)] bg-white/95 dark:bg-[#251E27]/95 backdrop-blur-md px-3 sm:px-6">
      {/* ☰ Hamburger Trigger (FAR LEFT) + Permanent KDL Logo & Branding */}
      <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
        {!isNavOpen && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 text-[#8D6B94] dark:text-[#B185A7] hover:text-[#2B232E] dark:hover:text-white rounded-xl hover:bg-[#FFF4E9] dark:hover:bg-[#302731] transition-colors focus:outline-none cursor-pointer border border-[#E8DBC5]/80 dark:border-[#3B3142] shrink-0"
            title="Toggle Navigation Sidebar"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <NavLink to={dashboardPath} aria-label="KDL Portal Dashboard" className="flex items-center min-w-0">
          <Logo
            size="md"
            className="max-w-[180px] xs:max-w-none"
            subtitle={role === 'ADMIN' ? 'Admin Superuser' : role === 'LIBRARIAN' ? 'Staff Portal' : role === 'FACULTY' ? 'Faculty Portal' : 'KIET DIGITAL LIBRARY'}
          />
        </NavLink>
      </div>

      {/* Right Action Icons (Theme, Notifications, Profile, Logout) */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        <ThemeSwitcher />

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={handleToggleNotif}
            className="relative p-2 text-[#7A697E] dark:text-[#D1C2D4] hover:text-[#8D6B94] dark:hover:text-[#B185A7] hover:bg-[#FFF4E9] dark:hover:bg-[#302731] rounded-lg transition-colors focus:outline-none cursor-pointer"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#8D6B94] text-[10px] font-bold text-[#FFF4E9] shadow-2xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Menu Panel */}
          {isOpenNotif && (
            <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100vw-1rem)] max-w-sm sm:w-96 rounded-xl border border-[#E8DBC5] dark:border-[rgba(255,244,233,0.1)] bg-white dark:bg-[#302731] shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[#E8DBC5]/60 dark:border-[rgba(255,244,233,0.08)] bg-[#FFF4E9]/60 dark:bg-[#2A222B]">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-sm text-[#2B232E] dark:text-[#FFF4E9]">Notifications</h4>
                  {unreadCount > 0 && <Badge variant="important">{unreadCount} Unread</Badge>}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-medium text-[#8D6B94] dark:text-[#B185A7] hover:text-[#795B80] dark:hover:text-white flex items-center cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5 mr-1" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#E8DBC5]/60 dark:divide-[rgba(255,244,233,0.08)]">
                {loadingNotif ? (
                  <div className="p-6 text-center text-xs text-[#7A697E] dark:text-[#D1C2D4] flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#8D6B94] dark:text-[#B185A7]" />
                    <span>Loading notifications...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#7A697E] dark:text-[#D1C2D4]">No notifications available</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => !n.isRead && handleMarkRead(n._id)}
                      className={`p-3.5 text-xs transition-colors cursor-pointer ${
                        n.isRead
                          ? 'bg-white dark:bg-[#302731] hover:bg-[#FFF4E9]/60 dark:hover:bg-[#302731]/70'
                          : 'bg-[#E8DBC5]/40 dark:bg-[#8D6B94]/20 hover:bg-[#E8DBC5]/60 dark:hover:bg-[#8D6B94]/30 border-l-2 border-[#8D6B94] dark:border-[#B185A7]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[#2B232E] dark:text-[#FFF4E9]">{n.title || n.type}</span>
                        <span className="text-[10px] text-[#7A697E] dark:text-[#D1C2D4]">
                          {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-[#7A697E] dark:text-[#D1C2D4] leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Info & Logout */}
        <div className="flex items-center space-x-2.5 border-l border-[#E8DBC5] dark:border-[rgba(255,244,233,0.1)] pl-3">
          <div className="w-8 h-8 rounded-full bg-[#8D6B94]/15 border border-[#8D6B94]/30 text-[#8D6B94] dark:text-[#B185A7] flex items-center justify-center font-bold text-xs shrink-0">
            <UserRound className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold font-mono text-[#2B232E] dark:text-[#FFF4E9] truncate max-w-[130px] uppercase">
              {role === 'STUDENT'
                ? formatRollNumber(user?.studentProfile?.rollNumber || user?.username)
                : user?.username || 'User'}
            </p>
            <p className="text-[10px] font-semibold text-[#8D6B94] dark:text-[#B185A7] uppercase tracking-wider">
              {role}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={logout} className="text-[#7A697E] dark:text-[#D1C2D4] hover:text-[#8D6B94] hover:bg-[#FFF4E9] dark:hover:bg-[#302731] cursor-pointer" title="Log out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
