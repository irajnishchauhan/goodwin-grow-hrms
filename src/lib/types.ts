export type UserRole =
  | 'SUPER_ADMIN'
  | 'COMPANY_ADMIN'
  | 'HR_ADMIN'
  | 'MANAGER'
  | 'EMPLOYEE';

export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED';

export type SubscriptionPlanId = 'starter' | 'growth' | 'enterprise';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  monthlyPriceUSD: number;
  maxEmployees: number;
  features: string[];
  isPopular?: boolean;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  route: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  companyCode: string;
  logoUrl?: string;
  industry: string;
  businessEmail: string;
  businessPhone: string;
  registeredAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  website: string;
  timezone: string;
  currency: string;
  financialYear: string;
  primaryColor: string;
  status: TenantStatus;
  planId: SubscriptionPlanId;
  maxEmployees: number;
  domain?: string;
  enabledModules: string[];
  subscriptionStart: string;
  subscriptionRenewal: string;
  billingContact: string;
  trialStatus: boolean;
  onboardingChecklist: OnboardingStep[];
  orgTreeRootId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantMembership {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  phone?: string;
  isSuperAdmin: boolean;
  memberships: TenantMembership[];
  activeTenantId?: string; // Currently selected company
  isActive: boolean;
  createdAt: string;
}

export interface Department {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  headEmployeeId?: string;
}

export interface Designation {
  id: string;
  tenantId: string;
  title: string;
  departmentId: string;
  gradeLevel: string;
}

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
export type EmployeeStatus = 'ACTIVE' | 'PROBATION' | 'NOTICE_PERIOD' | 'TERMINATED' | 'EXITED' | 'ARCHIVED';
export type LoginActivationStatus = 'NOT_INVITED' | 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface Employee {
  id: string;
  tenantId: string;
  userId?: string; // Linked when account is activated
  employeeCode: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  personalEmail?: string;
  phone: string;
  dateOfBirth?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  joiningDate: string;
  departmentId: string;
  designationId: string;
  departmentName?: string;
  designationTitle?: string;
  reportingManagerId?: string;
  reportingManagerName?: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  monthlySalary: number;
  panOrTaxId?: string;
  bankAccountNumber?: string;
  bankName?: string;
  workLocation?: string;
  shiftName?: string;
  avatarUrl?: string;
  loginStatus: LoginActivationStatus;
  invitationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  tenantId: string;
  tenantName: string;
  employeeId: string;
  employeeName: string;
  email: string;
  role: UserRole;
  token: string;
  tokenHash: string;
  status: LoginActivationStatus;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  lastSentAt?: string;
}

export interface ImportBatch {
  id: string;
  tenantId: string;
  fileName: string;
  totalRows: number;
  importedCount: number;
  failedCount: number;
  errors: { row: number; email: string; reason: string }[];
  importedAt: string;
}

export interface EmployeeDocument {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  title: string;
  documentType: 'CONTRACT' | 'OFFER_LETTER' | 'IDENTITY_PROOF' | 'TAX_DECLARATION' | 'CERTIFICATE';
  fileName: string;
  fileSize: string;
  uploadedAt: string;
}

// Attendance & Shifts
export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'HALF_DAY'
  | 'ON_LEAVE'
  | 'LATE_ENTRY'
  | 'HOLIDAY';

export interface Shift {
  id: string;
  tenantId: string;
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  isDefault: boolean;
  color: string;
}

export interface AttendanceRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName?: string;
  date: string; // YYYY-MM-DD
  clockInTime?: string;
  clockOutTime?: string;
  workingHours: number;
  status: AttendanceStatus;
  notes?: string;
  shiftName?: string;
}

export interface RegularizationRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  attendanceDate: string;
  requestedClockIn: string;
  requestedClockOut: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  reviewedBy?: string;
  managerId?: string;
  managerName?: string;
  comment?: string;
}

export interface Holiday {
  id: string;
  tenantId: string;
  name: string;
  date: string;
  dayOfWeek: string;
  isOptional: boolean;
}

// Leaves
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveType {
  id: string;
  tenantId: string;
  name: string;
  code: string; // CL, SL, PL
  daysPerYear: number;
  color: string;
  isPaid: boolean;
}

export interface LeaveApplication {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName?: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedBy?: string;
  reviewComment?: string;
}

// Payroll
export interface SalaryComponentConfig {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  type: 'EARNING' | 'DEDUCTION';
  percentageOfBasic?: number;
  isTaxable: boolean;
  isMandatory: boolean;
}

export interface SalarySlip {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  month: string; // '2026-10'
  basicPay: number;
  hra: number;
  specialAllowance: number;
  grossSalary: number;
  providentFund: number;
  esi: number;
  professionalTax: number;
  taxDeduction: number;
  totalDeductions: number;
  netPay: number;
  paymentStatus: 'PAID' | 'PENDING' | 'PROCESSING';
  generatedDate: string;
}

// Recruitment & ATS
export type CandidateStage =
  | 'APPLIED'
  | 'SCREENING'
  | 'TECHNICAL_INTERVIEW'
  | 'HR_ROUND'
  | 'OFFERED'
  | 'HIRED'
  | 'REJECTED';

export interface JobOpening {
  id: string;
  tenantId: string;
  title: string;
  departmentId: string;
  departmentName: string;
  experienceLevel: string;
  employmentType: EmploymentType;
  openingsCount: number;
  location: string;
  salaryRange: string;
  status: 'OPEN' | 'ON_HOLD' | 'CLOSED';
  description: string;
  createdAt: string;
}

export interface JobApplicant {
  id: string;
  tenantId: string;
  jobOpeningId: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string;
  stage: CandidateStage;
  experienceYears: number;
  currentCompany?: string;
  expectedSalary: string;
  rating?: number; // 1-5
  notes?: string;
  appliedDate: string;
}

export interface AuditLogEntry {
  id: string;
  tenantId: string | null;
  tenantName?: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  timestamp: string;
  details?: Record<string, unknown>;
}
