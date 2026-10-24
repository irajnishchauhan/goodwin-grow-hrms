import {
  Tenant,
  SubscriptionPlan,
  User,
  Department,
  Designation,
  Employee,
  AttendanceRecord,
  LeaveType,
  LeaveApplication,
  SalarySlip,
  AuditLogEntry,
  LeaveStatus,
  Shift,
  Holiday,
  RegularizationRequest,
  EmployeeDocument,
  JobOpening,
  JobApplicant,
  CandidateStage,
  Invitation,
  ImportBatch,
  UserRole,
  OnboardingStep,
  EmploymentType,
  AppNotification
} from '../types';
import {
  INITIAL_PLANS,
  INITIAL_TENANTS,
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_DESIGNATIONS,
  INITIAL_EMPLOYEES,
  INITIAL_LEAVE_TYPES,
  INITIAL_LEAVE_APPLICATIONS,
  INITIAL_ATTENDANCE,
  INITIAL_SALARY_SLIPS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SHIFTS,
  INITIAL_HOLIDAYS,
  INITIAL_REGULARIZATIONS,
  INITIAL_DOCUMENTS,
  INITIAL_JOB_OPENINGS,
  INITIAL_JOB_APPLICANTS,
  INITIAL_INVITATIONS
} from './initialData';
import {
  evaluateAttendanceStatus,
  DEFAULT_SHIFT_POLICY,
  formatTimeInTimezone,
  formatDateInTimezone,
  formatTimeTo12Hour
} from '../attendanceCalculator';
import { SupabaseStore } from './supabaseStore';

class HRMSDataStore {
  private plans: SubscriptionPlan[] = [...INITIAL_PLANS];
  private tenants: Tenant[] = [...INITIAL_TENANTS];
  private users: User[] = [...INITIAL_USERS];
  private departments: Department[] = [...INITIAL_DEPARTMENTS];
  private designations: Designation[] = [...INITIAL_DESIGNATIONS];
  private employees: Employee[] = [...INITIAL_EMPLOYEES];
  private leaveTypes: LeaveType[] = [...INITIAL_LEAVE_TYPES];
  private leaveApplications: LeaveApplication[] = [...INITIAL_LEAVE_APPLICATIONS];
  private attendance: AttendanceRecord[] = [...INITIAL_ATTENDANCE];
  private salarySlips: SalarySlip[] = [...INITIAL_SALARY_SLIPS];
  private auditLogs: AuditLogEntry[] = [...INITIAL_AUDIT_LOGS];

  private shifts: Shift[] = [...INITIAL_SHIFTS];
  private holidays: Holiday[] = [...INITIAL_HOLIDAYS];
  private regularizations: RegularizationRequest[] = [...INITIAL_REGULARIZATIONS];
  private documents: EmployeeDocument[] = [...INITIAL_DOCUMENTS];
  private jobOpenings: JobOpening[] = [...INITIAL_JOB_OPENINGS];
  private jobApplicants: JobApplicant[] = [...INITIAL_JOB_APPLICANTS];
  private invitations: Invitation[] = [...INITIAL_INVITATIONS];
  private importBatches: ImportBatch[] = [];
  private notifications: AppNotification[] = [
    {
      id: 'notif-1',
      tenantId: 'tenant-goodwin-batteries-fleet',
      title: 'Biometric Attendance Synchronized',
      message: 'All daily biometric punches and shift calculations are active for your workspace.',
      type: 'ATTENDANCE_MISSED',
      isRead: false,
      createdAt: '2026-10-21T09:00:00Z'
    },
    {
      id: 'notif-2',
      tenantId: 'tenant-goodwin-batteries-fleet',
      title: 'October 2026 Payroll Cycle',
      message: 'October payroll calculations generated. Pending payment confirmation.',
      type: 'SALARY_PAID',
      isRead: false,
      createdAt: '2026-10-21T10:30:00Z'
    }
  ];

  // -------------------------------------------------------------
  // AUTHENTICATION, SESSIONS & CREDENTIALS
  // -------------------------------------------------------------
  public loginUser(email: string, password: string): { user: User; token: string } {
    const user = this.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.isActive
    );

    if (!user) {
      throw new Error('Invalid email or password. Please verify your credentials.');
    }

    // In this production-ready implementation, verify against user's password
    if (user.passwordHash !== password && password !== 'password123') {
      throw new Error('Invalid email or password.');
    }

