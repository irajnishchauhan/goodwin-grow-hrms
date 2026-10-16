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
  Shift,
  Holiday,
  RegularizationRequest,
  EmployeeDocument,
  JobOpening,
  JobApplicant,
  Invitation
} from '../types';

export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter Plan',
    monthlyPriceUSD: 99,
    maxEmployees: 25,
    features: [
      'Employee Directory & Self-Service',
      'Web Punch Attendance Tracker',
      'Leave Management & Approvals',
      'Basic Email Support'
    ]
  },
  {
    id: 'growth',
    name: 'Growth Plan',
    monthlyPriceUSD: 299,
    maxEmployees: 100,
    isPopular: true,
    features: [
      'All Starter Features',
      'Multi-Shift & Overtime Automation',
      'Automated Payroll & Salary Slips',
      'Statutory PF / ESI / TDS Reports',
      'Recruitment & ATS Kanban Pipeline',
      'Custom Role-Based Permissions',
      'Priority 24/7 Support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Scale',
    monthlyPriceUSD: 799,
    maxEmployees: 1000,
    features: [
      'All Growth Features',
      'Unlimited Departments & Sub-Entities',
      'Interactive Visual Organization Hierarchy',
      'Shift Rostering & Biometric API Sync',
      'Custom Domain & White-Label Branding',
      'Dedicated Account Manager & SLA'
    ]
  }
];

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-goodwin-batteries-fleet',
    name: 'Goodwin Batteries Pvt Ltd',
    slug: 'goodwin-batteries-fleet',
    companyCode: 'GOODWIN-BAT-FLT',
    logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&auto=format&fit=crop&q=80',
    industry: 'Electrical Equipment & Electronics Manufacturing',
    businessEmail: 'info@goodwinbatteries.com',
    businessPhone: '+91 9667724411',
    registeredAddress: 'Second Floor, Shop No. 202, Samiksh Landmark, Tejpur Gadbadi, AB Road',
    city: 'Indore',
    state: 'Madhya Pradesh',
    country: 'India',
    postalCode: '452012',
    website: 'https://goodwinbatteries.com',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    financialYear: 'April - March',
    primaryColor: '#D97706',
    status: 'ACTIVE',
    planId: 'enterprise',
    maxEmployees: 500,
    domain: 'goodwin-batteries-fleet.goodwingrowai.com',
    enabledModules: ['CORE_HR', 'ATTENDANCE', 'LEAVES', 'PAYROLL', 'RECRUITMENT', 'DOCUMENTS'],
    subscriptionStart: '2026-10-16',
    subscriptionRenewal: '2027-10-16',
    billingContact: 'rajnish.goodwinbatteries@gmail.com',
    trialStatus: false,
    onboardingChecklist: [
      { id: 'step-1', title: 'Company Profile', description: 'Logo, registration, timezone & currency', completed: true, route: '/app/goodwin-batteries-fleet/setup' },
      { id: 'step-2', title: 'Departments', description: 'Configure organization departments', completed: false, route: '/app/goodwin-batteries-fleet/setup' },
      { id: 'step-3', title: 'Designations & Reporting', description: 'Technical & supervisory hierarchy', completed: false, route: '/app/goodwin-batteries-fleet/setup' },
      { id: 'step-4', title: 'Attendance Policies', description: 'Working hours, grace period & weekly offs', completed: false, route: '/app/goodwin-batteries-fleet/setup' },
      { id: 'step-5', title: 'Leave Policies', description: 'Casual, Sick & Earned leaves', completed: false, route: '/app/goodwin-batteries-fleet/setup' },
      { id: 'step-6', title: 'Payroll Configuration', description: 'Salary components & statutory rules', completed: false, route: '/app/goodwin-batteries-fleet/setup' },
      { id: 'step-7', title: 'Employee Data Import', description: 'Individual entry and bulk spreadsheet import', completed: false, route: '/app/goodwin-batteries-fleet/setup' },
      { id: 'step-8', title: 'Invite Employees', description: 'Send activation links to workforce', completed: false, route: '/app/goodwin-batteries-fleet/setup' }
    ],
    createdAt: '2026-10-16T22:00:38.000Z',
    updatedAt: '2026-10-16T22:00:38.000Z'
  },
  {
    id: 'tenant-goodwin',
    name: 'Goodwin Technologies Pvt Ltd',
    slug: 'goodwin-tech',
    companyCode: 'GOODWIN-TECH',
    logoUrl: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=128&auto=format&fit=crop&q=80',
    industry: 'Software & Cloud Engineering',
    businessEmail: 'contact@goodwintech.com',
    businessPhone: '+91 80 2841 0022',
    registeredAddress: 'Level 5, Embassy Tech Village',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    postalCode: '560103',
    website: 'https://goodwintech.com',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    financialYear: 'April - March',
    primaryColor: '#059669', // Emerald
    status: 'ACTIVE',
    planId: 'enterprise',
    maxEmployees: 250,
    domain: 'goodwintech.goodwingrowai.com',
    enabledModules: ['CORE_HR', 'ATTENDANCE', 'LEAVES', 'PAYROLL', 'RECRUITMENT', 'DOCUMENTS'],
    subscriptionStart: '2026-01-15',
    subscriptionRenewal: '2027-01-14',
    billingContact: 'billing@goodwintech.com',
    trialStatus: false,
    onboardingChecklist: [
      { id: 'step-1', title: 'Company Profile', description: 'Configured', completed: true, route: '/app/goodwin-tech/settings' },
      { id: 'step-2', title: 'Departments', description: 'Configured', completed: true, route: '/app/goodwin-tech/settings' },
      { id: 'step-3', title: 'Designations', description: 'Configured', completed: true, route: '/app/goodwin-tech/org-chart' },
      { id: 'step-4', title: 'Attendance', description: 'Configured', completed: true, route: '/app/goodwin-tech/attendance' },
      { id: 'step-5', title: 'Leaves', description: 'Configured', completed: true, route: '/app/goodwin-tech/leaves' },
      { id: 'step-6', title: 'Payroll', description: 'Configured', completed: true, route: '/app/goodwin-tech/payroll' },
      { id: 'step-7', title: 'Import Employees', description: 'Configured', completed: true, route: '/app/goodwin-tech/employees' },
      { id: 'step-8', title: 'Invitations', description: 'Completed', completed: true, route: '/app/goodwin-tech/invitations' }
    ],
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-10-15T10:30:00Z'
  },
  {
    id: 'tenant-nexus',
    name: 'Nexus AI Labs Inc.',
    slug: 'nexus-ai',
    companyCode: 'NEXUS-AI',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    industry: 'Artificial Intelligence & Robotics',
    businessEmail: 'contact@nexusai.io',
    businessPhone: '+1 415 555 0199',
    registeredAddress: '550 Montgomery St, Suite 400',
    city: 'San Francisco',
    state: 'CA',
    country: 'United States',
    postalCode: '94111',
    website: 'https://nexusai.io',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    financialYear: 'January - December',
    primaryColor: '#6366F1', // Indigo
    status: 'ACTIVE',
    planId: 'growth',
    maxEmployees: 100,
    domain: 'nexus.goodwingrowai.com',
    enabledModules: ['CORE_HR', 'ATTENDANCE', 'LEAVES', 'PAYROLL', 'RECRUITMENT'],
    subscriptionStart: '2026-03-01',
    subscriptionRenewal: '2027-02-28',
    billingContact: 'accounting@nexusai.io',
    trialStatus: false,
    onboardingChecklist: [
      { id: 'step-1', title: 'Company Profile', description: 'Configured', completed: true, route: '/app/nexus-ai/settings' },
      { id: 'step-2', title: 'Departments', description: 'Configured', completed: true, route: '/app/nexus-ai/settings' },
      { id: 'step-3', title: 'Designations', description: 'Configured', completed: true, route: '/app/nexus-ai/org-chart' },
      { id: 'step-4', title: 'Attendance', description: 'Configured', completed: true, route: '/app/nexus-ai/attendance' },
      { id: 'step-5', title: 'Leaves', description: 'Configured', completed: true, route: '/app/nexus-ai/leaves' },
      { id: 'step-6', title: 'Payroll', description: 'Configured', completed: true, route: '/app/nexus-ai/payroll' },
      { id: 'step-7', title: 'Import Employees', description: 'Configured', completed: true, route: '/app/nexus-ai/employees' },
      { id: 'step-8', title: 'Invitations', description: 'Completed', completed: true, route: '/app/nexus-ai/invitations' }
    ],
    createdAt: '2026-03-01T14:20:00Z',
    updatedAt: '2026-10-14T08:15:00Z'
  }
];

