import {
  AttendanceRecord,
  AttendanceStatus,
  Employee,
  LeaveApplication,
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
      status: 'ABSENT',
      workingHours: 0,
      isLate: false,
      lateMinutes: 0,
      isHalfDay: false,
      effectiveHoursText: '0.0 hrs'
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
  if (clockInMin === null || clockOutMin === null || clockOutMin <= clockInMin) {
    return {
      status: isLate ? 'LATE_ENTRY' : 'PRESENT',
      workingHours: 0,
      isLate,
      lateMinutes,
      isHalfDay: false,
      effectiveHoursText: 'In Progress'
    };
  }

  // Calculate elapsed working hours
  const totalMinutes = clockOutMin - clockInMin;
  const workedHours = Math.round((totalMinutes / 60) * 10) / 10;

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
  excludedEmployeeIds
}: {
  date: string;
  employees: Employee[];
  punchRecords: AttendanceRecord[];
  leaveApplications: LeaveApplication[];
  shifts: Shift[];
  tenantId: string;
  excludedEmployeeIds?: Set<string>;
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

  const todayStr = new Date().toISOString().split('T')[0];
  const isHistoricalDate = date < todayStr;

  // Map existing real punches for this date by employeeId
  const punchMap = new Map<string, AttendanceRecord>();
  punchRecords
    .filter((r) => r.date === date)
    .forEach((r) => {
      // Don't overwrite if existing punch has clockOut
      const existing = punchMap.get(r.employeeId);
      if (!existing || (r.clockOutTime && !existing.clockOutTime)) {
        punchMap.set(r.employeeId, r);
      }
    });

  const roster: AttendanceRecord[] = [];
  let onTimeCount = 0;
  let lateCount = 0;
  let halfDayCount = 0;
  let onLeaveCount = 0;
  let absentCount = 0;

  const targetDateObj = new Date(date + 'T00:00:00Z');
  const isSunday = targetDateObj.getUTCDay() === 0;

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

    if (punch) {
      // Evaluate punch using shift rules
      const evalResult = evaluateAttendanceStatus(
        punch.clockInTime,
        punch.clockOutTime,
        policy,
        isHistoricalDate
      );

      const computedRecord: AttendanceRecord = {
        id: punch.id,
        tenantId,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
        date,
        clockInTime: punch.clockInTime,
        clockOutTime: punch.clockOutTime,
        workingHours: evalResult.workingHours,
        status: evalResult.status,
        notes: punch.notes || (evalResult.isLate ? `Clocked in ${evalResult.lateMinutes}m after grace` : 'Biometric Web Punch'),
        shiftName: shift?.name || emp.shiftName || 'General Day Shift'
      };

      roster.push(computedRecord);

      if (evalResult.status === 'LATE_ENTRY') {
        lateCount++;
      } else if (evalResult.status === 'HALF_DAY') {
        halfDayCount++;
      } else if (evalResult.status === 'PRESENT') {
        onTimeCount++;
      }
    } else {
      // No punch recorded by employee on this date
      // Check if employee has an approved leave application
      const approvedLeave = leaveApplications.find(
        (l) =>
          l.employeeId === emp.id &&
          l.status === 'APPROVED' &&
          date >= l.startDate &&
          date <= l.endDate
      );

      if (approvedLeave) {
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
      } else if (isSunday) {
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
          notes: 'Weekly Off (Sunday)',
          shiftName: shift?.name || emp.shiftName || 'General Day Shift'
        });
      } else {
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
