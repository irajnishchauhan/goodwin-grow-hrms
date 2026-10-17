'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  Filter,
  Building2,
  Mail,
  Phone,
  Trash2,
  CheckCircle2,
  X,
  CreditCard,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  Upload,
  Download,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  KeyRound,
  FileSpreadsheet,
  Lock,
  Edit3,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Check
} from 'lucide-react';
import { Employee, Department, Tenant, EmploymentType, EmployeeStatus, LoginActivationStatus, Shift } from '@/lib/types';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';

export default function TenantEmployeesPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { user, isSuperAdmin, isCompanyAdmin, isHRAdmin, isEmployeeOnly } = useCurrentUser(tenantSlug);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Add Employee Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bulk CSV Import Modal State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedCount: number;
    failedCount: number;
    errors: { row: number; email: string; reason: string }[];
  } | null>(null);

  // Form Fields (Add)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [departmentId, setDepartmentId] = useState('');
  const [designationTitle, setDesignationTitle] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('FULL_TIME');
  const [workLocation, setWorkLocation] = useState('Hosur Battery Plant');
  const [shiftName, setShiftName] = useState('General Day Shift');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlySalary, setMonthlySalary] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [panOrTaxId, setPanOrTaxId] = useState('');

  // Edit Employee Modal State (Super Admin & HR)
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editWorkEmail, setEditWorkEmail] = useState('');
  const [editPersonalEmail, setEditPersonalEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGender, setEditGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [editDesignationTitle, setEditDesignationTitle] = useState('');
  const [editEmploymentType, setEditEmploymentType] = useState<EmploymentType>('FULL_TIME');
  const [editWorkLocation, setEditWorkLocation] = useState('');
  const [editShiftName, setEditShiftName] = useState('');
  const [editJoiningDate, setEditJoiningDate] = useState('');
  const [editMonthlySalary, setEditMonthlySalary] = useState('');
  const [editPanOrTaxId, setEditPanOrTaxId] = useState('');
  const [editBankName, setEditBankName] = useState('');
  const [editBankAccountNumber, setEditBankAccountNumber] = useState('');
  const [editStatus, setEditStatus] = useState<EmployeeStatus>('ACTIVE');
  const [editLoginStatus, setEditLoginStatus] = useState<LoginActivationStatus>('NOT_INVITED');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Permanent Delete Modal State (Super Admin Only)
  const [deleteEmpTarget, setDeleteEmpTarget] = useState<Employee | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Selected Employee Drawer State
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/employees?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      const json = await res.json();
      if (json.success) {
        setEmployees(json.data.employees);
        setDepartments(json.data.departments);
        if (json.data.shifts) setShifts(json.data.shifts);
        setTenant(json.data.tenant);
        if (json.data.departments.length > 0 && !departmentId) {
          setDepartmentId(json.data.departments[0].id);
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
      fetchEmployees();
    }
  }, [tenantSlug]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          workEmail,
          personalEmail,
          phone,
          gender,
          departmentId,
          designationTitle,
          employmentType,
          monthlySalary: Number(monthlySalary),
          bankAccountNumber,
          bankName,
          panOrTaxId,
          workLocation,
          shiftName,
          joiningDate
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to add employee');
      }

      setModalOpen(false);
      resetForm();
      fetchEmployees();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error adding employee');
    } finally {
      setAddLoading(false);
    }
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setEditFirstName(emp.firstName || '');
    setEditLastName(emp.lastName || '');
    setEditWorkEmail(emp.workEmail || '');
    setEditPersonalEmail(emp.personalEmail || '');
    setEditPhone(emp.phone || '');
    setEditGender(emp.gender || 'MALE');
    setEditDepartmentId(emp.departmentId || (departments[0]?.id || ''));
    setEditDesignationTitle(emp.designationTitle || '');
    setEditEmploymentType(emp.employmentType || 'FULL_TIME');
    setEditWorkLocation(emp.workLocation || 'Hosur Battery Plant');
    setEditShiftName(emp.shiftName || 'General Day Shift');
    setEditJoiningDate(emp.joiningDate || new Date().toISOString().split('T')[0]);
    setEditMonthlySalary(String(emp.monthlySalary || '0'));
    setEditPanOrTaxId(emp.panOrTaxId || '');
    setEditBankName(emp.bankName || '');
    setEditBankAccountNumber(emp.bankAccountNumber || '');
    setEditStatus(emp.status || 'ACTIVE');
    setEditLoginStatus(emp.loginStatus || 'NOT_INVITED');
    setEditError(null);
    setEditSuccess(null);
  };

  const handleSaveEmployeeEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    setEditLoading(true);
    setEditError(null);

    try {
      const selectedDeptObj = departments.find((d) => d.id === editDepartmentId);

      const payload: Record<string, any> = {
        employeeId: editingEmp.id,
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        workEmail: editWorkEmail.trim(),
        personalEmail: editPersonalEmail.trim(),
        phone: editPhone.trim(),
        gender: editGender,
        departmentId: editDepartmentId,
        departmentName: selectedDeptObj?.name || editingEmp.departmentName,
        designationTitle: editDesignationTitle.trim(),
        employmentType: editEmploymentType,
        workLocation: editWorkLocation.trim(),
        shiftName: editShiftName.trim(),
        joiningDate: editJoiningDate
      };

      // Super Admin Exclusive Privileges
      if (isSuperAdmin) {
        payload.monthlySalary = Number(editMonthlySalary) || 0;
        payload.panOrTaxId = editPanOrTaxId.trim();
        payload.bankName = editBankName.trim();
        payload.bankAccountNumber = editBankAccountNumber.trim();
        payload.status = editStatus;
        payload.loginStatus = editLoginStatus;
      }

      const res = await fetch(`/api/tenants/${tenantSlug}/employees`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update employee profile');
      }

      setEditSuccess('Employee profile updated successfully!');
      setTimeout(() => {
        setEditingEmp(null);
        setEditSuccess(null);
      }, 700);

      fetchEmployees();
      if (selectedEmp?.id === editingEmp.id) {
        setSelectedEmp((prev) => (prev ? { ...prev, ...payload } : null));
      }
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Error updating employee');
    } finally {
      setEditLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteEmpTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/employees?id=${deleteEmpTarget.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to permanently delete employee');
      }

      if (selectedEmp?.id === deleteEmpTarget.id) {
        setSelectedEmp(null);
      }
      setDeleteConfirmOpen(false);
      setDeleteEmpTarget(null);
      fetchEmployees();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Error purging employee record');
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setWorkEmail('');
    setPersonalEmail('');
    setPhone('');
    setDesignationTitle('');
    setMonthlySalary('');
    setBankAccountNumber('');
    setBankName('');
    setPanOrTaxId('');
  };

  // Sample CSV template generator
  const downloadSampleCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'firstName,lastName,workEmail,phone,departmentName,designationTitle,employmentType,monthlySalary,gender,workLocation\n' +
      'Karan,Verma,karan.verma@goodwinbatteries.com,+91 98111 22334,Production & Assembly,Battery Pack Assembly Lead,FULL_TIME,55000,MALE,Hosur Battery Plant\n' +
      'Deepa,Sundaram,deepa.sundaram@goodwinbatteries.com,+91 98222 33445,Quality Assurance & QC,Cell Quality Assurance Inspector,FULL_TIME,50000,FEMALE,Hosur Battery Plant\n' +
      'Manish,Tiwari,manish.tiwari@goodwinbatteries.com,+91 98333 44556,Supply Chain & Warehouse,Warehouse Inventory Specialist,FULL_TIME,42000,MALE,Bangalore Central Hub\n' +
      'Ritu,Chopra,ritu.chopra@goodwinbatteries.com,+91 98444 55667,Research & Battery R&D,Thermal Simulation Analyst,FULL_TIME,85000,FEMALE,Bangalore R&D Center\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `goodwin_batteries_employee_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pre-fill sample CSV text into importer
  const loadSampleData = () => {
    const sample = `firstName,lastName,workEmail,phone,departmentName,designationTitle,employmentType,monthlySalary,gender,workLocation
Karan,Verma,karan.verma@goodwinbatteries.com,+91 98111 22334,Production & Assembly,Battery Pack Assembly Lead,FULL_TIME,55000,MALE,Hosur Battery Plant
Deepa,Sundaram,deepa.sundaram@goodwinbatteries.com,+91 98222 33445,Quality Assurance & QC,Cell Quality Assurance Inspector,FULL_TIME,50000,FEMALE,Hosur Battery Plant
Manish,Tiwari,manish.tiwari@goodwinbatteries.com,+91 98333 44556,Supply Chain & Warehouse,Warehouse Inventory Specialist,FULL_TIME,42000,MALE,Bangalore Central Hub
Ritu,Chopra,ritu.chopra@goodwinbatteries.com,+91 98444 55667,Research & Battery R&D,Thermal Simulation Analyst,FULL_TIME,85000,FEMALE,Bangalore R&D Center`;
    setCsvRawText(sample);
    parseCsv(sample);
  };

  const parseCsv = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length <= 1) {
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const existingEmails = new Set(employees.map((e) => e.workEmail.toLowerCase()));

    const rows = lines.slice(1).map((line, idx) => {
      const parts = line.split(',').map((p) => p.trim());
      const rowObj: any = { _rowNum: idx + 1 };
      headers.forEach((h, i) => {
        rowObj[h] = parts[i] || '';
      });

      // Validation
      const isDuplicate = existingEmails.has((rowObj.workEmail || '').toLowerCase());
      const isValid = Boolean(rowObj.firstName && rowObj.lastName && rowObj.workEmail && !isDuplicate);

      rowObj._isDuplicate = isDuplicate;
      rowObj._isValid = isValid;
      return rowObj;
    });

    setParsedRows(rows);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    setImportLoading(true);
    setImportResult(null);

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/employees/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: parsedRows.map((r) => ({
            firstName: r.firstName,
            lastName: r.lastName,
            workEmail: r.workEmail,
            phone: r.phone,
            departmentName: r.departmentName,
            designationTitle: r.designationTitle,
            employmentType: r.employmentType || 'FULL_TIME',
            monthlySalary: Number(r.monthlySalary) || 45000,
            gender: r.gender || 'OTHER',
            workLocation: r.workLocation
          }))
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to import records');
      }

      setImportResult({
        success: true,
        importedCount: json.data.importedCount,
        failedCount: json.data.failedCount,
        errors: json.data.errors || []
      });

      fetchEmployees();
    } catch (err: unknown) {
      setImportResult({
        success: false,
        importedCount: 0,
        failedCount: parsedRows.length,
        errors: [{ row: 0, email: 'All', reason: err instanceof Error ? err.message : 'Import failed' }]
      });
    } finally {
      setImportLoading(false);
    }
  };

  const activeAccountsCount = employees.filter((e) => e.loginStatus === 'ACCEPTED').length;
  const pendingInvitesCount = employees.filter((e) => e.loginStatus === 'PENDING').length;
  const uninvitedCount = employees.filter((e) => !e.loginStatus || e.loginStatus === 'NOT_INVITED').length;

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.firstName.toLowerCase().includes(search.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      emp.workEmail.toLowerCase().includes(search.toLowerCase()) ||
      (emp.designationTitle && emp.designationTitle.toLowerCase().includes(search.toLowerCase()));

    const matchesDept = selectedDept === 'ALL' || emp.departmentId === selectedDept;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {isEmployeeOnly ? 'Colleague Directory' : 'Workforce & Employee Directory'}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {employees.length} Colleagues
            </span>
            {isSuperAdmin && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-400/40 shadow-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Admin Privileges: Full Editing & Permanent Deletion Unlocked</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isEmployeeOnly
              ? `Browse colleagues, designations, and departments across ${tenant?.name || 'this organization'}`
              : `Independent workforce records & credentials lifecycle for ${tenant?.name || 'this organization'}`}
          </p>
        </div>

        {!isEmployeeOnly && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                setBulkModalOpen(true);
                setImportResult(null);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all border border-slate-200 shadow-xs"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Bulk CSV Import</span>
            </button>

            <Link
              href={`/app/${tenantSlug}/invitations`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs transition-all border border-amber-200 shadow-xs"
            >
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Manage Invitations ({pendingInvitesCount})</span>
            </Link>

            <button
              onClick={() => {
                if (departments.length > 0 && !departmentId) {
                  setDepartmentId(departments[0].id);
                }
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Workforce</div>
          <div className="text-2xl font-black text-slate-900">{employees.length}</div>
          <p className="text-[10px] text-slate-400 font-mono">Capacity: {tenant?.maxEmployees || 100} seats</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Active Login Users</div>
          <div className="text-2xl font-black text-emerald-700">{activeAccountsCount}</div>
          <p className="text-[10px] text-slate-500">Can sign in to portal</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Pending Activation</div>
          <div className="text-2xl font-black text-amber-700">{pendingInvitesCount}</div>
          <p className="text-[10px] text-slate-500">Invite dispatched</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Uninvited Staff</div>
          <div className="text-2xl font-black text-slate-700">{uninvitedCount}</div>
          <p className="text-[10px] text-slate-400">Record only, no user login</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search employee by name, code, designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Dept:
          </span>
          <button
            onClick={() => setSelectedDept('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedDept === 'ALL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            All
          </button>
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedDept === dept.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>
      </div>

      {/* Employees Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 uppercase font-semibold text-[10px] text-slate-500 tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Department & Role</th>
                {isEmployeeOnly ? (
                  <>
                    <th className="px-6 py-3.5">Work Phone</th>
                    <th className="px-6 py-3.5">Work Location</th>
                    <th className="px-6 py-3.5">Status</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3.5">Monthly Compensation</th>
                    <th className="px-6 py-3.5">Login Account</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={isEmployeeOnly ? 6 : 7} className="px-6 py-8 text-center text-slate-400 text-xs">
                    No colleagues matching the criteria found in this company workspace.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedEmp(emp)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                          {emp.firstName.slice(0, 1)}
                          {emp.lastName.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {emp.workEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-700">{emp.employeeCode}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{emp.designationTitle}</div>
                      <div className="text-[11px] text-slate-500">{emp.departmentName}</div>
                    </td>

                    {isEmployeeOnly ? (
                      <>
                        <td className="px-6 py-4 text-slate-600 font-mono">
                          {emp.phone || '+91 80 4912 8800'}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {emp.workLocation || 'Facility'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {emp.status}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {tenant?.currency} {emp.monthlySalary.toLocaleString()} / mo
                        </td>
                        <td className="px-6 py-4">
                          {emp.loginStatus === 'ACCEPTED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Active Account</span>
                            </span>
                          ) : emp.loginStatus === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              <span>Invite Pending</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <span>Not Invited</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {emp.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openEditModal(emp)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                              title="Edit Employee Profile"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {isSuperAdmin ? (
                              <button
                                onClick={() => {
                                  setDeleteEmpTarget(emp);
                                  setDeleteConfirmOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Permanent Delete Employee (Super Admin Exclusive)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <span
                                className="p-1.5 rounded-lg text-slate-300 cursor-not-allowed opacity-50"
                                title="Permanent record purging is restricted exclusively to Super Admin"
                              >
                                <Lock className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Bulk CSV Import Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-3xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 text-slate-900 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Bulk Employee CSV / Spreadsheet Import</h3>
                  <p className="text-xs text-slate-500">
                    Import multiple workforce records transactionally into {tenant?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-600">
                Format: <code className="text-emerald-700 font-mono font-medium">firstName, lastName, workEmail, phone, departmentName, designationTitle, salary...</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download Sample CSV</span>
                </button>
                <button
                  type="button"
                  onClick={loadSampleData}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fill Goodwin Staff</span>
                </button>
              </div>
            </div>

            {/* CSV Raw Text Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CSV Data Stream (Paste or edit spreadsheet rows)
              </label>
              <textarea
                rows={5}
                value={csvRawText}
                onChange={(e) => {
                  setCsvRawText(e.target.value);
                  parseCsv(e.target.value);
                }}
                placeholder="firstName,lastName,workEmail,phone,departmentName,designationTitle,employmentType,monthlySalary,gender,workLocation"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              ></textarea>
            </div>

            {/* Parse Preview Table */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Parsed Records Preview ({parsedRows.length} rows)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {parsedRows.filter((r) => r._isValid).length} Valid &bull;{' '}
                    {parsedRows.filter((r) => !r._isValid).length} Flagged
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto max-h-48">
                  <table className="w-full text-left text-[11px] text-slate-600">
                    <thead className="bg-slate-50 uppercase font-semibold text-[9px] text-slate-500 tracking-wider sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Department</th>
                        <th className="px-3 py-2">Designation</th>
                        <th className="px-3 py-2">Salary</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[10px]">
                      {parsedRows.map((r, i) => (
                        <tr key={i} className={r._isValid ? '' : 'bg-rose-50'}>
                          <td className="px-3 py-1.5">{r._rowNum}</td>
                          <td className="px-3 py-1.5 font-sans font-semibold text-slate-900">
                            {r.firstName} {r.lastName}
                          </td>
                          <td className="px-3 py-1.5 text-slate-600">{r.workEmail}</td>
                          <td className="px-3 py-1.5 text-slate-600">{r.departmentName}</td>
                          <td className="px-3 py-1.5 text-slate-600">{r.designationTitle}</td>
                          <td className="px-3 py-1.5 text-slate-800">₹{Number(r.monthlySalary || 0).toLocaleString()}</td>
                          <td className="px-3 py-1.5">
                            {r._isValid ? (
                              <span className="text-emerald-700 font-semibold">VALID</span>
                            ) : r._isDuplicate ? (
                              <span className="text-amber-700 font-semibold">DUPLICATE EMAIL</span>
                            ) : (
                              <span className="text-rose-700 font-semibold">MISSING FIELDS</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Import Result Notification */}
            {importResult && (
              <div
                className={`p-4 rounded-xl text-xs space-y-1.5 ${
                  importResult.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Successfully added {importResult.importedCount} new workforce records!
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  New employees are in <code className="text-slate-800 font-bold">NOT_INVITED</code> state. You can now go to Invitations to dispatch activation links.
                </p>
                <div className="pt-2">
                  <Link
                    href={`/app/${tenantSlug}/invitations`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                  >
                    <span>Proceed to Dispatch Invitations</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
              <button
                type="button"
                disabled={parsedRows.length === 0 || importLoading}
                onClick={handleExecuteImport}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{importLoading ? 'Importing Batch...' : `Import ${parsedRows.length} Employees`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Single Employee Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Add Individual Employee</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. John"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Doe"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    placeholder="john.doe@company.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Personal Email</label>
                  <input
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    placeholder="john.personal@gmail.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other / Non-Binary</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation Title *</label>
                  <input
                    type="text"
                    required
                    value={designationTitle}
                    onChange={(e) => setDesignationTitle(e.target.value)}
                    placeholder="e.g. Battery Calibration Engineer"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work Location</label>
                  <input
                    type="text"
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    placeholder="e.g. Hosur Battery Plant"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employment Type</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <option value="FULL_TIME">Full Time Regular</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract Basis</option>
                    <option value="INTERN">Internship Trainee</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Monthly Salary ({tenant?.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    placeholder="e.g. 65000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PAN / Tax ID</label>
                  <input
                    type="text"
                    value={panOrTaxId}
                    onChange={(e) => setPanOrTaxId(e.target.value)}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Axis Bank"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="e.g. 98127394812"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md disabled:opacity-50"
                >
                  {addLoading ? 'Adding...' : 'Create Employee Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Edit Employee Profile</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                      {editingEmp.employeeCode}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingEmp.firstName} {editingEmp.lastName} &bull; {editingEmp.workEmail}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingEmp(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEmployeeEdit} className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
              {/* Super Admin Privileges Banner */}
              {isSuperAdmin ? (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-extrabold text-amber-950 flex items-center gap-1.5">
                        <span>Super Admin Privileges Active</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-200/80 text-[9px] font-mono font-bold text-amber-900">
                          SUPER_ADMIN
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Direct editing unlocked for Base Compensation, Banking details, Statutory Tax IDs, and Lifecycle termination.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-200/70 text-slate-600 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Standard HR Administrator Mode</div>
                    <p className="text-[11px] text-slate-500">
                      Sensitive payroll liabilities, banking routing, PAN, and lifecycle states are locked and editable exclusively by Super Admin.
                    </p>
                  </div>
                </div>
              )}

              {editError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {editSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{editSuccess}</span>
                </div>
              )}

              {/* SECTION 1: Personal & Contact Information */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Personal & Contact Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Work Email *</label>
                    <input
                      type="email"
                      required
                      value={editWorkEmail}
                      onChange={(e) => setEditWorkEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Personal Email</label>
                    <input
                      type="email"
                      value={editPersonalEmail}
                      onChange={(e) => setEditPersonalEmail(e.target.value)}
                      placeholder="e.g. employee@gmail.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other / Non-Binary</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Organization & Work Placement */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Organization & Placement</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                    <select
                      value={editDepartmentId}
                      onChange={(e) => setEditDepartmentId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Designation Title *</label>
                    <input
                      type="text"
                      required
                      value={editDesignationTitle}
                      onChange={(e) => setEditDesignationTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Employment Type</label>
                    <select
                      value={editEmploymentType}
                      onChange={(e) => setEditEmploymentType(e.target.value as EmploymentType)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      <option value="FULL_TIME">Full Time Regular</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="CONTRACT">Contract Basis</option>
                      <option value="INTERN">Internship Trainee</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date of Joining</label>
                    <input
                      type="date"
                      value={editJoiningDate}
                      onChange={(e) => setEditJoiningDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Work Location / Facility</label>
                    <input
                      type="text"
                      value={editWorkLocation}
                      onChange={(e) => setEditWorkLocation(e.target.value)}
                      placeholder="e.g. Hosur Battery Plant"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Shift Assignment</label>
                    {shifts.length > 0 ? (
                      <select
                        value={editShiftName}
                        onChange={(e) => setEditShiftName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      >
                        {shifts.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({s.startTime} - {s.endTime})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={editShiftName}
                        onChange={(e) => setEditShiftName(e.target.value)}
                        placeholder="e.g. General Day Shift"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 3: Compensation, Banking & Lifecycle (SUPER ADMIN EXCLUSIVE) */}
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-300/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <span className="font-extrabold text-slate-900">Compensation, Banking & Lifecycle Governance</span>
                  </div>
                  {isSuperAdmin ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      <Sparkles className="w-3 h-3 text-amber-600" /> Super Admin Unlocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                      <Lock className="w-3 h-3 text-slate-500" /> Super Admin Only
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Monthly Base Salary ({tenant?.currency}) *</span>
                      {!isSuperAdmin && <Lock className="w-3 h-3 text-slate-400" />}
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      disabled={!isSuperAdmin}
                      value={editMonthlySalary}
                      onChange={(e) => setEditMonthlySalary(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        !isSuperAdmin
                          ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                          : 'border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>PAN / Tax ID</span>
                      {!isSuperAdmin && <Lock className="w-3 h-3 text-slate-400" />}
                    </label>
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      value={editPanOrTaxId}
                      onChange={(e) => setEditPanOrTaxId(e.target.value)}
                      placeholder="e.g. ABCDE1234F"
                      className={`w-full px-3 py-2 rounded-xl border ${
                        !isSuperAdmin
                          ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                          : 'border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Bank Name</span>
                      {!isSuperAdmin && <Lock className="w-3 h-3 text-slate-400" />}
                    </label>
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      value={editBankName}
                      onChange={(e) => setEditBankName(e.target.value)}
                      placeholder="e.g. Axis Bank"
                      className={`w-full px-3 py-2 rounded-xl border ${
                        !isSuperAdmin
                          ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                          : 'border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Bank Account Number</span>
                      {!isSuperAdmin && <Lock className="w-3 h-3 text-slate-400" />}
                    </label>
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      value={editBankAccountNumber}
                      onChange={(e) => setEditBankAccountNumber(e.target.value)}
                      placeholder="e.g. 98127394812"
                      className={`w-full px-3 py-2 rounded-xl border ${
                        !isSuperAdmin
                          ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                          : 'border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Lifecycle Status</span>
                      {!isSuperAdmin && <Lock className="w-3 h-3 text-slate-400" />}
                    </label>
                    <select
                      disabled={!isSuperAdmin}
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as EmployeeStatus)}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        !isSuperAdmin
                          ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                          : 'border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-semibold text-emerald-800'
                      }`}
                    >
                      <option value="ACTIVE">ACTIVE (Active Regular Workforce)</option>
                      <option value="PROBATION">PROBATION (Probation Evaluation)</option>
                      <option value="NOTICE_PERIOD">NOTICE_PERIOD (Serving Notice)</option>
                      <option value="TERMINATED">TERMINATED (Terminated)</option>
                      <option value="EXITED">EXITED (Resigned / Exited)</option>
                      <option value="ARCHIVED">ARCHIVED (Archived Record)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Login Account State</span>
                      {!isSuperAdmin && <Lock className="w-3 h-3 text-slate-400" />}
                    </label>
                    <select
                      disabled={!isSuperAdmin}
                      value={editLoginStatus}
                      onChange={(e) => setEditLoginStatus(e.target.value as LoginActivationStatus)}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        !isSuperAdmin
                          ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                          : 'border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30'
                      }`}
                    >
                      <option value="NOT_INVITED">NOT_INVITED (Record Only)</option>
                      <option value="PENDING">PENDING (Invitation Dispatched)</option>
                      <option value="ACCEPTED">ACCEPTED (Active Login User)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {editLoading ? 'Saving Changes...' : 'Save Employee Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Permanent Deletion Confirmation Modal */}
      {deleteConfirmOpen && deleteEmpTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-rose-200 shadow-2xl overflow-hidden text-slate-900 space-y-4 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Permanently Delete Employee Record
                </h3>
                <p className="text-xs text-rose-700 font-semibold">
                  Restricted Super Admin Irreversible Operation
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2 text-xs text-rose-900">
              <p className="font-bold">
                Are you sure you want to permanently delete this employee?
              </p>
              <p className="text-[11px] leading-relaxed text-slate-600">
                This will permanently purge this record from the Supabase PostgreSQL database, cascading across shift allocations, invitation tokens, and historical records for <strong className="text-slate-900">{tenant?.name}</strong>. This operation cannot be reversed.
              </p>
            </div>

            {/* Target Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-900">
                  {deleteEmpTarget.firstName} {deleteEmpTarget.lastName}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {deleteEmpTarget.employeeCode} &bull; {deleteEmpTarget.workEmail}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  {deleteEmpTarget.designationTitle} &bull; {deleteEmpTarget.departmentName}
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900 block">
                  {tenant?.currency} {deleteEmpTarget.monthlySalary?.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  {deleteEmpTarget.status}
                </span>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteEmpTarget(null);
                }}
                className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel / Keep Record
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="px-5 py-2 font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleteLoading ? 'Purging Record...' : 'Confirm Permanent Purge'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Detail Drawer */}
      {selectedEmp && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl p-6 text-slate-900 overflow-y-auto space-y-6 animate-slide-left">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Employee Profile</h3>
            <button
              onClick={() => setSelectedEmp(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-700 text-xl shadow-xs">
              {selectedEmp.firstName.slice(0, 1)}
              {selectedEmp.lastName.slice(0, 1)}
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">
                {selectedEmp.firstName} {selectedEmp.lastName}
              </h4>
              <p className="text-xs text-emerald-700 font-semibold">{selectedEmp.designationTitle}</p>
              <span className="inline-block font-mono text-[11px] text-slate-500 font-semibold mt-0.5">
                {selectedEmp.employeeCode}
              </span>
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => openEditModal(selectedEmp)}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile {isSuperAdmin ? '(Super Admin Unlocked)' : ''}</span>
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => {
                  setDeleteEmpTarget(selectedEmp);
                  setDeleteConfirmOpen(true);
                }}
                className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Purge record permanently from PostgreSQL database"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Purge</span>
              </button>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Employment Details</div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold text-slate-800">{selectedEmp.departmentName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Employment Type</span>
                <span className="font-semibold text-slate-800">{selectedEmp.employmentType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Date of Joining</span>
                <span className="font-semibold text-slate-800">{selectedEmp.joiningDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Work Location</span>
                <span className="font-semibold text-slate-800">{selectedEmp.workLocation || 'Facility'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Shift Name</span>
                <span className="font-semibold text-slate-800">{selectedEmp.shiftName || 'General Day Shift'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Login Account</span>
                <span className="font-semibold text-amber-700">{selectedEmp.loginStatus || 'NOT_INVITED'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-emerald-700">{selectedEmp.status}</span>
              </div>
            </div>

            {isEmployeeOnly &&
            !(
              user &&
              (selectedEmp.workEmail.toLowerCase() === user.email.toLowerCase() ||
                selectedEmp.firstName.toLowerCase() === user.name.toLowerCase().split(' ')[0])
            ) ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-center py-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-amber-600 flex items-center justify-center mx-auto mb-1 border border-slate-200">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-800">Confidential HR Record</div>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Compensation, statutory tax identification, and bank account numbers are restricted to Company Administrators and HR Officers under Goodwin Grow RBAC policies.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Payroll & Statutory</span>
                  {isSuperAdmin ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <ShieldCheck className="w-3 h-3 text-amber-600" /> Super Admin Unlocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
                      <Lock className="w-3 h-3" /> Super Admin Only
                    </span>
                  )}
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Monthly Compensation</span>
                  <span className="font-bold text-emerald-700">
                    {tenant?.currency} {selectedEmp.monthlySalary.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">PAN / Tax ID</span>
                  <span className="font-mono text-slate-800">{selectedEmp.panOrTaxId || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Bank Name</span>
                  <span className="text-slate-800">{selectedEmp.bankName || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Account No.</span>
                  <span className="font-mono text-slate-800">{selectedEmp.bankAccountNumber || 'N/A'}</span>
                </div>
              </div>
            )}

            {!isEmployeeOnly && (
              <Link
                href={`/app/${tenantSlug}/invitations`}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>Manage Credentials & Reset Password</span>
              </Link>
            )}

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Isolated inside {tenant?.name}&apos;s security tenant boundary.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
