'use client';

import React, { useState } from 'react';
import {
  X,
  Building2,
  User,
  Mail,
  ShieldCheck,
  Check,
  Sparkles,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  Layers,
  Calendar,
  DollarSign
} from 'lucide-react';

interface OnboardTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OnboardTenantModal({ isOpen, onClose, onSuccess }: OnboardTenantModalProps) {
  const [activeTab, setActiveTab] = useState<'company' | 'subscription' | 'admin'>('company');

  // Company Information
  const [name, setName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [slug, setSlug] = useState('');
  const [industry, setIndustry] = useState('Manufacturing & Energy Storage');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [state, setState] = useState('Karnataka');
  const [country, setCountry] = useState('India');
  const [postalCode, setPostalCode] = useState('560100');
  const [website, setWebsite] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [currency, setCurrency] = useState('INR');
  const [financialYear, setFinancialYear] = useState('April - March');
  const [primaryColor, setPrimaryColor] = useState('#D97706'); // Amber gold

  // Subscription Details
  const [planId, setPlanId] = useState<'starter' | 'growth' | 'enterprise'>('growth');
  const [maxEmployees, setMaxEmployees] = useState(100);

  // Primary Administrator
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminDesignation, setAdminDesignation] = useState('Managing Director & Company Admin');
  const [adminRole, setAdminRole] = useState<'COMPANY_ADMIN' | 'HR_ADMIN'>('COMPANY_ADMIN');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(generatedSlug);

