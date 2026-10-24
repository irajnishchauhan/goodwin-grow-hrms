'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  Send
} from 'lucide-react';
import { SalarySlip, Tenant } from '@/lib/types';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { downloadPayslipPDF } from '@/lib/pdf/generatePayslipPDF';

export default function TenantPayrollPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { user, isEmployeeOnly } = useCurrentUser(tenantSlug);

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

  // Payslip Modal
  const [activeSlip, setActiveSlip] = useState<SalarySlip | null>(null);

  const fetchPayroll = async () => {
    try {
      const [res, empRes] = await Promise.all([
        fetch(`/api/tenants/${tenantSlug}/payroll?t=${Date.now()}`, {
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
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchPayroll();
    }
  }, [tenantSlug]);

  const handleRunPayroll = async () => {
    setRunningBatch(true);
    setBatchMsg(null);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/payroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: '2026-10' })
      });
      const json = await res.json();
      if (json.success) {
        setBatchMsg(json.message);
        fetchPayroll();
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
          setActiveSlip({ ...activeSlip, paymentStatus: 'PAID' });
        }
        fetchPayroll();
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
          month: '2026-10',
          paymentReference: `BATCH-NEFT-${Date.now().toString().slice(-6)}`
        })
      });
      const json = await res.json();
      if (json.success) {
        setBatchMsg(json.message);
        fetchPayroll();
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

  const visibleSlips = isEmployeeOnly
    ? slips.filter((s) => {
        if (!user) return true;
        if (myEmp && s.employeeId === myEmp.id) return true;
        const firstName = user.name?.toLowerCase().split(' ')[0] || '';
        return s.employeeName.toLowerCase().includes(firstName);
      })
    : slips;

  const totalGross = visibleSlips.reduce((sum, s) => sum + s.grossSalary, 0);
  const totalDeductions = visibleSlips.reduce((sum, s) => sum + s.totalDeductions, 0);
  const totalNet = visibleSlips.reduce((sum, s) => sum + s.netPay, 0);

  const paidSlips = visibleSlips.filter((s) => s.paymentStatus === 'PAID');
  const pendingSlips = visibleSlips.filter((s) => s.paymentStatus !== 'PAID');
  const paidNetTotal = paidSlips.reduce((sum, s) => sum + s.netPay, 0);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            {isEmployeeOnly ? 'My Salary Slips & Compensation' : 'Payroll & Statutory Compensation'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isEmployeeOnly
              ? `Personal monthly payslips and verified payment confirmations for ${user?.name || 'Employee'}`
              : `Salary structure engine, automated attendance proration, and verified disbursement for ${tenant?.name}`}
          </p>
        </div>

        {!isEmployeeOnly && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRunPayroll}
              disabled={runningBatch || confirmingAll}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{runningBatch ? 'Calculating...' : 'Recalculate Batch'}</span>
            </button>

            <button
              onClick={handleConfirmAllPayments}
              disabled={confirmingAll || runningBatch || visibleSlips.length === 0 || pendingSlips.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {confirmingAll
                  ? 'Confirming Payments...'
                  : `Confirm & Disburse All (${pendingSlips.length} Pending)`}
              </span>
            </button>
          </div>
        )}
      </div>

      {batchMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fade-in shadow-xs">
          <span>✓ {batchMsg}</span>
          <button onClick={() => setBatchMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {isEmployeeOnly ? 'My Monthly Gross' : 'Total Monthly Gross'}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {tenant?.currency} {totalGross.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {isEmployeeOnly ? 'Earned gross for logged attendance' : 'Prorated strictly by attendance days logged'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {isEmployeeOnly ? 'My Deductions (PF/Tax)' : 'Statutory Deductions (PF/Tax)'}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {tenant?.currency} {totalDeductions.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">PF (₹0) + ESI (₹0) + TDS (₹0) + PT (₹0)</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {isEmployeeOnly ? 'My Net Take-Home Pay' : 'Disbursement Status'}
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold mt-1 ${paidNetTotal > 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
            {tenant?.currency} {totalNet.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium">
            {pendingSlips.length === 0 && paidSlips.length > 0 ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ✓ All {paidSlips.length} salaries confirmed &amp; disbursed
              </span>
            ) : pendingSlips.length > 0 ? (
              <span className="text-amber-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                {pendingSlips.length} pending confirmation • {paidSlips.length} paid
              </span>
            ) : (
              <span className="text-slate-500">No payroll records</span>
            )}
          </div>
        </div>
      </div>

      {/* Salary Slips Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">
            {isEmployeeOnly ? 'My October 2026 Payslips' : 'October 2026 Salary Slips'}
          </h3>
          <span className="text-xs text-slate-500 font-medium">{visibleSlips.length} Payslip(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 uppercase font-semibold text-[10px] text-slate-500 tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Gross Pay</th>
                <th className="px-6 py-3.5">PF &amp; Tax Deductions</th>
                <th className="px-6 py-3.5">Net Take-Home</th>
                <th className="px-6 py-3.5">Disbursement Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {visibleSlips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 text-xs">
                    {isEmployeeOnly
                      ? 'No personal payslips found on record for your employee account.'
                      : 'No payroll slips generated for this period. Click "Recalculate Batch" above.'}
                  </td>
                </tr>
              ) : (
                visibleSlips.map((slip) => (
                  <tr key={slip.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{slip.employeeName}</td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-700">{slip.employeeCode}</td>
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
                            Pending Confirmation
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
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => {
                            const emp = employees.find((e) => e.id === slip.employeeId);
                            downloadPayslipPDF(slip, tenant, emp);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
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

      {/* Itemized Payslip Modal */}
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
                    className="w-12 h-12 rounded-xl object-contain bg-white p-1 border border-slate-200 shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                    {tenant?.name?.slice(0, 1) || 'G'}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-base text-slate-900">{tenant?.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Payslip for October 2026 • Ref: {activeSlip.id}
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
                <span className="font-mono font-bold text-emerald-700">{activeSlip.payableDays !== undefined ? activeSlip.payableDays : (activeSlip.totalCalendarDays || 31)} Days</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Loss of Pay (LOP)</span>
                <span className="font-mono font-bold text-rose-600">{activeSlip.lopDays !== undefined ? activeSlip.lopDays : 0} Days</span>
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
                      Pending Payment Confirmation
                    </div>
                    <div className="text-slate-500 text-[10px]">
                      Calculated from attendance roster. Pending finance clearance.
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
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
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm cursor-pointer"
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Keka PDF Slip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Reference Confirmation Modal for Admin */}
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
                  Confirming this transaction will mark the payslip as &ldquo;Paid&rdquo; and notify the employee.
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
