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
    id: 'tenant-goodwin-batteries',
    name: 'Goodwin Batteries Pvt Ltd',
    slug: 'goodwin-batteries',
    companyCode: 'GOODWIN-BAT',
    logoUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=128&auto=format&fit=crop&q=80',
    industry: 'Clean Energy & Battery Pack Manufacturing',
    businessEmail: 'contact@goodwinbatteries.com',
    businessPhone: '+91 80 4912 8800',
    registeredAddress: 'Plot 42, Electronic City Phase 1',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    postalCode: '560100',
    website: 'https://goodwinbatteries.com',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    financialYear: 'April - March',
    primaryColor: '#D97706', // Amber / Battery Gold
    status: 'ACTIVE',
    planId: 'growth',
    maxEmployees: 100,
    domain: 'goodwin-batteries.goodwingrowai.com',
    enabledModules: ['CORE_HR', 'ATTENDANCE', 'LEAVES', 'PAYROLL', 'RECRUITMENT', 'DOCUMENTS'],
    subscriptionStart: '2026-04-01',
    subscriptionRenewal: '2027-03-31',
    billingContact: 'finance@goodwinbatteries.com',
    trialStatus: false,
    onboardingChecklist: [
      { id: 'step-1', title: 'Company Profile', description: 'Logo, registration, timezone & currency', completed: true, route: '/app/goodwin-batteries/settings' },
      { id: 'step-2', title: 'Departments', description: 'Production, QC, BMS, Warehouse, HR', completed: true, route: '/app/goodwin-batteries/settings' },
      { id: 'step-3', title: 'Designations & Reporting', description: 'Technical & supervisory hierarchy', completed: true, route: '/app/goodwin-batteries/org-chart' },
      { id: 'step-4', title: 'Attendance Policies', description: 'Factory shifts, grace period & weekly offs', completed: true, route: '/app/goodwin-batteries/attendance' },
      { id: 'step-5', title: 'Leave Policies', description: 'Casual, Sick & Earned leaves', completed: true, route: '/app/goodwin-batteries/leaves' },
      { id: 'step-6', title: 'Payroll Configuration', description: 'Factory wage components & PF setup', completed: true, route: '/app/goodwin-batteries/payroll' },
      { id: 'step-7', title: 'Employee Data Import', description: 'Individual entry and bulk spreadsheet import', completed: true, route: '/app/goodwin-batteries/employees' },
      { id: 'step-8', title: 'Invite Employees', description: 'Send activation links to workforce', completed: false, route: '/app/goodwin-batteries/invitations' }
    ],
    createdAt: '2026-04-01T09:00:00Z',
    updatedAt: '2026-10-16T12:00:00Z'
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
  {
    id: 'user-super-admin',
    name: 'Rajnish Chauhan (Super Admin)',
    email: 'admin@goodwingrow.ai',
    passwordHash: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: true,
    memberships: [
      { id: 'm-sa-1', tenantId: 'tenant-goodwin-batteries', tenantName: 'Goodwin Batteries Pvt Ltd', tenantSlug: 'goodwin-batteries', role: 'COMPANY_ADMIN', status: 'ACTIVE' },
      { id: 'm-sa-2', tenantId: 'tenant-goodwin', tenantName: 'Goodwin Technologies Pvt Ltd', tenantSlug: 'goodwin-tech', role: 'COMPANY_ADMIN', status: 'ACTIVE' }
    ],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user-bat-rajnish',
    name: 'Rajnish Singh Chauhan',
    email: 'rajnish.chauhan@goodwinbatteries.com',
    passwordHash: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: false,
    memberships: [
      { id: 'm-bat-rajnish', tenantId: 'tenant-goodwin-batteries', tenantName: 'Goodwin Batteries Pvt Ltd', tenantSlug: 'goodwin-batteries', role: 'EMPLOYEE', status: 'ACTIVE' }
    ],
    activeTenantId: 'tenant-goodwin-batteries',
    isActive: true,
    createdAt: '2026-04-01T10:00:00Z'
  },
  // Goodwin Batteries Credentials
  {
    id: 'user-bat-owner',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@goodwinbatteries.com',
    passwordHash: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: false,
    memberships: [
      { id: 'm-bat-1', tenantId: 'tenant-goodwin-batteries', tenantName: 'Goodwin Batteries Pvt Ltd', tenantSlug: 'goodwin-batteries', role: 'COMPANY_ADMIN', status: 'ACTIVE' }
    ],
    activeTenantId: 'tenant-goodwin-batteries',
    isActive: true,
    createdAt: '2026-04-01T10:00:00Z'
  },
  {
    id: 'user-bat-hr',
    name: 'Priya Nair',
    email: 'priya.nair@goodwinbatteries.com',
    passwordHash: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: false,
    memberships: [
      { id: 'm-bat-2', tenantId: 'tenant-goodwin-batteries', tenantName: 'Goodwin Batteries Pvt Ltd', tenantSlug: 'goodwin-batteries', role: 'HR_ADMIN', status: 'ACTIVE' }
    ],
    activeTenantId: 'tenant-goodwin-batteries',
    isActive: true,
    createdAt: '2026-04-01T10:15:00Z'
  },
  {
    id: 'user-bat-manager',
    name: 'Amit Patel',
    email: 'amit.patel@goodwinbatteries.com',
    passwordHash: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: false,
    memberships: [
      { id: 'm-bat-3', tenantId: 'tenant-goodwin-batteries', tenantName: 'Goodwin Batteries Pvt Ltd', tenantSlug: 'goodwin-batteries', role: 'MANAGER', status: 'ACTIVE' }
    ],
    activeTenantId: 'tenant-goodwin-batteries',
    isActive: true,
    createdAt: '2026-04-02T11:00:00Z'
  },
  {
    id: 'user-bat-emp1',
    name: 'Sunil Kumar',
    email: 'sunil.kumar@goodwinbatteries.com',
    passwordHash: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: false,
    memberships: [
      { id: 'm-bat-4', tenantId: 'tenant-goodwin-batteries', tenantName: 'Goodwin Batteries Pvt Ltd', tenantSlug: 'goodwin-batteries', role: 'EMPLOYEE', status: 'ACTIVE' }
    ],
    activeTenantId: 'tenant-goodwin-batteries',
    isActive: true,
    createdAt: '2026-04-05T09:00:00Z'
  },
  {
    id: 'user-bat-emp2',
    name: 'Pooja Reddy',
    email: 'pooja.reddy@goodwinbatteries.com',
    passwordHash: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: false,
    memberships: [
      { id: 'm-bat-5', tenantId: 'tenant-goodwin-batteries', tenantName: 'Goodwin Batteries Pvt Ltd', tenantSlug: 'goodwin-batteries', role: 'EMPLOYEE', status: 'ACTIVE' }
    ],
    activeTenantId: 'tenant-goodwin-batteries',
    isActive: true,
    createdAt: '2026-04-06T10:00:00Z'
  }
];

