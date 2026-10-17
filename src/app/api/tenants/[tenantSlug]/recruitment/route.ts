import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';
import { JobOpening, JobApplicant } from '@/lib/types';

export const dynamic = 'force-dynamic';

function getDefaultOpenings(tenantId: string): JobOpening[] {
  return [
    {
      id: `job-${tenantId}-1`,
      tenantId,
      title: 'Lead Battery BMS Firmware Engineer',
      departmentId: 'dept-eng',
      departmentName: 'Engineering & Technology',
      experienceLevel: '4-7 Years',
      employmentType: 'FULL_TIME',
      openingsCount: 2,
      location: 'Indore / Hybrid',
      salaryRange: '₹18,00,000 - ₹26,00,000',
      status: 'OPEN',
      description: 'Lead architecture of battery management systems, thermal runaway algorithms, and telemetry CAN integration.',
      createdAt: '2026-10-01T09:00:00Z'
    },
    {
      id: `job-${tenantId}-2`,
      tenantId,
      title: 'EV Fleet Operations Specialist',
      departmentId: 'dept-ops',
      departmentName: 'Fleet & Dispatch',
      experienceLevel: '2-4 Years',
      employmentType: 'FULL_TIME',
      openingsCount: 3,
      location: 'Indore, MP',
      salaryRange: '₹6,00,000 - ₹9,50,000',
      status: 'OPEN',
      description: 'Manage fast-turnaround battery swapping hubs, delivery fleet readiness, and driver telemetry verification.',
      createdAt: '2026-10-05T10:00:00Z'
    },
    {
      id: `job-${tenantId}-3`,
      tenantId,
      title: 'Industrial Battery Quality & Testing Analyst',
      departmentId: 'dept-qc',
      departmentName: 'Quality Assurance',
      experienceLevel: '1-3 Years',
      employmentType: 'FULL_TIME',
      openingsCount: 2,
      location: 'Indore Facility',
      salaryRange: '₹5,00,000 - ₹7,50,000',
      status: 'OPEN',
      description: 'Perform cyclic life testing, impedance spectrometry, and cell grading for production fleet packs.',
      createdAt: '2026-10-08T11:00:00Z'
    }
  ];
}

