'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Settings,
  Building2,
  Palette,
  CreditCard,
  Key,
  Save,
  CheckCircle2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import { Tenant } from '@/lib/types';
import RoleGuard from '@/components/RoleGuard';

const BRAND_COLORS = [
  { name: 'Emerald Green', value: '#059669', bgClass: 'bg-emerald-600' },
  { name: 'Amber Gold', value: '#D97706', bgClass: 'bg-amber-600' },
  { name: 'Royal Indigo', value: '#4F46E5', bgClass: 'bg-indigo-600' },
  { name: 'Corporate Blue', value: '#2563EB', bgClass: 'bg-blue-600' },
  { name: 'Deep Violet', value: '#7C3AED', bgClass: 'bg-purple-600' },
  { name: 'Crimson Rose', value: '#E11D48', bgClass: 'bg-rose-600' },
  { name: 'Slate Executive', value: '#334155', bgClass: 'bg-slate-700' }
];

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'INR - Indian Rupee (₹)' },
  { code: 'USD', symbol: '$', label: 'USD - US Dollar ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR - Euro (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP - British Pound (£)' },
  { code: 'AED', symbol: 'د.إ', label: 'AED - UAE Dirham (د.إ)' },
  { code: 'SGD', symbol: 'S$', label: 'SGD - Singapore Dollar (S$)' },
  { code: 'CAD', symbol: '$', label: 'CAD - Canadian Dollar ($)' },
  { code: 'AUD', symbol: '$', label: 'AUD - Australian Dollar ($)' }
];

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30) - New Delhi, Mumbai' },
  { value: 'America/New_York', label: 'America/New_York (EST -5:00) - Eastern Time' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST -8:00) - Pacific Time' },
  { value: 'Europe/London', label: 'Europe/London (GMT +0:00) - London' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET +1:00) - Paris, Berlin' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST +4:00) - Dubai, Abu Dhabi' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT +8:00) - Singapore' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST +9:00) - Tokyo' }
];

const FISCAL_YEARS = [
  'April - March',
  'January - December',
  'July - June',
  'October - September'
];

