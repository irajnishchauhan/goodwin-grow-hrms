import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';

export async function GET(
  _req: Request,
  context: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant = await db.getResolvedTenant(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant workspace not found' }, { status: 404 });
    }

    const cacheKey = `recruitment_${tenant.id}`;
    const cached = db.getCached<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const openings = db.getJobOpenings(tenant.id);
    const applicants = db.getJobApplicants(tenant.id);

    const payload = {
      openings,
      applicants,
      totalOpenings: openings.length,
      totalApplicants: applicants.length
    };

    db.setCached(cacheKey, payload, 30000);

    return NextResponse.json({
      success: true,
      data: payload
    });
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
    const tenant = await db.getResolvedTenant(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { type } = body;
    db.invalidateCache(tenant.id);

    if (type === 'APPLICANT') {
      const { jobOpeningId, jobTitle, fullName, email, phone, experienceYears, currentCompany, expectedSalary, stage } = body;
      const applicant = db.createApplicant(tenant.id, {
        jobOpeningId,
        jobTitle,
        fullName,
        email,
        phone,
        experienceYears: Number(experienceYears) || 0,
        currentCompany,
        expectedSalary,
        stage: stage || 'APPLIED'
      });
      return NextResponse.json({ success: true, data: applicant, message: 'Candidate application recorded' });
    } else {
      // Create Opening
      const { title, departmentId, departmentName, experienceLevel, employmentType, openingsCount, location, salaryRange, description } = body;
      const opening = db.createJobOpening(tenant.id, {
        title,
        departmentId,
        departmentName: departmentName || 'Engineering',
        experienceLevel: experienceLevel || '3-5 Years',
        employmentType: employmentType || 'FULL_TIME',
        openingsCount: Number(openingsCount) || 1,
        location: location || 'Bangalore, India',
        salaryRange: salaryRange || 'Competitive',
        status: 'OPEN',
        description: description || 'New requisition'
      });
      return NextResponse.json({ success: true, data: opening, message: 'Job opening published' });
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
    const tenant = await db.getResolvedTenant(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    const body = await req.json();
    const { applicantId, newStage } = body;

    if (!applicantId || !newStage) {
      return NextResponse.json({ success: false, error: 'Applicant ID and new stage required' }, { status: 400 });
    }

    const updated = db.updateApplicantStage(tenant.id, applicantId, newStage);
    return NextResponse.json({
      success: true,
      data: updated,
      message: `Candidate moved to ${newStage}`
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating applicant stage';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
