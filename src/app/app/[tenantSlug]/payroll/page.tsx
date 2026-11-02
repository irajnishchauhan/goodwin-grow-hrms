'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  CreditCard,
  Play,
  FileText,
  DollarSign,
  Download,
  Printer,
  X,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Clock,
  AlertCircle,
  Send,
  Search,
  Filter,
  Layers,
  ChevronDown,
  Calendar,
  Check,
  User,
  ArrowRight,
  ExternalLink,
  Briefcase
} from 'lucide-react';
import { SalarySlip, Tenant } from '@/lib/types';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { downloadPayslipPDF } from '@/lib/pdf/generatePayslipPDF';

function PayrollContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = params.tenantSlug as string;
  const { user, isEmployeeOnly, isSuperAdmin, isCompanyAdmin, isHRAdmin } = useCurrentUser(tenantSlug);

  // Synchronize Tab with ?tab= query parameter
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'register' | 'slips'>(
    tabParam === 'slips' ? 'slips' : 'register'
  );

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'slips') {
      setActiveTab('slips');
    } else {
      setActiveTab('register');
    }
  }, [searchParams]);

  const handleTabChange = (newTab: 'register' | 'slips') => {
    setActiveTab(newTab);
    const targetUrl = `/app/${tenantSlug}/payroll${newTab === 'slips' ? '?tab=slips' : ''}`;
    router.replace(targetUrl, { scroll: false });
  };

  // Month & Batch State
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningBatch, setRunningBatch] = useState(false);
  const [confirmingAll, setConfirmingAll] = useState(false);
  const [confirmingSlipId, setConfirmingSlipId] = useState<string | null>(null);
  const [paymentRefModalOpen, setPaymentRefModalOpen] = useState(false);
  const [targetSlipForPayment, setTargetSlipForPayment] = useState<SalarySlip | null>(null);
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [batchMsg, setBatchMsg] = useState<string | null>(null);
  const [downloadingBulk, setDownloadingBulk] = useState(false);
  const [bulkDownloadStatus, setBulkDownloadStatus] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

  // Payslip Modal
  const [activeSlip, setActiveSlip] = useState<SalarySlip | null>(null);

  const fetchPayroll = async (monthToFetch = selectedMonth) => {
    try {
      setLoading(true);
      const [res, empRes] = await Promise.all([
        fetch(`/api/tenants/${tenantSlug}/payroll?month=${monthToFetch}&t=${Date.now()}`, {
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
        setSlips(json.data.slips || []);
      }

      if (empJson.success) {
        setTenant(empJson.data.tenant);
        setEmployees(empJson.data.employees || []);
      }
    } catch (e) {
      console.error('Failed to load payroll records:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchPayroll(selectedMonth);
    }
  }, [tenantSlug, selectedMonth]);

  const handleRunPayroll = async () => {
    setRunningBatch(true);
    setBatchMsg(null);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/payroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth })
      });
      const json = await res.json();
      if (json.success) {
        setBatchMsg(json.message);
        fetchPayroll(selectedMonth);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRunningBatch(false);
    }
  };

  const handleConfirmSinglePayment = async (slipId: string, reference?: string) => {
    setConfirmingSlipId(slipId);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/payroll`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONFIRM_PAYMENT',
          slipId,
          paymentReference: reference || `NEFT-${Date.now().toString().slice(-6)}`
        })
      });
      const json = await res.json();
      if (json.success) {
        setBatchMsg(json.message);
        setPaymentRefModalOpen(false);
        setTargetSlipForPayment(null);
        setPaymentRefInput('');
        if (activeSlip && activeSlip.id === slipId) {
          setActiveSlip({ ...activeSlip, paymentStatus: 'PAID', paymentReference: reference });
        }
        fetchPayroll(selectedMonth);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setConfirmingSlipId(null);
    }
  };

  const handleConfirmAllPayments = async () => {
    setConfirmingAll(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/payroll`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONFIRM_ALL',
          month: selectedMonth,
          paymentReference: `BATCH-NEFT-${Date.now().toString().slice(-6)}`
        })
      });
      const json = await res.json();
      if (json.success) {
        setBatchMsg(json.message);
        fetchPayroll(selectedMonth);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setConfirmingAll(false);
    }
  };

  // Filter slips if employee
  const myEmp = employees.find(
    (e) =>
      user &&
      (e.workEmail?.toLowerCase() === user.email?.toLowerCase() ||
        e.firstName?.toLowerCase() === user.name?.toLowerCase().split(' ')[0])
  );

  const baseVisibleSlips = isEmployeeOnly
    ? slips.filter((s) => {
        if (!user) return true;
        if (myEmp && s.employeeId === myEmp.id) return true;
        const firstName = user.name?.toLowerCase().split(' ')[0] || '';
        return s.employeeName.toLowerCase().includes(firstName);
      })
    : slips;

  // Extract unique departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set<string>();
    baseVisibleSlips.forEach((s) => {
      if (s.departmentName) set.add(s.departmentName);
    });
    return Array.from(set);
  }, [baseVisibleSlips]);

  // Apply Search & Filters
  const filteredSlips = useMemo(() => {
    return baseVisibleSlips.filter((s) => {
      // Department
      if (departmentFilter !== 'ALL' && s.departmentName !== departmentFilter) {
        return false;
      }
      // Status
      if (statusFilter === 'PAID' && s.paymentStatus !== 'PAID') return false;
      if (statusFilter === 'PENDING' && s.paymentStatus === 'PAID') return false;

      // Query (Name or Code)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.employeeName.toLowerCase().includes(q);
        const matchesCode = s.employeeCode.toLowerCase().includes(q);
        const matchesDept = s.departmentName?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDept) return false;
      }
      return true;
    });
  }, [baseVisibleSlips, departmentFilter, statusFilter, searchQuery]);

  const totalGross = baseVisibleSlips.reduce((sum, s) => sum + s.grossSalary, 0);
  const totalDeductions = baseVisibleSlips.reduce((sum, s) => sum + s.totalDeductions, 0);
  const totalNet = baseVisibleSlips.reduce((sum, s) => sum + s.netPay, 0);

  const paidSlips = baseVisibleSlips.filter((s) => s.paymentStatus === 'PAID');
  const pendingSlips = baseVisibleSlips.filter((s) => s.paymentStatus !== 'PAID');
  const paidNetTotal = paidSlips.reduce((sum, s) => sum + s.netPay, 0);
  const disbursementPercent =
    baseVisibleSlips.length > 0 ? Math.round((paidSlips.length / baseVisibleSlips.length) * 100) : 0;

  // Bulk PDF Download Handler
  const handleDownloadAllPDFs = async () => {
    if (filteredSlips.length === 0) return;
    setDownloadingBulk(true);
    setBulkDownloadStatus(`Preparing ${filteredSlips.length} payslips...`);
    try {
      for (let i = 0; i < filteredSlips.length; i++) {
        const slip = filteredSlips[i];
        setBulkDownloadStatus(`Downloading PDF (${i + 1}/${filteredSlips.length}): ${slip.employeeName}`);
        const emp = employees.find((e) => e.id === slip.employeeId);
        downloadPayslipPDF(slip, tenant, emp);
        // Small delay so browser handles downloads gracefully
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      setBulkDownloadStatus(`✓ All ${filteredSlips.length} payslip PDFs downloaded successfully!`);
      setTimeout(() => setBulkDownloadStatus(null), 4000);
    } catch (e) {
      console.error('Bulk download error:', e);
      setBulkDownloadStatus('Bulk download encountered an error.');
    } finally {
      setDownloadingBulk(false);
    }
  };

  const getMonthDisplayName = (m: string) => {
    const [year, monthNum] = m.split('-');
    const date = new Date(Number(year), Number(monthNum) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const handleExportPayrollCSV = () => {
    if (filteredSlips.length === 0) return;

    const headers = [
      'Month',
      'Employee Code',
      'Employee Name',
      'Department',
      'Designation',
      'Calendar Days',
      'Payable Days',
      'LOP Days',
      'Basic (INR)',
      'HRA (INR)',
      'Special Allowance (INR)',
      'Gross Salary (INR)',
      'PF Employee (INR)',
      'PT (INR)',
      'ESI Employee (INR)',
      'TDS (INR)',
      'Total Deductions (INR)',
      'Net Pay (INR)',
      'Payment Status',
      'Payment Ref / UTR',
      'Bank Name',
      'Bank Account Number'
    ];

    const rows = filteredSlips.map((slip) => {
      const emp = employees.find((e) => e.id === slip.employeeId);
      const bankAcc = slip.bankAccountNumber || emp?.bankAccountNumber;
      return [
        slip.month,
        slip.employeeCode,
        slip.employeeName,
        slip.departmentName || emp?.departmentName || 'Operations',
        slip.designationTitle || emp?.designationTitle || 'Associate',
        slip.totalCalendarDays ?? 30,
        slip.payableDays ?? 30,
        slip.lopDays ?? 0,
        slip.basicPay,
        slip.hra,
        slip.specialAllowance,
        slip.grossSalary,
        slip.providentFund,
        slip.professionalTax,
        slip.esi,
        slip.taxDeduction,
        slip.totalDeductions,
        slip.netPay,
        slip.paymentStatus,
        slip.paymentReference || 'N/A',
        slip.bankName || emp?.bankName || 'N/A',
        bankAcc ? `="${bankAcc}"` : 'N/A'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const str = String(cell ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      )
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Payroll_Register_${tenant?.slug || 'company'}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Standard Indian Corporate Net Banking NEFT/RTGS Batch Upload File (HDFC, ICICI, Axis, SBI)
  const handleExportBankBatchCSV = () => {
    if (filteredSlips.length === 0) return;

    const headers = [
      'Payment Type',
      'Beneficiary Account Number',
      'Beneficiary Name',
      'IFSC Code',
      'Amount (INR)',
      'Payment Description',
      'Employee Code',
      'Beneficiary Email',
      'Bank Name'
    ];

    const rows = filteredSlips.map((slip) => {
      const emp = employees.find((e) => e.id === slip.employeeId);
      const acc = slip.bankAccountNumber || emp?.bankAccountNumber || 'NOT_CONFIGURED';
      const ifsc = slip.ifscCode || emp?.ifscCode || 'UTIB0000001';
      return [
        'NEFT',
        `="${acc}"`,
        slip.employeeName,
        ifsc,
        slip.netPay,
        `SALARY ${slip.month}`,
        slip.employeeCode,
        emp?.workEmail || '',
        slip.bankName || emp?.bankName || 'Axis Bank'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const str = String(cell ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      )
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bank_Disbursement_Batch_${tenant?.slug || 'company'}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Payroll &amp; Statutory Engine
            </span>
            <span className="text-[10px] text-slate-400 font-mono">• Goodwin Grow HRMS</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 mt-1">
            {activeTab === 'register' ? (
              <>
                <CreditCard className="w-6 h-6 text-emerald-600" />
                {isEmployeeOnly ? 'My Salary Register' : 'Payroll Run & Statutory Register'}
              </>
            ) : (
              <>
                <FileText className="w-6 h-6 text-emerald-600" />
                {isEmployeeOnly ? 'My Salary Slips & PDF' : 'Salary Slips & PDF Dispatch'}
              </>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === 'register'
              ? isEmployeeOnly
                ? `Personal monthly compensation and verified disbursement records for ${user?.name || 'Employee'}`
                : `Salary structure engine, automated attendance proration, and statutory compliance for ${tenant?.name || 'Company'}`
              : isEmployeeOnly
              ? 'Download your verified Keka-format salary slips and compensation breakdowns'
              : `Generate, verify, and export official compliance-ready payslips for all active personnel`}
          </p>
        </div>

        {/* Global Month Selector & Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer font-bold text-slate-900"
            >
              <option value="2026-10">October 2026 (Active Closed Cycle)</option>
              <option value="2026-11">November 2026 (Current Cycle)</option>
              <option value="2026-09">September 2026</option>
            </select>
          </div>

          <button
            onClick={handleExportPayrollCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-2xs transition-all cursor-pointer"
            title="Download full payroll register as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {!isEmployeeOnly && (
            <button
              onClick={handleExportBankBatchCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-300 shadow-2xs transition-all cursor-pointer"
              title="Download Corporate Net Banking NEFT/RTGS Batch Upload File"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bank Batch (NEFT)</span>
            </button>
          )}

          {!isEmployeeOnly && (
            <button
              onClick={handleRunPayroll}
              disabled={runningBatch || confirmingAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>{runningBatch ? 'Calculating...' : 'Recalculate Batch'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-2 rounded-xl shadow-2xs">
        <div className="flex gap-2">
          <button
            onClick={() => handleTabChange('register')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payroll Run &amp; Register</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
              {baseVisibleSlips.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('slips')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'slips'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Salary Slips &amp; PDF</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold">
              PDF Ready
            </span>
          </button>
        </div>

        {/* Status Pill in Tab Bar */}
        <div className="hidden sm:flex items-center gap-2 pr-2 text-xs text-slate-500">
          <span className="font-medium">Cycle:</span>
          <span className="font-mono font-bold text-slate-800">{getMonthDisplayName(selectedMonth)}</span>
        </div>
      </div>

      {/* Alert Notifications */}
      {batchMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{batchMsg}</span>
          </div>
          <button
            onClick={() => setBatchMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {bulkDownloadStatus && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-medium">{bulkDownloadStatus}</span>
          </div>
          <button
            onClick={() => setBulkDownloadStatus(null)}
            className="text-blue-700 hover:text-blue-900 font-bold cursor-pointer text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 1: PAYROLL RUN & REGISTER                                  */}
      {/* ============================================================== */}
      {activeTab === 'register' && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {isEmployeeOnly ? 'My Monthly Gross' : 'Total Monthly Gross'}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {tenant?.currency} {totalGross.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {isEmployeeOnly
                  ? 'Earned gross for logged attendance'
                  : 'Prorated strictly by attendance days logged (No Entry = No Pay)'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {isEmployeeOnly ? 'My Deductions (PF/Tax)' : 'Statutory Deductions (PF/Tax)'}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {tenant?.currency} {totalDeductions.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Professional Tax (PT) + ESI + PF (₹0) + TDS
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {isEmployeeOnly ? 'My Net Take-Home Pay' : 'Disbursement Status'}
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {disbursementPercent}% Disbursed
                </span>
              </div>
              <div className={`text-2xl sm:text-3xl font-extrabold mt-1 ${paidNetTotal > 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                {tenant?.currency} {totalNet.toLocaleString()}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium">
                {pendingSlips.length === 0 && paidSlips.length > 0 ? (
                  <span className="text-emerald-700 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    All {paidSlips.length} salaries confirmed &amp; disbursed
                  </span>
                ) : pendingSlips.length > 0 ? (
                  <span className="text-amber-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    {pendingSlips.length} pending clearance • {paidSlips.length} confirmed paid
                  </span>
                ) : (
                  <span className="text-slate-500">No payroll records</span>
                )}
              </div>
            </div>
          </div>

          {/* Master Register Filter & Actions Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search employee by name, ID, or dept..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Department Filter */}
              {departments.length > 1 && (
                <div className="flex items-center gap-1">
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Departments ({baseVisibleSlips.length})</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Filter */}
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All ({baseVisibleSlips.length})
                </button>
                <button
                  onClick={() => setStatusFilter('PAID')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    statusFilter === 'PAID'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Paid ({paidSlips.length})
                </button>
                <button
                  onClick={() => setStatusFilter('PENDING')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    statusFilter === 'PENDING'
                      ? 'bg-white text-amber-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Pending ({pendingSlips.length})
                </button>
              </div>
            </div>

            {/* Disburse All Button for Admin */}
            {!isEmployeeOnly && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleConfirmAllPayments}
                  disabled={confirmingAll || runningBatch || baseVisibleSlips.length === 0 || pendingSlips.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {confirmingAll
                      ? 'Confirming Payments...'
                      : `Confirm & Disburse All (${pendingSlips.length} Pending)`}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Master Payroll Register Table */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  {getMonthDisplayName(selectedMonth)} Master Payroll Register
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Showing {filteredSlips.length} of {baseVisibleSlips.length} Employees
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 uppercase font-semibold text-[10px] text-slate-500 tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Employee</th>
                    <th className="px-6 py-3.5">Code</th>
                    <th className="px-6 py-3.5">Dept</th>
                    <th className="px-6 py-3.5">Payable / Cal.</th>
                    <th className="px-6 py-3.5">Gross Pay</th>
                    <th className="px-6 py-3.5">Deductions</th>
                    <th className="px-6 py-3.5">Net Take-Home</th>
                    <th className="px-6 py-3.5">Disbursement Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredSlips.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-10 text-center text-slate-500 text-xs">
                        {isEmployeeOnly
                          ? 'No personal payslips found on record for your employee account.'
                          : 'No payroll slips match the search/filter criteria. Try resetting filters or recalculating the batch.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSlips.map((slip) => (
                      <tr key={slip.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          <div>{slip.employeeName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{slip.designationTitle}</div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-emerald-700">{slip.employeeCode}</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{slip.departmentName}</td>
                        <td className="px-6 py-4 font-mono">
                          <span className="font-bold text-slate-800">
                            {slip.payableDays !== undefined ? slip.payableDays : (slip.totalCalendarDays || 31)}
                          </span>
                          <span className="text-slate-400"> / {slip.totalCalendarDays || 31}d</span>
                          {slip.lopDays && slip.lopDays > 0 ? (
                            <span className="block text-[10px] text-rose-600 font-sans">
                              LOP: {slip.lopDays}d
                            </span>
                          ) : null}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {tenant?.currency} {slip.grossSalary.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {tenant?.currency} {slip.totalDeductions.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-emerald-700">
                          {tenant?.currency} {slip.netPay.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          {slip.paymentStatus === 'PAID' ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Paid &amp; Credited
                              </span>
                              {slip.paymentReference && (
                                <span className="text-[10px] font-mono text-slate-500 pl-1 truncate max-w-[130px]" title={slip.paymentReference}>
                                  Ref: {slip.paymentReference}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 w-fit">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Pending Clearance
                              </span>
                              {!isEmployeeOnly && (
                                <button
                                  onClick={() => {
                                    setTargetSlipForPayment(slip);
                                    setPaymentRefInput(`NEFT-${Date.now().toString().slice(-6)}`);
                                    setPaymentRefModalOpen(true);
                                  }}
                                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer w-fit"
                                >
                                  <span>Confirm Payment</span> &rarr;
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setActiveSlip(slip)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                              title="View Itemized Breakdown"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-600" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => {
                                const emp = employees.find((e) => e.id === slip.employeeId);
                                downloadPayslipPDF(slip, tenant, emp);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                              title="Download Professional Keka Style PDF Salary Slip"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>
                          </div>
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

      {/* ============================================================== */}
      {/* TAB 2: SALARY SLIPS & PDF                                      */}
      {/* ============================================================== */}
      {activeTab === 'slips' && (
        <div className="space-y-6">
          {/* Informational Hero Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Compliance Documents
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  Period: {getMonthDisplayName(selectedMonth)}
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                {isEmployeeOnly ? 'My Salary Slips & Tax Statements' : 'Workforce Salary Slips & PDF Generation'}
              </h2>
              <p className="text-xs text-slate-300 max-w-xl">
                Official employee compensation statements formatted according to Indian enterprise HRMS standards.
                Each slip contains complete breakdown of Basic, HRA, statutory deductions, bank transfer UTR, and attendance proration.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleDownloadAllPDFs}
                disabled={downloadingBulk || filteredSlips.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {downloadingBulk
                    ? 'Downloading PDFs...'
                    : `Download Visible (${filteredSlips.length}) PDFs`}
                </span>
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter slips by employee name or ID..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Department */}
              {departments.length > 1 && (
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}

              {/* Status */}
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All ({baseVisibleSlips.length})
                </button>
                <button
                  onClick={() => setStatusFilter('PAID')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    statusFilter === 'PAID'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Paid ({paidSlips.length})
                </button>
                <button
                  onClick={() => setStatusFilter('PENDING')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    statusFilter === 'PENDING'
                      ? 'bg-white text-amber-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Pending ({pendingSlips.length})
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{filteredSlips.length}</span> salary slips
            </div>
          </div>

          {/* Salary Slips Cards Grid */}
          {filteredSlips.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Salary Slips Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No salary slips matched your active filter or search query. You can switch months, clear filters, or recalculate the payroll batch.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSlips.map((slip) => {
                const emp = employees.find((e) => e.id === slip.employeeId);
                return (
                  <div
                    key={slip.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all space-y-4"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-sm shrink-0">
                          {slip.employeeName.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {slip.employeeName}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="font-mono text-emerald-700 font-bold">{slip.employeeCode}</span>
                            <span>•</span>
                            <span className="truncate">{slip.departmentName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {slip.paymentStatus === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pending
                        </span>
                      )}
                    </div>

                    {/* Attendance Strip */}
                    <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Pay Period</span>
                        <span className="font-semibold text-slate-700">{slip.month}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Payable Days</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {slip.payableDays !== undefined ? slip.payableDays : (slip.totalCalendarDays || 31)} / {slip.totalCalendarDays || 31} Days
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Loss of Pay</span>
                        <span className={`font-mono font-bold ${slip.lopDays && slip.lopDays > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                          {slip.lopDays || 0} Days
                        </span>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Gross Salary</span>
                        <span className="font-semibold text-slate-800">
                          {tenant?.currency} {slip.grossSalary.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Deductions</span>
                        <span className="font-semibold text-slate-600">
                          {tenant?.currency} {slip.totalDeductions.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block">Net Pay</span>
                        <span className="font-extrabold text-sm text-emerald-700 font-mono">
                          {tenant?.currency} {slip.netPay.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Reference line if paid */}
                    {slip.paymentReference && (
                      <div className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg truncate">
                        Bank UTR Ref: <span className="font-semibold text-slate-700">{slip.paymentReference}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setActiveSlip(slip)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Preview Slip</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {!isEmployeeOnly && slip.paymentStatus !== 'PAID' && (
                          <button
                            onClick={() => {
                              setTargetSlipForPayment(slip);
                              setPaymentRefInput(`NEFT-${Date.now().toString().slice(-6)}`);
                              setPaymentRefModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Mark Paid</span>
                          </button>
                        )}
                        <button
                          onClick={() => downloadPayslipPDF(slip, tenant, emp)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                          title="Download Official Keka PDF Salary Slip"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ITEMIZED PAYSLIP PREVIEW MODAL                                 */}
      {/* ============================================================== */}
      {activeSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 text-slate-900 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {tenant?.logoUrl ? (
                  <img
                    src={tenant.logoUrl}
                    alt={tenant.name}
                    className="w-12 h-12 rounded-xl object-contain bg-white p-1 border border-slate-200 shadow-2xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                    {tenant?.name?.slice(0, 1) || 'G'}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-base text-slate-900">{tenant?.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Payslip for {getMonthDisplayName(activeSlip.month || selectedMonth)} • Ref: {activeSlip.id}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {tenant?.city}, {tenant?.state} &bull; Reg: {tenant?.companyCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveSlip(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Employee Banner */}
            <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Employee</span>
                <span className="font-bold text-slate-900">{activeSlip.employeeName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Employee Code</span>
                <span className="font-mono font-bold text-emerald-700">{activeSlip.employeeCode}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Department</span>
                <span className="text-slate-800 font-medium">{activeSlip.departmentName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Pay Period</span>
                <span className="text-slate-800 font-medium">{activeSlip.month} (1 to End of Month)</span>
              </div>
            </div>

            {/* Keka Standard Attendance Strip */}
            <div className="bg-slate-100/70 px-6 py-2.5 border-b border-slate-200 grid grid-cols-3 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Calendar Days</span>
                <span className="font-mono font-bold text-slate-800">{activeSlip.totalCalendarDays || 31} Days</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Payable Days</span>
                <span className="font-mono font-bold text-emerald-700">
                  {activeSlip.payableDays !== undefined ? activeSlip.payableDays : (activeSlip.totalCalendarDays || 31)} Days
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Loss of Pay (LOP)</span>
                <span className="font-mono font-bold text-rose-600">
                  {activeSlip.lopDays !== undefined ? activeSlip.lopDays : 0} Days
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Saturday Policy</span>
                <span className="font-bold text-amber-700">Active Working Day</span>
              </div>
            </div>

            {/* Itemized Earnings & Deductions Columns */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              {/* Earnings */}
              <div className="space-y-3">
                <div className="pb-1.5 border-b border-slate-200 font-bold uppercase text-[11px] text-emerald-800 flex justify-between">
                  <span>Earnings Component</span>
                  <span>Amount ({tenant?.currency})</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Basic Salary</span>
                    <span className="font-semibold">{activeSlip.basicPay.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">House Rent Allowance (HRA)</span>
                    <span className="font-semibold">{activeSlip.hra.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Special / Flexible Allowance</span>
                    <span className="font-semibold">{activeSlip.specialAllowance.toLocaleString()}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                  <span>Gross Earnings:</span>
                  <span className="text-emerald-700 font-mono">
                    {tenant?.currency} {activeSlip.grossSalary.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-3">
                <div className="pb-1.5 border-b border-slate-200 font-bold uppercase text-[11px] text-rose-800 flex justify-between">
                  <span>Statutory Deductions</span>
                  <span>Amount ({tenant?.currency})</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Provident Fund (PF)</span>
                    <span className="font-semibold text-rose-600">
                      {activeSlip.providentFund.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Professional Tax (PT)</span>
                    <span className="font-semibold text-rose-600">
                      {activeSlip.professionalTax.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">ESI / Insurance</span>
                    <span className="font-semibold text-rose-600">
                      {(activeSlip.esi || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Income Tax / TDS</span>
                    <span className="font-semibold text-rose-600">
                      {activeSlip.taxDeduction.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                  <span>Total Deductions:</span>
                  <span className="text-rose-700 font-mono">
                    {tenant?.currency} {activeSlip.totalDeductions.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Take-Home Card */}
            <div className="mx-6 mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Net Salary Take-Home
                </span>
                <div className="text-2xl font-black text-emerald-700 mt-0.5">
                  {tenant?.currency} {activeSlip.netPay.toLocaleString()}
                </div>
              </div>
              <div className="text-right text-[11px] space-y-1">
                {activeSlip.paymentStatus === 'PAID' ? (
                  <>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      Paid &amp; Credited to Bank Account
                    </div>
                    {activeSlip.paymentReference && (
                      <div className="text-slate-500 font-mono text-[10px]">
                        Ref: {activeSlip.paymentReference}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      <Clock className="w-3 h-3 text-amber-700" />
                      Pending Payment Clearance
                    </div>
                    <div className="text-slate-500 text-[10px]">
                      Calculated from attendance roster. Pending finance clearance.
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono text-[10px]">
                Generated by Goodwin Grow HRMS Payroll Engine
              </span>
              <div className="flex items-center gap-2">
                {!isEmployeeOnly && activeSlip.paymentStatus !== 'PAID' && (
                  <button
                    type="button"
                    onClick={() => {
                      setTargetSlipForPayment(activeSlip);
                      setPaymentRefInput(`NEFT-${Date.now().toString().slice(-6)}`);
                      setPaymentRefModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Payment Now</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const emp = employees.find((e) => e.id === activeSlip.employeeId);
                    downloadPayslipPDF(activeSlip, tenant, emp);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Keka PDF Slip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PAYMENT REFERENCE CONFIRMATION MODAL                           */}
      {/* ============================================================== */}
      {paymentRefModalOpen && targetSlipForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Confirm Salary Payment</h3>
              </div>
              <button
                onClick={() => setPaymentRefModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                <div className="font-bold text-sm">
                  {targetSlipForPayment.employeeName} ({targetSlipForPayment.employeeCode})
                </div>
                <div className="text-xs text-emerald-800 font-semibold">
                  Net Payable: {tenant?.currency} {targetSlipForPayment.netPay.toLocaleString()}
                </div>
                <p className="text-[10px] text-emerald-700">
                  Confirming this transaction will mark the payslip as &ldquo;Paid&rdquo; and register the bank transfer reference.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bank Reference / Transaction UTR Number *
                </label>
                <input
                  type="text"
                  required
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  placeholder="e.g. NEFT-98472312 or IMPS-493820"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaymentRefModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={Boolean(confirmingSlipId)}
                  onClick={() => handleConfirmSinglePayment(targetSlipForPayment.id, paymentRefInput)}
                  className="px-5 py-2 font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer disabled:opacity-50"
                >
                  {confirmingSlipId ? 'Processing...' : 'Confirm & Mark Paid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TenantPayrollPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500 font-mono">Loading Payroll &amp; Statutory Engine...</div>}>
      <PayrollContent />
    </Suspense>
  );
}
