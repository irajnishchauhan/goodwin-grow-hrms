'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  FileText,
  Check,
  X,
  History,
  Send,
  Sparkles,
  MapPin,
  Filter,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  UserX,
  ChevronRight,
  Edit2,
  Trash2,
  Settings,
  Plus,
  CheckSquare
} from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceStatus,
  Employee,
  Tenant,
  RegularizationRequest,
  Shift
} from '@/lib/types';
import { formatTimeTo12Hour, getLateCutoffDisplay } from '@/lib/attendanceCalculator';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import RoleGuard from '@/components/RoleGuard';

export default function TenantAttendancePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tenantSlug = params.tenantSlug as string;

  const { user, isEmployeeOnly, isCompanyAdmin, isSuperAdmin } = useCurrentUser(tenantSlug);

  // Core Attendance & Roster State
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get('date') || new Date().toISOString().split('T')[0]
  );
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [regularizations, setRegularizations] = useState<RegularizationRequest[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stats, setStats] = useState<{
    totalEmployees: number;
    presentCount: number;
    onTimeCount: number;
    lateCount: number;
    halfDayCount: number;
    onLeaveCount: number;
    absentCount: number;
    activeShift?: {
      id: string;
      name: string;
      startTime: string;
      endTime: string;
      graceMinutes: number;
      formattedStart: string;
      formattedEnd: string;
      lateCutoff: string;
    };
  }>({
    totalEmployees: 0,
    presentCount: 0,
    onTimeCount: 0,
    lateCount: 0,
    halfDayCount: 0,
    onLeaveCount: 0,
    absentCount: 0
  });

  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Tab View: Daily Roster | Regularizations | Shift Schedules & Grace Policies
  const [activeTab, setActiveTab] = useState<'attendance' | 'regularizations' | 'shifts'>('attendance');

  // Super Admin & Company Admin Detection (admin@goodwingrow.ai or rajnish or super_admin / company_admin)
  const canManageAttendance = Boolean(
    isSuperAdmin ||
    isCompanyAdmin ||
    user?.isSuperAdmin ||
    user?.email === 'admin@goodwingrow.ai' ||
    user?.email === 'rajnish.chauhan@goodwinbatteries.com' ||
    user?.email === 'rajnish.goodwinbatteries@gmail.com' ||
    user?.email?.toLowerCase().includes('rajnish') ||
    user?.memberships?.some(
      (m) => m.tenantSlug === tenantSlug && (m.role === 'SUPER_ADMIN' || m.role === 'COMPANY_ADMIN')
    )
  );

  // Multi-Record Selection & Bulk Actions State
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Track locally deleted attendance entries for date (empId::date)
  const [deletedRosterKeys, setDeletedRosterKeys] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(`hrms_deleted_att_${tenantSlug}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveDeletedKeys = (keys: string[]) => {
    setDeletedRosterKeys(keys);
    try {
      localStorage.setItem(`hrms_deleted_att_${tenantSlug}`, JSON.stringify(keys));
    } catch (e) {
      console.warn('Failed to save deleted keys to localStorage', e);
    }
  };

  // Super Admin Attendance Edit State
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editClockIn, setEditClockIn] = useState('');
  const [editClockOut, setEditClockOut] = useState('');
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('PRESENT');
  const [editHours, setEditHours] = useState<number>(0);
  const [editNotes, setEditNotes] = useState('');
  const [editShiftName, setEditShiftName] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Super Admin Attendance Delete Confirmation State
  const [deletingRecord, setDeletingRecord] = useState<AttendanceRecord | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Shifts Management Tab State
  const [editingShiftMap, setEditingShiftMap] = useState<
    Record<string, { startTime: string; endTime: string; graceMinutes: number; name: string }>
  >({});
  const [newShiftName, setNewShiftName] = useState('');
  const [newShiftStart, setNewShiftStart] = useState('09:00');
  const [newShiftEnd, setNewShiftEnd] = useState('18:00');
  const [newShiftGrace, setNewShiftGrace] = useState(15);
  const [shiftSavingId, setShiftSavingId] = useState<string | null>(null);
  const [shiftMsg, setShiftMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Attendance Status Filter
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'PRESENT' | 'LATE_ENTRY' | 'HALF_DAY' | 'ON_LEAVE' | 'ABSENT'
  >('ALL');

  // Regularization Filters
  const [regFilter, setRegFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Request Regularization Modal State
  const [isRegModalOpen, setIsRegModalOpen] = useState(searchParams.get('action') === 'request');
  const [regEmpId, setRegEmpId] = useState('');
  const [regDate, setRegDate] = useState(new Date().toISOString().split('T')[0]);
  const [regClockIn, setRegClockIn] = useState('09:00');
  const [regClockOut, setRegClockOut] = useState('18:00');
  const [regReasonCategory, setRegReasonCategory] = useState('Missed Punch / Forgot to Clock In or Out');
  const [regRemarks, setRegRemarks] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regFeedback, setRegFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Manager Review Modal State
  const [reviewingReg, setReviewingReg] = useState<RegularizationRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const fetchAttendance = async (dateToFetch?: string) => {
    try {
      const d = dateToFetch || selectedDate;
      const [res, empRes] = await Promise.all([
        fetch(`/api/tenants/${tenantSlug}/attendance?date=${d}&t=${Date.now()}`, {
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
        setRecords(json.data.records || []);
        if (json.data.regularizations) {
          setRegularizations(json.data.regularizations);
        }
        if (json.data.shifts) {
          setShifts(json.data.shifts);
          const map: Record<string, { startTime: string; endTime: string; graceMinutes: number; name: string }> = {};
          json.data.shifts.forEach((s: Shift) => {
            map[s.id] = { startTime: s.startTime, endTime: s.endTime, graceMinutes: s.graceMinutes, name: s.name };
          });
          setEditingShiftMap(map);
        }
        if (json.data.stats) {
          setStats(json.data.stats);
        }
      }

      if (empJson.success) {
        const emps: Employee[] = empJson.data.employees || [];
        setEmployees(emps);
        setTenant(empJson.data.tenant);

        if (emps.length > 0) {
          const myEmp = emps.find(
            (e) =>
              user &&
              (e.workEmail?.toLowerCase() === user.email?.toLowerCase() ||
                e.firstName?.toLowerCase() === user.name?.toLowerCase().split(' ')[0])
          );
          if (myEmp) {
            setRegEmpId(myEmp.id);
          } else if (!regEmpId) {
            setRegEmpId(emps[0].id);
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
    setSelectedRecordIds([]);
    if (tenantSlug) {
      fetchAttendance(selectedDate);
    }
  }, [tenantSlug, selectedDate]);

  // Current logged in employee record
  const currentEmp = employees.find(
    (e) =>
      user &&
      (e.workEmail?.toLowerCase() === user.email?.toLowerCase() ||
        e.firstName?.toLowerCase() === user.name?.toLowerCase().split(' ')[0])
  );

  const isAdmin = !isEmployeeOnly;

  // Find logged-in user's punch record for today
  const myTodayRecord = records.find(
    (r) => currentEmp && r.employeeId === currentEmp.id && r.date === selectedDate
  );

  // Handle Punch In / Out (Strictly by logged in employee for themselves)
  const handlePunch = async (action: 'IN' | 'OUT') => {
    if (!currentEmp) {
      setStatusMsg('No employee profile associated with your user session.');
      return;
    }
    setPunchLoading(true);
    setStatusMsg(null);
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
        setStatusMsg(json.message);
        fetchAttendance(selectedDate);
      } else {
        setStatusMsg(json.error || 'Failed to record punch');
      }
    } catch (e) {
      console.error(e);
      setStatusMsg('Connection error logging punch');
    } finally {
      setPunchLoading(false);
    }
  };

  // Submit Regularization Request
  const handleSubmitRegularization = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveEmpId = isEmployeeOnly ? currentEmp?.id || regEmpId : regEmpId;
    if (!effectiveEmpId) {
      setRegFeedback({ type: 'error', message: 'Please select an employee' });
      return;
    }
    if (!regDate) {
      setRegFeedback({ type: 'error', message: 'Please select the attendance date to regularize' });
      return;
    }

    setRegSubmitting(true);
    setRegFeedback(null);

    const emp = employees.find((e) => e.id === effectiveEmpId);
    const fullReason = `${regReasonCategory}${regRemarks ? ` — ${regRemarks}` : ''}`;

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REGULARIZATION',
          employeeId: effectiveEmpId,
          employeeName: emp ? `${emp.firstName} ${emp.lastName}` : undefined,
          attendanceDate: regDate,
          requestedClockIn: regClockIn,
          requestedClockOut: regClockOut,
          reason: fullReason,
          managerId: emp?.reportingManagerId,
          managerName: emp?.reportingManagerName
        })
      });

      const json = await res.json();
      if (json.success) {
        setRegFeedback({
          type: 'success',
          message: 'Attendance regularization request submitted successfully for manager approval!'
        });
        fetchAttendance(selectedDate);
        setTimeout(() => {
          setIsRegModalOpen(false);
          setRegRemarks('');
          setRegFeedback(null);
        }, 1500);
      } else {
        setRegFeedback({ type: 'error', message: json.error || 'Failed to submit regularization' });
      }
    } catch (err) {
      console.error(err);
      setRegFeedback({ type: 'error', message: 'Network error submitting request' });
    } finally {
      setRegSubmitting(false);
    }
  };

  // Review & Approve/Reject Regularization
  const handleReviewRegularization = async () => {
    if (!reviewingReg || !reviewAction) return;
    setReviewSubmitting(true);
    setReviewFeedback(null);

    const reviewerName = user?.name || (isCompanyAdmin ? 'Company Administrator' : 'Reporting Manager');

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regularizationId: reviewingReg.id,
          status: reviewAction,
          reviewedBy: reviewerName,
          comment: reviewComment.trim() || undefined
        })
      });

      const json = await res.json();
      if (json.success) {
        setReviewFeedback({
          type: 'success',
          message: `Regularization request successfully ${reviewAction.toLowerCase()}!`
        });
        fetchAttendance(selectedDate);
        setTimeout(() => {
          setReviewingReg(null);
          setReviewAction(null);
          setReviewComment('');
          setReviewFeedback(null);
        }, 1000);
      } else {
        setReviewFeedback({ type: 'error', message: json.error || 'Failed to update regularization' });
      }
    } catch (err) {
      console.error(err);
      setReviewFeedback({ type: 'error', message: 'Failed to communicate with server' });
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Quick Open Regularization Modal for a specific unpunched or half-day record
  const handleQuickRegularize = (empId: string, attDate: string) => {
    setRegEmpId(empId);
    setRegDate(attDate);
    setRegFeedback(null);
    setIsRegModalOpen(true);
  };

  // Super Admin: Open Edit Attendance Record Modal
  const handleOpenEditRecord = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setEditClockIn(rec.clockInTime || '');
    setEditClockOut(rec.clockOutTime || '');
    setEditStatus(rec.status);
    setEditHours(rec.workingHours || 0);
    setEditNotes(rec.notes || '');
    setEditShiftName(rec.shiftName || shifts[0]?.name || 'General Day Shift');
    setEditFeedback(null);
  };

  // Super Admin: Submit Edited Record
  const handleSaveAttendanceRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setEditSubmitting(true);
    setEditFeedback(null);

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/attendance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: editingRecord.id,
          employeeId: editingRecord.employeeId,
          employeeName: editingRecord.employeeName,
          date: editingRecord.date,
          clockInTime: editClockIn.trim() || null,
          clockOutTime: editClockOut.trim() || null,
          status: editStatus,
          workingHours: Number(editHours) || 0,
          notes: editNotes.trim() || 'Updated by Super Admin',
          shiftName: editShiftName
        })
      });

      const json = await res.json();
      if (json.success) {
        setEditFeedback({ type: 'success', message: 'Attendance record updated successfully!' });
        fetchAttendance(selectedDate);
        setTimeout(() => {
          setEditingRecord(null);
          setEditFeedback(null);
        }, 900);
      } else {
        setEditFeedback({ type: 'error', message: json.error || 'Failed to update record' });
      }
    } catch (err) {
      console.error(err);
      setEditFeedback({ type: 'error', message: 'Communication error with server' });
    } finally {
      setEditSubmitting(false);
    }
  };

  // Super Admin: Confirm Delete Attendance Record
  const handleConfirmDeleteRecord = async () => {
    if (!deletingRecord) return;
    setDeleteSubmitting(true);

    const empId = deletingRecord.employeeId;
    const attDate = deletingRecord.date;
    const recId = deletingRecord.id;
    const delKey = `${empId}::${attDate}`;

    // Optimistically remove immediately from table
    const updatedKeys = [...new Set([...deletedRosterKeys, delKey])];
    saveDeletedKeys(updatedKeys);
    setRecords((prev) => prev.filter((r) => r.id !== recId && !(r.employeeId === empId && r.date === attDate)));
    setSelectedRecordIds((prev) => prev.filter((id) => id !== recId));

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/attendance`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: recId,
          employeeId: empId,
          date: attDate
        })
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg(`Attendance record for ${deletingRecord.employeeName} deleted successfully.`);
        setDeletingRecord(null);
        fetchAttendance(selectedDate);
      } else {
        alert(json.error || 'Failed to delete attendance record');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to communicate with server');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Super Admin: Confirm Bulk Delete Attendance Records
  const handleConfirmBulkDelete = async () => {
    if (selectedRecordIds.length === 0) return;
    setBulkDeleting(true);

    const selectedRecords = records.filter((r) => selectedRecordIds.includes(r.id));
    const items = selectedRecords.map((r) => ({
      recordId: r.id,
      employeeId: r.employeeId,
      date: r.date
    }));

    const newKeys = items.map((i) => `${i.employeeId}::${i.date}`);
    const updatedKeys = [...new Set([...deletedRosterKeys, ...newKeys])];

    // Optimistically remove all selected records from table immediately
    saveDeletedKeys(updatedKeys);
    setRecords((prev) =>
      prev.filter(
        (r) =>
          !selectedRecordIds.includes(r.id) &&
          !items.some((i) => i.employeeId === r.employeeId && i.date === r.date)
      )
    );
    setSelectedRecordIds([]);

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/attendance`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          recordIds: selectedRecordIds,
          date: selectedDate
        })
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg(
          `Successfully deleted ${items.length} attendance record(s).`
        );
        setIsBulkDeleteModalOpen(false);
        fetchAttendance(selectedDate);
      } else {
        alert(json.error || 'Failed to delete selected records');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to communicate with server');
    } finally {
      setBulkDeleting(false);
    }
  };

  // Shift Management: Save Shift Timing
  const handleSaveShiftTiming = async (shiftId: string) => {
    const edit = editingShiftMap[shiftId];
    if (!edit) return;
    setShiftSavingId(shiftId);
    setShiftMsg(null);

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/shifts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId,
          name: edit.name,
          startTime: edit.startTime,
          endTime: edit.endTime,
          graceMinutes: Number(edit.graceMinutes) || 15
        })
      });

      const json = await res.json();
      if (json.success) {
        setShiftMsg({
          type: 'success',
          message: `Shift "${json.data.name}" updated successfully (${edit.startTime} - ${edit.endTime}, ${edit.graceMinutes}m grace)!`
        });
        fetchAttendance(selectedDate);
      } else {
        setShiftMsg({ type: 'error', message: json.error || 'Failed to update shift' });
      }
    } catch (err) {
      console.error(err);
      setShiftMsg({ type: 'error', message: 'Failed to communicate with server' });
    } finally {
      setShiftSavingId(null);
    }
  };

  // Shift Management: Add Shift
  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShiftName.trim()) return;
    setShiftSavingId('new');
    setShiftMsg(null);

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newShiftName.trim(),
          startTime: newShiftStart,
          endTime: newShiftEnd,
          graceMinutes: Number(newShiftGrace) || 15
        })
      });

      const json = await res.json();
      if (json.success) {
        setNewShiftName('');
        setShiftMsg({ type: 'success', message: `Shift "${json.data.name}" added successfully!` });
        fetchAttendance(selectedDate);
      } else {
        setShiftMsg({ type: 'error', message: json.error || 'Failed to add shift' });
      }
    } catch (err) {
      console.error(err);
      setShiftMsg({ type: 'error', message: 'Failed to communicate with server' });
    } finally {
      setShiftSavingId(null);
    }
  };

  // Shift Management: Delete Shift
  const handleDeleteShift = async (shiftId: string, shiftName: string) => {
    if (!confirm(`Are you sure you want to delete shift "${shiftName}"?`)) return;
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/shifts`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftId, shiftName })
      });
      const json = await res.json();
      if (json.success) {
        setShiftMsg({ type: 'success', message: `Shift "${shiftName}" deleted successfully` });
        fetchAttendance(selectedDate);
      } else {
        setShiftMsg({ type: 'error', message: json.error || 'Failed to delete shift' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter records by status, deleted exclusions, and role
  const visibleRecords = records.filter((r) => {
    if (deletedRosterKeys.includes(`${r.employeeId}::${r.date}`)) {
      return false;
    }

    if (isEmployeeOnly) {
      if (!currentEmp) return true;
      if (r.employeeId !== currentEmp.id) return false;
    }

    if (statusFilter === 'PRESENT') return r.status === 'PRESENT';
    if (statusFilter === 'LATE_ENTRY') return r.status === 'LATE_ENTRY';
    if (statusFilter === 'HALF_DAY') return r.status === 'HALF_DAY';
    if (statusFilter === 'ON_LEAVE') return r.status === 'ON_LEAVE';
    if (statusFilter === 'ABSENT') return r.status === 'ABSENT';
    return true;
  });

  // Selection helpers
  const isAllVisibleSelected =
    visibleRecords.length > 0 && visibleRecords.every((r) => selectedRecordIds.includes(r.id));
  const isSomeVisibleSelected =
    visibleRecords.some((r) => selectedRecordIds.includes(r.id)) && !isAllVisibleSelected;

  const toggleSelectAll = () => {
    if (isAllVisibleSelected) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(visibleRecords.map((r) => r.id));
    }
  };

  const toggleSelectRecord = (id: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllWorkforce = () => {
    setSelectedRecordIds(records.map((r) => r.id));
  };

  const handleClearSelection = () => {
    setSelectedRecordIds([]);
  };

  const pendingRegsCount = regularizations.filter((r) => r.status === 'PENDING').length;
  const approvedRegsCount = regularizations.filter((r) => r.status === 'APPROVED').length;
  const rejectedRegsCount = regularizations.filter((r) => r.status === 'REJECTED').length;

  const targetRegEmp = employees.find((e) => e.id === (isEmployeeOnly ? currentEmp?.id || regEmpId : regEmpId));

  const getRequestedHours = (inTime: string, outTime: string) => {
    try {
      const [inH, inM] = inTime.split(':').map(Number);
      const [outH, outM] = outTime.split(':').map(Number);
      if (!isNaN(inH) && !isNaN(outH)) {
        const diff = outH * 60 + outM - (inH * 60 + inM);
        if (diff > 0) return `${(diff / 60).toFixed(1)} hrs`;
      }
    } catch {
      // fallback
    }
    return '8.5 hrs';
  };

  const activeShift = stats?.activeShift || (shifts.length > 0 ? {
    id: shifts[0].id,
    name: shifts[0].name,
    startTime: shifts[0].startTime,
    endTime: shifts[0].endTime,
    graceMinutes: shifts[0].graceMinutes ?? 15,
    formattedStart: formatTimeTo12Hour(shifts[0].startTime),
    formattedEnd: formatTimeTo12Hour(shifts[0].endTime),
    lateCutoff: getLateCutoffDisplay(shifts[0].startTime, shifts[0].graceMinutes ?? 15)
  } : {
    id: 'default',
    name: 'General Day Shift',
    startTime: '09:00',
    endTime: '18:00',
    graceMinutes: 15,
    formattedStart: '09:00 AM',
    formattedEnd: '06:00 PM',
    lateCutoff: '09:15 AM'
  });

  return (
    <RoleGuard
      tenantSlug={tenantSlug}
      requiredRoles={['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']}
      moduleName="Attendance, Shifts & Regularization"
    >
      <div className="space-y-6 max-w-7xl text-slate-900 pb-16 font-sans">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-6 h-6 text-emerald-600" />
              {isEmployeeOnly ? 'My Attendance & Regularization' : 'Workforce Attendance & Shifts'}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Industry standard shift timings, grace periods, half-day calculations, approved leave sync, and manager regularizations for{' '}
              {tenant?.name || 'Workspace'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Shift Policy Badge (Synced dynamically) */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {activeShift.name}: <strong>{activeShift.formattedStart} - {activeShift.formattedEnd}</strong> ({activeShift.graceMinutes}m grace)
              </span>
            </div>

            {/* Request Regularization Action Button */}
            <button
              onClick={() => {
                setRegFeedback(null);
                setIsRegModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-102 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Request Regularization</span>
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fade-in shadow-xs">
            <span>✓ {statusMsg}</span>
            <button
              onClick={() => setStatusMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Primary Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'attendance'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Daily Workforce Roster</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
              {stats.presentCount} Present
            </span>
          </button>

          <button
            onClick={() => setActiveTab('regularizations')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'regularizations'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Regularization Approvals</span>
            {pendingRegsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-extrabold animate-pulse">
                {pendingRegsCount} Pending
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-semibold">
                {regularizations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('shifts')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'shifts'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Shift Schedules & Grace Policies</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
              {shifts.length} Configured
            </span>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: DAILY ATTENDANCE & PUNCH ROSTER */}
        {/* ==================================================================== */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Employee Self-Service Punch Card (Punched by Employee Only) */}
            {currentEmp ? (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>My Real-Time Web Punch Terminal ({currentEmp.firstName} {currentEmp.lastName})</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {myTodayRecord?.clockInTime
                      ? `Clocked In today at ${myTodayRecord.clockInTime}${myTodayRecord.clockOutTime ? ` · Clocked Out at ${myTodayRecord.clockOutTime}` : ' (In Progress)'}`
                      : 'Not Clocked In Yet Today'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Shift: <strong>{currentEmp.shiftName || activeShift.name} ({activeShift.formattedStart} - {activeShift.formattedEnd})</strong>. {activeShift.graceMinutes}-minute grace period applies.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePunch('IN')}
                    disabled={punchLoading || Boolean(myTodayRecord?.clockInTime)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all hover:scale-102 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{myTodayRecord?.clockInTime ? 'Already Clocked In' : 'Clock In Now'}</span>
                  </button>

                  <button
                    onClick={() => handlePunch('OUT')}
                    disabled={punchLoading || !myTodayRecord?.clockInTime || Boolean(myTodayRecord?.clockOutTime)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs shadow-xs transition-all hover:scale-102 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-slate-700" />
                    <span>{myTodayRecord?.clockOutTime ? 'Clocked Out' : 'Clock Out'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Non-Employee Session Info Banner */
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Workforce Audit Compliance:</strong> Attendance punches are strictly registered by employees via their Self-Service portal. Automated simulation has been disabled.
                  </span>
                </div>
              </div>
            )}

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Workforce</div>
                <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{stats.totalEmployees}</div>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Active employees</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/90 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Present (On-Time)</div>
                <div className="text-2xl font-black text-emerald-800 mt-1 font-mono">{stats.onTimeCount}</div>
                <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Punched within grace</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Late Arrivals</div>
                <div className="text-2xl font-black text-amber-800 mt-1 font-mono">{stats.lateCount}</div>
                <p className="text-[10px] text-amber-600 font-medium mt-0.5">Punched after {activeShift.lateCutoff}</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/90 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Half Day</div>
                <div className="text-2xl font-black text-indigo-800 mt-1 font-mono">{stats.halfDayCount}</div>
                <p className="text-[10px] text-indigo-600 font-medium mt-0.5">4.0 - 7.5 hrs worked</p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/90 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Absent / On Leave</div>
                <div className="text-2xl font-black text-rose-800 mt-1 font-mono">
                  {stats.absentCount + stats.onLeaveCount}
                </div>
                <p className="text-[10px] text-rose-600 font-medium mt-0.5">
                  {stats.onLeaveCount} On Leave · {stats.absentCount} Unpunched
                </p>
              </div>
            </div>

            {/* Attendance Roster Controls & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Status:
                </span>
                {(
                  [
                    { key: 'ALL', label: `All (${records.length})` },
                    { key: 'PRESENT', label: `Present (${stats.onTimeCount})` },
                    { key: 'LATE_ENTRY', label: `Late (${stats.lateCount})` },
                    { key: 'HALF_DAY', label: `Half Day (${stats.halfDayCount})` },
                    { key: 'ON_LEAVE', label: `On Leave (${stats.onLeaveCount})` },
                    { key: 'ABSENT', label: `Absent (${stats.absentCount})` }
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === tab.key
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Roster Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Bulk Action Sticky Bar when items are selected */}
            {canManageAttendance && selectedRecordIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-800 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center">
                    {selectedRecordIds.length}
                  </div>
                  <div>
                    <span className="font-bold text-xs">
                      {selectedRecordIds.length} of {records.length} records selected
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Bulk actions will apply to all selected employee attendance records for {selectedDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {selectedRecordIds.length < records.length && (
                    <button
                      type="button"
                      onClick={handleSelectAllWorkforce}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Select All ({records.length})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Clear Selection
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBulkDeleteModalOpen(true)}
                    className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedRecordIds.length})</span>
                  </button>
                </div>
              </div>
            )}

            {/* Attendance Roster Table */}
            <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Daily Attendance Log & Shift Calculation
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Calculated for date <strong>{selectedDate}</strong> based on {activeShift.name} ({activeShift.formattedStart} - {activeShift.formattedEnd}, {activeShift.graceMinutes}m grace).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {canManageAttendance && visibleRecords.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Select or deselect all visible records"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isAllVisibleSelected ? 'Deselect All' : 'Select All at Once'}</span>
                    </button>
                  )}
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                    {visibleRecords.length} Employees Listed
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 uppercase font-bold text-[10px] text-slate-500 tracking-wider border-b border-slate-200">
                    <tr>
                      {canManageAttendance && (
                        <th className="w-12 px-4 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isAllVisibleSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = isSomeVisibleSelected;
                            }}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            title={isAllVisibleSelected ? 'Deselect all' : 'Select all visible records'}
                          />
                        </th>
                      )}
                      <th className="px-5 py-3.5">Employee</th>
                      <th className="px-5 py-3.5">Assigned Shift</th>
                      <th className="px-5 py-3.5">Clock In</th>
                      <th className="px-5 py-3.5">Clock Out</th>
                      <th className="px-5 py-3.5">Effective Hours</th>
                      <th className="px-5 py-3.5">Calculated Status</th>
                      <th className="px-5 py-3.5">Audit Method / Note</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {visibleRecords.length === 0 ? (
                      <tr>
                        <td colSpan={canManageAttendance ? 9 : 8} className="px-6 py-12 text-center text-slate-400 text-xs">
                          <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500/80" />
                            <span className="font-bold text-slate-700 text-sm">No Attendance Records for {selectedDate}</span>
                            <p className="text-slate-500 text-xs leading-relaxed">
                              All attendance records for this date have been deleted or no employees have clocked in yet.
                            </p>
                            {canManageAttendance && (
                              <button
                                type="button"
                                onClick={async () => {
                                  saveDeletedKeys([]);
                                  await fetch(`/api/tenants/${tenantSlug}/attendance?date=${selectedDate}&reset=true&t=${Date.now()}`);
                                  fetchAttendance(selectedDate);
                                }}
                                className="mt-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
                              >
                                Restore Workforce Roster
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      visibleRecords.map((r) => {
                        const isSelected = selectedRecordIds.includes(r.id);
                        const emp = employees.find((e) => e.id === r.employeeId);
                        const isUnpunched = r.status === 'ABSENT' || !r.clockInTime;
                        const isLate = r.status === 'LATE_ENTRY';
                        const isHalf = r.status === 'HALF_DAY';

                        return (
                          <tr
                            key={r.id}
                            className={`transition-colors ${
                              isSelected ? 'bg-emerald-50/70 hover:bg-emerald-50' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            {canManageAttendance && (
                              <td className="w-12 px-4 py-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectRecord(r.id)}
                                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                              </td>
                            )}
                            <td className="px-5 py-4">
                              <div className="font-bold text-slate-900">{r.employeeName}</div>
                              <div className="text-[10px] font-mono text-slate-500">
                                {emp?.employeeCode || 'EMP'} · {emp?.departmentName || 'General'}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              {(() => {
                                const rowShift =
                                  shifts.find(
                                    (s) =>
                                      s.name?.toLowerCase().trim() === r.shiftName?.toLowerCase().trim() ||
                                      s.id === r.shiftName
                                  ) || activeShift;
                                return (
                                  <>
                                    <span className="font-semibold text-slate-800 text-[11px]">
                                      {rowShift?.name || r.shiftName || 'General Day Shift'}
                                    </span>
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      {formatTimeTo12Hour(rowShift?.startTime || '09:00')} -{' '}
                                      {formatTimeTo12Hour(rowShift?.endTime || '18:00')} ({rowShift?.graceMinutes ?? 15}m grace)
                                    </div>
                                  </>
                                );
                              })()}
                            </td>

                            <td className="px-5 py-4 font-mono font-semibold">
                              {r.clockInTime ? (
                                <span className={isLate ? 'text-amber-700' : 'text-emerald-700'}>
                                  {r.clockInTime}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-sans">—</span>
                              )}
                            </td>

                            <td className="px-5 py-4 font-mono font-semibold">
                              {r.clockOutTime ? (
                                <span className="text-slate-800">{r.clockOutTime}</span>
                              ) : r.clockInTime ? (
                                <span className="text-amber-600 text-[11px] font-sans font-medium">
                                  In Progress
                                </span>
                              ) : (
                                <span className="text-slate-400 font-sans">—</span>
                              )}
                            </td>

                            <td className="px-5 py-4 font-bold font-mono text-slate-900">
                              {r.workingHours > 0
                                ? `${r.workingHours.toFixed(1)} hrs`
                                : r.clockInTime && !r.clockOutTime
                                ? 'In Progress'
                                : '0.0 hrs'}
                            </td>

                            <td className="px-5 py-4">
                              {r.status === 'PRESENT' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                  PRESENT
                                </span>
                              )}
                              {r.status === 'LATE_ENTRY' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  LATE ENTRY
                                </span>
                              )}
                              {r.status === 'HALF_DAY' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                                  HALF DAY
                                </span>
                              )}
                              {r.status === 'ON_LEAVE' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                  <Calendar className="w-3 h-3 text-blue-600" />
                                  ON LEAVE
                                </span>
                              )}
                              {r.status === 'ABSENT' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                  ABSENT
                                </span>
                              )}
                              {r.status === 'HOLIDAY' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  WEEK OFF
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4 text-slate-600 text-[11px]">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[190px]">
                                  {r.notes || (r.clockInTime ? 'Mobile Web Punch' : 'Unpunched')}
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {(isUnpunched || isLate || isHalf) && (
                                  <button
                                    onClick={() => handleQuickRegularize(r.employeeId, r.date)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] transition-colors cursor-pointer"
                                    title="Submit regularization request for this date"
                                  >
                                    Regularize
                                  </button>
                                )}

                                {canManageAttendance && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditRecord(r)}
                                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-300 font-semibold text-[11px] transition-colors cursor-pointer"
                                      title="Edit attendance record"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingRecord(r)}
                                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 font-semibold text-[11px] transition-colors cursor-pointer"
                                      title="Delete attendance record"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: REGULARIZATION REQUESTS & MANAGER APPROVAL FLOW */}
        {/* ==================================================================== */}
        {activeTab === 'regularizations' && (
          <div className="space-y-6">
            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Requests
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-900">{regularizations.length}</span>
                  <History className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500">Across entire organization</p>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                  Pending Approvals
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-amber-700">{pendingRegsCount}</span>
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-[11px] text-amber-600 font-medium">Awaiting manager action</p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                  Approved Regularizations
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-emerald-700">{approvedRegsCount}</span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-[11px] text-emerald-600 font-medium">Updated to attendance</p>
              </div>

              <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200/90 shadow-xs space-y-1">
                <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                  Rejected Requests
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-rose-700">{rejectedRegsCount}</span>
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <p className="text-[11px] text-rose-600 font-medium">Dismissed by managers</p>
              </div>
            </div>

            {/* Regularizations Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Filter:
                </span>
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setRegFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      regFilter === st
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'All Requests'
                      : st === 'PENDING'
                      ? `Pending (${pendingRegsCount})`
                      : st === 'APPROVED'
                      ? `Approved (${approvedRegsCount})`
                      : `Rejected (${rejectedRegsCount})`}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setRegFeedback(null);
                  setIsRegModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer self-start sm:self-auto"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit New Regularization</span>
              </button>
            </div>

            {/* Regularizations Table */}
            <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    {isEmployeeOnly
                      ? 'My Attendance Regularization Requests'
                      : 'All Regularization Requests & Approvals'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isEmployeeOnly
                      ? 'Track review status and feedback from your reporting manager.'
                      : 'Review and approve time adjustment requests submitted by your team members.'}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {regularizations.length} Items
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 uppercase font-semibold text-[10px] text-slate-500 tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Employee</th>
                      <th className="px-6 py-3.5">Attendance Date</th>
                      <th className="px-6 py-3.5">Requested Hours</th>
                      <th className="px-6 py-3.5">Reason & Remarks</th>
                      <th className="px-6 py-3.5">Reporting Manager</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {regularizations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <History className="w-8 h-8 text-slate-300" />
                            <span>No regularization requests submitted yet.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      regularizations
                        .filter((r) => {
                          if (regFilter === 'PENDING') return r.status === 'PENDING';
                          if (regFilter === 'APPROVED') return r.status === 'APPROVED';
                          if (regFilter === 'REJECTED') return r.status === 'REJECTED';
                          return true;
                        })
                        .map((reg) => (
                          <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">{reg.employeeName}</td>
                            <td className="px-6 py-4 font-mono font-semibold text-emerald-800">
                              {reg.attendanceDate}
                            </td>
                            <td className="px-6 py-4 font-mono">
                              {reg.requestedClockIn} - {reg.requestedClockOut} (
                              {getRequestedHours(reg.requestedClockIn, reg.requestedClockOut)})
                            </td>
                            <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{reg.reason}</td>
                            <td className="px-6 py-4 text-slate-500">
                              {reg.managerName || 'Reporting Lead'}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  reg.status === 'APPROVED'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : reg.status === 'REJECTED'
                                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {reg.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {isAdmin && reg.status === 'PENDING' && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setReviewingReg(reg);
                                      setReviewAction('APPROVED');
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReviewingReg(reg);
                                      setReviewAction('REJECTED');
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
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

        {/* ==================================================================== */}
        {/* TAB 3: SHIFT SCHEDULES & BIOMETRIC GRACE POLICIES */}
        {/* ==================================================================== */}
        {activeTab === 'shifts' && (
          <div className="space-y-6 animate-fade-in text-xs">
            {/* Banner */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <span>Shift Schedules & Biometric Grace Minutes</span>
                </h2>
                <p className="text-slate-500 mt-1">
                  Configure factory shifts, standard working hours, and biometric grace periods for automatic late entry and half-day marking.
                </p>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold text-xs">
                {shifts.length} Active Shift Policies
              </div>
            </div>

            {shiftMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs ${
                  shiftMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                <span>{shiftMsg.message}</span>
                <button
                  onClick={() => setShiftMsg(null)}
                  className="font-bold hover:underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Configured Shifts Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shifts.map((s) => {
                const edit = editingShiftMap[s.id] || {
                  startTime: s.startTime,
                  endTime: s.endTime,
                  graceMinutes: s.graceMinutes,
                  name: s.name
                };

                return (
                  <div
                    key={s.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 transition-all hover:border-emerald-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{s.name}</span>
                        {s.isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                            Default Shift
                          </span>
                        )}
                      </div>

                      {shifts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteShift(s.id, s.name)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title={`Delete shift ${s.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={edit.startTime}
                          onChange={(e) =>
                            setEditingShiftMap({
                              ...editingShiftMap,
                              [s.id]: { ...edit, startTime: e.target.value }
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={edit.endTime}
                          onChange={(e) =>
                            setEditingShiftMap({
                              ...editingShiftMap,
                              [s.id]: { ...edit, endTime: e.target.value }
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Grace (mins)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="60"
                          value={edit.graceMinutes}
                          onChange={(e) =>
                            setEditingShiftMap({
                              ...editingShiftMap,
                              [s.id]: { ...edit, graceMinutes: Number(e.target.value) }
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <span>Cutoff for On-Time Punch:</span>
                      <strong className="text-emerald-700 font-mono">
                        {getLateCutoffDisplay(edit.startTime, edit.graceMinutes)}
                      </strong>
                    </div>

                    <button
                      type="button"
                      disabled={shiftSavingId === s.id}
                      onClick={() => handleSaveShiftTiming(s.id)}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{shiftSavingId === s.id ? 'Updating...' : 'Update Shift Timing'}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Configure Additional Shift Form */}
            <form
              onSubmit={handleAddShift}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
            >
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" />
                Configure Additional Shift
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Shift Name</label>
                  <input
                    type="text"
                    required
                    value={newShiftName}
                    onChange={(e) => setNewShiftName(e.target.value)}
                    placeholder="e.g. Night Assembly C"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newShiftStart}
                    onChange={(e) => setNewShiftStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={newShiftEnd}
                    onChange={(e) => setNewShiftEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Grace Period (Mins)</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={newShiftGrace}
                    onChange={(e) => setNewShiftGrace(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={shiftSavingId === 'new'}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{shiftSavingId === 'new' ? 'Adding...' : 'Add Shift Policy'}</span>
                </button>
              </div>
            </form>

            {/* Industrial Attendance Policy Reference */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Industry Standard Attendance Policy Rules
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                <li>
                  <strong>Grace Period:</strong> Clocking in within <strong>{activeShift.graceMinutes} minutes</strong> of shift start marks <strong>PRESENT</strong>.
                </li>
                <li>
                  <strong>Late Entry:</strong> Clocking in after <strong>{activeShift.lateCutoff}</strong> is automatically marked <strong>LATE ENTRY</strong>.
                </li>
                <li>
                  <strong>Half Day:</strong> Employees working between <strong>4.0 and 7.5 hours</strong> are calculated as <strong>HALF DAY</strong>.
                </li>
                <li>
                  <strong>Full Day Present:</strong> Completing <strong>7.5+ hours</strong> of active working hours qualifies as <strong>PRESENT</strong>.
                </li>
                <li>
                  <strong>Unpunched / Absent:</strong> Any employee without punch logs or approved leave on a working day is marked <strong>ABSENT</strong>.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Super Admin Edit Attendance Record Modal */}
        {editingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-base font-bold">Edit Attendance Record (Super Admin)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRecord(null);
                    setEditFeedback(null);
                  }}
                  className="text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAttendanceRecord} className="p-6 space-y-4 text-xs">
                {editFeedback && (
                  <div
                    className={`p-3 rounded-xl flex items-center gap-2 ${
                      editFeedback.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    {editFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{editFeedback.message}</span>
                  </div>
                )}

                {/* Employee & Date (Header) */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">{editingRecord.employeeName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Date: {editingRecord.date}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                    Current: {editingRecord.status}
                  </span>
                </div>

                {/* Clock In / Out Times */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Clock In Time</label>
                    <input
                      type="text"
                      value={editClockIn}
                      onChange={(e) => setEditClockIn(e.target.value)}
                      placeholder="e.g. 10:00 AM"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Clock Out Time</label>
                    <input
                      type="text"
                      value={editClockOut}
                      onChange={(e) => setEditClockOut(e.target.value)}
                      placeholder="e.g. 07:00 PM"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Status & Hours */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Attendance Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 font-bold"
                    >
                      <option value="PRESENT">PRESENT</option>
                      <option value="LATE_ENTRY">LATE ENTRY</option>
                      <option value="HALF_DAY">HALF DAY</option>
                      <option value="ON_LEAVE">ON LEAVE</option>
                      <option value="ABSENT">ABSENT</option>
                      <option value="HOLIDAY">WEEK OFF / HOLIDAY</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Working Hours (hrs)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="24"
                      value={editHours}
                      onChange={(e) => setEditHours(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Assigned Shift */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Shift Policy</label>
                  <select
                    value={editShiftName}
                    onChange={(e) => setEditShiftName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.startTime} - {s.endTime}, {s.graceMinutes}m grace)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Audit Note */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Method / Audit Note</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="e.g. Regularized by Super Admin"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRecord(null);
                      setEditFeedback(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{editSubmitting ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Super Admin Delete Confirmation Modal */}
        {deletingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-rose-700 px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-rose-200" />
                  <h3 className="text-base font-bold">Delete Attendance Record</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDeletingRecord(null)}
                  className="text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <p className="text-slate-700 leading-relaxed">
                  Are you sure you want to delete the attendance punch for <strong>{deletingRecord.employeeName}</strong> on <strong>{deletingRecord.date}</strong>?
                </p>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium leading-relaxed">
                  ⚠️ Deleting will clear all punch hours and reset this employee to <strong>Unpunched (Absent)</strong> for this date.
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDeletingRecord(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleteSubmitting}
                    onClick={handleConfirmDeleteRecord}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deleteSubmitting ? 'Deleting...' : 'Delete Record'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Super Admin Bulk Delete Confirmation Modal */}
        {isBulkDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-rose-700 px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-rose-200" />
                  <h3 className="text-base font-bold">Delete Selected Records ({selectedRecordIds.length})</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  className="text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <p className="text-slate-700 leading-relaxed font-medium">
                  Are you sure you want to delete and reset <strong>{selectedRecordIds.length}</strong> attendance record(s) on <strong>{selectedDate}</strong>?
                </p>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                  ⚠️ This action will delete any recorded punches or shift times for all selected employees, resetting them to <strong>Unpunched (Absent)</strong>.
                </div>

                <div className="max-h-40 overflow-y-auto p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1 font-mono text-[11px]">
                  {records
                    .filter((r) => selectedRecordIds.includes(r.id))
                    .map((r) => (
                      <div
                        key={r.id}
                        className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0"
                      >
                        <span className="font-semibold text-slate-900 font-sans">{r.employeeName}</span>
                        <span className="text-[10px] text-slate-500">
                          {r.clockInTime ? `${r.clockInTime} - ${r.clockOutTime || 'In Progress'}` : 'Unpunched'}
                        </span>
                      </div>
                    ))}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsBulkDeleteModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={bulkDeleting}
                    onClick={handleConfirmBulkDelete}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{bulkDeleting ? 'Deleting...' : `Delete All ${selectedRecordIds.length} Records`}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Regularization Modal */}
        {isRegModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-emerald-700 px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-200" />
                  <h3 className="text-base font-bold">Request Attendance Regularization</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRegModalOpen(false)}
                  className="text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitRegularization} className="p-6 space-y-4 text-xs">
                {regFeedback && (
                  <div
                    className={`p-3 rounded-xl flex items-center gap-2 ${
                      regFeedback.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    {regFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{regFeedback.message}</span>
                  </div>
                )}

                {/* Employee Selection */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee *</label>
                  {isEmployeeOnly ? (
                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-800">
                      {user?.name || 'Employee'}
                    </div>
                  ) : (
                    <select
                      value={regEmpId}
                      onChange={(e) => setRegEmpId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                    >
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.firstName} {e.lastName} ({e.employeeCode})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Attendance Date *</label>
                  <input
                    type="date"
                    required
                    value={regDate}
                    onChange={(e) => setRegDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Clock In *</label>
                    <input
                      type="time"
                      required
                      value={regClockIn}
                      onChange={(e) => setRegClockIn(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Clock Out *</label>
                    <input
                      type="time"
                      required
                      value={regClockOut}
                      onChange={(e) => setRegClockOut(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Reason Category */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reason Category *</label>
                  <select
                    value={regReasonCategory}
                    onChange={(e) => setRegReasonCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Missed Punch / Forgot to Clock In or Out">Missed Punch (Forgot to Clock In / Out)</option>
                    <option value="Biometric Machine / Device Sync Glitch">Biometric Machine / Device Sync Glitch</option>
                    <option value="Official Duty / Client Site Visit">Official Duty / Client Site Visit (On-Duty)</option>
                    <option value="Work From Home / Remote Approval">Work From Home / Approved Remote Duty</option>
                    <option value="Late Entry / Grace Period Exemption">Late Entry / Grace Period Exemption</option>
                    <option value="Technical Glitch / Internet Outage">Technical Glitch / Network Disruption</option>
                    <option value="Other Official Reason">Other Official Reason</option>
                  </select>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Notes / Explanation (Optional)</label>
                  <textarea
                    rows={2}
                    value={regRemarks}
                    onChange={(e) => setRegRemarks(e.target.value)}
                    placeholder="Provide details for your manager..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsRegModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={regSubmitting}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{regSubmitting ? 'Submitting...' : 'Submit Request'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Manager Review Modal */}
        {reviewingReg && reviewAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
              <div
                className={`px-6 py-4 text-white flex items-center justify-between ${
                  reviewAction === 'APPROVED' ? 'bg-emerald-700' : 'bg-rose-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {reviewAction === 'APPROVED' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-200" />
                  )}
                  <h3 className="text-base font-bold">
                    {reviewAction === 'APPROVED' ? 'Approve Regularization' : 'Reject Regularization'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReviewingReg(null);
                    setReviewAction(null);
                  }}
                  className="text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {reviewFeedback && (
                  <div
                    className={`p-3 rounded-xl flex items-center gap-2 ${
                      reviewFeedback.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    {reviewFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{reviewFeedback.message}</span>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{reviewingReg.employeeName}</span>
                    <span className="font-mono text-emerald-700 font-bold">{reviewingReg.attendanceDate}</span>
                  </div>
                  <div className="text-slate-600">
                    Requested Shift: <strong>{reviewingReg.requestedClockIn}</strong> to{' '}
                    <strong>{reviewingReg.requestedClockOut}</strong> (
                    {getRequestedHours(reviewingReg.requestedClockIn, reviewingReg.requestedClockOut)})
                  </div>
                  <div className="text-slate-700 pt-1 border-t border-slate-200/80">
                    <span className="font-semibold text-slate-500">Employee Note: </span>
                    {reviewingReg.reason}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Manager Review Comments
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={
                      reviewAction === 'APPROVED'
                        ? 'e.g. Approved - client site visit verified'
                        : 'e.g. Inconsistent with badge entry records'
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewingReg(null);
                      setReviewAction(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReviewRegularization}
                    disabled={reviewSubmitting}
                    className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer ${
                      reviewAction === 'APPROVED'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {reviewAction === 'APPROVED' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    <span>
                      {reviewSubmitting
                        ? 'Processing...'
                        : reviewAction === 'APPROVED'
                        ? 'Confirm Approval'
                        : 'Confirm Rejection'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
