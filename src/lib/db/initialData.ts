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
  SalaryComponentConfig
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
  { id: 'desig-goodwin-pm', tenantId: 'tenant-goodwin', title: 'Principal Product Manager', departmentId: 'dept-goodwin-prod', gradeLevel: 'L6' },

  // Nexus AI
  { id: 'desig-nexus-hrm', tenantId: 'tenant-nexus', title: 'Head of People Operations', departmentId: 'dept-nexus-ops', gradeLevel: 'M2' },
  { id: 'desig-nexus-rs', tenantId: 'tenant-nexus', title: 'Lead AI Research Scientist', departmentId: 'dept-nexus-rd', gradeLevel: 'IC5' },
  { id: 'desig-nexus-devops', tenantId: 'tenant-nexus', title: 'DevOps & MLOps Lead', departmentId: 'dept-nexus-cloud', gradeLevel: 'IC4' }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  // Goodwin Tech Employees (Hierarchical tree structure)
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
    reportingManagerName: 'Board of Directors',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    monthlySalary: 450000,
    panOrTaxId: 'DEVC1234K',
    bankAccountNumber: '900182736451',
    bankName: 'HDFC Bank',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
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
    reportingManagerId: 'emp-goodwin-000',
    reportingManagerName: 'Devendra Chauhan (CEO)',
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
    reportingManagerId: 'emp-goodwin-000',
    reportingManagerName: 'Devendra Chauhan (CEO)',
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
    reportingManagerId: 'emp-goodwin-000',
    reportingManagerName: 'Devendra Chauhan (CEO)',
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

export const INITIAL_SHIFTS: Shift[] = [
  { id: 'shift-gw-gen', tenantId: 'tenant-goodwin', name: 'General Shift', startTime: '09:00 AM', endTime: '06:00 PM', graceMinutes: 15, isDefault: true, color: '#059669' },
  { id: 'shift-gw-morn', tenantId: 'tenant-goodwin', name: 'Early Engineering Shift', startTime: '07:30 AM', endTime: '04:30 PM', graceMinutes: 10, isDefault: false, color: '#3B82F6' },
  { id: 'shift-gw-night', tenantId: 'tenant-goodwin', name: 'Cloud Operations Night', startTime: '08:00 PM', endTime: '05:00 AM', graceMinutes: 15, isDefault: false, color: '#8B5CF6' },

  { id: 'shift-nx-core', tenantId: 'tenant-nexus', name: 'Pacific Standard Core', startTime: '09:00 AM', endTime: '05:30 PM', graceMinutes: 20, isDefault: true, color: '#6366F1' }
];

export const INITIAL_HOLIDAYS: Holiday[] = [
  // Goodwin Tech (India Calendar)
  { id: 'hol-gw-1', tenantId: 'tenant-goodwin', name: 'Diwali Festival of Lights', date: '2026-11-08', dayOfWeek: 'Sunday', isOptional: false },
  { id: 'hol-gw-2', tenantId: 'tenant-goodwin', name: 'Diwali Balipratipada', date: '2026-11-09', dayOfWeek: 'Monday', isOptional: false },
  { id: 'hol-gw-3', tenantId: 'tenant-goodwin', name: 'Christmas Day', date: '2026-12-25', dayOfWeek: 'Friday', isOptional: false },
  { id: 'hol-gw-4', tenantId: 'tenant-goodwin', name: 'Republic Day', date: '2027-01-26', dayOfWeek: 'Tuesday', isOptional: false },

  // Nexus AI (US Calendar)
  { id: 'hol-nx-1', tenantId: 'tenant-nexus', name: 'Thanksgiving Day', date: '2026-11-26', dayOfWeek: 'Thursday', isOptional: false },
  { id: 'hol-nx-2', tenantId: 'tenant-nexus', name: 'Day After Thanksgiving', date: '2026-11-27', dayOfWeek: 'Friday', isOptional: false },
  { id: 'hol-nx-3', tenantId: 'tenant-nexus', name: 'Christmas Day', date: '2026-12-25', dayOfWeek: 'Friday', isOptional: false }
];

export const INITIAL_REGULARIZATIONS: RegularizationRequest[] = [
  {
    id: 'reg-01',
    tenantId: 'tenant-goodwin',
    employeeId: 'emp-goodwin-003',
    employeeName: 'Priya Sharma',
    attendanceDate: '2026-10-16',
    requestedClockIn: '09:15 AM',
    requestedClockOut: '07:15 PM',
    reason: 'Metro power glitch delayed train arrival at Indiranagar station',
    status: 'PENDING',
    requestedAt: '2026-10-16T11:00:00Z'
  }
];

