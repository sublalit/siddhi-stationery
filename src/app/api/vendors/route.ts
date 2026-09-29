import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getScopeWhere } from '@/lib/dataScope';

export async function GET() {
  try {
    const scope = await getScopeWhere();
    const vendors = await prisma.vendor.findMany({
      where: scope,
      orderBy: { name: 'asc' },
    });

    const mappedVendors = vendors.map((v) => ({
      ...v,
      _id: v.id,
    }));

    return NextResponse.json({ success: true, vendors: mappedVendors });
  } catch (error: any) {
    console.error('Vendor GET error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userRole = req.headers.get('x-user-role');
    if (userRole === 'STAFF' || userRole === 'Staff') {
      return NextResponse.json(
        { success: false, error: '403 Forbidden: Staff members cannot create vendors' },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Vendor name is required' }, { status: 400 });
    }

    const scope = await getScopeWhere();
    const newVendor = await prisma.vendor.create({
      data: {
        name: body.name.trim(),
        contactPerson: body.contactPerson || '',
        email: body.email || '',
        phone: body.phone || '',
        address: body.address || '',
        status: body.status || 'Active',
        isDemo: scope.isDemo,
      },
    });

    return NextResponse.json({
      success: true,
      vendor: { ...newVendor, _id: newVendor.id },
    });
  } catch (error: any) {
    console.error('Vendor POST error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
}
