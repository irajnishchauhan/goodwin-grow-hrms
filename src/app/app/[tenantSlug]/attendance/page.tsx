'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  FileText,
  Check,
  X,
  History,
  Send,
  Sparkles,
  MapPin,
  Filter,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  UserX,
  ChevronRight
} from 'lucide-react';
import {
  AttendanceRecord,
  Employee,
  Tenant,
  RegularizationRequest,
  Shift
} from '@/lib/types';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import RoleGuard from '@/components/RoleGuard';

export default function TenantAttendancePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tenantSlug = params.tenantSlug as string;

  const { user, isEmployeeOnly, isCompanyAdmin } = useCurrentUser(tenantSlug);

  // Core Attendance & Roster State
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get('date') || new Date().toISOString().split('T')[0]
  );
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [regularizations, setRegularizations] = useState<RegularizationRequest[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentCount: 0,
    onTimeCount: 0,
    lateCount: 0,
    halfDayCount: 0,
    onLeaveCount: 0,
    absentCount: 0
  });

  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Tab View
  const [activeTab, setActiveTab] = useState<'attendance' | 'regularizations'>('attendance');

  // Attendance Status Filter
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'PRESENT' | 'LATE_ENTRY' | 'HALF_DAY' | 'ON_LEAVE' | 'ABSENT'
  >('ALL');

  // Regularization Filters
  const [regFilter, setRegFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Request Regularization Modal State
  const [isRegModalOpen, setIsRegModalOpen] = useState(searchParams.get('action') === 'request');
  const [regEmpId, setRegEmpId] = useState('');
  const [regDate, setRegDate] = useState(new Date().toISOString().split('T')[0]);
  const [regClockIn, setRegClockIn] = useState('09:00');
  const [regClockOut, setRegClockOut] = useState('18:00');
  const [regReasonCategory, setRegReasonCategory] = useState('Missed Punch / Forgot to Clock In or Out');
  const [regRemarks, setRegRemarks] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regFeedback, setRegFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Manager Review Modal State
  const [reviewingReg, setReviewingReg] = useState<RegularizationRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const fetchAttendance = async (dateToFetch?: string) => {
    try {
      const d = dateToFetch || selectedDate;
      const [res, empRes] = await Promise.all([
        fetch(`/api/tenants/${tenantSlug}/attendance?date=${d}&t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store' }
        }),
        fetch(`/api/tenants/${tenantSlug}/employees?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store' }
        })
      ]);

      const [json, empJson] = await Promise.all([
        res.json().catch(() => ({})),
        empRes.json().catch(() => ({}))
      ]);

      if (json.success) {
        setRecords(json.data.records || []);
        if (json.data.regularizations) {
          setRegularizations(json.data.regularizations);
        }
        if (json.data.shifts) {
          setShifts(json.data.shifts);
        }
        if (json.data.stats) {
          setStats(json.data.stats);
        }
      }

      if (empJson.success) {
        const emps: Employee[] = empJson.data.employees || [];
        setEmployees(emps);
        setTenant(empJson.data.tenant);

        if (emps.length > 0) {
          const myEmp = emps.find(
            (e) =>
              user &&
              (e.workEmail?.toLowerCase() === user.email?.toLowerCase() ||
                e.firstName?.toLowerCase() === user.name?.toLowerCase().split(' ')[0])
          );
          if (myEmp) {
            setRegEmpId(myEmp.id);
          } else if (!regEmpId) {
            setRegEmpId(emps[0].id);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchAttendance(selectedDate);
    }
  }, [tenantSlug, selectedDate]);

  // Current logged in employee record
  const currentEmp = employees.find(
    (e) =>
      user &&
      (e.workEmail?.toLowerCase() === user.email?.toLowerCase() ||
        e.firstName?.toLowerCase() === user.name?.toLowerCase().split(' ')[0])
  );

  const isAdmin = !isEmployeeOnly;

  // Find logged-in user's punch record for today
  const myTodayRecord = records.find(
    (r) => currentEmp && r.employeeId === currentEmp.id && r.date === selectedDate
  );

  // Handle Punch In / Out (Strictly by logged in employee for themselves)
  const handlePunch = async (action: 'IN' | 'OUT') => {
    if (!currentEmp) {
      setStatusMsg('No employee profile associated with your user session.');
      return;
    }
    setPunchLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: currentEmp.id,
          action,
          notes: action === 'IN' ? 'Mobile Web Punch-In' : 'Mobile Web Punch-Out'
        })
      });
      const json = await res.json();
      if (json.success) {
        setStatusMsg(json.message);
        fetchAttendance(selectedDate);
      } else {
        setStatusMsg(json.error || 'Failed to record punch');
      }
    } catch (e) {
      console.error(e);
      setStatusMsg('Connection error logging punch');
    } finally {
      setPunchLoading(false);
    }
  };

  // Submit Regularization Request
  const handleSubmitRegularization = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveEmpId = isEmployeeOnly ? currentEmp?.id || regEmpId : regEmpId;
    if (!effectiveEmpId) {
      setRegFeedback({ type: 'error', message: 'Please select an employee' });
      return;
    }
    if (!regDate) {
      setRegFeedback({ type: 'error', message: 'Please select the attendance date to regularize' });
      return;
    }

    setRegSubmitting(true);
    setRegFeedback(null);

    const emp = employees.find((e) => e.id === effectiveEmpId);
    const fullReason = `${regReasonCategory}${regRemarks ? ` — ${regRemarks}` : ''}`;

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REGULARIZATION',
          employeeId: effectiveEmpId,
          employeeName: emp ? `${emp.firstName} ${emp.lastName}` : undefined,
          attendanceDate: regDate,
          requestedClockIn: regClockIn,
          requestedClockOut: regClockOut,
          reason: fullReason,
          managerId: emp?.reportingManagerId,
          managerName: emp?.reportingManagerName
        })
      });

      const json = await res.json();
      if (json.success) {
        setRegFeedback({
          type: 'success',
          message: 'Attendance regularization request submitted successfully for manager approval!'
        });
        fetchAttendance(selectedDate);
        setTimeout(() => {
          setIsRegModalOpen(false);
          setRegRemarks('');
          setRegFeedback(null);
        }, 1500);
      } else {
        setRegFeedback({ type: 'error', message: json.error || 'Failed to submit regularization' });
      }
    } catch (err) {
      console.error(err);
      setRegFeedback({ type: 'error', message: 'Network error submitting request' });
    } finally {
      setRegSubmitting(false);
    }
  };

  // Review & Approve/Reject Regularization
  const handleReviewRegularization = async () => {
    if (!reviewingReg || !reviewAction) return;
    setReviewSubmitting(true);
    setReviewFeedback(null);

    const reviewerName = user?.name || (isCompanyAdmin ? 'Company Administrator' : 'Reporting Manager');

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regularizationId: reviewingReg.id,
          status: reviewAction,
          reviewedBy: reviewerName,
          comment: reviewComment.trim() || undefined
        })
      });

      const json = await res.json();
      if (json.success) {
        setReviewFeedback({
          type: 'success',
          message: `Regularization request successfully ${reviewAction.toLowerCase()}!`
        });
        fetchAttendance(selectedDate);
        setTimeout(() => {
          setReviewingReg(null);
          setReviewAction(null);
          setReviewComment('');
          setReviewFeedback(null);
        }, 1000);
      } else {
        setReviewFeedback({ type: 'error', message: json.error || 'Failed to update regularization' });
      }
    } catch (err) {
      console.error(err);
      setReviewFeedback({ type: 'error', message: 'Failed to communicate with server' });
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Quick Open Regularization Modal for a specific unpunched or half-day record
  const handleQuickRegularize = (empId: string, attDate: string) => {
    setRegEmpId(empId);
    setRegDate(attDate);
    setRegFeedback(null);
    setIsRegModalOpen(true);
  };

  // Filter records by status and role
  const visibleRecords = records.filter((r) => {
    if (isEmployeeOnly) {
      if (!currentEmp) return true;
      if (r.employeeId !== currentEmp.id) return false;
    }

    if (statusFilter === 'PRESENT') return r.status === 'PRESENT';
    if (statusFilter === 'LATE_ENTRY') return r.status === 'LATE_ENTRY';
    if (statusFilter === 'HALF_DAY') return r.status === 'HALF_DAY';
    if (statusFilter === 'ON_LEAVE') return r.status === 'ON_LEAVE';
    if (statusFilter === 'ABSENT') return r.status === 'ABSENT';
    return true;
  });

  const pendingRegsCount = regularizations.filter((r) => r.status === 'PENDING').length;
  const approvedRegsCount = regularizations.filter((r) => r.status === 'APPROVED').length;
  const rejectedRegsCount = regularizations.filter((r) => r.status === 'REJECTED').length;

  const targetRegEmp = employees.find((e) => e.id === (isEmployeeOnly ? currentEmp?.id || regEmpId : regEmpId));

  const getRequestedHours = (inTime: string, outTime: string) => {
    try {
      const [inH, inM] = inTime.split(':').map(Number);
      const [outH, outM] = outTime.split(':').map(Number);
      if (!isNaN(inH) && !isNaN(outH)) {
        const diff = outH * 60 + outM - (inH * 60 + inM);
        if (diff > 0) return `${(diff / 60).toFixed(1)} hrs`;
      }
    } catch {
      // fallback
    }
    return '8.5 hrs';
  };

  return (
    <RoleGuard
      tenantSlug={tenantSlug}
      requiredRoles={['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']}
      moduleName="Attendance, Shifts & Regularization"
    >
      <div className="space-y-6 max-w-7xl text-slate-900 pb-16 font-sans">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-6 h-6 text-emerald-600" />
              {isEmployeeOnly ? 'My Attendance & Regularization' : 'Workforce Attendance & Shifts'}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Industry standard shift timings, grace periods, half-day calculations, approved leave sync, and manager regularizations for{' '}
              {tenant?.name || 'Workspace'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Shift Policy Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Standard Day Shift: <strong>09:00 AM - 06:00 PM</strong> (15m grace)
              </span>
            </div>

            {/* Request Regularization Action Button */}
            <button
              onClick={() => {
                setRegFeedback(null);
                setIsRegModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-102 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Request Regularization</span>
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fade-in shadow-xs">
            <span>✓ {statusMsg}</span>
            <button
              onClick={() => setStatusMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Primary Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'attendance'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Daily Workforce Roster</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
              {stats.presentCount} Present
            </span>
          </button>

          <button
            onClick={() => setActiveTab('regularizations')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'regularizations'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Regularization Approvals</span>
            {pendingRegsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-extrabold animate-pulse">
                {pendingRegsCount} Pending
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-semibold">
                {regularizations.length}
              </span>
            )}
          </button>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: DAILY ATTENDANCE & PUNCH ROSTER */}
        {/* ==================================================================== */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Employee Self-Service Punch Card (Punched by Employee Only) */}
            {currentEmp ? (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>My Real-Time Web Punch Terminal ({currentEmp.firstName} {currentEmp.lastName})</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {myTodayRecord?.clockInTime
                      ? `Clocked In today at ${myTodayRecord.clockInTime}${myTodayRecord.clockOutTime ? ` · Clocked Out at ${myTodayRecord.clockOutTime}` : ' (In Progress)'}`
                      : 'Not Clocked In Yet Today'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Shift: <strong>{currentEmp.shiftName || 'General Day Shift'} (09:00 AM - 06:00 PM)</strong>. 15-minute grace period applies.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePunch('IN')}
                    disabled={punchLoading || Boolean(myTodayRecord?.clockInTime)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all hover:scale-102 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{myTodayRecord?.clockInTime ? 'Already Clocked In' : 'Clock In Now'}</span>
                  </button>

                  <button
                    onClick={() => handlePunch('OUT')}
                    disabled={punchLoading || !myTodayRecord?.clockInTime || Boolean(myTodayRecord?.clockOutTime)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs shadow-xs transition-all hover:scale-102 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-slate-700" />
                    <span>{myTodayRecord?.clockOutTime ? 'Clocked Out' : 'Clock Out'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Non-Employee Session Info Banner */
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Workforce Audit Compliance:</strong> Attendance punches are strictly registered by employees via their Self-Service portal. Automated simulation has been disabled.
                  </span>
                </div>
              </div>
            )}

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Workforce</div>
                <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{stats.totalEmployees}</div>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Active employees</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/90 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Present (On-Time)</div>
                <div className="text-2xl font-black text-emerald-800 mt-1 font-mono">{stats.onTimeCount}</div>
                <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Punched within grace</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Late Arrivals</div>
                <div className="text-2xl font-black text-amber-800 mt-1 font-mono">{stats.lateCount}</div>
                <p className="text-[10px] text-amber-600 font-medium mt-0.5">Punched after 09:15 AM</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/90 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Half Day</div>
                <div className="text-2xl font-black text-indigo-800 mt-1 font-mono">{stats.halfDayCount}</div>
                <p className="text-[10px] text-indigo-600 font-medium mt-0.5">4.0 - 7.5 hrs worked</p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/90 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Absent / On Leave</div>
                <div className="text-2xl font-black text-rose-800 mt-1 font-mono">
                  {stats.absentCount + stats.onLeaveCount}
                </div>
                <p className="text-[10px] text-rose-600 font-medium mt-0.5">
                  {stats.onLeaveCount} On Leave · {stats.absentCount} Unpunched
                </p>
              </div>
            </div>

            {/* Attendance Roster Controls & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Status:
                </span>
                {(
                  [
                    { key: 'ALL', label: `All (${records.length})` },
                    { key: 'PRESENT', label: `Present (${stats.onTimeCount})` },
                    { key: 'LATE_ENTRY', label: `Late (${stats.lateCount})` },
                    { key: 'HALF_DAY', label: `Half Day (${stats.halfDayCount})` },
                    { key: 'ON_LEAVE', label: `On Leave (${stats.onLeaveCount})` },
                    { key: 'ABSENT', label: `Absent (${stats.absentCount})` }
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === tab.key
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Roster Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Attendance Roster Table */}
            <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Daily Attendance Log & Shift Calculation
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Calculated for date <strong>{selectedDate}</strong> based on General Shift (09:00 - 18:00, 15m grace).
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  {visibleRecords.length} Employees Listed
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 uppercase font-bold text-[10px] text-slate-500 tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Employee</th>
                      <th className="px-5 py-3.5">Assigned Shift</th>
                      <th className="px-5 py-3.5">Clock In</th>
                      <th className="px-5 py-3.5">Clock Out</th>
                      <th className="px-5 py-3.5">Effective Hours</th>
                      <th className="px-5 py-3.5">Calculated Status</th>
                      <th className="px-5 py-3.5">Audit Method / Note</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {visibleRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-10 text-center text-slate-400 text-xs">
                          No attendance records found matching this filter for {selectedDate}.
                        </td>
                      </tr>
                    ) : (
                      visibleRecords.map((r) => {
                        const emp = employees.find((e) => e.id === r.employeeId);
                        const isUnpunched = r.status === 'ABSENT' || !r.clockInTime;
                        const isLate = r.status === 'LATE_ENTRY';
                        const isHalf = r.status === 'HALF_DAY';

                        return (
                          <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-5 py-4">
                              <div className="font-bold text-slate-900">{r.employeeName}</div>
                              <div className="text-[10px] font-mono text-slate-500">
                                {emp?.employeeCode || 'EMP'} · {emp?.departmentName || 'General'}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span className="font-semibold text-slate-800 text-[11px]">
                                {r.shiftName || 'General Day Shift'}
                              </span>
                              <div className="text-[10px] text-slate-500 font-mono">09:00 AM - 06:00 PM</div>
                            </td>

                            <td className="px-5 py-4 font-mono font-semibold">
                              {r.clockInTime ? (
                                <span className={isLate ? 'text-amber-700' : 'text-emerald-700'}>
                                  {r.clockInTime}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-sans">—</span>
                              )}
                            </td>

                            <td className="px-5 py-4 font-mono font-semibold">
                              {r.clockOutTime ? (
                                <span className="text-slate-800">{r.clockOutTime}</span>
                              ) : r.clockInTime ? (
                                <span className="text-amber-600 text-[11px] font-sans font-medium">
                                  In Progress
                                </span>
                              ) : (
                                <span className="text-slate-400 font-sans">—</span>
                              )}
                            </td>

                            <td className="px-5 py-4 font-bold font-mono text-slate-900">
                              {r.workingHours > 0
                                ? `${r.workingHours.toFixed(1)} hrs`
                                : r.clockInTime && !r.clockOutTime
                                ? 'In Progress'
                                : '0.0 hrs'}
                            </td>

                            <td className="px-5 py-4">
                              {r.status === 'PRESENT' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                  PRESENT
                                </span>
                              )}
                              {r.status === 'LATE_ENTRY' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  LATE ENTRY
                                </span>
                              )}
                              {r.status === 'HALF_DAY' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                                  HALF DAY
                                </span>
                              )}
                              {r.status === 'ON_LEAVE' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                  <Calendar className="w-3 h-3 text-blue-600" />
                                  ON LEAVE
                                </span>
                              )}
                              {r.status === 'ABSENT' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                  ABSENT
                                </span>
                              )}
                              {r.status === 'HOLIDAY' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  WEEK OFF
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4 text-slate-600 text-[11px]">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[190px]">
                                  {r.notes || (r.clockInTime ? 'Mobile Web Punch' : 'Unpunched')}
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-right">
                              {(isUnpunched || isLate || isHalf) && (
                                <button
                                  onClick={() => handleQuickRegularize(r.employeeId, r.date)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] transition-colors cursor-pointer"
                                  title="Submit regularization request for this date"
                                >
                                  Regularize
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: REGULARIZATION REQUESTS & MANAGER APPROVAL FLOW */}
        {/* ==================================================================== */}
        {activeTab === 'regularizations' && (
          <div className="space-y-6">
            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Requests
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-900">{regularizations.length}</span>
                  <History className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500">Across entire organization</p>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                  Pending Approvals
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-amber-700">{pendingRegsCount}</span>
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-[11px] text-amber-600 font-medium">Awaiting manager action</p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                  Approved Regularizations
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-emerald-700">{approvedRegsCount}</span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-[11px] text-emerald-600 font-medium">Updated to attendance</p>
              </div>

              <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200/90 shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                  Rejected Requests
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-rose-700">{rejectedRegsCount}</span>
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <p className="text-[11px] text-rose-600 font-medium">Dismissed by managers</p>
              </div>
            </div>

            {/* Regularizations Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Filter:
                </span>
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setRegFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      regFilter === st
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'All Requests'
                      : st === 'PENDING'
                      ? `Pending (${pendingRegsCount})`
                      : st === 'APPROVED'
                      ? `Approved (${approvedRegsCount})`
                      : `Rejected (${rejectedRegsCount})`}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setRegFeedback(null);
                  setIsRegModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer self-start sm:self-auto"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit New Regularization</span>
              </button>
            </div>

            {/* Regularizations Table */}
            <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    {isEmployeeOnly
                      ? 'My Attendance Regularization Requests'
                      : 'All Regularization Requests & Approvals'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isEmployeeOnly
                      ? 'Track review status and feedback from your reporting manager.'
                      : 'Review and approve time adjustment requests submitted by your team members.'}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {regularizations.length} Items
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 uppercase font-semibold text-[10px] text-slate-500 tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Employee</th>
                      <th className="px-6 py-3.5">Attendance Date</th>
                      <th className="px-6 py-3.5">Requested Hours</th>
                      <th className="px-6 py-3.5">Reason & Remarks</th>
                      <th className="px-6 py-3.5">Reporting Manager</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {regularizations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <History className="w-8 h-8 text-slate-300" />
                            <span>No regularization requests submitted yet.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      regularizations
                        .filter((r) => {
                          if (regFilter === 'PENDING') return r.status === 'PENDING';
                          if (regFilter === 'APPROVED') return r.status === 'APPROVED';
                          if (regFilter === 'REJECTED') return r.status === 'REJECTED';
                          return true;
                        })
                        .map((reg) => (
                          <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">{reg.employeeName}</td>
                            <td className="px-6 py-4 font-mono font-semibold text-emerald-800">
                              {reg.attendanceDate}
                            </td>
                            <td className="px-6 py-4 font-mono">
                              {reg.requestedClockIn} - {reg.requestedClockOut} (
                              {getRequestedHours(reg.requestedClockIn, reg.requestedClockOut)})
                            </td>
                            <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{reg.reason}</td>
                            <td className="px-6 py-4 text-slate-500">
                              {reg.managerName || 'Reporting Lead'}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  reg.status === 'APPROVED'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : reg.status === 'REJECTED'
                                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {reg.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {isAdmin && reg.status === 'PENDING' && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setReviewingReg(reg);
                                      setReviewAction('APPROVED');
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReviewingReg(reg);
                                      setReviewAction('REJECTED');
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Regularization Modal */}
        {isRegModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-emerald-700 px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-200" />
                  <h3 className="text-base font-bold">Request Attendance Regularization</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRegModalOpen(false)}
                  className="text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitRegularization} className="p-6 space-y-4 text-xs">
                {regFeedback && (
                  <div
                    className={`p-3 rounded-xl flex items-center gap-2 ${
                      regFeedback.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    {regFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{regFeedback.message}</span>
                  </div>
                )}

                {/* Employee Selection */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee *</label>
                  {isEmployeeOnly ? (
                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-800">
                      {user?.name || 'Employee'}
                    </div>
                  ) : (
                    <select
                      value={regEmpId}
                      onChange={(e) => setRegEmpId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                    >
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.firstName} {e.lastName} ({e.employeeCode})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Attendance Date *</label>
                  <input
                    type="date"
                    required
                    value={regDate}
                    onChange={(e) => setRegDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Clock In *</label>
                    <input
                      type="time"
                      required
                      value={regClockIn}
                      onChange={(e) => setRegClockIn(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Clock Out *</label>
                    <input
                      type="time"
                      required
                      value={regClockOut}
                      onChange={(e) => setRegClockOut(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Reason Category */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reason Category *</label>
                  <select
                    value={regReasonCategory}
                    onChange={(e) => setRegReasonCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Missed Punch / Forgot to Clock In or Out">Missed Punch (Forgot to Clock In / Out)</option>
                    <option value="Biometric Machine / Device Sync Glitch">Biometric Machine / Device Sync Glitch</option>
                    <option value="Official Duty / Client Site Visit">Official Duty / Client Site Visit (On-Duty)</option>
                    <option value="Work From Home / Remote Approval">Work From Home / Approved Remote Duty</option>
                    <option value="Late Entry / Grace Period Exemption">Late Entry / Grace Period Exemption</option>
                    <option value="Technical Glitch / Internet Outage">Technical Glitch / Network Disruption</option>
                    <option value="Other Official Reason">Other Official Reason</option>
                  </select>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Notes / Explanation (Optional)</label>
                  <textarea
                    rows={2}
                    value={regRemarks}
                    onChange={(e) => setRegRemarks(e.target.value)}
                    placeholder="Provide details for your manager..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsRegModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={regSubmitting}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{regSubmitting ? 'Submitting...' : 'Submit Request'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Manager Review Modal */}
        {reviewingReg && reviewAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
              <div
                className={`px-6 py-4 text-white flex items-center justify-between ${
                  reviewAction === 'APPROVED' ? 'bg-emerald-700' : 'bg-rose-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {reviewAction === 'APPROVED' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-200" />
                  )}
                  <h3 className="text-base font-bold">
                    {reviewAction === 'APPROVED' ? 'Approve Regularization' : 'Reject Regularization'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReviewingReg(null);
                    setReviewAction(null);
                  }}
                  className="text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {reviewFeedback && (
                  <div
                    className={`p-3 rounded-xl flex items-center gap-2 ${
                      reviewFeedback.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    {reviewFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{reviewFeedback.message}</span>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{reviewingReg.employeeName}</span>
                    <span className="font-mono text-emerald-700 font-bold">{reviewingReg.attendanceDate}</span>
                  </div>
                  <div className="text-slate-600">
                    Requested Shift: <strong>{reviewingReg.requestedClockIn}</strong> to{' '}
                    <strong>{reviewingReg.requestedClockOut}</strong> (
                    {getRequestedHours(reviewingReg.requestedClockIn, reviewingReg.requestedClockOut)})
                  </div>
                  <div className="text-slate-700 pt-1 border-t border-slate-200/80">
                    <span className="font-semibold text-slate-500">Employee Note: </span>
                    {reviewingReg.reason}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Manager Review Comments
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={
                      reviewAction === 'APPROVED'
                        ? 'e.g. Approved - client site visit verified'
                        : 'e.g. Inconsistent with badge entry records'
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewingReg(null);
                      setReviewAction(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReviewRegularization}
                    disabled={reviewSubmitting}
                    className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer ${
                      reviewAction === 'APPROVED'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {reviewAction === 'APPROVED' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    <span>
                      {reviewSubmitting
                        ? 'Processing...'
                        : reviewAction === 'APPROVED'
                        ? 'Confirm Approval'
                        : 'Confirm Rejection'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
