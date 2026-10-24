'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Clock, Play, Square, CheckCircle2, AlertCircle, RefreshCw, Sparkles, ChevronRight } from 'lucide-react';
import { User, AttendanceRecord, Employee, Shift } from '@/lib/types';

interface KekaTopClockWidgetProps {
  tenantSlug: string;
  user: User | null;
}

export const ATTENDANCE_PUNCH_EVENT = 'hrms-attendance-punch';

export default function KekaTopClockWidget({ tenantSlug, user }: KekaTopClockWidgetProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [shift, setShift] = useState<{
    name: string;
    formattedStart: string;
    formattedEnd: string;
    graceMinutes: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [punching, setPunching] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live timer tick
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const fetchAttendanceStatus = useCallback(async () => {
    if (!user) return;
    try {
      const todayDate = getTodayDateStr();
      const [attRes, empRes] = await Promise.all([
        fetch(`/api/tenants/${tenantSlug}/attendance?date=${todayDate}&t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store' }
        }),
        fetch(`/api/tenants/${tenantSlug}/employees?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store' }
        })
      ]);

      const [attJson, empJson] = await Promise.all([
        attRes.json().catch(() => ({})),
        empRes.json().catch(() => ({}))
      ]);

      let matchedEmp: Employee | null = null;
      if (empJson.success && Array.isArray(empJson.data?.employees)) {
        const emps: Employee[] = empJson.data.employees;
        const userFirst = user.name?.toLowerCase().split(' ')[0] || '';
        matchedEmp =
          emps.find(
            (e) =>
              (user.email && e.workEmail?.toLowerCase() === user.email.toLowerCase()) ||
              (user.id && (e.userId === user.id || e.id === user.id)) ||
              (user.name && `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase()) ||
              (userFirst && e.firstName.toLowerCase() === userFirst) ||
              (user.email && user.email.toLowerCase().includes('rajnish') && e.firstName.toLowerCase().includes('rajnish'))
          ) || null;
        setEmployee(matchedEmp);
      }

      if (attJson.success) {
        if (attJson.data?.stats?.activeShift) {
          setShift(attJson.data.stats.activeShift);
        }
        const records: AttendanceRecord[] = attJson.data?.records || [];
        const roster: AttendanceRecord[] = attJson.data?.roster || [];
        const empId = matchedEmp?.id;

        const rec =
          records.find((r) => r.employeeId === empId && r.date === todayDate) ||
          roster.find((r) => r.employeeId === empId && r.date === todayDate && (r.clockInTime || r.clockOutTime)) ||
          null;
        setTodayRecord(rec);
      }
    } catch (e) {
      console.warn('Failed to fetch clock status', e);
    }
  }, [tenantSlug, user]);

  useEffect(() => {
    fetchAttendanceStatus();

    const handlePunchEvent = () => {
      fetchAttendanceStatus();
    };

    window.addEventListener(ATTENDANCE_PUNCH_EVENT, handlePunchEvent);
    return () => {
      window.removeEventListener(ATTENDANCE_PUNCH_EVENT, handlePunchEvent);
    };
  }, [fetchAttendanceStatus]);

  const handlePunch = async (action: 'IN' | 'OUT') => {
    if (!employee && !user) return;
    setPunching(true);
    setToastMessage(null);

    const now = new Date();
    const timeNow = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const clientDate = getTodayDateStr();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

    const empId = employee?.id || `emp-${user?.id || 'owner'}`;
    const empEmail = employee?.workEmail || user?.email;

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: empId,
          employeeEmail: empEmail,
          action,
          notes: action === 'IN' ? 'Keka Web Clock-In' : 'Keka Web Clock-Out',
          clientTime: timeNow,
          clientDate,
          timezone: tz
        })
      });

      const json = await res.json();
      if (json.success) {
        setToastMessage(json.message || `Web Clock ${action === 'IN' ? 'In' : 'Out'} Successful!`);
        await fetchAttendanceStatus();
        // Notify all other components on the page
        window.dispatchEvent(new Event(ATTENDANCE_PUNCH_EVENT));
      } else {
        setToastMessage(json.error || 'Failed to record punch.');
      }
    } catch {
      setToastMessage('Network error logging punch.');
    } finally {
      setPunching(false);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const isClockedIn = Boolean(todayRecord?.clockInTime && !todayRecord?.clockOutTime);
  const isClockedOut = Boolean(todayRecord?.clockOutTime);

  return (
    <div className="relative flex items-center gap-2 sm:gap-3">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-semibold shadow-xl border border-slate-700 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Keka Live Digital Clock Display */}
      <div className="hidden lg:flex flex-col items-end pr-2 border-r border-slate-200">
        <div className="font-mono text-xs font-black text-slate-800 tracking-tight flex items-center gap-1">
          <Clock className="w-3 h-3 text-emerald-600" />
          <span>
            {currentTime
              ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : '--:--:--'}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-medium">
          {shift ? `${shift.formattedStart} - ${shift.formattedEnd}` : '10:00 AM - 07:00 PM'}
        </div>
      </div>

      {/* Keka Web Clock-In / Clock-Out Widget Pill */}
      <div className="flex items-center gap-1.5 bg-slate-100/80 hover:bg-slate-100 p-1 rounded-full border border-slate-200 transition-all shadow-2xs">
        {isClockedIn ? (
          <>
            <div className="flex items-center gap-1.5 pl-2.5 pr-2 py-0.5 text-xs font-bold text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden xl:inline text-[11px] font-mono">
                In: {todayRecord?.clockInTime}
              </span>
            </div>

            <button
              type="button"
              disabled={punching}
              onClick={() => handlePunch('OUT')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
              title="Click to Clock Out of your shift"
            >
              <Square className="w-3 h-3 fill-white" />
              <span>{punching ? 'Clocking Out...' : 'Web Clock-Out'}</span>
            </button>
          </>
        ) : isClockedOut ? (
          <>
            <div className="flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 text-[11px] font-semibold text-blue-700">
              <CheckCircle2 className="w-3 h-3 text-blue-600" />
              <span className="hidden xl:inline font-mono">
                Out: {todayRecord?.clockOutTime} ({todayRecord?.workingHours}h)
              </span>
            </div>

            <button
              type="button"
              disabled={punching}
              onClick={() => handlePunch('IN')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
              title="Clock In again for second half or split shift"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>{punching ? 'Clocking In...' : 'Clock In Again'}</span>
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-0.5 text-[11px] font-medium text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span className="hidden xl:inline">Not Clocked In</span>
            </div>

            <button
              type="button"
              disabled={punching}
              onClick={() => handlePunch('IN')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
              title="Click to Clock In for today's shift"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>{punching ? 'Clocking In...' : 'Web Clock-In'}</span>
            </button>
          </>
        )}
      </div>

      {/* Quick Attendance Regularization Shortcut */}
      <Link
        href={`/app/${tenantSlug}/attendance?tab=regularizations&action=request`}
        className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold text-slate-600 hover:text-emerald-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
        title="Request Attendance Regularization / Missed Punch Correction"
      >
        <RefreshCw className="w-3 h-3 text-amber-600" />
        <span className="hidden xl:inline">Regularize</span>
      </Link>
    </div>
  );
}
