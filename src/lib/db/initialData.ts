import {
  Tenant,
  SubscriptionPlan,
  User,
  Department,
  Designation,
  Employee,
  AttendanceRecord,
  LeaveType,
  LeaveAllocation,
  LeaveApplication,
  SalarySlip,
  AuditLogEntry
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
      'Applicant Tracking System (ATS)',
      'Custom Domain & White-Label Branding',
      'Biometric / Geo-fencing API Integrations',
      'Dedicated Account Manager & SLA'
    ]
  }
];

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-goodwin',
    name: 'Goodwin Technologies Pvt Ltd',
    slug: 'goodwin-tech',
    logoUrl: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=128&auto=format&fit=crop&q=80',
    primaryColor: '#059669', // Emerald
    status: 'ACTIVE',
    planId: 'enterprise',
    maxEmployees: 250,
    domain: 'goodwintech.goodwingrow.com',
    currency: 'INR',
    country: 'India',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-10-15T10:30:00Z'
  },
  {
    id: 'tenant-nexus',
    name: 'Nexus AI Labs Inc.',
    slug: 'nexus-ai',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    primaryColor: '#6366F1', // Indigo
    status: 'ACTIVE',
    planId: 'growth',
    maxEmployees: 100,
    domain: 'nexus.goodwingrow.com',
    currency: 'USD',
    country: 'United States',
    createdAt: '2026-03-01T14:20:00Z',
    updatedAt: '2026-10-14T08:15:00Z'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-super-admin',
    tenantId: null,
    name: 'Rajnish Chauhan (Super Admin)',
    email: 'admin@goodwingrow.ai',
    role: 'SUPER_ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user-goodwin-admin',
    tenantId: 'tenant-goodwin',
    name: 'Sarah Jenkins',
    email: 'sarah.director@goodwintech.com',
    role: 'COMPANY_ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    departmentId: 'dept-goodwin-hr',
    employeeId: 'emp-goodwin-001',
    isActive: true,
    createdAt: '2026-01-15T10:00:00Z'
  },
  {
    id: 'user-goodwin-emp1',
    tenantId: 'tenant-goodwin',
    name: 'Alex Rivera',
    email: 'alex.rivera@goodwintech.com',
    role: 'EMPLOYEE',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    departmentId: 'dept-goodwin-eng',
    employeeId: 'emp-goodwin-002',
    isActive: true,
    createdAt: '2026-02-01T11:00:00Z'
  },
  {
    id: 'user-nexus-admin',
    tenantId: 'tenant-nexus',
    name: 'Elena Rostova',
    email: 'elena.hr@nexusai.io',
    role: 'COMPANY_ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    departmentId: 'dept-nexus-ops',
    employeeId: 'emp-nexus-001',
    isActive: true,
    createdAt: '2026-03-01T14:30:00Z'
  },
  {
    id: 'user-nexus-emp1',
    tenantId: 'tenant-nexus',
    name: 'Vikram Mehta',
    email: 'vikram.researcher@nexusai.io',
    role: 'EMPLOYEE',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    departmentId: 'dept-nexus-rd',
    employeeId: 'emp-nexus-002',
    isActive: true,
    createdAt: '2026-03-15T09:30:00Z'
  }
];

export const INITIAL_DEPARTMENTS: Department[] = [
  // Goodwin Tech
  { id: 'dept-goodwin-hr', tenantId: 'tenant-goodwin', name: 'Human Resources & People', code: 'HR' },
  { id: 'dept-goodwin-eng', tenantId: 'tenant-goodwin', name: 'Engineering & Technology', code: 'ENG' },
  { id: 'dept-goodwin-prod', tenantId: 'tenant-goodwin', name: 'Product Management', code: 'PROD' },
  { id: 'dept-goodwin-finance', tenantId: 'tenant-goodwin', name: 'Finance & Compliance', code: 'FIN' },

  // Nexus AI
  { id: 'dept-nexus-ops', tenantId: 'tenant-nexus', name: 'People Operations', code: 'POPS' },
  { id: 'dept-nexus-rd', tenantId: 'tenant-nexus', name: 'AI Research & Deep Learning', code: 'RND' },
  { id: 'dept-nexus-cloud', tenantId: 'tenant-nexus', name: 'Infrastructure & Cloud', code: 'INFRA' }
];

