import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    const invitation = db.getInvitationByToken(token);
    if (!invitation) {
      return NextResponse.json({ success: false, error: 'Invalid or expired invitation token.' }, { status: 404 });
    }

    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json({
        success: false,
        error: 'This account invitation has already been activated. Please login directly.'
      }, { status: 400 });
    }

    if (invitation.status === 'REVOKED') {
      return NextResponse.json({
        success: false,
        error: 'This invitation has been revoked by the company administrator.'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        tenantName: invitation.tenantName,
        employeeName: invitation.employeeName,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error validating invitation';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password, fullName } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const { user, tenantSlug } = db.activateAccount(token, password, fullName);

    return NextResponse.json({
      success: true,
      message: 'Account successfully activated! Welcome to Goodwin Grow HRMS.',
      data: {
        user,
        redirectUrl: `/app/${tenantSlug}/my-dashboard`
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Activation failed';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
