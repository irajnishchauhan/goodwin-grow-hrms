'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Calendar,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  X,
  ShieldCheck,
  User,
  Sparkles
} from 'lucide-react';
import { LeaveApplication, LeaveType, Employee, Tenant } from '@/lib/types';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import HolidayCalendarManager from '@/components/HolidayCalendarManager';

export default function TenantLeavesPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { user, isEmployeeOnly, isManager } = useCurrentUser(tenantSlug);

  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'applications' | 'policies' | 'holidays'>('applications');

  // Apply Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [employeeId, setEmployeeId] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalDays, setTotalDays] = useState(1);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<'FIRST_HALF' | 'SECOND_HALF'>('FIRST_HALF');
  const [reason, setReason] = useState('');

  const fetchLeaveData = async () => {
    try {
      const [res, empRes] = await Promise.all([
        fetch(`/api/tenants/${tenantSlug}/leaves?t=${Date.now()}`, {
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
        setApplications(json.data.applications || []);
        setLeaveTypes(json.data.leaveTypes || []);
        if (json.data.leaveTypes?.length > 0 && !leaveTypeId) {
          setLeaveTypeId(json.data.leaveTypes[0].id);
        }
      }

      if (empJson.success) {
        const emps: Employee[] = empJson.data.employees || [];
        setEmployees(emps);
        setTenant(empJson.data.tenant);
        if (emps.length > 0) {
          let targetEmp: Employee | undefined;
          if (user) {
            targetEmp = emps.find(
              (e) =>
                (user.email && e.workEmail.toLowerCase() === user.email.toLowerCase()) ||
                (user.name && `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase()) ||
                (user.name && e.firstName.toLowerCase() === user.name.toLowerCase().split(' ')[0])
            );
          }
          if (!targetEmp) targetEmp = emps[0];
          setEmployeeId(targetEmp.id);
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
      fetchLeaveData();
    }
  }, [tenantSlug]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const finalEndDate = isHalfDay ? startDate : endDate;
      const finalTotalDays = isHalfDay ? 0.5 : Number(totalDays);

      const res = await fetch(`/api/tenants/${tenantSlug}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          leaveTypeId,
          startDate,
          endDate: finalEndDate,
          totalDays: finalTotalDays,
          isHalfDay,
          halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
          reason
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit leave');
      }

      setModalOpen(false);
      setReason('');
      setIsHalfDay(false);
      fetchLeaveData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error submitting leave');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/leaves`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveId,
          status,
          reviewedBy: isManager ? 'Reporting Manager' : 'HR Admin',
          comment: status === 'APPROVED' ? 'Approved by HR & logged to attendance roster' : 'Declined due to team capacity'
        })
      });
      const json = await res.json();
      if (json.success) {
        fetchLeaveData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Matched employee for current user
  const currentEmp = employees.find(
    (e) =>
      user &&
      ((user.email && e.workEmail.toLowerCase() === user.email.toLowerCase()) ||
        (user.name && `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase()) ||
        (user.name && e.firstName.toLowerCase() === user.name.toLowerCase().split(' ')[0]))
  );

  const visibleApplications = isEmployeeOnly
    ? applications.filter((app) => {
        if (currentEmp && app.employeeId === currentEmp.id) return true;
        if (!user) return true;
        const firstName = user.name.toLowerCase().split(' ')[0];
        return Boolean(app.employeeName?.toLowerCase().includes(firstName));
      })
    : applications;

  // Compute leave balance for the active/selected employee
  const activeEmployeeForBalances = isEmployeeOnly
    ? currentEmp
    : employees.find((e) => e.id === employeeId) || employees[0];

  const getLeaveBalances = (ltId: string, quota: number) => {
    if (!activeEmployeeForBalances) {
      return { quota, used: 0, pending: 0, available: quota };
    }
    const empApps = applications.filter(
      (a) => a.employeeId === activeEmployeeForBalances.id && a.leaveTypeId === ltId
    );
    const used = empApps
      .filter((a) => a.status === 'APPROVED')
      .reduce((sum, a) => sum + (Number(a.totalDays) || 0), 0);
    const pending = empApps
      .filter((a) => a.status === 'PENDING')
      .reduce((sum, a) => sum + (Number(a.totalDays) || 0), 0);
    const available = Math.max(0, quota - used - pending);
    return { quota, used, pending, available };
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            {isEmployeeOnly ? 'My Leave Applications & Entitlements' : 'Leave Management & Approvals'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isEmployeeOnly
              ? `Track your annual leave balances, apply for time-off, and check review status (${user?.name || 'Employee'})`
              : `Leave policies, quota balances, and multi-tier approval workflow for ${tenant?.name || 'Workspace'}`}
          </p>
        </div>

        <button
          onClick={() => {
            if (employees.length > 0 && !employeeId) setEmployeeId(employees[0].id);
            if (leaveTypes.length > 0 && !leaveTypeId) setLeaveTypeId(leaveTypes[0].id);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Apply For Leave</span>
        </button>
      </div>

      {/* Leave Tracking Balance Cards (Available, Used, Pending) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Leave Balances &amp; Quotas</span>
            {activeEmployeeForBalances && (
              <span className="text-[11px] font-normal text-slate-500">
                (for {activeEmployeeForBalances.firstName} {activeEmployeeForBalances.lastName})
              </span>
            )}
          </div>
          {!isEmployeeOnly && employees.length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Filter by Employee:</span>
              <select
                value={activeEmployeeForBalances?.id || ''}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {leaveTypes.map((lt) => {
            const bal = getLeaveBalances(lt.id, lt.daysPerYear);
            const usedPct = bal.quota > 0 ? Math.min(100, Math.round((bal.used / bal.quota) * 100)) : 0;
            const pendingPct = bal.quota > 0 ? Math.min(100, Math.round((bal.pending / bal.quota) * 100)) : 0;

            return (
              <div
                key={lt.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{lt.name}</span>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {lt.code}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">
                      {bal.available}
                      <span className="text-xs font-semibold text-slate-500 ml-1">Days Left</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Available of {bal.quota} days annual quota
                    </div>
                  </div>
                </div>

                {/* Multi-segmented Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${usedPct}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`Used: ${bal.used} days`}
                    />
                    <div
                      style={{ width: `${pendingPct}%` }}
                      className="bg-amber-400 h-full transition-all"
                      title={`Pending: ${bal.pending} days`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Used: <strong className="text-slate-700">{bal.used}d</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                      Pending: <strong className="text-slate-700">{bal.pending}d</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-200 inline-block" />
                      Avail: <strong className="text-emerald-700">{bal.available}d</strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeTab === 'applications'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Leave Requests &amp; Approvals</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
            {visibleApplications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('policies')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeTab === 'policies'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Leave Policies</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
            {leaveTypes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('holidays')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer ${
            activeTab === 'holidays'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Holiday Calendar</span>
        </button>
      </div>

      {/* Tab: Holiday Calendar */}
      {activeTab === 'holidays' && (
        <HolidayCalendarManager tenantSlug={tenantSlug} canManage={!isEmployeeOnly} />
      )}

      {/* Tab: Leave Policies */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {leaveTypes.map((lt) => (
              <div key={lt.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{lt.name}</span>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {lt.code}
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-emerald-700">{lt.daysPerYear} Days</div>
                <p className="text-[11px] text-slate-500 font-medium">Annual quota allocated to full-time staff.</p>
                <div className="pt-2 text-[11px] text-slate-600 space-y-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span>Half-day eligible:</span>
                    <span className="font-semibold text-emerald-600">Yes (0.5 day deduction)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Carry forward:</span>
                    <span className="font-semibold text-slate-700">Up to 5 days</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Leave Applications & Approvals */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          {/* Leave Applications Table */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {isEmployeeOnly ? 'My Leave Requests' : 'Leave Requests & Approvals'}
              </h3>
              <span className="text-xs text-slate-500 font-medium">{visibleApplications.length} Request(s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 uppercase font-semibold text-[10px] text-slate-500 tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Employee</th>
                    <th className="px-6 py-3.5">Leave Type</th>
                    <th className="px-6 py-3.5">Leave Duration / Period</th>
                    <th className="px-6 py-3.5">Quota Deduction</th>
                    <th className="px-6 py-3.5">Reason</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">{isEmployeeOnly ? 'Review Remarks' : 'HR Review'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {visibleApplications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500 text-xs">
                        {isEmployeeOnly
                          ? 'You have no submitted leave applications on record.'
                          : 'No leave applications found for this tenant workspace.'}
                      </td>
                    </tr>
                  ) : (
                    visibleApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{app.employeeName}</td>
                        <td className="px-6 py-4 font-medium text-slate-700">{app.leaveTypeName}</td>
                        <td className="px-6 py-4">
                          {app.isHalfDay ? (
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-slate-800 font-semibold">{app.startDate}</span>
                              <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                {app.halfDayPeriod === 'FIRST_HALF'
                                  ? '1st Half (Morning 9:30 - 14:00)'
                                  : '2nd Half (Afternoon 14:00 - 18:30)'}
                              </span>
                            </div>
                          ) : (
                            <span className="font-mono text-slate-600 font-medium">
                              {app.startDate} {app.startDate !== app.endDate ? `→ ${app.endDate}` : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-700">
                          {app.totalDays === 0.5 ? '0.5 Day (Half Day)' : `${app.totalDays} Day(s)`}
                        </td>
                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate italic">
                          &ldquo;{app.reason}&rdquo;
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              app.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : app.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isEmployeeOnly ? (
                            <span className="text-[11px] text-slate-500 italic">
                              {app.reviewComment || (app.status === 'PENDING' ? 'Under Review' : 'Processed')}
                            </span>
                          ) : app.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleStatusUpdate(app.id, 'APPROVED')}
                                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-xs cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Approve
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(app.id, 'REJECTED')}
                                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px] cursor-pointer"
                              >
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-medium">{app.reviewedBy || 'Decided'}</span>
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

      {/* Apply Leave Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Submit Leave Request</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">{error}</div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Applying Employee *</label>
                {isEmployeeOnly ? (
                  <div className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-800 font-semibold">
                    {user?.name || 'Self'}
                  </div>
                ) : (
                  <select
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} ({e.employeeCode})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Leave Category *</label>
                <select
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} ({lt.daysPerYear} days/yr quota)
                    </option>
                  ))}
                </select>
              </div>

              {/* Day Option: Full Day vs Half Day */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Leave Duration Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsHalfDay(false);
                      setTotalDays(1);
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      !isHalfDay
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-800 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Full Day(s)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsHalfDay(true);
                      setTotalDays(0.5);
                      if (startDate) setEndDate(startDate);
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      isHalfDay
                        ? 'border-purple-600 bg-purple-50/70 text-purple-800 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Half Day (0.5 Day)
                  </button>
                </div>
              </div>

              {/* If Half Day: Show Half Day Session Selector */}
              {isHalfDay && (
                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2">
                  <label className="block font-bold text-purple-900">Select Half-Day Session *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={`flex flex-col p-2.5 rounded-xl border cursor-pointer text-left transition-all ${
                        halfDayPeriod === 'FIRST_HALF'
                          ? 'border-purple-600 bg-white text-purple-900 shadow-xs ring-1 ring-purple-500'
                          : 'border-purple-200 bg-white/60 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <input
                          type="radio"
                          name="halfDayPeriod"
                          value="FIRST_HALF"
                          checked={halfDayPeriod === 'FIRST_HALF'}
                          onChange={() => setHalfDayPeriod('FIRST_HALF')}
                          className="text-purple-600"
                        />
                        <span>First Half (Morning)</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 pl-4">
                        09:30 AM &ndash; 02:00 PM (Work 2nd Half)
                      </span>
                    </label>

                    <label
                      className={`flex flex-col p-2.5 rounded-xl border cursor-pointer text-left transition-all ${
                        halfDayPeriod === 'SECOND_HALF'
                          ? 'border-purple-600 bg-white text-purple-900 shadow-xs ring-1 ring-purple-500'
                          : 'border-purple-200 bg-white/60 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <input
                          type="radio"
                          name="halfDayPeriod"
                          value="SECOND_HALF"
                          checked={halfDayPeriod === 'SECOND_HALF'}
                          onChange={() => setHalfDayPeriod('SECOND_HALF')}
                          className="text-purple-600"
                        />
                        <span>Second Half (Afternoon)</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 pl-4">
                        02:00 PM &ndash; 06:30 PM (Work 1st Half)
                      </span>
                    </label>
                  </div>
                  <p className="text-[10px] text-purple-700 font-medium">
                    Note: Links directly to attendance roster and deducts <strong>0.5 days</strong> from your leave quota.
                  </p>
                </div>
              )}

              {/* Date Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isHalfDay ? 'Leave Date *' : 'Start Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (isHalfDay) setEndDate(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isHalfDay ? 'End Date (Locked) *' : 'End Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    disabled={isHalfDay}
                    value={isHalfDay ? startDate : endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                      isHalfDay ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>

              {!isHalfDay && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Days Requested *</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={totalDays}
                    onChange={(e) => setTotalDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Leave *</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please state the purpose of leave..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : isHalfDay ? 'Apply for Half-Day (0.5)' : 'Submit Leave Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
