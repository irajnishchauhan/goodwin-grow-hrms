'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  MapPin,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { AttendanceRecord, Employee, Tenant } from '@/lib/types';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';

export default function TenantAttendancePage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { user, isEmployeeOnly } = useCurrentUser(tenantSlug);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [selectedEmpId, setSelectedEmpId] = useState('');

  const fetchAttendance = async () => {
    try {
      const [res, empRes] = await Promise.all([
        fetch(`/api/tenants/${tenantSlug}/attendance`),
        fetch(`/api/tenants/${tenantSlug}/employees`)
      ]);

      const [json, empJson] = await Promise.all([
        res.json().catch(() => ({})),
        empRes.json().catch(() => ({}))
      ]);

      if (json.success) {
        setRecords(json.data.records);
      }

      if (empJson.success) {
        const emps: Employee[] = empJson.data.employees || [];
        setEmployees(emps);
        setTenant(empJson.data.tenant);

        if (emps.length > 0) {
          const myEmp = emps.find(
            (e) =>
              user &&
              (e.workEmail.toLowerCase() === user.email.toLowerCase() ||
                e.firstName.toLowerCase() === user.name.toLowerCase().split(' ')[0])
          );
          if (myEmp) {
            setSelectedEmpId(myEmp.id);
          } else if (!selectedEmpId) {
            setSelectedEmpId(emps[0].id);
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
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPunchLoading(false);
    }
  };

  const visibleRecords = isEmployeeOnly
    ? records.filter((r) => {
        if (!user) return true;
        const firstName = user.name.toLowerCase().split(' ')[0];
        return (selectedEmpId && r.employeeId === selectedEmpId) || Boolean(r.employeeName?.toLowerCase().includes(firstName));
      })
    : records;

  const presentCount = visibleRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE_ENTRY').length;

  return (
    <div className="space-y-6 max-w-6xl text-slate-900">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-600" />
            {isEmployeeOnly ? 'My Attendance & Shift Clock' : 'Attendance & Shifts'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isEmployeeOnly
              ? `Real-time web punch tracking and personal shift hours for ${user?.name || 'Employee'}`
              : `Real-time web punch tracking and shift regularization for ${tenant?.name || 'Workspace'}`}
          </p>
        </div>

        {/* Shift Policy Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span>General Shift: <strong>09:00 AM - 06:00 PM</strong> (15m grace)</span>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fade-in shadow-xs">
          <span className="font-medium">✓ {statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-semibold">
            Dismiss
          </button>
        </div>
      )}

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
            <span className="text-xs text-slate-600 font-medium">{isEmployeeOnly ? 'Active Employee:' : 'Employee:'}</span>
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
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all hover:scale-105 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Clock In</span>
          </button>

          <button
            onClick={() => handlePunch('OUT')}
            disabled={punchLoading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs shadow-xs transition-all hover:scale-105 disabled:opacity-50"
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
                <th className="px-6 py-3.5">Location / Method</th>
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
                    <td className="px-6 py-4 text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{r.notes || 'Office WiFi'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
