'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
  Building2,
  User,
  ShieldCheck,
  ChevronRight,
  Send,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  BellRing,
  X
} from 'lucide-react';
import { Employee, Shift, LeaveType, LeaveApplication, SalarySlip, Holiday, EmployeeDocument, Tenant } from '@/lib/types';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';

export default function EmployeeSelfServiceDashboard() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { user, isEmployeeOnly, loading: authLoading } = useCurrentUser(tenantSlug);

  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  
  // Data for active employee
  const [currentEmp, setCurrentEmp] = useState<Employee | null>(null);
  const [shift, setShift] = useState<Shift | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveApps, setLeaveApps] = useState<LeaveApplication[]>([]);
  const [payslips, setPayslips] = useState<SalarySlip[]>([]);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  
  // Live ticking clock
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Punch Clock State
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchMessage, setPunchMessage] = useState<string | null>(null);
  const [activeShift, setActiveShift] = useState<{
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    graceMinutes: number;
    formattedStart: string;
    formattedEnd: string;
    lateCutoff: string;
  } | null>(null);

  // Apply Leave Modal State
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState('');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveFeedback, setLeaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Payslip Modal State
  const [viewingSlip, setViewingSlip] = useState<SalarySlip | null>(null);

  // Live timer tick
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Standard statutory fallback leave types
  const fallbackLeaveTypes: LeaveType[] = [
    {
      id: `lt-${tenantSlug}-cl`,
      tenantId: tenant?.id || '',
      name: 'Casual Leave (CL)',
      code: 'CL',
      daysPerYear: 12,
      color: '#3B82F6',
      isPaid: true
    },
    {
      id: `lt-${tenantSlug}-sl`,
      tenantId: tenant?.id || '',
      name: 'Sick / Medical Leave (SL)',
      code: 'SL',
      daysPerYear: 10,
      color: '#EF4444',
      isPaid: true
    },
    {
      id: `lt-${tenantSlug}-pl`,
      tenantId: tenant?.id || '',
      name: 'Privilege Leave (PL)',
      code: 'PL',
      daysPerYear: 18,
      color: '#10B981',
      isPaid: true
    }
  ];

  const activeLeaveTypes = leaveTypes.length > 0 ? leaveTypes : fallbackLeaveTypes;

  // Fetch all initial data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const empRes = await fetch(`/api/tenants/${tenantSlug}/employees?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' }
      });
      const empJson = await empRes.json();
      
      if (empJson.success) {
        setTenant(empJson.data.tenant);
        const emps: Employee[] = empJson.data.employees || [];
        setEmployees(emps);
        
        // Find matching employee for current user
        let matchedEmp: Employee | undefined;
        if (user) {
          const userFirst = user.name?.toLowerCase().split(' ')[0] || '';
          matchedEmp = emps.find(
            (e) =>
              (user.email && e.workEmail?.toLowerCase() === user.email.toLowerCase()) ||
              (user.id && (e.userId === user.id || e.id === user.id)) ||
              (user.name && `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase()) ||
              (userFirst && e.firstName.toLowerCase() === userFirst) ||
              (user.email && user.email.toLowerCase().includes('rajnish') && e.firstName.toLowerCase().includes('rajnish'))
          );
        }

        if (!matchedEmp && user) {
          // Synthesize profile from authenticated user so no wrong name is ever displayed
          const nameTokens = (user.name || 'Owner').trim().split(' ');
          const fName = nameTokens[0];
          const lName = nameTokens.slice(1).join(' ') || '';
          const isOwnerUser = Boolean(
            user.isSuperAdmin ||
            !isEmployeeOnly ||
            user.email?.toLowerCase().includes('rajnish') ||
            user.email?.toLowerCase().includes('admin')
          );

          matchedEmp = {
            id: `emp-user-${user.id || 'current'}`,
            tenantId: empJson.data.tenant?.id || 'tenant-goodwin-batteries-fleet',
            userId: user.id,
            employeeCode: isOwnerUser ? 'GB-OWNER' : 'GB-1001',
            firstName: fName,
            lastName: lName,
            workEmail: user.email || 'rajnish.chauhan@goodwinbatteries.com',
            personalEmail: user.email,
            phone: '+91 98450 00100',
            gender: 'MALE',
            joiningDate: '2024-01-01',
            departmentId: 'dept-exec',
            departmentName: isOwnerUser ? 'Executive & Operations' : 'General Operations',
            designationId: 'desig-exec',
            designationTitle: isOwnerUser ? 'Company Owner & Managing Director' : 'Team Member',
            reportingManagerName: isOwnerUser ? 'Board of Directors' : 'Executive Lead',
            employmentType: 'FULL_TIME',
            status: 'ACTIVE',
            monthlySalary: isOwnerUser ? 350000 : 50000,
            workLocation: 'Indore Facility',
            shiftName: 'General Day Shift',
            loginStatus: 'ACCEPTED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        } else if (!matchedEmp && emps.length > 0) {
          matchedEmp = emps[0];
        }

        if (matchedEmp) {
          setSelectedEmpId(matchedEmp.id);
          setCurrentEmp(matchedEmp);
          await loadEmployeeDetails(matchedEmp.id);
        }
      }
    } catch (err) {
      console.error('Failed to load ESS data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeDetails = async (empId: string) => {
    try {
      const now = new Date();
      const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const [attRes, leavesRes, payRes, docRes] = await Promise.all([
        fetch(`/api/tenants/${tenantSlug}/attendance?date=${localToday}&t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store' }
        }),
        fetch(`/api/tenants/${tenantSlug}/leaves?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store' }
        }),
        fetch(`/api/tenants/${tenantSlug}/payroll?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store' }
        }),
        fetch(`/api/tenants/${tenantSlug}/documents?employeeId=${empId}&t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store' }
        })
      ]);

      const [attJson, leavesJson, payJson, docJson] = await Promise.all([
        attRes.json().catch(() => ({})),
        leavesRes.json().catch(() => ({})),
        payRes.json().catch(() => ({})),
        docRes.json().catch(() => ({}))
      ]);

      // 1. Process attendance
      if (attJson.success) {
        if (attJson.data?.stats?.activeShift) {
          setActiveShift(attJson.data.stats.activeShift);
        }
        const records = attJson.data?.records || [];
        const todayRec = records.find(
          (r: any) => r.employeeId === empId && r.date === localToday
        );

        if (todayRec) {
          setIsClockedIn(!todayRec.clockOutTime);
          setClockInTime(todayRec.clockInTime || null);
          setClockOutTime(todayRec.clockOutTime || null);
        } else {
          setIsClockedIn(false);
          setClockInTime(null);
          setClockOutTime(null);
        }
      }

      // 2. Process leaves
      if (leavesJson.success) {
        const fetchedTypes = leavesJson.data?.leaveTypes || [];
        setLeaveTypes(fetchedTypes);

        const effectiveTypes = fetchedTypes.length > 0 ? fetchedTypes : fallbackLeaveTypes;
        if (effectiveTypes.length > 0) {
          setSelectedLeaveTypeId((prev) => prev || effectiveTypes[0].id);
        }

        setLeaveApps(
          (leavesJson.data?.applications || []).filter((a: LeaveApplication) => a.employeeId === empId)
        );
      }

      // 3. Process payslips
      if (payJson.success) {
        const empSlips = (payJson.data?.slips || []).filter((s: SalarySlip) => s.employeeId === empId);
        setPayslips(empSlips);
      }

      // 4. Process documents
      if (docJson.success) {
        setDocuments(docJson.data?.documents || []);
      }
    } catch (err) {
      console.error('Error fetching employee sub-resources', err);
    }
  };

  useEffect(() => {
    if (tenantSlug && !authLoading) {
      loadDashboardData();
    }
  }, [tenantSlug, authLoading, user?.email, user?.id]);

  const handleSwitchEmployee = (empId: string) => {
    setSelectedEmpId(empId);
    setPunchMessage(null);
    setIsClockedIn(false);
    setClockInTime(null);
    setClockOutTime(null);
    
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setCurrentEmp(emp);
      loadEmployeeDetails(empId);
    }
  };

  const handlePunch = async (action: 'IN' | 'OUT') => {
    if (!currentEmp) return;
    setPunchLoading(true);
    setPunchMessage(null);

    // Keka-style instant optimistic punch feedback
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const prevIsClockedIn = isClockedIn;
    const prevClockIn = clockInTime;
    const prevClockOut = clockOutTime;

    if (action === 'IN') {
      setIsClockedIn(true);
      setClockInTime(timeNow);
      setPunchMessage(`Clocked In at ${timeNow} (In Progress)`);
    } else {
      setIsClockedIn(false);
      setClockOutTime(timeNow);
      setPunchMessage(`Shift Complete (Punched Out at ${timeNow})`);
    }

    const now = new Date();
    const clientDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

    // Immediately unblock from localStorage deleted keys for this tenant
    try {
      const delKey = `${currentEmp.id}::${clientDate}`;
      const stored = localStorage.getItem(`hrms_deleted_att_${tenantSlug}`);
      if (stored) {
        const keys: string[] = JSON.parse(stored);
        localStorage.setItem(
          `hrms_deleted_att_${tenantSlug}`,
          JSON.stringify(keys.filter((k) => k !== delKey))
        );
      }
    } catch {
      // ignore
    }

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: currentEmp.id,
          action,
          notes: action === 'IN' ? 'Mobile Web Punch-In' : 'Mobile Web Punch-Out',
          clientTime: timeNow,
          clientDate,
          timezone: userTz
        })
      });

      const json = await res.json();
      if (json.success) {
        if (action === 'IN') {
          setPunchMessage(`Successfully punched IN at ${timeNow}.`);
        } else {
          setPunchMessage(`Successfully punched OUT at ${timeNow}. Have a great evening!`);
        }
        // Refresh attendance records
        await loadEmployeeDetails(currentEmp.id);
      } else {
        setIsClockedIn(prevIsClockedIn);
        setClockInTime(prevClockIn);
        setClockOutTime(prevClockOut);
        setPunchMessage(json.error || 'Failed to record punch.');
      }
    } catch (err) {
      setIsClockedIn(prevIsClockedIn);
      setClockInTime(prevClockIn);
      setClockOutTime(prevClockOut);
      setPunchMessage('Failed to record punch. Please check your network connection.');
    } finally {
      setPunchLoading(false);
      setTimeout(() => setPunchMessage(null), 5000);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmp) return;
    setLeaveSubmitting(true);
    setLeaveFeedback(null);

    try {
      const start = new Date(leaveStartDate);
      const end = new Date(leaveEndDate);
      if (end < start) {
        setLeaveFeedback({ type: 'error', message: 'End date cannot be earlier than start date.' });
        setLeaveSubmitting(false);
        return;
      }

      const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
      const targetLeaveTypeId = selectedLeaveTypeId || activeLeaveTypes[0]?.id;

      const res = await fetch(`/api/tenants/${tenantSlug}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: currentEmp.id,
          leaveTypeId: targetLeaveTypeId,
          startDate: leaveStartDate,
          endDate: leaveEndDate,
          totalDays: diffDays,
          reason: leaveReason
        })
      });

      const json = await res.json();
      if (json.success) {
        setLeaveReason('');
        setLeaveStartDate('');
        setLeaveEndDate('');
        setLeaveModalOpen(false);
        await loadEmployeeDetails(currentEmp.id);
      } else {
        setLeaveFeedback({ type: 'error', message: json.error || 'Failed to submit leave request.' });
      }
    } catch (err) {
      setLeaveFeedback({ type: 'error', message: 'Network error submitting leave request.' });
    } finally {
      setLeaveSubmitting(false);
    }
  };

  if (loading || !currentEmp) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-500">
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-700">Loading Employee Self-Service Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Top Banner / Persona Bar (Executive Light Theme) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold text-lg shadow-sm">
            {(user?.name || currentEmp.firstName).split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Welcome back, {currentEmp.firstName} {currentEmp.lastName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                Self-Service Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              <span className="font-semibold text-slate-700">{currentEmp.designationTitle}</span> &bull; {currentEmp.departmentName} &bull;{' '}
              <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                {currentEmp.employeeCode}
              </span>
            </p>
          </div>
        </div>

        {/* Switch persona widget for presentation (Admins & Managers) */}
        {isEmployeeOnly ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Self-Service Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Switch Employee View
              </span>
              <span className="text-xs text-slate-800 font-semibold">{tenant?.name || 'Goodwin Batteries'}</span>
            </div>
            <select
              value={selectedEmpId}
              onChange={(e) => handleSwitchEmployee(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer shadow-sm transition-colors"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Grid: Punch Clock & Leave Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Punch Clock Card */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Daily Punch & Shift</span>
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-medium">
                {activeShift?.name || currentEmp.shiftName || 'General Day Shift'}
              </span>
            </div>

            <div className="mt-4 text-center py-5 bg-slate-50/80 rounded-xl border border-slate-200/80">
              <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                {currentTime ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {currentTime ? currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : ''}
              </p>

              {/* Dynamic Punch Status Badge */}
              <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border">
                {isClockedIn ? (
                  <span className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 border-emerald-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Clocked In at {clockInTime || 'Just Now'}</span>
                  </span>
                ) : clockOutTime ? (
                  <span className="inline-flex items-center gap-2 text-blue-700 bg-blue-50 border-blue-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Shift Complete (Punched Out at {clockOutTime})</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-slate-600 bg-slate-100 border-slate-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    <span>Not Clocked In Today</span>
                  </span>
                )}
              </div>
            </div>

            {punchMessage && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium text-center animate-fade-in shadow-sm">
                {punchMessage}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isClockedIn || punchLoading || Boolean(clockOutTime)}
                onClick={() => handlePunch('IN')}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm disabled:opacity-40 disabled:hover:bg-emerald-600 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Punch In</span>
              </button>

              <button
                type="button"
                disabled={!isClockedIn || punchLoading}
                onClick={() => handlePunch('OUT')}
                className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-sm disabled:opacity-40 disabled:hover:bg-rose-600 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <Clock className="w-4 h-4" />
                <span>Punch Out</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 text-center font-medium">
              Shift: {activeShift ? `${activeShift.formattedStart} – ${activeShift.formattedEnd} • Grace Period: ${activeShift.graceMinutes} min` : '10:00 AM – 07:00 PM • Grace Period: 15 min'} &bull; Biometric auto-synced
            </div>

            <div className="pt-2 text-center border-t border-slate-100">
              <Link
                href={`/app/${tenantSlug}/attendance?tab=regularizations&action=request`}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Missed punch? Request Regularization</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Leave Balances Ledger */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Leave Balances & Quota
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Available annual leaves for {tenant?.financialYear || 'January - December'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setLeaveFeedback(null);
                  setLeaveModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Apply for Leave</span>
              </button>
            </div>

            {/* Dynamic Leave Types Balances */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activeLeaveTypes.map((lt) => {
                // Compute leaves consumed
                const takenDays = leaveApps
                  .filter(
                    (app) =>
                      (app.leaveTypeId === lt.id || app.leaveTypeName?.toLowerCase().includes(lt.code.toLowerCase())) &&
                      app.status !== 'REJECTED' &&
                      app.status !== 'CANCELLED'
                  )
                  .reduce((sum, app) => sum + (Number(app.totalDays) || 0), 0);

                const remainingDays = Math.max(0, lt.daysPerYear - takenDays);
                const percentLeft = Math.round((remainingDays / lt.daysPerYear) * 100);

                const badgeColor =
                  lt.code === 'CL' ? 'bg-blue-500' : lt.code === 'SL' ? 'bg-rose-500' : 'bg-emerald-500';

                return (
                  <div key={lt.id} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-700 font-semibold">{lt.name}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${badgeColor}`}></span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900 font-mono">{remainingDays}</span>
                      <span className="text-xs text-slate-500 font-medium">/ {lt.daysPerYear} days left</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${badgeColor}`}
                        style={{ width: `${percentLeft}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending or recent requests */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              My Recent Leave Requests
            </h3>
            {leaveApps.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500 font-medium">
                No leave requests filed yet this financial year.
              </div>
            ) : (
              <div className="space-y-2">
                {leaveApps.slice(0, 3).map((app) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{app.leaveTypeName}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {app.startDate} to {app.endDate} &bull; {app.totalDays} day(s) &bull;{' '}
                        <span className="text-slate-600 italic">"{app.reason}"</span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        app.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : app.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Recent Salary Slip, Announcements & Documents */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Latest Payslip Summary */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Latest Salary Slip</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              DISBURSED
            </span>
          </div>

          {payslips.length > 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Month:</span>
                  <div className="font-bold text-slate-900 text-sm">{payslips[0].month}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-medium">Net Take-Home:</span>
                  <div className="font-black text-emerald-700 text-base font-mono">
                    ₹{payslips[0].netPay.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 text-[11px] text-slate-600 font-medium">
                <div>Gross: ₹{payslips[0].grossSalary.toLocaleString()}</div>
                <div className="text-right">Deductions: ₹{payslips[0].totalDeductions.toLocaleString()}</div>
              </div>

              <button
                type="button"
                onClick={() => setViewingSlip(payslips[0])}
                className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>View / Download Payslip</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500 font-medium">
              No salary slips generated for current cycle.
            </div>
          )}
        </div>

        {/* Company Announcements & Safety Bulletin */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-amber-600" />
              <span>Goodwin Fleet Bulletin</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">Live Updates</span>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mb-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Fleet Safety SOP v4.2 Mandatory Review</span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                All production, testing and field delivery personnel must verify battery discharge limits.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-0.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Diwali Festival Advance Disbursed</span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                Festival advance credited along with biometric attendance regularization.
              </p>
            </div>
          </div>
        </div>

        {/* Document Vault & Compliance */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>My Compliance Vault</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">{documents.length} Files</span>
          </div>

          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-slate-900 truncate">{doc.title}</div>
                    <div className="text-[10px] text-slate-500 font-medium">{doc.fileName} &bull; {doc.fileSize}</div>
                  </div>
                  <button
                    onClick={() => alert(`Downloading ${doc.fileName}`)}
                    className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500 font-medium">
              No compliance files uploaded yet.
            </div>
          )}
        </div>
      </div>

      {/* Apply Leave Modal (Light Theme) */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                Apply for Time-Off
              </h3>
              <button
                type="button"
                onClick={() => setLeaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {leaveFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  leaveFeedback.type === 'error'
                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                }`}
              >
                {leaveFeedback.message}
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Leave Category *</label>
                <select
                  required
                  value={selectedLeaveTypeId}
                  onChange={(e) => setSelectedLeaveTypeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer shadow-sm"
                >
                  {activeLeaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} ({lt.daysPerYear} days/yr quota)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Leave *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Family function / Medical consultation"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-sm"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLeaveModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={leaveSubmitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {leaveSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip View Modal (Light Theme) */}
      {viewingSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{tenant?.name || 'Goodwin Batteries Pvt Ltd'}</h3>
                  <p className="text-xs text-slate-500 font-medium">Salary Slip for {viewingSlip.month}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingSlip(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs grid grid-cols-2 gap-2 text-slate-700 font-medium">
              <div><span className="text-slate-500">Employee:</span> <span className="font-bold text-slate-900">{viewingSlip.employeeName}</span></div>
              <div><span className="text-slate-500">Code:</span> <span className="font-mono font-semibold">{viewingSlip.employeeCode}</span></div>
              <div><span className="text-slate-500">Department:</span> {viewingSlip.departmentName}</div>
              <div><span className="text-slate-500">Payment Status:</span> <span className="text-emerald-700 font-bold">DISBURSED</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="font-bold text-slate-600 uppercase tracking-wider pb-1 border-b border-slate-200">
                  Earnings
                </div>
                <div className="flex justify-between text-slate-700"><span>Basic Pay</span> <span className="font-mono font-semibold">₹{viewingSlip.basicPay.toLocaleString()}</span></div>
                <div className="flex justify-between text-slate-700"><span>HRA</span> <span className="font-mono font-semibold">₹{viewingSlip.hra.toLocaleString()}</span></div>
                <div className="flex justify-between text-slate-700"><span>Special Allowance</span> <span className="font-mono font-semibold">₹{viewingSlip.specialAllowance.toLocaleString()}</span></div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-extrabold text-slate-900">
                  <span>Gross Earnings</span> <span className="font-mono">₹{viewingSlip.grossSalary.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-600 uppercase tracking-wider pb-1 border-b border-slate-200">
                  Deductions
                </div>
                <div className="flex justify-between text-slate-700"><span>PF</span> <span className="font-mono font-semibold">₹{viewingSlip.providentFund.toLocaleString()}</span></div>
                <div className="flex justify-between text-slate-700"><span>PT</span> <span className="font-mono font-semibold">₹{viewingSlip.professionalTax.toLocaleString()}</span></div>
                <div className="flex justify-between text-slate-700"><span>TDS / Tax</span> <span className="font-mono font-semibold">₹{viewingSlip.taxDeduction.toLocaleString()}</span></div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-extrabold text-rose-600">
                  <span>Total Deductions</span> <span className="font-mono">₹{viewingSlip.totalDeductions.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 font-bold">Net Take-Home Disbursed</span>
                <p className="text-[10px] text-slate-500 font-medium">Bank transfer processed</p>
              </div>
              <div className="text-xl font-black text-emerald-700 font-mono">
                ₹{viewingSlip.netPay.toLocaleString()}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setViewingSlip(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => alert('Printing / PDF export')}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