    const generatedCode = val
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 10)
      .toUpperCase();
    setCompanyCode(generatedCode ? `${generatedCode}` : '');
  };

  const prefillGoodwinBatteries = () => {
    setName('Goodwin Batteries Pvt Ltd');
    setCompanyCode('GOODWIN-BAT');
    setSlug('goodwin-batteries-fleet');
    setIndustry('Lithium Battery & Clean Energy Tech');
    setBusinessEmail('corporate@goodwinbatteries.com');
    setBusinessPhone('+91 80 4123 7788');
    setRegisteredAddress('Plot 42, Electronic City Phase 2, Hosur Road');
    setCity('Bangalore');
    setState('Karnataka');
    setCountry('India');
    setPostalCode('560100');
    setWebsite('https://goodwinbatteries.com');
    setTimezone('Asia/Kolkata');
    setCurrency('INR');
    setFinancialYear('April - March');
    setPrimaryColor('#D97706');

    setPlanId('growth');
    setMaxEmployees(150);

    setAdminName('Rajesh Sharma');
    setAdminEmail('rajesh.sharma@goodwinbatteries.com');
    setAdminPhone('+91 98450 11223');
    setAdminDesignation('Managing Director & Plant Operations');
    setAdminRole('COMPANY_ADMIN');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/super-admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          companyCode,
          industry,
          businessEmail: businessEmail || adminEmail,
          businessPhone,
          registeredAddress,
          city,
          state,
          country,
          postalCode,
          website,
          timezone,
          currency,
          financialYear,
          primaryColor,
          planId,
          maxEmployees: Number(maxEmployees),
          adminName,
          adminEmail,
          adminPhone,
          adminDesignation,
          adminRole
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to onboard client company');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Onboard New Client Workspace</h3>
              <p className="text-xs text-slate-400">Deploy a dedicated, tenant-isolated HRMS environment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prefillGoodwinBatteries}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 hover:bg-emerald-500/30 transition-colors"
              title="Autofill form with Goodwin Batteries specifications"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Autofill Goodwin</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('company')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'company'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>1. Company Info</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subscription')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'subscription'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Subscription & Cap</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'admin'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>3. Primary Admin</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* TAB 1: Company Profile */}
          {activeTab === 'company' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Goodwin Batteries Pvt Ltd"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unique Company Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GOODWIN-BAT"
                    value={companyCode}
                    onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Workspace URL Slug *</label>
                  <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/40">
                    <span className="bg-slate-100 text-slate-500 text-[11px] px-2.5 py-2 border-r border-slate-200">/app/</span>
                    <input
                      type="text"
                      required
                      placeholder="goodwin-batteries"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase())}
                      className="w-full px-2.5 py-2 text-xs focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Industry Sector</label>
                  <input
                    type="text"
                    placeholder="e.g. Battery Manufacturing & Cleantech"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Business Email</label>
                  <input
                    type="email"
                    placeholder="corporate@goodwinbatteries.com"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Business Phone</label>
                  <input
                    type="text"
                    placeholder="+91 80 4123 7788"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Address</label>
                <input
                  type="text"
                  placeholder="Plot 42, Electronic City Phase 2"
                  value={registeredAddress}
                  onChange={(e) => setRegisteredAddress(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Subscription & Configuration */}
          {activeTab === 'subscription' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => {
                    setPlanId('starter');
                    setMaxEmployees(25);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    planId === 'starter'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">Starter Plan</div>
                  <div className="text-lg font-black text-slate-800 mt-1">$99<span className="text-[11px] font-normal text-slate-500">/mo</span></div>
                  <p className="text-[10px] text-slate-500 mt-1">Up to 25 seats &bull; Core HR & Attendance</p>
                </div>

                <div
                  onClick={() => {
                    setPlanId('growth');
                    setMaxEmployees(100);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    planId === 'growth'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs text-emerald-800 flex items-center justify-between">
                    <span>Growth Plan</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-emerald-600 text-white rounded font-bold">POPULAR</span>
                  </div>
                  <div className="text-lg font-black text-slate-800 mt-1">$299<span className="text-[11px] font-normal text-slate-500">/mo</span></div>
                  <p className="text-[10px] text-slate-500 mt-1">Up to 100 seats &bull; Full Suite + Payroll</p>
                </div>

                <div
                  onClick={() => {
                    setPlanId('enterprise');
                    setMaxEmployees(500);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    planId === 'enterprise'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">Enterprise Plan</div>
                  <div className="text-lg font-black text-slate-800 mt-1">$799<span className="text-[11px] font-normal text-slate-500">/mo</span></div>
                  <p className="text-[10px] text-slate-500 mt-1">500+ seats &bull; Dedicated partition & ATS</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Seat Cap (Employees)</label>
                  <input
                    type="number"
                    min={5}
                    max={2000}
                    value={maxEmployees}
                    onChange={(e) => setMaxEmployees(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Financial Year</label>
                  <select
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <option value="April - March">April - March (India Standard)</option>
                    <option value="January - December">January - December (Calendar Year)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                  <option value="America/New_York">America/New_York (EST -05:00)</option>
                  <option value="Europe/London">Europe/London (GMT +00:00)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT +08:00)</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 3: Primary Administrator */}
          {activeTab === 'admin' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Full Name *</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Sharma"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Work Email *</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="rajesh.sharma@goodwinbatteries.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile / Direct Contact</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="+91 98450 11223"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation Title</label>
                  <input
                    type="text"
                    value={adminDesignation}
                    onChange={(e) => setAdminDesignation(e.target.value)}
                    placeholder="Managing Director & Plant Operations"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Administrator Role</label>
                <select
                  value={adminRole}
                  onChange={(e) => setAdminRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="COMPANY_ADMIN">Company Owner / Primary Administrator</option>
                  <option value="HR_ADMIN">HR Director & Workforce Administrator</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center gap-2.5 text-xs text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  The administrator will be provisioned with full workspace control, initial onboarding checklist, and an activation token.
                </span>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 shrink-0">
            <div className="flex items-center gap-2">
              {activeTab !== 'company' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'admin') setActiveTab('subscription');
                    else if (activeTab === 'subscription') setActiveTab('company');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                >
                  Back
                </button>
              )}
              {activeTab !== 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'company') setActiveTab('subscription');
                    else if (activeTab === 'subscription') setActiveTab('admin');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-300"
                >
                  Next Step &rarr;
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name || !slug || !adminEmail || !adminName}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-700/20 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loading ? 'Provisioning Workspace...' : 'Create Client Workspace'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
