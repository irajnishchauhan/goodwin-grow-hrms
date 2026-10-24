'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  CreditCard,
  AlertTriangle,
  Check,
  ExternalLink
} from 'lucide-react';
import { AppNotification } from '@/lib/types';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';

interface NotificationDropdownProps {
  tenantSlug: string;
}

export default function NotificationDropdown({ tenantSlug }: NotificationDropdownProps) {
  const { user } = useCurrentUser(tenantSlug);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const emailParam = user?.email ? `&email=${encodeURIComponent(user.email)}` : '';
      const res = await fetch(`/api/tenants/${tenantSlug}/notifications?t=${Date.now()}${emailParam}`, {
        cache: 'no-store'
      });
      const json = await res.json();
      if (json.success && json.data) {
        setNotifications(json.data.notifications || []);
        setUnreadCount(json.data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (!user?.email) return;

    fetchNotifications();

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, 45000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [tenantSlug, user?.email]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/tenants/${tenantSlug}/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await fetch(`/api/tenants/${tenantSlug}/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true, employeeId: user?.email })
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'LEAVE_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'LEAVE_REJECTED':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'LEAVE_SUBMITTED':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'REGULARIZATION_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'REGULARIZATION_REJECTED':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'REGULARIZATION_SUBMITTED':
        return <Clock className="w-4 h-4 text-purple-600" />;
      case 'SALARY_PAID':
        return <CreditCard className="w-4 h-4 text-amber-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ', ' +
        date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        title="Notifications & Updates"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden text-slate-900 animate-fade-in">
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">All caught up!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No new leave or missed-punch alerts.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                  className={`p-3.5 transition-colors hover:bg-slate-50 cursor-pointer ${
                    !notif.isRead ? 'bg-emerald-50/40 border-l-3 border-emerald-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-xs mt-0.5 shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed line-clamp-3">
                        {notif.message}
                      </p>
                      {notif.linkUrl && (
                        <Link
                          href={notif.linkUrl}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:underline mt-1.5"
                        >
                          <span>View Details</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400">
            Goodwin Grow Instant Alerts • Leave & Biometric Sync
          </div>
        </div>
      )}
    </div>
  );
}
