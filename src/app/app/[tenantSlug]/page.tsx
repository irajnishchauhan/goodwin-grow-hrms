'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Users,
  Clock,
  Calendar,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  Square,
  Sparkles,
  TrendingUp,
  Building2
} from 'lucide-react';
import { Tenant, Employee, LeaveApplication, AttendanceRecord, SalarySlip } from '@/lib/types';

export default function TenantOverviewPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchMessage, setPunchMessage] = useState<string | null>(null);

  const fetchWorkspaceData = async () => {
    try {
      // 1. Fetch employees
      const empRes = await fetch(`/api/tenants/${tenantSlug}/employees`);
      const empJson = await empRes.json();
      if (empJson.success) {
        setTenant(empJson.data.tenant);
        setEmployees(empJson.data.employees);
      }

      // 2. Fetch leaves
      const leaveRes = await fetch(`/api/tenants/${tenantSlug}/leaves`);
      const leaveJson = await leaveRes.json();
      if (leaveJson.success) {
        setLeaves(leaveJson.data.applications);
      }

      // 3. Fetch attendance
      const attRes = await fetch(`/api/tenants/${tenantSlug}/attendance`);
      const attJson = await attRes.json();
      if (attJson.success) {
        setAttendance(attJson.data.records);
      }

      // 4. Fetch payroll
      const payRes = await fetch(`/api/tenants/${tenantSlug}/payroll`);
      const payJson = await payRes.json();
      if (payJson.success) {
        setSlips(payJson.data.slips);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchWorkspaceData();
    }
  }, [tenantSlug]);

  const handlePunch = async (action: 'IN' | 'OUT') => {
    if (!employees.length) return;
    setPunchLoading(true);
    setPunchMessage(null);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employees[0].id, // Admin's own employee record
          action,
          notes: 'Executive Web Punch-In'
        })
      });
      const json = await res.json();
      if (json.success) {
        setPunchMessage(json.message);
        fetchWorkspaceData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPunchLoading(false);
    }
  };

  const handleLeaveAction = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/leaves`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveId,
          status,
          reviewedBy: 'HR Director',
          comment: status === 'APPROVED' ? 'Approved by HR Director' : 'Declined due to scheduling'
        })
      });
      const json = await res.json();
      if (json.success) {
        fetchWorkspaceData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const pendingLeaves = leaves.filter((l) => l.status === 'PENDING');
  const presentCount = attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE_ENTRY').length;
  const totalPayroll = slips.reduce((sum, s) => sum + s.netPay, 0);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {tenant?.name || 'Client Workspace'}
            </h1>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Active Workspace
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Human Resource Management, Attendance, Leave Approvals and Statutory Payroll
          </p>
        </div>

        {/* Web Punch Card */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-md">
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">Web Attendance Punch</div>
            <div className="text-xs font-bold text-white mt-0.5">
              {employees[0] ? `${employees[0].firstName} ${employees[0].lastName}` : 'Administrator'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePunch('IN')}
              disabled={punchLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Clock In</span>
            </button>
            <button
              onClick={() => handlePunch('OUT')}
              disabled={punchLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all disabled:opacity-50"
            >
              <Square className="w-3 h-3 fill-slate-300" />
              <span>Clock Out</span>
            </button>
          </div>
        </div>
      </div>

      {punchMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
          <span>✓ {punchMessage}</span>
          <button onClick={() => setPunchMessage(null)} className="text-emerald-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href={`/app/${tenantSlug}/employees`}
          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium uppercase tracking-wider">Total Headcount</span>
            <Users className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{employees.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Cap: {tenant?.maxEmployees || 100} seats</p>
        </Link>

        <Link
          href={`/app/${tenantSlug}/attendance`}
          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium uppercase tracking-wider">Present Today</span>
            <Clock className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{presentCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">{attendance.length} total logs today</p>
        </Link>

        <Link
          href={`/app/${tenantSlug}/leaves`}
          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Leaves</span>
            <Calendar className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">{pendingLeaves.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting HR manager signoff</p>
        </Link>

        <Link
          href={`/app/${tenantSlug}/payroll`}
          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium uppercase tracking-wider">October Payroll</span>
            <CreditCard className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {tenant?.currency} {totalPayroll.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">{slips.length} salary slips generated</p>
        </Link>
      </div>

      {/* Two Column Layout: Actionable Pending Leaves & Recent Workforce */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Pending Leave Applications
            </h2>
            <Link
              href={`/app/${tenantSlug}/leaves`}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              View All
            </Link>
          </div>

          {pendingLeaves.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              ✓ No pending leave requests for this company.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white">{app.employeeName}</div>
                      <div className="text-slate-400 text-[11px]">{app.leaveTypeName}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {app.totalDays} Day{app.totalDays > 1 ? 's' : ''}
                    </span>
                  </div>

                  <p className="text-slate-300 italic bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px]">
                    &ldquo;{app.reason}&rdquo;
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">
                      {app.startDate} to {app.endDate}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLeaveAction(app.id, 'APPROVED')}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px]"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Approve
                      </button>
                      <button
                        onClick={() => handleLeaveAction(app.id, 'REJECTED')}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold text-[11px]"
                      >
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Company Employees Directory Preview */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Company Workforce
            </h2>
            <Link
              href={`/app/${tenantSlug}/employees`}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              Directory &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400 text-xs">
                    {emp.firstName.slice(0, 1)}
                    {emp.lastName.slice(0, 1)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {emp.firstName} {emp.lastName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {emp.designationTitle} • {emp.departmentName}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-emerald-400 font-semibold">{emp.employeeCode}</div>
                  <div className="text-[10px] text-slate-400">{emp.employmentType}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