export const INITIAL_DOCUMENTS: EmployeeDocument[] = [
  {
    id: 'doc-01',
    tenantId: 'tenant-goodwin',
    employeeId: 'emp-goodwin-002',
    employeeName: 'Alex Rivera',
    title: 'Signed Employment Contract',
    documentType: 'CONTRACT',
    fileName: 'Alex_Rivera_Offer_Contract_2024.pdf',
    fileSize: '1.4 MB',
    uploadedAt: '2024-06-15T10:00:00Z'
  },
  {
    id: 'doc-02',
    tenantId: 'tenant-goodwin',
    employeeId: 'emp-goodwin-002',
    employeeName: 'Alex Rivera',
    title: 'Non-Disclosure Agreement (NDA)',
    documentType: 'CONTRACT',
    fileName: 'Goodwin_Proprietary_NDA_Signed.pdf',
    fileSize: '840 KB',
    uploadedAt: '2024-06-15T10:05:00Z'
  },
  {
    id: 'doc-03',
    tenantId: 'tenant-goodwin',
    employeeId: 'emp-goodwin-001',
    employeeName: 'Sarah Jenkins',
    title: 'Executive Appointment Letter',
    documentType: 'OFFER_LETTER',
    fileName: 'Sarah_Jenkins_Executive_Appointment.pdf',
    fileSize: '1.9 MB',
    uploadedAt: '2024-03-01T09:30:00Z'
  }
];

export const INITIAL_LEAVE_TYPES: LeaveType[] = [
  { id: 'lt-goodwin-cl', tenantId: 'tenant-goodwin', name: 'Casual Leave (CL)', code: 'CL', daysPerYear: 12, color: '#3B82F6', isPaid: true },
  { id: 'lt-goodwin-sl', tenantId: 'tenant-goodwin', name: 'Sick Leave (SL)', code: 'SL', daysPerYear: 10, color: '#EF4444', isPaid: true },
  { id: 'lt-goodwin-pl', tenantId: 'tenant-goodwin', name: 'Privilege Leave (Earned)', code: 'PL', daysPerYear: 18, color: '#10B981', isPaid: true },

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
  {
    id: 'att-goodwin-0',
    tenantId: 'tenant-goodwin',
    employeeId: 'emp-goodwin-000',
    employeeName: 'Devendra Chauhan',
    date: '2026-10-16',
    clockInTime: '08:50 AM',
    clockOutTime: '06:00 PM',
    workingHours: 9.1,
    status: 'PRESENT',
    notes: 'Executive Boardroom, Bangalore'
  },
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
    notes: 'Traffic on Outer Ring Road, regularized'
  },

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
    id: 'slip-goodwin-00',
    tenantId: 'tenant-goodwin',
    employeeId: 'emp-goodwin-000',
    employeeName: 'Devendra Chauhan',
    employeeCode: 'GWT-1000',
    departmentName: 'Executive Leadership',
    month: '2026-10',
    basicPay: 225000,
    hra: 112500,
    specialAllowance: 112500,
    grossSalary: 450000,
    providentFund: 1800,
    esi: 0,
    professionalTax: 200,
    taxDeduction: 67500,
    totalDeductions: 69500,
    netPay: 380500,
    paymentStatus: 'PAID',
    generatedDate: '2026-10-01'
  },
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
    providentFund: 1800,
    esi: 0,
    professionalTax: 200,
    taxDeduction: 28000,
    totalDeductions: 30000,
    netPay: 210000,
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
    providentFund: 1800,
    esi: 0,
    professionalTax: 200,
    taxDeduction: 18500,
    totalDeductions: 20500,
    netPay: 164500,
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