export const INITIAL_DESIGNATIONS: Designation[] = [
  // Goodwin Tech
  { id: 'desig-goodwin-hrd', tenantId: 'tenant-goodwin', title: 'VP of Human Resources', departmentId: 'dept-goodwin-hr', gradeLevel: 'L7' },
  { id: 'desig-goodwin-sde3', tenantId: 'tenant-goodwin', title: 'Senior Staff Engineer', departmentId: 'dept-goodwin-eng', gradeLevel: 'L5' },
  { id: 'desig-goodwin-sde1', tenantId: 'tenant-goodwin', title: 'Frontend Developer', departmentId: 'dept-goodwin-eng', gradeLevel: 'L3' },
  { id: 'desig-goodwin-pm', tenantId: 'tenant-goodwin', title: 'Principal Product Manager', departmentId: 'dept-goodwin-prod', gradeLevel: 'L6' },

  // Nexus AI
  { id: 'desig-nexus-hrm', tenantId: 'tenant-nexus', title: 'Head of People Operations', departmentId: 'dept-nexus-ops', gradeLevel: 'M2' },
  { id: 'desig-nexus-rs', tenantId: 'tenant-nexus', title: 'Lead AI Research Scientist', departmentId: 'dept-nexus-rd', gradeLevel: 'IC5' },
  { id: 'desig-nexus-devops', tenantId: 'tenant-nexus', title: 'DevOps & MLOps Lead', departmentId: 'dept-nexus-cloud', gradeLevel: 'IC4' }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  // Goodwin Tech Employees
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
    panOrTaxId: 'ABCDE1234F',
    bankAccountNumber: '918237465019',
    bankName: 'HDFC Bank',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    createdAt: '2024-03-01T09:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z'
  },
  {
    id: 'emp-goodwin-002',
    tenantId: 'tenant-goodwin',
    employeeCode: 'GWT-1002',
    firstName: 'Alex',
    lastName: 'Rivera',
    workEmail: 'alex.rivera@goodwintech.com',
    phone: '+91 98765 11223',
    gender: 'MALE',
    joiningDate: '2024-06-15',
    departmentId: 'dept-goodwin-eng',
    departmentName: 'Engineering & Technology',
    designationId: 'desig-goodwin-sde3',
    designationTitle: 'Senior Staff Engineer',
    reportingManagerName: 'Sarah Jenkins',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    monthlySalary: 185000,
    panOrTaxId: 'BKSPK9921M',
    bankAccountNumber: '401928374615',
    bankName: 'ICICI Bank',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    createdAt: '2024-06-15T09:00:00Z',
    updatedAt: '2026-10-14T11:00:00Z'
  },
  {
    id: 'emp-goodwin-003',
    tenantId: 'tenant-goodwin',
    employeeCode: 'GWT-1003',
    firstName: 'Priya',
    lastName: 'Sharma',
    workEmail: 'priya.sharma@goodwintech.com',
    phone: '+91 98111 22334',
    gender: 'FEMALE',
    joiningDate: '2025-01-10',
    departmentId: 'dept-goodwin-prod',
    departmentName: 'Product Management',
    designationId: 'desig-goodwin-pm',
    designationTitle: 'Principal Product Manager',
    reportingManagerName: 'Sarah Jenkins',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    monthlySalary: 210000,
    panOrTaxId: 'PRYSH5512L',
    bankAccountNumber: '123890475612',
    bankName: 'Axis Bank',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2026-10-12T14:00:00Z'
  },

  // Nexus AI Employees (Completely isolated)
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
    monthlySalary: 11500, // USD
    panOrTaxId: 'SSN-XXX-XX-9128',
    bankAccountNumber: '3948571029',
    bankName: 'Silicon Valley Bank',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    createdAt: '2025-02-01T08:00:00Z',
    updatedAt: '2026-10-10T16:00:00Z'
  },
  {
    id: 'emp-nexus-002',
    tenantId: 'tenant-nexus',
    employeeCode: 'NX-002',
    firstName: 'Vikram',
    lastName: 'Mehta',
    workEmail: 'vikram.researcher@nexusai.io',
    phone: '+1 (415) 555-0844',
    gender: 'MALE',
    joiningDate: '2025-04-15',
    departmentId: 'dept-nexus-rd',
    departmentName: 'AI Research & Deep Learning',
    designationId: 'desig-nexus-rs',
    designationTitle: 'Lead AI Research Scientist',
    reportingManagerName: 'Elena Rostova',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    monthlySalary: 14000, // USD
    panOrTaxId: 'SSN-XXX-XX-4412',
    bankAccountNumber: '8872910482',
    bankName: 'Chase Bank',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    createdAt: '2025-04-15T09:00:00Z',
    updatedAt: '2026-10-11T12:00:00Z'
  }
];

