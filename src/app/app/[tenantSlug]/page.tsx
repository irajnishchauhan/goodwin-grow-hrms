'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import RoleGuard from '@/components/RoleGuard';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import {
  Users,
  Clock,
  Calendar,
  CreditCard,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  Plus,
  UserPlus
} from 'lucide-react';
import { Tenant, Employee, LeaveApplication, AttendanceRecord, SalarySlip } from '@/lib/types';

export default function TenantOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { isEmployeeOnly } = useCurrentUser(tenantSlug);

  useEffect(() => {
    if (isEmployeeOnly) {
      router.replace(`/app/${tenantSlug}/my-dashboard`);
    }
  }, [isEmployeeOnly, tenantSlug, router]);

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [loading, setLoading] = useState(true);

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
    <RoleGuard
      tenantSlug={tenantSlug}
      requiredRoles={['COMPANY_ADMIN', 'SUPER_ADMIN']}
      moduleName="Executive Overview Dashboard"
    >
      <div className="space-y-8 max-w-6xl">
        {/* Workspace Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {tenant?.name || 'Client Workspace'}
              </h1>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active Workspace
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Human Resource Management, Attendance, Leave Approvals and Statutory Payroll
            </p>
          </div>

          {/* Admin Quick Action Shortcuts */}
          <div className="flex items-center gap-2">
            <Link
              href={`/app/${tenantSlug}/invitations`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-all hover:border-slate-300"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Invite Credentials</span>
            </Link>
            <Link
              href={`/app/${tenantSlug}/attendance`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Live Attendance</span>
            </Link>
          </div>
        </div>

        {employees.length === 0 && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-white border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Welcome to Your Company Workspace, Owner!</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-semibold">Fresh Workspace</span>
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  All mock data has been cleared. You are in full control as Company Owner. Launch the Setup Wizard to configure departments, shifts, leave policies, and import your workforce.
                </p>
              </div>
            </div>
            <Link
              href={`/app/${tenantSlug}/setup`}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 shrink-0 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Setup Wizard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href={`/app/${tenantSlug}/employees`}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Total Headcount</span>
              <Users className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{employees.length}</div>
            <p className="text-[11px] text-slate-500 mt-1">Cap: {tenant?.maxEmployees || 100} seats</p>
          </Link>

          <Link
            href={`/app/${tenantSlug}/attendance`}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Present Today</span>
              <Clock className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{presentCount}</div>
            <p className="text-[11px] text-slate-500 mt-1">{attendance.length} total logs today</p>
          </Link>

          <Link
            href={`/app/${tenantSlug}/leaves`}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Pending Leaves</span>
              <Calendar className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">{pendingLeaves.length}</div>
            <p className="text-[11px] text-slate-500 mt-1">Awaiting HR manager signoff</p>
          </Link>

          <Link
            href={`/app/${tenantSlug}/payroll`}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Current Payroll</span>
              <CreditCard className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {tenant?.currency} {totalPayroll.toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">{slips.length} salary slips generated</p>
          </Link>
        </div>

        {/* Two Column Layout: Actionable Pending Leaves & Recent Workforce */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Approvals */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                Pending Leave Applications
              </h2>
              <Link
                href={`/app/${tenantSlug}/leaves`}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
              >
                View All
              </Link>
            </div>

            {pendingLeaves.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                ✓ No pending leave requests for this company.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLeaves.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{app.employeeName}</div>
                        <div className="text-slate-500 text-[11px]">{app.leaveTypeName}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {app.totalDays} Day{app.totalDays > 1 ? 's' : ''}
                      </span>
                    </div>

                    <p className="text-slate-700 italic bg-white p-2 rounded-lg border border-slate-200 text-[11px]">
                      &ldquo;{app.reason}&rdquo;
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500">
                        {app.startDate} to {app.endDate}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLeaveAction(app.id, 'APPROVED')}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-xs"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Approve
                        </button>
                        <button
                          onClick={() => handleLeaveAction(app.id, 'REJECTED')}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px]"
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
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Company Workforce
              </h2>
              <Link
                href={`/app/${tenantSlug}/employees`}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
              >
                Directory &rarr;
              </Link>
            </div>

            {employees.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mx-auto">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-600">
                  No employees registered yet. You have a clean workspace.
                </p>
                <Link
                  href={`/app/${tenantSlug}/employees`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Employee</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-emerald-700 text-xs">
                        {emp.firstName.slice(0, 1)}
                        {emp.lastName.slice(0, 1)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {emp.designationTitle} • {emp.departmentName}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-mono text-emerald-700 font-semibold">{emp.employeeCode}</div>
                      <div className="text-[10px] text-slate-500">{emp.employmentType}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