export const INITIAL_DEPARTMENTS: Department[] = [
  // Goodwin Batteries Departments
  { id: 'dept-bat-exec', tenantId: 'tenant-goodwin-batteries', name: 'Executive & Operations', code: 'OPS' },
  { id: 'dept-bat-prod', tenantId: 'tenant-goodwin-batteries', name: 'Production & Cell Assembly', code: 'PROD' },
  { id: 'dept-bat-qc', tenantId: 'tenant-goodwin-batteries', name: 'Quality Control & Testing', code: 'QC' },
  { id: 'dept-bat-bms', tenantId: 'tenant-goodwin-batteries', name: 'Research & BMS Engineering', code: 'BMS' },
  { id: 'dept-bat-log', tenantId: 'tenant-goodwin-batteries', name: 'Warehouse & Logistics', code: 'LOG' },
  { id: 'dept-bat-hr', tenantId: 'tenant-goodwin-batteries', name: 'Human Resources', code: 'HR' },

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
  // Goodwin Batteries
  { id: 'desig-bat-md', tenantId: 'tenant-goodwin-batteries', title: 'Managing Director & CEO', departmentId: 'dept-bat-exec', gradeLevel: 'L8' },
  { id: 'desig-bat-hrl', tenantId: 'tenant-goodwin-batteries', title: 'HR Operations Lead', departmentId: 'dept-bat-hr', gradeLevel: 'L6' },
  { id: 'desig-bat-pm', tenantId: 'tenant-goodwin-batteries', title: 'Production Operations Manager', departmentId: 'dept-bat-prod', gradeLevel: 'L6' },
  { id: 'desig-bat-tech', tenantId: 'tenant-goodwin-batteries', title: 'Battery Assembly Technician', departmentId: 'dept-bat-prod', gradeLevel: 'L3' },
  { id: 'desig-bat-qc', tenantId: 'tenant-goodwin-batteries', title: 'Quality Control Chemist', departmentId: 'dept-bat-qc', gradeLevel: 'L4' },
  { id: 'desig-bat-bms', tenantId: 'tenant-goodwin-batteries', title: 'BMS Firmware Developer', departmentId: 'dept-bat-bms', gradeLevel: 'L5' },
  { id: 'desig-bat-wh', tenantId: 'tenant-goodwin-batteries', title: 'Warehouse Logistics Associate', departmentId: 'dept-bat-log', gradeLevel: 'L2' },

  // Goodwin Tech
  { id: 'desig-goodwin-ceo', tenantId: 'tenant-goodwin', title: 'Chief Executive Officer', departmentId: 'dept-goodwin-exec', gradeLevel: 'L8' },
  { id: 'desig-goodwin-hrd', tenantId: 'tenant-goodwin', title: 'VP of Human Resources', departmentId: 'dept-goodwin-hr', gradeLevel: 'L7' },
  { id: 'desig-goodwin-sde3', tenantId: 'tenant-goodwin', title: 'Senior Staff Engineer', departmentId: 'dept-goodwin-eng', gradeLevel: 'L5' },

  // Nexus AI
  { id: 'desig-nexus-hrm', tenantId: 'tenant-nexus', title: 'Head of People Operations', departmentId: 'dept-nexus-ops', gradeLevel: 'M2' },
  { id: 'desig-nexus-rs', tenantId: 'tenant-nexus', title: 'Lead AI Research Scientist', departmentId: 'dept-nexus-rd', gradeLevel: 'IC5' }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  // -------------------------------------------------------------
  // GOODWIN BATTERIES EMPLOYEES (Fictional Example Client Company)
  // -------------------------------------------------------------
  {
    id: 'emp-bat-000',
    tenantId: 'tenant-goodwin-batteries',
    userId: 'user-bat-rajnish',
    employeeCode: 'GB-1000',
    firstName: 'Rajnish',
    lastName: 'Singh Chauhan',
    workEmail: 'rajnish.chauhan@goodwinbatteries.com',
    personalEmail: 'rajnish@goodwingrow.ai',
    phone: '+91 98450 00100',
    gender: 'MALE',
    joiningDate: '2024-01-15',
    departmentId: 'dept-bat-prod',
    departmentName: 'Production & Cell Assembly',
    designationId: 'desig-bat-ops-lead',
    designationTitle: 'Battery Operations Specialist',
    reportingManagerName: 'Amit Patel (Prod Mgr)',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    monthlySalary: 75000,
    panOrTaxId: 'RCHAU1234K',
    bankAccountNumber: '987654321098',
    bankName: 'HDFC Bank',
    workLocation: 'Bangalore Plant 1',
    shiftName: 'Morning Shift (A)',
    loginStatus: 'ACCEPTED',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2026-10-16T12:00:00Z'
  },
  {
    id: 'emp-bat-001',
    tenantId: 'tenant-goodwin-batteries',
    userId: 'user-bat-owner',
    employeeCode: 'GB-1001',
    firstName: 'Rajesh',
    lastName: 'Sharma',
    workEmail: 'rajesh.sharma@goodwinbatteries.com',
    phone: '+91 98450 11001',
    gender: 'MALE',
    joiningDate: '2024-01-01',
    departmentId: 'dept-bat-exec',
    departmentName: 'Executive & Operations',
    designationId: 'desig-bat-md',
    designationTitle: 'Managing Director & CEO',
    reportingManagerName: 'Board of Directors',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    monthlySalary: 380000,
    panOrTaxId: 'RSHAR9912K',
    bankAccountNumber: '901827364512',
    bankName: 'State Bank of India',
    workLocation: 'Bangalore Plant 1',
    shiftName: 'General Day Shift',
    loginStatus: 'ACCEPTED',
    createdAt: '2024-01-01T09:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z'
  },
  {
    id: 'emp-bat-002',
    tenantId: 'tenant-goodwin-batteries',
    userId: 'user-bat-hr',
    employeeCode: 'GB-1002',
    firstName: 'Priya',
    lastName: 'Nair',
    workEmail: 'priya.nair@goodwinbatteries.com',
    phone: '+91 98450 22002',
    gender: 'FEMALE',
    joiningDate: '2024-02-15',
    departmentId: 'dept-bat-hr',
    departmentName: 'Human Resources',
    designationId: 'desig-bat-hrl',
    designationTitle: 'HR Operations Lead',
    reportingManagerId: 'emp-bat-001',
    reportingManagerName: 'Rajesh Sharma (MD)',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    monthlySalary: 145000,
    panOrTaxId: 'PNAIR4412M',
    bankAccountNumber: '409182736152',
    bankName: 'HDFC Bank',
    workLocation: 'Bangalore Plant 1',
    shiftName: 'General Day Shift',
    loginStatus: 'ACCEPTED',
    createdAt: '2024-02-15T09:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z'
  },
  {
    id: 'emp-bat-003',
    tenantId: 'tenant-goodwin-batteries',
    userId: 'user-bat-manager',
    employeeCode: 'GB-1003',
    firstName: 'Amit',
    lastName: 'Patel',
    workEmail: 'amit.patel@goodwinbatteries.com',
    phone: '+91 98450 33003',
    gender: 'MALE',
    joiningDate: '2024-03-01',
    departmentId: 'dept-bat-prod',
    departmentName: 'Production & Cell Assembly',
    designationId: 'desig-bat-pm',
    designationTitle: 'Production Operations Manager',
    reportingManagerId: 'emp-bat-001',
    reportingManagerName: 'Rajesh Sharma (MD)',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    monthlySalary: 165000,
    panOrTaxId: 'APATE5521N',
    bankAccountNumber: '551928374619',
    bankName: 'ICICI Bank',
    workLocation: 'Bangalore Plant 1',
    shiftName: 'Morning Shift (A)',
    loginStatus: 'ACCEPTED',
    createdAt: '2024-03-01T09:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z'
  },
  {
    id: 'emp-bat-004',
    tenantId: 'tenant-goodwin-batteries',
    userId: 'user-bat-emp1',
    employeeCode: 'GB-1004',
    firstName: 'Sunil',
    lastName: 'Kumar',
    workEmail: 'sunil.kumar@goodwinbatteries.com',
    phone: '+91 98450 44004',
    gender: 'MALE',
    joiningDate: '2024-04-10',
    departmentId: 'dept-bat-prod',
    departmentName: 'Production & Cell Assembly',
    designationId: 'desig-bat-tech',
    designationTitle: 'Battery Assembly Technician',
    reportingManagerId: 'emp-bat-003',
    reportingManagerName: 'Amit Patel (Prod Mgr)',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    monthlySalary: 42000,
    panOrTaxId: 'SKUMA6632P',
    bankAccountNumber: '123890475619',
    bankName: 'Axis Bank',
    workLocation: 'Bangalore Plant 1',
    shiftName: 'Morning Shift (A)',
    loginStatus: 'ACCEPTED',
    createdAt: '2024-04-10T09:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z'
  },
  {
    id: 'emp-bat-005',
    tenantId: 'tenant-goodwin-batteries',
    employeeCode: 'GB-1005',
    firstName: 'Neha',
    lastName: 'Singh',
    workEmail: 'neha.singh@goodwinbatteries.com',
    phone: '+91 98450 55005',
    gender: 'FEMALE',
    joiningDate: '2024-05-15',
    departmentId: 'dept-bat-qc',
    departmentName: 'Quality Control & Testing',
    designationId: 'desig-bat-qc',
    designationTitle: 'Quality Control Chemist',
    reportingManagerId: 'emp-bat-003',
    reportingManagerName: 'Amit Patel (Prod Mgr)',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    monthlySalary: 68000,
    panOrTaxId: 'NSING7743Q',
    bankAccountNumber: '992837465012',
    bankName: 'Kotak Mahindra Bank',
    workLocation: 'Bangalore Plant 1 - Cleanroom Lab',
    shiftName: 'General Day Shift',
    loginStatus: 'PENDING',
    invitationId: 'inv-bat-neha',
    createdAt: '2024-05-15T09:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z'
  },
  {
    id: 'emp-bat-006',
    tenantId: 'tenant-goodwin-batteries',
    employeeCode: 'GB-1006',
    firstName: 'Ravi',
    lastName: 'Verma',
    workEmail: 'ravi.verma@goodwinbatteries.com',
    phone: '+91 98450 66006',
    gender: 'MALE',
    joiningDate: '2024-06-01',
    departmentId: 'dept-bat-qc',
    departmentName: 'Quality Control & Testing',
    designationId: 'desig-bat-qc',
    designationTitle: 'Cell Testing Specialist',
    reportingManagerId: 'emp-bat-003',
    reportingManagerName: 'Amit Patel (Prod Mgr)',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    monthlySalary: 55000,
    panOrTaxId: 'RVERM8854R',
    bankAccountNumber: '662839401928',
    bankName: 'Punjab National Bank',
    workLocation: 'Bangalore Plant 1',
    shiftName: 'General Day Shift',
    loginStatus: 'NOT_INVITED',
    createdAt: '2024-06-01T09:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z'
  },
  {
    id: 'emp-bat-007',
    tenantId: 'tenant-goodwin-batteries',
    userId: 'user-bat-emp2',
    employeeCode: 'GB-1007',
    firstName: 'Pooja',
    lastName: 'Reddy',
    workEmail: 'pooja.reddy@goodwinbatteries.com',
    phone: '+91 98450 77007',
    gender: 'FEMALE',
    joiningDate: '2024-07-01',
    departmentId: 'dept-bat-bms',
    departmentName: 'Research & BMS Engineering',
    designationId: 'desig-bat-bms',
    designationTitle: 'BMS Firmware Developer',
    reportingManagerId: 'emp-bat-001',
    reportingManagerName: 'Rajesh Sharma (MD)',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    monthlySalary: 110000,
    panOrTaxId: 'PREDD9965S',
    bankAccountNumber: '331928475619',
    bankName: 'HDFC Bank',
    workLocation: 'R&D Center, Bangalore',
    shiftName: 'General Day Shift',
    loginStatus: 'ACCEPTED',
    createdAt: '2024-07-01T09:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z'
  },
  {
    id: 'emp-bat-008',
    tenantId: 'tenant-goodwin-batteries',
    employeeCode: 'GB-1008',
    firstName: 'Manoj',
    lastName: 'Tiwari',
    workEmail: 'manoj.tiwari@goodwinbatteries.com',
    phone: '+91 98450 88008',
    gender: 'MALE',
    joiningDate: '2024-08-15',
    departmentId: 'dept-bat-log',
    departmentName: 'Warehouse & Logistics',
    designationId: 'desig-bat-wh',
    designationTitle: 'Warehouse Logistics Associate',
    reportingManagerId: 'emp-bat-003',
    reportingManagerName: 'Amit Patel (Prod Mgr)',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    monthlySalary: 38000,
    panOrTaxId: 'MTIWA1122T',
    bankAccountNumber: '881920394857',
    bankName: 'Bank of Baroda',
    workLocation: 'Central Battery Warehouse',
    shiftName: 'Morning Shift (A)',
    loginStatus: 'PENDING',
    invitationId: 'inv-bat-manoj',
    createdAt: '2024-08-15T09:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z'
  },

  // Goodwin Tech Employees
  {
    id: 'emp-goodwin-000',
    tenantId: 'tenant-goodwin',
    employeeCode: 'GWT-1000',
    firstName: 'Devendra',
    lastName: 'Chauhan',
    workEmail: 'ceo@goodwintech.com',
    phone: '+91 98990 00001',
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

export const INITIAL_INVITATIONS: Invitation[] = [
  {
    id: 'inv-bat-neha',
    tenantId: 'tenant-goodwin-batteries',
    tenantName: 'Goodwin Batteries Pvt Ltd',
    employeeId: 'emp-bat-005',
    employeeName: 'Neha Singh',
    email: 'neha.singh@goodwinbatteries.com',
    role: 'EMPLOYEE',
    token: 'inv-tok-neha-7743',
    tokenHash: 'hash-neha-7743',
    status: 'PENDING',
    createdAt: '2026-10-14T11:00:00Z',
    expiresAt: '2026-10-21T11:00:00Z',
    lastSentAt: '2026-10-14T11:00:00Z'
  },
  {
    id: 'inv-bat-manoj',
    tenantId: 'tenant-goodwin-batteries',
    tenantName: 'Goodwin Batteries Pvt Ltd',
    employeeId: 'emp-bat-008',
    employeeName: 'Manoj Tiwari',
    email: 'manoj.tiwari@goodwinbatteries.com',
    role: 'EMPLOYEE',
    token: 'inv-tok-manoj-1122',
    tokenHash: 'hash-manoj-1122',
    status: 'PENDING',
    createdAt: '2026-10-15T09:30:00Z',
    expiresAt: '2026-10-22T09:30:00Z',
    lastSentAt: '2026-10-15T09:30:00Z'
  }
];

export const INITIAL_SHIFTS: Shift[] = [
  { id: 'shift-bat-day', tenantId: 'tenant-goodwin-batteries', name: 'General Day Shift', startTime: '09:00 AM', endTime: '06:00 PM', graceMinutes: 15, isDefault: true, color: '#D97706' },
  { id: 'shift-bat-morn', tenantId: 'tenant-goodwin-batteries', name: 'Morning Assembly Shift (A)', startTime: '06:00 AM', endTime: '02:30 PM', graceMinutes: 10, isDefault: false, color: '#3B82F6' },
  { id: 'shift-bat-eve', tenantId: 'tenant-goodwin-batteries', name: 'Evening Assembly Shift (B)', startTime: '02:30 PM', endTime: '11:00 PM', graceMinutes: 10, isDefault: false, color: '#8B5CF6' },

  { id: 'shift-gw-gen', tenantId: 'tenant-goodwin', name: 'General Shift', startTime: '09:00 AM', endTime: '06:00 PM', graceMinutes: 15, isDefault: true, color: '#059669' },
  { id: 'shift-nx-core', tenantId: 'tenant-nexus', name: 'Pacific Standard Core', startTime: '09:00 AM', endTime: '05:30 PM', graceMinutes: 20, isDefault: true, color: '#6366F1' }
];

export const INITIAL_HOLIDAYS: Holiday[] = [
  { id: 'hol-bat-1', tenantId: 'tenant-goodwin-batteries', name: 'Ayudha Puja / Machinery Worship', date: '2026-10-20', dayOfWeek: 'Tuesday', isOptional: false },
  { id: 'hol-bat-2', tenantId: 'tenant-goodwin-batteries', name: 'Diwali Festival of Lights', date: '2026-11-08', dayOfWeek: 'Sunday', isOptional: false },
  { id: 'hol-bat-3', tenantId: 'tenant-goodwin-batteries', name: 'Kannada Rajyotsava', date: '2026-11-01', dayOfWeek: 'Sunday', isOptional: false },

  { id: 'hol-gw-1', tenantId: 'tenant-goodwin', name: 'Diwali Festival of Lights', date: '2026-11-08', dayOfWeek: 'Sunday', isOptional: false }
];

export const INITIAL_REGULARIZATIONS: RegularizationRequest[] = [
  {
    id: 'reg-bat-01',
    tenantId: 'tenant-goodwin-batteries',
    employeeId: 'emp-bat-004',
    employeeName: 'Sunil Kumar',
    attendanceDate: '2026-10-16',
    requestedClockIn: '06:15 AM',
    requestedClockOut: '02:30 PM',
    reason: 'Assembly line conveyor maintenance check delayed punch biometric',
    status: 'PENDING',
    requestedAt: '2026-10-16T08:00:00Z'
  }
];

export const INITIAL_DOCUMENTS: EmployeeDocument[] = [
  {
    id: 'doc-bat-00',
    tenantId: 'tenant-goodwin-batteries',
    employeeId: 'emp-bat-000',
    employeeName: 'Rajnish Singh Chauhan',
    title: 'Signed Employment Agreement & Non-Disclosure Form',
    documentType: 'CONTRACT',
    fileName: 'Rajnish_Chauhan_Employment_Agreement.pdf',
    fileSize: '1.8 MB',
    uploadedAt: '2024-01-15T09:00:00Z'
  },
  {
    id: 'doc-bat-01',
    tenantId: 'tenant-goodwin-batteries',
    employeeId: 'emp-bat-001',
    employeeName: 'Rajesh Sharma',
    title: 'Goodwin Batteries Certificate of Incorporation & Factory License',
    documentType: 'CERTIFICATE',
    fileName: 'Goodwin_Batteries_Factory_License.pdf',
    fileSize: '3.2 MB',
    uploadedAt: '2024-01-01T09:00:00Z'
  },
  {
    id: 'doc-bat-02',
    tenantId: 'tenant-goodwin-batteries',
    employeeId: 'emp-bat-004',
    employeeName: 'Sunil Kumar',
    title: 'Cell Assembly Safety & Hazardous Materials Certification',
    documentType: 'CERTIFICATE',
    fileName: 'Hazmat_Lithium_Battery_Safety_Sunil.pdf',
    fileSize: '1.1 MB',
    uploadedAt: '2024-04-10T10:00:00Z'
  }
];

export const INITIAL_LEAVE_TYPES: LeaveType[] = [
  { id: 'lt-bat-cl', tenantId: 'tenant-goodwin-batteries', name: 'Casual Leave (CL)', code: 'CL', daysPerYear: 12, color: '#3B82F6', isPaid: true },
  { id: 'lt-bat-sl', tenantId: 'tenant-goodwin-batteries', name: 'Medical / Sick Leave (SL)', code: 'SL', daysPerYear: 10, color: '#EF4444', isPaid: true },
  { id: 'lt-bat-el', tenantId: 'tenant-goodwin-batteries', name: 'Earned Factory Leave (EL)', code: 'EL', daysPerYear: 18, color: '#10B981', isPaid: true },

  { id: 'lt-goodwin-cl', tenantId: 'tenant-goodwin', name: 'Casual Leave (CL)', code: 'CL', daysPerYear: 12, color: '#3B82F6', isPaid: true }
];

export const INITIAL_LEAVE_APPLICATIONS: LeaveApplication[] = [
  {
    id: 'la-bat-01',
    tenantId: 'tenant-goodwin-batteries',
    employeeId: 'emp-bat-004',
    employeeName: 'Sunil Kumar',
    leaveTypeId: 'lt-bat-cl',
    leaveTypeName: 'Casual Leave (CL)',
    startDate: '2026-10-22',
    endDate: '2026-10-23',
    totalDays: 2,
    reason: 'Village harvest festival family gathering',
    status: 'PENDING',
    appliedAt: '2026-10-15T10:00:00Z'
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-bat-1',
    tenantId: 'tenant-goodwin-batteries',
    employeeId: 'emp-bat-001',
    employeeName: 'Rajesh Sharma',
    date: '2026-10-16',
    clockInTime: '08:45 AM',
    clockOutTime: '06:15 PM',
    workingHours: 9.5,
    status: 'PRESENT',
    notes: 'Executive Office, Bangalore',
    shiftName: 'General Day Shift'
  },
  {
    id: 'att-bat-2',
    tenantId: 'tenant-goodwin-batteries',
    employeeId: 'emp-bat-003',
    employeeName: 'Amit Patel',
    date: '2026-10-16',
    clockInTime: '05:55 AM',
    clockOutTime: '02:35 PM',
    workingHours: 8.6,
    status: 'PRESENT',
    notes: 'Assembly Line Floor 1',
    shiftName: 'Morning Assembly Shift (A)'
  },
  {
    id: 'att-bat-3',
    tenantId: 'tenant-goodwin-batteries',
    employeeId: 'emp-bat-004',
    employeeName: 'Sunil Kumar',
    date: '2026-10-16',
    clockInTime: '06:05 AM',
    clockOutTime: '02:30 PM',
    workingHours: 8.4,
    status: 'PRESENT',
    notes: 'Cell Welding Station 4',
    shiftName: 'Morning Assembly Shift (A)'
  },
  {
    id: 'att-bat-0',
    tenantId: 'tenant-goodwin-batteries',
    employeeId: 'emp-bat-000',
    employeeName: 'Rajnish Singh Chauhan',
    date: '2026-10-16',
    clockInTime: '06:00 AM',
    clockOutTime: '02:30 PM',
    workingHours: 8.5,
    status: 'PRESENT',
    notes: 'Battery Systems Terminal 1',
    shiftName: 'Morning Shift (A)'
  }
];

export const INITIAL_SALARY_SLIPS: SalarySlip[] = [
  {
    id: 'slip-bat-00',
    tenantId: 'tenant-goodwin-batteries',
    employeeId: 'emp-bat-000',
    employeeName: 'Rajnish Singh Chauhan',
    employeeCode: 'GB-1000',
    departmentName: 'Production & Cell Assembly',
    month: '2026-10',
    basicPay: 37500,
    hra: 18750,
    specialAllowance: 18750,
    grossSalary: 75000,
    providentFund: 1800,
    esi: 0,
    professionalTax: 200,
    taxDeduction: 2500,
    totalDeductions: 4500,
    netPay: 70500,
    paymentStatus: 'PAID',
    generatedDate: '2026-10-01'
  },
  {
    id: 'slip-bat-01',
    tenantId: 'tenant-goodwin-batteries',
    employeeId: 'emp-bat-003',
    employeeName: 'Amit Patel',
    employeeCode: 'GB-1003',
    departmentName: 'Production & Cell Assembly',
    month: '2026-10',
    basicPay: 82500,
    hra: 41250,
    specialAllowance: 41250,
    grossSalary: 165000,
    providentFund: 1800,
    esi: 0,
    professionalTax: 200,
    taxDeduction: 16500,
    totalDeductions: 18500,
    netPay: 146500,
    paymentStatus: 'PAID',
    generatedDate: '2026-10-01'
  },
  {
    id: 'slip-bat-02',
    tenantId: 'tenant-goodwin-batteries',
    employeeId: 'emp-bat-004',
    employeeName: 'Sunil Kumar',
    employeeCode: 'GB-1004',
    departmentName: 'Production & Cell Assembly',
    month: '2026-10',
    basicPay: 21000,
    hra: 10500,
    specialAllowance: 10500,
    grossSalary: 42000,
    providentFund: 1800,
    esi: 315,
    professionalTax: 200,
    taxDeduction: 0,
    totalDeductions: 2315,
    netPay: 39685,
    paymentStatus: 'PAID',
    generatedDate: '2026-10-01'
  }
];

export const INITIAL_JOB_OPENINGS: JobOpening[] = [
  {
    id: 'job-bat-01',
    tenantId: 'tenant-goodwin-batteries',
    title: 'High-Voltage Battery Pack Design Engineer',
    departmentId: 'dept-bat-bms',
    departmentName: 'Research & BMS Engineering',
    experienceLevel: '4-8 Years',
    employmentType: 'FULL_TIME',
    openingsCount: 3,
    location: 'Bangalore, India (On-site Plant)',
    salaryRange: '₹18,00,000 - ₹28,00,000',
    status: 'OPEN',
    description: 'Design thermal runaway mitigation systems and high-voltage wiring for electric vehicle battery packs.',
    createdAt: '2026-10-01T10:00:00Z'
  }
];

export const INITIAL_JOB_APPLICANTS: JobApplicant[] = [
  {
    id: 'app-bat-01',
    tenantId: 'tenant-goodwin-batteries',
    jobOpeningId: 'job-bat-01',
    jobTitle: 'High-Voltage Battery Pack Design Engineer',
    fullName: 'Karthik Balakrishnan',
    email: 'karthik.b@autoenergy.in',
    phone: '+91 98840 33912',
    stage: 'TECHNICAL_INTERVIEW',
    experienceYears: 6,
    currentCompany: 'Ola Electric',
    expectedSalary: '₹24,00,000',
    rating: 5,
    notes: 'Hands-on experience with cylindrical 21700 cell pack architectures.',
    appliedDate: '2026-10-10'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-bat-01',
    tenantId: null,
    tenantName: 'Platform Super Admin',
    actorEmail: 'admin@goodwingrow.ai',
    actorRole: 'SUPER_ADMIN',
    action: 'CLIENT_ONBOARDED',
    resource: 'Tenant',
    resourceId: 'tenant-goodwin-batteries',
    ipAddress: '127.0.0.1',
    timestamp: '2026-04-01T09:00:00Z',
    details: { name: 'Goodwin Batteries Pvt Ltd', code: 'GOODWIN-BAT', plan: 'growth' }
  },
  {
    id: 'audit-bat-02',
    tenantId: 'tenant-goodwin-batteries',
    tenantName: 'Goodwin Batteries Pvt Ltd',
    actorEmail: 'priya.nair@goodwinbatteries.com',
    actorRole: 'HR_ADMIN',
    action: 'INVITATIONS_SENT',
    resource: 'Invitation',
    resourceId: 'inv-bat-neha',
    ipAddress: '103.22.18.91',
    timestamp: '2026-10-14T11:00:00Z',
    details: { count: 2, batch: 'Production & QC Employees' }
  }
];
