import { NextResponse } from 'next/server';
import { getDataScope } from '@/lib/dataScope';
import { resetDemoDataset } from '@/lib/demoSeed';

export async function GET(req: Request) {
  const userRole = req.headers.get('x-user-role');
  if (userRole !== 'ADMIN' && userRole !== 'Admin') {
    return NextResponse.json(
      { success: false, error: '403 Forbidden: Only administrators can seed the database.' },
      { status: 403 }
    );
  }

  const scope = await getDataScope();
  if (!scope.isDemo || !scope.email) {
    return NextResponse.json(
      { success: false, error: '403 Forbidden: Sample data can only be loaded from a demo account.' },
      { status: 403 }
    );
  }

  try {
    await resetDemoDataset();
    return NextResponse.json({
      success: true,
      message: 'Demo dataset reset successfully. Live data was not modified.',
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to seed database' },
      { status: 500 }
    );
  }
}