export const INITIAL_JOB_OPENINGS: JobOpening[] = [
  // Goodwin Tech Openings
  {
    id: 'job-gw-01',
    tenantId: 'tenant-goodwin',
    title: 'Senior Distributed Systems Architect',
    departmentId: 'dept-goodwin-eng',
    departmentName: 'Engineering & Technology',
    experienceLevel: '6-10 Years',
    employmentType: 'FULL_TIME',
    openingsCount: 2,
    location: 'Bangalore, India (Hybrid)',
    salaryRange: '₹35,00,000 - ₹50,00,000',
    status: 'OPEN',
    description: 'Looking for a Distributed Systems Architect to build low-latency event-driven infrastructure.',
    createdAt: '2026-10-01T10:00:00Z'
  },
  {
    id: 'job-gw-02',
    tenantId: 'tenant-goodwin',
    title: 'Talent Acquisition & HR Lead',
    departmentId: 'dept-goodwin-hr',
    departmentName: 'Human Resources & People',
    experienceLevel: '4-7 Years',
    employmentType: 'FULL_TIME',
    openingsCount: 1,
    location: 'Bangalore, India (On-site)',
    salaryRange: '₹18,00,000 - ₹25,00,000',
    status: 'OPEN',
    description: 'Lead recruitment, candidate sourcing, and onboarding operations across engineering and sales.',
    createdAt: '2026-10-05T11:30:00Z'
  },

  // Nexus AI Openings
  {
    id: 'job-nx-01',
    tenantId: 'tenant-nexus',
    title: 'Senior Deep Learning Research Engineer',
    departmentId: 'dept-nexus-rd',
    departmentName: 'AI Research & Deep Learning',
    experienceLevel: '5+ Years',
    employmentType: 'FULL_TIME',
    openingsCount: 3,
    location: 'San Francisco, CA / Remote',
    salaryRange: '$180,000 - $240,000',
    status: 'OPEN',
    description: 'Researching novel multi-modal diffusion transformers and LLM reasoning topologies.',
    createdAt: '2026-10-08T14:00:00Z'
  }
];

export const INITIAL_JOB_APPLICANTS: JobApplicant[] = [
  // Goodwin Candidates
  {
    id: 'app-gw-01',
    tenantId: 'tenant-goodwin',
    jobOpeningId: 'job-gw-01',
    jobTitle: 'Senior Distributed Systems Architect',
    fullName: 'Rohan Deshmukh',
    email: 'rohan.deshmukh@gmail.com',
    phone: '+91 98220 11992',
    stage: 'TECHNICAL_INTERVIEW',
    experienceYears: 8,
    currentCompany: 'Amazon Web Services',
    expectedSalary: '₹45,00,000',
    rating: 5,
    notes: 'Exceptional grasp of consensus algorithms (Raft), RocksDB, and multi-tenant sharding.',
    appliedDate: '2026-10-06'
  },
  {
    id: 'app-gw-02',
    tenantId: 'tenant-goodwin',
    jobOpeningId: 'job-gw-01',
    jobTitle: 'Senior Distributed Systems Architect',
    fullName: 'Ananya Pillai',
    email: 'ananya.p@outlook.com',
    phone: '+91 98440 22119',
    stage: 'HR_ROUND',
    experienceYears: 7,
    currentCompany: 'Flipkart',
    expectedSalary: '₹42,00,000',
    rating: 4,
    notes: 'Strong system design round; salary negotiation in progress.',
    appliedDate: '2026-10-08'
  },
  {
    id: 'app-gw-03',
    tenantId: 'tenant-goodwin',
    jobOpeningId: 'job-gw-02',
    jobTitle: 'Talent Acquisition & HR Lead',
    fullName: 'Kavita Menon',
    email: 'kavita.recruiter@yahoo.com',
    phone: '+91 99881 77221',
    stage: 'OFFERED',
    experienceYears: 6,
    currentCompany: 'Swiggy',
    expectedSalary: '₹22,00,000',
    rating: 5,
    notes: 'Offer letter generated. Expected joining date Nov 1st.',
    appliedDate: '2026-10-10'
  },

  // Nexus AI Candidate
  {
    id: 'app-nx-01',
    tenantId: 'tenant-nexus',
    jobOpeningId: 'job-nx-01',
    jobTitle: 'Senior Deep Learning Research Engineer',
    fullName: 'David Thorne',
    email: 'd.thorne@stanford.alumni.edu',
    phone: '+1 650 555-8219',
    stage: 'TECHNICAL_INTERVIEW',
    experienceYears: 6,
    currentCompany: 'OpenAI (Contractor)',
    expectedSalary: '$220,000',
    rating: 5,
    notes: 'Published papers at CVPR and NeurIPS 2025. Impressive coding submission.',
    appliedDate: '2026-10-11'
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