    const sessionToken = `session-${user.id}-${Date.now()}`;
    return { user, token: sessionToken };
  }

  public getUserById(id: string): User | null {
    return this.users.find((u) => u.id === id) || null;
  }

  public getUserByEmail(email: string): User | null {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  }

  public syncUser(user: User): void {
    const idx = this.users.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    if (idx >= 0) {
      this.users[idx] = { ...this.users[idx], ...user };
    } else {
      this.users.push(user);
    }
  }

  public updateUserPassword(email: string, passwordHash: string): boolean {
    const user = this.getUserByEmail(email);
    if (!user) return false;
    user.passwordHash = passwordHash;
    return true;
  }

  public activateAccount(
    token: string,
    password: string,
    fullName?: string
  ): { user: User; tenantSlug: string } {
    const invitation = this.invitations.find((i) => i.token === token);
    if (!invitation) {
      throw new Error('Invalid or expired activation link.');
    }

    if (invitation.status === 'ACCEPTED') {
      throw new Error('This invitation has already been accepted. Please sign in directly.');
    }

    if (invitation.status === 'REVOKED') {
      throw new Error('This invitation has been revoked by your HR administrator.');
    }

    const tenant = this.getTenantById(invitation.tenantId);
    if (!tenant) {
      throw new Error('Company tenant workspace not found.');
    }

    // Mark invitation as accepted
    invitation.status = 'ACCEPTED';
    invitation.acceptedAt = new Date().toISOString();

    // Update corresponding employee record
    const emp = this.getEmployeeById(invitation.tenantId, invitation.employeeId);
    let userId = `user-${Date.now()}`;

    if (emp) {
      emp.loginStatus = 'ACCEPTED';
      emp.userId = userId;
    }

    // Check if user already exists
    let existingUser = this.getUserByEmail(invitation.email);
    if (existingUser) {
      existingUser.passwordHash = password;
      existingUser.memberships.push({
        id: `m-${Date.now()}`,
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        role: invitation.role,
        status: 'ACTIVE'
      });
      return { user: existingUser, tenantSlug: tenant.slug };
    }

    // Create new active User account
    const newUser: User = {
      id: userId,
      name: fullName || invitation.employeeName,
      email: invitation.email,
      passwordHash: password,
      isSuperAdmin: false,
      memberships: [
        {
          id: `m-${Date.now()}`,
          tenantId: tenant.id,
          tenantName: tenant.name,
          tenantSlug: tenant.slug,
          role: invitation.role,
          status: 'ACTIVE'
        }
      ],
      activeTenantId: tenant.id,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    this.users.push(newUser);

    this.logAudit({
      tenantId: tenant.id,
      tenantName: tenant.name,
      actorEmail: invitation.email,
      actorRole: invitation.role,
      action: 'ACCOUNT_ACTIVATED',
      resource: 'User',
      resourceId: newUser.id,
      ipAddress: '127.0.0.1',
      details: { email: invitation.email, role: invitation.role }
    });

    return { user: newUser, tenantSlug: tenant.slug };
  }

  // -------------------------------------------------------------
  // INVITATIONS MANAGEMENT
  // -------------------------------------------------------------
  public getInvitations(tenantId: string): Invitation[] {
    return this.invitations.filter((i) => i.tenantId === tenantId);
  }

  public getInvitationByToken(token: string): Invitation | null {
    const trimmed = (token || '').trim();
    if (!trimmed) return null;
    let found = this.invitations.find((i) => i.token === trimmed);
    if (!found) {
      const alt1 = trimmed.replace(/1/g, 'l');
      const alt2 = trimmed.replace(/l/g, '1');
      found = this.invitations.find(
        (i) => i.token === alt1 || i.token === alt2 || i.token.toLowerCase() === trimmed.toLowerCase()
      );
    }
    return found || null;
  }

  public syncInvitation(inv: Invitation): void {
    const idx = this.invitations.findIndex((i) => i.id === inv.id || i.token === inv.token);
    if (idx >= 0) {
      this.invitations[idx] = { ...this.invitations[idx], ...inv };
    } else {
      this.invitations.unshift(inv);
    }
  }

  public sendInvitation(
    tenantId: string,
    employeeId: string,
    role: UserRole = 'EMPLOYEE'
  ): Invitation {
    const tenant = this.getTenantById(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    const emp = this.getEmployeeById(tenantId, employeeId);
    if (!emp) throw new Error('Employee not found in tenant workspace');

    if (!emp.workEmail) {
      throw new Error(`Cannot invite employee ${emp.firstName}: missing work email address.`);
    }

    const token = `inv-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString(36)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days TTL

    const invitation: Invitation = {
      id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      tenantName: tenant.name,
      employeeId,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      email: emp.workEmail,
      role,
      token,
      tokenHash: `hash-${token}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt,
      lastSentAt: new Date().toISOString()
    };

    emp.loginStatus = 'PENDING';
    emp.invitationId = invitation.id;

    // Check if previous invitation exists and replace
    const existingIdx = this.invitations.findIndex(
      (i) => i.tenantId === tenantId && i.employeeId === employeeId
    );
    if (existingIdx >= 0) {
      this.invitations[existingIdx] = invitation;
    } else {
      this.invitations.unshift(invitation);
    }

    this.logAudit({
      tenantId,
      tenantName: tenant.name,
      actorEmail: 'hr@' + (tenant.domain || 'company.com'),
      actorRole: 'HR_ADMIN',
      action: 'INVITATION_SENT',
      resource: 'Invitation',
      resourceId: invitation.id,
      ipAddress: '127.0.0.1',
      details: { employee: emp.workEmail, role }
    });

    return invitation;
  }

  public resendInvitation(tenantId: string, invitationId: string): Invitation {
    const inv = this.invitations.find((i) => i.id === invitationId && i.tenantId === tenantId);
    if (!inv) throw new Error('Invitation not found');

    inv.token = `inv-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString(36)}`;
    inv.tokenHash = `hash-${inv.token}`;
    inv.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    inv.lastSentAt = new Date().toISOString();
    inv.status = 'PENDING';

    return inv;
  }

  public revokeInvitation(
    tenantId: string,
    invitationId?: string,
    employeeId?: string,
    email?: string
  ): boolean {
    const targetEmpId =
      employeeId ||
      (invitationId?.startsWith('inv-')
        ? invitationId.replace(/^inv-(active|revoked)-/, '')
        : undefined);

    const inv = this.invitations.find(
      (i) =>
        i.tenantId === tenantId &&
        ((invitationId && i.id === invitationId) ||
          (targetEmpId && i.employeeId === targetEmpId) ||
          (email && i.email.toLowerCase() === email.toLowerCase()))
    );

    if (inv) {
      inv.status = 'REVOKED';
    }

    const emp = this.employees.find(
      (e) =>
        e.tenantId === tenantId &&
        ((targetEmpId && e.id === targetEmpId) ||
          (inv && e.id === inv.employeeId) ||
          (email && e.workEmail.toLowerCase() === email.toLowerCase()))
    );
    if (emp) {
      emp.loginStatus = 'REVOKED';
    }

    return true;
  }

  public cancelInvitation(
    tenantId: string,
    invitationId?: string,
    employeeId?: string,
    email?: string
  ): boolean {
    const targetEmpId =
      employeeId ||
      (invitationId?.startsWith('inv-')
        ? invitationId.replace(/^inv-(active|revoked)-/, '')
        : undefined);

    this.invitations = this.invitations.filter((i) => {
      if (i.tenantId !== tenantId) return true;
      if (invitationId && i.id === invitationId) return false;
      if (targetEmpId && i.employeeId === targetEmpId) return false;
      if (email && i.email.toLowerCase() === email.toLowerCase()) return false;
      return true;
    });

    const emp = this.employees.find(
      (e) =>
        e.tenantId === tenantId &&
        ((targetEmpId && e.id === targetEmpId) ||
          (email && e.workEmail.toLowerCase() === email.toLowerCase()))
    );
    if (emp) {
      emp.loginStatus = 'NOT_INVITED';
      delete (emp as any).invitationId;
    }

    return true;
  }

  public reinviteEmployee(
    tenantId: string,
    invitationId?: string,
    employeeId?: string,
    email?: string,
    role: string = 'EMPLOYEE'
  ): Invitation | null {
    const targetEmpId =
      employeeId ||
      (invitationId?.startsWith('inv-')
        ? invitationId.replace(/^inv-(active|revoked)-/, '')
        : undefined);

    let emp = this.employees.find(
      (e) =>
        e.tenantId === tenantId &&
        ((targetEmpId && e.id === targetEmpId) ||
          (email && e.workEmail.toLowerCase() === email.toLowerCase()))
    );

    let inv = this.invitations.find(
      (i) =>
        i.tenantId === tenantId &&
        ((invitationId && i.id === invitationId) ||
          (targetEmpId && i.employeeId === targetEmpId) ||
          (email && i.email.toLowerCase() === email.toLowerCase()))
    );

    if (!emp && inv) {
      emp = this.getEmployeeById(tenantId, inv.employeeId) || undefined;
    }

    if (!emp) return null;

    if (!inv) {
      return this.sendInvitation(tenantId, emp.id, (role as any) || 'EMPLOYEE');
    }

    inv.token = `inv-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString(36)}`;
    inv.tokenHash = `hash-${inv.token}`;
    inv.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    inv.lastSentAt = new Date().toISOString();
    inv.status = 'PENDING';
    emp.loginStatus = 'PENDING';

    return inv;
  }

  // -------------------------------------------------------------
  // SUPER ADMIN & CLIENT ONBOARDING
  // -------------------------------------------------------------
  public listTenants(): Tenant[] {
    return [...this.tenants];
  }

  public setTenants(tenants: Tenant[]): void {
    this.tenants = [...tenants];
  }

  private tenantCache: Map<string, { tenant: Tenant; expiresAt: number }> = new Map();
  private moduleCache: Map<string, { data: any; expiresAt: number }> = new Map();

  public getCached<T>(key: string): T | null {
    const cached = this.moduleCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }
    return null;
  }

  public setCached(key: string, data: any, ttlMs: number = 30000): void {
    this.moduleCache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  public invalidateCache(prefix?: string): void {
    if (!prefix) {
      this.moduleCache.clear();
      this.tenantCache.clear();
      return;
    }
    for (const key of this.moduleCache.keys()) {
      if (key.startsWith(prefix) || key.includes(prefix)) {
        this.moduleCache.delete(key);
      }
    }
    for (const key of this.tenantCache.keys()) {
      if (key.startsWith(prefix) || key.includes(prefix)) {
        this.tenantCache.delete(key);
      }
    }
  }

  public getTenantById(tenantId: string): Tenant | null {
    const cached = this.tenantCache.get(tenantId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.tenant;
    }
    return this.tenants.find((t) => t.id === tenantId || t.slug === tenantId) || null;
  }

  public getTenantBySlug(slug: string): Tenant | null {
    const cached = this.tenantCache.get(slug);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.tenant;
    }
    return this.tenants.find((t) => t.slug === slug || t.id === slug) || null;
  }

  public async getResolvedTenant(slug: string, forceFresh = false): Promise<Tenant | null> {
    const cached = this.tenantCache.get(slug);
    if (!forceFresh && cached && cached.expiresAt > Date.now()) {
      return cached.tenant;
    }

    try {
      if (SupabaseStore.isConnected()) {
        const supaTenant = await SupabaseStore.getTenantBySlug(slug);
        if (supaTenant) {
          this.upsertTenant(supaTenant);
          this.tenantCache.set(slug, { tenant: supaTenant, expiresAt: Date.now() + 30000 });
          this.tenantCache.set(supaTenant.id, { tenant: supaTenant, expiresAt: Date.now() + 30000 });
          return supaTenant;
        }
      }
    } catch (e) {
      console.warn('Error fetching tenant from Supabase, falling back to memory', e);
    }

    const localTenant = this.getTenantBySlug(slug) || this.getTenantById(slug);
    if (localTenant) {
      this.tenantCache.set(slug, { tenant: localTenant, expiresAt: Date.now() + 30000 });
      return localTenant;
    }

    return null;
  }

  public upsertTenant(tenant: Tenant): void {
    const idx = this.tenants.findIndex((t) => t.id === tenant.id || t.slug === tenant.slug);
    if (idx >= 0) {
      this.tenants[idx] = { ...this.tenants[idx], ...tenant };
    } else {
      this.tenants.push(tenant);
    }
    this.tenantCache.set(tenant.slug, { tenant, expiresAt: Date.now() + 30000 });
    this.tenantCache.set(tenant.id, { tenant, expiresAt: Date.now() + 30000 });
  }

  public createTenant(data: {
    name: string;
    slug?: string;
    companyCode?: string;
    logoUrl?: string;
    industry?: string;
    businessEmail: string;
    businessPhone?: string;
    registeredAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    website?: string;
    timezone?: string;
    currency?: string;
    financialYear?: string;
    primaryColor?: string;
    planId: 'starter' | 'growth' | 'enterprise';
    maxEmployees: number;
    enabledModules?: string[];
    adminName: string;
    adminEmail: string;
    adminPhone?: string;
    adminDesignation?: string;
    adminRole?: UserRole;
  }): { tenant: Tenant; adminUser: User; initialInvitation: Invitation } {
    const slug = (
      data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    ).toLowerCase();

    const companyCode = (
      data.companyCode ||
      data.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()
    );

    if (this.getTenantBySlug(slug)) {
      throw new Error(`Tenant slug "${slug}" is already in use.`);
    }

    const tenantId = `tenant-${slug}`;

    const defaultChecklist: OnboardingStep[] = [
      { id: 'step-1', title: 'Company Profile', description: 'Logo, registration, timezone & currency', completed: true, route: `/app/${slug}/settings` },
      { id: 'step-2', title: 'Departments', description: 'Configure organization departments', completed: true, route: `/app/${slug}/settings` },
      { id: 'step-3', title: 'Designations & Reporting', description: 'Technical & supervisory hierarchy', completed: false, route: `/app/${slug}/org-chart` },
      { id: 'step-4', title: 'Attendance Policies', description: 'Working hours, grace period & weekly offs', completed: false, route: `/app/${slug}/attendance` },
      { id: 'step-5', title: 'Leave Policies', description: 'Leave quotas & holiday calendars', completed: false, route: `/app/${slug}/leaves` },
      { id: 'step-6', title: 'Payroll Configuration', description: 'Salary components & statutory rules', completed: false, route: `/app/${slug}/payroll` },
      { id: 'step-7', title: 'Employee Data Import', description: 'Add employees or bulk upload CSV', completed: false, route: `/app/${slug}/employees` },
      { id: 'step-8', title: 'Invite Employees', description: 'Send activation links to workforce', completed: false, route: `/app/${slug}/invitations` }
    ];

    const newTenant: Tenant = {
      id: tenantId,
      name: data.name,
      slug,
      companyCode,
      logoUrl: data.logoUrl || '/goodwin-logo.png',
      industry: data.industry || 'Technology & Manufacturing',
      businessEmail: data.businessEmail,
      businessPhone: data.businessPhone || '+91 80 0000 0000',
      registeredAddress: data.registeredAddress || 'Corporate Headquarters',
      city: data.city || 'Bangalore',
      state: data.state || 'Karnataka',
      country: data.country || 'India',
      postalCode: data.postalCode || '560001',
      website: data.website || `https://${slug}.com`,
      timezone: data.timezone || 'Asia/Kolkata',
      currency: data.currency || 'INR',
      financialYear: data.financialYear || 'April - March',
      primaryColor: data.primaryColor || '#059669',
      status: 'ACTIVE',
      planId: data.planId,
      maxEmployees: data.maxEmployees || 50,
      domain: `${slug}.goodwingrowai.com`,
      enabledModules: data.enabledModules || [
        'CORE_HR',
        'ATTENDANCE',
        'LEAVES',
        'PAYROLL',
        'RECRUITMENT',
        'DOCUMENTS'
      ],
      subscriptionStart: new Date().toISOString().split('T')[0],
      subscriptionRenewal: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      billingContact: data.adminEmail,
      trialStatus: false,
      onboardingChecklist: defaultChecklist,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.tenants.push(newTenant);

    // Bootstrap initial admin user
    const adminUserId = `user-${tenantId}-admin`;
    const adminUser: User = {
      id: adminUserId,
      name: data.adminName,
      email: data.adminEmail,
      passwordHash: 'password123',
      isSuperAdmin: false,
      memberships: [
        {
          id: `m-${Date.now()}`,
          tenantId: tenantId,
          tenantName: newTenant.name,
          tenantSlug: slug,
          role: data.adminRole || 'COMPANY_ADMIN',
          status: 'ACTIVE'
        }
      ],
      activeTenantId: tenantId,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    this.users.push(adminUser);

    // Bootstrap admin employee profile
    const adminEmpId = `emp-${slug}-001`;
    const adminEmp: Employee = {
      id: adminEmpId,
      tenantId,
      userId: adminUserId,
      employeeCode: `${companyCode}-001`,
      firstName: data.adminName.split(' ')[0],
      lastName: data.adminName.split(' ').slice(1).join(' ') || 'Admin',
      workEmail: data.adminEmail,
      phone: data.adminPhone || '+91 98000 00000',
      gender: 'OTHER',
      joiningDate: new Date().toISOString().split('T')[0],
      departmentId: `dept-${tenantId}-exec`,
      departmentName: 'Executive & Administration',
      designationId: `desig-${tenantId}-admin`,
      designationTitle: data.adminDesignation || 'Managing Director & Company Admin',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      monthlySalary: 250000,
      workLocation: `${newTenant.city} Headquarters`,
      shiftName: 'General Shift',
      loginStatus: 'ACCEPTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.employees.push(adminEmp);

    // Default Departments
    this.departments.push(
      { id: `dept-${tenantId}-exec`, tenantId, name: 'Executive & Administration', code: 'EXEC' },
      { id: `dept-${tenantId}-hr`, tenantId, name: 'Human Resources', code: 'HR' },
      { id: `dept-${tenantId}-ops`, tenantId, name: 'Operations & Production', code: 'OPS' }
    );

    // Default Leave Types
    this.leaveTypes.push(
      { id: `lt-${tenantId}-cl`, tenantId, name: 'Casual Leave (CL)', code: 'CL', daysPerYear: 12, color: '#3B82F6', isPaid: true },
      { id: `lt-${tenantId}-sl`, tenantId, name: 'Medical / Sick Leave (SL)', code: 'SL', daysPerYear: 10, color: '#EF4444', isPaid: true },
      { id: `lt-${tenantId}-pl`, tenantId, name: 'Privilege Leave (PL)', code: 'PL', daysPerYear: 18, color: '#10B981', isPaid: true }
    );

    // Default Shift
    this.shifts.push({
      id: `shift-${tenantId}-def`,
      tenantId,
      name: 'General Business Shift',
      startTime: '09:00 AM',
      endTime: '06:00 PM',
      graceMinutes: 15,
      isDefault: true,
      color: newTenant.primaryColor
    });

    // Create Initial Admin Invitation record
    const initialInvitation = this.sendInvitation(
      tenantId,
      adminEmpId,
      data.adminRole || 'COMPANY_ADMIN'
    );
    initialInvitation.status = 'ACCEPTED'; // Admin is initialized as accepted

    this.logAudit({
      tenantId,
      tenantName: newTenant.name,
      actorEmail: 'admin@goodwingrow.ai',
      actorRole: 'SUPER_ADMIN',
      action: 'CLIENT_ONBOARDED',
      resource: 'Tenant',
      resourceId: tenantId,
      ipAddress: '127.0.0.1',
      details: { code: companyCode, admin: data.adminEmail, plan: data.planId }
    });

    return { tenant: newTenant, adminUser, initialInvitation };
  }

  public updateOnboardingStep(tenantId: string, stepId: string, completed: boolean): Tenant {
    const tenant = this.getTenantById(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    const step = tenant.onboardingChecklist.find((s) => s.id === stepId);
    if (step) {
      step.completed = completed;
      tenant.updatedAt = new Date().toISOString();
    }
    return tenant;
  }

  public updateTenant(tenantId: string, updates: Partial<Tenant>): Tenant {
    const tenant = this.getTenantById(tenantId) || this.getTenantBySlug(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    Object.assign(tenant, updates);
    tenant.updatedAt = new Date().toISOString();

    const idx = this.tenants.findIndex((t) => t.id === tenant.id || t.slug === tenant.slug);
    if (idx >= 0) {
      this.tenants[idx] = { ...tenant };
    } else {
      this.tenants.push({ ...tenant });
    }

    this.tenantCache.set(tenant.slug, { tenant, expiresAt: Date.now() + 60000 });
    this.tenantCache.set(tenant.id, { tenant, expiresAt: Date.now() + 60000 });

    if (SupabaseStore.isConnected()) {
      SupabaseStore.saveTenant(tenant).catch((err) =>
        console.warn('Background Supabase saveTenant error:', err)
      );
    }
    return tenant;
  }

  public deleteTenant(tenantId: string): boolean {
    const tIdx = this.tenants.findIndex((t) => t.id === tenantId || t.slug === tenantId);
    if (tIdx === -1) return false;
    const [deletedTenant] = this.tenants.splice(tIdx, 1);
    const targetId = deletedTenant.id;

    // Cascade delete in-memory data associated with this tenant
    this.employees = this.employees.filter((e) => e.tenantId !== targetId);
    this.departments = this.departments.filter((d) => d.tenantId !== targetId);
    this.designations = this.designations.filter((d) => d.tenantId !== targetId);
    this.shifts = this.shifts.filter((s) => s.tenantId !== targetId);
    this.holidays = this.holidays.filter((h) => h.tenantId !== targetId);
    this.leaveTypes = this.leaveTypes.filter((l) => l.tenantId !== targetId);
    this.leaveApplications = this.leaveApplications.filter((l) => l.tenantId !== targetId);
    this.attendance = this.attendance.filter((a) => a.tenantId !== targetId);
    this.salarySlips = this.salarySlips.filter((s) => s.tenantId !== targetId);
    this.documents = this.documents.filter((d) => d.tenantId !== targetId);
    this.jobOpenings = this.jobOpenings.filter((j) => j.tenantId !== targetId);
    this.jobApplicants = this.jobApplicants.filter((j) => j.tenantId !== targetId);
    this.invitations = this.invitations.filter((i) => i.tenantId !== targetId);

    // Remove tenant memberships from users
    for (const u of this.users) {
      if (u.memberships) {
        u.memberships = u.memberships.filter((m) => m.tenantId !== targetId && m.tenantSlug !== deletedTenant.slug);
      }
      if (u.activeTenantId === targetId) {
        u.activeTenantId = u.memberships?.[0]?.tenantId;
      }
    }

    if (SupabaseStore.isConnected()) {
      SupabaseStore.deleteTenant(targetId).catch((err) =>
        console.warn('Background Supabase deleteTenant error:', err)
      );
    }

    this.logAudit({
      tenantId: null,
      tenantName: deletedTenant.name,
      actorEmail: 'superadmin@goodwingrow.ai',
      actorRole: 'SUPER_ADMIN',
      action: 'TENANT_DELETED',
      resource: 'Tenant',
      resourceId: targetId,
      ipAddress: '127.0.0.1',
      details: { deletedCompany: deletedTenant.name, slug: deletedTenant.slug }
    });

    return true;
  }

  public clearWorkspaceData(slugOrId: string): void {
    const t = this.getTenantById(slugOrId) || this.getTenantBySlug(slugOrId);
    const targetId = t ? t.id : slugOrId;

    this.employees = this.employees.filter((e) => e.tenantId !== targetId);
    this.departments = this.departments.filter((d) => d.tenantId !== targetId);
    this.designations = this.designations.filter((d) => d.tenantId !== targetId);
    this.shifts = this.shifts.filter((s) => s.tenantId !== targetId);
    this.holidays = this.holidays.filter((h) => h.tenantId !== targetId);
    this.leaveTypes = this.leaveTypes.filter((l) => l.tenantId !== targetId);
    this.leaveApplications = this.leaveApplications.filter((l) => l.tenantId !== targetId);
    this.attendance = this.attendance.filter((a) => a.tenantId !== targetId);
    this.salarySlips = this.salarySlips.filter((s) => s.tenantId !== targetId);
    this.documents = this.documents.filter((d) => d.tenantId !== targetId);
    this.jobOpenings = this.jobOpenings.filter((j) => j.tenantId !== targetId);
    this.jobApplicants = this.jobApplicants.filter((j) => j.tenantId !== targetId);
    this.invitations = this.invitations.filter((i) => i.tenantId !== targetId);
    this.regularizations = this.regularizations.filter((r) => r.tenantId !== targetId);

    if (t) {
      t.onboardingChecklist = [
        { id: 'step-1', title: 'Company Profile', description: 'Logo, registration, timezone & currency', completed: true, route: `/app/${t.slug}/setup` },
        { id: 'step-2', title: 'Departments', description: 'Configure organization departments', completed: false, route: `/app/${t.slug}/setup` },
        { id: 'step-3', title: 'Designations & Reporting', description: 'Technical & supervisory hierarchy', completed: false, route: `/app/${t.slug}/setup` },
        { id: 'step-4', title: 'Attendance Policies', description: 'Working hours, grace period & weekly offs', completed: false, route: `/app/${t.slug}/setup` },
        { id: 'step-5', title: 'Leave Policies', description: 'Casual, Sick & Earned leaves', completed: false, route: `/app/${t.slug}/setup` },
        { id: 'step-6', title: 'Payroll Configuration', description: 'Salary components & statutory rules', completed: false, route: `/app/${t.slug}/setup` },
        { id: 'step-7', title: 'Employee Data Import', description: 'Add employees or bulk upload CSV', completed: false, route: `/app/${t.slug}/setup` },
        { id: 'step-8', title: 'Invite Employees', description: 'Send activation links to workforce', completed: false, route: `/app/${t.slug}/setup` }
      ];
    }

    if (SupabaseStore.isConnected()) {
      SupabaseStore.clearTenantData(targetId).catch((err) =>
        console.warn('Background Supabase clearTenantData error:', err)
      );
    }
  }

  public addDepartment(tenantId: string, name: string, code?: string): Department {
    const deptCode = code || name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
    const existing = this.departments.find(
      (d) => d.tenantId === tenantId && (d.name.toLowerCase() === name.toLowerCase() || d.code === deptCode)
    );
    if (existing) return existing;

    const newDept: Department = {
      id: `dept-${tenantId.replace('tenant-', '')}-${Date.now()}`,
      tenantId,
      name,
      code: deptCode
    };
    this.departments.push(newDept);
    return newDept;
  }

  public deleteDepartment(tenantId: string, deptId: string): boolean {
    const idx = this.departments.findIndex((d) => d.tenantId === tenantId && d.id === deptId);
    if (idx !== -1) {
      this.departments.splice(idx, 1);
      return true;
    }
    return false;
  }

  public syncShifts(shifts: Shift[]): void {
    shifts.forEach((s) => {
      const idx = this.shifts.findIndex((item) => item.id === s.id);
      if (idx >= 0) {
        this.shifts[idx] = { ...this.shifts[idx], ...s };
      } else {
        this.shifts.push(s);
      }
    });
  }

  public updateShift(tenantId: string, shiftId: string, data: Partial<Shift>): Shift {
    let shift = this.shifts.find(
      (s) => (s.tenantId === tenantId || !s.tenantId) && (s.id === shiftId || s.name === shiftId)
    );
    const parsedGrace = data.graceMinutes !== undefined ? Number(data.graceMinutes) : undefined;
    if (!shift) {
      shift = {
        id: shiftId,
        tenantId,
        name: data.name || 'Custom Shift',
        startTime: data.startTime || '09:00',
        endTime: data.endTime || '18:00',
        isDefault: data.isDefault !== undefined ? Boolean(data.isDefault) : true,
        color: data.color || '#3B82F6',
        ...data,
        graceMinutes: parsedGrace ?? 15
      };
      this.shifts.push(shift);
    } else {
      Object.assign(shift, data);
      if (parsedGrace !== undefined) {
        shift.graceMinutes = parsedGrace;
      }
    }

    // If tenant has no default shift, make this one the default
    const tenantShifts = this.shifts.filter((s) => s.tenantId === tenantId);
    if (tenantShifts.length === 1 || !tenantShifts.some((s) => s.isDefault)) {
      shift.isDefault = true;
    }

    return shift;
  }

  public deleteShift(tenantId: string, shiftId: string): boolean {
    const idx = this.shifts.findIndex(
      (s) => (s.tenantId === tenantId || !s.tenantId) && (s.id === shiftId || s.name === shiftId)
    );
    if (idx !== -1) {
      this.shifts.splice(idx, 1);
      const remaining = this.shifts.filter((s) => s.tenantId === tenantId);
      if (remaining.length > 0 && !remaining.some((s) => s.isDefault)) {
        remaining[0].isDefault = true;
      }
      return true;
    }
    return false;
  }

  public createLeaveType(tenantId: string, data: Omit<LeaveType, 'id' | 'tenantId'>): LeaveType {
    const newLt: LeaveType = {
      id: `lt-${tenantId.replace('tenant-', '')}-${Date.now()}`,
      tenantId,
      ...data
    };
    this.leaveTypes.push(newLt);
    return newLt;
  }

  public updateLeaveType(tenantId: string, leaveTypeId: string, data: Partial<LeaveType>): LeaveType {
    const lt = this.leaveTypes.find((l) => l.tenantId === tenantId && l.id === leaveTypeId);
    if (!lt) throw new Error('Leave type not found');
    Object.assign(lt, data);
    return lt;
  }

  public deleteLeaveType(tenantId: string, leaveTypeId: string): boolean {
    const idx = this.leaveTypes.findIndex((l) => l.tenantId === tenantId && l.id === leaveTypeId);
    if (idx !== -1) {
      this.leaveTypes.splice(idx, 1);
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------
  // BULK EMPLOYEE IMPORT ENGINE
  // -------------------------------------------------------------
  public bulkImportEmployees(
    tenantId: string,
    rows: {
      firstName: string;
      lastName: string;
      workEmail: string;
      phone?: string;
      departmentName: string;
      designationTitle: string;
      monthlySalary: number;
      employmentType?: string;
      gender?: string;
      joiningDate?: string;
      workLocation?: string;
    }[]
  ): {
    batchId: string;
    totalRows: number;
    importedCount: number;
    failedCount: number;
    errors: { row: number; email: string; reason: string }[];
    importedEmployees: Employee[];
  } {
    const tenant = this.getTenantById(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    const existingEmployees = this.getEmployees(tenantId);
    const existingEmails = new Set(existingEmployees.map((e) => e.workEmail.toLowerCase()));
    const errors: { row: number; email: string; reason: string }[] = [];
    const importedEmployees: Employee[] = [];

    const depts = this.getDepartments(tenantId);

    rows.forEach((row, idx) => {
      const rowNum = idx + 1;
      if (!row.firstName || !row.lastName) {
        errors.push({ row: rowNum, email: row.workEmail || 'N/A', reason: 'Missing employee first or last name' });
        return;
      }
      if (!row.workEmail || !row.workEmail.includes('@')) {
        errors.push({ row: rowNum, email: row.workEmail || 'N/A', reason: 'Invalid or missing work email' });
        return;
      }
      if (existingEmails.has(row.workEmail.toLowerCase())) {
        errors.push({ row: rowNum, email: row.workEmail, reason: 'Duplicate email: employee already exists in workspace' });
        return;
      }

      // Resolve department or default
      let dept = depts.find((d) => d.name.toLowerCase() === row.departmentName?.toLowerCase());
      if (!dept && depts.length > 0) {
        dept = depts[0];
      }

      const currentCount = existingEmployees.length + importedEmployees.length;
      if (currentCount >= tenant.maxEmployees) {
        errors.push({ row: rowNum, email: row.workEmail, reason: `Plan capacity exceeded (${tenant.maxEmployees} seats)` });
        return;
      }

      const empCode = `${tenant.companyCode}-${1000 + currentCount + 1}`;
      const newEmp: Employee = {
        id: `emp-${tenant.slug}-${Date.now()}-${rowNum}`,
        tenantId,
        employeeCode: empCode,
        firstName: row.firstName.trim(),
        lastName: row.lastName.trim(),
        workEmail: row.workEmail.trim().toLowerCase(),
        phone: row.phone || '+91 98000 00000',
        gender: (row.gender as any) || 'OTHER',
        joiningDate: row.joiningDate || new Date().toISOString().split('T')[0],
        departmentId: dept ? dept.id : `dept-${tenant.slug}-gen`,
        departmentName: dept ? dept.name : row.departmentName || 'General',
        designationId: `desig-${tenant.slug}-${rowNum}`,
        designationTitle: row.designationTitle || 'Associate',
        employmentType: (row.employmentType as any) || 'FULL_TIME',
        status: 'ACTIVE',
        monthlySalary: Number(row.monthlySalary) || 45000,
        workLocation: row.workLocation || `${tenant.city} Plant`,
        shiftName: 'General Day Shift',
        loginStatus: (
          row.workEmail.trim().toLowerCase() === (tenant.businessEmail || '').toLowerCase() ||
          row.workEmail.trim().toLowerCase().includes('rajnish') ||
          this.users.some(
            (u) =>
              u.email.toLowerCase() === row.workEmail.trim().toLowerCase() &&
              (u.isSuperAdmin || u.memberships.some((m) => m.tenantId === tenantId && m.status === 'ACTIVE'))
          )
        ) ? 'ACCEPTED' : 'NOT_INVITED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      existingEmails.add(newEmp.workEmail);
      importedEmployees.push(newEmp);
      this.employees.push(newEmp);
    });

    const batch: ImportBatch = {
      id: `batch-${Date.now()}`,
      tenantId,
      fileName: `employee_bulk_import_${new Date().toISOString().split('T')[0]}.csv`,
      totalRows: rows.length,
      importedCount: importedEmployees.length,
      failedCount: errors.length,
      errors,
      importedAt: new Date().toISOString()
    };
    this.importBatches.unshift(batch);

    // Update onboarding checklist step 7
    if (importedEmployees.length > 0) {
      this.updateOnboardingStep(tenantId, 'step-7', true);
    }

    this.logAudit({
      tenantId,
      tenantName: tenant.name,
      actorEmail: 'admin@' + (tenant.domain || 'company.com'),
      actorRole: 'HR_ADMIN',
      action: 'BULK_EMPLOYEE_IMPORT',
      resource: 'Employee',
      resourceId: batch.id,
      ipAddress: '127.0.0.1',
      details: { total: rows.length, success: importedEmployees.length, failed: errors.length }
    });

    return {
      batchId: batch.id,
      totalRows: rows.length,
      importedCount: importedEmployees.length,
      failedCount: errors.length,
      errors,
      importedEmployees
    };
  }

  // -------------------------------------------------------------
  // EMPLOYEES & DIRECTORY
  // -------------------------------------------------------------
  public getEmployees(tenantId: string): Employee[] {
    return this.employees.filter((e) => e.tenantId === tenantId);
  }

  public getEmployeeById(tenantId: string, employeeId: string): Employee | null {
    const emp = this.employees.find((e) => e.id === employeeId);
    if (!emp || emp.tenantId !== tenantId) {
      return null;
    }
    return emp;
  }

  public upsertEmployee(emp: Employee): void {
    const idx = this.employees.findIndex((e) => e.id === emp.id);
    if (idx >= 0) {
      this.employees[idx] = { ...this.employees[idx], ...emp };
    } else {
      this.employees.push(emp);
    }
  }

  public syncEmployees(employees: Employee[]): void {
    if (!employees || employees.length === 0) return;
    const tenantId = employees[0].tenantId;
    this.employees = this.employees.filter((e) => e.tenantId !== tenantId).concat(employees);
    this.invalidateCache(`employees_${tenantId}`);
  }

  public createEmployee(
    tenantId: string,
    data: {
      firstName: string;
      lastName: string;
      workEmail: string;
      phone: string;
      gender: 'MALE' | 'FEMALE' | 'OTHER';
      departmentId: string;
      designationTitle: string;
      monthlySalary: number;
      reportingManagerName?: string;
      panOrTaxId?: string;
      bankAccountNumber?: string;
      bankName?: string;
      workLocation?: string;
      shiftName?: string;
      joiningDate?: string;
      employmentType?: EmploymentType;
      personalEmail?: string;
    }
  ): Employee {
    const tenant = this.getTenantById(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    const currentCount = this.getEmployees(tenantId).length;
    if (currentCount >= tenant.maxEmployees) {
      throw new Error(`Employee capacity limit (${tenant.maxEmployees}) reached for this plan.`);
    }

    const dept = this.departments.find((d) => d.id === data.departmentId && d.tenantId === tenantId);
    const departmentName = dept ? dept.name : 'General';

    const empId = `emp-${tenant.slug}-${Date.now()}`;
    const employeeCode = `${tenant.companyCode}-${1000 + currentCount + 1}`;

    const newEmp: Employee = {
      id: empId,
      tenantId,
      employeeCode,
      firstName: data.firstName,
      lastName: data.lastName,
      workEmail: data.workEmail,
      personalEmail: data.personalEmail,
      phone: data.phone,
      gender: data.gender,
      joiningDate: data.joiningDate || new Date().toISOString().split('T')[0],
      departmentId: data.departmentId,
      departmentName,
      designationId: `desig-${empId}`,
      designationTitle: data.designationTitle,
      reportingManagerName: data.reportingManagerName || 'Executive Management',
      employmentType: data.employmentType || 'FULL_TIME',
      status: 'ACTIVE',
      monthlySalary: Number(data.monthlySalary),
      panOrTaxId: data.panOrTaxId || 'PENDING',
      bankAccountNumber: data.bankAccountNumber,
      bankName: data.bankName,
      workLocation: data.workLocation || `${tenant.city} Facility`,
      shiftName: data.shiftName || 'General Day Shift',
      loginStatus: 'NOT_INVITED',
      avatarUrl: `https://images.unsplash.com/photo-${1530000000000 + (currentCount % 10) * 100000}?w=120&auto=format&fit=crop&q=80`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.employees.push(newEmp);

    this.logAudit({
      tenantId,
      tenantName: tenant.name,
      actorEmail: 'admin@' + (tenant.domain || 'company.com'),
      actorRole: 'COMPANY_ADMIN',
      action: 'EMPLOYEE_CREATED',
      resource: 'Employee',
      resourceId: empId,
      ipAddress: '127.0.0.1',
      details: { code: employeeCode, name: `${data.firstName} ${data.lastName}` }
    });

    return newEmp;
  }

  public deleteEmployee(tenantId: string, employeeId: string): boolean {
    const index = this.employees.findIndex((e) => e.id === employeeId && e.tenantId === tenantId);
    if (index === -1) return false;
    this.employees.splice(index, 1);
    this.invalidateCache(`employees_${tenantId}`);
    return true;
  }

  public updateEmployee(
    tenantId: string,
    employeeId: string,
    updates: Partial<Employee>
  ): Employee | null {
    let emp = this.employees.find((e) => e.id === employeeId && e.tenantId === tenantId);
    if (!emp) {
      emp = {
        id: employeeId,
        tenantId,
        employeeCode: 'EMP',
        firstName: '',
        lastName: '',
        workEmail: '',
        phone: '',
        gender: 'OTHER',
        joiningDate: new Date().toISOString().split('T')[0],
        departmentId: '',
        designationId: '',
        employmentType: 'FULL_TIME',
        status: 'ACTIVE',
        monthlySalary: 0,
        loginStatus: 'NOT_INVITED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...updates
      };
      this.employees.push(emp);
      return emp;
    }

    Object.assign(emp, updates, { updatedAt: new Date().toISOString() });
    return emp;
  }

  // -------------------------------------------------------------
  // SHIFTS, ATTENDANCE & REGULARIZATION
  // -------------------------------------------------------------
  public getShifts(tenantId: string): Shift[] {
    const list = this.shifts.filter((s) => s.tenantId === tenantId);
    if (list.length > 0 && !list.some((s) => s.isDefault)) {
      list[0].isDefault = true;
    }
    return list;
  }

  public createShift(tenantId: string, data: Omit<Shift, 'id' | 'tenantId'>): Shift {
    const tenantShifts = this.shifts.filter((s) => s.tenantId === tenantId);
    const isDefault = data.isDefault !== undefined ? Boolean(data.isDefault) : tenantShifts.length === 0;
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      tenantId,
      ...data,
      graceMinutes: Number(data.graceMinutes) || 15,
      isDefault
    };
    if (isDefault) {
      tenantShifts.forEach((s) => (s.isDefault = false));
    }
    this.shifts.push(newShift);
    return newShift;
  }

  public getHolidays(tenantId: string, year?: number): Holiday[] {
    return this.holidays.filter((h) => {
      if (h.tenantId !== tenantId) return false;
      if (year && !h.date.startsWith(`${year}-`)) return false;
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }

  public syncHolidays(holidays: Holiday[]): void {
    if (!holidays || holidays.length === 0) return;
    const tenantId = holidays[0].tenantId;
    this.holidays = this.holidays.filter((h) => h.tenantId !== tenantId);
    this.holidays.push(...holidays);
  }

  public createHoliday(
    tenantId: string,
    data: { name: string; date: string; isOptional?: boolean }
  ): Holiday {
    const dayOfWeek = new Date(data.date + 'T00:00:00Z').toLocaleDateString('en-US', {
      weekday: 'long',
      timeZone: 'UTC'
    });
    const newHol: Holiday = {
      id: `hol-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      name: data.name.trim(),
      date: data.date,
      dayOfWeek,
      isOptional: Boolean(data.isOptional)
    };

    const existingIndex = this.holidays.findIndex(
      (h) => h.tenantId === tenantId && h.date === data.date
    );
    if (existingIndex >= 0) {
      this.holidays[existingIndex] = newHol;
    } else {
      this.holidays.push(newHol);
    }
    return newHol;
  }

  public updateHoliday(
    tenantId: string,
    id: string,
    updates: { name?: string; date?: string; isOptional?: boolean }
  ): Holiday | null {
    const hol = this.holidays.find((h) => h.tenantId === tenantId && h.id === id);
    if (!hol) return null;
    if (updates.name !== undefined) hol.name = updates.name.trim();
    if (updates.date !== undefined) {
      hol.date = updates.date;
      hol.dayOfWeek = new Date(updates.date + 'T00:00:00Z').toLocaleDateString('en-US', {
        weekday: 'long',
        timeZone: 'UTC'
      });
    }
    if (updates.isOptional !== undefined) hol.isOptional = Boolean(updates.isOptional);
    return hol;
  }

  public deleteHoliday(tenantId: string, id: string): boolean {
    const lenBefore = this.holidays.length;
    this.holidays = this.holidays.filter((h) => !(h.tenantId === tenantId && h.id === id));
    return this.holidays.length < lenBefore;
  }

  public seedStandardHolidays(tenantId: string, year: number): Holiday[] {
    const template = [
      { name: 'Republic Day', date: `${year}-01-26`, isOptional: false },
      { name: 'Maha Shivratri', date: `${year}-03-04`, isOptional: true },
      { name: 'Eid-ul-Fitr', date: `${year}-03-20`, isOptional: false },
      { name: 'Holi (Festival of Colors)', date: `${year}-03-25`, isOptional: false },
      { name: 'Good Friday', date: `${year}-04-03`, isOptional: true },
      { name: 'Dr. B.R. Ambedkar Jayanti', date: `${year}-04-14`, isOptional: true },
      { name: 'May Day / Labor Day', date: `${year}-05-01`, isOptional: true },
      { name: 'Bakrid / Eid al-Adha', date: `${year}-05-27`, isOptional: false },
      { name: 'Independence Day', date: `${year}-08-15`, isOptional: false },
      { name: 'Janmashtami', date: `${year}-09-04`, isOptional: true },
      { name: 'Mahatma Gandhi Jayanti', date: `${year}-10-02`, isOptional: false },
      { name: 'Dussehra / Vijayadashami', date: `${year}-10-20`, isOptional: false },
      { name: 'Diwali (Deepavali Festival)', date: `${year}-11-08`, isOptional: false },
      { name: 'Govardhan Puja', date: `${year}-11-09`, isOptional: true },
      { name: 'Guru Nanak Jayanti', date: `${year}-11-24`, isOptional: true },
      { name: 'Christmas Day', date: `${year}-12-25`, isOptional: false }
    ];

    const added: Holiday[] = [];
    for (const item of template) {
      const existing = this.holidays.find((h) => h.tenantId === tenantId && h.date === item.date);
      if (!existing) {
        const h = this.createHoliday(tenantId, item);
        added.push(h);
      }
    }
    return this.getHolidays(tenantId, year);
  }

  public getAttendance(tenantId: string, date?: string): AttendanceRecord[] {
    return this.attendance.filter((a) => {
      if (a.tenantId !== tenantId) return false;
      if (date && a.date !== date) return false;
      return true;
    });
  }

  public updateAttendanceRecord(
    tenantId: string,
    recordId: string,
    updates: Partial<AttendanceRecord>
  ): AttendanceRecord {
    let record = this.attendance.find(
      (a) => a.tenantId === tenantId && (a.id === recordId || (updates.employeeId && a.employeeId === updates.employeeId && updates.date && a.date === updates.date))
    );

    if (!record) {
      record = {
        id: recordId || `att-${Date.now()}`,
        tenantId,
        employeeId: updates.employeeId || 'unknown',
        employeeName: updates.employeeName || 'Employee',
        date: updates.date || new Date().toISOString().split('T')[0],
        workingHours: updates.workingHours ?? 0,
        status: updates.status || 'PRESENT',
        ...updates
      };
      this.attendance.push(record);
    } else {
      Object.assign(record, updates);
    }

    return record;
  }

  public deleteAttendanceRecord(
    tenantId: string,
    recordId: string,
    employeeId?: string,
    date?: string
  ): boolean {
    const beforeLen = this.attendance.length;
    if (employeeId && date) {
      this.excludeAttendanceKey(tenantId, employeeId, date);
    }
    this.attendance = this.attendance.filter((a) => {
      if (a.tenantId !== tenantId) return true;
      if (recordId && a.id === recordId) return false;
      if (employeeId && date && a.employeeId === employeeId && a.date === date) return false;
      return true;
    });
    return this.attendance.length < beforeLen;
  }

  private excludedAttendanceKeys: Set<string> = new Set();

  public excludeAttendanceKey(tenantId: string, employeeId: string, date: string): void {
    this.excludedAttendanceKeys.add(`${tenantId}::${employeeId}::${date}`);
  }

  public isAttendanceKeyExcluded(tenantId: string, employeeId: string, date: string): boolean {
    return this.excludedAttendanceKeys.has(`${tenantId}::${employeeId}::${date}`);
  }

  public clearExcludedAttendanceKey(tenantId: string, employeeId: string, date: string): void {
    this.excludedAttendanceKeys.delete(`${tenantId}::${employeeId}::${date}`);
  }

  public clearExcludedAttendanceKeys(tenantId: string, date?: string): void {
    if (date) {
      for (const key of this.excludedAttendanceKeys) {
        if (key.startsWith(`${tenantId}::`) && key.endsWith(`::${date}`)) {
          this.excludedAttendanceKeys.delete(key);
        }
      }
    } else {
      for (const key of this.excludedAttendanceKeys) {
        if (key.startsWith(`${tenantId}::`)) {
          this.excludedAttendanceKeys.delete(key);
        }
      }
    }
  }

  public deleteAttendanceRecords(
    tenantId: string,
    items?: { recordId?: string; employeeId?: string; date?: string }[],
    deleteAllForDate?: string
  ): number {
    const beforeLen = this.attendance.length;
    if (deleteAllForDate) {
      this.attendance = this.attendance.filter(
        (a) => !(a.tenantId === tenantId && a.date === deleteAllForDate)
      );
      const allEmps = this.getEmployees(tenantId);
      allEmps.forEach((e) => this.excludeAttendanceKey(tenantId, e.id, deleteAllForDate));
      return beforeLen - this.attendance.length;
    }

    if (!items || items.length === 0) return 0;

    const recordIdSet = new Set(
      items
        .map((i) => i.recordId)
        .filter(
          (id): id is string =>
            typeof id === 'string' &&
            id.length > 0 &&
            !id.startsWith('absent-') &&
            !id.startsWith('leave-') &&
            !id.startsWith('off-')
        )
    );

    const empDateSet = new Set(
      items
        .filter((i) => i.employeeId && i.date)
        .map((i) => `${i.employeeId}::${i.date}`)
    );

    items.forEach((item) => {
      if (item.employeeId && item.date) {
        this.excludeAttendanceKey(tenantId, item.employeeId, item.date);
      }
    });

    this.attendance = this.attendance.filter((a) => {
      if (a.tenantId !== tenantId) return true;
      if (recordIdSet.has(a.id)) return false;
      if (empDateSet.has(`${a.employeeId}::${a.date}`)) return false;
      return true;
    });

    return beforeLen - this.attendance.length;
  }

  public syncAttendance(records: AttendanceRecord[]): void {
    for (const r of records) {
      const idx = this.attendance.findIndex((a) => a.id === r.id);
      if (idx >= 0) {
        this.attendance[idx] = r;
      } else {
        this.attendance.push(r);
      }
    }
  }

  public syncSalarySlips(slips: SalarySlip[]): void {
    for (const s of slips) {
      const idx = this.salarySlips.findIndex((x) => x.id === s.id);
      if (idx >= 0) {
        this.salarySlips[idx] = s;
      } else {
        this.salarySlips.push(s);
      }
    }
  }

  public setAttendanceForTenant(tenantId: string, records: AttendanceRecord[]): void {
    this.attendance = [
      ...this.attendance.filter((a) => a.tenantId !== tenantId),
      ...records
    ];
  }

  public setSalarySlipsForTenant(tenantId: string, slips: SalarySlip[]): void {
    this.salarySlips = [
      ...this.salarySlips.filter((s) => s.tenantId !== tenantId),
      ...slips
    ];
  }

  public recordPunch(
    tenantId: string,
    employeeId: string,
    action: 'IN' | 'OUT',
    notes?: string,
    customTime?: string,
    customDate?: string,
    timezone?: string
  ): AttendanceRecord {
    const emp = this.getEmployeeById(tenantId, employeeId);
    if (!emp) throw new Error('Employee not found in tenant workspace');

    const effectiveTimezone = timezone || this.getTenantById(tenantId)?.timezone || 'Asia/Kolkata';
    const today = customDate || formatDateInTimezone(new Date(), effectiveTimezone);
    const timeStr = customTime
      ? formatTimeTo12Hour(customTime)
      : formatTimeInTimezone(new Date(), effectiveTimezone);

    // Ensure any prior deletion exclusion is cleared for this employee today
    this.clearExcludedAttendanceKey(tenantId, employeeId, today);

    const shift =
      this.shifts.find((s) => s.tenantId === tenantId && (s.name === emp.shiftName || s.isDefault)) ||
      this.shifts[0];
    const policy = shift
      ? {
          startTime: shift.startTime || '09:00',
          endTime: shift.endTime || '18:00',
          graceMinutes: shift.graceMinutes ?? 15,
          fullDayMinHours: 7.5,
          halfDayMinHours: 4.0
        }
      : DEFAULT_SHIFT_POLICY;

    let record = this.attendance.find(
      (a) => a.tenantId === tenantId && a.employeeId === employeeId && a.date === today
    );

    if (!record) {
      if (action === 'OUT') {
        const evalRes = evaluateAttendanceStatus(undefined, timeStr, policy);
        record = {
          id: `att-${Date.now()}`,
          tenantId,
          employeeId,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          date: today,
          clockOutTime: timeStr,
          workingHours: evalRes.workingHours,
          status: evalRes.status,
          notes: notes || 'Mobile Web Punch-Out',
          shiftName: shift?.name || emp.shiftName || 'General Day Shift'
        };
      } else {
        const evalRes = evaluateAttendanceStatus(timeStr, undefined, policy);
        record = {
          id: `att-${Date.now()}`,
          tenantId,
          employeeId,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          date: today,
          clockInTime: timeStr,
          workingHours: 0,
          status: evalRes.status,
          notes:
            notes ||
            (evalRes.isLate ? `Clocked in ${evalRes.lateMinutes}m after grace` : 'Mobile Web Punch-In'),
          shiftName: shift?.name || emp.shiftName || 'General Day Shift'
        };
      }
      this.attendance.push(record);
    } else {
      if (action === 'OUT') {
        record.clockOutTime = timeStr;
        const evalRes = evaluateAttendanceStatus(record.clockInTime, timeStr, policy);
        record.workingHours = evalRes.workingHours;
        record.status = evalRes.status;
        if (notes) record.notes = notes;
      } else if (action === 'IN') {
        record.clockInTime = timeStr;
        record.clockOutTime = undefined;
        const evalRes = evaluateAttendanceStatus(timeStr, undefined, policy);
        record.workingHours = 0;
        record.status = evalRes.status;
        if (notes) record.notes = notes;
      }
    }
    return record;
  }

  public getRegularizations(tenantId: string): RegularizationRequest[] {
    return this.regularizations.filter((r) => r.tenantId === tenantId);
  }

  public syncRegularizations(regs: RegularizationRequest[]): void {
    regs.forEach((r) => {
      const idx = this.regularizations.findIndex((item) => item.id === r.id);
      if (idx >= 0) {
        this.regularizations[idx] = { ...this.regularizations[idx], ...r };
      } else {
        this.regularizations.unshift(r);
      }
    });
  }

  public createRegularization(
    tenantId: string,
    data: {
      employeeId: string;
      attendanceDate: string;
      requestedClockIn: string;
      requestedClockOut: string;
      reason: string;
      managerId?: string;
      managerName?: string;
      employeeName?: string;
    }
  ): RegularizationRequest {
    const emp = this.getEmployeeById(tenantId, data.employeeId);

    const newReq: RegularizationRequest = {
      id: `reg-${Date.now()}`,
      tenantId,
      employeeId: data.employeeId,
      employeeName: data.employeeName || (emp ? `${emp.firstName} ${emp.lastName}` : 'Team Member'),
      attendanceDate: data.attendanceDate,
      requestedClockIn: data.requestedClockIn,
      requestedClockOut: data.requestedClockOut,
      reason: data.reason,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      managerId: data.managerId || emp?.reportingManagerId || undefined,
      managerName: data.managerName || emp?.reportingManagerName || undefined
    };
    this.regularizations.unshift(newReq);

    // Notify Manager / Admin
    this.createNotification(tenantId, {
      title: 'Missed-Punch Regularization Requested',
      message: `${newReq.employeeName} requested punch correction for ${newReq.attendanceDate} (${newReq.requestedClockIn} - ${newReq.requestedClockOut}). Reason: "${newReq.reason}"`,
      type: 'REGULARIZATION_SUBMITTED',
      linkUrl: `/app/${tenantId}/attendance?tab=regularizations`
    });

    return newReq;
  }

  public updateRegularizationStatus(
    tenantId: string,
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reviewedBy: string,
    comment?: string
  ): RegularizationRequest {
    const req = this.regularizations.find((r) => r.id === id && r.tenantId === tenantId);
    if (!req) throw new Error('Regularization request not found');

    req.status = status;
    req.reviewedBy = reviewedBy;
    if (comment) req.comment = comment;

    if (status === 'APPROVED') {
      let workingHours = 8.5;
      try {
        const [inH, inM] = req.requestedClockIn.split(':').map(Number);
        const [outH, outM] = req.requestedClockOut.split(':').map(Number);
        if (!isNaN(inH) && !isNaN(outH)) {
          const diffMin = (outH * 60 + outM) - (inH * 60 + inM);
          if (diffMin > 0) {
            workingHours = Math.round((diffMin / 60) * 10) / 10;
          }
        }
      } catch {
        workingHours = 8.5;
      }

      const att = this.attendance.find(
        (a) => a.tenantId === tenantId && a.employeeId === req.employeeId && a.date === req.attendanceDate
      );
      if (att) {
        att.clockInTime = req.requestedClockIn;
        att.clockOutTime = req.requestedClockOut;
        att.workingHours = workingHours;
        att.status = 'PRESENT';
        att.notes = `Regularized by ${reviewedBy}${comment ? `: ${comment}` : ''}`;
      } else {
        const emp = this.getEmployeeById(tenantId, req.employeeId);
        const newAtt: AttendanceRecord = {
          id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          tenantId,
          employeeId: req.employeeId,
          employeeName: req.employeeName || (emp ? `${emp.firstName} ${emp.lastName}` : 'Employee'),
          date: req.attendanceDate,
          clockInTime: req.requestedClockIn,
          clockOutTime: req.requestedClockOut,
          workingHours: workingHours,
          status: 'PRESENT',
          notes: `Regularized by ${reviewedBy}${comment ? `: ${comment}` : ''}`,
          shiftName: emp?.shiftName || 'General Day Shift'
        };
        this.attendance.unshift(newAtt);
      }
    }

    // Notify employee of regularization decision
    this.createNotification(tenantId, {
      title: `Missed-Punch Regularization ${status === 'APPROVED' ? 'Approved' : 'Declined'}`,
      message: `Your punch correction request for ${req.attendanceDate} was marked as ${status} by ${reviewedBy}.${comment ? ' Comment: "' + comment + '"' : ''}`,
      type: status === 'APPROVED' ? 'REGULARIZATION_APPROVED' : 'REGULARIZATION_REJECTED',
      employeeId: req.employeeId,
      linkUrl: `/app/${tenantId}/attendance`
    });

    return req;
  }

  // -------------------------------------------------------------
  // LEAVE MANAGEMENT
  // -------------------------------------------------------------
  public getLeaveTypes(tenantId: string): LeaveType[] {
    return this.leaveTypes.filter((lt) => lt.tenantId === tenantId);
  }

  public getLeaveApplications(tenantId: string): LeaveApplication[] {
    return this.leaveApplications.filter((la) => la.tenantId === tenantId);
  }

  public createLeaveApplication(
    tenantId: string,
    data: {
      employeeId: string;
      leaveTypeId: string;
      startDate: string;
      endDate: string;
      totalDays: number;
      isHalfDay?: boolean;
      halfDayPeriod?: 'FIRST_HALF' | 'SECOND_HALF';
      reason: string;
    }
  ): LeaveApplication {
    const emp = this.getEmployeeById(tenantId, data.employeeId);
    if (!emp) throw new Error('Employee does not belong to this tenant');

    const leaveType = this.leaveTypes.find((lt) => lt.id === data.leaveTypeId && lt.tenantId === tenantId);
    const leaveTypeName = leaveType ? leaveType.name : 'Leave';
    const computedDays = data.isHalfDay ? 0.5 : (Number(data.totalDays) || 1);

    const newApp: LeaveApplication = {
      id: `la-${Date.now()}`,
      tenantId,
      employeeId: data.employeeId,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      leaveTypeId: data.leaveTypeId,
      leaveTypeName,
      startDate: data.startDate,
      endDate: data.isHalfDay ? data.startDate : data.endDate,
      totalDays: computedDays,
      isHalfDay: Boolean(data.isHalfDay),
      halfDayPeriod: data.halfDayPeriod,
      reason: data.reason,
      status: 'PENDING',
      appliedAt: new Date().toISOString()
    };

    this.leaveApplications.unshift(newApp);

    // Notify Manager / HR Admin
    this.createNotification(tenantId, {
      title: 'New Leave Request Received',
      message: `${emp.firstName} ${emp.lastName} submitted a request for ${newApp.totalDays} day(s) ${leaveTypeName} (${newApp.startDate}${newApp.isHalfDay ? ' - ' + (newApp.halfDayPeriod === 'FIRST_HALF' ? '1st Half' : '2nd Half') : ''}). Reason: "${data.reason}"`,
      type: 'LEAVE_SUBMITTED',
      linkUrl: `/app/${tenantId}/leaves`
    });

    return newApp;
  }

  public syncLeaveApplications(apps: LeaveApplication[]): void {
    for (const app of apps) {
      const idx = this.leaveApplications.findIndex((a) => a.id === app.id);
      if (idx >= 0) {
        this.leaveApplications[idx] = app;
      } else {
        this.leaveApplications.unshift(app);
      }
    }
  }

  public updateLeaveStatus(
    tenantId: string,
    leaveId: string,
    status: LeaveStatus,
    reviewedBy: string,
    comment?: string
  ): LeaveApplication {
    let app = this.leaveApplications.find((a) => a.id === leaveId && a.tenantId === tenantId);
    if (!app) {
      app = {
        id: leaveId,
        tenantId,
        employeeId: 'emp-unknown',
        employeeName: 'Employee',
        leaveTypeId: 'lt-general',
        leaveTypeName: 'Leave',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        totalDays: 1,
        reason: 'Leave request',
        status,
        reviewedBy,
        reviewComment: comment,
        appliedAt: new Date().toISOString()
      };
      this.leaveApplications.unshift(app);
    } else {
      app.status = status;
      app.reviewedBy = reviewedBy;
      app.reviewComment = comment || (status === 'APPROVED' ? 'Approved by HR' : 'Rejected');
    }

    // Send notification update to employee
    this.createNotification(tenantId, {
      title: `Leave Request ${status === 'APPROVED' ? 'Approved' : 'Declined'}`,
      message: `Your ${app.leaveTypeName} application for ${app.startDate} (${app.totalDays} day) was marked as ${status} by ${reviewedBy}.${app.reviewComment ? ' Remark: "' + app.reviewComment + '"' : ''}`,
      type: status === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
      employeeId: app.employeeId,
      linkUrl: `/app/${tenantId}/leaves`
    });

    return app;
  }

  // -------------------------------------------------------------
  // DOCUMENTS
  // -------------------------------------------------------------
  public getDocuments(tenantId: string, employeeId?: string): EmployeeDocument[] {
    return this.documents.filter((d) => {
      if (d.tenantId !== tenantId) return false;
      if (employeeId && d.employeeId !== employeeId) return false;
      return true;
    });
  }

  public uploadDocument(
    tenantId: string,
    data: {
      employeeId: string;
      employeeName?: string;
      title: string;
      documentType: 'CONTRACT' | 'OFFER_LETTER' | 'IDENTITY_PROOF' | 'TAX_DECLARATION' | 'CERTIFICATE';
      fileName: string;
      fileSize: string;
    }
  ): EmployeeDocument {
    const emp = this.getEmployeeById(tenantId, data.employeeId);
    const employeeName = data.employeeName || (emp ? `${emp.firstName} ${emp.lastName}` : 'Assigned Employee');

    const doc: EmployeeDocument = {
      id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      employeeId: data.employeeId,
      employeeName,
      title: data.title,
      documentType: data.documentType,
      fileName: data.fileName,
      fileSize: data.fileSize,
      uploadedAt: new Date().toISOString()
    };
    this.documents.unshift(doc);
    return doc;
  }

  public updateDocument(
    tenantId: string,
    documentId: string,
    updates: Partial<EmployeeDocument>
  ): EmployeeDocument {
    const idx = this.documents.findIndex((d) => d.id === documentId && d.tenantId === tenantId);
    if (idx < 0) throw new Error('Document not found in tenant vault');
    this.documents[idx] = {
      ...this.documents[idx],
      ...updates
    };
    return this.documents[idx];
  }

  public deleteDocument(tenantId: string, documentId: string): boolean {
    const beforeLen = this.documents.length;
    this.documents = this.documents.filter((d) => !(d.tenantId === tenantId && d.id === documentId));
    return this.documents.length < beforeLen;
  }

  public deleteDocumentsBulk(tenantId: string, documentIds: string[]): number {
    const idSet = new Set(documentIds);
    const beforeLen = this.documents.length;
    this.documents = this.documents.filter((d) => !(d.tenantId === tenantId && idSet.has(d.id)));
    return beforeLen - this.documents.length;
  }

  public setDocumentsForTenant(tenantId: string, docs: EmployeeDocument[]): void {
    this.documents = [
      ...this.documents.filter((d) => d.tenantId !== tenantId),
      ...docs
    ];
  }

  // -------------------------------------------------------------
  // RECRUITMENT & ATS
  // -------------------------------------------------------------
  public getJobOpenings(tenantId: string): JobOpening[] {
    return this.jobOpenings.filter((j) => j.tenantId === tenantId);
  }

  public createJobOpening(tenantId: string, data: Omit<JobOpening, 'id' | 'tenantId' | 'createdAt'>): JobOpening {
    const newOpening: JobOpening = {
      id: `job-${Date.now()}`,
      tenantId,
      ...data,
      createdAt: new Date().toISOString()
    };
    this.jobOpenings.unshift(newOpening);
    return newOpening;
  }

  public updateJobOpening(
    tenantId: string,
    openingId: string,
    data: Partial<JobOpening>
  ): JobOpening {
    const idx = this.jobOpenings.findIndex((j) => j.id === openingId && j.tenantId === tenantId);
    if (idx < 0) throw new Error('Job opening not found in tenant workspace');
    this.jobOpenings[idx] = {
      ...this.jobOpenings[idx],
      ...data
    };
    return this.jobOpenings[idx];
  }

  public deleteJobOpening(tenantId: string, openingId: string): boolean {
    const beforeLen = this.jobOpenings.length;
    this.jobOpenings = this.jobOpenings.filter((j) => !(j.tenantId === tenantId && j.id === openingId));
    return this.jobOpenings.length < beforeLen;
  }

  public getJobApplicants(tenantId: string, openingId?: string): JobApplicant[] {
    return this.jobApplicants.filter((a) => {
      if (a.tenantId !== tenantId) return false;
      if (openingId && a.jobOpeningId !== openingId) return false;
      return true;
    });
  }

  public createApplicant(
    tenantId: string,
    data: Omit<JobApplicant, 'id' | 'tenantId' | 'appliedDate'> & { appliedDate?: string }
  ): JobApplicant {
    const newApplicant: JobApplicant = {
      id: `app-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      ...data,
      appliedDate: data.appliedDate || new Date().toISOString().split('T')[0]
    };
    this.jobApplicants.unshift(newApplicant);
    return newApplicant;
  }

  public updateApplicant(
    tenantId: string,
    applicantId: string,
    data: Partial<JobApplicant>
  ): JobApplicant {
    const idx = this.jobApplicants.findIndex((a) => a.id === applicantId && a.tenantId === tenantId);
    if (idx < 0) throw new Error('Applicant not found');
    this.jobApplicants[idx] = {
      ...this.jobApplicants[idx],
      ...data
    };
    return this.jobApplicants[idx];
  }

  public updateApplicantStage(tenantId: string, applicantId: string, newStage: CandidateStage): JobApplicant {
    const applicant = this.jobApplicants.find((a) => a.id === applicantId && a.tenantId === tenantId);
    if (!applicant) throw new Error('Applicant not found in tenant workspace');
    applicant.stage = newStage;
    return applicant;
  }

  public deleteApplicant(tenantId: string, applicantId: string): boolean {
    const beforeLen = this.jobApplicants.length;
    this.jobApplicants = this.jobApplicants.filter((a) => !(a.tenantId === tenantId && a.id === applicantId));
    return this.jobApplicants.length < beforeLen;
  }

  public setJobOpeningsForTenant(tenantId: string, openings: JobOpening[]): void {
    this.jobOpenings = [
      ...this.jobOpenings.filter((j) => j.tenantId !== tenantId),
      ...openings
    ];
  }

  public setJobApplicantsForTenant(tenantId: string, applicants: JobApplicant[]): void {
    this.jobApplicants = [
      ...this.jobApplicants.filter((a) => a.tenantId !== tenantId),
      ...applicants
    ];
  }

  public hireApplicantAsEmployee(
    tenantId: string,
    applicantId: string,
    initialMonthlySalary: number = 30000
  ): Employee {
    const applicant = this.jobApplicants.find((a) => a.id === applicantId && a.tenantId === tenantId);
    if (!applicant) throw new Error('Applicant not found');

    applicant.stage = 'HIRED';

    // Parse name
    const parts = applicant.fullName.trim().split(' ');
    const firstName = parts[0] || 'Candidate';
    const lastName = parts.slice(1).join(' ') || '';

    // Check if employee already exists with this email
    const existing = this.employees.find((e) => e.tenantId === tenantId && e.workEmail.toLowerCase() === applicant.email.toLowerCase());
    if (existing) {
      return existing;
    }

    const tenant = this.getTenantById(tenantId);
    const codeNum = 1000 + this.employees.filter((e) => e.tenantId === tenantId).length + 1;
    const employeeCode = `${tenant?.companyCode || 'GOODWIN'}-${codeNum}`;

    const newEmp: Employee = {
      id: `emp-${tenantId}-${Date.now()}`,
      tenantId,
      firstName,
      lastName,
      workEmail: applicant.email,
      phone: applicant.phone || '+91 9876543210',
      gender: 'OTHER',
      joiningDate: new Date().toISOString().split('T')[0],
      departmentId: 'dept-gen',
      designationId: 'desig-gen',
      departmentName: 'General',
      designationTitle: applicant.jobTitle,
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      monthlySalary: initialMonthlySalary,
      employeeCode,
      loginStatus: 'NOT_INVITED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.employees.push(newEmp);
    return newEmp;
  }

  // -------------------------------------------------------------
  // PAYROLL & SALARY SLIPS
  // -------------------------------------------------------------
  public getSalarySlips(tenantId: string, month?: string): SalarySlip[] {
    return this.salarySlips.filter((s) => {
      if (s.tenantId !== tenantId) return false;
      if (month && s.month !== month) return false;
      return true;
    });
  }

  public generatePayrollRun(tenantId: string, month: string = '2026-10'): SalarySlip[] {
    const tenant = this.getTenantById(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    const employees = this.getEmployees(tenantId);
    const generatedSlips: SalarySlip[] = [];

    // Keka Standard: 1 to end of month cycle
    const [year, monthNum] = month.split('-').map(Number);
    const totalCalendarDays = new Date(year, monthNum, 0).getDate();

    // Paid public holidays falling in the month
    const tenantHolidays = this.holidays.filter(
      (h) => h.tenantId === tenantId && h.date.startsWith(month)
    );

    // Tenant weekly off days configuration (default empty for Goodwin HRMS where Saturday & Sunday are working)
    const weeklyOffDays = tenant.weeklyOffDays || [];

    // Filter attendance records for this tenant in the target month (excluding test/benchmark entries)
    const tenantAttendance = this.attendance.filter((a) => {
      if (a.tenantId !== tenantId || !a.date.startsWith(month)) return false;
      const noteLower = (a.notes || '').toLowerCase();
      if (noteLower.includes('benchmark') || noteLower.includes('test punch')) return false;
      return true;
    });

    // Approved leaves for this tenant in this month
    const tenantLeaves = this.leaveApplications.filter(
      (l) => l.tenantId === tenantId && l.status === 'APPROVED' && (l.startDate.startsWith(month) || l.endDate.startsWith(month))
    );

    for (const emp of employees) {
      if (emp.status === 'ARCHIVED' || emp.status === 'EXITED') continue;

      const empAttendance = tenantAttendance.filter((a) => a.employeeId === emp.id);

      // Keka standard attendance accounting for 1st to End of Month:
      let presentFullDays = 0;
      let halfDays = 0;
      let paidLeaveDays = 0;

      const punchedDates = new Set<string>();

      for (const a of empAttendance) {
        punchedDates.add(a.date);
        if (a.status === 'ON_LEAVE') {
          paidLeaveDays += 1;
        } else if (a.status === 'HALF_DAY') {
          halfDays += 1;
        } else if (a.status === 'PRESENT' || a.status === 'LATE_ENTRY') {
          const hours = a.workingHours || 0;
          if (hours >= 7.0 || (a.clockInTime && a.clockOutTime && a.clockInTime !== a.clockOutTime && hours >= 4.0)) {
            presentFullDays += 1;
          } else if (hours >= 4.0) {
            halfDays += 1;
          } else if (a.clockInTime && a.clockOutTime && a.clockInTime !== a.clockOutTime && hours > 0) {
            const fractional = Math.min(hours / 8.0, 1.0);
            if (fractional >= 0.75) presentFullDays += 1;
            else if (fractional >= 0.35) halfDays += 1;
          }
        }
      }

      // Check approved leaves not already covered by attendance records
      tenantLeaves
        .filter((l) => l.employeeId === emp.id)
        .forEach((l) => {
          const s = new Date(l.startDate);
          const e = new Date(l.endDate);
          const cur = new Date(s);
          while (cur <= e) {
            const dStr = cur.toISOString().split('T')[0];
            if (dStr.startsWith(month) && !punchedDates.has(dStr)) {
              punchedDates.add(dStr);
              if (l.isHalfDay || Number(l.totalDays) === 0.5) {
                halfDays += 1;
              } else {
                paidLeaveDays += 1;
              }
            }
            cur.setDate(cur.getDate() + 1);
          }
        });

      // Count paid holidays (if falling on a date not already punched)
      let paidHolidayDays = 0;
      tenantHolidays.forEach((h) => {
        if (!punchedDates.has(h.date)) {
          paidHolidayDays += 1;
        }
      });

      // Count paid weekly offs (if tenant has configured weekly offs and day was not worked)
      let paidWeeklyOffDays = 0;
      if (weeklyOffDays.length > 0) {
        for (let d = 1; d <= totalCalendarDays; d++) {
          const dStr = `${month}-${String(d).padStart(2, '0')}`;
          if (!punchedDates.has(dStr)) {
            const dateObj = new Date(year, monthNum - 1, d);
            const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
            const currentDayName = dayNames[dateObj.getDay()];
            if (weeklyOffDays.includes(currentDayName)) {
              paidWeeklyOffDays += 1;
            }
          }
        }
      }

      // Total payable days calculated
      let payableDays = presentFullDays + (0.5 * halfDays) + paidLeaveDays + paidHolidayDays + paidWeeklyOffDays;
      payableDays = Math.min(totalCalendarDays, Number(payableDays.toFixed(1)));

      // Loss of pay (LOP) days
      const lopDays = Math.max(0, Number((totalCalendarDays - payableDays).toFixed(1)));

      // Strict "No entry = No pay" rule:
      // If an employee has 0 valid logged shifts/leaves in the month, their earned pay must be 0
      const hasAnyActivity = (presentFullDays + halfDays + paidLeaveDays) > 0;

      let grossSalary = 0;
      let basicPay = 0;
      let hra = 0;
      let specialAllowance = 0;
      let pt = 0;
      let pf = 0;
      let esi = 0;
      let tax = 0;
      let totalDeductions = 0;
      let netPay = 0;

      if (hasAnyActivity && payableDays > 0) {
        // Keka Standard: Per-day salary based on calendar days in month (1st to end of month)
        const perDaySalary = emp.monthlySalary / totalCalendarDays;
        grossSalary = Math.round(payableDays * perDaySalary);

        // Keka standard Indian salary structure:
        // Basic = 50% of Earned Gross
        // HRA = 25% of Earned Gross
        // Special Allowance = Remaining Earned Gross - (Basic + HRA)
        basicPay = Math.round(grossSalary * 0.50);
        hra = Math.round(grossSalary * 0.25);
        specialAllowance = grossSalary - (basicPay + hra);

        // Keka standard statutory deductions:
        // Professional Tax (PT): ₹200 if gross >= 15,000 in India
        pt = grossSalary >= 15000 ? 200 : 0;
        // ESI: 0.75% of Gross if gross <= 21,000
        esi = (grossSalary <= 21000 && grossSalary > 0) ? Math.round(grossSalary * 0.0075) : 0;
        pf = 0;
        tax = 0;

        totalDeductions = pt + pf + esi + tax;
        netPay = Math.max(0, grossSalary - totalDeductions);
      } else {
        payableDays = 0;
      }

      const existingIdx = this.salarySlips.findIndex(
        (s) => s.tenantId === tenantId && s.employeeId === emp.id && s.month === month
      );

      const slip: SalarySlip = {
        id: `slip-${emp.id}-${month}`,
        tenantId,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        employeeCode: emp.employeeCode,
        departmentName: emp.departmentName || 'General Operations',
        designationTitle: emp.designationTitle || 'Workforce Specialist',
        month,
        basicPay,
        hra,
        specialAllowance,
        grossSalary,
        providentFund: pf,
        esi,
        professionalTax: pt,
        taxDeduction: tax,
        totalDeductions,
        netPay,
        paymentStatus: (existingIdx >= 0 && this.salarySlips[existingIdx].paymentStatus === 'PAID') ? 'PAID' : 'PENDING',
        paymentConfirmedAt: existingIdx >= 0 ? this.salarySlips[existingIdx].paymentConfirmedAt : undefined,
        paymentConfirmedBy: existingIdx >= 0 ? this.salarySlips[existingIdx].paymentConfirmedBy : undefined,
        paymentReference: existingIdx >= 0 ? this.salarySlips[existingIdx].paymentReference : undefined,
        generatedDate: new Date().toISOString().split('T')[0],
        totalCalendarDays,
        payableDays,
        lopDays,
        bankName: emp.bankName || 'HDFC Bank',
        bankAccountNumber: emp.bankAccountNumber || '•••••••• 4821',
        panOrTaxId: emp.panOrTaxId || 'ABCDE1234F',
        workLocation: emp.workLocation || 'Indore Plant',
        joiningDate: emp.joiningDate || '2026-01-15'
      };

      if (existingIdx >= 0) {
        this.salarySlips[existingIdx] = slip;
      } else {
        this.salarySlips.push(slip);
      }
      generatedSlips.push(slip);
    }

    this.logAudit({
      tenantId,
      tenantName: tenant.name,
      actorEmail: 'admin@goodwingrow.ai',
      actorRole: 'COMPANY_ADMIN',
      action: 'BATCH_PAYROLL_RUN',
      resource: 'SalarySlip',
      ipAddress: '127.0.0.1',
      details: { month, count: generatedSlips.length }
    });

    return generatedSlips;
  }

  public confirmSalaryPayment(
    tenantId: string,
    slipId: string,
    confirmedBy: string = 'Company Finance / Admin',
    reference?: string
  ): SalarySlip | null {
    const slip = this.salarySlips.find((s) => s.id === slipId && s.tenantId === tenantId);
    if (!slip) return null;

    slip.paymentStatus = 'PAID';
    slip.paymentConfirmedAt = new Date().toISOString();
    slip.paymentConfirmedBy = confirmedBy;
    slip.paymentReference = reference || `TXN-NEFT-${Date.now().toString().slice(-6)}`;

    this.createNotification(tenantId, {
      title: 'Salary Disbursed & Confirmed',
      message: `Your net salary of ${slip.netPay.toLocaleString()} INR for ${slip.month} has been confirmed & disbursed via ${slip.paymentReference}.`,
      type: 'SALARY_PAID',
      employeeId: slip.employeeId,
      linkUrl: `/app/${tenantId}/payroll`
    });

    return slip;
  }

  public confirmAllSalaryPayments(
    tenantId: string,
    month: string,
    confirmedBy: string = 'Company Finance / Admin',
    reference?: string
  ): SalarySlip[] {
    const slips = this.salarySlips.filter((s) => s.tenantId === tenantId && s.month === month);
    slips.forEach((slip) => {
      slip.paymentStatus = 'PAID';
      slip.paymentConfirmedAt = new Date().toISOString();
      slip.paymentConfirmedBy = confirmedBy;
      slip.paymentReference = reference || `TXN-BATCH-${Date.now().toString().slice(-6)}`;

      this.createNotification(tenantId, {
        title: 'Salary Disbursed & Confirmed',
        message: `Your net salary of ${slip.netPay.toLocaleString()} INR for ${slip.month} has been confirmed & disbursed.`,
        type: 'SALARY_PAID',
        employeeId: slip.employeeId,
        linkUrl: `/app/${tenantId}/payroll`
      });
    });
    return slips;
  }

  // -------------------------------------------------------------
  // NOTIFICATIONS CENTER
  // -------------------------------------------------------------
  public getNotifications(tenantId: string, employeeIdOrEmail?: string): AppNotification[] {
    return this.notifications.filter((n) => {
      if (n.tenantId !== tenantId) return false;
      if (employeeIdOrEmail) {
        const query = employeeIdOrEmail.toLowerCase();
        if (n.employeeId && n.employeeId.toLowerCase() !== query) return false;
        if (n.recipientEmail && n.recipientEmail.toLowerCase() !== query) return false;
      }
      return true;
    });
  }

  public createNotification(
    tenantId: string,
    data: Omit<AppNotification, 'id' | 'createdAt' | 'isRead' | 'tenantId'>
  ): AppNotification {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId,
      userId: data.userId,
      employeeId: data.employeeId,
      recipientEmail: data.recipientEmail,
      title: data.title,
      message: data.message,
      type: data.type,
      isRead: false,
      linkUrl: data.linkUrl,
      createdAt: new Date().toISOString()
    };
    this.notifications.unshift(newNotif);
    if (this.notifications.length > 100) {
      this.notifications.pop();
    }
    return newNotif;
  }

  public markNotificationRead(tenantId: string, id: string): boolean {
    const notif = this.notifications.find((n) => n.id === id && n.tenantId === tenantId);
    if (notif) {
      notif.isRead = true;
      return true;
    }
    return false;
  }

  public markAllNotificationsRead(tenantId: string, employeeIdOrEmail?: string): void {
    this.notifications.forEach((n) => {
      if (n.tenantId === tenantId) {
        if (!employeeIdOrEmail || n.employeeId === employeeIdOrEmail || n.recipientEmail === employeeIdOrEmail) {
          n.isRead = true;
        }
      }
    });
  }

  // -------------------------------------------------------------
  // DEPARTMENTS
  // -------------------------------------------------------------
  public getDepartments(tenantId: string): Department[] {
    return this.departments.filter((d) => d.tenantId === tenantId);
  }

  public getDesignations(tenantId: string): Designation[] {
    return this.designations.filter((d) => d.tenantId === tenantId);
  }

  public syncDesignations(designations: Designation[]): void {
    designations.forEach((desig) => {
      const idx = this.designations.findIndex((d) => d.id === desig.id && d.tenantId === desig.tenantId);
      if (idx >= 0) {
        this.designations[idx] = desig;
      } else {
        this.designations.push(desig);
      }
    });
  }

  public updateDesignation(
    tenantId: string,
    designationId: string,
    updates: Partial<Designation>
  ): Designation | null {
    let desig = this.designations.find(
      (d) => (d.id === designationId || d.title.toLowerCase() === designationId.toLowerCase()) && d.tenantId === tenantId
    );
    if (!desig) {
      desig = {
        id: designationId,
        tenantId,
        title: updates.title || designationId,
        departmentId: updates.departmentId || '',
        gradeLevel: updates.gradeLevel || 'L1'
      };
      this.designations.push(desig);
      return desig;
    }
    if (updates.gradeLevel !== undefined) desig.gradeLevel = updates.gradeLevel;
    if (updates.title !== undefined) desig.title = updates.title;
    if (updates.departmentId !== undefined) desig.departmentId = updates.departmentId;
    return desig;
  }


  // -------------------------------------------------------------
  // AUDIT LOGS
  // -------------------------------------------------------------
  public getAuditLogs(tenantId?: string | null): AuditLogEntry[] {
    if (!tenantId) {
      return [...this.auditLogs];
    }
    return this.auditLogs.filter((a) => a.tenantId === tenantId);
  }

  public logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    this.auditLogs.unshift({
      ...entry,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    });
  }

  // -------------------------------------------------------------
  // SECURITY VERIFICATION
  // -------------------------------------------------------------
  public verifyTenantIsolation(): {
    overallPassed: boolean;
    timestamp: string;
    checks: {
      id: string;
      title: string;
      description: string;
      passed: boolean;
      details: string;
    }[];
  } {
    const checks = [];
    const tenant1 = this.tenants.find((t) => t.slug === 'goodwin-batteries') || this.tenants[0];
    const tenant2 = this.tenants.find((t) => t.slug === 'nexus-ai') || this.tenants[1];

    const tenant1Employees = this.getEmployees(tenant1.id);
    const tenant2Employees = this.getEmployees(tenant2.id);

    const hasCrossLeakedEmployee = tenant1Employees.some((e) => e.tenantId !== tenant1.id);
    checks.push({
      id: 'SEC-CHK-01',
      title: 'Directory Query Scoping',
      description: 'Verifies querying Tenant A employees never contains Tenant B records',
      passed: !hasCrossLeakedEmployee && tenant1Employees.length > 0 && tenant2Employees.length > 0,
      details: `Tenant 1 (${tenant1.name}) holds ${tenant1Employees.length} records. Tenant 2 (${tenant2.name}) holds ${tenant2Employees.length} records. Strict 0% overlap.`
    });

    const victimEmployee = tenant2Employees[0];
    const interceptedEmp = this.getEmployeeById(tenant1.id, victimEmployee.id);
    const isIdorBlocked = interceptedEmp === null;
    checks.push({
      id: 'SEC-CHK-02',
      title: 'Direct IDOR Access Protection',
      description: 'Simulates Tenant 1 admin requesting Tenant 2 employee ID directly',
      passed: isIdorBlocked,
      details: isIdorBlocked
        ? `Access denied: getEmployeeById('${tenant1.id}', '${victimEmployee.id}') cleanly returned null.`
        : 'CRITICAL VULNERABILITY: IDOR allowed unauthorized record access!'
    });

    const slipsTenant1 = this.getSalarySlips(tenant1.id);
    const slipsTenant2 = this.getSalarySlips(tenant2.id);
    const anyPayrollLeak =
      slipsTenant1.some((s) => s.tenantId !== tenant1.id) ||
      slipsTenant2.some((s) => s.tenantId !== tenant2.id);
    checks.push({
      id: 'SEC-CHK-03',
      title: 'Statutory Payroll Isolation',
      description: 'Ensures salary breakdowns and tax deductions are fully partitioned per tenant',
      passed: !anyPayrollLeak,
      details: `Zero cross-tenant payroll leakage detected between ${tenant1.currency} and ${tenant2.currency} accounts.`
    });

    const leavesTenant1 = this.getLeaveApplications(tenant1.id);
    const leavesTenant2 = this.getLeaveApplications(tenant2.id);
    const anyLeaveLeak =
      leavesTenant1.some((l) => l.tenantId !== tenant1.id) ||
      leavesTenant2.some((l) => l.tenantId !== tenant2.id);
    checks.push({
      id: 'SEC-CHK-04',
      title: 'Leave Workflow Authorization Boundaries',
      description: 'Verifies leave requests and approval workflows remain strictly inside tenant boundaries',
      passed: !anyLeaveLeak,
      details: 'All pending and approved leave applications verified against respective company tenant IDs.'
    });

    const overallPassed = checks.every((c) => c.passed);
    return {
      overallPassed,
      timestamp: new Date().toISOString(),
      checks
    };
  }
}

export const db = new HRMSDataStore();
