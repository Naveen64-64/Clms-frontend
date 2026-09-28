import React, { useState, useEffect } from 'react';
import { notificationApi } from '../../api/notificationApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { Bell, CheckCheck, CheckCircle2 } from 'lucide-react';

export const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getNotifications();
      if (res?.data) setNotifications(res.data);
    } catch (e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      // Ignore
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (e) {
      // Ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2B232E] dark:text-[#FFF4E9] tracking-tight">Notification Center</h1>
          <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD]">System alerts, book due date reminders, and clearance notifications</p>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 mr-1.5 text-[#8D6B94] dark:text-[#B185A7]" />
            Mark All Read ({unreadCount})
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-[#2B232E] dark:text-[#FFF4E9]">System Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No Notifications"
              description="Your notification center is completely up to date."
            />
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && handleMarkRead(n._id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    n.isRead
                      ? 'bg-white dark:bg-[#211C26] border-[#E8DBC5] dark:border-[#3B3142]'
                      : 'bg-[#E8DBC5]/40 dark:bg-[#8D6B94]/20 border-[#C3A29E] dark:border-[#3B3142] shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-[#2B232E] dark:text-[#FFF4E9]">{n.title || n.type}</span>
                      {!n.isRead && <Badge variant="danger">NEW</Badge>}
                    </div>
                    <span className="text-xs text-[#7A697E] dark:text-[#B8A6BD]">
                      {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-[#7A697E] dark:text-[#B8A6BD] leading-relaxed">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
