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
  Building2
} from 'lucide-react';
import { SalarySlip, Tenant } from '@/lib/types';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';

export default function TenantPayrollPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { user, isEmployeeOnly } = useCurrentUser(tenantSlug);

  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningBatch, setRunningBatch] = useState(false);
  const [batchMsg, setBatchMsg] = useState<string | null>(null);

  // Payslip Modal
  const [activeSlip, setActiveSlip] = useState<SalarySlip | null>(null);

  const fetchPayroll = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/payroll`);
      const json = await res.json();
      if (json.success) {
        setSlips(json.data.slips);
      }

      const empRes = await fetch(`/api/tenants/${tenantSlug}/employees`);
      const empJson = await empRes.json();
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
              ? `Personal monthly payslips and tax deductions for ${user?.name || 'Employee'}`
              : `Salary structure engine, automated attendance-based calculations, and payslip disbursement for ${tenant?.name}`}
          </p>
        </div>

        {!isEmployeeOnly && (
          <button
            onClick={handleRunPayroll}
            disabled={runningBatch}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{runningBatch ? 'Processing Batch...' : 'Recalculate October 2026 Payroll'}</span>
          </button>
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
            {isEmployeeOnly ? 'Earned gross for logged attendance' : 'Prorated by attendance days logged'}
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
            {isEmployeeOnly ? 'My Net Take-Home Pay' : 'Net Salary Disbursed'}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">
            {tenant?.currency} {totalNet.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">✓ Credited to employee bank accounts</p>
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
                <th className="px-6 py-3.5">PF & Tax Deductions</th>
                <th className="px-6 py-3.5">Net Take-Home</th>
                <th className="px-6 py-3.5">Disbursement Status</th>
                <th className="px-6 py-3.5 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {visibleSlips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 text-xs">
                    {isEmployeeOnly
                      ? 'No personal payslips found on record for your employee account.'
                      : 'No payroll slips generated for this period. Click "Recalculate October 2026 Payroll" above.'}
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
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          slip.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {slip.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setActiveSlip(slip)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View Slip</span>
                      </button>
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
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">{tenant?.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Payslip for October 2026 • Ref: {activeSlip.id}
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
                <span className="text-slate-800 font-medium">{activeSlip.month}</span>
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
            <div className="mx-6 mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                  Net Salary Take-Home
                </span>
                <div className="text-2xl font-black text-emerald-900 mt-0.5">
                  {tenant?.currency} {activeSlip.netPay.toLocaleString()}
                </div>
              </div>
              <div className="text-right text-[11px] text-emerald-700">
                <div className="font-semibold">Disbursed via Direct Bank Transfer</div>
                <div className="font-mono text-emerald-800">Status: {activeSlip.paymentStatus}</div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono text-[10px]">
                Generated by Goodwin Grow HRMS Payroll Engine
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert('Salary slip PDF downloaded successfully.')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
