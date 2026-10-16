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
  Upload,
  Download,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  KeyRound,
  FileSpreadsheet
} from 'lucide-react';
import { Employee, Department, Tenant } from '@/lib/types';

export default function TenantEmployeesPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
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

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [departmentId, setDepartmentId] = useState('');
  const [designationTitle, setDesignationTitle] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [panOrTaxId, setPanOrTaxId] = useState('');

  // Selected Employee Drawer State
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/employees`);
      const json = await res.json();
      if (json.success) {
        setEmployees(json.data.employees);
        setDepartments(json.data.departments);
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
          phone,
          gender,
          departmentId,
          designationTitle,
          monthlySalary: Number(monthlySalary),
          bankAccountNumber,
          bankName,
          panOrTaxId
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

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove employee ${name}?`)) return;

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/employees?id=${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        if (selectedEmp?.id === id) setSelectedEmp(null);
        fetchEmployees();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setWorkEmail('');
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Workforce & Employee Directory</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {employees.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Independent workforce records & credentials lifecycle for {tenant?.name || 'this organization'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setBulkModalOpen(true);
              setImportResult(null);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs transition-all border border-slate-700 shadow-sm"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Bulk CSV Import</span>
          </button>

          <Link
            href={`/app/${tenantSlug}/invitations`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 hover:text-amber-200 font-semibold text-xs transition-all border border-amber-500/30"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Manage Invitations ({pendingInvitesCount})</span>
          </Link>

          <button
            onClick={() => {
              if (departments.length > 0 && !departmentId) {
                setDepartmentId(departments[0].id);
              }
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Workforce</div>
          <div className="text-2xl font-black text-white">{employees.length}</div>
          <p className="text-[10px] text-slate-500 font-mono">Capacity: {tenant?.maxEmployees || 100} seats</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Active Login Users</div>
          <div className="text-2xl font-black text-emerald-400">{activeAccountsCount}</div>
          <p className="text-[10px] text-emerald-500/80">Can sign in to portal</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Pending Activation</div>
          <div className="text-2xl font-black text-amber-400">{pendingInvitesCount}</div>
          <p className="text-[10px] text-amber-500/80">Invite dispatched</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Uninvited Staff</div>
          <div className="text-2xl font-black text-slate-300">{uninvitedCount}</div>
          <p className="text-[10px] text-slate-500">Record only, no user login</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search employee by name, code, designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Dept:
          </span>
          <button
            onClick={() => setSelectedDept('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedDept === 'ALL'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All
          </button>
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedDept === dept.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>
      </div>

      {/* Employees Table */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 uppercase font-semibold text-[10px] text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Department & Role</th>
                <th className="px-6 py-3.5">Monthly Compensation</th>
                <th className="px-6 py-3.5">Login Account</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 text-xs">
                    No employees matching the criteria found in this company workspace.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedEmp(emp)}
                    className="hover:bg-slate-900/60 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 text-xs">
                          {emp.firstName.slice(0, 1)}
                          {emp.lastName.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            {emp.workEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-400">{emp.employeeCode}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{emp.designationTitle}</div>
                      <div className="text-[11px] text-slate-400">{emp.departmentName}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-200">
                      {tenant?.currency} {emp.monthlySalary.toLocaleString()} / mo
                    </td>
                    <td className="px-6 py-4">
                      {emp.loginStatus === 'ACCEPTED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active Account</span>
                        </span>
                      ) : emp.loginStatus === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                          <span>Invite Pending</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          <span>Not Invited</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEmployee(emp.id, `${emp.firstName} ${emp.lastName}`);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove Employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk CSV Import Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Bulk Employee CSV / Spreadsheet Import</h3>
                  <p className="text-xs text-slate-400">
                    Import multiple workforce records transactionally into {tenant?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBulkModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400">
                Format: <code className="text-emerald-400">firstName, lastName, workEmail, phone, departmentName, designationTitle, salary...</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Sample CSV</span>
                </button>
                <button
                  type="button"
                  onClick={loadSampleData}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/30 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fill Goodwin Staff</span>
                </button>
              </div>
            </div>

            {/* CSV Raw Text Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              ></textarea>
            </div>

            {/* Parse Preview Table */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">
                    Parsed Records Preview ({parsedRows.length} rows)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {parsedRows.filter((r) => r._isValid).length} Valid &bull;{' '}
                    {parsedRows.filter((r) => !r._isValid).length} Flagged
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-x-auto max-h-48">
                  <table className="w-full text-left text-[11px] text-slate-300">
                    <thead className="bg-slate-900 uppercase font-semibold text-[9px] text-slate-400 tracking-wider sticky top-0">
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
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[10px]">
                      {parsedRows.map((r, i) => (
                        <tr key={i} className={r._isValid ? '' : 'bg-rose-950/20'}>
                          <td className="px-3 py-1.5">{r._rowNum}</td>
                          <td className="px-3 py-1.5 font-sans font-semibold text-white">
                            {r.firstName} {r.lastName}
                          </td>
                          <td className="px-3 py-1.5 text-slate-300">{r.workEmail}</td>
                          <td className="px-3 py-1.5 text-slate-400">{r.departmentName}</td>
                          <td className="px-3 py-1.5 text-slate-400">{r.designationTitle}</td>
                          <td className="px-3 py-1.5 text-slate-300">₹{Number(r.monthlySalary || 0).toLocaleString()}</td>
                          <td className="px-3 py-1.5">
                            {r._isValid ? (
                              <span className="text-emerald-400 font-semibold">VALID</span>
                            ) : r._isDuplicate ? (
                              <span className="text-amber-400 font-semibold">DUPLICATE EMAIL</span>
                            ) : (
                              <span className="text-rose-400 font-semibold">MISSING FIELDS</span>
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
                    ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    Successfully added {importResult.importedCount} new workforce records!
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  New employees are in <code className="text-slate-300 font-bold">NOT_INVITED</code> state. You can now go to Invitations to dispatch activation links.
                </p>
                <div className="pt-2">
                  <Link
                    href={`/app/${tenantSlug}/invitations`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 text-white font-semibold text-xs"
                  >
                    <span>Proceed to Dispatch Invitations</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                disabled={parsedRows.length === 0 || importLoading}
                onClick={handleExecuteImport}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-900/30 disabled:opacity-50 flex items-center gap-1.5"
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
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
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

      {/* Employee Detail Drawer */}
      {selectedEmp && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-950 border-l border-slate-800 shadow-2xl p-6 text-white overflow-y-auto space-y-6 animate-slide-left">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="font-bold text-base text-white">Employee Profile</h3>
            <button
              onClick={() => setSelectedEmp(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-xl shadow-lg">
              {selectedEmp.firstName.slice(0, 1)}
              {selectedEmp.lastName.slice(0, 1)}
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">
                {selectedEmp.firstName} {selectedEmp.lastName}
              </h4>
              <p className="text-xs text-slate-400">{selectedEmp.designationTitle}</p>
              <span className="inline-block font-mono text-[11px] text-emerald-400 font-semibold mt-0.5">
                {selectedEmp.employeeCode}
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Employment Details</div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Department</span>
                <span className="font-semibold text-slate-200">{selectedEmp.departmentName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Employment Type</span>
                <span className="font-semibold text-slate-200">{selectedEmp.employmentType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Date of Joining</span>
                <span className="font-semibold text-slate-200">{selectedEmp.joiningDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Login Account</span>
                <span className="font-semibold text-amber-400">{selectedEmp.loginStatus || 'NOT_INVITED'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Status</span>
                <span className="font-semibold text-emerald-400">{selectedEmp.status}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Payroll & Statutory</div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Monthly Compensation</span>
                <span className="font-bold text-emerald-400">
                  {tenant?.currency} {selectedEmp.monthlySalary.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">PAN / Tax ID</span>
                <span className="font-mono text-slate-200">{selectedEmp.panOrTaxId || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Bank Name</span>
                <span className="text-slate-200">{selectedEmp.bankName || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Account No.</span>
                <span className="font-mono text-slate-200">{selectedEmp.bankAccountNumber || 'N/A'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Isolated inside {tenant?.name}&apos;s security tenant boundary.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
