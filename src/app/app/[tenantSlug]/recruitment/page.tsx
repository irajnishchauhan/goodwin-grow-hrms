'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  Briefcase,
  Users,
  Plus,
  Star,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  Building2,
  DollarSign,
  MapPin,
  Clock,
  ChevronRight,
  Search,
  Filter,
  Trash2,
  Edit3,
  RefreshCw,
  UserCheck,
  UserPlus,
  AlertTriangle,
  Award,
  FileText,
  Phone,
  Mail,
  Check,
  Ban,
  Layers,
  Sparkles
} from 'lucide-react';
import { JobOpening, JobApplicant, CandidateStage, Tenant } from '@/lib/types';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import RoleGuard from '@/components/RoleGuard';

const STAGES: { id: CandidateStage; label: string; badgeColor: string; headerBg: string }[] = [
  { id: 'APPLIED', label: 'Applied', badgeColor: 'bg-slate-100 text-slate-700 border-slate-200', headerBg: 'border-slate-300 bg-slate-50' },
  { id: 'SCREENING', label: 'Screening', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200', headerBg: 'border-blue-200 bg-blue-50/50' },
  { id: 'TECHNICAL_INTERVIEW', label: 'Tech Interview', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200', headerBg: 'border-indigo-200 bg-indigo-50/50' },
  { id: 'HR_ROUND', label: 'HR Round', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200', headerBg: 'border-amber-200 bg-amber-50/50' },
  { id: 'OFFERED', label: 'Offer Extended', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200', headerBg: 'border-purple-200 bg-purple-50/50' },
  { id: 'HIRED', label: 'Hired & Ready', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', headerBg: 'border-emerald-200 bg-emerald-50/50' }
];

export default function TenantRecruitmentPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { user, isSuperAdmin, isCompanyAdmin } = useCurrentUser(tenantSlug);

  // Super Admin CRUD Privilege Check
  const canManageATS = isSuperAdmin || isCompanyAdmin;

  const [activeTab, setActiveTab] = useState<'KANBAN' | 'OPENINGS' | 'DIRECTORY'>('KANBAN');
  const [openings, setOpenings] = useState<JobOpening[]>([]);
  const [applicants, setApplicants] = useState<JobApplicant[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpeningFilter, setSelectedOpeningFilter] = useState('ALL');
  const [selectedStageFilter, setSelectedStageFilter] = useState('ALL');

  // Modals
  const [createOpeningModalOpen, setCreateOpeningModalOpen] = useState(false);
  const [editOpeningModal, setEditOpeningModal] = useState<JobOpening | null>(null);
  const [createApplicantModalOpen, setCreateApplicantModalOpen] = useState(false);
  const [editApplicantModal, setEditApplicantModal] = useState<JobApplicant | null>(null);
  const [onboardModal, setOnboardModal] = useState<JobApplicant | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'OPENING' | 'APPLICANT'; id: string; name: string } | null>(null);

  // Opening Form State
  const [openingTitle, setOpeningTitle] = useState('');
  const [openingDept, setOpeningDept] = useState('Engineering & Technology');
  const [openingExp, setOpeningExp] = useState('3-6 Years');
  const [openingCount, setOpeningCount] = useState(2);
  const [openingLocation, setOpeningLocation] = useState('Indore, India');
  const [openingSalary, setOpeningSalary] = useState('₹18,00,000 - ₹26,00,000');
  const [openingStatus, setOpeningStatus] = useState<'OPEN' | 'ON_HOLD' | 'CLOSED'>('OPEN');
  const [openingDesc, setOpeningDesc] = useState('');

  // Applicant Form State
  const [appJobId, setAppJobId] = useState('');
  const [appFullName, setAppFullName] = useState('');
  const [appEmail, setAppEmail] = useState('');
  const [appPhone, setAppPhone] = useState('');
  const [appExpYears, setAppExpYears] = useState(4);
  const [appCompany, setAppCompany] = useState('');
  const [appSalary, setAppSalary] = useState('₹15,00,000');
  const [appStage, setAppStage] = useState<CandidateStage>('APPLIED');
  const [appRating, setAppRating] = useState(5);
  const [appNotes, setAppNotes] = useState('');

  // Onboard Form State
  const [onboardSalary, setOnboardSalary] = useState(35000);

  // Submitting States
  const [submitting, setSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchRecruitment = async () => {
    try {
      const [res, empRes] = await Promise.all([
        fetch(`/api/tenants/${tenantSlug}/recruitment?t=${Date.now()}`),
        fetch(`/api/tenants/${tenantSlug}/employees?t=${Date.now()}`)
      ]);

      const [json, empJson] = await Promise.all([
        res.json().catch(() => ({})),
        empRes.json().catch(() => ({}))
      ]);

      if (json.success) {
        setOpenings(json.data.openings || []);
        setApplicants(json.data.applicants || []);
        if (json.data.openings?.length > 0 && !appJobId) {
          setAppJobId(json.data.openings[0].id);
        }
      }

      if (empJson.success) {
        setTenant(empJson.data.tenant);
      }
    } catch (e) {
      console.error('Error fetching recruitment data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchRecruitment();
    }
  }, [tenantSlug]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecruitment();
  };

  // Helper alert
  const showAlert = (text: string, type: 'success' | 'error' = 'success') => {
    setAlertMessage({ text, type });
    setTimeout(() => setAlertMessage(null), 4000);
  };

  // 1. Advance Candidate Stage
  const handleMoveStage = async (applicantId: string, newStage: CandidateStage) => {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/recruitment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId, newStage })
      });
      const json = await res.json();
      if (json.success) {
        showAlert(`Candidate moved to ${newStage.replace('_', ' ')}!`);
        fetchRecruitment();
      } else {
        showAlert(json.error || 'Failed to update candidate stage', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Publish New Opening
  const handleCreateOpening = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openingTitle.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/recruitment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'OPENING',
          title: openingTitle.trim(),
          departmentName: openingDept.trim(),
          experienceLevel: openingExp.trim(),
          openingsCount: Number(openingCount) || 1,
          location: openingLocation.trim(),
          salaryRange: openingSalary.trim(),
          status: openingStatus,
          description: openingDesc.trim() || 'Job requisition'
        })
      });
      const json = await res.json();
      if (json.success) {
        setCreateOpeningModalOpen(false);
        setOpeningTitle('');
        setOpeningDesc('');
        showAlert('New job requisition published successfully!');
        fetchRecruitment();
      } else {
        showAlert(json.error || 'Failed to publish opening', 'error');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Edit Job Opening
  const openEditOpeningModal = (job: JobOpening) => {
    setEditOpeningModal(job);
    setOpeningTitle(job.title);
    setOpeningDept(job.departmentName);
    setOpeningExp(job.experienceLevel);
    setOpeningCount(job.openingsCount);
    setOpeningLocation(job.location);
    setOpeningSalary(job.salaryRange);
    setOpeningStatus(job.status);
    setOpeningDesc(job.description || '');
  };

  const handleUpdateOpening = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOpeningModal) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/recruitment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'OPENING',
          openingId: editOpeningModal.id,
          title: openingTitle.trim(),
          departmentName: openingDept.trim(),
          experienceLevel: openingExp.trim(),
          openingsCount: Number(openingCount),
          location: openingLocation.trim(),
          salaryRange: openingSalary.trim(),
          status: openingStatus,
          description: openingDesc.trim()
        })
      });
      const json = await res.json();
      if (json.success) {
        setEditOpeningModal(null);
        showAlert('Job requisition updated successfully!');
        fetchRecruitment();
      } else {
        showAlert(json.error || 'Failed to update opening', 'error');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Create Candidate / Applicant
  const handleCreateApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appFullName.trim() || !appEmail.trim()) return;

    const selectedJob = openings.find((o) => o.id === appJobId);

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/recruitment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'APPLICANT',
          jobOpeningId: appJobId,
          jobTitle: selectedJob?.title || 'General Candidate',
          fullName: appFullName.trim(),
          email: appEmail.trim(),
          phone: appPhone.trim(),
          experienceYears: Number(appExpYears) || 0,
          currentCompany: appCompany.trim() || 'Independent',
          expectedSalary: appSalary.trim() || 'Competitive',
          stage: appStage,
          rating: appRating,
          notes: appNotes.trim()
        })
      });
      const json = await res.json();
      if (json.success) {
        setCreateApplicantModalOpen(false);
        setAppFullName('');
        setAppEmail('');
        setAppPhone('');
        setAppCompany('');
        setAppNotes('');
        showAlert('Candidate added to pipeline!');
        fetchRecruitment();
      } else {
        showAlert(json.error || 'Failed to add applicant', 'error');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Edit Candidate
  const openEditApplicantModal = (app: JobApplicant) => {
    setEditApplicantModal(app);
    setAppFullName(app.fullName);
    setAppEmail(app.email);
    setAppPhone(app.phone);
    setAppCompany(app.currentCompany || '');
    setAppExpYears(app.experienceYears);
    setAppSalary(app.expectedSalary);
    setAppStage(app.stage);
    setAppRating(app.rating || 5);
    setAppNotes(app.notes || '');
  };

  const handleUpdateApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editApplicantModal) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/recruitment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: editApplicantModal.id,
          fullName: appFullName.trim(),
          email: appEmail.trim(),
          phone: appPhone.trim(),
          currentCompany: appCompany.trim(),
          experienceYears: Number(appExpYears),
          expectedSalary: appSalary.trim(),
          stage: appStage,
          rating: Number(appRating),
          notes: appNotes.trim()
        })
      });
      const json = await res.json();
      if (json.success) {
        setEditApplicantModal(null);
        showAlert('Candidate details updated successfully!');
        fetchRecruitment();
      } else {
        showAlert(json.error || 'Failed to update applicant', 'error');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // 6. 1-Click Onboard Candidate as Employee (Keka Feature)
  const handleOnboardCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardModal) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/recruitment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'HIRE',
          applicantId: onboardModal.id,
          monthlySalary: Number(onboardSalary) || 35000
        })
      });
      const json = await res.json();
      if (json.success) {
        setOnboardModal(null);
        showAlert(json.message || 'Candidate hired and onboarded successfully into employee roster!');
        fetchRecruitment();
      } else {
        showAlert(json.error || 'Failed to onboard candidate', 'error');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // 7. Delete Item (Opening or Candidate)
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    setSubmitting(true);
    try {
      const param = deleteConfirm.type === 'OPENING' ? `openingId=${deleteConfirm.id}` : `applicantId=${deleteConfirm.id}`;
      const res = await fetch(`/api/tenants/${tenantSlug}/recruitment?${param}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setDeleteConfirm(null);
        showAlert(json.message || 'Item deleted successfully.');
        fetchRecruitment();
      } else {
        showAlert(json.error || 'Failed to delete item', 'error');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      if (selectedOpeningFilter !== 'ALL' && app.jobOpeningId !== selectedOpeningFilter) {
        return false;
      }
      if (selectedStageFilter !== 'ALL' && app.stage !== selectedStageFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = app.fullName.toLowerCase().includes(q);
        const matchesJob = app.jobTitle.toLowerCase().includes(q);
        const matchesEmail = app.email.toLowerCase().includes(q);
        const matchesCompany = (app.currentCompany || '').toLowerCase().includes(q);
        if (!matchesName && !matchesJob && !matchesEmail && !matchesCompany) return false;
      }
      return true;
    });
  }, [applicants, selectedOpeningFilter, selectedStageFilter, searchQuery]);

  return (
    <RoleGuard
      tenantSlug={tenantSlug}
      requiredRoles={['COMPANY_ADMIN', 'HR_ADMIN', 'SUPER_ADMIN']}
      moduleName="Recruitment & ATS"
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-emerald-600" />
                Recruitment & ATS Workspace
              </h1>
              {canManageATS && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Super Admin CRUD
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              End-to-end requisition planning, multi-stage candidate scoring, and 1-click employee onboarding for {tenant?.name || 'Goodwin Batteries'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-xs cursor-pointer"
              title="Refresh Pipeline"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            {canManageATS && (
              <>
                <button
                  onClick={() => setCreateApplicantModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  <span>Add Candidate</span>
                </button>

                <button
                  onClick={() => setCreateOpeningModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish Job Requisition</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Alert Banner */}
        {alertMessage && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between shadow-xs animate-fade-in ${
              alertMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <span>✓ {alertMessage.text}</span>
            <button onClick={() => setAlertMessage(null)} className="text-slate-500 hover:text-slate-800 font-bold">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Summary KPI Cards (Keka-style ATS metrics) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Job Openings</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {openings.filter((o) => o.status === 'OPEN').length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{openings.length} Total requisitions</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Candidates</div>
            <div className="text-2xl font-black text-blue-600 mt-1">{applicants.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across all talent stages</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Interviews in Progress</div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {applicants.filter((a) => a.stage === 'TECHNICAL_INTERVIEW' || a.stage === 'HR_ROUND').length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Screened & Evaluating</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Offers & Hired</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {applicants.filter((a) => a.stage === 'OFFERED' || a.stage === 'HIRED').length}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Ready for onboarding</div>
          </div>
        </div>

        {/* Tab Navigation & Search Filters */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* View Tabs */}
            <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200 w-full md:w-auto">
              <button
                onClick={() => setActiveTab('KANBAN')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'KANBAN' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Candidate Kanban ({applicants.length})
              </button>
              <button
                onClick={() => setActiveTab('OPENINGS')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'OPENINGS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Job Requisitions ({openings.length})
              </button>
              <button
                onClick={() => setActiveTab('DIRECTORY')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'DIRECTORY' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Candidate Directory (Table)
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidates or openings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Secondary Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Filter Requisition:</span>
            <select
              value={selectedOpeningFilter}
              onChange={(e) => setSelectedOpeningFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="ALL">All Requisitions ({openings.length})</option>
              {openings.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title} ({o.departmentName})
                </option>
              ))}
            </select>

            {activeTab === 'DIRECTORY' && (
              <>
                <span className="text-slate-500 font-medium ml-2">Stage:</span>
                <select
                  value={selectedStageFilter}
                  onChange={(e) => setSelectedStageFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  <option value="ALL">All Stages</option>
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        {/* TAB 1: INTERACTIVE KANBAN PIPELINE */}
        {activeTab === 'KANBAN' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
              {STAGES.map((stageCol, colIdx) => {
                const stageCandidates = filteredApplicants.filter((a) => a.stage === stageCol.id);
                return (
                  <div
                    key={stageCol.id}
                    className={`rounded-2xl p-3 border ${stageCol.headerBg} flex flex-col space-y-3 min-w-[230px] shadow-xs`}
                  >
                    {/* Stage Column Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-bold text-xs text-slate-900">{stageCol.label}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
                        {stageCandidates.length}
                      </span>
                    </div>

                    {/* Candidate Cards in Column */}
                    <div className="space-y-2.5 flex-1 min-h-[350px]">
                      {stageCandidates.map((cand) => (
                        <div
                          key={cand.id}
                          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-2.5 text-xs group relative"
                        >
                          {/* Top Row: Name & Super Admin Edit/Delete */}
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <h4 className="font-bold text-slate-900 text-xs leading-snug">{cand.fullName}</h4>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">{cand.jobTitle}</p>
                            </div>

                            {canManageATS && (
                              <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
                                <button
                                  onClick={() => openEditApplicantModal(cand)}
                                  className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="Edit Candidate"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteConfirm({ type: 'APPLICANT', id: cand.id, name: cand.fullName })
                                  }
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete Candidate"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Candidate metadata badge */}
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-1 border-t border-slate-100">
                            <span>{cand.experienceYears}y exp • {cand.currentCompany || 'Freelance'}</span>
                            <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span>{cand.rating || 5}</span>
                            </div>
                          </div>

                          {cand.notes && (
                            <p className="text-[10px] text-slate-500 line-clamp-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100 italic">
                              &ldquo;{cand.notes}&rdquo;
                            </p>
                          )}

                          {/* Action Buttons: Advance or 1-Click Onboard */}
                          {canManageATS && (
                            <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1.5">
                              {cand.stage === 'HIRED' ? (
                                <button
                                  onClick={() => {
                                    setOnboardModal(cand);
                                    setOnboardSalary(35000);
                                  }}
                                  className="w-full py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Onboard as Employee</span>
                                </button>
                              ) : (
                                <>
                                  {colIdx < STAGES.length - 1 && (
                                    <button
                                      onClick={() => handleMoveStage(cand.id, STAGES[colIdx + 1].id)}
                                      className="flex-1 py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <span>Advance</span>
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  )}

                                  {cand.stage === 'OFFERED' && (
                                    <button
                                      onClick={() => handleMoveStage(cand.id, 'HIRED')}
                                      className="py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                      title="Mark Hired"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>Mark Hired</span>
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {stageCandidates.length === 0 && (
                        <div className="py-12 text-center text-[11px] text-slate-400 italic">
                          No candidates in {stageCol.label}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: JOB REQUISITIONS & OPENINGS */}
        {activeTab === 'OPENINGS' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openings.map((job) => {
                const jobCandidates = applicants.filter((a) => a.jobOpeningId === job.id);
                return (
                  <div
                    key={job.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3.5 relative"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                          job.status === 'OPEN'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : job.status === 'ON_HOLD'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {job.status}
                      </span>

                      {canManageATS && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditOpeningModal(job)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Requisition (Super Admin)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({ type: 'OPENING', id: job.id, name: job.title })
                            }
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Requisition (Super Admin)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{job.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{job.description}</p>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{job.departmentName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{job.salaryRange}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500">{job.openingsCount} Openings Planned</span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-mono text-[11px]">
                        {jobCandidates.length} in Pipeline
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: CANDIDATE DIRECTORY TABLE */}
        {activeTab === 'DIRECTORY' && (
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 uppercase font-semibold text-[10px] text-slate-500 tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Candidate Name</th>
                    <th className="px-6 py-3.5">Target Requisition</th>
                    <th className="px-6 py-3.5">Current Company</th>
                    <th className="px-6 py-3.5">Experience</th>
                    <th className="px-6 py-3.5">Expected Salary</th>
                    <th className="px-6 py-3.5">Pipeline Stage</th>
                    <th className="px-6 py-3.5">Rating</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplicants.map((cand) => (
                    <tr key={cand.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="font-bold text-slate-900">{cand.fullName}</div>
                        <div className="text-[11px] text-slate-400">{cand.email}</div>
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-800">{cand.jobTitle}</td>
                      <td className="px-6 py-3.5 text-slate-600">{cand.currentCompany || 'Independent'}</td>
                      <td className="px-6 py-3.5 font-mono text-slate-600">{cand.experienceYears} Years</td>
                      <td className="px-6 py-3.5 font-semibold text-slate-800">{cand.expectedSalary}</td>
                      <td className="px-6 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {cand.stage.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{cand.rating || 5}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canManageATS && cand.stage === 'HIRED' && (
                            <button
                              onClick={() => {
                                setOnboardModal(cand);
                                setOnboardSalary(35000);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] shadow-2xs transition-colors cursor-pointer"
                            >
                              Onboard
                            </button>
                          )}

                          {canManageATS && (
                            <button
                              onClick={() => openEditApplicantModal(cand)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit Candidate"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canManageATS && (
                            <button
                              onClick={() =>
                                setDeleteConfirm({ type: 'APPLICANT', id: cand.id, name: cand.fullName })
                              }
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Candidate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL 1: PUBLISH JOB OPENING (CREATE) */}
        {createOpeningModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Publish Job Requisition</h3>
                </div>
                <button
                  onClick={() => setCreateOpeningModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOpening} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Embedded Firmware Architect"
                    value={openingTitle}
                    onChange={(e) => setOpeningTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={openingDept}
                      onChange={(e) => setOpeningDept(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Experience Level</label>
                    <input
                      type="text"
                      value={openingExp}
                      onChange={(e) => setOpeningExp(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={openingLocation}
                      onChange={(e) => setOpeningLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Salary Range</label>
                    <input
                      type="text"
                      value={openingSalary}
                      onChange={(e) => setOpeningSalary(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Openings Planned</label>
                    <input
                      type="number"
                      min={1}
                      value={openingCount}
                      onChange={(e) => setOpeningCount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={openingStatus}
                      onChange={(e) => setOpeningStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                    >
                      <option value="OPEN">OPEN (Accepting Applications)</option>
                      <option value="ON_HOLD">ON HOLD</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role Description & Responsibilities</label>
                  <textarea
                    rows={3}
                    placeholder="Key skills, expectations, and stack requirements..."
                    value={openingDesc}
                    onChange={(e) => setOpeningDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCreateOpeningModalOpen(false)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Publishing...' : 'Publish Requisition'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: EDIT JOB OPENING (UPDATE) */}
        {editOpeningModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Edit Requisition (Super Admin)</h3>
                </div>
                <button
                  onClick={() => setEditOpeningModal(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateOpening} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={openingTitle}
                    onChange={(e) => setOpeningTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={openingDept}
                      onChange={(e) => setOpeningDept(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={openingStatus}
                      onChange={(e) => setOpeningStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="ON_HOLD">ON HOLD</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Salary Range</label>
                    <input
                      type="text"
                      value={openingSalary}
                      onChange={(e) => setOpeningSalary(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Openings Planned</label>
                    <input
                      type="number"
                      min={1}
                      value={openingCount}
                      onChange={(e) => setOpeningCount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={openingDesc}
                    onChange={(e) => setOpeningDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditOpeningModal(null)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Updating...' : 'Update Requisition'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: ADD CANDIDATE (CREATE) */}
        {createApplicantModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Add Candidate to Pipeline</h3>
                </div>
                <button
                  onClick={() => setCreateApplicantModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateApplicant} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Job Requisition *</label>
                  <select
                    value={appJobId}
                    onChange={(e) => setAppJobId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    {openings.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.title} ({o.departmentName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Anand Mahindra"
                      value={appFullName}
                      onChange={(e) => setAppFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="candidate@gmail.com"
                      value={appEmail}
                      onChange={(e) => setAppEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={appPhone}
                      onChange={(e) => setAppPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Current Company</label>
                    <input
                      type="text"
                      placeholder="e.g. Tata Motors / Independent"
                      value={appCompany}
                      onChange={(e) => setAppCompany(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Experience (Yrs)</label>
                    <input
                      type="number"
                      min={0}
                      value={appExpYears}
                      onChange={(e) => setAppExpYears(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Expected Salary</label>
                    <input
                      type="text"
                      value={appSalary}
                      onChange={(e) => setAppSalary(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Rating (1-5)</label>
                    <select
                      value={appRating}
                      onChange={(e) => setAppRating(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                      <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                      <option value={3}>⭐⭐⭐ (3/5)</option>
                      <option value={2}>⭐⭐ (2/5)</option>
                      <option value={1}>⭐ (1/5)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Interview Feedback / Screening Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Candidate strengths, portfolio links, screening highlights..."
                    value={appNotes}
                    onChange={(e) => setAppNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCreateApplicantModalOpen(false)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Add Candidate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: EDIT CANDIDATE (UPDATE) */}
        {editApplicantModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Edit Candidate Details (Super Admin)</h3>
                </div>
                <button
                  onClick={() => setEditApplicantModal(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateApplicant} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={appFullName}
                      onChange={(e) => setAppFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pipeline Stage</label>
                    <select
                      value={appStage}
                      onChange={(e) => setAppStage(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      {STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={appEmail}
                      onChange={(e) => setAppEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={appPhone}
                      onChange={(e) => setAppPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Current Company</label>
                    <input
                      type="text"
                      value={appCompany}
                      onChange={(e) => setAppCompany(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Expected Salary</label>
                    <input
                      type="text"
                      value={appSalary}
                      onChange={(e) => setAppSalary(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Interviewer Rating & Notes</label>
                  <select
                    value={appRating}
                    onChange={(e) => setAppRating(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white mb-2"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5 Excellent Match)</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5 Strong Fit)</option>
                    <option value={3}>⭐⭐⭐ (3/5 Average Candidate)</option>
                    <option value={2}>⭐⭐ (2/5 Below Threshold)</option>
                    <option value={1}>⭐ (1/5 Unsuitable)</option>
                  </select>
                  <textarea
                    rows={2}
                    value={appNotes}
                    onChange={(e) => setAppNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditApplicantModal(null)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Candidate Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 5: 1-CLICK ONBOARD CANDIDATE AS EMPLOYEE (KEKA FEATURE) */}
        {onboardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4 text-slate-900">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">1-Click Employee Onboarding</h3>
                  <p className="text-[11px] text-slate-500">Convert candidate to active workforce member</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="font-bold text-slate-900">{onboardModal.fullName}</div>
                <div className="text-slate-600 text-[11px]">Role: {onboardModal.jobTitle}</div>
                <div className="text-slate-600 text-[11px]">Email: {onboardModal.email}</div>
              </div>

              <form onSubmit={handleOnboardCandidate} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Monthly Starting Salary ({tenant?.currency || 'INR'}) *
                  </label>
                  <input
                    type="number"
                    min={1000}
                    required
                    value={onboardSalary}
                    onChange={(e) => setOnboardSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    This will set their base salary in the Payroll engine and auto-generate an Employee Code.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setOnboardModal(null)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Onboarding...' : 'Confirm & Create Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 6: DELETE CONFIRMATION MODAL */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4 text-slate-900">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-bold text-base text-slate-900">
                  Delete {deleteConfirm.type === 'OPENING' ? 'Job Requisition' : 'Candidate'}?
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete <strong className="text-slate-800">{deleteConfirm.name}</strong>? This will permanently remove the item from the recruitment pipeline.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
