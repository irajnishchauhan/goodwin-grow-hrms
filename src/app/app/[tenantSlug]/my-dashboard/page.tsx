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
  
  // Punch Clock State
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchMessage, setPunchMessage] = useState<string | null>(null);

  // Apply Leave Modal State
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState('');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  // Payslip Modal State
  const [viewingSlip, setViewingSlip] = useState<SalarySlip | null>(null);

  // Fetch all initial data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const empRes = await fetch(`/api/tenants/${tenantSlug}/employees`);
      const empJson = await empRes.json();
      
      if (empJson.success) {
        setTenant(empJson.data.tenant);
        const emps: Employee[] = empJson.data.employees;
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
            tenantId: tenant?.id || 'tenant-goodwin-batteries-fleet',
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
            workLocation: 'Bangalore Headquarters',
            shiftName: 'General Factory Shift',
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
      // 1. Fetch attendance records
      const attRes = await fetch(`/api/tenants/${tenantSlug}/attendance`);
      const attJson = await attRes.json();
      if (attJson.success) {
        const today = new Date().toISOString().split('T')[0];
        const todayRec = attJson.data.records.find(
          (r: any) => r.employeeId === empId && r.date === today
        );
        if (todayRec) {
          setIsClockedIn(true);
          setClockInTime(todayRec.clockInTime);
          setClockOutTime(todayRec.clockOutTime || null);
        } else {
          // Default demo clocked in status
          setIsClockedIn(true);
          setClockInTime('09:02 AM');
          setClockOutTime(null);
        }
      }

      // 2. Fetch leaves
      const leavesRes = await fetch(`/api/tenants/${tenantSlug}/leaves`);
      const leavesJson = await leavesRes.json();
      if (leavesJson.success) {
        setLeaveTypes(leavesJson.data.leaveTypes || []);
        if (leavesJson.data.leaveTypes?.length > 0 && !selectedLeaveTypeId) {
          setSelectedLeaveTypeId(leavesJson.data.leaveTypes[0].id);
        }
        setLeaveApps(
          (leavesJson.data.applications || []).filter((a: LeaveApplication) => a.employeeId === empId)
        );
      }

      // 3. Fetch payslips
      const payRes = await fetch(`/api/tenants/${tenantSlug}/payroll`);
      const payJson = await payRes.json();
      if (payJson.success) {
        const empSlips = (payJson.data.slips || []).filter((s: SalarySlip) => s.employeeId === empId);
        setPayslips(empSlips);
      }

      // 4. Fetch documents
      const docRes = await fetch(`/api/tenants/${tenantSlug}/documents?employeeId=${empId}`);
      const docJson = await docRes.json();
      if (docJson.success) {
        setDocuments(docJson.data.documents || []);
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
        if (action === 'IN') {
          setIsClockedIn(true);
          setClockInTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          setPunchMessage('Successfully punched IN for your shift.');
        } else {
          setIsClockedIn(false);
          setClockOutTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          setPunchMessage('Successfully punched OUT. Have a great evening!');
        }
      }
    } catch (err) {
      setPunchMessage('Failed to record punch.');
    } finally {
      setPunchLoading(false);
      setTimeout(() => setPunchMessage(null), 4000);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmp) return;
    setLeaveSubmitting(true);

    try {
      const start = new Date(leaveStartDate);
      const end = new Date(leaveEndDate);
      const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

      const res = await fetch(`/api/tenants/${tenantSlug}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: currentEmp.id,
          leaveTypeId: selectedLeaveTypeId,
          startDate: leaveStartDate,
          endDate: leaveEndDate,
          totalDays: diffDays,
          reason: leaveReason
        })
      });

      const json = await res.json();
      if (json.success) {
        setLeaveModalOpen(false);
        setLeaveReason('');
        setLeaveStartDate('');
        setLeaveEndDate('');
        await loadEmployeeDetails(currentEmp.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLeaveSubmitting(false);
    }
  };

  if (loading || !currentEmp) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Loading Employee Self-Service Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Top Banner / Persona Bar */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg shadow-inner">
            {(user?.name || currentEmp.firstName).split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-white">
                Welcome back, {user?.name || `${currentEmp.firstName} ${currentEmp.lastName}`}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                Self-Service Portal
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentEmp.designationTitle} &bull; {currentEmp.departmentName} &bull;{' '}
              <span className="font-mono text-slate-300">{currentEmp.employeeCode}</span>
            </p>
          </div>
        </div>

        {/* Switch persona widget for presentation (Admins & Managers only) */}
        {isEmployeeOnly ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Self-Service Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Switch Employee View
              </span>
              <span className="text-xs text-slate-300 font-mono">Goodwin Batteries</span>
            </div>
            <select
              value={selectedEmpId}
              onChange={(e) => handleSwitchEmployee(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
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
        <div className="lg:col-span-1 p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Daily Punch & Shift</span>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                {currentEmp.shiftName || 'General Factory Shift'}
              </span>
            </div>

            <div className="mt-4 text-center py-5 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>

              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{isClockedIn ? `Clocked In at ${clockInTime || '09:02 AM'}` : 'Not Clocked In'}</span>
              </div>
            </div>

            {punchMessage && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs text-center animate-fade-in">
                {punchMessage}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isClockedIn || punchLoading}
                onClick={() => handlePunch('IN')}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-900/30 disabled:opacity-40 disabled:hover:bg-emerald-600 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Punch In</span>
              </button>

              <button
                type="button"
                disabled={!isClockedIn || punchLoading}
                onClick={() => handlePunch('OUT')}
                className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-rose-900/30 disabled:opacity-40 disabled:hover:bg-rose-600 flex items-center justify-center gap-1.5"
              >
                <Clock className="w-4 h-4" />
                <span>Punch Out</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 text-center">
              Shift: 09:00 AM – 06:00 PM &bull; Grace Period: 15 min &bull; Biometric auto-synced
            </div>
          </div>
        </div>

        {/* Leave Balances Ledger */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Leave Balances & Quota
                </h2>
                <p className="text-xs text-slate-400">Available annual leaves for {tenant?.financialYear || 'FY 2026-27'}</p>
              </div>

              <button
                onClick={() => setLeaveModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all shadow-md shadow-amber-900/30 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Apply for Leave</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Casual Leave (CL)</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white">10</span>
                  <span className="text-xs text-slate-500">/ 12 days left</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[83%] rounded-full"></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Sick / Medical (SL)</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white">8</span>
                  <span className="text-xs text-slate-500">/ 10 days left</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full w-[80%] rounded-full"></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Privilege Leave (PL)</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white">18</span>
                  <span className="text-xs text-slate-500">/ 18 days left</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[100%] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Pending or recent requests */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              My Recent Leave Requests
            </h3>
            {leaveApps.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/50 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                No leave requests filed yet this financial year.
              </div>
            ) : (
              <div className="space-y-2">
                {leaveApps.slice(0, 2).map((app) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">{app.leaveTypeName}</div>
                      <div className="text-slate-400 text-[11px]">
                        {app.startDate} to {app.endDate} &bull; {app.totalDays} day(s) &bull;{' '}
                        <span className="text-slate-500 italic">"{app.reason}"</span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        app.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : app.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
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
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Latest Salary Slip</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              DISBURSED
            </span>
          </div>

          {payslips.length > 0 ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Month:</span>
                  <div className="font-bold text-white text-sm">{payslips[0].month}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Net Take-Home:</span>
                  <div className="font-black text-emerald-400 text-base font-mono">
                    ₹{payslips[0].netPay.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 grid grid-cols-2 text-[11px] text-slate-400">
                <div>Gross: ₹{payslips[0].grossSalary.toLocaleString()}</div>
                <div className="text-right">Deductions: ₹{payslips[0].totalDeductions.toLocaleString()}</div>
              </div>

              <button
                type="button"
                onClick={() => setViewingSlip(payslips[0])}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>View / Download Payslip</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-xs text-slate-500">
              No salary slips generated for current cycle.
            </div>
          )}
        </div>

        {/* Company Announcements & Safety Bulletin */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-amber-400" />
              <span>Goodwin Factory Bulletin</span>
            </h3>
            <span className="text-[10px] text-slate-500">Live Updates</span>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Lithium Safety SOP v4.2 Mandatory Review</span>
              </div>
              <p className="text-[11px] text-slate-400">
                All production and BMS cell testing personnel must wear anti-static footwear in Bay 3.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-0.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Diwali Bonus & Advance Disbursed</span>
              </div>
              <p className="text-[11px] text-slate-400">
                October festival bonus credited along with biometric attendance regularization.
              </p>
            </div>
          </div>
        </div>

        {/* Document Vault & Compliance */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>My Compliance Vault</span>
            </h3>
            <span className="text-[10px] text-slate-500">{documents.length} Files</span>
          </div>

          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-slate-200 truncate">{doc.title}</div>
                    <div className="text-[10px] text-slate-500">{doc.fileName} &bull; {doc.fileSize}</div>
                  </div>
                  <button
                    onClick={() => alert(`Simulating secure download for ${doc.fileName}`)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-xs text-slate-500">
              No compliance files uploaded yet.
            </div>
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Apply for Time-Off
              </h3>
              <button
                onClick={() => setLeaveModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Leave Category *</label>
                <select
                  required
                  value={selectedLeaveTypeId}
                  onChange={(e) => setSelectedLeaveTypeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                >
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} ({lt.daysPerYear} days/yr)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Leave *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Family function / Medical consultation"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLeaveModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={leaveSubmitting}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-md shadow-amber-900/30 disabled:opacity-50"
                >
                  {leaveSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip View Modal */}
      {viewingSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Goodwin Batteries Pvt Ltd</h3>
                  <p className="text-xs text-slate-400">Salary Slip for {viewingSlip.month}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingSlip(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 text-xs grid grid-cols-2 gap-2 text-slate-300">
              <div><span className="text-slate-500">Employee:</span> {viewingSlip.employeeName}</div>
              <div><span className="text-slate-500">Code:</span> {viewingSlip.employeeCode}</div>
              <div><span className="text-slate-500">Department:</span> {viewingSlip.departmentName}</div>
              <div><span className="text-slate-500">Payment Status:</span> <span className="text-emerald-400 font-semibold">DISBURSED</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                  Earnings
                </div>
                <div className="flex justify-between"><span>Basic Pay</span> <span className="font-mono">₹{viewingSlip.basicPay.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>House Rent Allowance</span> <span className="font-mono">₹{viewingSlip.hra.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Special Allowance</span> <span className="font-mono">₹{viewingSlip.specialAllowance.toLocaleString()}</span></div>
                <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-white">
                  <span>Gross Earnings</span> <span className="font-mono">₹{viewingSlip.grossSalary.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                  Deductions
                </div>
                <div className="flex justify-between"><span>Provident Fund (PF)</span> <span className="font-mono">₹{viewingSlip.providentFund.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Professional Tax (PT)</span> <span className="font-mono">₹{viewingSlip.professionalTax.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>TDS / Income Tax</span> <span className="font-mono">₹{viewingSlip.taxDeduction.toLocaleString()}</span></div>
                <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-rose-400">
                  <span>Total Deductions</span> <span className="font-mono">₹{viewingSlip.totalDeductions.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-300">Net Take-Home Disbursed</span>
                <p className="text-[10px] text-slate-400">Credited directly to Axis Bank A/C</p>
              </div>
              <div className="text-xl font-black text-emerald-400 font-mono">
                ₹{viewingSlip.netPay.toLocaleString()}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setViewingSlip(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => alert('Printing / PDF export simulated')}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
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
