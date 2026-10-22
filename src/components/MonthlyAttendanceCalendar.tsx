'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Send,
  Coffee,
  User,
  Info
} from 'lucide-react';
import { AttendanceRecord, Employee, Holiday, LeaveApplication, RegularizationRequest, Shift } from '@/lib/types';
import { formatTimeTo12Hour } from '@/lib/attendanceCalculator';

interface MonthlyAttendanceCalendarProps {
  tenantSlug: string;
  employeeId?: string;
  isEmployeeOnly?: boolean;
  onRequestRegularization?: (date: string, reason?: string) => void;
}

export default function MonthlyAttendanceCalendar({
  tenantSlug,
  employeeId: initialEmployeeId,
  isEmployeeOnly = false,
  onRequestRegularization
}: MonthlyAttendanceCalendarProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthNum = today.getMonth() + 1; // 1-12
  const currentYearMonth = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(initialEmployeeId || '');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [regularizations, setRegularizations] = useState<RegularizationRequest[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDayDetails, setSelectedDayDetails] = useState<string | null>(null);

  // Sync initialEmployeeId if provided
  useEffect(() => {
    if (initialEmployeeId) {
      setSelectedEmpId(initialEmployeeId);
    }
  }, [initialEmployeeId]);

  // Fetch monthly attendance data
  const fetchMonthData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tenants/${tenantSlug}/attendance?month=${selectedMonth}&date=${selectedMonth}-01&t=${Date.now()}`,
        {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store' }
        }
      );
      const json = await res.json();
      if (json.success && json.data) {
        setRecords(json.data.monthRecords || json.data.records || []);
        setLeaves(json.data.leaves || []);
        setHolidays(json.data.holidays || []);
        setRegularizations(json.data.regularizations || []);
        setShifts(json.data.shifts || []);
        if (json.data.employees && json.data.employees.length > 0) {
          setEmployees(json.data.employees);
          if (!selectedEmpId && !initialEmployeeId) {
            setSelectedEmpId(json.data.employees[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch monthly attendance data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug && selectedMonth) {
      fetchMonthData();
    }
  }, [tenantSlug, selectedMonth]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setSelectedMonth(
      `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    setSelectedMonth(
      `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
    );
  };

  // Calendar days generation
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // Day of week for 1st day (0=Sunday, 1=Monday ... 6=Saturday)
  // Let's standardise starting on Monday (0=Mon, 6=Sun)
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  // Active target employee
  const activeEmployee = employees.find((e) => e.id === selectedEmpId) || employees[0];

  // Map employee punches for the month: map[dateString] = AttendanceRecord
  const empPunchesMap = new Map<string, AttendanceRecord>();
  records
    .filter((r) => !selectedEmpId || r.employeeId === selectedEmpId)
    .forEach((r) => {
      empPunchesMap.set(r.date, r);
    });

  // Map approved leaves: map[dateString] = LeaveApplication
  const empLeavesMap = new Map<string, LeaveApplication>();
  leaves
    .filter(
      (l) =>
        l.status === 'APPROVED' &&
        (!selectedEmpId || l.employeeId === selectedEmpId)
    )
    .forEach((l) => {
      const s = new Date(l.startDate);
      const e = new Date(l.endDate);
      const cur = new Date(s);
      while (cur <= e) {
        const curStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
        empLeavesMap.set(curStr, l);
        cur.setDate(cur.getDate() + 1);
      }
    });

  // Map holidays: map[dateString] = Holiday
  const holidaysMap = new Map<string, Holiday>();
  holidays.forEach((h) => {
    holidaysMap.set(h.date, h);
  });

  // Map regularizations for employee: map[dateString] = RegularizationRequest
  const empRegMap = new Map<string, RegularizationRequest>();
  regularizations
    .filter((r) => !selectedEmpId || r.employeeId === selectedEmpId)
    .forEach((r) => {
      empRegMap.set(r.attendanceDate, r);
    });

  // Today string
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Calculate monthly stats
  let presentDays = 0;
  let onTimeDays = 0;
  let lateDays = 0;
  let halfDays = 0;
  let onLeaveDays = 0;
  let absentDays = 0;
  let notPunchedInDays = 0;
  let totalWorkingHours = 0;

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dStr = `${yearStr}-${monthStr}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidaysMap.has(dStr);
    const isFuture = dStr > todayStr;
    const isToday = dStr === todayStr;

    const punch = empPunchesMap.get(dStr);
    const leave = empLeavesMap.get(dStr);

    if (punch && punch.clockInTime) {
      if (punch.status === 'LATE_ENTRY') {
        lateDays++;
        presentDays++;
      } else if (punch.status === 'HALF_DAY') {
        halfDays++;
        presentDays += 0.5;
      } else {
        onTimeDays++;
        presentDays++;
      }
      totalWorkingHours += punch.workingHours ?? punch.totalHours ?? 0;
    } else if (leave) {
      onLeaveDays += leave.isHalfDay ? 0.5 : 1;
      if (leave.isHalfDay) {
        halfDays++;
      }
    } else if (!isWeekend && !isHoliday) {
      if (isToday) {
        notPunchedInDays++;
      } else if (!isFuture) {
        absentDays++;
      }
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonthDisplayName = `${monthNames[month - 1]} ${year}`;

  return (
    <div className="space-y-6">
      {/* Calendar Header with Controls */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>Monthly Attendance Calendar</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {currentMonthDisplayName}
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Daily punches, logged working hours, holidays, and 1-click missed punch correction requests.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Employee Selector for Admins */}
          {!isEmployeeOnly && employees.length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> Employee:
              </span>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Month Navigation */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 min-w-28 text-center">
              {currentMonthDisplayName}
            </span>
            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Summary Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Present Days</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">{presentDays}</div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">{onTimeDays} On-Time</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Late Arrivals</div>
          <div className="text-xl font-extrabold text-amber-800 mt-1 font-mono">{lateDays}</div>
          <p className="text-[10px] text-amber-600 font-medium mt-0.5">Punched past grace</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200/80 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Half Days</div>
          <div className="text-xl font-extrabold text-purple-800 mt-1 font-mono">{halfDays}</div>
          <p className="text-[10px] text-purple-600 font-medium mt-0.5">0.5 day credits</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Approved Leaves</div>
          <div className="text-xl font-extrabold text-blue-800 mt-1 font-mono">{onLeaveDays}</div>
          <p className="text-[10px] text-blue-600 font-medium mt-0.5">Paid time-off</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200/80 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Absent (Past)</div>
          <div className="text-xl font-extrabold text-rose-800 mt-1 font-mono">{absentDays}</div>
          <p className="text-[10px] text-rose-600 font-medium mt-0.5">Needs regularization</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Not Punched In</div>
          <div className="text-xl font-extrabold text-slate-800 mt-1 font-mono">{notPunchedInDays}</div>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Today&apos;s pending</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total Hours</div>
          <div className="text-xl font-extrabold text-emerald-900 mt-1 font-mono">
            {totalWorkingHours.toFixed(1)}h
          </div>
          <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Recorded working time</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/90 text-[11px] font-extrabold text-slate-600 text-center uppercase tracking-wider py-3">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div className="text-rose-500">Sat</div>
          <div className="text-rose-500">Sun</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-100/40">
          {/* Empty cells before month start */}
          {Array.from({ length: startDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="min-h-28 bg-slate-50/40 p-2" />
          ))}

          {/* Month Day Cells */}
          {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dayStr = `${yearStr}-${monthStr}-${String(dayNum).padStart(2, '0')}`;
            const dateObj = new Date(year, month - 1, dayNum);
            const dayOfWeek = dateObj.getDay(); // 0=Sun, 6=Sat
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = holidaysMap.get(dayStr);
            const punch = empPunchesMap.get(dayStr);
            const leave = empLeavesMap.get(dayStr);
            const reg = empRegMap.get(dayStr);
            const isToday = dayStr === todayStr;
            const isFuture = dayStr > todayStr;

            // Determine status
            let badgeText = '';
            let badgeClass = '';
            let isAbsent = false;
            let isNotPunchedIn = false;

            if (punch && punch.clockInTime) {
              if (punch.status === 'LATE_ENTRY') {
                badgeText = 'Late';
                badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
              } else if (punch.status === 'HALF_DAY') {
                badgeText = 'Half Day';
                badgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
              } else {
                badgeText = 'Present';
                badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
              }
            } else if (leave) {
              badgeText = leave.isHalfDay ? 'Half Day Leave' : 'On Leave';
              badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
            } else if (isHoliday) {
              badgeText = 'Holiday';
              badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
            } else if (isWeekend) {
              badgeText = 'Weekend';
              badgeClass = 'bg-slate-100 text-slate-500 border-slate-200';
            } else if (isToday) {
              isNotPunchedIn = true;
              badgeText = 'Not Punched In';
              badgeClass = 'bg-amber-50 text-amber-700 border-amber-300 border-dashed';
            } else if (!isFuture) {
              isAbsent = true;
              badgeText = 'Absent';
              badgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
            } else {
              badgeText = 'Scheduled';
              badgeClass = 'bg-slate-50 text-slate-400 border-slate-200';
            }

            return (
              <div
                key={dayStr}
                onClick={() => setSelectedDayDetails(dayStr)}
                className={`min-h-32 p-2 sm:p-2.5 flex flex-col justify-between transition-colors relative cursor-pointer ${
                  isToday
                    ? 'bg-emerald-50/40 ring-2 ring-emerald-500/60 z-10'
                    : isWeekend
                    ? 'bg-slate-50/60'
                    : 'bg-white hover:bg-slate-50/80'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black font-mono ${
                      isToday
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isWeekend
                        ? 'text-slate-400'
                        : 'text-slate-800'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {isHoliday && (
                    <span
                      title={isHoliday.name}
                      className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-md truncate max-w-[85px]"
                    >
                      <Sparkles className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{isHoliday.name}</span>
                    </span>
                  )}

                  {!isHoliday && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${badgeClass}`}
                    >
                      {badgeText}
                    </span>
                  )}
                </div>

                {/* Day Content: Punch Times & Hours */}
                <div className="my-1.5 space-y-1 text-[11px]">
                  {punch && punch.clockInTime ? (
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between font-mono text-slate-700 text-[10px]">
                        <span>In:</span>
                        <strong className="text-slate-900">{punch.clockInTime}</strong>
                      </div>
                      <div className="flex items-center justify-between font-mono text-slate-700 text-[10px]">
                        <span>Out:</span>
                        <strong className="text-slate-900">
                          {punch.clockOutTime || <span className="text-amber-600 italic">In progress</span>}
                        </strong>
                      </div>
                      {(punch.workingHours ?? punch.totalHours ?? 0) > 0 && (
                        <div className="flex items-center justify-between font-bold text-[10px] text-emerald-700 pt-0.5 border-t border-slate-100">
                          <span>Hrs:</span>
                          <span>{(punch.workingHours ?? punch.totalHours)!.toFixed(1)} hrs</span>
                        </div>
                      )}
                    </div>
                  ) : leave ? (
                    <div className="text-[10px] text-blue-700 font-semibold italic truncate">
                      {leave.leaveTypeName}
                    </div>
                  ) : isHoliday ? (
                    <div className="text-[10px] text-purple-700 font-medium truncate">
                      {isHoliday.name}
                    </div>
                  ) : isWeekend ? (
                    <div className="text-[10px] text-slate-400 font-medium">Weekly Off</div>
                  ) : isNotPunchedIn ? (
                    <div className="text-[10px] text-amber-700 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Pending punch</span>
                    </div>
                  ) : isAbsent ? (
                    <div className="text-[10px] text-rose-700 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                      <span>No punch logged</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-300">--</div>
                  )}
                </div>

                {/* Footer: Regularization status or 1-Click Request Action */}
                <div className="pt-1 border-t border-slate-100/80">
                  {reg ? (
                    <span
                      className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        reg.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : reg.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Regularized ({reg.status})</span>
                    </span>
                  ) : (isAbsent || isNotPunchedIn || (punch && !punch.clockOutTime && !isToday)) ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestRegularization?.(dayStr, 'Missed Punch / Forgot to Clock In or Out');
                      }}
                      className="w-full text-center py-0.5 px-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Send className="w-2 h-2 text-amber-700" />
                      <span>Missed Punch?</span>
                    </button>
                  ) : (
                    <span className="text-[9px] text-slate-300 invisible">--</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Drawer Modal */}
      {selectedDayDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Attendance Details: {selectedDayDetails}</h3>
              </div>
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {(() => {
                const p = empPunchesMap.get(selectedDayDetails);
                const l = empLeavesMap.get(selectedDayDetails);
                const h = holidaysMap.get(selectedDayDetails);
                const r = empRegMap.get(selectedDayDetails);

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="font-semibold text-slate-500">Employee:</span>
                      <strong className="text-slate-800">
                        {activeEmployee ? `${activeEmployee.firstName} ${activeEmployee.lastName}` : 'Employee'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="font-semibold text-slate-500">Date:</span>
                      <strong className="text-slate-800 font-mono">{selectedDayDetails}</strong>
                    </div>

                    {p ? (
                      <>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="font-semibold text-slate-500">Clock In Time:</span>
                          <strong className="text-emerald-700 font-mono text-sm">{p.clockInTime || '--'}</strong>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="font-semibold text-slate-500">Clock Out Time:</span>
                          <strong className="text-slate-800 font-mono text-sm">{p.clockOutTime || 'In Progress'}</strong>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="font-semibold text-slate-500">Working Hours:</span>
                          <strong className="text-slate-900 font-mono text-sm">
                            {(p.workingHours ?? p.totalHours) ? `${(p.workingHours ?? p.totalHours)!.toFixed(1)} hrs` : '--'}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="font-semibold text-slate-500">Status:</span>
                          <span className="font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                            {p.status}
                          </span>
                        </div>
                      </>
                    ) : l ? (
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                        <strong>Approved Leave:</strong> {l.leaveTypeName} ({l.totalDays} day quota deduction)
                      </div>
                    ) : h ? (
                      <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900">
                        <strong>Official Public Holiday:</strong> {h.name}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                        <strong>No Punch Recorded:</strong> Employee was absent or did not clock in on this workday.
                      </div>
                    )}

                    {r && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                        <div className="font-bold flex items-center justify-between">
                          <span>Regularization Request ({r.status})</span>
                          <span className="text-[10px] font-mono">{r.requestedAt?.slice(0, 10)}</span>
                        </div>
                        <p className="mt-1 text-slate-700">Reason: &ldquo;{r.reason}&rdquo;</p>
                        {r.comment && (
                          <p className="mt-1 text-emerald-800">Review Note: {r.comment}</p>
                        )}
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-end gap-2">
                      {(!p || !p.clockOutTime) && !l && !h && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDayDetails(null);
                            onRequestRegularization?.(selectedDayDetails, 'Missed Punch / Forgot to Clock In or Out');
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Request Regularization</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedDayDetails(null)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