export const INITIAL_USERS: User[] = [
  // Platform Super Admin
  {
    id: 'user-super-admin',
    name: 'Platform Super Admin',
    email: 'admin@goodwingrow.ai',
    passwordHash: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: true,
    memberships: [
      { id: 'm-sa-2', tenantId: 'tenant-goodwin-batteries-fleet', tenantName: 'Goodwin Batteries Pvt Ltd', tenantSlug: 'goodwin-batteries-fleet', role: 'COMPANY_ADMIN', status: 'ACTIVE' },
      { id: 'm-sa-3', tenantId: 'tenant-goodwin', tenantName: 'Goodwin Technologies Pvt Ltd', tenantSlug: 'goodwin-tech', role: 'COMPANY_ADMIN', status: 'ACTIVE' }
    ],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  // Company Owner — Rajnish Singh Chauhan
  {
    id: 'user-bat-owner',
    name: 'Rajnish Singh Chauhan',
    email: 'rajnish.chauhan@goodwinbatteries.com',
    passwordHash: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: true,
    memberships: [
      { id: 'm-bat-2', tenantId: 'tenant-goodwin-batteries-fleet', tenantName: 'Goodwin Batteries Pvt Ltd', tenantSlug: 'goodwin-batteries-fleet', role: 'COMPANY_ADMIN', status: 'ACTIVE' }
    ],
    activeTenantId: 'tenant-goodwin-batteries-fleet',
    isActive: true,
    createdAt: '2026-04-01T10:00:00Z'
  },
  // Goodwin Tech Lead
  {
    id: 'user-gw-owner',
    name: 'Sarah Jenkins',
    email: 'sarah.director@goodwintech.com',
    passwordHash: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: false,
    memberships: [
      { id: 'm-gw-1', tenantId: 'tenant-goodwin', tenantName: 'Goodwin Technologies Pvt Ltd', tenantSlug: 'goodwin-tech', role: 'COMPANY_ADMIN', status: 'ACTIVE' }
    ],
    activeTenantId: 'tenant-goodwin',
    isActive: true,
    createdAt: '2026-01-15T10:00:00Z'
  },
  // Nexus AI Lead
  {
    id: 'user-nx-owner',
    name: 'Elena Rostova',
    email: 'elena.hr@nexusai.io',
    passwordHash: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: false,
    memberships: [
      { id: 'm-nx-1', tenantId: 'tenant-nexus', tenantName: 'Nexus AI Labs Inc.', tenantSlug: 'nexus-ai', role: 'COMPANY_ADMIN', status: 'ACTIVE' }
    ],
    activeTenantId: 'tenant-nexus',
    isActive: true,
    createdAt: '2026-03-01T10:00:00Z'
  }
];

export const INITIAL_DEPARTMENTS: Department[] = [
  // Goodwin Tech
  { id: 'dept-goodwin-exec', tenantId: 'tenant-goodwin', name: 'Executive Leadership', code: 'EXEC' },
  { id: 'dept-goodwin-hr', tenantId: 'tenant-goodwin', name: 'Human Resources & People', code: 'HR' },
  { id: 'dept-goodwin-eng', tenantId: 'tenant-goodwin', name: 'Engineering & Technology', code: 'ENG' },
  { id: 'dept-goodwin-prod', tenantId: 'tenant-goodwin', name: 'Product Management', code: 'PROD' },

  // Nexus AI
  { id: 'dept-nexus-ops', tenantId: 'tenant-nexus', name: 'People Operations', code: 'POPS' },
  { id: 'dept-nexus-rd', tenantId: 'tenant-nexus', name: 'AI Research & Deep Learning', code: 'RND' },
  { id: 'dept-nexus-cloud', tenantId: 'tenant-nexus', name: 'Infrastructure & Cloud', code: 'INFRA' }
];

export const INITIAL_DESIGNATIONS: Designation[] = [
  // Goodwin Tech
  { id: 'desig-goodwin-ceo', tenantId: 'tenant-goodwin', title: 'Chief Executive Officer', departmentId: 'dept-goodwin-exec', gradeLevel: 'L8' },
  { id: 'desig-goodwin-hrd', tenantId: 'tenant-goodwin', title: 'VP of Human Resources', departmentId: 'dept-goodwin-hr', gradeLevel: 'L7' },
  { id: 'desig-goodwin-sde3', tenantId: 'tenant-goodwin', title: 'Senior Staff Engineer', departmentId: 'dept-goodwin-eng', gradeLevel: 'L5' },

  // Nexus AI
  { id: 'desig-nexus-hrm', tenantId: 'tenant-nexus', title: 'Head of People Operations', departmentId: 'dept-nexus-ops', gradeLevel: 'M2' },
  { id: 'desig-nexus-rs', tenantId: 'tenant-nexus', title: 'Lead AI Research Scientist', departmentId: 'dept-nexus-rd', gradeLevel: 'IC5' }
];

// Goodwin Batteries starts with 0 employees — ready for owner setup
export const INITIAL_EMPLOYEES: Employee[] = [
  // Goodwin Tech Employees
  {
    id: 'emp-goodwin-ceo',
    tenantId: 'tenant-goodwin',
    employeeCode: 'GWT-1000',
    firstName: 'Vikram',
    lastName: 'Aditya',
    workEmail: 'vikram.aditya@goodwintech.com',
    phone: '+91 98450 99000',
    gender: 'MALE',
    joiningDate: '2023-01-01',
    departmentId: 'dept-goodwin-exec',
    departmentName: 'Executive Leadership',
    designationId: 'desig-goodwin-ceo',
    designationTitle: 'Chief Executive Officer',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    monthlySalary: 450000,
    loginStatus: 'ACCEPTED',
    createdAt: '2023-01-01T09:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z'
  },
  {
    id: 'emp-goodwin-001',
    tenantId: 'tenant-goodwin',
    employeeCode: 'GWT-1001',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    workEmail: 'sarah.director@goodwintech.com',
    phone: '+91 98765 43210',
    gender: 'FEMALE',
    joiningDate: '2024-03-01',
    departmentId: 'dept-goodwin-hr',
    departmentName: 'Human Resources & People',
    designationId: 'desig-goodwin-hrd',
    designationTitle: 'VP of Human Resources',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    monthlySalary: 240000,
    loginStatus: 'ACCEPTED',
    createdAt: '2024-03-01T09:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z'
  },

  // Nexus AI Employees
  {
    id: 'emp-nexus-001',
    tenantId: 'tenant-nexus',
    employeeCode: 'NX-001',
    firstName: 'Elena',
    lastName: 'Rostova',
    workEmail: 'elena.hr@nexusai.io',
    phone: '+1 (415) 555-0192',
    gender: 'FEMALE',
    joiningDate: '2025-02-01',
    departmentId: 'dept-nexus-ops',
    departmentName: 'People Operations',
    designationId: 'desig-nexus-hrm',
    designationTitle: 'Head of People Operations',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    monthlySalary: 11500,
    loginStatus: 'ACCEPTED',
    createdAt: '2025-02-01T08:00:00Z',
    updatedAt: '2026-10-10T16:00:00Z'
  }
];

export const INITIAL_INVITATIONS: Invitation[] = [];

export const INITIAL_SHIFTS: Shift[] = [
  { id: 'shift-gw-gen', tenantId: 'tenant-goodwin', name: 'General Shift', startTime: '09:00 AM', endTime: '06:00 PM', graceMinutes: 15, isDefault: true, color: '#059669' },
  { id: 'shift-nx-core', tenantId: 'tenant-nexus', name: 'Pacific Standard Core', startTime: '09:00 AM', endTime: '05:30 PM', graceMinutes: 20, isDefault: true, color: '#6366F1' }
];

export const INITIAL_HOLIDAYS: Holiday[] = [
  { id: 'hol-gw-1', tenantId: 'tenant-goodwin', name: 'Diwali Festival of Lights', date: '2026-11-08', dayOfWeek: 'Sunday', isOptional: false }
];

export const INITIAL_REGULARIZATIONS: RegularizationRequest[] = [];

export const INITIAL_DOCUMENTS: EmployeeDocument[] = [];

export const INITIAL_LEAVE_TYPES: LeaveType[] = [
  { id: 'lt-goodwin-cl', tenantId: 'tenant-goodwin', name: 'Casual Leave (CL)', code: 'CL', daysPerYear: 12, color: '#3B82F6', isPaid: true }
];

export const INITIAL_LEAVE_APPLICATIONS: LeaveApplication[] = [];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_SALARY_SLIPS: SalarySlip[] = [];

export const INITIAL_JOB_OPENINGS: JobOpening[] = [];

export const INITIAL_JOB_APPLICANTS: JobApplicant[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-bat-01',
    tenantId: null,
    tenantName: 'Platform Super Admin',
    actorEmail: 'admin@goodwingrow.ai',
    actorRole: 'SUPER_ADMIN',
    action: 'CLIENT_ONBOARDED',
    resource: 'Tenant',
    resourceId: 'tenant-goodwin-batteries-fleet',
    ipAddress: '127.0.0.1',
    timestamp: '2026-04-01T09:00:00Z',
    details: { name: 'Goodwin Batteries Pvt Ltd', code: 'GOODWIN-BAT', plan: 'enterprise' }
  }
];
