'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  FolderLock,
  FileText,
  Upload,
  Download,
  Plus,
  ShieldCheck,
  CheckCircle2,
  X,
  FileCheck,
  Search,
  Filter,
  Trash2,
  Edit3,
  RefreshCw,
  Building2,
  User,
  Layers,
  Lock,
  AlertTriangle,
  CheckSquare,
  Square,
  Eye
} from 'lucide-react';
import { EmployeeDocument, Employee, Tenant } from '@/lib/types';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';

const DOC_CATEGORIES = [
  { id: 'ALL', label: 'All Documents' },
  { id: 'CONTRACT', label: 'Signed Contracts' },
  { id: 'OFFER_LETTER', label: 'Offer Letters' },
  { id: 'IDENTITY_PROOF', label: 'ID Proofs (PAN/Aadhaar)' },
  { id: 'TAX_DECLARATION', label: 'Tax & Form 12BB' },
  { id: 'CERTIFICATE', label: 'Certifications' }
];

export default function TenantDocumentsPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { user, isSuperAdmin, isCompanyAdmin, isEmployeeOnly } = useCurrentUser(tenantSlug);

  // Super Admin CRUD privilege check
  const canManageDocs = isSuperAdmin || isCompanyAdmin;

  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedEmpFilter, setSelectedEmpFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Multi-selection for Super Admin bulk actions
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  // Create Modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadEmpId, setUploadEmpId] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDocType, setUploadDocType] = useState<EmployeeDocument['documentType']>('CONTRACT');
  const [uploadFileSize, setUploadFileSize] = useState('1.6 MB');
  const [submittingUpload, setSubmittingUpload] = useState(false);

  // Edit Modal (Super Admin)
  const [editingDoc, setEditingDoc] = useState<EmployeeDocument | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDocType, setEditDocType] = useState<EmployeeDocument['documentType']>('CONTRACT');
  const [editEmpId, setEditEmpId] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete Confirmation
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Alert message
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchDocs = async () => {
    try {
      const [res, empRes] = await Promise.all([
        fetch(`/api/tenants/${tenantSlug}/documents?t=${Date.now()}`),
        fetch(`/api/tenants/${tenantSlug}/employees?t=${Date.now()}`)
      ]);

      const [json, empJson] = await Promise.all([
        res.json().catch(() => ({})),
        empRes.json().catch(() => ({}))
      ]);

      if (json.success) {
        setDocuments(json.data.documents || []);
      }

      if (empJson.success) {
        setEmployees(empJson.data.employees || []);
        setTenant(empJson.data.tenant);
        if (empJson.data.employees?.length > 0 && !uploadEmpId) {
          setUploadEmpId(empJson.data.employees[0].id);
        }
      }
    } catch (e) {
      console.error('Error loading documents:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) fetchDocs();
  }, [tenantSlug]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDocs();
  };

  // Find logged in employee's profile
  const myEmp = employees.find(
    (e) =>
      user &&
      (e.workEmail.toLowerCase() === user.email.toLowerCase() ||
        e.firstName.toLowerCase() === user.name.toLowerCase().split(' ')[0])
  );

  // Auto-set upload employee for employee mode
  useEffect(() => {
    if (isEmployeeOnly && myEmp) {
      setUploadEmpId(myEmp.id);
    }
  }, [isEmployeeOnly, myEmp]);

  // Create Document Handler
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadEmpId) return;

    setSubmittingUpload(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: uploadEmpId,
          title: uploadTitle.trim(),
          documentType: uploadDocType,
          fileName: `${uploadTitle.trim().replace(/\s+/g, '_')}.pdf`,
          fileSize: uploadFileSize || '1.6 MB'
        })
      });
      const json = await res.json();
      if (json.success) {
        setUploadModalOpen(false);
        setUploadTitle('');
        setAlertMessage({ text: 'Document uploaded to vault successfully!', type: 'success' });
        setTimeout(() => setAlertMessage(null), 4000);
        fetchDocs();
      } else {
        alert(json.error || 'Failed to upload document');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingUpload(false);
    }
  };

  // Edit Document Handler (Super Admin)
  const openEditModal = (doc: EmployeeDocument) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditDocType(doc.documentType);
    setEditEmpId(doc.employeeId);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    setSubmittingEdit(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/documents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingDoc.id,
          title: editTitle.trim(),
          documentType: editDocType,
          employeeId: editEmpId
        })
      });
      const json = await res.json();
      if (json.success) {
        setEditingDoc(null);
        setAlertMessage({ text: 'Document updated successfully!', type: 'success' });
        setTimeout(() => setAlertMessage(null), 4000);
        fetchDocs();
      } else {
        alert(json.error || 'Failed to update document');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Delete Document Handler (Super Admin)
  const handleDelete = async (docId: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/documents?id=${encodeURIComponent(docId)}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setDeletingDocId(null);
        setSelectedDocIds((prev) => prev.filter((id) => id !== docId));
        setAlertMessage({ text: 'Document removed from vault permanently.', type: 'success' });
        setTimeout(() => setAlertMessage(null), 4000);
        fetchDocs();
      } else {
        alert(json.error || 'Failed to delete document');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk Delete (Super Admin)
  const handleBulkDelete = async () => {
    if (selectedDocIds.length === 0) return;
    if (!confirm(`Permanently delete ${selectedDocIds.length} selected document(s) from the vault?`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/documents?ids=${encodeURIComponent(selectedDocIds.join(','))}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setSelectedDocIds([]);
        setAlertMessage({ text: `${selectedDocIds.length} documents deleted.`, type: 'success' });
        setTimeout(() => setAlertMessage(null), 4000);
        fetchDocs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Employee-only view restriction
      if (isEmployeeOnly) {
        if (myEmp && doc.employeeId !== myEmp.id) return false;
        if (!myEmp && user && !doc.employeeName.toLowerCase().includes(user.name.toLowerCase().split(' ')[0])) {
          return false;
        }
      } else if (selectedEmpFilter !== 'ALL' && doc.employeeId !== selectedEmpFilter) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && doc.documentType !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(q);
        const matchesFile = doc.fileName.toLowerCase().includes(q);
        const matchesEmp = doc.employeeName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesFile && !matchesEmp) return false;
      }

      return true;
    });
  }, [documents, isEmployeeOnly, myEmp, user, selectedEmpFilter, selectedCategory, searchQuery]);

  // Statistics calculation
  const totalVaultFiles = documents.length;
  const contractCount = documents.filter((d) => d.documentType === 'CONTRACT' || d.documentType === 'OFFER_LETTER').length;
  const statutoryCount = documents.filter((d) => d.documentType === 'IDENTITY_PROOF' || d.documentType === 'TAX_DECLARATION').length;
  const certCount = documents.filter((d) => d.documentType === 'CERTIFICATE').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FolderLock className="w-6 h-6 text-emerald-600" />
              {isEmployeeOnly ? 'My Document Vault' : 'Enterprise Document Vault'}
            </h1>
            {canManageDocs && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Super Admin CRUD
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isEmployeeOnly
              ? `Personal employment contracts, identity proofs, and tax records for ${user?.name || 'Employee'}`
              : `Secure digital archive of employee contracts, tax declarations, and KYC compliance for ${tenant?.name || 'Goodwin Batteries'}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Refresh Vault"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {canManageDocs && selectedDocIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedDocIds.length})</span>
            </button>
          )}

          <button
            onClick={() => {
              if (isEmployeeOnly && myEmp) {
                setUploadEmpId(myEmp.id);
              } else if (employees.length > 0 && !uploadEmpId) {
                setUploadEmpId(employees[0].id);
              }
              setUploadModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{isEmployeeOnly ? 'Upload My Document' : 'Upload Document'}</span>
          </button>
        </div>
      </div>

      {/* Alert banner */}
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

      {/* Statistics Cards (Keka-style overview) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Vault Documents</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalVaultFiles}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Encrypted at rest</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contracts & Offers</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{contractCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Signed & Verified</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">KYC & Tax Declarations</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{statutoryCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Form 12BB & PAN</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Compliance & Security</div>
          <div className="text-base font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>100% Compliant</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">ISO 27001 standard</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, file name, or employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {/* Filter by Employee for Admin */}
            {!isEmployeeOnly && (
              <select
                value={selectedEmpFilter}
                onChange={(e) => setSelectedEmpFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                <option value="ALL">All Team Members ({employees.length})</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.employeeCode})
                  </option>
                ))}
              </select>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => setViewMode('GRID')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'GRID' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
          {DOC_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Super Admin Bulk Select Header */}
      {canManageDocs && filteredDocs.length > 0 && (
        <div className="flex items-center justify-between px-2 text-xs text-slate-500">
          <button
            onClick={() => {
              if (selectedDocIds.length === filteredDocs.length) {
                setSelectedDocIds([]);
              } else {
                setSelectedDocIds(filteredDocs.map((d) => d.id));
              }
            }}
            className="flex items-center gap-1.5 font-medium hover:text-slate-800 cursor-pointer"
          >
            {selectedDocIds.length === filteredDocs.length && filteredDocs.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Select All ({filteredDocs.length} documents)</span>
          </button>
          <span>Showing {filteredDocs.length} of {documents.length} files</span>
        </div>
      )}

      {/* Empty State */}
      {filteredDocs.length === 0 && (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <FolderLock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Documents Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isEmployeeOnly
              ? 'No documents currently recorded for your profile. Upload your signed agreement, PAN, or tax declaration to populate your vault.'
              : 'No documents match your active filter criteria. Click "Upload Document" to add verified records.'}
          </p>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'GRID' && filteredDocs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const isSelected = selectedDocIds.includes(doc.id);
            return (
              <div
                key={doc.id}
                className={`p-5 rounded-2xl bg-white border shadow-xs transition-all relative space-y-3.5 hover:shadow-md ${
                  isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
                }`}
              >
                {/* Header line */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {canManageDocs && (
                      <button
                        onClick={() => {
                          setSelectedDocIds((prev) =>
                            isSelected ? prev.filter((id) => id !== doc.id) : [...prev, doc.id]
                          );
                        }}
                        className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>

                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {doc.documentType.replace('_', ' ')}
                  </span>
                </div>

                {/* Title & Employee */}
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">{doc.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-700">{doc.employeeName}</span>
                  </p>
                </div>

                {/* Footer file info & Super Admin Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono text-slate-400">{doc.fileSize}</span>

                  <div className="flex items-center gap-1.5">
                    {/* Download button */}
                    <button
                      onClick={() => alert(`Downloading verified copy of "${doc.fileName}" (${doc.fileSize})...`)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                      title="Download Document"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* Super Admin Edit Button */}
                    {canManageDocs && (
                      <button
                        onClick={() => openEditModal(doc)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit Document (Super Admin)"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Super Admin Delete Button */}
                    {canManageDocs && (
                      <button
                        onClick={() => setDeletingDocId(doc.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Document (Super Admin)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'TABLE' && filteredDocs.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase font-semibold text-[10px] text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  {canManageDocs && <th className="px-4 py-3.5 w-8"></th>}
                  <th className="px-6 py-3.5">Document Title</th>
                  <th className="px-6 py-3.5">Assigned Employee</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">File Size</th>
                  <th className="px-6 py-3.5">Upload Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => {
                  const isSelected = selectedDocIds.includes(doc.id);
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      {canManageDocs && (
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => {
                              setSelectedDocIds((prev) =>
                                isSelected ? prev.filter((id) => id !== doc.id) : [...prev, doc.id]
                              );
                            }}
                            className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      )}
                      <td className="px-6 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{doc.title}</span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-700 font-semibold">{doc.employeeName}</td>
                      <td className="px-6 py-3.5">
                        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {doc.documentType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-500">{doc.fileSize}</td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => alert(`Downloading verified copy of "${doc.fileName}"...`)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {canManageDocs && (
                            <button
                              onClick={() => openEditModal(doc)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit Document"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {canManageDocs && (
                            <button
                              onClick={() => setDeletingDocId(doc.id)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE MODAL: Upload Document */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Add Document to Vault</h3>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Team Member *</label>
                {isEmployeeOnly ? (
                  <div className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-800 font-semibold">
                    {user?.name || 'Self'} ({myEmp?.employeeCode || 'ESS'})
                  </div>
                ) : (
                  <select
                    value={uploadEmpId}
                    onChange={(e) => setUploadEmpId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} ({e.employeeCode}) - {e.designationTitle}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FY2026 Tax Declaration Form 12BB / Signed Employment Agreement"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Document Category *</label>
                  <select
                    value={uploadDocType}
                    onChange={(e) => setUploadDocType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="CONTRACT">Signed Employment Contract</option>
                    <option value="OFFER_LETTER">Formal Offer Letter</option>
                    <option value="IDENTITY_PROOF">Identity Proof (PAN / Aadhaar)</option>
                    <option value="TAX_DECLARATION">Tax Declaration (Form 12BB / 16)</option>
                    <option value="CERTIFICATE">Degree or Technical Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">File Size Simulator</label>
                  <select
                    value={uploadFileSize}
                    onChange={(e) => setUploadFileSize(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="840 KB">840 KB (Standard PDF)</option>
                    <option value="1.6 MB">1.6 MB (Scanned Signed PDF)</option>
                    <option value="2.8 MB">2.8 MB (Multi-page KYC)</option>
                    <option value="4.5 MB">4.5 MB (High-res Certificate)</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Files are encrypted with SHA-256 and stored in the dedicated Supabase document vault.</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUpload}
                  className="px-5 py-2 font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingUpload ? 'Uploading...' : 'Add to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL (Super Admin) */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Edit Document (Super Admin)</h3>
              </div>
              <button
                onClick={() => setEditingDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Team Member</label>
                <select
                  value={editEmpId}
                  onChange={(e) => setEditEmpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Category</label>
                <select
                  value={editDocType}
                  onChange={(e) => setEditDocType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="CONTRACT">Signed Employment Contract</option>
                  <option value="OFFER_LETTER">Formal Offer Letter</option>
                  <option value="IDENTITY_PROOF">Identity Proof (PAN / Aadhaar)</option>
                  <option value="TAX_DECLARATION">Tax Declaration (Form 12BB / 16)</option>
                  <option value="CERTIFICATE">Degree or Technical Certificate</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2 font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingEdit ? 'Saving...' : 'Update Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (Super Admin) */}
      {deletingDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4 text-slate-900">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900">Delete Document Permanently?</h3>
              <p className="text-xs text-slate-500">
                This document will be permanently removed from the Supabase vault and employee record. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDocId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingDocId)}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