export const INITIAL_LEAVE_TYPES: LeaveType[] = [
  // Goodwin Tech
  { id: 'lt-goodwin-cl', tenantId: 'tenant-goodwin', name: 'Casual Leave (CL)', code: 'CL', daysPerYear: 12, color: '#3B82F6', isPaid: true },
  { id: 'lt-goodwin-sl', tenantId: 'tenant-goodwin', name: 'Sick Leave (SL)', code: 'SL', daysPerYear: 10, color: '#EF4444', isPaid: true },
  { id: 'lt-goodwin-pl', tenantId: 'tenant-goodwin', name: 'Privilege Leave (Earned)', code: 'PL', daysPerYear: 18, color: '#10B981', isPaid: true },

  // Nexus AI
  { id: 'lt-nexus-pto', tenantId: 'tenant-nexus', name: 'Paid Time Off (PTO)', code: 'PTO', daysPerYear: 22, color: '#6366F1', isPaid: true },
  { id: 'lt-nexus-sick', tenantId: 'tenant-nexus', name: 'Medical & Wellness', code: 'MED', daysPerYear: 12, color: '#EC4899', isPaid: true }
];

export const INITIAL_LEAVE_APPLICATIONS: LeaveApplication[] = [
  {
    id: 'la-goodwin-01',
    tenantId: 'tenant-goodwin',
    employeeId: 'emp-goodwin-002',
    employeeName: 'Alex Rivera',
    leaveTypeId: 'lt-goodwin-cl',
    leaveTypeName: 'Casual Leave (CL)',
    startDate: '2026-10-20',
    endDate: '2026-10-21',
    totalDays: 2,
    reason: 'Family wedding ceremony attending in hometown',
    status: 'APPROVED',
    appliedAt: '2026-10-12T10:30:00Z',
    reviewedBy: 'Sarah Jenkins',
    reviewComment: 'Approved. Enjoy the celebration!'
  },
  {
    id: 'la-goodwin-02',
    tenantId: 'tenant-goodwin',
    employeeId: 'emp-goodwin-003',
    employeeName: 'Priya Sharma',
    leaveTypeId: 'lt-goodwin-pl',
    leaveTypeName: 'Privilege Leave (Earned)',
    startDate: '2026-10-28',
    endDate: '2026-10-31',
    totalDays: 4,
    reason: 'Annual Diwali holidays & personal vacation',
    status: 'PENDING',
    appliedAt: '2026-10-15T14:10:00Z'
  },
  {
    id: 'la-nexus-01',
    tenantId: 'tenant-nexus',
    employeeId: 'emp-nexus-002',
    employeeName: 'Vikram Mehta',
    leaveTypeId: 'lt-nexus-pto',
    leaveTypeName: 'Paid Time Off (PTO)',
    startDate: '2026-11-02',
    endDate: '2026-11-06',
    totalDays: 5,
    reason: 'NeurIPS conference travel and presentation',
    status: 'APPROVED',
    appliedAt: '2026-10-05T09:00:00Z',
    reviewedBy: 'Elena Rostova',
    reviewComment: 'Approved! Best of luck with your talk.'
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  // Goodwin Tech
  {
    id: 'att-goodwin-1',
    tenantId: 'tenant-goodwin',
    employeeId: 'emp-goodwin-001',
    employeeName: 'Sarah Jenkins',
    date: '2026-10-16',
    clockInTime: '09:05 AM',
    clockOutTime: '06:12 PM',
    workingHours: 9.1,
    status: 'PRESENT',
    notes: 'Headquarters Office, Bangalore'
  },
  {
    id: 'att-goodwin-2',
    tenantId: 'tenant-goodwin',
    employeeId: 'emp-goodwin-002',
    employeeName: 'Alex Rivera',
    date: '2026-10-16',
    clockInTime: '09:28 AM',
    clockOutTime: '06:45 PM',
    workingHours: 9.3,
    status: 'PRESENT',
    notes: 'Engineering Lab 4'
  },
  {
    id: 'att-goodwin-3',
    tenantId: 'tenant-goodwin',
    employeeId: 'emp-goodwin-003',
    employeeName: 'Priya Sharma',
    date: '2026-10-16',
    clockInTime: '10:05 AM',
    clockOutTime: '07:15 PM',
    workingHours: 9.2,
    status: 'LATE_ENTRY',
    notes: 'Traffic on Outer Ring Road, notified via Slack'
  },

  // Nexus AI
  {
    id: 'att-nexus-1',
    tenantId: 'tenant-nexus',
    employeeId: 'emp-nexus-001',
    employeeName: 'Elena Rostova',
    date: '2026-10-16',
    clockInTime: '08:45 AM',
    clockOutTime: '05:30 PM',
    workingHours: 8.75,
    status: 'PRESENT',
    notes: 'San Francisco HQ'
  },
  {
    id: 'att-nexus-2',
    tenantId: 'tenant-nexus',
    employeeId: 'emp-nexus-002',
    employeeName: 'Vikram Mehta',
    date: '2026-10-16',
    clockInTime: '09:15 AM',
    clockOutTime: '06:30 PM',
    workingHours: 9.25,
    status: 'PRESENT',
    notes: 'Compute Cluster Lab'
  }
];

export const INITIAL_SALARY_SLIPS: SalarySlip[] = [
  {
    id: 'slip-goodwin-01',
    tenantId: 'tenant-goodwin',
    employeeId: 'emp-goodwin-001',
    employeeName: 'Sarah Jenkins',
    employeeCode: 'GWT-1001',
    departmentName: 'Human Resources & People',
    month: '2026-10',
    basicPay: 120000,
    hra: 60000,
    specialAllowance: 60000,
    grossSalary: 240000,
    providentFund: 14400,
    esi: 0,
    professionalTax: 200,
    taxDeduction: 28000,
    totalDeductions: 42600,
    netPay: 197400,
    paymentStatus: 'PAID',
    generatedDate: '2026-10-01'
  },
  {
    id: 'slip-goodwin-02',
    tenantId: 'tenant-goodwin',
    employeeId: 'emp-goodwin-002',
    employeeName: 'Alex Rivera',
    employeeCode: 'GWT-1002',
    departmentName: 'Engineering & Technology',
    month: '2026-10',
    basicPay: 92500,
    hra: 46250,
    specialAllowance: 46250,
    grossSalary: 185000,
    providentFund: 11100,
    esi: 0,
    professionalTax: 200,
    taxDeduction: 18500,
    totalDeductions: 29800,
    netPay: 155200,
    paymentStatus: 'PAID',
    generatedDate: '2026-10-01'
  },
  {
    id: 'slip-nexus-01',
    tenantId: 'tenant-nexus',
    employeeId: 'emp-nexus-002',
    employeeName: 'Vikram Mehta',
    employeeCode: 'NX-002',
    departmentName: 'AI Research & Deep Learning',
    month: '2026-10',
    basicPay: 8000,
    hra: 3500,
    specialAllowance: 2500,
    grossSalary: 14000,
    providentFund: 0,
    esi: 0,
    professionalTax: 0,
    taxDeduction: 2950,
    totalDeductions: 2950,
    netPay: 11050,
    paymentStatus: 'PAID',
    generatedDate: '2026-10-01'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-01',
    tenantId: null,
    tenantName: 'Platform Super Admin',
    actorEmail: 'admin@goodwingrow.ai',
    actorRole: 'SUPER_ADMIN',
    action: 'TENANT_ONBOARDED',
    resource: 'Tenant',
    resourceId: 'tenant-nexus',
    ipAddress: '192.168.1.1',
    timestamp: '2026-10-15T09:12:44Z',
    details: { plan: 'growth', name: 'Nexus AI Labs Inc.' }
  },
  {
    id: 'audit-02',
    tenantId: 'tenant-goodwin',
    tenantName: 'Goodwin Technologies Pvt Ltd',
    actorEmail: 'sarah.director@goodwintech.com',
    actorRole: 'COMPANY_ADMIN',
    action: 'LEAVE_APPLICATION_APPROVED',
    resource: 'LeaveApplication',
    resourceId: 'la-goodwin-01',
    ipAddress: '103.22.18.91',
    timestamp: '2026-10-15T11:45:00Z',
    details: { employee: 'Alex Rivera', days: 2 }
  },
  {
    id: 'audit-03',
    tenantId: 'tenant-goodwin',
    tenantName: 'Goodwin Technologies Pvt Ltd',
    actorEmail: 'sarah.director@goodwintech.com',
    actorRole: 'COMPANY_ADMIN',
    action: 'PAYROLL_GENERATED',
    resource: 'SalarySlip',
    resourceId: 'slip-goodwin-02',
    ipAddress: '103.22.18.91',
    timestamp: '2026-10-16T08:30:00Z',
    details: { count: 3, month: '2026-10' }
  }
];
