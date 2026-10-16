'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Briefcase,
  Users,
  Plus,
  Star,
  ArrowRight,
  CheckCircle2,
  X,
  Building2,
  DollarSign,
  MapPin,
  Clock,
  ChevronRight
} from 'lucide-react';
import { JobOpening, JobApplicant, CandidateStage, Tenant } from '@/lib/types';

const STAGES: { id: CandidateStage; label: string; color: string }[] = [
  { id: 'APPLIED', label: 'Applied', color: 'border-slate-700 bg-slate-900/60' },
  { id: 'SCREENING', label: 'Screening', color: 'border-blue-900/60 bg-blue-950/20' },
  { id: 'TECHNICAL_INTERVIEW', label: 'Technical Interview', color: 'border-indigo-900/60 bg-indigo-950/20' },
  { id: 'HR_ROUND', label: 'HR & Cultural Round', color: 'border-amber-900/60 bg-amber-950/20' },
  { id: 'OFFERED', label: 'Offer Extended', color: 'border-emerald-900/60 bg-emerald-950/20' },
  { id: 'HIRED', label: 'Hired & Onboarding', color: 'border-teal-900/60 bg-teal-950/30' }
];

export default function TenantRecruitmentPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  const [openings, setOpenings] = useState<JobOpening[]>([]);
  const [applicants, setApplicants] = useState<JobApplicant[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [openingModalOpen, setOpeningModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDept, setNewDept] = useState('Engineering & Technology');
  const [newExp, setNewExp] = useState('3-6 Years');
  const [newLocation, setNewLocation] = useState('Bangalore, India');
  const [newSalary, setNewSalary] = useState('₹25,00,000 - ₹35,00,000');
  const [submittingOpening, setSubmittingOpening] = useState(false);

  const fetchRecruitment = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/recruitment`);
      const json = await res.json();
      if (json.success) {
        setOpenings(json.data.openings);
        setApplicants(json.data.applicants);
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
      fetchRecruitment();
    }
  }, [tenantSlug]);

  const handleAdvanceStage = async (applicantId: string, currentStage: CandidateStage) => {
    const stageOrder: CandidateStage[] = [
      'APPLIED',
      'SCREENING',
      'TECHNICAL_INTERVIEW',
      'HR_ROUND',
      'OFFERED',
      'HIRED'
    ];
    const currentIndex = stageOrder.indexOf(currentStage);
    if (currentIndex >= stageOrder.length - 1) return;

    const nextStage = stageOrder[currentIndex + 1];

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/recruitment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId, newStage: nextStage })
      });
      const json = await res.json();
      if (json.success) {
        fetchRecruitment();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateOpening = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingOpening(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/recruitment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          departmentName: newDept,
          experienceLevel: newExp,
          location: newLocation,
          salaryRange: newSalary,
          openingsCount: 2
        })
      });
      const json = await res.json();
      if (json.success) {
        setOpeningModalOpen(false);
        setNewTitle('');
        fetchRecruitment();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingOpening(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-emerald-400" />
            Recruitment & Applicant Tracking System (ATS)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Requisitions, candidate talent pipeline, and interview scoring for {tenant?.name}
          </p>
        </div>

        <button
          onClick={() => setOpeningModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-900/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Publish Job Requisition</span>
        </button>
      </div>

      {/* Active Job Openings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {openings.map((job) => (
          <div key={job.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-md space-y-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {job.status}
              </span>
              <span className="text-xs font-mono text-slate-400">{job.openingsCount} Openings</span>
            </div>

            <h3 className="font-bold text-white text-sm">{job.title}</h3>
            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{job.departmentName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{job.salaryRange}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Kanban Pipeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Candidate Pipeline Kanban ({applicants.length} Active Candidates)
          </h2>
          <span className="text-xs text-slate-400">Click &quot;Advance&quot; to progress candidates</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-4">
          {STAGES.map((col) => {
            const colApplicants = applicants.filter((a) => a.stage === col.id);
            return (
              <div
                key={col.id}
                className={`rounded-2xl p-3 border ${col.color} flex flex-col space-y-3 min-w-[200px] shadow-lg`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-xs text-white">{col.label}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {colApplicants.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  {colApplicants.map((app) => (
                    <div
                      key={app.id}
                      className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md space-y-2 hover:border-slate-700 transition-all text-xs"
                    >
                      <div className="font-bold text-white">{app.fullName}</div>
                      <div className="text-[11px] text-slate-400 truncate">{app.jobTitle}</div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                        <span>{app.experienceYears}y exp</span>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          <Star className="w-2.5 h-2.5 fill-amber-400" />
                          <span>{app.rating || 5}</span>
                        </div>
                      </div>

                      {app.stage !== 'HIRED' && (
                        <button
                          onClick={() => handleAdvanceStage(app.id, app.stage)}
                          className="w-full mt-1.5 flex items-center justify-center gap-1 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold transition-colors"
                        >
                          <span>Advance</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {colApplicants.length === 0 && (
                    <div className="py-6 text-center text-[11px] text-slate-600 italic">No candidates</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Publish Opening Modal */}
      {openingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Publish New Job Opening</h3>
              <button
                onClick={() => setOpeningModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
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
                  placeholder="e.g. Lead Machine Learning Engineer"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Experience Level</label>
                  <input
                    type="text"
                    value={newExp}
                    onChange={(e) => setNewExp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Salary Range</label>
                  <input
                    type="text"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setOpeningModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOpening}
                  className="px-5 py-2 font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                >
                  {submittingOpening ? 'Publishing...' : 'Publish Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
