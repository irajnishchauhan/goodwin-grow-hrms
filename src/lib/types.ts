export type UserRole =
  | 'SUPER_ADMIN'
  | 'COMPANY_ADMIN'
  | 'HR_MANAGER'
  | 'DEPARTMENT_HEAD'
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

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor: string;
  status: TenantStatus;
  planId: SubscriptionPlanId;
  maxEmployees: number;
  domain?: string;
  currency: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  tenantId: string | null; // null for Super Admin
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  departmentId?: string;
  employeeId?: string;
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
export type EmployeeStatus = 'ACTIVE' | 'PROBATION' | 'NOTICE_PERIOD' | 'TERMINATED';

export interface Employee {
  id: string;
  tenantId: string;
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
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'HALF_DAY'
  | 'ON_LEAVE'
  | 'LATE_ENTRY'
  | 'HOLIDAY';

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
}

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

export interface LeaveAllocation {
  id: string;
  tenantId: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  totalDays: number;
  usedDays: number;
  balanceDays: number;
  year: number;
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

export interface SalaryComponent {
  id: string;
  tenantId: string;
  name: string;
  type: 'EARNING' | 'DEDUCTION';
  isTaxable: boolean;
  percentageOfBasic?: number;
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
