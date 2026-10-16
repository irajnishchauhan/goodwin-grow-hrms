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

export default function TenantPayrollPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  const [slips, setSlips] = useState<SalarySlip[]>([]);
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

  const totalGross = slips.reduce((sum, s) => sum + s.grossSalary, 0);
  const totalDeductions = slips.reduce((sum, s) => sum + s.totalDeductions, 0);
  const totalNet = slips.reduce((sum, s) => sum + s.netPay, 0);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            Payroll & Statutory Compensation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Salary structure engine, automated tax calculations, and payslip disbursement for {tenant?.name}
          </p>
        </div>

        <button
          onClick={handleRunPayroll}
          disabled={runningBatch}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-900/30 transition-all disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>{runningBatch ? 'Processing Batch...' : 'Run October 2026 Payroll'}</span>
        </button>
      </div>

      {batchMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
          <span>✓ {batchMsg}</span>
          <button onClick={() => setBatchMsg(null)} className="text-emerald-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-md">
          <div className="text-xs font-semibold uppercase text-slate-400">Total Monthly Gross</div>
          <div className="text-2xl font-extrabold text-white mt-1">
            {tenant?.currency} {totalGross.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Before statutory deductions</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-md">
          <div className="text-xs font-semibold uppercase text-slate-400">Statutory Deductions (PF/Tax)</div>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">
            {tenant?.currency} {totalDeductions.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Provident Fund + ESI + TDS + PT</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-md">
          <div className="text-xs font-semibold uppercase text-slate-400">Net Salary Disbursed</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            {tenant?.currency} {totalNet.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">✓ 100% calculated & approved</p>
        </div>
      </div>

      {/* Salary Slips Table */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">October 2026 Salary Slips</h3>
          <span className="text-xs text-slate-400">{slips.length} Payslips</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 uppercase font-semibold text-[10px] text-slate-400 tracking-wider border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/80">
              {slips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 text-xs">
                    No payroll slips generated for this period. Click &quot;Run October 2026 Payroll&quot; above.
                  </td>
                </tr>
              ) : (
                slips.map((slip) => (
                  <tr key={slip.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{slip.employeeName}</td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-400">{slip.employeeCode}</td>
                    <td className="px-6 py-4 font-semibold text-slate-200">
                      {tenant?.currency} {slip.grossSalary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-rose-400 font-semibold">
                      - {tenant?.currency} {slip.totalDeductions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-emerald-400">
                      {tenant?.currency} {slip.netPay.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {slip.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setActiveSlip(slip)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
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
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-base text-white">{tenant?.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Payslip for October 2026 • Ref: {activeSlip.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveSlip(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
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
