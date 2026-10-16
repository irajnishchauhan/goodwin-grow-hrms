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
  Plus
} from 'lucide-react';
import { Tenant, OnboardingStep } from '@/lib/types';

export default function CompanySetupWizardPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [checklist, setChecklist] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);

  // Step 1: Profile form state
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [timezone, setTimezone] = useState('');

  // Step 2: Departments state
  const [departments, setDepartments] = useState<string[]>([
    'Production & Cell Assembly',
    'Quality Control & Testing',
    'Research & BMS Engineering',
    'Warehouse & Logistics',
    'Human Resources',
    'Executive & Operations'
  ]);
  const [newDeptInput, setNewDeptInput] = useState('');

  const fetchTenant = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/employees`);
      const json = await res.json();
      if (json.success && json.data.tenant) {
        const t: Tenant = json.data.tenant;
        setTenant(t);
        setCompanyName(t.name);
        setIndustry(t.industry || 'Manufacturing');
        setTimezone(t.timezone || 'Asia/Kolkata');
        setChecklist(t.onboardingChecklist || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) fetchTenant();
  }, [tenantSlug]);

  const completedCount = checklist.filter((s) => s.completed).length;
  const progressPercent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  const handleToggleStep = (index: number) => {
    const updated = [...checklist];
    updated[index].completed = !updated[index].completed;
    setChecklist(updated);
  };

  const handleNextStep = () => {
    if (activeStepIndex < checklist.length - 1) {
      // Mark current completed
      const updated = [...checklist];
      updated[activeStepIndex].completed = true;
      setChecklist(updated);
      setActiveStepIndex(activeStepIndex + 1);
    }
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDeptInput.trim()) {
      setDepartments([...departments, newDeptInput.trim()]);
      setNewDeptInput('');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link href={`/app/${tenantSlug}`} className="hover:text-emerald-400">
              {tenant?.name || 'Company'}
            </Link>
            <span>/</span>
            <span className="text-amber-400">Guided Setup Wizard</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-amber-400" />
            Company Setup & Configuration Wizard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Guided 8-step enterprise onboarding for {tenant?.name || 'this company'} ({tenant?.companyCode})
          </p>
        </div>

        <Link
          href={`/app/${tenantSlug}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
        >
          <span>Exit to Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
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
          <span className="font-extrabold text-emerald-400 text-base">{progressPercent}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500 rounded-full"
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
                  ? 'bg-amber-500/10 border-amber-500/60 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
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
        {/* Step 1: Company Profile */}
        {activeStepIndex === 0 && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                Step 1: Company Profile & Operating Calendar
              </h2>
              <p className="text-slate-400 mt-0.5">
                Configure legal registered details, factory locations, timezone, and accounting year.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Company Legal Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Industry Sector</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Timezone</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Financial Year</label>
                <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  {tenant?.financialYear || 'April - March'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Departments */}
        {activeStepIndex === 1 && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                Step 2: Department Setup
              </h2>
              <p className="text-slate-400 mt-0.5">
                Organize your company into functional divisions (Production, QC, Sales, Warehouse, HR).
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {departments.map((dept, i) => (
                <div
                  key={i}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-2 font-medium"
                >
                  <span>{dept}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddDept} className="flex gap-2 max-w-md pt-2">
              <input
                type="text"
                placeholder="Add custom department..."
                value={newDeptInput}
                onChange={(e) => setNewDeptInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Designations */}
        {activeStepIndex === 2 && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                Step 3: Designations & Hierarchy
              </h2>
              <p className="text-slate-400 mt-0.5">
                View or customize managerial reporting hierarchy and job bands.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-sm">Visual Organization Hierarchy Configured</div>
                <p className="text-slate-400 mt-0.5">
                  Hierarchy tree has been generated from Managing Director &rarr; Managers &rarr; Technicians.
                </p>
              </div>
              <Link
                href={`/app/${tenantSlug}/org-chart`}
                className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold"
              >
                Inspect Org Tree &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Step 4: Attendance Policies */}
        {activeStepIndex === 3 && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Step 4: Shift & Attendance Policies
              </h2>
              <p className="text-slate-400 mt-0.5">
                Define factory shifts, biometric clock-in grace minutes, and weekly offs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="font-bold text-white">General Day Shift</div>
                <div className="text-emerald-400 font-mono mt-1">09:00 AM - 06:00 PM</div>
                <div className="text-slate-400 text-[10px] mt-0.5">15 mins grace period</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="font-bold text-white">Morning Assembly (A)</div>
                <div className="text-amber-400 font-mono mt-1">06:00 AM - 02:30 PM</div>
                <div className="text-slate-400 text-[10px] mt-0.5">10 mins grace period</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="font-bold text-white">Evening Assembly (B)</div>
                <div className="text-indigo-400 font-mono mt-1">02:30 PM - 11:00 PM</div>
                <div className="text-slate-400 text-[10px] mt-0.5">10 mins grace period</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Leave Policies */}
        {activeStepIndex === 4 && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                Step 5: Leave Policies & Holiday Calendar
              </h2>
              <p className="text-slate-400 mt-0.5">
                Casual Leave (12d), Sick Leave (10d), and Factory Earned Leave (18d).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="font-bold text-white">Ayudha Puja & Diwali Holidays Configured</div>
              <p className="text-slate-400 mt-1">
                Regional calendar for Karnataka, India is loaded and active for factory employees.
              </p>
            </div>
          </div>
        )}

        {/* Step 6: Payroll Configuration */}
        {activeStepIndex === 5 && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                Step 6: Payroll Wage Structure
              </h2>
              <p className="text-slate-400 mt-0.5">
                Basic Pay (50%), HRA (25%), Special Allowance (25%), Employee PF (12%).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Statutory Compliance Notice</span>
              </div>
              <p className="text-[11px] text-amber-300">
                Statutory deductions (PF, ESI, Professional Tax) are calculated in accordance with regional Indian labor laws. Professional audit recommended before live bank disbursement.
              </p>
            </div>
          </div>
        )}

        {/* Step 7: Employee Data Import */}
        {activeStepIndex === 6 && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" />
                Step 7: Employee Data Import
              </h2>
              <p className="text-slate-400 mt-0.5">
                Add workforce members individually or upload bulk spreadsheets.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-sm">Bulk Employee Import Ready</div>
                <p className="text-slate-400 mt-0.5">
                  CSV spreadsheet template with duplicate detection and error validation.
                </p>
              </div>
              <Link
                href={`/app/${tenantSlug}/employees`}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Go to Employee Directory &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Step 8: Invite Employees */}
        {activeStepIndex === 7 && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-400" />
                Step 8: Invite Employees to Activate Logins
              </h2>
              <p className="text-slate-400 mt-0.5">
                Send single-use secure activation links so employees can set passwords and log in.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-sm">Invitation Management Console</div>
                <p className="text-slate-400 mt-0.5">
                  Track pending, accepted, and expired invitations across departments.
                </p>
              </div>
              <Link
                href={`/app/${tenantSlug}/invitations`}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold"
              >
                Open Invitations Tracker &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => handleToggleStep(activeStepIndex)}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white"
          >
            {checklist[activeStepIndex]?.completed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Marked as Completed</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4 text-slate-500" />
                <span>Mark Complete</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-3">
            {activeStepIndex > 0 && (
              <button
                onClick={() => setActiveStepIndex(activeStepIndex - 1)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Previous
              </button>
            )}

            {activeStepIndex < checklist.length - 1 ? (
              <button
                onClick={handleNextStep}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 flex items-center gap-1.5"
              >
                <span>Save & Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                href={`/app/${tenantSlug}`}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 flex items-center gap-1.5"
              >
                <span>Complete Setup & Launch</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
