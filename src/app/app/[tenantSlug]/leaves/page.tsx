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
      const res = await fetch(`/api/tenants/${tenantSlug}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          leaveTypeId,
          startDate,
          endDate,
          totalDays: Number(totalDays),
          reason
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit leave');
      }

      setModalOpen(false);
      setReason('');
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
          reviewedBy: 'HR Director',
          comment: status === 'APPROVED' ? 'Approved by HR Director' : 'Declined due to team capacity'
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

  const visibleApplications = isEmployeeOnly
    ? applications.filter((app) => {
        if (!user) return true;
        const firstName = user.name.toLowerCase().split(' ')[0];
        return Boolean(app.employeeName?.toLowerCase().includes(firstName));
      })
    : applications;

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
          <span>Leave Requests & Approvals</span>
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
          <span>Leave Entitlement Quotas</span>
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

      {/* Tab: Leave Entitlement Quotas */}
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
                <p className="text-[11px] text-slate-500 font-medium">Annual entitlement per employee (Paid)</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Leave Applications & Approvals */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
      {/* Leave Type Policies */}
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
            <p className="text-[11px] text-slate-500 font-medium">Annual entitlement per employee (Paid)</p>
          </div>
        ))}
      </div>

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
                <th className="px-6 py-3.5">Duration</th>
                <th className="px-6 py-3.5">Days</th>
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
                    <td className="px-6 py-4 font-mono text-slate-500">
                      {app.startDate} &rarr; {app.endDate}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-700">{app.totalDays} Days</td>
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
                      {lt.name} ({lt.daysPerYear} days/yr)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Total Days Requested *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={totalDays}
                  onChange={(e) => setTotalDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

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
                  className="px-5 py-2 font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Leave Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