function getDefaultApplicants(tenantId: string): JobApplicant[] {
  return [
    {
      id: `app-${tenantId}-101`,
      tenantId,
      jobOpeningId: `job-${tenantId}-1`,
      jobTitle: 'Lead Battery BMS Firmware Engineer',
      fullName: 'Vikramaditya Rathore',
      email: 'vikram.rathore.bms@gmail.com',
      phone: '+91 9826011223',
      stage: 'TECHNICAL_INTERVIEW',
      experienceYears: 6,
      currentCompany: 'Ather Energy',
      expectedSalary: '₹24,00,000',
      rating: 5,
      notes: 'Strong hands-on experience with STM32 and TI cell monitors. Cleared coding screening with distinction.',
      appliedDate: '2026-10-10'
    },
    {
      id: `app-${tenantId}-102`,
      tenantId,
      jobOpeningId: `job-${tenantId}-1`,
      jobTitle: 'Lead Battery BMS Firmware Engineer',
      fullName: 'Neha Deshmukh',
      email: 'neha.deshmukh.iot@outlook.com',
      phone: '+91 9713022334',
      stage: 'HR_ROUND',
      experienceYears: 5,
      currentCompany: 'Ola Electric',
      expectedSalary: '₹22,00,000',
      rating: 4,
      notes: 'Excellent cultural fit. Experience in functional safety ISO 26262.',
      appliedDate: '2026-10-11'
    },
    {
      id: `app-${tenantId}-103`,
      tenantId,
      jobOpeningId: `job-${tenantId}-2`,
      jobTitle: 'EV Fleet Operations Specialist',
      fullName: 'Gaurav Solanki',
      email: 'gaurav.solanki.fleet@gmail.com',
      phone: '+91 9425033445',
      stage: 'SCREENING',
      experienceYears: 3,
      currentCompany: 'BluSmart Mobility',
      expectedSalary: '₹8,00,000',
      rating: 4,
      notes: 'Managed 150+ fleet vehicles in central India. Strong operations management skills.',
      appliedDate: '2026-10-13'
    },
    {
      id: `app-${tenantId}-104`,
      tenantId,
      jobOpeningId: `job-${tenantId}-3`,
      jobTitle: 'Industrial Battery Quality & Testing Analyst',
      fullName: 'Pooja Vishwakarma',
      email: 'pooja.v.qc@gmail.com',
      phone: '+91 9893044556',
      stage: 'OFFERED',
      experienceYears: 2,
      currentCompany: 'Exide Industries',
      expectedSalary: '₹6,50,000',
      rating: 5,
      notes: 'Offer letter extended. Candidate expressed strong enthusiasm to join Goodwin Batteries.',
      appliedDate: '2026-10-09'
    }
  ];
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant =
      (await SupabaseStore.getTenantBySlug(tenantSlug)) ||
      (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    // Try fetching from persistent Supabase storage
    const supaRecruitment = await SupabaseStore.getRecruitment(tenant.id);

    let openings: JobOpening[];
    let applicants: JobApplicant[];

    if (supaRecruitment && (supaRecruitment.openings.length > 0 || supaRecruitment.applicants.length > 0)) {
      openings = supaRecruitment.openings;
      applicants = supaRecruitment.applicants;
      db.setJobOpeningsForTenant(tenant.id, openings);
      db.setJobApplicantsForTenant(tenant.id, applicants);
    } else {
      const inMemoryOpenings = db.getJobOpenings(tenant.id);
      const inMemoryApplicants = db.getJobApplicants(tenant.id);

      if (inMemoryOpenings.length > 0 || inMemoryApplicants.length > 0) {
        openings = inMemoryOpenings;
        applicants = inMemoryApplicants;
      } else {
        openings = getDefaultOpenings(tenant.id);
        applicants = getDefaultApplicants(tenant.id);
        db.setJobOpeningsForTenant(tenant.id, openings);
        db.setJobApplicantsForTenant(tenant.id, applicants);
      }
      await SupabaseStore.saveRecruitment(tenant.id, openings, applicants);
    }

    const payload = {
      openings,
      applicants,
      totalOpenings: openings.length,
      totalApplicants: applicants.length,
      stats: {
        activeOpenings: openings.filter((j) => j.status === 'OPEN').length,
        totalCandidates: applicants.length,
        inInterview: applicants.filter((a) => a.stage === 'TECHNICAL_INTERVIEW' || a.stage === 'HR_ROUND').length,
        offersExtended: applicants.filter((a) => a.stage === 'OFFERED').length,
        hired: applicants.filter((a) => a.stage === 'HIRED').length
      }
    };

    return NextResponse.json(
      { success: true, data: payload },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching recruitment data';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant =
      (await SupabaseStore.getTenantBySlug(tenantSlug)) ||
      (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { type } = body;
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    if (type === 'HIRE') {
      // 1-Click Keka ATS Onboarding: Hires candidate into employee table
      const { applicantId, monthlySalary } = body;
      if (!applicantId) {
        return NextResponse.json({ success: false, error: 'Applicant ID required to hire' }, { status: 400 });
      }

      const newEmp = db.hireApplicantAsEmployee(tenant.id, applicantId, Number(monthlySalary) || 35000);
      await SupabaseStore.saveEmployee(newEmp);

      const allOpenings = db.getJobOpenings(tenant.id);
      const allApplicants = db.getJobApplicants(tenant.id);
      await SupabaseStore.saveRecruitment(tenant.id, allOpenings, allApplicants);

      return NextResponse.json({
        success: true,
        data: { employee: newEmp },
        message: `Candidate successfully hired and onboarded as Employee ${newEmp.employeeCode}!`
      });
    }

    if (type === 'APPLICANT') {
      const {
        jobOpeningId,
        jobTitle,
        fullName,
        email,
        phone,
        experienceYears,
        currentCompany,
        expectedSalary,
        stage,
        rating,
        notes
      } = body;

      if (!fullName || !email) {
        return NextResponse.json({ success: false, error: 'Candidate name and email are required' }, { status: 400 });
      }

      const applicant = db.createApplicant(tenant.id, {
        jobOpeningId: jobOpeningId || 'job-general',
        jobTitle: jobTitle || 'General Candidate',
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone?.trim() || '',
        experienceYears: Number(experienceYears) || 0,
        currentCompany: currentCompany?.trim() || 'Independent',
        expectedSalary: expectedSalary?.trim() || 'Competitive',
        stage: stage || 'APPLIED',
        rating: Number(rating) || 5,
        notes: notes?.trim() || 'Applied via career portal'
      });

      const allOpenings = db.getJobOpenings(tenant.id);
      const allApplicants = db.getJobApplicants(tenant.id);
      await SupabaseStore.saveRecruitment(tenant.id, allOpenings, allApplicants);

      return NextResponse.json(
        { success: true, data: applicant, message: 'Candidate application added to pipeline' },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
      );
    } else {
      // Create Opening
      const {
        title,
        departmentId,
        departmentName,
        experienceLevel,
        employmentType,
        openingsCount,
        location,
        salaryRange,
        status,
        description
      } = body;

      if (!title) {
        return NextResponse.json({ success: false, error: 'Job title is required' }, { status: 400 });
      }

      const opening = db.createJobOpening(tenant.id, {
        title: title.trim(),
        departmentId: departmentId || 'dept-gen',
        departmentName: departmentName || 'General',
        experienceLevel: experienceLevel || '2-5 Years',
        employmentType: employmentType || 'FULL_TIME',
        openingsCount: Number(openingsCount) || 1,
        location: location || 'Indore, India',
        salaryRange: salaryRange || '₹6,00,000 - ₹12,00,000',
        status: status || 'OPEN',
        description: description || 'New requisition'
      });

      const allOpenings = db.getJobOpenings(tenant.id);
      const allApplicants = db.getJobApplicants(tenant.id);
      await SupabaseStore.saveRecruitment(tenant.id, allOpenings, allApplicants);

      return NextResponse.json(
        { success: true, data: opening, message: 'Job opening published successfully' },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error creating recruitment item';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant =
      (await SupabaseStore.getTenantBySlug(tenantSlug)) ||
      (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { type, applicantId, openingId, newStage } = body;
    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    if (type === 'OPENING' || openingId) {
      // Update Job Opening
      const id = openingId || body.id;
      if (!id) {
        return NextResponse.json({ success: false, error: 'Opening ID required' }, { status: 400 });
      }

      const updatedOpening = db.updateJobOpening(tenant.id, id, {
        ...(body.title ? { title: body.title.trim() } : {}),
        ...(body.departmentName ? { departmentName: body.departmentName.trim() } : {}),
        ...(body.experienceLevel ? { experienceLevel: body.experienceLevel.trim() } : {}),
        ...(body.employmentType ? { employmentType: body.employmentType } : {}),
        ...(body.openingsCount ? { openingsCount: Number(body.openingsCount) } : {}),
        ...(body.location ? { location: body.location.trim() } : {}),
        ...(body.salaryRange ? { salaryRange: body.salaryRange.trim() } : {}),
        ...(body.status ? { status: body.status } : {}),
        ...(body.description ? { description: body.description.trim() } : {})
      });

      const allOpenings = db.getJobOpenings(tenant.id);
      const allApplicants = db.getJobApplicants(tenant.id);
      await SupabaseStore.saveRecruitment(tenant.id, allOpenings, allApplicants);

      return NextResponse.json({
        success: true,
        data: updatedOpening,
        message: 'Job opening updated successfully'
      });
    }

    if (newStage && applicantId) {
      // Advance or move candidate stage
      const updated = db.updateApplicantStage(tenant.id, applicantId, newStage);
      const allOpenings = db.getJobOpenings(tenant.id);
      const allApplicants = db.getJobApplicants(tenant.id);
      await SupabaseStore.saveRecruitment(tenant.id, allOpenings, allApplicants);

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Candidate moved to ${newStage}`
      });
    }

    if (applicantId) {
      // Update candidate details (rating, notes, salary, etc.)
      const updated = db.updateApplicant(tenant.id, applicantId, {
        ...(body.fullName ? { fullName: body.fullName.trim() } : {}),
        ...(body.email ? { email: body.email.trim() } : {}),
        ...(body.phone ? { phone: body.phone.trim() } : {}),
        ...(body.currentCompany ? { currentCompany: body.currentCompany.trim() } : {}),
        ...(body.expectedSalary ? { expectedSalary: body.expectedSalary.trim() } : {}),
        ...(body.experienceYears !== undefined ? { experienceYears: Number(body.experienceYears) } : {}),
        ...(body.rating !== undefined ? { rating: Number(body.rating) } : {}),
        ...(body.notes ? { notes: body.notes.trim() } : {}),
        ...(body.stage ? { stage: body.stage } : {})
      });

      const allOpenings = db.getJobOpenings(tenant.id);
      const allApplicants = db.getJobApplicants(tenant.id);
      await SupabaseStore.saveRecruitment(tenant.id, allOpenings, allApplicants);

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Candidate updated successfully'
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid update payload' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating recruitment item';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant =
      (await SupabaseStore.getTenantBySlug(tenantSlug)) ||
      (await db.getResolvedTenant(tenantSlug, true));
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    db.invalidateCache(tenant.id);
    db.invalidateCache(tenantSlug);

    const { searchParams } = new URL(req.url);
    const applicantId = searchParams.get('applicantId');
    const openingId = searchParams.get('openingId');

    let deletedCount = 0;
    let message = '';

    if (applicantId) {
      const ok = db.deleteApplicant(tenant.id, applicantId);
      if (ok) deletedCount++;
      message = 'Candidate removed from pipeline';
    } else if (openingId) {
      const ok = db.deleteJobOpening(tenant.id, openingId);
      if (ok) deletedCount++;
      message = 'Job requisition deleted';
    } else {
      const body = await req.json().catch(() => ({}));
      if (body.applicantId) {
        const ok = db.deleteApplicant(tenant.id, body.applicantId);
        if (ok) deletedCount++;
        message = 'Candidate removed from pipeline';
      } else if (body.openingId) {
        const ok = db.deleteJobOpening(tenant.id, body.openingId);
        if (ok) deletedCount++;
        message = 'Job requisition deleted';
      }
    }

    if (deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Item not found or ID not provided' }, { status: 400 });
    }

    const allOpenings = db.getJobOpenings(tenant.id);
    const allApplicants = db.getJobApplicants(tenant.id);
    await SupabaseStore.saveRecruitment(tenant.id, allOpenings, allApplicants);

    return NextResponse.json({
      success: true,
      message
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting recruitment item';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
