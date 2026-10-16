import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';

export async function GET() {
  const report = db.verifyTenantIsolation();
  return NextResponse.json({
    success: true,
    data: report
  });
}

export async function POST() {
  const report = db.verifyTenantIsolation();
  return NextResponse.json({
    success: true,
    data: report
  });
}