export default function TenantSettingsPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [country, setCountry] = useState('India');
  const [postalCode, setPostalCode] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [financialYear, setFinancialYear] = useState('April - March');
  const [primaryColor, setPrimaryColor] = useState('#059669');

  const [savedMsg, setSavedMsg] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/tenants/${tenantSlug}`);
        const json = await res.json();
        if (json.success && json.data?.tenant) {
          const t: Tenant = json.data.tenant;
          setTenant(t);
          setName(t.name || '');
          setCompanyCode(t.companyCode || '');
          setIndustry(t.industry || '');
          setWebsite(t.website || '');
          setBusinessEmail(t.businessEmail || '');
          setBusinessPhone(t.businessPhone || '');
          setRegisteredAddress(t.registeredAddress || '');
          setCity(t.city || '');
          setStateVal(t.state || '');
          setCountry(t.country || 'India');
          setPostalCode(t.postalCode || '');
          setCurrency(t.currency || 'INR');
          setTimezone(t.timezone || 'Asia/Kolkata');
          setFinancialYear(t.financialYear || 'April - March');
          setPrimaryColor(t.primaryColor || '#059669');
        }
      } catch (e) {
        console.error('Failed to load tenant settings:', e);
      } finally {
        setLoading(false);
      }
    };
    if (tenantSlug) fetchTenant();
  }, [tenantSlug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name,
        companyCode,
        industry,
        website,
        businessEmail,
        businessPhone,
        registeredAddress,
        city,
        state: stateVal,
        country,
        postalCode,
        currency,
        timezone,
        financialYear,
        primaryColor
      };

      const res = await fetch(`/api/tenants/${tenantSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success && json.data?.tenant) {
        setTenant(json.data.tenant);
        setSavedMsg(true);
        router.refresh();
        setTimeout(() => setSavedMsg(false), 4000);
      } else {
        alert(json.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save workspace settings:', err);
      alert('Error updating workspace settings');
    } finally {
      setSaving(false);
    }
  };

  const copyTenantId = () => {
    if (tenant?.id) {
      navigator.clipboard.writeText(tenant.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <RoleGuard
      tenantSlug={tenantSlug}
      requiredRoles={['COMPANY_ADMIN', 'SUPER_ADMIN']}
      moduleName="Company Settings & Branding"
    >
      <div className="space-y-6 max-w-5xl pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <Settings className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Enterprise Workspace & Branding Settings
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 pl-10">
              Manage company profile, white-label visual identity, regional currency defaults, and security keys.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-700/20 transition-all disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {savedMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-semibold">Settings Successfully Persisted!</span> Workspace settings, regional preferences, and brand themes have been saved and synced with cloud database.
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Loading workspace settings...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. Company Profile & Legal Identity */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Company Identity & Registration</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Company Registered Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                    placeholder="e.g. Goodwin Batteries Pvt Ltd"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Company Code / Acronym <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyCode}
                    onChange={(e) => setCompanyCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 uppercase font-mono"
                    placeholder="e.g. GOODWIN-BAT-FLT"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Industry Sector</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    placeholder="e.g. Electrical Equipment & Electronics Manufacturing"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Corporate Website</label>
                  <div className="relative">
                    <Globe className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      placeholder="https://goodwinbatteries.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Regional & Financial Preferences */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Regional, Currency & Fiscal Settings</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Operating Currency <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">Used for all payroll, salary slips and financial computations.</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Workspace Timezone <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">Controls attendance punch clocks and shift cutoff schedules.</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Financial Year Cycle <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                  >
                    {FISCAL_YEARS.map((fy) => (
                      <option key={fy} value={fy}>
                        {fy}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">Defines annual leave reset and tax assessment period.</p>
                </div>
              </div>
            </div>

            {/* 3. Registered Office & Contact Details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Corporate Office & Communications</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Official Business Email</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      placeholder="info@goodwinbatteries.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Helpline / Support Phone</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="tel"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      placeholder="+91 9667724411"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1.5">Registered Office Address</label>
                  <input
                    type="text"
                    value={registeredAddress}
                    onChange={(e) => setRegisteredAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    placeholder="e.g. Second Floor, Shop No. 202, Samiksh Landmark, Tejpur Gadbadi, AB Road"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:col-span-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      placeholder="Indore"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">State / Province</label>
                    <input
                      type="text"
                      value={stateVal}
                      onChange={(e) => setStateVal(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      placeholder="Madhya Pradesh"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono"
                      placeholder="452012"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      placeholder="India"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. White-Label Branding & Primary Accent */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Palette className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">White-Label Brand Identity & Theme</h2>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-2">Primary Accent Color Theme</label>
                  <div className="flex flex-wrap items-center gap-3">
                    {BRAND_COLORS.map((col) => (
                      <button
                        type="button"
                        key={col.value}
                        onClick={() => setPrimaryColor(col.value)}
                        className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                          primaryColor.toLowerCase() === col.value.toLowerCase()
                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shadow-inner border border-black/10 shrink-0"
                          style={{ backgroundColor: col.value }}
                        />
                        <span>{col.name}</span>
                        {primaryColor.toLowerCase() === col.value.toLowerCase() && (
                          <Check className="w-3 h-3 text-emerald-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm text-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {name ? name.substring(0, 2).toUpperCase() : 'GW'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{name || 'Your Company'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Brand Accent: {primaryColor}
                      </div>
                    </div>
                  </div>
                  <div
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Active Accent
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Subscription & Capacity */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Subscription & Enterprise Capacity</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Plan Tier</span>
                  <div className="text-base font-extrabold text-slate-900 mt-1 capitalize">
                    {tenant?.planId || 'Enterprise'} Edition
                  </div>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Active Multi-Tenant License
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Seats Capacity</span>
                  <div className="text-base font-extrabold text-slate-900 mt-1">
                    {tenant?.maxEmployees || 500} Total Seats
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">Unlimited department trees & employee directories</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Portal Domain</span>
                  <div className="text-xs font-mono font-semibold text-slate-800 mt-1.5 truncate">
                    {tenant?.domain || `${tenantSlug}.goodwingrow.ai`}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">SSL encrypted custom tenant subdomain</p>
                </div>
              </div>
            </div>

            {/* 6. Tenant Security & API Integration */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Key className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Tenant Security & API Headers</h2>
              </div>

              <div className="space-y-2 text-xs">
                <label className="block text-slate-600 font-medium">Tenant Workspace Identifier (X-TENANT-ID)</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800 text-xs font-semibold select-all">
                    {tenant?.id || 'tenant-id'}
                  </div>
                  <button
                    type="button"
                    onClick={copyTenantId}
                    className="flex items-center gap-1.5 px-3.5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
                  >
                    {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedId ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Required in all external API webhooks and automated biometric machine sync headers.
                </p>
              </div>
            </div>

            {/* Bottom Save Action */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={saving || loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02] active:scale-100 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Persisting to Cloud Database...' : 'Save Workspace Settings'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </RoleGuard>
  );
}
