import {
  AttendanceRecord,
  AttendanceStatus,
  Employee,
  Holiday,
  LeaveApplication,
  RegularizationRequest,
  Shift
} from '@/lib/types';

export interface ShiftPolicy {
  startTime: string;      // e.g. "09:00"
  endTime: string;        // e.g. "18:00"
  graceMinutes: number;   // e.g. 15
  fullDayMinHours: number;// standard: 7.5
  halfDayMinHours: number;// standard: 4.0
}

export const DEFAULT_SHIFT_POLICY: ShiftPolicy = {
  startTime: '09:00',
  endTime: '18:00',
  graceMinutes: 15,
  fullDayMinHours: 7.5,
  halfDayMinHours: 4.0
};

/**
 * Parses time strings like "08:19 AM", "12:24 PM", "9:00", "18:00" into minutes from midnight.
 */
export function parseTimeToMinutes(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const cleaned = timeStr.trim().toUpperCase();
  const isPM = cleaned.includes('PM');
  const isAM = cleaned.includes('AM');
  const timePart = cleaned.replace(/[AP]M/, '').trim();
  const parts = timePart.split(':');
  if (parts.length < 2) return null;

  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/**
 * Formats time string (either "10:00", "19:00", or "10:00 AM") to clean 12-hour AM/PM format.
 */
export function formatTimeTo12Hour(timeStr?: string | null): string {
  if (!timeStr) return '—';
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return timeStr;
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const dispHours = hours % 12 || 12;
  return `${String(dispHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Formats a Date object to a 12-hour AM/PM string in a specific timezone (defaults to Asia/Kolkata).
 */
export function formatTimeInTimezone(
  date: Date = new Date(),
  timeZone: string = 'Asia/Kolkata'
): string {
  try {
    return date.toLocaleTimeString('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return date.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}

/**
 * Returns YYYY-MM-DD date string in a specific timezone (defaults to Asia/Kolkata).
 */
export function formatDateInTimezone(
  date: Date = new Date(),
  timeZone: string = 'Asia/Kolkata'
): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }
}

/**
 * Returns dynamic late cutoff time display given shift start time and grace minutes (e.g. "10:15 AM").
 */
export function getLateCutoffDisplay(startTime?: string | null, graceMinutes: number = 15): string {
  const startMins = parseTimeToMinutes(startTime || '09:00') ?? 540;
  const cutoffMins = startMins + graceMinutes;
  const hours = Math.floor(cutoffMins / 60);
  const minutes = cutoffMins % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const dispHours = hours % 12 || 12;
  return `${String(dispHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Calculates effective hours and attendance status according to Indian / Global HRMS industry standards:
 * - Clock In after shift start + grace -> LATE_ENTRY
 * - Clock Out with >= 7.5 hrs (or shift duration) -> PRESENT
 * - Clock Out with >= 4.0 hrs and < 7.5 hrs -> HALF_DAY
 * - Clock Out with < 4.0 hrs -> HALF_DAY (Short Shift)
 * - Clocked In today without Clock Out -> PRESENT (In Progress)
 */
export function evaluateAttendanceStatus(
  clockIn?: string | null,
  clockOut?: string | null,
  policy: ShiftPolicy = DEFAULT_SHIFT_POLICY,
  isHistoricalDate: boolean = false
): {
  status: AttendanceStatus;
  workingHours: number;
  isLate: boolean;
  lateMinutes: number;
  isHalfDay: boolean;
  effectiveHoursText: string;
} {
  if (!clockIn) {
    return {
      status: isHistoricalDate ? 'ABSENT' : 'NOT_PUNCHED_IN',
      workingHours: 0,
      isLate: false,
      lateMinutes: 0,
      isHalfDay: false,
      effectiveHoursText: isHistoricalDate ? '0.0 hrs (Absent)' : 'Not Punched In'
    };
  }

  const shiftStartMin = parseTimeToMinutes(policy.startTime) ?? 540; // 09:00 = 540
  const clockInMin = parseTimeToMinutes(clockIn);

  const lateMinutes =
    clockInMin !== null && clockInMin > shiftStartMin + policy.graceMinutes
      ? clockInMin - shiftStartMin
      : 0;
  const isLate = lateMinutes > 0;

  // If not yet clocked out
  if (!clockOut) {
    if (isHistoricalDate) {
      // Historical unclosed punch is treated as incomplete / Half Day
      return {
        status: 'HALF_DAY',
        workingHours: 4.0,
        isLate,
        lateMinutes,
        isHalfDay: true,
        effectiveHoursText: '4.0 hrs (Missed Out)'
      };
    }
    return {
      status: isLate ? 'LATE_ENTRY' : 'PRESENT',
      workingHours: 0,
      isLate,
      lateMinutes,
      isHalfDay: false,
      effectiveHoursText: 'In Progress'
    };
  }

  const clockOutMin = parseTimeToMinutes(clockOut);
  if (clockInMin === null || clockOutMin === null) {
    return {
      status: isLate ? 'LATE_ENTRY' : 'PRESENT',
      workingHours: 0,
      isLate,
      lateMinutes,
      isHalfDay: false,
      effectiveHoursText: 'In Progress'
    };
  }

  // Calculate elapsed working hours (handle same-minute punches and midnight crossing)
  let totalMinutes = clockOutMin - clockInMin;
  if (totalMinutes < 0) {
    totalMinutes += 1440; // Overnight shift
  }
  const workedHours = Math.max(0.1, Math.round((totalMinutes / 60) * 10) / 10);

  if (workedHours >= policy.fullDayMinHours) {
    return {
      status: isLate ? 'LATE_ENTRY' : 'PRESENT',
      workingHours: workedHours,
      isLate,
      lateMinutes,
      isHalfDay: false,
      effectiveHoursText: `${workedHours.toFixed(1)} hrs`
    };
  } else if (workedHours >= policy.halfDayMinHours) {
    return {
      status: 'HALF_DAY',
      workingHours: workedHours,
      isLate,
      lateMinutes,
      isHalfDay: true,
      effectiveHoursText: `${workedHours.toFixed(1)} hrs (Half Day)`
    };
  } else {
    return {
      status: 'HALF_DAY',
      workingHours: workedHours,
      isLate,
      lateMinutes,
      isHalfDay: true,
      effectiveHoursText: `${workedHours.toFixed(1)} hrs (Short Hours)`
    };
  }
}

/**
 * Builds the complete daily attendance roster for all active employees for a given date.
 */
export function buildDailyWorkforceRoster({
  date,
  employees,
  punchRecords,
  leaveApplications,
  shifts,
  tenantId,
  excludedEmployeeIds,
  timezone,
  regularizations,
  holidays,
  workingDays,
  weeklyOffDays
}: {
  date: string;
  employees: Employee[];
  punchRecords: AttendanceRecord[];
  leaveApplications: LeaveApplication[];
  shifts: Shift[];
  tenantId: string;
  excludedEmployeeIds?: Set<string>;
  timezone?: string;
  regularizations?: RegularizationRequest[];
  holidays?: Holiday[];
  workingDays?: string[];
  weeklyOffDays?: string[];
}): {
  roster: AttendanceRecord[];
  stats: {
    totalEmployees: number;
    presentCount: number;
    onTimeCount: number;
    lateCount: number;
    halfDayCount: number;
    onLeaveCount: number;
    absentCount: number;
    notPunchedInCount: number;
    activeShift: {
      id: string;
      name: string;
      startTime: string;
      endTime: string;
      graceMinutes: number;
      formattedStart: string;
      formattedEnd: string;
      lateCutoff: string;
    };
  };
} {
  const activeEmployees = employees.filter((e) => e.status !== 'ARCHIVED' && e.status !== 'EXITED');

  // Create shift lookup map
  const shiftMap = new Map<string, Shift>();
  shifts.forEach((s) => shiftMap.set(s.name?.toLowerCase().trim() || s.id, s));
  const defaultShift = shifts.find((s) => s.isDefault) || shifts[0];

  const defaultPolicy: ShiftPolicy = {
    startTime: defaultShift?.startTime || '09:00',
    endTime: defaultShift?.endTime || '18:00',
    graceMinutes: defaultShift?.graceMinutes ?? 15,
    fullDayMinHours: 7.5,
    halfDayMinHours: 4.0
  };

  const todayStr = formatDateInTimezone(new Date(), timezone || 'Asia/Kolkata');
  const isHistoricalDate = date < todayStr;

  // Map existing real punches for this date by employeeId
  const punchMap = new Map<string, AttendanceRecord>();
  punchRecords
    .filter((r) => r.date === date)
    .forEach((r) => {
      // Store latest punch record for this employee on this date
      punchMap.set(r.employeeId, r);
    });

  const roster: AttendanceRecord[] = [];
  let onTimeCount = 0;
  let lateCount = 0;
  let halfDayCount = 0;
  let onLeaveCount = 0;
  let absentCount = 0;
  let notPunchedInCount = 0;

  const targetDateObj = new Date(date + 'T00:00:00Z');
  const dayOfWeek = targetDateObj.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const currentDayName = dayNames[dayOfWeek];
  const isWeeklyOff = Boolean(weeklyOffDays && weeklyOffDays.includes(currentDayName));

  activeEmployees.forEach((emp) => {
    const punch = punchMap.get(emp.id);
    // If employee has a logged punch record, NEVER exclude them based on previous deletion keys
    if (!punch && excludedEmployeeIds && excludedEmployeeIds.has(emp.id)) {
      return;
    }

    const shift =
      (emp.shiftName && shiftMap.get(emp.shiftName.toLowerCase().trim())) ||
      defaultShift;
    const policy: ShiftPolicy = shift
      ? {
          startTime: shift.startTime || '09:00',
          endTime: shift.endTime || '18:00',
          graceMinutes: shift.graceMinutes ?? 15,
          fullDayMinHours: 7.5,
          halfDayMinHours: 4.0
        }
      : defaultPolicy;

    // Check if employee has an approved leave application covering this date
    const approvedLeave = leaveApplications.find(
      (l) =>
        l.employeeId === emp.id &&
        l.status === 'APPROVED' &&
        date >= l.startDate &&
        date <= l.endDate
    );
    const isHalfDayLeave = Boolean(approvedLeave && (approvedLeave.isHalfDay || Number(approvedLeave.totalDays) === 0.5));

    if (punch) {
      // Check if this record has been regularized or manually overridden
      const hasApprovedReg = regularizations?.some(
        (reg) =>
          reg.employeeId === emp.id &&
          reg.attendanceDate === date &&
          reg.status === 'APPROVED'
      );
      const noteHasReg = Boolean(punch.notes?.toLowerCase().includes('regulariz'));
      const isRegularized = hasApprovedReg || noteHasReg;
      const isManualAdminOverride = Boolean(
        punch.notes?.toLowerCase().includes('admin') ||
        punch.notes?.toLowerCase().includes('super admin') ||
        punch.notes?.toLowerCase().includes('manual')
      );

      // Evaluate punch using shift rules
      const evalResult = evaluateAttendanceStatus(
        punch.clockInTime,
        punch.clockOutTime,
        policy,
        isHistoricalDate
      );

      // Determine final status
      let finalStatus: AttendanceStatus;
      let finalNote: string;

      if (isHalfDayLeave) {
        // If employee took approved half-day leave and also punched in
        finalStatus = 'HALF_DAY';
        finalNote = punch.notes || `Approved Half-Day Leave (${approvedLeave?.halfDayPeriod === 'FIRST_HALF' ? '1st Half' : '2nd Half'}) + Worked ${evalResult.workingHours}h`;
      } else if (isRegularized) {
        finalStatus = 'PRESENT';
        finalNote = punch.notes || 'Attendance Regularized & Approved by Manager';
      } else if (isManualAdminOverride && punch.status && punch.status !== 'ABSENT') {
        finalStatus = punch.status as AttendanceStatus;
        finalNote = punch.notes || 'Status updated by administrator';
      } else {
        finalStatus = evalResult.status;
        finalNote = punch.notes || (evalResult.isLate ? `Clocked in ${evalResult.lateMinutes}m after grace` : 'Biometric Web Punch');
      }

      // Preserve working hours if already recorded (e.g. from manual edit or regularization)
      const finalWorkingHours =
        punch.workingHours !== undefined && punch.workingHours > 0
          ? punch.workingHours
          : evalResult.workingHours;

      const computedRecord: AttendanceRecord = {
        id: punch.id,
        tenantId,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
        date,
        clockInTime: punch.clockInTime,
        clockOutTime: punch.clockOutTime,
        workingHours: finalWorkingHours,
        status: finalStatus,
        notes: finalNote,
        shiftName: shift?.name || emp.shiftName || 'General Day Shift'
      };

      roster.push(computedRecord);

      if (computedRecord.status === 'LATE_ENTRY') {
        lateCount++;
      } else if (computedRecord.status === 'HALF_DAY') {
        halfDayCount++;
      } else if (computedRecord.status === 'PRESENT') {
        onTimeCount++;
      }
    } else {
      // No punch recorded by employee on this date
      // Check if date is an official company / calendar holiday
      const matchedHoliday = holidays?.find((h) => h.date === date);

      if (approvedLeave) {
        if (isHalfDayLeave) {
          halfDayCount++;
          roster.push({
            id: `leave-half-att-${emp.id}-${date}`,
            tenantId,
            employeeId: emp.id,
            employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
            date,
            clockInTime: undefined,
            clockOutTime: undefined,
            workingHours: 0,
            status: 'HALF_DAY',
            notes: `Approved Half-Day Leave (${approvedLeave.halfDayPeriod === 'FIRST_HALF' ? 'First Half (Morning)' : 'Second Half (Afternoon)'} - 0.5 Day)`,
            shiftName: shift?.name || emp.shiftName || 'General Day Shift'
          });
        } else {
          onLeaveCount++;
          roster.push({
            id: `leave-att-${emp.id}-${date}`,
            tenantId,
            employeeId: emp.id,
            employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
            date,
            clockInTime: undefined,
            clockOutTime: undefined,
            workingHours: 0,
            status: 'ON_LEAVE',
            notes: `Approved Leave: ${approvedLeave.leaveTypeName || 'Leave'}`,
            shiftName: shift?.name || emp.shiftName || 'General Day Shift'
          });
        }
      } else if (matchedHoliday) {
        roster.push({
          id: `holiday-att-${emp.id}-${date}`,
          tenantId,
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
          date,
          clockInTime: undefined,
          clockOutTime: undefined,
          workingHours: 0,
          status: 'HOLIDAY',
          notes: matchedHoliday.isOptional
            ? `Optional Holiday: ${matchedHoliday.name}`
            : `Public Holiday: ${matchedHoliday.name}`,
          shiftName: shift?.name || emp.shiftName || 'General Day Shift'
        });
      } else if (isWeeklyOff) {
        roster.push({
          id: `off-att-${emp.id}-${date}`,
          tenantId,
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
          date,
          clockInTime: undefined,
          clockOutTime: undefined,
          workingHours: 0,
          status: 'HOLIDAY',
          notes: `Weekly Off (${currentDayName.charAt(0) + currentDayName.slice(1).toLowerCase()})`,
          shiftName: shift?.name || emp.shiftName || 'General Day Shift'
        });
      } else if (isHistoricalDate) {
        absentCount++;
        roster.push({
          id: `absent-att-${emp.id}-${date}`,
          tenantId,
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
          date,
          clockInTime: undefined,
          clockOutTime: undefined,
          workingHours: 0,
          status: 'ABSENT',
          notes: 'Unpunched (Absent without leave)',
          shiftName: shift?.name || emp.shiftName || 'General Day Shift'
        });
      } else {
        notPunchedInCount++;
        roster.push({
          id: `not-punched-att-${emp.id}-${date}`,
          tenantId,
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
          date,
          clockInTime: undefined,
          clockOutTime: undefined,
          workingHours: 0,
          status: 'NOT_PUNCHED_IN',
          notes: 'Not Punched In (Shift in progress / Pending punch)',
          shiftName: shift?.name || emp.shiftName || 'General Day Shift'
        });
      }
    }
  });

  return {
    roster,
    stats: {
      totalEmployees: activeEmployees.length,
      presentCount: onTimeCount + lateCount,
      onTimeCount,
      lateCount,
      halfDayCount,
      onLeaveCount,
      absentCount,
      notPunchedInCount,
      activeShift: {
        id: defaultShift?.id || 'default-shift',
        name: defaultShift?.name || 'General Day Shift',
        startTime: defaultShift?.startTime || '09:00',
        endTime: defaultShift?.endTime || '18:00',
        graceMinutes: defaultShift?.graceMinutes ?? 15,
        formattedStart: formatTimeTo12Hour(defaultShift?.startTime || '09:00'),
        formattedEnd: formatTimeTo12Hour(defaultShift?.endTime || '18:00'),
        lateCutoff: getLateCutoffDisplay(defaultShift?.startTime || '09:00', defaultShift?.graceMinutes ?? 15)
      }
    }
  };
}
