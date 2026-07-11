import { NextResponse } from 'next/server';

// Required for Next.js static export (firebase hosting)
export const dynamic = 'force-static';

/**
 * GET /api/admin/export
 * Returns a CSV export of all platform data.
 * This is a lightweight client-callable endpoint that generates the CSV structure.
 * Actual data is already fetched client-side in the admin dashboard.
 * The real export happens client-side in the admin dashboard for security & simplicity.
 * This route just confirms the format spec.
 */
export async function GET() {
  const sampleHeaders = [
    'Name', 'Email', 'Mobile', 'Role', 'District', 'Address',
    'Company Name', 'Website', 'Company Category', 'Company Phone',
    'Plan', 'Plan Status', 'Plan Start', 'Plan Expiry', 'Days Left',
    'Jobs Count', 'Services Count',
    'Account Status', 'Verified', 'Joined Date',
  ];

  return NextResponse.json({
    message: 'Use the Export button in the admin dashboard for full data download.',
    columns: sampleHeaders,
    note: 'Client-side export is used to avoid Firebase Admin SDK dependency.',
  });
}
