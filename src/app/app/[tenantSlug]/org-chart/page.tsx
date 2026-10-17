'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  GitFork,
  Users,
  Building2,
  Mail,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  Crown,
  Settings2,
  UserCheck,
  Edit3,
  Search,
  Filter,
  RefreshCw,
  Plus,
  ArrowRight,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { Employee, Department, Tenant } from '@/lib/types';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';

interface HierarchyNode {
  id: string;
  isOwnerNode?: boolean;
  name: string;
  designation: string;
  department: string;
  code: string;
  email: string;
  avatarUrl?: string;
  reportingManagerId?: string | null;
  reportingManagerName?: string;
  directReports: HierarchyNode[];
  rawEmployee?: Employee;
}

export default function TenantOrgChartPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { user, role, isSuperAdmin, isCompanyAdmin } = useCurrentUser(tenantSlug);

  const canEditHierarchy =
    isSuperAdmin ||
    isCompanyAdmin ||
    role === 'COMPANY_ADMIN' ||
    role === 'SUPER_ADMIN' ||
    role === 'HR_ADMIN';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // Interactive Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isSavingHierarchy, setIsSavingHierarchy] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Quick single employee manager modal state
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedNewManagerId, setSelectedNewManagerId] = useState<string>('OWNER');

  // Hierarchy Configuration Draft State
  const [rootType, setRootType] = useState<'OWNER' | 'EMPLOYEE'>('OWNER');
  const [designatedRootEmpId, setDesignatedRootEmpId] = useState<string>('');
  const [reportingDraft, setReportingDraft] = useState<Record<string, string>>({});

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/employees?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      const json = await res.json();
      if (json.success) {
        setEmployees(json.data.employees || []);
        setDepartments(json.data.departments || []);
        setTenant(json.data.tenant || null);

        // Initialize draft assignments
        const draft: Record<string, string> = {};
        (json.data.employees || []).forEach((emp: Employee) => {
          draft[emp.id] = emp.reportingManagerId || 'OWNER';
        });
        setReportingDraft(draft);

        if (json.data.tenant?.orgTreeRootId && json.data.tenant.orgTreeRootId !== 'OWNER') {
          setRootType('EMPLOYEE');
          setDesignatedRootEmpId(json.data.tenant.orgTreeRootId);
        } else {
          setRootType('OWNER');
        }
      }
    } catch (e) {
      console.error('Error fetching org chart data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchEmployees();
    }
  }, [tenantSlug]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEmployees();
  };

  // Company Owner / Founder Fallback Head
  const ownerHeadNode: HierarchyNode = useMemo(() => {
    return {
      id: 'OWNER',
      isOwnerNode: true,
      name: user?.name || 'Rajnish Singh Chauhan',
      designation: 'Managing Director & Founder',
      department: 'Executive Board',
      code: `${tenant?.companyCode || 'GOODWIN'}-MD-001`,
      email: user?.email || 'rajnish.chauhan@goodwinbatteries.com',
      avatarUrl: user?.avatarUrl,
      directReports: []
    };
  }, [user, tenant]);

  // Construct Hierarchical Tree Structure
  const { rootNode, unassignedNodes } = useMemo(() => {
    // Filter employees by department if selected
    const filteredEmployees = employees.filter((emp) => {
      if (selectedDept !== 'ALL' && emp.departmentId !== selectedDept) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q);
        const matchesCode = (emp.employeeCode || '').toLowerCase().includes(q);
        const matchesDesig = (emp.designationTitle || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDesig) return false;
      }
      return true;
    });

    // Map each employee to a HierarchyNode
    const nodeMap = new Map<string, HierarchyNode>();
    filteredEmployees.forEach((emp) => {
      nodeMap.set(emp.id, {
        id: emp.id,
        isOwnerNode: false,
        name: `${emp.firstName} ${emp.lastName}`,
        designation: emp.designationTitle || 'Staff Member',
        department: emp.departmentName || 'General',
        code: emp.employeeCode,
        email: emp.workEmail,
        avatarUrl: emp.avatarUrl,
        reportingManagerId: emp.reportingManagerId,
        reportingManagerName: emp.reportingManagerName,
        directReports: [],
        rawEmployee: emp
      });
    });

    let currentRoot: HierarchyNode;
    const unassigned: HierarchyNode[] = [];

    if (rootType === 'EMPLOYEE' && designatedRootEmpId && nodeMap.has(designatedRootEmpId)) {
      currentRoot = nodeMap.get(designatedRootEmpId)!;
    } else {
      currentRoot = { ...ownerHeadNode, directReports: [] };
    }

    // Attach children to their managers
    nodeMap.forEach((node) => {
      // Don't attach root to itself
      if (node.id === currentRoot.id) return;

      const managerId = node.reportingManagerId;

      if (!managerId || managerId === 'OWNER' || managerId === currentRoot.id) {
        currentRoot.directReports.push(node);
      } else if (nodeMap.has(managerId)) {
        nodeMap.get(managerId)!.directReports.push(node);
      } else {
        // If manager not found in filtered set, attach directly to root or unassigned
        currentRoot.directReports.push(node);
      }
    });

    return { rootNode: currentRoot, unassignedNodes: unassigned };
  }, [employees, rootType, designatedRootEmpId, ownerHeadNode, selectedDept, searchQuery]);

  // Save full hierarchy batch
  const handleSaveHierarchy = async () => {
    setIsSavingHierarchy(true);
    setSaveSuccessMsg(null);

    try {
      const updates = employees.map((emp) => {
        const isCurrentRoot = rootType === 'EMPLOYEE' && emp.id === designatedRootEmpId;
        const targetManagerId = isCurrentRoot ? 'OWNER' : (reportingDraft[emp.id] || 'OWNER');
        let targetManagerName = 'Managing Director Office';

        if (targetManagerId === 'OWNER') {
          targetManagerName = `${ownerHeadNode.name} (MD)`;
        } else {
          const mgr = employees.find((e) => e.id === targetManagerId);
          if (mgr) {
            targetManagerName = `${mgr.firstName} ${mgr.lastName} (${mgr.designationTitle})`;
          }
        }

        return {
          id: emp.id,
          reportingManagerId: targetManagerId === 'OWNER' ? null : targetManagerId,
          reportingManagerName: targetManagerName
        };
      });

      const res = await fetch(`/api/tenants/${tenantSlug}/employees`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates,
          rootLeaderId: rootType === 'OWNER' ? 'OWNER' : designatedRootEmpId
        })
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg('Organization hierarchy successfully updated & saved!');
        if (data.data?.employees) {
          setEmployees(data.data.employees);
          const draft: Record<string, string> = {};
          data.data.employees.forEach((emp: Employee) => {
            draft[emp.id] = emp.reportingManagerId || 'OWNER';
          });
          setReportingDraft(draft);
        }
        if (data.data?.orgTreeRootId !== undefined) {
          setTenant((prev) => (prev ? { ...prev, orgTreeRootId: data.data.orgTreeRootId } : null));
          if (data.data.orgTreeRootId && data.data.orgTreeRootId !== 'OWNER') {
            setRootType('EMPLOYEE');
            setDesignatedRootEmpId(data.data.orgTreeRootId);
          } else {
            setRootType('OWNER');
          }
        }
        await fetchEmployees();
        setTimeout(() => {
          setIsAssignModalOpen(false);
          setSaveSuccessMsg(null);
        }, 1200);
      } else {
        alert(data.error || 'Failed to save hierarchy changes');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating organization hierarchy');
    } finally {
      setIsSavingHierarchy(false);
    }
  };

  // Quick single employee update
  const handleQuickUpdateManager = async () => {
    if (!editingEmployee) return;

    try {
      let managerName = `${ownerHeadNode.name} (MD)`;
      let managerId: string | null = null;

      if (selectedNewManagerId !== 'OWNER') {
        const mgr = employees.find((e) => e.id === selectedNewManagerId);
        if (mgr) {
          managerName = `${mgr.firstName} ${mgr.lastName} (${mgr.designationTitle})`;
          managerId = mgr.id;
        }
      }

      const res = await fetch(`/api/tenants/${tenantSlug}/employees`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: editingEmployee.id,
          reportingManagerId: managerId,
          reportingManagerName: managerName
        })
      });

      const data = await res.json();
      if (data.success) {
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === editingEmployee.id
              ? { ...emp, reportingManagerId: managerId || undefined, reportingManagerName: managerName }
              : emp
          )
        );
        setEditingEmployee(null);
        await fetchEmployees();
      } else {
        alert(data.error || 'Failed to update reporting line');
      }
    } catch (err) {
      console.error(err);
      alert('Network error updating reporting line');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <GitFork className="w-3.5 h-3.5 text-emerald-600" />
            <span>Interactive Organizational Chart</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Organization Hierarchy Tree
          </h1>
          <p className="text-sm text-slate-500">
            Configure direct reporting lines, executive leadership, and departmental chain of command for{' '}
            <strong className="text-slate-700">{tenant?.name || 'Workspace'}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>{employees.length} Team Members</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh Hierarchy Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {canEditHierarchy && (
            <button
              id="btn-assign-hierarchy"
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs tracking-wide shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <Settings2 className="w-4 h-4" />
              <span>Assign Hierarchy</span>
            </button>
          )}

          <Link
            href={`/app/${tenantSlug}/employees`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Add Member</span>
          </Link>
        </div>
      </div>

      {/* Admin Access & Instructions Banner */}
      {canEditHierarchy && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-white to-slate-50 border border-emerald-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>Company Owner & Admin Hierarchy Controls</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-mono">
                  Full Access
                </span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                You have full authority to structure who reports to whom. Click{' '}
                <strong className="text-emerald-700 font-semibold">&quot;Assign Hierarchy&quot;</strong> above or click{' '}
                <strong className="text-slate-800">&quot;Change Manager&quot;</strong> directly on any employee card.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold shrink-0 shadow-xs cursor-pointer"
          >
            <span>Configure Structure</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team member or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>Executive Root:</span>
          <span className="font-semibold text-slate-800">
            {rootType === 'OWNER'
              ? `${ownerHeadNode.name} (MD & Founder)`
              : rootNode.name}
          </span>
        </div>
      </div>

      {/* Visual Org Tree Canvas */}
      <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col items-center space-y-8 min-h-[520px] relative overflow-x-auto bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:24px_24px]">
        {/* Tier 1: Executive Leadership / Root Node */}
        <div className="relative flex flex-col items-center z-10">
          <div className="w-80 p-5 rounded-2xl bg-white border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 text-center space-y-3 relative group transition-all">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1">
              <Crown className="w-3 h-3" />
              <span>{rootNode.isOwnerNode ? 'Founder & Managing Director' : 'Executive Head'}</span>
            </div>

            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center font-bold text-emerald-700 text-xl shadow-inner">
              {rootNode.avatarUrl ? (
                <img
                  src={rootNode.avatarUrl}
                  alt={rootNode.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>
                  {rootNode.name.split(' ')[0]?.[0]}
                  {rootNode.name.split(' ')[1]?.[0] || ''}
                </span>
              )}
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                {rootNode.name}
              </h3>
              <p className="text-xs font-semibold text-emerald-700 mt-0.5">{rootNode.designation}</p>
              <span className="text-[10px] text-slate-400 font-mono tracking-wide">
                {rootNode.department}
              </span>
            </div>

            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>{rootNode.code}</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                {rootNode.directReports.length} Direct Reports
              </span>
            </div>

            {canEditHierarchy && (
              <div className="pt-1">
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="w-full py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-[11px] font-semibold text-slate-600 hover:text-emerald-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3 text-emerald-600" />
                  <span>Configure Organization Head</span>
                </button>
              </div>
            )}
          </div>

          {/* Connecting Vertical Stem from Root */}
          {rootNode.directReports.length > 0 && (
            <div className="w-0.5 h-10 bg-slate-300 relative flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -bottom-1"></div>
            </div>
          )}
        </div>

        {/* Tier 2: Direct Reports */}
        {rootNode.directReports.length > 0 ? (
          <div className="w-full flex flex-col items-center">
            {/* Horizontal Split Line if multiple reports */}
            {rootNode.directReports.length > 1 && (
              <div className="h-0.5 bg-slate-300 w-3/4 max-w-4xl mb-8 relative">
                <div className="w-2 h-2 rounded-full bg-emerald-500 absolute left-0 -top-[3px]"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 absolute right-0 -top-[3px]"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 absolute left-1/2 -translate-x-1/2 -top-[3px]"></div>
              </div>
            )}

            {/* Direct Reports Grid */}
            <div className="flex flex-wrap justify-center gap-8 w-full max-w-6xl">
              {rootNode.directReports.map((member) => (
                <div key={member.id} className="flex flex-col items-center">
                  {/* Vertical Connector into Card */}
                  {rootNode.directReports.length > 1 && (
                    <div className="w-0.5 h-6 bg-slate-300 -mt-8 mb-2"></div>
                  )}

                  {/* Employee Card */}
                  <div className="w-72 p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500/80 hover:shadow-lg transition-all text-center space-y-3 relative group shadow-xs">
                    {/* Role Pill */}
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold uppercase tracking-wider">
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      <span>{member.department}</span>
                    </div>

                    <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 border-2 border-slate-200 group-hover:border-emerald-400 flex items-center justify-center font-bold text-slate-700 text-base transition-colors shadow-xs">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span>
                          {member.name.split(' ')[0]?.[0]}
                          {member.name.split(' ')[1]?.[0] || ''}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{member.name}</h4>
                      <p className="text-xs text-emerald-700 font-semibold">{member.designation}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{member.email}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-mono text-slate-600 font-medium">{member.code}</span>
                      <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium">
                        {member.directReports.length} Reports
                      </span>
                    </div>

                    {/* Change Manager Action */}
                    {canEditHierarchy && member.rawEmployee && (
                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setEditingEmployee(member.rawEmployee!);
                            setSelectedNewManagerId(member.reportingManagerId || 'OWNER');
                          }}
                          className="w-full py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3 text-emerald-600" />
                          <span>Change Manager</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Level 3: Nested Direct Reports (if any) */}
                  {member.directReports.length > 0 && (
                    <div className="flex flex-col items-center mt-4">
                      <div className="w-0.5 h-6 bg-slate-300"></div>
                      <div className="flex flex-wrap justify-center gap-4 mt-2">
                        {member.directReports.map((subMember) => (
                          <div
                            key={subMember.id}
                            className="w-60 p-3.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 shadow-xs text-center space-y-2"
                          >
                            <h5 className="font-bold text-slate-800 text-xs">{subMember.name}</h5>
                            <p className="text-[11px] text-emerald-700">{subMember.designation}</p>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {subMember.code}
                            </span>
                            {canEditHierarchy && subMember.rawEmployee && (
                              <button
                                onClick={() => {
                                  setEditingEmployee(subMember.rawEmployee!);
                                  setSelectedNewManagerId(subMember.reportingManagerId || 'OWNER');
                                }}
                                className="w-full mt-1 text-[10px] text-emerald-700 hover:underline font-semibold cursor-pointer"
                              >
                                Reassign Manager
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-md text-center p-8 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">No Direct Reports Configured Yet</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Currently no team members are assigned under this executive head, or all employees match other filters.
            </p>
            {canEditHierarchy && (
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Assign Reporting Lines Now</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Full Hierarchy Assigner */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <GitFork className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Assign & Structure Organization Tree
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure the Executive Head and define who reports to whom
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {saveSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Step 1: Select Executive Head */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Step 1: Designate Top Executive Head / MD</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      rootType === 'OWNER'
                        ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rootType"
                      checked={rootType === 'OWNER'}
                      onChange={() => setRootType('OWNER')}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">
                        Company Owner / Managing Director
                      </h5>
                      <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                        {ownerHeadNode.name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Sits at the top of the organization tree as Managing Director & Founder.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      rootType === 'EMPLOYEE'
                        ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rootType"
                      checked={rootType === 'EMPLOYEE'}
                      onChange={() => setRootType('EMPLOYEE')}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="w-full">
                      <h5 className="font-bold text-slate-900 text-xs">
                        Designate An Employee As Head
                      </h5>
                      <select
                        disabled={rootType !== 'EMPLOYEE'}
                        value={designatedRootEmpId}
                        onChange={(e) => setDesignatedRootEmpId(e.target.value)}
                        className="mt-2 w-full px-2.5 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                      >
                        <option value="">Select an employee...</option>
                        {employees.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.firstName} {e.lastName} ({e.designationTitle})
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Choose an employee (e.g. CEO / COO) as the top root node.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Step 2: Assign Reporting Lines */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Step 2: Assign Reporting Managers for Team</span>
                  </label>
                  <span className="text-xs text-slate-400">
                    {employees.length} Employees to configure
                  </span>
                </div>

                {employees.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                    No employees found in this workspace yet. Add employees from Setup or Employee directory first.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {employees.map((emp) => {
                      const isCurrentRoot =
                        rootType === 'EMPLOYEE' && designatedRootEmpId === emp.id;

                      return (
                        <div
                          key={emp.id}
                          className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                              {emp.firstName[0]}
                              {emp.lastName[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-slate-900 text-xs">
                                  {emp.firstName} {emp.lastName}
                                </h5>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {emp.employeeCode}
                                </span>
                              </div>
                              <p className="text-[11px] text-emerald-700 font-medium">
                                {emp.designationTitle} • {emp.departmentName || 'General'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:w-72">
                            {isCurrentRoot ? (
                              <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-semibold text-xs text-center w-full">
                                Designated Executive Head
                              </span>
                            ) : (
                              <div className="w-full">
                                <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-0.5">
                                  Reports To:
                                </label>
                                <select
                                  value={reportingDraft[emp.id] || 'OWNER'}
                                  onChange={(e) => {
                                    setReportingDraft((prev) => ({
                                      ...prev,
                                      [emp.id]: e.target.value
                                    }));
                                  }}
                                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                                >
                                  <option value="OWNER">
                                    👑 Executive Head ({ownerHeadNode.name} - MD)
                                  </option>
                                  {employees
                                    .filter((other) => other.id !== emp.id)
                                    .map((other) => (
                                      <option key={other.id} value={other.id}>
                                        {other.firstName} {other.lastName} ({other.designationTitle})
                                      </option>
                                    ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                id="btn-save-hierarchy-changes"
                onClick={handleSaveHierarchy}
                disabled={isSavingHierarchy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSavingHierarchy ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Hierarchy...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Apply Hierarchy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Quick Reassign Manager for Single Employee */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Change Reporting Manager
                </h4>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-500">Selected Employee:</p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                  {editingEmployee.firstName[0]}
                  {editingEmployee.lastName[0]}
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-xs">
                    {editingEmployee.firstName} {editingEmployee.lastName}
                  </h5>
                  <span className="text-[11px] text-emerald-700">
                    {editingEmployee.designationTitle} ({editingEmployee.employeeCode})
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Select New Reporting Manager:
              </label>
              <select
                value={selectedNewManagerId}
                onChange={(e) => setSelectedNewManagerId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                <option value="OWNER">
                  👑 Executive Head ({ownerHeadNode.name} - MD & Founder)
                </option>
                {employees
                  .filter((e) => e.id !== editingEmployee.id)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.designationTitle})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingEmployee(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickUpdateManager}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                Update Reporting Line
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
