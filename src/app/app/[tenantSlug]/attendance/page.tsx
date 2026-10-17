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
  MapPin,
  ShieldCheck,
  UserCheck,
  Send,
  X,
  Check,
  Filter,
  FileText,
  User,
  Users,
  Building2,
  AlertTriangle,
  History,
  Sparkles
} from 'lucide-react';
import { AttendanceRecord, Employee, Tenant, RegularizationRequest } from '@/lib/types';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';

export default function TenantAttendancePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tenantSlug = params.tenantSlug as string;
  const { user, isEmployeeOnly } = useCurrentUser(tenantSlug);

  // Tab State: 'attendance' or 'regularizations'
  const initialTab = searchParams.get('tab') === 'regularizations' ? 'regularizations' : 'attendance';
  const [activeTab, setActiveTab] = useState<'attendance' | 'regularizations'>(initialTab);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [regularizations, setRegularizations] = useState<RegularizationRequest[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [selectedEmpId, setSelectedEmpId] = useState('');

  // Regularization Filters
  const [regFilter, setRegFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Request Regularization Modal State
  const [isRegModalOpen, setIsRegModalOpen] = useState(searchParams.get('action') === 'request');
  const [regEmpId, setRegEmpId] = useState('');
  const [regDate, setRegDate] = useState(new Date().toISOString().split('T')[0]);
  const [regClockIn, setRegClockIn] = useState('09:00');
  const [regClockOut, setRegClockOut] = useState('18:00');
  const [regReasonCategory, setRegReasonCategory] = useState('Biometric Sync Issue / Glitch');
  const [regRemarks, setRegRemarks] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regFeedback, setRegFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Manager Review Modal State
  const [reviewingReg, setReviewingReg] = useState<RegularizationRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchAttendance = async () => {
    try {
      const [res, empRes] = await Promise.all([
        fetch(`/api/tenants/${tenantSlug}/attendance?t=${Date.now()}`, {
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
            setSelectedEmpId(myEmp.id);
            setRegEmpId(myEmp.id);
          } else if (!selectedEmpId) {
            setSelectedEmpId(emps[0].id);
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
      fetchAttendance();
    }
  }, [tenantSlug]);

  // Synchronize regEmpId when selectedEmpId changes if not yet set
  useEffect(() => {
    if (selectedEmpId && !regEmpId) {
      setRegEmpId(selectedEmpId);
    }
  }, [selectedEmpId, regEmpId]);

  // Resolve current logged-in employee record
  const currentEmp = employees.find(
    (e) =>
      user &&
      (e.workEmail?.toLowerCase() === user.email?.toLowerCase() ||
        e.firstName?.toLowerCase() === user.name?.toLowerCase().split(' ')[0])
  );

  const isAdmin = !isEmployeeOnly;

  // Selected employee for the regularization form
  const targetRegEmp = employees.find((e) => e.id === (isEmployeeOnly ? currentEmp?.id || regEmpId : regEmpId));

  // Handle Punch In / Out
  const handlePunch = async (action: 'IN' | 'OUT') => {
    if (!selectedEmpId) return;
    setPunchLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmpId,
          action,
          notes: 'Biometric Web Punch Log'
        })
      });
      const json = await res.json();
      if (json.success) {
        setStatusMsg(json.message);
        fetchAttendance();
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
        setRegRemarks('');
        fetchAttendance();
        setTimeout(() => {
          setIsRegModalOpen(false);
          setRegFeedback(null);
          setActiveTab('regularizations');
        }, 1200);
      } else {
        setRegFeedback({ type: 'error', message: json.error || 'Failed to submit regularization request' });
      }
    } catch (err) {
      console.error(err);
      setRegFeedback({ type: 'error', message: 'Network error submitting request' });
    } finally {
      setRegSubmitting(false);
    }
  };

  // Process Manager Review (Approve or Reject)
  const handleReviewRegularization = async () => {
    if (!reviewingReg || !reviewAction) return;

    setReviewSubmitting(true);
    setReviewFeedback(null);

    try {
      const reviewerName = user?.name || (isAdmin ? 'Executive HR' : 'Reporting Manager');

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
        fetchAttendance();
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

  // Filter visible records for attendance table
  const visibleRecords = isEmployeeOnly
    ? records.filter((r) => {
        if (!user) return true;
        const firstName = user.name?.toLowerCase().split(' ')[0];
        return (selectedEmpId && r.employeeId === selectedEmpId) || Boolean(r.employeeName?.toLowerCase().includes(firstName));
      })
    : records;

  const presentCount = visibleRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE_ENTRY').length;

  // Filter visible regularizations
  const visibleRegularizations = regularizations.filter((r) => {
    if (isEmployeeOnly) {
      // Check if current user is the requester OR the assigned manager
      const isMyRequest =
        (currentEmp && r.employeeId === currentEmp.id) ||
        (user && r.employeeName?.toLowerCase().includes(user.name?.toLowerCase().split(' ')[0]));

      const isMySubordinate =
        (currentEmp && r.managerId === currentEmp.id) ||
        (user && r.managerName?.toLowerCase().includes(user.name?.toLowerCase()));

      if (!isMyRequest && !isMySubordinate) return false;
    }

    if (regFilter === 'PENDING') return r.status === 'PENDING';
    if (regFilter === 'APPROVED') return r.status === 'APPROVED';
    if (regFilter === 'REJECTED') return r.status === 'REJECTED';
    return true;
  });

  const pendingRegsCount = regularizations.filter((r) => r.status === 'PENDING').length;
  const approvedRegsCount = regularizations.filter((r) => r.status === 'APPROVED').length;
  const rejectedRegsCount = regularizations.filter((r) => r.status === 'REJECTED').length;

  // Check if current user can review this specific request
  const canUserReview = (req: RegularizationRequest) => {
    if (isAdmin) return true;
    if (currentEmp && req.managerId === currentEmp.id) return true;
    if (user && req.managerName?.toLowerCase().includes(user.name?.toLowerCase())) return true;
    return false;
  };

  // Calculate duration between requested clock-in and clock-out
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
    <div className="space-y-6 max-w-6xl text-slate-900 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-600" />
            {isEmployeeOnly ? 'My Attendance & Regularization' : 'Attendance & Shifts'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isEmployeeOnly
              ? `Real-time web punch tracking, biometric shift sync, and attendance regularizations for ${user?.name || 'Employee'}`
              : `Real-time web punch tracking, biometric shift sync, and manager regularizations for ${tenant?.name || 'Workspace'}`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Shift Policy Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>General Shift: <strong>09:00 AM - 06:00 PM</strong> (15m grace)</span>
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
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fade-in shadow-xs">
          <span className="font-medium">✓ {statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer">
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
          <span>Daily Punch & Attendance Logs</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-semibold">
            {presentCount} Present
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
          <span>Regularization Requests & Approvals</span>
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
      {/* TAB 1: DAILY ATTENDANCE & PUNCH LOGS */}
      {/* ==================================================================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Interactive Punch Terminal Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Live Web Punch Terminal
              </div>
              <h3 className="text-xl font-bold text-slate-900">Record Attendance Punch</h3>
              <p className="text-xs text-slate-600 max-w-md">
                {isEmployeeOnly
                  ? 'Record your clock-in or clock-out timestamps with automated grace calculation.'
                  : 'Simulate an employee punching in or out via browser, mobile geo-fence, or biometric integration.'}
              </p>

              <div className="pt-1 flex items-center gap-2">
                <span className="text-xs text-slate-600 font-medium">
                  {isEmployeeOnly ? 'Active Employee:' : 'Employee:'}
                </span>
                {isEmployeeOnly ? (
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    {user?.name || 'Employee'}
                  </span>
                ) : (
                  <select
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} ({e.employeeCode})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <button
                onClick={() => handlePunch('IN')}
                disabled={punchLoading}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all hover:scale-105 disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Clock In</span>
              </button>

              <button
                onClick={() => handlePunch('OUT')}
                disabled={punchLoading}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs shadow-xs transition-all hover:scale-105 disabled:opacity-50 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-slate-700" />
                <span>Clock Out</span>
              </button>
            </div>
          </div>

          {/* Attendance Logs Table */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  {isEmployeeOnly ? 'My Daily Attendance Records' : 'Daily Attendance Records'}
                </h3>
                <p className="text-xs text-slate-500">Logs captured for today ({new Date().toISOString().split('T')[0]})</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                {presentCount} Present
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 uppercase font-semibold text-[10px] text-slate-500 tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Employee</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Clock In</th>
                    <th className="px-6 py-3.5">Clock Out</th>
                    <th className="px-6 py-3.5">Effective Hours</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Method / Regularization Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {visibleRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-xs">
                        {isEmployeeOnly
                          ? 'No attendance records logged for your profile today.'
                          : 'No attendance records logged yet today.'}
                      </td>
                    </tr>
                  ) : (
                    visibleRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{r.employeeName}</td>
                        <td className="px-6 py-4 font-mono text-slate-600">{r.date}</td>
                        <td className="px-6 py-4 font-mono font-semibold text-emerald-700">
                          {r.clockInTime || '—'}
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold text-slate-700">
                          {r.clockOutTime || '—'}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {r.workingHours > 0 ? `${r.workingHours} hrs` : 'In Progress'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === 'PRESENT'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : r.status === 'LATE_ENTRY'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className={r.notes?.includes('Regularized') ? 'font-semibold text-emerald-700' : ''}>
                            {r.notes || 'Office Web Punch'}
                          </span>
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
                  {isEmployeeOnly ? 'My Attendance Regularization Requests' : 'All Regularization Requests & Approvals'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isEmployeeOnly
                    ? 'Track review status and feedback from your reporting manager.'
                    : 'Review and approve time adjustment requests submitted by your team members.'}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {visibleRegularizations.length} Items
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
                  {visibleRegularizations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <CheckCircle2 className="w-8 h-8 text-slate-300" />
                          <p className="text-xs font-medium text-slate-500">
                            No regularization requests found matching this filter.
                          </p>
                          <button
                            onClick={() => {
                              setRegFeedback(null);
                              setIsRegModalOpen(true);
                            }}
                            className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                          >
                            + Submit a Regularization Request
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visibleRegularizations.map((r) => {
                      const hours = getRequestedHours(r.requestedClockIn, r.requestedClockOut);
                      const isPending = r.status === 'PENDING';
                      const canReview = isPending && canUserReview(r);

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{r.employeeName}</div>
                            <div className="text-[10px] text-slate-400">ID: {r.employeeId.slice(0, 14)}...</div>
                          </td>
                          <td className="px-6 py-4 font-mono font-semibold text-slate-800">
                            {r.attendanceDate}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-mono font-bold text-emerald-700">
                              {r.requestedClockIn} – {r.requestedClockOut}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">{hours} regularized</div>
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <div className="font-medium text-slate-800 truncate" title={r.reason}>
                              {r.reason}
                            </div>
                            {r.comment && (
                              <div className="text-[10px] text-slate-500 italic mt-0.5">
                                Approver Note: "{r.comment}"
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>{r.managerName || 'Executive Management'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {r.status === 'PENDING' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                Pending Review
                              </span>
                            )}
                            {r.status === 'APPROVED' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                Approved
                              </span>
                            )}
                            {r.status === 'REJECTED' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                <X className="w-3 h-3 text-rose-600" />
                                Rejected
                              </span>
                            )}
                            {r.reviewedBy && (
                              <div className="text-[10px] text-slate-400 mt-1">by {r.reviewedBy}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {canReview ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setReviewingReg(r);
                                    setReviewAction('APPROVED');
                                    setReviewComment('');
                                    setReviewFeedback(null);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                                  title="Approve Regularization"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Approve</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setReviewingReg(r);
                                    setReviewAction('REJECTED');
                                    setReviewComment('');
                                    setReviewFeedback(null);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                                  title="Reject Regularization"
                                >
                                  <X className="w-3.5 h-3.5 text-rose-700" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                {isPending ? 'Waiting for Manager' : 'Completed'}
                              </span>
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
      {/* MODAL 1: REQUEST ATTENDANCE REGULARIZATION */}
      {/* ==================================================================== */}
      {isRegModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">Request Attendance Regularization</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
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
                <label className="block font-bold text-slate-700 mb-1">Employee</label>
                {isEmployeeOnly ? (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold flex items-center justify-between">
                    <span>{user?.name || 'Employee Member'}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{user?.email}</span>
                  </div>
                ) : (
                  <select
                    value={regEmpId}
                    onChange={(e) => setRegEmpId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} ({e.employeeCode}) — {e.departmentName || 'General'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Reporting Manager Preview */}
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-[11px] block">Assigned Approver:</span>
                    <span className="text-xs">
                      {targetRegEmp?.reportingManagerName || 'Executive Lead / Board of Directors'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/60 font-bold uppercase text-emerald-800">
                  Manager Review
                </span>
              </div>

              {/* Attendance Date */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Attendance Date to Regularize</label>
                <input
                  type="date"
                  value={regDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setRegDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Requested Clock-In</label>
                  <input
                    type="time"
                    value={regClockIn}
                    onChange={(e) => setRegClockIn(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Requested Clock-Out</label>
                  <input
                    type="time"
                    value={regClockOut}
                    onChange={(e) => setRegClockOut(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Calculated Hours Preview */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 text-slate-700">
                <span className="font-medium text-[11px]">Computed Shift Working Hours:</span>
                <span className="font-bold text-emerald-700 font-mono">
                  {getRequestedHours(regClockIn, regClockOut)}
                </span>
              </div>

              {/* Reason Category */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Regularization</label>
                <select
                  value={regReasonCategory}
                  onChange={(e) => setRegReasonCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Biometric Sync Issue / Glitch">Biometric Machine / Device Sync Glitch</option>
                  <option value="Missed Punch / Forgot to Clock In or Out">Missed Punch (Forgot to Clock In / Out)</option>
                  <option value="Official Duty / Client Site Visit">Official Duty / Client Site Visit (On-Duty)</option>
                  <option value="Work From Home / Remote Approval">Work From Home / Approved Remote Duty</option>
                  <option value="Late Entry / Grace Period Exemption">Late Entry / Grace Period Exemption</option>
                  <option value="Technical Glitch / Internet Outage">Technical Glitch / Network Disruption</option>
                  <option value="Other Official Reason">Other Official Reason</option>
                </select>
              </div>

              {/* Detailed Remarks */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Detailed Explanation / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={regRemarks}
                  onChange={(e) => setRegRemarks(e.target.value)}
                  placeholder="Provide context or client meeting details for your manager..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRegModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{regSubmitting ? 'Submitting...' : 'Submit to Manager'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: MANAGER APPROVAL / REJECTION DIALOG */}
      {/* ==================================================================== */}
      {reviewingReg && reviewAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
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

              {/* Request Summary Card */}
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

              {/* Manager Review Comments */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Manager Comments / Reviewer Remarks
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={
                    reviewAction === 'APPROVED'
                      ? 'e.g. Approved - client visit verified by team lead'
                      : 'e.g. Discrepancy with premises access swipe records'
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {reviewAction === 'APPROVED' && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    Approving will automatically mark the employee as <strong>PRESENT</strong> in daily attendance logs
                    and update PostgreSQL Supabase storage.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setReviewingReg(null);
                    setReviewAction(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReviewRegularization}
                  disabled={reviewSubmitting}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer ${
                    reviewAction === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {reviewAction === 'APPROVED' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  <span>
                    {reviewSubmitting
                      ? 'Updating...'
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
  );
}
