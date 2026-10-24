'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Building2,
  Users,
  Clock,
  Calendar,
  CreditCard,
  Upload,
  Mail,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Save,
  Plus,
  Trash2,
  Download,
  Copy,
  ExternalLink,
  Check,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { Tenant, OnboardingStep, Department, Designation, Shift, LeaveType, Employee, Invitation } from '@/lib/types';
import RoleGuard from '@/components/RoleGuard';

const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'UTC'
];

const FINANCIAL_YEARS = [
  'April - March',
  'January - December',
  'July - June',
  'October - September'
];

const PRESET_COLORS = [
  { name: 'Amber Gold', value: '#D97706' },
  { name: 'Emerald Green', value: '#059669' },
  { name: 'Indigo Corporate', value: '#4F46E5' },
  { name: 'Cobalt Blue', value: '#2563EB' },
  { name: 'Crimson Red', value: '#E11D48' }
];

export default function CompanySetupWizardPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [checklist, setChecklist] = useState<OnboardingStep[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Sub-resources
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Step 1: Profile form state
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [financialYear, setFinancialYear] = useState('April - March');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [postalCode, setPostalCode] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [primaryColor, setPrimaryColor] = useState('#D97706');
  const [logoUrl, setLogoUrl] = useState('');

  // Step 2: Department form state
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');

  // Step 4: Shift form state
  const [editingShifts, setEditingShifts] = useState<Record<string, { startTime: string; endTime: string; graceMinutes: number }>>({});
  const [newShiftName, setNewShiftName] = useState('');
  const [newShiftStart, setNewShiftStart] = useState('14:30');
  const [newShiftEnd, setNewShiftEnd] = useState('23:00');
  const [newShiftGrace, setNewShiftGrace] = useState(10);

  // Step 4: Working Days & Weekly Off Policy state
  const [workingDays, setWorkingDays] = useState<string[]>([
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
  ]);
  const [weeklyOffDays, setWeeklyOffDays] = useState<string[]>([]);
  const [savingWorkingDays, setSavingWorkingDays] = useState(false);

  // Step 5: Leave form state
  const [editingLeaves, setEditingLeaves] = useState<Record<string, number>>({});
  const [newLeaveName, setNewLeaveName] = useState('');
  const [newLeaveCode, setNewLeaveCode] = useState('');
  const [newLeaveDays, setNewLeaveDays] = useState(10);

  // Step 6: Payroll wage percentages
  const [basicPct, setBasicPct] = useState(50);
  const [hraPct, setHraPct] = useState(25);
  const [specialPct, setSpecialPct] = useState(25);
  const [pfPct, setPfPct] = useState(0);
  const [sampleSalary, setSampleSalary] = useState(60000);

  // Step 7: Employee Import simulation
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Step 8: Invitations
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tenants/${tenantSlug}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' }
      });
      const json = await res.json();

      if (json.success && json.data) {
        const t: Tenant = json.data.tenant;
        setTenant(t);
        setCompanyName(t.name || '');
        setIndustry(t.industry || 'Manufacturing & Technology');
        setTimezone(t.timezone || 'Asia/Kolkata');
        setFinancialYear(t.financialYear || 'April - March');
        setBusinessEmail(t.businessEmail || '');
        setBusinessPhone(t.businessPhone || '');
        setRegisteredAddress(t.registeredAddress || '');
        setCity(t.city || '');
        setState(t.state || '');
        setCountry(t.country || 'India');
        setPostalCode(t.postalCode || '');
        setCurrency(t.currency || 'INR');
        setPrimaryColor(t.primaryColor || '#D97706');
        setLogoUrl(t.logoUrl || '');
        setChecklist(t.onboardingChecklist || []);
        if (t.workingDays) {
          setWorkingDays(t.workingDays);
        }
        if (t.weeklyOffDays !== undefined) {
          setWeeklyOffDays(t.weeklyOffDays);
        }

        setDepartments(json.data.departments || []);
        setDesignations(json.data.designations || []);

        const initialShifts: Shift[] = json.data.shifts || [];
        setShifts(initialShifts);
        const shiftMap: Record<string, { startTime: string; endTime: string; graceMinutes: number }> = {};
        initialShifts.forEach((s) => {
          shiftMap[s.id] = { startTime: s.startTime, endTime: s.endTime, graceMinutes: s.graceMinutes };
        });
        setEditingShifts(shiftMap);

        const initialLeaves: LeaveType[] = json.data.leaveTypes || [];
        setLeaveTypes(initialLeaves);
        const leaveMap: Record<string, number> = {};
        initialLeaves.forEach((lt) => {
          leaveMap[lt.id] = lt.daysPerYear;
        });
        setEditingLeaves(leaveMap);
      }

      // Also fetch employees and invitations for Step 8
      const [empRes, invRes] = await Promise.all([
        fetch(`/api/tenants/${tenantSlug}/employees?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/tenants/${tenantSlug}/invitations?t=${Date.now()}`, { cache: 'no-store' })
      ]);
      const [empJson, invJson] = await Promise.all([
        empRes.json().catch(() => ({})),
        invRes.json().catch(() => ({}))
      ]);
      if (empJson.success && empJson.data?.employees) {
        setEmployees(empJson.data.employees);
      }
      if (invJson.success && invJson.data?.invitations) {
        setInvitations(invJson.data.invitations);
      }
    } catch (err) {
      console.error('Failed to load setup data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) loadData();
  }, [tenantSlug]);

  const completedCount = checklist.filter((s) => s.completed).length;
  const progressPercent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  // Toggle step completion with server sync
  const handleToggleStep = async (index: number) => {
    const step = checklist[index];
    if (!step) return;

    const nextCompleted = !step.completed;
    const updated = [...checklist];
    updated[index] = { ...step, completed: nextCompleted };
    setChecklist(updated);

    try {
      await fetch(`/api/tenants/${tenantSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-step',
          stepId: step.id,
          completed: nextCompleted
        })
      });
      showToast(`${step.title} marked as ${nextCompleted ? 'completed' : 'pending'}`);
    } catch (e) {
      console.error(e);
    }
  };

  // Step 1: Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo file size must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
        showToast('Company logo updated');
      }
    };
    reader.readAsDataURL(file);
  };

  // Step 1: Save Profile
  const handleSaveProfile = async (advance: boolean = false) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyName,
          industry,
          timezone,
          financialYear,
          currency,
          businessEmail,
          businessPhone,
          registeredAddress,
          city,
          state,
          country,
          postalCode,
          primaryColor,
          logoUrl
        })
      });
      const json = await res.json();
      if (json.success) {
        setTenant(json.data.tenant);
        showToast('Company profile & operating calendar saved');
        router.refresh();

        // Mark step 1 completed
        if (!checklist[0]?.completed) {
          handleToggleStep(0);
        }
        if (advance && activeStepIndex < checklist.length - 1) {
          setActiveStepIndex(activeStepIndex + 1);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving company profile');
    } finally {
      setSaving(false);
    }
  };

  // Step 2: Add Department
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-department',
          name: newDeptName.trim(),
          code: newDeptCode.trim() || undefined
        })
      });
      const json = await res.json();
      if (json.success) {
        setDepartments([...departments, json.data]);
        setNewDeptName('');
        setNewDeptCode('');
        showToast(`Department "${json.data.name}" added successfully`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Step 2: Delete Department
  const handleDeleteDepartment = async (deptId: string, deptName: string) => {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete-department',
          departmentId: deptId
        })
      });
      const json = await res.json();
      if (json.success) {
        setDepartments(departments.filter((d) => d.id !== deptId));
        showToast(`Department "${deptName}" removed`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Step 4: Update Shift
  const handleSaveShift = async (shiftId: string) => {
    const edit = editingShifts[shiftId];
    if (!edit) return;

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-shift',
          shiftId,
          startTime: edit.startTime,
          endTime: edit.endTime,
          graceMinutes: Number(edit.graceMinutes) || 15
        })
      });
      const json = await res.json();
      if (json.success) {
        setShifts(shifts.map((s) => (s.id === shiftId ? json.data : s)));
        showToast(`Shift "${json.data.name}" updated: ${edit.startTime} - ${edit.endTime} (${edit.graceMinutes}m grace)`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Step 4: Add Shift
  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShiftName.trim()) return;

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-shift',
          name: newShiftName.trim(),
          startTime: newShiftStart,
          endTime: newShiftEnd,
          graceMinutes: newShiftGrace
        })
      });
      const json = await res.json();
      if (json.success) {
        const added: Shift = json.data;
        setShifts([...shifts, added]);
        setEditingShifts({
          ...editingShifts,
          [added.id]: { startTime: added.startTime, endTime: added.endTime, graceMinutes: added.graceMinutes }
        });
        setNewShiftName('');
        showToast(`Shift "${added.name}" configured`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Step 4: Delete Shift
  const handleDeleteShift = async (shiftId: string, shiftName: string) => {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete-shift',
          shiftId,
          shiftName
        })
      });
      const json = await res.json();
      if (json.success) {
        setShifts((prev) => {
          const updated = prev.filter((s) => s.id !== shiftId && s.name !== shiftName);
          if (updated.length > 0 && !updated.some((s) => s.isDefault)) {
            updated[0] = { ...updated[0], isDefault: true };
          }
          return updated;
        });
        showToast(`Shift "${shiftName}" removed`);
      } else {
        showToast(json.error || `Could not remove shift "${shiftName}"`);
      }
    } catch (err) {
      console.error(err);
      showToast('Error removing shift');
    }
  };

  // Step 4: Toggle Individual Day (Working vs Weekly Off)
  const handleToggleWorkingDay = (dayId: string) => {
    if (weeklyOffDays.includes(dayId)) {
      setWeeklyOffDays(weeklyOffDays.filter((d) => d !== dayId));
      if (!workingDays.includes(dayId)) {
        setWorkingDays([...workingDays, dayId]);
      }
    } else {
      setWorkingDays(workingDays.filter((d) => d !== dayId));
      if (!weeklyOffDays.includes(dayId)) {
        setWeeklyOffDays([...weeklyOffDays, dayId]);
      }
    }
  };

  // Step 4: Apply Working Days Preset Schedule
  const handleApplyPreset = (preset: '7_DAYS_WORK' | '6_DAYS_MON_SAT' | '5_DAYS_MON_FRI') => {
    if (preset === '7_DAYS_WORK') {
      setWorkingDays(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']);
      setWeeklyOffDays([]);
      showToast('Preset applied: All 7 Days Working (No Weekly Off - Goodwin Standard)');
    } else if (preset === '6_DAYS_MON_SAT') {
      setWorkingDays(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']);
      setWeeklyOffDays(['SUNDAY']);
      showToast('Preset applied: 6 Days Working (Mon - Sat Working, Sunday Off)');
    } else if (preset === '5_DAYS_MON_FRI') {
      setWorkingDays(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
      setWeeklyOffDays(['SATURDAY', 'SUNDAY']);
      showToast('Preset applied: 5 Days Working (Mon - Fri Working, Sat & Sun Off)');
    }
  };

  // Step 4: Save Working Days & Weekly Off Policy to Server
  const handleSaveWorkingDaysPolicy = async () => {
    try {
      setSavingWorkingDays(true);
      const res = await fetch(`/api/tenants/${tenantSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-working-days',
          workingDays,
          weeklyOffDays
        })
      });
      const json = await res.json();
      if (json.success) {
        if (json.data?.tenant) {
          setTenant(json.data.tenant);
        }
        showToast('Company Working Days & Weekly Off schedule saved successfully');
      } else {
        showToast(`Error: ${json.error || 'Failed to save schedule'}`);
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving working days policy');
    } finally {
      setSavingWorkingDays(false);
    }
  };

  // Step 5: Save Leave Policy
  const handleSaveLeaveType = async (ltId: string) => {
    const days = editingLeaves[ltId];
    if (days === undefined) return;

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-leave-type',
          leaveTypeId: ltId,
          daysPerYear: days
        })
      });
      const json = await res.json();
      if (json.success) {
        setLeaveTypes(leaveTypes.map((lt) => (lt.id === ltId ? json.data : lt)));
        showToast(`Leave policy for ${json.data.name} set to ${days} days/year`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Step 5: Add Leave Type
  const handleAddLeaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaveName.trim()) return;

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-leave-type',
          name: newLeaveName.trim(),
          code: newLeaveCode.trim() || 'LV',
          daysPerYear: newLeaveDays
        })
      });
      const json = await res.json();
      if (json.success) {
        const added: LeaveType = json.data;
        setLeaveTypes([...leaveTypes, added]);
        setEditingLeaves({ ...editingLeaves, [added.id]: added.daysPerYear });
        setNewLeaveName('');
        setNewLeaveCode('');
        showToast(`Leave policy "${added.name}" created`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Step 5: Delete Leave Type
  const handleDeleteLeaveType = async (ltId: string, ltName: string) => {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete-leave-type',
          leaveTypeId: ltId
        })
      });
      const json = await res.json();
      if (json.success) {
        setLeaveTypes(leaveTypes.filter((lt) => lt.id !== ltId));
        showToast(`Leave policy "${ltName}" removed`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Step 7: Sample CSV template download
  const handleDownloadCsvTemplate = () => {
    const headers = 'firstName,lastName,workEmail,phone,departmentName,designationTitle,monthlySalary,employmentType,gender,joiningDate,workLocation\n';
    const sample1 = 'Vikram,Mehta,vikram.mehta@goodwinbatteries.com,+91 98450 77112,Production & Cell Assembly,Battery Assembly Technician,42000,FULL_TIME,MALE,2026-01-15,Bangalore Plant 1\n';
    const sample2 = 'Ananya,Iyer,ananya.iyer@goodwinbatteries.com,+91 98450 77113,Quality Control & Testing,Cell Testing Specialist,55000,FULL_TIME,FEMALE,2026-02-01,Bangalore Plant 1\n';
    const blob = new Blob([headers + sample1 + sample2], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tenantSlug}_employee_import_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Employee CSV import template downloaded');
  };

  // Step 3: Toggle / Update Designation Level
  const handleUpdateDesignationLevel = async (desigId: string, newLevel: string) => {
    const updated = designations.map((d) => (d.id === desigId ? { ...d, gradeLevel: newLevel } : d));
    setDesignations(updated);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-designation',
          designationId: desigId,
          gradeLevel: newLevel
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Designation level updated to ${newLevel}`);
      }
    } catch (err) {
      console.error('Failed to update designation level', err);
    }
  };

  const handleCycleDesignationLevel = (desig: Designation) => {
    const currentNum = parseInt((desig.gradeLevel || 'L1').replace(/\D/g, ''), 10) || 1;
    const nextNum = currentNum >= 10 ? 1 : currentNum + 1;
    const nextLevel = `L${nextNum}`;
    handleUpdateDesignationLevel(desig.id, nextLevel);
  };

  // Step 8: Copy activation link or direct login URL with real tokens
  const handleCopyActivationLink = async (emp: Employee) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://goodwin-grow-hrms.vercel.app';
    const emailLower = (emp.workEmail || '').toLowerCase();
    const isOwnerOrActive =
      emailLower.includes('rajnish') ||
      emailLower === (tenant?.businessEmail?.toLowerCase() || '') ||
      emp.loginStatus === 'ACCEPTED';

    if (isOwnerOrActive) {
      const loginUrl = `${origin}/login`;
      navigator.clipboard.writeText(loginUrl);
      setCopiedToken(emp.id);
      showToast(`Account is active. Login URL copied for ${emp.firstName}`);
      setTimeout(() => setCopiedToken(null), 3000);
      return;
    }

    // Check if invitation already exists with real token
    const existingInv = invitations.find(
      (i) => i.employeeId === emp.id || i.email.toLowerCase() === emailLower
    );

    if (existingInv && existingInv.token) {
      const activationUrl = `${origin}/activate?token=${existingInv.token}`;
      navigator.clipboard.writeText(activationUrl);
      setCopiedToken(emp.id);
      showToast(`Activation link copied for ${emp.firstName} ${emp.lastName}`);
      setTimeout(() => setCopiedToken(null), 3000);
      return;
    }

    // Generate real Supabase invitation on the fly
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: emp.id, role: 'EMPLOYEE' })
      });
      const json = await res.json();
      if (json.success && json.data?.token) {
        const activationUrl = `${origin}/activate?token=${json.data.token}`;
        navigator.clipboard.writeText(activationUrl);
        setCopiedToken(emp.id);
        setInvitations((prev) => [...prev, json.data]);
        setEmployees((prev) =>
          prev.map((e) => (e.id === emp.id ? { ...e, loginStatus: 'PENDING' } : e))
        );
        showToast(`Activation link created & copied for ${emp.firstName} ${emp.lastName}`);
        setTimeout(() => setCopiedToken(null), 3000);
      } else {
        showToast(json.error || 'Failed to generate invitation link');
      }
    } catch (err) {
      console.error(err);
      showToast('Error generating activation invitation');
    }
  };


  const handleNextStep = () => {
    if (activeStepIndex === 0) {
      handleSaveProfile(true);
      return;
    }

    if (!checklist[activeStepIndex]?.completed) {
      handleToggleStep(activeStepIndex);
    }
    if (activeStepIndex < checklist.length - 1) {
      setActiveStepIndex(activeStepIndex + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Loading Enterprise Setup Wizard...</span>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard
      tenantSlug={tenantSlug}
      requiredRoles={['COMPANY_ADMIN', 'SUPER_ADMIN']}
      moduleName="Company Setup Wizard"
    >
      <div className="space-y-6 max-w-5xl pb-16 font-sans">
        {/* Toast Notification */}
        {saveToast && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-950/95 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 shadow-2xl backdrop-blur-xl animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{saveToast}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Link href={`/app/${tenantSlug}`} className="hover:text-emerald-400 transition-colors">
                {tenant?.name || 'Company'}
              </Link>
              <span>/</span>
              <span className="text-amber-400 font-semibold">Guided Setup Wizard</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <span>Company Setup & Configuration Wizard</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Guided 8-step enterprise onboarding for <strong className="text-white">{tenant?.name}</strong> ({tenant?.companyCode}) &bull; Fully editable under <span className="font-mono text-amber-300">COMPANY_ADMIN</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSaveProfile(false)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-slate-700 transition-all"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <Link
              href={`/app/${tenantSlug}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-all"
            >
              <span>Exit to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Onboarding Progress Card */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-white text-sm">Onboarding Completion</span>
              <span className="text-slate-400 ml-2">
                ({completedCount} of {checklist.length} steps configured)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Progress:</span>
              <span className="font-extrabold text-emerald-400 text-base">{progressPercent}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-teal-400 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          {/* Steps Tab Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2">
            {checklist.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setActiveStepIndex(idx)}
                className={`p-2.5 rounded-xl text-left border transition-all text-[11px] space-y-1 ${
                  activeStepIndex === idx
                    ? 'bg-amber-500/10 border-amber-500/60 text-white shadow-lg shadow-amber-950/20'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[10px] text-slate-500">Step {idx + 1}</span>
                  {step.completed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>
                <div className="font-semibold text-slate-200 line-clamp-1">{step.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Active Step Configuration Area */}
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-6">
          {/* STEP 1: COMPANY PROFILE */}
          {activeStepIndex === 0 && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-400" />
                    <span>Step 1: Company Profile & Operating Calendar</span>
                  </h2>
                  <p className="text-slate-400 mt-0.5">
                    Configure legal registered details, factory locations, accounting financial year, and brand identity.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Editable</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1.5">Company Legal Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
                    placeholder="Legal Registered Name"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Industry Sector</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
                    placeholder="e.g. Battery Manufacturing"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Financial Year</label>
                  <select
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
                  >
                    {FINANCIAL_YEARS.map((fy) => (
                      <option key={fy} value={fy}>{fy}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Registered Business Email</label>
                  <input
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
                    placeholder="contact@company.com"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Business Phone</label>
                  <input
                    type="text"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
                    placeholder="+91 80 4123 5566"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1.5">Registered Address / Plant Location</label>
                  <input
                    type="text"
                    value={registeredAddress}
                    onChange={(e) => setRegisteredAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-xs"
                    placeholder="Plot / Street / Industrial Area"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                    placeholder="Bangalore"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                    placeholder="Karnataka"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                    placeholder="560100"
                  />
                </div>
              </div>

              {/* Company Logo Configuration in Setup */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-semibold text-slate-300">Company Logo (ERP & Payslips)</label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Attached to employee salary slips, platform gateway, and navigation bar.
                    </p>
                  </div>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-700 shadow-sm flex items-center justify-center p-1.5 shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Upload className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer shadow-sm flex items-center gap-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setLogoUrl('/goodwin-logo.png')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Use Official Goodwin Logo
                      </button>
                    </div>

                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="Or direct logo URL (/goodwin-logo.png)"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-2">Company Brand Color Theme</label>
                <div className="flex items-center gap-3">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setPrimaryColor(c.value)}
                      className={`px-3 py-1.5 rounded-xl flex items-center gap-2 border text-xs font-semibold transition-all ${
                        primaryColor === c.value
                          ? 'border-white text-white shadow-lg'
                          : 'border-slate-800 text-slate-400 hover:text-white'
                      }`}
                      style={{ backgroundColor: `${c.value}25` }}
                    >
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.value }}></div>
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DEPARTMENTS */}
          {activeStepIndex === 1 && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="pb-4 border-b border-slate-800">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <span>Step 2: Department Setup & Organizational Divisions</span>
                </h2>
                <p className="text-slate-400 mt-0.5">
                  Organize your workforce into functional units. Add custom divisions, manage codes, and assign managers.
                </p>
              </div>

              {/* Department Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="font-bold text-white text-xs">{dept.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">Code: {dept.code}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                      className="opacity-40 group-hover:opacity-100 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-all"
                      title="Remove department"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom Department Form */}
              <form onSubmit={handleAddDepartment} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="font-semibold text-slate-200">Add New Department</div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Department Name (e.g. Cleanroom Operations)"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Code (e.g. CLN)"
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value)}
                    className="w-32 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs uppercase font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Department</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: DESIGNATIONS & HIERARCHY */}
          {activeStepIndex === 2 && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-400" />
                    <span>Step 3: Designations & Technical Hierarchy</span>
                  </h2>
                  <p className="text-slate-400 mt-0.5">
                    Define technical job titles, managerial levels, and supervisor reporting lines.
                  </p>
                </div>
                <Link
                  href={`/app/${tenantSlug}/org-chart`}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold text-xs hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Interactive Org Chart</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {designations.map((desig) => {
                  const currentLevel = desig.gradeLevel || 'L1';
                  const levelNum = parseInt(currentLevel.replace(/\D/g, ''), 10) || 1;
                  const levelLabels: Record<number, string> = {
                    1: 'L1 - Associate / Junior',
                    2: 'L2 - Professional',
                    3: 'L3 - Senior / Lead',
                    4: 'L4 - Specialist / Principal',
                    5: 'L5 - Assistant Manager',
                    6: 'L6 - Manager',
                    7: 'L7 - Senior Manager',
                    8: 'L8 - Associate Director',
                    9: 'L9 - Vice President',
                    10: 'L10 - Executive / C-Suite'
                  };
                  const bandLabel =
                    levelNum >= 9
                      ? 'Executive Leadership'
                      : levelNum >= 5
                      ? 'Management Job Band'
                      : 'Standard Technical Job Band';

                  return (
                    <div
                      key={desig.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-white text-sm leading-tight">{desig.title}</span>

                        {/* Interactive Level Toggle & Selector */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCycleDesignationLevel(desig)}
                            title="Click to toggle to next level (L1 -> L10)"
                            className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-mono font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span>{currentLevel}</span>
                          </button>

                          <div className="relative inline-flex items-center">
                            <select
                              value={currentLevel}
                              onChange={(e) => handleUpdateDesignationLevel(desig.id, e.target.value)}
                              title="Select technical grade level"
                              className="appearance-none bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium pl-2 pr-5 py-1 rounded-lg border border-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => (
                                <option key={lvl} value={`L${lvl}`} className="bg-slate-900 text-white">
                                  {levelLabels[lvl]}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                        <span>{bandLabel}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Grade {levelNum} of 10</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: SHIFT & ATTENDANCE POLICIES */}
          {activeStepIndex === 3 && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <span>Step 4: Working Days Policy & Shift Schedules</span>
                  </h2>
                  <p className="text-slate-400 mt-0.5">
                    Configure company working days, weekly off rules, and active factory shift schedules.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300">
                    Goodwin Standard: Saturday Working
                  </span>
                </div>
              </div>

              {/* Working Days & Weekly Off Policy CRUD Card */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span>Company Working Days &amp; Weekly Off Schedule (CRUD)</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Define which days of the week require attendance punches. Saturday is set as a standard working day with active production shifts.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={savingWorkingDays}
                      onClick={handleSaveWorkingDaysPolicy}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingWorkingDays ? 'Saving Policy...' : 'Save Schedule Policy'}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Quick Policy Presets:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('7_DAYS_WORK')}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                        weeklyOffDays.length === 0
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      ⚡ All 7 Days Working (No Weekly Off - Goodwin Standard)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('6_DAYS_MON_SAT')}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                        weeklyOffDays.length === 1 && weeklyOffDays.includes('SUNDAY')
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      6 Days (Mon - Sat Working, Sunday Off)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('5_DAYS_MON_FRI')}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                        weeklyOffDays.length === 2 && weeklyOffDays.includes('SATURDAY') && weeklyOffDays.includes('SUNDAY')
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 ring-1 ring-purple-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      5 Days (Mon - Fri Working, Sat &amp; Sun Off)
                    </button>
                  </div>
                </div>

                {/* 7 Days of the Week Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-2">
                  {[
                    { id: 'MONDAY', name: 'Monday', short: 'Mon' },
                    { id: 'TUESDAY', name: 'Tuesday', short: 'Tue' },
                    { id: 'WEDNESDAY', name: 'Wednesday', short: 'Wed' },
                    { id: 'THURSDAY', name: 'Thursday', short: 'Thu' },
                    { id: 'FRIDAY', name: 'Friday', short: 'Fri' },
                    { id: 'SATURDAY', name: 'Saturday', short: 'Sat' },
                    { id: 'SUNDAY', name: 'Sunday', short: 'Sun' }
                  ].map((d) => {
                    const isOff = weeklyOffDays.includes(d.id);
                    const isSaturday = d.id === 'SATURDAY';
                    return (
                      <div
                        key={d.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col justify-between min-h-[105px] ${
                          isOff
                            ? 'bg-rose-950/20 border-rose-900/40 text-slate-300'
                            : isSaturday
                            ? 'bg-amber-950/20 border-amber-500/40 text-white ring-1 ring-amber-500/30'
                            : 'bg-slate-950 border-slate-800 text-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm">{d.name}</span>
                            <span className="font-mono text-[10px] text-slate-500">{d.short}</span>
                          </div>

                          <div className="mt-1.5">
                            {isOff ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300">
                                Weekly Off
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                                Working Day
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 mt-2">
                          <button
                            type="button"
                            onClick={() => handleToggleWorkingDay(d.id)}
                            className={`w-full py-1 px-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                              isOff
                                ? 'bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300'
                                : 'bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-300'
                            }`}
                          >
                            {isOff ? '+ Set as Working' : 'Set as Off'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Schedule Summary Bar */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-4 text-slate-300">
                    <div>
                      <span className="text-slate-500">Working Days / Week: </span>
                      <strong className="text-emerald-400 font-mono font-bold text-xs">
                        {7 - weeklyOffDays.length} of 7 days
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Weekly Offs: </span>
                      <strong className="text-rose-400 font-mono font-bold text-xs">
                        {weeklyOffDays.length === 0 ? '0 days (Continuous Operation)' : `${weeklyOffDays.length} day(s)`}
                      </strong>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    Saturday Policy: <span className="text-amber-400 font-bold">{weeklyOffDays.includes('SATURDAY') ? 'Off' : 'Active Working Day'}</span>
                  </div>
                </div>
              </div>

              {/* Editable Shifts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {shifts.map((s) => {
                  const edit = editingShifts[s.id] || { startTime: s.startTime, endTime: s.endTime, graceMinutes: s.graceMinutes };
                  return (
                    <div key={s.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{s.name}</span>
                        <div className="flex items-center gap-2">
                          {s.isDefault && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                              Default Shift
                            </span>
                          )}
                          {shifts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteShift(s.id, s.name)}
                              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                              title={`Delete shift ${s.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Start Time</label>
                          <input
                            type="time"
                            value={edit.startTime}
                            onChange={(e) =>
                              setEditingShifts({
                                ...editingShifts,
                                [s.id]: { ...edit, startTime: e.target.value }
                              })
                            }
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">End Time</label>
                          <input
                            type="time"
                            value={edit.endTime}
                            onChange={(e) =>
                              setEditingShifts({
                                ...editingShifts,
                                [s.id]: { ...edit, endTime: e.target.value }
                              })
                            }
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Grace (mins)</label>
                          <input
                            type="number"
                            min="0"
                            max="60"
                            value={edit.graceMinutes}
                            onChange={(e) =>
                              setEditingShifts({
                                ...editingShifts,
                                [s.id]: { ...edit, graceMinutes: Number(e.target.value) }
                              })
                            }
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveShift(s.id)}
                        className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-[11px] transition-colors"
                      >
                        Update Shift Timing
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Shift */}
              <form onSubmit={handleAddShift} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="font-semibold text-slate-200">Configure Additional Shift</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Shift Name (e.g. Night Assembly C)"
                    value={newShiftName}
                    onChange={(e) => setNewShiftName(e.target.value)}
                    className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={newShiftStart}
                      onChange={(e) => setNewShiftStart(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                    />
                    <input
                      type="time"
                      value={newShiftEnd}
                      onChange={(e) => setNewShiftEnd(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Shift</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 5: LEAVE POLICIES */}
          {activeStepIndex === 4 && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="pb-4 border-b border-slate-800">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span>Step 5: Leave Quotas & Annual Entitlements</span>
                </h2>
                <p className="text-slate-400 mt-0.5">
                  Define annual quotas for Casual Leave, Sick Leave, and Privilege Leave. Quotas apply to all employee self-service dashboards.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {leaveTypes.map((lt) => {
                  const days = editingLeaves[lt.id] ?? lt.daysPerYear;
                  return (
                    <div key={lt.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{lt.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {lt.code}
                          </span>
                          {leaveTypes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteLeaveType(lt.id, lt.name)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                              title="Delete leave policy"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Days Per Year Quota</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={days}
                            onChange={(e) =>
                              setEditingLeaves({
                                ...editingLeaves,
                                [lt.id]: Number(e.target.value)
                              })
                            }
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveLeaveType(lt.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs whitespace-nowrap"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Leave Type */}
              <form onSubmit={handleAddLeaveType} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="font-semibold text-slate-200">Add Custom Leave Category</div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Leave Name (e.g. Parental / Maternity Leave)"
                    value={newLeaveName}
                    onChange={(e) => setNewLeaveName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Code (e.g. ML)"
                    value={newLeaveCode}
                    onChange={(e) => setNewLeaveCode(e.target.value)}
                    className="w-28 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono uppercase"
                  />
                  <input
                    type="number"
                    min="1"
                    max="180"
                    placeholder="Days"
                    value={newLeaveDays}
                    onChange={(e) => setNewLeaveDays(Number(e.target.value))}
                    className="w-24 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Leave</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 6: PAYROLL CONFIGURATION */}
          {activeStepIndex === 5 && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="pb-4 border-b border-slate-800">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  <span>Step 6: Payroll Wage Structure & Statutory Rules</span>
                </h2>
                <p className="text-slate-400 mt-0.5">
                  Configure standard wage structure percentages and simulate employee salary breakdowns in real time.
                </p>
              </div>

              {/* Wage Structure Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <label className="block text-[10px] text-slate-400 mb-1">Basic Pay %</label>
                  <input
                    type="number"
                    min="10"
                    max="80"
                    value={basicPct}
                    onChange={(e) => setBasicPct(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-sm font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Typically 50%</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <label className="block text-[10px] text-slate-400 mb-1">House Rent (HRA) %</label>
                  <input
                    type="number"
                    min="10"
                    max="50"
                    value={hraPct}
                    onChange={(e) => setHraPct(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-sm font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Typically 25%</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <label className="block text-[10px] text-slate-400 mb-1">Special Allowance %</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={specialPct}
                    onChange={(e) => setSpecialPct(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-sm font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Balancing allowance</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <label className="block text-[10px] text-slate-400 mb-1">Employee PF %</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={pfPct}
                    onChange={(e) => setPfPct(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-sm font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Set to 0% for zero PF deduction</span>
                </div>
              </div>

              {/* Real-time Payroll Simulator Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-amber-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-white text-sm">Live Take-Home Wage Simulator</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Test how your structure calculates a salary slip:</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs font-mono">Monthly CTC (INR):</span>
                    <input
                      type="number"
                      step="5000"
                      value={sampleSalary}
                      onChange={(e) => setSampleSalary(Number(e.target.value))}
                      className="w-32 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-400 font-mono font-bold text-xs"
                    />
                  </div>
                </div>

                {(() => {
                  const basic = (sampleSalary * basicPct) / 100;
                  const hra = (sampleSalary * hraPct) / 100;
                  const special = (sampleSalary * specialPct) / 100;
                  const pf = Math.min((basic * pfPct) / 100, 1800);
                  const pt = pfPct > 0 ? 200 : 0;
                  const deductions = pf + pt;
                  const net = sampleSalary - deductions;

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Basic Pay</span>
                        <span className="text-xs font-mono font-bold text-white">₹{basic.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">House Rent (HRA)</span>
                        <span className="text-xs font-mono font-bold text-white">₹{hra.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Special Allowance</span>
                        <span className="text-xs font-mono font-bold text-white">₹{special.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-rose-400/80 block">PF + PT Deductions</span>
                        <span className="text-xs font-mono font-bold text-rose-300">
                          {deductions === 0 ? '₹0' : `-₹${deductions.toLocaleString('en-IN')}`}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                        <span className="text-[10px] text-emerald-400 block font-semibold">Net Disbursed</span>
                        <span className="text-sm font-mono font-extrabold text-emerald-300">₹{net.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* STEP 7: EMPLOYEE DATA IMPORT */}
          {activeStepIndex === 6 && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Upload className="w-5 h-5 text-amber-400" />
                    <span>Step 7: Workforce Data Ingestion & Directory Import</span>
                  </h2>
                  <p className="text-slate-400 mt-0.5">
                    Download the pre-formatted CSV template or import employees directly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV Template</span>
                </button>
              </div>

              {/* Upload Drag Drop Area */}
              <div className="p-8 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 hover:border-amber-500/50 transition-all text-center space-y-3 cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Drop your completed CSV or XLSX spreadsheet here</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Supports up to 5,000 workforce records with automatic duplicate email detection.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href={`/app/${tenantSlug}/employees`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50"
                  >
                    <span>Open Employee Directory & Ingestion Console</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: INVITE EMPLOYEES */}
          {activeStepIndex === 7 && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-amber-400" />
                    <span>Step 8: Send Employee Login Activation Invitations</span>
                  </h2>
                  <p className="text-slate-400 mt-0.5">
                    Generate single-use secure activation links so employees can set credentials and access self-service.
                  </p>
                </div>
                <Link
                  href={`/app/${tenantSlug}/invitations`}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Full Invitations Console</span>
                </Link>
              </div>

              {/* Employee Roster with Activation Buttons */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {employees.map((emp) => {
                  const inv = invitations.find(
                    (i) => i.employeeId === emp.id || i.email.toLowerCase() === (emp.workEmail || '').toLowerCase()
                  );
                  const emailLower = (emp.workEmail || '').toLowerCase();
                  const isOwnerOrActive =
                    emailLower.includes('rajnish') ||
                    emailLower === (tenant?.businessEmail?.toLowerCase() || '') ||
                    emp.loginStatus === 'ACCEPTED' ||
                    inv?.status === 'ACCEPTED';
                  const effectiveStatus = isOwnerOrActive ? 'ACCEPTED' : (inv?.status || emp.loginStatus || 'NOT_INVITED');

                  return (
                    <div
                      key={emp.id}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{emp.firstName} {emp.lastName}</span>
                          {isOwnerOrActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30">
                              Workspace Owner &bull; Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {emp.workEmail} &bull; {emp.departmentName} &bull; {emp.employeeCode}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-full border uppercase ${
                            effectiveStatus === 'ACCEPTED'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : effectiveStatus === 'PENDING'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          {effectiveStatus === 'ACCEPTED' ? 'ACTIVE' : effectiveStatus}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyActivationLink(emp)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                            effectiveStatus === 'ACCEPTED'
                              ? 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40 shadow-sm'
                              : effectiveStatus === 'PENDING'
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {copiedToken === emp.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied URL!</span>
                            </>
                          ) : effectiveStatus === 'ACCEPTED' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Active &bull; Copy Login</span>
                            </>
                          ) : effectiveStatus === 'PENDING' ? (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copy Activation Link</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-3.5 h-3.5 text-amber-400" />
                              <span>Generate &amp; Copy Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Wizard Controls */}
          <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => handleToggleStep(activeStepIndex)}
              className="flex items-center gap-2 text-xs text-slate-300 hover:text-white transition-colors"
            >
              {checklist[activeStepIndex]?.completed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-emerald-400">Marked as Completed</span>
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 text-slate-500" />
                  <span>Mark as Completed</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-3">
              {activeStepIndex > 0 && (
                <button
                  onClick={() => setActiveStepIndex(activeStepIndex - 1)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
                >
                  Previous Step
                </button>
              )}

              {activeStepIndex < checklist.length - 1 ? (
                <button
                  onClick={handleNextStep}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 flex items-center gap-1.5 transition-all"
                >
                  <span>{saving ? 'Saving...' : 'Save & Continue'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={async () => {
                    // Mark all steps completed and redirect
                    const allDone = checklist.map((s) => ({ ...s, completed: true }));
                    setChecklist(allDone);
                    await fetch(`/api/tenants/${tenantSlug}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ onboardingChecklist: allDone })
                    });
                    showToast('Enterprise setup complete! Redirecting to workspace...');
                    setTimeout(() => router.push(`/app/${tenantSlug}`), 1200);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 flex items-center gap-1.5 transition-all"
                >
                  <span>Complete Setup & Launch Workspace</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
